import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ListingEditor } from "@/components/dashboard-forms";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
export default async function EditListingPage({ params }: Props) {
  const user = await requireRole("PROVIDER");
  if (!user?.agency) redirect("/dashboard");
  const { id } = await params;
  const listing = await db.listing.findFirst({ where: { id, agencyId: user.agency.id } });
  if (!listing) notFound();
  return <section className="wrap page-body"><Link className="text-link" href="/dashboard">← Terug naar dashboard</Link><h1 className="page-title">Advertentie bewerken</h1><p>Wijzigingen aan gepubliceerde advertenties worden opnieuw gecontroleerd.</p><div style={{ marginTop: 22 }}><ListingEditor listingId={listing.id} listing={listing} /></div></section>;
}
