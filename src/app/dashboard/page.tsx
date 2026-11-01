import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { currentUser } from "@/lib/auth";
import { OnboardingWizard } from "@/components/dashboard-forms";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  if (user?.role === Role.ADMIN) redirect("/admin");
  if (user?.role === Role.PROVIDER) redirect("/studio");

  if (!user || !user.searchPreference) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
    const clerk = await clerkClient();
    const identity = await clerk.users.getUser(userId);
    const initialName = user?.name || [identity.firstName, identity.lastName].filter(Boolean).join(" ") || "";
    const initialCity = user?.preferredCity || "";
    return <section className="section"><div className="wrap">
      <OnboardingWizard initialName={initialName} initialCity={initialCity} initialType="SEEKER" />
    </div></section>;
  }

  const preference = user.searchPreference === "BOTH" ? "huren en kopen" : user.searchPreference === "RENT" ? "huren" : "kopen";
  return <section className="section"><div className="wrap seeker-dashboard">
    <span className="eyebrow">Woningzoeker</span>
    <h1 className="page-title">Welkom, {user.name.split(" ")[0]}</h1>
    <p className="seeker-dashboard-lead">Je account staat klaar. Ontdek woningen die passen bij jouw zoektocht.</p>
    <div className="seeker-dashboard-grid">
      <article className="dashboard-card seeker-search-card"><span className="account-type-icon">⌂</span><h2>Jouw zoektocht</h2><p>Je zoekt een woning om te {preference}{user.preferredCity ? ` in ${user.preferredCity}` : ""}.</p><Link className="button button-primary" href={`/zoeken${user.preferredCity ? `?plaats=${encodeURIComponent(user.preferredCity)}` : ""}`}>Bekijk woningen</Link></article>
      <article className="dashboard-card"><span className="account-type-icon">✉</span><h2>Neem contact op</h2><p>Heb je een woning gevonden? Stuur een bericht naar de aanbieder via de advertentie.</p><Link className="text-link" href="/zoeken">Start met zoeken →</Link></article>
    </div>
  </div></section>;
}
