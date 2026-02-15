import mongoose from "mongoose";
const expenseSchema = new mongoose.Schema({
    currentTxn: {
        type: String,
        unique: true,
    },
    postIDs: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
    },
}, { timestamps: true });
export const expenseModel = mongoose.model("expensemodel", expenseSchema);
//# sourceMappingURL=expense.model.js.map