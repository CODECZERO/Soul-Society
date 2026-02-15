import AsyncHandler from "../util/asyncHandler.util.js";
import { ApiError } from "../util/apiError.util.js";
import { ApiResponse } from "../util/apiResponse.util.js";
import { getBalance, sendPaymentToWallet, verfiyTransaction } from "../services/stellar/transcation.stellar.js";
import { createAccount, DeletAccount } from "../services/stellar/account.stellar.js";
import { saveContractWithWallet, getLatestData } from "../services/stellar/smartContract.handler.stellar.js";
// Get wallet balance
const getWalletBalance = AsyncHandler(async (req, res) => {
    const { publicKey } = req.params;
    if (!publicKey)
        throw new ApiError(400, "Public key is required");
    const balance = await getBalance(publicKey);
    return res.status(200).json(new ApiResponse(200, balance, "Balance retrieved successfully"));
});
// Send payment between wallets
const sendPayment = AsyncHandler(async (req, res) => {
    const paymentData = req.body;
    if (!paymentData)
        throw new ApiError(400, "Payment data is required");
    const result = await sendPaymentToWallet(paymentData);
    if (!result.success) {
        throw new ApiError(500, result.error || "Payment failed");
    }
    return res.status(200).json(new ApiResponse(200, result, "Payment sent successfully"));
});
// Verify transaction
const verifyTransaction = AsyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    if (!transactionId)
        throw new ApiError(400, "Transaction ID is required");
    const transaction = await verfiyTransaction(transactionId);
    if (!transaction)
        throw new ApiError(404, "Transaction not found");
    return res.status(200).json(new ApiResponse(200, transaction, "Transaction verified"));
});
// Create new Stellar account
const createStellarAccount = AsyncHandler(async (req, res) => {
    const accountData = await createAccount();
    if (!accountData)
        throw new ApiError(500, "Failed to create account");
    return res.status(200).json(new ApiResponse(200, accountData, "Account created successfully"));
});
// Delete Stellar account
const deleteStellarAccount = AsyncHandler(async (req, res) => {
    const { secret, destination } = req.body;
    if (!secret || !destination)
        throw new ApiError(400, "Secret and destination are required");
    await DeletAccount(secret, destination);
    return res.status(200).json(new ApiResponse(200, null, "Account deleted successfully"));
});
// Save data to smart contract
const saveToSmartContract = AsyncHandler(async (req, res) => {
    const contractData = req.body;
    if (!contractData)
        throw new ApiError(400, "Contract data is required");
    const result = await saveContractWithWallet(contractData);
    if (!result)
        throw new ApiError(500, "Failed to save to smart contract");
    return res.status(200).json(new ApiResponse(200, result, "Data saved to smart contract"));
});
// Get latest data from smart contract
const getLatestContractData = AsyncHandler(async (req, res) => {
    const { privateKey } = req.body;
    if (!privateKey)
        throw new ApiError(400, "Private key is required");
    const data = await getLatestData(privateKey);
    if (!data)
        throw new ApiError(404, "No data found");
    return res.status(200).json(new ApiResponse(200, data, "Latest contract data retrieved"));
});
export { getWalletBalance, sendPayment, verifyTransaction, createStellarAccount, deleteStellarAccount, saveToSmartContract, getLatestContractData };
//# sourceMappingURL=stellar.controler.js.map