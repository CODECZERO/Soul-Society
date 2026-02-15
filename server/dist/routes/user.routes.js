import { Router } from "express";
import { singup, login, refreshToken } from "../controler/userNgo.controler.js";
const router = Router();
// POST /api/user/signup - Register new user/NGO
router.post("/signup", singup);
// POST /api/user/login - Login user/NGO
router.post("/login", login);
// POST /api/user/refresh - Refresh access token
router.post("/refresh", refreshToken);
export default router;
//# sourceMappingURL=user.routes.js.map