// services/wallet/holds.ts
import { ClientSession } from "mongoose";

/** يحجز amount من رصيد المستخدم لأجل الطلب */
export async function holdForOrder(
  userId: string,
  orderId: string,
  amount: number,
  session: ClientSession
) {
  // ... منطقك الحالي
}

/** يلتقط (يخصم نهائيًا) أي حجز مرتبط بالطلب */
export async function captureForOrder(
  userId: string,
  orderId: string,
  session: ClientSession
): Promise<number> {
  // ... اجعلها idempotent: لو لا يوجد حجز فعّال تُرجِع 0
  // ... قلّل onHold وزِد transactions وخصم balance بحسب الحجز
  return 0;
}

/** يفكّ (يلغي) أي حجز مرتبط بالطلب */
export async function releaseOrder(
  userId: string,
  orderId: string,
  session: ClientSession
) {
  // ... منطقك الحالي
}
