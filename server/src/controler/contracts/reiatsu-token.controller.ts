import { Request, Response } from 'express';
import AsyncHandler from '../../util/asyncHandler.util.js';
import { ApiError } from '../../util/apiError.util.js';
import { ApiResponse } from '../../util/apiResponse.util.js';
import { reiatsuTokenService } from '../../services/stellar/reiatsu-token.service.js';

const initialize = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey } = req.body;
  if (!adminKey) throw new ApiError(400, 'Admin key is required');
  const result = await reiatsuTokenService.initialize(adminKey);
  return res.status(200).json(new ApiResponse(200, result, 'Reiatsu Token initialized'));
});

const addMinter = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey, minterAddress } = req.body;
  if (!adminKey || !minterAddress) throw new ApiError(400, 'Admin key and minter address are required');
  const result = await reiatsuTokenService.addMinter(adminKey, minterAddress);
  return res.status(200).json(new ApiResponse(200, result, 'Minter added'));
});

const removeMinter = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey, minterAddress } = req.body;
  if (!adminKey || !minterAddress) throw new ApiError(400, 'Admin key and minter address are required');
  const result = await reiatsuTokenService.removeMinter(adminKey, minterAddress);
  return res.status(200).json(new ApiResponse(200, result, 'Minter removed'));
});

const mint = AsyncHandler(async (req: Request, res: Response) => {
  const { minterKey, toAddress, amount } = req.body;
  if (!minterKey || !toAddress || !amount) throw new ApiError(400, 'Missing required fields');
  const result = await reiatsuTokenService.mint(minterKey, toAddress, BigInt(amount));
  return res.status(200).json(new ApiResponse(200, result, 'Tokens minted'));
});

const burn = AsyncHandler(async (req: Request, res: Response) => {
  const { ownerKey, amount } = req.body;
  if (!ownerKey || !amount) throw new ApiError(400, 'Owner key and amount are required');
  const result = await reiatsuTokenService.burn(ownerKey, BigInt(amount));
  return res.status(200).json(new ApiResponse(200, result, 'Tokens burned'));
});

const transfer = AsyncHandler(async (req: Request, res: Response) => {
  const { fromKey, toAddress, amount } = req.body;
  if (!fromKey || !toAddress || !amount) throw new ApiError(400, 'Missing required fields');
  const result = await reiatsuTokenService.transfer(fromKey, toAddress, BigInt(amount));
  return res.status(200).json(new ApiResponse(200, result, 'Tokens transferred'));
});

const approve = AsyncHandler(async (req: Request, res: Response) => {
  const { ownerKey, spenderAddress, amount } = req.body;
  if (!ownerKey || !spenderAddress || !amount) throw new ApiError(400, 'Missing required fields');
  const result = await reiatsuTokenService.approve(ownerKey, spenderAddress, BigInt(amount));
  return res.status(200).json(new ApiResponse(200, result, 'Approval granted'));
});

const transferFrom = AsyncHandler(async (req: Request, res: Response) => {
  const { spenderKey, fromAddress, toAddress, amount } = req.body;
  if (!spenderKey || !fromAddress || !toAddress || !amount) throw new ApiError(400, 'Missing required fields');
  const result = await reiatsuTokenService.transferFrom(spenderKey, fromAddress, toAddress, BigInt(amount));
  return res.status(200).json(new ApiResponse(200, result, 'Tokens transferred from approved'));
});

const stake = AsyncHandler(async (req: Request, res: Response) => {
  const { userKey, amount } = req.body;
  if (!userKey || !amount) throw new ApiError(400, 'User key and amount are required');
  const result = await reiatsuTokenService.stake(userKey, BigInt(amount));
  return res.status(200).json(new ApiResponse(200, result, 'Tokens staked'));
});

const unstake = AsyncHandler(async (req: Request, res: Response) => {
  const { userKey, amount } = req.body;
  if (!userKey || !amount) throw new ApiError(400, 'User key and amount are required');
  const result = await reiatsuTokenService.unstake(userKey, BigInt(amount));
  return res.status(200).json(new ApiResponse(200, result, 'Tokens unstaked'));
});

const claimRewards = AsyncHandler(async (req: Request, res: Response) => {
  const { userKey } = req.body;
  if (!userKey) throw new ApiError(400, 'User key is required');
  const result = await reiatsuTokenService.claimRewards(userKey);
  return res.status(200).json(new ApiResponse(200, result, 'Rewards claimed'));
});

const lock = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey, targetAddress, amount, unlockAt } = req.body;
  if (!adminKey || !targetAddress || !amount || !unlockAt) throw new ApiError(400, 'Missing required fields');
  const result = await reiatsuTokenService.lock(adminKey, targetAddress, BigInt(amount), BigInt(unlockAt));
  return res.status(200).json(new ApiResponse(200, result, 'Tokens locked'));
});

const unlock = AsyncHandler(async (req: Request, res: Response) => {
  const { userKey } = req.body;
  if (!userKey) throw new ApiError(400, 'User key is required');
  const result = await reiatsuTokenService.unlock(userKey);
  return res.status(200).json(new ApiResponse(200, result, 'Tokens unlocked'));
});

const balance = AsyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!address) throw new ApiError(400, 'Address is required');
  const bal = await reiatsuTokenService.balance(address);
  return res.status(200).json(new ApiResponse(200, { balance: bal.toString() }, 'Balance retrieved'));
});

const staked = AsyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!address) throw new ApiError(400, 'Address is required');
  const stakedAmount = await reiatsuTokenService.staked(address);
  return res.status(200).json(new ApiResponse(200, { staked: stakedAmount.toString() }, 'Staked amount retrieved'));
});

const totalSupply = AsyncHandler(async (req: Request, res: Response) => {
  const supply = await reiatsuTokenService.totalSupply();
  return res.status(200).json(new ApiResponse(200, { totalSupply: supply.toString() }, 'Total supply retrieved'));
});

const locked = AsyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!address) throw new ApiError(400, 'Address is required');
  const lockedAmount = await reiatsuTokenService.locked(address);
  return res.status(200).json(new ApiResponse(200, { locked: lockedAmount.toString() }, 'Locked amount retrieved'));
});

const pendingRewards = AsyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!address) throw new ApiError(400, 'Address is required');
  const rewards = await reiatsuTokenService.pendingRewards(address);
  return res.status(200).json(new ApiResponse(200, { pendingRewards: rewards.toString() }, 'Pending rewards retrieved'));
});

const allowance = AsyncHandler(async (req: Request, res: Response) => {
  const { ownerAddress, spenderAddress } = req.params;
  if (!ownerAddress || !spenderAddress) throw new ApiError(400, 'Owner and spender addresses are required');
  const allowed = await reiatsuTokenService.allowance(ownerAddress, spenderAddress);
  return res.status(200).json(new ApiResponse(200, { allowance: allowed.toString() }, 'Allowance retrieved'));
});

export {
  initialize,
  addMinter,
  removeMinter,
  mint,
  burn,
  transfer,
  approve,
  transferFrom,
  stake,
  unstake,
  claimRewards,
  lock,
  unlock,
  balance,
  staked,
  totalSupply,
  locked,
  pendingRewards,
  allowance
};
