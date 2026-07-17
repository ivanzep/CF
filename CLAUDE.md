# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CF ("Cashflow Tracker") is a cashflow tracking tool for real estate development projects. It's fully static/client-side: the browser talks directly to the Google Sheets API (or a thin Apps Script proxy), and each project's data lives in its own Google Sheet. There is no server and no database in this repo.

## The four parallel implementations — read this before editing anything

This repo contains **the same app implemented four separate times**, and they are *not* built from a shared source — each is hand-maintained independently:

| | `frontend/` | `docs/index.html` | `docs/apps-script-v0.2.html` + `apps-script/Code.gs` | `docs/apps-script-v0.1.html` |
|---|---|---|---|---|
| Tech | React/TS/Vite, built with npm | Single-file vanilla HTML/CSS/JS | Single-file vanilla HTML/CSS/JS + Apps Script backend | Single-file vanilla HTML/CSS/JS (legacy) |
| Talks to | Sheets API directly | Sheets API directly | `apps-script/Code.gs` over JSONP/hidden-form (CORS workaround) | superseded |
| Auth | Google OAuth Client ID | Google OAuth Client ID | none (Apps Script runs as the deployer) | — |

**Check `git log` before assuming a feature exists everywhere.** As of this writing, `frontend/` and `docs/index.html` were last kept in sync with `docs/apps-script-v0.2.html`/`apps-script/Code.gs` around commit `c73a2f0`/`19cc443`. Every commit since then (recurring-draws refinements, Budget tab, CSV import, detailed cap-table waterfall, print-settings persistence, cell coloring, etc.) has only touched `docs/apps-script-v0.2.html` and `apps-script/Code.gs` — `frontend/` and `docs/index.html` do **not** have those features. Don't assume parity; grep/diff the actual files.

When asked to add a feature "to the app" without qualification, ask which variant(s) — or check which one recent commits have been targeting (currently `docs/apps-script-v0.2.html` + `apps-script/Code.gs`) — before picking a scope. When porting a feature between variants, the calculation logic (schedule spreading, cap table pro-rata math, summary aggregation, recurring draw generation) needs to be reimplemented in the target's style (typed `frontend/src/lib/*.ts` module vs. inline vanilla-JS function), not copy-pasted verbatim.

GitHub Pages serves `docs/` (`main` branch, `/docs` folder) — `docs/index.html` and `docs/apps-script-v0.2.html` are what's actually live. `frontend/` is not auto-deployed; it must be built and hosted separately (see README's "Deploying" section) since a Pages site can only have one active source.

## `frontend/` — commands

```sh
cd frontend
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run build       # tsc -b (typecheck via project references) && vite build -> frontend/dist/
npm run lint        # oxlint
npm run preview      # preview a production build
```

There is no test suite (`playwright` is a devDependency but there's no `test` script, config, or spec files yet — don't assume Playwright tests exist). `npm run build` runs the TypeScript project-reference build (`tsconfig.app.json` / `tsconfig.node.json`) before bundling, so a broken type is a build failure, not just a lint warning. There's no single-test invocation because there are no tests to target.

The other three variants (`docs/index.html`, `docs/apps-script-v0.2.html`, `docs/apps-script-v0.1.html`) are single self-contained HTML files with no build step — edit and open directly in a browser, or serve statically.

## `frontend/` architecture

Data flow: **Google Sheet (raw rows) → `lib/sheets/mapping.ts` → typed `Project` (`types.ts`) → `lib/*` calculators → `Summary` → React components.** Writes go the other direction through the same mapping layer.

- **`src/types.ts`** — the domain model (`Project`, `LineItem`, `Draw`, `CapTableMember`, computed `Summary`, etc.). Read this first; almost everything else is a transform over these shapes.
- **`src/lib/sheets/client.ts`** — raw Google Sheets API calls (`createSpreadsheet`, `readAllTabs`, `writeTab`). `TAB_SCHEMA` here is the single source of truth for each sheet tab's column order; a spreadsheet's tabs are always fully cleared and rewritten on save (no partial row updates).
- **`src/lib/sheets/mapping.ts`** — converts raw tab rows (`string[][]`) to/from the typed `Project`. Column order in `parseProject`/`toRows` must match `TAB_SCHEMA` positionally.
- **`src/lib/sheets/auth.ts`** — Google Identity Services OAuth token flow (client-side only, token cached in `localStorage`, no client secret involved).
- **`src/api.ts`** — the app's only data-access surface (`export const api = {...}`). Holds a single in-memory `cache` of `{ spreadsheetId, project }` — there is no multi-project cache, so switching projects reloads from Sheets. Every mutation follows: mutate the cached `Project` in place → `persist([...tab names])` (recomputes derived schedules, then rewrites only the named tabs) → return the updated slice. `requireCache(id)` throws if no project is loaded or the wrong project is loaded, so mutation functions can't run before `getProject`/`createProject`.
- **`src/hooks.ts`** — TanStack Query wrappers around `api`. `useProjectMutations(projectId)` returns every mutation hook, each invalidating `["project", id]`, `["summary", id]`, and `["projects"]` on success — there's no optimistic updates, just refetch-on-success.
- **Pure calculation modules in `src/lib/`** (no React, no I/O — safe to unit-test in isolation if tests are ever added):
  - `schedule.ts` — spreads a line item's `totalBudget` evenly across months (`computeEvenSchedule`, last month absorbs rounding remainder) or reads its custom `payments` list, depending on `scheduleMode`.
  - `capTable.ts` — `computeCapTable` derives ownership %: manual overrides are honored as-is, and the remaining percentage is split pro-rata by contribution among members without a manual override. `autoSplitAmount` distributes a distribution amount across members by ownership %, with the last row absorbing rounding remainder (this "last item eats the remainder" pattern recurs in `schedule.ts` and `recurringDraws.ts` too — keep it consistent when adding similar allocation logic).
  - `summary.ts` — `buildSummary` is the single place that assembles the `Summary` shown in the UI: derives the project's overall month range from all schedules/draws, buckets each line item's schedule into a per-category monthly grid, and folds in cap table totals.
  - `recurringDraws.ts`, `annualDrawSummary.ts`, `csvExport.ts`, `printLayout.ts`, `monthNotes.ts`, `format.ts`, `id.ts` — single-purpose helpers; `id.ts`'s `genId(prefix)` is how every entity ID is minted client-side (Sheets has no autoincrement).
  - `registry.ts` — tracks which spreadsheet IDs are "known projects" in `localStorage` (per-browser; there's no server-side list of a user's projects).
- **`src/components/`** — one component per UI section (`LineItemsSection`, `DrawsSection`, `CapTableSection`, `CashflowSummarySection`, `PrintPages`, etc.), composed in `App.tsx` behind a tab bar (`line-items` / `summary` / `draws` / `cap-table`). `App.tsx` also owns print-preview state (`previewMode`, `printSettings`) and pushes it into `document.body` classes / CSS custom properties / an injected `@page` stylesheet rather than through component props, since print layout is a global, cross-cutting concern.

## Sheet schema

Each project spreadsheet has tabs: `Project`, `Categories`, `LineItems`, `Payments`, `Draws`, `CapTable`, `Contributions`, `Distributions` (the `frontend/`/`docs/index.html` set — see `TAB_SCHEMA` in `frontend/src/lib/sheets/client.ts` for exact column order). `apps-script/Code.gs`'s backend additionally has `CapitalReturns`, `BudgetSections`, `BudgetItems`, `BudgetPayments`, `CellColors` for its extra Budget/detailed-cap-table/coloring features — the tab sets are **not** identical between variants. Row 1 is always the header; both the read and write paths key strictly on column position, not header names, so reordering `TAB_SCHEMA` (or the equivalent in `Code.gs`) is a breaking change for existing spreadsheets.

## Conventions worth preserving

- IDs are client-generated (`genId(prefix)` / equivalent), never assigned by Sheets.
- Nullable domain fields use `null`, not `undefined` or `""`, and mapping code treats empty spreadsheet cells as `null` (see `strOrNull`/`numOrNull` in `mapping.ts`).
- Monetary rounding: round to cents (`Math.round(n * 100) / 100`) except cap table ownership percentages, which round to 4 decimals.
- When splitting a total across N buckets (monthly schedule, auto-split distribution, recurring draws), compute all but the last bucket normally and let the last bucket absorb the rounding remainder, so the sum always exactly equals the input total.
- No abstraction layer beyond `api.ts`/`hooks.ts` — components call `useProjectMutations`/query hooks directly rather than going through additional context providers or stores.
