import { Request, Response } from 'express';
import AsyncHandler from '../../util/asyncHandler.util.js';
import { ApiError } from '../../util/apiError.util.js';
import { ApiResponse } from '../../util/apiResponse.util.js';
import { seireiteiVault } from '../../services/stellar/seireiteiVault.service.js';

const put = AsyncHandler(async (req: Request, res: Response) => {
  const { collection, id, data } = req.body;
  if (!collection || !id || !data) throw new ApiError(400, 'Collection, ID, and data are required');
  await seireiteiVault.put(collection, id, data);
  return res.status(200).json(new ApiResponse(200, null, 'Data stored'));
});

const get = AsyncHandler(async (req: Request, res: Response) => {
  const { collection, id } = req.params;
  if (!collection || !id) throw new ApiError(400, 'Collection and ID are required');
  const data = await seireiteiVault.get(collection, id);
  return res.status(200).json(new ApiResponse(200, data, 'Data retrieved'));
});

const getMeta = AsyncHandler(async (req: Request, res: Response) => {
  const { collection, id } = req.params;
  if (!collection || !id) throw new ApiError(400, 'Collection and ID are required');
  const meta = await seireiteiVault.getMeta(collection, id);
  return res.status(200).json(new ApiResponse(200, meta, 'Metadata retrieved'));
});

const getDeltas = AsyncHandler(async (req: Request, res: Response) => {
  const { collection, id } = req.params;
  if (!collection || !id) throw new ApiError(400, 'Collection and ID are required');
  const deltas = await seireiteiVault.getDeltas(collection, id);
  return res.status(200).json(new ApiResponse(200, deltas, 'Deltas retrieved'));
});

const bloomCheck = AsyncHandler(async (req: Request, res: Response) => {
  const { collection, id } = req.params;
  if (!collection || !id) throw new ApiError(400, 'Collection and ID are required');
  const exists = await seireiteiVault.bloomCheck(collection, id);
  return res.status(200).json(new ApiResponse(200, { exists }, 'Bloom check result'));
});

const has = AsyncHandler(async (req: Request, res: Response) => {
  const { collection, id } = req.params;
  if (!collection || !id) throw new ApiError(400, 'Collection and ID are required');
  const exists = await seireiteiVault.has(collection, id);
  return res.status(200).json(new ApiResponse(200, { exists }, 'Existence check result'));
});

const getIndex = AsyncHandler(async (req: Request, res: Response) => {
  const { collection } = req.params;
  if (!collection) throw new ApiError(400, 'Collection is required');
  const index = await seireiteiVault.getIndex(collection);
  return res.status(200).json(new ApiResponse(200, index, 'Index retrieved'));
});

const getStats = AsyncHandler(async (req: Request, res: Response) => {
  const stats = await seireiteiVault.getStats();
  return res.status(200).json(new ApiResponse(200, stats, 'Stats retrieved'));
});

const migrateToCold = AsyncHandler(async (req: Request, res: Response) => {
  const { collection, id } = req.body;
  if (!collection || !id) throw new ApiError(400, 'Collection and ID are required');
  const result = await seireiteiVault.migrateToCold(collection, id);
  return res.status(200).json(new ApiResponse(200, result, 'Entry migrated to cold storage'));
});

const deleteEntry = AsyncHandler(async (req: Request, res: Response) => {
  const { collection, id } = req.body;
  if (!collection || !id) throw new ApiError(400, 'Collection and ID are required');
  const result = await seireiteiVault.delete(collection, id);
  return res.status(200).json(new ApiResponse(200, result, 'Entry deleted'));
});

export {
  put,
  get,
  getMeta,
  getDeltas,
  bloomCheck,
  has,
  getIndex,
  getStats,
  migrateToCold,
  deleteEntry
};
