import { Router } from 'express';
import { getUserProfile } from '../controler/userProfile.controler.js';
const router = Router();
router.get('/:walletAddr', getUserProfile);
export default router;
//# sourceMappingURL=userProfile.routes.js.map