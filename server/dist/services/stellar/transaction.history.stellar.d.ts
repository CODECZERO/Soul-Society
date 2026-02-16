export interface TransactionRecord {
    id: string;
    hash: string;
    ledger: number;
    created_at: string;
    source_account: string;
    fee_charged: string;
    operation_count: number;
    memo_type: string;
    memo?: string;
    successful: boolean;
}
/**
 * Fetch transaction history for a Stellar public key.
 * Returns the most recent transactions (up to `limit`).
 */
export declare function getTransactionHistory(publicKey: string, limit?: number, order?: 'asc' | 'desc'): Promise<TransactionRecord[]>;
/**
 * Fetch operation details for a specific transaction.
 */
export declare function getTransactionOperations(txHash: string): Promise<any[]>;
//# sourceMappingURL=transaction.history.stellar.d.ts.map