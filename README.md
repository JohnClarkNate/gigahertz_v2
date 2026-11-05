# Gigahertz Dashboard

Dashboard-only React/Vite frontend for the current implementation batch. Its current layout and colors follow the supplied Dashboard reference: slate navigation and panels, soft gray text, fine blue-gray dividers, a pale blue sales chart, and amber/red stock warnings. The Dashboard uses a compact KPI row, advisor and inventory status panels, then sales and top products side by side.

## Setup

```bash
npm install
npm run dev
```

The app currently uses mock data in `src/data/dashboard.ts`. `getDashboardData` is the replaceable data boundary for a future Supabase service; no backend connection is claimed in this batch.

## Dashboard notes

- The sales range control updates the dashboard metrics and sales chart for Today, This Week, and This Month.
- Revenue/Units changes the Top Products values and bar lengths. Search filters the list and shows an empty state when no product matches.
- The theme control and compact-screen navigation are local UI interactions.
- The two-column panels, KPI grid, and chart sizing respond to available width and short desktop viewports.
- The displayed values and advisor tip are demonstration data in `src/data/dashboard.ts`.
- Inventory, POS, and other modules are intentionally out of scope.
