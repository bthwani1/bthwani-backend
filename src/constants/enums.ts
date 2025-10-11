// src/constants/enums.ts - Enums موحدة للتطبيق

import { ALLOWED_TRANSITIONS, OrderStatus } from "./orderStatus";

// User Roles
export type UserRole = "user" | "admin" | "superadmin" | "customer" | "driver" | "vendor" | "store";
export const USER_ROLES: UserRole[] = ["user", "admin", "superadmin", "customer", "driver", "vendor", "store"];

// Order Status (موجود في orderStatus.ts)
export { OrderStatus, ALLOWED_TRANSITIONS, canTransition } from "./orderStatus";

// Payment Methods
export type PaymentMethod = "cash" | "card" | "wallet" | "cod" | "mixed";
export const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "wallet", "cod", "mixed"];

// Driver Types
export type DriverType = "primary" | "joker";
export const DRIVER_TYPES: DriverType[] = ["primary", "joker"];

// Vehicle Types
export type VehicleType = "motor" | "bike" | "car";
export const VEHICLE_TYPES: VehicleType[] = ["motor", "bike", "car"];

// Driver Availability
export type DriverAvailability = "available" | "busy" | "offline";
export const DRIVER_AVAILABILITY: DriverAvailability[] = ["available", "busy", "offline"];

// Order Visibility
export type OrderVisibility = "public" | "private" | "draft";
export const ORDER_VISIBILITY: OrderVisibility[] = ["public", "private", "draft"];

// Transaction Types (للـ wallet)
export type TransactionType = "credit" | "debit" | "transfer" | "refund";
export const TRANSACTION_TYPES: TransactionType[] = ["credit", "debit", "transfer", "refund"];

// Transaction Status
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";
export const TRANSACTION_STATUS: TransactionStatus[] = ["pending", "completed", "failed", "cancelled"];

// Settlement Status
export type SettlementStatus = "pending" | "approved" | "rejected" | "paid";
export const SETTLEMENT_STATUS: SettlementStatus[] = ["pending", "approved", "rejected", "paid"];

// Support Ticket Status
export type SupportTicketStatus = "new" | "open" | "pending" | "resolved" | "closed";
export const SUPPORT_TICKET_STATUS: SupportTicketStatus[] = ["new", "open", "pending", "resolved", "closed"];

// Support Ticket Priority
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";
export const SUPPORT_TICKET_PRIORITY: SupportTicketPriority[] = ["low", "medium", "high", "urgent"];

// Product Categories (إذا كان هناك تعريف)
export type ProductCategory = "food" | "grocery" | "electronics" | "fashion" | "home" | "other";
export const PRODUCT_CATEGORIES: ProductCategory[] = ["food", "grocery", "electronics", "fashion", "home", "other"];

// Currency (للـ wallet)
export type Currency = "SAR" | "USD" | "EUR";
export const CURRENCIES: Currency[] = ["SAR", "USD", "EUR"];

// Subscription Status
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "paused";
export const SUBSCRIPTION_STATUS: SubscriptionStatus[] = ["active", "cancelled", "expired", "paused"];

// Subscription Type
export type SubscriptionType = "monthly" | "yearly" | "weekly";
export const SUBSCRIPTION_TYPES: SubscriptionType[] = ["monthly", "yearly", "weekly"];

// Notification Type
export type NotificationType = "order" | "promotion" | "system" | "wallet" | "driver";
export const NOTIFICATION_TYPES: NotificationType[] = ["order", "promotion", "system", "wallet", "driver"];

// Boolean Status (للحقول الثنائية)
export type BooleanStatus = "true" | "false";
export const BOOLEAN_STATUS: BooleanStatus[] = ["true", "false"];

// Days of Week
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export const DAYS_OF_WEEK: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Time Slots (للـ scheduling)
export type TimeSlot = "morning" | "afternoon" | "evening" | "night";
export const TIME_SLOTS: TimeSlot[] = ["morning", "afternoon", "evening", "night"];

// Rating (للتقييمات)
export type Rating = 1 | 2 | 3 | 4 | 5;
export const RATINGS: Rating[] = [1, 2, 3, 4, 5];

// Export كل الـ enums في كائن واحد للاستهلاك السهل
export const ENUMS = {
  USER_ROLES,
  ORDER_STATUS: Object.keys(ALLOWED_TRANSITIONS) as OrderStatus[],
  PAYMENT_METHODS,
  DRIVER_TYPES,
  VEHICLE_TYPES,
  DRIVER_AVAILABILITY,
  ORDER_VISIBILITY,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  SETTLEMENT_STATUS,
  SUPPORT_TICKET_STATUS,
  SUPPORT_TICKET_PRIORITY,
  PRODUCT_CATEGORIES,
  CURRENCIES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_TYPES,
  NOTIFICATION_TYPES,
  BOOLEAN_STATUS,
  DAYS_OF_WEEK,
  TIME_SLOTS,
  RATINGS,
} as const;
