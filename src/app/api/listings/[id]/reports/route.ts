import { auth } from "@clerk/nextjs/server";
import { reportInput } from "@/lib/validation";
import { db } from "@/lib/db";
import { clientAddress, rateLimit } from "@/lib/rate-limit";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  const ip = clientAddress(request);
  if (!await rateLimit(`report:${ip}`, 5, 60 * 60 * 1000)) return Response.json({ error: "Te veel meldingen. Probeer het later opnieuw." }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Ongeldige JSON-invoer." }, { status: 400 }); }
  const parsed = reportInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Kies een geldige reden voor je melding." }, { status: 400 });
  const listing = await db.listing.findFirst({ where: { id, status: "PUBLISHED" }, select: { id: true } });
  if (!listing) return Response.json({ error: "Advertentie niet gevonden." }, { status: 404 });
  const { userId } = await auth();
  const reporter = userId ? await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } }) : null;
  const report = await db.report.create({ data: { listingId: id, reporterId: reporter?.id, ...parsed.data } });
  return Response.json({ message: "Bedankt. We beoordelen je melding.", id: report.id }, { status: 201 });
}
