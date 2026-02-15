import { postModel } from '../model/post.model.js';
import mongoose from 'mongoose';

/**
 * Submit proof of mission execution (Soul Reaper side)
 */
const submitMissionProof = async (postId: string, submitter: string, cid: string) => {
  try {
    const post = await postModel.findById(postId);
    if (!post) throw new Error('Mission not found');

    post.Proofs.push({
      Submitter: submitter,
      Cid: cid,
      Status: 'Pending',
      SubmittedAt: new Date(),
    });

    await post.save();
    return { success: true, message: 'Proof submitted for verification' };
  } catch (error) {
    console.error('Error submitting proof:', error);
    throw error;
  }
};

/**
 * Verify mission proof (NGO/Division Captain side)
 */
const verifyMissionProof = async (
  postId: string,
  proofIndex: number,
  status: 'Approved' | 'Rejected'
) => {
  try {
    const post = await postModel.findById(postId);
    if (!post) throw new Error('Mission not found');

    if (!post.Proofs[proofIndex]) throw new Error('Proof not found at this index');

    post.Proofs[proofIndex].Status = status;

    // Optional: If approved, we could potentially auto-complete the mission if it's the final proof
    // But for now, we just update the proof status.

    await post.save();
    return {
      success: true,
      message: `Proof ${status.toLowerCase()} successfully`,
      proof: post.Proofs[proofIndex]
    };
  } catch (error) {
    console.error('Error verifying proof:', error);
    throw error;
  }
};

export { submitMissionProof, verifyMissionProof };
