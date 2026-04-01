"use client";

import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

// M10 fix: Left side shows breadcrumb/page title instead of empty div
function useBreadcrumb(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  // Map path segments to human labels
  const LABELS: Record<string, string> = {
    admin: "Admin",
    revenue: "Revenue",
    projects: "Projects",
    customers: "Customers",
    cohorts: "Cohorts",
    invoices: "Invoices",
    settings: "Settings",
    impersonate: "Impersonate",
    dashboard: "Dashboard",
    subscriptions: "Subscriptions",
    products: "Products",
    billing: "Billing",
    account: "Account",
  };

  return segments.map((s) => LABELS[s] ?? s).join(" › ");
}

export function TopBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const breadcrumb = useBreadcrumb(pathname);

  return (
    <header className="h-14 border-b bg-background flex items-center px-6 gap-4">
      {/* M10 fix: Left side shows current page breadcrumb */}
      <div className="flex-1">
        <span className="text-sm text-muted-foreground">{breadcrumb}</span>
      </div>

      {/* Right side: user info + sign out */}
      <div className="flex items-center gap-3">
        {session?.user && (
          <>
            <div className="flex items-center gap-2 text-sm">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  className="h-7 w-7 rounded-full"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
              <span className="text-muted-foreground hidden sm:block">
                {session.user.name ?? session.user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
