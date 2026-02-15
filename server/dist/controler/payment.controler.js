import AsyncHandler from "../util/asyncHandler.util.js";
import { ApiError } from "../util/apiError.util.js";
import { sendPaymentToWallet, verfiyTransaction, } from "../services/stellar/transcation.stellar.js";
import { createDonation, getDonation } from "../dbQueries/donation.Queries.js";
import { ApiResponse } from "../util/apiResponse.util.js";
import { getPrivateKey } from "../dbQueries/user.Queries.js";
import { createTransaction, getPrevTxn } from "../dbQueries/expense.Queries.js";
import { saveContractWithWallet } from "../services/stellar/smartContract.handler.stellar.js";
const verfiyDonationAndSave = AsyncHandler(async (req, res) => {
    const donationData = req.body;
    if (!donationData)
        throw new ApiError(400, "Invalid data");
    // Check if donation already exists (prevent duplicates)
    const existingDonation = await getDonation(donationData.TransactionId);
    if (existingDonation) {
        return res
            .status(200)
            .json(new ApiResponse(200, existingDonation, "Donation already recorded"));
    }
    // Verify transaction on Stellar network
    const verfiyDonation = await verfiyTransaction(donationData.TransactionId);
    if (!verfiyDonation)
        throw new ApiError(401, "Invalid Transaction");
    // Save donation to database
    const saveData = await createDonation(donationData);
    if (!saveData)
        throw new ApiError(500, `something went wrong while saving data ${saveData}`);
    return res
        .status(200)
        .json(new ApiResponse(200, saveData, "saved trasncation"));
});
//currenlty you're not saving this spending data in expense collection
//make sure you save this spending data in expense collection
const walletPay = AsyncHandler(async (req, res) => {
    const senderWallet = req.body;
    if (!senderWallet)
        throw new ApiError(400, "Wallet data is required");
    if (!senderWallet.PostId)
        throw new ApiError(400, "Post ID is required");
    if (!senderWallet.PublicKey)
        throw new ApiError(400, "Recipient wallet address is required");
    if (!senderWallet.Amount || isNaN(senderWallet.Amount) || senderWallet.Amount <= 0) {
        throw new ApiError(400, "A valid amount is required");
    }
    try {
        // First verify the post and get the private key
        const PrivateKey = await getPrivateKey(senderWallet.PostId);
        // Get previous transaction for this post
        const prevTxn = await getPrevTxn(senderWallet.PostId);
        const Pay = await sendPaymentToWallet({
            senderKey: PrivateKey,
            receiverKey: senderWallet.PublicKey,
            amount: senderWallet.Amount,
            meta: {
                cid: senderWallet.Cid || "Pending",
                prevTxn: prevTxn,
            },
        });
        if (!Pay) {
            console.error('Payment failed for post:', senderWallet.PostId);
            throw new ApiError(500, "Payment failed. Please try again or contact support.");
        }
        const UploadData = await saveContractWithWallet({
            privateKey: PrivateKey,
            amount: senderWallet.Amount,
            cid: senderWallet.Cid,
            prevTxn: prevTxn,
            metadata: "Payment for post: " + senderWallet.PostId,
        });
        const data = await createTransaction(UploadData, senderWallet.PostId);
        return res.status(200).json(new ApiResponse(200, data, "saved and created"));
    }
    catch (error) {
        console.error('Error in walletPay:', error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred while processing your payment');
    }
});
export { verfiyDonationAndSave, walletPay };
//# sourceMappingURL=payment.controler.js.map