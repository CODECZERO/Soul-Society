import { Router } from 'express';
import { getStats, getLeaderboard, getDonorStats, getContributorLeaderboard, getNGOStats } from '../controler/stats.controler.js';
const router = Router();
router.route('/').get(getStats);
router.route('/leaderboard').get(getLeaderboard);
router.route('/leaderboard/contributors').get(getContributorLeaderboard);
router.route('/donor/:walletAddr').get(getDonorStats);
router.route('/ngo/:ngoId').get(getNGOStats);
export default router;
//# sourceMappingURL=stats.routes.js.map