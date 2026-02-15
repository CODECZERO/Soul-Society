import { Request, Response } from 'express';
import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { submitMissionProof, verifyMissionProof } from '../dbQueries/postProof.Queries.js';
import { ApiError } from '../util/apiError.util.js';

import { sealMissionProof } from '../services/stellar/smartContract.handler.stellar.js';

const submitProof = AsyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { submitter, cid } = req.body;

  if (!id || !submitter || !cid) {
    throw new ApiError(400, 'postId, submitter, and cid are required');
  }

  const result = await submitMissionProof(id, submitter, cid);
  return res.status(200).json(new ApiResponse(200, null, result.message));
});

const verifyProof = AsyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { proofIndex, status } = req.body;

  if (!id || proofIndex === undefined || !status) {
    throw new ApiError(400, 'postId, proofIndex, and status are required');
  }

  if (status !== 'Approved' && status !== 'Rejected') {
    throw new ApiError(400, 'Invalid status. Must be Approved or Rejected');
  }

  const result: any = await verifyMissionProof(id, proofIndex, status);

  // Expansion 3.1: Seal proof on-chain if approved
  if (status === 'Approved') {
    try {
      const validatorKey = process.env.CENTRAL_REGISTRY_VALIDATOR_KEY;
      const proof = result.proof;
      if (validatorKey && proof?.Cid && proof?.Submitter) {
        await sealMissionProof(validatorKey, proof.Submitter, id, proof.Cid);
        console.log(`🛡️ Tactical proof for mission ${id} sealed on-chain for reaper ${proof.Submitter}.`);
      }
    } catch (chainError) {
      console.warn('On-chain sealing failed:', chainError);
    }
  }

  return res.status(200).json(new ApiResponse(200, null, result.message));
});

export { submitProof, verifyProof };
