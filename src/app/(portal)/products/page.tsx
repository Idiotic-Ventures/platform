import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, formatCurrency, getOrCreateStripeCustomer } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

// Server action: initiate Stripe Checkout for a price
async function startCheckout(formData: FormData) {
  "use server";
  const priceId = formData.get("priceId") as string;
  if (!priceId) return;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId || !session?.user?.email) redirect("/login");

  const customerId = await getOrCreateStripeCustomer(
    userId,
    session.user.email,
    session.user.name
  );

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/subscriptions?checkout=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/products`,
    metadata: { userId },
  });

  redirect(checkout.url!);
}

async function getProductsWithPrices(userId: string) {
  // Get user's active subscriptions to mark "currently subscribed"
  const userSubs = await prisma.subscription.findMany({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
    },
    select: { priceId: true, productId: true },
  });

  const subscribedProductIds = new Set(
    userSubs.map((s) => s.productId).filter(Boolean)
  );
  const subscribedPriceIds = new Set(
    userSubs.map((s) => s.priceId).filter(Boolean)
  );

  // Fetch products from Stripe
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
    limit: 20,
  });

  // Fetch prices for each product
  const productsWithPrices = await Promise.all(
    products.data.map(async (product) => {
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        type: "recurring",
      });

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.images[0] ?? null,
        isSubscribed: subscribedProductIds.has(product.id),
        prices: prices.data.map((price) => ({
          id: price.id,
          amount: price.unit_amount ?? 0,
          currency: price.currency,
          interval: price.recurring?.interval ?? "month",
          intervalCount: price.recurring?.interval_count ?? 1,
          nickname: price.nickname,
          isCurrentPlan: subscribedPriceIds.has(price.id),
        })),
      };
    })
  );

  return productsWithPrices;
}

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const products = await getProductsWithPrices(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">
          Browse and add Idiotic Ventures products to your account
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {products.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                {product.isSubscribed && (
                  <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    Subscribed
                  </Badge>
                )}
              </div>
              {product.description && (
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end space-y-3">
              {product.prices.map((price) => (
                <div
                  key={price.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {price.nickname ?? "Standard"}
                    </p>
                    <p className="text-sm font-mono tabular-nums text-muted-foreground">
                      {formatCurrency(price.amount, price.currency)}/
                      {price.interval === "year" ? "yr" : "mo"}
                    </p>
                  </div>
                  {price.isCurrentPlan ? (
                    <Badge variant="outline">Current plan</Badge>
                  ) : (
                    <form action={startCheckout}>
                      <input type="hidden" name="priceId" value={price.id} />
                      <Button size="sm" type="submit">
                        {product.isSubscribed ? "Switch plan" : "Subscribe"}
                      </Button>
                    </form>
                  )}
                </div>
              ))}
              {product.prices.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No plans available — contact support
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && (
          <div className="col-span-2 py-12 text-center text-muted-foreground">
            No products available yet.
          </div>
        )}
      </div>
    </div>
  );
}
