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
  calls, etc.) with editable name/date/amount/source.
- Track a **cap table**: members' capital contributions, adjust their draws
  (distributions) individually or auto-split a distribution across all
  members by ownership %, with ownership computed pro-rata from
  contributions unless manually overridden.
- View a computed **monthly cashflow summary** (spreadsheet-style grid, by
  category and line item) plus a chart of total monthly cashflow.

## Stack

- **Frontend only**: React, TypeScript, Vite, TanStack Query, Recharts.
- **Storage**: Google Sheets — the app creates one spreadsheet per project
  and reads/writes it via the Sheets API, authenticated with your own Google
  account (Google Identity Services, client-side OAuth). No backend, no
  Postgres, no Express.
- **Hosting**: static files, deployed to GitHub Pages via GitHub Actions.

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

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy-pages.yml` builds and deploys the
`frontend/` app automatically on every push to `main`. To turn it on:

1. In this repo's GitHub settings, go to **Settings → Pages** and set
   **Build and deployment → Source** to **GitHub Actions**.
2. Push to `main` (or run the workflow manually from the **Actions** tab).
3. Once it finishes, the app is live at
   `https://<your-github-username>.github.io/CF/`.

Make sure that exact URL is one of the **Authorized JavaScript origins** on
your OAuth Client ID (step 4 above), or sign-in will fail with a redirect
error.

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
