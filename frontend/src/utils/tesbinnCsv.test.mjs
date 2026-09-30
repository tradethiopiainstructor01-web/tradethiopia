import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsvRows, normalizeCsvHeader, buildTrainingFollowupPayloadFromCsvRecord, readTrainingImportRows, prepareTrainingImport } from './tesbinnCsv.js';
import * as XLSX from 'xlsx';

test('imports valid rows around incomplete row 109 without aborting the file', () => {
  const rows = [['Name', 'Phone'], ...Array.from({ length: 107 }, (_, i) => [`Student ${i}`, '0911234567']), ['', '0911234567'], ['Last Student', '0911234567']];
  const { payloads, skippedRows } = prepareTrainingImport(rows);
  assert.equal(payloads.length, 108);
  assert.equal(payloads.at(-1).customerName, 'Last Student');
  assert.deepEqual(skippedRows, [109]);
});

test('ignores blank lines while retaining source row numbers for incomplete records', () => {
  const rows = parseCsvRows('Name,Phone\nAbebe,0911234567\n\n,\n,0911234567\nOther,0911234567');
  const { payloads, skippedRows } = prepareTrainingImport(rows);
  assert.equal(payloads.length, 2);
  assert.deepEqual(skippedRows, [5]);
});

test('reports missing name columns and files without valid records', () => {
  assert.throws(() => prepareTrainingImport([['Unknown'], ['Abebe']]), /Name column/);
  assert.deepEqual(prepareTrainingImport([['Name', 'Phone'], ['', '123']]), { payloads: [], skippedRows: [2] });
  assert.deepEqual(prepareTrainingImport([[], [' ']]), { payloads: [], skippedRows: [] });
});

for (const extension of ['xlsx', 'xls']) {
  test(`imports .${extension} workbook rows with formatted phone numbers and Excel dates`, async () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Full Name', 'Phone Number', 'Start Date', 'Course'],
      ['Abebe', 911234567, 46295, 'Sales'],
    ]);
    sheet.B2.z = '0000000000';
    sheet.C2.z = 'yyyy-mm-dd';
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Training');
    const bytes = XLSX.write(workbook, { type: 'array', bookType: extension });
    const [headers, row] = await readTrainingImportRows({
      name: `training excel (5).${extension}`,
      arrayBuffer: async () => bytes,
    });
    const payload = buildTrainingFollowupPayloadFromCsvRecord(
      Object.fromEntries(headers.map((header, i) => [normalizeCsvHeader(header), row[i]]))
    );
    assert.equal(payload.customerName, 'Abebe');
    assert.equal(payload.phoneNumber, '0911234567');
    assert.equal(payload.startDate, '2026-09-30T00:00:00.000Z');
    assert.equal(payload.trainingType, 'Sales');
    assert.equal(payload.progress, 'Completed');
  });
}

test('file reader still accepts CSV and rejects unsupported formats', async () => {
  assert.deepEqual(await readTrainingImportRows({ name: 'training.CSV', text: async () => 'Name\nAbebe' }), [['Name'], ['Abebe']]);
  await assert.rejects(readTrainingImportRows({ name: 'training.pdf' }), /CSV or Excel/);
});

test('imports CSV names, quoted values and phone numbers into visible completed records', () => {
  const [header, row] = parseCsvRows('\uFEFFFull Name,Phone Number,Course,Schedule\r\n"Abebe, ""A""",0911234567,"Sales\nBasics",Weekend\r\n');
  const record = Object.fromEntries(header.map((key, i) => [normalizeCsvHeader(key), row[i]]));
  const payload = buildTrainingFollowupPayloadFromCsvRecord(record);
  assert.equal(payload.customerName, 'Abebe, "A"');
  assert.equal(payload.phoneNumber, '0911234567');
  assert.equal(payload.trainingType, 'Sales\nBasics');
  assert.equal(payload.scheduleShift, 'Weekend');
  assert.equal(payload.progress, 'Completed');
});

test('preserves exported dates, assignments and explicit progress', () => {
  const payload = buildTrainingFollowupPayloadFromCsvRecord({ customername: 'Abebe', batchgroup: 'B1', startdate: '2026-09-30', agent: 'Agent', instructor: 'Instructor', progress: 'In Progress' });
  assert.equal(payload.batch, 'B1');
  assert.equal(payload.startDate, '2026-09-30T00:00:00.000Z');
  assert.equal(payload.agentName, 'Agent');
  assert.equal(payload.assignedInstructor, 'Instructor');
  assert.equal(payload.progress, 'In Progress');
});

test('rejects unclosed quoted fields and handles empty files', () => {
  assert.throws(() => parseCsvRows('Name\n"Unclosed'), /unclosed quoted field/);
  assert.deepEqual(parseCsvRows(''), []);
});
