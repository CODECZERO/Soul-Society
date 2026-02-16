import { Request, Response, NextFunction } from 'express';
export interface RequestK extends Request {
    NgoId?: string;
    user?: {
        id: string;
        email: string;
        walletAddr: string;
        NgoName: string;
    };
}
declare const verifyToken: (req: RequestK, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export { verifyToken };
//# sourceMappingURL=verify.midelware.d.ts.map