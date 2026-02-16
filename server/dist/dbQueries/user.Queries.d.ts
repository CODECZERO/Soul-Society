import { userSingupData, userLoginData } from '../controler/userNgo.controler.js';
interface userData {
    email?: string;
    Id?: string;
}
declare const findUser: (userData: userData) => Promise<any[]>;
declare const saveDataAndToken: (userData: userSingupData) => Promise<{
    success: boolean;
    accessToken: string;
    refreshToken: string;
    userData: {
        Id: string;
        Email: string;
        NgoName: string;
        PublicKey: string | undefined;
    };
}>;
declare const findUserWithTokenAndPassCheck: (userData: userLoginData) => Promise<any>;
declare const getPrivateKey: (postId: string) => Promise<string>;
export { findUser, saveDataAndToken, findUserWithTokenAndPassCheck, getPrivateKey };
//# sourceMappingURL=user.Queries.d.ts.map