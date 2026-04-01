import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCustomerPortalSession, getOrCreateStripeCustomer } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const returnUrl = `${process.env.NEXTAUTH_URL}/billing`

  const customerId = await getOrCreateStripeCustomer(
    session.user.id,
    session.user.email!,
    session.user.name || undefined
  )

  const url = await createCustomerPortalSession(customerId, returnUrl)

  return NextResponse.json({ url })
}
