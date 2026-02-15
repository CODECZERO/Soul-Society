import mongoose, { Document } from "mongoose";
export interface IPost extends Document {
    _id: mongoose.Types.ObjectId;
    Title: string;
    Type: string;
    Description: string;
    Location: string;
    ImgCid: string;
    NgoRef: mongoose.Types.ObjectId;
    NeedAmount: number;
    CollectedAmount?: number;
    WalletAddr: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const postModel: mongoose.Model<IPost, {}, {}, {}, mongoose.Document<unknown, {}, IPost, {}, {}> & IPost & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=post.model.d.ts.map