// C3 fix: 5-minute cache
export const revalidate = 300;

import { prisma } from "@/lib/prisma";
import { formatCurrency, subscriptionToMonthlyAmount } from "@/lib/stripe";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

// C2 fix: Query DB subscription table instead of N+1 Stripe API calls
async function getCustomers(search?: string) {
  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      subscriptions: {
        where: { status: { in: ["active", "trialing"] } },
        select: {
          amount: true,
          interval: true,
          intervalCount: true,
          productName: true,
          planName: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt,
    stripeCustomerId: u.stripeCustomerId,
    subscriptions: u.subscriptions,
    mrr: u.subscriptions.reduce(
      (sum, s) => sum + subscriptionToMonthlyAmount(s),
      0
    ),
    activeCount: u.subscriptions.length,
  }));
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const customers = await getCustomers(searchParams.q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          {customers.length} customers
        </p>
      </div>

      {/* H7 fix: Use shadcn Input and Button components */}
      <form className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search by name or email..."
            defaultValue={searchParams.q}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* M11 fix: Horizontal scroll wrapper for mobile */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="font-mono">MRR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">{c.name ?? "—"}</div>
                  <div className="text-sm text-muted-foreground">{c.email}</div>
                </TableCell>
                <TableCell>
                  {c.subscriptions.length > 0
                    ? c.subscriptions.map((s) => s.productName).filter(Boolean).join(", ") || "—"
                    : "—"}
                </TableCell>
                <TableCell>
                  {c.subscriptions[0]?.planName ?? "—"}
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  {formatCurrency(c.mrr)}
                </TableCell>
                <TableCell>
                  {c.activeCount > 0 ? (
                    <Badge variant="default" className="bg-[hsl(var(--success-bg))] text-[hsl(var(--success))] border-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">No subs</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
