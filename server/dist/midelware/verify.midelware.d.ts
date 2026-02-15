import { Request, Response, NextFunction } from "express";
export interface RequestK extends Request {
    NgoId?: string;
    user?: {
        id: string;
        email: string;
        walletAddr: string;
        NgoName: string;
    };
}
declare const verifyToken: (req: RequestK, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export { verifyToken };
//# sourceMappingURL=verify.midelware.d.ts.map