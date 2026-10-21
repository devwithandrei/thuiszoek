"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchForm({ large = false, initialCity = "", initialOffer = "huur" }: { large?: boolean; initialCity?: string; initialOffer?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialCity);
  const [offer, setOffer] = useState(initialOffer);
  function submit(event: FormEvent) {
    event.preventDefault();
    const search = new URLSearchParams();
    if (query.trim()) search.set("plaats", query.trim());
    if (offer) search.set("aanbod", offer);
    router.push(`/zoeken?${search.toString()}`);
  }
  return <form className={large ? "search-form search-form-large" : "search-form"} onSubmit={submit}>
    <label className="search-kind"><span>Aanbod</span><select value={offer} onChange={(e) => setOffer(e.target.value)}><option value="huur">Huren</option><option value="koop">Kopen</option><option value="">Alles</option></select></label>
    <label className="search-location"><span>Plaats of postcode</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Bijv. Amsterdam" /></label>
    <button className="button button-primary search-submit"><Search size={18} /> Zoek woningen</button>
  </form>;
}
