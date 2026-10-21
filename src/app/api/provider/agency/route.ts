import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const agencyInput = z.object({
  name: z.string().trim().min(2).max(120), city: z.string().trim().min(2).max(100),
  description: z.string().trim().min(30).max(3000),
  website: z.union([z.literal(""), z.url().max(250)]).optional(), phone: z.string().trim().max(30).optional(),
});
function slugify(name: string) { return `${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 65)}-${crypto.randomUUID().slice(0, 6)}`; }

export async function POST(request: Request) {
  const user = await requireRole("PROVIDER");
  if (!user) return Response.json({ error: "Een goedgekeurd aanbiedersaccount is vereist." }, { status: 403 });
  if (user.agency) return Response.json({ error: "Je kantoorprofiel bestaat al." }, { status: 409 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Ongeldige JSON-invoer." }, { status: 400 }); }
  const parsed = agencyInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Controleer de verplichte kantoorvelden." }, { status: 400 });
  const agency = await db.$transaction(async (tx) => {
    const created = await tx.agency.create({ data: { userId: user.id, name: parsed.data.name, city: parsed.data.city, description: parsed.data.description, website: parsed.data.website || null, phone: parsed.data.phone || null, slug: slugify(parsed.data.name) } });
    await tx.auditLog.create({ data: { actorId: user.id, action: "create", entityType: "agency", entityId: created.id } });
    return created;
  });
  return Response.json({ message: "Je kantoorprofiel is aangemaakt.", id: agency.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await requireRole("PROVIDER");
  if (!user?.agency) return Response.json({ error: "Niet bevoegd." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Ongeldige JSON-invoer." }, { status: 400 }); }
  const parsed = agencyInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Controleer de verplichte kantoorvelden." }, { status: 400 });
  await db.$transaction(async (tx) => {
    await tx.agency.update({ where: { id: user.agency!.id }, data: { name: parsed.data.name, city: parsed.data.city, description: parsed.data.description, website: parsed.data.website || null, phone: parsed.data.phone || null } });
    await tx.auditLog.create({ data: { actorId: user.id, action: "update", entityType: "agency", entityId: user.agency!.id } });
  });
  return Response.json({ message: "Je kantoorprofiel is bijgewerkt." });
}
