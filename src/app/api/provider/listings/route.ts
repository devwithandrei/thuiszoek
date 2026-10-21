import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { providerPlans } from "@/lib/plans";
import { listingInput, listingSlug } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await requireRole("PROVIDER");
  if (!user?.agency) return Response.json({ error: "Een goedgekeurd aanbiedersaccount met kantoorprofiel is vereist." }, { status: 403 });
  let body: unknown;
  try {
    const form = await request.json() as Record<string, unknown>;
    if (typeof form.images === "string") form.images = form.images.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
    if (typeof form.price === "string") form.price = Number(form.price);
    if (typeof form.bedrooms === "string") form.bedrooms = Number(form.bedrooms);
    if (typeof form.bathrooms === "string") form.bathrooms = Number(form.bathrooms);
    if (typeof form.areaSqm === "string") form.areaSqm = Number(form.areaSqm);
    if (form.energyLabel === "") delete form.energyLabel;
    body = form;
  } catch { return Response.json({ error: "Ongeldige JSON-invoer." }, { status: 400 }); }
  const parsed = listingInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Controleer de advertentiegegevens." }, { status: 400 });
  const max = providerPlans[user.agency.plan].limit;
  try {
    const listing = await db.$transaction(async (tx) => {
      const activeCount = await tx.listing.count({ where: { agencyId: user.agency!.id, status: { in: ["PUBLISHED", "PENDING_REVIEW"] }, expiresAt: { gt: new Date() } } });
      if (activeCount >= max) return null;
      const created = await tx.listing.create({ data: { ...parsed.data, agencyId: user.agency!.id, slug: listingSlug(parsed.data.title), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "create_draft", entityType: "listing", entityId: created.id } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (!listing) return Response.json({ error: `Je ${providerPlans[user.agency.plan].name}-plan staat maximaal ${max} actieve advertentie${max === 1 ? "" : "s"} toe.` }, { status: 409 });
    return Response.json({ message: "Conceptadvertentie aangemaakt.", id: listing.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return Response.json({ error: "Er is gelijktijdig een advertentie geplaatst. Probeer het opnieuw." }, { status: 409 });
    throw error;
  }
}
