import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all invoices
  const invoices: Stripe.Invoice[] = []
  let page = await stripe.invoices.list({
    limit: 100,
    expand: ['data.customer'],
  })
  invoices.push(...page.data)
  while (page.has_more) {
    page = await stripe.invoices.list({
      limit: 100,
      starting_after: page.data[page.data.length - 1].id,
      expand: ['data.customer'],
    })
    invoices.push(...page.data)
  }

  const rows = [
    ['Date', 'Customer Name', 'Customer Email', 'Amount', 'Status', 'Invoice ID'].join(','),
    ...invoices.map(inv => {
      const customer = inv.customer as Stripe.Customer | null
      return [
        new Date(inv.created * 1000).toISOString().split('T')[0],
        JSON.stringify(customer?.name || ''),
        JSON.stringify(customer?.email || ''),
        ((inv.amount_paid || inv.total || 0) / 100).toFixed(2),
        inv.status || '',
        inv.id,
      ].join(',')
    }),
  ].join('\n')

  return new NextResponse(rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
