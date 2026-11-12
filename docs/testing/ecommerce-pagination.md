# eCommerce numbered-pagination verification

Use isolated fixtures for Cold Call and Bulk SMS:

1. With 120 rows, click 2: page 2 is highlighted, row numbering begins at 51, and Previous/Next move to pages 1/3.
2. With 1,000 rows, verify bounded page buttons with ellipses. Click 20, then a nearby page; the correct rows and current-page marker follow.
3. Enter a search with one page of results; pagination resets to 1. An empty search result also reports page 1 of 1.
4. Switch between Cold Call and Bulk SMS; each table's navigation remains independent.
5. At a narrow viewport, all navigation buttons remain reachable without overflowing the viewport. Page controls disable while loading or saving.

Regression commands: `npm run test:ecommerce` in both backend and frontend; frontend `./node_modules/.bin/eslint src/components/sales/EcommerceOutreachPage.jsx`.

The isolated Playwright browser checks use the actual component with mocked API data, without accessing live records. The repository has no configured typecheck script; ad-hoc TypeScript checks still report the same 13 existing diagnostics in the page's import graph.
