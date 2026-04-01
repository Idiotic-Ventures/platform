// C3 fix: 5-minute cache
export const revalidate = 300;

import { stripe } from "@/lib/stripe";
import { formatCurrency } from "@/lib/stripe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterTabs } from "@/components/ui/filter-tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "open", label: "Open" },
  { value: "void", label: "Void" },
  { value: "uncollectible", label: "Uncollectible" },
];

async function getInvoices(
  status: string | undefined,
  startingAfter: string | undefined
) {
  // M1 fix: Extract starting_after from searchParams and pass to Stripe
  const invoices = await stripe.invoices.list({
    limit: 25,
    ...(status ? { status: status as any } : {}),
    ...(startingAfter ? { starting_after: startingAfter } : {}),
  });

  return invoices;
}

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: { status?: string; starting_after?: string };
}) {
  const invoices = await getInvoices(
    searchParams.status,
    searchParams.starting_after
  );

  const lastId = invoices.data[invoices.data.length - 1]?.id;

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams();
    if (searchParams.status) p.set("status", searchParams.status);
    Object.entries(params).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    const qs = p.toString();
    return `/admin/invoices${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          All invoice and payment activity
        </p>
      </div>

      {/* M9 fix: Accessible FilterTabs component instead of raw links */}
      <FilterTabs
        options={STATUS_OPTIONS}
        activeValue={searchParams.status ?? ""}
        baseUrl="/admin/invoices"
        paramName="status"
      />

      {/* M11 fix: Horizontal scroll for mobile */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="font-mono">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.data.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>
                  <div>{inv.customer_name ?? "—"}</div>
                  <div className="text-sm text-muted-foreground">
                    {inv.customer_email ?? "—"}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date((inv.created ?? 0) * 1000).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  {formatCurrency(inv.amount_due ?? 0, inv.currency ?? "usd")}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={inv.status ?? "draft"} />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {inv.number ?? inv.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {inv.hosted_invoice_url && (
                    <a
                      href={inv.hosted_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {invoices.data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No invoices found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* M1 fix: Pagination actually passes starting_after to next page */}
      {invoices.has_more && lastId && (
        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <a href={buildUrl({ starting_after: lastId })}>Load more</a>
          </Button>
        </div>
      )}
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  // M6 fix: Use semantic CSS vars, not hardcoded green/yellow
  const variants: Record<string, string> = {
    paid: "bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]",
    open: "bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]",
    void: "bg-muted text-muted-foreground",
    uncollectible: "bg-[hsl(var(--danger-bg))] text-[hsl(var(--danger))]",
    draft: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border-0 ${variants[status] ?? variants.draft}`}
    >
      {status}
    </span>
  );
}
