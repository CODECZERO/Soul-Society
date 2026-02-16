import { Router } from 'express';
import { getStats, getLeaderboard, getDonorStats } from '../controler/stats.controler.js';
const router = Router();
router.route('/').get(getStats);
router.route('/leaderboard').get(getLeaderboard);
router.route('/donor/:walletAddr').get(getDonorStats);
export default router;
//# sourceMappingURL=stats.routes.js.map