import * as StellarSdk from '@stellar/stellar-sdk';
export declare const server: StellarSdk.rpc.Server;
export declare const STACK_ADMIN_SECRET: string;
interface UserDataWallet {
    privateKey: string;
    amount: number;
    cid: string;
    prevTxn: string;
    metadata?: string | null;
    contractId?: string;
}
export declare function saveContractWithWallet(userData: UserDataWallet): Promise<StellarSdk.rpc.Api.SendTransactionResponse | StellarSdk.rpc.Api.GetSuccessfulTransactionResponse | StellarSdk.rpc.Api.GetFailedTransactionResponse>;
export declare function getLatestData(privateKey: string, contractId?: string): Promise<Record<string, any> | null>;
export declare function registerMission(captainKey: string, missionId: string, title: string, dangerLevel: number): Promise<StellarSdk.rpc.Api.SendTransactionResponse>;
export declare function sealMissionProof(validatorKey: string, reaperAddress: string, missionId: string, proofCid: string): Promise<StellarSdk.rpc.Api.SendTransactionResponse>;
export {};
//# sourceMappingURL=smartContract.handler.stellar.d.ts.map