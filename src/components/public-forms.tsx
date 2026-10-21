"use client";

import { FormEvent, useState } from "react";

function SubmitForm({ endpoint, body, children }: { endpoint: string; body: (form: FormData) => Record<string, unknown>; children: (state: string, submit: (e: FormEvent<HTMLFormElement>) => void) => React.ReactNode }) {
  const [state, setState] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body(form)) });
      const result = await response.json();
      setState(response.ok ? "Bedankt, je bericht is verzonden." : result.error || "Verzenden is niet gelukt.");
      if (response.ok) formElement.reset();
    } catch {
      setState("Verzenden is tijdelijk niet gelukt. Controleer je verbinding en probeer het opnieuw.");
    }
  }
  return <>{children(state, submit)}</>;
}

export function EnquiryForm({ listingId }: { listingId: string }) {
  return <SubmitForm endpoint={`/api/listings/${listingId}/enquiries`} body={(f) => ({ name: f.get("name"), email: f.get("email"), phone: f.get("phone"), message: f.get("message") })}>{(state, submit) => <form onSubmit={submit}><h3>Interesse? Neem contact op</h3><div className="field"><label>Naam</label><input name="name" required minLength={2} maxLength={100} /></div><div className="field" style={{ marginTop: 12 }}><label>E-mailadres</label><input name="email" type="email" required /></div><div className="field" style={{ marginTop: 12 }}><label>Telefoonnummer (optioneel)</label><input name="phone" /></div><div className="field" style={{ marginTop: 12 }}><label>Bericht</label><textarea name="message" rows={4} required minLength={10} defaultValue="Hallo, ik heb interesse in deze woning en ontvang graag meer informatie." /></div>{state && <p className="notice">{state}</p>}<button className="button button-primary" style={{ width: "100%", marginTop: 14 }}>Verstuur aanvraag</button></form>}</SubmitForm>;
}

export function ReportForm({ listingId }: { listingId: string }) {
  return <details style={{ marginTop: 32 }}><summary className="text-link">Meld een probleem met deze advertentie</summary><SubmitForm endpoint={`/api/listings/${listingId}/reports`} body={(f) => ({ reason: f.get("reason"), details: f.get("details") })}>{(state, submit) => <form className="form-panel" onSubmit={submit} style={{ marginTop: 14 }}><div className="field"><label>Reden</label><select name="reason"><option value="incorrect">Onjuiste informatie</option><option value="unavailable">Niet meer beschikbaar</option><option value="suspicious">Verdacht aanbod</option><option value="other">Anders</option></select></div><div className="field" style={{ marginTop: 12 }}><label>Toelichting (optioneel)</label><textarea name="details" maxLength={2000} /></div>{state && <p>{state}</p>}<button className="button button-outline" style={{ marginTop: 12 }}>Melding versturen</button></form>}</SubmitForm></details>;
}

export function ContactForm() {
  return <SubmitForm endpoint="/api/contact" body={(f) => ({ name: f.get("name"), email: f.get("email"), subject: f.get("subject"), message: f.get("message") })}>{(state, submit) => <form className="form-panel" onSubmit={submit}><div className="field"><label>Naam</label><input name="name" required minLength={2} maxLength={100} /></div><div className="field" style={{ marginTop: 14 }}><label>E-mailadres</label><input name="email" type="email" required /></div><div className="field" style={{ marginTop: 14 }}><label>Onderwerp</label><input name="subject" required minLength={3} maxLength={150} /></div><div className="field" style={{ marginTop: 14 }}><label>Bericht</label><textarea name="message" rows={6} required minLength={10} maxLength={4000} /></div>{state && <p className="notice">{state}</p>}<button className="button button-primary" style={{ marginTop: 14 }}>Verstuur bericht</button></form>}</SubmitForm>;
}
