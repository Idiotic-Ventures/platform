// C3 fix: 5-minute cache
export const revalidate = 300;

// M3 fix: Impersonate page removed from admin nav until properly implemented.
// This page is intentionally a stub with a clear explanation.
// Real implementation requires: signed session swap token, audit log, expiry.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function ImpersonatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Impersonate User</h1>
        <p className="text-sm text-muted-foreground">
          View the platform as a specific customer
        </p>
      </div>

      <Card className="border-[hsl(var(--warning-bg))] bg-[hsl(var(--warning-bg)/0.3)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--warning))]">
            <AlertTriangle className="h-5 w-5" />
            Not yet implemented
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <p>
            Impersonation requires a signed session swap token with an audit
            trail and time-limited expiry. This is not trivially safe to ship
            without those controls.
          </p>
          <p className="font-medium">For now, use Stripe Dashboard to:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>View customer billing history</li>
            <li>Issue refunds</li>
            <li>Cancel or modify subscriptions</li>
          </ul>
          <p className="text-muted-foreground text-xs mt-4">
            TODO: Implement signed impersonation token with 1-hour expiry and
            admin audit log before enabling this feature.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
