import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminControls } from "@/components/admin-controls";
import { AdminWorkspace, type AdminSection } from "@/components/admin-workspace";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await currentUser();
  if (!user) return <section className="section"><div className="wrap"><h1 className="page-title">Beheer</h1><p>Log in met een beheerdersaccount om door te gaan.</p></div></section>;
  if (user.role !== Role.ADMIN) redirect("/dashboard");
  const [listings, reports, users, agencies, agencyRecords, enquiryCount, userCount, seekerCount, privateProviderCount, agencyProviderCount, messages, activity, pendingListingCount, openReportCount, activeListingCount] = await Promise.all([
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
    db.listing.count({ where: { status: "PENDING_REVIEW" } }),
    db.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    db.listing.count({ where: { status: { in: ["PENDING_REVIEW", "PUBLISHED"] } } }),
  ]);

  const sections: AdminSection[] = [
    {
      id: "listings",
      label: "Advertenties",
      count: activeListingCount,
      content: <div className="dashboard-card"><h2>Advertenties modereren</h2><p className="admin-section-description">Toont de nieuwste {listings.length} van {activeListingCount} actieve of te beoordelen advertenties.</p><div className="table-wrap"><table className="data-table"><thead><tr><th>Advertentie</th><th>Aanbieder</th><th>Status</th><th>Acties</th></tr></thead><tbody>{listings.map((listing) => <tr key={listing.id}><td data-label="Advertentie">{listing.title}</td><td data-label="Aanbieder">{listing.agency.name}</td><td data-label="Status"><span className="status-pill">{listing.status}</span></td><td data-label="Acties"><AdminControls type="listing" id={listing.id} status={listing.status} /></td></tr>)}{!listings.length && <tr><td colSpan={4}>Geen advertenties om te modereren.</td></tr>}</tbody></table></div></div>,
    },
    {
      id: "users",
      label: "Gebruikers",
      count: userCount,
      content: <div className="dashboard-card"><h2>Gebruikers en accountcategorieën</h2><p className="admin-section-description">Laatste {users.length} accounts · {seekerCount} woningzoekers · {privateProviderCount} particuliere aanbieders · {agencyProviderCount} makelaars</p><div className="table-wrap"><table className="data-table"><thead><tr><th>Naam</th><th>E-mail</th><th>Categorie</th><th>Zoekvoorkeur</th><th>Aanbiedersprofiel</th><th>Actie</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td data-label="Naam">{item.name}</td><td data-label="E-mail">{item.email}</td><td data-label="Categorie">{item.role === Role.SEEKER ? "Woningzoeker" : item.role === Role.ADMIN ? "Beheerder" : item.providerType === "PRIVATE_PERSON" ? "Particuliere aanbieder" : item.providerType === "AGENCY" ? "Makelaar / agency" : "Aanbieder — onboarding nodig"}</td><td data-label="Zoekvoorkeur">{item.searchPreference === "BOTH" ? "Huren en kopen" : item.searchPreference === "RENT" ? "Huren" : item.searchPreference === "BUY" ? "Kopen" : "—"}</td><td data-label="Aanbiedersprofiel">{item.agency?.name || "—"}</td><td data-label="Actie"><AdminControls type="user" id={item.id} status={item.role} /></td></tr>)}</tbody></table></div></div>,
    },
    {
      id: "reports",
      label: "Meldingen",
      count: openReportCount,
      content: <div className="dashboard-card"><h2>Meldingen beoordelen</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Advertentie</th><th>Reden</th><th>Toelichting</th><th>Datum</th><th>Acties</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td data-label="Advertentie">{report.listing.title}</td><td data-label="Reden">{report.reason}</td><td data-label="Toelichting">{report.details || "—"}</td><td data-label="Datum">{report.createdAt.toLocaleDateString("nl-NL")}</td><td data-label="Acties"><AdminControls type="report" id={report.id} status={report.status} /></td></tr>)}{!reports.length && <tr><td colSpan={5}>Geen openstaande meldingen.</td></tr>}</tbody></table></div></div>,
    },
    {
      id: "agencies",
      label: "Aanbieders",
      count: agencies,
      content: <div className="dashboard-card"><h2>Aanbiedersprofielen</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Kantoor</th><th>Plaats</th><th>Abonnement</th><th>Verificatie</th><th>Acties</th></tr></thead><tbody>{agencyRecords.map((agency) => <tr key={agency.id}><td data-label="Kantoor">{agency.name}</td><td data-label="Plaats">{agency.city}</td><td data-label="Abonnement">{agency.plan}</td><td data-label="Verificatie">{agency.verified ? "Geverifieerd" : "Niet geverifieerd"}</td><td data-label="Acties"><AdminControls type="agency" id={agency.id} status={agency.verified ? "verified" : "unverified"} /></td></tr>)}{!agencyRecords.length && <tr><td colSpan={5}>Nog geen aanbiedersprofielen.</td></tr>}</tbody></table></div></div>,
    },
    {
      id: "messages",
      label: "Contact",
      count: messages.length,
      content: <div className="dashboard-card"><h2>Contactberichten</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Afzender</th><th>Onderwerp</th><th>Bericht</th><th>Datum</th></tr></thead><tbody>{messages.map((message) => <tr key={message.id}><td data-label="Afzender">{message.name}<br />{message.email}</td><td data-label="Onderwerp">{message.subject}</td><td data-label="Bericht">{message.message.slice(0, 180)}</td><td data-label="Datum">{message.createdAt.toLocaleDateString("nl-NL")}</td></tr>)}{!messages.length && <tr><td colSpan={4}>Geen contactberichten.</td></tr>}</tbody></table></div></div>,
    },
    {
      id: "activity",
      label: "Activiteit",
      count: activity.length,
      content: <div className="dashboard-card"><h2>Recente platformactiviteit</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Actie</th><th>Type</th><th>Object</th><th>Datum</th></tr></thead><tbody>{activity.map((item) => <tr key={item.id}><td data-label="Actie">{item.action}</td><td data-label="Type">{item.entityType}</td><td data-label="Object">{item.entityId}</td><td data-label="Datum">{item.createdAt.toLocaleString("nl-NL")}</td></tr>)}{!activity.length && <tr><td colSpan={4}>Nog geen platformactiviteit.</td></tr>}</tbody></table></div></div>,
    },
  ];

  return <section className="wrap page-body admin-page">
    <div className="admin-page-heading"><div><span className="eyebrow">Platformbeheer</span><h1 className="page-title">Beheerdersdashboard</h1><p>Beheer woningaanbod, accounts en platformactiviteit.</p></div></div>
    <div className="stat-grid admin-stat-grid">
      <div className="dashboard-card"><span>Alle accounts</span><div className="stat-number">{userCount}</div></div>
      <div className="dashboard-card"><span>Te beoordelen</span><div className="stat-number">{pendingListingCount}</div></div>
      <div className="dashboard-card"><span>Open meldingen</span><div className="stat-number">{openReportCount}</div></div>
      <div className="dashboard-card"><span>Woningaanvragen</span><div className="stat-number">{enquiryCount}</div></div>
    </div>
    <AdminWorkspace sections={sections} />
  </section>;
}
