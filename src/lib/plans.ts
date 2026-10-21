import { Plan } from "@prisma/client";

export const providerPlans = {
  BASIC: { name: "Basic", price: "Gratis", limit: 1 },
  PRO: { name: "Pro", price: "Gratis", limit: 10 },
  EXPERT_PRO_MAX: { name: "Expert Pro Max", price: "Gratis", limit: Infinity },
} satisfies Record<Plan, { name: string; price: string; limit: number }>;

export const BILLING_ENABLED = process.env.BILLING_ENABLED === "true";
