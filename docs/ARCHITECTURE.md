# Kaaravan Platform Architecture Documentation

## 1. System Overview & Core Identity

**Kaaravan** is a multi-vendor e-commerce marketplace built specifically for Pakistan, engineered with modular foundations for future international expansion.

Unlike traditional platforms that replicate Amazon or Daraz, Kaaravan follows a unique brand philosophy inspired by historical trade caravans:
- **Brand Idea**: A caravan — a trusted alliance of merchants, artisans, and travellers moving together.
- **Themes**: Journey, trust, community, and fair deals.
- **Visual Identity**: Deep teal (`primary`), desert sand & warm gold (`surfaces & accents`), terracotta (`calls-to-action & badges`), and ink-charcoal text. Subtle geometric motifs derived from Pakistani truck art and tilework are used sparingly as dividers and accent signatures.
- **Journey Tracking**: Order tracking is presented as a physical journey along milestones:
  $$\text{Placed} \longrightarrow \text{Packed} \longrightarrow \text{On the way} \longrightarrow \text{Arrived}$$
- **Bilingual & RTL-Ready**: Urdu Nastaliq and English language parity from day one using `next-intl`.

---

## 2. Non-Negotiable Architectural Rules

The following core principles govern all backend and frontend implementations:

1. **Integer Minor Units for Money**:
   All monetary amounts are stored as integer minor units (`paisa`) in `bigint` Postgres columns with an ISO currency code column (default `'PKR'`). Floating-point arithmetic for currency is strictly prohibited.
2. **Zero-Trust Client Pricing**:
   Clients are NEVER trusted for prices, totals, taxes, stock quantities, vendor commissions, or discounts. All totals are re-fetched and computed authoritatively on the server.
3. **Row-Level Security (RLS) Default Deny**:
   RLS is mandatory on every table. Sellers are isolated to their own `seller_id`, customers to their own records, and superadmins through verified role-check functions.
4. **Service-Role Key Protection**:
   The Supabase service-role key (`SUPABASE_SERVICE_ROLE_KEY`) is strictly confined to server-only code (route handlers, server actions, edge functions). It is guarded with `import "server-only"` and never exposed via `NEXT_PUBLIC_*`.
5. **Mutation Audit Logging**:
   Every administrative and seller mutation writes an append-only log to `audit_logs` capturing `actor`, `action`, `entity`, `entity_id`, `before`, `after`, `ip`, and `timestamp`.
6. **Append-Only Financial Records**:
   Financial history is protected. commissions, seller_ledger, price_history, order_status_history and audit_logs are strictly append-only (corrections are new reversing entries). orders, sub_orders, payments and payouts may change STATUS only through server functions, never their amounts after creation; every status change is logged to audit_logs or order_status_history.
7. **Soft Deletes & Audited Timestamps**:
   Business entities implement `deleted_at IS NULL` soft deletes, alongside automatic `updated_at` triggers.
8. **Numbered SQL Migrations**:
   All database modifications are version-controlled in `supabase/migrations/` sequentially. No unrecorded dashboard edits.
9. **Strict Adapter Boundaries**:
   Payment processors and logistics couriers interact solely through clean TypeScript interfaces (`lib/payments`, `lib/couriers`). No third-party gateway SDKs or courier code bleed into business logic.
10. **i18n & RTL Readiness**:
    All UI strings reside in message catalogs (`messages/en.json`, `messages/ur.json`). Layouts use RTL-safe flexbox/grid directions and bidirectional styling.

---

## 3. Directory Structure & Route Groups

The codebase follows the Next.js 15 App Router structure organized by domain responsibility:

```
kaaravan/
├── app/
│   ├── (store)/                 # Public storefront, guest flows & customer account
│   │   ├── account/             # Authenticated customer profile & active journey
│   │   ├── login/               # Authentication entry point
│   │   ├── unauthorized/        # Fallback for role permission denial
│   │   ├── styleguide/          # Interactive design system & component showcase
│   │   ├── layout.tsx           # Storefront layout (header, navigation, footer)
│   │   └── page.tsx             # Marketplace home page
│   ├── (seller)/                # Dedicated merchant portal
│   │   └── seller/
│   │       ├── layout.tsx       # Server-verified seller layout (requireAuth)
│   │       └── page.tsx         # Seller dashboard overview
│   ├── (admin)/                 # Superadmin governance panel
│   │   └── admin/
│   │       ├── layout.tsx       # Server-verified superadmin layout (requireAuth)
│   │       └── page.tsx         # Platform governance dashboard
│   ├── api/                     # Server Route Handlers
│   │   ├── health/              # Health check endpoint
│   │   └── webhooks/            # Payment & courier webhook receivers
│   ├── globals.css              # CSS variable tokens & Tailwind v4 directives
│   └── layout.tsx               # Root HTML shell with i18n & query providers
├── components/
│   ├── ui/                      # shadcn/ui primitive components (button, card, badge, etc.)
│   ├── store/                   # Storefront components (header, footer, journey tracker, patterns)
│   ├── seller/                  # Seller portal navigation and specialized tables
│   ├── admin/                   # Superadmin management widgets and audit views
│   └── providers/               # TanStack Query & context providers
├── config/
│   └── brand.ts                 # Central brand constants (names, taglines, assets)
├── docs/
│   └── ARCHITECTURE.md          # Architecture specification (this file)
├── i18n/
│   └── request.ts               # next-intl server request configuration
├── lib/
│   ├── auth/                    # Role check utilities (requireAuth)
│   ├── couriers/                # Courier adapter interface & registry
│   ├── payments/                # Payment gateway adapter interface & registry
│   ├── store/                   # Zustand stores (cart, UI drawer state)
│   ├── supabase/                # Browser client, Server client, Admin client, Middleware
│   ├── validators/              # Zod validation schemas
│   └── utils.ts                 # CSS class merger utilities (cn)
├── messages/
│   ├── en.json                  # English localization catalog
│   └── ur.json                  # Urdu localization catalog
├── middleware.ts                # Supabase session refresh & edge route guard
└── PROJECT_RULES.md             # Non-negotiable architectural mandates
```

---

## 4. User Roles & Security Model

The platform defines four clear user roles:

| Role | Scope & Permissions | Access Boundary |
| :--- | :--- | :--- |
| **`guest`** | Browses product catalog, searches, adds items to cart, checks out with guest details. | Public storefront `app/(store)` |
| **`customer`** | Registered buyer. Manages profile, tracks order journeys, manages addresses. | `app/(store)/account` |
| **`seller`** | Verified vendor business. Manages catalog, inventory, order fulfillment, and payouts. | `app/(seller)/seller/*` (partitioned by `seller_id`) |
| **`admin_staff`** | Platform staff with specific permissions from admin_permissions; access to /admin arrives in Phase 7. | `app/(admin)/admin/*` |
| **`superadmin`** | Platform owner & authorized operations staff. Moderation, dispute resolution, financial ledger, and platform settings. | `app/(admin)/admin/*` |

### Defense-in-Depth Authentication Flow

Security does NOT rely solely on edge middleware:
1. **Edge Middleware (`middleware.ts`)**:
   - Refreshes Supabase auth token via cookies on every incoming request.
   - Detects unauthenticated requests targeting `/seller/*` and `/admin/*`, redirecting to `/login?redirect=...`.
2. **Server Layout Verification (`lib/auth/roles.ts`)**:
   - Each route layout independently invokes `requireAuth(["seller"])` or `requireAuth(["superadmin"])`.
   - Fetches the verified user from Supabase auth and inspects database permissions/roles before rendering any server component tree.
   - Unauthorized attempts immediately redirect to `/unauthorized` or `/login`.
3. **Database RLS Policies**:
   - Even if application code were compromised, PostgreSQL Row Level Security enforces that queries cannot read or mutate data belonging to other tenant sellers or customers.

---

## 5. Data Flow & Subsystems

```
[ Customer Browser ]
       │
       ▼
[ Edge Middleware ] ──(refreshes session)──> [ Supabase Auth ]
       │
       ├─► Storefront Server Component ──► Supabase Postgres (RLS: Public Catalog)
       │
       ├─► Seller Portal Layout ──► Server Role Check ──► Supabase Postgres (RLS: seller_id)
       │
       └─► Admin Portal Layout ──► Server Role Check ──► Supabase Postgres (RLS: superadmin)
```

### 1. Money & Calculations
- Storefront client uses Zustand `useCartStore` for responsive local cart management.
- When checkout begins, client submits only product and variant IDs with quantities.
- Server action fetches database prices in integer paisa, computes taxes, seller commissions, and discount rules, creating the immutable order record.

### 2. Payment Flow
- Client initiates checkout $\rightarrow$ Server queries `PaymentGatewayAdapter` $\rightarrow$ returns gateway reference / redirect URL.
- Customer settles payment on gateway $\rightarrow$ Gateway notifies webhook `/api/webhooks/payments`.
- Webhook handler validates signature, utilizes server-only `createAdminClient()`, and appends transaction records to ledger.

### 3. Courier & Journey Tracking
- Seller marks order ready $\rightarrow$ Server invokes `CourierAdapter.createShipment()`.
- Tracking checkpoints map to Kaaravan journey milestones:
  - **`placed`**: Order received and verified.
  - **`packed`**: Inspected and boxed by merchant.
  - **`on_the_way`**: Dispatched via courier across regional routes.
  - **`arrived`**: Delivered to customer doorstep.

---

## 6. Deferred Security Items

The following security enforcement items are slated for implementation in subsequent phases:
- **Phase 5**: Server-built return-evidence paths; automatic rating recalculation on reviews.
- **Phase 7**: `admin_staff` access to `/admin` with per-route permission checks via `admin_permissions`.
- **Phase 8**: Lock money columns on `orders`/`sub_orders` after creation; enforce a `sub_order` status state machine; lock `payments`/`payouts` amounts and allow only status changes via server functions, logging each change to `audit_logs`; webhook HMAC signature verification + idempotency.
- **Phase 11**: Guard triggers for offers (force pending, `seller_id` must match variant's seller, respect `min_offer_minor`) and `qafila_deals`.

