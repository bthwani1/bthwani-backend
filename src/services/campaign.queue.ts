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

const QUEUE_NAME = "notify-campaign"; // <-- بدون :
const connection = process.env.REDIS_URL
  ? ({
      url: process.env.REDIS_URL,
      tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    } as any)
  : ({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: +(process.env.REDIS_PORT || 6379),
      username: process.env.REDIS_USERNAME || "default",
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    } as any);

export const campaignQueue = new Queue(QUEUE_NAME, { connection });

// v4+ يستخدم pattern (لو كنت على v3 غيّرها لـ cron)
const makeRepeat = (expr: string): RepeatOptions =>
  ({ pattern: expr, tz: "UTC" } as any);

export async function queueCampaign(
  campaignId: string,
  mode: "now" | "schedule"
) {
  const c = await NotificationCampaign.findById(campaignId).lean();
  if (!c) throw new Error("Campaign not found");

  const baseOpts: JobsOptions = {
    jobId: `campaign-${campaignId}`,
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
    await campaignQueue.removeRepeatable(
      campaignId,
      makeRepeat(c.schedule.cron)
    ); // اسم الجوب = campaignId
  } else {
    await campaignQueue.remove(`campaign-${campaignId}`).catch(() => {});
  }
}

export const campaignWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    const c = await NotificationCampaign.findById(job.data.campaignId);
    if (!c) return;

    c.status = "running";
    await c.save();

    const users = await buildAudience(c.audience as any);
    const size = 500;
    let sent = 0,
      failed = 0;

    for (let i = 0; i < users.length; i += size) {
      const group = users.slice(i, i + size);
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
  { connection, concurrency: 2 }
);
