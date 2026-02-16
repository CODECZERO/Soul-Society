import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';
/**
 * Submit proof of mission execution (Soul Reaper side)
 */
const submitMissionProof = async (postId, submitter, cid) => {
    try {
        const post = await seireiteiVault.get('Posts', postId);
        if (!post)
            throw new Error('Mission not found');
        if (!post.Proofs)
            post.Proofs = [];
        post.Proofs.push({
            Submitter: submitter,
            Cid: cid,
            Status: 'Pending',
            SubmittedAt: new Date().toISOString(),
        });
        await seireiteiVault.put('Posts', postId, post);
        return { success: true, message: 'Proof submitted for verification on-chain' };
    }
    catch (error) {
        console.error('Error submitting proof to blockchain:', error);
        throw error;
    }
};
/**
 * Verify mission proof (NGO/Division Captain side)
 */
const verifyMissionProof = async (postId, proofIndex, status) => {
    try {
        const post = await seireiteiVault.get('Posts', postId);
        if (!post)
            throw new Error('Mission not found');
        if (!post.Proofs || !post.Proofs[proofIndex])
            throw new Error('Proof not found');
        post.Proofs[proofIndex].Status = status;
        await seireiteiVault.put('Posts', postId, post);
        return {
            success: true,
            message: `Proof ${status.toLowerCase()} successfully on-chain`,
            proof: post.Proofs[proofIndex]
        };
    }
    catch (error) {
        console.error('Error verifying proof on blockchain:', error);
        throw error;
    }
};
export { submitMissionProof, verifyMissionProof };
//# sourceMappingURL=postProof.Queries.js.map