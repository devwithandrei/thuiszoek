import { auth, clerkClient } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";

const accountInput = z.object({ name: z.string().trim().min(2).max(100) });

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Log in om je account aan te maken." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: "Ongeldige JSON-invoer." }, { status: 400 }); }
  const parsed = accountInput.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Controleer je naam." }, { status: 400 });
  const clerk = await clerkClient();
  const identity = await clerk.users.getUser(userId);
  const email = identity.emailAddresses.find((item) => item.id === identity.primaryEmailAddressId && item.verification?.status === "verified")?.emailAddress;
  if (!email) return Response.json({ error: "Voeg eerst een geverifieerd e-mailadres toe aan je Clerk-account." }, { status: 400 });
  let user;
  try {
    user = await db.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, name: parsed.data.name, email, role: "SEEKER" },
      update: { name: parsed.data.name, email },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return Response.json({ error: "Dit e-mailadres is al aan een ander account gekoppeld." }, { status: 409 });
    throw error;
  }
  return Response.json({ message: `Account voor ${user.name} is aangemaakt.` }, { status: 201 });
}
