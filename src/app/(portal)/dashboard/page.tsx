import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/stripe";
import { StatusBadge } from "@/components/portal/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: { in: ["active", "trialing", "past_due"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return user;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const user = userId ? await getUserData(userId) : null;
  const activeSubs = user?.subscriptions ?? [];

  // Separate alerts: payment failures, expiring trials
  const failedSubs = activeSubs.filter((s) => s.status === "past_due");
  const trialSubs = activeSubs.filter((s) => {
    if (s.status !== "trialing" || !s.trialEnd) return false;
    const daysLeft = Math.floor(
      (new Date(s.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 7;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Your subscription overview
        </p>
      </div>

      {/* Alert banners */}
      {failedSubs.length > 0 && (
        <div className="rounded-lg border border-[hsl(var(--danger-bg))] bg-[hsl(var(--danger-bg)/0.3)] p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-[hsl(var(--danger))] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Payment failed</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {failedSubs.length} subscription{failedSubs.length !== 1 ? "s" : ""} need payment attention.{" "}
              <Link href="/billing" className="underline">
                Update billing
              </Link>
            </p>
          </div>
        </div>
      )}

      {trialSubs.map((sub) => {
        const daysLeft = Math.floor(
          (new Date(sub.trialEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return (
          <div
            key={sub.id}
            className="rounded-lg border border-[hsl(var(--warning-bg))] bg-[hsl(var(--warning-bg)/0.3)] p-4 flex gap-3"
          >
            <Clock className="h-5 w-5 text-[hsl(var(--warning))] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">
                Trial ending in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your {sub.productName ?? "subscription"} trial ends soon.{" "}
                <Link href="/subscriptions" className="underline">
                  Manage subscription
                </Link>
              </p>
            </div>
          </div>
        );
      })}

      {/* Subscription cards */}
      {activeSubs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {activeSubs.map((sub) => (
            <Card key={sub.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {sub.productName ?? "Subscription"}
                  </CardTitle>
                  <StatusBadge status={sub.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
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
                  {sub.currentPeriodEnd && (
                    <div>
                      <p className="text-muted-foreground">
                        {sub.cancelAtPeriodEnd ? "Ends" : "Renews"}
                      </p>
                      <p className="font-medium">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/subscriptions">
                    Manage
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">No active subscriptions</p>
            <Button asChild>
              <Link href="/products">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
