import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import { db } from "@/lib/db";
import { EnquiryForm, ReportForm } from "@/components/public-forms";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await db.listing.findUnique({ where: { slug }, select: { title: true, city: true, description: true } });
  return listing ? { title: `${listing.title} in ${listing.city}`, description: listing.description.slice(0, 155) } : { title: "Woning niet gevonden" };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await db.listing.findFirst({ where: { slug, status: "PUBLISHED", expiresAt: { gt: new Date() } }, include: { agency: true } });
  if (!listing) notFound();
  const photos = listing.images.length ? listing.images : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"];
  return <div className="wrap page-body">
    <p className="listing-location"><Link href="/zoeken">Woningen</Link>　/　{listing.city}</p>
    <div className="detail-grid"><div className="detail-main">
      <div className="detail-image" role="img" aria-label={listing.title} style={{ backgroundImage: `url("${photos[0]}")` }} />
      {photos.length > 1 && <div className="detail-gallery">{photos.slice(1, 3).map((photo, index) => <div className="detail-image" key={photo} role="img" aria-label={`${listing.title}, foto ${index + 2}`} style={{ backgroundImage: `url("${photo}")` }} />)}</div>}
      <h2>Over deze {listing.propertyType === "COMMERCIAL" || listing.propertyType === "OFFICE" || listing.propertyType === "RETAIL" ? "bedrijfsruimte" : "woning"}</h2>
      <p>{listing.description}</p>
      <div className="listing-meta"><span><Ruler size={16} />{listing.areaSqm} m²</span><span><BedDouble size={16} />{listing.bedrooms} slaapkamers</span><span><Bath size={16} />{listing.bathrooms} badkamers</span></div>
      {listing.energyLabel && <p><strong>Energielabel:</strong> {listing.energyLabel}</p>}
      <h2>Over de aanbieder</h2><Link className="agency-card" href={`/makelaars/${listing.agency.slug}`}><div className="agency-avatar">{listing.agency.name.slice(0, 1)}</div><h3>{listing.agency.name}</h3><p>{listing.agency.city} · Bekijk makelaar</p></Link>
      <ReportForm listingId={listing.id} />
    </div><aside className="detail-aside"><span className="badge badge-type">{listing.offerType === "RENT" ? "Te huur" : "Te koop"}</span><h1>{listing.title}</h1><p className="listing-location"><MapPin size={16} />{listing.city} · {listing.postalCode}</p><div className="listing-price">€ {listing.price.toLocaleString("nl-NL")} <span>{listing.offerType === "RENT" ? " / maand" : " k.k."}</span></div><p className="notice">Bijgewerkt op {listing.updatedAt.toLocaleDateString("nl-NL")}. Beschikbaar t/m {listing.expiresAt.toLocaleDateString("nl-NL")}.</p><hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "20px 0" }} /><EnquiryForm listingId={listing.id} /></aside></div>
  </div>;
}
