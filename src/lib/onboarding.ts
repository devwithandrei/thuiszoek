import { z } from "zod";

export const seekerOnboardingInput = z.object({
  accountType: z.literal("SEEKER"),
  name: z.string().trim().min(2).max(100),
  searchPreference: z.enum(["RENT", "BUY", "BOTH"]),
  preferredCity: z.string().trim().max(100).optional(),
});

export const providerOnboardingInput = z.object({
  accountType: z.literal("PROVIDER"),
  providerType: z.enum(["PRIVATE_PERSON", "AGENCY"]),
  name: z.string().trim().min(2).max(100),
  profileName: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(100),
  description: z.string().trim().min(30).max(3000),
  website: z.union([z.literal(""), z.url().max(250)]).optional(),
  phone: z.string().trim().max(30).optional(),
});

export const onboardingInput = z.discriminatedUnion("accountType", [
  seekerOnboardingInput,
  providerOnboardingInput,
]);
