import { Request, Response } from 'express';
import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiError } from '../util/apiError.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { getAllDonation } from '../dbQueries/donation.Queries.js';
import { getAllNGOs } from '../dbQueries/ngo.Queries.js';
import { getPosts } from '../dbQueries/post.Queries.js';
import { getXLMtoINRRate } from '../util/exchangeRate.util.js';
import { getAllExpenses } from '../dbQueries/expense.Queries.js';

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

/**
 * Get leaderboard of individual contributors (donors)
 * Optionally filtered by NGO ID
 */
const getContributorLeaderboard = AsyncHandler(async (req: Request, res: Response) => {
  const { ngoId } = req.query;

  try {
    const allDonations = await getAllDonation();
    const allPosts = await getPosts();
    const XLM_TO_INR_RATE = await getXLMtoINRRate();

    let filteredDonations = allDonations;
    if (ngoId) {
      const ngoPostIds = allPosts
        .filter((p: any) => p.ngo === ngoId || p.NgoRef === ngoId)
        .map((p: any) => p.id || p._id);

      filteredDonations = allDonations.filter((d: any) => ngoPostIds.includes(d.postIDs));
    }

    const donorStats: Record<string, { wallet: string, totalAmount: number, missionCount: Set<string> }> = {};

    filteredDonations.forEach((d: any) => {
      const donor = d.Donor || (d.currentTxn && d.currentTxn.length > 20 ? d.currentTxn : 'Anonymous');
      if (!donorStats[donor]) {
        donorStats[donor] = {
          wallet: donor,
          totalAmount: 0,
          missionCount: new Set()
        };
      }
      donorStats[donor].totalAmount += (d.Amount || 0);
      if (d.postIDs) donorStats[donor].missionCount.add(d.postIDs);
    });

    const leaderboard = Object.values(donorStats)
      .map((donor: any) => ({
        wallet: donor.wallet,
        totalDonatedINR: Math.round(donor.totalAmount * XLM_TO_INR_RATE),
        missionsSupported: donor.missionCount.size
      }))
      .sort((a, b) => b.totalDonatedINR - a.totalDonatedINR)
      .slice(0, 50)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    return res.status(200).json(new ApiResponse(200, leaderboard, 'contributor leaderboard retrieved successfully'));
  } catch (error) {
    console.error('Error getting contributor leaderboard:', error);
    throw new ApiError(500, 'failed to get contributor leaderboard');
  }
});

/**
 * Get detailed stats for a specific NGO
 */
const getNGOStats = AsyncHandler(async (req: Request, res: Response) => {
  const { ngoId } = req.params;
  if (!ngoId) throw new ApiError(400, "NGO ID is required");

  try {
    const allDonations = await getAllDonation();
    const allExpenses = await getAllExpenses();
    const allPosts = await getPosts();
    const XLM_TO_INR_RATE = await getXLMtoINRRate();

    const ngoPosts = allPosts.filter((p: any) => p.ngo === ngoId || p.NgoRef === ngoId);
    const ngoPostIds = ngoPosts.map((p: any) => p.id || p._id);

    const ngoDonations = allDonations.filter((d: any) => ngoPostIds.includes(d.postIDs));
    const ngoExpenses = allExpenses.filter((e: any) => ngoPostIds.includes(e.postIDs));

    const totalRaisedXLM = ngoDonations.reduce((sum: number, d: any) => sum + (d.Amount || 0), 0);
    const totalSpentXLM = ngoExpenses.reduce((sum: number, e: any) => sum + (e.Amount || 0), 0);

    const totalRaisedINR = Math.round(totalRaisedXLM * XLM_TO_INR_RATE);
    const totalSpentINR = Math.round(totalSpentXLM * XLM_TO_INR_RATE);

    // Monthly Data for Chart (last 6 months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const chartData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonth - i);
      const monthName = months[d.getMonth()];
      const monthNum = d.getMonth();
      const year = d.getFullYear();

      const monthDonations = ngoDonations.filter(don => {
        const date = new Date(don.createdAt);
        return date.getMonth() === monthNum && date.getFullYear() === year;
      }).reduce((sum, don) => sum + (don.Amount || 0), 0);

      const monthExpenses = ngoExpenses.filter(exp => {
        const date = new Date(exp.createdAt);
        return date.getMonth() === monthNum && date.getFullYear() === year;
      }).reduce((sum, exp) => sum + (exp.Amount || 0), 0);

      chartData.push({
        name: monthName,
        donations: Math.round(monthDonations * XLM_TO_INR_RATE),
        expenses: Math.round(monthExpenses * XLM_TO_INR_RATE)
      });
    }

    const stats = {
      totalRaised: totalRaisedINR,
      totalSpent: totalSpentINR,
      remainingBalance: totalRaisedINR - totalSpentINR,
      activeTasks: ngoPosts.filter((p: any) => p.Status !== 'Completed').length,
      chartData
    };

    return res.status(200).json(new ApiResponse(200, stats, 'NGO stats retrieved successfully'));
  } catch (error) {
    console.error('Error getting NGO stats:', error);
    throw new ApiError(500, 'failed to get NGO stats');
  }
});

export { getStats, getLeaderboard, getDonorStats, getContributorLeaderboard, getNGOStats };
