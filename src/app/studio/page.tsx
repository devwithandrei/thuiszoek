import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { providerPlans } from "@/lib/plans";
import { db } from "@/lib/db";
import { AgencySetup, ListingEditor, OnboardingWizard } from "@/components/dashboard-forms";

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
    <aside><span className="eyebrow">ThuisZoek Studio</span><h2>Mijn aanbod</h2><p>{user.agency.name}</p><nav className="dashboard-nav"><a href="#overzicht">Overzicht</a><a href="#aanbod">Advertenties</a><a href="#aanvragen">Aanvragen</a><a href="#profiel">Profiel</a></nav></aside>
    <div className="studio-content">
      <span className="eyebrow">{providerName}</span>
      <h1 className="page-title" id="overzicht">Welkom, {user.name.split(" ")[0]}</h1>
      <p className="studio-lead">Beheer je vastgoed, aanvragen en aanbiedersprofiel op één plek.</p>
      <div className="stat-grid">
        <div className="dashboard-card"><span>Actieve advertenties</span><div className="stat-number">{active}{Number.isFinite(limit) ? ` / ${limit}` : ""}</div></div>
        <div className="dashboard-card"><span>Nieuwe aanvragen</span><div className="stat-number">{enquiries.length}</div></div>
        <div className="dashboard-card"><span>Plan</span><div className="stat-number" style={{ fontSize: 20 }}>{providerPlans[user.agency.plan].name}</div><span>Gratis bij lancering</span></div>
      </div>
      <div className="dashboard-card" id="aanbod">
        <div className="section-head"><div><h2>Mijn advertenties</h2><p>Nieuwe advertenties worden eerst door ons gecontroleerd.</p></div></div>
        <details style={{ marginBottom: 20 }}><summary className="button button-primary" style={{ display: "inline-flex", margin: "14px 0" }}>+ Nieuwe advertentie</summary><ListingEditor /></details>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Woning</th><th>Status</th><th>Prijs</th><th>Bijgewerkt</th><th>Acties</th></tr></thead><tbody>
          {listings.map((item) => <tr key={item.id}><td><Link className="text-link" href={`/woning/${item.slug}`}>{item.title}</Link></td><td><span className="status-pill">{item.status}</span></td><td>€ {item.price.toLocaleString("nl-NL")}</td><td>{item.updatedAt.toLocaleDateString("nl-NL")}</td><td><ListingActions listingId={item.id} status={item.status} /></td></tr>)}
          {!listings.length && <tr><td colSpan={5}>Nog geen advertenties. Plaats je eerste woning wanneer je er klaar voor bent.</td></tr>}
        </tbody></table></div>
      </div>
      <div className="dashboard-card" id="aanvragen"><h2>Recente aanvragen</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Van</th><th>Woning</th><th>Bericht</th><th>Datum</th></tr></thead><tbody>
        {enquiries.map((item) => <tr key={item.id}><td>{item.name}<br />{item.email}</td><td>{item.listing.title}</td><td>{item.message.slice(0, 100)}</td><td>{item.createdAt.toLocaleDateString("nl-NL")}</td></tr>)}
        {!enquiries.length && <tr><td colSpan={4}>Je ontvangt aanvragen zodra woningzoekers op je advertenties reageren.</td></tr>}
      </tbody></table></div></div>
      <div className="dashboard-card" id="profiel"><details><summary className="text-link">Mijn profiel beheren</summary><div style={{ marginTop: 16 }}><AgencySetup agency={user.agency} providerType={user.providerType} /></div><p><Link className="text-link" href={`/makelaars/${user.agency.slug}`}>Bekijk openbaar profiel →</Link></p></details></div>
    </div>
  </section>;
}

function ListingActions({ listingId, status }: { listingId: string; status: string }) {
  return <div className="inline-actions">{!["SOLD", "RENTED", "EXPIRED"].includes(status) && <><Link className="button button-small button-outline" href={`/dashboard/listings/${listingId}`}>Bewerken</Link>{status === "DRAFT" && <form action={`/api/provider/listings/${listingId}/submit`} method="post"><button className="button button-small button-primary">Ter beoordeling</button></form>}<form action={`/api/provider/listings/${listingId}/offline`} method="post"><button className="button-danger">Offline</button></form></>}</div>;
}
