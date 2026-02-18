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

import userProfileRoutes from './userProfile.routes.js';
import communiqueRoutes from './communique.routes.js';
import communityRoutes from './community.routes.js';

// Contract routes
import escrowRoutes from './contracts/escrow.routes.js';
import missionRegistryRoutes from './contracts/mission-registry.routes.js';
import reiatsuTokenRoutes from './contracts/reiatsu-token.routes.js';
import soulBadgeRoutes from './contracts/soul-badge.routes.js';
import treasuryRoutes from './contracts/treasury.routes.js';
import soulReaperRegistryRoutes from './contracts/soul-reaper-registry.routes.js';
import vaultRoutes from './contracts/vault.routes.js';
import notificationsRoutes from './contracts/notifications.routes.js';

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

router.use('/user-profile', userProfileRoutes);
router.use('/communique', communiqueRoutes);
router.use('/community', communityRoutes);

// Contract routes
router.use('/contracts/escrow', escrowRoutes);
router.use('/contracts/mission-registry', missionRegistryRoutes);
router.use('/contracts/reiatsu-token', reiatsuTokenRoutes);
router.use('/contracts/soul-badge', soulBadgeRoutes);
router.use('/contracts/treasury', treasuryRoutes);
router.use('/contracts/soul-reaper-registry', soulReaperRegistryRoutes);
router.use('/contracts/vault', vaultRoutes);
router.use('/contracts/notifications', notificationsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AidBridge API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
