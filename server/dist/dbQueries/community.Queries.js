import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';
// ─── Community Vote Queries ────────────────────────────────────────
/**
 * Submit a community vote on a task's authenticity.
 */
const submitCommunityVote = async (taskId, voterWallet, isScam, reason) => {
    try {
        // Get or create the vote record for this task
        let voteData = await seireiteiVault.get('CommunityVotes', taskId);
        if (!voteData) {
            voteData = {
                taskId,
                votes: [],
                realCount: 0,
                scamCount: 0,
                resolved: false,
                createdAt: new Date().toISOString(),
            };
        }
        // Check if voter already voted
        const existingVote = voteData.votes.find((v) => v.voter === voterWallet);
        if (existingVote)
            throw new Error('Already voted on this task');
        // Add vote
        voteData.votes.push({
            voter: voterWallet,
            isScam,
            reason,
            timestamp: new Date().toISOString(),
        });
        if (isScam) {
            voteData.scamCount += 1;
        }
        else {
            voteData.realCount += 1;
        }
        await seireiteiVault.put('CommunityVotes', taskId, voteData);
        return { success: true, voteData };
    }
    catch (error) {
        console.error('Error submitting community vote:', error);
        throw error;
    }
};
/**
 * Get all votes for a specific task.
 */
const getTaskVotes = async (taskId) => {
    try {
        const voteData = await seireiteiVault.get('CommunityVotes', taskId);
        return voteData || { taskId, votes: [], realCount: 0, scamCount: 0 };
    }
    catch (error) {
        console.error('Error fetching task votes:', error);
        throw error;
    }
};
// ─── Community Proof Queries ───────────────────────────────────────
// ─── Community Proof Queries ───────────────────────────────────────
/**
 * Submit proof of work done by an NGO.
 * Stored directly on the Post object in the Vault "chain".
 */
const submitWorkProof = async (ngoId, taskId, proofCid, description, submitterWallet, transactionHash) => {
    try {
        // Get the Post from Vault
        const post = await seireiteiVault.get('Posts', taskId);
        if (!post)
            throw new Error('Mission not found');
        if (!post.Proofs)
            post.Proofs = [];
        const proof = {
            id: `proof-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate a unique ID
            taskId,
            ngoId,
            proofCid,
            description,
            submitter: submitterWallet,
            transactionHash: transactionHash || '',
            status: 'Pending',
            votes: [],
            submittedAt: new Date().toISOString(),
        };
        post.Proofs.push(proof);
        // Update Post in Vault
        await seireiteiVault.put('Posts', taskId, post);
        return { success: true, proof };
    }
    catch (error) {
        console.error('Error submitting work proof:', error);
        throw error;
    }
};
/**
 * Get all proofs for a specific Task (from Vault).
 */
const getTaskProofs = async (taskId) => {
    try {
        const post = await seireiteiVault.get('Posts', taskId);
        if (!post || !post.Proofs)
            return [];
        return post.Proofs;
    }
    catch (error) {
        console.error('Error fetching task proofs:', error);
        throw error;
    }
};
/**
 * Vote on a specific Proof (updates the Proof inside the Post).
 */
const voteOnProof = async (taskId, proofId, voter, isScam) => {
    try {
        const post = await seireiteiVault.get('Posts', taskId);
        if (!post || !post.Proofs)
            throw new Error('Proof not found');
        const proofIndex = post.Proofs.findIndex((p) => p.id === proofId || p._id === proofId);
        if (proofIndex === -1)
            throw new Error('Proof not found');
        const proof = post.Proofs[proofIndex];
        if (!proof.votes)
            proof.votes = [];
        // Check if already voted
        if (proof.votes.find((v) => v.voter === voter)) {
            throw new Error('Already voted on this proof');
        }
        proof.votes.push({
            voter,
            isScam,
            timestamp: new Date().toISOString()
        });
        // Update Status based on votes
        const scamVotes = proof.votes.filter((v) => v.isScam).length;
        const totalVotes = proof.votes.length;
        if (totalVotes >= 3) {
            if (scamVotes / totalVotes > 0.5)
                proof.status = 'Rejected';
            else
                proof.status = 'Verified';
        }
        post.Proofs[proofIndex] = proof;
        await seireiteiVault.put('Posts', taskId, post);
        return { success: true, proof };
    }
    catch (error) {
        console.error('Error voting on proof:', error);
        throw error;
    }
};
/**
 * Find a proof globally by Transaction Hash or CID (Scan).
 */
const findProofByHash = async (hashOrCid) => {
    try {
        // This is expensive (scan all posts), but acceptable for hackathon "On-Chain" simulation
        // In real Stellar, we'd query Horizon for the Tx hash
        const allPosts = await seireiteiVault.getAll('Posts');
        for (const post of allPosts) {
            if (post.Proofs) {
                const found = post.Proofs.find((p) => p.transactionHash === hashOrCid || p.proofCid === hashOrCid);
                if (found)
                    return { ...found, taskTitle: post.Title };
            }
        }
        return null;
    }
    catch (error) {
        console.error('Error finding proof:', error);
        throw error;
    }
};
// ─── Voter Accuracy Queries ────────────────────────────────────────
/**
 * Get voter accuracy stats.
 */
const getVoterStats = async (walletAddr) => {
    try {
        const stats = await seireiteiVault.get('VoterStats', walletAddr);
        return stats || {
            walletAddr,
            totalVotes: 0,
            correctVotes: 0,
            accuracy: 0,
            rewardsEarned: 0,
            badgesEarned: 0,
        };
    }
    catch (error) {
        console.error('Error fetching voter stats:', error);
        throw error;
    }
};
/**
 * Update voter accuracy after a task is resolved.
 */
const updateVoterAccuracy = async (walletAddr, wasCorrect, rewardAmount) => {
    try {
        let stats = await getVoterStats(walletAddr);
        stats.totalVotes += 1;
        if (wasCorrect) {
            stats.correctVotes += 1;
            stats.rewardsEarned += rewardAmount;
        }
        stats.accuracy = stats.totalVotes > 0
            ? Math.round((stats.correctVotes / stats.totalVotes) * 100)
            : 0;
        // Badge tiers: 10+ correct = Bronze, 25+ = Silver, 50+ = Gold
        if (stats.correctVotes >= 50)
            stats.badgesEarned = 3;
        else if (stats.correctVotes >= 25)
            stats.badgesEarned = 2;
        else if (stats.correctVotes >= 10)
            stats.badgesEarned = 1;
        await seireiteiVault.put('VoterStats', walletAddr, stats);
        return stats;
    }
    catch (error) {
        console.error('Error updating voter accuracy:', error);
        throw error;
    }
};
/**
 * Get community leaderboard (top voters by accuracy).
 */
const getCommunityLeaderboard = async () => {
    try {
        const allStats = await seireiteiVault.getAll('VoterStats');
        return allStats
            .filter((s) => s.totalVotes >= 3)
            .sort((a, b) => b.accuracy - a.accuracy || b.correctVotes - a.correctVotes)
            .slice(0, 50);
    }
    catch (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
    }
};
export { submitCommunityVote, getTaskVotes, submitWorkProof, getTaskProofs, voteOnProof, findProofByHash, getVoterStats, updateVoterAccuracy, getCommunityLeaderboard, };
//# sourceMappingURL=community.Queries.js.map