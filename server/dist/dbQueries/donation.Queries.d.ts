import { Types } from "mongoose";
import { DonationData } from "../controler/payment.controler.js";
declare const getDonation: (transactionId: string) => Promise<(import("mongoose").Document<unknown, {}, {
    Amount: number;
    currentTxn?: string | null | undefined;
    postIDs?: Types.ObjectId | null | undefined;
    RemainingAmount?: number | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    Amount: number;
    currentTxn?: string | null | undefined;
    postIDs?: Types.ObjectId | null | undefined;
    RemainingAmount?: number | null | undefined;
} & import("mongoose").DefaultTimestampProps & {
    _id: Types.ObjectId;
} & {
    __v: number;
}) | null>;
declare const getAllDonation: () => Promise<(import("mongoose").Document<unknown, {}, {
    Amount: number;
    currentTxn?: string | null | undefined;
    postIDs?: Types.ObjectId | null | undefined;
    RemainingAmount?: number | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    Amount: number;
    currentTxn?: string | null | undefined;
    postIDs?: Types.ObjectId | null | undefined;
    RemainingAmount?: number | null | undefined;
} & import("mongoose").DefaultTimestampProps & {
    _id: Types.ObjectId;
} & {
    __v: number;
})[]>;
declare const getDonationRelatedToPost: (postId: Types.ObjectId) => Promise<(import("mongoose").Document<unknown, {}, {
    Amount: number;
    currentTxn?: string | null | undefined;
    postIDs?: Types.ObjectId | null | undefined;
    RemainingAmount?: number | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    Amount: number;
    currentTxn?: string | null | undefined;
    postIDs?: Types.ObjectId | null | undefined;
    RemainingAmount?: number | null | undefined;
} & import("mongoose").DefaultTimestampProps & {
    _id: Types.ObjectId;
} & {
    __v: number;
})[]>;
declare const createDonation: (donationData: DonationData) => Promise<import("mongoose").Document<unknown, {}, {
    Amount: number;
    currentTxn?: string | null | undefined;
    postIDs?: Types.ObjectId | null | undefined;
    RemainingAmount?: number | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    Amount: number;
    currentTxn?: string | null | undefined;
    postIDs?: Types.ObjectId | null | undefined;
    RemainingAmount?: number | null | undefined;
} & import("mongoose").DefaultTimestampProps & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export { getDonation, getAllDonation, getDonationRelatedToPost, createDonation };
//# sourceMappingURL=donation.Queries.d.ts.map