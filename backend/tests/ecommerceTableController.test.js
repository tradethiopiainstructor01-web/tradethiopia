const test = require('node:test');
const assert = require('node:assert/strict');

// Exercise controller scoping and revision retries without connecting to production MongoDB.
const tables = new Map();
const folders = new Map();
const rows = [];
let sequence = 0;
const copy = (value) => value ? structuredClone(value) : value;
const matches = (doc, filter) => Object.entries(filter).every(([key, value]) => value === null ? doc[key] == null : doc[key] === value);
const query = (result) => {
  let skip = 0;
  let limit = Infinity;
  const chain = {
    select: () => chain, populate: () => chain, sort: () => chain,
    cursor: () => {
      const value = copy(result());
      return (async function* iterate() { yield* value; }());
    },
    skip: (n) => { skip = n; return chain; }, limit: (n) => { limit = n; return chain; },
    // Like Mongoose, lean() returns a query that can be awaited or iterated with cursor().
    lean: () => {
      const run = () => { const value = result(); return copy(Array.isArray(value) ? value.slice(skip, skip + limit) : value); };
      return { then: (resolve, reject) => Promise.resolve().then(run).then(resolve, reject), cursor: chain.cursor };
    },
  };
  return chain;
};
const rowMatches = (row, filter) => Object.entries(filter).every(([key, value]) => (
  key === 'values' ? row.values.some((v) => new RegExp(value.$regex, value.$options).test(v))
    : value?.$in ? value.$in.includes(row[key]) : row[key] === value));
const ordered = (list) => [...list].sort((a, b) => a.createdAt - b.createdAt || a.position - b.position || a.seq - b.seq);
const duplicate = () => Object.assign(new Error('duplicate key'), { code: 11000 });
const sameContact = (a, b) => a.table === b.table && (a.contactKeys || []).some((k) => (b.contactKeys || []).includes(k));
const TableMock = {
  init: async () => {},
  findOneAndUpdate: (filter, update) => query(() => {
    const doc = tables.get(String(filter._id));
    if (Object.hasOwn(update.$set || {}, 'archivedColumns')) {
      if (!doc || !matches(doc, filter)) return null;
      Object.assign(doc, update.$set);
      doc.revision += update.$inc.revision;
      return doc;
    }
    if (!doc || (filter.dataVersion && (doc.dataVersion || 0) >= 3) || doc.dedupeStartedAt) return null;
    Object.assign(doc, update.$set);
    return doc;
  }),
  deleteMany: async (filter) => { for (const [id, t] of tables) if (rowMatches(t, filter)) tables.delete(id); },
  deleteOne: async (filter) => { for (const [id, t] of tables) if (matches(t, filter)) tables.delete(id); },
  find: (filter) => query(() => [...tables.values()].filter((doc) => matches(doc, filter))),
  findOne: (filter) => query(() => [...tables.values()].find((doc) => matches(doc, filter))),
  create: async (doc) => {
    if ([...tables.values()].some((t) => matches(t, { owner: doc.owner, channel: doc.channel, key: doc.key }))) throw duplicate();
    const saved = { ...copy(doc), _id: String(++sequence).padStart(24, '0'), revision: 0 };
    tables.set(saved._id, saved);
    return { toObject: () => copy(saved) };
  },
  updateOne: async (filter, update) => {
    const doc = [...tables.values()].find((t) => matches(t, filter));
    if (!doc) return;
    Object.assign(doc, update.$set || {});
    for (const key of Object.keys(update.$unset || {})) delete doc[key];
    for (const [key, n] of Object.entries(update.$inc || {})) doc[key] = (doc[key] || 0) + n;
  },
};
const RowMock = {
  init: async () => {},
  createIndexes: async () => {},
  collection: {
    // Simulates the duplicate scan used before building unique indexes (group by table + field).
    aggregate: (stages) => ({
      toArray: async () => {
        const field = Object.keys(stages[0].$match)[0];
        const groups = new Map();
        for (const row of rows) {
          for (const value of field === 'contactKeys' ? row.contactKeys || [] : row[field] === undefined ? [] : [row[field]]) {
            const key = `${row.table}|${value}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push({ _id: row._id, c: row.createdAt, p: row.position });
          }
        }
        return [...groups.values()].filter((g) => g.length > 1).map((g) => ({ rows: g, n: g.length }));
      },
    }),
    deleteMany: async (filter) => { for (let i = rows.length - 1; i >= 0; i--) if (filter._id.$in.includes(rows[i]._id)) rows.splice(i, 1); },
    bulkWrite: async (ops) => {
      for (const { updateOne: { filter, update } } of ops) {
        const row = rows.find((r) => r._id === filter._id);
        if (row) Object.assign(row, update.$set);
      }
    },
    insertMany: async (docs) => {
      // Yield first so parallel requests interleave like real network calls.
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
      let insertedCount = 0;
      const writeErrors = [];
      for (const doc of docs) {
        if (rows.some((r) => r.table === doc.table && (r.fingerprint === doc.fingerprint || sameContact(r, doc)))) { writeErrors.push({ code: 11000 }); continue; }
        rows.push({ ...copy(doc), _id: String(++sequence), seq: sequence });
        insertedCount++;
      }
      if (writeErrors.length) throw Object.assign(new Error('duplicate key'), { writeErrors, insertedCount });
      return { insertedCount };
    },
  },
  countDocuments: async (filter) => rows.filter((r) => rowMatches(r, filter)).length,
  deleteMany: async (filter) => { for (let i = rows.length - 1; i >= 0; i--) if (rowMatches(rows[i], filter)) rows.splice(i, 1); },
  find: (filter) => query(() => ordered(rows.filter((r) => rowMatches(r, filter)))),
  findOne: (filter) => query(() => rows.find((r) => matches(r, filter))),
  findOneAndUpdate: (filter, update) => query(() => {
    const current = rows.find((r) => matches(r, filter));
    if (!current) return null;
    if (rows.some((r) => r !== current && r.table === current.table &&
        (r.fingerprint === update.$set.fingerprint || sameContact(r, { table: current.table, contactKeys: update.$set.contactKeys })))) throw duplicate();
    Object.assign(current, update.$set);
    return current;
  }),
};
const FolderMock = {
  init: async () => {},
  find: (filter) => query(() => [...folders.values()].filter((doc) => matches(doc, filter))),
  findOne: (filter) => query(() => [...folders.values()].find((doc) => matches(doc, filter))),
  create: async (doc) => {
    if ([...folders.values()].some((folder) => matches(folder, { owner: doc.owner, channel: doc.channel, nameKey: doc.nameKey }))) throw duplicate();
    const saved = { ...copy(doc), _id: String(++sequence).padStart(24, '0') };
    folders.set(saved._id, saved);
    return copy(saved);
  },
};
const mocked = [['../models/EcommerceTable', TableMock], ['../models/EcommerceTableRow', RowMock], ['../models/EcommerceFolder', FolderMock]].map(([path, mock]) => {
  const resolved = require.resolve(path);
  require(resolved);
  const original = require.cache[resolved].exports;
  require.cache[resolved].exports = mock;
  return [resolved, original];
});
const controller = require('../controllers/ecommerceTableController');
for (const [resolved, original] of mocked) require.cache[resolved].exports = original;

async function call(method, { owner = 'agent-a', role = 'sales', channel = 'cold-call', id, rowId, columnIndex, body = {}, query = {} } = {}) {
  const result = { status: 200 };
  await controller[method]({ user: { _id: owner, role }, params: { channel, id, rowId, columnIndex }, body, query }, {
    status(code) { result.status = code; return this; },
    json(value) { result.body = value; return this; },
  });
  return result;
}
const payload = (rows) => ({ name: 'Leads', columns: ['Company', 'Phone'], rows });

test('folders persist empty, validate names, and are scoped to user and outreach tab', async () => {
  const owner = 'folder-owner';
  for (const name of ['', '   ', 'a'.repeat(121), 123]) {
    assert.equal((await call('createFolder', { owner, body: { name } })).status, 400);
  }
  const created = await call('createFolder', { owner, body: { name: '  November   Leads  ' } });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.name, 'November Leads');
  assert.equal((await call('createFolder', { owner, body: { name: 'november leads' } })).status, 409);
  assert.deepEqual((await call('listFolders', { owner })).body.data.map((f) => f._id), [created.body.data._id]);
  assert.equal((await call('listFolders', { owner: 'someone-else' })).body.data.length, 0);
  assert.equal((await call('listFolders', { owner, channel: 'bulk-sms' })).body.data.length, 0);
  assert.deepEqual((await call('list', { owner, query: { folderId: created.body.data._id } })).body.data, []);
});

// Must run first: indexes are built once per process.
test('rows repeated while unique indexes were missing are removed before the indexes are built', async () => {
  const table = 'f'.repeat(24);
  [['a', 1], ['a', 2], ['b', 3]].forEach(([fingerprint, at]) => rows.push({ _id: `dup${at}`, table, id: `dup${at}`, values: [], fingerprint, createdAt: at, position: 0, seq: at }));
  rows.push({ _id: 'k1', table, id: 'k1', values: [], fingerprint: 'k1', contactKeys: ['p:907746965'], createdAt: 4, position: 0, seq: 4 });
  rows.push({ _id: 'k2', table, id: 'k2', values: [], fingerprint: 'k2', contactKeys: ['p:907746965', 'p:915731831'], createdAt: 5, position: 0, seq: 5 });
  const response = await call('importRows', { owner: 'repair', body: payload([['Fresh', '0911234567']]) });
  assert.equal(response.status, 200);
  assert.deepEqual(rows.filter((r) => r.table === table).map((r) => r._id), ['dup1', 'dup3', 'k1']); // earliest copies kept
});

test('simultaneous repeat imports save each row once and preserve all new rows', async () => {
  const responses = await Promise.all([
    call('importRows', { body: payload([['Example', '0911234567']]) }),
    call('importRows', { body: payload([['Example', '0911234567'], ['Other', '0711234567']]) }),
  ]);
  assert.ok(responses.every((r) => r.status === 200));
  const id = responses[0].body.data._id;
  assert.equal(responses[1].body.data._id, id);
  const stored = await call('get', { id });
  assert.equal(stored.body.data.rows.length, 2);
});

test('tables and edits are isolated by signed-in user and tab', async () => {
  const response = await call('importRows', { owner: 'private-agent', body: payload([['Private', '0911234567']]) });
  const table = (await call('get', { owner: 'private-agent', id: response.body.data._id })).body.data;
  assert.equal((await call('get', { owner: 'other-agent', id: table._id })).status, 404);
  assert.equal((await call('get', { owner: 'private-agent', channel: 'bulk-sms', id: table._id })).status, 404);
  assert.equal((await call('updateRow', { owner: 'other-agent', id: table._id, rowId: table.rows[0].id, body: { values: ['Altered', '0711234567'], revision: 0 } })).status, 404);
  assert.equal((await call('importRows', { channel: 'invalid', body: payload([]) })).status, 400);
});

test('sales managers can read every agent eCommerce table while sales users cannot', async () => {
  const first = await call('importRows', { owner: 'manager-visible-a', body: { ...payload([['Alpha', '0911000001']]), name: 'Manager A' } });
  const second = await call('importRows', { owner: 'manager-visible-b', body: { ...payload([['Beta', '0911000002']]), name: 'Manager B' } });
  assert.equal((await call('managerList', { role: 'sales' })).status, 403);
  assert.equal((await call('managerGet', { role: 'sales', id: first.body.data._id })).status, 403);

  const catalog = await call('managerList', { owner: 'manager', role: 'salesmanager' });
  assert.equal(catalog.status, 200);
  assert.ok(catalog.body.data.some((table) => table._id === first.body.data._id && table.rowCount === 1));
  assert.ok(catalog.body.data.some((table) => table._id === second.body.data._id && table.rowCount === 1));

  const detail = await call('managerGet', { owner: 'manager', role: 'salesmanager', id: second.body.data._id });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.rows[0].values[0], 'Beta');
  assert.equal((await call('managerGet', { owner: 'manager', role: 'salesmanager', channel: 'bulk-sms', id: second.body.data._id })).status, 404);
});

test('editing rejects duplicate rows and stale revisions', async () => {
  const created = await call('importRows', { owner: 'editor', body: payload([['First', '0911234567'], ['Second', '0711234567']]) });
  const table = (await call('get', { owner: 'editor', id: created.body.data._id })).body.data;
  const args = { owner: 'editor', id: table._id, rowId: table.rows[0].id };
  const fingerprint = table.rows[0].fingerprint;
  assert.equal((await call('updateRow', { ...args, body: { expectedFingerprint: fingerprint, values: ['Second', '0711234567'] } })).status, 409);
  assert.equal((await call('updateRow', { ...args, body: { expectedFingerprint: fingerprint, values: ['Changed', '0911234567'] } })).status, 200);
  assert.equal((await call('updateRow', { ...args, body: { expectedFingerprint: fingerprint, values: ['Stale', '0911234567'] } })).status, 409);
});

test('parallel batches keep file order, skip duplicates, and pages/search work', async () => {
  const all = Array.from({ length: 120 }, (_, i) => [`Company ${i}`, `09${String(i).padStart(8, '0')}`]);
  const importStartedAt = Date.now();
  const batches = [0, 40, 80].map((offset) => ({ ...payload(all.slice(offset, offset + 40)), name: 'Ordered', importStartedAt, offset }));
  const first = await call('importRows', { owner: 'order', body: batches[0] });
  const rest = await Promise.all([batches[2], batches[1], batches[1]].map((body) => call('importRows', { owner: 'order', body })));
  assert.equal([first, ...rest].reduce((n, r) => n + r.body.added, 0), 120);
  assert.equal(rest[2].body.duplicates + rest[1].body.duplicates, 40);
  const id = first.body.data._id;
  const page1 = (await call('get', { owner: 'order', id })).body.data;
  assert.equal(page1.rowCount, 120);
  assert.equal(page1.rows.length, 50);
  assert.equal(page1.rows[0].values[0], 'Company 0');
  const page3 = (await call('get', { owner: 'order', id, query: { page: '3' } })).body.data;
  assert.deepEqual(page3.rows.map((r) => r.values[0]), all.slice(100).map((r) => r[0]));
  const found = (await call('get', { owner: 'order', id, query: { search: 'company 11' } })).body.data;
  assert.equal(found.matchCount, 11); // 11 and 110-119
  const everything = (await call('get', { owner: 'order', id, query: { all: '1' } })).body.data;
  assert.equal(everything.rows.length, 120);
});

test('deleting a table removes its rows and is scoped to the owner', async () => {
  const created = await call('importRows', { owner: 'deleter', body: { ...payload([['Gone', '0911234567']]), name: 'Bad import' } });
  const id = created.body.data._id;
  assert.equal((await call('remove', { owner: 'someone-else', id })).status, 404);
  assert.equal((await call('remove', { owner: 'deleter', id })).status, 200);
  assert.equal((await call('get', { owner: 'deleter', id })).status, 404);
  assert.equal(rows.filter((r) => r.table === id).length, 0);
});

test('Note in standard tables is ignored by duplicate checks, so agent notes never cause repeats', async () => {
  const cols = ['Company Name', 'Lead source', 'official business phone', 'business email', 'contact role', 'permission/contact status', 'lead stage', 'next follow-up date', 'Note'];
  const contact = ['Acme', '', '0911234567', '', '', '', '', '', ''];
  const body = { name: 'E-commerce subscription', columns: cols, rows: [contact] };
  const created = await call('importRows', { owner: 'noter', body });
  const id = created.body.data._id;
  const row = (await call('get', { owner: 'noter', id })).body.data.rows[0];
  const noted = [...contact.slice(0, 8), 'Interested, call Monday'];
  const edited = await call('updateRow', { owner: 'noter', id, rowId: row.id, body: { values: noted, expectedFingerprint: row.fingerprint } });
  assert.equal(edited.status, 200);
  const again = await call('importRows', { owner: 'noter', body });
  assert.equal(again.body.added, 0);
  assert.equal(again.body.duplicates, 1);
  assert.equal((await call('get', { owner: 'noter', id })).body.data.rows[0].values[8], 'Interested, call Monday');
});

test('delete all removes only this user and tab', async () => {
  await call('importRows', { owner: 'wiper', body: { ...payload([['A', '0911234567']]), name: 'One' } });
  await call('importRows', { owner: 'wiper', body: { ...payload([['B', '0911234567']]), name: 'Two' } });
  const sms = await call('importRows', { owner: 'wiper', channel: 'bulk-sms', body: payload([['C', '0911234567']]) });
  const result = await call('removeAll', { owner: 'wiper' });
  assert.equal(result.body.deletedTables, 2);
  assert.equal((await call('list', { owner: 'wiper' })).body.data.length, 0);
  assert.equal((await call('list', { owner: 'wiper', channel: 'bulk-sms' })).body.data.length, 1);
  assert.equal((await call('get', { owner: 'wiper', channel: 'bulk-sms', id: sms.body.data._id })).status, 200);
});

test('tables saved before contact keys are cleaned once: later copies of a contact are deleted', async () => {
  const cols = ['BusinessName', 'MangerPhone', 'Code'];
  const id = String(++sequence).padStart(24, '0');
  tables.set(id, { _id: id, owner: 'legacy', channel: 'cold-call', key: require('../utils/ecommerceTable').validateImport({ name: 'Old', columns: cols, rows: [] }).key, name: 'Old', columns: cols, widths: [], revision: 0, dataVersion: 2 });
  [['MENGISTU', '0907746965', '61632'], ['MENGISTU', '0907746965', '61633'], ['NEJIB', '0915731831', '51111'], ['NEJIB', '+251915731831', '51112']]
    .forEach((values, i) => rows.push({ _id: `legacy${i}`, table: id, id: `row${i}`, values, fingerprint: `f${i}`, createdAt: 1, position: i, seq: i }));
  const first = (await call('get', { owner: 'legacy', id })).body.data;
  assert.equal(first.cleaning, true); // cleanup runs in the background; the page polls
  for (let i = 0; i < 50 && tables.get(id).dataVersion !== 3; i++) await new Promise((r) => setTimeout(r, 10));
  const loaded = (await call('get', { owner: 'legacy', id })).body.data;
  assert.equal(loaded.cleaning, false);
  assert.deepEqual(loaded.rows.map((r) => r.values[2]), ['61632', '51111']);
  const again = await call('importRows', { owner: 'legacy', body: { name: 'Old', columns: cols, rows: [['MENGISTU', '907746965', '1']] } });
  assert.equal(again.body.added, 0);
});


test('column removal preserves values and duplicate checks, persists on reload and can be restored', async () => {
  const owner = 'columns';
  const body = payload([['Example', '0911234567']]);
  const imported = await call('importRows', { owner, body });
  const id = imported.body.data._id;
  const before = (await call('get', { owner, id })).body.data;
  const removed = await call('setColumnArchived', { owner, id, columnIndex: '1', body: { archived: true, revision: before.revision } });
  assert.equal(removed.status, 200);
  const loaded = (await call('get', { owner, id })).body.data;
  assert.deepEqual(loaded.archivedColumns, [1]);
  assert.deepEqual(loaded.columns, before.columns);
  assert.deepEqual(loaded.rows, before.rows);
  assert.equal(loaded.key, before.key);
  const repeated = await call('importRows', { owner, body });
  assert.equal(repeated.body.added, 0);
  assert.equal(repeated.body.duplicates, 1);
  assert.deepEqual(repeated.body.data.archivedColumns, [1]);
  const restored = await call('setColumnArchived', { owner, id, columnIndex: '1', body: { archived: false, revision: repeated.body.data.revision } });
  assert.equal(restored.status, 200);
  assert.deepEqual(restored.body.data.archivedColumns, []);
  assert.deepEqual((await call('get', { owner, id })).body.data.rows, before.rows);
});

test('column changes enforce ownership, channel, input bounds and preserve the last visible column', async () => {
  const owner = 'column-guards';
  const imported = await call('importRows', { owner, body: payload([['Example', '0911234567']]) });
  const id = imported.body.data._id;
  const revision = imported.body.data.revision;
  const args = { owner, id, columnIndex: '1', body: { archived: true, revision } };
  assert.equal((await call('setColumnArchived', { ...args, owner: 'outsider' })).status, 404);
  assert.equal((await call('setColumnArchived', { ...args, channel: 'bulk-sms' })).status, 404);
  assert.equal((await call('setColumnArchived', { ...args, channel: 'invalid' })).status, 400);
  for (const columnIndex of ['-1', '1.5', '1x', '01', '', undefined]) {
    assert.equal((await call('setColumnArchived', { ...args, columnIndex })).status, 400);
  }
  assert.equal((await call('setColumnArchived', { ...args, columnIndex: '2' })).status, 404);
  for (const body of [null, {}, { archived: 'true', revision }, { archived: true, revision: -1 }, { archived: true, revision: '1' }]) {
    assert.equal((await call('setColumnArchived', { ...args, body })).status, 400);
  }
  const removed = await call('setColumnArchived', args);
  assert.equal(removed.status, 200);
  const last = await call('setColumnArchived', { ...args, columnIndex: '0', body: { archived: true, revision: removed.body.data.revision } });
  assert.equal(last.status, 400);
  assert.match(last.body.message, /at least one/);
  assert.deepEqual(tables.get(id).archivedColumns, [1]);
});

test('simultaneous column changes reject stale revisions instead of losing another change', async () => {
  const owner = 'column-race';
  const imported = await call('importRows', { owner, body: { name: 'Three', columns: ['Company', 'Phone', 'Email'], rows: [] } });
  const id = imported.body.data._id;
  const results = await Promise.all(['0', '1'].map((columnIndex) => call('setColumnArchived', {
    owner, id, columnIndex, body: { archived: true, revision: imported.body.data.revision },
  })));
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  assert.equal(tables.get(id).archivedColumns.length, 1);
});

test('"Show duplicates" lists copies together and "Remove duplicates" keeps one row per contact', async () => {
  const cols = ['BusinessName', 'MangerPhone', 'Tin'];
  const id = String(++sequence).padStart(24, '0');
  tables.set(id, { _id: id, owner: 'dupes', channel: 'cold-call', key: 'dupes', name: 'Registry', columns: cols, widths: [], revision: 0, dataVersion: 3 });
  // Saved while the unique indexes were missing: identical rows and the same phone in another format.
  [['MENGISTU ASHAME HASSEN', '0907746965', '0000072366'], ['NEJIB ADEN HASSEN', '0915731831', '0000146001'],
    ['MENGISTU ASHAME HASSEN', '0907746965', '0000072366'], ['NEJIB ADEN HASSEN', '+251915731831', '0000146001'], ['ABDI', '0947337267', '1']]
    .forEach((values, i) => rows.push({ _id: `d${i}`, table: id, id: `d${i}`, values, fingerprint: `d${i}`, createdAt: 1, position: i, seq: i }));
  const shown = (await call('get', { owner: 'dupes', id, query: { duplicates: '1' } })).body.data;
  assert.equal(shown.duplicateCount, 2);
  assert.deepEqual(shown.rows.map((r) => r.id), ['d0', 'd2', 'd1', 'd3']); // each contact's copies together
  const result = await call('removeDuplicates', { owner: 'dupes', id });
  assert.equal(result.status, 200);
  assert.equal(result.body.removed, 2);
  assert.equal(result.body.data.rowCount, 3);
  assert.deepEqual(rows.filter((r) => r.table === id).map((r) => r.id), ['d0', 'd1', 'd4']);
  assert.equal((await call('get', { owner: 'dupes', id, query: { duplicates: '1' } })).body.data.matchCount, 0);
  assert.equal((await call('removeDuplicates', { owner: 'dupes', id })).body.removed, 0);
});

test('matching imports stay separate across folders and retries deduplicate within their folder', async () => {
  const owner = 'folder-importer';
  const first = (await call('createFolder', { owner, body: { name: 'First campaign' } })).body.data;
  const second = (await call('createFolder', { owner, body: { name: 'Second campaign' } })).body.data;
  const body = payload([['Shared contact', '0911234567']]);
  const a = await call('importRows', { owner, body: { ...body, folderId: first._id } });
  const b = await call('importRows', { owner, body: { ...body, folderId: second._id } });
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.notEqual(a.body.data._id, b.body.data._id);
  assert.equal(a.body.added, 1);
  assert.equal(b.body.added, 1);
  assert.equal(a.body.data.folder, first._id);
  const retry = await call('importRows', { owner, body: { ...body, folderId: first._id } });
  assert.equal(retry.body.added, 0);
  assert.equal(retry.body.duplicates, 1);
  for (const [folder, table] of [[first, a], [second, b]]) {
    const listing = await call('list', { owner, query: { folderId: folder._id } });
    assert.deepEqual(listing.body.data.map((t) => t._id), [table.body.data._id]);
  }
  const deletion = await call('removeAll', { owner, query: { folderId: first._id } });
  assert.equal(deletion.body.deletedTables, 1);
  assert.equal((await call('get', { owner, id: b.body.data._id })).body.data.rowCount, 1);
  assert.equal(rows.filter((r) => r.table === a.body.data._id).length, 0);
  assert.equal((await call('listFolders', { owner })).body.data.length, 2);
});

test('foreign, wrong-tab and invalid folders cannot be listed, imported into or emptied', async () => {
  const owner = 'private-folder';
  const folder = (await call('createFolder', { owner, body: { name: 'Private' } })).body.data;
  for (const args of [
    { owner: 'stranger', folderId: folder._id },
    { owner, channel: 'bulk-sms', folderId: folder._id },
    { owner, folderId: 'not-an-id' },
    { owner, folderId: 'e'.repeat(24) },
    { owner, folderId: { $ne: null } },
  ]) {
    const { folderId, ...scope } = args;
    assert.equal((await call('list', { ...scope, query: { folderId } })).status, 404);
    assert.equal((await call('importRows', { ...scope, body: { ...payload([]), folderId } })).status, 404);
    assert.equal((await call('removeAll', { ...scope, query: { folderId } })).status, 404);
  }
});

test('existing imports remain accessible and legacy deletion preserves new folder tables', async () => {
  const owner = 'existing-imports';
  const body = payload([['Existing contact', '0911234567']]);
  const legacy = await call('importRows', { owner, body });
  const folder = (await call('createFolder', { owner, body: { name: 'New files' } })).body.data;
  const added = await call('importRows', { owner, body: { ...body, folderId: folder._id } });
  const listing = await call('list', { owner, query: { folderId: 'legacy' } });
  assert.deepEqual(listing.body.data.map((t) => t._id), [legacy.body.data._id]);
  const retry = await call('importRows', { owner, body: { ...body, folderId: 'legacy' } });
  assert.equal(retry.body.data._id, legacy.body.data._id);
  assert.equal(retry.body.duplicates, 1);
  assert.equal((await call('removeAll', { owner, query: { folderId: 'legacy' } })).body.deletedTables, 1);
  assert.equal((await call('get', { owner, id: added.body.data._id })).body.data.rowCount, 1);
});
