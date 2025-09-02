// src/utils/deliveryPricing.ts

import { IPricingStrategy } from "../models/delivry_Marketplace_V1/PricingStrategy";

/**
 * يحسب التكلفة الكاملة بناءً على المسافة وتجزئة الرينجات.
 * لأي مسافة، يمرّ على كل رينج ويجمع (عدد الكيلومترات داخل الرينج × ثمن الكيلو).
 * إذا تجاوز المسافات المعرفة، يطبق defaultPricePerKm على الباقي.
 */
// src/utils/deliveryPricing.ts
export function calculateDeliveryPrice(distance: number, strategy: IPricingStrategy): number {
  // 1. إذا المسافة ضمن الـ baseDistance
  if (distance <= strategy.baseDistance) {
    return strategy.basePrice;
  }

  // 2. احسب تكلفة الـ baseDistance
  let cost = strategy.basePrice;
  let remaining = distance - strategy.baseDistance;

  // 3. رتب الشرائح
  const sorted = [...strategy.tiers].sort((a, b) => a.minDistance - b.minDistance);

  // 4. مرّ على الشرائح ولكن بعد الـ baseDistance
  for (const tier of sorted) {
    if (remaining <= 0) break;
    // نحسب الجزء من الـ remaining الذي يقع ضمن هذه الشريحة
    const start = tier.minDistance - strategy.baseDistance;    // نحوّل إلى بعد الـ baseDistance
    const end   = tier.maxDistance - strategy.baseDistance;
    if (remaining <= start) continue;
    const inTier = Math.min(remaining, end) - Math.max(0, start);
    cost += inTier * tier.pricePerKm;
    remaining -= inTier;
  }

  // 5. إذا بقيت مسافة بعد آخر شريحة
  if (remaining > 0) {
    cost += remaining * strategy.defaultPricePerKm;
  }

  return cost;
}
