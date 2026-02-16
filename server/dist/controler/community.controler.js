import AsyncHandler from '../util/asyncHandler.util.js';
import { ApiError } from '../util/apiError.util.js';
import { ApiResponse } from '../util/apiResponse.util.js';
import { submitCommunityVote, getTaskVotes, submitWorkProof, getTaskProofs, voteOnProof, findProofByHash, getVoterStats, getCommunityLeaderboard, } from '../dbQueries/community.Queries.js';
import { escrowService } from '../services/stellar/escrow.service.js';
// ─── Vote on Task Authenticity ─────────────────────────────────────
const voteOnTask = AsyncHandler(async (req, res) => {
    const { taskId, voterWallet, isScam, reason } = req.body;
    if (!taskId || !voterWallet || isScam === undefined) {
        throw new ApiError(400, 'taskId, voterWallet, and isScam are required');
    }
    const result = await submitCommunityVote(taskId, voterWallet, isScam, reason || '');
    return res.status(200).json(new ApiResponse(200, result, 'Vote submitted successfully'));
});
// ─── Get XDR for On-Chain Vote ─────────────────────────────────────
const getVoteXdr = AsyncHandler(async (req, res) => {
    const { taskId, voterWallet, isScam } = req.body;
    if (!taskId || !voterWallet || isScam === undefined) {
        throw new ApiError(400, 'taskId, voterWallet, isScam required');
    }
    const xdr = await escrowService.buildVoteTx(voterWallet, taskId, isScam);
    return res.status(200).json(new ApiResponse(200, { xdr }, 'Vote XDR generated'));
});
// ─── Get Votes for a Task ──────────────────────────────────────────
const getVotesForTask = AsyncHandler(async (req, res) => {
    const { taskId } = req.params;
    if (!taskId)
        throw new ApiError(400, 'Task ID is required');
    const votes = await getTaskVotes(taskId);
    return res.status(200).json(new ApiResponse(200, votes, 'Votes retrieved'));
});
// ─── Submit Work Proof ─────────────────────────────────────────────
const submitProof = AsyncHandler(async (req, res) => {
    const { ngoId, taskId, proofCid, description, submitterWallet, transactionHash } = req.body;
    if (!ngoId || !taskId || !proofCid || !submitterWallet) {
        throw new ApiError(400, 'ngoId, taskId, proofCid, and submitterWallet are required');
    }
    // Pass transactionHash to connect on-chain event with metadata
    const result = await submitWorkProof(ngoId, taskId, proofCid, description || '', submitterWallet, transactionHash);
    return res.status(201).json(new ApiResponse(201, result, 'Proof submitted successfully'));
});
// ─── Get XDR for On-Chain Proof ────────────────────────────────────
const getProofXdr = AsyncHandler(async (req, res) => {
    const { ngoPublicKey, taskId, proofCid } = req.body;
    if (!ngoPublicKey || !taskId || !proofCid) {
        throw new ApiError(400, 'ngoPublicKey, taskId, proofCid required');
    }
    const xdr = await escrowService.buildSubmitProofTx(ngoPublicKey, taskId, proofCid);
    return res.status(200).json(new ApiResponse(200, { xdr }, 'Proof XDR generated'));
});
// ─── Get Proofs for a Task ─────────────────────────────────────────
const getProofsByTask = AsyncHandler(async (req, res) => {
    const { taskId } = req.params;
    if (!taskId)
        throw new ApiError(400, 'Task ID is required');
    const proofs = await getTaskProofs(taskId);
    return res.status(200).json(new ApiResponse(200, proofs, 'Proofs retrieved'));
});
// ─── Vote on Proof ─────────────────────────────────────────────────
const voteOnProofCtrl = AsyncHandler(async (req, res) => {
    const { proofId } = req.params;
    const { taskId, voter, isScam } = req.body;
    if (!proofId || !taskId || !voter || isScam === undefined)
        throw new ApiError(400, 'Missing vote params');
    const result = await voteOnProof(taskId, proofId, voter, isScam);
    return res.status(200).json(new ApiResponse(200, result, 'Vote recorded'));
});
// ─── Verify Proof (By Hash) ────────────────────────────────────────
const verifyProofByHash = AsyncHandler(async (req, res) => {
    const { hash } = req.params;
    if (!hash)
        throw new ApiError(400, 'Hash or CID required');
    const proof = await findProofByHash(hash);
    if (!proof)
        throw new ApiError(404, 'Proof not found');
    return res.status(200).json(new ApiResponse(200, proof, 'Proof found'));
});
// ─── Voter Stats ───────────────────────────────────────────────────
const getVoterAccuracy = AsyncHandler(async (req, res) => {
    const { walletAddr } = req.params;
    if (!walletAddr)
        throw new ApiError(400, 'Wallet address is required');
    const stats = await getVoterStats(walletAddr);
    return res.status(200).json(new ApiResponse(200, stats, 'Voter stats retrieved'));
});
// ─── Leaderboard ───────────────────────────────────────────────────
const getLeaderboard = AsyncHandler(async (req, res) => {
    const leaderboard = await getCommunityLeaderboard();
    return res.status(200).json(new ApiResponse(200, leaderboard, 'Leaderboard retrieved'));
});
export { voteOnTask, getVotesForTask, submitProof, getProofsByTask, voteOnProofCtrl, verifyProofByHash, getVoterAccuracy, getLeaderboard, getVoteXdr, getProofXdr, };
//# sourceMappingURL=community.controler.js.map