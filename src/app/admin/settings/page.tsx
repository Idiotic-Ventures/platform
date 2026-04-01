// C3 fix: 5-minute cache
export const revalidate = 300;

// H4 fix: ADMIN_EMAILS moved to server-side config, never rendered directly from env var
import { getAdminConfig } from "@/lib/admin-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  // Config is read server-side and redacted before passing to JSX
  const config = getAdminConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Platform configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">Admin emails</dt>
            <dd className="mt-1">
              {/* H4 fix: Show count and first domain only — never render raw ADMIN_EMAILS in HTML */}
              {config.adminEmailCount > 0
                ? `${config.adminEmailCount} admin account${config.adminEmailCount !== 1 ? "s" : ""} configured`
                : "No admin emails configured"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Auth</dt>
            <dd className="mt-1">Google + Email/Password</dd>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">Mode</dt>
            <dd className="mt-1 font-mono">
              {config.stripeMode}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Webhook</dt>
            <dd className="mt-1">
              {config.webhookConfigured ? (
                <span className="text-[hsl(var(--success))]">Configured</span>
              ) : (
                <span className="text-[hsl(var(--danger))]">
                  Not configured — set STRIPE_WEBHOOK_SECRET
                </span>
              )}
            </dd>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
