// middleware/ensureOwner.ts
import SupportTicket from "../models/support/SupportTicket";

export async function ensureOwner(req: any, res: any, next: any) {
  const t = await SupportTicket.findById(req.params.id).lean();
  if (!t) return res.status(404).json({ message: "Not found" });
  if (t.requester.userId !== req.user.uid) return res.status(403).json({ message: "Forbidden" });
  (req as any).ticket = t;
  next();
}
