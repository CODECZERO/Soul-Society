import { donationModel } from "../model/donation.model.js";
const getDonation = async (transactionId) => {
    try {
        return await donationModel.findOne({ currentTxn: transactionId });
    }
    catch (error) {
        console.error("Error getting donation:", error);
        throw error;
    }
};
const getAllDonation = async () => {
    try {
        return await donationModel.find();
    }
    catch (error) {
        console.error("Error getting all donations:", error);
        throw error;
    }
};
const getDonationRelatedToPost = async (postId) => {
    try {
        return await donationModel.find({ postIDs: postId });
    }
    catch (error) {
        console.error("Error getting donations for post:", error);
        throw error;
    }
};
const createDonation = async (donationData) => {
    try {
        if (!donationData)
            throw new Error("invalid data");
        return await donationModel.create({
            currentTxn: donationData.TransactionId,
            postIDs: donationData.postID,
            Amount: donationData.Amount,
        });
    }
    catch (error) {
        console.error("Error creating donation:", error);
        throw error;
    }
};
export { getDonation, getAllDonation, getDonationRelatedToPost, createDonation };
//# sourceMappingURL=donation.Queries.js.map