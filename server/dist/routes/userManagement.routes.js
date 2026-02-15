import { Router } from "express";
import { findUserById, getUserPrivateKey } from "../controler/userManagement.controler.js";
const router = Router();
// GET /api/user-management/find - Find user by email or ID
router.get("/find", findUserById);
// GET /api/user-management/private-key/:userId - Get user's private key (admin only)
router.get("/private-key/:userId", getUserPrivateKey);
export default router;
//# sourceMappingURL=userManagement.routes.js.map