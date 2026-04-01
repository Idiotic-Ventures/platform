"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  FolderOpen,
  Users,
  BarChart2,
  FileText,
  Settings,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/projects", label: "Projects", icon: FolderOpen },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/cohorts", label: "Cohorts", icon: BarChart2 },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  // M3 fix: Impersonate hidden from nav until implemented
  // { href: "/admin/impersonate", label: "Impersonate", icon: UserCog },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    // H8 fix: Admin sidebar has distinct dark background to differentiate from user portal
    <aside className="w-64 flex-shrink-0 bg-[hsl(var(--admin-sidebar-bg))] text-[hsl(var(--admin-sidebar-foreground))] flex flex-col min-h-screen">
      {/* H8 fix: Clear "Admin" branding instead of generic logo placeholder */}
      <div className="px-6 py-5 border-b border-[hsl(var(--admin-sidebar-border))]">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Idiotic Ventures
          </span>
          <span className="text-lg font-bold text-white mt-0.5">
            Admin Console
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-[hsl(var(--admin-sidebar-accent))] text-white"
                  : "text-slate-400 hover:bg-[hsl(var(--admin-sidebar-accent))] hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-[hsl(var(--admin-sidebar-border))]">
        <p className="text-xs text-slate-500">platform.idioticventures.com</p>
      </div>
    </aside>
  );
}
