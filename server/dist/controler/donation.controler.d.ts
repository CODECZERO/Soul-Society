import { Request, Response } from "express";
export interface GetDonationRequest {
    transactionId: string;
}
export interface GetDonationsByPostRequest {
    postId: string;
}
declare const getDonationById: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getAllDonations: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getDonationsByPost: (req: Request, res: Response, next: import("express").NextFunction) => void;
export { getDonationById, getAllDonations, getDonationsByPost };
//# sourceMappingURL=donation.controler.d.ts.map