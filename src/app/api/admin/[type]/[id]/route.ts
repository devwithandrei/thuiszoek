import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

type Context = { params: Promise<{ type: string; id: string }> };
const inputSchema = z.object({ action: z.string().min(1).max(40) });

export async function PATCH(request: Request, { params }: Context) {
  const admin = await requireRole(Role.ADMIN);
  if (!admin) return Response.json({ error: "Alleen beheerders mogen deze actie uitvoeren." }, { status: 403 });
  const { type, id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Ongeldige JSON-invoer." }, { status: 400 }); }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Ongeldige beheeractie." }, { status: 400 });
  const { action } = parsed.data;
  if (type === "listing") {
    const status = action === "approve" ? "PUBLISHED" : action === "reject" ? "REJECTED" : action === "expire" ? "EXPIRED" : null;
    if (!status) return Response.json({ error: "Ongeldige advertentieactie." }, { status: 400 });
    const listing = await db.listing.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!listing || (action === "approve" && listing.status !== "PENDING_REVIEW") || (action === "reject" && listing.status !== "PENDING_REVIEW")) return Response.json({ error: "Advertentie niet gevonden of status gewijzigd." }, { status: 409 });
    await db.listing.update({ where: { id }, data: { status, ...(status === "PUBLISHED" ? { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } : {}) } });
  } else if (type === "report") {
    const status = action === "resolve" ? "RESOLVED" : action === "dismiss" ? "DISMISSED" : null;
    if (!status) return Response.json({ error: "Ongeldige meldingsactie." }, { status: 400 });
    const report = await db.report.findUnique({ where: { id }, select: { id: true } });
    if (!report) return Response.json({ error: "Melding niet gevonden." }, { status: 404 });
    await db.report.update({ where: { id }, data: { status, reviewerId: admin.id } });
  } else if (type === "user") {
    const roleValue = action.startsWith("role:") ? action.slice(5) : "";
    const role = z.enum(["SEEKER", "PROVIDER"]).safeParse(roleValue);
    if (!role.success) return Response.json({ error: "Ongeldige gebruikersrol." }, { status: 400 });
    const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true, agency: { select: { id: true } } } });
    if (!target) return Response.json({ error: "Gebruiker niet gevonden." }, { status: 404 });
    if (target.role === Role.ADMIN) return Response.json({ error: "Beheerdersrechten worden uitsluitend beheerd via SEED_ADMIN_EMAIL." }, { status: 409 });
    if (target.agency && role.data !== Role.PROVIDER) return Response.json({ error: "Deze gebruiker heeft een aanbiedersprofiel. Behoud de aanbiedersrol om toegang tot advertenties en aanvragen niet te verliezen." }, { status: 409 });
    await db.user.update({ where: { id }, data: { role: role.data } });
  } else if (type === "agency") {
    const update = action === "verify" ? { verified: true } : action === "unverify" ? { verified: false } : action.startsWith("plan:") && ["BASIC", "PRO", "EXPERT_PRO_MAX"].includes(action.slice(5)) ? { plan: action.slice(5) as "BASIC" | "PRO" | "EXPERT_PRO_MAX" } : null;
    if (!update) return Response.json({ error: "Ongeldige kantooractie." }, { status: 400 });
    const agency = await db.agency.findUnique({ where: { id }, select: { id: true } });
    if (!agency) return Response.json({ error: "Kantoor niet gevonden." }, { status: 404 });
    await db.agency.update({ where: { id }, data: update });
  } else return Response.json({ error: "Onbekend beheertype." }, { status: 404 });
  await db.auditLog.create({ data: { actorId: admin.id, action, entityType: type, entityId: id } });
  return Response.json({ message: "Beheeractie uitgevoerd." });
}
