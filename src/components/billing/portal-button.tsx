'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { ButtonProps } from '@/components/ui/button'

export function PortalButton({ children, ...props }: ButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to open billing portal')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast({ variant: 'destructive', title: 'Error', description: message })
      setLoading(false)
    }
  }

  return (
    <Button {...props} onClick={handleClick} disabled={loading || props.disabled}>
      {loading ? 'Opening…' : children}
    </Button>
  )
}
