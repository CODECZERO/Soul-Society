import { Router } from "express";
import { verfiyDonationAndSave, walletPay } from "../controler/payment.controler.js";
const router = Router();
// POST /api/payment/verify-donation - Verify donation and save to database
router.post("/verify-donation", verfiyDonationAndSave);
// POST /api/payment/wallet-pay - Process wallet payment
router.post("/wallet-pay", walletPay);
export default router;
//# sourceMappingURL=payment.routes.js.map