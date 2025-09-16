import { Request, Response } from "express";
import DailyPrice from "../../models/delivery_marketplace_v1/DailyPrice";

export const listDaily = async (req: Request, res: Response) => {
  try {
    const kind = req.query.kind as "gas" | "water";
    const city = req.query.city as string;
    if (!kind || !city) {
      res.status(400).json({ message: "kind و city مطلوبة" });
      return;
    }

    const rows = await DailyPrice.find({ kind, city })
      .sort({ date: -1, variant: 1 })
      .lean();

    res.json(
      rows.map((r) => ({
        _id: r._id?.toString(),
        kind: r.kind,
        city: r.city,
        date: r.date, // "YYYY-MM-DD"
        variant: r.variant ?? undefined,
        price: r.price,
      }))
    );
  } catch (e: any) {
    res
      .status(500)
      .json({ message: e.message || "تعذر تحميل الأسعار اليومية" });
  }
};

export const upsertDaily = async (req: Request, res: Response) => {
  try {
    const { kind, city, date, price, variant } = req.body as {
      kind: "gas" | "water";
      city: string;
      date: string; // YYYY-MM-DD
      price: number;
      variant?: string;
    };

    if (!kind || !city || !date || typeof price !== "number") {
      res.status(400).json({ message: "بيانات ناقصة" });
      return;
    }

    const doc = await DailyPrice.findOneAndUpdate(
      { kind, city, date, variant: variant ?? null },
      { $set: { price } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      _id: doc?._id?.toString(),
      kind: doc!.kind,
      city: doc!.city,
      date: doc!.date,
      variant: doc!.variant ?? undefined,
      price: doc!.price,
    });
  } catch (e: any) {
    // معالجة خطأ التكرار الفريد
    if (e?.code === 11000) {
      res.status(409).json({ message: "سجل مكرر لنفس اليوم/المقاس" });
      return;
    }
    res.status(500).json({ message: e.message || "فشل الحفظ" });
  }
};

export const deleteDailyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "id مطلوب" });
      return;
    }
    await DailyPrice.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "فشل الحذف" });
  }
};

export const deleteDailyByKey = async (req: Request, res: Response) => {
  try {
    const kind = req.query.kind as "gas" | "water";
    const city = req.query.city as string;
    const date = req.query.date as string; // YYYY-MM-DD
    const variant = (req.query.variant as string) ?? null;

    if (!kind || !city || !date) {
      res.status(400).json({ message: "kind و city و date مطلوبة" });
      return;
    }

    await DailyPrice.findOneAndDelete({ kind, city, date, variant });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: e.message || "فشل الحذف" });
  }
};
