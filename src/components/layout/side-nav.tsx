'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CreditCard,
  Package,
  FileText,
  Wallet,
  User,
  BarChart3,
  Users,
  Settings,
  TrendingUp,
  FolderOpen,
  Activity,
  Receipt,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const userNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/invoices', icon: FileText, label: 'Invoices' },
  { href: '/billing', icon: Wallet, label: 'Billing' },
  { href: '/account', icon: User, label: 'Account' },
]

const adminNavItems = [
  { href: '/admin', icon: BarChart3, label: 'Overview' },
  { href: '/admin/revenue', icon: TrendingUp, label: 'Revenue' },
  { href: '/admin/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/admin/customers', icon: Users, label: 'Customers' },
  { href: '/admin/cohorts', icon: Activity, label: 'Cohorts' },
  { href: '/admin/invoices', icon: Receipt, label: 'Invoices' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export function SideNav({ role }: { role: 'user' | 'admin' }) {
  const pathname = usePathname()
  const items = role === 'admin' ? adminNavItems : userNavItems

  return (
    <aside className="w-56 flex-shrink-0 border-r bg-background">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary" />
            <span className="text-sm font-semibold">
              {role === 'admin' ? 'Admin Console' : 'IV Platform'}
            </span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {items.map(item => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {role === 'admin' && (
          <div className="border-t px-3 py-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              ← User Portal
            </Link>
          </div>
        )}
        {role === 'user' && (
          <div className="border-t px-3 py-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Admin Console →
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
