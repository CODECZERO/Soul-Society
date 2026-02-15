import mongoose from "mongoose";
import { ngoModel } from "../model/user(Ngo).model.js";
import { postModel } from "../model/post.model.js";
const findUser = async (userData) => {
    try {
        if (!userData || (!userData?.email && !userData?.Id))
            throw new Error("Provide email address or Id");
        const query = userData.email
            ? { Email: userData.email }
            : { _id: new mongoose.Types.ObjectId(userData.Id) };
        const userResult = await ngoModel.find(query);
        // Return empty array if no user found (this is normal for signup checks)
        return userResult || [];
    }
    catch (error) {
        throw error;
    }
};
const saveDataAndToken = async (userData) => {
    try {
        if (!userData)
            throw new Error("User data is required");
        console.log("💾 Saving NGO data:", {
            email: userData.email,
            ngoName: userData.ngoName,
            regNumber: userData.regNumber,
        });
        const Data = await ngoModel.create({
            Email: userData.email,
            NgoName: userData.ngoName,
            RegNumber: userData.regNumber,
            Description: userData.description,
            PublicKey: userData.PublicKey, // Using PascalCase to match interface
            PrivateKey: userData.PrivateKey, // Using PascalCase to match interface
            walletAddr: userData.walletAddr || userData.PublicKey, // Include wallet address
            PhoneNo: userData.phoneNo,
            Password: userData.password,
        });
        if (!Data)
            throw new Error("something went wrong while saving data");
        console.log("✅ NGO data saved successfully:", Data._id);
        const { accessToken, refreshToken } = await Data.generateTokens();
        return {
            success: true,
            accessToken,
            refreshToken,
            userData: {
                Id: Data._id,
                Email: Data.Email,
                NgoName: Data.NgoName,
                PublicKey: Data.PublicKey,
            },
        };
    }
    catch (error) {
        console.error("❌ Error in saveDataAndToken:", error.message);
        throw error; // Throw error instead of returning it
    }
};
//The way i am writing code is to save time , but never do such thing
//never write code this way!!
const findUserWithTokenAndPassCheck = async (userData) => {
    try {
        if (!userData || !userData.email || !userData.password) {
            throw new Error("Email and password are required");
        }
        // Find user by email
        const user = await ngoModel.findOne({ Email: userData.email });
        if (!user) {
            throw new Error("User not found with this email");
        }
        // Verify password
        const isValidPassword = await user.isPasswordCorrect(userData.password);
        if (!isValidPassword) {
            throw new Error("Invalid password");
        }
        // Generate tokens with wallet address
        const { accessToken, refreshToken } = await user.generateTokens();
        // Return user data with tokens
        return {
            accessToken,
            refreshToken,
            userData: {
                Id: user._id,
                Email: user.Email,
                NgoName: user.NgoName,
                walletAddr: user.PublicKey, // Include wallet address
                PublicKey: user.PublicKey, // For backward compatibility
            }
        };
    }
    catch (error) {
        return error;
    }
};
/**
 * Retrieves the private key of the NGO associated with a specific post
 * @param postId - The ID of the post to find the associated NGO
 * @returns The private key of the associated NGO
 * @throws Error if post not found, no associated NGO, or no private key available
 */
const getPrivateKey = async (postId) => {
    if (!postId)
        throw new Error("Post ID is required");
    try {
        const result = await postModel.aggregate([
            // Match the post by ID
            { $match: { _id: new mongoose.Types.ObjectId(postId) } },
            // Lookup the NGO that owns this post
            {
                $lookup: {
                    from: "ngomodels", // Collection name in MongoDB (usually lowercase plural)
                    localField: "NgoRef", // Field in posts collection
                    foreignField: "_id", // Field in ngos collection
                    as: "ngo"
                }
            },
            // Unwind the ngo array (since lookup returns an array)
            { $unwind: "$ngo" },
            // Project only the private key
            {
                $project: {
                    _id: 0,
                    privateKey: "$ngo.PrivateKey"
                }
            }
        ]);
        if (!result.length) {
            throw new Error("Post not found or no associated NGO");
        }
        if (!result[0].privateKey) {
            throw new Error("No private key found for the associated NGO");
        }
        return result[0].privateKey;
    }
    catch (error) {
        console.error("Error in getPrivateKey:", error);
        throw new Error("Failed to retrieve private key");
    }
};
export { findUser, saveDataAndToken, findUserWithTokenAndPassCheck, getPrivateKey };
//# sourceMappingURL=user.Queries.js.map