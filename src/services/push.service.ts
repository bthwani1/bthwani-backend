// services/push.service.ts
import fetch from "node-fetch";
import PushToken from "../models/PushToken";
import Notification from "../models/Notification";

const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS = "https://exp.host/--/api/v2/push/getReceipts";

type ExpoMessage = {
  to: string;
  sound?: "default" | null;
  title?: string;
  body?: string;
  data?: any;
  priority?: "default" | "normal" | "high";
  channelId?: string;
  badge?: number;
  collapseId?: string;
};

const chunk = <T>(arr: T[], size: number) =>
  arr.reduce(
    (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
    [] as T[][]
  );

export async function sendToUsers(
  userIds: string[],
  msg: Omit<ExpoMessage, "to"> & { collapseId?: string },
  audience: string[] = ["user"]
) {
  const tokens = await PushToken.find({
    userId: { $in: userIds },
    disabled: { $ne: true },
  }).lean();

  if (!tokens.length) return { sent: 0, tickets: [] };

  const messages: ExpoMessage[] = tokens.map((t) => ({
    to: t.token,
    sound: "default",
    priority: "high",
    ...msg,
  }));

  // خزن سجل الإشعار (اختياري)
  const log = await Notification.create({
    toUser: userIds.length === 1 ? userIds[0] : undefined,
    audience,
    collapseId: msg.collapseId,
    title: msg.title,
    body: msg.body,
    data: msg.data,
    status: "queued",
  });

  const batches = chunk(messages, 100); // شرط Expo
  const allTickets: any[] = [];

  for (const batch of batches) {
    const res = await fetch(EXPO_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });
    const json: any = await res.json();
    if (json?.data) allTickets.push(...json.data);
    // أخطاء على مستوى الطلب
    if (json?.errors?.length) {
      console.error("Expo push errors:", json.errors);
    }
  }

  await Notification.findByIdAndUpdate(log._id, {
    $set: { tickets: allTickets, status: "sent" },
  });

  // لاحقاً (بعد ثواني) تحقّق من receipts ونظّف التوكنات السيئة
  setTimeout(
    () =>
      checkReceiptsAndClean(allTickets, log._id.toString()).catch(
        console.error
      ),
    4000
  );

  return { sent: messages.length, tickets: allTickets };
}
export async function sendToTokens(
  tokens: string[],
  msg: Omit<ExpoMessage, "to">
) {
  if (!tokens.length) return { sent: 0, tickets: [] };
  const messages: ExpoMessage[] = tokens.map((t) => ({
    to: t,
    sound: "default",
    priority: "high",
    ...msg,
  }));
  const batches = chunk(messages, 100);
  const tickets: any[] = [];

  for (const b of batches) {
    const res = await fetch(EXPO_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(b),
    });
    const json = await res.json();
    if (json?.data) tickets.push(...json.data);
  }
  return { sent: messages.length, tickets };
}
async function checkReceiptsAndClean(tickets: any[], logId: string) {
  const ids = tickets.map((t) => t.id).filter(Boolean);
  if (!ids.length) return;

  const res = await fetch(EXPO_RECEIPTS, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
  const json: any = await res.json();
  const receipts = json?.data || {};

  await Notification.findByIdAndUpdate(logId, { $set: { receipts } });

  // تنظيف:
  for (const [_, r] of Object.entries<any>(receipts)) {
    if (r.status === "ok") continue;
    if (r.status === "error") {
      const code = r.details?.error;
      // أشهر الأكواد: DeviceNotRegistered, MessageTooBig, MessageRateExceeded, ...
      if (code === "DeviceNotRegistered") {
        const token = r.details?.receiver; // أحياناً لا يأتي
        if (token) {
          await PushToken.updateOne(
            { token },
            { $set: { disabled: true }, $inc: { failureCount: 1 } }
          );
        }
      }
    }
  }
}
