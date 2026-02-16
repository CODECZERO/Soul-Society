import { Router } from 'express';
import { voteOnTask, getVotesForTask, submitProof, getProofsByTask, voteOnProofCtrl, verifyProofByHash, getVoterAccuracy, getLeaderboard, getVoteXdr, getProofXdr, getCommunitiesList, getCommunity, } from '../controler/community.controler.js';
const router = Router();
// Community Hub
router.get('/all', getCommunitiesList);
router.get('/:id', getCommunity); // Generic ID lookup for Community Details
// Community voting on Tasks (Main)
router.post('/vote', voteOnTask);
router.post('/vote/xdr', getVoteXdr);
router.get('/votes/:taskId', getVotesForTask);
// Work proofs (Submission & Retrieval)
router.post('/submit-proof', submitProof);
router.post('/submit-proof/xdr', getProofXdr);
router.get('/proofs/task/:taskId', getProofsByTask); // CHANGED: By Task, not NGO
// Proof Voting & Verification
router.post('/proof/:proofId/vote', voteOnProofCtrl);
router.get('/proof/verify/:hash', verifyProofByHash);
// Voter stats & leaderboard
router.get('/voter/:walletAddr', getVoterAccuracy);
router.get('/leaderboard', getLeaderboard);
export default router;
//# sourceMappingURL=community.routes.js.map