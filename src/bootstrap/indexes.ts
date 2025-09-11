// src/bootstrap/indexes.ts
import mongoose from "mongoose";
import MarketingEvent from "../models/MarketingEvent";
import AdSpend from "../models/AdSpend";
import PushToken from "../models/PushToken";

/**
 * مهلة افتراضية لعملية عمل الفهارس بالمللي ثانية.
 * يمكن تغييرها عبر المتغير البيئي INDEX_SYNC_TIMEOUT_MS
 */
const INDEX_SYNC_TIMEOUT_MS = +(process.env.INDEX_SYNC_TIMEOUT_MS || 60000);

/** لفّ الـ promise مع مهلة */
async function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label = "operation"
): Promise<T> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      );
    }),
  ]).finally(() => clearTimeout(timer));
}

export async function initIndexesAndValidate() {
  // تأكد أن mongoose متصل — هذه الدالة يجب استدعاؤها بعد نجاح mongoose.connect()
  if (mongoose.connection.readyState !== 1) {
    throw new Error(
      "initIndexesAndValidate: mongoose is not connected (readyState !== 1)"
    );
  }

  const models = [MarketingEvent, AdSpend, PushToken /*, User, Order */];

  for (const m of models) {
    if (!m || !("syncIndexes" in m)) {
      console.warn(
        `initIndexesAndValidate: skipping invalid model entry: ${String(m)}`
      );
      continue;
    }

    const modelName = (m as any).modelName || "UnknownModel";
    try {
      console.log(
        `🔧 Syncing indexes for model: ${modelName} (timeout ${INDEX_SYNC_TIMEOUT_MS}ms)`
      );
      // استخدم withTimeout لمنع التعليق الطويل؛ يمكنك زيادة INDEX_SYNC_TIMEOUT_MS حسب حاجتك
      await withTimeout(
        m.syncIndexes(),
        INDEX_SYNC_TIMEOUT_MS,
        `syncIndexes(${modelName})`
      );
      console.log(`✅ Indexes synced for ${modelName}`);
    } catch (err: any) {
      // لا نرمي هنا لعدم منع تشغيل السيرفر — سجّل المشكلة وتابع
      console.warn(
        `⚠️ Failed to sync indexes for ${modelName}: ${err.message || err}`
      );
    }
  }
}
