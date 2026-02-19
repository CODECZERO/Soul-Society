import { apiClient } from '../api-client';
import { Donation, DonationData, PayWallet, ApiResponse } from '../types';

export class DonationService {
    async getDonations(): Promise<ApiResponse<Donation[]>> {
        return apiClient.request('/donations', {}, false);
    }

    async getDonationById(transactionId: string): Promise<ApiResponse<Donation>> {
        return apiClient.request(`/donations/${transactionId}`, {}, false);
    }

    async getDonationsByPost(postId: string): Promise<ApiResponse<Donation[]>> {
        return apiClient.request(`/donations/post/${postId}`, {}, false);
    }

    async verifyDonation(donationData: DonationData): Promise<ApiResponse<any>> {
        return apiClient.request('/payment/verify-donation', {
            method: 'POST',
            body: JSON.stringify(donationData),
        }, false);
    }

    async walletPay(payData: PayWallet): Promise<ApiResponse<any>> {
        return apiClient.request('/payment/wallet-pay', {
            method: 'POST',
            body: JSON.stringify(payData),
        }, true);
    }

    async getStats(): Promise<ApiResponse<{ totalRaised: number; activeDonors: number; verifiedNGOs: number }>> {
        return apiClient.request('/stats');
    }

    async getLeaderboard(): Promise<ApiResponse<any[]>> {
        return apiClient.request('/stats/leaderboard');
    }

    async getDonorStats(walletAddr: string): Promise<ApiResponse<any>> {
        return apiClient.request(`/stats/donor/${walletAddr}`);
    }

    async getEscrowXdr(data: {
        donorPublicKey: string;
        ngoPublicKey: string;
        totalAmount: number;
        lockedAmount: number;
        taskId: string;
        deadline: number;
    }): Promise<ApiResponse<{ xdr: string; escrowId: string }>> {
        return apiClient.request('/donations/escrow/xdr', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}

export const donationService = new DonationService();
