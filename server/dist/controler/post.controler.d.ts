import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
export interface PostData {
    Title: string;
    Type: string;
    Description: string;
    Location: string;
    ImgCid: string;
    NeedAmount: string;
    WalletAddr: string;
    NgoRef?: Types.ObjectId;
}
declare const getAllPost: (req: Request, res: Response, next: NextFunction) => void;
declare const createPost: (req: Request, res: Response, next: NextFunction) => void;
export { createPost, getAllPost };
//# sourceMappingURL=post.controler.d.ts.map