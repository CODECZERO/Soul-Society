import { apiClient } from '../api-client';
import { Post, ApiResponse } from '../types';

export class PostService {
    async getPosts(): Promise<ApiResponse<Post[]>> {
        return apiClient.request('/posts', {}, false);
    }

    async createPost(postData: Omit<Post, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Post>> {
        return apiClient.request('/posts', {
            method: 'POST',
            body: JSON.stringify(postData),
        }, true);
    }

    async submitProof(taskId: string, proofData: {
        submitter: string;
        cid: string;
        amount: number;
        description: string;
        transactionHash: string;
        ngoId: string;
    }): Promise<ApiResponse<any>> {
        return apiClient.request('/community/submit-proof', {
            method: 'POST',
            body: JSON.stringify({
                taskId,
                proofCid: proofData.cid,
                description: proofData.description,
                submitterWallet: proofData.submitter,
                transactionHash: proofData.transactionHash,
                ngoId: proofData.ngoId
            }),
        }, true);
    }
}

export const postService = new PostService();
