"use client";

import { useState } from "react";

export function AdminControls({ type, id, status }: { type: "listing" | "user" | "report" | "agency"; id: string; status: string }) {
  const [message, setMessage] = useState("");
  async function action(action: string) {
    try {
      const response = await fetch(`/api/admin/${type}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await response.json();
      setMessage(response.ok ? "Bijgewerkt" : data.error || "Mislukt");
      if (response.ok) window.location.reload();
    } catch {
      setMessage("Actie is tijdelijk niet gelukt. Probeer het opnieuw.");
    }
  }
  if (type === "listing") return <div className="inline-actions">{status === "PENDING_REVIEW" && <><button className="button button-small button-primary" onClick={() => action("approve")}>Goedkeuren</button><button className="button-danger" onClick={() => action("reject")}>Afwijzen</button></>}{status === "PUBLISHED" && <button className="button-danger" onClick={() => action("expire")}>Offline halen</button>}{message}</div>;
  if (type === "user") return status === "ADMIN"
    ? <span className="admin-role-locked">Admin</span>
    : <div className="inline-actions"><select aria-label="Nieuwe gebruikersrol" defaultValue={status} onChange={(e) => action(`role:${e.target.value}`)}><option value="SEEKER">Woningzoeker</option><option value="PROVIDER">Aanbieder</option></select>{message}</div>;
  if (type === "agency") return <div className="inline-actions"><select aria-label="Abonnement wijzigen" onChange={(e) => action(`plan:${e.target.value}`)} defaultValue=""><option value="" disabled>Plan kiezen…</option><option value="BASIC">Basic (gratis)</option><option value="PRO">Pro (gratis)</option><option value="EXPERT_PRO_MAX">Expert Pro Max (gratis)</option></select><button className="button button-small button-outline" onClick={() => action(status === "verified" ? "unverify" : "verify")}>{status === "verified" ? "Verificatie intrekken" : "Verifiëren"}</button>{message}</div>;
  return <div className="inline-actions"><button className="button button-small button-outline" onClick={() => action("resolve")}>Oplossen</button><button className="button-danger" onClick={() => action("dismiss")}>Negeren</button>{message}</div>;
}
