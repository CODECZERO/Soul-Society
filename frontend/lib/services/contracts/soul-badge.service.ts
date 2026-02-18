import { apiClient } from '../../api-client';
import { ApiResponse } from '../../types';

export class SoulBadgeContractService {
    async initialize(adminKey: string): Promise<ApiResponse<any>> {
        return apiClient.request('/contracts/soul-badge/initialize', {
            method: 'POST',
            body: JSON.stringify({ adminKey }),
        }, true);
    }

    async mint(reaperAddress: string, missionId: string, rank: string): Promise<ApiResponse<any>> {
        return apiClient.request('/contracts/soul-badge/mint', {
            method: 'POST',
            body: JSON.stringify({ reaperAddress, missionId, rank }),
        }, true);
    }

    async revoke(adminKey: string, reaperAddress: string, missionId: string): Promise<ApiResponse<any>> {
        return apiClient.request('/contracts/soul-badge/revoke', {
            method: 'POST',
            body: JSON.stringify({ adminKey, reaperAddress, missionId }),
        }, true);
    }

    async getBadges(reaperAddress: string): Promise<ApiResponse<any[]>> {
        return apiClient.request(`/contracts/soul-badge/reaper/${reaperAddress}`, {}, false);
    }

    async verifyBadge(reaperAddress: string, missionId: string): Promise<ApiResponse<{ verified: boolean }>> {
        return apiClient.request(`/contracts/soul-badge/verify/${reaperAddress}/${missionId}`, {}, false);
    }

    async badgeCount(reaperAddress: string): Promise<ApiResponse<{ count: number }>> {
        return apiClient.request(`/contracts/soul-badge/count/${reaperAddress}`, {}, false);
    }

    async totalBadges(): Promise<ApiResponse<{ total: number }>> {
        return apiClient.request('/contracts/soul-badge/total', {}, false);
    }

    async getTopReapers(limit: number = 10): Promise<ApiResponse<any[]>> {
        return apiClient.request(`/contracts/soul-badge/leaderboard?limit=${limit}`, {}, false);
    }
}

export const soulBadgeContractService = new SoulBadgeContractService();
