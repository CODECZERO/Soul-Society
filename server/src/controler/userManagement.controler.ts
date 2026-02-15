import { Request, Response } from 'express';
import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiError } from '../util/apiError.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { findUser, getPrivateKey } from '../dbQueries/user.Queries.js';

export interface FindUserRequest {
  email?: string;
  id?: string;
}

export interface GetPrivateKeyRequest {
  userId: string;
}

// Find user by email or ID
const findUserById = AsyncHandler(async (req: Request, res: Response) => {
  const { email, id } = req.query as FindUserRequest;
  if (!email && !id) throw new ApiError(400, 'Email or ID is required');

  // Build query object with only defined values
  const query: any = {};
  if (email) query.email = email;
  if (id) query.Id = id;

  const user = await findUser(query);
  if (!user || user.length === 0) throw new ApiError(404, 'User not found');

  return res.status(200).json(new ApiResponse(200, user, 'User found'));
});

// Get user's private key (admin only - should be protected)
const getUserPrivateKey = AsyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) throw new ApiError(400, 'User ID is required');

  const privateKey = await getPrivateKey(userId);
  if (!privateKey) throw new ApiError(404, 'Private key not found');

  return res.status(200).json(new ApiResponse(200, { privateKey }, 'Private key retrieved'));
});

export { findUserById, getUserPrivateKey };
