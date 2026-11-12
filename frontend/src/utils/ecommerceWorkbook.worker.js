import * as XLSX from 'xlsx';
import { parseWorkbook, prepareWorkbookSheets } from './ecommerceImport';

// Parse and de-duplicate off the main thread so large workbooks don't freeze the page.
self.onmessage = ({ data: { bytes, options } }) => {
  try {
    self.postMessage({ prepared: prepareWorkbookSheets(parseWorkbook(XLSX, bytes), options) });
  } catch (error) {
    self.postMessage({ error: error.message || 'Unable to read this file.' });
  }
};
