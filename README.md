# ASO Users — Stock Management System

Production rebuild of the ASO Users stock management app for RSSB Foundation. The
interface follows the original prototype, but runs on real URL routes, a real
database, server-side sessions, and server-enforced permissions. The same
deployment also serves the original static portal at `/stockroom/`.

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Database:** Prisma 6 with SQLite for local/single-server use; PostgreSQL-ready
- **Auth:** username + password, Argon2id, database-backed sessions
- **UI:** the prototype's responsive design, preserved and rebuilt as React components

## Requirements

- Node.js 20.9 or newer (tested on Node 26)
- npm 10 or newer
- A writable location for the SQLite database, or a PostgreSQL 14+ server

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the environment file from the example:

   ```powershell
   Copy-Item .env.example .env
   ```

   On macOS/Linux use `cp .env.example .env`. Then edit `.env` and set strong
   seed passwords (12+ characters). These values are only used when seeding;
   they are not read by the running app.

3. Apply the database migration and seed the starter data:

   ```bash
   npm run db:deploy
   npm run db:seed
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open <http://localhost:3000>. Signed-out visitors are redirected to
   `/login`.

The seed creates the suppliers, products, and movement history used by the
starter dataset, plus the master data: 41 centres/sub-centres/points, 11
catalogue items, 451 location requirement lines, 5 departments, and the
six-document reference library. It also
creates one ADMIN and one OPERATOR account using the usernames and passwords
from `SEED_*` in `.env`. Change those credentials before using the app for real
data, and remove the sample catalog if it does not belong in your deployment.

### Resetting local data

```bash
npm run db:reset   # drops, re-migrates, and re-seeds
```

Seeding deletes all sessions, so every signed-in browser is logged out.

## Scripts

| Script               | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Development server with hot reload                  |
| `npm run build`      | Production build                                    |
| `npm run start`      | Start the production server (after `build`)         |
| `npm run lint`       | ESLint                                              |
| `npm run typecheck`  | TypeScript, no emit                                 |
| `npm test`           | Unit tests (Node test runner via `tsx`)             |
| `npm run docs:generate` | Rebuild the six reference PDFs in `private/documents` |
| `npm run db:generate`| Regenerate the Prisma client                        |
| `npm run db:migrate` | Create/apply a migration in development             |
| `npm run db:deploy`  | Apply committed migrations (production)             |
| `npm run db:seed`    | Reset and re-seed the database                      |
| `npm run db:reset`   | Drop, re-migrate, and re-seed (development only)    |

## Routes

| Route                   | Access            | Description                                    |
| ----------------------- | ----------------- | ---------------------------------------------- |
| `/login`                | Public            | Sign-in form                                   |
| `/`                     | Public redirect   | Sends signed-in users to `/overview`           |
| `/overview`             | Any signed-in     | KPIs, 7-day stock flow, attention list, recent movements |
| `/inventory`            | Any signed-in     | Search, filters, sorting, CSV export, product create/edit/delete |
| `/movements`            | Any signed-in     | Movement history, filters, pagination, stock adjustments |
| `/suppliers`            | Any signed-in     | Supplier cards, lead times, low-stock summaries |
| `/departments`          | Any signed-in     | Department master grouped by how stock is used |
| `/departments/[slug]`   | Any signed-in     | Department detail: assigned items, stock cover, short locations |
| `/centres`              | Any signed-in     | Centre master: centre/sub-centre/point hierarchy and stock status |
| `/centres/[slug]`       | Any signed-in     | Centre detail: child locations and item requirements |
| `/items`                | Any signed-in     | Item master: catalogue costs and requirement coverage |
| `/items/[slug]`         | Any signed-in     | Item detail: requirement and on-hand stock by location |
| `/documents`            | Any signed-in     | Document Master: six read-only reference PDFs  |
| `/documents/[file]`     | Any signed-in     | Streams one reference PDF from `private/documents` |
| `/api/health`           | Public            | Database health probe (`200` / `503`)          |
| `/api/catalog`          | Signed-in         | Product and supplier options for the UI (`401` otherwise) |
| `/api/inventory/export` | Signed-in         | CSV export of the current inventory filters (`401` otherwise) |
| `/stockroom/`           | Public            | Original static portal (browser-local data)    |

### Roles

- **ADMIN** — everything an operator can do, plus delete products.
- **OPERATOR** — view data, add/edit products, receive stock, dispatch stock,
  and record physical counts. Operators never receive delete controls and the
  delete action rejects them server-side.

Permissions are enforced in the server action/route handler that performs the
work, not only by hiding interface controls.

## Architecture

```text
src/
  app/
    (workspace)/          authenticated pages and layout guard
    actions/              server actions (auth, product CRUD, stock moves)
    api/                  health, catalog, CSV export
    documents/[file]/     signed-in PDF streaming route
    login/                public sign-in page and form
  components/             shared UI (sidebar, topbar, dialogs, tables)
  lib/
    auth/                 password hashing, sessions, rate limiting, current user
    queries.ts            server-side inventory and movement data access
    master-data.ts        read-only centre, item, and department views
    master.ts             derived health, status, and coverage rules
    validation.ts         Zod schemas shared by actions and URL parsing
    products.ts, url.ts, format.ts, ...
  proxy.ts                CSP nonce and security headers (not authorization)
prisma/
  schema.prisma           data model
  migrations/             committed SQL migrations
  seed.ts                 starter data and accounts
private/
  documents/              six reference PDFs served only to signed-in users
scripts/
  generate-reference-pdfs.ts  dependency-free PDF generator
```

- `/overview`, `/inventory`, `/movements`, `/suppliers`, `/departments`,
  `/centres`, and `/items` (plus their detail pages) are real routes; there is
  no hash navigation.
- Authentication is checked in `src/app/(workspace)/layout.tsx` before any
  protected page renders, and again in every server action and every API route
  that reads or changes data. `src/proxy.ts` only adds a CSP nonce and security
  headers.
- Stock changes run in transactions. Dispatch and physical-count updates use
  conditional `updateMany` writes so concurrent edits cannot drive stock
  negative or overwrite a changed count.
- Money is stored as integer cents (`costCents`, `priceCents`), including
  catalogue item costs in the master data, and formatted in the UI.
- Centre, catalogue item, and department master pages are read-only views over
  the seeded requirement data. Status, coverage, shortfall, and health are
  derived in `src/lib/master.ts` rather than stored as duplicate columns.
- Document Master is a read-only library capped at six PDFs. Metadata lives in
  the `Document` table and the files live in `private/documents`; the
  `/documents/[file]` route checks the session, resolves the file name against
  the database, and streams only a registered PDF. The metadata and the
  generated files share `src/lib/reference-documents.ts` as their single list.
- Movements keep a snapshot of product name, SKU, and unit, so history survives
  product deletion. The product foreign key becomes `NULL` on delete.
- Products and stock movements write audit entries (`AuditLog`) in the same
  transaction as the change.

## Security

- **Passwords:** Argon2id (`m=19456`, `t=2`, `p=1`, 32-byte output), random
  salt per hash. Plaintext passwords are never stored or logged.
- **Sessions:** 32 random bytes in an `httpOnly`, `sameSite=lax` cookie; only a
  SHA-256 hash of the token is stored in the database. Server expiry is 7 days
  and rolls forward after an hour of activity. The browser cookie lasts 30 days
  so activity can keep an otherwise valid session alive. Production cookies
  are `secure` and require HTTPS.
- **Login throttling:** 8 failed attempts per 15 minutes per IP + username and
  32 per 15 minutes per IP. Unknown users still verify against a real dummy
  Argon2 hash to reduce username enumeration through timing.
- **Password changes:** require the current password, enforce 12+ characters
  with at least one letter and one number, and revoke every other session for
  that user.
- **CSRF:** mutations use Next.js Server Actions, which accept POST only and
  validate the request origin. API routes are read-only `GET` handlers.
- **Input:** every action and route validates with Zod; SKUs are normalized;
  filters fall back to safe defaults.
- **Headers:** CSP with a per-request nonce and `strict-dynamic`, plus HSTS,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a strict referrer
  policy, Permissions Policy, COOP, and CORP. See `src/proxy.ts` and
  `next.config.ts`.
- **CSV export:** values starting with `=`, `+`, `-`, `@`, tab, or carriage
  return are prefixed with an apostrophe to prevent spreadsheet formula
  injection.
- **Audit:** sign-in, sign-out, failed sign-in, password change, product
  create/update/delete, stock receipt/dispatch/count are recorded with actor,
  entity, IP, and timestamp.

## Testing and verification

```bash
npm test           # 74 unit tests
npm run typecheck
npm run lint
npm run build
```

The test suite covers stock status and rail math, product view mapping,
validation schemas, URL filter parsing and link building, master-data health and
coverage rules, and the fixed-window rate limiter plus Argon2id
hashing/verification. End-to-end flows (login, redirects, CRUD, stock moves,
CSV, master pages, mobile layout) were verified against the production build in
a browser.

## Production deployment

1. Provision a host with Node.js 20.9+ and HTTPS termination (a reverse proxy
   such as Nginx or Caddy, or a platform load balancer). The session cookie is
   `secure` in production, so plain HTTP will not keep users signed in.

2. Create `.env` with production values:

   ```dotenv
   DATABASE_URL="file:./prod.db"
   SEED_ADMIN_USERNAME="..."
   SEED_ADMIN_PASSWORD="..."
   SEED_OPERATOR_USERNAME="..."
   SEED_OPERATOR_PASSWORD="..."
   ```

   `SEED_*` values are only needed for seeding. Do not commit `.env`.

3. Install, migrate, build, and start:

   ```bash
   npm ci
   npm run db:deploy
   npm run db:seed        # only when provisioning a new database
   npm run build
   npm run start
   ```

   `next start` listens on port 3000 by default; set `PORT`/`HOSTNAME` as
   needed by your process manager. Keep `private/documents/` beside the app:
   the PDF route reads those files at request time. If you deploy a standalone
   build, copy that folder into the deployment as well.

4. Keep the database file (`prisma/prod.db` or the path in `DATABASE_URL`) on
   persistent storage and back it up regularly. With SQLite, run a single app
   instance: it has one writer and is not suitable for horizontal scaling.

5. Point the load balancer/proxy at `/api/health` for readiness checks. A
   `503` means the database cannot be reached.

6. Forward `X-Forwarded-For` from your trusted proxy if you rely on per-IP
   throttling and audit IPs. The app reads the first address in that header.

### Deploying to Vercel

The repository is one Next.js project. `vercel.json` runs
`scripts/vercel-build.mjs`, which:

1. switches `prisma/schema.prisma` from SQLite to PostgreSQL for the build,
2. regenerates the Prisma client and pushes the schema with `prisma db push`,
3. seeds starter data only when the database has no users,
4. restores the SQLite schema and runs `next build`.

In Vercel, add these environment variables, then deploy:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled PostgreSQL connection string |
| `DIRECT_URL` | Recommended | Direct connection string used for schema changes |
| `SEED_ADMIN_PASSWORD` | First deploy | 12+ characters; creates the admin account |
| `SEED_OPERATOR_PASSWORD` | First deploy | 12+ characters; creates the operator account |
| `SEED_ADMIN_USERNAME`, `SEED_ADMIN_NAME` | Optional | Defaults: `aso.admin`, `Avery Morgan` |
| `SEED_OPERATOR_USERNAME`, `SEED_OPERATOR_NAME` | Optional | Defaults: `aso.user`, `Sam Okafor` |

Use Neon, Supabase, or Vercel Postgres. The static portal at `/stockroom/` is
served by the same deployment and needs no database. Full steps are in
[DEPLOY.md](./DEPLOY.md).

A deployment is successful when `/login`, `/stockroom/`, and `/api/health`
respond. If you add the seed passwords after an empty-database deploy, redeploy
so the seed step can run.

### Rate limiting in multi-instance deployments

`src/lib/auth/rate-limit.ts` is an in-process fixed-window limiter. It is
correct for a single Node instance, but each instance has its own memory. If
you run more than one instance, replace it with a shared store (Redis, Upstash,
or your platform's rate-limit service) while keeping the same
`rateLimit`/`clearRateLimit` interface.

### Session and audit retention

Expired sessions are removed lazily on use. For long-running deployments,
schedule a periodic cleanup:

```sql
DELETE FROM "Session" WHERE "expiresAt" < CURRENT_TIMESTAMP;
```

Audit rows are append-only from the application. Define a retention policy that
matches your organization's requirements before pruning them.

## Dependency maintenance

Run `npm audit` and update dependencies regularly. The app pins Next.js,
Prisma, and Argon2 packages; apply security patches through normal dependency
updates and re-run the test, typecheck, and build steps above. Prisma CLI
settings (schema path, migrations directory, seed command) live in
`prisma.config.ts`, which also loads `.env` via `dotenv/config`. As of this
writing, `npm audit` reports advisories in Prisma's CLI-only dependency tree
(`deepmerge-ts`) and in ESLint's development dependency tree; the offered
automatic fixes require breaking major upgrades, so schedule those
deliberately rather than running `npm audit fix --force`. These packages are
not loaded by the production server at runtime.

## Branding

The interface and metadata keep the **ASO Users** and **RSSB Foundation**
branding from the original application. All prototype-only demo surfaces and
language have been removed.
