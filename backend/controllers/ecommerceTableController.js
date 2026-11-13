const Table = require('../models/EcommerceTable');
const Folder = require('../models/EcommerceFolder');
const Row = require('../models/EcommerceTableRow');
const { validateImport, mergeRows, normalize, rowFingerprint, keyColumns, contactKeys, fail } = require('../utils/ecommerceTable');

const scope = (req) => {
  if (!['cold-call', 'bulk-sms'].includes(req.params.channel)) fail('Unknown eCommerce tab.');
  return { owner: req.user._id, channel: req.params.channel };
};
const handle = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (error) {
    if (!error.status) console.error('eCommerce table error:', error);
    res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Unable to save or load this table. Please retry. Any completed import batches are saved; retrying skips duplicates.' });
  }
};

const PAGE_SIZE = 50;
const ROW_ORDER = { createdAt: 1, position: 1, _id: 1 };
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Null includes pre-folder tables without rewriting their data or duplicate keys.
async function folderScope(req, folderId) {
  const ownerScope = scope(req);
  if (folderId === 'legacy') return { ...ownerScope, folder: null };
  if (typeof folderId !== 'string' || !/^[a-f\d]{24}$/i.test(folderId)) fail('Folder not found.', 404);
  const folder = await Folder.findOne({ ...ownerScope, _id: folderId }).lean();
  if (!folder) fail('Folder not found.', 404);
  return { ...ownerScope, folder: folder._id };
}

exports.listFolders = handle(async (req, res) => {
  const folders = await Folder.find(scope(req)).sort({ createdAt: 1 }).lean();
  res.json({ success: true, data: folders });
});

exports.createFolder = handle(async (req, res) => {
  const ownerScope = scope(req);
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().replace(/\s+/g, ' ') : '';
  if (!name || name.length > 120) fail('Enter a folder name between 1 and 120 characters.');
  await Folder.init();
  let folder;
  try {
    folder = await Folder.create({ ...ownerScope, name, nameKey: normalize(name) });
  } catch (error) {
    if (error.code === 11000) fail('A folder with this name already exists in this tab.', 409);
    throw error;
  }
  res.status(201).json({ success: true, data: folder });
});

const managerRoles = new Set(['salesmanager', 'admin']);
const requireManager = (req) => {
  const role = String(req.user?.role || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (!managerRoles.has(role)) fail('Only a Sales Manager or Admin can view all eCommerce sales data.', 403);
};

const validChannel = (req) => {
  if (!['cold-call', 'bulk-sms'].includes(req.params.channel)) fail('Unknown eCommerce tab.');
  return req.params.channel;
};

// Removes rows that repeat another row's `field` value in the same table, keeping the earliest
// (file order). Rows saved while the unique indexes were missing can repeat, which blocks the build.
async function removeRepeated(field) {
  for (let pass = 0; pass < 5; pass++) {
    const stages = [{ $match: { [field]: { $exists: true } } }, { $project: { table: 1, [field]: 1, createdAt: 1, position: 1 } }];
    if (field === 'contactKeys') stages.push({ $unwind: '$contactKeys' });
    stages.push(
      { $group: { _id: { t: '$table', k: `$${field}` }, rows: { $push: { _id: '$_id', c: '$createdAt', p: '$position' } }, n: { $sum: 1 } } },
      { $match: { n: { $gt: 1 } } },
    );
    const groups = await Row.collection.aggregate(stages, { allowDiskUse: true }).toArray();
    if (!groups.length) return;
    const repeats = new Map();
    for (const group of groups) {
      group.rows.sort((a, b) => (a.c - b.c) || ((a.p || 0) - (b.p || 0)) || String(a._id).localeCompare(String(b._id)))
        .slice(1).forEach((row) => repeats.set(String(row._id), row._id));
    }
    const ids = [...repeats.values()];
    for (let i = 0; i < ids.length; i += 1000) await Row.collection.deleteMany({ _id: { $in: ids.slice(i, i + 1000) } });
    console.log(`eCommerce tables: removed ${ids.length} rows repeating ${field}.`);
  }
}

// Builds the row indexes once per process, retrying on the next request after a failure.
let rowIndexes = null;
function ensureRowIndexes() {
  if (!rowIndexes) {
    rowIndexes = (async () => {
      await removeRepeated('fingerprint');
      await removeRepeated('contactKeys');
      await Row.createIndexes();
    })().catch((error) => { rowIndexes = null; throw error; });
  }
  return rowIndexes;
}

// Cleaning an old table can take a while, so it runs in the background; the page shows a
// notice and refreshes until the table's `cleaning` flag clears.
const cleaningTables = new Set();
function cleanInBackground(table) {
  const id = String(table._id);
  if ((table.dataVersion || 0) >= 3 || cleaningTables.has(id)) return;
  cleaningTables.add(id);
  removeContactDuplicates(table)
    .catch((error) => console.error('eCommerce duplicate cleanup failed:', error))
    .finally(() => cleaningTables.delete(id));
}

// Plain inserts are much faster than per-row upserts; the unique fingerprint index
// rejects rows already in the table (including ones sent by parallel batches).
async function insertRows(tableId, rows, createdAt = new Date()) {
  if (!rows.length) return 0;
  await ensureRowIndexes(); // Unique indexes must exist before imports can rely on them.
  const docs = rows.map((row) => ({ table: tableId, ...row, createdAt, updatedAt: createdAt }));
  try {
    return (await Row.collection.insertMany(docs, { ordered: false })).insertedCount;
  } catch (error) {
    const writeErrors = [].concat(error.writeErrors || []);
    if (writeErrors.length && writeErrors.every((e) => e.code === 11000) && !error.writeConcernErrors?.length && !error.writeConcernError) {
      return error.insertedCount ?? error.result?.insertedCount ?? 0;
    }
    throw error;
  }
}

// All batches of one upload share its start time so rows keep file order; clamp client clocks.
function importTime(value) {
  const now = Date.now();
  const time = Number(value);
  return new Date(Number.isFinite(time) && time <= now && time >= now - 24 * 60 * 60 * 1000 ? time : now);
}

async function migrateEmbeddedRows(table) {
  if (table.dataVersion >= 2) return;
  // Copy before clearing. Retrying after interruption is safe because fingerprints are unique.
  const createdAt = table.createdAt ? new Date(table.createdAt) : new Date();
  for (let offset = 0; offset < (table.rows || []).length; offset += 500) {
    await insertRows(table._id, table.rows.slice(offset, offset + 500).map((row, i) => ({ ...row, position: offset + i })), createdAt);
  }
  await Table.updateOne({ _id: table._id }, { $set: { rows: [], dataVersion: 2 } });
  table.rows = [];
  table.dataVersion = 2;
}

// Returns one page of rows (or every row's values for export/SMS) so large tables load quickly.
async function tableData(table, { summaryOnly = false, page = 1, search = '', all = false, duplicates = false } = {}) {
  const { rows: legacyRows, dedupeStartedAt, ...rest } = table;
  const metadata = { ...rest, cleaning: (table.dataVersion || 0) < 3 };
  const rowCount = await Row.countDocuments({ table: table._id });
  if (summaryOnly) return { ...metadata, rowCount };
  const filter = { table: table._id };
  const term = String(search || '').trim().slice(0, 200);
  if (term) filter.values = { $regex: escapeRegex(term), $options: 'i' };
  if (all) {
    const rows = await Row.find(filter).select('-_id values').sort(ROW_ORDER).lean();
    return { ...metadata, rows, rowCount, matchCount: rows.length, page: 1, pageSize: rows.length };
  }
  if (duplicates) return { ...metadata, ...(await duplicateRows(table, filter, page)), rowCount, pageSize: PAGE_SIZE, duplicatesOnly: true };
  const matchCount = term ? await Row.countDocuments(filter) : rowCount;
  const current = Math.min(Math.max(1, parseInt(page, 10) || 1), Math.max(1, Math.ceil(matchCount / PAGE_SIZE)));
  const rows = await Row.find(filter).select('id values fingerprint').sort(ROW_ORDER)
    .skip((current - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean();
  return { ...metadata, rows, rowCount, matchCount, page: current, pageSize: PAGE_SIZE };
}

const isDuplicateKeyBatch = (error) => {
  const writeErrors = [].concat(error.writeErrors || []);
  return writeErrors.length && writeErrors.every((e) => e.code === 11000) && !error.writeConcernErrors?.length && !error.writeConcernError;
};

// Keeps the first row of each contact (file order) and deletes later rows with the same phone,
// email or (if neither) business name; identical rows always match. Runs once automatically for
// tables saved before contact keys, and on demand (force) from the "Remove duplicates" button.
// Returns the number of rows removed.
async function removeContactDuplicates(table, { force = false } = {}) {
  if (!force && (table.dataVersion || 0) >= 3) return 0;
  const staleLock = new Date(Date.now() - 10 * 60 * 1000);
  const claimed = await Table.findOneAndUpdate(
    { _id: table._id, ...(force ? {} : { dataVersion: { $lt: 3 } }), $or: [{ dedupeStartedAt: { $exists: false } }, { dedupeStartedAt: null }, { dedupeStartedAt: { $lt: staleLock } }] },
    { $set: { dedupeStartedAt: new Date() } },
  ).lean();
  if (!claimed) {
    if (force) fail('Duplicates are already being removed from this table. Wait a moment and refresh.', 409);
    return 0; // Another request is already cleaning this table.
  }
  try {
    const removed = await scanAndRemoveDuplicates(table);
    await Table.updateOne({ _id: table._id }, { $set: { dataVersion: 3 }, $unset: { dedupeStartedAt: 1 }, $inc: { revision: 1 } });
    table.dataVersion = 3;
    // With repeats gone the unique indexes can be built; a failure here must not undo the cleanup.
    await ensureRowIndexes().catch((error) => console.error('eCommerce row indexes not built:', error));
    return removed;
  } catch (error) {
    await Table.updateOne({ _id: table._id }, { $unset: { dedupeStartedAt: 1 } }).catch(() => {}); // release the lock
    throw error;
  }
}

async function scanAndRemoveDuplicates(table) {
  const layout = keyColumns(table.columns);
  const seen = new Set();
  let removed = 0;
  let updates = [];
  let removals = [];
  const flush = async () => {
    removed += removals.length;
    if (removals.length) await Row.deleteMany({ _id: { $in: removals } });
    if (updates.length) {
      try {
        await Row.collection.bulkWrite(updates, { ordered: false });
      } catch (error) {
        if (!isDuplicateKeyBatch(error)) throw error;
        // A row imported meanwhile already holds this contact: the older copy is the duplicate.
        const ids = [].concat(error.writeErrors).map((e) => updates[e.index].updateOne.filter._id);
        removed += ids.length;
        await Row.deleteMany({ _id: { $in: ids } });
      }
    }
    updates = []; removals = [];
  };
  const cursor = Row.find({ table: table._id }).select('_id values contactKeys').sort(ROW_ORDER).lean().cursor();
  for await (const row of cursor) {
    const keys = contactKeys(table.columns, row.values, layout);
    if (keys.some((key) => seen.has(key))) removals.push(row._id);
    else {
      keys.forEach((key) => seen.add(key));
      updates.push({ updateOne: { filter: { _id: row._id }, update: { $set: { contactKeys: keys } } } });
    }
    if (updates.length + removals.length >= 1000) await flush();
  }
  await flush();
  return removed;
}

// "Show duplicates" filter: rows whose contact (phone, email or name) appears more than once,
// each group's copies listed together, first-saved copy first.
async function duplicateRows(table, filter, page) {
  const layout = keyColumns(table.columns);
  const groupOf = new Map(); // contact key -> group number
  const sizes = [];
  const all = [];
  const cursor = Row.find(filter).select('id values fingerprint').sort(ROW_ORDER).lean().cursor();
  for await (const row of cursor) {
    const keys = contactKeys(table.columns, row.values, layout);
    let group = keys.map((key) => groupOf.get(key)).find((g) => g !== undefined);
    if (group === undefined) { group = sizes.length; sizes.push(0); }
    keys.forEach((key) => { if (!groupOf.has(key)) groupOf.set(key, group); });
    sizes[group]++;
    all.push({ row, group });
  }
  const repeated = all.filter(({ group }) => sizes[group] > 1).sort((a, b) => a.group - b.group).map(({ row }) => row);
  const duplicateCount = sizes.reduce((n, size) => n + Math.max(0, size - 1), 0);
  const current = Math.min(Math.max(1, parseInt(page, 10) || 1), Math.max(1, Math.ceil(repeated.length / PAGE_SIZE)));
  return { rows: repeated.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), matchCount: repeated.length, page: current, duplicateCount };
}

async function ownedTable(req) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) fail('Table not found.', 404);
  const table = await Table.findOne({ ...scope(req), _id: req.params.id }).lean();
  if (!table) fail('Table not found.', 404);
  await migrateEmbeddedRows(table);
  cleanInBackground(table);
  return table;
}

async function managerTable(req) {
  requireManager(req);
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) fail('Table not found.', 404);
  const table = await Table.findOne({ channel: validChannel(req), _id: req.params.id })
    .populate('owner', 'fullName username email role')
    .lean();
  if (!table) fail('Table not found.', 404);
  await migrateEmbeddedRows(table);
  cleanInBackground(table);
  return table;
}

// Sales Manager oversight is intentionally read-only. It exposes every sales user's saved
// eCommerce worksheet while all create, edit and delete routes remain owner-scoped.
exports.managerList = handle(async (req, res) => {
  requireManager(req);
  const tables = await Table.find({ channel: validChannel(req) })
    .select('-rows')
    .populate('owner', 'fullName username email role')
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();
  const data = await Promise.all(tables.map(async (table) => ({
    ...table,
    rowCount: await Row.countDocuments({ table: table._id }),
  })));
  res.json({ success: true, data });
});

exports.managerGet = handle(async (req, res) => {
  const { page, search, all } = req.query || {};
  res.json({ success: true, data: await tableData(await managerTable(req), {
    page,
    search,
    all: all === '1',
  }) });
});

exports.list = handle(async (req, res) => {
  const filter = req.query?.folderId === undefined ? scope(req) : await folderScope(req, req.query.folderId);
  const tables = await Table.find(filter).select('-rows').sort({ createdAt: 1 }).lean();
  res.json({ success: true, data: tables });
});

exports.get = handle(async (req, res) => {
  const { page, search, all, duplicates } = req.query || {};
  res.json({ success: true, data: await tableData(await ownedTable(req), { page, search, all: all === '1', duplicates: duplicates === '1' }) });
});

// "Remove duplicates" button: runs the cleanup now and reports how many rows were removed.
exports.removeDuplicates = handle(async (req, res) => {
  const table = await ownedTable(req);
  let removed;
  try {
    removed = await removeContactDuplicates(table, { force: true });
  } catch (error) {
    if (error.status) throw error;
    console.error('eCommerce duplicate removal failed:', error);
    fail(`Duplicates could not be removed: ${error.message}`, 500);
  }
  const saved = await Table.findOne({ _id: table._id }).lean();
  res.json({ success: true, removed, data: await tableData(saved, { summaryOnly: true }) });
});

exports.importRows = handle(async (req, res) => {
  const imported = validateImport(req.body);
  const ownerScope = req.body.folderId === undefined ? scope(req) : await folderScope(req, req.body.folderId);
  // Preserve the existing unique index and legacy keys; identical tables in different
  // folders get separate identities, including during concurrent batch imports.
  const key = ownerScope.folder ? `${ownerScope.folder}:${imported.key}` : imported.key;
  const filter = { ...ownerScope, key };
  await Table.init();
  let table = await Table.findOne(filter).lean();
  if (!table) {
    try {
      table = (await Table.create({ ...filter, name: imported.name, columns: imported.columns, widths: imported.widths, rows: [], dataVersion: 3 })).toObject();
    } catch (error) {
      if (error.code !== 11000) throw error;
      table = await Table.findOne(filter).lean();
      if (!table) throw error;
    }
  }
  await migrateEmbeddedRows(table);
  cleanInBackground(table);
  const prepared = mergeRows([], imported.rows, imported.columns, table.columns);
  const offset = Math.max(0, Math.floor(Number(req.body.offset) || 0));
  const added = await insertRows(table._id, prepared.rows.map((row, i) => ({ ...row, position: offset + i })), importTime(req.body.importStartedAt));
  await Table.updateOne({ _id: table._id }, { $inc: { revision: 1 } });
  const saved = await Table.findOne(filter).lean();
  res.json({ success: true, data: await tableData(saved, { summaryOnly: true }), added,
    duplicates: prepared.duplicates + prepared.rows.length - added, blank: prepared.blank });
});

// Archive presentation metadata only; never rewrite columns, row values or deduplication keys.
exports.setColumnArchived = handle(async (req, res) => {
  const ownerScope = scope(req);
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) fail('Table not found.', 404);
  const { archived, revision } = req.body || {};
  const rawIndex = req.params.columnIndex;
  if (!/^(0|[1-9]\d*)$/.test(rawIndex || '') || typeof archived !== 'boolean' ||
      !Number.isSafeInteger(revision) || revision < 0) {
    fail('Provide a valid column index, archived flag and table revision.');
  }
  const index = Number(rawIndex);
  const table = await Table.findOne({ ...ownerScope, _id: req.params.id }).lean();
  if (!table) fail('Table not found.', 404);
  if (!Number.isSafeInteger(index) || index >= table.columns.length) fail('Column not found.', 404);
  if (table.revision !== revision) fail('This table changed. Refresh and try again.', 409);
  const hidden = new Set(table.archivedColumns || []);
  if (archived) hidden.add(index);
  else hidden.delete(index);
  if (hidden.size >= table.columns.length) fail('Keep at least one visible column.');
  const saved = await Table.findOneAndUpdate(
    { ...ownerScope, _id: table._id, revision },
    { $set: { archivedColumns: [...hidden].sort((a, b) => a - b) }, $inc: { revision: 1 } },
    { new: true },
  ).select('archivedColumns revision').lean();
  if (!saved) fail('This table changed. Refresh and try again.', 409);
  res.json({ success: true, data: { archivedColumns: saved.archivedColumns, revision: saved.revision } });
});

exports.updateRow = handle(async (req, res) => {
  const table = await ownedTable(req);
  validateImport({ name: table.name, columns: table.columns, rows: [req.body.values] });
  if (req.body.values.every((v) => !normalize(v))) fail('Enter at least one value.');
  const current = await Row.findOne({ table: table._id, id: req.params.rowId }).lean();
  if (!current) fail('Row not found.', 404);
  const expected = req.body.expectedFingerprint;
  if (expected ? expected !== current.fingerprint : req.body.revision !== table.revision) {
    fail('This row changed. Refresh the table before saving your edit.', 409);
  }
  let saved;
  try {
    saved = await Row.findOneAndUpdate(
      { table: table._id, id: req.params.rowId, fingerprint: current.fingerprint },
      { $set: { values: req.body.values, fingerprint: rowFingerprint(table.columns, req.body.values), contactKeys: contactKeys(table.columns, req.body.values) } }, { new: true },
    ).select('id values fingerprint').lean();
    if (!saved) fail('This row changed. Refresh the table before saving your edit.', 409);
  } catch (error) {
    if (error.code === 11000) fail('Another row in this table already has this phone number or email.', 409);
    throw error;
  }
  await Table.updateOne({ _id: table._id }, { $inc: { revision: 1 } });
  res.json({ success: true, data: saved });
});

// Removes a table and all its rows (owner and tab scoped).
exports.remove = handle(async (req, res) => {
  const table = await ownedTable(req);
  await Row.deleteMany({ table: table._id });
  await Table.deleteOne({ _id: table._id });
  res.json({ success: true });
});

// The folder UI always supplies folderId so bulk deletion stays inside that folder.
exports.removeAll = handle(async (req, res) => {
  const filter = req.query?.folderId === undefined ? scope(req) : await folderScope(req, req.query.folderId);
  const ids = (await Table.find(filter).select('_id').lean()).map((t) => t._id);
  if (ids.length) {
    await Row.deleteMany({ table: { $in: ids } });
    await Table.deleteMany({ _id: { $in: ids } });
  }
  res.json({ success: true, deletedTables: ids.length });
});
