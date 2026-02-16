import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';
import { nanoid } from 'nanoid';
const getDonation = async (transactionId) => {
    try {
        return await seireiteiVault.getByIndex('Donations', 'Txn', transactionId);
    }
    catch (error) {
        console.error('Error getting donation from blockchain:', error);
        throw error;
    }
};
const getAllDonation = async () => {
    try {
        return await seireiteiVault.getAll('Donations');
    }
    catch (error) {
        console.error('Error getting all donations from blockchain:', error);
        throw error;
    }
};
const getDonationRelatedToPost = async (postId) => {
    try {
        // For specific lookups like 'Donations related to post', we use a specialized index
        return await seireiteiVault.getByIndex('Donations', 'PostID', postId);
    }
    catch (error) {
        console.error('Error getting donations for post from blockchain:', error);
        throw error;
    }
};
const createDonation = async (donationData) => {
    try {
        if (!donationData)
            throw new Error('invalid data');
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
        await seireiteiVault.put('Donations_PostID_Index', donationData.postID, donationId);
        console.log(`[VAULT] Donation recorded on-chain: ${donationId}`);
        return data;
    }
    catch (error) {
        console.error('Error creating donation on blockchain:', error);
        throw error;
    }
};
const getDonationsByDonor = async (walletAddr) => {
    try {
        return await seireiteiVault.getByIndex('Donations', 'Donor', walletAddr);
    }
    catch (error) {
        console.error('Error getting donations by donor from blockchain:', error);
        throw error;
    }
};
export { getDonation, getAllDonation, getDonationRelatedToPost, createDonation, getDonationsByDonor, };
//# sourceMappingURL=donation.Queries.js.map