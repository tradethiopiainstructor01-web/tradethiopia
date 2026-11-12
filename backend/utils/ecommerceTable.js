const { createHash, randomUUID } = require('node:crypto');

const MAX_ROWS = 5000;
// NFKC leaves ASCII unchanged, so skip it for ASCII-only cells (most spreadsheet data).
const normalize = (value) => {
  const text = String(value ?? '');
  return (/[\u0080-\uffff]/.test(text) ? text.normalize('NFKC') : text).trim().replace(/\s+/g, ' ').toLowerCase();
};
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const REFERENCE_COLUMNS = ['company name', 'lead source', 'official business phone', 'business email',
  'contact role', 'permission/contact status', 'lead stage', 'next follow-up date', 'note'];
// In tables that start with the standard columns, Note is the agent's own writing: it is left out of duplicate checks so
// writing a note never makes an imported contact look new, and re-imports still match it.
const rowFingerprint = (columns, values) => {
  const standard = columns.length >= REFERENCE_COLUMNS.length && REFERENCE_COLUMNS.every((c, i) => normalize(columns[i]) === c);
  return hash((standard ? values.filter((_, i) => i !== 8) : values).map(normalize));
};
// A contact is identified by its phone numbers (last 9 digits, so 0911…, +251911… and 911… match),
// then its emails; a business name is used only when a row has neither. Rows sharing any key are
// the same contact. Keep this in sync with contactKeys() in frontend/src/utils/ecommerceImport.js.
const EMAIL_HEADER = /e-?mail/;
const PHONE_HEADER = /phone|mobile|telephone|\btel\b|\bcell\b|whats ?app|contact (no|number)/;
const COMPANY_HEADER = /company|business ?name|trade ?name|organi[sz]ation|firm|enterprise|customer|client|brand|shop|store|^name$/;
function keyColumns(columns) {
  const names = columns.map(normalize);
  const email = names.flatMap((c, i) => (EMAIL_HEADER.test(c) ? [i] : []));
  const phone = names.flatMap((c, i) => (!EMAIL_HEADER.test(c) && PHONE_HEADER.test(c) ? [i] : []));
  const company = names.findIndex((c, i) => !email.includes(i) && !phone.includes(i) && COMPANY_HEADER.test(c));
  return { email, phone, company };
}
function contactKeys(columns, values, layout = keyColumns(columns)) {
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
  const name = layout.company >= 0 ? normalize(values[layout.company]) : '';
  if (!keys.size && name) keys.add(`n:${name}`);
  if (!keys.size) keys.add(`r:${rowFingerprint(columns, values)}`);
  return [...keys];
}
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };

function validateImport(body) {
  const { name, columns, rows, widths = [] } = body || {};
  if (typeof name !== 'string' || !name.trim() || name.length > 120) fail('Enter a table name of up to 120 characters.');
  if (!Array.isArray(columns) || !columns.length || columns.length > 100 ||
      columns.some((c) => typeof c !== 'string' || !c.trim() || c.length > 200)) {
    fail('Use 1–100 named columns, with headers up to 200 characters.');
  }
  if (new Set(columns.map(normalize)).size !== columns.length) fail('Column names must be unique. Rename repeated headers before importing.');
  if (!Array.isArray(rows) || rows.length > MAX_ROWS) fail(`Import up to ${MAX_ROWS} rows at a time.`);
  if (!Array.isArray(widths)) fail('Column widths must be a list.');
  for (const row of rows) {
    if (!Array.isArray(row) || row.length !== columns.length || row.some((v) => typeof v !== 'string' || v.length > 10000)) {
      fail('Each row must match the columns, with text cells of up to 10,000 characters.');
    }
  }
  return {
    name: name.trim(), columns: columns.map((c) => c.trim()), rows,
    widths: columns.map((_, i) => Math.max(100, Math.min(400, Number(widths[i]) || 170))),
    key: hash([normalize(name), columns.map(normalize).sort()]),
  };
}

function mergeRows(existing, incoming, incomingColumns, savedColumns) {
  const positions = savedColumns.map((column) => incomingColumns.findIndex((c) => normalize(c) === normalize(column)));
  if (positions.some((p) => p < 0)) fail('The imported columns do not match this table.');
  const layout = keyColumns(savedColumns);
  const rows = [...existing];
  const seen = new Set(existing.flatMap((r) => r.contactKeys || []));
  let duplicates = 0;
  let blank = 0;
  for (const source of incoming) {
    const values = positions.map((p) => source[p]);
    if (values.every((v) => !normalize(v))) { blank++; continue; }
    const keys = contactKeys(savedColumns, values, layout);
    if (keys.some((key) => seen.has(key))) { duplicates++; continue; }
    keys.forEach((key) => seen.add(key));
    rows.push({ id: randomUUID(), values, fingerprint: rowFingerprint(savedColumns, values), contactKeys: keys });
  }
  return { rows, added: rows.length - existing.length, duplicates, blank };
}

module.exports = { validateImport, mergeRows, normalize, hash, rowFingerprint, keyColumns, contactKeys, fail };
