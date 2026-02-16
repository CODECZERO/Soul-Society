import { Contract, Address, nativeToScVal, Keypair, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import { server, STACK_ADMIN_SECRET } from './smartContract.handler.stellar.js';
// This will be set after deployment
const ESCROW_CONTRACT_ID = process.env.ESCROW_CONTRACT_ID || '';
export class EscrowService {
    server = server;
    adminKeypair = Keypair.fromSecret(STACK_ADMIN_SECRET);
    /**
     * Create an Escrow: Locks funds on-chain.
     * Helper to build the transaction XDR for the frontend to sign.
     */
    async buildCreateEscrowTx(donorPublicKey, ngoPublicKey, totalAmount, lockedAmount, taskId, deadline) {
        if (!ESCROW_CONTRACT_ID)
            throw new Error('ESCROW_CONTRACT_ID not configured');
        const contract = new Contract(ESCROW_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(donorPublicKey);
        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call('create_escrow', new Address(donorPublicKey).toScVal(), new Address(ngoPublicKey).toScVal(), nativeToScVal(BigInt(totalAmount), { type: 'i128' }), nativeToScVal(BigInt(lockedAmount), { type: 'i128' }), nativeToScVal(taskId, { type: 'string' }), nativeToScVal(BigInt(deadline), { type: 'u64' })))
            .setTimeout(30)
            .build();
        return tx.toXDR();
    }
    /**
     * Submit Proof: NGO calls this.
     */
    async buildSubmitProofTx(ngoPublicKey, taskId, proofCid) {
        if (!ESCROW_CONTRACT_ID)
            throw new Error('ESCROW_CONTRACT_ID not configured');
        const contract = new Contract(ESCROW_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(ngoPublicKey);
        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call('submit_proof', nativeToScVal(taskId, { type: 'string' }), nativeToScVal(proofCid, { type: 'string' })))
            .setTimeout(30)
            .build();
        return tx.toXDR();
    }
    /**
     * Vote: Community member calls this.
     */
    async buildVoteTx(voterPublicKey, taskId, isScam) {
        if (!ESCROW_CONTRACT_ID)
            throw new Error('ESCROW_CONTRACT_ID not configured');
        const contract = new Contract(ESCROW_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(voterPublicKey);
        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call('vote', nativeToScVal(taskId, { type: 'string' }), new Address(voterPublicKey).toScVal(), nativeToScVal(isScam, { type: 'bool' })))
            .setTimeout(30)
            .build();
        return tx.toXDR();
    }
    /**
     * Release: Admin/Server calls this after verification.
     */
    async releaseEscrow(taskId) {
        if (!ESCROW_CONTRACT_ID)
            throw new Error('ESCROW_CONTRACT_ID not configured');
        const contract = new Contract(ESCROW_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());
        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call('release', nativeToScVal(taskId, { type: 'string' })))
            .setTimeout(30)
            .build();
        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(this.adminKeypair);
        const result = await this.server.sendTransaction(preparedTx);
        return result;
    }
    /**
     * Dispute: Admin/Server calls this if scam detected.
     */
    async disputeEscrow(taskId) {
        if (!ESCROW_CONTRACT_ID)
            throw new Error('ESCROW_CONTRACT_ID not configured');
        const contract = new Contract(ESCROW_CONTRACT_ID);
        const sourceAccount = await this.server.getAccount(this.adminKeypair.publicKey());
        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100",
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(contract.call('dispute', nativeToScVal(taskId, { type: 'string' })))
            .setTimeout(30)
            .build();
        const preparedTx = await this.server.prepareTransaction(tx);
        preparedTx.sign(this.adminKeypair);
        const result = await this.server.sendTransaction(preparedTx);
        return result;
    }
}
export const escrowService = new EscrowService();
//# sourceMappingURL=escrow.service.js.map