import { Request, Response } from 'express';
import AsyncHandler from '../../util/asyncHandler.util.js';
import { ApiError } from '../../util/apiError.util.js';
import { ApiResponse } from '../../util/apiResponse.util.js';
import { soulReaperRegistryService } from '../../services/stellar/soul-reaper-registry.service.js';

const initialize = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey } = req.body;
  if (!adminKey) throw new ApiError(400, 'Admin key is required');
  const result = await soulReaperRegistryService.initialize(adminKey);
  return res.status(200).json(new ApiResponse(200, result, 'Soul Reaper Registry initialized'));
});

const register = AsyncHandler(async (req: Request, res: Response) => {
  const { ownerKey, name, division, rank, powerLevel } = req.body;
  if (!ownerKey || !name || !division || !rank || powerLevel === undefined) throw new ApiError(400, 'Missing required fields');
  const result = await soulReaperRegistryService.register(ownerKey, name, division, rank, powerLevel);
  return res.status(200).json(new ApiResponse(200, result, 'Reaper registered'));
});

const updatePower = AsyncHandler(async (req: Request, res: Response) => {
  const { ownerKey, newPower } = req.body;
  if (!ownerKey || newPower === undefined) throw new ApiError(400, 'Owner key and new power are required');
  const result = await soulReaperRegistryService.updatePower(ownerKey, newPower);
  return res.status(200).json(new ApiResponse(200, result, 'Power updated'));
});

const promote = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey, ownerAddress, newRank } = req.body;
  if (!adminKey || !ownerAddress || !newRank) throw new ApiError(400, 'Missing required fields');
  const result = await soulReaperRegistryService.promote(adminKey, ownerAddress, newRank);
  return res.status(200).json(new ApiResponse(200, result, 'Reaper promoted'));
});

const suspend = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey, ownerAddress } = req.body;
  if (!adminKey || !ownerAddress) throw new ApiError(400, 'Admin key and owner address are required');
  const result = await soulReaperRegistryService.suspend(adminKey, ownerAddress);
  return res.status(200).json(new ApiResponse(200, result, 'Reaper suspended'));
});

const reinstate = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey, ownerAddress } = req.body;
  if (!adminKey || !ownerAddress) throw new ApiError(400, 'Admin key and owner address are required');
  const result = await soulReaperRegistryService.reinstate(adminKey, ownerAddress);
  return res.status(200).json(new ApiResponse(200, result, 'Reaper reinstated'));
});

const setDivisionCapacity = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey, division, capacity } = req.body;
  if (!adminKey || !division || !capacity) throw new ApiError(400, 'Missing required fields');
  const result = await soulReaperRegistryService.setDivisionCapacity(adminKey, division, capacity);
  return res.status(200).json(new ApiResponse(200, result, 'Division capacity set'));
});

const getReaper = AsyncHandler(async (req: Request, res: Response) => {
  const { ownerAddress } = req.params;
  if (!ownerAddress) throw new ApiError(400, 'Owner address is required');
  const reaper = await soulReaperRegistryService.getReaper(ownerAddress);
  return res.status(200).json(new ApiResponse(200, reaper, 'Reaper retrieved'));
});

const getByDivision = AsyncHandler(async (req: Request, res: Response) => {
  const { division } = req.params;
  if (!division) throw new ApiError(400, 'Division is required');
  const reapers = await soulReaperRegistryService.getByDivision(parseInt(division));
  return res.status(200).json(new ApiResponse(200, reapers, 'Reapers retrieved'));
});

const getAll = AsyncHandler(async (req: Request, res: Response) => {
  const reapers = await soulReaperRegistryService.getAll();
  return res.status(200).json(new ApiResponse(200, reapers, 'All reapers retrieved'));
});

const getPowerHistory = AsyncHandler(async (req: Request, res: Response) => {
  const { ownerAddress } = req.params;
  if (!ownerAddress) throw new ApiError(400, 'Owner address is required');
  const history = await soulReaperRegistryService.getPowerHistory(ownerAddress);
  return res.status(200).json(new ApiResponse(200, history, 'Power history retrieved'));
});

const totalReapers = AsyncHandler(async (req: Request, res: Response) => {
  const total = await soulReaperRegistryService.totalReapers();
  return res.status(200).json(new ApiResponse(200, { total }, 'Total reapers retrieved'));
});

export {
  initialize,
  register,
  updatePower,
  promote,
  suspend,
  reinstate,
  setDivisionCapacity,
  getReaper,
  getByDivision,
  getAll,
  getPowerHistory,
  totalReapers
};
