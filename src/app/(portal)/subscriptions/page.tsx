import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, formatCurrency } from "@/lib/stripe";
import { StatusBadge } from "@/components/portal/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { redirect } from "next/navigation";

async function getUserSubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// Server action: redirect to Stripe Customer Portal for subscription management
async function manageSubscription(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    redirect("/billing");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/subscriptions`,
  });

  redirect(portalSession.url);
}

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const subs = await getUserSubscriptions(userId);

  const active = subs.filter((s) =>
    ["active", "trialing", "past_due"].includes(s.status)
  );
  const inactive = subs.filter((s) =>
    ["canceled", "unpaid", "incomplete"].includes(s.status)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your active subscriptions
          </p>
        </div>
        {/* Manage via Stripe Customer Portal */}
        <form action={manageSubscription}>
          <Button type="submit" variant="outline">
            Open Billing Portal
          </Button>
        </form>
      </div>

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Active
          </h2>
          <div className="space-y-3">
            {active.map((sub) => (
              <Card key={sub.id}>
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {sub.productName ?? "Subscription"}
                    </CardTitle>
                    <StatusBadge status={sub.status} />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Plan</p>
                      <p className="font-medium">{sub.planName ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium font-mono tabular-nums">
                        {formatCurrency(sub.amount, sub.currency)}/
                        {sub.interval === "year" ? "yr" : "mo"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {sub.cancelAtPeriodEnd ? "Ends" : "Renews"}
                      </p>
                      <p className="font-medium">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    {sub.status === "trialing" && sub.trialEnd && (
                      <div>
                        <p className="text-muted-foreground">Trial ends</p>
                        <p className="font-medium">
                          {new Date(sub.trialEnd).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {sub.cancelAtPeriodEnd && (
                    <p className="mt-3 text-sm text-[hsl(var(--warning))]">
                      Cancels at end of period. Use Billing Portal to reactivate.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {inactive.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Inactive
          </h2>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Canceled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactive.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>{sub.productName ?? "—"}</TableCell>
                    <TableCell>{sub.planName ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.canceledAt
                        ? new Date(sub.canceledAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {subs.length === 0 && (
        <div className="py-12 text-center space-y-3">
          <p className="text-muted-foreground">No subscriptions yet</p>
          <Button asChild>
            <a href="/products">Browse products</a>
          </Button>
        </div>
      )}
    </div>
  );
}
