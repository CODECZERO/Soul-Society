import { Router } from 'express';
import {
    voteOnTask,
    getVotesForTask,
    submitProof,
    getProofsByTask,
    voteOnProofCtrl,
    verifyProofByHash,
    getVoterAccuracy,

    getLeaderboard,
    getVoteXdr,
    getProofXdr,

    getCommunitiesList,
    getCommunity,
} from '../controler/community.controler.js';
import { validate } from '../midelware/validate.midelware.js';
import {
    voteOnTaskSchema,
    submitProofSchema,
    voteOnProofSchema
} from '../schemas/community.schema.js';

const router = Router();

// Community Hub
router.get('/all', getCommunitiesList);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getCommunity); // Generic ID lookup for Community Details

// Community voting on Tasks (Main)
router.post('/vote', validate(voteOnTaskSchema), voteOnTask);
router.post('/vote/xdr', getVoteXdr);
router.get('/votes/:taskId', getVotesForTask);

// Work proofs (Submission & Retrieval)
router.post('/submit-proof', validate(submitProofSchema), submitProof);
router.post('/submit-proof/xdr', getProofXdr);
router.get('/proofs/task/:taskId', getProofsByTask); // CHANGED: By Task, not NGO

// Proof Voting & Verification
router.post('/proof/:proofId/vote', validate(voteOnProofSchema), voteOnProofCtrl);
router.get('/proof/verify/:hash', verifyProofByHash);

// Voter stats & leaderboard
router.get('/voter/:walletAddr', getVoterAccuracy);

export default router;
