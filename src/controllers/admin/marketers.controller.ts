import { Request, Response } from "express";
import Marketer from "../../models/fieldMarketingV1/Marketer";
import bcrypt from "bcrypt";
import { Parser } from "json2csv";

// Helpers (Firebase claims اختياري)
async function setFirebaseCustomClaims(firebaseUid: string, role = "marketer") {
  // TODO: admin.auth().setCustomUserClaims(firebaseUid, { role })
  return true;
}

export async function invite(req: Request, res: Response) {
  try {
    const {
      fullName,
      phone,
      email,
      password,
      city,
      team,
      area,
      commissionPlanId,
      firebaseUid,
    } = req.body;

    if (!fullName || !phone) {
      res.status(400).json({ message: "fullName و phone مطلوبة" });
      return;
    }

    const exists = await Marketer.findOne({
      $or: [{ phone }, { email: email?.toLowerCase() }],
    });
    if (exists) {
      res.status(409).json({ message: "رقم الهاتف أو البريد مستخدم مسبقًا" });
      return;
    }

    let hashed: string | undefined;
    if (password) {
      if (String(password).length < 8)
        res.status(400).json({ message: "الحد الأدنى 8 أحرف لكلمة المرور" });

      hashed = await bcrypt.hash(password, 10);
      // <-- لا تضع return هنا! نريد استمرار التنفيذ لبناء السجل وإعادة الاستجابة
    }

    const mk = await Marketer.create({
      fullName,
      phone,
      email: email?.toLowerCase(),
      city,
      team,
      area,
      status: "active",
      commissionPlanId,
      firebaseUid,
      ...(hashed ? { password: hashed } : {}),
    });

    if (firebaseUid) await setFirebaseCustomClaims(firebaseUid, "marketer");

    res.status(201).json(mk);
    return;
  } catch (err: any) {
    console.error("invite error:", err);
    // إذا كان خطأ من الـ unique index أرسل 409 أو 500
    if (err?.code === 11000) {
      res.status(409).json({ message: "تكرار بيانات (هاتف/بريد)" });
      return;
    }
    res.status(500).json({ message: err?.message || "Server error" });
    return;
  }
}

export async function list(req: Request, res: Response) {
  const { q, status } = req.query as any;
  const filter: any = {};
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { fullName: new RegExp(q, "i") },
      { phone: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { team: new RegExp(q, "i") },
      { area: new RegExp(q, "i") },
      { city: new RegExp(q, "i") },
    ];
  }
  const rows = await Marketer.find(filter).sort({ createdAt: -1 }).lean();
  res.json(rows);
}
export async function patch(req: Request, res: Response) {
  const { id } = req.params;
  const payload = { ...req.body };
  delete (payload as any).password;
  const m = await Marketer.findByIdAndUpdate(id, payload, { new: true }).lean();
  if (!m) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json(m);
}

export async function getById(req: Request, res: Response) {
  const mk = await Marketer.findById(req.params.id);
  if (!mk) return res.status(404).json({ message: "غير موجود" });
  res.json(mk);
}

export async function update(req: Request, res: Response) {
  const mk = await Marketer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!mk) return res.status(404).json({ message: "غير موجود" });
  res.json(mk);
}

export async function setStatus(req: Request, res: Response) {
  const { status } = req.body as { status: "active" | "suspended" };
  const mk = await Marketer.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!mk) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  res.json(mk);
}

export async function linkFirebase(req: Request, res: Response) {
  const { firebaseUid } = req.body;
  const mk = await Marketer.findByIdAndUpdate(
    req.params.id,
    { firebaseUid },
    { new: true }
  );
  if (!mk) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  if (firebaseUid) await setFirebaseCustomClaims(firebaseUid, "marketer");
  res.json(mk);
}

export async function resetPassword(req: Request, res: Response) {
  const { password } = req.body;
  if (!password || String(password).length < 8) {
    res.status(400).json({ message: "كلمة مرور غير صالحة" });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const mk = await Marketer.findByIdAndUpdate(
    req.params.id,
    { password: hash },
    { new: true, select: "-password" }
  );
  if (!mk) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  res.json({ ok: true });
}

export async function assignAreaTeamPlan(req: Request, res: Response) {
  const { area, team, commissionPlanId } = req.body;
  const mk = await Marketer.findByIdAndUpdate(
    req.params.id,
    { area, team, commissionPlanId },
    { new: true }
  );
  if (!mk) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  res.json(mk);
}

export async function setTargets(req: Request, res: Response) {
  // حقول خفيفة توضع داخل marketer أو جدول منفصل حسب حاجتك
  const { monthlyStoresTarget, monthlyApprovalRateTarget } = req.body;
  const mk = await Marketer.findByIdAndUpdate(
    req.params.id,
    { monthlyStoresTarget, monthlyApprovalRateTarget },
    { new: true }
  );
  if (!mk) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  res.json(mk);
}

export async function softDelete(req: Request, res: Response) {
  const mk = await Marketer.findByIdAndUpdate(
    req.params.id,
    { status: "suspended" },
    { new: true }
  );
  if (!mk) {
    res.status(404).json({ message: "غير موجود" });
    return;
  }
  res.json({ ok: true });
}

export async function exportCSV(_req: Request, res: Response) {
  const rows = await Marketer.find().lean();
  const parser = new Parser({
    fields: [
      "_id",
      "fullName",
      "phone",
      "email",
      "city",
      "team",
      "area",
      "status",
      "createdAt",
    ],
  });
  const csv = parser.parse(rows);
  res.header("Content-Type", "text/csv; charset=utf-8");
  res.attachment("marketers-export.csv");
  res.send(csv);
}
