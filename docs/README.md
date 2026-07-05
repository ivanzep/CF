# Cashflow Tracker — single-file static version

A single, self-contained `index.html` — no build step, no npm install. It
has the same features as `frontend/` (editable line items with even-spread
or custom-date schedules, draws, cap table with auto-split, monthly
summary), storing data in a Google Sheet your browser talks to directly.

## Enabling it on GitHub Pages

This repo already has a GitHub Actions workflow that deploys the built
`frontend/` React app to Pages. A Pages site can only have **one** active
source, so pick whichever you want live:

- **This single file** → repo **Settings → Pages → Build and deployment →
  Source: Deploy from a branch**, branch `main`, folder `/docs`. No CI run
  needed — it's live within a minute of enabling it, and stays live as long
  as `docs/index.html` exists on `main`.
- **The React app** → **Source: GitHub Actions** (already configured via
  `.github/workflows/deploy-pages.yml`).

Either way, the URL is the same: `https://<your-username>.github.io/CF/`.

## Setup

Same one-time Google Cloud OAuth Client ID as the React app — see the root
[README](../README.md#one-time-setup-google-oauth-client-id) for the exact
steps. Use the same **Authorized JavaScript origins** entry
(`https://<your-username>.github.io`); one Client ID works for both
versions since they're served from the same origin.

Open the page, paste the Client ID, sign in, then either start a blank
project or load the bundled La Costa Hotel example — each project is its
own spreadsheet, and you can create/switch between several from the
dropdown in the top bar.
