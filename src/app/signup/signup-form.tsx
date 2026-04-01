"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create account");
      setLoading(false);
      return;
    }

    // Auto sign-in after signup
    const signInResult = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (signInResult?.url) {
      router.push(signInResult.url);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-[hsl(var(--danger-bg)/0.3)] border border-[hsl(var(--danger-bg))] p-3 text-sm text-[hsl(var(--danger))]">
          {error}
        </div>
      )}

      <Input
        name="name"
        type="text"
        placeholder="Full name"
        required
        minLength={1}
        maxLength={100}
        disabled={loading}
      />
      <Input
        name="email"
        type="email"
        placeholder="Email"
        required
        autoComplete="email"
        disabled={loading}
      />
      <Input
        name="password"
        type="password"
        placeholder="Password (min 8 characters)"
        required
        minLength={8}
        autoComplete="new-password"
        disabled={loading}
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/login" className="underline hover:text-foreground">
          Sign in
        </a>
      </p>
    </form>
  );
}
