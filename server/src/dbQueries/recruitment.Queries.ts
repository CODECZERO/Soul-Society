import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';

/**
 * Enlist a Soul Reaper (User) into an NGO's Division
 */
const enlistMember = async (ngoId: string, walletAddr: string) => {
  try {
    const ngo = await seireiteiVault.get('Users', ngoId);
    if (!ngo) throw new Error('Division not found');

    if (!ngo.Members) ngo.Members = [];

    if (ngo.Members.includes(walletAddr)) {
      return { success: false, message: 'Already enlisted in this division' };
    }

    ngo.Members.push(walletAddr);
    await seireiteiVault.put('Users', ngoId, ngo);

    return { success: true, message: 'Successfully enlisted in division on-chain' };
  } catch (error) {
    console.error('Error enlisting member on blockchain:', error);
    throw error;
  }
};

/**
 * Get all members of a specific Division
 */
const getDivisionMembers = async (ngoId: string) => {
  try {
    const ngo = await seireiteiVault.get('Users', ngoId);
    return ngo?.Members || [];
  } catch (error) {
    console.error('Error getting members from blockchain:', error);
    throw error;
  }
};

export { enlistMember, getDivisionMembers };
