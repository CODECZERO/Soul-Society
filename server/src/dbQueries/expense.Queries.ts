import mongoose, { Types } from 'mongoose';
import { expenseModel } from '../model/expense.model.js';

const getPrevTxn = async (PostId: string): Promise<string> => {
  try {
    const currentTxn = await expenseModel
      .findOne({ postIDs: new mongoose.Types.ObjectId(PostId) })
      .sort({ createdAt: -1 })
      .select('currentTxn -_id')
      .lean<{ currentTxn: string }>();
    if (!currentTxn) {
      // Return empty string instead of throwing error for new posts
      return '';
    }
    return currentTxn.currentTxn;
  } catch (error) {
    console.error('Error getting previous transaction:', error);
    return '';
  }
};

interface TransactionData {
  currentTxn: unknown;
  previousTxn?: string;
  postID: string;
  ipfsCid?: string;
}

const createTransaction = async (txnData: unknown, postId: string) => {
  try {
    if (!txnData) throw new Error('Invalid transaction data');
    return await expenseModel.create({
      currentTxn: txnData,
      postIDs: new mongoose.Types.ObjectId(postId),
    });
  } catch (error) {
    return error;
  }
};

export { getPrevTxn, createTransaction };
