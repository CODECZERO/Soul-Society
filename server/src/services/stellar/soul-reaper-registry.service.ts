import {
    Contract,
    Address,
    nativeToScVal,
    scValToNative,
    Keypair,
    TransactionBuilder,
    Networks,
    xdr
} from '@stellar/stellar-sdk';
import { server, STACK_ADMIN_SECRET } from './smartContract.handler.stellar.js';
import logger from '../../util/logger.js';

const SOUL_REAPER_REGISTRY_CONTRACT_ID = process.env.SOUL_REAPER_REGISTRY_CONTRACT_ID || '';

export class SoulReaperRegistryService {
    private server = server;
    private adminKeypair = Keypair.fromSecret(STACK_ADMIN_SECRET);

    /**
     * Initialize the Soul Reaper Registry contract.
     */
    async initialize(adminKey: string) {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
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

        logger.info(`[SoulReaperRegistry] Initialized: ${result.hash}`);
        return result;
    }

    /**
     * Register a new reaper.
     */
    async register(
        ownerKey: string,
        name: string,
        division: number,
        rank: string,
        powerLevel: number
    ) {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
        const ownerKeypair = Keypair.fromSecret(ownerKey);
        const sourceAccount = await this.server.getAccount(ownerKeypair.publicKey());

        // Convert rank string to Symbol
        const rankSymbol = xdr.ScVal.scvSymbol(rank);

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'register',
                new Address(ownerKeypair.publicKey()).toScVal(),
                nativeToScVal(name, { type: 'string' }),
                nativeToScVal(division, { type: 'u32' }),
                rankSymbol,
                nativeToScVal(powerLevel, { type: 'u32' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(ownerKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[SoulReaperRegistry] Reaper registered: ${name} - ${result.hash}`);
        return result;
    }

    /**
     * Update power level.
     */
    async updatePower(ownerKey: string, newPower: number) {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
        const ownerKeypair = Keypair.fromSecret(ownerKey);
        const sourceAccount = await this.server.getAccount(ownerKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'update_power',
                new Address(ownerKeypair.publicKey()).toScVal(),
                nativeToScVal(newPower, { type: 'u32' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(ownerKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[SoulReaperRegistry] Power updated: ${newPower} - ${result.hash}`);
        return result;
    }

    /**
     * Promote a reaper.
     */
    async promote(adminKey: string, ownerAddress: string, newRank: string) {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
        const adminKeypair = Keypair.fromSecret(adminKey);
        const sourceAccount = await this.server.getAccount(adminKeypair.publicKey());

        const rankSymbol = xdr.ScVal.scvSymbol(newRank);

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'promote',
                new Address(adminKeypair.publicKey()).toScVal(),
                new Address(ownerAddress).toScVal(),
                rankSymbol
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(adminKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[SoulReaperRegistry] Reaper promoted: ${ownerAddress} - ${result.hash}`);
        return result;
    }

    /**
     * Suspend a reaper.
     */
    async suspend(adminKey: string, ownerAddress: string) {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
        const adminKeypair = Keypair.fromSecret(adminKey);
        const sourceAccount = await this.server.getAccount(adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'suspend',
                new Address(adminKeypair.publicKey()).toScVal(),
                new Address(ownerAddress).toScVal()
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(adminKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[SoulReaperRegistry] Reaper suspended: ${ownerAddress} - ${result.hash}`);
        return result;
    }

    /**
     * Reinstate a suspended reaper.
     */
    async reinstate(adminKey: string, ownerAddress: string) {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
        const adminKeypair = Keypair.fromSecret(adminKey);
        const sourceAccount = await this.server.getAccount(adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'reinstate',
                new Address(adminKeypair.publicKey()).toScVal(),
                new Address(ownerAddress).toScVal()
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(adminKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[SoulReaperRegistry] Reaper reinstated: ${ownerAddress} - ${result.hash}`);
        return result;
    }

    /**
     * Set division capacity.
     */
    async setDivisionCapacity(adminKey: string, division: number, capacity: number) {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
        const adminKeypair = Keypair.fromSecret(adminKey);
        const sourceAccount = await this.server.getAccount(adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'set_division_capacity',
                new Address(adminKeypair.publicKey()).toScVal(),
                nativeToScVal(division, { type: 'u32' }),
                nativeToScVal(capacity, { type: 'u32' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(adminKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[SoulReaperRegistry] Division capacity set: ${division} = ${capacity} - ${result.hash}`);
        return result;
    }

    /**
     * Get reaper details.
     */
    async getReaper(ownerAddress: string) {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'get_reaper',
                new Address(ownerAddress).toScVal()
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
     * Get reapers by division.
     */
    async getByDivision(division: number) {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'get_by_division',
                nativeToScVal(division, { type: 'u32' })
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
     * Get all reapers.
     */
    async getAll() {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call('get_all'))
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
     * Get power change history.
     */
    async getPowerHistory(ownerAddress: string) {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'get_power_history',
                new Address(ownerAddress).toScVal()
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
     * Get total reapers count.
     */
    async totalReapers() {
        if (!SOUL_REAPER_REGISTRY_CONTRACT_ID) throw new Error('SOUL_REAPER_REGISTRY_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_REAPER_REGISTRY_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call('total_reapers'))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        const simulation = await this.server.simulateTransaction(preparedTx);

        const simAny = simulation as any;
        if (simAny.result?.retval) {
            return scValToNative(simAny.result.retval);
        }
        return 0;
    }
}

export const soulReaperRegistryService = new SoulReaperRegistryService();
