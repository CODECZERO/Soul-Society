import mongoose from "mongoose";
import { userSingupData, userLoginData } from "../controler/userNgo.controler.js";
interface userData {
    email?: string;
    Id?: string;
}
declare const findUser: (userData: userData) => Promise<(mongoose.Document<unknown, {}, import("../model/user(Ngo).model.js").INgo, {}, mongoose.DefaultSchemaOptions> & Omit<import("../model/user(Ngo).model.js").INgo & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, keyof import("../model/user(Ngo).model.js").INgoMethods> & import("../model/user(Ngo).model.js").INgoMethods)[]>;
declare const saveDataAndToken: (userData: userSingupData) => Promise<{
    success: boolean;
    accessToken: string;
    refreshToken: string;
    userData: {
        Id: mongoose.Types.ObjectId;
        Email: string;
        NgoName: string;
        PublicKey: string;
    };
}>;
declare const findUserWithTokenAndPassCheck: (userData: userLoginData) => Promise<any>;
/**
 * Retrieves the private key of the NGO associated with a specific post
 * @param postId - The ID of the post to find the associated NGO
 * @returns The private key of the associated NGO
 * @throws Error if post not found, no associated NGO, or no private key available
 */
declare const getPrivateKey: (postId: string) => Promise<string>;
export { findUser, saveDataAndToken, findUserWithTokenAndPassCheck, getPrivateKey };
//# sourceMappingURL=user.Queries.d.ts.map