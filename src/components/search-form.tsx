"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const propertyTypes = [
  ["", "Alle typen"],
  ["HOUSE", "Huis"],
  ["APARTMENT", "Appartement / flat"],
  ["STUDIO", "Studio"],
  ["ROOM", "Kamer"],
  ["COMMERCIAL", "Bedrijfsruimte"],
  ["OFFICE", "Kantoorruimte"],
  ["RETAIL", "Winkelruimte"],
  ["GARAGE", "Garage"],
] as const;

export function SearchForm({
  large = false,
  initialCity = "",
  initialOffer = "huur",
  initialType = "",
  initialBedrooms = "",
}: {
  large?: boolean;
  initialCity?: string;
  initialOffer?: string;
  initialType?: string;
  initialBedrooms?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialCity);
  const [offer, setOffer] = useState(initialOffer);
  const [type, setType] = useState(initialType);
  const [bedrooms, setBedrooms] = useState(initialBedrooms);
  const showBedrooms = type === "HOUSE" || type === "APARTMENT";
  function submit(event: FormEvent) {
    event.preventDefault();
    const search = new URLSearchParams();
    if (query.trim()) search.set("plaats", query.trim());
    if (offer) search.set("aanbod", offer);
    if (type) search.set("type", type);
    if (showBedrooms && bedrooms) search.set("minSlaapkamers", bedrooms);
    router.push(`/zoeken?${search.toString()}`);
  }
  return <form className={`search-form ${large ? "search-form-large" : ""} ${showBedrooms ? "search-form-with-bedrooms" : "search-form-without-bedrooms"}`} onSubmit={submit}>
    <label className="search-kind"><span>Aanbod</span><select value={offer} onChange={(e) => setOffer(e.target.value)}><option value="huur">Huren</option><option value="koop">Kopen</option><option value="">Alles</option></select></label>
    <label className="search-property"><span>Woningtype</span><select value={type} onChange={(e) => { setType(e.target.value); setBedrooms(""); }}>{propertyTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {showBedrooms && <label className="search-bedrooms"><span>Slaapkamers</span><select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}><option value="">Maakt niet uit</option><option value="1">1 of meer</option><option value="2">2 of meer</option><option value="3">3 of meer</option><option value="4">4 of meer</option></select></label>}
    <label className="search-location"><span>Plaats of postcode</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Bijv. Amsterdam" /></label>
    <button className="button button-primary search-submit" type="submit" aria-label="Zoek woningen" title="Zoek woningen"><Search size={20} aria-hidden="true" /></button>
  </form>;
}
