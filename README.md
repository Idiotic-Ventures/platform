# platform.idioticventures.com

The unified platform hub for Idiotic Ventures — user portal + admin console.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in all values. Required:
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `https://platform.idioticventures.com` (or `http://localhost:3000` for dev)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `DATABASE_URL` — Postgres connection string (match Zhone's Neon/Supabase instance or new one)
- `STRIPE_SECRET_KEY` — from Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` — from Stripe webhook endpoint config
- `ADMIN_EMAILS` — comma-separated emails that get ADMIN role on first login

### 3. Set up database

```bash
npm run db:generate  # generate Prisma client
npm run db:push      # push schema to DB (dev/staging)
# or for production migrations:
npm run db:migrate
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

### User Portal
| Route | Description |
|-------|-------------|
| `/` | Redirect to `/dashboard` or `/login` |
| `/login` | Google sign-in + email/password |
| `/dashboard` | Subscription overview |
| `/subscriptions` | Manage all subscriptions |
| `/products` | Browse + subscribe to IV products |
| `/invoices` | Invoice history + PDF download |
| `/billing` | Payment method management |
| `/account` | Profile + linked integrations |

### Admin Console
| Route | Description |
|-------|-------------|
| `/admin` | Overview: MRR, ARR, churn, active subs |
| `/admin/revenue` | Revenue trends + plan breakdown |
| `/admin/projects` | Per-project MRR breakdown + churn |
| `/admin/customers` | Customer list + search |
| `/admin/cohorts` | Retention matrix |
| `/admin/invoices` | Full invoice log + CSV export |
| `/admin/settings` | Project registry + Stripe config |
| `/admin/impersonate` | View customer details |

### API Routes
| Route | Description |
|-------|-------------|
| `/api/auth/[...nextauth]` | NextAuth handler |
| `/api/stripe/portal` | Create Stripe Customer Portal session |
| `/api/stripe/checkout` | Create Stripe Checkout session |
| `/api/stripe/webhook` | Stripe webhook receiver |
| `/api/admin/revenue-trend` | Revenue trend data (JSON) |
| `/api/admin/invoices/export` | Invoice CSV export |
| `/api/admin/projects` | Project CRUD |

## Stripe Setup

### Webhook
Create a webhook in Stripe Dashboard pointing to:
```
https://platform.idioticventures.com/api/stripe/webhook
```

Enable events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.created`
- `invoice.paid`
- `invoice.payment_failed`

### Customer Portal
Enable Stripe Customer Portal in Dashboard → Settings → Billing → Customer portal.
Configure what customers can do (cancel, update payment, etc.).

### Project Registry
After deploying, go to `/admin/settings` and add your Stripe product IDs:
- Zlack: `prod_xxx`
- Zhone: `prod_yyy`

## Deploy to Vercel

```bash
vercel --prod
```

Or connect the repo to Vercel and set env vars in the dashboard.

Custom domain: `platform.idioticventures.com` → add in Vercel project settings.

## What's wired to real data

✅ **Live Stripe data:**
- MRR / ARR calculation from active subscriptions
- Active subscriber count
- New/churned subscribers (30d)
- Per-project MRR breakdown
- Customer subscription listings
- Invoice history + PDF links
- Payment method display
- Revenue trend charts
- Plan breakdown table
- Stripe Customer Portal passthrough
- Stripe Checkout for new subscriptions
- Webhook event processing

✅ **Live DB data:**
- User accounts (Postgres via Prisma)
- Auth sessions (NextAuth + Prisma adapter)
- Project registry
- Stripe event audit log

## Needs env vars / manual steps

- Google OAuth: add `platform.idioticventures.com` as authorized redirect URI in Google Cloud Console
- Stripe webhook: register endpoint in Stripe Dashboard, copy `STRIPE_WEBHOOK_SECRET`
- Stripe Customer Portal: configure in Stripe Dashboard before billing flows work
- Admin emails: set `ADMIN_EMAILS` to grant admin access
- Project registry: add Stripe product IDs via `/admin/settings` after first deploy
