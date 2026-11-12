# eCommerce column visibility API

`PATCH /api/ecommerce-tables/:channel/:id/columns/:columnIndex`

Uses the existing authenticated ecommerce router. Channel is `cold-call` or `bulk-sms`; only the table owner can change its columns. `columnIndex` is the original zero-based stored index, not the displayed position.

Request: `{ "archived": true, "revision": 3 }`. Use `false` to restore a column. Requires a boolean archived value and a nonnegative safe-integer revision. Response: `{ "success": true, "data": { "archivedColumns": [2], "revision": 4 } }`.

Invalid input or removing the last visible column returns 400. Missing/out-of-range columns, missing tables, wrong owners and wrong tabs return 404. A stale revision or concurrent update returns 409. The update atomically matches owner, channel, table ID and revision. It only sets column visibility metadata and increments revision; it does not invoke legacy row cleanup or modify row records.
