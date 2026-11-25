const ownerId = (item) => String(item.owner?._id || item.owner || '');
const rowCount = (table) => Math.max(0, Number(table.rowCount) || 0);

export function summarizeImportCatalogs(catalogs) {
  const owners = new Set();
  let lastUpdated = null;
  const channels = catalogs.map(({ channel, folders = [], tables = [] }) => {
    const channelOwners = new Set([...folders, ...tables].map(ownerId).filter(Boolean));
    channelOwners.forEach((id) => owners.add(id));
    const usedFolders = new Set(tables.map((table) => String(table.folder?._id || table.folder || '')));
    tables.forEach((table) => {
      const timestamp = Date.parse(table.updatedAt || table.createdAt);
      if (Number.isFinite(timestamp) && (lastUpdated === null || timestamp > lastUpdated)) lastUpdated = timestamp;
    });
    return {
      channel, folders: folders.length, tables: tables.length,
      rows: tables.reduce((sum, table) => sum + rowCount(table), 0),
      salesUsers: channelOwners.size,
      emptyFolders: folders.filter((folder) => !usedFolders.has(String(folder._id))).length,
      emptyTables: tables.filter((table) => rowCount(table) === 0).length,
      unfiledTables: tables.filter((table) => !table.folder).length,
    };
  });
  const totals = Object.fromEntries(['folders', 'tables', 'rows', 'emptyFolders', 'emptyTables', 'unfiledTables']
    .map((key) => [key, channels.reduce((sum, channel) => sum + channel[key], 0)]));
  return { ...totals, salesUsers: owners.size, lastUpdated, channels };
}
