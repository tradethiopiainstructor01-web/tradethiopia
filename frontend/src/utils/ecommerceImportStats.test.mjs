import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeImportCatalogs } from './ecommerceImportStats.js';

test('overview counts both channels without counting shared sales users twice', () => {
  const stats = summarizeImportCatalogs([
    { channel: 'cold-call', folders: [{ _id: 'a', owner: { _id: 'sales1' } }, { _id: 'empty', owner: 'sales2' }], tables: [
      { folder: 'a', owner: 'sales1', rowCount: 12, updatedAt: '2026-11-20T12:00:00Z' },
      { folder: null, owner: null, rowCount: 0, updatedAt: 'invalid' },
    ] },
    { channel: 'bulk-sms', folders: [{ _id: 'b', owner: 'sales1' }], tables: [
      { folder: { _id: 'b' }, owner: { _id: 'sales1' }, rowCount: 8, updatedAt: '2026-11-25T12:00:00Z' },
    ] },
  ]);
  assert.equal(stats.folders, 3);
  assert.equal(stats.tables, 3);
  assert.equal(stats.rows, 20);
  assert.equal(stats.salesUsers, 2);
  assert.equal(stats.emptyFolders, 1);
  assert.equal(stats.emptyTables, 1);
  assert.equal(stats.unfiledTables, 1);
  assert.equal(stats.lastUpdated, Date.parse('2026-11-25T12:00:00Z'));
  assert.deepEqual(stats.channels.map((channel) => channel.rows), [12, 8]);
});

test('empty channels show zero totals and no last update', () => {
  const stats = summarizeImportCatalogs([{ channel: 'cold-call' }, { channel: 'bulk-sms' }]);
  assert.equal(stats.rows, 0);
  assert.equal(stats.tables, 0);
  assert.equal(stats.folders, 0);
  assert.equal(stats.salesUsers, 0);
  assert.equal(stats.lastUpdated, null);
});
