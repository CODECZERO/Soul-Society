import { Request, Response } from 'express';
import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { getDonationsByDonor } from '../dbQueries/donation.Queries.js';
import { getPosts } from '../dbQueries/post.Queries.js';
import { ApiError } from '../util/apiError.util.js';
import { reiatsuTokenService } from '../services/stellar/reiatsu-token.service.js';
import { soulBadgeService } from '../services/stellar/soul-badge.service.js';

const getUserProfile = AsyncHandler(async (req: Request, res: Response) => {
  const { walletAddr } = req.params;

  if (!walletAddr) {
    throw new ApiError(400, 'walletAddr is required');
  }

  // 1. Get total donations (Spiritual Power)
  const donationsRaw = await getDonationsByDonor(walletAddr);
  const donations = Array.isArray(donationsRaw) ? donationsRaw : (donationsRaw ? [donationsRaw] : []);
  const totalReiatsu = donations.reduce((acc: number, curr: any) => acc + (curr.Amount || 0), 0);

  // 2. Get mission proofs (Missions Completed)
  // We search Vault posts for proofs submitted by this wallet
  const allPosts = await getPosts();
  const completedMissions = allPosts.filter((post: any) => {
    if (!post.Proofs || !Array.isArray(post.Proofs)) return false;
    return post.Proofs.some(
      (proof: any) => proof.Submitter === walletAddr && proof.Status === 'Approved'
    );
  });

  // 3. Get On-Chain Data (Soroban)
  let onChainStats = {
    reiatsuBalance: "0",
    badges: [] as any[]
  };

  try {
    const rawBalance = await reiatsuTokenService.balance(walletAddr);
    onChainStats.reiatsuBalance = rawBalance.toString();

    const rawBadges = await soulBadgeService.getBadges(walletAddr);
    onChainStats.badges = Array.isArray(rawBadges) ? rawBadges : [];
  } catch (err) {
    console.warn('[SOROBAN] Failed to fetch on-chain profile data:', err);
  }

  // 4. Determine Rank (Harmonized with donation thresholds)
  let rank = 'Academy Student';
  if (totalReiatsu >= 500) rank = 'Captain';
  else if (totalReiatsu >= 100) rank = 'Lieutenant';
  else if (totalReiatsu >= 20) rank = 'Assistant Reaper';

  const profileData = {
    walletAddr,
    rank,
    totalReiatsu,
    onChainReiatsu: onChainStats.reiatsuBalance,
    onChainBadges: onChainStats.badges,
    isVerifiedOnChain: onChainStats.badges.length > 0,
    missionsCompletedCount: completedMissions.length,
    completedMissions: completedMissions.map((m: any) => ({
      id: m._id,
      title: m.Title,
      dangerLevel: m.DangerLevel,
    })),
    recentInfusions: donations.slice(-5).map((d: any) => ({
      amount: d.Amount,
      date: d.createdAt,
      txn: d.currentTxn,
    })),
  };

  return res.status(200).json(new ApiResponse(200, profileData, 'Profile retrieved successfully'));
});

export { getUserProfile };
