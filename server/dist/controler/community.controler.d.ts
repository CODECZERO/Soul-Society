import { Request, Response } from 'express';
declare const getCommunitiesList: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getCommunity: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const voteOnTask: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getVoteXdr: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getVotesForTask: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const submitProof: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getProofXdr: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getProofsByTask: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const voteOnProofCtrl: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const verifyProofByHash: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getVoterAccuracy: (req: Request, res: Response, next: import("express").NextFunction) => void;
declare const getLeaderboard: (req: Request, res: Response, next: import("express").NextFunction) => void;
export { voteOnTask, getVotesForTask, submitProof, getProofsByTask, voteOnProofCtrl, verifyProofByHash, getVoterAccuracy, getLeaderboard, getVoteXdr, getProofXdr, getCommunitiesList, getCommunity, };
//# sourceMappingURL=community.controler.d.ts.map