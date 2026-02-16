/**
 * Enlist a Soul Reaper (User) into an NGO's Division
 */
declare const enlistMember: (ngoId: string, walletAddr: string) => Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Get all members of a specific Division
 */
declare const getDivisionMembers: (ngoId: string) => Promise<any>;
export { enlistMember, getDivisionMembers };
//# sourceMappingURL=recruitment.Queries.d.ts.map