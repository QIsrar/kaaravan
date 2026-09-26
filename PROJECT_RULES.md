PROJECT: Kaaravan — a multi-vendor e-commerce marketplace for Pakistan, designed to expand internationally later.

AMAZON IS A FUNCTIONAL BLUEPRINT ONLY. Use it to understand what a marketplace must do (catalog, cart, multi-seller orders, seller tools, admin). NEVER copy its look: no Amazon-style layouts, navy/orange color scheme, header structure, "Prime"-like naming, button styles, icons, or copy text. If a screen starts to resemble Amazon or Daraz, redesign it.

KAARAVAN IDENTITY
- Brand idea: a caravan — a trusted group of traders travelling together. Themes: journey, trust, community, fair deals.
- Palette: deep teal (primary), desert sand and warm gold (surfaces and accents), terracotta (calls to action and sale badges), ink-charcoal text. Define all as CSS variable tokens; no hard-coded colors.
- Visual signature: subtle geometric patterns inspired by Pakistani truck art and tilework, used sparingly (section dividers, empty states, loading states, seller badges) — never busy behind product images.
- Typography: a distinctive display font for headings, a clean readable sans for body, and an Urdu Nastaliq-compatible font ready for the Urdu version.
- Shape language: generous rounded corners, soft shadows, spacious cards; product imagery is always the hero.
- Voice: warm, simple, bilingual-friendly ("Your order has joined the Kaaravan").
- Order tracking is shown as a journey: stops along a route (Placed → Packed → On the way → Arrived), not a plain progress bar.

ROLES: superadmin (platform owner + staff with permissions), seller (vendor business, may have staff later), customer (registered buyer), guest (browses and checks out without an account).

STACK (do not substitute): Next.js 15 App Router + TypeScript strict, Tailwind CSS + shadcn/ui, Supabase (Postgres, Auth, Storage, Edge Functions), Zustand (client state: cart, UI), TanStack Query (server state), Zod (all input validation), React Hook Form. Package manager: pnpm.

NON-NEGOTIABLE RULES
1. Money is stored as integer minor units (paisa) in bigint columns with a currency column (default 'PKR'). Never use float for money.
2. Never trust the client for prices, totals, stock, commission or discounts. Recalculate everything server-side from the database.
3. RLS enabled on EVERY table. Default deny. Sellers only see rows for their own seller_id; customers only their own data; superadmin via a role check function.
4. The Supabase service-role key is used ONLY in server code (route handlers, server actions, edge functions). Never import it in client components. Never prefix it with NEXT_PUBLIC.
5. Every admin and seller mutation writes a row to audit_logs (actor, action, entity, entity_id, before, after, ip, timestamp).
6. Financial history is protected. commissions, seller_ledger, price_history, order_status_history and audit_logs are strictly append-only (corrections are new reversing entries). orders, sub_orders, payments and payouts may change STATUS only through server functions, never their amounts after creation; every status change is logged to audit_logs or order_status_history.
7. Soft deletes (deleted_at) for business entities. updated_at triggers on all tables.
8. All schema changes go through numbered SQL migration files in supabase/migrations. Never edit the DB via dashboard only.
9. Payment gateways and couriers are accessed ONLY through adapter interfaces (lib/payments, lib/couriers). No gateway-specific code outside its adapter.
10. i18n-ready from day one (next-intl): no hard-coded UI strings. English first, Urdu later. RTL-safe layout.
11. Images: compress and convert to WebP on the client before upload; max 1600px. (Free Supabase storage is small.)
12. Server components by default; client components only where interactivity is needed.
13. Every page has loading, empty and error states. Mobile-first responsive.
14. Do not implement anything outside the current phase. If something is needed later, create a TODO with the phase number.
15. At the end of each phase: list files changed, migrations added, manual steps I must do, and anything you were unsure about.
16. Courier and payment gateway credentials live only in environment variables or Supabase Vault, never in database columns.
17. Storage upload paths are built on the server, never chosen by the client.
18. Returns, offers, Qafila joins and guest carts are created only through validated server-side code: lib/services functions called by server actions (web) or /api/v1 routes (mobile). Never by direct client inserts.
19. Mobile-ready architecture: a separate developer will build a React Native (Expo) app on this same Supabase backend.
- All business logic (cart, checkout, orders, returns, offers, reviews) lives in framework-independent functions in lib/services/ that take validated input plus a Supabase client and return typed results. No imports from next/* or React in lib/services, lib/validators, lib/types.
- Web server actions are thin wrappers around these services.
- Every write operation is also exposed as a route handler under /api/v1/ that accepts 'Authorization: Bearer <supabase access token>', validates with the same Zod schema, and calls the same service. Guest cart tokens work both as an httpOnly cookie (web) and an 'X-Guest-Token' header (mobile).
- Read-only catalog data may be read directly from Supabase with RLS (no API route needed).
- Each /api/v1 endpoint is documented in docs/API.md (method, path, auth, request body, response, errors) in the same phase it is built.
- Design tokens (colors, fonts, radii, spacing) are exported from config/theme.ts as plain TypeScript, and the CSS variables are generated from or kept in sync with it.
- Generated database types are regenerated with pnpm gen:types after every migration.