// server/src/models/budget.model.ts
import { Schema, model, Document } from 'mongoose';
export interface IBudget extends Document {
  year: number;
  allocations: Record<string, number>;
}
const BudgetSchema = new Schema<IBudget>({
  year: { type: Number, required: true, unique: true },
  allocations: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });
export const Budget = model<IBudget>('Budget', BudgetSchema);