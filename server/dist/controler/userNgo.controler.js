import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiError } from '../util/apiError.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { registerNGO, getNGO, findNGOByEmail } from '../dbQueries/ngo.Queries.js';
import { createAccount } from '../services/stellar/account.stellar.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
// ─── Token Generation Helper ───────────────────────────────────────
const generateTokens = (ngoId, email) => {
    const accessToken = jwt.sign({ id: ngoId, email }, process.env.ATS, { expiresIn: "1d" });
    const refreshToken = jwt.sign({ id: ngoId, email }, process.env.RTS, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};
// ─── Signup (Register NGO) ─────────────────────────────────────────
const singup = AsyncHandler(async (req, res) => {
    const rawData = req.body;
    // Basic validation
    if (!rawData.ngoName || !rawData.email || !rawData.description || !rawData.password) {
        throw new ApiError(400, 'Missing required fields: ngoName, email, description, password');
    }
    try {
        // 1. Create Stellar Account
        console.log('Creating Stellar account for new NGO...');
        const stellarAccount = await createAccount();
        if (!stellarAccount || !stellarAccount.publicKey) {
            throw new ApiError(500, 'Failed to create blockchain account');
        }
        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(rawData.password, 10);
        // 3. Prepare Data
        const ngoData = {
            name: rawData.ngoName,
            description: rawData.description,
            image: rawData.image || "https://placehold.co/400",
            walletAddress: stellarAccount.publicKey,
            email: rawData.email,
            website: rawData.website || "",
            regNumber: rawData.regNumber || "",
            phoneNo: rawData.phoneNo || "",
            password: hashedPassword
        };
        // 4. Register in Vault
        const savedNGO = await registerNGO(ngoData);
        // 5. Generate Tokens
        const { accessToken, refreshToken } = generateTokens(savedNGO.id, savedNGO.email || "");
        return res.status(200).json(new ApiResponse(200, {
            userData: {
                Id: savedNGO.id,
                NgoName: savedNGO.name,
                Email: savedNGO.email,
                RegNumber: savedNGO.regNumber,
                Description: savedNGO.description,
                PublicKey: savedNGO.walletAddress,
                createdAt: savedNGO.createdAt
            },
            accessToken,
            refreshToken,
            blockchainAccount: {
                publicKey: stellarAccount.publicKey,
            },
        }, 'NGO registered successfully'));
    }
    catch (error) {
        console.error('Error during signup:', error);
        throw new ApiError(500, `Signup failed: ${error.message}`);
    }
});
// ─── Login (Email/Password OR Wallet) ──────────────────────────────
const login = AsyncHandler(async (req, res) => {
    const { email, password, walletAddress } = req.body;
    let ngo;
    if (email && password) {
        // Email/Password Login
        ngo = await findNGOByEmail(email);
        if (!ngo)
            throw new ApiError(404, 'NGO not found');
        if (!ngo.password)
            throw new ApiError(401, 'Legacy account or wallet-only auth required');
        const isPasswordValid = await bcrypt.compare(password, ngo.password);
        if (!isPasswordValid)
            throw new ApiError(401, 'Invalid credentials');
    }
    else if (walletAddress) {
        // Wallet Login (Future proofing)
        // Implementation pending for pure wallet login without signature
        // For now, we reuse the query but this is insecure without signature verification
        // const all = await getAllNGOs(); ...
        throw new ApiError(400, 'Wallet login requires signature verification (not implemented)');
    }
    else {
        throw new ApiError(400, 'Email and Password required');
    }
    const { accessToken, refreshToken } = generateTokens(ngo.id, ngo.email || "");
    // Map to frontend expected structure
    const responseData = {
        Id: ngo.id,
        NgoName: ngo.name,
        Email: ngo.email,
        RegNumber: ngo.regNumber,
        Description: ngo.description,
        PublicKey: ngo.walletAddress,
        createdAt: ngo.createdAt
    };
    return res
        .status(200)
        .cookie('accessToken', accessToken)
        .cookie('refreshToken', refreshToken)
        .json(new ApiResponse(200, { userData: responseData, accessToken, refreshToken }, 'Login successful'));
});
// ─── Refresh Token ─────────────────────────────────────────────────
const refreshToken = AsyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        throw new ApiError(400, 'Refresh token is required');
    try {
        const decoded = jwt.verify(refreshToken, process.env.RTS);
        if (!decoded || !decoded.id)
            throw new ApiError(401, 'Invalid token');
        const ngo = await getNGO(decoded.id);
        if (!ngo)
            throw new ApiError(401, 'NGO not found');
        const tokens = generateTokens(ngo.id, ngo.email || "");
        return res.status(200).json(new ApiResponse(200, { ...tokens }, 'Token refreshed successfully'));
    }
    catch (error) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }
});
export { singup, login, refreshToken };
//# sourceMappingURL=userNgo.controler.js.map