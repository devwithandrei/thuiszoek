import { Prisma } from "@prisma/client";
import { isIP } from "node:net";
import { db } from "@/lib/db";

export function clientAddress(request: Request) {
  const address = request.headers.get("x-real-ip");
  return address && isIP(address) ? address : "unknown";
}

export async function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowStart = new Date(now - windowMs);
  const current = new Date(now);
  const buckets = await db.$queryRaw<Array<{ hits: number }>>(Prisma.sql`
    INSERT INTO "RateLimitBucket" ("key", "hits", "windowStartedAt", "updatedAt")
    VALUES (${key}, 1, ${current}, ${current})
    ON CONFLICT ("key") DO UPDATE SET
      "hits" = CASE WHEN "RateLimitBucket"."windowStartedAt" <= ${windowStart} THEN 1 ELSE "RateLimitBucket"."hits" + 1 END,
      "windowStartedAt" = CASE WHEN "RateLimitBucket"."windowStartedAt" <= ${windowStart} THEN ${current} ELSE "RateLimitBucket"."windowStartedAt" END,
      "updatedAt" = ${current}
    RETURNING "hits"
  `);
  return (buckets[0]?.hits ?? limit + 1) <= limit;
}
