import AsyncHandler from "../util/asyncHandler.util.js";
import { ApiError } from "../util/apiError.util.js";
import { ApiResponse } from "../util/apiResponse.util.js";
import { findUser, findUserWithTokenAndPassCheck, saveDataAndToken } from "../dbQueries/user.Queries.js";
import { createAccount } from "../services/stellar/account.stellar.js";
import jwt from "jsonwebtoken";
// Helper function to normalize field names and validate data
const normalizeAndValidateUserData = (data) => {
    // Handle common field name variations
    const normalizedData = {
        ngoName: data.ngoName || data.ngo_name || data.organizationName,
        regNumber: data.regNumber || data.reg_number || data.registrationNumber,
        description: data.description || data.desc,
        email: data.email,
        phoneNo: data.phoneNo || data.phone_no || data.phone || data.phoneNumber,
        password: data.password || data.passwrod, // Handle typo
    };
    // Validate required fields
    const requiredFields = ['ngoName', 'regNumber', 'description', 'email', 'phoneNo', 'password'];
    const missingFields = requiredFields.filter(field => !normalizedData[field]);
    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }
    return normalizedData;
};
const singup = AsyncHandler(async (req, res) => {
    const rawData = req.body;
    if (!rawData)
        throw new ApiError(400, "Invalid data");
    // Normalize and validate the data
    const userData = normalizeAndValidateUserData(rawData);
    // Check if user already exists
    if (userData.email) {
        const findUserData = await findUser({ email: userData.email });
        if (findUserData && findUserData.length > 0)
            throw new ApiError(401, "User already exists");
    }
    try {
        // Create Stellar blockchain account
        console.log("Creating Stellar account for new user...");
        const stellarAccount = await createAccount();
        if (!stellarAccount || !stellarAccount.publicKey || !stellarAccount.secret) {
            throw new ApiError(500, "Failed to create blockchain account");
        }
        // Add blockchain keys to user data with correct field names (PascalCase to match model)
        const userDataWithKeys = {
            ...userData,
            PublicKey: stellarAccount.publicKey, // Changed from publicKey to PublicKey
            PrivateKey: stellarAccount.secret, // Changed from privateKey to PrivateKey
            walletAddr: stellarAccount.publicKey // Also set walletAddr for consistency
        };
        console.log(`✅ Stellar account created: ${stellarAccount.publicKey}`);
        // Save user data with blockchain keys
        const SaveData = await saveDataAndToken(userDataWithKeys);
        if (!SaveData)
            throw new ApiError(500, `Something went wrong while saving data: ${SaveData}`);
        return res.status(200).json(new ApiResponse(200, {
            ...SaveData,
            blockchainAccount: {
                publicKey: stellarAccount.publicKey,
                // Don't send private key in response for security
            }
        }, "User registered successfully with blockchain account"));
    }
    catch (error) {
        console.error("Error during signup:", error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, `Signup failed: ${error.message}`);
    }
});
const login = AsyncHandler(async (req, res) => {
    const userData = req.body;
    if (!userData)
        throw new ApiError(400, "invalid data");
    const dataCheck = await findUserWithTokenAndPassCheck(userData);
    if (!dataCheck)
        throw new ApiError(500, `something went wrong while checking ${dataCheck}`);
    const { accessToken, refreshToken } = dataCheck;
    return res.status(200).cookie('accessToken', accessToken).cookie('refreshToken', refreshToken).json(new ApiResponse(200, dataCheck, "user confirm"));
});
const refreshToken = AsyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new ApiError(400, "Refresh token is required");
    }
    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.RTS || "sdfsd");
        if (!decoded || !decoded.Id) {
            throw new ApiError(401, "Invalid refresh token");
        }
        // Find user by ID
        const user = await findUser({ _id: decoded.Id });
        if (!user || user.length === 0) {
            throw new ApiError(401, "User not found");
        }
        // Generate new tokens
        const userDoc = user[0]; // Non-null assertion - we know this exists because of the previous check
        const { accessToken, refreshToken: newRefreshToken } = await userDoc.generateTokens();
        // Set new cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        return res.status(200).json(new ApiResponse(200, {
            accessToken,
            refreshToken: newRefreshToken,
            userData: {
                Id: userDoc._id,
                NgoName: userDoc.NgoName,
                Email: userDoc.Email,
                RegNumber: userDoc.RegNumber,
                Description: userDoc.Description,
                createdAt: userDoc.createdAt
            }
        }, "Token refreshed successfully"));
    }
    catch (error) {
        console.error("Refresh token error:", error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(401, "Invalid or expired refresh token");
    }
});
export { singup, login, refreshToken };
//# sourceMappingURL=userNgo.controler.js.map