// C3 fix: 5-minute revalidation for admin pages
export const revalidate = 300;

import { prisma } from "@/lib/prisma";
import { subscriptionToMonthlyAmount, formatCurrency } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, ArrowRight } from "lucide-react";

async function getAdminMetrics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // C2 fix: Query DB (Subscription model) instead of hitting Stripe API directly
  const [activeSubs, newSubs, churnedSubs] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: { in: ["active", "trialing"] } },
      select: { amount: true, interval: true, intervalCount: true, productName: true },
    }),
    prisma.subscription.findMany({
      where: {
        status: { in: ["active", "trialing"] },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { amount: true, interval: true, intervalCount: true },
    }),
    prisma.subscription.findMany({
      where: {
        status: "canceled",
        canceledAt: { gte: thirtyDaysAgo },
      },
      select: { amount: true, interval: true, intervalCount: true },
    }),
  ]);

  const mrr = activeSubs.reduce(
    (sum, s) => sum + subscriptionToMonthlyAmount(s),
    0
  );
  const arr = mrr * 12;

  // H1 fix: Calculate actual MRR delta, not subscriber count delta
  const newMRR = newSubs.reduce(
    (sum, s) => sum + subscriptionToMonthlyAmount(s),
    0
  );
  const churnedMRR = churnedSubs.reduce(
    (sum, s) => sum + subscriptionToMonthlyAmount(s),
    0
  );
  const netMRRChange = newMRR - churnedMRR;

  return {
    mrr,
    arr,
    activeCount: activeSubs.length,
    newCount: newSubs.length,
    churnedCount: churnedSubs.length,
    netMRRChange,
  };
}

export default async function AdminPage() {
  const metrics = await getAdminMetrics();

  const cards = [
    {
      title: "MRR",
      value: formatCurrency(metrics.mrr),
      icon: DollarSign,
      description: "Monthly recurring revenue",
    },
    {
      title: "ARR",
      value: formatCurrency(metrics.arr),
      icon: TrendingUp,
      description: "Annual recurring revenue",
    },
    {
      title: "Active Subscribers",
      value: metrics.activeCount.toLocaleString(),
      icon: Users,
      description: "Active + trialing subscriptions",
    },
    {
      title: "New Subscribers (30d)",
      value: `+${metrics.newCount}`,
      icon: Activity,
      description: "New in the last 30 days",
    },
    {
      title: "Churned (30d)",
      value: metrics.churnedCount.toString(),
      icon: TrendingDown,
      description: "Canceled in the last 30 days",
    },
    {
      // H1 fix: Label says "Net MRR Change" and shows actual dollar delta
      title: "Net MRR Change (30d)",
      value: `${metrics.netMRRChange >= 0 ? "+" : ""}${formatCurrency(metrics.netMRRChange)}`,
      icon: ArrowRight,
      description: "New MRR minus churned MRR",
      // M6 fix: Use semantic CSS vars instead of hardcoded green/red
      valueClassName:
        metrics.netMRRChange >= 0
          ? "text-[hsl(var(--success))]"
          : "text-[hsl(var(--danger))]",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Business metrics across all IV products
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold font-mono tabular-nums ${card.valueClassName ?? ""}`}
              >
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
