import { auth, clerkClient } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { isConfiguredAdminEmail } from "@/lib/admin-bootstrap";

export async function currentUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { clerkId: userId }, include: { agency: true } });
  if (user?.role === Role.ADMIN) return user;

  const configuredEmail = process.env.SEED_ADMIN_EMAIL?.trim();
  if (!configuredEmail || (user && user.email.toLowerCase() !== configuredEmail.toLowerCase())) return user;

  const clerk = await clerkClient();
  const identity = await clerk.users.getUser(userId);
  const primaryEmail = identity.emailAddresses.find((email) => email.id === identity.primaryEmailAddressId);
  const verifiedEmail = primaryEmail?.emailAddress;
  if (!verifiedEmail || !isConfiguredAdminEmail(verifiedEmail, primaryEmail?.verification?.status, configuredEmail)) return user;

  const email = verifiedEmail.trim().toLowerCase();
  const name = [identity.firstName, identity.lastName].filter(Boolean).join(" ") || "ThuisZoek beheerder";

  try {
    return await db.$transaction(async (tx) => {
      const byEmail = await tx.user.findUnique({ where: { email } });
      if (user && byEmail && byEmail.id !== user.id) {
        throw new Error("The configured administrator email and Clerk identity are linked to different database accounts.");
      }

      const admin = user
        ? await tx.user.update({
            where: { id: user.id },
            data: { email, role: Role.ADMIN },
            include: { agency: true },
          })
        : byEmail
          ? await tx.user.update({
              where: { id: byEmail.id },
              data: { clerkId: userId, email, role: Role.ADMIN },
              include: { agency: true },
            })
          : await tx.user.create({
              data: { clerkId: userId, email, name, role: Role.ADMIN },
              include: { agency: true },
            });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "bootstrap_admin_verified_email",
          entityType: "user",
          entityId: admin.id,
        },
      });

      return admin;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existingAdmin = await db.user.findUnique({ where: { clerkId: userId }, include: { agency: true } });
      if (existingAdmin?.role === Role.ADMIN) return existingAdmin;
    }
    throw error;
  }
}

export async function requireRole(...roles: Role[]) {
  const user = await currentUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}
