// LOW fix: Remove competing h1 from login page
// LOW fix: Add callbackUrl validation to prevent open redirect

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string; deleted?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session) {
    // Validate callbackUrl — must be a relative path starting with /
    const callbackUrl = searchParams.callbackUrl;
    const safeUrl =
      callbackUrl && /^\/[^/]/.test(callbackUrl) ? callbackUrl : "/dashboard";
    redirect(safeUrl);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm space-y-6">
        {/* LOW fix: Single wordmark instead of competing h1s */}
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Idiotic Ventures
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Sign in to Platform
          </h1>
        </div>

        {searchParams.deleted && (
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground text-center">
            Your account has been deleted.
          </div>
        )}

        <LoginForm
          callbackUrl={
            searchParams.callbackUrl &&
            /^\/[^/]/.test(searchParams.callbackUrl)
              ? searchParams.callbackUrl
              : "/dashboard"
          }
          error={searchParams.error}
        />
      </div>
    </div>
  );
}
