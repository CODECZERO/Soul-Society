export interface WalletToWallet {
    senderKey: string;
    receiverKey: string;
    amount: number;
    meta: {
        cid: string;
        prevTxn?: string;
    };
}
interface PaymentResult {
    success: boolean;
    hash?: string;
    ledger?: number;
    error?: string;
}
/**
 * Get balance for a user's wallet
 */
declare const getBalance: (publicKey: string) => Promise<({
    asset: string;
    balance: any;
    issuer?: undefined;
} | {
    asset: any;
    balance: any;
    issuer: any;
})[]>;
/**
 * Send XLM payment from one wallet to another
 */
declare const sendPaymentToWallet: (walletData: WalletToWallet) => Promise<PaymentResult>;
declare const verfiyTransaction: (TransactionId: string) => Promise<any>;
export { sendPaymentToWallet, getBalance, verfiyTransaction };
//# sourceMappingURL=transcation.stellar.d.ts.map