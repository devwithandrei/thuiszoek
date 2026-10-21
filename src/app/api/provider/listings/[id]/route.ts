import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { listingInput } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
function normalized(body: Record<string, unknown>) {
  if (typeof body.images === "string") body.images = body.images.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
  for (const key of ["price", "bedrooms", "bathrooms", "areaSqm"]) if (typeof body[key] === "string") body[key] = Number(body[key]);
  if (body.energyLabel === "") delete body.energyLabel;
  return body;
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await requireRole("PROVIDER");
  if (!user?.agency) return Response.json({ error: "Niet bevoegd." }, { status: 403 });
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Ongeldige JSON-invoer." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Ongeldige advertentiegegevens." }, { status: 400 });
  const parsed = listingInput.safeParse(normalized(body as Record<string, unknown>));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Controleer de advertentiegegevens." }, { status: 400 });
  const existing = await db.listing.findFirst({ where: { id, agencyId: user.agency.id } });
  if (!existing) return Response.json({ error: "Advertentie niet gevonden." }, { status: 404 });
  if (["SOLD", "RENTED", "EXPIRED"].includes(existing.status)) return Response.json({ error: "Deze advertentie kan niet meer worden gewijzigd." }, { status: 409 });
  const listing = await db.$transaction(async (tx) => {
    const updated = await tx.listing.update({ where: { id }, data: { ...parsed.data, status: existing.status === "DRAFT" ? "DRAFT" : "PENDING_REVIEW", expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    await tx.auditLog.create({ data: { actorId: user.id, action: "update", entityType: "listing", entityId: id } });
    return updated;
  });
  return Response.json({ message: listing.status === "DRAFT" ? "Concept opgeslagen." : "Wijzigingen opgeslagen en ter beoordeling ingestuurd." });
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await requireRole("PROVIDER");
  if (!user?.agency) return Response.json({ error: "Niet bevoegd." }, { status: 403 });
  const { id } = await params;
  const result = await db.$transaction(async (tx) => {
    const updated = await tx.listing.updateMany({ where: { id, agencyId: user.agency!.id, status: { in: ["DRAFT", "PENDING_REVIEW", "PUBLISHED"] } }, data: { status: "EXPIRED" } });
    if (updated.count) await tx.auditLog.create({ data: { actorId: user.id, action: "take_offline", entityType: "listing", entityId: id } });
    return updated;
  });
  if (!result.count) return Response.json({ error: "Advertentie niet gevonden of kan niet offline worden gehaald." }, { status: 404 });
  return Response.json({ message: "Advertentie offline gehaald." });
}
