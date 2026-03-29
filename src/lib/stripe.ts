import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export function calculateFees(amount: number) {
  const platformFee = Math.round(amount * 0.15 * 100) / 100;
  const teacherEarning = Math.round((amount - platformFee) * 100) / 100;
  return { platformFee, teacherEarning };
}
