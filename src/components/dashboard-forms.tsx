"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

export function OnboardingWizard({ initialName, initialCity = "", initialType = "SEEKER" }: { initialName: string; initialCity?: string; initialType?: "SEEKER" | "PROVIDER" }) {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"SEEKER" | "PROVIDER">(initialType);
  const [providerType, setProviderType] = useState<"PRIVATE_PERSON" | "AGENCY">("PRIVATE_PERSON");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, accountType, ...(accountType === "PROVIDER" ? { providerType } : {}) }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Opslaan is niet gelukt. Controleer je gegevens.");
        return;
      }
      router.replace(result.destination);
      router.refresh();
    } catch {
      setMessage("Opslaan is tijdelijk niet gelukt. Controleer je verbinding en probeer het opnieuw.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="onboarding-wrap">
    <div className="onboarding-intro"><span className="eyebrow">Persoonlijke accountinstelling</span><h1 className="page-title">Hoe wil je ThuisZoek gebruiken?</h1><p>Kies wat bij je past. We richten je startpagina en account direct goed in.</p><span className="onboarding-step">Stap 1 van 1 · duurt ongeveer 1 minuut</span></div>
    <form className="form-panel onboarding-form" onSubmit={submit}>
      <div className="account-type-grid">
        <button type="button" className={`account-type-card ${accountType === "SEEKER" ? "selected" : ""}`} onClick={() => setAccountType("SEEKER")} aria-pressed={accountType === "SEEKER"}>
          <span className="account-type-icon">⌂</span><strong>Ik zoek een woning</strong><span>Ik wil huren of kopen en contact opnemen met aanbieders.</span>
        </button>
        <button type="button" className={`account-type-card ${accountType === "PROVIDER" ? "selected" : ""}`} onClick={() => setAccountType("PROVIDER")} aria-pressed={accountType === "PROVIDER"}>
          <span className="account-type-icon">↗</span><strong>Ik bied vastgoed aan</strong><span>Ik ben particulier of makelaar en wil woningen plaatsen.</span>
        </button>
      </div>
      <div className="onboarding-fields">
        <div className="field"><label htmlFor="account-name">Jouw naam</label><input id="account-name" name="name" required minLength={2} maxLength={100} defaultValue={initialName} autoComplete="name" /></div>
        {accountType === "SEEKER" ? <>
          <div className="field"><label htmlFor="search-preference">Waar ben je naar op zoek?</label><select id="search-preference" name="searchPreference" defaultValue="BOTH"><option value="BOTH">Huren of kopen</option><option value="RENT">Een woning huren</option><option value="BUY">Een woning kopen</option></select></div>
          <div className="field"><label htmlFor="preferred-city">Voorkeursplaats <span className="field-optional">(optioneel)</span></label><input id="preferred-city" name="preferredCity" maxLength={100} defaultValue={initialCity} placeholder="Bijvoorbeeld Utrecht" autoComplete="address-level2" /></div>
        </> : <>
          <fieldset className="provider-kind-fieldset"><legend>Wat voor aanbieder ben je?</legend><div className="provider-kind-options">
            <label><input type="radio" name="provider-kind" checked={providerType === "PRIVATE_PERSON"} onChange={() => setProviderType("PRIVATE_PERSON")} /> Particulier</label>
            <label><input type="radio" name="provider-kind" checked={providerType === "AGENCY"} onChange={() => setProviderType("AGENCY")} /> Makelaar / agency</label>
          </div></fieldset>
          <div className="field"><label htmlFor="profile-name">{providerType === "AGENCY" ? "Naam van je makelaarskantoor" : "Naam van je aanbiedersprofiel"}</label><input id="profile-name" name="profileName" required minLength={2} maxLength={120} defaultValue={providerType === "PRIVATE_PERSON" ? initialName : ""} placeholder={providerType === "AGENCY" ? "Bijvoorbeeld Makelaardij Utrecht" : initialName} /></div>
          <div className="field"><label htmlFor="provider-city">Plaats</label><input id="provider-city" name="city" required minLength={2} maxLength={100} defaultValue={initialCity} placeholder="Bijvoorbeeld Utrecht" autoComplete="address-level2" /></div>
          <div className="field"><label htmlFor="provider-phone">Telefoonnummer <span className="field-optional">(optioneel)</span></label><input id="provider-phone" name="phone" type="tel" maxLength={30} autoComplete="tel" /></div>
          {providerType === "AGENCY" && <div className="field"><label htmlFor="provider-website">Website <span className="field-optional">(optioneel)</span></label><input id="provider-website" name="website" type="url" maxLength={250} placeholder="https://..." autoComplete="url" /></div>}
          <div className="field"><label htmlFor="provider-description">{providerType === "AGENCY" ? "Over het kantoor" : "Over jou en je aanbod"}</label><textarea id="provider-description" name="description" rows={4} required minLength={30} maxLength={3000} placeholder="Vertel woningzoekers kort wie je bent en wat je aanbiedt." /></div>
        </>}
      </div>
      <p className="onboarding-privacy">Je geverifieerde e-mailadres wordt veilig uit je Google/Clerk-account overgenomen. Je gegevens worden opgeslagen zodat we je passende omgeving kunnen tonen.</p>
      {message && <p className="notice" role="alert">{message}</p>}
      <button className="button button-primary onboarding-submit" disabled={saving}>{saving ? "Account instellen…" : accountType === "SEEKER" ? "Naar mijn woningdashboard" : "Mijn Studio aanmaken"}</button>
    </form>
  </div>;
}

export function AgencySetup({ agency, providerType }: { agency?: { name: string; city: string; website: string | null; phone: string | null; description: string }; providerType?: "PRIVATE_PERSON" | "AGENCY" | null }) {
  const { message, submit } = useApiForm("/api/provider/agency", () => agency && window.location.reload(), agency ? "PATCH" : "POST");
  const providerLabel = providerType === "PRIVATE_PERSON" ? "aanbiedersprofiel" : "makelaarskantoor";
  return <form className="form-panel" onSubmit={submit} style={{ maxWidth: 680 }}><div className="form-grid"><div className="field"><label>{providerType === "PRIVATE_PERSON" ? "Profielnaam" : "Kantoornaam"}</label><input name="name" required minLength={2} maxLength={120} defaultValue={agency?.name} /></div><div className="field"><label>Plaats</label><input name="city" required minLength={2} maxLength={100} defaultValue={agency?.city} /></div><div className="field"><label>Website</label><input name="website" type="url" placeholder="https://" defaultValue={agency?.website ?? ""} /></div><div className="field"><label>Telefoon</label><input name="phone" maxLength={30} defaultValue={agency?.phone ?? ""} /></div><div className="field full"><label>Over {providerLabel}</label><textarea name="description" required minLength={30} maxLength={3000} rows={5} defaultValue={agency?.description} /></div></div>{message && <p className="notice">{message}</p>}<button className="button button-primary" style={{ marginTop: 18 }}>{agency ? "Profiel opslaan" : `${providerLabel} aanmaken`}</button></form>;
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
