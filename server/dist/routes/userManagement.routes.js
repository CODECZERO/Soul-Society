import { Router } from 'express';
import { findUserById, getUserPrivateKey } from '../controler/userManagement.controler.js';
import { verifyToken } from '../midelware/verify.midelware.js';
const router = Router();
// GET /api/user-management/find - Find user by email or ID
router.get('/find', verifyToken, findUserById);
// GET /api/user-management/private-key/:userId - Get user's private key (auth required)
router.get('/private-key/:userId', verifyToken, getUserPrivateKey);
export default router;
//# sourceMappingURL=userManagement.routes.js.map