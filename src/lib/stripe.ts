import Stripe from "stripe";
import { prisma } from "./prisma";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// H5 fix: Use DB upsert pattern to prevent race condition creating duplicate customers
// The stripeCustomerId field has a @unique constraint in schema
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  });

  // Upsert — handles race condition: if another request already set it, the unique
  // constraint will catch the conflict. We use updateMany with a null check so only
  // the first writer wins.
  await prisma.user.updateMany({
    where: { id: userId, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  });

  // Re-fetch to get the winner's customer ID (in case of race)
  const updated = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  // If someone else won the race and created a different customer, delete ours
  if (updated?.stripeCustomerId && updated.stripeCustomerId !== customer.id) {
    await stripe.customers.del(customer.id).catch(() => {});
    return updated.stripeCustomerId;
  }

  return customer.id;
}

// Format cents to display currency string
export function formatCurrency(amountCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

// Calculate MRR from a subscription (normalize annual plans to monthly)
export function subscriptionToMonthlyAmount(sub: {
  amount: number;
  interval: string | null;
  intervalCount: number | null;
}): number {
  if (!sub.interval) return 0;
  const count = sub.intervalCount ?? 1;
  if (sub.interval === "month") return sub.amount / count;
  if (sub.interval === "year") return sub.amount / (count * 12);
  if (sub.interval === "week") return (sub.amount / count) * 4.33;
  if (sub.interval === "day") return (sub.amount / count) * 30;
  return 0;
}

export async function getRevenueTrend(days: number): Promise<Array<{ date: string; amount: number }>> {
  const since = Math.floor(Date.now() / 1000) - days * 86400
  const charges = await stripe.charges.list({ created: { gte: since }, limit: 100 })
  const byDay: Record<string, number> = {}
  for (const charge of charges.data) {
    if (charge.status !== 'succeeded') continue
    const day = new Date(charge.created * 1000).toISOString().slice(0, 10)
    byDay[day] = (byDay[day] ?? 0) + charge.amount
  }
  return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, amount }))
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl })
  return session.url
}
