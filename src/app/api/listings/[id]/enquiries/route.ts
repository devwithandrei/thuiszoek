import { auth } from "@clerk/nextjs/server";
import { enquiryInput } from "@/lib/validation";
import { db } from "@/lib/db";
import { clientAddress, rateLimit } from "@/lib/rate-limit";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  const ip = clientAddress(request);
  if (!await rateLimit(`enquiry:${ip}`, 5, 60 * 60 * 1000)) return Response.json({ error: "Te veel aanvragen vanaf dit netwerk. Probeer het later opnieuw." }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Ongeldige JSON-invoer." }, { status: 400 }); }
  const parsed = enquiryInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Controleer naam, e-mailadres en bericht." }, { status: 400 });
  const listing = await db.listing.findFirst({ where: { id, status: "PUBLISHED", expiresAt: { gt: new Date() } }, select: { id: true } });
  if (!listing) return Response.json({ error: "Deze advertentie is niet langer beschikbaar." }, { status: 404 });
  const { userId } = await auth();
  const seeker = userId ? await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } }) : null;
  const enquiry = await db.enquiry.create({ data: { listingId: listing.id, seekerId: seeker?.id, ...parsed.data } });
  return Response.json({ message: "Je aanvraag is verzonden.", id: enquiry.id }, { status: 201 });
}
