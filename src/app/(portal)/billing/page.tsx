import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";

// Server action: open Stripe Customer Portal for billing management
async function openBillingPortal() {
  "use server";
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId || !session?.user?.email) redirect("/login");

  const customerId = await getOrCreateStripeCustomer(
    userId,
    session.user.email,
    session.user.name
  );

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/billing`,
  });

  redirect(portalSession.url);
}

async function getPaymentMethod(stripeCustomerId: string | null) {
  if (!stripeCustomerId) return null;

  const customer = await stripe.customers.retrieve(stripeCustomerId, {
    expand: ["default_source", "invoice_settings.default_payment_method"],
  }) as any;

  const pm =
    customer.invoice_settings?.default_payment_method ??
    customer.default_source;

  if (!pm) return null;

  if (pm.object === "payment_method" && pm.card) {
    return {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    };
  }

  if (pm.object === "card") {
    return {
      brand: pm.brand,
      last4: pm.last4,
      expMonth: pm.exp_month,
      expYear: pm.exp_year,
    };
  }

  return null;
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true },
  });

  const paymentMethod = user?.stripeCustomerId
    ? await getPaymentMethod(user.stripeCustomerId)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your payment method and billing details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethod ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium capitalize">
                  {paymentMethod.brand} •••• {paymentMethod.last4}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No payment method on file.
            </p>
          )}

          <p className="text-sm text-muted-foreground">
            Payment methods are managed securely through Stripe. Click below
            to update your card, billing address, or email.
          </p>

          <form action={openBillingPortal}>
            <Button type="submit" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              {paymentMethod ? "Update payment method" : "Add payment method"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Invoices are sent to{" "}
            <span className="font-medium">{user?.email}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Update your email address in{" "}
            <a href="/account" className="underline">
              Account settings
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
