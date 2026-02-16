import { joinCommunity, syncCommunityFromNGO } from './community.Queries.js';
import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';
import { DonationData } from '../controler/payment.controler.js';
import { nanoid } from 'nanoid';

const getDonation = async (transactionId: string) => {
  try {
    return await seireiteiVault.getByIndex('Donations', 'Txn', transactionId);
  } catch (error) {
    console.error('Error getting donation from blockchain:', error);
    throw error;
  }
};

const getAllDonation = async () => {
  try {
    return await seireiteiVault.getAll('Donations');
  } catch (error) {
    console.error('Error getting all donations from blockchain:', error);
    throw error;
  }
};

const getDonationRelatedToPost = async (postId: string) => {
  try {
    // For specific lookups like 'Donations related to post', we use a specialized index
    return await seireiteiVault.getByIndex('Donations', 'PostID', postId);
  } catch (error) {
    console.error('Error getting donations for post from blockchain:', error);
    throw error;
  }
};

const createDonation = async (donationData: DonationData) => {
  try {
    if (!donationData) throw new Error('invalid data');

    const donationId = nanoid();
    const data = {
      _id: donationId,
      currentTxn: donationData.TransactionId,
      postIDs: donationData.postID,
      Amount: donationData.Amount,
      Donor: donationData.Donor,
      createdAt: new Date().toISOString()
    };

    // Primary save with multiples indexes for fast retrieval
    await seireiteiVault.put('Donations', donationId, data);
    await seireiteiVault.put('Donations_Txn_Index', donationData.TransactionId, donationId);
    await seireiteiVault.put('Donations_Donor_Index', donationData.Donor, donationId);
    await seireiteiVault.put('Donations_PostID_Index', donationData.postID as string, donationId);

    // AUTO-JOIN COMMUNITY LOGIC
    // 1. Get the Task (Post) to find the NGO
    const post = await seireiteiVault.get('Posts', donationData.postID as string);
    if (post && (post.ngo || post.NgoRef)) {
      const ngoId = post.ngo || post.NgoRef;
      // 2. Ensure Community exists (lazy sync)
      await syncCommunityFromNGO(ngoId, post.Author || "NGO", "Community", "");
      // 3. Join
      await joinCommunity(ngoId, donationData.Donor);
      console.log(`[VAULT] Auto-joined wallet ${donationData.Donor} to Community ${ngoId}`);
    }

    console.log(`[VAULT] Donation recorded on-chain: ${donationId}`);
    return data;
  } catch (error) {
    console.error('Error creating donation on blockchain:', error);
    throw error;
  }
};

const getDonationsByDonor = async (walletAddr: string) => {
  try {
    return await seireiteiVault.getByIndex('Donations', 'Donor', walletAddr);
  } catch (error) {
    console.error('Error getting donations by donor from blockchain:', error);
    throw error;
  }
};

export {
  getDonation,
  getAllDonation,
  getDonationRelatedToPost,
  createDonation,
  getDonationsByDonor,
};
