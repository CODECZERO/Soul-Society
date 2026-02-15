import { Request, Response } from 'express';
import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiError } from '../util/apiError.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { getAllDonation } from '../dbQueries/donation.Queries.js';
import { ngoModel } from '../model/user(Ngo).model.js';
import { postModel, IPost } from '../model/post.model.js';
import { getXLMtoINRRate } from '../util/exchangeRate.util.js';

const getStats = AsyncHandler(async (req: Request, res: Response) => {
  try {
    // Get all donations
    const donations = await getAllDonation();
    if (!donations) throw new ApiError(404, 'no donations found');

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

    return res.status(200).json(new ApiResponse(200, stats, 'stats retrieved successfully'));
  } catch (error) {
    console.error('Error getting stats:', error);
    throw new ApiError(500, 'failed to get stats');
  }
});

const getLeaderboard = AsyncHandler(async (req: Request, res: Response) => {
  try {
    const ngos = await ngoModel.find();
    const XLM_TO_INR_RATE = await getXLMtoINRRate();

    const leaderboard = await Promise.all(
      ngos.map(async (ngo) => {
        // Count completed missions for this Division (NGO)
        const missions = await postModel.find({ NgoRef: ngo._id });
        const completedCount = missions.filter((m: IPost) => m.Status === 'Completed').length;

        // Sum total funds raised for this Division
        const totalXLM = missions.reduce(
          (sum: number, m: IPost) => sum + (m.CollectedAmount || 0),
          0
        );
        const totalINR = Math.round(totalXLM * XLM_TO_INR_RATE);

        return {
          divisionId: ngo._id,
          name: ngo.NgoName,
          captain: ngo.PublicKey.substring(0, 6) + '...', // Placeholder for Captain name
          missionsCompleted: completedCount,
          totalReiatsuInfused: totalINR,
          rank: 0, // Will be set after sorting
        };
      })
    );

    // Sort by missions completed, then total raised
    leaderboard.sort((a, b) => {
      if (b.missionsCompleted !== a.missionsCompleted) {
        return b.missionsCompleted - a.missionsCompleted;
      }
      return b.totalReiatsuInfused - a.totalReiatsuInfused;
    });

    // Assign rank
    leaderboard.forEach((item, index) => {
      item.rank = index + 1;
    });

    return res
      .status(200)
      .json(new ApiResponse(200, leaderboard, 'leaderboard retrieved successfully'));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, [], 'failed to retrieve leaderboard'));
  }
});

/**
 * Get stats for a specific donor wallet to determine "Soul Badge" eligibility
 */
const getDonorStats = AsyncHandler(async (req: Request, res: Response) => {
  const { walletAddr } = req.params;

  try {
    const donations = await getAllDonation();
    // Simulate filtering by donor wallet part
    const donorDonations = donations.filter(
      (d) => d.currentTxn && walletAddr && d.currentTxn.includes(walletAddr.substring(0, 5))
    );

    const totalXLM = donorDonations.reduce((sum: number, d: any) => sum + (d.Amount || 0), 0);
    const missionCount = new Set(donorDonations.map((d) => d.postIDs)).size;

    let badge = 'Academy Student';
    if (totalXLM > 500) badge = 'Captain';
    else if (totalXLM > 100) badge = 'Lieutenant';
    else if (totalXLM > 20) badge = 'Assistant Reaper';

    const donorInfo = {
      walletAddr,
      totalReiatsu: totalXLM,
      missionsSupported: missionCount,
      currentBadge: badge,
    };

    return res.status(200).json(new ApiResponse(200, donorInfo, 'donor stats retrieved'));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, null, 'failed to get donor stats'));
  }
});

export { getStats, getLeaderboard, getDonorStats };
