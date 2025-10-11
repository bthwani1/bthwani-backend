import MessageMetric from "../../models/MessageMetric";
import Message from "../../models/Message";
import MessagingPrefs from "../../models/support/MessagingPrefs";
import { whatsappService } from "../whatsapp.service";
import { smsService } from "../sms.service";
import { sendToUsers } from "../push.service";

export async function filterByCap(
  userIds: string[],
  channel: "push" | "sms" | "inapp" = "push"
) {
  const prefs = await MessagingPrefs.find({ userId: { $in: userIds } }).lean();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const ok = new Set<string>();

  for (const u of userIds) {
    const p = prefs.find((x) => x.userId === u);
    // opt-in
    if (p) {
      if (channel === "push" && p.channels?.push === false) continue;
      if (channel === "sms" && p.channels?.sms === false) continue;
      if (channel === "inapp" && p.channels?.inApp === false) continue;
    }

    // cap اليومي
    const cnt = await MessageMetric.countDocuments({
      userId: u,
      channel,
      status: "sent",
      timestamp: { $gte: since },
    });

    const dailyCap = p?.caps?.perDay ?? 1;
    if (cnt >= dailyCap) continue;

    // فحص quiet hours
    if (p?.quietHours && isInQuietHours(p.quietHours as { start: string; end: string; tz?: string })) {
      continue;
    }

    ok.add(u);
  }
  return Array.from(ok);
}

// دالة لفحص ما إذا كان الوقت الحالي في فترة الهدوء
function isInQuietHours(quietHours: { start: string; end: string; tz?: string }): boolean {
  const now = new Date();
  const userTz = quietHours.tz || 'Asia/Aden';

  // تحويل الوقت إلى دقائق من منتصف الليل
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = quietHours.start.split(':').map(Number);
  const [endHour, endMinute] = quietHours.end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // التعامل مع حالة عبور منتصف الليل (مثل 22:00 - 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// دالة إرسال موحدة لجميع القنوات
export async function sendMessageToUsers(
  userIds: string[],
  title: string | undefined,
  body: string,
  channel: "push" | "sms" | "inapp",
  messageId: any,
  phoneNumbers?: string[] // للـ SMS/WhatsApp
) {
  const now = new Date();
  const sentCount = { push: 0, sms: 0, inapp: 0 };

  try {
    // إرسال عبر Push Notifications
    if (channel === "push" && userIds.length > 0) {
      const result = await sendToUsers(userIds, {
        title,
        body,
        data: { messageId, channel }
      });
      sentCount.push = result.sent;

      // تسجيل المقاييس
      const pushMetrics = userIds.slice(0, result.sent).map((userId) => ({
        userId,
        messageId,
        channel: "push",
        status: "sent",
        timestamp: now,
      }));
      if (pushMetrics.length > 0) {
        await MessageMetric.insertMany(pushMetrics, { ordered: false });
      }
    }

    // إرسال عبر SMS/WhatsApp
    if (channel === "sms" && phoneNumbers && phoneNumbers.length > 0) {
      for (const phone of phoneNumbers) {
        const success = await smsService.sendSMS(phone, body, messageId);
        if (success) sentCount.sms++;
      }
    }

    // إرسال داخل التطبيق (in-app notifications)
    if (channel === "inapp" && userIds.length > 0) {
      const inAppMetrics = userIds.map((userId) => ({
        userId,
        messageId,
        channel: "inapp",
        status: "sent",
        timestamp: now,
      }));
      if (inAppMetrics.length > 0) {
        await MessageMetric.insertMany(inAppMetrics, { ordered: false });
        sentCount.inapp = inAppMetrics.length;
      }
    }

    // تحديث حالة الرسالة
    await Message.updateOne(
      { _id: messageId },
      {
        $set: {
          status: "sent",
          sentAt: now,
          sentCount: Object.values(sentCount).reduce((a, b) => a + b, 0)
        }
      }
    );

    return sentCount;
  } catch (error) {
    console.error('Message sending error:', error);

    // تحديث حالة الرسالة إلى فشل
    await Message.updateOne(
      { _id: messageId },
      { $set: { status: "failed", error: error.message } }
    );

    throw error;
  }
}

// دالة إرسال Push المحدثة للتوافق مع الشكل القديم
export async function sendPushToUsers(
  userIds: string[],
  title: string | undefined,
  body: string,
  messageId: any
) {
  return sendMessageToUsers(userIds, title, body, "push", messageId);
}
