import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { ListingCard } from "@/components/listing-card";
import { SearchForm } from "@/components/search-form";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Woningen zoeken" };

function parsePrice(value: string | string[] | undefined) {
  if (typeof value !== "string") return undefined;
  const price = Number(value);
  return Number.isSafeInteger(price) && price > 0 && price <= 100_000_000 ? price : undefined;
}

export default async function SearchPage({ searchParams }: PageProps<"/zoeken">) {
  const params = await searchParams;
  const city = typeof params.plaats === "string" ? params.plaats.trim().slice(0, 100) : "";
  const offer = params.aanbod === "koop" ? "BUY" : params.aanbod === "huur" ? "RENT" : undefined;
  const type = typeof params.type === "string" ? params.type : "";
  const minPrice = parsePrice(params.minPrijs);
  const maxPrice = parsePrice(params.maxPrijs);
  const where: Prisma.ListingWhereInput = {
    status: "PUBLISHED", expiresAt: { gt: new Date() },
    ...(city ? { OR: [{ city: { contains: city, mode: "insensitive" } }, { postalCode: { contains: city, mode: "insensitive" } }] } : {}),
    ...(offer ? { offerType: offer } : {}),
    ...(type && ["APARTMENT", "HOUSE", "STUDIO", "ROOM", "COMMERCIAL", "OFFICE", "RETAIL"].includes(type) ? { propertyType: type as Prisma.EnumPropertyTypeFilter["equals"] } : {}),
    ...(minPrice || maxPrice ? { price: { ...(minPrice ? { gte: minPrice } : {}), ...(maxPrice ? { lte: maxPrice } : {}) } } : {}),
  };
  const listings = await db.listing.findMany({ where, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], take: 60, select: { id: true, slug: true, title: true, city: true, price: true, areaSqm: true, bedrooms: true, bathrooms: true, offerType: true, propertyType: true, images: true, featured: true } });
  return <>
    <section className="page-hero"><div className="wrap"><span className="eyebrow">Het begint hier</span><h1 className="page-title">Vind jouw volgende plek</h1><p>Doorzoek het actuele aanbod van huur- en koopwoningen en commercieel vastgoed in Nederland.</p><SearchForm initialCity={city} initialOffer={params.aanbod === "koop" ? "koop" : params.aanbod === "huur" ? "huur" : ""} /></div></section>
    <section className="page-body"><div className="wrap">
      <form className="filter-row" action="/zoeken">
        <input type="hidden" name="plaats" value={city} />
        <div className="field"><label htmlFor="filter-type">Type woning</label><select id="filter-type" name="type" defaultValue={type}><option value="">Alle typen</option><option value="APARTMENT">Appartement</option><option value="HOUSE">Huis</option><option value="STUDIO">Studio</option><option value="ROOM">Kamer</option><option value="COMMERCIAL">Bedrijfsruimte</option><option value="OFFICE">Kantoor</option><option value="RETAIL">Winkelruimte</option></select></div>
        <div className="field"><label htmlFor="filter-min">Min. prijs (€)</label><input id="filter-min" type="number" name="minPrijs" min="0" defaultValue={params.minPrijs} /></div>
        <div className="field"><label htmlFor="filter-max">Max. prijs (€)</label><input id="filter-max" type="number" name="maxPrijs" min="0" defaultValue={params.maxPrijs} /></div>
        {offer && <input type="hidden" name="aanbod" value={offer === "BUY" ? "koop" : "huur"} />}
        <button className="button button-primary" type="submit">Filters toepassen</button>
      </form>
      <div className="results-top"><p><strong>{listings.length}</strong> woningen gevonden{city ? ` in ${city}` : ""}</p><span className="notice">Actueel aanbod · gecontroleerd op geldigheid</span></div>
      {listings.length ? <div className="listing-grid">{listings.map((listing, i) => <ListingCard key={listing.id} listing={listing} index={i} />)}</div> : <div className="empty-state">Geen woningen gevonden. Pas je filters aan of probeer een andere plaats.</div>}
    </div></section>
  </>;
}
