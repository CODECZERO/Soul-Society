import { Router } from 'express';
import { getDonationById, getAllDonations, getDonationsByPost, getEscrowXdr, createNewDonation, } from '../controler/donation.controler.js';
const router = Router();
// Static routes FIRST (before dynamic /:transactionId)
// GET /api/donations - Get all donations
router.get('/', getAllDonations);
// GET /api/donations/post/:postId - Get donations related to a specific post
router.get('/post/:postId', getDonationsByPost);
// POST /api/donations/escrow/xdr - Create Escrow Creation XDR
router.post('/escrow/xdr', getEscrowXdr);
// POST /api/donations - Create Donation Record (after XDR success)
router.post('/', createNewDonation);
// Dynamic route LAST (catches any remaining /:transactionId)
// GET /api/donations/:transactionId - Get specific donation by transaction ID
router.get('/:transactionId', getDonationById);
export default router;
//# sourceMappingURL=donation.routes.js.map