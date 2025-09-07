// routes/admin.notifications.test.ts
import { Router } from "express";
import { sendToUsers } from "../../services/push.service"; // التي ترسل عبر Expo
const r = Router();

// يتطلّب JWT أدمن لو عندك verifyAdmin… (أو علّق الحماية مؤقتاً للاختبار)
r.post("/admin/notifications/test", async (req, res) => {
  try {
    const { userId, title, body, data, channelId } = req.body;
    if (!userId) {
        res.status(400).json({ message: "userId required" });
        return;
    } 

    const out = await sendToUsers(
      [userId],
      {
        title,
        body,
        data,
        channelId: channelId || "orders",
        collapseId: "debug:test",
      },
      ["user"] // التطبيق المستهدف
    );
    res.json({ ok: true, ...out });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

export default r;
