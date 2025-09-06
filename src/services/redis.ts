// services/redis.ts (اختياري)
export const redisConn =
  process.env.REDIS_URL
    ? ({ url: process.env.REDIS_URL, tls: process.env.REDIS_TLS === "true" ? {} : undefined } as any)
    : ({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: +(process.env.REDIS_PORT || 6379),
        username: process.env.REDIS_USERNAME || "default",
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === "true" ? {} : undefined,
      } as any);
