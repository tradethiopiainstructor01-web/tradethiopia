// Behaviour test for utils/responseCache (stale-while-revalidate dashboard cache).
const assert = require('assert');
const { createResponseCache, cacheHandler } = require('../utils/responseCache');

const tick = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  // Concurrent callers share one load.
  let loads = 0;
  let value = 1;
  const loader = async () => { loads += 1; await tick(20); return value; };
  const cache = createResponseCache({ name: 'test', ttlMs: 50 });
  const [a, b] = await Promise.all([cache.get('k', loader), cache.get('k', loader)]);
  assert.deepStrictEqual([a, b, loads], [1, 1, 1]);

  // Fresh value is served without loading.
  assert.strictEqual(await cache.get('k', loader), 1);
  assert.strictEqual(loads, 1);

  // Stale value is served at once and refreshed in the background.
  value = 2;
  await tick(60);
  assert.strictEqual(await cache.get('k', loader), 1);
  await tick(40);
  assert.strictEqual(await cache.get('k', loader), 2);
  assert.strictEqual(loads, 2);

  // clear(): next read waits for a fresh value; a load running during clear is discarded.
  value = 3;
  cache.clear();
  assert.strictEqual(await cache.get('k', loader), 3);
  value = 4;
  const slow = createResponseCache({ name: 'slow', ttlMs: 1000 });
  const pending = slow.get('k', loader); // started before the write
  slow.clear();
  assert.strictEqual(await pending, 4);
  value = 5;
  assert.strictEqual(await slow.get('k', loader), 5, 'value loaded across a clear must not be cached');

  // refresh(): keeps serving, recomputes in the background, and reloads again
  // if a write lands while a load is running.
  const r = createResponseCache({ name: 'refresh', ttlMs: 60 * 1000 });
  value = 10;
  assert.strictEqual(await r.get('k', loader), 10);
  value = 11;
  r.refresh();
  assert.strictEqual(await r.get('k', loader), 10, 'refresh keeps serving the old value');
  await tick(5);
  value = 12;
  r.refresh(); // during the running load
  await tick(80);
  assert.strictEqual(await r.get('k', loader), 12, 'write during a load triggers one more load');

  // Failures are not cached.
  const f = createResponseCache({ name: 'fail', ttlMs: 1000 });
  let fail = true;
  await assert.rejects(f.get('k', async () => { if (fail) throw new Error('boom'); return 'ok'; }));
  fail = false;
  assert.strictEqual(await f.get('k', async () => 'ok'), 'ok');

  // cacheHandler: caches 200 answers, passes errors through uncached.
  const h = createResponseCache({ name: 'handler', ttlMs: 1000 });
  let calls = 0;
  let status = 500;
  const handler = (req, res) => { calls += 1; res.status(status).json({ calls }); };
  const respond = () => new Promise((resolve) => {
    cacheHandler(h, handler)({}, { status(code) { this.code = code; return this; }, json(body) { resolve([this.code, body]); } }, resolve);
  });
  assert.deepStrictEqual(await respond(), [500, { calls: 1 }]);
  status = 200;
  assert.deepStrictEqual(await respond(), [200, { calls: 2 }]);
  assert.deepStrictEqual(await respond(), [200, { calls: 2 }]);

  console.log('responseCache: all checks passed');
})().catch((error) => { console.error(error); process.exit(1); });
