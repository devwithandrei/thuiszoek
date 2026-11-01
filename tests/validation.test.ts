import { describe, expect, it } from "vitest";
import { contactInput, enquiryInput, listingInput, reportInput } from "../src/lib/validation";
import { providerPlans } from "../src/lib/plans";
import { clientAddress } from "../src/lib/rate-limit";
import { onboardingInput } from "../src/lib/onboarding";
import { isConfiguredAdminEmail } from "../src/lib/admin-bootstrap";

const validListing = {
  title: "Ruim appartement met tuin",
  description: "Een representatieve beschrijving van voldoende lengte voor een geldige advertentie.",
  propertyType: "APARTMENT",
  offerType: "RENT",
  price: 1200,
  city: "Utrecht",
  postalCode: "3511 AB",
  bedrooms: 2,
  bathrooms: 1,
  areaSqm: 70,
  images: ["https://res.cloudinary.com/voorbeeld/image/upload/sample.jpg"],
};

describe("listing validation", () => {
  it("accepts a complete listing and defaults images", () => {
    expect(listingInput.parse({ ...validListing, images: undefined }).images).toEqual([]);
  });

  it("rejects prices that are not positive whole euros", () => {
    expect(listingInput.safeParse({ ...validListing, price: -1 }).success).toBe(false);
    expect(listingInput.safeParse({ ...validListing, price: 99.95 }).success).toBe(false);
  });

  it("rejects non-Cloudinary and insecure image links", () => {
    expect(listingInput.safeParse({ ...validListing, images: ["https://example.com/photo.jpg"] }).success).toBe(false);
    expect(listingInput.safeParse({ ...validListing, images: ["http://res.cloudinary.com/demo.jpg"] }).success).toBe(false);
  });

  it("validates Dutch postal codes", () => {
    expect(listingInput.safeParse({ ...validListing, postalCode: "3511 AB" }).success).toBe(true);
    expect(listingInput.safeParse({ ...validListing, postalCode: "0000 ZZ" }).success).toBe(false);
  });
});

describe("public request validation", () => {
  it("rejects malformed enquiry email and short message", () => {
    expect(enquiryInput.safeParse({ name: "Jan", email: "not-an-email", message: "hoi" }).success).toBe(false);
  });

  describe("administrator bootstrap", () => {
    it("only accepts the configured, verified primary email", () => {
      expect(isConfiguredAdminEmail("DevWithAndrei@gmail.com", "verified", "devwithandrei@gmail.com")).toBe(true);
      expect(isConfiguredAdminEmail("devwithandrei@gmail.com", "unverified", "devwithandrei@gmail.com")).toBe(false);
      expect(isConfiguredAdminEmail("other@example.com", "verified", "devwithandrei@gmail.com")).toBe(false);
      expect(isConfiguredAdminEmail("devwithandrei@gmail.com", "verified", "")).toBe(false);
    });

    it("allows multiple configured emails separated by commas or newlines", () => {
      expect(isConfiguredAdminEmail(" SECOND@example.com ", "verified", "first@example.com, second@example.com")).toBe(true);
      expect(isConfiguredAdminEmail("third@example.com", "verified", "first@example.com,\nsecond@example.com")).toBe(false);
    });
  });

  describe("account onboarding", () => {
    it("accepts a seeker with a selected search preference", () => {
      expect(onboardingInput.safeParse({
        accountType: "SEEKER",
        name: "Alex Seeker",
        searchPreference: "RENT",
        preferredCity: "Utrecht",
      }).success).toBe(true);
    });

    it("accepts an independent private property provider", () => {
      expect(onboardingInput.safeParse({
        accountType: "PROVIDER",
        providerType: "PRIVATE_PERSON",
        name: "Sam Owner",
        profileName: "Sam Owner",
        city: "Leiden",
        description: "Particuliere eigenaar met een woning beschikbaar voor verhuur.",
        phone: "+31 6 12345678",
      }).success).toBe(true);
    });

    it("requires a complete agency profile before provider access", () => {
      const agency = {
        accountType: "PROVIDER",
        providerType: "AGENCY",
        name: "Robin Agent",
        profileName: "Utrecht Makelaars",
        city: "Utrecht",
        description: "Een professioneel kantoor met een aanbod van woningen in de regio.",
        website: "https://example.nl",
      };
      expect(onboardingInput.safeParse(agency).success).toBe(true);
      expect(onboardingInput.safeParse({ ...agency, description: "Kantoor." }).success).toBe(false);
      expect(onboardingInput.safeParse({ ...agency, providerType: "SOMEONE_ELSE" }).success).toBe(false);
    });
  });

  describe("launch provider plans", () => {
    it("keeps each plan free and enforces its advertised listing limit", () => {
      expect(providerPlans.BASIC).toMatchObject({ price: "Gratis", limit: 1 });
      expect(providerPlans.PRO).toMatchObject({ price: "Gratis", limit: 10 });
      expect(providerPlans.EXPERT_PRO_MAX.price).toBe("Gratis");
      expect(providerPlans.EXPERT_PRO_MAX.limit).toBe(Infinity);
    });

    describe("client rate-limit address", () => {
      it("uses only a validated trusted real-IP header", () => {
        const request = new Request("https://example.test", { headers: { "x-real-ip": "198.51.100.20", "x-forwarded-for": "203.0.113.5" } });
        expect(clientAddress(request)).toBe("198.51.100.20");
        expect(clientAddress(new Request("https://example.test", { headers: { "x-forwarded-for": "203.0.113.5" } }))).toBe("unknown");
        expect(clientAddress(new Request("https://example.test", { headers: { "x-real-ip": "not-an-ip" } }))).toBe("unknown");
      });
    });
  });

  it("restricts report reasons to the supported set", () => {
    expect(reportInput.safeParse({ reason: "suspicious" }).success).toBe(true);
    expect(reportInput.safeParse({ reason: "spam-me" }).success).toBe(false);
  });

  it("requires valid contact details", () => {
    expect(contactInput.safeParse({ name: "Ada", email: "ada@example.nl", subject: "Vraag", message: "Ik heb een vraag over het platform." }).success).toBe(true);
    expect(contactInput.safeParse({ name: "A", email: "no", subject: "x", message: "x" }).success).toBe(false);
  });
});
