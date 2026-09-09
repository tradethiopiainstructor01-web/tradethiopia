import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('./studentRegistrationService.js', import.meta.url), 'utf8');
function loadService(get) {
  const context = { axiosInstance: { get } };
  vm.runInNewContext(source.replace(/^import .*;\r?\n/m, '').replaceAll('export const ', 'const ') +
    ';globalThis.fetchList = getStudentRegistrationsInBatches;', context);
  return context.fetchList;
}

test('collects all cursor pages and forwards cancellation without starting repairs', async () => {
  const signal = new AbortController().signal;
  let calls = 0;
  const fetchList = loadService(async (url, config) => {
    assert.equal(url, '/student-registrations');
    assert.equal(config.signal, signal);
    assert.equal(config.params.batchSize, 100);
    assert.equal(config.params.autoSync, 'false');
    assert.equal(config.params.cursor, calls ? 'next' : undefined);
    calls++;
    return { data: { data: [{ id: calls }], nextCursor: calls === 1 ? 'next' : null } };
  });
  const result = await fetchList({ signal });
  assert.equal(calls, 2);
  assert.equal(JSON.stringify(result), '[{"id":1},{"id":2}]');
});

test('failed later pages reject instead of returning an incomplete list', async () => {
  let calls = 0;
  const failure = new Error('timeout');
  const fetchList = loadService(async () => {
    if (calls++) throw failure;
    return { data: { data: [{ id: 1 }], nextCursor: 'next' } };
  });
  await assert.rejects(fetchList(), (error) => error === failure);
});

test('invalid responses and repeated cursors fail instead of looking empty or looping', async () => {
  await assert.rejects(loadService(async () => ({ data: {} }))(), /invalid registration list/);
  await assert.rejects(loadService(async () => ({ data: { data: [], nextCursor: 'same' } }))(), /finish loading/);
});
