import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { providerPlans } from "@/lib/plans";
import { db } from "@/lib/db";
import { AccountSetup, ListingEditor, AgencySetup } from "@/components/dashboard-forms";

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const user = await currentUser();
  if (user?.role === Role.ADMIN) redirect("/admin");
  if (!user) return <section className="section"><div className="wrap"><h1 className="page-title">Welkom bij ThuisZoek</h1><p>Maak je gratis account aan om aanvragen te versturen of vastgoed aan te bieden.</p><AccountSetup /></div></section>;
  if (user.role === Role.SEEKER) return <section className="section"><div className="wrap"><h1 className="page-title">Mijn account</h1><div className="dashboard-card"><h2>Welkom, {user.name}</h2><p>Je kunt woningen bekijken en rechtstreeks contact opnemen met aanbieders.</p><Link className="button button-primary" href="/zoeken">Ontdek woningen</Link><p>Wil je als makelaar adverteren? Neem contact op met ons team voor een aanbiedersaccount.</p><Link className="text-link" href="/contact">Contact voor makelaars</Link></div></div></section>;
  if (!user.agency) return <section className="section"><div className="wrap"><h1 className="page-title">Richt je makelaarspagina in</h1><p>Maak eerst je kantoorprofiel aan voordat je een woning plaatst.</p><AgencySetup /></div></section>;
  const listings = await db.listing.findMany({ where: { agencyId: user.agency.id }, orderBy: { updatedAt: "desc" } });
  const limit = providerPlans[user.agency.plan].limit;
  const active = listings.filter((listing) => listing.status === "PUBLISHED" || listing.status === "PENDING_REVIEW").length;
  const enquiries = await db.enquiry.findMany({ where: { listing: { agencyId: user.agency.id } }, orderBy: { createdAt: "desc" }, take: 50, include: { listing: { select: { title: true } } } });
  return <section className="wrap dashboard-layout">
    <aside><h2>Mijn kantoor</h2><p>{user.agency.name}</p><nav className="dashboard-nav"><a href="#overzicht">Overzicht</a><a href="#aanbod">Mijn aanbod</a><a href="#aanvragen">Aanvragen</a><Link href="/tarieven">Mijn abonnement</Link><Link href={`/makelaars/${user.agency.slug}`}>Open kantoorprofiel</Link></nav></aside>
    <div><span className="eyebrow">Makelaarsdashboard</span><h1 className="page-title" id="overzicht">Goedemorgen, {user.name.split(" ")[0]}</h1><div className="stat-grid"><div className="dashboard-card"><span>Actieve advertenties</span><div className="stat-number">{active}{Number.isFinite(limit) ? ` / ${limit}` : ""}</div></div><div className="dashboard-card"><span>Nieuwe aanvragen</span><div className="stat-number">{enquiries.length}</div></div><div className="dashboard-card"><span>Abonnement</span><div className="stat-number" style={{ fontSize: 20 }}>{providerPlans[user.agency.plan].name}</div><span>Gratis bij lancering</span></div></div>
      <div className="dashboard-card"><details><summary className="text-link">Kantoorprofiel bewerken</summary><div style={{ marginTop: 16 }}><AgencySetup agency={user.agency} /></div></details></div>
      <div className="dashboard-card" id="aanbod"><div className="section-head"><div><h2>Mijn aanbod</h2><p>Nieuwe advertenties worden ter controle ingestuurd.</p></div></div><details style={{ marginBottom: 20 }}><summary className="button button-primary" style={{ display: "inline-flex", margin: "14px 0" }}>+ Nieuwe advertentie</summary><ListingEditor /></details><div className="table-wrap"><table className="data-table"><thead><tr><th>Woning</th><th>Status</th><th>Prijs</th><th>Bijgewerkt</th><th>Acties</th></tr></thead><tbody>{listings.map((item) => <tr key={item.id}><td><Link className="text-link" href={`/woning/${item.slug}`}>{item.title}</Link></td><td><span className="status-pill">{item.status}</span></td><td>€ {item.price.toLocaleString("nl-NL")}</td><td>{item.updatedAt.toLocaleDateString("nl-NL")}</td><td><ListingActions listingId={item.id} status={item.status} /></td></tr>)}{!listings.length && <tr><td colSpan={5}>Nog geen advertenties.</td></tr>}</tbody></table></div></div>
      <div className="dashboard-card" id="aanvragen" style={{ marginTop: 22 }}><h2>Recente aanvragen</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Van</th><th>Woning</th><th>Bericht</th><th>Datum</th></tr></thead><tbody>{enquiries.map((item) => <tr key={item.id}><td>{item.name}<br />{item.email}</td><td>{item.listing.title}</td><td>{item.message.slice(0, 100)}</td><td>{item.createdAt.toLocaleDateString("nl-NL")}</td></tr>)}{!enquiries.length && <tr><td colSpan={4}>Nog geen aanvragen ontvangen.</td></tr>}</tbody></table></div></div>
    </div>
  </section>;
}

function ListingActions({ listingId, status }: { listingId: string; status: string }) {
  return <div className="inline-actions">{!["SOLD", "RENTED", "EXPIRED"].includes(status) && <><Link className="button button-small button-outline" href={`/dashboard/listings/${listingId}`}>Bewerken</Link>{status === "DRAFT" && <form action={`/api/provider/listings/${listingId}/submit`} method="post"><button className="button button-small button-primary">Ter beoordeling</button></form>}<form action={`/api/provider/listings/${listingId}/offline`} method="post"><button className="button-danger">Offline</button></form></>}</div>;
}
