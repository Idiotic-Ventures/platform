import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Server action: update display name
async function updateProfile(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 1 || name.length > 100) return;

  await prisma.user.update({
    where: { id: userId },
    data: { name },
  });

  revalidatePath("/account");
}

// Server action: delete account
async function deleteAccount(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const confirm = formData.get("confirm") as string;
  if (confirm !== "DELETE") return;

  // Soft-delete: remove PII, keep subscription records for billing
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: "[Deleted]",
      email: `deleted-${userId}@deleted.invalid`,
      passwordHash: null,
      image: null,
    },
  });

  redirect("/login?deleted=1");
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      accounts: { select: { provider: true } },
    },
  });

  const linkedProviders = user?.accounts.map((a) => a.provider) ?? [];
  const hasPassword = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  }).then((u) => Boolean(u?.passwordHash));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and account settings
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Display name
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={user?.name ?? ""}
                placeholder="Your name"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={user?.email ?? ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email changes require contacting support.
              </p>
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Linked accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="text-sm font-medium">Google</p>
              <p className="text-xs text-muted-foreground">Sign in with Google</p>
            </div>
            {linkedProviders.includes("google") ? (
              <span className="text-xs text-[hsl(var(--success))] font-medium">
                Connected
              </span>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <a href="/api/auth/signin/google">Connect</a>
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-muted-foreground">Email + password login</p>
            </div>
            {hasPassword ? (
              <span className="text-xs text-[hsl(var(--success))] font-medium">
                Set
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Not set</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-[hsl(var(--danger-bg))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--danger))]">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting your account removes your profile data. Active
            subscriptions must be canceled first via{" "}
            <a href="/subscriptions" className="underline">
              Subscriptions
            </a>
            .
          </p>
          <form action={deleteAccount} className="space-y-3">
            <Input
              name="confirm"
              placeholder='Type "DELETE" to confirm'
              className="max-w-xs"
            />
            <Button type="submit" variant="destructive" size="sm">
              Delete account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
