# ThuisZoek.nl

Dutch residential and commercial property marketplace MVP built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Clerk, Cloudinary, and Zod.

## Included

- Dutch, responsive public pages for search/filtering, listing detail, agency profiles, pricing, contact, privacy, and terms.
- Clerk sign-in with server-side role lookup in PostgreSQL. Roles are `SEEKER`, `PROVIDER`, and `ADMIN`; a Clerk session by itself never grants provider/admin permissions.
- Provider dashboard for agency setup, draft creation/editing, signed Cloudinary image uploads, moderation submission, listing status, and enquiries.
- Admin dashboard for moderation, reports, user roles, agency plans/verification, contact messages, and audit activity.
- Basic (1), Pro (10), and Expert Pro Max (unlimited) provider plans. Every plan is free. Billing has no checkout, subscription, or payment integration.
- Listing expiry after 30 days, authenticated scheduled expiry, report and enquiry forms, Zod validation, PostgreSQL-backed request throttling, sitemap, robots rules, synthetic seed data, and unit tests.

No third-party listings are scraped or copied. Seed advertisements and sample agency data are clearly fictitious.

## Prerequisites

- Node.js 20.9+ (Node 22 LTS recommended) and npm.
- PostgreSQL 15+ (managed PostgreSQL is recommended).
- Clerk application keys.
- Cloudinary account for image uploads.

## Local setup

1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL`, Clerk keys, and Cloudinary keys. Use a pooled database URL for `DATABASE_URL` where appropriate and a direct PostgreSQL URL for Prisma migrations in `DIRECT_URL`; for local development, Prisma falls back to `DATABASE_URL` if `DIRECT_URL` is omitted. `BILLING_ENABLED` must remain `false`.
3. Generate the Prisma client: `npm run db:generate`.
4. Apply the PostgreSQL migrations: `npm run db:deploy` (or `npm run db:migrate` for local development).
5. To add optional, fictional demo data and a first administrator, set `SEED_ADMIN_CLERK_ID` to the Clerk user ID of a trusted administrator and set `SEED_ADMIN_EMAIL`; then run `npm run db:seed`. Seeding deliberately fails if these values are absent.
6. Start the development server: `npm run dev`.

Create a Clerk user first, then seed with that user's real Clerk ID. Additional provider roles should be granted by an existing administrator in the admin dashboard. Do not seed with a placeholder identity in a live environment.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript checks |
| `npm test` | Focused validation tests |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:deploy` | Apply checked-in migrations |
| `npm run db:seed` | Add explicitly requested synthetic demo data |

## Deployment (Vercel)

1. Create the PostgreSQL database and Clerk and Cloudinary projects. Configure production secrets in Vercel project settings; never commit `.env.local`.
2. Set the production environment variables in `.env.example`, with `NEXT_PUBLIC_SITE_URL` set to the canonical HTTPS origin and `CRON_SECRET` set to a high-entropy random value. Use a pooled `DATABASE_URL` for application runtime and a direct `DIRECT_URL` for migrations. Keep `BILLING_ENABLED=false`.
3. Configure the production build command as `npm run db:deploy && npm run build`, or run migrations as a separately authorized release step before deploying. Use a pooled database URL for application traffic where appropriate.
4. Deploy to Vercel. `vercel.json` schedules a daily expiry job; configure the same `CRON_SECRET` in Vercel so the platform sends `Authorization: Bearer <CRON_SECRET>`.
5. Create the first admin in Clerk and seed its exact user ID/email against the production database. Prefer a one-time controlled seed/release job; remove the seed credentials afterward.
6. Verify Clerk sign-in, PostgreSQL connectivity, Cloudinary signed upload, provider authorization, email/contact operational handling, cron execution, backups, and monitoring before launch.

## Security, operations, and launch checklist

- Provider/admin write routes verify Clerk identity and then look up the role in PostgreSQL; the public account setup endpoint can only create/update the caller's own `SEEKER` record.
- Provider plans are enforced server-side against active/pending listings. Admin role changes, listing moderation and report decisions are recorded in `AuditLog`.
- Rate limits use atomic PostgreSQL upserts, so they work across serverless instances. The deployment must set a trustworthy `x-real-ip` header (and the application origin must not be exposed around the trusted proxy); requests without a valid client IP share one conservative bucket. Expired rate-limit buckets are cleaned by the protected daily cron.
- Expiry runs daily and active public pages filter out expired listings immediately, even before the cron changes their status.
- Enquiries and contact messages are stored in PostgreSQL; this MVP does not yet send email or provide a dedicated contact-message reply workflow. Establish monitored operational handling before taking live enquiries.
- `BILLING_ENABLED` defaults to false. There is no payment provider, checkout, subscription creation, or automatic charge path. The possible future seeker plan (7-day trial, then €14.99/month) is informational only and is not offered or enforced. Do not turn billing on by setting the flag alone; first implement payment consent, checkout, subscription lifecycle/webhooks, cancellation, tax/consumer disclosures, and tests.
- Privacy and terms pages are launch drafts, not legal advice. Complete the operator identity, retention schedule, processor agreements, cookie/privacy review, consumer disclosures, and local legal review before launch.
- Use only listing descriptions and images for which the publishing agency has permission. Moderate user reports and verify listing availability directly with the provider.
- Configure backups, database connection pooling, error monitoring, log retention, incident response, accessibility review, and an email delivery provider before production use.

## Limitations

This is a production-oriented MVP foundation, not a legal/compliance certification or a substitute for a production readiness review. Search is database-backed with basic text, offer, type and price filtering; maps, saved searches, messaging/email delivery, advanced full-text indexing, and paid services are not implemented. Clerk users must be promoted to provider by an admin; there is no self-service provider approval flow. Demo seed listings are fabricated and are for development only.
