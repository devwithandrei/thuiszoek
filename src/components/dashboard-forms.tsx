"use client";

import { FormEvent, useState } from "react";

function useApiForm(endpoint: string, onSuccess?: () => void, method = "POST") {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      setMessage(response.ok ? data.message || "Opgeslagen." : data.error || "Er is iets misgegaan.");
      if (response.ok) { formElement.reset(); onSuccess?.(); }
    } catch {
      setMessage("Opslaan is tijdelijk niet gelukt. Controleer je verbinding en probeer het opnieuw.");
    }
  }
  return { message, submit };
}

export function AccountSetup() {
  const { message, submit } = useApiForm("/api/account");
  return <form className="form-panel" onSubmit={submit} style={{ maxWidth: 540, marginTop: 24 }}><div className="field"><label>Naam</label><input name="name" required minLength={2} maxLength={100} /></div><p className="notice">We gebruiken het geverifieerde e-mailadres uit je beveiligde Clerk-account. Je account wordt als woningzoeker aangemaakt.</p>{message && <p className="notice">{message}</p>}<button className="button button-primary">Account activeren</button></form>;
}

export function AgencySetup({ agency }: { agency?: { name: string; city: string; website: string | null; phone: string | null; description: string } }) {
  const { message, submit } = useApiForm("/api/provider/agency", () => agency && window.location.reload(), agency ? "PATCH" : "POST");
  return <form className="form-panel" onSubmit={submit} style={{ maxWidth: 680 }}><div className="form-grid"><div className="field"><label>Kantoornaam</label><input name="name" required minLength={2} maxLength={120} defaultValue={agency?.name} /></div><div className="field"><label>Plaats</label><input name="city" required minLength={2} maxLength={100} defaultValue={agency?.city} /></div><div className="field"><label>Website</label><input name="website" type="url" placeholder="https://" defaultValue={agency?.website ?? ""} /></div><div className="field"><label>Telefoon</label><input name="phone" maxLength={30} defaultValue={agency?.phone ?? ""} /></div><div className="field full"><label>Over het kantoor</label><textarea name="description" required minLength={30} maxLength={3000} rows={5} defaultValue={agency?.description} /></div></div>{message && <p className="notice">{message}</p>}<button className="button button-primary" style={{ marginTop: 18 }}>{agency ? "Profiel opslaan" : "Kantoorprofiel aanmaken"}</button></form>;
}

export function ListingEditor({ listing, listingId }: { listing?: { title: string; description: string; propertyType: string; offerType: string; price: number; city: string; postalCode: string; bedrooms: number; bathrooms: number; areaSqm: number; energyLabel: string | null; images: string[] }; listingId?: string }) {
  const { message, submit } = useApiForm(listingId ? `/api/provider/listings/${listingId}` : "/api/provider/listings", () => window.location.reload(), listingId ? "PATCH" : "POST");
  const [images, setImages] = useState(listing?.images.join("\n") ?? "");
  const [uploadMessage, setUploadMessage] = useState("");
  async function uploadFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    try {
      const signatureResponse = await fetch("/api/provider/uploads/signature", { method: "POST" });
      const signature = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signature.error || "Upload niet geconfigureerd.");
      const urls: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) throw new Error("Kies afbeeldingen van maximaal 8 MB.");
        const data = new FormData();
        data.set("file", file); data.set("api_key", signature.apiKey); data.set("timestamp", String(signature.timestamp));
        data.set("folder", signature.folder); data.set("signature", signature.signature);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, { method: "POST", body: data });
        const result = await response.json();
        if (!response.ok || typeof result.secure_url !== "string") throw new Error(result.error?.message || "Afbeelding uploaden is mislukt.");
        urls.push(result.secure_url);
      }
      setImages((previous) => [...previous.split(/\r?\n/).filter(Boolean), ...urls].join("\n"));
      setUploadMessage(`${urls.length} afbeelding${urls.length === 1 ? "" : "en"} geüpload.`);
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Afbeelding uploaden is mislukt.");
    } finally { event.target.value = ""; }
  }
  return <form className="form-panel" onSubmit={submit}><div className="form-grid"><div className="field full"><label>Titel</label><input name="title" required minLength={8} maxLength={120} defaultValue={listing?.title} /></div><div className="field"><label>Aanbod</label><select name="offerType" defaultValue={listing?.offerType ?? "RENT"}><option value="RENT">Te huur</option><option value="BUY">Te koop</option></select></div><div className="field"><label>Woningtype</label><select name="propertyType" defaultValue={listing?.propertyType ?? "APARTMENT"}><option value="APARTMENT">Appartement</option><option value="HOUSE">Huis</option><option value="STUDIO">Studio</option><option value="ROOM">Kamer</option><option value="COMMERCIAL">Bedrijfsruimte</option><option value="OFFICE">Kantoor</option><option value="RETAIL">Winkelruimte</option></select></div><div className="field"><label>Prijs (€)</label><input name="price" type="number" min="1" required defaultValue={listing?.price} /></div><div className="field"><label>Plaats</label><input name="city" required defaultValue={listing?.city} /></div><div className="field"><label>Postcode</label><input name="postalCode" placeholder="1234 AB" required defaultValue={listing?.postalCode} /></div><div className="field"><label>Oppervlakte (m²)</label><input name="areaSqm" type="number" min="1" required defaultValue={listing?.areaSqm} /></div><div className="field"><label>Slaapkamers</label><input name="bedrooms" type="number" min="0" defaultValue={listing?.bedrooms ?? 0} /></div><div className="field"><label>Badkamers</label><input name="bathrooms" type="number" min="0" defaultValue={listing?.bathrooms ?? 0} /></div><div className="field"><label>Energielabel</label><select name="energyLabel" defaultValue={listing?.energyLabel ?? ""}><option value="">Onbekend</option>{["A++++", "A+++", "A++", "A+", "A", "B", "C", "D", "E", "F", "G"].map((label) => <option key={label}>{label}</option>)}</select></div><div className="field full"><label>Afbeeldingen uploaden (max. 8 MB per bestand)</label><input type="file" accept="image/*" multiple onChange={uploadFiles} /><textarea aria-label="Geüploade afbeeldingen" name="images" rows={3} value={images} onChange={(event) => setImages(event.target.value)} placeholder="Geüploade Cloudinary-URL's verschijnen hier" />{uploadMessage && <span className="notice">{uploadMessage}</span>}</div><div className="field full"><label>Beschrijving</label><textarea name="description" rows={5} required minLength={40} maxLength={8000} defaultValue={listing?.description} /></div></div>{message && <p className="notice">{message}</p>}<button className="button button-primary" style={{ marginTop: 18 }}>{listingId ? "Wijzigingen opslaan" : "Opslaan als concept"}</button></form>;
}
