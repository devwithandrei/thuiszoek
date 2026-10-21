import { db } from "@/lib/db";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Cron is niet geconfigureerd." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Niet bevoegd." }, { status: 401 });
  const result = await db.listing.updateMany({ where: { status: "PUBLISHED", expiresAt: { lte: new Date() } }, data: { status: "EXPIRED" } });
  const rateLimitCleanup = await db.rateLimitBucket.deleteMany({ where: { updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
  return Response.json({ expired: result.count, rateLimitBucketsRemoved: rateLimitCleanup.count });
}
