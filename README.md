# Gigahertz Frontend

React/Vite frontend with Dashboard and Inventory views. Dashboard layout follows its supplied reference; Inventory follows the selected Figma frame, including the dark slate palette, stock status dots, summary strip, product tabs, and table.

## Setup

```bash
npm install
npm run dev
```

The app currently uses mock data in `src/data/dashboard.ts` and `src/data/inventory.ts`. Their service functions are replaceable boundaries for future Supabase access; no backend connection is claimed.

## Dashboard notes

- The sales range control updates the dashboard metrics and sales chart for Today, This Week, and This Month.
- Revenue/Units changes the Top Products values and bar lengths. Search filters the list and shows an empty state when no product matches.
- The theme control and compact-screen navigation are local UI interactions.
- The two-column panels, KPI grid, and chart sizing respond to available width and short desktop viewports.
- The displayed values and advisor tip are demonstration data in `src/data/dashboard.ts`.
- Open Inventory at `/?module=inventory`; return to Dashboard from the sidebar.
- Inventory search filters the displayed mock products, Products/Defective Units switches the table contents, and pagination switches through the 16 mock products. Loading skeletons and a retryable error state are included.
- Inventory figures and initial product rows are demonstration data in `src/data/inventory.ts`. Add Product runs the six-step Figma wizard and adds the result to the replaceable in-memory mock service. Import CSV, filter, and row menu controls are visual only because the system documentation could not be accessed and does not provide verified behavior here.
- The Figma frame reports 12 products but its table footer says 16, and reports 78 out of stock despite the visible table showing one zero-quantity item. These displayed values were retained as shown; confirm intended counts. Figma/documentation visual and business-rule comparison is limited by inaccessible documentation.
