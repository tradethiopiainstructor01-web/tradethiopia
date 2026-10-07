import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Badge,
  HStack,
  VStack,
  Icon,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Tooltip,
  useToast,
  useColorModeValue,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiRefreshCw,
  FiUsers,
  FiDollarSign,
  FiFileText,
  FiAlertCircle,
  FiDownload,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCalendar,
} from 'react-icons/fi';
import apiClient from '../../utils/apiClient';

const STATUS_COLORS = {
  completed: 'green',
  pending: 'orange',
  prospect: 'blue',
  scheduled: 'purple',
  cancelled: 'red',
  imported: 'gray',
};

const SLIP_SOURCE_LABELS = {
  sales: 'Uploaded by sales',
  registration: 'From student registration',
};

const PERIODS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

// YYYY-MM-DD in local time (toISOString would shift dates across UTC midnight).
const toInputDate = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const getPeriodRange = (period, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case 'today':
      return { from: toInputDate(today), to: toInputDate(today) };
    case 'week': {
      // Weeks start on Monday.
      const start = new Date(today);
      start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { from: toInputDate(start), to: toInputDate(end) };
    }
    case 'month':
      return {
        from: toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        to: toInputDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      };
    case 'year':
      return {
        from: toInputDate(new Date(today.getFullYear(), 0, 1)),
        to: toInputDate(new Date(today.getFullYear(), 11, 31)),
      };
    default:
      return { from: '', to: '' };
  }
};

// Exact local-day bounds, so "today" means today in the user's time zone.
const startOfLocalDay = (value) => new Date(`${value}T00:00:00`).toISOString();
const endOfLocalDay = (value) => new Date(`${value}T23:59:59.999`).toISOString();

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// When the follow-up was marked Completed. Sales completed before completion
// times were recorded fall back to their last update, flagged as approximate.
const getCompletedTime = (row) => (row.completedAt
  ? { text: formatDateTime(row.completedAt), approximate: false }
  : { text: formatDateTime(row.updatedAt), approximate: Boolean(row.updatedAt) });

const formatMoney = (value) => `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB`;

const getTraining = (row) => row.courseName || row.contactTitle || row.productInterest || '—';

// Recent page answers by request, so returning to the page or a filter paints instantly.
const responseCache = new Map();

const isPdf = (src = '') => src.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(src);

const StatCard = ({ label, value, helper, icon, color }) => (
  <Card borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor={useColorModeValue('gray.100', 'gray.700')}>
    <CardBody>
      <Flex justify="space-between" align="flex-start">
        <Box>
          <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500" letterSpacing="wide">
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="extrabold" mt={1}>{value}</Text>
          {helper && <Text fontSize="xs" color="gray.500" mt={1}>{helper}</Text>}
        </Box>
        <Flex bg={`${color}.50`} color={`${color}.500`} borderRadius="lg" p={2.5}>
          <Icon as={icon} boxSize={5} />
        </Flex>
      </Flex>
    </CardBody>
  </Card>
);

const FinanceSalesFollowupPage = () => {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [agent, setAgent] = useState('');
  const [agents, setAgents] = useState([]);

  // Sales agents for the filter (the employee directory is cached on the server).
  useEffect(() => {
    let active = true;
    apiClient.get('/users', { timeout: 30000 })
      .then(({ data }) => {
        const users = Array.isArray(data) ? data : data?.data || [];
        const salesAgents = users
          .filter((user) => String(user.role || '').trim().toLowerCase() === 'sales')
          .map((user) => ({ id: String(user._id), name: user.fullName || user.username || user.email || 'Unnamed agent' }))
          .sort((a, b) => a.name.localeCompare(b.name));
        if (active) setAgents(salesAgents);
      })
      .catch(() => {
        // The page works without the filter list; agents can still be found by search.
      });
    return () => { active = false; };
  }, []);

  const choosePeriod = (value) => {
    setPeriod(value);
    if (value === 'custom') return;
    const range = getPeriodRange(value);
    setDateFrom(range.from);
    setDateTo(range.to);
  };

  // Typing a date by hand turns the selection into a custom range.
  const changeDate = (setter) => (event) => {
    setter(event.target.value);
    setPeriod('custom');
  };
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const [slip, setSlip] = useState(null); // { row, src, loading, error }
  const requestId = useRef(0);

  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const rowHover = useColorModeValue('teal.50', 'whiteAlpha.100');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Debounce typing so every keystroke does not hit the server.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [search, agent, dateFrom, dateTo, limit]);

  const filterParams = useCallback(() => ({
    fields: 'summary',
    ...(search ? { search } : {}),
    ...(agent ? { agent } : {}),
    followupStatus: 'Completed',
    ...(dateFrom ? { dateFrom: startOfLocalDay(dateFrom) } : {}),
    ...(dateTo ? { dateTo: endOfLocalDay(dateTo) } : {}),
  }), [search, agent, dateFrom, dateTo]);

  const loadRows = useCallback(async () => {
    const id = ++requestId.current;
    const params = { ...filterParams(), page, limit, includeSummary: 'true' };
    const cacheKey = JSON.stringify(params);
    // Show the last answer for these filters at once, then refresh it.
    const cached = responseCache.get(cacheKey);
    if (cached) {
      setRows(cached.rows);
      setSummary(cached.summary);
      setPagination(cached.pagination);
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/sales-customers', { params, timeout: 60000 });
      responseCache.set(cacheKey, {
        rows: Array.isArray(data?.data) ? data.data : [],
        summary: data?.summary || null,
        pagination: data?.pagination || { page: 1, totalPages: 1, total: 0 },
      });
      if (responseCache.size > 50) responseCache.delete(responseCache.keys().next().value);
      if (id !== requestId.current) return;
      setRows(Array.isArray(data?.data) ? data.data : []);
      setSummary(data?.summary || null);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.response?.data?.message || err.message || 'Could not load sales follow-ups.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [filterParams, page, limit]);

  useEffect(() => { loadRows(); }, [loadRows]);

  const openSlip = async (row) => {
    setSlip({ row, src: '', loading: true, error: '' });
    try {
      const { data } = await apiClient.get(`/sales-customers/${row._id}/payment-slip`, { timeout: 60000 });
      setSlip({
        row,
        src: data?.src || '',
        source: data?.source || null,
        loading: false,
        error: data?.src ? '' : 'No payment slip uploaded for this customer.',
      });
    } catch (err) {
      setSlip({ row, src: '', loading: false, error: err.response?.data?.message || 'Could not load the payment slip.' });
    }
  };

  const downloadSlip = () => {
    if (!slip?.src) return;
    const link = document.createElement('a');
    link.href = slip.src;
    const extension = isPdf(slip.src) ? 'pdf' : (slip.src.match(/^data:image\/(\w+)/)?.[1] || 'png');
    link.download = `payment-slip-${(slip.row.customerName || 'customer').replace(/\s+/g, '-')}.${extension}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      // Every row matching the filters, without images.
      const { data } = await apiClient.get('/sales-customers', { params: filterParams(), timeout: 120000 });
      const all = Array.isArray(data) ? data : data?.data || [];
      if (!all.length) {
        toast({ title: 'Nothing to export', status: 'info', duration: 3000, isClosable: true });
        return;
      }
      const XLSX = await import('xlsx');
      const sheetRows = all.map((row) => ({
        'Customer Name': row.customerName || '',
        Phone: row.phone || '',
        Email: row.email || '',
        Training: getTraining(row) === '—' ? '' : getTraining(row),
        'Registered Date': formatDate(row.date || row.createdAt),
        'Completed At': (() => {
          const completed = getCompletedTime(row);
          return completed.approximate ? `${completed.text} (approx.)` : completed.text;
        })(),
        'Sales Agent': row.agentName || '',
        Status: row.followupStatus || '',
        'Payment Option': row.paymentOption || '',
        Bank: row.paymentBank || '',
        'FS Number': row.fsNumber || '',
        'Course Price (ETB)': Number(row.coursePrice || 0),
        'Payment Slip': row.hasPaymentScreenshot ? 'Uploaded' : 'Missing',
      }));
      const sheet = XLSX.utils.json_to_sheet(sheetRows);
      sheet['!cols'] = Object.keys(sheetRows[0]).map((key) => ({
        wch: Math.min(40, Math.max(key.length, ...sheetRows.map((r) => String(r[key]).length)) + 2),
      }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, 'Sales Follow-up');
      const rangePart = dateFrom || dateTo ? `${dateFrom || 'start'}_to_${dateTo || 'now'}` : 'all-time';
      const agentName = agents.find((option) => option.id === agent)?.name;
      const agentPart = agentName ? `-${agentName.replace(/[^\w-]+/g, '-')}` : '';
      XLSX.writeFile(workbook, `finance-sales-followup-${rangePart}${agentPart}.xlsx`);
    } catch (err) {
      toast({ title: 'Export failed', description: err.message, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setAgent('');
    choosePeriod('all');
  };

  const hasFilters = searchInput || agent || dateFrom || dateTo;
  const periodLabel = PERIODS.find((option) => option.value === period)?.label || 'Custom range';
  const rangeLabel = dateFrom || dateTo
    ? `${dateFrom ? formatDate(`${dateFrom}T00:00:00`) : 'Any date'} – ${dateTo ? formatDate(`${dateTo}T00:00:00`) : 'today'}`
    : 'All registration dates';
  const missingSlips = summary ? summary.total - summary.withSlip : 0;
  const firstRow = pagination.total ? (pagination.page - 1) * limit + 1 : 0;
  const lastRow = Math.min(pagination.page * limit, pagination.total);

  return (
    <Box p={{ base: 3, md: 6 }} bg={pageBg} minH="100%">
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={5}>
        <Box>
          <Heading size="lg">Sales Follow-up Details</Heading>
          <Text color="gray.500" fontSize="sm" mt={1}>
            Completed sales follow-ups with customers, trainings, registration dates, sales agents and payment slips.
          </Text>
        </Box>
        <HStack>
          <Button leftIcon={<FiRefreshCw />} variant="outline" size="sm" onClick={loadRows} isLoading={loading}>
            Refresh
          </Button>
          <Button leftIcon={<FiDownload />} colorScheme="teal" size="sm" onClick={exportExcel} isLoading={exporting} loadingText="Exporting">
            Export Excel
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={5}>
        <StatCard label="Follow-ups" value={summary ? summary.total.toLocaleString() : '—'} helper={periodLabel === "All time" ? "Matching current filters" : periodLabel} icon={FiUsers} color="blue" />
        <StatCard label="Course value" value={summary ? formatMoney(summary.totalCoursePrice) : '—'} helper="Sum of course prices" icon={FiDollarSign} color="green" />
        <StatCard label="Slips uploaded" value={summary ? summary.withSlip.toLocaleString() : '—'} helper={summary?.total ? `${Math.round((summary.withSlip / summary.total) * 100)}% have a payment slip` : 'Payment proof received'} icon={FiFileText} color="teal" />
        <StatCard label="Slips missing" value={summary ? missingSlips.toLocaleString() : '—'} helper="Need payment proof" icon={FiAlertCircle} color={missingSlips > 0 ? 'orange' : 'gray'} />
      </SimpleGrid>

      <Card bg={cardBg} borderRadius="xl" boxShadow="sm" mb={5}>
        <CardBody>
          <Flex justify="space-between" align={{ base: 'flex-start', lg: 'center' }} direction={{ base: 'column', lg: 'row' }} gap={2} mb={4}>
            <Wrap spacing={2}>
              {PERIODS.map((option) => (
                <WrapItem key={option.value}>
                  <Button
                    size="sm"
                    borderRadius="full"
                    colorScheme="teal"
                    variant={period === option.value ? 'solid' : 'outline'}
                    leftIcon={option.value === 'custom' ? <FiCalendar /> : undefined}
                    onClick={() => choosePeriod(option.value)}
                  >
                    {option.label}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
            <Text fontSize="sm" color="gray.500">
              <b>{periodLabel}:</b> {rangeLabel}
            </Text>
          </Flex>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 6 }} spacing={3} alignItems="end">
            <Box gridColumn={{ xl: 'span 2' }}>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>Search</Text>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none"><FiSearch color="gray" /></InputLeftElement>
                <Input
                  placeholder="Customer, phone, email, training or agent…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  borderRadius="md"
                />
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
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>Status</Text>
              <Badge colorScheme="green" borderRadius="full" px={3} py={1}>Completed only</Badge>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>Registered from</Text>
              <Input size="sm" type="date" borderRadius="md" value={dateFrom} max={dateTo || undefined} onChange={changeDate(setDateFrom)} />
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>Registered to</Text>
              <Input size="sm" type="date" borderRadius="md" value={dateTo} min={dateFrom || undefined} onChange={changeDate(setDateTo)} />
            </Box>
          </SimpleGrid>
          {hasFilters && (
            <Button mt={3} size="xs" variant="ghost" leftIcon={<FiX />} onClick={clearFilters}>
              Reset filters
            </Button>
          )}
        </CardBody>
      </Card>

      <Card bg={cardBg} borderRadius="xl" boxShadow="sm" overflow="hidden">
        {error ? (
          <Alert status="error" borderRadius="xl">
            <AlertIcon />
            <Box flex="1">{error}</Box>
            <Button size="sm" colorScheme="red" variant="outline" onClick={loadRows}>Retry</Button>
          </Alert>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead bg={headerBg}>
                <Tr>
                  <Th>#</Th>
                  <Th>Customer</Th>
                  <Th>Training</Th>
                  <Th>Registered</Th>
                  <Th>Completed</Th>
                  <Th>Sales agent</Th>
                  <Th>Status</Th>
                  <Th>Payment</Th>
                  <Th isNumeric>Price</Th>
                  <Th textAlign="center">Payment slip</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading && !rows.length ? (
                  <Tr>
                    <Td colSpan={10} py={12}>
                      <HStack justify="center" color="gray.500" spacing={3}>
                        <Spinner size="sm" />
                        <Text>Loading sales follow-ups…</Text>
                      </HStack>
                    </Td>
                  </Tr>
                ) : !rows.length ? (
                  <Tr>
                    <Td colSpan={10} py={12} textAlign="center" color="gray.500">
                      No sales follow-ups match these filters.
                    </Td>
                  </Tr>
                ) : rows.map((row, index) => (
                  <Tr key={row._id} _hover={{ bg: rowHover }} opacity={loading ? 0.6 : 1} transition="opacity 0.2s">
                    <Td color="gray.500">{firstRow + index}</Td>
                    <Td>
                      <Text fontWeight="semibold">{row.customerName || '—'}</Text>
                      <Text fontSize="xs" color="gray.500">{[row.phone, row.email].filter(Boolean).join(' · ') || '—'}</Text>
                    </Td>
                    <Td maxW="220px" whiteSpace="normal">{getTraining(row)}</Td>
                    <Td whiteSpace="nowrap">{formatDate(row.date || row.createdAt)}</Td>
                    <Td whiteSpace="nowrap">
                      {(() => {
                        const completed = getCompletedTime(row);
                        if (!completed.text) return '—';
                        return completed.approximate ? (
                          <Tooltip label="Completed before completion times were recorded; showing the last update time" hasArrow>
                            <Box>
                              <Text color="gray.600">{completed.text}</Text>
                              <Text fontSize="10px" color="gray.500">approx.</Text>
                            </Box>
                          </Tooltip>
                        ) : completed.text;
                      })()}
                    </Td>
                    <Td>{row.agentName || '—'}</Td>
                    <Td>
                      <Badge colorScheme={STATUS_COLORS[(row.followupStatus || '').toLowerCase()] || 'gray'} borderRadius="full" px={2}>
                        {row.followupStatus || '—'}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{row.paymentOption || '—'}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {[row.paymentBank, row.fsNumber && `FS ${row.fsNumber}`].filter(Boolean).join(' · ') || 'No bank details'}
                      </Text>
                    </Td>
                    <Td isNumeric fontWeight="semibold">{row.coursePrice ? formatMoney(row.coursePrice) : '—'}</Td>
                    <Td textAlign="center">
                      {row.hasPaymentScreenshot ? (
                        <VStack spacing={0.5}>
                          <Button size="xs" colorScheme="teal" leftIcon={<FiEye />} onClick={() => openSlip(row)}>
                            View slip
                          </Button>
                          <Text fontSize="10px" color="gray.500">{SLIP_SOURCE_LABELS[row.paymentSlipSource] || ''}</Text>
                        </VStack>
                      ) : (
                        <Badge colorScheme="orange" variant="subtle">Missing</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
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
              {[15, 30, 50, 100].map((size) => <option key={size} value={size}>{size} / page</option>)}
            </Select>
            <IconButton size="sm" icon={<FiChevronLeft />} aria-label="Previous page" isDisabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} />
            <Text fontSize="sm" whiteSpace="nowrap">Page {pagination.page} of {pagination.totalPages}</Text>
            <IconButton size="sm" icon={<FiChevronRight />} aria-label="Next page" isDisabled={page >= pagination.totalPages || loading} onClick={() => setPage((p) => p + 1)} />
          </HStack>
        </Flex>
      </Card>

      <Modal isOpen={Boolean(slip)} onClose={() => setSlip(null)} size="3xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Payment slip
            {slip?.row && (
              <Text fontSize="sm" fontWeight="normal" color="gray.500">
                {slip.row.customerName} · {getTraining(slip.row)} · {slip.row.paymentBank || 'Bank not set'}
                {slip.row.fsNumber ? ` · FS ${slip.row.fsNumber}` : ''}
              </Text>
            )}
            {slip?.source && (
              <Badge mt={1} colorScheme={slip.source === 'sales' ? 'teal' : 'purple'} fontWeight="medium">
                {SLIP_SOURCE_LABELS[slip.source]}
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {slip?.loading ? (
              <VStack py={16} color="gray.500"><Spinner /><Text>Loading payment slip…</Text></VStack>
            ) : slip?.error ? (
              <Alert status="warning" borderRadius="md"><AlertIcon />{slip.error}</Alert>
            ) : slip?.src && isPdf(slip.src) ? (
              <Box as="iframe" src={slip.src} title="Payment slip" w="100%" h="70vh" borderRadius="md" />
            ) : slip?.src ? (
              <Image src={slip.src} alt={`Payment slip for ${slip.row.customerName}`} maxH="70vh" mx="auto" borderRadius="md" objectFit="contain" />
            ) : null}
          </ModalBody>
          <ModalFooter gap={2}>
            <Tooltip label="Save the slip to your computer">
              <Button leftIcon={<FiDownload />} onClick={downloadSlip} isDisabled={!slip?.src}>Download</Button>
            </Tooltip>
            <Button colorScheme="teal" onClick={() => setSlip(null)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FinanceSalesFollowupPage;
