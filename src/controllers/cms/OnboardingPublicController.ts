import { Request, Response } from "express";
import OnboardingSlide from "../../models/cms/OnboardingSlide";
import crypto from "crypto";

type Lang = "ar" | "en";

export async function getOnboarding(req: Request, res: Response) {
  const lang = (req.query.lang as Lang) || "ar";

  // 1) اجلب الشرائح الفعّالة مرتبة
  const slides = await OnboardingSlide.find({ active: true })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  // 2) ابنِ ETag يعتمد على ids + updatedAt
  const vParts = slides
    .map((s) => `${s._id}:${(s as any).updatedAt?.toISOString?.()}`)
    .join("|");
  const etag = crypto.createHash("md5").update(vParts).digest("hex");

  res.setHeader("ETag", etag);
  if (req.headers["if-none-match"] === etag) {
     res.status(304).end();
     return;
  }

  // 3) ترجم الحقول النصية حسب lang
  const t = (obj?: { ar?: string; en?: string }) =>
    obj?.[lang] ?? obj?.ar ?? obj?.en ?? "";

  const payload = slides.map((s) => ({
    key: s.key,
    title: t(s.title),
    subtitle: t(s.subtitle),
    media: s.media, // { type: "lottie" | "image", url }
    cta: { label: t(s.cta?.label), action: s.cta?.action },
    order: s.order ?? 0,
  }));

  // (اختياري) كاش متصفح قصير
  res.setHeader("Cache-Control", "public, max-age=60"); // دقيقة
  res.json({ version: etag, onboarding: payload });
  return;
}
