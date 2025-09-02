// src/utils/storeStatus.ts
import dayjs from "dayjs";
export interface IWorkSchedule {
  day:   string;
  open:  boolean;
  from?: string;
  to?:   string;
}
export function computeIsOpen(
  schedule:IWorkSchedule[],
  forceClosed: boolean,
  forceOpen: boolean
): boolean {
  if (forceOpen) return true;
  if (forceClosed) return false;

  const now = dayjs();
  const today = now.format("dddd").toLowerCase();
  const entry = schedule.find(e => e.day === today && e.open);
  if (!entry) return false;

  const from = dayjs(entry.from, "HH:mm");
  const to   = dayjs(entry.to,   "HH:mm");

  // تحقق من from <= now < to
  const afterOrEqual = now.isAfter(from) || now.isSame(from);
  const before       = now.isBefore(to);
  return afterOrEqual && before;
}
