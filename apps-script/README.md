# Cashflow Tracker — Google Apps Script backend

A JSON API backed by a Google Sheet you pick, deployed as an Apps Script
web app. **No Google Cloud Console, no OAuth Client ID.** The UI is a
separate static page — [`docs/apps-script.html`](../docs/apps-script.html)
— that you can host anywhere, including GitHub Pages; it talks to this
backend over plain HTTP.

The spreadsheet holds all the data (tabs: `Project`, `Categories`,
`LineItems`, `Payments`, `Draws`, `CapTable`, `Contributions`,
`Distributions`), created automatically the first time the script runs —
added alongside whatever else is already in the sheet, so this works on a
brand-new sheet or one you already use.

## Setup (about 3 minutes)

1. **Open the spreadsheet you want to use.** Any Google Sheet works — a
   brand-new one from [sheets.new](https://sheets.new), or one you already
   have.
2. **Open the script editor.** In that sheet, go to
   **Extensions → Apps Script**.
3. **Add the files from this folder:**
   - Delete the default `Code.gs` content and replace it with this repo's
     [`Code.gs`](./Code.gs).
   - Click **+ → Script** to add a new file named `ExampleData`, and paste
     in [`ExampleData.gs`](./ExampleData.gs)'s content.
   - Open **Project Settings** (the gear icon) → **Show "appsscript.json"
     manifest file in editor**, then open `appsscript.json` and replace its
     content with this folder's [`appsscript.json`](./appsscript.json).
4. **Save** (Ctrl/Cmd+S), then **Deploy → New deployment**:
   - Select type **Web app**.
   - Execute as: **Me**.
   - Who has access: **Anyone**. (This must be "Anyone," not "Only myself"
     — the static page calling this API isn't signed in as you, so a
     restricted deployment will reject its requests. See **Security**
     below for what this means.)
   - Click **Deploy**, and authorize the requested permissions (it needs to
     read/write the spreadsheet it's bound to). This is the one standard
     Google permission prompt — there's no separate Cloud Console project
     to create.
5. Copy the **Web app URL** it gives you (ends in `/exec`).
6. Open [`docs/apps-script.html`](../docs/apps-script.html) (locally, or
   wherever you've hosted it — see that file's section in the
   [docs README](../docs/README.md)), paste the URL into **Connect your
   Apps Script backend**, and click **Connect**.

## Using it

On first connect there's no data yet — click **Load La Costa Hotel
example** to populate it with the real example numbers, or **Start blank**
to build your own project. Every edit (line items, schedules, draws, cap
table) saves back to the spreadsheet; open the sheet directly at any time
to see the raw data or make a backup copy.

## Security

Because the deployment must be **Anyone** access for the static page to
reach it without a Google sign-in, **anyone who has the `/exec` URL can
read and write this spreadsheet** — the script always runs as you
regardless of who calls it. Treat that URL like a shared secret (don't
post it publicly).

For a bit more protection, set a **Script Property** named `API_TOKEN`
(Project Settings → Script Properties → Add script property) to any random
string. Once set, every request must include a matching token or it's
rejected with "Unauthorized." Enter the same value in the **Shared token**
field on the `docs/apps-script.html` setup screen.

## Updating the code later

If you change `Code.gs` or `ExampleData.gs` in this repo, copy the updated
content into the corresponding file in the Apps Script editor, save, then
**Deploy → Manage deployments → Edit (pencil icon) → New version → Deploy**
to push the update live at the same URL.
