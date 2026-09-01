import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, AlertIcon, Avatar, Badge, Box, Button, Card, CardBody, Divider, Drawer,
  DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Flex,
  FormControl, FormLabel, Grid, Heading, HStack, Icon, Input, Select, SimpleGrid, Spinner,
  Stack, Stat, StatLabel, StatNumber, Table, Tbody, Td, Text, Textarea, Th, Thead,
  Tr, useToast, VStack,
} from '@chakra-ui/react';
import {
  FiBriefcase, FiCalendar, FiCheck, FiCheckCircle, FiClipboard, FiClock,
  FiDownload, FiExternalLink, FiFileText, FiFilter, FiMail, FiPhone, FiRefreshCw,
  FiSearch, FiTag, FiUserCheck, FiUsers, FiX, FiXCircle,
} from 'react-icons/fi';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

const TYPES = {
  annual_leave: 'Annual Leave', sick_leave: 'Sick Leave', paternity_leave: 'Paternity Leave',
  maternity_leave: 'Maternity Leave', marriage_leave: 'Marriage Leave', unpaid_leave: 'Unpaid Leave',
  other_leave: 'Other Leave',
};
const STATUSES = {
  pending_manager: ['Awaiting manager', 'orange'], manager_rejected: ['Manager rejected', 'red'],
  pending_hr: ['Awaiting HR', 'blue'], hr_approved: ['HR approved', 'green'],
  hr_rejected: ['HR rejected', 'red'], cancelled: ['Cancelled', 'gray'],
};
const nameOf = (person) => person?.fullName || person?.username || person?.email || 'Not assigned';
const dateOf = (value) => value ? new Date(value).toLocaleDateString() : 'Not recorded';
const dateTimeOf = (value) => value ? new Date(value).toLocaleString() : 'Not recorded';
const displayKey = (value) => String(value).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase());

const displayValue = (value, key = '') => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  const str = String(value ?? '');
  if (key.toLowerCase().includes('date')) return dateOf(str);
  if (key === 'leaveDuration') return str === 'half_day' ? 'Half Day' : 'Full Day';
  return str;
};

function Metric({ label, value, helper, color = 'teal', icon: IconComp }) {
  return <Card border="1px solid" borderColor="gray.200" boxShadow="sm"><CardBody><Flex justify="space-between"><Stat><StatLabel color="gray.600">{label}</StatLabel><StatNumber>{value}</StatNumber><Text fontSize="sm" color="gray.500">{helper}</Text></Stat><Box p={3} h="fit-content" borderRadius="xl" bg={`${color}.50`} color={`${color}.600`}><IconComp size={22} /></Box></Flex></CardBody></Card>;
}

export default function LeaveManagementPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: 'all', type: 'all', department: 'all', from: '', to: '' });

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      const { data } = await axiosInstance.get('/employee-requests/hr-leave-dashboard');
      const list = data.data || [];
      setRequests(list);

      // Deep link support from notification click
      const reqId = searchParams.get('requestId');
      if (reqId) {
        const found = list.find((item) => String(item._id) === String(reqId) || item.requestNumber === reqId);
        if (found) {
          setSelected(found);
        }
      }
    } catch (error) {
      toast({ title: 'Leave records could not be loaded', description: error.response?.data?.message || error.message, status: 'error' });
    } finally { setLoading(false); setRefreshing(false); }
  }, [searchParams, toast]);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => ({
    total: requests.length,
    manager: requests.filter((item) => item.status === 'pending_manager').length,
    hr: requests.filter((item) => item.status === 'pending_hr').length,
    approved: requests.filter((item) => item.status === 'hr_approved').length,
    rejected: requests.filter((item) => ['manager_rejected', 'hr_rejected'].includes(item.status)).length,
  }), [requests]);

  const departments = useMemo(() => [...new Set(requests.map((item) => item.department).filter(Boolean))].sort(), [requests]);
  const filtered = useMemo(() => requests.filter((item) => {
    const needle = filters.search.trim().toLowerCase();
    const searchable = [item.requestNumber, item.title, nameOf(item.requester), item.requester?.email, item.department].join(' ').toLowerCase();
    const created = new Date(item.createdAt);
    return (!needle || searchable.includes(needle)) &&
      (filters.status === 'all' || item.status === filters.status) &&
      (filters.type === 'all' || item.subcategory === filters.type) &&
      (filters.department === 'all' || item.department === filters.department) &&
      (!filters.from || created >= new Date(`${filters.from}T00:00:00`)) &&
      (!filters.to || created <= new Date(`${filters.to}T23:59:59`));
  }), [filters, requests]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => setFilters({ search: '', status: 'all', type: 'all', department: 'all', from: '', to: '' });

  const decide = async (decision) => {
    if (!selected?._id) return;
    if (decision === 'rejected' && !decisionNote.trim()) {
      toast({ title: 'Provide a clear rejection reason', status: 'warning' });
      return;
    }
    setDeciding(true);
    try {
      await axiosInstance.patch(`/employee-requests/${selected._id}/hr-decision`, { decision, note: decisionNote.trim() });
      toast({ title: decision === 'approved' ? 'Leave request approved' : 'Leave request rejected', status: 'success' });
      setSelected(null);
      setDecisionNote('');
      await load(true);
    } catch (error) {
      toast({ title: 'HR decision could not be saved', description: error.response?.data?.message || error.message, status: 'error' });
    } finally { setDeciding(false); }
  };

  return <Box maxW="1600px" mx="auto" px={{ base: 4, xl: 8 }} py={8}>
    <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" align={{ base: 'flex-start', lg: 'center' }} gap={5} mb={7}>
      <Box><Text color="teal.700" fontSize="sm" fontWeight="800" letterSpacing="wide">HR WORKSPACE / LEAVE MANAGEMENT</Text><Heading size="xl">Leave Management</Heading><Text mt={2} color="gray.600" maxW="800px">Monitor every employee leave request from manager review through HR’s final decision. Review, approve, or reject employee requests directly.</Text></Box>
      <HStack spacing={3} flexWrap="wrap">
        <Button as={RouterLink} to="/employee-requests?tab=hr" colorScheme="teal" leftIcon={<FiClipboard />}>
          Employee Request Center
        </Button>
        <Button leftIcon={<FiRefreshCw />} variant="outline" colorScheme="teal" isLoading={refreshing} onClick={() => load(true)}>
          Refresh records
        </Button>
      </HStack>
    </Flex>

    <SimpleGrid columns={{ base: 1, sm: 2, xl: 5 }} gap={4} mb={6}>
      <Metric label="All leave requests" value={summary.total} helper="Complete leave register" icon={FiUsers} />
      <Metric label="Awaiting manager" value={summary.manager} helper="Pending line review" color="orange" icon={FiClock} />
      <Metric label="Awaiting HR" value={summary.hr} helper="Ready for HR decision" color="blue" icon={FiFilter} />
      <Metric label="HR approved" value={summary.approved} helper="Final permission granted" color="green" icon={FiCheck} />
      <Metric label="Rejected" value={summary.rejected} helper="Manager or HR decision" color="red" icon={FiX} />
    </SimpleGrid>

    <Card border="1px solid" borderColor="gray.200" boxShadow="sm" mb={6}><CardBody>
      <Flex align="center" gap={2} mb={4}><FiFilter /><Heading size="md">Filter leave records</Heading></Flex>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: '2fr repeat(5, 1fr)' }} gap={4}>
        <FormControl><FormLabel fontSize="sm">Search</FormLabel><Box position="relative"><Box position="absolute" left={3} top={3} color="gray.400"><FiSearch /></Box><Input pl={10} value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Employee, email or request ID" /></Box></FormControl>
        <FormControl><FormLabel fontSize="sm">Workflow status</FormLabel><Select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="all">All statuses</option>{Object.entries(STATUSES).map(([key, value]) => <option key={key} value={key}>{value[0]}</option>)}</Select></FormControl>
        <FormControl><FormLabel fontSize="sm">Leave type</FormLabel><Select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}><option value="all">All leave types</option>{Object.entries(TYPES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</Select></FormControl>
        <FormControl><FormLabel fontSize="sm">Department</FormLabel><Select value={filters.department} onChange={(event) => updateFilter('department', event.target.value)}><option value="all">All departments</option>{departments.map((department) => <option key={department}>{department}</option>)}</Select></FormControl>
        <FormControl><FormLabel fontSize="sm">Submitted from</FormLabel><Input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} /></FormControl>
        <FormControl><FormLabel fontSize="sm">Submitted to</FormLabel><Input type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} /></FormControl>
      </Grid>
      <Flex justify="space-between" align="center" mt={4}><Text fontSize="sm" color="gray.600">Showing <b>{filtered.length}</b> of {requests.length} leave records</Text><Button size="sm" variant="ghost" onClick={clearFilters}>Clear filters</Button></Flex>
    </CardBody></Card>

    <Card border="1px solid" borderColor="gray.200" boxShadow="sm"><CardBody p={0}>
      <Box p={5}><Heading size="md">Employee leave register</Heading><Text fontSize="sm" color="gray.500">Select any record to view full employee details, supporting files, approval timeline, and make HR decisions.</Text></Box>
      {loading ? <Flex minH="300px" justify="center" align="center"><Spinner size="xl" color="teal.500" /></Flex> : <Box overflowX="auto"><Table><Thead bg="gray.50"><Tr><Th>Employee</Th><Th>Leave type</Th><Th>Requested period</Th><Th>Department</Th><Th>Manager</Th><Th>Status</Th><Th>Submitted</Th><Th></Th></Tr></Thead><Tbody>
        {filtered.map((item) => { const status = STATUSES[item.status] || [displayKey(item.status), 'gray']; const form = item.formData || {}; const period = form.leaveDuration === 'half_day' ? `${dateOf(form.halfDayDate)} · Half day` : `${dateOf(form.startDate)} – ${dateOf(form.endDate)}`; return <Tr key={item._id} _hover={{ bg: 'gray.50' }}><Td><HStack><Avatar size="sm" name={nameOf(item.requester)} /><Box><Text fontWeight="700">{nameOf(item.requester)}</Text><Text fontSize="xs" color="gray.500">{item.requestNumber}</Text></Box></HStack></Td><Td><Text fontWeight="600">{TYPES[item.subcategory] || item.title}</Text></Td><Td whiteSpace="nowrap">{period}</Td><Td>{item.department}</Td><Td>{nameOf(item.manager)}</Td><Td><Badge colorScheme={status[1]}>{status[0]}</Badge></Td><Td whiteSpace="nowrap">{dateOf(item.createdAt)}</Td><Td><Button size="sm" colorScheme="teal" variant="outline" onClick={() => { setSelected(item); setDecisionNote(''); }}>View details</Button></Td></Tr>; })}
        {!filtered.length && <Tr><Td colSpan={8} textAlign="center" py={14} color="gray.500">No leave requests match the selected filters.</Td></Tr>}
      </Tbody></Table></Box>}
    </CardBody></Card>

    <Drawer isOpen={Boolean(selected)} onClose={() => setSelected(null)} placement="right" size="full"><DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" /><DrawerContent ml="auto" maxW={{ base: '100%', lg: '860px' }} bg="gray.50"><DrawerCloseButton color="white" top={5} right={5} zIndex={2} /><DrawerHeader p={0}><Box px={{ base: 5, md: 8 }} py={7} bg="linear-gradient(120deg, #225b5c, #2f8584)" color="white"><Text fontSize="xs" fontWeight="800" color="teal.100">{selected?.requestNumber}</Text><Heading mt={1}>{selected && (TYPES[selected.subcategory] || selected.title)}</Heading><Text mt={2} color="teal.100">Complete employee leave record, full details and HR review controls</Text></Box></DrawerHeader><DrawerBody px={{ base: 4, md: 8 }} py={6}>
      {selected && <Stack spacing={5}>
        {/* Employee and Manager Overview */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs">
            <CardBody>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="xs" fontWeight="800" color="gray.500">EMPLOYEE INFORMATION</Text>
                {(selected.requester?._id || selected.requestedById) && (
                  <Button
                    size="xs"
                    colorScheme="teal"
                    variant="outline"
                    leftIcon={<FiExternalLink />}
                    onClick={() => navigate(`/users?userId=${selected.requester?._id || selected.requestedById}&tab=2`)}
                  >
                    Profile
                  </Button>
                )}
              </Flex>
              <HStack mt={2} spacing={3}>
                <Avatar size="md" name={nameOf(selected.requester)} bg="teal.600" color="white" />
                <Box>
                  <Text fontWeight="800" fontSize="md">{nameOf(selected.requester)}</Text>
                  <Text fontSize="xs" color="teal.700" fontWeight="600">{selected.requester?.jobTitle || selected.requester?.role || 'Staff Member'}</Text>
                  <Text fontSize="xs" color="gray.500">Dept: <strong>{selected.department || selected.requester?.department || 'General'}</strong></Text>
                </Box>
              </HStack>
              <Stack mt={3} spacing={1.5} fontSize="xs" bg="gray.50" p={2.5} borderRadius="lg">
                {selected.requester?.email && <HStack><Icon as={FiMail} color="gray.400" /><Text color="gray.600">Email:</Text><Text fontWeight="600">{selected.requester.email}</Text></HStack>}
                {(selected.requester?.phone || selected.requester?.altPhone) && <HStack><Icon as={FiPhone} color="gray.400" /><Text color="gray.600">Phone:</Text><Text fontWeight="600">{selected.requester?.phone || selected.requester?.altPhone}</Text></HStack>}
                {selected.requester?.digitalId && <HStack><Icon as={FiTag} color="gray.400" /><Text color="gray.600">Digital ID:</Text><Badge colorScheme="purple">{selected.requester.digitalId}</Badge></HStack>}
              </Stack>
            </CardBody>
          </Card>
          <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs">
            <CardBody>
              <Text fontSize="xs" fontWeight="800" color="gray.500" mb={2}>ASSIGNED LINE MANAGER</Text>
              <HStack mt={2} spacing={3}>
                <Avatar size="md" name={nameOf(selected.manager)} bg="blue.600" color="white" />
                <Box>
                  <Text fontWeight="800" fontSize="md">{nameOf(selected.manager)}</Text>
                  <Text fontSize="xs" color="blue.700" fontWeight="600">{selected.manager?.jobTitle || selected.manager?.role || 'Manager'}</Text>
                  <Text fontSize="xs" color="gray.500">Dept: <strong>{selected.department}</strong></Text>
                </Box>
              </HStack>
              <Stack mt={3} spacing={1.5} fontSize="xs" bg="gray.50" p={2.5} borderRadius="lg">
                {selected.manager?.email && <HStack><Icon as={FiMail} color="gray.400" /><Text color="gray.600">Email:</Text><Text fontWeight="600">{selected.manager.email}</Text></HStack>}
                <HStack><Icon as={FiUserCheck} color="green.500" /><Text color="gray.600">Status:</Text><Text fontWeight="700" color={selected.status === 'pending_manager' ? 'orange.600' : 'green.600'}>{selected.status === 'pending_manager' ? 'Pending Line Review' : 'Manager Review Done'}</Text></HStack>
              </Stack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Manager Decision Notice if already decided */}
        {selected.managerDecision?.decision && (
          <Box bg={selected.managerDecision.decision === 'approved' ? 'teal.50' : 'red.50'} borderRadius="xl" border="1px solid" borderColor={selected.managerDecision.decision === 'approved' ? 'teal.200' : 'red.200'} p={4}>
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                <Icon as={selected.managerDecision.decision === 'approved' ? FiCheckCircle : FiXCircle} color={selected.managerDecision.decision === 'approved' ? 'teal.600' : 'red.600'} />
                <Text fontWeight="800" color={selected.managerDecision.decision === 'approved' ? 'teal.900' : 'red.900'}>
                  Manager Decision: {selected.managerDecision.decision.toUpperCase()}
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.500">{dateTimeOf(selected.managerDecision.decidedAt)}</Text>
            </Flex>
            {selected.managerDecision.note && <Text mt={2} fontSize="sm" color={selected.managerDecision.decision === 'approved' ? 'teal.800' : 'red.800'}><strong>Remark:</strong> {selected.managerDecision.note}</Text>}
          </Box>
        )}

        {/* HR Decision Notice if already finalized */}
        {selected.hrDecision?.decision && (
          <Box bg={selected.hrDecision.decision === 'approved' ? 'green.50' : 'red.50'} borderRadius="xl" border="1px solid" borderColor={selected.hrDecision.decision === 'approved' ? 'green.200' : 'red.200'} p={4}>
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                <Icon as={selected.hrDecision.decision === 'approved' ? FiCheckCircle : FiXCircle} color={selected.hrDecision.decision === 'approved' ? 'green.600' : 'red.600'} />
                <Text fontWeight="800" color={selected.hrDecision.decision === 'approved' ? 'green.900' : 'red.900'}>
                  HR Final Decision: {selected.hrDecision.decision.toUpperCase()}
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.500">{dateTimeOf(selected.hrDecision.decidedAt)}</Text>
            </Flex>
            {selected.hrDecision.note && <Text mt={2} fontSize="sm" color={selected.hrDecision.decision === 'approved' ? 'green.800' : 'red.800'}><strong>HR Note:</strong> {selected.hrDecision.note}</Text>}
          </Box>
        )}

        {/* Form Details */}
        <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs"><CardBody>
          <Heading size="sm" mb={4}>Detailed Leave Request Information</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {Object.entries(selected.formData || {}).filter(([key, value]) => value !== '' && value !== false && !['laptopPassword'].includes(key)).map(([key, value]) => (
              <Box key={key} p={3.5} bg="gray.50" borderRadius="xl" border="1px solid" borderColor="gray.100">
                <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase">{displayKey(key)}</Text>
                <Text mt={1} fontWeight="700" color="gray.800">{displayValue(value, key)}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </CardBody></Card>

        {selected.attachments?.length > 0 && <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs"><CardBody><Heading size="sm" mb={3}>Supporting documents ({selected.attachments.length})</Heading><Stack spacing={2}>{selected.attachments.map((attachment) => <Button key={attachment.fileId} as="a" href={attachment.url} target="_blank" variant="outline" colorScheme="teal" justifyContent="space-between" rightIcon={<FiDownload />} leftIcon={<FiFileText />}>{attachment.originalName}</Button>)}</Stack></CardBody></Card>}

        {/* Approval timeline */}
        <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs"><CardBody><Heading size="sm">Approval timeline</Heading><VStack align="stretch" mt={4} spacing={4}>{(selected.history || []).map((event, index) => <Flex key={`${event.occurredAt}-${index}`} gap={3}><Box mt={1} w="10px" h="10px" borderRadius="full" bg="teal.500" /><Box><Text fontWeight="700">{displayKey(event.action)}</Text><Text fontSize="sm" color="gray.600">{event.note || STATUSES[event.status]?.[0]}</Text><Text fontSize="xs" color="gray.400">{dateTimeOf(event.occurredAt)}</Text></Box></Flex>)}</VStack></CardBody></Card>

        {/* Direct HR Decision controls for ANY pending request */}
        {['pending_manager', 'pending_hr'].includes(selected.status) && (
          <Card border="2px solid" borderColor="teal.300" borderRadius="2xl" shadow="sm">
            <CardBody>
              <Flex justify="space-between" align="center">
                <Box>
                  <Heading size="sm">HR Decision</Heading>
                  <Text mt={1} fontSize="xs" color="gray.600">
                    {selected.status === 'pending_manager'
                      ? 'This request is awaiting line review, but HR has full authority to review all details and issue an immediate decision.'
                      : 'Confirm the manager-approved request or provide a clear reason for rejection.'}
                  </Text>
                </Box>
                <Badge colorScheme={selected.status === 'pending_manager' ? 'orange' : 'teal'} p={2} borderRadius="lg">
                  {selected.status === 'pending_manager' ? 'Direct HR Authority' : 'Awaiting HR Review'}
                </Badge>
              </Flex>
              <Textarea
                mt={4}
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                placeholder="Approval note or required rejection reason..."
                minH="100px"
              />
              <Divider my={4} />
              <Flex justify="end" gap={3}>
                <Button
                  leftIcon={<FiX />}
                  colorScheme="red"
                  variant="outline"
                  isDisabled={deciding}
                  onClick={() => decide('rejected')}
                >
                  Reject Request
                </Button>
                <Button
                  leftIcon={<FiCheck />}
                  colorScheme="teal"
                  isLoading={deciding}
                  isDisabled={deciding}
                  onClick={() => decide('approved')}
                >
                  Approve Leave Request
                </Button>
              </Flex>
            </CardBody>
          </Card>
        )}
      </Stack>}
    </DrawerBody></DrawerContent></Drawer>
  </Box>;
}

