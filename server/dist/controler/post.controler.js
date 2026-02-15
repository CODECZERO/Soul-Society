import AsyncHandler from "../util/asyncHandler.util.js";
import { ApiError } from "../util/apiError.util.js";
import { ApiResponse } from "../util/apiResponse.util.js";
import { Types } from "mongoose";
import { getPosts, savePostData } from "../dbQueries/post.Queries.js";
import { getDonationRelatedToPost } from "../dbQueries/donation.Queries.js";
import { getXLMtoINRRate } from "../util/exchangeRate.util.js";
import { ImgFormater } from "../util/ipfs.uitl.js";
const getAllPost = AsyncHandler(async (req, res) => {
    try {
        const postData = await getPosts();
        if (!postData)
            throw new ApiError(404, "post data not found");
        // Get live XLM to INR exchange rate
        const XLM_TO_INR_RATE = await getXLMtoINRRate();
        console.log(`📊 Using XLM/INR rate: ₹${XLM_TO_INR_RATE}`);
        // Calculate collected amount for each post
        const postsWithCollected = await Promise.all(postData.map(async (post) => {
            try {
                const donations = await getDonationRelatedToPost(post._id);
                // Sum XLM amounts and convert to INR
                const collectedXLM = donations.reduce((sum, donation) => {
                    return sum + (donation.Amount || 0);
                }, 0);
                const collectedINR = collectedXLM * XLM_TO_INR_RATE;
                // Convert to plain object if it's a Mongoose document
                const postObj = post.toObject ? post.toObject() : post;
                // Format the image URL if ImgCid exists
                if (post.ImgCid) {
                    try {
                        // Replace ImgCid with the full URL
                        postObj.ImgCid = await ImgFormater(post.ImgCid) || "";
                    }
                    catch (error) {
                        console.error(`Error formatting image URL for post ${post._id}:`, error);
                        postObj.ImgCid = "";
                    }
                }
                else {
                    postObj.ImgCid = "";
                }
                return {
                    ...postObj,
                    CollectedAmount: Math.round(collectedINR) // Amount in INR (rounded)
                };
            }
            catch (error) {
                console.error(`Error processing post ${post._id}:`, error);
                // Return post without CollectedAmount if error
                const postObj = post.toObject ? post.toObject() : post;
                return {
                    ...postObj,
                    CollectedAmount: 0,
                    ImgCid: post.ImgCid ? await ImgFormater(post.ImgCid).catch(() => "") : ""
                };
            }
        }));
        return res.status(200).json(new ApiResponse(200, postsWithCollected, "found data"));
    }
    catch (error) {
        console.error("Error in getAllPost:", error);
        throw error;
    }
});
const createPost = AsyncHandler(async (req, res) => {
    // Get the post data from the request body
    const postData = req.body;
    // Check if the user is authenticated and has a wallet address
    if (!req.user || !req.user.walletAddr) {
        throw new ApiError(401, "User wallet address not found. Please connect your wallet.");
    }
    // Set the wallet address from the authenticated user
    postData.WalletAddr = req.user.walletAddr;
    // Set the NGO reference from the authenticated user
    if (req.NgoId) {
        postData.NgoRef = new Types.ObjectId(req.NgoId);
    }
    else {
        throw new ApiError(401, "NGO authentication required");
    }
    // Validate required fields
    if (!postData.Title || !postData.Description || !postData.NeedAmount) {
        throw new ApiError(400, "Title, description, and amount are required");
    }
    // Save the post data
    const saveData = await savePostData(postData);
    if (!saveData) {
        throw new ApiError(500, "Failed to save post data");
    }
    return res.status(200).json(new ApiResponse(200, saveData, "Post created successfully"));
});
export { createPost, getAllPost };
//# sourceMappingURL=post.controler.js.map