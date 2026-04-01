'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

export function AddProjectForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          displayName: formData.get('displayName'),
          description: formData.get('description'),
          stripeProductIds: (formData.get('stripeProductIds') as string)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create project')
      }

      toast({ title: 'Project added', description: 'Project created successfully.' })
      setOpen(false)
      window.location.reload()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast({ variant: 'destructive', title: 'Error', description: message })
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Add Project
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
      <h3 className="text-sm font-medium">New Project</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-xs">Slug</Label>
          <Input id="name" name="name" placeholder="zhone" required className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="displayName" className="text-xs">Display Name</Label>
          <Input id="displayName" name="displayName" placeholder="Zhone" required className="h-8 text-sm" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="description" className="text-xs">Description</Label>
        <Input id="description" name="description" placeholder="Brief description" className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="stripeProductIds" className="text-xs">Stripe Product IDs (comma-separated)</Label>
        <Input
          id="stripeProductIds"
          name="stripeProductIds"
          placeholder="prod_xxx, prod_yyy"
          className="h-8 text-sm font-mono"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Saving…' : 'Save Project'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
