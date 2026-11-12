# eCommerce numbered pagination

The Cold Call and Bulk SMS tables show clickable page numbers between Previous and Next. The current page is highlighted and announced as the current page to assistive technology. Selecting a number loads that page using the existing server pagination (50 rows per page).

For large result sets, show the first and last page plus a window of up to five pages around the current page, with ellipses for gaps. Controls wrap on narrow screens. Current-page, boundary and loading/saving actions are disabled as appropriate. Search results determine the page count; changing the search or selected table resets to page 1. Empty tables show only page 1. No API, schema or stored-data changes.
