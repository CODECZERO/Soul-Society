import mongoose from 'mongoose';
const communiqueSchema = new mongoose.Schema({
    Title: {
        type: String,
        required: true,
    },
    Content: {
        type: String,
        required: true,
    },
    Type: {
        type: String,
        enum: ['Status Report', 'Order', 'General'],
        default: 'General',
    },
    NgoRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ngomodel',
        required: true,
    },
}, { timestamps: true });
export const communiqueModel = mongoose.model('communiquemodel', communiqueSchema);
//# sourceMappingURL=communique.model.js.map