import { Contract, xdr, nativeToScVal, scValToNative, Keypair, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import { server, STACK_ADMIN_SECRET } from './smartContract.handler.stellar.js';
import { compressData, decompressData } from '../../utils/compression.utils.js';
import logger from '../../util/logger.js';
import { logCompression, logDecompression } from '../../util/compressionLogger.js';
// This will be set after deployment
const VAULT_CONTRACT_ID = process.env.VAULT_CONTRACT_ID || '';
// Known invalid/placeholder ID to check against
const INVALID_CONTRACT_ID = 'CC76VNFKSTN5KOR7LHTCDI4QW44V5F5B5N5E5P5S5W5S5X5C5H5U5P5U';
export class SeireiteiVaultService {
    server = server;
    adminKeypair = Keypair.fromSecret(STACK_ADMIN_SECRET);
    isContractValid() {
        if (!VAULT_CONTRACT_ID)
            return false;
        if (VAULT_CONTRACT_ID === INVALID_CONTRACT_ID)
            return false;
        // Basic StrKey validation (approximate)
        if (VAULT_CONTRACT_ID.length !== 56 || !VAULT_CONTRACT_ID.startsWith('C'))
            return false;
        return true;
    }
    /**
     * Stores any data object on-chain in a specific collection.
     */
    async put(collection, id, data, skipIndex = false) {
        if (!this.isContractValid()) {
            logger.warn(`[VAULT] Skipping on-chain storage: Invalid or missing Contract ID (${VAULT_CONTRACT_ID})`);
            return; // Fail silently/gracefully during development to allow DB updates to proceed
        }
        const compressResult = await compressData(data);
        const compressed = compressResult.buffer;
        const ratio = compressResult.originalSize / compressResult.compressedSize;
        const savedBytes = compressResult.originalSize - compressResult.compressedSize;
        const savedPercent = ((savedBytes / compressResult.originalSize) * 100).toFixed(1);
        logger.info(`[VAULT] Compressing ${collection}:${id}. Original: ${compressResult.originalSize}B → Compressed: ${compressResult.compressedSize}B (${ratio.toFixed(1)}x)`);
        logCompression({
            collection,
            id,
            originalBytes: compressResult.originalSize,
            compressedBytes: compressResult.compressedSize,
            ratio: `${ratio.toFixed(1)}x`,
            savedBytes,
            savedPercent: `${savedPercent}%`,
        });
        const contract = new Contract(VAULT_CONTRACT_ID);
        let retries = 3;
        while (retries > 0) {
            try {
                // Refresh account sequence on every retry
                const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());
                // 1. Build Transaction
                const tx = new TransactionBuilder(sourceAccount, {
                    fee: "100",
                    networkPassphrase: Networks.TESTNET
                })
                    .addOperation(contract.call('put', nativeToScVal(collection, { type: 'string' }), nativeToScVal(id, { type: 'string' }), nativeToScVal(compressed)))
                    .setTimeout(30)
                    .build();
                // 2. Prepare, Sign and Send
                const preparedTx = await this.server.prepareTransaction(tx);
                preparedTx.sign(this.adminKeypair);
                const result = await this.server.sendTransaction(preparedTx);
                if (result.status === 'ERROR') {
                    // Check if it's a Bad Sequence error
                    const errorString = JSON.stringify(result.errorResult);
                    if (errorString.includes('txBadSeq')) {
                        logger.warn(`[VAULT] txBadSeq encountered. Retrying... (${retries} left)`);
                        retries--;
                        await new Promise(res => setTimeout(res, 2000)); // Wait 2s
                        continue;
                    }
                    throw new Error(`Vault storage transaction failed: ${errorString}`);
                }
                logger.info(`[VAULT] Transaction sent: ${result.hash} (status: ${result.status})`);
                // Wait for transaction confirmation before proceeding
                if (result.status === 'PENDING') {
                    let txResponse = await this.server.getTransaction(result.hash);
                    let polls = 0;
                    while (txResponse.status === 'NOT_FOUND' && polls < 15) {
                        await new Promise(res => setTimeout(res, 1000));
                        txResponse = await this.server.getTransaction(result.hash);
                        polls++;
                    }
                    if (txResponse.status === 'SUCCESS') {
                        logger.info(`[VAULT] Transaction confirmed: ${result.hash}`);
                    }
                    else {
                        logger.warn(`[VAULT] Transaction status after polling: ${txResponse.status}`);
                    }
                }
                // 3. Update Index (Secondary on-chain record for fast retrieval)
                if (!skipIndex && collection !== 'System') {
                    await this.updateIndex(collection, id);
                }
                return; // Success, exit function
            }
            catch (error) {
                // If the error object itself implies a sequence issue (rare with sdk, usually in result)
                if (error.message && error.message.includes('txBadSeq')) {
                    logger.warn(`[VAULT] txBadSeq exception. Retrying... (${retries} left)`);
                    retries--;
                    await new Promise(res => setTimeout(res, 2000));
                    continue;
                }
                logger.error(`[VAULT] Failed to put data: ${error}`);
                throw error;
            }
        }
        throw new Error(`[VAULT] Failed to put data after retries (txBadSeq loop)`);
    }
    /**
     * Stores a record with a secondary index (e.g., Email lookup).
     */
    async putWithIndex(collection, id, data, indexField, indexValue) {
        await this.put(collection, id, data);
        await this.put(`${collection}_${indexField}_Index`, indexValue, id);
    }
    /**
     * Retrieves a record ID using a secondary index.
     */
    async getByIndex(collection, indexField, indexValue) {
        const id = await this.get(`${collection}_${indexField}_Index`, indexValue);
        if (!id)
            return null;
        return await this.get(collection, id);
    }
    /**
     * Updates the systemic collection index on-chain.
     */
    async updateIndex(collection, id) {
        const indexKey = `Index_${collection}`;
        const existingIndex = await this.get('System', indexKey) || [];
        if (!existingIndex.includes(id)) {
            existingIndex.push(id);
            // Use skipIndex to prevent infinite loop
            await this.put('System', indexKey, existingIndex, true);
        }
    }
    /**
     * Retrieves all records for a collection.
     */
    async getAll(collection) {
        const indexKey = `Index_${collection}`;
        const ids = (await this.get('System', indexKey)) || [];
        const results = await Promise.all(ids.map(id => this.get(collection, id)));
        return results.filter(r => r !== null);
    }
    /**
     * Retrieves and decompresses data from the vault.
     */
    async get(collection, id) {
        if (!this.isContractValid()) {
            // Suppress warning on every get to avoid log spam, but return null
            return null;
        }
        const contract = new Contract(VAULT_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());
        // Use simulateTransaction for retrieval
        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call('get', nativeToScVal(collection, { type: 'string' }), nativeToScVal(id, { type: 'string' })))
            .setTimeout(30)
            .build();
        const simulation = await this.server.simulateTransaction(tx);
        // Debug Simulation
        // logger.debug(`[VAULT] Simulation result for ${collection}:${id}:`, JSON.stringify(simulation));
        // Extract result from simulation
        const simAny = simulation;
        if (simAny.error) {
            throw new Error(`[VAULT] Simulation failed for ${collection}:${id}: ${JSON.stringify(simAny.error)}`);
        }
        let scVal;
        // @ts-ignore
        const resultXdr = simulation.results?.[0]?.xdr;
        if (resultXdr) {
            scVal = xdr.ScVal.fromXDR(resultXdr, 'base64');
        }
        else if (simulation.result?.retval) {
            scVal = simulation.result.retval;
        }
        else {
            // Return null is expected for "not found", but for debugging we want to know IF it was looked up.
            // throw new Error(`[VAULT] No result XDR for ${collection}:${id} (Data not found?)`);
            return null;
        }
        const native = scValToNative(scVal);
        if (!native || !Buffer.isBuffer(native) || native.length === 0) {
            // console.warn(`[VAULT] Retrieved value for ${collection}:${id} is not a valid/empty Buffer:`, native);
            return null;
        }
        try {
            const decompressResult = await decompressData(native);
            const decompRatio = decompressResult.decompressedSize / decompressResult.compressedSize;
            logDecompression({
                collection,
                id,
                compressedBytes: decompressResult.compressedSize,
                decompressedBytes: decompressResult.decompressedSize,
                ratio: `${decompRatio.toFixed(1)}x`,
            });
            return decompressResult.data;
        }
        catch (e) {
            logger.error(`[VAULT] Decompression failed for ${collection}:${id}:`, e);
            throw new Error(`[VAULT] Decompression failed for ${collection}:${id}: ${e}`);
        }
    }
}
export const seireiteiVault = new SeireiteiVaultService();
//# sourceMappingURL=seireiteiVault.service.js.map