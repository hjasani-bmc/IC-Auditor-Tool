# IC Payout Tool

Client-side web application that calculates incentive compensation (IC) payouts
for pharmaceutical sales representatives. Built to the v1 requirements:
UI-driven plan configuration, multiple payout mechanisms, data upload, and
reporting — all running in the browser with no backend.

## Tech stack

- **React 19 + Vite + TypeScript** — UI and tooling
- **TailwindCSS** — styling
- **React Router** — navigation across the 4 workflow steps
- **Zustand** — in-session state (plan config + datasets)
- **Recharts** — dashboard charts
- **SheetJS (xlsx)** — Excel/CSV import & export (patched CDN build)
- **Vitest + Testing Library** — unit/component tests

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run test     # run the unit tests once
npm run test:watch
```

## Architecture

v1 is **client-side only** — no backend, no auth, no persistence. All data lives
in browser memory for the session (reload resets to the seeded demo data).

```
src/
  engine/      Pure, dependency-free calculation engine (no React imports).
               Unit-tested in isolation; reusable by a future v2 backend.
  domain/      Shared TypeScript types (the contract between engine, data, UI).
  data/        Seeded demo datasets (61 territories) and curve/grid templates.
  state/       Zustand store wiring plan + data into reactive recompute.
  lib/         Small framework-agnostic helpers (formatting, etc.).
  components/  Shared UI (Layout, ErrorBoundary, reusable widgets).
  pages/       The four workflow screens.
```

### Key conventions

- Attainment and payout values are stored as **fractions** (`1.0` === 100%);
  metric **weights** are the exception (whole-number percent, 0–100).
- The engine is pure: it never imports React, the store, or UI code.
- Every payout is explainable component-by-component (auditability).

## Workflow (screens)

1. **Plan Setup** — plan details, metrics, weights, payout mechanisms
2. **Data** — upload or manually edit actuals & goals
3. **Payout Results** — per-territory table with breakdown + Excel export
4. **Dashboard** — KPI cards, roll-ups, and distribution charts
