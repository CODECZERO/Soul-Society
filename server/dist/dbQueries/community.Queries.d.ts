/**
 * Submit a community vote on a task's authenticity.
 */
declare const submitCommunityVote: (taskId: string, voterWallet: string, isScam: boolean, reason: string) => Promise<{
    success: boolean;
    voteData: any;
}>;
/**
 * Get all votes for a specific task.
 */
declare const getTaskVotes: (taskId: string) => Promise<any>;
/**
 * Sync/Create a Community record from NGO data.
 * Called when an NGO is created or updated (manual sync for now) or lazily.
 */
declare const syncCommunityFromNGO: (ngoId: string, name: string, description: string, image: string) => Promise<any>;
/**
 * Join a Community (Add member).
 */
declare const joinCommunity: (communityId: string, walletAddr: string) => Promise<void>;
/**
 * Get all Communities.
 */
declare const getAllCommunities: () => Promise<any[]>;
/**
 * Get Community Details (with Active Tasks).
 */
declare const getCommunityDetails: (communityId: string) => Promise<any>;
/**
 * Submit proof of work done by an NGO.
 * Stored directly on the Post object in the Vault "chain".
 */
declare const submitWorkProof: (ngoId: string, taskId: string, proofCid: string, description: string, submitterWallet: string, transactionHash?: string) => Promise<{
    success: boolean;
    proof: {
        id: string;
        taskId: string;
        ngoId: string;
        proofCid: string;
        description: string;
        submitter: string;
        transactionHash: string;
        status: string;
        votes: never[];
        submittedAt: string;
    };
}>;
/**
 * Get all proofs for a specific Task (from Vault).
 */
declare const getTaskProofs: (taskId: string) => Promise<any>;
/**
 * Vote on a specific Proof (updates the Proof inside the Post).
 */
declare const voteOnProof: (taskId: string, proofId: string, voter: string, isScam: boolean) => Promise<{
    success: boolean;
    proof: any;
}>;
/**
 * Find a proof globally by Transaction Hash or CID (Scan).
 */
declare const findProofByHash: (hashOrCid: string) => Promise<any>;
/**
 * Get voter accuracy stats.
 */
declare const getVoterStats: (walletAddr: string) => Promise<any>;
/**
 * Update voter accuracy after a task is resolved.
 */
declare const updateVoterAccuracy: (walletAddr: string, wasCorrect: boolean, rewardAmount: number) => Promise<any>;
/**
 * Get community leaderboard (top voters by accuracy).
 */
declare const getCommunityLeaderboard: () => Promise<any[]>;
export { submitCommunityVote, getTaskVotes, submitWorkProof, getTaskProofs, voteOnProof, findProofByHash, getVoterStats, updateVoterAccuracy, getCommunityLeaderboard, syncCommunityFromNGO, joinCommunity, getAllCommunities, getCommunityDetails, };
//# sourceMappingURL=community.Queries.d.ts.map