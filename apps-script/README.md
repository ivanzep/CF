# Cashflow Tracker — Google Apps Script version

A simpler alternative to the `frontend/` GitHub Pages app: a Google Sheet
with a bound Apps Script that serves its own web app UI directly from
`script.google.com`. No OAuth Client ID, no GitHub Pages, no build step —
just paste three files into the Apps Script editor and deploy.

The sheet itself holds all the data (same tabs as the other version:
`Project`, `Categories`, `LineItems`, `Payments`, `Draws`, `CapTable`,
`Contributions`, `Distributions`), created automatically the first time the
script runs.

## Setup (about 3 minutes)

1. **Create a blank Google Sheet.** Go to [sheets.new](https://sheets.new)
   and give it a name, e.g. "Cashflow Tracker Data".
2. **Open the script editor.** In the sheet, go to
   **Extensions → Apps Script**.
3. **Add the three files from this folder:**
   - Delete the default `Code.gs` content and replace it with this repo's
     [`Code.gs`](./Code.gs).
   - Click **+ → Script** to add a new file named `ExampleData`, and paste
     in [`ExampleData.gs`](./ExampleData.gs)'s content.
   - Click **+ → HTML** to add a new file named `Index`, and paste in
     [`Index.html`](./Index.html)'s content.
   - Open **Project Settings** (the gear icon) → **Show "appsscript.json"
     manifest file in editor**, then open `appsscript.json` and replace its
     content with this folder's [`appsscript.json`](./appsscript.json).
4. **Save** (Ctrl/Cmd+S), then **Deploy → New deployment**:
   - Select type **Web app**.
   - Execute as: **Me**.
   - Who has access: **Only myself** (or **Anyone** if you want to share it
     — everyone who opens it will see and edit the same sheet, since the
     script always runs as you).
   - Click **Deploy**, and authorize the requested permissions (it needs to
     read/write the spreadsheet it's bound to).
5. Open the **Web app URL** it gives you — that's your working app. Bookmark
   it; it stays the same across future re-deployments as long as you choose
   **Manage deployments → Edit → New version** instead of creating a
   brand-new deployment.

## Using it

On first open, the sheet has no data yet — click **Load La Costa Hotel
example** to populate it with the real example numbers, or **Start blank**
to build your own project from scratch. Every edit (line items, schedules,
draws, cap table) saves back to the spreadsheet automatically; you can open
the sheet directly at any time to see the raw data or make a backup copy.

## Updating the code later

If you change `Code.gs`, `ExampleData.gs`, or `Index.html` in this repo,
copy the updated content into the corresponding file in the Apps Script
editor, save, then **Deploy → Manage deployments → Edit (pencil icon) →
New version → Deploy** to push the update live at the same URL.
