import AsyncHandler from "../util/asyncHandler.util.js";
import { ApiError } from "../util/apiError.util.js";
import { ApiResponse } from "../util/apiResponse.util.js";
import { getAllDonation } from "../dbQueries/donation.Queries.js";
import { ngoModel } from "../model/user(Ngo).model.js";
import { getXLMtoINRRate } from "../util/exchangeRate.util.js";
const getStats = AsyncHandler(async (req, res) => {
    try {
        // Get all donations
        const donations = await getAllDonation();
        if (!donations)
            throw new ApiError(404, "no donations found");
        // Get live XLM to INR exchange rate
        const XLM_TO_INR_RATE = await getXLMtoINRRate();
        // Calculate total raised (donations are in XLM, convert to INR)
        const totalRaisedXLM = donations.reduce((sum, donation) => {
            return sum + (donation.Amount || 0);
        }, 0);
        const totalRaisedINR = Math.round(totalRaisedXLM * XLM_TO_INR_RATE);
        // Count unique donors (unique transaction IDs)
        const uniqueDonors = new Set(donations.map((donation) => donation.currentTxn)).size;
        // Count verified NGOs
        const verifiedNgos = await ngoModel.countDocuments();
        const stats = {
            totalRaised: totalRaisedINR, // Total amount in INR (converted from XLM)
            activeDonors: uniqueDonors, // Unique donors count
            verifiedNGOs: verifiedNgos, // Total NGOs count
        };
        return res
            .status(200)
            .json(new ApiResponse(200, stats, "stats retrieved successfully"));
    }
    catch (error) {
        console.error("Error getting stats:", error);
        throw new ApiError(500, "failed to get stats");
    }
});
export { getStats };
//# sourceMappingURL=stats.controler.js.map