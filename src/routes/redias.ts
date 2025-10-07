import { Router } from "express";
import IORedis from "ioredis";
const r = Router();

const client = new IORedis(process.env.REDIS_URL!, {
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
});

r.get("/", async (_req, res) => {
  try {
    await client.set("bthwani:test", String(Date.now()), "EX", 60);
    const v = await client.get("bthwani:test");
    res.json({ ok: true, value: v });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default r;
