// API Service Layer for AidBridge Frontend
// Refactored to SOLID principles: Aggregator of specialized services

import { authService } from './services/auth.service';
import { postService } from './services/post.service';
import { donationService } from './services/donation.service';
import { stellarService } from './services/stellar.service';
import { ipfsService } from './services/ipfs.service';
import { userService } from './services/user.service';
import { apiClient } from './api-client';

// Contract services
import { escrowContractService } from './services/contracts/escrow.service';
import { missionRegistryContractService } from './services/contracts/mission-registry.service';
import { reiatsuTokenContractService } from './services/contracts/reiatsu-token.service';
import { soulBadgeContractService } from './services/contracts/soul-badge.service';
import { treasuryContractService } from './services/contracts/treasury.service';
import { soulReaperRegistryContractService } from './services/contracts/soul-reaper-registry.service';
import { vaultContractService } from './services/contracts/vault.service';
import { notificationsContractService } from './services/contracts/notifications.service';

export * from './types';

// Export instances
export { authService, postService, donationService, stellarService, ipfsService, userService };
export { apiClient };
export { 
  escrowContractService, 
  missionRegistryContractService, 
  reiatsuTokenContractService, 
  soulBadgeContractService, 
  treasuryContractService, 
  soulReaperRegistryContractService, 
  vaultContractService,
  notificationsContractService
};

// Backward compatibility exports
export const login = (data: any) => authService.login(data);
export const signup = (data: any) => authService.signup(data);

export const getPosts = () => postService.getPosts();
export const createPost = (data: any) => postService.createPost(data);
export const submitProof = (id: string, data: any) => postService.submitProof(id, data);

export const getDonations = () => donationService.getDonations();
export const getDonationById = (id: string) => donationService.getDonationById(id);
export const getDonationsByPost = (id: string) => donationService.getDonationsByPost(id);
export const verifyDonation = (data: any) => donationService.verifyDonation(data);
export const walletPay = (data: any) => donationService.walletPay(data);
export const getStats = () => donationService.getStats();
export const getLeaderboard = () => donationService.getLeaderboard();
export const getDonorStats = (addr: string) => donationService.getDonorStats(addr);
export const getEscrowXdr = (data: any) => donationService.getEscrowXdr(data);

export const getWalletBalance = (key: string) => stellarService.getWalletBalance(key);
export const createStellarAccount = () => stellarService.createStellarAccount();
export const sendPayment = (data: any) => stellarService.sendPayment(data);
export const getVoteXdr = (data: any) => stellarService.getVoteXdr(data);
export const getSubmitProofXdr = (data: any) => stellarService.getSubmitProofXdr(data);

export const uploadToIPFS = (file: File) => ipfsService.uploadToIPFS(file);
export const findUser = (email?: string, id?: string) => userService.findUser(email, id);
export const getUserPrivateKey = (id: string) => userService.getUserPrivateKey(id);
export const getUserProfile = (addr: string) => userService.getUserProfile(addr);

export const getProofsByTask = (id: string) => stellarService.getProofsByTask(id);
export const voteOnProof = (id: string, data: any) => stellarService.voteOnProof(id, data);
export const verifyProof = (hash: string) => stellarService.verifyProof(hash);
// Mock expenses for now if not implemented
export const getExpensesByPostId = (id: string) => Promise.resolve({ success: true, data: { prevTxn: [] } });

export const healthCheck = () => apiClient.request('/health');

// Default export object for legacy code using `import apiService from ...`
// Default export object for legacy code using `import apiService from ...`
export default {
  login,
  signup,
  getPosts,
  createPost,
  submitProof,
  getDonations,
  getDonationById,
  getDonationsByPost,
  verifyDonation,
  walletPay,
  getStats,
  getLeaderboard,
  getDonorStats,
  getEscrowXdr,
  getWalletBalance,
  createStellarAccount,
  sendPayment,
  getVoteXdr,
  getSubmitProofXdr,
  getProofsByTask,
  voteOnProof,
  verifyProof,
  getExpensesByPostId,
  uploadToIPFS,
  findUser,
  getUserPrivateKey,
  getUserProfile,
  healthCheck,
  isAuthenticated: () => authService.isAuthenticated(),
  // Expose services directly on the default object too
  auth: authService,
  post: postService,
  donation: donationService,
  stellar: stellarService,
  ipfs: ipfsService,
  user: userService,
  // Contract services
  contracts: {
    escrow: escrowContractService,
    missionRegistry: missionRegistryContractService,
    reiatsuToken: reiatsuTokenContractService,
    soulBadge: soulBadgeContractService,
    treasury: treasuryContractService,
    soulReaperRegistry: soulReaperRegistryContractService,
    vault: vaultContractService,
    notifications: notificationsContractService
  }
};
