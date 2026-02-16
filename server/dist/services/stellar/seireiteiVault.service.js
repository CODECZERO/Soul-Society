import { Contract, xdr, nativeToScVal, scValToNative, Keypair, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import { server, STACK_ADMIN_SECRET } from './smartContract.handler.stellar.js';
import { compressData, decompressData } from '../../utils/compression.utils.js';
// This will be set after deployment
const VAULT_CONTRACT_ID = process.env.VAULT_CONTRACT_ID || '';
export class SeireiteiVaultService {
    server = server;
    adminKeypair = Keypair.fromSecret(STACK_ADMIN_SECRET);
    /**
     * Stores any data object on-chain in a specific collection.
     */
    async put(collection, id, data, skipIndex = false) {
        if (!VAULT_CONTRACT_ID)
            throw new Error('VAULT_CONTRACT_ID not configured');
        const compressed = await compressData(data);
        console.log(`[VAULT] Compressing ${collection}:${id}. Size: ${compressed.length} bytes`);
        const contract = new Contract(VAULT_CONTRACT_ID);
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
        try {
            const preparedTx = await this.server.prepareTransaction(tx);
            preparedTx.sign(this.adminKeypair);
            const result = await this.server.sendTransaction(preparedTx);
            if (result.status === 'ERROR') {
                throw new Error(`Vault storage transaction failed: ${JSON.stringify(result.errorResult)}`);
            }
            console.log(`[VAULT] Transaction successful: ${result.hash}`);
            // 3. Update Index (Secondary on-chain record for fast retrieval)
            if (!skipIndex && collection !== 'System') {
                await this.updateIndex(collection, id);
            }
        }
        catch (error) {
            console.error(`[VAULT] Failed to put data: ${error}`);
            throw error;
        }
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
        if (!VAULT_CONTRACT_ID)
            return null;
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
        // Extract result from simulation
        const resultXdr = simulation.results?.[0]?.xdr;
        if (!resultXdr)
            return null;
        const scVal = xdr.ScVal.fromXDR(resultXdr, 'base64');
        const native = scValToNative(scVal);
        if (!native)
            return null;
        return await decompressData(native);
    }
}
export const seireiteiVault = new SeireiteiVaultService();
//# sourceMappingURL=seireiteiVault.service.js.map