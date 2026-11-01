import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminControls } from "@/components/admin-controls";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await currentUser();
  if (!user) return <section className="section"><div className="wrap"><h1 className="page-title">Beheer</h1><p>Log in met een beheerdersaccount om door te gaan.</p></div></section>;
  if (user.role !== Role.ADMIN) redirect("/dashboard");
  const [listings, reports, users, agencies, agencyRecords, enquiryCount, userCount, seekerCount, privateProviderCount, agencyProviderCount, messages, activity] = await Promise.all([
    db.listing.findMany({ where: { status: { in: ["PENDING_REVIEW", "PUBLISHED"] } }, orderBy: { updatedAt: "desc" }, take: 100, include: { agency: { select: { name: true } } } }),
    db.report.findMany({ where: { status: { in: ["OPEN", "REVIEWING"] } }, orderBy: { createdAt: "desc" }, take: 100, include: { listing: { select: { title: true, slug: true } } } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { agency: true } }),
    db.agency.count(),
    db.agency.findMany({ orderBy: { name: "asc" }, take: 100 }),
    db.enquiry.count(),
    db.user.count(),
    db.user.count({ where: { role: Role.SEEKER } }),
    db.user.count({ where: { role: Role.PROVIDER, providerType: "PRIVATE_PERSON" } }),
    db.user.count({ where: { role: Role.PROVIDER, providerType: "AGENCY" } }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return <section className="wrap page-body"><span className="eyebrow">Platformbeheer</span><h1 className="page-title">Beheerdersdashboard</h1><div className="stat-grid"><div className="dashboard-card">Alle accounts<div className="stat-number">{userCount}</div></div><div className="dashboard-card">Woningzoekers<div className="stat-number">{seekerCount}</div></div><div className="dashboard-card">Particuliere aanbieders<div className="stat-number">{privateProviderCount}</div></div><div className="dashboard-card">Makelaars / agencies<div className="stat-number">{agencyProviderCount}</div></div><div className="dashboard-card">Aanbiedersprofielen<div className="stat-number">{agencies}</div></div><div className="dashboard-card">Aanvragen<div className="stat-number">{enquiryCount}</div></div></div>
    <div className="dashboard-card"><h2>Advertenties modereren</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Advertentie</th><th>Aanbieder</th><th>Status</th><th>Acties</th></tr></thead><tbody>{listings.map((listing) => <tr key={listing.id}><td>{listing.title}</td><td>{listing.agency.name}</td><td><span className="status-pill">{listing.status}</span></td><td><AdminControls type="listing" id={listing.id} status={listing.status} /></td></tr>)}</tbody></table></div></div>
    <div className="dashboard-card" style={{ marginTop: 20 }}><h2>Gebruikers en accountcategorieën</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Naam</th><th>E-mail</th><th>Categorie</th><th>Zoekvoorkeur</th><th>Aanbiedersprofiel</th><th>Actie</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.email}</td><td>{item.role === Role.SEEKER ? "Woningzoeker" : item.role === Role.ADMIN ? "Beheerder" : item.providerType === "PRIVATE_PERSON" ? "Particuliere aanbieder" : item.providerType === "AGENCY" ? "Makelaar / agency" : "Aanbieder — onboarding nodig"}</td><td>{item.searchPreference === "BOTH" ? "Huren en kopen" : item.searchPreference === "RENT" ? "Huren" : item.searchPreference === "BUY" ? "Kopen" : "—"}</td><td>{item.agency?.name || "—"}</td><td><AdminControls type="user" id={item.id} status={item.role} /></td></tr>)}</tbody></table></div></div>
    <div className="dashboard-card" style={{ marginTop: 20 }}><h2>Meldingen</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Advertentie</th><th>Reden</th><th>Toelichting</th><th>Datum</th><th>Acties</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td>{report.listing.title}</td><td>{report.reason}</td><td>{report.details || "—"}</td><td>{report.createdAt.toLocaleDateString("nl-NL")}</td><td><AdminControls type="report" id={report.id} status={report.status} /></td></tr>)}{!reports.length && <tr><td colSpan={5}>Geen openstaande meldingen.</td></tr>}</tbody></table></div></div>
    <div className="dashboard-card" style={{ marginTop: 20 }}><h2>Makelaars beheren</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Kantoor</th><th>Plaats</th><th>Abonnement</th><th>Verificatie</th><th>Acties</th></tr></thead><tbody>{agencyRecords.map((agency) => <tr key={agency.id}><td>{agency.name}</td><td>{agency.city}</td><td>{agency.plan}</td><td>{agency.verified ? "Geverifieerd" : "Niet geverifieerd"}</td><td><AdminControls type="agency" id={agency.id} status={agency.verified ? "verified" : "unverified"} /></td></tr>)}</tbody></table></div></div>
    <div className="dashboard-card" style={{ marginTop: 20 }}><h2>Contactberichten</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Afzender</th><th>Onderwerp</th><th>Bericht</th><th>Datum</th></tr></thead><tbody>{messages.map((message) => <tr key={message.id}><td>{message.name}<br />{message.email}</td><td>{message.subject}</td><td>{message.message.slice(0, 180)}</td><td>{message.createdAt.toLocaleDateString("nl-NL")}</td></tr>)}{!messages.length && <tr><td colSpan={4}>Geen contactberichten.</td></tr>}</tbody></table></div></div>
    <div className="dashboard-card" style={{ marginTop: 20 }}><h2>Recente platformactiviteit</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Actie</th><th>Type</th><th>Object</th><th>Datum</th></tr></thead><tbody>{activity.map((item) => <tr key={item.id}><td>{item.action}</td><td>{item.entityType}</td><td>{item.entityId}</td><td>{item.createdAt.toLocaleString("nl-NL")}</td></tr>)}</tbody></table></div></div>
  </section>;
}
