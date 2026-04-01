// H4 fix: Centralized admin config — env vars processed server-side, never leaked to HTML
// This module must only be imported in server components or API routes

export function getAdminConfig() {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  const stripeMode = stripeKey.startsWith("sk_live") ? "live" : stripeKey ? "test" : "not configured";

  return {
    // Return count only — never return actual email addresses to JSX
    adminEmailCount: adminEmails.length,
    stripeMode,
    webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  };
}

// Check if an email is an admin — safe to call from auth
export function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}
