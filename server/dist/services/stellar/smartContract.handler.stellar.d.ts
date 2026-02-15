import * as StellarSdk from "@stellar/stellar-sdk";
interface UserDataWallet {
    privateKey: string;
    amount: number;
    cid: string;
    prevTxn: string;
    metadata?: string | null;
}
export declare function saveContractWithWallet(userData: UserDataWallet): Promise<StellarSdk.rpc.Api.SendTransactionResponse | StellarSdk.rpc.Api.GetSuccessfulTransactionResponse | StellarSdk.rpc.Api.GetFailedTransactionResponse>;
export declare function getLatestData(privateKey: string): Promise<Record<string, any> | null>;
export {};
//# sourceMappingURL=smartContract.handler.stellar.d.ts.map