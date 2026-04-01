import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

export function formatDate(date: Date | number | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: Date | number | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`)
}

export function stripeStatusToLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Active',
    past_due: 'Past Due',
    canceled: 'Canceled',
    unpaid: 'Unpaid',
    trialing: 'Trialing',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    paused: 'Paused',
  }
  return map[status] || status
}

export function stripeStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' {
  if (status === 'active') return 'success'
  if (status === 'trialing') return 'default'
  if (status === 'canceled' || status === 'unpaid' || status === 'past_due') return 'destructive'
  return 'secondary'
}
