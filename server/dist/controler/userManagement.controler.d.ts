import { Request, Response } from "express";
export interface FindUserRequest {
    email?: string;
    id?: string;
}
export interface GetPrivateKeyRequest {
    userId: string;
}
declare const findUserById: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getUserPrivateKey: (req: Request, res: Response, next: import("express").NextFunction) => void;
export { findUserById, getUserPrivateKey };
//# sourceMappingURL=userManagement.controler.d.ts.map