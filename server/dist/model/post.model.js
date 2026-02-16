import mongoose from 'mongoose';
const postSchame = new mongoose.Schema({
    Title: {
        type: String,
        require: true,
    },
    Type: {
        type: String,
        require: true,
    },
    Description: {
        type: String,
        require: true,
    },
    Location: {
        type: String,
        require: true,
    },
    ImgCid: {
        type: String,
        unique: true,
    },
    NgoRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ngomodel',
    },
    NeedAmount: {
        type: Number,
        require: true,
    },
    CollectedAmount: {
        type: Number,
    },
    WalletAddr: {
        type: String,
        require: true,
    },
    Status: {
        type: String,
        enum: ['Active', 'Completed', 'Failed'],
        default: 'Active',
    },
    DangerLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Extreme'],
        default: 'Low',
    },
    Proofs: [
        {
            Submitter: String,
            Cid: String,
            Status: {
                type: String,
                enum: ['Pending', 'Approved', 'Rejected'],
                default: 'Pending',
            },
            SubmittedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, { timestamps: true });
export const postModel = mongoose.model('postmodel', postSchame);
//# sourceMappingURL=post.model.js.map