# Deploying Stockroom to Vercel

This folder is **one Next.js project** that serves both apps:

| URL | App | Storage |
| --- | --- | --- |
| `/` | Production stockroom (Next.js) | PostgreSQL |
| `/stockroom/` | Original static portal | The visitor's browser (`localStorage`) |

The static portal lives in `public/stockroom/`. One Vercel project, one build,
one deployment.

The build is automated by `scripts/vercel-build.mjs`:

1. Switch the Prisma datasource to PostgreSQL for the build.
2. Regenerate the Prisma client.
3. Create/update the database tables with `prisma db push`.
4. Seed starter data **only if the database has no users**.
5. Run the normal Next.js production build.

The committed SQLite migrations and the local SQLite workflow stay untouched.
Do not run `npm run db:deploy` against the Vercel PostgreSQL database: those
migrations are SQLite SQL. Production tables are managed by `prisma db push`.

---

## 1. Create a PostgreSQL database

Vercel serverless functions have no persistent disk, so the local
`prisma/dev.db` SQLite file cannot be used in production.

Use any hosted PostgreSQL 14+ database:

- **Neon** (available in the Vercel Marketplace)
- **Supabase**
- **Vercel Postgres**

From the provider, copy:

- **Pooled** connection string → `DATABASE_URL`
- **Direct** connection string → `DIRECT_URL`

The direct URL lets Prisma apply schema changes without going through a
connection pooler. If your provider only gives one URL, use it for both
variables.

> Neon pooled hosts usually contain `-pooler`; the direct URL does not.

---

## 2. Set environment variables in Vercel

Add these in **Vercel → Project → Settings → Environment Variables** for
Production (and Preview if you want preview deployments to work).

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled PostgreSQL URL, usually with `?sslmode=require` |
| `DIRECT_URL` | Recommended | Direct PostgreSQL URL |
| `SEED_ADMIN_USERNAME` | Optional | Defaults to `aso.admin` |
| `SEED_ADMIN_PASSWORD` | First deploy | 12+ characters |
| `SEED_ADMIN_NAME` | Optional | Defaults to `Avery Morgan` |
| `SEED_OPERATOR_USERNAME` | Optional | Defaults to `aso.user` |
| `SEED_OPERATOR_PASSWORD` | First deploy | 12+ characters |
| `SEED_OPERATOR_NAME` | Optional | Defaults to `Sam Okafor` |

The two `SEED_*_PASSWORD` values create the first accounts. They are only used
when the database has no users. **Do not commit them.**

If the passwords are missing on the first deploy, the build still succeeds but
skips the seed. Add the variables and redeploy to create the accounts.

---

## 3. Deploy

### Option A — Vercel CLI (fastest)

Run from this folder:

```powershell
cd C:\Users\LENOVO\Desktop\skills\stockroom-prod

npx vercel login
npx vercel link          # create/link the Vercel project

# Add the production environment variables (paste the values when prompted)
npx vercel env add DATABASE_URL production
npx vercel env add DIRECT_URL production
npx vercel env add SEED_ADMIN_PASSWORD production
npx vercel env add SEED_OPERATOR_PASSWORD production

# Optional account customisation
npx vercel env add SEED_ADMIN_USERNAME production
npx vercel env add SEED_ADMIN_NAME production
npx vercel env add SEED_OPERATOR_USERNAME production
npx vercel env add SEED_OPERATOR_NAME production

npx vercel --prod
```

The first build may take a few minutes. In the build log you should see:

```text
Switched prisma/schema.prisma to PostgreSQL for this build.
The database is empty - seeding starter data and accounts...
```

On later deploys the seed is skipped:

```text
Database already has 2 user(s); skipping seed.
```

### Option B — GitHub

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New → Project → Import** the repository.
3. Keep the detected settings:
   - **Framework preset:** Next.js
   - **Root Directory:** `./`
   - **Install Command:** `npm ci`
   - **Build Command:** from `vercel.json` (`node scripts/vercel-build.mjs`)
   - **Output Directory:** leave empty
4. Add the environment variables from step 2.
5. Deploy.

Every push to the production branch redeploys automatically.

---

## 4. Verify the deployment

Replace `your-app` with your Vercel domain:

| URL | Expected |
| --- | --- |
| `https://your-app.vercel.app/login` | Production sign-in page |
| `https://your-app.vercel.app/overview` | Dashboard after sign-in |
| `https://your-app.vercel.app/stockroom/` | Static portal sign-in |
| `https://your-app.vercel.app/api/health` | `{"status":"ok","database":"up"}` |

Sign in with the `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` values you set.

---

## 5. Updating the app

- **Code changes:** push/deploy again. The build regenerates the client and
  applies additive schema changes with `prisma db push`.
- **Static portal changes:** edit files in `public/stockroom/` directly. Changes
  to the separate backup folder `Desktop/skills/stockroom` do not propagate
  automatically; re-copy them if you edit the backup.
- **Schema changes:** `db push` refuses destructive changes by default. If you
  intentionally need one, review the generated SQL first, then add
  `--accept-data-loss` to the `db push` command in `scripts/vercel-build.mjs`.
- **Seed data:** only runs when `User` has zero rows. Never force it on a live
  database: `prisma/seed.ts` clears all app data.

To run a one-off seed manually against production:

```powershell
$env:DATABASE_URL="postgresql://..."
$env:SEED_ADMIN_PASSWORD="..."
$env:SEED_OPERATOR_PASSWORD="..."
npx tsx prisma/seed.ts
```

Only do this on a fresh database.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails: `DATABASE_URL must be a PostgreSQL connection string` | Add the PostgreSQL `DATABASE_URL` in Vercel environment variables, then redeploy. |
| Build succeeds, login has no accounts | `SEED_*_PASSWORD` was missing/short. Add both (12+ chars) and redeploy. |
| `/api/health` returns `503` | Database unreachable. Check the URL, password, `?sslmode=require`, and provider IP/network rules. |
| `prisma db push` times out | Use the **direct** URL for `DIRECT_URL`; pooled URLs are not reliable for schema changes. |
| `/stockroom/` returns 404 | Confirm `public/stockroom/index.html` exists and the deployment includes the `public` folder. |
| Static portal signs in but production does not | They are separate sign-ins. The static portal is a browser-local demo gate; production uses PostgreSQL accounts. |

---

## Local development (unchanged)

Local development still uses SQLite from `.env`:

```powershell
cd C:\Users\LENOVO\Desktop\skills\stockroom-prod
npm run dev          # http://localhost:3000
npm run db:seed      # reset local data and accounts
npm run build        # normal SQLite production build
```

`npm run build` does **not** touch PostgreSQL. Only the Vercel build command
switches providers.

---

## Important notes

- The static portal at `/stockroom/` keeps data in each visitor's browser. It
  does not use PostgreSQL, and its sign-in is a client-side demo gate. Do not
  put confidential data in it.
- Vercel runs multiple serverless instances. The built-in login throttle is
  in-memory per instance; use a shared store if you need strict limits at scale.
- Production cookies are `secure`; Vercel provides HTTPS automatically.
- `private/documents/` is included in the deployment trace by `next.config.ts`.
- The original static project remains at `Desktop/skills/stockroom` as a backup.
