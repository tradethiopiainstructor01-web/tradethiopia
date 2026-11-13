import axiosInstance from './axiosInstance';

const base = (channel) => `/ecommerce-tables/${channel}`;
export const listEcommerceFolders = async (channel) => (await axiosInstance.get(`${base(channel)}/folders`)).data.data;
export const createEcommerceFolder = async (channel, name) => (await axiosInstance.post(`${base(channel)}/folders`, { name })).data.data;
export const listEcommerceTables = async (channel, folderId) => (await axiosInstance.get(base(channel), { params: { folderId } })).data.data;
// Returns one page of rows: { rows, rowCount, matchCount, page, pageSize }.
export const getEcommerceTable = async (channel, id, params = {}) => (
  await axiosInstance.get(`${base(channel)}/${id}`, { params })
).data.data;
export const getAllEcommerceRows = async (channel, id) => (await getEcommerceTable(channel, id, { all: 1 })).rows;
export const importEcommerceRows = async (channel, table) => (await axiosInstance.post(`${base(channel)}/import`, table)).data;
export const updateEcommerceRow = async (channel, tableId, row, values) => (
  await axiosInstance.put(`${base(channel)}/${tableId}/rows/${row.id}`, { values, expectedFingerprint: row.fingerprint })
).data.data;
export const deleteEcommerceTable = async (channel, id) => (await axiosInstance.delete(`${base(channel)}/${id}`)).data;
export const deleteAllEcommerceTables = async (channel, folderId) => (await axiosInstance.delete(base(channel), { params: { folderId } })).data;

// Keeps the first row of each contact (phone, email, or name) and deletes the repeats. Returns { removed, data }.
export const removeEcommerceDuplicates = async (channel, tableId) => (
  await axiosInstance.post(`${base(channel)}/${tableId}/remove-duplicates`)
).data;
// Removes/restores a column in the saved view without erasing its original values.
export const setEcommerceColumnArchived = async (channel, tableId, columnIndex, archived, revision) => (
  await axiosInstance.patch(`${base(channel)}/${tableId}/columns/${columnIndex}`, { archived, revision })
).data.data;
