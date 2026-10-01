const { EventEmitter } = require('events');

// Emits 'change' (document id) for writes made through Mongoose, and 'bulkChange'
// when a query-level write cannot be traced to specific ids.
const attachListEvents = (schema) => {
  const events = new EventEmitter();
  const emitDocumentChange = (doc) => {
    if (doc?._id) events.emit('change', String(doc._id));
  };
  schema.post('save', emitDocumentChange);
  schema.post(['findOneAndUpdate', 'findOneAndReplace', 'findOneAndDelete'], emitDocumentChange);
  schema.post('insertMany', (docs) => (docs || []).forEach(emitDocumentChange));
  schema.post(['updateOne', 'updateMany', 'replaceOne', 'deleteOne', 'deleteMany'], function emitQueryChange() {
    const id = this.getFilter?.()?._id;
    let ids = null;
    if (Array.isArray(id?.$in)) ids = id.$in;
    else if (typeof id === 'string' || id?._bsontype) ids = [id];
    if (ids) ids.forEach((value) => events.emit('change', String(value)));
    else events.emit('bulkChange');
  });
  return events;
};

// In-memory copy of a whole collection list. Reading thousands of records from
// Atlas can take longer than a client timeout on slow links, so list requests are
// answered from memory. Change events patch single records immediately; after the
// TTL a stale copy is served while a background reload runs.
const createListCache = ({ name, load, loadOne, events, ttlMs = 2 * 60 * 1000 }) => {
  const state = { byId: null, loadedAt: 0, loading: null, dirtyIds: new Set(), patches: new Set(), mustReload: false };

  const patch = async (id) => {
    if (!state.byId) return;
    const doc = await loadOne(id);
    if (doc) state.byId.set(id, doc);
    else state.byId.delete(id);
  };

  const onChange = (id) => {
    // Re-read after a reload finishes too, in case its snapshot predates this write.
    if (state.loading) state.dirtyIds.add(id);
    const pending = patch(id)
      .catch((error) => {
        console.warn(`${name} cache patch failed:`, error.message);
        state.mustReload = true;
      })
      .finally(() => state.patches.delete(pending));
    state.patches.add(pending);
  };

  const reload = () => {
    if (state.loading) return state.loading;
    state.dirtyIds.clear();
    state.mustReload = false;
    state.loading = (async () => {
      const docs = await load();
      state.byId = new Map(docs.map((doc) => [String(doc._id), doc]));
      state.loadedAt = Date.now();
      const dirtyIds = [...state.dirtyIds];
      state.dirtyIds.clear();
      await Promise.all(dirtyIds.map((id) => patch(id).catch(() => { state.mustReload = true; })));
      return state.byId;
    })().finally(() => { state.loading = null; });
    return state.loading;
  };

  const get = async () => {
    // Untraceable local writes must be visible on the next read, so wait for them.
    if (!state.byId || state.mustReload) return reload();
    if (Date.now() - state.loadedAt > ttlMs) {
      reload().catch((error) => console.warn(`${name} cache refresh failed:`, error.message));
    }
    // Writes that just finished must be visible to the read that follows them.
    if (state.patches.size) await Promise.all([...state.patches]);
    return state.byId;
  };

  const warm = () => reload()
    .then((docs) => console.log(`${name} cache ready (${docs.size} records)`))
    .catch((error) => console.warn(`${name} cache warm-up failed:`, error.message));

  if (events) {
    events.on('change', onChange);
    events.on('bulkChange', () => { state.mustReload = true; });
  }

  return { get, warm, peek: () => state.byId };
};

module.exports = { attachListEvents, createListCache };
