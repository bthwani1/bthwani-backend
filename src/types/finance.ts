// Finance API Types and Enums

// Wallet States
export enum WalletState {
  PENDING = 'pending',
  AVAILABLE = 'available'
}

// Settlement Status
export enum SettlementStatus {
  DRAFT = 'draft',
  READY = 'ready',
  PAID = 'paid',
  CANCELED = 'canceled'
}

// Payout Status
export enum PayoutStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  PAID = 'paid'
}

// Owner Types
export enum OwnerType {
  DRIVER = 'driver',
  VENDOR = 'vendor',
  COMPANY = 'company',
  USER = 'user'
}

// Account Types for Ledger
export enum AccountType {
  DRIVER_WALLET = 'driver_wallet',
  VENDOR_WALLET = 'vendor_wallet',
  COMPANY_WALLET = 'company_wallet',
  USER_WALLET = 'user_wallet',
  PSP_CLEARING = 'psp_clearing',
  COMPANY_REVENUE = 'company_revenue',
  BANK_PAYOUT = 'bank_payout'
}

// Transaction Types
export enum TransactionType {
  ORDER_PAYMENT = 'order_payment',
  ORDER_DELIVERY = 'order_delivery',
  SETTLEMENT_PAID = 'settlement_paid',
  DRIVER_PAYOUT = 'driver_payout',
  ORDER_COMMISSION = 'order_commission'
}

// Event Types for Ledger
export enum EventType {
  ORDER_PAID = 'order_paid',
  ORDER_DELIVERED = 'order_delivered',
  SETTLEMENT_PAID = 'settlement_paid',
  DRIVER_PAYOUT = 'driver_payout',
  ORDER_COMMISSION = 'order_commission'
}

// Reference Types
export enum ReferenceType {
  ORDER = 'order',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
  SETTLEMENT = 'settlement',
  PAYOUT = 'payout'
}

// Commission Basis
export enum CommissionBasis {
  PERCENTAGE = 'percentage',
  FLAT = 'flat'
}

// Currency (currently only SAR supported)
export const SUPPORTED_CURRENCIES = ['SAR'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Error Codes
export enum FinanceErrorCode {
  // Settlement Errors
  SETTLEMENT_NOT_FOUND = 'SETTLEMENT_NOT_FOUND',
  SETTLEMENT_ALREADY_PAID = 'SETTLEMENT_ALREADY_PAID',
  SETTLEMENT_INVALID_STATUS = 'SETTLEMENT_INVALID_STATUS',
  SETTLEMENT_NO_AVAILABLE_BALANCE = 'SETTLEMENT_NO_AVAILABLE_BALANCE',

  // Payout Errors
  PAYOUT_BATCH_NOT_FOUND = 'PAYOUT_BATCH_NOT_FOUND',
  PAYOUT_BATCH_ALREADY_PROCESSED = 'PAYOUT_BATCH_ALREADY_PROCESSED',
  PAYOUT_NO_AVAILABLE_BALANCE = 'PAYOUT_NO_AVAILABLE_BALANCE',

  // Wallet Errors
  WALLET_ACCOUNT_NOT_FOUND = 'WALLET_ACCOUNT_NOT_FOUND',
  WALLET_INSUFFICIENT_BALANCE = 'WALLET_INSUFFICIENT_BALANCE',

  // Commission Errors
  COMMISSION_RULE_NOT_FOUND = 'COMMISSION_RULE_NOT_FOUND',
  COMMISSION_INVALID_RATE = 'COMMISSION_INVALID_RATE',

  // General Errors
  INVALID_PERIOD = 'INVALID_PERIOD',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

// API Response Types
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: {
    code: FinanceErrorCode;
    message: string;
    details?: any;
  };
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  returned: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  meta: PaginationMeta;
}

// Filter and Sort Types
export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface BaseFilter {
  page?: number;
  perPage?: number;
  sort?: SortOptions;
}

// Settlement Types
export interface SettlementFilters extends BaseFilter {
  status?: SettlementStatus;
  type?: OwnerType;
  period_start?: string;
  period_end?: string;
}

export interface PayoutFilters extends BaseFilter {
  status?: PayoutStatus;
  date_from?: Date;
  date_to?: Date;
}

// Wallet Statement Types
export interface WalletStatementFilters extends BaseFilter {
  date_from?: string;
  date_to?: string;
  balance_state?: WalletState;
  ref_type?: string;
}

// Commission Types
export interface CommissionRuleFilters extends BaseFilter {
  applicable_to?: OwnerType;
  is_active?: boolean;
}

// Export these types for use in controllers and services
export type {
  WalletState,
  SettlementStatus,
  PayoutStatus,
  OwnerType,
  AccountType,
  TransactionType,
  EventType,
  ReferenceType,
  CommissionBasis,
  SupportedCurrency
};
