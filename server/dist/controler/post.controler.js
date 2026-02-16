import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiError } from '../util/apiError.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { getPosts, savePostData } from '../dbQueries/post.Queries.js';
import { getDonationRelatedToPost } from '../dbQueries/donation.Queries.js';
import { getXLMtoINRRate } from '../util/exchangeRate.util.js';
import { ImgFormater } from '../util/ipfs.uitl.js';
import { registerMission } from '../services/stellar/smartContract.handler.stellar.js';
const getAllPost = AsyncHandler(async (req, res) => {
    try {
        const postData = await getPosts();
        if (!postData)
            throw new ApiError(404, 'post data not found');
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
                // Plain object from Vault (no .toObject() needed)
                const postObj = { ...post };
                // Format the image URL if ImgCid exists
                if (post.ImgCid) {
                    try {
                        postObj.ImgCid = (await ImgFormater(post.ImgCid)) || '';
                    }
                    catch (error) {
                        console.error(`Error formatting image URL for post ${post._id}:`, error);
                        postObj.ImgCid = '';
                    }
                }
                else {
                    postObj.ImgCid = '';
                }
                return {
                    ...postObj,
                    CollectedAmount: Math.round(collectedINR),
                };
            }
            catch (error) {
                console.error(`Error processing post ${post._id}:`, error);
                return {
                    ...post,
                    CollectedAmount: 0,
                    ImgCid: post.ImgCid ? await ImgFormater(post.ImgCid).catch(() => '') : '',
                };
            }
        }));
        return res.status(200).json(new ApiResponse(200, postsWithCollected, 'found data'));
    }
    catch (error) {
        console.error('Error in getAllPost:', error);
        throw error;
    }
});
const createPost = AsyncHandler(async (req, res) => {
    const postData = req.body;
    if (!req.user || !req.user.walletAddr) {
        throw new ApiError(401, 'User wallet address not found. Please connect your wallet.');
    }
    postData.WalletAddr = req.user.walletAddr;
    // Set NgoRef as a plain string ID (no more ObjectId)
    if (req.NgoId) {
        postData.NgoRef = req.NgoId;
    }
    else {
        throw new ApiError(401, 'NGO authentication required');
    }
    if (!postData.Title || !postData.Description || !postData.NeedAmount) {
        throw new ApiError(400, 'Title, description, and amount are required');
    }
    postData.Status = postData.Status || 'Active';
    postData.DangerLevel = postData.DangerLevel || 'Low';
    const saveData = await savePostData(postData);
    if (!saveData) {
        throw new ApiError(500, 'Failed to save post data');
    }
    // Register on Mission Registry (On-Chain)
    try {
        const dangerLevelMap = { Low: 1, Medium: 2, High: 3, Extreme: 4 };
        const numericDanger = dangerLevelMap[postData.DangerLevel || 'Low'] || 1;
        const privateKey = req.user.privateKey || process.env.DEFAULT_CAPTAIN_S_KEY;
        if (privateKey) {
            await registerMission(privateKey, saveData._id.toString(), postData.Title, numericDanger);
            console.log(`📜 Mission ${saveData._id} registered on-chain.`);
        }
    }
    catch (chainError) {
        console.warn('On-chain registration failed:', chainError);
    }
    return res.status(200).json(new ApiResponse(200, saveData, 'Post created successfully'));
});
export { createPost, getAllPost };
//# sourceMappingURL=post.controler.js.map