import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../util/apiError.util.js';
import dotenv from 'dotenv';
dotenv.config();

export interface RequestK extends Request {
  NgoId?: string;
  user?: {
    id: string;
    email: string;
    walletAddr: string;
    NgoName: string;
  };
}

const verifyToken = async (req: RequestK, res: Response, next: NextFunction) => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Access token is required');
    }

    // Verify the token — no fallback secret allowed
    if (!process.env.ATS) {
      throw new ApiError(500, 'Server misconfiguration: JWT secret not set');
    }
    const decoded = jwt.verify(token, process.env.ATS) as any;

    // Support both 'Id' (from generateTokens) and 'id' (legacy)
    const userId = decoded.Id || decoded.id;
    if (!decoded || !userId) {
      throw new ApiError(401, 'Invalid token');
    }

    // Set user data for use in controllers
    req.NgoId = userId;
    req.user = {
      id: userId,
      email: decoded.email,
      walletAddr: decoded.walletAddr,
      NgoName: decoded.NgoName,
    };

    return next();
  } catch (error) {

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export { verifyToken };
