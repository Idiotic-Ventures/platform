"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LoginFormProps {
  callbackUrl: string
  error?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  Default: "An error occurred. Please try again.",
}

export function LoginForm({ callbackUrl, error }: LoginFormProps) {
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setFormError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value

    const result = await signIn("credentials", { email, password, callbackUrl, redirect: false })

    if (result?.error) {
      setFormError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.Default)
      setLoading(false)
    } else if (result?.url) {
      window.location.href = result.url
    }
  }

  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : formError

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="rounded-lg bg-[hsl(var(--danger-bg)/0.3)] border border-[hsl(var(--danger-bg))] p-3 text-sm text-[hsl(var(--danger))]">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          name="email"
          placeholder="Email"
          required
          autoComplete="email"
          disabled={loading}
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoComplete="current-password"
          disabled={loading}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <a href="/signup" className="underline hover:text-foreground">Sign up</a>
      </p>
    </div>
  )
}
