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

const SOUL_BADGE_CONTRACT_ID = process.env.SOUL_BADGE_CONTRACT_ID || '';

export class SoulBadgeService {
    private server = server;
    private adminKeypair = Keypair.fromSecret(STACK_ADMIN_SECRET);

    /**
     * Initialize the Soul Badge contract.
     */
    async initialize(adminKey: string) {
        if (!SOUL_BADGE_CONTRACT_ID) throw new Error('SOUL_BADGE_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_BADGE_CONTRACT_ID);
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

        logger.info(`[SoulBadge] Initialized: ${result.hash}`);
        return result;
    }

    /**
     * Mint a badge.
     */
    async mint(reaperAddress: string, missionId: string, rank: string) {
        if (!SOUL_BADGE_CONTRACT_ID) throw new Error('SOUL_BADGE_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_BADGE_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'mint',
                new Address(reaperAddress).toScVal(),
                nativeToScVal(missionId, { type: 'string' }),
                nativeToScVal(rank, { type: 'string' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(this.adminKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[SoulBadge] Badge minted for ${reaperAddress} - ${result.hash}`);
        return result;
    }

    /**
     * Revoke a badge.
     */
    async revoke(adminKey: string, reaperAddress: string, missionId: string) {
        if (!SOUL_BADGE_CONTRACT_ID) throw new Error('SOUL_BADGE_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_BADGE_CONTRACT_ID);
        const adminKeypair = Keypair.fromSecret(adminKey);
        const sourceAccount = await this.server.getAccount(adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'revoke',
                new Address(adminKeypair.publicKey()).toScVal(),
                new Address(reaperAddress).toScVal(),
                nativeToScVal(missionId, { type: 'string' })
            ))
            .setTimeout(30)
            .build();

        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(adminKeypair);
        const result = await this.server.sendTransaction(preparedTx);

        logger.info(`[SoulBadge] Badge revoked for ${reaperAddress} - ${result.hash}`);
        return result;
    }

    /**
     * Get all badges for a reaper.
     */
    async getBadges(reaperAddress: string) {
        if (!SOUL_BADGE_CONTRACT_ID) throw new Error('SOUL_BADGE_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_BADGE_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'get_badges',
                new Address(reaperAddress).toScVal()
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
     * Verify badge exists.
     */
    async verifyBadge(reaperAddress: string, missionId: string) {
        if (!SOUL_BADGE_CONTRACT_ID) throw new Error('SOUL_BADGE_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_BADGE_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'verify_badge',
                new Address(reaperAddress).toScVal(),
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
        return false;
    }

    /**
     * Get badge count for a reaper.
     */
    async badgeCount(reaperAddress: string) {
        if (!SOUL_BADGE_CONTRACT_ID) throw new Error('SOUL_BADGE_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_BADGE_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'badge_count',
                new Address(reaperAddress).toScVal()
            ))
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

    /**
     * Get total badges minted.
     */
    async totalBadges() {
        if (!SOUL_BADGE_CONTRACT_ID) throw new Error('SOUL_BADGE_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_BADGE_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call('total_badges'))
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

    /**
     * Get top reapers leaderboard.
     */
    async getTopReapers(limit: number) {
        if (!SOUL_BADGE_CONTRACT_ID) throw new Error('SOUL_BADGE_CONTRACT_ID not configured');

        const contract = new Contract(SOUL_BADGE_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());

        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call(
                'get_top_reapers',
                nativeToScVal(limit, { type: 'u32' })
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

export const soulBadgeService = new SoulBadgeService();
