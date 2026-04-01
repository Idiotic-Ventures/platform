import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// H3 fix: Explicit env guard — missing webhook secret = 500 at startup, not unhandled crash
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[webhook] signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.created":
      case "customer.updated": {
        await syncCustomer(event.data.object as Stripe.Customer);
        break;
      }

      case "invoice.payment_failed": {
        // Future: trigger payment failure alert email
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[webhook] payment failed for customer:", invoice.customer);
        break;
      }

      default:
        // Unhandled event type — not an error
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}

// C2 fix: Sync subscription to DB so admin pages don't call Stripe API directly
async function syncSubscription(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Find the user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  // Get product/price info from first item
  const item = sub.items.data[0];
  const price = item?.price;
  const product = price?.product;

  const productId = product
    ? typeof product === "string"
      ? product
      : product.id
    : null;

  // For product name, we need to expand — use metadata fallback
  const productName =
    (sub.metadata?.productName as string | undefined) ?? null;

  const planName =
    price?.nickname ??
    (sub.metadata?.planName as string | undefined) ??
    null;

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    update: {
      stripeCustomerId: customerId,
      userId: user?.id ?? null,
      status: sub.status,
      productId,
      productName,
      priceId: price?.id ?? null,
      planName,
      amount: price?.unit_amount ?? 0,
      currency: price?.currency ?? "usd",
      interval: price?.recurring?.interval ?? null,
      intervalCount: price?.recurring?.interval_count ?? 1,
      currentPeriodStart: sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at
        ? new Date(sub.canceled_at * 1000)
        : null,
      trialStart: sub.trial_start
        ? new Date(sub.trial_start * 1000)
        : null,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      stripeMetadata: sub.metadata ?? {},
    },
    create: {
      stripeSubscriptionId: sub.id,
      stripeCustomerId: customerId,
      userId: user?.id ?? null,
      status: sub.status,
      productId,
      productName,
      priceId: price?.id ?? null,
      planName,
      amount: price?.unit_amount ?? 0,
      currency: price?.currency ?? "usd",
      interval: price?.recurring?.interval ?? null,
      intervalCount: price?.recurring?.interval_count ?? 1,
      currentPeriodStart: sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at
        ? new Date(sub.canceled_at * 1000)
        : null,
      trialStart: sub.trial_start
        ? new Date(sub.trial_start * 1000)
        : null,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      stripeMetadata: sub.metadata ?? {},
    },
  });
}

async function syncCustomer(customer: Stripe.Customer) {
  const userId = customer.metadata?.userId;
  if (!userId || !customer.email) return;

  await prisma.user.updateMany({
    where: { id: userId, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  });
}
