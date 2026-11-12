const test = require('node:test');
const assert = require('node:assert/strict');
const { validateImport, mergeRows } = require('../utils/ecommerceTable');

test('the same contact is saved once: same phone (any format), same email, or same name without contacts', () => {
  const columns = ['Company', 'Phone', 'Email', 'Code'];
  const first = mergeRows([], [
    ['MENGISTU ASHAME', '0907746965', '', '61632'],
    ['MENGISTU ASHAME', '+251 907 746 965', '', '61633'], // same phone, other Code -> duplicate
    ['NEJIB ADEN', '0915731831 / 0911000000', '', '51111'],
    ['NEJIB ADEN', '0911000000', '', '51112'], // shares the second number -> duplicate
    ['Abebe', '', 'A@x.com', '1'], ['Abebe Two', '', 'a@x.com', '2'], // same email
    ['No Contact PLC', '', '', '1'], [' no contact plc ', '', '', '2'], // no phone/email: same name
    ['', ' ', '', ''],
  ], columns, columns);
  assert.deepEqual(first.rows.map((r) => r.values[0]), ['MENGISTU ASHAME', 'NEJIB ADEN', 'Abebe', 'No Contact PLC']);
  assert.equal(first.duplicates, 4);
  assert.equal(first.blank, 1);
  const next = mergeRows(first.rows, [['Other', '0907746965', '', ''], ['New', '0922222222', '', '']], columns, columns);
  assert.equal(next.added, 1);
  assert.equal(next.duplicates, 1);
});

test('reordered columns match existing table and saved rows', () => {
  const first = validateImport({ name: 'Leads', columns: ['Company', 'Phone'], rows: [['Example', '0911234567']] });
  const second = validateImport({ name: ' LEADS ', columns: ['phone', 'company'], rows: [['0911234567', 'Example']] });
  assert.equal(first.key, second.key);
  const saved = mergeRows([], first.rows, first.columns, first.columns);
  const repeated = mergeRows(saved.rows, second.rows, second.columns, first.columns);
  assert.equal(repeated.added, 0);
  assert.equal(repeated.duplicates, 1);
});

test('input validation protects arbitrary data shape and limits', () => {
  const valid = { name: 'Leads', columns: ['Phone'], rows: [['0911234567']] };
  assert.equal(validateImport(valid).rows[0][0], '0911234567');
  assert.throws(() => validateImport({ ...valid, rows: [[{ unsafe: true }]] }), /text cells/);
  assert.throws(() => validateImport({ ...valid, columns: ['Phone', ' phone '] }), /unique/);
  assert.throws(() => validateImport({ ...valid, rows: [['1', '2']] }), /match the columns/);
  assert.throws(() => validateImport({ ...valid, rows: Array(5001).fill(['1']) }), /5000/);
  assert.throws(() => validateImport({ ...valid, widths: null }), /widths/);
});
