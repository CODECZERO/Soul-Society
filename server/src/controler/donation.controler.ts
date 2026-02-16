import { Request, Response } from 'express';
import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiError } from '../util/apiError.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';

import {
  getDonation,
  getAllDonation,
  getDonationRelatedToPost,
  createDonation,
} from '../dbQueries/donation.Queries.js';
import { escrowService } from '../services/stellar/escrow.service.js';
import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';

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
  if (!donations) throw new ApiError(404, 'No donations found for this post');

  return res.status(200).json(new ApiResponse(200, donations, 'Post donations retrieved'));
});

// ─── Create Escrow XDR ─────────────────────────────────────────────

const getEscrowXdr = AsyncHandler(async (req: Request, res: Response) => {
  const { donorPublicKey, ngoPublicKey, totalAmount, lockedAmount, taskId, deadline } = req.body;

  if (!donorPublicKey || !ngoPublicKey || !totalAmount || !lockedAmount || !taskId || !deadline) {
    throw new ApiError(400, 'All fields required: donorPublicKey, ngoPublicKey, totalAmount, lockedAmount, taskId, deadline');
  }

  const xdr = await escrowService.buildCreateEscrowTx(
    donorPublicKey,
    ngoPublicKey,
    Number(totalAmount),
    Number(lockedAmount),
    taskId,
    Number(deadline)
  );

  return res.status(200).json(new ApiResponse(200, { xdr }, 'Escrow creation XDR generated'));
});

// ─── Save Donation Record ──────────────────────────────────────────

const createNewDonation = AsyncHandler(async (req: Request, res: Response) => {
  const { transactionId, donorId, postId, amount } = req.body;
  if (!transactionId || !donorId || !postId || !amount) {
    throw new ApiError(400, 'All fields required');
  }

  const result = await createDonation({
    TransactionId: transactionId,
    Donor: donorId,
    postID: postId,
    Amount: amount,
  } as any); // Cast as any or match the interface exactly if available

  // Background on-chain audit log (Non-blocking)
  seireiteiVault.put('DonationAudit', transactionId, {
    TransactionId: transactionId,
    Donor: donorId,
    PostId: postId,
    Amount: amount,
    Timestamp: new Date().toISOString()
  }).catch(err => console.warn('[VAULT] Donation audit log failed:', err));

  return res.status(201).json(new ApiResponse(201, result, 'Donation record created'));
});

export {
  getDonationById,
  getAllDonations,
  getDonationsByPost,
  getEscrowXdr,
  createNewDonation
};
