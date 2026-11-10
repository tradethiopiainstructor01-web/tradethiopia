import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
  HStack,
  IconButton,
  Input,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Spinner,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FaPlus, FaTrash, FaFileExcel, FaSms, FaPaste } from 'react-icons/fa';
import { FiDownloadCloud } from 'react-icons/fi';
import { normalizePhoneNumber } from '../../utils/normalizePhoneNumber';
import {
  clearBulkSmsRecipients,
  deleteBulkSmsRecipient,
  fetchBulkSmsRecipients,
  saveBulkSmsRecipients,
} from '../../services/calledCallService';

const MAX_RECIPIENTS = 1000;
const INITIAL_BLANK_ROWS = 8;
const SEPARATORS = /[\n\r,;\t|]+/;

const STATUS_COLORS = {
  pending: 'gray',
  sent: 'green',
  logged: 'blue',
  failed: 'red',
  invalid: 'orange',
  duplicate: 'yellow',
};

let rowSeq = 0;
const newRow = (phone = '', status = 'pending', dbId = null) => ({
  id: `r${++rowSeq}`,
  dbId,
  phone,
  originalPhone: dbId ? phone : '',
  status,
  error: '',
});

// A valid phone: normalizes to at least 9 digits.
const toValidPhone = (raw) => {
  const p = normalizePhoneNumber(raw);
  return p && p.replace(/\D/g, '').length >= 9 ? p : '';
};

// Pull every phone-number-looking token out of free text (one per line, comma/tab separated, etc.)
const extractPhones = (text) =>
  String(text || '')
    .split(SEPARATORS)
    .map(toValidPhone)
    .filter(Boolean);

// Keep only characters that can appear in a phone number.
const sanitizeInput = (value) => value.replace(/[^\d+\s()-]/g, '');

const isDone = (r) => r.status === 'sent' || r.status === 'logged';
const blankRows = (n) => Array.from({ length: n }, () => newRow());

const BulkSmsPanel = ({ calls = [] }) => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const inputRefs = useRef({});
  const pasteModal = useDisclosure();
  const [rows, setRows] = useState(() => blankRows(INITIAL_BLANK_ROWS));
  const [importing, setImporting] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const filledCount = rows.filter((r) => r.phone).length;

  useEffect(() => {
    let active = true;
    fetchBulkSmsRecipients()
      .then((res) => {
        if (!active || !res?.success) return;
        const saved = (res.data || []).map((item) => newRow(item.phoneNumber, 'pending', item._id));
        setRows(saved.length ? [...saved, ...blankRows(Math.max(1, INITIAL_BLANK_ROWS - saved.length))] : blankRows(INITIAL_BLANK_ROWS));
      })
      .catch((error) => {
        if (active) toast({
          title: 'Could not load saved recipients',
          description: error.response?.data?.message || 'Please refresh and try again.',
          status: 'error',
          duration: 3500,
        });
      })
      .finally(() => active && setLoadingSaved(false));
    return () => { active = false; };
  }, [toast]);

  // Spreadsheet-style: always keep one empty row at the bottom to type into.
  useEffect(() => {
    const last = rows[rows.length - 1];
    if ((!last || last.phone) && rows.length < MAX_RECIPIENTS) {
      setRows((prev) => [...prev, newRow()]);
    }
  }, [rows]);
  const pastePreview = useMemo(() => extractPhones(pasteText), [pasteText]);

  const focusRow = (id) => setTimeout(() => inputRefs.current[id]?.focus(), 0);

  // Add many phone numbers at once, skipping duplicates. Optionally replaces the row `atId`
  // (used when a multi-number paste lands inside a single row input).
  const addPhones = async (phones, source, atId) => {
    const replacedRow = atId ? rows.find((row) => row.id === atId) : null;
    const base = rows.filter((r) => r.phone && r.id !== atId);
    const existing = new Set(base.map((r) => r.phone).filter(Boolean));
    const fresh = [];
    phones.forEach((p) => {
      if (existing.has(p) || base.length + fresh.length >= MAX_RECIPIENTS) return;
      existing.add(p);
      fresh.push(newRow(p));
    });
    const skipped = phones.length - fresh.length;

    let next = [...base, ...fresh];
    if (atId) {
      // Insert the pasted numbers where the user pasted them.
      const idx = rows.filter((r) => r.phone && r.id !== atId).length
        ? rows.slice(0, rows.findIndex((r) => r.id === atId)).filter((r) => r.phone).length
        : 0;
      next = [...base];
      next.splice(idx, 0, ...fresh);
    }
    if (!fresh.length) {
      toast({
        title: 'No new numbers added',
        description: skipped ? `${skipped} skipped (duplicate or over ${MAX_RECIPIENTS} limit)` : source,
        status: 'info',
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    setSaving(true);
    try {
      const saved = await saveBulkSmsRecipients(fresh.map((row) => row.phone), source);
      const idsByPhone = new Map((saved.data || []).map((item) => [item.phoneNumber, item._id]));
      next = next.map((row) => idsByPhone.has(row.phone)
        ? { ...row, dbId: idsByPhone.get(row.phone), originalPhone: row.phone }
        : row);
      if (replacedRow?.dbId && !fresh.some((row) => row.phone === replacedRow.originalPhone)) {
        await deleteBulkSmsRecipient(replacedRow.dbId);
      }
      setRows(next);

      toast({
        title: `${fresh.length} number(s) added and saved`,
        description: [source, skipped ? `${skipped} skipped (duplicate or over ${MAX_RECIPIENTS} limit)` : '']
          .filter(Boolean)
          .join(' · '),
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Numbers were not saved',
        description: error.response?.data?.message || 'Database save failed. Please try again.',
        status: 'error',
        duration: 3500,
      });
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Insert in table ---------- */
  const handleAddRow = () => {
    if (rows.length >= MAX_RECIPIENTS) {
      toast({ title: `Maximum ${MAX_RECIPIENTS} numbers`, status: 'warning', duration: 2500 });
      return;
    }
    const row = newRow();
    setRows((prev) => [...prev, row]);
    focusRow(row.id);
  };

  const handleRowChange = (id, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, phone: sanitizeInput(value), status: 'pending', error: '' } : r)));
  };

  // Normalize + validate a row when the user leaves it.
  const handleRowCommit = async (id) => {
    const row = rows.find((item) => item.id === id);
    if (!row || isDone(row)) return;
    if (!row.phone.trim()) {
      if (row.dbId) {
        try {
          await deleteBulkSmsRecipient(row.dbId);
        } catch (error) {
          toast({ title: 'Could not remove saved phone number', description: error.response?.data?.message, status: 'error', duration: 3000 });
          return;
        }
      }
      setRows((prev) => prev.map((item) => item.id === id
        ? { ...item, phone: '', originalPhone: '', dbId: null, status: 'pending', error: '' }
        : item));
      return;
    }
    const valid = toValidPhone(row.phone);
    if (!valid) {
      setRows((prev) => prev.map((item) => item.id === id ? { ...item, status: 'invalid', error: 'Not a valid phone number' } : item));
      return;
    }
    const dup = rows.some((item) => item.id !== id && item.phone === valid);
    if (dup) {
      setRows((prev) => prev.map((item) => item.id === id ? { ...item, phone: valid, status: 'duplicate', error: 'Already in the table' } : item));
      return;
    }

    setSaving(true);
    try {
      const result = await saveBulkSmsRecipients([valid], 'manual');
      const saved = result.data?.[0];
      if (row.dbId && row.originalPhone && row.originalPhone !== valid && row.dbId !== saved?._id) {
        await deleteBulkSmsRecipient(row.dbId);
      }
      setRows((prev) => prev.map((item) => item.id === id
        ? { ...item, phone: valid, originalPhone: valid, dbId: saved?._id || item.dbId, status: 'pending', error: '' }
        : item));
    } catch (error) {
      setRows((prev) => prev.map((item) => item.id === id ? { ...item, status: 'failed', error: 'Could not save to database' } : item));
      toast({ title: 'Could not save phone number', description: error.response?.data?.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleRowKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRowCommit(id);
      const idx = rows.findIndex((r) => r.id === id);
      const nextRow = rows[idx + 1];
      if (nextRow) focusRow(nextRow.id);
      else handleAddRow();
    }
  };

  /* ---------- Copy / paste ---------- */
  // Pasting a list into a row input splits it into one row per number.
  const handleRowPaste = (e, id) => {
    const text = e.clipboardData?.getData('text') || '';
    if (!SEPARATORS.test(text.trim())) return; // single number: let the input handle it
    e.preventDefault();
    const phones = extractPhones(text);
    if (phones.length) addPhones(phones, 'From pasted text', id);
    else toast({ title: 'No phone numbers found in pasted text', status: 'warning', duration: 2500 });
  };

  // Pasting anywhere on the table (not inside an input) adds the numbers too.
  const handleTablePaste = (e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const phones = extractPhones(e.clipboardData?.getData('text'));
    if (phones.length) {
      e.preventDefault();
      addPhones(phones, 'From pasted text');
    }
  };

  const handleConfirmPaste = () => {
    if (!pastePreview.length) return;
    addPhones(pastePreview, 'From pasted text');
    setPasteText('');
    pasteModal.onClose();
  };

  /* ---------- Excel import ---------- */
  const handleFile = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error('No sheets found in the file.');
      const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

      // Prefer columns whose header looks like a phone column; otherwise scan every cell.
      const header = (grid[0] || []).map((h) => String(h));
      const phoneCols = header
        .map((h, i) => (/phone|mobile|tel|contact|cell|number|ስልክ|ቁጥር/i.test(h) ? i : -1))
        .filter((i) => i >= 0);
      const cells = phoneCols.length
        ? grid.slice(1).flatMap((row) => phoneCols.map((i) => row[i]))
        : grid.flat();
      const phones = cells.flatMap((v) => extractPhones(v));

      if (!phones.length) {
        toast({ title: 'No phone numbers found in the file', status: 'warning', duration: 3000 });
        return;
      }
      addPhones(phones, `From ${file.name}`);
    } catch (err) {
      toast({ title: 'Could not read file', description: err.message, status: 'error', duration: 3500 });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadFromTable = () => {
    const phones = calls.map((c) => toValidPhone(c.phoneNumber)).filter(Boolean);
    if (!phones.length) {
      toast({ title: 'No phone numbers in the Call Sales Table', status: 'info', duration: 2500 });
      return;
    }
    addPhones(phones, 'From Call Sales Table');
  };

  const handleRemove = async (id) => {
    const row = rows.find((item) => item.id === id);
    if (row?.dbId) {
      try {
        await deleteBulkSmsRecipient(row.dbId);
      } catch (error) {
        toast({ title: 'Could not delete saved recipient', description: error.response?.data?.message, status: 'error', duration: 3000 });
        return;
      }
    }
    setRows((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClear = async () => {
    try {
      setSaving(true);
      await clearBulkSmsRecipients();
      setRows(blankRows(INITIAL_BLANK_ROWS));
      toast({ title: 'Bulk SMS recipients cleared', status: 'success', duration: 2000 });
    } catch (error) {
      toast({ title: 'Could not clear saved recipients', description: error.response?.data?.message, status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Summary ---------- */
  const invalidCount = rows.filter((r) => r.status === 'invalid' || r.status === 'duplicate').length;

  return (
    <Box w="100%" minW={0}>
      {/* Phone number table */}
      <Card
        w="100%"
        minW={0}
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        shadow="sm"
        borderRadius="xl"
        overflow="hidden"
        border="1px solid"
        borderColor="gray.100"
        onPaste={handleTablePaste}
      >
        <Box p={4} borderBottom="1px solid" borderColor="gray.100" bg="gray.50" _dark={{ bg: '#202b3b', borderColor: 'gray.700' }}>
          <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} gap={3} flexWrap="wrap">
            <Box>
              <Text fontSize="md" fontWeight="bold" color="gray.800" _dark={{ color: 'gray.100' }}>
                Bulk SMS Recipients
              </Text>
              <Text fontSize="xs" color="gray.500">
                Phone numbers only · {filledCount} saved number(s)
                {invalidCount > 0 && <Text as="span" color="orange.500"> · {invalidCount} need fixing</Text>}
                {(loadingSaved || saving) && <Text as="span" color="teal.500"> · {loadingSaved ? 'loading saved numbers…' : 'saving…'}</Text>}
              </Text>
            </Box>
            <HStack spacing={2} flexWrap="wrap">
              <Button size="sm" leftIcon={<FaPlus />} colorScheme="teal" variant="outline" onClick={handleAddRow}>
                Add Row
              </Button>
              <Button size="sm" leftIcon={<FaPaste />} colorScheme="teal" variant="outline" onClick={pasteModal.onOpen}>
                Paste Numbers
              </Button>
              <Button
                size="sm"
                leftIcon={importing ? <Spinner size="xs" /> : <FaFileExcel />}
                colorScheme="teal"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                isDisabled={importing}
              >
                Import Excel
              </Button>
              <Button size="sm" leftIcon={<FiDownloadCloud />} colorScheme="teal" variant="ghost" onClick={handleLoadFromTable}>
                From Call Table
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {filledCount > 0 && (
                <Button size="sm" variant="ghost" colorScheme="red" onClick={handleClear} isLoading={saving}>
                  Clear
                </Button>
              )}
            </HStack>
          </Flex>
        </Box>

        <Flex px={4} py={2} gap={2} align="center" bg="teal.50" _dark={{ bg: 'whiteAlpha.50' }} fontSize="xs" color="teal.700">
          <FaSms />
          <Text _dark={{ color: 'teal.200' }}>
            Type a number in any row and press Enter for the next row. Paste a copied list (Ctrl+V) into any row to fill many rows at once.
          </Text>
        </Flex>
          <Box overflowX="auto" maxH="520px" overflowY="auto">
            <Table variant="simple" size="sm">
              <Thead bg="#edf8f7" _dark={{ bg: 'whiteAlpha.100' }} position="sticky" top={0} zIndex={1}>
                <Tr>
                  <Th w="50px">#</Th>
                  <Th>Phone Number</Th>
                  <Th w="120px">Status</Th>
                  <Th w="50px" />
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((r, idx) => {
                  const bad = r.status === 'invalid' || r.status === 'duplicate';
                  return (
                    <Tr key={r.id}>
                      <Td color="gray.500">{idx + 1}</Td>
                      <Td py={1}>
                        <Input
                          ref={(el) => { inputRefs.current[r.id] = el; }}
                          size="sm"
                          inputMode="tel"
                          value={r.phone}
                          onChange={(e) => handleRowChange(r.id, e.target.value)}
                          onBlur={() => handleRowCommit(r.id)}
                          onKeyDown={(e) => handleRowKeyDown(e, r.id)}
                          onPaste={(e) => handleRowPaste(e, r.id)}
                          isReadOnly={isDone(r)}
                          isInvalid={bad}
                          variant={isDone(r) ? 'unstyled' : 'outline'}
                          fontWeight="semibold"
                          color="teal.600"
                          _dark={{ color: 'teal.300' }}
                        />
                      </Td>
                      <Td>
                        <Tooltip label={r.error} isDisabled={!r.error}>
                          {r.phone ? (
                            <Badge colorScheme={STATUS_COLORS[r.status] || 'gray'} textTransform="capitalize">
                              {r.status === 'pending' ? 'ready' : r.status}
                            </Badge>
                          ) : (
                            <Text fontSize="xs" color="gray.400">—</Text>
                          )}
                        </Tooltip>
                      </Td>
                      <Td>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          icon={<FaTrash />}
                          aria-label="Remove number"
                          onClick={() => handleRemove(r.id)}
                          isDisabled={!r.phone && rows.length <= 1}
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
            <Box p={2} borderTop="1px solid" borderColor="gray.100" _dark={{ borderColor: 'gray.700' }}>
              <Button size="xs" variant="ghost" colorScheme="teal" leftIcon={<FaPlus />} onClick={handleAddRow}>
                Insert row
              </Button>
            </Box>
          </Box>
      </Card>

      {/* Paste numbers modal */}
      <Modal isOpen={pasteModal.isOpen} onClose={pasteModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>Paste Phone Numbers</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }} mb={2}>
              Paste numbers copied from Excel, WhatsApp, or text — one per line, or separated by commas or tabs.
              Anything that isn&apos;t a phone number is ignored.
            </Text>
            <Textarea
              rows={10}
              autoFocus
              placeholder={'0911223344\n+251922334455\n933445566'}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              fontFamily="mono"
              fontSize="sm"
            />
            <Text mt={2} fontSize="sm" color={pastePreview.length ? 'teal.600' : 'gray.500'} fontWeight="semibold">
              {pastePreview.length} phone number(s) detected
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={pasteModal.onClose}>Cancel</Button>
            <Button colorScheme="teal" onClick={handleConfirmPaste} isDisabled={!pastePreview.length}>
              Add {pastePreview.length || ''} to Table
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BulkSmsPanel;
