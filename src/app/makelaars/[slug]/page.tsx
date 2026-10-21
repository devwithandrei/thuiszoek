import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ListingCard } from "@/components/listing-card";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agency = await db.agency.findUnique({ where: { slug }, select: { name: true, description: true } });
  return agency ? { title: agency.name, description: agency.description.slice(0, 155) } : { title: "Makelaar niet gevonden" };
}
export default async function AgencyPage({ params }: Props) {
  const { slug } = await params;
  const agency = await db.agency.findUnique({ where: { slug }, include: { listings: { where: { status: "PUBLISHED", expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, take: 60 } } });
  if (!agency) notFound();
  return <><section className="page-hero"><div className="wrap"><div className="agency-avatar">{agency.name.slice(0, 1)}</div><h1 className="page-title">{agency.name}{agency.verified && <span className="status-pill" style={{ marginLeft: 12 }}>Geverifieerd</span>}</h1><p>{agency.city}{agency.website && <> · <a className="text-link" href={agency.website} target="_blank" rel="noreferrer">Website</a></>}</p><p>{agency.description}</p>{agency.phone && <p>Telefoon: {agency.phone}</p>}</div></section><section className="section"><div className="wrap"><div className="section-head"><div><span className="eyebrow">Actueel aanbod</span><h2>Woningen van {agency.name}</h2></div></div>{agency.listings.length ? <div className="listing-grid">{agency.listings.map((item, index) => <ListingCard key={item.id} listing={item} index={index} />)}</div> : <div className="empty-state">Deze makelaar heeft op dit moment geen actief aanbod.</div>}</div></section></>;
}
