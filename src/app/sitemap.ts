import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://thuiszoek.nl";
  const [listings, agencies] = await Promise.all([
    db.listing.findMany({ where: { status: "PUBLISHED", expiresAt: { gt: new Date() } }, select: { slug: true, updatedAt: true }, take: 5000 }),
    db.agency.findMany({ where: { listings: { some: { status: "PUBLISHED", expiresAt: { gt: new Date() } } } }, select: { slug: true, updatedAt: true }, take: 1000 }),
  ]);
  return [
    ...["", "/zoeken", "/contact", "/privacy", "/voorwaarden"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: path ? 0.7 : 1 })),
    ...listings.map((listing) => ({ url: `${base}/woning/${listing.slug}`, lastModified: listing.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...agencies.map((agency) => ({ url: `${base}/makelaars/${agency.slug}`, lastModified: agency.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
