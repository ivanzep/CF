# CF — Cashflow Tracking Tool

A cashflow tracking tool for real estate development projects, based on the
"La Costa Hotel" monthly cashflow spreadsheet. Lets you:

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

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.
- **Frontend**: React, TypeScript, Vite, TanStack Query, Recharts.

## Setup

### 1. Database

Create a local Postgres database and user (adjust as needed):

```sh
sudo -u postgres psql -c "CREATE USER cf_app WITH PASSWORD 'cf_app_dev_pw' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE cf_dev OWNER cf_app;"
```

### 2. Backend

```sh
cd backend
npm install
cp .env.example .env   # if starting fresh; already present with a local dev DATABASE_URL
npx prisma migrate dev
npm run seed            # loads the La Costa Hotel example project
npm run dev              # starts the API on http://localhost:4000
```

### 3. Frontend

```sh
cd frontend
npm install
npm run dev              # starts the app on http://localhost:5173 (proxies /api to :4000)
```

Open http://localhost:5173.
