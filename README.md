# FleetPulse

Fleet management analytics dashboard. Portfolio project - built around virtualized tables, server-side data flow, charts, and optimistic updates with rollback, tests

Simulated fleet of 200-500 vehicles with ~2 years of history (~1.5M trips, ~500k fuel transactions, ~30k maintenance events)

## Stack

React 19, React Router v7 (framework mode), TypeScript, Tailwind v4, Radix Themes, TanStack Table + Virtual, Recharts, Vitest, RTL, Playwright, Drizzle ORM + Neon Postgres

Node 22+, npm

## Pages

1. Fleet Overview - KPIs, trends, vehicles needing attention - TODO
2. Vehicles Explorer - paginated table with search, status/fuel filters, server-side sorting, and inline status edits - DONE
3. Vehicle Detail - event timeline, charts - TODO
4. Cost Analysis - pivot table with drill-down, aggregations in a Web Worker - TODO
5. Drivers Performance - scatter plot, activity heatmap - TODO
6. Maintenance Forecast - service prediction, 90-day calendar - TODO

## Setup

```bash
cp .env.example .env        # fill DATABASE_URL from Neon
npm install
npm run db:push             # push schema
npm run db:seed             # seed test data
npm run dev
```

App runs at `http://localhost:5173`.

## Scripts

| Script                       | Purpose                        |
| ---------------------------- | ------------------------------ |
| `dev`                        | dev server                     |
| `build` / `start`            | production build and serve     |
| `typecheck`                  | `react-router typegen` + `tsc` |
| `lint` / `lint:fix`          | ESLint flat config             |
| `format` / `format:check`    | Prettier                       |
| `test` / `test:run`          | Vitest (watch / single run)    |
| `db:push`                    | push schema to Neon            |
| `db:generate` / `db:migrate` | SQL migrations                 |
| `db:studio`                  | Drizzle Studio                 |
| `db:seed`                    | seed database                  |

## Structure

```
app/
  routes/          # RR v7 routes (loader/action/component)
  features/        # per-domain logic (vehicles, drivers, ...)
  components/      # reusable UI
  hooks/           # reusable hooks
  lib/             # utils, type helpers
db/
  schema.ts        # Drizzle schema
  seed.ts          # test data generator
  migrations/      # generated SQL migrations
```

## Status

Work in progress
