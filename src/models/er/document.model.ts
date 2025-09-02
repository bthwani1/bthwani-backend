// server/src/models/document.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IDocument extends Document {
  title: string;
  type: string;             // عقد، فاتورة، بوليصة…
  asset?: Types.ObjectId;    // إن كان مستند متعلق بأصل
  category: string;         // جنسة المستند: رسمي، داخلي…
  issueDate: Date;
  expiryDate?: Date;
  fileUrl: string;          // مسار الملف المخزن
  permissions: string[];    // roles or user IDs
  location?: string;        // الجهة أو المدينة
}

const DocumentsSchema = new Schema<IDocument>({
  title:       { type: String, required: true },
  type:        { type: String, required: true },
  asset:       { type: Schema.Types.ObjectId, ref: 'Asset' },
  category:    { type: String, required: true },
  issueDate:   { type: Date, required: true },
  expiryDate:  { type: Date },
  fileUrl:     { type: String, required: true },
  permissions: [{ type: String }],
  location:    { type: String },
}, { timestamps: true });

export const Documentes = model<IDocument>('Documents', DocumentsSchema);