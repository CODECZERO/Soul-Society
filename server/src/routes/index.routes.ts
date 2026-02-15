import { Router } from 'express';
import ipfsRoutes from './ipfs.routes.js';
import paymentRoutes from './payment.routes.js';
import postRoutes from './post.routes.js';
import userRoutes from './user.routes.js';
import stellarRoutes from './stellar.routes.js';
import donationRoutes from './donation.routes.js';
import expenseRoutes from './expense.routes.js';
import userManagementRoutes from './userManagement.routes.js';
import statsRoutes from './stats.routes.js';
import recruitmentRoutes from './recruitment.routes.js';
import postProofRoutes from './postProof.routes.js';
import userProfileRoutes from './userProfile.routes.js';
import communiqueRoutes from './communique.routes.js';

const router = Router();

// Mount all route modules
router.use('/ipfs', ipfsRoutes);
router.use('/payment', paymentRoutes);
router.use('/posts', postRoutes);
router.use('/user', userRoutes);
router.use('/stellar', stellarRoutes);
router.use('/donations', donationRoutes);
router.use('/expenses', expenseRoutes);
router.use('/user-management', userManagementRoutes);
router.use('/stats', statsRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/mission-verification', postProofRoutes);
router.use('/user-profile', userProfileRoutes);
router.use('/communique', communiqueRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Soul-Society API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
