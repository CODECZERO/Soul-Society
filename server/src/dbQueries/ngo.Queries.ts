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
        // Check if already exists by Wallet using fast index
        const existing = await seireiteiVault.getByIndex('NGOs', 'Wallet', data.walletAddress);
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
        // Add fast indexing for lookups
        await seireiteiVault.put('NGOs_Wallet_Index', data.walletAddress, ngoId);
        if (data.email) {
            await seireiteiVault.put('NGOs_Email_Index', data.email.toLowerCase(), ngoId);
        }
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
        const searchEmail = email.toLowerCase();
        const ngo = await seireiteiVault.getByIndex('NGOs', 'Email', searchEmail);

        if (ngo) return ngo;

        // Fallback for older data that wasn't indexed
        const allNGOs = await seireiteiVault.getAll('NGOs');
        const matches = allNGOs.filter((n: any) => {
            const ngoEmail = (n.email || n.Email || "").toLowerCase();
            return ngoEmail === searchEmail;
        });

        if (matches.length === 0) return null;
        const withPassword = matches.find((n: any) => n.password || n.Password);
        return withPassword || matches[0];
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
        const ngo = await seireiteiVault.getByIndex('NGOs', 'Wallet', walletAddress);
        if (ngo) return ngo;

        // Fallback for older data
        const allNGOs = await seireiteiVault.getAll('NGOs');
        return allNGOs.find((n: any) => {
            const addr = n.walletAddress || n.WalletAddress;
            return addr === walletAddress;
        }) || null;
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
