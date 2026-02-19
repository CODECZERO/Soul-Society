import { Router } from 'express';
import { walletPay } from '../controler/payment.controler.js';
import { createNewDonation } from '../controler/donation.controler.js';
import { getAllNGOs } from '../dbQueries/ngo.Queries.js';

const router = Router();

// POST /api/payment/verify-donation - Verify donation and save to database (Consolidated)
router.post('/verify-donation', createNewDonation);

// POST /api/payment/wallet-pay - Process wallet payment
router.post('/wallet-pay', walletPay);

export default router;
