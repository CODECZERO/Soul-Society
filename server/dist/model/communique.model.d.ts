import mongoose from 'mongoose';
export interface ICommunique {
    Title: string;
    Content: string;
    Type: 'Status Report' | 'Order' | 'General';
    NgoRef: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const communiqueModel: mongoose.Model<ICommunique, {}, {}, {}, mongoose.Document<unknown, {}, ICommunique, {}, {}> & ICommunique & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
//# sourceMappingURL=communique.model.d.ts.map