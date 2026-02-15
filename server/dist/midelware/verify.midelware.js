import jwt from "jsonwebtoken";
import { ApiError } from "../util/apiError.util.js";
import dotenv from "dotenv";
dotenv.config();
const verifyToken = async (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        let token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
        console.log('Token verification attempt:', {
            hasCookieToken: !!req.cookies?.accessToken,
            hasAuthHeader: !!req.headers.authorization,
            tokenLength: token ? token.length : 0,
            tokenStart: token ? token.substring(0, 20) + '...' : 'No token'
        });
        if (!token) {
            throw new ApiError(401, "Access token is required");
        }
        // Verify the token
        const decoded = jwt.verify(token, process.env.ATS || "sfdsdf");
        console.log('Token decoded successfully:', {
            userId: decoded.userId,
            email: decoded.email,
            exp: decoded.exp,
            iat: decoded.iat
        });
        if (!decoded || !decoded.userId) {
            throw new ApiError(401, "Invalid token");
        }
        // Set user data for use in controllers
        req.NgoId = decoded.userId;
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            walletAddr: decoded.walletAddr,
            NgoName: decoded.NgoName
        };
        next();
    }
    catch (error) {
        console.error('Token verification failed:', {
            error: error.message,
            name: error.name,
            stack: error.stack
        });
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};
export { verifyToken };
//# sourceMappingURL=verify.midelware.js.map