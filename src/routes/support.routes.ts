import { Router } from "express";
import SupportTicket from "../models/SupportTicket";
import { verifyFirebase } from "../middleware/verifyFirebase";

const r = Router();

r.get("/support/tickets/my", verifyFirebase, async (req: any, res) => {
  const uid = req.user.uid;
  const list = await SupportTicket.find({ userId: uid }).sort({
    updatedAt: -1,
  });
  res.json(list);
});

r.post("/support/tickets", verifyFirebase, async (req: any, res) => {
  const uid = req.user.uid;
  const { subject, message } = req.body;
  const t = await SupportTicket.create({
    userId: uid,
    subject,
    messages: [{ sender: "user", text: message }],
  });
  res.status(201).json(t);
});

r.get("/support/tickets/:id/messages", verifyFirebase, async (req, res) => {
  const t = await SupportTicket.findById(req.params.id);
  res.json(t?.messages || []);
});

r.post("/support/tickets/:id/messages", verifyFirebase, async (req, res) => {
  const t = await SupportTicket.findById(req.params.id);
  if (!t) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  t.messages.push({ sender: "user", text: req.body.text });
  await t.save();
  res.status(201).json({ ok: true });
});

export default r;
