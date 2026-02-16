import * as StellarSdk from '@stellar/stellar-sdk';
import dotenv from 'dotenv';
import logger from '../../util/logger.js';
dotenv.config();
// Initialize server with Soroban testnet
export const server = new StellarSdk.rpc.Server(process.env.SOROBAN_RPC_URL);
export const STACK_ADMIN_SECRET = process.env.STACK_ADMIN_SECRET || "";
export async function saveContractWithWallet(userData) {
    try {
        const contractId = userData.contractId || process.env.CONTRACT_ID;
        if (!contractId) {
            throw new Error('CONTRACT_ID is not defined in environment variables');
        }
        const contract = new StellarSdk.Contract(contractId);
        const sourceKeypair = StellarSdk.Keypair.fromSecret(userData.privateKey);
        const accountId = sourceKeypair.publicKey();
        const account = await server.getAccount(accountId);
        const fee = StellarSdk.BASE_FEE;
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .setTimeout(30)
            .addOperation(contract.call('store_data', StellarSdk.nativeToScVal(accountId, { type: 'address' }), StellarSdk.nativeToScVal(userData.amount, { type: 'i128' }), StellarSdk.nativeToScVal(userData.cid, { type: 'string' }), StellarSdk.nativeToScVal(userData.prevTxn || 'no txn', { type: 'string' }), userData.metadata
            ? StellarSdk.nativeToScVal(userData.metadata, { type: 'string' })
            : StellarSdk.xdr.ScVal.scvVoid()))
            .build();
        const preparedTx = await server.prepareTransaction(transaction);
        preparedTx.sign(sourceKeypair);
        const result = await server.sendTransaction(preparedTx);
        logger.info(`[SC] Store Data tx: hash=${result.hash} status=${result.status}`);
        // Wait for transaction confirmation
        if (result.status === 'PENDING') {
            let txResponse = await server.getTransaction(result.hash);
            while (txResponse.status === 'NOT_FOUND') {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                txResponse = await server.getTransaction(result.hash);
            }
            logger.info(`[SC] Store Data final status: ${txResponse.status}`);
            return txResponse;
        }
        return result;
    }
    catch (error) {
        logger.error(`[SC] Error storing data: ${error}`);
        throw error;
    }
}
export async function getLatestData(privateKey, contractId) {
    try {
        const activeContractId = contractId || process.env.CONTRACT_ID;
        if (!activeContractId) {
            throw new Error('CONTRACT_ID is not defined in environment variables');
        }
        const contract = new StellarSdk.Contract(activeContractId);
        const sourceKeypair = StellarSdk.Keypair.fromSecret(privateKey);
        const accountId = sourceKeypair.publicKey();
        const account = await server.getAccount(accountId);
        const fee = StellarSdk.BASE_FEE;
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .setTimeout(30)
            .addOperation(contract.call('get_latest', StellarSdk.nativeToScVal(accountId, { type: 'address' })))
            .build();
        const preparedTx = await server.prepareTransaction(transaction);
        const simulation = await server.simulateTransaction(preparedTx);
        // Extract ScVal — handle both results[0].xdr and result.retval patterns
        let returnValue = null;
        const resultXdr = simulation.results?.[0]?.xdr;
        if (resultXdr) {
            returnValue = StellarSdk.xdr.ScVal.fromXDR(resultXdr, 'base64');
        }
        else if (simulation.result?.retval) {
            returnValue = simulation.result.retval;
        }
        if (!returnValue) {
            logger.info('[SC] getLatestData: No data found in simulation');
            return null;
        }
        logger.info('[SC] getLatestData: Got return value');
        // Parse the XDR response if needed
        if (returnValue.switch() === StellarSdk.xdr.ScValType.scvMap()) {
            const data = {};
            const map = returnValue.map();
            if (map) {
                for (const entry of map) {
                    const key = entry.key().str()?.toString() || entry.key().sym()?.toString() || 'unknown';
                    const val = entry.val();
                    if (val.switch) {
                        switch (val.switch().name) {
                            case 'scvBool':
                                data[key] = val.value();
                                break;
                            case 'scvU32':
                            case 'scvI32':
                            case 'scvU64':
                            case 'scvI64':
                            case 'scvU128':
                            case 'scvI128':
                                const value = val.value();
                                data[key] = value !== null && value !== undefined ? value.toString() : '';
                                break;
                            case 'scvString':
                                data[key] = val.str()?.toString() || '';
                                break;
                            case 'scvSymbol':
                                data[key] = val.sym()?.toString() || '';
                                break;
                            default:
                                data[key] = 'Unsupported type: ' + val.switch().name;
                        }
                    }
                }
                return data;
            }
        }
        return { value: returnValue };
    }
    catch (error) {
        logger.error(`[SC] Error fetching data: ${error}`);
        throw error;
    }
}
export async function registerMission(captainKey, missionId, title, dangerLevel, deadline) {
    try {
        const contractId = process.env.MISSION_REGISTRY_CONTRACT_ID;
        if (!contractId) {
            throw new Error('MISSION_REGISTRY_CONTRACT_ID is not defined');
        }
        // Default deadline: 30 days from now (in seconds)
        const deadlineValue = deadline || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
        const contract = new StellarSdk.Contract(contractId);
        const sourceKeypair = StellarSdk.Keypair.fromSecret(captainKey);
        const accountId = sourceKeypair.publicKey();
        const account = await server.getAccount(accountId);
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .setTimeout(30)
            .addOperation(contract.call('register_mission', StellarSdk.nativeToScVal(accountId, { type: 'address' }), StellarSdk.nativeToScVal(missionId, { type: 'string' }), StellarSdk.nativeToScVal(title, { type: 'string' }), StellarSdk.nativeToScVal(dangerLevel, { type: 'u32' }), StellarSdk.nativeToScVal(BigInt(deadlineValue), { type: 'u64' })))
            .build();
        const preparedTx = await server.prepareTransaction(transaction);
        preparedTx.sign(sourceKeypair);
        const result = await server.sendTransaction(preparedTx);
        logger.info(`[SC] registerMission tx: hash=${result.hash} status=${result.status}`);
        return result;
    }
    catch (error) {
        logger.error(`[SC] Error registering mission: ${error}`);
        throw error;
    }
}
export async function sealMissionProof(validatorKey, reaperAddress, missionId, proofCid) {
    try {
        const contractId = process.env.MISSION_REGISTRY_CONTRACT_ID;
        if (!contractId) {
            throw new Error('MISSION_REGISTRY_CONTRACT_ID is not defined');
        }
        const contract = new StellarSdk.Contract(contractId);
        const sourceKeypair = StellarSdk.Keypair.fromSecret(validatorKey);
        const accountId = sourceKeypair.publicKey();
        const account = await server.getAccount(accountId);
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .setTimeout(30)
            .addOperation(contract.call('seal_proof', StellarSdk.nativeToScVal(accountId, { type: 'address' }), StellarSdk.nativeToScVal(reaperAddress, { type: 'address' }), StellarSdk.nativeToScVal(missionId, { type: 'string' }), StellarSdk.nativeToScVal(proofCid, { type: 'string' })))
            .build();
        const preparedTx = await server.prepareTransaction(transaction);
        preparedTx.sign(sourceKeypair);
        const result = await server.sendTransaction(preparedTx);
        logger.info(`[SC] sealMissionProof tx: hash=${result.hash} status=${result.status}`);
        return result;
    }
    catch (error) {
        logger.error(`[SC] Error sealing mission proof: ${error}`);
        throw error;
    }
}
//# sourceMappingURL=smartContract.handler.stellar.js.map