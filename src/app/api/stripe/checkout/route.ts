import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  priceId: z.string(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { priceId, successUrl, cancelUrl } = parsed.data

  const customerId = await getOrCreateStripeCustomer(
    session.user.id,
    session.user.email!,
    session.user.name || undefined
  )

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl || `${process.env.NEXTAUTH_URL}/dashboard?success=1`,
    cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/products`,
    metadata: {
      userId: session.user.id,
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
