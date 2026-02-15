import { Request, Response } from "express";
export interface userSingupData {
    ngoName: string;
    regNumber: string;
    description: string;
    email: string;
    phoneNo: string;
    password: string;
    PublicKey?: string;
    PrivateKey?: string;
    walletAddr?: string;
    NgoName?: string;
    RegNumber?: string;
    Description?: string;
    Email?: string;
    PhoneNo?: string;
    Password?: string;
}
export interface userLoginData {
    email: string;
    password: string;
}
declare const singup: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const login: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const refreshToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
export { singup, login, refreshToken };
//# sourceMappingURL=userNgo.controler.d.ts.map