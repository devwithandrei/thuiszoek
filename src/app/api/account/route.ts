import { auth, clerkClient } from "@clerk/nextjs/server";
import { Prisma, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { onboardingInput } from "@/lib/onboarding";

function slugify(name: string) {
  return `${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 65)}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Log in om je account in te stellen." }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Ongeldige JSON-invoer." }, { status: 400 });
  }

  const parsed = onboardingInput.safeParse(raw);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Controleer je gegevens." }, { status: 400 });

  const clerk = await clerkClient();
  const identity = await clerk.users.getUser(userId);
  const email = identity.emailAddresses.find(
    (item) => item.id === identity.primaryEmailAddressId && item.verification?.status === "verified",
  )?.emailAddress;
  if (!email) return Response.json({ error: "Voeg eerst een geverifieerd e-mailadres toe aan je Clerk-account." }, { status: 400 });

  const existing = await db.user.findUnique({ where: { clerkId: userId }, include: { agency: true } });
  if (existing?.role === Role.ADMIN) return Response.json({ error: "Dit beheerdersaccount hoeft niet te worden ingesteld." }, { status: 409 });
  if (existing?.role === Role.PROVIDER && existing.agency) return Response.json({ error: "Je aanbiedersprofiel is al ingesteld." }, { status: 409 });
  if (existing?.role === Role.SEEKER && existing.searchPreference) return Response.json({ error: "Je woningzoekeraccount is al ingesteld." }, { status: 409 });

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { clerkId: userId },
        create: {
          clerkId: userId,
          email,
          name: parsed.data.name,
          role: parsed.data.accountType === "SEEKER" ? Role.SEEKER : Role.PROVIDER,
          providerType: parsed.data.accountType === "PROVIDER" ? parsed.data.providerType : null,
          searchPreference: parsed.data.accountType === "SEEKER" ? parsed.data.searchPreference : null,
          preferredCity: parsed.data.accountType === "SEEKER" ? parsed.data.preferredCity || null : null,
        },
        update: {
          email,
          name: parsed.data.name,
          role: parsed.data.accountType === "SEEKER" ? Role.SEEKER : Role.PROVIDER,
          providerType: parsed.data.accountType === "PROVIDER" ? parsed.data.providerType : null,
          searchPreference: parsed.data.accountType === "SEEKER" ? parsed.data.searchPreference : null,
          preferredCity: parsed.data.accountType === "SEEKER" ? parsed.data.preferredCity || null : null,
        },
      });

      if (parsed.data.accountType === "PROVIDER") {
        await tx.agency.create({
          data: {
            userId: user.id,
            name: parsed.data.profileName,
            slug: slugify(parsed.data.profileName),
            city: parsed.data.city,
            description: parsed.data.description,
            website: parsed.data.website || null,
            phone: parsed.data.phone || null,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "complete_onboarding",
          entityType: "user",
          entityId: user.id,
          metadata: {
            role: parsed.data.accountType,
            ...(parsed.data.accountType === "PROVIDER" ? { providerType: parsed.data.providerType } : { searchPreference: parsed.data.searchPreference }),
          },
        },
      });

      return { user, destination: parsed.data.accountType === "SEEKER" ? "/dashboard" : "/studio" };
    });

    return Response.json({ message: "Je account is ingesteld.", destination: result.destination }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Dit e-mailadres of profiel is al aan een ander account gekoppeld." }, { status: 409 });
    }
    throw error;
  }
}
