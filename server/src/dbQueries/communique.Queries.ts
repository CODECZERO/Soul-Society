import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';
import { nanoid } from 'nanoid';

const saveCommunique = async (data: any) => {
  try {
    const id = nanoid();
    const saveData = { ...data, _id: id, createdAt: new Date().toISOString() };
    await seireiteiVault.putWithIndex('Communiques', id, saveData, 'NgoRef', data.NgoRef);
    return saveData;
  } catch (error) {
    console.error('Error saving communique to blockchain:', error);
    throw error;
  }
};

const getCommuniquesByDivision = async (ngoId: string) => {
  try {
    // Note: getByIndex returns a single record in the simplified implementation.
    // In a real DB, we would use a more advanced multi-value index.
    // For now, we'll retrieve all and filter as a simulation of indexed search.
    const all = await seireiteiVault.getAll('Communiques');
    return all.filter(c => c.NgoRef === ngoId).sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting communiques from blockchain:', error);
    throw error;
  }
};

export { saveCommunique, getCommuniquesByDivision };
