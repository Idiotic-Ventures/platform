// C3 fix: 5-minute cache
export const revalidate = 300;

import { prisma } from "@/lib/prisma";
import { formatCurrency, subscriptionToMonthlyAmount } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// M2 fix: Label chart accurately — show what data actually represents
async function getRevenueData() {
  const activeSubs = await prisma.subscription.findMany({
    where: { status: { in: ["active", "trialing"] } },
    select: {
      amount: true,
      interval: true,
      intervalCount: true,
      productId: true,
      productName: true,
      planName: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const mrr = activeSubs.reduce(
    (sum, s) => sum + subscriptionToMonthlyAmount(s),
    0
  );

  // Group by product
  const byProduct = new Map<string, { name: string; mrr: number; count: number }>();
  for (const sub of activeSubs) {
    const key = sub.productId ?? "other";
    if (!byProduct.has(key)) {
      byProduct.set(key, { name: sub.productName ?? "Other", mrr: 0, count: 0 });
    }
    const p = byProduct.get(key)!;
    p.mrr += subscriptionToMonthlyAmount(sub);
    p.count++;
  }

  // Group by plan
  const byPlan = new Map<string, { name: string; mrr: number; count: number }>();
  for (const sub of activeSubs) {
    const key = sub.planName ?? "Other";
    if (!byPlan.has(key)) {
      byPlan.set(key, { name: key, mrr: 0, count: 0 });
    }
    const p = byPlan.get(key)!;
    p.mrr += subscriptionToMonthlyAmount(sub);
    p.count++;
  }

  return {
    mrr,
    arr: mrr * 12,
    byProduct: Array.from(byProduct.values()).sort((a, b) => b.mrr - a.mrr),
    byPlan: Array.from(byPlan.values()).sort((a, b) => b.mrr - a.mrr),
    totalSubs: activeSubs.length,
  };
}

export default async function RevenuePage() {
  const data = await getRevenueData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revenue</h1>
        <p className="text-sm text-muted-foreground">
          Current MRR breakdown across products and plans
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tabular-nums">
              {formatCurrency(data.mrr)}
            </div>
            <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tabular-nums">
              {formatCurrency(data.arr)}
            </div>
            <p className="text-xs text-muted-foreground">Annualized run rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Subs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tabular-nums">
              {data.totalSubs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Active + trialing</p>
          </CardContent>
        </Card>
      </div>

      {/* M2 fix: Accurate label — this is MRR breakdown by product, not revenue trend */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>MRR by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Product</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Subs</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">MRR</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byProduct.map((p) => (
                    <tr key={p.name} className="border-b last:border-0">
                      <td className="py-2">{p.name}</td>
                      <td className="text-right py-2 font-mono tabular-nums">{p.count}</td>
                      <td className="text-right py-2 font-mono tabular-nums">
                        {formatCurrency(p.mrr)}
                      </td>
                      <td className="text-right py-2 font-mono tabular-nums text-muted-foreground">
                        {data.mrr > 0 ? `${Math.round((p.mrr / data.mrr) * 100)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                  {data.byProduct.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        No revenue data yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MRR by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Plan</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Subs</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">MRR</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byPlan.map((p) => (
                    <tr key={p.name} className="border-b last:border-0">
                      <td className="py-2">{p.name}</td>
                      <td className="text-right py-2 font-mono tabular-nums">{p.count}</td>
                      <td className="text-right py-2 font-mono tabular-nums">
                        {formatCurrency(p.mrr)}
                      </td>
                      <td className="text-right py-2 font-mono tabular-nums text-muted-foreground">
                        {data.mrr > 0 ? `${Math.round((p.mrr / data.mrr) * 100)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                  {data.byPlan.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        No plan data yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        * Revenue data is sourced from the subscription DB (synced via Stripe webhooks).
        Historical trend charts will be available once sufficient time-series data accumulates.
      </p>
    </div>
  );
}
