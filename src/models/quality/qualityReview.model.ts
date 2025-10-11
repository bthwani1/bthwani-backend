// server/src/models/quality/qualityReview.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IQualityRating {
  company: number;
  order: number;
  driver: number;
  comments?: string;
}

export interface IQualityReview extends Document {
  orderId: string;
  user: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  store?: mongoose.Types.ObjectId;
  entityType: 'driver' | 'order' | 'store';
  rating: IQualityRating;
  status: 'published' | 'hidden' | 'pending';
  hiddenBy?: mongoose.Types.ObjectId;
  hiddenAt?: Date;
  hiddenReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QualityRatingSchema = new Schema<IQualityRating>({
  company: { type: Number, min: 1, max: 5, required: true },
  order: { type: Number, min: 1, max: 5, required: true },
  driver: { type: Number, min: 1, max: 5, required: true },
  comments: { type: String }
});

const QualityReviewSchema = new Schema<IQualityReview>({
  orderId: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: Schema.Types.ObjectId, ref: 'Driver' },
  store: { type: Schema.Types.ObjectId, ref: 'DeliveryStore' },
  entityType: {
    type: String,
    enum: ['driver', 'order', 'store'],
    required: true
  },
  rating: { type: QualityRatingSchema, required: true },
  status: {
    type: String,
    enum: ['published', 'hidden', 'pending'],
    default: 'published'
  },
  hiddenBy: { type: Schema.Types.ObjectId, ref: 'User' },
  hiddenAt: { type: Date },
  hiddenReason: { type: String }
}, { timestamps: true });

// Indexes for better query performance
QualityReviewSchema.index({ entityType: 1, status: 1 });
QualityReviewSchema.index({ orderId: 1 });
QualityReviewSchema.index({ user: 1 });
QualityReviewSchema.index({ driver: 1 });
QualityReviewSchema.index({ store: 1 });
QualityReviewSchema.index({ createdAt: -1 });

export default mongoose.model<IQualityReview>('QualityReview', QualityReviewSchema);
