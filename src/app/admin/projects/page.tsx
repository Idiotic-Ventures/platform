// C3 fix: 5-minute cache
export const revalidate = 300;

import { prisma } from "@/lib/prisma";
import { formatCurrency, subscriptionToMonthlyAmount } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// H2 fix: Proper churn rate — churned/active_at_period_start, count distinct subs not items
async function getProjectMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [activeSubs, newSubs, churnedSubs] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: { in: ["active", "trialing"] } },
      select: {
        amount: true,
        interval: true,
        intervalCount: true,
        productId: true,
        productName: true,
        planName: true,
        status: true,
      },
    }),
    // Subs created in last 30d (new)
    prisma.subscription.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { productId: true, productName: true },
    }),
    // Subs canceled in last 30d (churned)
    prisma.subscription.findMany({
      where: {
        status: "canceled",
        canceledAt: { gte: thirtyDaysAgo },
      },
      select: { productId: true, productName: true },
    }),
  ]);

  // Group by product
  const productMap = new Map<
    string,
    {
      name: string;
      activeSubs: typeof activeSubs;
      newCount: number;
      churnedCount: number;
    }
  >();

  for (const sub of activeSubs) {
    const key = sub.productId ?? "unknown";
    if (!productMap.has(key)) {
      productMap.set(key, {
        name: sub.productName ?? "Unknown Product",
        activeSubs: [],
        newCount: 0,
        churnedCount: 0,
      });
    }
    productMap.get(key)!.activeSubs.push(sub);
  }

  for (const sub of newSubs) {
    const key = sub.productId ?? "unknown";
    if (!productMap.has(key)) {
      productMap.set(key, {
        name: sub.productName ?? "Unknown Product",
        activeSubs: [],
        newCount: 0,
        churnedCount: 0,
      });
    }
    productMap.get(key)!.newCount++;
  }

  for (const sub of churnedSubs) {
    const key = sub.productId ?? "unknown";
    if (!productMap.has(key)) continue;
    productMap.get(key)!.churnedCount++;
  }

  return Array.from(productMap.entries()).map(([productId, data]) => {
    const mrr = data.activeSubs.reduce(
      (sum, s) => sum + subscriptionToMonthlyAmount(s),
      0
    );
    const activeCount = data.activeSubs.length;
    // H2 fix: Correct denominator — active at period start = active now + churned in period
    const activeAtStart = activeCount + data.churnedCount;
    const churnRate =
      activeAtStart > 0
        ? Math.round((data.churnedCount / activeAtStart) * 100 * 10) / 10
        : 0;
    const arpu = activeCount > 0 ? mrr / activeCount : 0;

    return {
      productId,
      name: data.name,
      mrr,
      activeCount,
      newCount: data.newCount,
      churnedCount: data.churnedCount,
      churnRate,
      arpu,
    };
  });
}

export default async function ProjectsPage() {
  const projects = await getProjectMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Per-product breakdown across all IV products
        </p>
      </div>

      <div className="space-y-6">
        {projects.map((project) => (
          <Card key={project.productId}>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Metric label="MRR" value={formatCurrency(project.mrr)} mono />
                <Metric
                  label="Active Subs"
                  value={project.activeCount.toLocaleString()}
                  mono
                />
                <Metric
                  label="ARPU"
                  value={formatCurrency(project.arpu)}
                  mono
                />
                <Metric
                  label="Churn Rate (30d)"
                  value={`${project.churnRate}%`}
                  mono
                  // M6 fix: Semantic color via CSS var
                  className={
                    project.churnRate > 10
                      ? "text-[hsl(var(--danger))]"
                      : project.churnRate > 5
                      ? "text-[hsl(var(--warning))]"
                      : "text-[hsl(var(--success))]"
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No project data yet. Subscriptions appear here once webhook sync
            runs.
          </p>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  mono = false,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-semibold ${mono ? "font-mono tabular-nums" : ""} ${className}`}>
        {value}
      </p>
    </div>
  );
}
