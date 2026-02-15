import { Router } from "express";
import { getStats } from "../controler/stats.controler.js";
const router = Router();
router.route("/").get(getStats);
export default router;
//# sourceMappingURL=stats.routes.js.map