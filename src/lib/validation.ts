import { z } from "zod";

export const listingInput = z.object({
  title: z.string().trim().min(8).max(120),
  description: z.string().trim().min(40).max(8000),
  propertyType: z.enum(["APARTMENT", "HOUSE", "STUDIO", "ROOM", "COMMERCIAL", "OFFICE", "RETAIL"]),
  offerType: z.enum(["RENT", "BUY"]),
  price: z.number().int().positive().max(100_000_000),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().regex(/^[1-9][0-9]{3}\s?[A-Za-z]{2}$/),
  address: z.string().trim().max(180).optional(),
  bedrooms: z.number().int().min(0).max(30),
  bathrooms: z.number().int().min(0).max(30),
  areaSqm: z.number().int().min(1).max(100_000),
  energyLabel: z.string().regex(/^(A\+\+\+\+|A\+\+\+|A\+\+|A\+|[A-G])$/).optional(),
  images: z.array(z.string().url().max(2048).refine((value) => {
    try { return new URL(value).hostname === "res.cloudinary.com" && new URL(value).protocol === "https:"; }
    catch { return false; }
  }, "Gebruik een beveiligde Cloudinary-afbeelding")).max(20).default([]),
});

export const enquiryInput = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(10).max(4000),
});

export const reportInput = z.object({
  reason: z.enum(["incorrect", "unavailable", "suspicious", "other"]),
  details: z.string().trim().max(2000).optional(),
});

export const contactInput = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(4000),
});

export function listingSlug(title: string) {
  return `${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70)}-${crypto.randomUUID().slice(0, 8)}`;
}
