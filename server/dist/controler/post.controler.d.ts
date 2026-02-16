import { NextFunction, Request, Response } from 'express';
export interface PostData {
    Title: string;
    Type: string;
    Description: string;
    Location: string;
    ImgCid: string;
    NeedAmount: string;
    WalletAddr: string;
    NgoRef?: string;
    Status?: 'Active' | 'Completed' | 'Failed';
    DangerLevel?: 'Low' | 'Medium' | 'High' | 'Extreme';
}
declare const getAllPost: (req: Request, res: Response, next: NextFunction) => void;
declare const createPost: (req: Request, res: Response, next: NextFunction) => void;
export { createPost, getAllPost };
//# sourceMappingURL=post.controler.d.ts.map