// services/campaign.queue.ts
import {
  Queue,
  Worker,
  Job,
  type RepeatOptions,
  type JobsOptions,
} from "bullmq";
import NotificationCampaign from "../models/NotificationCampaign";
import { buildAudience } from "./audience.service";
import { sendToUsers } from "./push.service";
import Notification from "../models/Notification";
import { redisConn } from "./redis";

export const campaignQueue = new Queue("notify:campaign", { connection: redisConn });

// helper: يولّد RepeatOptions صحيحة حسب نسخة bullmq
function makeRepeat(cronExpr: string): RepeatOptions {
  // v4 يستخدم pattern، v3 يستخدم cron
  return { pattern: cronExpr, tz: "UTC" } as any; // لأن الأنواع تغيّرت بين الإصدارات
}

export async function queueCampaign(
  campaignId: string,
  mode: "now" | "schedule"
) {
  const c = await NotificationCampaign.findById(campaignId).lean();
  if (!c) throw new Error("Campaign not found");

  // مهم: jobId لمنع تكرار نفس الحملة
  const baseOpts: JobsOptions = {
    jobId: `campaign:${campaignId}`,
    removeOnComplete: true,
  };

  if (c.schedule?.type === "cron" && c.schedule.cron) {
    await campaignQueue.add(
      campaignId,
      { campaignId },
      { ...baseOpts, repeat: makeRepeat(c.schedule.cron) }
    );
  } else if (c.schedule?.type === "datetime" && c.schedule.when) {
    const delay = Math.max(0, +new Date(c.schedule.when) - Date.now());
    await campaignQueue.add(campaignId, { campaignId }, { ...baseOpts, delay });
  } else {
    await campaignQueue.add(campaignId, { campaignId }, baseOpts);
  }
}

export async function cancelCampaign(campaignId: string) {
  const c = await NotificationCampaign.findById(campaignId).lean();
  if (!c) return;

  if (c.schedule?.type === "cron" && c.schedule.cron) {
    // الإلغاء الصحيح لِكرون:
    await campaignQueue.removeRepeatable(
      campaignId, // name = اسم الوظيفة اللي استخدمناه في add
      makeRepeat(c.schedule.cron) // نفس repeat options
    );
  } else {
    // jobs مؤجلة/فورية: احذفها إن كانت موجودة (حسب jobId)
    await campaignQueue.remove(`campaign:${campaignId}`).catch(() => {});
  }
}

export const campaignWorker = new Worker(
  "notify:campaign",
  async (job: Job) => {
    const c = await NotificationCampaign.findById(job.data.campaignId);
    if (!c) return;

    c.status = "running";
    await c.save();

    const users = await buildAudience(c.audience as any);
    const batches: string[][] = [];
    const size = 500;
    for (let i = 0; i < users.length; i += size)
      batches.push(users.slice(i, i + size));

    let sent = 0,
      failed = 0;

    for (const group of batches) {
      try {
        const out = await sendToUsers(
          group,
          { ...c.message },
          c.audience?.apps || ["user"]
        );
        sent += out.sent || 0;
        await Notification.create({
          toUser: group.length === 1 ? group[0] : undefined,
          title: c.message.title,
          body: c.message.body,
          data: c.message.data,
          status: "sent",
          tickets: out.tickets,
        });
      } catch {
        failed += group.length;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    c.status = "completed";
    c.stats = {
      ...(c.stats || {}),
      queued: users.length,
      sent,
      failed,
      delivered: sent,
      uniqueUsers: users.length,
    };
    await c.save();
  },
  { connection: redisConn, concurrency: 2 }
);
