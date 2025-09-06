// routes/admin.notifications.routes.ts
import { Router } from "express";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import NotificationCampaign from "../../models/NotificationCampaign";
import NotificationTemplate from "../../models/NotificationTemplate";
import { buildAudience } from "../../services/audience.service";
import { cancelCampaign, queueCampaign } from "../../services/campaign.queue";

const r = Router();
r.use(verifyAdmin);

// إنشاء/تحديث حملة
r.post("/campaigns", async (req, res) => {
  const actor = (req as any).admin || (req as any).user;
  const c = await NotificationCampaign.create({
    ...req.body,
    status: "draft",
    createdBy: actor?.id || "admin"
  });
  res.status(201).json(c);
});

r.patch("/campaigns/:id", async (req, res) => {
  const c = await NotificationCampaign.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
  if (!c) {
    res.status(404).json({ message: "Not found" });
    return;
  } 
  res.json(c);
});

// معاينة الجمهور
r.post("/campaigns/:id/audience-preview", async (req, res) => {
  const c = await NotificationCampaign.findById(req.params.id);
  if (!c) {
    res.status(404).json({ message: "Not found" });
    return;
  } 
  const users = await buildAudience(c.audience as any);
  res.json({ count: users.length, sample: users.slice(0,50) });
});

// إرسال اختبار إلى مستخدم واحد
r.post("/test", async (req, res) => {
  const { userId, title, body, data, channelId } = req.body;
  const { sendToUsers } = await import("../../services/push.service");
  const out = await sendToUsers([userId], { title, body, data, channelId: channelId || "orders" }, ["user"]);
  res.json(out);
});

// جدولة/تشغيل حملة
r.post("/campaigns/:id/send", async (req, res) => {
  const c = await NotificationCampaign.findById(req.params.id);
  if (!c) {
    res.status(404).json({ message: "Not found" });
    return;
  } 

  if (c.schedule?.type === "now") {
    await queueCampaign(c._id.toString(), "now");
  } else {
    await queueCampaign(c._id.toString(), "schedule"); // cron/datetime
  }
  c.status = "scheduled";
  await c.save();
  res.json({ ok: true });
});

// إلغاء حملة مجدولة/جارية
r.post("/campaigns/:id/cancel", async (req, res) => {
  await cancelCampaign(req.params.id);
  await NotificationCampaign.findByIdAndUpdate(req.params.id, { status: "cancelled" });
  res.json({ ok: true });
});

// قائمة الحملات
r.get("/campaigns", async (_req,res) => {
  const items = await NotificationCampaign.find().sort({ createdAt: -1 }).lean();
  res.json(items);
});

// قوالب
r.post("/templates", async (req,res)=> {
  const t = await NotificationTemplate.create(req.body);
  res.status(201).json(t);
});
r.get("/templates", async (_req,res)=> {
  res.json(await NotificationTemplate.find().lean());
});

export default r;
