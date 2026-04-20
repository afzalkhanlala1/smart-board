import Stripe from "stripe";

const rawKey = process.env.STRIPE_SECRET_KEY ?? "";

/**
 * Returns `true` when we have a real Stripe secret key configured.
 * Placeholder values (the default in `.env.example`) trigger the
 * mock-checkout flow which grants enrollment without Stripe.
 */
export function isStripeConfigured(): boolean {
  if (!rawKey) return false;
  if (rawKey.includes("placeholder")) return false;
  return rawKey.startsWith("sk_");
}

// Only initialize Stripe when we have a real key — otherwise the SDK throws
// at request time with a cryptic error.
export const stripe: Stripe | null = isStripeConfigured()
  ? new Stripe(rawKey, { typescript: true })
  : null;

export function calculateFees(amount: number) {
  const platformFee = Math.round(amount * 0.15 * 100) / 100;
  const teacherEarning = Math.round((amount - platformFee) * 100) / 100;
  return { platformFee, teacherEarning };
}
