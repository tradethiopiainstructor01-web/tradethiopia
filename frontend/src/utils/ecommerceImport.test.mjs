import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { parsePastedTable, prepareTable, readWorkbook, REFERENCE_COLUMNS } from './ecommerceImport.js';

test('pasted Excel cells preserve leading zeros, multiline notes, blank cells and quotes', () => {
  const rows = parsePastedTable('Company\tPhone\tNote\r\nExample\t0911234567\t"Call tomorrow\nAsked for ""pricing"""\r\nOther\t\t');
  assert.deepEqual(rows[1], ['Example', '0911234567', 'Call tomorrow\nAsked for "pricing"']);
  assert.deepEqual(rows[2], ['Other', '', '']);
});

test('quoted CSV and semicolon tables are accepted without splitting quoted delimiters', () => {
  assert.deepEqual(parsePastedTable('Name,Note\n"Example, PLC","a,b"')[1], ['Example, PLC', 'a,b']);
  assert.deepEqual(parsePastedTable('Name;Phone\nExample;0911234567')[1], ['Example', '0911234567']);
  assert.throws(() => parsePastedTable('Name,Note\nExample,"unfinished'), /unfinished/);
});

test('deduplicates complete rows, keeping changed follow-up data and skipping blank lines', () => {
  const data = prepareTable([['Name', 'Phone', 'Note'], ['Example', '0911234567', 'Call'], [' example ', '0911234567', 'CALL'], ['Example', '0911234567', 'Later'], ['', '', '']]);
  assert.equal(data.rows.length, 2);
  assert.equal(data.duplicates, 1);
  assert.equal(data.rows[0][1], '0911234567');
});

test('reference workbook can be imported as a header-only template', () => {
  const result = prepareTable([REFERENCE_COLUMNS]);
  assert.deepEqual(result.columns, REFERENCE_COLUMNS);
  assert.deepEqual(result.rows, []);
});

test('headerless paste keeps the first record and current columns', () => {
  const data = prepareTable([['Example', '0911234567']], { hasHeaders: false, fallbackColumns: ['Name', 'Phone'] });
  assert.deepEqual(data.columns, ['Name', 'Phone']);
  assert.equal(data.rows.length, 1);
});

test('start row and arbitrary columns work, with blank or repeated headings made unique', () => {
  const data = prepareTable([['Title'], ['Name', 'Name', ''], ['A', 'B', 'C']], { headerRow: 2 });
  assert.deepEqual(data.columns, ['Name', 'Name (2)', 'Column 3']);
  assert.deepEqual(data.rows, [['A', 'B', 'C']]);
});

test('Excel worksheets retain custom column order, number display formats and dates', async () => {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([['Phone', 'Date', 'Company'], [911234567, 46200, 'Example']]);
  sheet.A2.z = '0000000000'; sheet.B2.z = 'yyyy-mm-dd';
  XLSX.utils.book_append_sheet(book, sheet, 'Leads');
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([REFERENCE_COLUMNS]), 'Template');
  const bytes = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
  const sheets = await readWorkbook({ name: 'leads.xlsx', size: bytes.length, arrayBuffer: async () => bytes });
  assert.equal(sheets.length, 2);
  assert.equal(sheets[0].matrix[1][0], '0911234567');
  assert.match(sheets[0].matrix[1][1], /^2026-\d{2}-\d{2}$/);
  assert.deepEqual(prepareTable(sheets[0].matrix).columns, ['Phone', 'Date', 'Company']);
  assert.equal(prepareTable(sheets[1].matrix).rows.length, 0);
});

test('CSV import preserves text phone numbers and rejects unsupported files', async () => {
  const bytes = new TextEncoder().encode('Phone,Company\n0911234567,Example');
  const sheets = await readWorkbook({ name: 'leads.csv', size: bytes.length, arrayBuffer: async () => bytes });
  assert.equal(sheets[0].matrix[1][0], '0911234567');
  await assert.rejects(readWorkbook({ name: 'bad.pdf', size: 10 }), /Choose an Excel/);
  await assert.rejects(readWorkbook({ name: 'large.xlsx', size: 21 * 1024 * 1024 }), /20 MB or less/);
});

test('uploaded workbook rows go into the selected table without duplicates', async () => {
  const { importWorkbookSheets } = await import('./ecommerceImport.js');
  const saved = [];
  const save = async (batch) => { saved.push(batch); return { added: batch.rows.length, duplicates: 0, data: { _id: batch.name, name: batch.name } }; };
  const single = await importWorkbookSheets([{ name: 'Sheet1', matrix: [['Company Name', 'Phone'], ['A', '0911'], ['A', '0911'], ['B', '0922']] }], save, () => {}, { targetName: 'E-commerce subscription' });
  assert.equal(saved[0].name, 'E-commerce subscription');
  assert.equal(single.added, 2);
  assert.equal(single.duplicates, 1);
  saved.length = 0;
  await importWorkbookSheets([{ name: 'S1', matrix: [['Name'], ['A']] }, { name: 'Empty', matrix: [] }, { name: 'S2', matrix: [['Name'], ['B']] }], save, () => {}, { targetName: 'T' });
  assert.deepEqual(saved.map((b) => b.name), ['T - S1', 'T - S2']);
  saved.length = 0;
  await importWorkbookSheets([{ name: 'S', matrix: [['Acme', '0911']] }], save, () => {}, { targetName: 'T', fallbackColumns: ['Company', 'Phone'] });
  assert.deepEqual(saved[0].columns, REFERENCE_COLUMNS);
  assert.deepEqual(saved[0].rows, [['Acme', '', '0911', '', '', '', '', '', '']]);
});

test('large imports use few batches sent in parallel with offsets for file order', async () => {
  const { importPreparedTables, importBatches } = await import('./ecommerceImport.js');
  const rows = Array.from({ length: 12000 }, (_, i) => [`Company ${i}`, String(i)]);
  assert.deepEqual([...importBatches(rows)].map((b) => b.length), [5000, 5000, 2000]);
  let active = 0; let peak = 0; const offsets = [];
  const save = async (batch) => {
    active++; peak = Math.max(peak, active); offsets.push(batch.offset);
    await new Promise((r) => setTimeout(r, 10)); active--;
    return { added: batch.rows.length, duplicates: 0, data: { _id: 't', name: batch.name, rowCount: batch.offset + batch.rows.length } };
  };
  const result = await importPreparedTables([{ name: 'T', columns: ['A', 'B'], widths: [], rows, duplicates: 0 }], save);
  assert.equal(result.added, 12000);
  assert.deepEqual(offsets.sort((a, b) => a - b), [0, 5000, 10000]);
  assert.equal(peak, 2); // first batch alone, then the remaining two together
  assert.equal(result.tables[0].rowCount, 12000);
});

test('similar column names fit the standard 9 columns; headerless contacts by content', async () => {
  const { prepareWorkbookSheets, REFERENCE_COLUMNS: cols } = await import('./ecommerceImport.js');
  const [t, ...rest] = prepareWorkbookSheets([
    { name: 'A', matrix: [['Mobile', 'Organization', 'E-mail', 'Note'], ['0911 223344', 'Abebe Trading', 'a@abebe.com', 'Wants demo'], ['0911 223344', 'Abebe Trading', 'a@abebe.com', 'Wants demo']] },
    { name: 'B', matrix: [['Kebede PLC', '+251922334455', 'k@kebede.et']] },
  ], { targetName: 'E-commerce subscription', fallbackColumns: cols, fileName: 'leads.xlsx' });
  assert.equal(rest.length, 0);
  assert.equal(t.name, 'E-commerce subscription');
  assert.deepEqual(t.rows, [
    ['Abebe Trading', '', '0911 223344', 'a@abebe.com', '', '', '', '', ''], // Note is for agents, not imports
    ['Kebede PLC', '', '+251922334455', 'k@kebede.et', '', '', '', '', ''],
  ]);
  assert.equal(t.duplicates, 1);
});

test('files with other columns become their own table: standard columns first, then the Excel columns', async () => {
  const { prepareWorkbookSheets, REFERENCE_COLUMNS: cols } = await import('./ecommerceImport.js');
  const header = ['Nationality', 'DateRegistered', 'BusinessNameAmharic', 'ManagerFName', 'Phone', 'LicenceNumber'];
  const row = ['Ethiopian', '12/17/24 20:37', 'ሃሰን', 'MENGISTU', '0907746965', 'SM/ST/05/777777'];
  const tables = prepareWorkbookSheets([{ name: 'Sheet1', matrix: [header, row, row] }], { targetName: 'E-commerce subscription', fallbackColumns: cols, fileName: 'Somali region.xlsx' });
  assert.equal(tables.length, 1);
  assert.equal(tables[0].name, 'Somali region');
  assert.deepEqual(tables[0].columns, [...cols, 'ManagerFName', 'Nationality', 'DateRegistered', 'LicenceNumber']);
  assert.deepEqual(tables[0].rows, [['ሃሰን', '', '0907746965', '', '', '', '', '', '', 'MENGISTU', 'Ethiopian', '12/17/24 20:37', 'SM/ST/05/777777']]);
  assert.equal(tables[0].duplicates, 1);
});

test('files already in the standard format import column for column', async () => {
  const { prepareWorkbookSheets, REFERENCE_COLUMNS: cols } = await import('./ecommerceImport.js');
  const row = ['Acme', 'Website', '0911234567', 'info@acme.com', 'Manager', 'Allowed', 'New', '2026-12-01', 'Call'];
  const [t] = prepareWorkbookSheets([{ name: 'S', matrix: [cols, row] }], { targetName: 'T', fallbackColumns: cols });
  assert.deepEqual(t.rows, [[...row.slice(0, 8), '']]);
});

test('existing tables show standard fields first, then additional fields, without moving stored values', async () => {
  const { displayOrder, REFERENCE_COLUMNS: cols } = await import('./ecommerceImport.js');
  const columns = ['Tin', 'LegalStatusNameEng', 'BusinessName', 'ManagerFName', 'ManagerPhone', 'Email', 'BusinessDescriptionRegion', 'BusinessTelephone'];
  assert.deepEqual(displayOrder(columns).map((i) => columns[i]),
    ['BusinessName', 'ManagerPhone', 'BusinessTelephone', 'Email', 'ManagerFName', 'Tin', 'LegalStatusNameEng', 'BusinessDescriptionRegion']);
  assert.deepEqual(displayOrder([...cols, 'City']), [...cols.keys(), 9]); // standard-first tables keep their order
});

test('different Excel column orders, separators and widths produce the same standard layout', async () => {
  const { prepareWorkbookSheets, REFERENCE_WIDTHS } = await import('./ecommerceImport.js');
  const options = { targetName: 'T', fallbackColumns: REFERENCE_COLUMNS };
  const [first] = prepareWorkbookSheets([{ name: 'A', widths: [400, 100, 300, 100], matrix: [
    ['Phone_Number', 'Company_Name', 'Lead_Source', 'Contact_Role'],
    ['0911223344', 'Acme', 'Website', 'Owner'],
  ] }], options);
  const [second] = prepareWorkbookSheets([{ name: 'B', widths: [100, 400, 100, 300], matrix: [
    ['Contact Role', 'Lead source', 'Business Name', 'Mobile'],
    ['Owner', 'Website', 'Acme', '0911223344'],
  ] }], options);
  assert.deepEqual(first, second);
  assert.deepEqual(first.columns, REFERENCE_COLUMNS);
  assert.deepEqual(first.widths, REFERENCE_WIDTHS);
  assert.deepEqual(first.rows, [['Acme', 'Website', '0911223344', '', 'Owner', '', '', '', '']]);
});

test('explicit standard headings take priority over aliases without losing the other field', async () => {
  const { mapTableToReference } = await import('./ecommerceImport.js');
  const result = mapTableToReference(prepareTable([
    ['Customer Name', 'Company Name', 'Phone'], ['Abebe', 'Acme PLC', '0911223344'],
  ]));
  assert.deepEqual(result.columns, [...REFERENCE_COLUMNS, 'Customer Name']);
  assert.equal(result.rows[0][0], 'Acme PLC');
  assert.equal(result.rows[0][9], 'Abebe');
});

test('blank named extra columns survive templates and imports with consistent widths', async () => {
  const { mapTableToReference, REFERENCE_WIDTHS } = await import('./ecommerceImport.js');
  for (const matrix of [[['Company', 'Region']], [['Company', 'Region'], ['Acme', '']]]) {
    const result = mapTableToReference(prepareTable(matrix, { widths: [400, 390] }));
    assert.deepEqual(result.columns, [...REFERENCE_COLUMNS, 'Region']);
    assert.deepEqual(result.widths, [...REFERENCE_WIDTHS, 170]);
    if (result.rows.length) assert.equal(result.rows[0][9], '');
  }
});

test('saved column presentation follows the standard order and fixed widths regardless of original positions', async () => {
  const { displayOrder, tableColumnWidth, REFERENCE_WIDTHS } = await import('./ecommerceImport.js');
  const columns = [...REFERENCE_COLUMNS].reverse();
  const original = [...columns];
  const order = displayOrder(columns);
  assert.deepEqual(order.map((i) => columns[i]), REFERENCE_COLUMNS);
  assert.deepEqual(order.map((i) => tableColumnWidth(columns[i])), REFERENCE_WIDTHS);
  assert.deepEqual(columns, original);
  assert.equal(tableColumnWidth('Mobile'), tableColumnWidth('official business phone'));
  assert.equal(tableColumnWidth('Region'), 170);
});

test('too many extra columns are rejected before sending an invalid standardized table', async () => {
  const { mapTableToReference } = await import('./ecommerceImport.js');
  const columns = Array.from({ length: 92 }, (_, i) => `Extra ${i}`);
  assert.throws(() => mapTableToReference({ columns, rows: [] }), /exceeds 100 columns/);
});

test('import keeps one row per contact: same phone in any format is a duplicate', async () => {
  const { prepareWorkbookSheets, REFERENCE_COLUMNS: cols } = await import('./ecommerceImport.js');
  const header = ['BusinessName', 'MangerPhone', 'BussinessTelephone', 'Code'];
  const matrix = [header,
    ['MENGISTU ASHAME HASSEN', '0907746965', '0907746965', '61632'],
    ['MENGISTU ASHAME HASSEN', '0907746965', '0907746965', '61633'],
    ['NEJIB ADEN HASSEN', '+251915731831', '', '51111'],
    ['NEJIB ADEN HASSEN', '0915731831', '0915731831', '51112']];
  const [t] = prepareWorkbookSheets([{ name: 'S', matrix }], { targetName: 'T', fallbackColumns: cols, fileName: 'reg.xlsx' });
  assert.deepEqual(t.rows.map((r) => [r[0], r[2], r.at(-1)]), [['MENGISTU ASHAME HASSEN', '0907746965', '61632'], ['NEJIB ADEN HASSEN', '+251915731831', '51111']]);
  assert.equal(t.duplicates, 2);
});
