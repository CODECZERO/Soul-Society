import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';
import { nanoid } from 'nanoid';
import { ApiError } from '../util/apiError.util.js';

// ─── NGO Queries (Vault) ───────────────────────────────────────────

export interface NGOData {
    name: string;
    description: string;
    image: string;
    walletAddress: string;
    email?: string;
    website?: string;
    regNumber?: string;
    phoneNo?: string;
    password?: string;
}

/**
 * Register a new NGO (Save to 'NGOs' collection).
 */
const registerNGO = async (data: NGOData) => {
    try {
        // Check if already exists by Wallet
        const allNGOs = await seireiteiVault.getAll('NGOs');
        const existing = allNGOs.find((n: any) => n.walletAddress === data.walletAddress);
        if (existing) {
            throw new Error('NGO with this wallet already exists');
        }

        const ngoId = `ngo-${nanoid(8)}`;
        const newNGO = {
            id: ngoId,
            ...data,
            verified: false, // Default to unverified
            createdAt: new Date().toISOString()
        };

        await seireiteiVault.put('NGOs', ngoId, newNGO);
        // Also sync to Communities immediately
        const community = {
            id: ngoId,
            name: data.name,
            description: data.description,
            image: data.image,
            memberCount: 0,
            members: [],
            totalFundsRaised: 0,
            createdAt: new Date().toISOString(),
            taskCount: 0
        };
        await seireiteiVault.put('Communities', ngoId, community);

        console.log(`[VAULT] Registered NGO: ${ngoId}`);
        return newNGO;
    } catch (error) {
        console.error('Error registering NGO:', error);
        throw error;
    }
};

/**
 * Find NGO by Email (for Login)
 */
const findNGOByEmail = async (email: string) => {
    try {
        const allNGOs = await seireiteiVault.getAll('NGOs');
        return allNGOs.find((n: any) => n.email === email);
    } catch (error) {
        console.error('Error finding NGO by email:', error);
        throw error;
    }
};

/**
 * Login NGO (Check if wallet belongs to an NGO).
 */
const loginNGO = async (walletAddress: string) => {
    try {
        const allNGOs = await seireiteiVault.getAll('NGOs');
        const ngo = allNGOs.find((n: any) => n.walletAddress === walletAddress);
        return ngo || null;
    } catch (error) {
        console.error('Error logging in NGO:', error);
        throw error;
    }
};

/**
 * Get NGO Details by ID.
 */
const getNGO = async (ngoId: string) => {
    try {
        return await seireiteiVault.get('NGOs', ngoId);
    } catch (error) {
        console.error('Error fetching NGO:', error);
        throw error;
    }
};

/**
 * Get All NGOs.
 */
const getAllNGOs = async () => {
    try {
        return await seireiteiVault.getAll('NGOs');
    } catch (error) {
        console.error('Error fetching all NGOs:', error);
        throw error;
    }
};

export {
    registerNGO,
    loginNGO,
    getNGO,
    getAllNGOs,
    findNGOByEmail
};
