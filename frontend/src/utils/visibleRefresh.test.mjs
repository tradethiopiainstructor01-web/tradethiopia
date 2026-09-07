import assert from 'node:assert/strict';
import test from 'node:test';
import { startVisibleRefresh } from './visibleRefresh.js';

test('refreshes on focus and interval, skips hidden tabs and overlapping requests, and cleans up', async () => {
  const windowEvents = new Map();
  const documentEvents = new Map();
  let tick;
  let cleared = false;
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  globalThis.window = {
    setInterval: (callback, delay) => { assert.equal(delay, 15000); tick = callback; return 1; },
    clearInterval: () => { cleared = true; },
    addEventListener: (name, callback) => windowEvents.set(name, callback),
    removeEventListener: (name) => windowEvents.delete(name),
  };
  globalThis.document = {
    visibilityState: 'visible',
    addEventListener: (name, callback) => documentEvents.set(name, callback),
    removeEventListener: (name) => documentEvents.delete(name),
  };
  try {
    let calls = 0;
    let finish;
    const stop = startVisibleRefresh(() => {
      calls++;
      return new Promise((resolve) => { finish = resolve; });
    });
    windowEvents.get('focus')();
    tick();
    assert.equal(calls, 1);
    finish();
    await new Promise(setImmediate);
    document.visibilityState = 'hidden';
    tick();
    assert.equal(calls, 1);
    document.visibilityState = 'visible';
    documentEvents.get('visibilitychange')();
    assert.equal(calls, 2);
    finish();
    stop();
    assert.equal(cleared, true);
    assert.equal(windowEvents.size, 0);
    assert.equal(documentEvents.size, 0);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }
});
