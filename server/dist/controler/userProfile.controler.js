import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { getDonationsByDonor } from '../dbQueries/donation.Queries.js';
import { postModel } from '../model/post.model.js';
import { ApiError } from '../util/apiError.util.js';
const getUserProfile = AsyncHandler(async (req, res) => {
    const { walletAddr } = req.params;
    if (!walletAddr) {
        throw new ApiError(400, 'walletAddr is required');
    }
    // 1. Get total donations (Spiritual Power)
    const donations = await getDonationsByDonor(walletAddr);
    const totalReiatsu = donations.reduce((acc, curr) => acc + curr.Amount, 0);
    // 2. Get mission proofs (Missions Completed)
    // We search for missions where this user submitted an approved proof
    const completedMissions = await postModel.find({
        Proofs: {
            $elemMatch: {
                Submitter: walletAddr,
                Status: 'Approved',
            },
        },
    });
    // 3. Determine Rank
    let rank = 'Substitute Soul Reaper';
    if (totalReiatsu > 10000 || completedMissions.length > 5)
        rank = 'Lieutenant';
    if (totalReiatsu > 50000 || completedMissions.length > 15)
        rank = 'Captain';
    if (totalReiatsu > 200000)
        rank = 'Head Captain';
    const profileData = {
        walletAddr,
        rank,
        totalReiatsu,
        missionsCompletedCount: completedMissions.length,
        completedMissions: completedMissions.map((m) => ({
            id: m._id,
            title: m.Title,
            dangerLevel: m.DangerLevel,
        })),
        recentInfusions: donations.slice(-5).map((d) => ({
            amount: d.Amount,
            date: d.createdAt,
            txn: d.currentTxn,
        })),
    };
    return res.status(200).json(new ApiResponse(200, profileData, 'Profile retrieved successfully'));
});
export { getUserProfile };
//# sourceMappingURL=userProfile.controler.js.map