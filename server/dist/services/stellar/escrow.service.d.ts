export declare class EscrowService {
    private server;
    private adminKeypair;
    /**
     * Create an Escrow: Locks funds on-chain.
     * Helper to build the transaction XDR for the frontend to sign.
     */
    buildCreateEscrowTx(donorPublicKey: string, ngoPublicKey: string, totalAmount: number, lockedAmount: number, taskId: string, deadline: number): Promise<string>;
    /**
     * Submit Proof: NGO calls this.
     */
    buildSubmitProofTx(ngoPublicKey: string, taskId: string, proofCid: string): Promise<string>;
    /**
     * Vote: Community member calls this.
     */
    buildVoteTx(voterPublicKey: string, taskId: string, isScam: boolean): Promise<string>;
    /**
     * Release: Admin/Server calls this after verification.
     */
    releaseEscrow(taskId: string): Promise<import("@stellar/stellar-sdk/rpc").Api.SendTransactionResponse>;
    /**
     * Dispute: Admin/Server calls this if scam detected.
     */
    disputeEscrow(taskId: string): Promise<import("@stellar/stellar-sdk/rpc").Api.SendTransactionResponse>;
}
export declare const escrowService: EscrowService;
//# sourceMappingURL=escrow.service.d.ts.map