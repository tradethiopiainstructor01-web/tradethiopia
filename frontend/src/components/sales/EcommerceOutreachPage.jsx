import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, AlertIcon, Badge, Box, Button, Checkbox, Flex, FormControl, FormLabel,
  Heading, HStack, IconButton, Input, Menu, MenuButton, MenuItem, MenuList, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Portal, Progress, Select, SimpleGrid, Spinner, Tab,
  Table, TabList, TabPanel, TabPanels, Tabs, Tbody, Td, Text, Textarea, Th,
  Thead, Tr, VStack, useDisclosure, useToast,
} from '@chakra-ui/react';
import { FiDownload, FiEdit2, FiMoreVertical, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import {
  REFERENCE_CATEGORIES, REFERENCE_COLUMNS, parsePastedTable, prepareTable, readWorkbook,
  checkWorkbookFile, prepareWorkbookSheets, importPreparedTables, MAX_IMPORT_FILE_MB,
  REFERENCE_WIDTHS, isReferenceFormat, mapTableToReference, displayOrder, tableColumnWidth,
} from '../../utils/ecommerceImport';
import {
  deleteAllEcommerceTables, deleteEcommerceTable, removeEcommerceDuplicates, getAllEcommerceRows, getEcommerceTable, importEcommerceRows, listEcommerceTables, updateEcommerceRow, setEcommerceColumnArchived,
} from '../../services/ecommerceTableService';
import { normalizePhoneNumber } from '../../utils/normalizePhoneNumber';
import { sendBulkSms } from '../../services/calledCallService';

const errorMessage = (error) => error.response?.data?.message || error.message || 'Please try again.';
const emptyTable = (name) => ({
  name, columns: REFERENCE_COLUMNS, widths: REFERENCE_WIDTHS, rows: [], rowCount: 0, matchCount: 0, page: 1, pageSize: 50,
});

// Parse in a Web Worker so a 20 MB workbook doesn't freeze the page; fall back to the main thread.
async function prepareWorkbookFile(file, options) {
  checkWorkbookFile(file);
  const onMainThread = async () => prepareWorkbookSheets(await readWorkbook(file), options);
  let worker;
  try {
    worker = new Worker(new URL('../../utils/ecommerceWorkbook.worker.js', import.meta.url), { type: 'module' });
  } catch { return onMainThread(); }
  try {
    const bytes = await file.arrayBuffer();
    return await new Promise((resolve, reject) => {
      worker.onmessage = ({ data }) => (data.error ? reject(new Error(data.error)) : resolve(data.prepared));
      worker.onerror = (event) => { event.preventDefault?.(); reject(Object.assign(new Error('worker failed'), { workerFailed: true })); };
      worker.postMessage({ bytes, options }, [bytes]);
    });
  } catch (error) {
    if (error.workerFailed) return onMainThread();
    throw error;
  } finally { worker.terminate(); }
}

function ColumnHeader({ label, onArchive, disabled }) {
  const menu = useDisclosure();
  const buttonRef = useRef(null);
  const openContextMenu = (event) => {
    if (!onArchive) return;
    event.preventDefault();
    if (!disabled) { buttonRef.current?.focus(); menu.onOpen(); }
  };
  return (
    <Th py={4} textTransform="none" color="gray.800" whiteSpace="normal" overflowWrap="anywhere"
      onContextMenu={openContextMenu} onKeyDown={(event) => {
        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) openContextMenu(event);
      }}>
      <HStack justify="space-between"><Text as="span">{label}</Text>{onArchive && (
        <Menu isOpen={menu.isOpen && !disabled} onOpen={menu.onOpen} onClose={menu.onClose} placement="bottom-end" isLazy>
          <MenuButton ref={buttonRef} as={IconButton} aria-label={`Column actions for ${label}`} icon={<FiMoreVertical />} size="xs" variant="ghost" isDisabled={disabled} />
          <Portal><MenuList textTransform="none" fontWeight="normal">
            <MenuItem icon={<FiTrash2 />} onClick={() => onArchive()}>Delete column</MenuItem>
          </MenuList></Portal>
        </Menu>
      )}</HStack>
    </Th>
  );
}

// Fixed column sizes keep preview and saved tables consistent across source workbooks.
function DataTable({ columns, rows, onEdit = undefined, onArchive = undefined, columnsDisabled = false, order = displayOrder(columns) }) {
  const width = 64 + (onEdit ? 80 : 0) + order.reduce((total, i) => total + tableColumnWidth(columns[i]), 0);
  return (
    <Box overflowX="auto" maxH="60vh" border="1px solid" borderColor="gray.200" borderRadius="lg">
      <Table size="sm" variant="simple" w={`${width}px`} sx={{ tableLayout: 'fixed', 'th, td': { borderRight: '1px solid', borderColor: 'gray.200' } }}>
        <colgroup><col style={{ width: 64 }} />{order.map((i) => <col key={i} style={{ width: tableColumnWidth(columns[i]) }} />)}{onEdit && <col style={{ width: 80 }} />}</colgroup>
        <Thead position="sticky" top={0} zIndex={1} bg="teal.50">
          <Tr><Th w="50px">#</Th>{order.map((i) => (
            <ColumnHeader key={i} label={columns[i]} onArchive={onArchive ? () => onArchive(i) : undefined} disabled={columnsDisabled || order.length <= 1} />
          ))}{onEdit && <Th>Edit</Th>}</Tr>
        </Thead>
        <Tbody>
          {rows.map((row, index) => (
            <Tr key={row.id || index} bg={index % 2 ? 'gray.50' : 'white'} _hover={{ bg: 'teal.50' }}>
              <Td color="gray.500">{row.number || index + 1}</Td>
              {order.map((i) => <Td key={i} py={3} verticalAlign="top" whiteSpace="pre-wrap" overflowWrap="anywhere">{(Array.isArray(row) ? row : row.values)[i]}</Td>)}
              {onEdit && <Td><Button size="xs" aria-label={`Edit row ${row.number || index + 1}`} isDisabled={columnsDisabled} onClick={() => onEdit(row)}><FiEdit2 /></Button></Td>}
            </Tr>
          ))}
          {!rows.length && <Tr><Td colSpan={order.length + (onEdit ? 2 : 1)} py={10} textAlign="center" color="gray.500">No rows yet. Upload a file, paste a table, or add a row.</Td></Tr>}
        </Tbody>
      </Table>
    </Box>
  );
}

function SmsComposer({ channel, table, order }) {
  const [allRows, setAllRows] = useState([]);
  const [rowsError, setRowsError] = useState('');
  const [column, setColumn] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const toast = useToast();
  const confirm = useDisclosure();
  useEffect(() => {
    const found = order.find((i) => /phone|mobile|telephone|tel\b/i.test(table.columns[i]));
    setColumn(found === undefined ? '' : String(found));
    setResult(null);
  }, [table._id, table.columns, order]);
  // Recipients come from every saved row, not just the page on screen.
  useEffect(() => {
    let active = true;
    setAllRows([]); setRowsError('');
    if (!table._id || !table.rowCount) return () => { active = false; };
    getAllEcommerceRows(channel, table._id).then((rows) => active && setAllRows(rows))
      .catch((e) => active && setRowsError(errorMessage(e)));
    return () => { active = false; };
  }, [channel, table._id, table.rowCount, table.revision]);
  const validPhones = allRows.map((row) => {
    const raw = row.values[Number(column)] || '';
    if (column === '' || !order.includes(Number(column)) || !/^[+\d\s().-]+$/.test(raw)) return '';
    const phone = normalizePhoneNumber(raw);
    return /^\+?\d{9,15}$/.test(phone) ? phone : '';
  }).filter(Boolean);
  const phones = [...new Set(validPhones)];
  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const response = await sendBulkSms({ phoneNumbers: phones, message });
      setResult(response);
      confirm.onClose();
    } catch (error) {
      toast({ title: 'SMS request failed', description: errorMessage(error), status: 'error', duration: 6000 });
    } finally { setSending(false); }
  };
  return (
    <Box mt={6} p={5} border="1px solid" borderColor="gray.200" borderRadius="xl" bg="white">
      <Heading size="sm" mb={4}>Compose bulk SMS</Heading>
      <VStack align="stretch" spacing={3}>
        <FormControl><FormLabel htmlFor="sms-phone-column">Phone number column</FormLabel>
          <Select id="sms-phone-column" value={column} onChange={(e) => { setColumn(e.target.value); setResult(null); }} placeholder="Select the column containing phone numbers">
            {order.map((i) => <option value={i} key={i}>{table.columns[i]}</option>)}
          </Select>
        </FormControl>
        <Text fontSize="sm" color="gray.600">{phones.length} unique recipients · {validPhones.length - phones.length} repeated numbers skipped · {allRows.length - validPhones.length} blank or invalid numbers skipped. Uses all rows in this table, including rows hidden by search.</Text>
        {rowsError && <Alert status="error"><AlertIcon />Recipients could not be loaded: {rowsError}</Alert>}
        <FormControl><FormLabel htmlFor="ecommerce-sms-message">Message</FormLabel>
          <Textarea id="ecommerce-sms-message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1600} placeholder="Write your message…" />
        </FormControl>
        {phones.length > 1000 && <Alert status="warning"><AlertIcon />Use a table with at most 1,000 recipients per send.</Alert>}
        <Button alignSelf="start" colorScheme="teal" onClick={confirm.onOpen} isDisabled={!phones.length || phones.length > 1000 || !message.trim()}>Review SMS</Button>
        {result && <Alert status={!result.providerConfigured || result.failed ? 'warning' : 'success'}><AlertIcon />
          {!result.providerConfigured ? 'No SMS provider is configured. The request was logged; no messages were sent.' : `${result.sent} accepted by provider; ${result.failed} failed.`}
        </Alert>}
        {result?.results?.some((r) => r.status === 'failed') && <Text fontSize="sm">Failed: {result.results.filter((r) => r.status === 'failed').map((r) => `${r.to}: ${r.error}`).join('; ')}</Text>}
      </VStack>
      <Modal isOpen={confirm.isOpen} onClose={sending ? () => {} : confirm.onClose}>
        <ModalOverlay /><ModalContent><ModalHeader>Send to {phones.length} unique recipients?</ModalHeader><ModalCloseButton isDisabled={sending} />
          <ModalBody><Text whiteSpace="pre-wrap">{message}</Text><Text mt={4} fontSize="sm" color="gray.600">Sending uses the configured SMS provider. Provider charges may apply.</Text></ModalBody>
          <ModalFooter gap={3}><Button isDisabled={sending} onClick={confirm.onClose}>Cancel</Button><Button colorScheme="teal" isLoading={sending} onClick={send}>Send SMS</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function OutreachTable({ channel }) {
  const toast = useToast();
  const uploadRef = useRef(null);
  const importModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const deleteAllModal = useDisclosure();
  const [confirmText, setConfirmText] = useState('');
  const [duplicatesOnly, setDuplicatesOnly] = useState(false); // "Show duplicates" filter
  const dedupeModal = useDisclosure();
  const [deduping, setDeduping] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tables, setTables] = useState([]);
  const [selected, setSelected] = useState('reference:0');
  const [table, setTable] = useState(() => emptyTable(REFERENCE_CATEGORIES[0]));
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [tableError, setTableError] = useState('');
  const loading = catalogLoading || tableLoading;
  const loadError = catalogError || tableError;
  const [refresh, setRefresh] = useState(0);
  const [poll, setPoll] = useState(0); // reloads only the table rows, not the table list
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [importProgress, setImportProgress] = useState(null);
  const [importError, setImportError] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [hasHeaders, setHasHeaders] = useState(true);
  const [headerRow, setHeaderRow] = useState(1);
  const [tableName, setTableName] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [editValues, setEditValues] = useState([]);
  const columnSaving = useRef(false);
  const [lastImport, setLastImport] = useState('');

  useEffect(() => {
    let active = true;
    setCatalogLoading(true); setCatalogError('');
    listEcommerceTables(channel).then((data) => {
      if (!active) return;
      setTables(data);
      if (selected.startsWith('reference:')) {
        const match = data.find((t) => t.name === REFERENCE_CATEGORIES[Number(selected.split(':')[1])]);
        if (match) setSelected(match._id);
      }
    }).catch((e) => active && setCatalogError(errorMessage(e)))
      .finally(() => active && setCatalogLoading(false));
    return () => { active = false; };
    // Reload the catalog only on an explicit refresh; table selection loads separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, refresh]);

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Only the visible page is fetched, so large tables open quickly.
  useEffect(() => {
    let active = true;
    if (selected.startsWith('reference:')) {
      setTableLoading(false); setTableError('');
      setTable(emptyTable(REFERENCE_CATEGORIES[Number(selected.split(':')[1])]));
      return () => { active = false; };
    }
    setTableLoading(true); setTableError('');
    getEcommerceTable(channel, selected, { page, search: query || undefined, duplicates: duplicatesOnly ? 1 : undefined })
      .then((data) => active && setTable(data))
      .catch((e) => active && setTableError(errorMessage(e)))
      .finally(() => active && setTableLoading(false));
    return () => { active = false; };
  }, [channel, selected, refresh, poll, page, query, duplicatesOnly]);

  // While the server removes duplicate contacts from an older table, reload every few seconds.
  useEffect(() => {
    if (!table.cleaning || table._id !== selected) return undefined;
    const timer = setTimeout(() => setPoll((n) => n + 1), 5000);
    return () => clearTimeout(timer);
  }, [table, selected]);

  const selectTable = (id) => {
    setSelected(id); setPage(1); setSearch(''); setQuery(''); setDuplicatesOnly(false);
  };
  const removeDuplicates = async () => {
    setDeduping(true);
    try {
      const result = await removeEcommerceDuplicates(channel, table._id);
      dedupeModal.onClose();
      setDuplicatesOnly(false); setPage(1);
      setRefresh((n) => n + 1);
      toast({
        title: result.removed ? `Removed ${result.removed.toLocaleString()} duplicate rows` : 'No duplicates found',
        description: `${(result.data?.rowCount ?? 0).toLocaleString()} rows remain, one per contact.`,
        status: 'success', duration: 6000,
      });
    } catch (error) { toast({ title: 'Duplicates were not removed', description: errorMessage(error), status: 'error', duration: 10000 }); }
    finally { setDeduping(false); }
  };
  const rememberSummary = (saved) => {
    setTables((previous) => [...previous.filter((t) => t._id !== saved._id), saved]);
    if (saved._id !== selected) selectTable(saved._id);
    setRefresh((n) => n + 1);
  };
  const preview = useMemo(() => {
    try {
      const data = prepareTable(parsePastedTable(pasteText), { hasHeaders, headerRow, fallbackColumns: table.columns });
      // Pasted contacts are fitted into the standard columns, like uploaded files.
      const mapped = mapTableToReference(data);
      return { data: mapped, ownColumns: mapped.extraColumns > 0 && isReferenceFormat(table.columns) };
    } catch (error) { return { error: error.message }; }
  }, [pasteText, hasHeaders, headerRow, table.columns]);
  const order = useMemo(() => displayOrder(table.columns).filter((i) => !(table.archivedColumns || []).includes(i)), [table.columns, table.archivedColumns]);
  const pageSize = table.pageSize || 50;
  const visibleRows = useMemo(() => table.rows.map((row, i) => ({ ...row, number: ((table.page || 1) - 1) * pageSize + i + 1 })), [table.rows, table.page, pageSize]);
  const matchCount = table.matchCount ?? table.rows.length;
  const totalPages = Math.max(1, Math.ceil(matchCount / pageSize));
  const currentPage = table.page || 1;
  const pageWindowStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = [...new Set([1, ...Array.from({ length: Math.min(5, totalPages) }, (_, i) => pageWindowStart + i), totalPages])].sort((a, b) => a - b);
  const firstLoad = tableLoading && table._id !== selected;

  const startPaste = () => {
    setPasteText(''); setHasHeaders(true); setHeaderRow(1); setTableName(table.name); importModal.onOpen();
  };
  const showImportedTables = (result) => {
    if (!result?.tables.length) return;
    setTables((previous) => [...previous.filter((t) => !result.tables.some((saved) => saved._id === t._id)), ...result.tables]);
    selectTable(result.tables.find((t) => t.rowCount > 0)?._id || result.tables[0]._id);
    setRefresh((n) => n + 1);
  };
  const importFailed = (error) => {
    const progress = error.importProgress;
    showImportedTables(progress);
    setImportError(`${errorMessage(error)}${progress?.tables.length ? ` ${progress.added} rows were saved before the interruption. Upload again to continue; saved rows will not be repeated.` : ''}`);
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setSaving(true); setImportError(''); setLastImport('');
    setImportProgress({ activeSheet: 'Reading and removing duplicate rows…', processed: 0, total: 0 });
    const started = Date.now();
    try {
      const prepared = await prepareWorkbookFile(file, { targetName: table.name, fallbackColumns: table.columns, fileName: file.name });
      const result = await importPreparedTables(prepared, (batch) => importEcommerceRows(channel, batch), setImportProgress);
      showImportedTables(result);
      setLastImport(`${result.added.toLocaleString()} rows imported into ${result.tables.map((t) => t.name).join(', ')} · ${result.duplicates.toLocaleString()} duplicate rows skipped · ${Math.max(1, Math.round((Date.now() - started) / 1000))}s.`);
    } catch (error) { importFailed(error); }
    finally { setSaving(false); setImportProgress(null); }
  };
  const saveImport = async () => {
    if (!preview.data) return;
    setSaving(true); setImportError(''); setLastImport('');
    try {
      const result = await importPreparedTables([{ ...preview.data, name: tableName }], (batch) => importEcommerceRows(channel, batch), setImportProgress);
      showImportedTables(result);
      setLastImport(`${result.added} rows added · ${result.duplicates} identical rows skipped. Saved to ${tableName}.`);
      importModal.onClose();
    } catch (error) { importFailed(error); importModal.onClose(); }
    finally { setSaving(false); setImportProgress(null); }
  };
  const openEditor = (row = null) => {
    setEditingRow(row); setEditValues(row ? [...row.values] : table.columns.map(() => '')); editModal.onOpen();
  };
  const saveRow = async () => {
    setSaving(true);
    try {
      if (editingRow) {
        const saved = await updateEcommerceRow(channel, table._id, editingRow, editValues);
        setTable((current) => ({ ...current, rows: current.rows.map((row) => (row.id === saved.id ? saved : row)) }));
      } else {
        const response = await importEcommerceRows(channel, { name: table.name, columns: table.columns, widths: table.widths, rows: [editValues] });
        rememberSummary(response.data);
        toast({ title: response.added ? 'Row saved' : 'Identical row already exists; nothing added', status: response.added ? 'success' : 'info', duration: 3000 });
      }
      editModal.onClose();
    } catch (error) { toast({ title: 'Row was not saved', description: errorMessage(error), status: 'error', duration: 6000 }); }
    finally { setSaving(false); }
  };
  const removeTable = async () => {
    setDeleting(true);
    try {
      await deleteEcommerceTable(channel, table._id);
      setTables((previous) => previous.filter((t) => t._id !== table._id));
      const reference = REFERENCE_CATEGORIES.indexOf(table.name);
      selectTable(`reference:${Math.max(0, reference)}`);
      setLastImport(''); setImportError('');
      deleteModal.onClose();
      toast({ title: `Deleted ${table.name}`, status: 'success', duration: 3000 });
    } catch (error) { toast({ title: 'Table was not deleted', description: errorMessage(error), status: 'error', duration: 6000 }); }
    finally { setDeleting(false); }
  };
  const removeAll = async () => {
    setDeleting(true);
    try {
      await deleteAllEcommerceTables(channel);
      setTables([]);
      selectTable('reference:0');
      setLastImport(''); setImportError('');
      deleteAllModal.onClose();
      toast({ title: `All ${channel === 'cold-call' ? 'Cold Call' : 'Bulk SMS'} tables deleted`, status: 'success', duration: 3000 });
    } catch (error) { toast({ title: 'Nothing was deleted', description: errorMessage(error), status: 'error', duration: 6000 }); }
    finally { setDeleting(false); }
  };
  const changeColumn = async (index, archived) => {
    if (!table._id || saving || loading || columnSaving.current) return;
    columnSaving.current = true;
    setSaving(true);
    try {
      const saved = await setEcommerceColumnArchived(channel, table._id, index, archived, table.revision);
      setTable((current) => ({ ...current, ...saved }));
      setTables((previous) => previous.map((item) => item._id === table._id ? { ...item, ...saved } : item));
      toast({ title: archived ? `Column “${table.columns[index]}” removed from view` : `Column “${table.columns[index]}” restored`, status: 'success', duration: 3000 });
    } catch (error) {
      toast({ title: 'Column was not changed', description: errorMessage(error), status: 'error', duration: 6000 });
    } finally { columnSaving.current = false; setSaving(false); }
  };
  const download = async () => {
    try {
      const [XLSX, rows] = await Promise.all([import('xlsx'), table._id ? getAllEcommerceRows(channel, table._id) : []]);
      const sheet = XLSX.utils.aoa_to_sheet([order.map((i) => table.columns[i]), ...rows.map((row) => order.map((i) => row.values[i]))]);
      sheet['!cols'] = order.map((i) => ({ wpx: tableColumnWidth(table.columns[i]) }));
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, 'Contacts');
      XLSX.writeFile(book, `${table.name.replace(/[^\p{L}\p{N} _-]/gu, '_')}.xlsx`);
    } catch (error) { toast({ title: 'Export failed', description: errorMessage(error), status: 'error' }); }
  };

  return (
    <Box>
      <Flex gap={3} mb={5} flexWrap="wrap" align="end" justify="space-between">
        <FormControl maxW={{ base: '100%', md: '360px' }}><FormLabel htmlFor={`${channel}-table`}>Worksheet / table</FormLabel>
          <Select id={`${channel}-table`} value={selected} isDisabled={saving || loading} onChange={(e) => { selectTable(e.target.value); setLastImport(''); }}>
            {REFERENCE_CATEGORIES.map((name, i) => !tables.some((t) => t.name === name) && <option key={name} value={`reference:${i}`}>{name}</option>)}
            {tables.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </Select>
        </FormControl>
        <HStack flexWrap="wrap">
          <Input ref={uploadRef} type="file" display="none" accept=".xlsx,.xls,.xlsm,.xlsb,.csv,.tsv,.ods" onChange={upload} aria-label={`Upload ${channel} spreadsheet`} />
          <Button colorScheme="teal" leftIcon={<FiUpload />} onClick={() => uploadRef.current?.click()} isDisabled={firstLoad || catalogLoading || !!loadError} isLoading={saving}>Upload file</Button>
          <Button onClick={startPaste} isDisabled={saving || loading || !!loadError}>Paste table</Button>
          <Button leftIcon={<FiPlus />} onClick={() => openEditor()} isDisabled={saving || loading || !!loadError}>Add row</Button>
          <Button leftIcon={<FiDownload />} onClick={download} isDisabled={loading || !!loadError}>Export</Button>
          {table._id && <Button leftIcon={<FiTrash2 />} colorScheme="red" variant="outline" onClick={deleteModal.onOpen} isDisabled={saving || loading || !!loadError}>Delete table</Button>}
          {tables.length > 0 && <Button leftIcon={<FiTrash2 />} colorScheme="red" onClick={() => { setConfirmText(''); deleteAllModal.onOpen(); }} isDisabled={saving || loading || !!loadError}>Delete all</Button>}
        </HStack>
      </Flex>
      <Text fontSize="sm" color="gray.600" mb={4}>Upload an Excel, CSV, TSV, or ODS file to add its rows to the selected table. Files with the standard columns (or similar names like Phone, Email, Company) go into this table; Note is left empty for you to write. Files with other columns are saved as their own table named after the file: the standard columns first, then the file&apos;s other columns. Rows already saved, and repeated rows in the file, are skipped. Files up to {MAX_IMPORT_FILE_MB} MB, with up to 100 columns.</Text>
      {importProgress && <Box mb={4} role="status"><Text fontSize="sm" mb={2}>{importProgress.activeSheet} · {importProgress.processed.toLocaleString()} / {importProgress.total.toLocaleString()} rows processed</Text><Progress colorScheme="teal" isIndeterminate={!importProgress.total} value={importProgress.total ? importProgress.processed / importProgress.total * 100 : 0} borderRadius="md" /></Box>}
      {importError && <Alert status="error" mb={4}><AlertIcon />{importError}</Alert>}
      {lastImport && <Alert status="success" mb={4} role="status"><AlertIcon />{lastImport}</Alert>}
      {table.cleaning && table._id === selected && <Alert status="info" mb={4} role="status"><AlertIcon /><Spinner size="sm" mr={2} />Removing duplicate contacts from this table. It refreshes automatically when finished.</Alert>}
      {loadError ? <Alert status="error"><AlertIcon /><Box flex={1}>{loadError}</Box><Button onClick={() => setRefresh((n) => n + 1)}>Retry</Button></Alert> : catalogLoading || firstLoad ? <HStack py={12} justify="center"><Spinner /><Text>Loading saved table…</Text></HStack> : <>
        <Flex gap={3} align="center" mb={3} flexWrap="wrap">
          <Input maxW="400px" aria-label="Search table" placeholder="Search any column…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Badge colorScheme="teal">{(table.rowCount ?? 0).toLocaleString()} saved rows</Badge><Badge>{order.length} columns</Badge>
          {table._id && <Button size="sm" variant={duplicatesOnly ? 'solid' : 'outline'} colorScheme="orange" aria-pressed={duplicatesOnly}
            isDisabled={saving || deduping} onClick={() => { setDuplicatesOnly((on) => !on); setPage(1); }}>
            {duplicatesOnly ? 'Show all rows' : 'Show duplicates'}
          </Button>}
          {table._id && <Button size="sm" colorScheme="orange" isDisabled={saving || loading || deduping} onClick={dedupeModal.onOpen}>Remove duplicates</Button>}
          {duplicatesOnly && table.duplicatesOnly && <Badge colorScheme="orange">{(table.duplicateCount ?? 0).toLocaleString()} duplicate rows · copies of the same contact are listed together</Badge>}
          {tableLoading && <Spinner size="sm" aria-label="Loading rows" />}
          <Button size="sm" variant="ghost" isDisabled={saving || loading} onClick={() => setRefresh((n) => n + 1)}>Refresh</Button>
        </Flex>
        {table._id && <HStack mb={3} flexWrap="wrap">
          <Text fontSize="sm" color="gray.600">Right-click a column heading or use its menu to delete it from view. You can restore it later.</Text>
          {!!table.archivedColumns?.length && <Menu isLazy>
            <MenuButton as={Button} size="sm" variant="outline" isDisabled={saving || loading}>Restore columns ({table.archivedColumns.length})</MenuButton>
            <MenuList>{table.archivedColumns.map((i) => <MenuItem key={i} onClick={() => changeColumn(i, false)}>{table.columns[i]}</MenuItem>)}</MenuList>
          </Menu>}
        </HStack>}
        {duplicatesOnly && table.duplicatesOnly && !matchCount ? <Text py={8}>No duplicates in this table. Each contact appears once.</Text> : query && !matchCount ? <Text py={8}>No rows match your search.</Text> : <DataTable columns={table.columns} rows={visibleRows} order={order} onEdit={table._id ? openEditor : undefined} onArchive={table._id ? (i) => changeColumn(i, true) : undefined} columnsDisabled={saving || loading} />}
        <Flex justify="space-between" gap={3} align="center" mt={3} flexWrap="wrap">
          <Text fontSize="sm" color="gray.600">{matchCount.toLocaleString()} matching rows · Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}</Text>
          <HStack as="nav" aria-label={`${channel} table pagination`} spacing={1} flexWrap="wrap">
            <Button size="sm" isDisabled={saving || tableLoading || currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
            {pageNumbers.map((number, index) => <Fragment key={number}>
              {index > 0 && number - pageNumbers[index - 1] > 1 && <Text as="span" px={1} aria-hidden="true">…</Text>}
              <Button size="sm" minW={8} aria-label={`Page ${number}`} aria-current={number === currentPage ? 'page' : undefined}
                colorScheme={number === currentPage ? 'teal' : 'gray'} variant={number === currentPage ? 'solid' : 'outline'}
                isDisabled={saving || tableLoading || number === currentPage} onClick={() => setPage(number)}>{number}</Button>
            </Fragment>)}
            <Button size="sm" isDisabled={saving || tableLoading || currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button>
          </HStack>
        </Flex>
        {channel === 'bulk-sms' && <SmsComposer channel={channel} table={table} order={order} />}
      </>}

      <Modal isOpen={importModal.isOpen} onClose={saving ? () => {} : importModal.onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay /><ModalContent mx={3}><ModalHeader>Paste spreadsheet table</ModalHeader><ModalCloseButton isDisabled={saving} />
          <ModalBody><VStack align="stretch" spacing={4}>
            <FormControl><FormLabel htmlFor={`${channel}-paste`}>Copied cells</FormLabel><Textarea id={`${channel}-paste`} fontFamily="mono" rows={7} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={'Company Name\tLead source\tofficial business phone\nExample company\tWebsite\t0911234567'} /></FormControl>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl><FormLabel htmlFor={`${channel}-name`}>Save to table name</FormLabel><Input id={`${channel}-name`} maxLength={120} value={tableName} onChange={(e) => setTableName(e.target.value)} /></FormControl>
              <FormControl><FormLabel htmlFor={`${channel}-start`}>Start at row</FormLabel><Input id={`${channel}-start`} type="number" min={1} value={headerRow} onChange={(e) => setHeaderRow(Math.max(1, Number(e.target.value) || 1))} /></FormControl>
            </SimpleGrid>
            <Checkbox isChecked={hasHeaders} onChange={(e) => setHasHeaders(e.target.checked)}>First non-empty row contains column headings</Checkbox>
            <Text fontSize="sm" color="gray.600">Matching table name and columns append to the saved table; a different name or set of columns creates another table. Without headings, the current columns are used when the column count matches.</Text>
            {preview.error ? <Alert status="info"><AlertIcon />{preview.error}</Alert> : <>
              <Text fontSize="sm">{preview.data.rows.length} unique rows ready · {preview.data.duplicates} repeated rows removed from this import. Preview shows the first 5 rows. Existing saved rows are checked when you import.</Text>
              {preview.ownColumns && <Alert status="info"><AlertIcon />This table has columns beyond the standard ones. It will be saved as a separate table: the standard columns first, then its other columns. Give it its own name above.</Alert>}
              <DataTable columns={preview.data.columns} rows={preview.data.rows.slice(0, 5)} />
              {!preview.data.rows.length && <Text fontSize="sm">This is a blank template. Import it to save its columns, then use Add row or Paste table to enter contacts.</Text>}
            </>}
          </VStack></ModalBody>
          <ModalFooter gap={3}><Button onClick={importModal.onClose} isDisabled={saving}>Cancel</Button><Button colorScheme="teal" isLoading={saving} isDisabled={!preview.data || !tableName.trim()} onClick={saveImport}>Import and save</Button></ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={deleteModal.isOpen} onClose={deleting ? () => {} : deleteModal.onClose}>
        <ModalOverlay /><ModalContent mx={3}><ModalHeader>Delete “{table.name}”?</ModalHeader><ModalCloseButton isDisabled={deleting} />
          <ModalBody><Text>This permanently removes the table and its {(table.rowCount ?? 0).toLocaleString()} saved rows. You can upload the file again afterwards.</Text></ModalBody>
          <ModalFooter gap={3}><Button onClick={deleteModal.onClose} isDisabled={deleting}>Cancel</Button><Button colorScheme="red" isLoading={deleting} onClick={removeTable}>Delete table</Button></ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={dedupeModal.isOpen} onClose={deduping ? () => {} : dedupeModal.onClose}>
        <ModalOverlay /><ModalContent mx={3}><ModalHeader>Remove duplicates from “{table.name}”?</ModalHeader><ModalCloseButton isDisabled={deduping} />
          <ModalBody><VStack align="stretch" spacing={3}>
            <Text>Rows are duplicates when they have the same phone number (0911…, +251911… and 911… count as the same), the same email, or — when a row has neither — the same business name. Identical rows always count.</Text>
            <Alert status="warning" borderRadius="md"><AlertIcon />The first saved row of each contact is kept and the other copies are permanently deleted, including any notes written on them. Use “Show duplicates” first to review them.</Alert>
            {deduping && <Text fontSize="sm" color="gray.600">Checking every row… large tables can take a minute.</Text>}
          </VStack></ModalBody>
          <ModalFooter gap={3}><Button onClick={dedupeModal.onClose} isDisabled={deduping}>Cancel</Button><Button colorScheme="orange" isLoading={deduping} onClick={removeDuplicates}>Remove duplicates</Button></ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={deleteAllModal.isOpen} onClose={deleting ? () => {} : deleteAllModal.onClose}>
        <ModalOverlay /><ModalContent mx={3}><ModalHeader>Delete all {channel === 'cold-call' ? 'Cold Call' : 'Bulk SMS'} data?</ModalHeader><ModalCloseButton isDisabled={deleting} />
          <ModalBody><VStack align="stretch" spacing={4}>
            <Alert status="error" borderRadius="md"><AlertIcon /><Box>Warning: this permanently deletes all {tables.length} tables in this tab, with every saved row and note. It cannot be undone.</Box></Alert>
            <FormControl><FormLabel htmlFor={`${channel}-confirm-delete`}>Type DELETE to confirm</FormLabel>
              <Input id={`${channel}-confirm-delete`} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" /></FormControl>
          </VStack></ModalBody>
          <ModalFooter gap={3}><Button onClick={deleteAllModal.onClose} isDisabled={deleting}>Cancel</Button><Button colorScheme="red" isLoading={deleting} isDisabled={confirmText.trim() !== 'DELETE'} onClick={removeAll}>Delete all</Button></ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={editModal.isOpen} onClose={saving ? () => {} : editModal.onClose} size="3xl" scrollBehavior="inside">
        <ModalOverlay /><ModalContent mx={3}><ModalHeader>{editingRow ? 'Edit row' : 'Add row'}</ModalHeader><ModalCloseButton isDisabled={saving} />
          <ModalBody><SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>{order.map((i) => (
            <FormControl key={i}><FormLabel htmlFor={`${channel}-cell-${i}`}>{table.columns[i]}</FormLabel><Textarea id={`${channel}-cell-${i}`} rows={2} value={editValues[i] || ''} onChange={(e) => setEditValues((values) => values.map((v, index) => index === i ? e.target.value : v))} /></FormControl>
          ))}</SimpleGrid></ModalBody>
          <ModalFooter gap={3}><Button onClick={editModal.onClose} isDisabled={saving}>Cancel</Button><Button colorScheme="teal" isLoading={saving} isDisabled={!editValues.some((v) => v.trim())} onClick={saveRow}>Save row</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default function EcommerceOutreachPage() {
  return (
    <Box w="100%" minW={0}>
      <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" border="1px solid" borderColor="gray.200" mb={5}>
        <Heading size={{ base: 'md', md: 'lg' }} color="gray.800">eCommerce cold call and bulk sms</Heading>
        <Text mt={2} color="gray.600">Manage outreach in spreadsheet tables. Upload, paste, and save your contacts without repeating identical rows.</Text>
      </Box>
      <Tabs colorScheme="teal" isLazy lazyBehavior="keepMounted">
        <TabList><Tab fontWeight="semibold">Cold Call</Tab><Tab fontWeight="semibold">Bulk SMS</Tab></TabList>
        <TabPanels><TabPanel px={0} py={5}><OutreachTable channel="cold-call" /></TabPanel><TabPanel px={0} py={5}><OutreachTable channel="bulk-sms" /></TabPanel></TabPanels>
      </Tabs>
    </Box>
  );
}
