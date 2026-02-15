import { communiqueModel } from '../model/communique.model.js';

const saveCommunique = async (data: any) => {
  try {
    return await communiqueModel.create(data);
  } catch (error) {
    console.error('Error saving communique:', error);
    throw error;
  }
};

const getCommuniquesByDivision = async (ngoId: string) => {
  try {
    return await communiqueModel.find({ NgoRef: ngoId }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error getting communiques:', error);
    throw error;
  }
};

export { saveCommunique, getCommuniquesByDivision };
