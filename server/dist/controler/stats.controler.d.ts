import { Request, Response } from 'express';
declare const getStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getLeaderboard: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get stats for a specific donor wallet to determine "Soul Badge" eligibility
 */
declare const getDonorStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get leaderboard of individual contributors (donors)
 * Optionally filtered by NGO ID
 */
declare const getContributorLeaderboard: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get detailed stats for a specific NGO
 */
declare const getNGOStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
export { getStats, getLeaderboard, getDonorStats, getContributorLeaderboard, getNGOStats };
//# sourceMappingURL=stats.controler.d.ts.map