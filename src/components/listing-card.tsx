import Link from "next/link";
import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";

export type ListingCardData = {
  id: string; slug: string; title: string; city: string; price: number; areaSqm: number;
  bedrooms: number; bathrooms: number; offerType: "RENT" | "BUY"; propertyType: string;
  images: string[]; featured?: boolean;
};

const photos = [
  "photo-1600596542815-ffad4c1539a9",
  "photo-1600607687939-ce8a6c25118c",
  "photo-1600566753086-00f18fb6b3ea",
  "photo-1600607687920-4e2a09cf159d",
];

export function ListingCard({ listing, index = 0 }: { listing: ListingCardData; index?: number }) {
  const image = listing.images[0] || `https://images.unsplash.com/${photos[index % photos.length]}?auto=format&fit=crop&w=1000&q=80`;
  return <article className="listing-card">
    <Link href={`/woning/${listing.slug}`} className="listing-image" style={{ backgroundImage: `url("${image}")` }} aria-label={listing.title}>
      {listing.featured && <span className="badge badge-featured">Uitgelicht</span>}
      <span className="badge badge-type">{listing.offerType === "RENT" ? "Te huur" : "Te koop"}</span>
      <span className="image-count">{listing.images.length || 5} foto&apos;s</span>
    </Link>
    <div className="listing-content">
      <div className="listing-price">€ {listing.price.toLocaleString("nl-NL")} <span>{listing.offerType === "RENT" ? " / maand" : " k.k."}</span></div>
      <Link href={`/woning/${listing.slug}`} className="listing-title">{listing.title}</Link>
      <div className="listing-location"><MapPin size={15} />{listing.city}</div>
      <div className="listing-meta"><span><Ruler size={15} />{listing.areaSqm} m²</span><span><BedDouble size={15} />{listing.bedrooms} slpk.</span><span><Bath size={15} />{listing.bathrooms} badk.</span></div>
    </div>
  </article>;
}
