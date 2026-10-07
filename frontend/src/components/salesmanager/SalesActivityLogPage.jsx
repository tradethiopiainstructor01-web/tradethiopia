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
  Input,
  InputGroup,
  InputLeftElement,
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
  Tooltip,
  Tr,
  useColorModeValue,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiFileMinus,
  FiFilePlus,
  FiLock,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import axiosInstance from '../../services/axiosInstance';
import { getSalesActivityLog } from '../../services/salesManagerService';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

const ACTIONS = {
  created: { label: 'Created', color: 'green', icon: FiPlusCircle },
  updated: { label: 'Edited', color: 'blue', icon: FiEdit3 },
  deleted: { label: 'Deleted', color: 'red', icon: FiTrash2 },
};

const CHANGE_TYPES = [
  { value: 'payment_slip_added', label: 'Payment slip added' },
  { value: 'payment_slip_replaced', label: 'Payment slip replaced' },
  { value: 'payment_slip_removed', label: 'Payment slip removed' },
  { value: 'payment_slip_deleted', label: 'Deleted with payment slip' },
  { value: 'completed', label: 'Marked completed' },
  { value: 'reopened', label: 'Reopened' },
  { value: 'status_changed', label: 'Status changed' },
  { value: 'reassigned', label: 'Reassigned agent' },
  { value: 'price_changed', label: 'Price changed' },
  { value: 'note_changed', label: 'Note / comment changed' },
  { value: 'details_edited', label: 'Details edited' },
];

const SOURCES = {
  sales_portal: 'Sales portal',
  reception: 'Reception',
  sales_manager: 'Sales manager',
  import: 'Import',
  student_registration: 'Student registration',
  training_followup: 'Training follow-up',
  history: 'Rebuilt from earlier records',
};

const getPeriodRange = (period, now = new Date()) => {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case 'today':
      return { from: startOfDay, to: null };
    case 'week': {
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // weeks start on Monday
      return { from: start, to: null };
    }
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
    case '30days': {
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - 29);
      return { from: start, to: null };
    }
    default:
      return { from: null, to: null };
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

const formatDay = (value) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

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

// One changed field: documents show Uploaded / Replaced / Removed, values show from → to.
const ChangeLine = ({ change, action }) => {
  if (change.kind === 'document') {
    const color = change.to === 'Removed' ? 'red' : change.to === 'Replaced' ? 'orange' : 'green';
    return (
      <HStack spacing={1.5}>
        <Text fontSize="xs" fontWeight="semibold">{change.label}:</Text>
        <Badge colorScheme={color} variant="subtle" fontSize="10px">{action === 'deleted' ? 'Deleted with record' : change.to}</Badge>
      </HStack>
    );
  }
  const from = change.from || '—';
  const to = change.to || '—';
  // No earlier value (new record, or a rebuilt history entry): show just the value.
  const text = action === 'created' || !change.from ? to : action === 'deleted' ? from : `${from} → ${to}`;
  return (
    <Tooltip label={`${change.label}: ${text}`} hasArrow openDelay={300}>
      <Text fontSize="xs" noOfLines={1} maxW="340px">
        <b>{change.label}:</b> {text}
      </Text>
    </Tooltip>
  );
};

const SalesActivityLogPage = () => {
  const [period, setPeriod] = useState('all');
  const [agent, setAgent] = useState('');
  const [action, setAction] = useState('');
  const [changeType, setChangeType] = useState('');
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
  const requestId = useRef(0);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const rowHover = useColorModeValue('gray.50', 'whiteAlpha.50');
  const barTrack = useColorModeValue('gray.100', 'whiteAlpha.100');

  // Sales agents for the filter (the employee directory is cached on the server).
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

  useEffect(() => { setPage(1); }, [period, agent, action, changeType, search, limit]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    const { from, to } = getPeriodRange(period);
    try {
      const data = await getSalesActivityLog({
        page,
        limit,
        ...(from ? { from: from.toISOString() } : {}),
        ...(to ? { to: to.toISOString() } : {}),
        ...(agent ? { agent } : {}),
        ...(action ? { action } : {}),
        ...(changeType ? { changeType } : {}),
        ...(search ? { search } : {}),
      });
      if (id !== requestId.current) return;
      setRows(Array.isArray(data?.data) ? data.data : []);
      setSummary(data?.summary || null);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.response?.data?.message || err.message || 'Could not load the activity log.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [period, agent, action, changeType, search, page, limit]);

  useEffect(() => { load(); }, [load]);

  const hasFilters = agent || action || changeType || searchInput;
  const clearFilters = () => {
    setAgent('');
    setAction('');
    setChangeType('');
    setSearchInput('');
  };

  const maxDay = Math.max(1, ...(summary?.byDay || []).map((day) => day.created + day.updated + day.deleted));
  const firstRow = pagination.total ? (pagination.page - 1) * limit + 1 : 0;
  const lastRow = Math.min(pagination.page * limit, pagination.total);
  const fmt = (value) => (summary ? Number(value || 0).toLocaleString() : '—');

  return (
    <Box p={{ base: 3, md: 6 }} bg={pageBg} minH="100%">
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={5}>
        <Box>
          <HStack spacing={3}>
            <Heading size="lg">Sales Activity Log</Heading>
            <Badge colorScheme="gray" variant="outline" borderRadius="full" px={2} display="flex" alignItems="center" gap={1}>
              <Icon as={FiLock} boxSize={3} /> Read-only
            </Badge>
          </HStack>
          <Text color="gray.500" fontSize="sm" mt={1}>
            Every sales follow-up created, edited or deleted — with payment slip changes, who made them and when. Entries cannot be changed or deleted.
          </Text>
        </Box>
        <Button leftIcon={<FiRefreshCw />} variant="outline" size="sm" onClick={load} isLoading={loading}>
          Refresh
        </Button>
      </Flex>

      <Alert status="info" borderRadius="xl" mb={5} fontSize="sm" variant="left-accent">
        <AlertIcon />
        Activity from before this log was switched on is rebuilt from earlier records and marked <Badge mx={1} variant="outline">History</Badge>:
        when each follow-up was created and by whom, when it was marked completed, and its last edit with any payment slip on file.
        Older individual edits and deleted follow-ups were never stored, so they cannot be shown.
      </Alert>

      <Card bg={cardBg} borderRadius="xl" boxShadow="sm" mb={5}>
        <CardBody>
          <Wrap spacing={2} mb={4}>
            {PERIODS.map((option) => (
              <WrapItem key={option.value}>
                <Button size="sm" borderRadius="full" colorScheme="purple"
                  variant={period === option.value ? 'solid' : 'outline'} onClick={() => setPeriod(option.value)}>
                  {option.label}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={3}>
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
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>Activity</Text>
              <Select size="sm" borderRadius="md" value={action} onChange={(e) => setAction(e.target.value)}>
                <option value="">All activity</option>
                <option value="created">Created</option>
                <option value="updated">Edited</option>
                <option value="deleted">Deleted</option>
              </Select>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>Change</Text>
              <Select size="sm" borderRadius="md" value={changeType} onChange={(e) => setChangeType(e.target.value)}>
                <option value="">All changes</option>
                {CHANGE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Box>
          </SimpleGrid>
          {hasFilters && (
            <Button mt={3} size="xs" variant="ghost" leftIcon={<FiX />} onClick={clearFilters}>Reset filters</Button>
          )}
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} spacing={4} mb={5}>
        <StatCard label="Activities" value={fmt(summary?.total)} icon={FiActivity} color="purple" helper="Matching filters" />
        <StatCard label="Created" value={fmt(summary?.created)} icon={FiPlusCircle} color="green" helper={summary ? `${summary.completed.toLocaleString()} marked completed` : ''} />
        <StatCard label="Edited" value={fmt(summary?.updated)} icon={FiEdit3} color="blue" />
        <StatCard label="Deleted" value={fmt(summary?.deleted)} icon={FiTrash2} color="red" />
        <StatCard label="Slips added" value={fmt(summary?.slipAdded)} icon={FiFilePlus} color="teal" helper={summary ? `${summary.slipReplaced.toLocaleString()} replaced` : ''} />
        <StatCard label="Slips removed" value={fmt(summary?.slipRemoved)} icon={FiFileMinus} color="orange" helper="Removed or deleted" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} mb={5}>
        <Card bg={cardBg} borderRadius="xl" boxShadow="sm">
          <CardBody>
            <Heading size="sm" mb={1}>Activity by day</Heading>
            <HStack spacing={3} mb={3} fontSize="xs" color="gray.500">
              <HStack spacing={1}><Box w={2.5} h={2.5} borderRadius="sm" bg="green.400" /><Text>Created</Text></HStack>
              <HStack spacing={1}><Box w={2.5} h={2.5} borderRadius="sm" bg="blue.400" /><Text>Edited</Text></HStack>
              <HStack spacing={1}><Box w={2.5} h={2.5} borderRadius="sm" bg="red.400" /><Text>Deleted</Text></HStack>
            </HStack>
            {!summary?.byDay?.length ? (
              <Text fontSize="sm" color="gray.500" py={6} textAlign="center">No activity in this period.</Text>
            ) : (
              <Stack spacing={1.5} maxH="300px" overflowY="auto" pr={1}>
                {summary.byDay.map((day) => {
                  const total = day.created + day.updated + day.deleted;
                  return (
                    <Tooltip key={day.date} hasArrow
                      label={`${formatDay(day.date)}: ${day.created} created, ${day.updated} edited, ${day.deleted} deleted`}>
                      <HStack spacing={3}>
                        <Text fontSize="xs" color="gray.500" w="52px" flexShrink={0}>{formatDay(day.date)}</Text>
                        <Flex flex="1" h="14px" bg={barTrack} borderRadius="full" overflow="hidden">
                          <Box w={`${(day.created / maxDay) * 100}%`} bg="green.400" />
                          <Box w={`${(day.updated / maxDay) * 100}%`} bg="blue.400" />
                          <Box w={`${(day.deleted / maxDay) * 100}%`} bg="red.400" />
                        </Flex>
                        <Text fontSize="xs" fontWeight="semibold" w="32px" textAlign="right">{total}</Text>
                      </HStack>
                    </Tooltip>
                  );
                })}
              </Stack>
            )}
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="xl" boxShadow="sm">
          <CardBody>
            <Heading size="sm" mb={3}>Activity by person</Heading>
            {!summary?.byPerson?.length ? (
              <Text fontSize="sm" color="gray.500" py={6} textAlign="center">No activity in this period.</Text>
            ) : (
              <TableContainer maxH="300px" overflowY="auto">
                <Table size="sm">
                  <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
                    <Tr>
                      <Th>Person</Th>
                      <Th isNumeric>Created</Th>
                      <Th isNumeric>Edited</Th>
                      <Th isNumeric>Deleted</Th>
                      <Th isNumeric>Slips +</Th>
                      <Th isNumeric>Slips −</Th>
                      <Th>Last activity</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {summary.byPerson.map((person) => {
                      const last = formatDateTime(person.lastActivity);
                      return (
                        <Tr key={person.id || person.name}>
                          <Td>
                            <Text fontWeight="semibold" fontSize="sm">{person.name || 'System'}</Text>
                            <Text fontSize="xs" color="gray.500">{person.role || '—'}</Text>
                          </Td>
                          <Td isNumeric>{person.created}</Td>
                          <Td isNumeric>{person.updated}</Td>
                          <Td isNumeric color={person.deleted ? 'red.500' : undefined}>{person.deleted}</Td>
                          <Td isNumeric color={person.slipAdded ? 'teal.500' : undefined}>{person.slipAdded}</Td>
                          <Td isNumeric color={person.slipRemoved ? 'orange.500' : undefined}>{person.slipRemoved}</Td>
                          <Td whiteSpace="nowrap" fontSize="xs">{last.date}<br />{last.time}</Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

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
                  <Th>Activity</Th>
                  <Th>Customer</Th>
                  <Th>Sales agent</Th>
                  <Th>Done by</Th>
                  <Th>What changed</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading && !rows.length ? (
                  <Tr><Td colSpan={6} py={12}>
                    <HStack justify="center" color="gray.500" spacing={3}><Spinner size="sm" /><Text>Loading activity…</Text></HStack>
                  </Td></Tr>
                ) : !rows.length ? (
                  <Tr><Td colSpan={6} py={12} textAlign="center" color="gray.500">
                    No activity matches these filters. New activity appears here as follow-ups are created, edited or deleted.
                  </Td></Tr>
                ) : rows.map((row) => {
                  const when = formatDateTime(row.createdAt);
                  const meta = ACTIONS[row.action] || ACTIONS.updated;
                  const changes = row.changes || [];
                  const shown = changes.slice(0, 4);
                  return (
                    <Tr key={row._id} _hover={{ bg: rowHover }} opacity={loading ? 0.6 : 1} verticalAlign="top">
                      <Td whiteSpace="nowrap">
                        <Text fontSize="sm" fontWeight="semibold">{when.date}</Text>
                        <Text fontSize="xs" color="gray.500">{when.time}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={meta.color} borderRadius="full" px={2} display="inline-flex" alignItems="center" gap={1}>
                          <Icon as={meta.icon} boxSize={3} /> {meta.label}
                        </Badge>
                        {row.source === 'history' && (
                          <Tooltip hasArrow label="Rebuilt from records kept before the activity log existed">
                            <Badge ml={1} colorScheme="gray" variant="outline" fontSize="10px">History</Badge>
                          </Tooltip>
                        )}
                        {row.changeTypes?.includes('completed') && <Badge ml={1} colorScheme="green" variant="subtle" fontSize="10px">Completed</Badge>}
                        {row.changeTypes?.includes('payment_slip_added') && <Badge ml={1} colorScheme="teal" variant="subtle" fontSize="10px">Slip added</Badge>}
                        {row.changeTypes?.includes('payment_slip_replaced') && <Badge ml={1} colorScheme="orange" variant="subtle" fontSize="10px">Slip replaced</Badge>}
                        {row.changeTypes?.includes('payment_slip_removed') && <Badge ml={1} colorScheme="red" variant="subtle" fontSize="10px">Slip removed</Badge>}
                        {row.changeTypes?.includes('payment_slip_deleted') && <Badge ml={1} colorScheme="red" variant="subtle" fontSize="10px">Slip deleted</Badge>}
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
                        <Stack spacing={0.5}>
                          {shown.map((change) => <ChangeLine key={change.field} change={change} action={row.action} />)}
                          {changes.length > shown.length && (
                            <Tooltip hasArrow placement="left"
                              label={<Stack spacing={0.5}>{changes.slice(shown.length).map((change) => (
                                <Text key={change.field} fontSize="xs"><b>{change.label}:</b> {change.kind === 'document' ? change.to : `${change.from || '—'} → ${change.to || '—'}`}</Text>
                              ))}</Stack>}>
                              <Text fontSize="xs" color="purple.500" cursor="default">+ {changes.length - shown.length} more</Text>
                            </Tooltip>
                          )}
                          {!changes.length && <Text fontSize="xs" color="gray.500">—</Text>}
                        </Stack>
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
    </Box>
  );
};

export default SalesActivityLogPage;
