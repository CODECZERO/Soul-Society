declare const getPrevTxn: (PostId: string) => Promise<string>;
declare const createTransaction: (txnData: any, postId: string, amount: number) => Promise<any>;
declare const getAllExpenses: () => Promise<any[]>;
export { getPrevTxn, createTransaction, getAllExpenses };
//# sourceMappingURL=expense.Queries.d.ts.map