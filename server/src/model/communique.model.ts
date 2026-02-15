import mongoose from 'mongoose';

export interface ICommunique {
  Title: string;
  Content: string;
  Type: 'Status Report' | 'Order' | 'General';
  NgoRef: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const communiqueSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

export const communiqueModel = mongoose.model<ICommunique>('communiquemodel', communiqueSchema);
