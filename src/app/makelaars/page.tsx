import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Makelaars" };

export default async function AgenciesPage() {
  const agencies = await db.agency.findMany({ where: { listings: { some: { status: "PUBLISHED", expiresAt: { gt: new Date() } } } }, orderBy: { name: "asc" }, take: 60, include: { _count: { select: { listings: { where: { status: "PUBLISHED", expiresAt: { gt: new Date() } } } } } } });
  return <><section className="page-hero"><div className="wrap"><span className="eyebrow">Onze partners</span><h1 className="page-title">Ontdek makelaars</h1><p>Bekijk de makelaars die hun actuele aanbod op ThuisZoek delen.</p></div></section><section className="page-body"><div className="wrap"><div className="listing-grid">{agencies.map((agency) => <Link href={`/makelaars/${agency.slug}`} className="agency-card" key={agency.id}><div className="agency-avatar">{agency.name.slice(0, 1)}</div><h2>{agency.name}{agency.verified && <span className="status-pill" style={{ marginLeft: 8 }}>Geverifieerd</span>}</h2><p>{agency.city} · {agency._count.listings} actuele advertenties</p><p>{agency.description.slice(0, 160)}…</p></Link>)}</div>{!agencies.length && <div className="empty-state">Er zijn nog geen actieve makelaarsprofielen.</div>}</div></section></>;
}
