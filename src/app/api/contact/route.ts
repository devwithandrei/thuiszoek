import { contactInput } from "@/lib/validation";
import { db } from "@/lib/db";
import { clientAddress, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientAddress(request);
  if (!await rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) return Response.json({ error: "Te veel berichten. Probeer het later opnieuw." }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Ongeldige JSON-invoer." }, { status: 400 }); }
  const parsed = contactInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Controleer de verplichte velden." }, { status: 400 });
  const message = await db.contactMessage.create({ data: parsed.data });
  return Response.json({ message: "Je bericht is verstuurd.", id: message.id }, { status: 201 });
}
