import { ngoModel } from '../model/user(Ngo).model.js';

/**
 * Enlist a Soul Reaper (User) into an NGO's Division
 */
const enlistMember = async (ngoId: string, walletAddr: string) => {
  try {
    const ngo = await ngoModel.findById(ngoId);
    if (!ngo) throw new Error('Division not found');

    // Initialize Members array if it doesn't exist (safety check)
    if (!ngo.Members) ngo.Members = [];

    // Check if already a member
    if (ngo.Members.includes(walletAddr)) {
      return { success: false, message: 'Already enlisted in this division' };
    }

    ngo.Members.push(walletAddr);
    await ngo.save();

    return { success: true, message: 'Successfully enlisted in division' };
  } catch (error) {
    console.error('Error enlisting member:', error);
    throw error;
  }
};

/**
 * Get all members of a specific Division
 */
const getDivisionMembers = async (ngoId: string) => {
  try {
    const ngo = await ngoModel.findById(ngoId).select('Members');
    return ngo?.Members || [];
  } catch (error) {
    console.error('Error getting members:', error);
    throw error;
  }
};

export { enlistMember, getDivisionMembers };
