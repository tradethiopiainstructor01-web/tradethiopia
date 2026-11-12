# eCommerce column-menu checks

Backend regression command: `cd backend && npm run test:ecommerce`.
Frontend import regression command: `cd frontend && npm run test:ecommerce`.
Scoped lint command: `cd frontend && ./node_modules/.bin/eslint src/components/sales/EcommerceOutreachPage.jsx src/services/ecommerceTableService.js`.

Controller tests mock MongoDB and cover archive/restore persistence, exact row/value retention, repeated imports, owner/tab isolation, malformed input, out-of-range indices, the last-column guard and concurrent revision conflicts. They never connect to a live database.

Browser acceptance (use isolated test fixtures):
1. Right-click a saved column and choose Delete column. Reload; the column stays removed.
2. Check the row editor and export omit the removed column. Restore it and verify original values return.
3. Fail a visibility request with 409; the column must remain visible and an error must appear.
4. Use the three-dot menu on mobile and Shift+F10/Escape with keyboard focus on its button.
5. Remove a phone column in Bulk SMS; it must leave the recipient-column selector. Cold Call must remain unaffected.
6. Remove all but one column; the last column's action button must be disabled. Direct API attempts must return 400.
7. Repeat the original import; duplicates are still skipped and removed columns remain removed.

The isolated Playwright check exercised these UI flows with mocked API responses, including an actual XLSX download. A Vite production build of the isolated page passed. No live database or SMS service was accessed. No test dependency was added.

This JavaScript repository has no configured typecheck script. An ad-hoc TypeScript check of the page's import graph reports existing errors in importer callback/type inference and Axios custom fields; these are separate from the column feature. The unchanged baseline had 14 diagnostics; the updated page has 13, with no new diagnostics. Scoped ESLint and JavaScript syntax checks pass.
