import Link from "next/link";
import { ArrowRight, BadgeCheck, HeartHandshake, SearchCheck } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { SearchForm } from "@/components/search-form";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const listings = await db.listing.findMany({
    where: { status: "PUBLISHED", expiresAt: { gt: new Date() } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 6,
    select: { id: true, slug: true, title: true, city: true, price: true, areaSqm: true, bedrooms: true, bathrooms: true, offerType: true, propertyType: true, images: true, featured: true },
  });
  return <>
    <section className="home-hero"><div className="hero-content">
      <span className="eyebrow">Jouw nieuwe plek wacht op je</span>
      <h1>Vind een plek<br />die als thuis voelt.</h1>
      <p>Ontdek woningen en bedrijfspanden door heel Nederland.</p>
      <SearchForm large />
    </div></section>
    <section className="section"><div className="wrap">
      <div className="section-head"><div><span className="eyebrow">Vers op ThuisZoek</span><h2>Woningen om bij weg te dromen</h2><p>Nieuw aanbod, zorgvuldig samengesteld.</p></div><Link className="text-link" href="/zoeken">Bekijk alle woningen <ArrowRight size={15} /></Link></div>
      {listings.length ? <div className="listing-grid">{listings.map((listing, i) => <ListingCard key={listing.id} listing={listing} index={i} />)}</div> : <div className="empty-state">Er staan nog geen woningen online. Kom binnenkort nog eens kijken.</div>}
    </div></section>
    <section className="benefit-band"><div className="wrap benefit-grid">
      <div className="benefit"><div className="benefit-icon"><SearchCheck /></div><h3>Vind wat echt bij je past</h3><p>Zoek gericht tussen koop- en huurwoningen, van studio tot bedrijfsruimte.</p></div>
      <div className="benefit"><div className="benefit-icon"><BadgeCheck /></div><h3>Transparant aanbod</h3><p>Actuele woningen van makelaars, met duidelijke informatie en directe contactmogelijkheden.</p></div>
      <div className="benefit"><div className="benefit-icon"><HeartHandshake /></div><h3>Een platform voor iedereen</h3><p>Zoeken is gratis. Makelaars plaatsen hun aanbod bij de start ook kosteloos.</p></div>
    </div></section>
    <div className="wrap"><section className="cta-band"><div><h2>Breng jouw aanbod onder de aandacht</h2><p>Start gratis en ontmoet jouw volgende huurder of koper.</p></div><Link className="button button-primary" href="/contact">Neem contact op <ArrowRight size={16} /></Link></section></div>
  </>;
}
