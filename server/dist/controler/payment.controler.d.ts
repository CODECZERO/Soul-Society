import { Response, Request } from "express";
export interface DonationData {
    TransactionId: string;
    postID: string;
    Amount: number;
}
export interface PayWallet {
    PublicKey: string;
    PostId: string;
    Amount: number;
    Cid: string;
}
declare const verfiyDonationAndSave: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const walletPay: (req: Request, res: Response, next: import("express").NextFunction) => void;
export { verfiyDonationAndSave, walletPay };
//# sourceMappingURL=payment.controler.d.ts.map