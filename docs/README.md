# Static pages (no build step)

Two self-contained HTML pages live here — pick whichever backend you want:

| | `index.html` | `apps-script.html` |
|---|---|---|
| Backend | Google Sheets API directly | A Google Apps Script web app ([`apps-script/`](../apps-script/README.md)) |
| Setup | Google Cloud OAuth Client ID | Paste your Apps Script's `/exec` URL — no Cloud Console |
| Sign-in | Google sign-in per visitor | None |

Both have the same features (editable line items with even-spread or
custom-date schedules, draws, cap table with auto-split, monthly summary),
no build step, no npm install.

## `apps-script.html` — no Google Cloud setup

Talks to a Google Apps Script web app over plain HTTP instead of calling
Google Sheets directly, so there's no OAuth Client ID to create. Set up the
backend first by following [`apps-script/README.md`](../apps-script/README.md),
then open this page, paste the deployed `/exec` URL into **Connect your
Apps Script backend**, and click **Connect**. Because access to that
backend is intentionally open (no visitor sign-in), read
[`apps-script/README.md`'s Security section](../apps-script/README.md#security)
before sharing the URL.

## `index.html` — direct Google Sheets + your own sign-in

Same one-time Google Cloud OAuth Client ID as the `frontend/` React app —
see the root [README](../README.md#one-time-setup-google-oauth-client-id)
for the exact steps. Use the same **Authorized JavaScript origins** entry
(`https://<your-username>.github.io`); one Client ID works for both since
they're served from the same origin.

Open the page, paste the Client ID, sign in, then either start a blank
project or load the bundled La Costa Hotel example — each project is its
own spreadsheet, and you can create/switch between several from the
dropdown in the top bar.

## Enabling on GitHub Pages

This repo's Pages source is **Settings → Pages → Build and deployment →
Source: Deploy from a branch**, branch `main`, folder `/docs`. No CI run
needed — live within a minute, and both `index.html` and `apps-script.html`
are served together (at `/` and `/apps-script.html`) since they're just two
pages of the same static site, at `https://<your-username>.github.io/CF/`.

A Pages site can only have **one** active source. If you instead want the
`frontend/` React app live at this repo's Pages URL, see
[the root README's Deploying section](../README.md#deploying) — switching
to it means `index.html`/`apps-script.html` stop being reachable via Pages
until you switch back.
