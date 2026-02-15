import { Types } from 'mongoose';
import { donationModel } from '../model/donation.model.js';
import { DonationData } from '../controler/payment.controler.js';

const getDonation = async (transactionId: string) => {
  try {
    return await donationModel.findOne({ currentTxn: transactionId });
  } catch (error) {
    console.error('Error getting donation:', error);
    throw error;
  }
};

const getAllDonation = async () => {
  try {
    return await donationModel.find();
  } catch (error) {
    console.error('Error getting all donations:', error);
    throw error;
  }
};

const getDonationRelatedToPost = async (postId: Types.ObjectId) => {
  try {
    return await donationModel.find({ postIDs: postId });
  } catch (error) {
    console.error('Error getting donations for post:', error);
    throw error;
  }
};

const createDonation = async (donationData: DonationData) => {
  try {
    if (!donationData) throw new Error('invalid data');
    return await donationModel.create({
      currentTxn: donationData.TransactionId,
      postIDs: donationData.postID,
      Amount: donationData.Amount,
      Donor: donationData.Donor,
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
};

const getDonationsByDonor = async (walletAddr: string) => {
  try {
    return await donationModel.find({ Donor: walletAddr });
  } catch (error) {
    console.error('Error getting donations by donor:', error);
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
