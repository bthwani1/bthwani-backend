// src/utils/money.ts
export const isIntAmount = (x: any) => Number.isInteger(x) && x > 0;

export const available = (wallet: { balance: number; onHold?: number }) =>
  (wallet?.balance || 0) - (wallet?.onHold || 0);
