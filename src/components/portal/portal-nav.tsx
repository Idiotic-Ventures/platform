"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Package,
  FileText,
  Wallet,
  User,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/billing", label: "Billing", icon: Wallet },
  { href: "/account", label: "Account", icon: User },
];

export function PortalNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <aside className="w-56 flex-shrink-0 border-r bg-background flex flex-col min-h-screen">
      <div className="px-5 py-5 border-b">
        <span className="font-bold text-lg tracking-tight">IV Platform</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Admin shortcut if user has admin role */}
      {isAdmin && (
        <div className="px-3 py-3 border-t">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Console
          </Link>
        </div>
      )}
    </aside>
  );
}
