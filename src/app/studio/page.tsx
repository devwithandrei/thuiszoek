import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { providerPlans } from "@/lib/plans";
import { db } from "@/lib/db";
import { AgencySetup, ListingEditor, OnboardingWizard } from "@/components/dashboard-forms";
import { Building2, ClipboardList, MessageSquareText, UserRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await currentUser();
  if (user?.role === Role.ADMIN) redirect("/admin");
  if (user?.role === Role.SEEKER) redirect("/dashboard");
  if (!user || !user.agency) {
    const name = user?.name || "";
    return <section className="section"><div className="wrap">
      <OnboardingWizard initialName={name} initialType="PROVIDER" />
    </div></section>;
  }

  const listings = await db.listing.findMany({ where: { agencyId: user.agency.id }, orderBy: { updatedAt: "desc" } });
  const limit = providerPlans[user.agency.plan].limit;
  const active = listings.filter((listing) => listing.status === "PUBLISHED" || listing.status === "PENDING_REVIEW").length;
  const enquiries = await db.enquiry.findMany({
    where: { listing: { agencyId: user.agency.id } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { listing: { select: { title: true } } },
  });
  const providerName = user.providerType === "PRIVATE_PERSON" ? "Particuliere aanbieder" : "Makelaar / agency";

  return <section className="wrap dashboard-layout studio-layout">
    <aside className="studio-sidebar"><div className="studio-sidebar-heading"><span className="studio-sidebar-icon"><Building2 size={18} aria-hidden="true" /></span><div><span className="eyebrow">ThuisZoek Studio</span><h2>Mijn aanbod</h2></div></div><p>{user.agency.name}</p><nav className="dashboard-nav" aria-label="Studio navigatie"><a href="#overzicht"><Building2 size={16} aria-hidden="true" /><span>Overzicht</span></a><a href="#aanbod"><ClipboardList size={16} aria-hidden="true" /><span>Advertenties</span></a><a href="#aanvragen"><MessageSquareText size={16} aria-hidden="true" /><span>Aanvragen</span></a><a href="#profiel"><UserRound size={16} aria-hidden="true" /><span>Profiel</span></a></nav></aside>
    <div className="studio-content">
      <header className="studio-welcome" id="overzicht">
        <div><span className="eyebrow">{providerName}</span><h1 className="page-title">Welkom, {user.name.split(" ")[0]}</h1><p className="studio-lead">Beheer je vastgoed, aanvragen en aanbiedersprofiel op één plek.</p></div>
        <Link className="button button-primary studio-create-shortcut" href="#aanbod">Bekijk advertenties</Link>
      </header>
      <div className="stat-grid">
        <div className="dashboard-card studio-stat-card"><span className="studio-stat-label">Actieve advertenties</span><div className="stat-number">{active}{Number.isFinite(limit) ? ` / ${limit}` : ""}</div></div>
        <div className="dashboard-card studio-stat-card"><span className="studio-stat-label">Nieuwe aanvragen</span><div className="stat-number">{enquiries.length}</div></div>
        <div className="dashboard-card studio-stat-card"><span className="studio-stat-label">Huidig pakket</span><div className="stat-number studio-plan-name">{providerPlans[user.agency.plan].name}</div><span className="studio-plan-note">Gratis bij lancering</span></div>
      </div>
      <div className="dashboard-card" id="aanbod">
        <div className="section-head"><div><h2>Mijn advertenties</h2><p>Nieuwe advertenties worden eerst door ons gecontroleerd.</p></div></div>
        <details className="studio-listing-create"><summary className="button button-primary">+ Nieuwe advertentie</summary><ListingEditor /></details>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Woning</th><th>Status</th><th>Prijs</th><th>Bijgewerkt</th><th>Acties</th></tr></thead><tbody>
          {listings.map((item) => <tr key={item.id}><td data-label="Woning"><Link className="text-link" href={`/woning/${item.slug}`}>{item.title}</Link></td><td data-label="Status"><span className="status-pill">{item.status}</span></td><td data-label="Prijs">€ {item.price.toLocaleString("nl-NL")}</td><td data-label="Bijgewerkt">{item.updatedAt.toLocaleDateString("nl-NL")}</td><td data-label="Acties"><ListingActions listingId={item.id} status={item.status} /></td></tr>)}
          {!listings.length && <tr><td colSpan={5} data-label="">Nog geen advertenties. Plaats je eerste woning wanneer je er klaar voor bent.</td></tr>}
        </tbody></table></div>
      </div>
      <div className="dashboard-card" id="aanvragen"><h2>Recente aanvragen</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Van</th><th>Woning</th><th>Bericht</th><th>Datum</th></tr></thead><tbody>
        {enquiries.map((item) => <tr key={item.id}><td data-label="Van">{item.name}<br />{item.email}</td><td data-label="Woning">{item.listing.title}</td><td data-label="Bericht">{item.message.slice(0, 100)}</td><td data-label="Datum">{item.createdAt.toLocaleDateString("nl-NL")}</td></tr>)}
        {!enquiries.length && <tr><td colSpan={4} data-label="">Je ontvangt aanvragen zodra woningzoekers op je advertenties reageren.</td></tr>}
      </tbody></table></div></div>
      <div className="dashboard-card" id="profiel"><details><summary className="text-link">Mijn profiel beheren</summary><div style={{ marginTop: 16 }}><AgencySetup agency={user.agency} providerType={user.providerType} /></div><p><Link className="text-link" href={`/makelaars/${user.agency.slug}`}>Bekijk openbaar profiel →</Link></p></details></div>
    </div>
  </section>;
}

function ListingActions({ listingId, status }: { listingId: string; status: string }) {
  return <div className="inline-actions">{!["SOLD", "RENTED", "EXPIRED"].includes(status) && <><Link className="button button-small button-outline" href={`/dashboard/listings/${listingId}`}>Bewerken</Link>{status === "DRAFT" && <form action={`/api/provider/listings/${listingId}/submit`} method="post"><button className="button button-small button-primary">Ter beoordeling</button></form>}<form action={`/api/provider/listings/${listingId}/offline`} method="post"><button className="button-danger">Offline</button></form></>}</div>;
}
