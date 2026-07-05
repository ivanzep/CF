# CF — Cashflow Tracking Tool

A cashflow tracking tool for real estate development projects, based on the
"La Costa Hotel" monthly cashflow spreadsheet. It's a fully static web app —
your browser talks directly to the Google Sheets API, and each project's data
lives in its own Google Sheet in your Drive. There's no server and no
database to run or host.

Lets you:

- Edit budget line items, grouped into customizable categories.
- Schedule each line item's payments either **spread evenly** between a start
  and end date, or on **specific custom dates**.
- Define a project's **draw structure** (construction loan draws, equity
  calls, etc.) with editable name/date/amount/source, or **auto-generate a
  recurring series** (e.g. quarterly draws) over a date range.
- Track a **cap table**: members' capital contributions, adjust their draws
  (distributions) individually or auto-split a distribution across all
  members by ownership %, with ownership computed pro-rata from
  contributions unless manually overridden.
- View a computed **monthly cashflow summary** (spreadsheet-style grid, by
  category and line item) plus a chart of total monthly cashflow.
- **Print preview** with page size/orientation/margin/font/row-size options
  and a paginated on-screen preview, or **export a CSV** of any combination
  of project info, line items, draws, cap table, and the summary grid.

There are four ways to run this tool — pick one:

| | `frontend/` (this doc) | [`docs/index.html`](./docs/README.md) | [`docs/apps-script.html`](./docs/README.md) | [`apps-script/`](./apps-script/README.md) |
|---|---|---|---|---|
| Data lives in | Google Sheets, via its API | Google Sheets, via its API | Google Sheets, via an Apps Script web app | Google Sheets, via an Apps Script web app |
| Google Cloud Console needed? | Yes (OAuth Client ID) | Yes (OAuth Client ID) | **No** | **No** |
| Hosting | Build locally (`npm run build`), host `dist/` anywhere static | GitHub Pages (no build) | Anywhere static (e.g. GitHub Pages) | `script.google.com` only |
| Sign-in | Google sign-in per visitor | Google sign-in per visitor | None | None |
| Best for | The React codebase, if you want to keep developing it | Same experience, zero build step | No Cloud Console, UI hosted separately from the sheet | No Cloud Console, simplest possible setup |

`frontend/` and `docs/index.html` are the same OAuth-based app, built two
different ways. `docs/apps-script.html` is a separate static UI that talks
to the `apps-script/` backend over plain HTTP instead of calling Google
Sheets directly — no OAuth Client ID at all, at the cost of the backend
needing to allow unauthenticated requests (see
[`apps-script/README.md`'s Security section](./apps-script/README.md#security)).
A GitHub Pages site can only run one *source* at a time (pick it in repo
Settings → Pages). This repo's Pages source is **Deploy from a branch**
(`main`, `/docs`), which serves `docs/index.html` and `docs/apps-script.html`
from that same source — `frontend/` is not auto-deployed (see below).

The rest of this document covers the React/`frontend/` version. See
[`docs/README.md`](./docs/README.md) for the static pages, or
[`apps-script/README.md`](./apps-script/README.md) for the Apps Script
backend setup (start there if you don't want to touch Google Cloud
Console).

## Stack

- **Frontend only**: React, TypeScript, Vite, TanStack Query, Recharts.
- **Storage**: Google Sheets — the app creates one spreadsheet per project
  and reads/writes it via the Sheets API, authenticated with your own Google
  account (Google Identity Services, client-side OAuth). No backend, no
  Postgres, no Express.
- **Hosting**: static files (`npm run build` → `frontend/dist/`). Not
  auto-deployed in this repo — see "Deploying" below.

## One-time setup: Google OAuth Client ID

The app needs an OAuth Client ID from a Google Cloud project so it can ask
for permission to read/write Sheets on your behalf. This is free and only
needs to be done once.

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and
   create a new project (or pick an existing one).
2. **APIs & Services → Library** → search for **Google Sheets API** → click
   **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External** (unless you have a Workspace account).
   - Fill in an app name and your email, save.
   - Under **Test users**, add your own Google account's email. (While the
     app is unpublished, only test users can sign in — that's fine for
     personal use.)
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**, add both:
     - `https://<your-github-username>.github.io` (for the deployed Pages site)
     - `http://localhost:5173` (for local development)
   - Create, then copy the generated **Client ID** (looks like
     `xxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`).
     You don't need the client secret — this app only uses the public,
     browser-side token flow.
5. Open the app (locally or once deployed), paste the Client ID into the
   setup screen, then click **Sign in with Google**.

The Client ID isn't a secret (it's safe to see in your browser's network
tab), so it's just stored in your browser's local storage — no server-side
config or GitHub secrets needed.

## Running locally

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, paste your Client ID, sign in, and either start
a blank project or load the bundled La Costa Hotel example data.

## Deploying

This repo's live GitHub Pages site serves `docs/` (Settings → Pages →
**Deploy from a branch**, `main` / `/docs`) — see
[`docs/README.md`](./docs/README.md). `frontend/` is a separate React
codebase that isn't auto-deployed here, since a Pages site can only run one
deployment source at a time. To host this build somewhere:

```sh
cd frontend
npm run build
```

This produces static files in `frontend/dist/` — upload them to any static
host (Vercel, Netlify, S3, another GitHub Pages repo, etc.). If you'd rather
use this React build *instead of* `docs/` as this repo's Pages site, switch
**Settings → Pages → Source** to **GitHub Actions** and add a workflow that
builds `frontend/` and uploads `frontend/dist` via `actions/deploy-pages`
(and remove/disable the `/docs` source, since only one can be active).

Whichever URL you land on, make sure it's one of the **Authorized JavaScript
origins** on your OAuth Client ID (step 4 above), or sign-in will fail with a
redirect error.

## How data is stored

Each project is a separate Google Sheet (created by the app, listed in your
Drive) with tabs: `Project`, `Categories`, `LineItems`, `Payments`, `Draws`,
`CapTable`, `Contributions`, `Distributions`. You can open the sheet directly
in Google Sheets to inspect or back up the raw data; just avoid hand-editing
the header row.

The app keeps a list of the spreadsheets it created for you in your browser's
local storage (per-browser, not synced) — if you switch browsers or clear
site data, use the sheet's ID to reconnect (support for pasting an existing
spreadsheet ID can be added if you need it).
