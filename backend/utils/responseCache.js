// Small stale-while-revalidate cache for computed dashboard responses.
// A fresh value is served from memory; after `ttlMs` the stale value is still
// served instantly while one background load refreshes it. Concurrent callers
// for the same key share a single in-flight load. Failed loads are not cached.
const createResponseCache = ({ name, ttlMs = 60 * 1000, maxEntries = 50 }) => {
  const entries = new Map(); // key -> { value?, at, loader, loading, reloadAfter }
  let generation = 0;

  const load = (key, loader) => {
    let entry = entries.get(key);
    if (!entry) {
      entry = { at: 0 };
      entries.set(key, entry);
      if (entries.size > maxEntries) entries.delete(entries.keys().next().value);
    }
    entry.loader = loader;
    if (entry.loading) return entry.loading;
    const startedIn = generation;
    entry.loading = Promise.resolve()
      .then(loader)
      .then((value) => {
        // A clear() during the load means the value may predate a write.
        if (startedIn === generation) {
          entry.value = value;
          entry.at = Date.now();
        }
        return value;
      })
      .finally(() => {
        entry.loading = null;
        // A write landed while this load ran; load once more so it is included.
        if (entry.reloadAfter && entries.get(key) === entry) {
          entry.reloadAfter = false;
          refreshEntry(key, entry);
        }
      });
    return entry.loading;
  };

  const refreshEntry = (key, entry) => {
    load(key, entry.loader).catch((error) => console.warn(`${name} cache refresh failed:`, error.message));
  };

  const get = async (key, loader) => {
    const entry = entries.get(key);
    if (!entry || !('value' in entry)) return load(key, loader);
    if (Date.now() - entry.at > ttlMs) {
      load(key, loader).catch((error) => console.warn(`${name} cache refresh failed:`, error.message));
    }
    return entry.value;
  };

  // Drops every value so the next read waits for a fresh load. Use when callers
  // must see their own write at once (e.g. a list they just added to).
  const clear = () => {
    generation += 1;
    entries.clear();
  };

  // Keeps serving the current values but recomputes them right away in the
  // background. Use for dashboard totals where a second of lag is fine.
  const refresh = () => {
    entries.forEach((entry, key) => {
      if (!('value' in entry)) return;
      if (entry.loading) entry.reloadAfter = true;
      else refreshEntry(key, entry);
    });
  };

  return { get, clear, refresh };
};

// Answers an Express handler from the cache. The handler runs against a
// recording response; error answers are passed through but never cached.
// Only for handlers whose answer does not depend on the caller beyond `keyFor`.
const cacheHandler = (cache, handler, keyFor = () => 'all') => async (req, res, next) => {
  const run = () => new Promise((resolve, reject) => {
    const recorder = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ status: this.statusCode, body }); return this; },
      set() { return this; },
      setHeader() {},
    };
    Promise.resolve(handler(req, recorder, reject)).catch(reject);
  }).then((result) => {
    if (result.status >= 400) throw Object.assign(new Error('Uncacheable answer'), { result });
    return result;
  });

  try {
    const { status, body } = await cache.get(keyFor(req), run);
    res.status(status).json(body);
  } catch (error) {
    if (error.result) {
      res.status(error.result.status).json(error.result.body);
      return;
    }
    next(error);
  }
};

module.exports = { createResponseCache, cacheHandler };
