import { Request, Response } from 'express';
import AsyncHandler from '../../util/asyncHandler.util.js';
import { ApiError } from '../../util/apiError.util.js';
import { ApiResponse } from '../../util/apiResponse.util.js';
import { missionRegistryService } from '../../services/stellar/mission-registry.service.js';

const initialize = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey } = req.body;
  if (!adminKey) throw new ApiError(400, 'Admin key is required');
  const result = await missionRegistryService.initialize(adminKey);
  return res.status(200).json(new ApiResponse(200, result, 'Mission Registry initialized'));
});

const setBadgeContract = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey, badgeContractAddress } = req.body;
  if (!adminKey || !badgeContractAddress) throw new ApiError(400, 'Admin key and badge contract address are required');
  const result = await missionRegistryService.setBadgeContract(adminKey, badgeContractAddress);
  return res.status(200).json(new ApiResponse(200, result, 'Badge contract set'));
});

const setTokenContract = AsyncHandler(async (req: Request, res: Response) => {
  const { adminKey, tokenContractAddress } = req.body;
  if (!adminKey || !tokenContractAddress) throw new ApiError(400, 'Admin key and token contract address are required');
  const result = await missionRegistryService.setTokenContract(adminKey, tokenContractAddress);
  return res.status(200).json(new ApiResponse(200, result, 'Token contract set'));
});

const registerMission = AsyncHandler(async (req: Request, res: Response) => {
  const { captainKey, missionId, title, dangerLevel, deadline } = req.body;
  if (!captainKey || !missionId || !title || dangerLevel === undefined) throw new ApiError(400, 'Missing required fields');
  const result = await missionRegistryService.registerMission(captainKey, missionId, title, dangerLevel, deadline);
  return res.status(200).json(new ApiResponse(200, result, 'Mission registered'));
});

const advanceStatus = AsyncHandler(async (req: Request, res: Response) => {
  const { captainKey, missionId } = req.body;
  if (!captainKey || !missionId) throw new ApiError(400, 'Captain key and mission ID are required');
  const result = await missionRegistryService.advanceStatus(captainKey, missionId);
  return res.status(200).json(new ApiResponse(200, result, 'Mission status advanced'));
});

const sealProof = AsyncHandler(async (req: Request, res: Response) => {
  const { validatorKey, reaperAddress, missionId, proofCid } = req.body;
  if (!validatorKey || !reaperAddress || !missionId || !proofCid) throw new ApiError(400, 'Missing required fields');
  const result = await missionRegistryService.sealProof(validatorKey, reaperAddress, missionId, proofCid);
  return res.status(200).json(new ApiResponse(200, result, 'Proof sealed'));
});

const failMission = AsyncHandler(async (req: Request, res: Response) => {
  const { callerKey, missionId } = req.body;
  if (!callerKey || !missionId) throw new ApiError(400, 'Caller key and mission ID are required');
  const result = await missionRegistryService.failMission(callerKey, missionId);
  return res.status(200).json(new ApiResponse(200, result, 'Mission failed'));
});

const getMission = AsyncHandler(async (req: Request, res: Response) => {
  const { missionId } = req.params;
  if (!missionId) throw new ApiError(400, 'Mission ID is required');
  const mission = await missionRegistryService.getMission(missionId);
  return res.status(200).json(new ApiResponse(200, mission, 'Mission retrieved'));
});

const getProof = AsyncHandler(async (req: Request, res: Response) => {
  const { missionId } = req.params;
  if (!missionId) throw new ApiError(400, 'Mission ID is required');
  const proof = await missionRegistryService.getProof(missionId);
  return res.status(200).json(new ApiResponse(200, proof, 'Proof retrieved'));
});

const getCounter = AsyncHandler(async (req: Request, res: Response) => {
  const counter = await missionRegistryService.getCounter();
  return res.status(200).json(new ApiResponse(200, counter, 'Counter retrieved'));
});

const getMissionsByCaptain = AsyncHandler(async (req: Request, res: Response) => {
  const { captainAddress } = req.params;
  if (!captainAddress) throw new ApiError(400, 'Captain address is required');
  const missions = await missionRegistryService.getMissionsByCaptain(captainAddress);
  return res.status(200).json(new ApiResponse(200, missions, 'Missions retrieved'));
});

const getValidators = AsyncHandler(async (req: Request, res: Response) => {
  const { missionId } = req.params;
  if (!missionId) throw new ApiError(400, 'Mission ID is required');
  const validators = await missionRegistryService.getValidators(missionId);
  return res.status(200).json(new ApiResponse(200, validators, 'Validators retrieved'));
});

export {
  initialize,
  setBadgeContract,
  setTokenContract,
  registerMission,
  advanceStatus,
  sealProof,
  failMission,
  getMission,
  getProof,
  getCounter,
  getMissionsByCaptain,
  getValidators
};
