import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { enlistMember, getDivisionMembers } from '../dbQueries/recruitment.Queries.js';
import { ApiError } from '../util/apiError.util.js';
const joinDivision = AsyncHandler(async (req, res) => {
    const { ngoId, walletAddr } = req.body;
    if (!ngoId || !walletAddr) {
        throw new ApiError(400, 'ngoId and walletAddr are required');
    }
    const result = await enlistMember(ngoId, walletAddr);
    if (!result.success) {
        return res.status(400).json(new ApiResponse(400, null, result.message));
    }
    return res.status(200).json(new ApiResponse(200, null, 'Enlistment successful'));
});
const getMembers = AsyncHandler(async (req, res) => {
    const { ngoId } = req.params;
    if (!ngoId) {
        throw new ApiError(400, 'ngoId is required');
    }
    const members = await getDivisionMembers(ngoId);
    return res.status(200).json(new ApiResponse(200, members, 'Members retrieved successfully'));
});
export { joinDivision, getMembers };
//# sourceMappingURL=recruitment.controler.js.map