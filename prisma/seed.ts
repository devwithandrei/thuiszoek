import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const adminClerkId = process.env.SEED_ADMIN_CLERK_ID;
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (adminClerkId && adminEmail) {
    const adminName = process.env.SEED_ADMIN_NAME || "ThuisZoek beheerder";
    const [userByClerkId, userByEmail] = await Promise.all([
      db.user.findUnique({ where: { clerkId: adminClerkId } }),
      db.user.findUnique({ where: { email: adminEmail.toLowerCase() } }),
    ]);
    if (userByClerkId && userByEmail && userByClerkId.id !== userByEmail.id) {
      throw new Error("The configured Clerk ID and admin email belong to different database users. Verify both values before seeding.");
    }
    if (userByEmail) {
      await db.user.update({
        where: { id: userByEmail.id },
        data: { clerkId: adminClerkId, email: adminEmail.toLowerCase(), name: adminName, role: "ADMIN" },
      });
    } else {
      await db.user.upsert({
        where: { clerkId: adminClerkId },
        create: { clerkId: adminClerkId, email: adminEmail.toLowerCase(), name: adminName, role: "ADMIN" },
        update: { email: adminEmail.toLowerCase(), name: adminName, role: "ADMIN" },
      });
    }
  } else if (adminEmail) {
    console.info("No SEED_ADMIN_CLERK_ID set. The admin account will be created on sign-in after Clerk verifies SEED_ADMIN_EMAIL.");
  }

  const provider = await db.user.upsert({
    where: { clerkId: "seed-provider-demo" },
    create: { clerkId: "seed-provider-demo", email: "demo@voorbeeld.invalid", name: "Demo aanbieder", role: "PROVIDER" },
    update: { role: "PROVIDER" },
  });
  const agency = await db.agency.upsert({
    where: { slug: "voorbeeld-makelaars" },
    create: { userId: provider.id, name: "Voorbeeld Makelaars", slug: "voorbeeld-makelaars", description: "Fictief makelaarsprofiel voor lokale demonstraties. Dit voorbeeld hoort niet bij een echt kantoor.", city: "Utrecht", plan: "EXPERT_PRO_MAX", verified: true },
    update: { userId: provider.id, plan: "EXPERT_PRO_MAX", verified: true },
  });
  const listings = [
    { slug: "demo-licht-appartement-utrecht", title: "Licht appartement met zonnig balkon", city: "Utrecht", postalCode: "3511 AB", offerType: "RENT" as const, propertyType: "APARTMENT" as const, price: 1450, bedrooms: 2, bathrooms: 1, areaSqm: 78, energyLabel: "A", description: "Fictieve demonstratieadvertentie. Dit voorbeeld is niet te huur en bevat geen echte woning, eigenaar of makelaar. Gebruik uitsluitend eigen, toegestane foto's en gegevens voor echte advertenties." },
    { slug: "demo-stadswoning-haarlem", title: "Karakteristieke stadswoning met patio", city: "Haarlem", postalCode: "2011 CD", offerType: "BUY" as const, propertyType: "HOUSE" as const, price: 425000, bedrooms: 3, bathrooms: 2, areaSqm: 122, energyLabel: "B", description: "Fictieve demonstratieadvertentie. Dit voorbeeld is niet te koop en bevat geen echte woning, eigenaar of makelaar. Gebruik uitsluitend eigen, toegestane foto's en gegevens voor echte advertenties." },
    { slug: "demo-studio-rotterdam", title: "Compacte studio nabij het centrum", city: "Rotterdam", postalCode: "3011 EF", offerType: "RENT" as const, propertyType: "STUDIO" as const, price: 975, bedrooms: 1, bathrooms: 1, areaSqm: 42, energyLabel: "A", description: "Fictieve demonstratieadvertentie. Dit voorbeeld is niet te huur en bevat geen echte woning, eigenaar of makelaar. Gebruik uitsluitend eigen, toegestane foto's en gegevens voor echte advertenties." },
  ];
  for (const listing of listings) {
    await db.listing.upsert({
      where: { slug: listing.slug },
      create: { ...listing, agencyId: agency.id, status: "PUBLISHED", expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000), images: [] },
      update: { ...listing, status: "PUBLISHED", expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000) },
    });
  }
  console.info("Demo data seeded. Sample listings and provider details are fictional.");
}

main().finally(async () => { await db.$disconnect(); });
