export const REFERENCE_COLUMNS = [
  'Company Name', 'Lead source', 'official business phone', 'business email',
  'contact role', 'permission/contact status', 'lead stage', 'next follow-up date', 'Note',
];
export const REFERENCE_WIDTHS = [170, 150, 190, 190, 150, 210, 150, 180, 240];
export const REFERENCE_CATEGORIES = [
  'E-commerce subscription', 'digital marketing for int trade', 'ai for business',
  'data science for business', 'cybersecurity', 'other technology training',
  'business consultancy', 'digital marketing services', 'Business Leadership',
];
// Must match the server's normalize(). NFKC leaves ASCII unchanged, so it is skipped for ASCII cells.
export const normalizeCell = (value) => {
  const text = String(value ?? '');
  return (/[\u0080-\uffff]/.test(text) ? text.normalize('NFKC') : text).trim().replace(/\s+/g, ' ').toLowerCase();
};

// Parse Excel/Sheets clipboard TSV and quoted CSV, including multiline cells.
export function parsePastedTable(text) {
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  let quoted = false;
  let firstLine = '';
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') quoted = !quoted;
    if (c === '\n' && !quoted) break;
    if (!quoted) firstLine += c;
  }
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(',') ? ',' : firstLine.includes(';') ? ';' : '\t';
  const rows = [];
  let row = [];
  let cell = '';
  quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"' && (quoted || !cell)) {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === delimiter || c === '\n')) {
      row.push(cell); cell = '';
      if (c === '\n') { rows.push(row); row = []; }
    } else cell += c;
  }
  if (quoted) throw new Error('A quoted cell is unfinished. Paste the complete table again.');
  row.push(cell); rows.push(row);
  return rows;
}

export function prepareTable(matrix, { hasHeaders = true, headerRow = 1, fallbackColumns = [], widths = [] } = {}) {
  const start = Math.max(0, Number(headerRow) - 1);
  const nonblank = matrix.slice(start).filter((row) => row.some((v) => normalizeCell(v)));
  if (!nonblank.length) throw new Error('No table data found. Choose another sheet or paste a table.');
  const width = nonblank.reduce((max, row) => Math.max(max, row.length), 0);
  if (width > 100) throw new Error('Use a table with at most 100 columns.');
  const header = hasHeaders ? nonblank[0] : fallbackColumns.length === width ? fallbackColumns : [];
  const used = new Set();
  const columns = Array.from({ length: width }, (_, i) => {
    const base = String(header[i] ?? '').trim() || `Column ${i + 1}`;
    let name = base;
    let suffix = 2;
    while (used.has(normalizeCell(name))) name = `${base} (${suffix++})`;
    used.add(normalizeCell(name));
    return name;
  });
  const seen = new Set();
  const rows = [];
  let duplicates = 0;
  for (const row of nonblank.slice(hasHeaders ? 1 : 0)) {
    const values = columns.map((_, i) => String(row[i] ?? ''));
    const key = values.map(normalizeCell).join('\u0001');
    if (seen.has(key)) { duplicates++; continue; }
    seen.add(key); rows.push(values);
  }
  return { columns, rows, widths: columns.map((_, i) => Math.max(100, Math.min(400, widths[i] || 170))), duplicates };
}

// Be conservative with headerless lists: data-looking or ambiguous rows stay in the table.
export function detectHeaders(matrix) {
  const first = matrix.find((row) => row.some((v) => normalizeCell(v))) || [];
  const values = first.map(normalizeCell).filter(Boolean);
  const knownHeader = /^(company( name)?|business( name| email)?|name|full name|first name|last name|phone( number)?|official business phone|mobile( number)?|email( address)?|address|city|country|lead source|contact role|permission\/contact status|lead stage|next follow-up date|notes?|date|amount|price|quantity|qty|product|description|status|id|sku|customer( name)?|total|category|contact|website|source|number|no\.?|balance|revenue|cost)$/i;
  return values.some((value) => knownHeader.test(value)) &&
    !values.some((value) => /^[+\d]|^[^\s@]+@[^\s@]+\.[^\s@]+$|^https?:\/\//.test(value));
}

// The server accepts up to 5,000 rows and 10 MB per request; stay well inside both.
export function* importBatches(rows, { maxRows = 5000, maxBytes = 3 * 1024 * 1024 } = {}) {
  let batch = [];
  let bytes = 0;
  for (const row of rows) {
    // String length approximates UTF-8 size closely enough for a 3 MB cap under a 10 MB limit.
    let size = 4;
    for (const value of row) size += value.length * 3 + 3;
    if (batch.length && (batch.length >= maxRows || bytes + size > maxBytes)) {
      yield batch; batch = []; bytes = 0;
    }
    batch.push(row); bytes += size;
  }
  if (batch.length || !rows.length) yield batch;
}

export const isReferenceFormat = (columns = []) => columns.length === REFERENCE_COLUMNS.length &&
  columns.every((column, i) => normalizeCell(column) === normalizeCell(REFERENCE_COLUMNS[i]));

// Header wording -> standard column index. Order matters: "business email" must hit email before company.
const REFERENCE_RULES = [
  [3, /e[ -]?mail/],
  [2, /phone|mobile|telephone|\btel\b|\bcell\b|contact (no|number)|whats ?app/],
  [7, /follow.?up|next (call|contact|action|date)|call ?back/],
  [6, /stage|pipeline/],
  [5, /permission|consent|contact ?status|call ?status/],
  [4, /role|position|title|designation|\bjob\b/],
  [1, /source|channel|origin|referr/],
  [0, /company|business ?name|trade ?name|organi[sz]ation|firm|enterprise|customer|client|brand|shop|store|^name$/],
];
const normalizeHeader = (header) => normalizeCell(header).replace(/[_/-]+/g, ' ').replace(/\s+/g, ' ').trim();
export function referenceColumnFor(header) {
  const text = normalizeHeader(header);
  if (!text || /^column \d+$/.test(text)) return -1;
  const exact = REFERENCE_COLUMNS.findIndex((column) => normalizeHeader(column) === text);
  if (exact >= 0) return exact;
  return REFERENCE_RULES.find(([, rule]) => rule.test(text))?.[0] ?? -1;
}

// Source workbook formatting must not change the layout of the contact tables.
export function tableColumnWidth(column) {
  const reference = referenceColumnFor(column);
  return reference >= 0 ? REFERENCE_WIDTHS[reference] : 170;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const looksLikePhone = (value) => /^\+?[\d\s().\-/]{9,25}$/.test(value) && value.replace(/\D/g, '').length >= 9;
// Share of a column's (sampled) non-empty values that pass the test.
function share(rows, index, test) {
  let hits = 0;
  let seen = 0;
  for (const row of rows) {
    const value = String(row[index] ?? '').trim();
    if (!value) continue;
    seen++; if (test(value)) hits++;
    if (seen >= 200) break;
  }
  return seen ? hits / seen : 0;
}

const PERSON = /^(manager|owner|contact|person|first|middle|last|full|father|given|sur|f|m|l)? ?name|manager|owner|contact ?person|proprietor/;

// Sales basics first: business name, person names, phone, email, other sales fields, then the rest.
export function columnPriority(column) {
  const ref = referenceColumnFor(column);
  if (ref === 0) return 0;
  if (ref === 2) return 2;
  if (ref === 3) return 3;
  if (PERSON.test(normalizeCell(column))) return 1;
  if (ref >= 0) return 4;
  return 5;
}
const startsWithReference = (columns) => REFERENCE_COLUMNS.every((c, i) => normalizeCell(columns[i]) === normalizeCell(c));
// Older saved tables use the same standard-field order without changing stored values.
export function displayOrder(columns) {
  if (startsWithReference(columns)) return columns.map((_, i) => i);
  return columns.map((c, i) => {
    const reference = referenceColumnFor(c);
    return [reference >= 0 ? reference : REFERENCE_COLUMNS.length + columnPriority(c), i];
  }).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([, i]) => i);
}

// A contact is identified by its phone numbers (last 9 digits, so 0911…, +251911… and 911… match),
// then its emails; a business name is used only when a row has neither. Rows sharing any key are
// the same contact. Keep this in sync with contactKeys() in backend/utils/ecommerceTable.js.
const EMAIL_HEADER = /e-?mail/;
const PHONE_HEADER = /phone|mobile|telephone|\btel\b|\bcell\b|whats ?app|contact (no|number)/;
const COMPANY_HEADER = /company|business ?name|trade ?name|organi[sz]ation|firm|enterprise|customer|client|brand|shop|store|^name$/;
export function keyColumns(columns) {
  const names = columns.map(normalizeCell);
  const email = names.flatMap((c, i) => (EMAIL_HEADER.test(c) ? [i] : []));
  const phone = names.flatMap((c, i) => (!EMAIL_HEADER.test(c) && PHONE_HEADER.test(c) ? [i] : []));
  const company = names.findIndex((c, i) => !email.includes(i) && !phone.includes(i) && COMPANY_HEADER.test(c));
  return { email, phone, company };
}
export function contactKeys(columns, values, layout = keyColumns(columns)) {
  const keys = new Set();
  for (const i of layout.phone) {
    for (const part of String(values[i] ?? '').split(/[/,;|]|\s{2,}|\bor\b/i)) {
      const digits = part.replace(/\D/g, '');
      if (digits.length >= 9 && digits.length <= 15 && !/^(\d)\1+$/.test(digits)) keys.add(`p:${digits.slice(-9)}`);
    }
  }
  for (const i of layout.email) {
    for (const email of String(values[i] ?? '').toLowerCase().match(/[^\s@,;/]+@[^\s@,;/]+\.[^\s@,;/]+/g) || []) keys.add(`e:${email}`);
  }
  const name = layout.company >= 0 ? normalizeCell(values[layout.company]) : '';
  if (!keys.size && name) keys.add(`n:${name}`);
  if (!keys.size) keys.add(`r:${values.map(normalizeCell).join('\u0001')}`);
  return [...keys];
}

// Note is written by agents, never filled from a file: a file's own "Note" column is left out.
const IGNORED = -2;
const generic = (column) => /^column \d+$/i.test(column);

// Every import starts with the 9 standard columns. Headers are matched by wording, unlabelled
// phone/email/name columns by content; any other Excel columns are kept, in order, after Note.
// extraColumns tells callers whether the result is exactly the standard layout.
export function mapTableToReference({ columns, rows, duplicates = 0 }) {
  const targets = columns.map((column) => (/^notes?$/.test(normalizeHeader(column)) ? IGNORED : referenceColumnFor(column)));
  columns.forEach((column, i) => {
    if (targets[i] !== -1 || !generic(column)) return;
    if (share(rows, i, (v) => EMAIL.test(v)) >= 0.6) targets[i] = 3;
    else if (share(rows, i, looksLikePhone) >= 0.6) targets[i] = 2;
  });
  // Without a header, the first mostly-text column is taken to be the company name.
  if (!targets.includes(0)) {
    const company = columns.findIndex((column, i) => targets[i] === -1 && generic(column) &&
      share(rows, i, (v) => /[a-z\u0080-￿]/i.test(v) && !EMAIL.test(v)) >= 0.6);
    if (company >= 0) targets[company] = 0;
  }
  // Only the first column claims a standard field; later look-alikes stay as their own columns
  // (extra phone and email columns are joined into the standard one instead).
  const claimed = new Set();
  // An explicit standard heading wins over a loose alias, regardless of file order.
  const claimOrder = columns.map((_, i) => i).sort((a, b) => {
    const exact = (i) => targets[i] >= 0 && normalizeHeader(columns[i]) === normalizeHeader(REFERENCE_COLUMNS[targets[i]]);
    return Number(exact(b)) - Number(exact(a)) || a - b;
  });
  claimOrder.forEach((i) => {
    const t = targets[i];
    if (t < 0) return;
    if (claimed.has(t) && t !== 2 && t !== 3) targets[i] = -1;
    claimed.add(t);
  });
  const used = columns.map((_, i) => rows.some((row) => normalizeCell(row[i])));
  const extras = columns.map((_, i) => i).filter((i) => targets[i] === -1 && (used[i] || !generic(columns[i])))
    .sort((a, b) => columnPriority(columns[a]) - columnPriority(columns[b]) || a - b); // e.g. manager names first
  const outColumns = [...REFERENCE_COLUMNS, ...extras.map((i) => columns[i])];
  if (outColumns.length > 100) throw new Error('The standardized table exceeds 100 columns. Remove some extra columns and import again.');
  const layout = keyColumns(outColumns);
  const seen = new Set();
  const mapped = [];
  let removed = duplicates;
  for (const row of rows) {
    const values = REFERENCE_COLUMNS.map(() => []);
    row.forEach((raw, i) => {
      const value = String(raw ?? '').trim();
      if (value && targets[i] >= 0) values[targets[i]].push(value);
    });
    const out = [...values.map((parts) => [...new Set(parts)].join(' / ')), ...extras.map((i) => String(row[i] ?? ''))];
    if (!out.some((v) => normalizeCell(v))) continue;
    const keys = contactKeys(outColumns, out, layout);
    if (keys.some((key) => seen.has(key))) { removed++; continue; } // same phone, email or name
    keys.forEach((key) => seen.add(key)); mapped.push(out);
  }
  return {
    columns: outColumns, rows: mapped, duplicates: removed, extraColumns: extras.length,
    widths: [...REFERENCE_WIDTHS, ...extras.map(() => 170)],
  };
}

const looksLikeData = (v) => EMAIL.test(v) || looksLikePhone(v) || /\d{3,}|^https?:\/\/|\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}/.test(v);

// The first row is headings if it uses known wording, or if it is several distinct labels
// with no phone numbers, emails, long numbers or dates in it.
export function hasHeaderRow(matrix) {
  const nonblank = matrix.filter((row) => row.some((v) => normalizeCell(v)));
  if (nonblank.length < 2) return detectHeaders(matrix);
  const first = nonblank[0].map((v) => String(v).trim()).filter(Boolean);
  if (first.some(looksLikeData)) return false;
  if (detectHeaders(matrix) || first.filter((v) => referenceColumnFor(v) >= 0).length >= Math.max(1, Math.ceil(first.length / 2))) return true;
  return first.length >= 2 && new Set(first.map(normalizeCell)).size === first.length;
}

const sameColumns = (a, b) => a.length === b.length && a.map(normalizeCell).sort().join('\u0001') === b.map(normalizeCell).sort().join('\u0001');

// Standard-layout sheets are merged into targetName. Sheets with additional columns become
// their own table (standard columns first, then the Excel's other columns), named after the file.
export function prepareWorkbookSheets(sheets, { targetName = '', fallbackColumns = [], fileName = '' } = {}) {
  const withData = sheets.filter((sheet) => sheet.matrix.some((row) => row.some((v) => normalizeCell(v))));
  if (!withData.length) throw new Error('This workbook has no cell data to import.');
  const target = String(targetName).trim();
  const base = String(fileName).replace(/\.[^.]+$/, '').trim() || target;
  const ownName = (sheet) => (!base ? sheet.name : withData.length === 1 ? base : `${base} - ${sheet.name}`).slice(0, 120);
  const tables = new Map(); // name -> merged table, so rows across sheets are de-duplicated together
  for (const sheet of withData) {
    const mapped = mapTableToReference(prepareTable(sheet.matrix, { hasHeaders: hasHeaderRow(sheet.matrix), widths: sheet.widths, fallbackColumns }));
    const intoTarget = target && (mapped.extraColumns ? sameColumns(mapped.columns, fallbackColumns) : isReferenceFormat(fallbackColumns));
    const name = intoTarget ? target : ownName(sheet);
    const key = `${normalizeCell(name)}\u0002${mapped.columns.map(normalizeCell).join('\u0001')}`;
    if (!tables.has(key)) tables.set(key, { name, columns: mapped.columns, widths: mapped.widths, rows: [], duplicates: 0, seen: new Set(), layout: keyColumns(mapped.columns) });
    const table = tables.get(key);
    table.duplicates += mapped.duplicates;
    for (const row of mapped.rows) {
      const keys = contactKeys(table.columns, row, table.layout);
      if (keys.some((key) => table.seen.has(key))) { table.duplicates++; continue; }
      keys.forEach((key) => table.seen.add(key)); table.rows.push(row);
    }
  }
  return [...tables.values()].map(({ name, columns, widths, rows, duplicates }) => ({ name, columns, widths, rows, duplicates }));
}

// Inject the save function so batch progress and failure recovery can be tested independently.
export async function importWorkbookSheets(sheets, saveBatch, onProgress = () => {}, options = {}) {
  return importPreparedTables(prepareWorkbookSheets(sheets, options), saveBatch, onProgress, options);
}

// The first batch of each sheet creates its table; the rest are sent in parallel.
// importStartedAt + offset let the server keep file order despite parallel requests.
export async function importPreparedTables(prepared, saveBatch, onProgress = () => {}, { concurrency = 4 } = {}) {
  const progress = { added: 0, duplicates: 0, processed: 0, total: prepared.reduce((n, sheet) => n + sheet.rows.length, 0), tables: [], activeSheet: '' };
  const importStartedAt = Date.now();
  try {
    for (const sheet of prepared) {
      progress.activeSheet = sheet.name;
      progress.duplicates += sheet.duplicates;
      onProgress({ ...progress });
      const batches = [];
      let offset = 0;
      for (const rows of importBatches(sheet.rows)) { batches.push({ rows, offset }); offset += rows.length; }
      const send = async ({ rows, offset: start }) => {
        const response = await saveBatch({
          name: sheet.name, columns: sheet.columns, widths: sheet.widths, rows, summaryOnly: true, importStartedAt, offset: start,
        });
        progress.added += response.added;
        progress.duplicates += response.duplicates;
        progress.processed += rows.length;
        const index = progress.tables.findIndex((t) => t._id === response.data._id);
        if (index < 0) progress.tables.push(response.data);
        else if ((response.data.rowCount ?? 0) >= (progress.tables[index].rowCount ?? 0)) progress.tables[index] = response.data;
        onProgress({ ...progress });
      };
      await send(batches[0]);
      let next = 1;
      let failure = null;
      const worker = async () => {
        while (!failure && next < batches.length) {
          const batch = batches[next++];
          try { await send(batch); } catch (error) { failure ||= error; }
        }
      };
      await Promise.all(Array.from({ length: Math.max(0, Math.min(concurrency, batches.length - 1)) }, worker));
      if (failure) throw failure;
    }
    return progress;
  } catch (error) {
    error.importProgress = { ...progress };
    throw error;
  }
}

export const MAX_IMPORT_FILE_MB = 20;

export function checkWorkbookFile(file) {
  if (!/\.(xlsx|xls|xlsm|xlsb|csv|tsv|ods)$/i.test(file.name)) throw new Error('Choose an Excel, CSV, TSV, or ODS file.');
  if (file.size > MAX_IMPORT_FILE_MB * 1024 * 1024) throw new Error(`Choose a file of ${MAX_IMPORT_FILE_MB} MB or less.`);
}

export async function readWorkbook(file) {
  checkWorkbookFile(file);
  return parseWorkbook(await import('xlsx'), await file.arrayBuffer());
}

// Dense mode stores cells as row arrays, which parses and iterates large sheets faster.
export function parseWorkbook(XLSX, bytes) {
  const book = XLSX.read(bytes, { type: 'array', raw: true, cellStyles: true, dense: true });
  return book.SheetNames.map((name) => {
    const sheet = book.Sheets[name];
    const data = sheet['!data'] || sheet; // SheetJS 0.19+ uses !data; 0.18 keeps rows on the sheet.
    // Visit populated cells only: formatting can extend a small sheet's range to Excel's
    // last row or column, which must not cause truncation or huge arrays.
    const populated = [];
    let firstColumn = Infinity;
    let lastColumn = -1;
    for (const key of Object.keys(data)) {
      if (!/^\d+$/.test(key)) continue;
      const row = data[key];
      if (!row) continue;
      let cells = null;
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (!cell || cell.t === 'z' || cell.v == null) continue;
        const value = cell.w ?? XLSX.utils.format_cell(cell);
        if (!String(value).trim()) continue;
        (cells ||= new Map()).set(c, String(value));
        if (c < firstColumn) firstColumn = c;
        if (c > lastColumn) lastColumn = c;
      }
      if (cells) populated.push([Number(key), cells]);
    }
    if (lastColumn - firstColumn >= 100) throw new Error(`The sheet “${name}” has more than 100 populated columns.`);
    const matrix = populated.sort(([a], [b]) => a - b)
      .map(([, cells]) => Array.from({ length: lastColumn - firstColumn + 1 }, (_, i) => cells.get(firstColumn + i) ?? ''));
    return {
      name: name.trim(),
      matrix,
      widths: (sheet['!cols'] || []).slice(Number.isFinite(firstColumn) ? firstColumn : 0, lastColumn + 1).map((c) => c?.wpx || (c?.wch || 24) * 7),
    };
  });
}
