import { Request, Response } from 'express';
import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { saveCommunique, getCommuniquesByDivision } from '../dbQueries/communique.Queries.js';
import { ApiError } from '../util/apiError.util.js';

const createCommunique = AsyncHandler(async (req: Request, res: Response) => {
  const { Title, Content, Type, NgoId } = req.body;

  if (!Title || !Content || !NgoId) {
    throw new ApiError(400, 'Title, Content, and NgoId are required');
  }

  const communique = await saveCommunique({
    Title,
    Content,
    Type,
    NgoRef: NgoId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, communique, 'Communique broadcasted successfully'));
});

const getDivisionCommuniques = AsyncHandler(async (req: Request, res: Response) => {
  const { ngoId } = req.params;

  if (!ngoId) {
    throw new ApiError(400, 'ngoId is required');
  }

  const communiques = await getCommuniquesByDivision(ngoId);
  return res
    .status(200)
    .json(new ApiResponse(200, communiques, 'Communiques retrieved successfully'));
});

export { createCommunique, getDivisionCommuniques };
