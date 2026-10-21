import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  const user = await requireRole("PROVIDER");
  if (!user?.agency) return Response.json({ error: "Niet bevoegd." }, { status: 403 });
  const { id } = await params;
  const result = await db.$transaction(async (tx) => {
    const updated = await tx.listing.updateMany({ where: { id, agencyId: user.agency!.id, status: { in: ["DRAFT", "PENDING_REVIEW", "PUBLISHED"] } }, data: { status: "EXPIRED" } });
    if (updated.count) await tx.auditLog.create({ data: { actorId: user.id, action: "take_offline", entityType: "listing", entityId: id } });
    return updated;
  });
  if (!result.count) return Response.json({ error: "Advertentie niet gevonden." }, { status: 404 });
  return Response.redirect(new URL("/dashboard", request.url), 303);
}
