import { Request, Response } from "express";
export interface GetPrevTxnRequest {
    postId: string;
}
export interface CreateTxnRequest {
    txnData: unknown;
    postId: string;
}
declare const getPreviousTransaction: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const createTransactionRecord: (req: Request, res: Response, next: import("express").NextFunction) => void;
export { getPreviousTransaction, createTransactionRecord };
//# sourceMappingURL=expense.controler.d.ts.map