import { Request, Response } from 'express';
import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiError } from '../util/apiError.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { getAllDonation } from '../dbQueries/donation.Queries.js';
import { getAllNGOs } from '../dbQueries/ngo.Queries.js';
import { getPosts } from '../dbQueries/post.Queries.js';
import { getXLMtoINRRate } from '../util/exchangeRate.util.js';

const getStats = AsyncHandler(async (req: Request, res: Response) => {
  try {
    const donations = await getAllDonation();
    if (!donations) throw new ApiError(404, 'no donations found');

    const XLM_TO_INR_RATE = await getXLMtoINRRate();

    const totalRaisedXLM = donations.reduce((sum, donation) => {
      return sum + (donation.Amount || 0);
    }, 0);
    const totalRaisedINR = Math.round(totalRaisedXLM * XLM_TO_INR_RATE);

    const uniqueDonors = new Set(donations.map((donation) => donation.currentTxn)).size;

    // Use Vault query instead of Mongoose model
    const allNGOs = await getAllNGOs();
    const verifiedNgos = allNGOs ? allNGOs.length : 0;

    const stats = {
      totalRaised: totalRaisedINR,
      activeDonors: uniqueDonors,
      verifiedNGOs: verifiedNgos,
    };

    return res.status(200).json(new ApiResponse(200, stats, 'stats retrieved successfully'));
  } catch (error) {
    console.error('Error getting stats:', error);
    throw new ApiError(500, 'failed to get stats');
  }
});

const getLeaderboard = AsyncHandler(async (req: Request, res: Response) => {
  try {
    const ngos = await getAllNGOs();
    const allPosts = await getPosts();
    const XLM_TO_INR_RATE = await getXLMtoINRRate();

    const leaderboard = ngos.map((ngo: any) => {
      // Filter posts that belong to this NGO
      const missions = allPosts.filter(
        (p: any) => p.NgoRef === ngo.id || p.NgoRef === ngo._id
      );
      const completedCount = missions.filter((m: any) => m.Status === 'Completed').length;

      const totalXLM = missions.reduce(
        (sum: number, m: any) => sum + (m.CollectedAmount || 0),
        0
      );
      const totalINR = Math.round(totalXLM * XLM_TO_INR_RATE);

      return {
        divisionId: ngo.id,
        name: ngo.name || ngo.NgoName,
        captain: (ngo.walletAddress || ngo.PublicKey || '').substring(0, 6) + '...',
        missionsCompleted: completedCount,
        totalReiatsuInfused: totalINR,
        rank: 0,
      };
    });

    leaderboard.sort((a: any, b: any) => {
      if (b.missionsCompleted !== a.missionsCompleted) {
        return b.missionsCompleted - a.missionsCompleted;
      }
      return b.totalReiatsuInfused - a.totalReiatsuInfused;
    });

    leaderboard.forEach((item: any, index: number) => {
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
