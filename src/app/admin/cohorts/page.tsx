// C3 fix: 5-minute cache
export const revalidate = 300;

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// C2 fix: Query DB subscription table instead of sequential Stripe API calls per user
// M4 fix: Build proper month-by-month retention matrix
async function getCohortData() {
  // Get all subscriptions with creation dates
  const subs = await prisma.subscription.findMany({
    select: {
      stripeSubscriptionId: true,
      stripeCustomerId: true,
      status: true,
      createdAt: true,
      canceledAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group subscriptions by signup month (cohort)
  const cohortMap = new Map<
    string,
    { total: number; activeByMonth: Map<number, number> }
  >();

  const now = new Date();

  for (const sub of subs) {
    const cohortKey = `${sub.createdAt.getFullYear()}-${String(sub.createdAt.getMonth() + 1).padStart(2, "0")}`;

    if (!cohortMap.has(cohortKey)) {
      cohortMap.set(cohortKey, { total: 0, activeByMonth: new Map() });
    }
    const cohort = cohortMap.get(cohortKey)!;
    cohort.total++;

    // For each month since cohort signup, check if this sub was active
    const cohortDate = new Date(sub.createdAt);
    const monthsSinceCohort = Math.floor(
      (now.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    for (let m = 0; m <= Math.min(monthsSinceCohort, 11); m++) {
      const checkDate = new Date(cohortDate);
      checkDate.setMonth(checkDate.getMonth() + m);

      // Sub was active at this month if:
      // - Not canceled, or canceled after this check date
      const wasActive =
        !sub.canceledAt || new Date(sub.canceledAt) > checkDate;

      if (wasActive) {
        cohort.activeByMonth.set(m, (cohort.activeByMonth.get(m) ?? 0) + 1);
      }
    }
  }

  // Convert to display format — last 12 cohorts
  const sortedCohorts = Array.from(cohortMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12);

  return sortedCohorts.map(([month, data]) => ({
    month,
    total: data.total,
    // M4 fix: Full month-by-month retention curve (not just 2 data points)
    retention: Array.from({ length: 12 }, (_, m) => {
      const active = data.activeByMonth.get(m);
      if (active === undefined) return null;
      return Math.round((active / data.total) * 100);
    }),
  }));
}

export default async function CohortsPage() {
  const cohorts = await getCohortData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cohort Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Month-over-month retention by signup cohort
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retention Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          {/* M11 fix: Horizontal scroll for mobile */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">
                    Cohort
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                    Size
                  </th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th
                      key={i}
                      className="text-right py-2 px-2 font-medium text-muted-foreground"
                    >
                      M{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort) => (
                  <tr key={cohort.month} className="border-t">
                    <td className="py-2 pr-4 font-medium whitespace-nowrap">
                      {cohort.month}
                    </td>
                    {/* M5 fix: font-mono on numeric values */}
                    <td className="text-right py-2 px-2 font-mono tabular-nums text-muted-foreground">
                      {cohort.total}
                    </td>
                    {cohort.retention.map((pct, i) => (
                      <td
                        key={i}
                        className="text-right py-2 px-2 font-mono tabular-nums"
                        style={{
                          // M6 fix: Use opacity-based background derived from CSS var
                          backgroundColor:
                            pct !== null
                              ? `hsl(var(--success) / ${Math.max(0.05, pct / 100 * 0.4)})`
                              : undefined,
                          color: pct !== null ? undefined : "transparent",
                        }}
                      >
                        {pct !== null ? `${pct}%` : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
                {cohorts.length === 0 && (
                  <tr>
                    <td
                      colSpan={14}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No cohort data yet. Subscriptions will appear here once
                      webhook sync runs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
