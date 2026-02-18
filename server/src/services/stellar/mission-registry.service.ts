import {
    Contract,
    Address,
    nativeToScVal,
    scValToNative,
    Keypair,
    TransactionBuilder,
    Networks
} from '@stellar/stellar-sdk';
import { server, STACK_ADMIN_SECRET } from './smartContract.handler.stellar.js';
import logger from '../../util/logger.js';

const MISSION_REGISTRY_CONTRACT_ID = process.env.MISSION_REGISTRY_CONTRACT_ID || '';

export class MissionRegistryService {
    private server = server;
    private adminKeypair = Keypair.fromSecret(STACK_ADMIN_SECRET);

    /**
     * Initialize the Mission Registry contract.
     */
    async initialize(adminKey: string) {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const adminKeypair = Keypair.fromSecret(adminKey);
        const sourceAccount = await this.server.getAccount(adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'initialize',
                new Address(adminKeypair.publicKey()).toScVal()
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(adminKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[MissionRegistry] Initialized: ${result.hash}`);
        return result;
    }

    /**
     * Set the badge contract address.
     */
    async setBadgeContract(adminKey: string, badgeContractAddress: string) {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const adminKeypair = Keypair.fromSecret(adminKey);
        const sourceAccount = await this.server.getAccount(adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'set_badge_contract',
                new Address(adminKeypair.publicKey()).toScVal(),
                new Address(badgeContractAddress).toScVal()
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(adminKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[MissionRegistry] Badge contract set: ${result.hash}`);
        return result;
    }

    /**
     * Set the token contract address.
     */
    async setTokenContract(adminKey: string, tokenContractAddress: string) {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const adminKeypair = Keypair.fromSecret(adminKey);
        const sourceAccount = await this.server.getAccount(adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'set_token_contract',
                new Address(adminKeypair.publicKey()).toScVal(),
                new Address(tokenContractAddress).toScVal()
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(adminKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[MissionRegistry] Token contract set: ${result.hash}`);
        return result;
    }

    /**
     * Register a new mission.
     */
    async registerMission(
        captainKey: string,
        missionId: string,
        title: string,
        dangerLevel: number,
        deadline?: number
    ) {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const deadlineValue = deadline || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const captainKeypair = Keypair.fromSecret(captainKey);
        const sourceAccount = await this.server.getAccount(captainKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'register_mission',
                new Address(captainKeypair.publicKey()).toScVal(),
                nativeToScVal(missionId, { type: 'string' }),
                nativeToScVal(title, { type: 'string' }),
                nativeToScVal(dangerLevel, { type: 'u32' }),
                nativeToScVal(BigInt(deadlineValue), { type: 'u64' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(captainKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[MissionRegistry] Mission registered: ${missionId} - ${result.hash}`);
        return result;
    }

    /**
     * Advance mission status: Active → InProgress → Review
     */
    async advanceStatus(captainKey: string, missionId: string) {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const captainKeypair = Keypair.fromSecret(captainKey);
        const sourceAccount = await this.server.getAccount(captainKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'advance_status',
                new Address(captainKeypair.publicKey()).toScVal(),
                nativeToScVal(missionId, { type: 'string' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(captainKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[MissionRegistry] Status advanced for mission: ${missionId} - ${result.hash}`);
        return result;
    }

    /**
     * Seal a mission with proof.
     */
    async sealProof(
        validatorKey: string,
        reaperAddress: string,
        missionId: string,
        proofCid: string
    ) {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const validatorKeypair = Keypair.fromSecret(validatorKey);
        const sourceAccount = await this.server.getAccount(validatorKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'seal_proof',
                new Address(validatorKeypair.publicKey()).toScVal(),
                new Address(reaperAddress).toScVal(),
                nativeToScVal(missionId, { type: 'string' }),
                nativeToScVal(proofCid, { type: 'string' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(validatorKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[MissionRegistry] Proof sealed for mission: ${missionId} - ${result.hash}`);
        return result;
    }

    /**
     * Mark a mission as failed.
     */
    async failMission(callerKey: string, missionId: string) {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const callerKeypair = Keypair.fromSecret(callerKey);
        const sourceAccount = await this.server.getAccount(callerKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'fail_mission',
                new Address(callerKeypair.publicKey()).toScVal(),
                nativeToScVal(missionId, { type: 'string' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(callerKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[MissionRegistry] Mission failed: ${missionId} - ${result.hash}`);
        return result;
    }

    /**
     * Query mission details.
     */
    async getMission(missionId: string) {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'get_mission',
                nativeToScVal(missionId, { type: 'string' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        const simulation = await this.server.simulateTransaction(preparedTx);

        const simAny = simulation as any;
        if (simAny.result?.retval) {
            return scValToNative(simAny.result.retval);
        }
        return null;
    }

    /**
     * Get mission proof.
     */
    async getProof(missionId: string) {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'get_proof',
                nativeToScVal(missionId, { type: 'string' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        const simulation = await this.server.simulateTransaction(preparedTx);

        const simAny = simulation as any;
        if (simAny.result?.retval) {
            return scValToNative(simAny.result.retval);
        }
        return null;
    }

    /**
     * Get mission counter statistics.
     */
    async getCounter() {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call('get_counter'))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        const simulation = await this.server.simulateTransaction(preparedTx);

        const simAny = simulation as any;
        if (simAny.result?.retval) {
            return scValToNative(simAny.result.retval);
        }
        return { total: 0, active: 0, sealed: 0, failed: 0 };
    }

    /**
     * Get missions by captain.
     */
    async getMissionsByCaptain(captainAddress: string) {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'get_missions_by_captain',
                new Address(captainAddress).toScVal()
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        const simulation = await this.server.simulateTransaction(preparedTx);

        const simAny = simulation as any;
        if (simAny.result?.retval) {
            return scValToNative(simAny.result.retval);
        }
        return [];
    }

    /**
     * Get validators who sealed a mission.
     */
    async getValidators(missionId: string) {
        if (!MISSION_REGISTRY_CONTRACT_ID) throw new Error('MISSION_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(MISSION_REGISTRY_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'get_validators',
                nativeToScVal(missionId, { type: 'string' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        const simulation = await this.server.simulateTransaction(preparedTx);

        const simAny = simulation as any;
        if (simAny.result?.retval) {
            return scValToNative(simAny.result.retval);
        }
        return [];
    }
}

export const missionRegistryService = new MissionRegistryService();
