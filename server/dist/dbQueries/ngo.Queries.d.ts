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
declare const registerNGO: (data: NGOData) => Promise<{
    verified: boolean;
    createdAt: string;
    name: string;
    description: string;
    image: string;
    walletAddress: string;
    email?: string;
    website?: string;
    regNumber?: string;
    phoneNo?: string;
    password?: string;
    id: string;
}>;
/**
 * Find NGO by Email (for Login)
 */
declare const findNGOByEmail: (email: string) => Promise<any>;
/**
 * Login NGO (Check if wallet belongs to an NGO).
 */
declare const loginNGO: (walletAddress: string) => Promise<any>;
/**
 * Get NGO Details by ID.
 */
declare const getNGO: (ngoId: string) => Promise<any>;
/**
 * Get All NGOs.
 */
declare const getAllNGOs: () => Promise<any[]>;
export { registerNGO, loginNGO, getNGO, getAllNGOs, findNGOByEmail };
//# sourceMappingURL=ngo.Queries.d.ts.map