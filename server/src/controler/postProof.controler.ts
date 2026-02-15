import { Request, Response } from 'express';
import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { submitMissionProof, verifyMissionProof } from '../dbQueries/postProof.Queries.js';
import { ApiError } from '../util/apiError.util.js';

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

  const result = await verifyMissionProof(id, proofIndex, status);
  return res.status(200).json(new ApiResponse(200, null, result.message));
});

export { submitProof, verifyProof };
