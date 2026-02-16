import { Router } from 'express';
import { singup, login, refreshToken } from '../controler/userNgo.controler.js';
import { validate } from '../midelware/validate.midelware.js';
import { signupSchema, loginSchema, refreshTokenSchema } from '../schemas/user.schema.js';

const router = Router();

// POST /api/user/signup - Register new user/NGO
router.post('/signup', validate(signupSchema), singup);

// POST /api/user/login - Login user/NGO
router.post('/login', validate(loginSchema), login);

// POST /api/user/refresh - Refresh access token
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

export default router;
