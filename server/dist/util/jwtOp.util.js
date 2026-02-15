import jwt from 'jsonwebtoken';
import { ApiError } from './apiError.util.js';
import dotenv from 'dotenv';
dotenv.config();
// Generate Access Token
const genAccessToken = async (user) => {
    try {
        const { email, walletAddr, NgoName, id } = user;
        if (!process.env.ATS) {
            throw new Error('ATS (Access Token Secret) is not defined in environment variables');
        }
        const secret = process.env.ATS;
        if (!secret || !user) {
            throw new ApiError(500, "Secret is missing or user info is invalid");
        }
        return jwt.sign({
            email,
            NgoName,
            walletAddr,
            id: id, // Also include id for consistency
        }, secret, // Access token secret
        {
            expiresIn: process.env.ATE || '15m' // Access token expiry
        });
    }
    catch (error) {
        throw new ApiError(500, "Unable to generate access token");
    }
};
// Generate Refresh Token
const genRefreshToken = async (user) => {
    try {
        const { id, walletAddr } = user;
        if (!process.env.RTS) {
            throw new Error('RTS (Refresh Token Secret) is not defined in environment variables');
        }
        const secret = process.env.RTS;
        if (!secret) {
            throw new ApiError(500, "Refresh token secret is missing");
        }
        return jwt.sign({
            id,
            walletAddr
        }, secret, {
            expiresIn: process.env.RTE || '7d' // Refresh token expiry
        });
    }
    catch (error) {
        throw new ApiError(400, "Unable to generate refresh token");
    }
};
export { genAccessToken, genRefreshToken };
//# sourceMappingURL=jwtOp.util.js.map