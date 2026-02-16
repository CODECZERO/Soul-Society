import { DonationData } from '../controler/payment.controler.js';
declare const getDonation: (transactionId: string) => Promise<any>;
declare const getAllDonation: () => Promise<any[]>;
declare const getDonationRelatedToPost: (postId: string) => Promise<any>;
declare const createDonation: (donationData: DonationData) => Promise<{
    _id: string;
    currentTxn: string;
    postIDs: string;
    Amount: number;
    Donor: string;
    createdAt: string;
}>;
declare const getDonationsByDonor: (walletAddr: string) => Promise<any>;
export { getDonation, getAllDonation, getDonationRelatedToPost, createDonation, getDonationsByDonor, };
//# sourceMappingURL=donation.Queries.d.ts.map