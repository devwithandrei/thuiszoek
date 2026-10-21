import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { providerPlans } from "@/lib/plans";
type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  const user = await requireRole("PROVIDER");
  if (!user?.agency) return Response.json({ error: "Niet bevoegd." }, { status: 403 });
  const { id } = await params;
  const limit = providerPlans[user.agency.plan].limit;
  let result: { updated: boolean; quotaExceeded: boolean };
  try {
    result = await db.$transaction(async (tx) => {
      const draft = await tx.listing.findFirst({ where: { id, agencyId: user.agency!.id, status: "DRAFT" }, select: { id: true } });
      if (!draft) return { updated: false, quotaExceeded: false };
      const active = await tx.listing.count({ where: { agencyId: user.agency!.id, status: { in: ["PUBLISHED", "PENDING_REVIEW"] }, expiresAt: { gt: new Date() } } });
      if (active >= limit) return { updated: false, quotaExceeded: true };
      const updated = await tx.listing.updateMany({ where: { id, agencyId: user.agency!.id, status: "DRAFT" }, data: { status: "PENDING_REVIEW", expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
      if (updated.count) await tx.auditLog.create({ data: { actorId: user.id, action: "submit_for_review", entityType: "listing", entityId: id } });
      return { updated: updated.count > 0, quotaExceeded: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return Response.json({ error: "Je advertentielimiet is gelijktijdig bereikt. Vernieuw het dashboard en probeer opnieuw." }, { status: 409 });
    throw error;
  }
  if (result.quotaExceeded) return Response.json({ error: `Je ${providerPlans[user.agency.plan].name}-plan heeft geen ruimte voor meer actieve advertenties.` }, { status: 409 });
  if (!result.updated) return Response.json({ error: "Concept niet gevonden of kan niet worden ingediend." }, { status: 404 });
  return Response.redirect(new URL("/dashboard", _request.url), 303);
}
