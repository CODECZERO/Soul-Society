import { apiClient } from '../../api-client';
import { ApiResponse } from '../../types';

export class SoulReaperRegistryContractService {
    async initialize(adminKey: string): Promise<ApiResponse<any>> {
        return apiClient.request('/contracts/soul-reaper-registry/initialize', {
            method: 'POST',
            body: JSON.stringify({ adminKey }),
        }, true);
    }

    async register(data: {
        ownerKey: string;
        name: string;
        division: number;
        rank: string;
        powerLevel: number;
    }): Promise<ApiResponse<any>> {
        return apiClient.request('/contracts/soul-reaper-registry/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true);
    }

    async updatePower(ownerKey: string, newPower: number): Promise<ApiResponse<any>> {
        return apiClient.request('/contracts/soul-reaper-registry/update-power', {
            method: 'POST',
            body: JSON.stringify({ ownerKey, newPower }),
        }, true);
    }

    async promote(adminKey: string, ownerAddress: string, newRank: string): Promise<ApiResponse<any>> {
        return apiClient.request('/contracts/soul-reaper-registry/promote', {
            method: 'POST',
            body: JSON.stringify({ adminKey, ownerAddress, newRank }),
        }, true);
    }

    async suspend(adminKey: string, ownerAddress: string): Promise<ApiResponse<any>> {
        return apiClient.request('/contracts/soul-reaper-registry/suspend', {
            method: 'POST',
            body: JSON.stringify({ adminKey, ownerAddress }),
        }, true);
    }

    async reinstate(adminKey: string, ownerAddress: string): Promise<ApiResponse<any>> {
        return apiClient.request('/contracts/soul-reaper-registry/reinstate', {
            method: 'POST',
            body: JSON.stringify({ adminKey, ownerAddress }),
        }, true);
    }

    async setDivisionCapacity(adminKey: string, division: number, capacity: number): Promise<ApiResponse<any>> {
        return apiClient.request('/contracts/soul-reaper-registry/set-division-capacity', {
            method: 'POST',
            body: JSON.stringify({ adminKey, division, capacity }),
        }, true);
    }

    async getReaper(ownerAddress: string): Promise<ApiResponse<any>> {
        return apiClient.request(`/contracts/soul-reaper-registry/reaper/${ownerAddress}`, {}, false);
    }

    async getByDivision(division: number): Promise<ApiResponse<any[]>> {
        return apiClient.request(`/contracts/soul-reaper-registry/division/${division}`, {}, false);
    }

    async getAll(): Promise<ApiResponse<any[]>> {
        return apiClient.request('/contracts/soul-reaper-registry/all', {}, false);
    }

    async getPowerHistory(ownerAddress: string): Promise<ApiResponse<any[]>> {
        return apiClient.request(`/contracts/soul-reaper-registry/power-history/${ownerAddress}`, {}, false);
    }

    async totalReapers(): Promise<ApiResponse<{ total: number }>> {
        return apiClient.request('/contracts/soul-reaper-registry/total', {}, false);
    }
}

export const soulReaperRegistryContractService = new SoulReaperRegistryContractService();
