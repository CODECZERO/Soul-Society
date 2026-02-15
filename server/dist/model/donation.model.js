import mongoose from "mongoose";
const donationSchema = new mongoose.Schema({
    currentTxn: {
        type: String,
        unique: true,
    },
    postIDs: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
    },
    Amount: {
        type: Number,
        required: true,
    },
    RemainingAmount: {
        type: Number,
    },
}, { timestamps: true });
export const donationModel = mongoose.model("donationmodel", donationSchema);
//# sourceMappingURL=donation.model.js.map