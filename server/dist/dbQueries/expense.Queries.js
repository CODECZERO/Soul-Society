import { seireiteiVault } from '../services/stellar/seireiteiVault.service.js';
import { nanoid } from 'nanoid';
const getPrevTxn = async (PostId) => {
    try {
        // In decentralized vault, we use a specific key for 'Latest_Expense' per Post
        const result = await seireiteiVault.get('System', `Latest_Expense_${PostId}`);
        return result || '';
    }
    catch (error) {
        console.error('Error getting previous transaction from blockchain:', error);
        return '';
    }
};
const createTransaction = async (txnData, postId, amount) => {
    try {
        if (!txnData)
            throw new Error('Invalid transaction data');
        const expenseId = nanoid();
        const data = {
            _id: expenseId,
            currentTxn: txnData,
            postIDs: postId,
            Amount: amount, // Explicitly store amount
            createdAt: new Date().toISOString()
        };
        await seireiteiVault.put('Expenses', expenseId, data);
        // Update 'Latest' pointer for this post
        await seireiteiVault.put('System', `Latest_Expense_${postId}`, txnData);
        console.log(`[VAULT] Expense recorded on-chain: ${expenseId}`);
        return data;
    }
    catch (error) {
        return error;
    }
};
const getAllExpenses = async () => {
    try {
        return await seireiteiVault.getAll('Expenses');
    }
    catch (error) {
        console.error('Error fetching all expenses:', error);
        throw error;
    }
};
export { getPrevTxn, createTransaction, getAllExpenses };
//# sourceMappingURL=expense.Queries.js.map