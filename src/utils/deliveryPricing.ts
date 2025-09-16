// src/utils/deliveryPricing.ts

import { IPricingStrategy } from "../models/delivery_marketplace_v1/PricingStrategy";

/**
 * يحسب التكلفة الكاملة بناءً على المسافة وتجزئة الرينجات.
 * لأي مسافة، يمرّ على كل رينج ويجمع (عدد الكيلومترات داخل الرينج × ثمن الكيلو).
 * إذا تجاوز المسافات المعرفة، يطبق defaultPricePerKm على الباقي.
 */
// src/utils/deliveryPricing.ts
export function calculateDeliveryPrice(
  distanceKm: number,
  strategy: IPricingStrategy
): number {
  const d = Math.max(0, distanceKm);

  // داخل/حتى الـ baseDistance
  if (d <= strategy.baseDistance) return strategy.basePrice;

  let cost = strategy.basePrice;
  // مسافة إضافية بعد الـ base
  const extra = d - strategy.baseDistance;

  // رتب الشرائح
  const tiers = [...(strategy.tiers || [])].sort(
    (a, b) => a.minDistance - b.minDistance
  );

  // احسب مساهمة كل شريحة: التقاطع بين [baseDistance, d] و [min, max]
  let coveredBeyondBase = 0;
  for (const t of tiers) {
    const start = Math.max(strategy.baseDistance, t.minDistance);
    const end = Math.max(start, t.maxDistance); // تأكد end ≥ start
    const overlap = Math.max(0, Math.min(d, end) - start);
    if (overlap > 0) {
      cost += overlap * t.pricePerKm;
      coveredBeyondBase += overlap;
    }
  }

  // المسافة المتبقية بعد آخر شريحة
  const leftover = Math.max(0, extra - coveredBeyondBase);
  if (leftover > 0) {
    cost += leftover * strategy.defaultPricePerKm;
  }

  return +cost.toFixed(2);
}
