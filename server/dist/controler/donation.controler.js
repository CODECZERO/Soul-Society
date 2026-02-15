import AsyncHandler from "../util/asyncHandler.util.js";
import { ApiError } from "../util/apiError.util.js";
import { ApiResponse } from "../util/apiResponse.util.js";
import { Types } from "mongoose";
import { getDonation, getAllDonation, getDonationRelatedToPost } from "../dbQueries/donation.Queries.js";
// Get specific donation by transaction ID
const getDonationById = AsyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    if (!transactionId)
        throw new ApiError(400, "Transaction ID is required");
    const donation = await getDonation(transactionId);
    if (!donation)
        throw new ApiError(404, "Donation not found");
    return res.status(200).json(new ApiResponse(200, donation, "Donation retrieved successfully"));
});
// Get all donations
const getAllDonations = AsyncHandler(async (req, res) => {
    const donations = await getAllDonation();
    if (!donations)
        throw new ApiError(404, "No donations found");
    return res.status(200).json(new ApiResponse(200, donations, "All donations retrieved"));
});
// Get donations related to a specific post
const getDonationsByPost = AsyncHandler(async (req, res) => {
    const { postId } = req.params;
    if (!postId)
        throw new ApiError(400, "Post ID is required");
    const donations = await getDonationRelatedToPost(new Types.ObjectId(postId));
    if (!donations)
        throw new ApiError(404, "No donations found for this post");
    return res.status(200).json(new ApiResponse(200, donations, "Post donations retrieved"));
});
export { getDonationById, getAllDonations, getDonationsByPost };
//# sourceMappingURL=donation.controler.js.map