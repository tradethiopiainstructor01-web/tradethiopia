# eCommerce column metadata and data impact

The employee portal is the existing MongoDB/Mongoose application in `tradethiopia`. Additive field: `EcommerceTable.archivedColumns`, an array of original column indices defaulting to `[]`. Tables created before this field behave as if every column is visible. Existing table/row relationships are unchanged; ERD relationship remains `EcommerceTable` 1:N `EcommerceTableRow`.

Expected data impact: a column removal/restoration writes only this array plus the table revision/timestamp. No columns, row values, fingerprints, contact keys, import identity keys or records are removed. No data backfill, database migration command or new index is required for the optional Mongoose field; this application does not use Prisma. Original column positions stay stable across edit, import and export operations. Atomic revision matching prevents concurrent visibility changes from overwriting one another.

The visibility endpoint deliberately does not call the existing ownedTable helper, because that helper can trigger legacy row migration/cleanup. This feature introduces no cleanup operation. Roll out the backend route/model before the frontend. Older frontends ignore the optional metadata.
