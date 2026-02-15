import { Router } from "express";
import { getWalletBalance, sendPayment, verifyTransaction, createStellarAccount, deleteStellarAccount, saveToSmartContract, getLatestContractData } from "../controler/stellar.controler.js";
const router = Router();
// GET /api/stellar/balance/:publicKey - Get wallet balance
router.get("/balance/:publicKey", getWalletBalance);
// POST /api/stellar/send-payment - Send payment between wallets
router.post("/send-payment", sendPayment);
// GET /api/stellar/verify/:transactionId - Verify transaction
router.get("/verify/:transactionId", verifyTransaction);
// POST /api/stellar/create-account - Create new stellar account
router.post("/create-account", createStellarAccount);
// DELETE /api/stellar/delete-account - Delete stellar account
router.delete("/delete-account", deleteStellarAccount);
// POST /api/stellar/smart-contract - Save data to smart contract
router.post("/smart-contract", saveToSmartContract);
// POST /api/stellar/get-latest-data - Get latest data from smart contract
router.post("/get-latest-data", getLatestContractData);
export default router;
//# sourceMappingURL=stellar.routes.js.map