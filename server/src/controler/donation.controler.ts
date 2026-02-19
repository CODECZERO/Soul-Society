import { nanoid } from 'nanoid';
import { Request, Response } from 'express';
import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiError } from '../util/apiError.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';

import {
  getDonation,
  getAllDonation,
  getDonationRelatedToPost,
  createDonation,
  getDonationsByDonor,
} from '../dbQueries/donation.Queries.js';
import { escrowService } from '../services/stellar/escrow.service.js';
import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';
import { reiatsuTokenService } from '../services/stellar/reiatsu-token.service.js';
import { soulBadgeService } from '../services/stellar/soul-badge.service.js';
import { STACK_ADMIN_SECRET } from '../services/stellar/smartContract.handler.stellar.js';
import { verfiyTransaction } from '../services/stellar/transcation.stellar.js';
import logger from '../util/logger.js';

export interface GetDonationRequest {
  transactionId: string;
}

export interface GetDonationsByPostRequest {
  postId: string;
}

// Get specific donation by transaction ID
const getDonationById = AsyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  if (!transactionId) throw new ApiError(400, 'Transaction ID is required');

  const donation = await getDonation(transactionId);
  if (!donation) throw new ApiError(404, 'Donation not found');

  return res.status(200).json(new ApiResponse(200, donation, 'Donation retrieved successfully'));
});

// Get all donations
const getAllDonations = AsyncHandler(async (req: Request, res: Response) => {
  const donations = await getAllDonation();
  if (!donations) throw new ApiError(404, 'No donations found');

  return res.status(200).json(new ApiResponse(200, donations, 'All donations retrieved'));
});

// Get donations related to a specific post
const getDonationsByPost = AsyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  if (!postId) throw new ApiError(400, 'Post ID is required');

  const donations = await getDonationRelatedToPost(postId);

  // Return empty array instead of 404 — no donations is normal, not an error
  return res.status(200).json(new ApiResponse(200, donations || [], 'Post donations retrieved'));
});

// ─── Create Escrow XDR ─────────────────────────────────────────────

const getEscrowXdr = AsyncHandler(async (req: Request, res: Response) => {
  const { donorPublicKey, ngoPublicKey, totalAmount, lockedAmount, taskId, deadline } = req.body;

  if (!donorPublicKey || !ngoPublicKey || !totalAmount || !lockedAmount || !taskId || !deadline) {
    throw new ApiError(400, 'All fields required: donorPublicKey, ngoPublicKey, totalAmount, lockedAmount, taskId, deadline');
  }

  // Generate a unique ID for this specific escrow record to prevent contract "Already exists" panic
  // Format: task-nanoid
  const escrowId = `${taskId}-${nanoid(6)}`;

  const xdr = await escrowService.buildCreateEscrowTx(
    donorPublicKey,
    ngoPublicKey,
    Number(totalAmount),
    Number(lockedAmount),
    escrowId, // Pass the unique ID as the contract taskId
    Number(deadline)
  );

  return res.status(200).json(new ApiResponse(200, { xdr, escrowId }, 'Escrow creation XDR generated'));
});

// ─── Save Donation Record ──────────────────────────────────────────

const createNewDonation = AsyncHandler(async (req: Request, res: Response) => {
  const {
    transactionId, TransactionId,
    donorId, Donor,
    postId, postID,
    amount, Amount,
    escrowId // Unique ID used for the contract storage key
  } = req.body;

  const tId = transactionId || TransactionId;
  const dId = donorId || Donor;
  const pId = postId || postID;
  const amt = amount || Amount;

  if (!tId || !dId || !pId || !amt) {
    throw new ApiError(400, 'All fields required (transactionId, donorId, postId, amount)');
  }

  // Use normalized variables
  const finalId = tId;
  const finalDonor = dId;
  const finalPost = pId;
  const finalAmount = Number(amt);

  // 1. Check if already recorded (Database)
  const existing = await getDonation(finalId);
  if (existing) {
    return res.status(200).json(new ApiResponse(200, existing, 'Donation already recorded'));
  }

  // 2. Verify on Stellar Network (Security Check)
  const onChainTx = await verfiyTransaction(finalId);
  if (!onChainTx) {
    throw new ApiError(401, 'Transaction not found on Stellar network. Please wait a few seconds and try again.');
  }

  // 3. Save Donation Record (Vault)
  const result = await createDonation({
    TransactionId: finalId,
    Donor: finalDonor,
    postID: finalPost,
    Amount: finalAmount,
    EscrowId: escrowId, // Store the unique escrow ID for later release/dispute
  } as any);

  // 4 & 5. Background on-chain audit log and Rewards (Sequential to avoid txBadSeq)
  (async () => {
    try {
      logger.info(`[BACKGROUND-TASKS] Starting for donation ${finalId} by ${finalDonor}`);

      // 1. Audit Log
      await seireiteiVault.put('DonationAudit', finalId, {
        TransactionId: finalId,
        Donor: finalDonor,
        PostId: finalPost,
        Amount: finalAmount,
        EscrowId: escrowId,
        Timestamp: new Date().toISOString()
      });
      logger.info(`[BACKGROUND-TASKS] Audit log saved in Vault for ${finalId}`);

      // 2. Mint Reiatsu Tokens (Reward: 10 Tokens per 1 XLM donated)
      const tokenAmount = BigInt(Math.floor(finalAmount * 10));
      if (tokenAmount > 0n) {
        logger.info(`[REWARDS] Preparing to mint ${tokenAmount} ReiatsuTokens for ${finalDonor}`);
        const mintResult = await reiatsuTokenService.mint(STACK_ADMIN_SECRET, finalDonor, tokenAmount);
        logger.info(`[REWARDS] Minted ${tokenAmount} ReiatsuTokens to ${finalDonor}: ${mintResult.hash}`);
      } else {
        logger.warn(`[REWARDS] Token amount too small to mint: ${tokenAmount} (Amount: ${finalAmount} XLM)`);
      }

      // 3. Check Badge Milestone eligibility
      const allDonorDonations = await getDonationsByDonor(finalDonor);
      const totalDonated = allDonorDonations.reduce((sum: number, d: any) => sum + (d.Amount || 0), 0);
      logger.info(`[REWARDS] Total donated by ${finalDonor}: ${totalDonated} XLM`);

      // Thresholds matching soul-badge logic
      let targetRank = '';
      if (totalDonated >= 500) targetRank = 'Captain';
      else if (totalDonated >= 100) targetRank = 'Lieutenant';
      else if (totalDonated >= 20) targetRank = 'Assistant Reaper';

      if (targetRank) {
        logger.info(`[REWARDS] ${finalDonor} eligible for rank: ${targetRank}`);
        // Verify if badge already exists on-chain
        const hasBadge = await soulBadgeService.verifyBadge(finalDonor, `RANK_${targetRank}`);
        if (!hasBadge) {
          logger.info(`[REWARDS] Minting ${targetRank} badge for ${finalDonor}`);
          const badgeResult = await soulBadgeService.mint(finalDonor, `RANK_${targetRank}`, targetRank);
          logger.info(`[REWARDS] Minted ${targetRank} badge for ${finalDonor}: ${badgeResult.hash}`);
        } else {
          logger.info(`[REWARDS] ${finalDonor} already has ${targetRank} badge.`);
        }
      } else {
        logger.info(`[REWARDS] ${finalDonor} does not yet meet threshold for next rank.`);
      }
    } catch (err) {
      logger.error('[BACKGROUND-TASKS] Automated on-chain update failed:', err);
    }
  })();

  return res.status(201).json(new ApiResponse(201, result, 'Donation recorded and rewards queued'));
});

export {
  getDonationById,
  getAllDonations,
  getDonationsByPost,
  getEscrowXdr,
  createNewDonation
};
