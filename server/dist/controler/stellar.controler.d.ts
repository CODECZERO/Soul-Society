import { Request, Response } from "express";
export interface GetBalanceRequest {
    publicKey: string;
}
export interface SendPaymentRequest {
    senderKey: string;
    receiverKey: string;
    amount: number;
    meta: {
        cid: string;
        prevTxn?: string;
    };
}
export interface CreateAccountRequest {
}
export interface DeleteAccountRequest {
    secret: string;
    destination: string;
}
export interface SmartContractRequest {
    privateKey: string;
    reciverKey: string;
    amount: number;
    cid: string;
    prevTxn: string;
    metadata?: string;
}
declare const getWalletBalance: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const sendPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const verifyTransaction: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const createStellarAccount: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const deleteStellarAccount: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const saveToSmartContract: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getLatestContractData: (req: Request, res: Response, next: import("express").NextFunction) => void;
export { getWalletBalance, sendPayment, verifyTransaction, createStellarAccount, deleteStellarAccount, saveToSmartContract, getLatestContractData };
//# sourceMappingURL=stellar.controler.d.ts.map