/**
 * Submit proof of mission execution (Soul Reaper side)
 */
declare const submitMissionProof: (postId: string, submitter: string, cid: string) => Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Verify mission proof (NGO/Division Captain side)
 */
declare const verifyMissionProof: (postId: string, proofIndex: number, status: "Approved" | "Rejected") => Promise<{
    success: boolean;
    message: string;
    proof: any;
}>;
export { submitMissionProof, verifyMissionProof };
//# sourceMappingURL=postProof.Queries.d.ts.map