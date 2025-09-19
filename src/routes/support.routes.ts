import { Router } from "express";
import { z } from "zod";
import { verifyFirebase } from "../middleware/verifyFirebase";
import { ensureOwner } from "../middleware/ensureOwner";
import SupportTicket from "../models/SupportTicket";
import Message from "../models/MessageSupport";
import MessageSupport from "../models/MessageSupport";
import { io } from "../index"; // تصدّره من src/index.ts
import { sendSupportPush } from "../services/push.service";

const r = Router();

// تذاكري (أحدثها أولاً)
r.get("/tickets/my", verifyFirebase, async (req: any, res) => {
  const uid = req.user.uid;
  const tickets = await SupportTicket.find({ userId: uid })
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .lean();
  res.json(tickets);
});

// فتح تذكرة
r.post("/tickets", verifyFirebase, async (req: any, res) => {
  const body = z
    .object({
      subject: z.string().min(3).max(200),
      message: z.string().min(1).max(4000),
    })
    .parse(req.body);

  const t = await SupportTicket.create({
    userId: req.user.uid,
    subject: body.subject,
    status: "open",
    lastMessageAt: new Date(),
  });

  const msg = await Message.create({
    ticketId: t._id,
    sender: "user",
    text: body.message,
  });
// بعد إنشاء msg

  // بث أول رسالة + تحديث غرف المستخدم
  const payload = {
    _id: msg._id,
    sender: msg.sender,
    text: msg.text,
    createdAt: msg.createdAt,
  };
  io.to(`ticket_${t._id}`).emit("support:msg:new", payload);
  io.to(`user_${req.user.uid}`).emit("support:msg:new", {
    ticketId: String(t._id),
    ...payload,
  });
  await sendSupportPush(t.userId, msg.text || "لديك رسالة جديدة من الدعم");

  res.status(201).json(t);
});

// قراءة رسائل (cursor by _id)
r.get(
  "/tickets/:id/messages",
  verifyFirebase,
  ensureOwner,
  async (req: any, res) => {
    const limit = Math.min(parseInt(String(req.query.limit ?? 20)), 50);
    const cursor = req.query.cursor as string | undefined; // _id أقدم من هذا
    const q: any = { ticketId: req.ticket._id };
    if (cursor) q._id = { $lt: cursor };

    const rows = await MessageSupport.find(q)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    res.json({
      items,
      nextCursor: hasMore ? String(items[items.length - 1]._id) : null,
    });
  }
);

// إرسال رسالة مستخدم
r.post(
  "/tickets/:id/messages",
  verifyFirebase,
  ensureOwner,
  async (req: any, res) => {
    const body = z
      .object({ text: z.string().min(1).max(4000) })
      .parse(req.body);

    if (req.ticket.status === "closed") {
      res.status(400).json({ message: "Ticket closed" });
      return;
    }

    const msg = await MessageSupport.create({
      ticketId: req.ticket._id,
      sender: "user",
      text: body.text,
    });

    await SupportTicket.updateOne(
      { _id: req.ticket._id },
      { $set: { lastMessageAt: new Date() } }
    );

    const payload = {
      _id: msg._id,
      sender: msg.sender,
      text: msg.text,
      createdAt: msg.createdAt,
    };
    io.to(`ticket_${req.ticket._id}`).emit("support:msg:new", payload);
    io.to(`user_${req.user.uid}`).emit("support:msg:new", {
      ticketId: String(req.ticket._id),
      ...payload,
    });
    
    res.status(201).json({ ok: true, id: msg._id });
    return;
  }
);

// إغلاق/إعادة فتح
r.put(
  "/tickets/:id/close",
  verifyFirebase,
  ensureOwner,
  async (req: any, res) => {
    await SupportTicket.updateOne(
      { _id: req.ticket._id },
      { $set: { status: "closed" } }
    );
    res.json({ ok: true });
    return;
  }
);
r.put(
  "/tickets/:id/reopen",
  verifyFirebase,
  ensureOwner,
  async (req: any, res) => {
    await SupportTicket.updateOne(
      { _id: req.ticket._id },
      { $set: { status: "open" } }
    );
    res.json({ ok: true });
    return;
  }
);

export default r;
