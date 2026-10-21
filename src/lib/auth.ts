import { auth } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";

export async function currentUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.user.findUnique({ where: { clerkId: userId }, include: { agency: true } });
}

export async function requireRole(...roles: Role[]) {
  const user = await currentUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}
