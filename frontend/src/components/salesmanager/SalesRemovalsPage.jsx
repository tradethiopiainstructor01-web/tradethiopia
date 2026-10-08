import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  FiArchive,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEye,
  FiFileMinus,
  FiFileText,
  FiLock,
  FiRefreshCw,
  FiRepeat,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import axiosInstance from '../../services/axiosInstance';
import { getSalesRemovals, getSalesRemovedDocument } from '../../services/salesManagerService';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

const TYPES = [
  { value: 'followup_deleted', label: 'Deleted follow-ups' },
  { value: 'slip_removed', label: 'Payment slips removed' },
  { value: 'slip_replaced', label: 'Payment slips replaced' },
  { value: 'other_document', label: 'Other documents removed' },
];

const CHANGE_LABELS = {
  removed: { text: 'Removed', color: 'red' },
  replaced: { text: 'Replaced (old copy)', color: 'orange' },
  deleted_with_record: { text: 'Deleted with follow-up', color: 'red' },
};

const SOURCES = {
  sales_portal: 'Sales portal',
  reception: 'Reception',
  sales_manager: 'Sales manager',
  student_registration: 'Student registration',
};

// Readable names for the deleted follow-up's fields; others are shown as stored.
const RECORD_FIELDS = [
  ['customerName', 'Customer name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['contactTitle', 'Training'],
  ['courseName', 'Course'],
  ['productInterest', 'Product interest'],
  ['followupStatus', 'Follow-up status'],
  ['callStatus', 'Call status'],
  ['pipelineStatus', 'Pipeline status'],
  ['schedulePreference', 'Schedule'],
  ['packageScope', 'Package scope'],
  ['coursePrice', 'Course price'],
  ['paymentOption', 'Payment option'],
  ['paymentBank', 'Bank'],
  ['fsNumber', 'FS number'],
  ['note', 'Note'],
  ['supervisorComment', 'Supervisor comment'],
  ['source', 'Source'],
  ['date', 'Follow-up date'],
  ['completedAt', 'Completed at'],
  ['createdAt', 'Created at'],
  ['updatedAt', 'Last updated'],
];
const HIDDEN_RECORD_FIELDS = new Set(['_id', 'agentId', 'createdBy', 'assignedBy', 'approvedBy', 'studentRegistrationId', 'courseId']);

const getPeriodRange = (period, now = new Date()) => {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case 'today':
      return startOfDay;
    case 'week': {
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      return start;
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case '30days': {
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - 29);
      return start;
    }
    default:
      return null;
  }
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '—', time: '' };
  return {
    date: date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
};

const formatValue = (field, value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (/At$|^date$/.test(field)) {
    const when = formatDateTime(value);
    return when.time ? `${when.date}, ${when.time}` : String(value);
  }
  if (field === 'coursePrice') return `${Number(value || 0).toLocaleString()} ETB`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const formatSize = (chars) => {
  const bytes = Math.round((chars || 0) * 0.75); // base64 → bytes
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const isPdf = (src = '') => src.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(src);

const StatCard = ({ label, value, icon, color, helper }) => {
  const border = useColorModeValue('gray.100', 'gray.700');
  return (
    <Card borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor={border}>
      <CardBody py={4}>
        <Flex justify="space-between" align="flex-start">
          <Box>
            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500" letterSpacing="wide">{label}</Text>
            <Text fontSize="2xl" fontWeight="extrabold" mt={1}>{value}</Text>
            {helper && <Text fontSize="xs" color="gray.500">{helper}</Text>}
          </Box>
          <Flex bg={`${color}.50`} color={`${color}.500`} borderRadius="lg" p={2}>
            <Icon as={icon} boxSize={5} />
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
};

const SalesRemovalsPage = () => {
  const [period, setPeriod] = useState('all');
  const [agent, setAgent] = useState('');
  const [type, setType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewer, setViewer] = useState(null); // { row, doc, data, loading, error }
  const [recordRow, setRecordRow] = useState(null);
  const requestId = useRef(0);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const rowHover = useColorModeValue('gray.50', 'whiteAlpha.50');
  const imageBg = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    let active = true;
    axiosInstance.get('/users', { timeout: 30000 })
      .then(({ data }) => {
        const users = Array.isArray(data) ? data : data?.data || [];
        const salesAgents = users
          .filter((user) => String(user.role || '').trim().toLowerCase() === 'sales')
          .map((user) => ({ id: String(user._id), name: user.fullName || user.username || user.email || 'Unnamed agent' }))
          .sort((a, b) => a.name.localeCompare(b.name));
        if (active) setAgents(salesAgents);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [period, agent, type, search, limit]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    const from = getPeriodRange(period);
    try {
      const data = await getSalesRemovals({
        page,
        limit,
        ...(from ? { from: from.toISOString() } : {}),
        ...(agent ? { agent } : {}),
        ...(type ? { type } : {}),
        ...(search ? { search } : {}),
      });
      if (id !== requestId.current) return;
      setRows(Array.isArray(data?.data) ? data.data : []);
      setSummary(data?.summary || null);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.response?.data?.message || err.message || 'Could not load removed items.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [period, agent, type, search, page, limit]);

  useEffect(() => { load(); }, [load]);

  const openDocument = async (row, doc) => {
    setViewer({ row, doc, data: '', loading: true, error: '' });
    try {
      const result = await getSalesRemovedDocument(doc.documentId);
      setViewer({ row, doc, data: result?.data || '', loading: false, error: result?.data ? '' : 'This document is empty.' });
    } catch (err) {
      setViewer({ row, doc, data: '', loading: false, error: err.response?.data?.message || 'Could not load the removed document.' });
    }
  };

  const downloadDocument = () => {
    if (!viewer?.data) return;
    const link = document.createElement('a');
    link.href = viewer.data;
    const extension = isPdf(viewer.data) ? 'pdf' : (viewer.data.match(/^data:image\/(\w+)/)?.[1] || 'png');
    link.download = `removed-${viewer.doc.field}-${(viewer.row.customerName || 'customer').replace(/\s+/g, '-')}.${extension}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const hasFilters = agent || type || searchInput;
  const clearFilters = () => {
    setAgent('');
    setType('');
    setSearchInput('');
  };
  const fmt = (value) => (summary ? Number(value || 0).toLocaleString() : '—');
  const firstRow = pagination.total ? (pagination.page - 1) * limit + 1 : 0;
  const lastRow = Math.min(pagination.page * limit, pagination.total);
  const recordEntries = (record) => {
    if (!record) return [];
    const known = RECORD_FIELDS.filter(([field]) => field in record).map(([field, label]) => [field, label, record[field]]);
    const knownSet = new Set(RECORD_FIELDS.map(([field]) => field));
    const others = Object.entries(record)
      .filter(([field]) => !knownSet.has(field) && !HIDDEN_RECORD_FIELDS.has(field))
      .map(([field, value]) => [field, field, value]);
    return [...known, ...others];
  };

  return (
    <Box p={{ base: 3, md: 6 }} bg={pageBg} minH="100%">
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={5}>
        <Box>
          <HStack spacing={3}>
            <Heading size="lg">Removed &amp; Deleted</Heading>
            <Badge colorScheme="gray" variant="outline" borderRadius="full" px={2} display="flex" alignItems="center" gap={1}>
              <Icon as={FiLock} boxSize={3} /> Read-only
            </Badge>
          </HStack>
          <Text color="gray.500" fontSize="sm" mt={1}>
            Payment slips and documents removed or replaced, and follow-ups deleted by sales — with a saved copy you can open, who did it and when.
          </Text>
        </Box>
        <Button leftIcon={<FiRefreshCw />} variant="outline" size="sm" onClick={load} isLoading={loading}>Refresh</Button>
      </Flex>

      <Alert status="info" borderRadius="xl" mb={5} fontSize="sm" variant="left-accent">
        <AlertIcon />
        A copy is kept from the moment something is removed or deleted, and nobody can change or delete it.
        Slips and follow-ups removed before this page existed were erased at the time and cannot be shown.
      </Alert>

      <Card bg={cardBg} borderRadius="xl" boxShadow="sm" mb={5}>
        <CardBody>
          <Wrap spacing={2} mb={4}>
            {PERIODS.map((option) => (
              <WrapItem key={option.value}>
                <Button size="sm" borderRadius="full" colorScheme="red"
                  variant={period === option.value ? 'solid' : 'outline'} onClick={() => setPeriod(option.value)}>
                  {option.label}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>Search</Text>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none"><FiSearch color="gray" /></InputLeftElement>
                <Input placeholder="Customer, phone, course or person…" value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)} borderRadius="md" />
              </InputGroup>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>Sales agent</Text>
              <Select size="sm" borderRadius="md" value={agent} onChange={(e) => setAgent(e.target.value)}>
                <option value="">All agents</option>
                {agents.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </Select>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>What was removed</Text>
              <Select size="sm" borderRadius="md" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Everything</option>
                {TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Box>
          </SimpleGrid>
          {hasFilters && (
            <Button mt={3} size="xs" variant="ghost" leftIcon={<FiX />} onClick={clearFilters}>Reset filters</Button>
          )}
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} spacing={4} mb={5}>
        <StatCard label="All removals" value={fmt(summary?.total)} icon={FiArchive} color="purple" helper="Matching filters" />
        <StatCard label="Deleted follow-ups" value={fmt(summary?.followupsDeleted)} icon={FiTrash2} color="red" />
        <StatCard label="Slips removed" value={fmt(summary?.slipsRemoved)} icon={FiFileMinus} color="orange" helper="Incl. deleted with follow-up" />
        <StatCard label="Slips replaced" value={fmt(summary?.slipsReplaced)} icon={FiRepeat} color="yellow" helper="Old copy kept" />
        <StatCard label="Other documents" value={fmt(summary?.otherDocuments)} icon={FiFileText} color="blue" helper="IDs and photos removed" />
      </SimpleGrid>

      {summary?.byPerson?.length > 0 && (
        <Card bg={cardBg} borderRadius="xl" boxShadow="sm" mb={5}>
          <CardBody>
            <Heading size="sm" mb={3}>Who removed what</Heading>
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Person</Th>
                    <Th isNumeric>Deleted follow-ups</Th>
                    <Th isNumeric>Slips removed</Th>
                    <Th isNumeric>Slips replaced</Th>
                    <Th isNumeric>All removals</Th>
                    <Th>Last removal</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {summary.byPerson.map((person) => {
                    const last = formatDateTime(person.lastRemoval);
                    return (
                      <Tr key={person.id || person.name}>
                        <Td>
                          <Text fontWeight="semibold" fontSize="sm">{person.name || 'System'}</Text>
                          <Text fontSize="xs" color="gray.500">{person.role || '—'}</Text>
                        </Td>
                        <Td isNumeric color={person.followupsDeleted ? 'red.500' : undefined}>{person.followupsDeleted}</Td>
                        <Td isNumeric color={person.slipsRemoved ? 'orange.500' : undefined}>{person.slipsRemoved}</Td>
                        <Td isNumeric>{person.slipsReplaced}</Td>
                        <Td isNumeric fontWeight="semibold">{person.total}</Td>
                        <Td fontSize="xs" whiteSpace="nowrap">{last.date}, {last.time}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      )}

      <Card bg={cardBg} borderRadius="xl" boxShadow="sm" overflow="hidden">
        {error ? (
          <Alert status="error">
            <AlertIcon />
            <Box flex="1">{error}</Box>
            <Button size="sm" colorScheme="red" variant="outline" onClick={load}>Retry</Button>
          </Alert>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead bg={headerBg}>
                <Tr>
                  <Th>Date &amp; time</Th>
                  <Th>What happened</Th>
                  <Th>Customer</Th>
                  <Th>Sales agent</Th>
                  <Th>Removed by</Th>
                  <Th>Saved copy</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading && !rows.length ? (
                  <Tr><Td colSpan={6} py={12}>
                    <HStack justify="center" color="gray.500" spacing={3}><Spinner size="sm" /><Text>Loading…</Text></HStack>
                  </Td></Tr>
                ) : !rows.length ? (
                  <Tr><Td colSpan={6} py={12} textAlign="center" color="gray.500">
                    Nothing has been removed or deleted for these filters. When sales remove a slip or delete a follow-up, it appears here with a copy.
                  </Td></Tr>
                ) : rows.map((row) => {
                  const when = formatDateTime(row.createdAt);
                  const deleted = row.kind === 'followup_deleted';
                  return (
                    <Tr key={row._id} _hover={{ bg: rowHover }} opacity={loading ? 0.6 : 1} verticalAlign="top">
                      <Td whiteSpace="nowrap">
                        <Text fontSize="sm" fontWeight="semibold">{when.date}</Text>
                        <Text fontSize="xs" color="gray.500">{when.time}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={deleted ? 'red' : 'orange'} borderRadius="full" px={2} display="inline-flex" alignItems="center" gap={1}>
                          <Icon as={deleted ? FiTrash2 : FiFileMinus} boxSize={3} />
                          {deleted ? 'Follow-up deleted' : 'Document removed'}
                        </Badge>
                        <Stack spacing={0.5} mt={1}>
                          {(row.documents || []).map((doc) => (
                            <Text key={doc.documentId} fontSize="xs">
                              <b>{doc.label}</b>: <Text as="span" color={`${CHANGE_LABELS[doc.change]?.color || 'gray'}.500`}>{CHANGE_LABELS[doc.change]?.text || doc.change}</Text>
                            </Text>
                          ))}
                        </Stack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontWeight="semibold">{row.customerName || '—'}</Text>
                        <Text fontSize="xs" color="gray.500">{[row.phone, row.courseName].filter(Boolean).join(' · ') || '—'}</Text>
                      </Td>
                      <Td fontSize="sm">{row.agentName || '—'}</Td>
                      <Td>
                        <Text fontSize="sm">{row.actorName || 'System'}</Text>
                        <Text fontSize="xs" color="gray.500">{[row.actorRole, SOURCES[row.source] || row.source].filter(Boolean).join(' · ')}</Text>
                      </Td>
                      <Td>
                        <Wrap spacing={1.5}>
                          {(row.documents || []).map((doc) => (
                            <WrapItem key={doc.documentId}>
                              <Button size="xs" colorScheme={doc.field === 'paymentScreenshot' ? 'teal' : 'gray'} leftIcon={<FiEye />}
                                onClick={() => openDocument(row, doc)}>
                                {doc.label}
                              </Button>
                            </WrapItem>
                          ))}
                          {deleted && (
                            <WrapItem>
                              <Button size="xs" variant="outline" colorScheme="red" leftIcon={<FiFileText />} onClick={() => setRecordRow(row)}>
                                Deleted record
                              </Button>
                            </WrapItem>
                          )}
                          {!deleted && !(row.documents || []).length && <Text fontSize="xs" color="gray.500">—</Text>}
                        </Wrap>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        )}

        <Flex justify="space-between" align="center" px={4} py={3} borderTopWidth="1px" gap={3} wrap="wrap">
          <Text fontSize="sm" color="gray.500">
            Showing <b>{firstRow}</b>–<b>{lastRow}</b> of <b>{pagination.total || 0}</b>
          </Text>
          <HStack>
            <Select size="sm" w="auto" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {[25, 50, 100].map((size) => <option key={size} value={size}>{size} / page</option>)}
            </Select>
            <IconButton size="sm" icon={<FiChevronLeft />} aria-label="Previous page" isDisabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} />
            <Text fontSize="sm" whiteSpace="nowrap">Page {pagination.page} of {pagination.totalPages}</Text>
            <IconButton size="sm" icon={<FiChevronRight />} aria-label="Next page" isDisabled={page >= pagination.totalPages || loading} onClick={() => setPage((p) => p + 1)} />
          </HStack>
        </Flex>
      </Card>

      <Modal isOpen={Boolean(viewer)} onClose={() => setViewer(null)} size="3xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {viewer?.doc?.label} — saved copy
            {viewer?.row && (
              <Text fontSize="sm" fontWeight="normal" color="gray.500">
                {viewer.row.customerName} · {CHANGE_LABELS[viewer.doc.change]?.text} by {viewer.row.actorName || 'System'} on{' '}
                {formatDateTime(viewer.row.createdAt).date}, {formatDateTime(viewer.row.createdAt).time} · {formatSize(viewer.doc.size)}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {viewer?.loading ? (
              <VStack py={16} color="gray.500"><Spinner /><Text>Loading saved copy…</Text></VStack>
            ) : viewer?.error ? (
              <Alert status="warning" borderRadius="md"><AlertIcon />{viewer.error}</Alert>
            ) : viewer?.data ? (
              isPdf(viewer.data) ? (
                <Box as="iframe" src={viewer.data} title={viewer.doc.label} w="100%" h="70vh" borderRadius="md" />
              ) : (
                <Flex justify="center" bg={imageBg} borderRadius="md" p={2}>
                  <Image src={viewer.data} alt={viewer.doc.label} maxH="70vh" objectFit="contain" />
                </Flex>
              )
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button leftIcon={<FiDownload />} colorScheme="teal" mr={3} onClick={downloadDocument} isDisabled={!viewer?.data}>Download</Button>
            <Button variant="ghost" onClick={() => setViewer(null)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={Boolean(recordRow)} onClose={() => setRecordRow(null)} size="2xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Deleted follow-up: {recordRow?.customerName || '—'}
            {recordRow && (
              <Text fontSize="sm" fontWeight="normal" color="gray.500">
                Deleted by {recordRow.actorName || 'System'} on {formatDateTime(recordRow.createdAt).date}, {formatDateTime(recordRow.createdAt).time}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Table size="sm">
              <Tbody>
                {recordEntries(recordRow?.record).map(([field, label, value]) => (
                  <Tr key={field}>
                    <Td fontWeight="semibold" w="40%" color="gray.600">{label}</Td>
                    <Td whiteSpace="pre-wrap" wordBreak="break-word">{formatValue(field, value)}</Td>
                  </Tr>
                ))}
                <Tr>
                  <Td fontWeight="semibold" color="gray.600">Sales agent</Td>
                  <Td>{recordRow?.agentName || '—'}</Td>
                </Tr>
              </Tbody>
            </Table>
            {(recordRow?.documents || []).length > 0 && (
              <Box mt={4}>
                <Text fontSize="sm" fontWeight="semibold" mb={2}>Documents saved with this follow-up</Text>
                <Wrap spacing={2}>
                  {recordRow.documents.map((doc) => (
                    <WrapItem key={doc.documentId}>
                      <Button size="sm" leftIcon={<FiEye />} onClick={() => openDocument(recordRow, doc)}>{doc.label}</Button>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setRecordRow(null)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SalesRemovalsPage;
