import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRevenueTrend } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const days = Math.min(parseInt(searchParams.get('days') || '30'), 365)

  const trend = await getRevenueTrend(days)
  return NextResponse.json({ trend })
}
