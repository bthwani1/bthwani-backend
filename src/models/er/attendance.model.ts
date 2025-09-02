import { Schema, model, Document, Types } from 'mongoose';

export interface IAttendance extends Document {
  employee: Types.ObjectId;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late';
}

const AttendanceSchema = new Schema<IAttendance>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  date:     { type: Date, required: true },
  checkIn:  { type: Date, required: true },
  checkOut: { type: Date },
  status:   { type: String, enum: ['present','absent','late'], default: 'present' },
}, { timestamps: true });

export const Attendance = model<IAttendance>('Attendance', AttendanceSchema);