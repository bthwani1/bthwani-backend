// src/constants/orderStatus.ts
export type OrderStatus =
  | "pending_confirmation"
  | "under_review"
  | "preparing"
  | "assigned"
  | "out_for_delivery"
  | "delivered"
  | "returned"
  | "awaiting_procurement"
  | "procured"
  | "procurement_failed"
  | "cancelled";

// انتقالات مسموحة (Graph)
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_confirmation: ["under_review", "cancelled"],
  under_review: ["preparing", "awaiting_procurement", "cancelled"],
  preparing: ["out_for_delivery", "cancelled", "returned"],
  assigned: ["out_for_delivery", "cancelled", "returned"],
  out_for_delivery: ["delivered", "returned"],
  awaiting_procurement: ["procured", "procurement_failed", "cancelled"],
  procured: ["preparing", "cancelled"],
  procurement_failed: ["awaiting_procurement", "cancelled"],
  delivered: [], // نهائي
  returned: [], // نهائي
  cancelled: [], // نهائي
};

// حارس انتقال (يرفع خطأ لو الانتقال غير منطقي)
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
