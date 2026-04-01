import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, formatCurrency } from "@/lib/stripe";
import { StatusBadge } from "@/components/portal/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";

async function getUserInvoices(
  stripeCustomerId: string,
  startingAfter?: string
) {
  return stripe.invoices.list({
    customer: stripeCustomerId,
    limit: 20,
    ...(startingAfter ? { starting_after: startingAfter } : {}),
  });
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { starting_after?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        </div>
        <div className="py-12 text-center text-muted-foreground">
          <p>No billing history yet.</p>
          <p className="text-sm mt-1">Invoices appear here after your first payment.</p>
        </div>
      </div>
    );
  }

  const invoices = await getUserInvoices(
    user.stripeCustomerId,
    searchParams.starting_after
  );

  const lastId = invoices.data[invoices.data.length - 1]?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Your billing history
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="font-mono">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.data.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="text-sm">
                  {new Date((inv.created ?? 0) * 1000).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {inv.lines.data[0]?.description ??
                      inv.description ??
                      "Invoice"}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {inv.number ?? "—"}
                  </div>
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  {formatCurrency(inv.amount_due ?? 0, inv.currency ?? "usd")}
                </TableCell>
                <TableCell>
                  <StatusBadge status={inv.status ?? "draft"} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {inv.invoice_pdf && (
                      <a
                        href={inv.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        aria-label="Download PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    )}
                    {inv.hosted_invoice_url && (
                      <a
                        href={inv.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        aria-label="View invoice"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {invoices.data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No invoices yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {invoices.has_more && lastId && (
        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <a href={`/invoices?starting_after=${lastId}`}>Load more</a>
          </Button>
        </div>
      )}
    </div>
  );
}
