'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { ButtonProps } from '@/components/ui/button'

interface CheckoutButtonProps extends ButtonProps {
  priceId: string
}

export function CheckoutButton({ priceId, children, ...props }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast({ variant: 'destructive', title: 'Error', description: message })
      setLoading(false)
    }
  }

  return (
    <Button {...props} onClick={handleClick} disabled={loading || props.disabled}>
      {loading ? 'Loading…' : children}
    </Button>
  )
}
