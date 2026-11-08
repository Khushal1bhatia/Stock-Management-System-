# Stock Management System

A self-contained inventory workspace for **ASO Users**, built with static HTML, CSS, and JavaScript. The runtime has no backend, framework, or network account. A small Vite-powered development server and a dependency-free production build make the same files deployable on Vercel.

## Open the portal

Recommended: double-click **`start.bat`**. It launches `index.html` in Chrome or Edge when either is installed, which avoids a broken default-browser association or a dead preview URL.

You can also double-click `index.html` directly, or open it in any modern browser.

If you move or rename this folder, use `start.bat`; it always opens the copy beside it. A saved browser bookmark to an absolute file path will break when the folder moves.

The portal works fully offline. Archivo is self-hosted and embedded in `fonts.css` so it also loads from `file://` without CORS errors. Every stylesheet, script, icon, and image is local; the page makes no request to Google Fonts or any other service.

## If the browser shows an error or a Retry button

1. Close the broken tab.
2. Run `start.bat` again. Do not reopen an old `http://localhost/...` or preview link; this project does not need a local server.
3. If the sign-in screen reappears after you submit valid credentials, the browser is blocking `sessionStorage`. This build keeps the session in memory so the portal still opens. You may need to sign in again after a refresh.
4. In a private or hardened browser, allow local storage for the page if you want the session and inventory to persist between visits.
5. If the address bar still shows an old folder name, the portal was moved. Delete the stale bookmark and run `start.bat` from this `stockroom` folder.

## Develop and build

The app itself is plain static files. Node.js is only needed for the local development server and the deployable `dist/` build.

Requirements: **Node.js `^20.19.0 || >=22.12.0`** (Node 22 LTS recommended; `.nvmrc` pins 22).

```bash
npm install
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # validates the site and writes dist/
npm run preview   # serves the built dist/ folder
```

`npm run build`:

- Copies `index.html`, the stylesheets, `js/`, `assets/`, `manifest.json`, `robots.txt`, `favicon.ico`, and `start.bat` into `dist/`.
- Resolves every stylesheet, script, icon, social image, and reference PDF referenced by the page.
- Confirms the Document Master still has its six PDFs.
- Fails if any copied file contains a machine-specific home or user path.
- Prints the file count and total size when the build passes.

The production output is plain static HTML, so no server runtime is required. `npm run dev` and `npm run preview` are for local work only.

## Deploy to Vercel

The repository is pre-configured for Vercel; importing it needs no dashboard changes:

- **Framework preset:** Other (set explicitly by `vercel.json`)
- **Install command:** `npm ci`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** none

`vercel.json` also sets security headers, the manifest MIME type, and a one-day cache for `/assets`. Because every route is hash-based (`#/inventory`, `#/centres/...`), no SPA rewrite is required and deep links always load `index.html`.

The same `dist/` folder can be uploaded to any static host, including GitHub Pages, Netlify, Cloudflare Pages, or a normal web server. Keep `index.html` at the site root. If you serve it from a subpath instead of a domain root, all references are relative and continue to work.

## Branding

`assets/rssb.23.png` is the RSSB source mark. It is not displayed in the interface. The cream-white sidebar leads with the two-box sync mark above the product name and **Period : FY 2026-27**, separated from the Workspace navigation by a rule; the mobile header keeps a text wordmark. The same mark drives the sign-in card, favicon, and app icons. The sign-in card footer reads only **© 2026 Stock Management System**.

## Sign in

| Access | Username | Password | Signed in as | Can do |
| --- | --- | --- | --- | --- |
| Admin | `aso.admin` | `Admin@2026` | **Khushal Bhatia.1** | Full data access, plus lock or unlock any section |
| ASO User | `aso.user` | `Stock@2026` | **ASO** | Full data access: add, edit, and delete products; receive, remove, and set counts; export CSV |

Both accounts can change inventory records. Only the administrator sees the **Lock section** control in the top bar. Signed-in users see their name, role, and **ASO Users** scope in the sidebar and account menu. Use **Sign out** in the account menu to end the session.

Sessions use browser `sessionStorage` when available. If storage is blocked, the signed-in session stays in memory for the current page. Inventory records use `localStorage` when available and fall back to memory, so the portal still works in private or restricted browsers.

> **Security note:** this is a client-side access gate, not real authentication. The credentials and permissions live in `js/auth.js` and anyone with access to the source can bypass them. Do not use this gate to protect confidential data; a production deployment needs server-side authentication and authorization.

To change accounts or access levels, edit `AUTH_ACCOUNTS` in `js/auth.js`.

## What is included

- **Overview** — inventory KPIs, seven-day unit flow, restock queue, recent movements, value by category, and a Satsang Place section showing stock coverage for every place.
- **Inventory** — search, category/supplier/status filters, sortable columns, add/edit/delete products, CSV export, and responsive product cards.
- **Movements** — filterable audit history for receipts, dispatches, and count corrections, with the signed-in user recorded as the actor.
- **Suppliers** — contact details, lead times, stock exposure, and quick links to each supplier's products.
- **Centre Master** — an Inventory Masters table with 41 deduplicated locations: 18 centres, 15 sub-centres, and 8 points. Every row shows the fixed **Area Name** (Faridabad); the Add/Edit Satsang Place dialog also shows it as a read-only field. Search by name, 4-digit badge code, parent, incharge, phone, or email; sort by centre, type, or parent; add a **Satsang Place** with the required incharge name, phone number, and email id from the centre dialog; edit or remove locations; and export the visible rows to CSV. Each row links through to the location's sub-centres, points, and item requirements.
- **Item Master** — 11 ASO catalogue items with unit cost (INR), total requirement, and that item's required quantity in every location. Centre and item pages link to each other.
- **Document Master** — a read-only library of six reference PDFs: the user guide, receiving, dispatch, and stock-count procedures, plus centre/item master and roles/audit references. Every PDF is local and opens in a new tab; the library is capped at six documents.
- **Departments** — 5 groups that organise the catalogue by how stock is used: **Pandal** (bistra shed, ASO chairs, small stool), **ASO** (ASO chairs), **Canteen / Kitchen** (cup, plate, glass, spoon), **Security** (mobile tokens and security registers), and **Store** (paint buckets with paint). Open a department to see its items, stock cover, and the locations that need restocking. Items can belong to more than one department.
- **Section locks** — an administrator can lock or unlock the section currently on screen from the top bar. While locked, adding, editing, and removing records is blocked, and a banner explains the state. Locks persist in this browser and are stored separately from inventory data.
- **Stock controls** — receive, remove, or set a count; optional reference and note; over-removal is blocked.
- **Quick find** — press `Ctrl+K` (`⌘K` on macOS) to search by product, SKU, or supplier.
- **Appearance** — the administrator can switch between Light and Dark with the brass pull-cord lamp switch in the top bar or from the account menu, and that choice is remembered for the admin account in this browser. Every other ASO user stays in Light.
- **Mobile layout** — eight-item bottom navigation and card-based inventory, movement, centre, item, and department lists.

## Data and persistence

The workspace starts with 19 inventory products, 28 stock movements, 5 suppliers, 41 deduplicated locations (18 centres, 15 sub-centres, and 8 points), 11 ASO catalogue items, 5 departments covering 13 item assignments, and 6 reference PDFs. Badge codes, location types, and parent links follow the supplied Faridabad centre list. Every location tracks all 11 items, so Centre Master and Item Master share 451 requirement lines. Requirement quantities are seeded per location, which is why the same item can need a different amount in each centre, sub-centre, or point. Seed dates are relative to the current day.

Inventory records are saved in browser `localStorage` under `stockroom.state.v1`. Centre master edits are saved separately under `stockroom.centres.v1`, so adding, editing, or removing a location does not rewrite inventory or movement history. Area Name is fixed to Faridabad for every location and is never editable in the interface. Section locks are saved under `stockroom.locks.v1`, so clearing inventory or signing in as another user does not silently unlock a section. A lock applies to everyone in that browser until an administrator unlocks it.

Because storage is browser-local, clearing site data or opening the file from a different path/browser creates a fresh initial state. **Export CSV** downloads the currently filtered products as `stock-management-inventory-YYYY-MM-DD.csv`.

## Reference library

`assets/documents/` holds the six one-page PDFs shown in Document Master. The card metadata lives in `REFERENCE_DOCUMENTS` in `js/core.js`; the file names there must match the PDFs in that folder. The library is read-only and capped at six documents, so there is no upload or delete control in the static build. Because the files sit beside `index.html`, every PDF opens offline and makes no network request. The build checks that all six files still exist.

## SEO and sharing

The page ships with:

- A descriptive title and a concise meta description.
- `index, follow` robots metadata and a permissive `robots.txt`.
- Canonical, Open Graph, and Twitter/X card tags.
- `WebApplication` JSON-LD structured data.
- An SVG favicon, Apple touch icon, and a web app manifest with 192/512/maskable icons.
- A 1200×630 social preview at `assets/og-cover.png`.

`canonical` and `og:url` are relative (`./`) because the project has no deployment domain. When you publish it, replace them with the absolute `https://` URL and add a `sitemap.xml` containing that URL. If the portal should stay private, change the robots meta tag to `noindex, nofollow` and add `Disallow: /` to `robots.txt`.

## Files

```text
stockroom/
├── index.html          App shell, sign-in gate, SEO metadata, icon sprite, dialogs
├── package.json        npm scripts and the Vite development dependency
├── package-lock.json   Reproducible installs for Vercel and local development
├── vercel.json         Static deploy settings, headers, manifest MIME type
├── .nvmrc              Node 22 for local and Vercel builds
├── .gitignore          Ignores node_modules, dist, and .vercel
├── fonts.css           Embedded Archivo variable font (offline/file:// safe)
├── styles.css          Tokens, sidebar, topbar, overview, section lock chrome
├── views.css           Tables, masters, inventory, movements, dialogs, mobile
├── login.css           Centered portrait sign-in card and brand mark
├── start.bat           One-click launcher for the local portal
├── manifest.json       Web app manifest and install icons
├── robots.txt          Crawler policy
├── favicon.ico         Legacy 32×32 browser icon
├── scripts/
│   └── build.mjs       Dependency-free static build and reference checks
├── assets/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   ├── og-cover.png    1200×630 social preview
│   ├── rssb.23.png     RSSB source mark (not displayed in the UI)
│   ├── documents/
│   │   ├── stock-system-user-guide.pdf
│   │   ├── receiving-stock-quick-reference.pdf
│   │   ├── dispatch-issue-quick-reference.pdf
│   │   ├── physical-stock-count-quick-reference.pdf
│   │   ├── centre-item-master-reference.pdf
│   │   └── roles-permissions-audit-reference.pdf
│   └── fonts/
│       ├── archivo-latin-var.woff2
│       └── archivo-latin-ext-var.woff2
├── js/
│   ├── core.js         Seed data, centre/item masters, locks, state, routing
│   ├── auth.js         Local accounts, session gate, permissions, user labels
│   ├── views.js        Overview, inventory, centre, and item views
│   ├── dialogs.js      Product, stock adjustment, confirm, quick-find dialogs
│   └── app.js          Actions, lock toggle, export, notifications, event wiring
├── .impeccable/
│   └── review/         Desktop and mobile review screenshots
├── dist/               Generated by npm run build (not checked in)
└── README.md
```

## Notes

- Currency is INR (₹). Values are displayed as stored and are not converted from another currency.
- Dates and relative timestamps follow the machine's local time.
- The app deliberately has no backend or server sync. Client-side sign-in is a demo access gate, not a security boundary.
