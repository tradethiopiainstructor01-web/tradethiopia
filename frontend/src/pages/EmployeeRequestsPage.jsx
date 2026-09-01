import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiClipboard,
  FiClock,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiFilter,
  FiHardDrive,
  FiInfo,
  FiMail,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiShield,
  FiTag,
  FiTrash2,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { normalizeRole, useUserStore } from '../store/user';

const CATEGORIES = [
  {
    key: 'leave',
    label: 'Leave & Absence',
    icon: FiClock,
    children: [
      ['annual_leave', 'Annual Leave'],
      ['sick_leave', 'Sick Leave'],
      ['paternity_leave', 'Paternity Leave'],
      ['maternity_leave', 'Maternity Leave'],
      ['marriage_leave', 'Marriage Leave'],
      ['unpaid_leave', 'Unpaid Leave'],
      ['other_leave', 'Other Leave'],
    ],
  },
  {
    key: 'handover',
    label: 'Handover & Transition',
    icon: FiPackage,
    children: [
      ['material_handover', 'Material Handover (Laptop & Accessories)'],
      ['task_handover', 'Task & Duty Handover'],
    ],
  },
];

const MANAGER_ROLES = new Set([
  'admin', 'coo', 'coo2', 'coo_2', '2coo', 'cootwo', 'ceo', 'supervisor', 'salesmanager',
  'customersuccessmanager', 'socialmediamanager', 'itmanager', 'itadmin',
]);

const STATUS = {
  pending_manager: ['Awaiting Manager', 'orange'],
  manager_rejected: ['Manager Rejected', 'red'],
  pending_hr: ['Awaiting HR', 'blue'],
  hr_approved: ['HR Approved', 'green'],
  hr_rejected: ['HR Rejected', 'red'],
  cancelled: ['Cancelled', 'gray'],
};

const getCategoryChildren = (group) => {
  if (!group) return [];
  if (Array.isArray(group.children)) {
    return group.children.map((item) =>
      Array.isArray(item) ? { key: item[0], label: item[1] } : item
    );
  }
  if (Array.isArray(group.subcategories)) {
    return group.subcategories.map((item) =>
      Array.isArray(item) ? { key: item[0], label: item[1] } : item
    );
  }
  return [];
};

const labelFor = (key) => {
  for (const group of CATEGORIES) {
    const list = getCategoryChildren(group);
    const match = list.find((item) => item.key === key);
    if (match) return match.label;
  }
  return String(key || '').replace(/_/g, ' ');
};

const iconFor = (groupKey) => {
  const group = CATEGORIES.find((g) => g.key === groupKey);
  return group?.icon || FiFileText;
};

const personName = (person) =>
  person?.fullName || person?.username || person?.email || 'Not assigned';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : 'Not recorded';

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : 'Not recorded';

const formatFormKey = (key) =>
  String(key).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const formatFormValue = (value, key = '') => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  const str = String(value ?? '');
  if (key.toLowerCase().includes('date') && str.match(/^\d{4}-\d{2}-\d{2}/)) return formatDate(str);
  if (key === 'leaveDuration') return str === 'half_day' ? 'Half Day' : 'Full Day';
  if (key === 'halfDaySession') return str === 'afternoon' ? 'Afternoon Session' : 'Morning Session';
  return str;
};

const initialForm = () => ({
  leaveDuration: 'full_day',
  startDate: '',
  endDate: '',
  totalDays: '',
  halfDayDate: '',
  reason: '',
  contactDuringLeave: '',
  handoverTo: '',
  incomingEmployeeId: '',
  handoverDate: '',
  witnessEmployeeId: '',
  makeModel: '',
  serialNumber: '',
  assetTag: '',
  physicalCondition: '',
  functionalIssues: '',
  chargerIncluded: false,
  mouseKeyboardIncluded: false,
  otherAccessories: '',
  laptopUsername: '',
  laptopPassword: '',
  negligenceAccepted: false,
  lastWorkingDate: '',
  responsibilities: '',
  pendingTasks: '',
  importantContacts: '',
  filesLocations: '',
  additionalNotes: '',
  outgoingConfirmed: false,
  incomingConfirmed: false,
});

const Field = ({ label, helper, required = false, children }) => (
  <FormControl isRequired={required} w="full">
    <FormLabel fontSize="sm" fontWeight="700" color="gray.700" mb={1.5}>
      {label}
    </FormLabel>
    {children}
    {helper && <FormHelperText fontSize="xs" color="gray.500" mt={1}>{helper}</FormHelperText>}
  </FormControl>
);

const EmployeeRequestsPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentUser = useUserStore((state) => state.currentUser);
  const role = normalizeRole(currentUser?.role || currentUser?.displayRole);
  const isManager = MANAGER_ROLES.has(role);
  const cachedIsHr = role === 'hr' || role === 'admin';

  const [accessContext, setAccessContext] = useState(null);
  const isHr = accessContext ? accessContext.isHr : cachedIsHr;

  const [category, setCategory] = useState('leave');
  const [subcategory, setSubcategory] = useState('annual_leave');
  const [form, setForm] = useState(initialForm);
  const [attachments, setAttachments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [mine, setMine] = useState([]);
  const [managerInbox, setManagerInbox] = useState([]);
  const [hrInbox, setHrInbox] = useState([]);
  const [managerDirectory, setManagerDirectory] = useState({ employees: [], managers: [] });
  const [assigningUserId, setAssigningUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  // Search & filters for requests
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const managerPendingCount = managerInbox.filter((item) => item.status === 'pending_manager').length;
  const hrPendingCount = hrInbox.filter((item) => ['pending_manager', 'pending_hr'].includes(item.status)).length;
  const canReviewAsManager = isManager || managerInbox.length > 0;

  // Build active tabs list
  const tabList = useMemo(() => {
    const list = [
      { id: 'new', label: 'Submit New Request', icon: FiSend },
      { id: 'mine', label: 'My Requests', count: mine.length, icon: FiUser },
    ];
    if (canReviewAsManager) {
      list.push({ id: 'manager', label: 'Manager Approvals', count: managerPendingCount, icon: FiUserCheck });
    }
    if (isHr) {
      list.push({ id: 'hr', label: 'HR Master Review', count: hrPendingCount, icon: FiShield });
      list.push({ id: 'assignments', label: 'Manager Assignments', icon: FiUsers });
    }
    return list;
  }, [mine.length, canReviewAsManager, managerPendingCount, isHr, hrPendingCount]);

  // Sync tabIndex with URL query param `tab`
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const foundIndex = tabList.findIndex((t) => t.id === tabParam || t.id === tabParam.toLowerCase());
      if (foundIndex !== -1 && foundIndex !== tabIndex) {
        setTabIndex(foundIndex);
      }
    }
  }, [searchParams, tabList, tabIndex]);

  const handleTabChange = (index) => {
    setTabIndex(index);
    const target = tabList[index];
    if (target) {
      const currentParams = Object.fromEntries(searchParams.entries());
      setSearchParams({ ...currentParams, tab: target.id });
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ctxRes, empRes, mineRes] = await Promise.all([
        axiosInstance.get('/employee-requests/access-context'),
        axiosInstance.get('/users'),
        axiosInstance.get('/employee-requests/mine'),
      ]);

      const accessData = ctxRes.data.data;
      setAccessContext(accessData);

      const rawUsers = Array.isArray(empRes.data)
        ? empRes.data
        : empRes.data?.data || empRes.data?.users || [];
      setEmployees(rawUsers);

      const mineItems = mineRes.data.data || [];
      setMine(mineItems);

      let mgrItems = [];
      let hrItems = [];

      if (accessData.canReviewAsManager || accessData.hasManagerQueue) {
        try {
          const mgrRes = await axiosInstance.get('/employee-requests/manager-inbox');
          mgrItems = mgrRes.data.data || [];
          setManagerInbox(mgrItems);
        } catch {
          setManagerInbox([]);
        }
      }

      if (accessData.isHr) {
        try {
          const [hrInboxRes, dirRes] = await Promise.all([
            axiosInstance.get('/employee-requests/hr-inbox'),
            axiosInstance.get('/employee-requests/manager-directory'),
          ]);
          hrItems = hrInboxRes.data.data || [];
          setHrInbox(hrItems);
          setManagerDirectory(dirRes.data.data || { employees: [], managers: [] });
        } catch {
          setHrInbox([]);
        }
      }

      // Check URL for direct requestId open (e.g. from notifications)
      const reqId = searchParams.get('requestId');
      if (reqId) {
        const pool = [...mineItems, ...mgrItems, ...hrItems];
        const match = pool.find((item) => String(item._id) === String(reqId) || item.requestNumber === reqId);
        if (match) {
          setSelected(match);
        } else {
          try {
            const single = await axiosInstance.get(`/employee-requests/${reqId}`);
            if (single.data?.data) {
              setSelected(single.data.data);
            }
          } catch {
            // Quietly ignore if not found
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Unable to load employee requests',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [searchParams, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const selectSubcategory = (groupKey, subKey) => {
    setCategory(groupKey);
    setSubcategory(subKey);
    setForm(initialForm());
    setAttachments([]);
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDate = (key, value) => {
    const updated = { ...form, [key]: value };
    if (updated.startDate && updated.endDate) {
      const start = new Date(updated.startDate);
      const end = new Date(updated.endDate);
      if (end >= start) {
        const diffMs = end - start;
        const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
        updated.totalDays = days > 0 ? String(days) : '1';
      } else {
        updated.totalDays = '';
      }
    } else {
      updated.totalDays = '';
    }
    setForm(updated);
  };

  const validate = () => {
    const issues = [];
    if (category === 'leave') {
      if (subcategory === 'annual_leave' && form.leaveDuration === 'half_day') {
        if (!form.halfDayDate) issues.push('half-day leave date');
      } else {
        if (!form.startDate) issues.push('leave start date');
        if (!form.endDate) issues.push('leave end date');
      }
      if (!form.reason.trim()) issues.push('reason for leave');
      if (!form.contactDuringLeave.trim()) issues.push('contact information during leave');
      if (!form.handoverTo) issues.push('work handover employee');
      return issues;
    }
    if (subcategory === 'material_handover') {
      if (!form.incomingEmployeeId) issues.push('incoming employee');
      if (!form.handoverDate) issues.push('handover date');
      if (!form.makeModel.trim()) issues.push('laptop make and model');
      if (!form.serialNumber.trim()) issues.push('serial number');
      if (!form.assetTag.trim()) issues.push('asset tag');
      if (!form.physicalCondition.trim()) issues.push('physical condition');
      if (!form.functionalIssues.trim()) issues.push('functional issues');
      if (!form.laptopUsername.trim()) issues.push('laptop username');
      if (!form.negligenceAccepted) issues.push('negligence acknowledgement');
      if (!form.outgoingConfirmed) issues.push('outgoing employee confirmation');
      if (!form.incomingConfirmed) issues.push('incoming employee confirmation');
      return issues;
    }
    // Task handover
    if (!form.incomingEmployeeId) issues.push('incoming employee');
    if (!form.handoverDate) issues.push('handover date');
    if (!form.lastWorkingDate) issues.push('last working date');
    if (!form.responsibilities.trim()) issues.push('current responsibilities');
    if (!form.pendingTasks.trim()) issues.push('pending tasks');
    if (!form.importantContacts.trim()) issues.push('important contacts');
    if (!form.outgoingConfirmed) issues.push('outgoing employee confirmation');
    if (!form.incomingConfirmed) issues.push('incoming employee confirmation');
    return issues;
  };

  const handleFileAttachment = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = [];
    for (const file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: `File "${file.name}" exceeds 10 MB`,
          description: 'Please select files smaller than 10 MB.',
          status: 'warning',
        });
        continue;
      }
      validFiles.push(file);
    }
    setAttachments((prev) => [...prev, ...validFiles].slice(0, 5));
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    const validationIssues = validate();
    if (validationIssues.length) {
      toast({
        title: 'Complete the required request information',
        description: `Please provide: ${validationIssues.join(', ')}. Attachments are optional.`,
        status: 'warning',
        duration: 7000,
        isClosable: true,
      });
      return;
    }
    if (
      category === 'leave' &&
      form.leaveDuration !== 'half_day' &&
      form.endDate &&
      form.startDate &&
      new Date(form.endDate) < new Date(form.startDate)
    ) {
      toast({ title: 'End date cannot be before start date', status: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('category', category);
      payload.append('subcategory', subcategory);
      payload.append('formData', JSON.stringify(form));
      for (const file of attachments) {
        payload.append('attachments', file);
      }

      const response = await axiosInstance.post('/employee-requests', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: 'Request submitted successfully',
        description: `Reference: ${response.data.data?.requestNumber}. Routed to line manager for review.`,
        status: 'success',
      });
      setForm(initialForm());
      setAttachments([]);
      await load();
      setTabIndex(1);
    } catch (error) {
      toast({
        title: 'Unable to submit request',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const decide = async (actorType, decision) => {
    if (!selected?._id) return;
    if (decision === 'rejected' && !decisionNote.trim()) {
      toast({ title: 'Provide a clear rejection reason', status: 'warning' });
      return;
    }
    setDeciding(true);
    try {
      const endpoint =
        actorType === 'hr' || isHr
          ? `/employee-requests/${selected._id}/hr-decision`
          : `/employee-requests/${selected._id}/manager-decision`;

      await axiosInstance.patch(endpoint, {
        decision,
        note: decisionNote.trim(),
      });

      toast({
        title: decision === 'approved' ? 'Request approved' : 'Request rejected',
        status: 'success',
      });
      setSelected(null);
      setDecisionNote('');
      await load();
    } catch (error) {
      toast({
        title: 'Decision could not be saved',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
      if (error.response?.status === 409) {
        setSelected(null);
        setDecisionNote('');
        await load();
      }
    } finally {
      setDeciding(false);
    }
  };

  const cancel = async (item) => {
    try {
      await axiosInstance.patch(`/employee-requests/${item._id}/cancel`, {});
      toast({ title: 'Request cancelled', status: 'success' });
      await load();
    } catch (error) {
      toast({
        title: 'Unable to cancel request',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    }
  };

  const assignManager = async (userId, managerId) => {
    if (!managerId) return;
    setAssigningUserId(userId);
    try {
      await axiosInstance.patch(`/employee-requests/assign-manager/${userId}`, { managerId });
      toast({ title: 'Manager assignment updated', status: 'success' });
      await load();
    } catch (error) {
      toast({
        title: 'Manager could not be assigned',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    } finally {
      setAssigningUserId('');
    }
  };

  const reassignRequest = async (managerId) => {
    if (!selected?._id || !managerId) return;
    setReassigning(true);
    try {
      const response = await axiosInstance.patch(
        `/employee-requests/${selected._id}/reassign-manager`,
        { managerId }
      );
      setSelected((previous) => ({ ...previous, ...response.data.data, actor: 'hr' }));
      toast({
        title: 'Request reassigned',
        description: 'The new manager has been notified.',
        status: 'success',
      });
      await load();
    } catch (error) {
      toast({
        title: 'Request could not be reassigned',
        description: error.response?.data?.message || error.message,
        status: 'error',
      });
    } finally {
      setReassigning(false);
    }
  };

  const renderLeaveForm = () => (
    <Stack spacing={6}>
      <Box p={5} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200">
        <HStack mb={3} spacing={2}>
          <Icon as={FiCalendar} color="teal.600" />
          <Heading size="sm">Leave Duration & Schedule</Heading>
        </HStack>
        {subcategory === 'annual_leave' && (
          <Box mb={5} p={4} bg="white" border="1px solid" borderColor="teal.200" borderRadius="xl">
            <Field
              label="Annual Leave Duration Format"
              required
              helper="Choose half-day when the absence covers only one working session (morning or afternoon)."
            >
              <HStack spacing={3} mt={2}>
                <Button
                  flex="1"
                  size="md"
                  variant={form.leaveDuration === 'full_day' ? 'solid' : 'outline'}
                  colorScheme="teal"
                  borderRadius="xl"
                  onClick={() => update('leaveDuration', 'full_day')}
                >
                  Full-day Leave
                </Button>
                <Button
                  flex="1"
                  size="md"
                  variant={form.leaveDuration === 'half_day' ? 'solid' : 'outline'}
                  colorScheme="teal"
                  borderRadius="xl"
                  onClick={() => update('leaveDuration', 'half_day')}
                >
                  Half-day Leave
                </Button>
              </HStack>
            </Field>
          </Box>
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          {subcategory === 'annual_leave' && form.leaveDuration === 'half_day' ? (
            <>
              <Field label="Half-day Leave Date" required>
                <Input
                  type="date"
                  borderRadius="xl"
                  bg="white"
                  value={form.halfDayDate}
                  onChange={(event) => update('halfDayDate', event.target.value)}
                />
              </Field>
              <Box
                gridColumn={{ md: '1 / -1' }}
                p={4}
                bg="teal.50"
                border="1px solid"
                borderColor="teal.200"
                borderRadius="xl"
              >
                <HStack>
                  <Icon as={FiClock} color="teal.700" />
                  <Text fontSize="xs" fontWeight="800" color="teal.800" textTransform="uppercase">
                    Automatic Session Timing
                  </Text>
                </HStack>
                <Text mt={1} fontSize="xs" color="teal.900">
                  Submissions before 12:30 PM are automatically recorded as <strong>Morning</strong>.
                  Submissions at or after 12:30 PM are recorded as <strong>Afternoon</strong>.
                </Text>
              </Box>
            </>
          ) : (
            <>
              <Field label="Leave Start Date" required>
                <Input
                  type="date"
                  borderRadius="xl"
                  bg="white"
                  value={form.startDate}
                  onChange={(event) => handleDate('startDate', event.target.value)}
                />
              </Field>
              <Field label="Leave End Date" required>
                <Input
                  type="date"
                  borderRadius="xl"
                  bg="white"
                  min={form.startDate}
                  value={form.endDate}
                  onChange={(event) => handleDate('endDate', event.target.value)}
                />
              </Field>
              <Field label="Total Calendar Days">
                <Input value={form.totalDays ? `${form.totalDays} Days` : ''} isReadOnly bg="gray.100" borderRadius="xl" />
              </Field>
            </>
          )}
          <Field label="Contact Phone / Email During Leave" required>
            <Input
              borderRadius="xl"
              bg="white"
              value={form.contactDuringLeave}
              onChange={(event) => update('contactDuringLeave', event.target.value)}
              placeholder="e.g. +251 91 234 5678 or alternate email"
            />
          </Field>
        </SimpleGrid>
      </Box>

      {/* Coverage and Reasons Card */}
      <Box p={5} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200">
        <HStack mb={4} spacing={2}>
          <Icon as={FiUserCheck} color="teal.600" />
          <Heading size="sm">Work Coverage & Justification</Heading>
        </HStack>
        <SimpleGrid columns={{ base: 1 }} spacing={5}>
          <Field
            label="Work Handover Colleague"
            required
            helper="Select the colleague who has agreed to cover urgent tasks during your absence."
          >
            <Select
              borderRadius="xl"
              bg="white"
              value={form.handoverTo}
              onChange={(event) => update('handoverTo', event.target.value)}
              placeholder="Select employee from database"
            >
              {employees
                .filter((employee) => employee._id !== currentUser?._id)
                .map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {personName(employee)} — {employee.jobTitle || employee.role} ({employee.department || 'General'})
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Reason & Notes for Leave" required>
            <Textarea
              borderRadius="xl"
              bg="white"
              minH="110px"
              value={form.reason}
              onChange={(event) => update('reason', event.target.value)}
              placeholder={`Provide a clear reason for the ${labelFor(subcategory).toLowerCase()} request...`}
            />
          </Field>
        </SimpleGrid>
      </Box>
    </Stack>
  );

  const renderMaterialForm = () => (
    <Stack spacing={6}>
      <Box p={5} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200">
        <HStack mb={4} spacing={2}>
          <Icon as={FiUser} color="teal.600" />
          <Heading size="sm">Employee & Witness Details</Heading>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <Field label="Outgoing Employee">
            <Input value={personName(currentUser)} isReadOnly bg="gray.100" borderRadius="xl" />
          </Field>
          <Field label="Incoming Employee" required>
            <Select
              borderRadius="xl"
              bg="white"
              value={form.incomingEmployeeId}
              onChange={(event) => update('incomingEmployeeId', event.target.value)}
              placeholder="Select employee from database"
            >
              {employees
                .filter((employee) => employee._id !== currentUser?._id)
                .map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {personName(employee)} — {employee.jobTitle || employee.role}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Date of Handover" required>
            <Input
              type="date"
              borderRadius="xl"
              bg="white"
              value={form.handoverDate}
              onChange={(event) => update('handoverDate', event.target.value)}
            />
          </Field>
          <Field label="Witness / IT Representative">
            <Select
              borderRadius="xl"
              bg="white"
              value={form.witnessEmployeeId}
              onChange={(event) => update('witnessEmployeeId', event.target.value)}
              placeholder="Select witness or IT representative"
            >
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {personName(employee)} — {employee.jobTitle || employee.role}
                </option>
              ))}
            </Select>
          </Field>
        </SimpleGrid>
      </Box>

      <Box p={5} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200">
        <HStack mb={4} spacing={2}>
          <Icon as={FiHardDrive} color="teal.600" />
          <Heading size="sm">Hardware Specification</Heading>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
          <Field label="Make & Model" required>
            <Input
              borderRadius="xl"
              bg="white"
              value={form.makeModel}
              onChange={(event) => update('makeModel', event.target.value)}
              placeholder="e.g. Lenovo ThinkPad / Dell Latitude"
            />
          </Field>
          <Field label="Serial Number" required>
            <Input
              borderRadius="xl"
              bg="white"
              value={form.serialNumber}
              onChange={(event) => update('serialNumber', event.target.value)}
              placeholder="Hardware serial number"
            />
          </Field>
          <Field label="Asset Tag / ID" required>
            <Input
              borderRadius="xl"
              bg="white"
              value={form.assetTag}
              onChange={(event) => update('assetTag', event.target.value)}
              placeholder="Internal asset tag"
            />
          </Field>
          <Box gridColumn={{ md: '1 / -1' }}>
            <Field
              label="Physical Condition"
              required
              helper="Record any scratches, dents, screen blemishes, or visible marks."
            >
              <Textarea
                borderRadius="xl"
                bg="white"
                value={form.physicalCondition}
                onChange={(event) => update('physicalCondition', event.target.value)}
                placeholder="Describe exterior condition in detail"
              />
            </Field>
          </Box>
          <Box gridColumn={{ md: '1 / -1' }}>
            <Field
              label="Functional Status & Battery"
              required
              helper="Record battery health, keyboard keys, ports, charging, or software state."
            >
              <Textarea
                borderRadius="xl"
                bg="white"
                value={form.functionalIssues}
                onChange={(event) => update('functionalIssues', event.target.value)}
                placeholder="Describe functional status or state 'Fully operational'"
              />
            </Field>
          </Box>
        </SimpleGrid>
      </Box>

      <Box p={5} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200">
        <Heading size="sm" mb={3}>
          Accessories Included
        </Heading>
        <HStack spacing={6} flexWrap="wrap" mb={4}>
          <Checkbox
            isChecked={form.chargerIncluded}
            onChange={(event) => update('chargerIncluded', event.target.checked)}
          >
            Original Charger / Power Adapter
          </Checkbox>
          <Checkbox
            isChecked={form.mouseKeyboardIncluded}
            onChange={(event) => update('mouseKeyboardIncluded', event.target.checked)}
          >
            External Mouse / Keyboard
          </Checkbox>
        </HStack>
        <Input
          borderRadius="xl"
          bg="white"
          value={form.otherAccessories}
          onChange={(event) => update('otherAccessories', event.target.value)}
          placeholder="Other accessories (laptop bag, HDMI cable, adapter, etc.)"
        />
      </Box>

      <Box p={5} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200">
        <HStack mb={1} spacing={2}>
          <Icon as={FiShield} color="teal.600" />
          <Heading size="sm">Credentials & Signatures</Heading>
        </HStack>
        <Text mb={4} fontSize="xs" color="gray.500">
          Account credentials entered here are transferred securely to the incoming employee and never exposed publicly.
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <Field label="Laptop Login Username" required>
            <Input
              borderRadius="xl"
              bg="white"
              value={form.laptopUsername}
              onChange={(event) => update('laptopUsername', event.target.value)}
              placeholder="Local account username"
            />
          </Field>
          <Field label="Laptop Login Password">
            <Input
              borderRadius="xl"
              bg="white"
              type="password"
              autoComplete="new-password"
              value={form.laptopPassword}
              onChange={(event) => update('laptopPassword', event.target.value)}
              placeholder="Enter only when required for handover"
            />
          </Field>
        </SimpleGrid>
        <Divider my={4} />
        <Box bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="xl" p={4} mb={4}>
          <Text fontWeight="700" fontSize="xs" color="orange.900" textTransform="uppercase">
            Equipment Responsibility Acknowledgement
          </Text>
          <Text mt={1} fontSize="xs" color="orange.800">
            Employees are accountable for safeguarding company equipment. Negligence or intentional damage may result in repair/replacement deductions.
          </Text>
          <Checkbox
            mt={3}
            isChecked={form.negligenceAccepted}
            onChange={(event) => update('negligenceAccepted', event.target.checked)}
          >
            <Text fontSize="xs" fontWeight="700">I acknowledge and accept company asset responsibilities.</Text>
          </Checkbox>
        </Box>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Checkbox
            isChecked={form.outgoingConfirmed}
            onChange={(event) => update('outgoingConfirmed', event.target.checked)}
          >
            Outgoing employee handover confirmation
          </Checkbox>
          <Checkbox
            isChecked={form.incomingConfirmed}
            onChange={(event) => update('incomingConfirmed', event.target.checked)}
          >
            Incoming employee acceptance confirmed
          </Checkbox>
        </SimpleGrid>
      </Box>
    </Stack>
  );

  const renderTaskForm = () => (
    <Stack spacing={6}>
      <Box p={5} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200">
        <HStack mb={4} spacing={2}>
          <Icon as={FiUser} color="teal.600" />
          <Heading size="sm">Task Transition Partners</Heading>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <Field label="Outgoing Employee">
            <Input value={personName(currentUser)} isReadOnly bg="gray.100" borderRadius="xl" />
          </Field>
          <Field label="Incoming / Taking Over Employee" required>
            <Select
              borderRadius="xl"
              bg="white"
              value={form.incomingEmployeeId}
              onChange={(event) => update('incomingEmployeeId', event.target.value)}
              placeholder="Select employee from database"
            >
              {employees
                .filter((employee) => employee._id !== currentUser?._id)
                .map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {personName(employee)} — {employee.jobTitle || employee.role}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Handover Date" required>
            <Input
              type="date"
              borderRadius="xl"
              bg="white"
              value={form.handoverDate}
              onChange={(event) => update('handoverDate', event.target.value)}
            />
          </Field>
          <Field label="Last Working Date" required>
            <Input
              type="date"
              borderRadius="xl"
              bg="white"
              value={form.lastWorkingDate}
              onChange={(event) => update('lastWorkingDate', event.target.value)}
            />
          </Field>
        </SimpleGrid>
      </Box>

      <Box p={5} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200">
        <HStack mb={4} spacing={2}>
          <Icon as={FiClipboard} color="teal.600" />
          <Heading size="sm">Responsibilities & Deliverables</Heading>
        </HStack>
        <SimpleGrid columns={{ base: 1 }} spacing={5}>
          {[
            ['responsibilities', 'Current Key Responsibilities', 'List regular duties, processes, and accounts owned'],
            ['pendingTasks', 'Pending Tasks & Open Deliverables', 'List in-progress tasks, deadlines, and next action steps'],
            ['importantContacts', 'Important Key Contacts', 'List key stakeholders, clients, vendors, or partner leads'],
            ['filesLocations', 'Shared Folders & File Paths', 'Links to cloud drives, folders, sheets, and repositories'],
            ['additionalNotes', 'Special Instructions / Transition Notes', 'Important tips, common blockers, and handover recommendations'],
          ].map(([fieldKey, label, placeholder]) => (
            <Field
              key={fieldKey}
              label={label}
              required={['responsibilities', 'pendingTasks', 'importantContacts'].includes(fieldKey)}
            >
              <Textarea
                borderRadius="xl"
                bg="white"
                minH="95px"
                value={form[fieldKey]}
                onChange={(event) => update(fieldKey, event.target.value)}
                placeholder={placeholder}
              />
            </Field>
          ))}
        </SimpleGrid>
      </Box>

      <Box p={5} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200">
        <Heading size="sm" mb={3}>
          Handover Sign-off Confirmations
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Checkbox
            isChecked={form.outgoingConfirmed}
            onChange={(event) => update('outgoingConfirmed', event.target.checked)}
          >
            Outgoing employee confirms accurate handover details.
          </Checkbox>
          <Checkbox
            isChecked={form.incomingConfirmed}
            onChange={(event) => update('incomingConfirmed', event.target.checked)}
          >
            Incoming employee confirms understanding and acceptance.
          </Checkbox>
        </SimpleGrid>
      </Box>
    </Stack>
  );

  const filterRequests = (items) => {
    return items.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const searchable = [
        item.requestNumber,
        item.title,
        item.department,
        personName(item.requester),
        personName(item.manager),
        item.requester?.email,
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !q || searchable.includes(q);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  };

  const RequestCards = ({ items, empty, actor }) => {
    const filteredItems = filterRequests(items);

    const counts = useMemo(() => ({
      total: items.length,
      pending: items.filter((i) => ['pending_manager', 'pending_hr'].includes(i.status)).length,
      approved: items.filter((i) => i.status === 'hr_approved').length,
      rejected: items.filter((i) => ['manager_rejected', 'hr_rejected'].includes(i.status)).length,
    }), [items]);

    return (
      <Stack spacing={5}>
        {/* Quick Filter & Search Bar */}
        <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs">
          <CardBody p={4}>
            <Flex gap={3} flexWrap="wrap" align="center" justify="space-between">
              <HStack flex="1" minW={{ base: '100%', md: '300px' }}>
                <Box position="relative" w="full">
                  <Box position="absolute" left={3.5} top={3} color="gray.400" pointerEvents="none">
                    <FiSearch />
                  </Box>
                  <Input
                    pl={10}
                    placeholder="Search requests by ID, employee, title, department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    borderRadius="xl"
                    bg="gray.50"
                  />
                </Box>
              </HStack>
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  size="sm"
                  borderRadius="lg"
                  variant={statusFilter === 'all' ? 'solid' : 'ghost'}
                  colorScheme={statusFilter === 'all' ? 'teal' : 'gray'}
                  onClick={() => setStatusFilter('all')}
                >
                  All ({counts.total})
                </Button>
                <Button
                  size="sm"
                  borderRadius="lg"
                  variant={statusFilter === 'pending_manager' || statusFilter === 'pending_hr' ? 'solid' : 'ghost'}
                  colorScheme="orange"
                  onClick={() => setStatusFilter(actor === 'manager' ? 'pending_manager' : 'pending_hr')}
                >
                  Pending ({counts.pending})
                </Button>
                <Button
                  size="sm"
                  borderRadius="lg"
                  variant={statusFilter === 'hr_approved' ? 'solid' : 'ghost'}
                  colorScheme="green"
                  onClick={() => setStatusFilter('hr_approved')}
                >
                  Approved ({counts.approved})
                </Button>
                <Button
                  size="sm"
                  borderRadius="lg"
                  variant={statusFilter === 'hr_rejected' || statusFilter === 'manager_rejected' ? 'solid' : 'ghost'}
                  colorScheme="red"
                  onClick={() => setStatusFilter('hr_rejected')}
                >
                  Rejected ({counts.rejected})
                </Button>
                {(searchQuery || statusFilter !== 'all') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="gray"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                  >
                    Reset
                  </Button>
                )}
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Requests List */}
        {!filteredItems.length ? (
          <Box p={12} textAlign="center" border="1px dashed" borderColor="gray.300" borderRadius="2xl" bg="white">
            <Icon as={FiClipboard} boxSize={10} color="gray.400" />
            <Heading mt={3} size="sm">
              {items.length === 0 ? empty : 'No requests match your current search and filters.'}
            </Heading>
            <Text mt={1} fontSize="xs" color="gray.500">
              Try adjusting your search terms or filter selections.
            </Text>
          </Box>
        ) : (
          filteredItems.map((item) => {
            const [statusLabel, statusColor] = STATUS[item.status] || [item.status, 'gray'];
            const isActionable =
              (actor === 'manager' && item.status === 'pending_manager') ||
              (actor === 'hr' && ['pending_manager', 'pending_hr'].includes(item.status)) ||
              (isHr && ['pending_manager', 'pending_hr'].includes(item.status));

            const formDetails = item.formData || {};
            const leavePeriod =
              item.category === 'leave'
                ? formDetails.leaveDuration === 'half_day'
                  ? `${formatDate(formDetails.halfDayDate)} (Half Day)`
                  : `${formatDate(formDetails.startDate)} → ${formatDate(formDetails.endDate)} (${formDetails.totalDays || 1}d)`
                : null;

            return (
              <Box
                key={item._id}
                p={5}
                bg="white"
                border="1px solid"
                borderColor={isActionable ? 'teal.300' : 'gray.200'}
                borderLeft="5px solid"
                borderLeftColor={
                  item.status === 'hr_approved'
                    ? 'green.500'
                    : item.status.includes('rejected')
                    ? 'red.500'
                    : item.status === 'pending_hr'
                    ? 'blue.500'
                    : 'orange.400'
                }
                borderRadius="2xl"
                shadow="xs"
                _hover={{ borderColor: 'teal.400', shadow: 'md', transform: 'translateY(-1px)' }}
                transition="all 0.2s ease"
              >
                <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4}>
                  <Box minW={0} flex="1">
                    <HStack mb={2} spacing={2} flexWrap="wrap">
                      <Badge colorScheme="teal" borderRadius="md" px={2.5} py={0.5} fontWeight="800">
                        {item.requestNumber}
                      </Badge>
                      <Badge colorScheme={statusColor} borderRadius="md" px={2.5} py={0.5} fontWeight="700">
                        {statusLabel}
                      </Badge>
                      <Badge variant="subtle" colorScheme="gray" textTransform="capitalize">
                        {labelFor(item.subcategory)}
                      </Badge>
                      {item.department && (
                        <Badge variant="outline" colorScheme="teal">
                          {item.department}
                        </Badge>
                      )}
                    </HStack>

                    <Heading size="sm" color="gray.800">
                      {item.title}
                    </Heading>

                    <HStack mt={2.5} spacing={4} flexWrap="wrap" fontSize="xs" color="gray.600">
                      <HStack spacing={1.5}>
                        <Avatar size="2xs" name={personName(item.requester)} />
                        <Text>
                          Requester: <strong>{personName(item.requester)}</strong>
                        </Text>
                      </HStack>
                      <HStack spacing={1.5}>
                        <Icon as={FiUserCheck} color="teal.500" />
                        <Text>
                          Manager: <strong>{personName(item.manager)}</strong>
                        </Text>
                      </HStack>
                      {leavePeriod && (
                        <HStack spacing={1.5}>
                          <Icon as={FiCalendar} color="blue.500" />
                          <Text>
                            Period: <strong>{leavePeriod}</strong>
                          </Text>
                        </HStack>
                      )}
                      <HStack spacing={1.5}>
                        <Icon as={FiClock} color="gray.400" />
                        <Text>Submitted: {formatDate(item.createdAt)}</Text>
                      </HStack>
                    </HStack>
                  </Box>

                  <HStack spacing={3} alignSelf={{ base: 'flex-end', md: 'center' }}>
                    {actor === 'mine' && item.status === 'pending_manager' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => cancel(item)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={isActionable ? 'solid' : 'outline'}
                      colorScheme="teal"
                      rightIcon={<FiChevronRight />}
                      onClick={() => {
                        setSelected({ ...item, actor });
                        setDecisionNote('');
                      }}
                    >
                      {isActionable ? 'Review & Decide' : 'View Details'}
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            );
          })
        )}
      </Stack>
    );
  };

  const selectedCategory = CATEGORIES.find((g) => g.key === category);

  return (
    <Box maxW="1600px" mx="auto" px={{ base: 4, md: 7 }} py={{ base: 5, md: 8 }}>
      {/* Header Banner */}
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', lg: 'center' }}
        direction={{ base: 'column', lg: 'row' }}
        gap={4}
        mb={7}
      >
        <Box>
          <HStack spacing={2}>
            <Icon as={FiClipboard} color="teal.600" />
            <Text fontSize="xs" fontWeight="800" color="teal.600" letterSpacing="widest">
              EMPLOYEE • LINE MANAGER • HR DECISION CENTER
            </Text>
          </HStack>
          <Heading mt={1} size="xl">
            Employee Request Center
          </Heading>
          <Text mt={2} color="gray.600" maxW="850px">
            Submit leave and equipment handover requests with automated departmental routing. Track transparent progress from Line Manager review through HR authorization.
          </Text>
          {accessContext && (
            <HStack mt={3} spacing={2} flexWrap="wrap">
              <Badge colorScheme={accessContext.isHr ? 'teal' : 'blue'} px={2.5} py={0.5} borderRadius="md">
                {accessContext.isHr ? 'HR Administration Workspace' : `${accessContext.displayRole || accessContext.role} Workspace`}
              </Badge>
              <Badge variant="outline" colorScheme="gray" px={2.5} py={0.5} borderRadius="md">
                {personName(currentUser)} • {accessContext.department}
              </Badge>
              {accessContext.assignedRequestCount > 0 && (
                <Badge colorScheme="orange" px={2.5} py={0.5} borderRadius="md">
                  {accessContext.assignedRequestCount} Line Review Pending
                </Badge>
              )}
            </HStack>
          )}
        </Box>
        <HStack spacing={3} flexWrap="wrap">
          {isHr && (
            <Button
              as={RouterLink}
              to="/leave-management"
              variant="outline"
              colorScheme="teal"
              leftIcon={<FiClock />}
            >
              HR Leave Register
            </Button>
          )}
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            colorScheme="teal"
            onClick={load}
            isLoading={loading}
          >
            Refresh Records
          </Button>
        </HStack>
      </Flex>

      {/* Tabs */}
      <Tabs index={tabIndex} onChange={handleTabChange} variant="soft-rounded" colorScheme="teal" isLazy>
        <TabList overflowX="auto" gap={2} pb={2} borderBottom="1px solid" borderColor="gray.200">
          {tabList.map((tabItem) => (
            <Tab key={tabItem.id} flexShrink={0} fontWeight="700" fontSize="sm" py={2.5} px={4}>
              <HStack spacing={2}>
                <Icon as={tabItem.icon} />
                <Text>{tabItem.label}</Text>
                {tabItem.count !== undefined && tabItem.count > 0 && (
                  <Badge colorScheme="orange" borderRadius="full" px={2}>
                    {tabItem.count}
                  </Badge>
                )}
              </HStack>
            </Tab>
          ))}
        </TabList>

        <TabPanels mt={6}>
          {/* Panel 0: New request */}
          <TabPanel p={0}>
            <Grid
              templateColumns={{ base: 'minmax(0, 1fr)', lg: '320px minmax(0, 1fr)' }}
              gap={{ base: 6, lg: 8 }}
              alignItems="start"
            >
              {/* Category selector sidebar */}
              <GridItem
                minW={0}
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="2xl"
                p={5}
                position={{ lg: 'sticky' }}
                top={{ lg: '104px' }}
                shadow="sm"
                zIndex={1}
              >
                <Heading size="sm" color="gray.800">
                  Select Request Form
                </Heading>
                <Text mt={1} mb={5} fontSize="xs" color="gray.500">
                  Choose the category that matches your submission requirement.
                </Text>

                <Stack spacing={4}>
                  {CATEGORIES.map((group) => {
                    const children = getCategoryChildren(group);
                    const isGroupActive = category === group.key;
                    return (
                      <Box
                        key={group.key}
                        p={3}
                        borderRadius="xl"
                        bg={isGroupActive ? 'teal.50' : 'gray.50'}
                        border="1px solid"
                        borderColor={isGroupActive ? 'teal.200' : 'gray.200'}
                        transition="all 0.2s ease"
                      >
                        <HStack mb={2.5} justify="space-between">
                          <HStack spacing={2.5}>
                            <Flex
                              w="28px"
                              h="28px"
                              align="center"
                              justify="center"
                              borderRadius="lg"
                              bg="white"
                              color="teal.600"
                              shadow="xs"
                            >
                              <Icon as={iconFor(group.key)} />
                            </Flex>
                            <Text fontWeight="800" fontSize="xs" color="gray.800">
                              {group.label}
                            </Text>
                          </HStack>
                          <Badge fontSize="2xs" colorScheme="gray">
                            {children.length}
                          </Badge>
                        </HStack>

                        <Stack spacing={1.5}>
                          {children.map((child) => {
                            const isSelected = subcategory === child.key;
                            return (
                              <Button
                                key={child.key}
                                justifyContent="space-between"
                                variant={isSelected ? 'solid' : 'ghost'}
                                colorScheme="teal"
                                size="sm"
                                w="full"
                                h="auto"
                                minH="38px"
                                py={2.5}
                                px={3}
                                whiteSpace="normal"
                                wordBreak="break-word"
                                textAlign="left"
                                lineHeight="1.35"
                                borderRadius="xl"
                                onClick={() => selectSubcategory(group.key, child.key)}
                              >
                                <Text fontSize="xs" fontWeight={isSelected ? '800' : '600'}>
                                  {child.label}
                                </Text>
                                {isSelected && <Icon as={FiChevronRight} boxSize={3.5} />}
                              </Button>
                            );
                          })}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </GridItem>

              {/* Form Content */}
              <GridItem
                minW={0}
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="2xl"
                p={{ base: 5, md: 8 }}
                shadow="sm"
              >
                {/* Routing Banner */}
                {accessContext?.submissionManager ? (
                  <Flex
                    mb={6}
                    p={4.5}
                    gap={4}
                    align={{ base: 'flex-start', sm: 'center' }}
                    direction={{ base: 'column', sm: 'row' }}
                    justify="space-between"
                    bg="linear-gradient(135deg, #e6fffa 0%, #f0fdf4 100%)"
                    border="1px solid"
                    borderColor="teal.200"
                    borderRadius="2xl"
                  >
                    <HStack spacing={3.5}>
                      <Avatar
                        size="md"
                        name={personName(accessContext.submissionManager)}
                        bg="teal.600"
                        color="white"
                      />
                      <Box>
                        <Text fontSize="2xs" fontWeight="800" color="teal.700" textTransform="uppercase" letterSpacing="wide">
                          STAGE 1 REVIEWER • ASSIGNED LINE MANAGER
                        </Text>
                        <Heading mt={0.5} size="sm" color="teal.950">
                          {personName(accessContext.submissionManager)}
                        </Heading>
                        <Text fontSize="xs" color="gray.600">
                          {accessContext.submissionManager.jobTitle || accessContext.submissionManager.role}
                          {accessContext.submissionManager.email ? ` • ${accessContext.submissionManager.email}` : ''}
                        </Text>
                      </Box>
                    </HStack>
                    <Box textAlign={{ base: 'left', sm: 'right' }}>
                      <Badge colorScheme="teal" borderRadius="md" px={2.5} py={0.5}>
                        Line Approval Route
                      </Badge>
                      <Text mt={1} fontSize="2xs" color="gray.500" textTransform="capitalize">
                        Auto-assigned via {accessContext.submissionManager.assignmentSource}
                      </Text>
                    </Box>
                  </Flex>
                ) : accessContext ? (
                  <Alert status="error" borderRadius="xl" mb={6}>
                    <AlertIcon />
                    No active manager is assigned to your profile. Contact HR before submitting this request.
                  </Alert>
                ) : null}

                {/* Form Title & Stepper Badge */}
                <Flex justify="space-between" align="center" mb={6} gap={3} wrap="wrap">
                  <Box>
                    <Badge colorScheme="teal" px={2.5} py={0.5} borderRadius="md">
                      {selectedCategory?.label}
                    </Badge>
                    <Heading mt={1.5} size="lg" color="gray.800">
                      {labelFor(subcategory)}
                    </Heading>
                  </Box>
                  <HStack spacing={2} bg="gray.50" px={3} py={1.5} borderRadius="xl" border="1px solid" borderColor="gray.200">
                    <Icon as={FiArrowRight} color="teal.600" />
                    <Text fontSize="xs" fontWeight="700" color="gray.600">
                      1. Submitter → 2. Line Manager → 3. HR Final Sign-off
                    </Text>
                  </HStack>
                </Flex>

                {category === 'leave'
                  ? renderLeaveForm()
                  : subcategory === 'material_handover'
                  ? renderMaterialForm()
                  : renderTaskForm()}

                <Divider my={7} />

                {/* Supporting Attachments Section */}
                <Box>
                  <Field
                    label="Supporting Attachments (Optional)"
                    helper="Attach up to five files (PDF, Word doc, JPG, PNG). Maximum 10 MB per file."
                  >
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      p={1.5}
                      borderRadius="xl"
                      bg="gray.50"
                      onChange={handleFileAttachment}
                    />
                  </Field>

                  {attachments.length > 0 && (
                    <Stack spacing={2} mt={3}>
                      {attachments.map((file, idx) => (
                        <Flex
                          key={`${file.name}-${idx}`}
                          p={2.5}
                          bg="teal.50"
                          border="1px solid"
                          borderColor="teal.200"
                          borderRadius="xl"
                          justify="space-between"
                          align="center"
                        >
                          <HStack spacing={2.5}>
                            <Icon as={FiFileText} color="teal.700" />
                            <Text fontSize="xs" fontWeight="700" color="teal.900" noOfLines={1}>
                              {file.name}
                            </Text>
                            <Badge colorScheme="teal" fontSize="2xs">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </Badge>
                          </HStack>
                          <IconButton
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            icon={<FiTrash2 />}
                            aria-label="Remove attachment"
                            onClick={() => removeAttachment(idx)}
                          />
                        </Flex>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Flex justify="flex-end" mt={8}>
                  <Button
                    colorScheme="teal"
                    size="lg"
                    px={8}
                    borderRadius="xl"
                    leftIcon={<FiSend />}
                    onClick={submit}
                    isLoading={submitting}
                    isDisabled={Boolean(accessContext && !accessContext.submissionManager)}
                    loadingText="Submitting Request..."
                    shadow="sm"
                  >
                    Submit Request for Review
                  </Button>
                </Flex>
              </GridItem>
            </Grid>
          </TabPanel>

          {/* Panel 1: My requests */}
          <TabPanel p={0}>
            <RequestCards items={mine} empty="You have not submitted any employee requests." actor="mine" />
          </TabPanel>

          {/* Panel 2: Manager approvals */}
          {canReviewAsManager && (
            <TabPanel p={0}>
              <RequestCards
                items={managerInbox}
                empty="No employee requests are currently assigned to you for line manager review."
                actor="manager"
              />
            </TabPanel>
          )}

          {/* Panel 3: HR approvals */}
          {isHr && (
            <TabPanel p={0}>
              <Alert status="info" borderRadius="2xl" mb={5} border="1px solid" borderColor="blue.200">
                <AlertIcon />
                HR Master Authorization Center: You can monitor, evaluate, and make direct approval or rejection decisions for any active request in the organization.
              </Alert>
              <RequestCards
                items={hrInbox}
                empty="No pending requests currently require HR review."
                actor="hr"
              />
            </TabPanel>
          )}

          {/* Panel 4: Manager assignments */}
          {isHr && (
            <TabPanel p={0}>
              <Box mb={5}>
                <Heading size="md">Employee Line Manager Assignments</Heading>
                <Text mt={1} fontSize="sm" color="gray.500">
                  Assign the line manager accountable for routing and first-stage approvals for each employee.
                </Text>
              </Box>
              <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
                {managerDirectory.employees
                  .filter((employee) => !MANAGER_ROLES.has(normalizeRole(employee.role)))
                  .map((employee) => (
                    <Box
                      key={employee._id}
                      p={5}
                      bg="white"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="2xl"
                      shadow="xs"
                    >
                      <Flex
                        justify="space-between"
                        align={{ base: 'flex-start', sm: 'center' }}
                        direction={{ base: 'column', sm: 'row' }}
                        gap={4}
                      >
                        <HStack>
                          <Avatar size="sm" name={personName(employee)} bg="teal.600" color="white" />
                          <Box>
                            <Text fontWeight="800">{personName(employee)}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {employee.jobTitle || employee.role} • {employee.email}
                            </Text>
                          </Box>
                        </HStack>
                        <Select
                          maxW={{ sm: '280px' }}
                          value={employee.managerId || ''}
                          onChange={(event) => assignManager(employee._id, event.target.value)}
                          isDisabled={assigningUserId === employee._id}
                          placeholder="Select manager"
                          bg="gray.50"
                          borderRadius="xl"
                        >
                          {managerDirectory.managers.map((manager) => (
                            <option key={manager._id} value={manager._id}>
                              {personName(manager)} — {manager.jobTitle || manager.role}
                            </option>
                          ))}
                        </Select>
                      </Flex>
                    </Box>
                  ))}
              </SimpleGrid>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      {/* Detail & Decision Drawer */}
      <Drawer
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        placement="right"
        size="full"
      >
        <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
        <DrawerContent ml="auto" maxW={{ base: '100%', md: '800px', xl: '920px' }} bg="gray.50">
          <DrawerCloseButton color="white" top={5} right={5} zIndex={2} />
          <DrawerHeader p={0}>
            <Box bg="linear-gradient(135deg, #1e4f4f 0%, #285e61 100%)" color="white" px={{ base: 5, md: 8 }} py={7}>
              <HStack spacing={2} mb={1.5}>
                <Badge colorScheme="teal" bg="whiteAlpha.300" color="white" px={2.5} py={0.5} borderRadius="md">
                  {selected?.requestNumber}
                </Badge>
                <Badge
                  colorScheme={STATUS[selected?.status]?.[1] || 'gray'}
                  px={2.5}
                  py={0.5}
                  borderRadius="md"
                >
                  {STATUS[selected?.status]?.[0] || selected?.status}
                </Badge>
              </HStack>
              <Heading size="lg" color="white">
                {selected?.title}
              </Heading>
              <Text mt={2} fontSize="xs" color="teal.100">
                Categorized under: <strong>{selected && labelFor(selected.subcategory)}</strong> • Department: <strong>{selected?.department || 'General'}</strong>
              </Text>
            </Box>
          </DrawerHeader>

          <DrawerBody px={{ base: 4, md: 8 }} py={6}>
            {selected && (
              <Stack spacing={6}>
                {/* 3-Step Interactive Workflow Stepper */}
                <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs">
                  <CardBody p={5}>
                    <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase" mb={3}>
                      Workflow Approval Pipeline
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                      {/* Step 1: Submission */}
                      <Box p={3.5} bg="green.50" border="1px solid" borderColor="green.200" borderRadius="xl">
                        <HStack spacing={2} mb={1}>
                          <Icon as={FiCheckCircle} color="green.600" />
                          <Text fontWeight="800" fontSize="xs" color="green.900">1. Submitter</Text>
                        </HStack>
                        <Text fontSize="xs" fontWeight="700" color="gray.800">{personName(selected.requester)}</Text>
                        <Text fontSize="2xs" color="gray.500">{formatDateTime(selected.createdAt)}</Text>
                      </Box>

                      {/* Step 2: Line Manager */}
                      <Box
                        p={3.5}
                        bg={
                          selected.status === 'pending_manager'
                            ? 'orange.50'
                            : selected.status === 'manager_rejected'
                            ? 'red.50'
                            : 'green.50'
                        }
                        border="1px solid"
                        borderColor={
                          selected.status === 'pending_manager'
                            ? 'orange.300'
                            : selected.status === 'manager_rejected'
                            ? 'red.300'
                            : 'green.300'
                        }
                        borderRadius="xl"
                      >
                        <HStack spacing={2} mb={1}>
                          <Icon
                            as={
                              selected.status === 'pending_manager'
                                ? FiClock
                                : selected.status === 'manager_rejected'
                                ? FiXCircle
                                : FiCheckCircle
                            }
                            color={
                              selected.status === 'pending_manager'
                                ? 'orange.600'
                                : selected.status === 'manager_rejected'
                                ? 'red.600'
                                : 'green.600'
                            }
                          />
                          <Text fontWeight="800" fontSize="xs" color="gray.900">2. Line Manager</Text>
                        </HStack>
                        <Text fontSize="xs" fontWeight="700" color="gray.800">{personName(selected.manager)}</Text>
                        <Text fontSize="2xs" color="gray.500">
                          {selected.managerDecision?.decidedAt
                            ? `${selected.managerDecision.decision.toUpperCase()} • ${formatDateTime(selected.managerDecision.decidedAt)}`
                            : 'Awaiting Line Review'}
                        </Text>
                      </Box>

                      {/* Step 3: HR Final */}
                      <Box
                        p={3.5}
                        bg={
                          selected.status === 'hr_approved'
                            ? 'green.50'
                            : selected.status === 'hr_rejected'
                            ? 'red.50'
                            : selected.status === 'pending_hr'
                            ? 'blue.50'
                            : 'gray.50'
                        }
                        border="1px solid"
                        borderColor={
                          selected.status === 'hr_approved'
                            ? 'green.300'
                            : selected.status === 'hr_rejected'
                            ? 'red.300'
                            : selected.status === 'pending_hr'
                            ? 'blue.300'
                            : 'gray.200'
                        }
                        borderRadius="xl"
                      >
                        <HStack spacing={2} mb={1}>
                          <Icon
                            as={
                              selected.status === 'hr_approved'
                                ? FiCheckCircle
                                : selected.status === 'hr_rejected'
                                ? FiXCircle
                                : FiClock
                            }
                            color={
                              selected.status === 'hr_approved'
                                ? 'green.600'
                                : selected.status === 'hr_rejected'
                                ? 'red.600'
                                : selected.status === 'pending_hr'
                                ? 'blue.600'
                                : 'gray.400'
                            }
                          />
                          <Text fontWeight="800" fontSize="xs" color="gray.900">3. HR Authorization</Text>
                        </HStack>
                        <Text fontSize="xs" fontWeight="700" color="gray.800">
                          {selected.hrDecision?.decidedBy?.fullName || 'HR Administration'}
                        </Text>
                        <Text fontSize="2xs" color="gray.500">
                          {selected.hrDecision?.decidedAt
                            ? `${selected.hrDecision.decision.toUpperCase()} • ${formatDateTime(selected.hrDecision.decidedAt)}`
                            : selected.status === 'pending_manager'
                            ? 'Pending manager first (or HR direct)'
                            : 'Awaiting HR final decision'}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Requester and Manager Details */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs">
                    <CardBody p={5}>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="xs" color="gray.500" fontWeight="800" letterSpacing="wide">
                          EMPLOYEE INFORMATION
                        </Text>
                        {(selected.requester?._id || selected.requestedById) && (
                          <Button
                            size="xs"
                            colorScheme="teal"
                            variant="outline"
                            leftIcon={<FiExternalLink />}
                            onClick={() =>
                              navigate(`/users?userId=${selected.requester?._id || selected.requestedById}&tab=2`)
                            }
                          >
                            Profile
                          </Button>
                        )}
                      </Flex>
                      <HStack spacing={3.5} mb={3}>
                        <Avatar size="md" name={personName(selected.requester)} bg="teal.600" color="white" />
                        <Box>
                          <Text fontWeight="800" fontSize="md">
                            {personName(selected.requester)}
                          </Text>
                          <Text fontSize="xs" color="teal.700" fontWeight="600">
                            {selected.requester?.jobTitle || selected.requester?.role || 'Staff Member'}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Dept: <strong>{selected.department || selected.requester?.department || 'General'}</strong>
                          </Text>
                        </Box>
                      </HStack>
                      <Stack spacing={1.5} fontSize="xs" bg="gray.50" p={3} borderRadius="xl">
                        {selected.requester?.email && (
                          <HStack><Icon as={FiMail} color="gray.400" /><Text color="gray.600">Email:</Text><Text fontWeight="600">{selected.requester.email}</Text></HStack>
                        )}
                        {(selected.requester?.phone || selected.requester?.altPhone) && (
                          <HStack><Icon as={FiPhone} color="gray.400" /><Text color="gray.600">Phone:</Text><Text fontWeight="600">{selected.requester?.phone || selected.requester?.altPhone}</Text></HStack>
                        )}
                        {selected.requester?.digitalId && (
                          <HStack><Icon as={FiTag} color="gray.400" /><Text color="gray.600">Digital ID:</Text><Badge colorScheme="purple">{selected.requester.digitalId}</Badge></HStack>
                        )}
                      </Stack>
                    </CardBody>
                  </Card>

                  <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs">
                    <CardBody p={5}>
                      <Text fontSize="xs" color="gray.500" fontWeight="800" letterSpacing="wide" mb={2}>
                        ASSIGNED LINE MANAGER
                      </Text>
                      <HStack spacing={3.5} mb={3}>
                        <Avatar size="md" name={personName(selected.manager)} bg="blue.600" color="white" />
                        <Box>
                          <Text fontWeight="800" fontSize="md">
                            {personName(selected.manager)}
                          </Text>
                          <Text fontSize="xs" color="blue.700" fontWeight="600">
                            {selected.manager?.jobTitle || selected.manager?.role || 'Manager'}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Dept: <strong>{selected.department || 'General'}</strong>
                          </Text>
                        </Box>
                      </HStack>
                      <Stack spacing={1.5} fontSize="xs" bg="gray.50" p={3} borderRadius="xl">
                        {selected.manager?.email && (
                          <HStack><Icon as={FiMail} color="gray.400" /><Text color="gray.600">Email:</Text><Text fontWeight="600">{selected.manager.email}</Text></HStack>
                        )}
                        <HStack><Icon as={FiUserCheck} color="green.500" /><Text color="gray.600">Review Stage:</Text><Text fontWeight="700" color={selected.status === 'pending_manager' ? 'orange.600' : 'green.600'}>{selected.status === 'pending_manager' ? 'Pending Line Review' : 'Manager Review Completed'}</Text></HStack>
                      </Stack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Form Details Grid */}
                <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs">
                  <CardBody p={5}>
                    <Heading size="sm" mb={4}>
                      Structured Request Details
                    </Heading>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3.5}>
                      {Object.entries(selected.formData || {})
                        .filter(([key, value]) => value !== '' && value !== false && !['laptopPassword'].includes(key))
                        .map(([key, value]) => (
                          <Box key={key} p={3.5} bg="gray.50" borderRadius="xl" border="1px solid" borderColor="gray.100">
                            <Text fontSize="2xs" fontWeight="800" color="gray.500" textTransform="uppercase">
                              {formatFormKey(key)}
                            </Text>
                            <Text mt={1} fontSize="sm" fontWeight="700" color="gray.800">
                              {formatFormValue(value, key)}
                            </Text>
                          </Box>
                        ))}
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Attachments */}
                {selected.attachments?.length > 0 && (
                  <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs">
                    <CardBody p={5}>
                      <Heading size="sm" mb={3}>
                        Supporting Attachments ({selected.attachments.length})
                      </Heading>
                      <Stack spacing={2}>
                        {selected.attachments.map((attachment) => (
                          <Button
                            key={attachment.fileId}
                            as="a"
                            href={attachment.url}
                            target="_blank"
                            variant="outline"
                            colorScheme="teal"
                            justifyContent="space-between"
                            rightIcon={<FiDownload />}
                            leftIcon={<FiFileText />}
                            borderRadius="xl"
                          >
                            <Text noOfLines={1}>{attachment.originalName}</Text>
                          </Button>
                        ))}
                      </Stack>
                    </CardBody>
                  </Card>
                )}

                {/* Previous Decisions Notes */}
                {selected.managerDecision?.decision && (
                  <Box bg={selected.managerDecision.decision === 'approved' ? 'teal.50' : 'red.50'} borderRadius="xl" border="1px solid" borderColor={selected.managerDecision.decision === 'approved' ? 'teal.200' : 'red.200'} p={4}>
                    <Flex justify="space-between" align="center">
                      <HStack spacing={2}>
                        <Icon as={selected.managerDecision.decision === 'approved' ? FiCheckCircle : FiXCircle} color={selected.managerDecision.decision === 'approved' ? 'teal.700' : 'red.700'} />
                        <Text fontWeight="800" color={selected.managerDecision.decision === 'approved' ? 'teal.900' : 'red.900'}>
                          Line Manager Decision: {selected.managerDecision.decision.toUpperCase()}
                        </Text>
                      </HStack>
                      <Text fontSize="2xs" color="gray.500">{formatDateTime(selected.managerDecision.decidedAt)}</Text>
                    </Flex>
                    {selected.managerDecision.note && (
                      <Text mt={2} fontSize="sm" color={selected.managerDecision.decision === 'approved' ? 'teal.900' : 'red.900'}>
                        <strong>Manager Remark:</strong> {selected.managerDecision.note}
                      </Text>
                    )}
                  </Box>
                )}

                {selected.hrDecision?.decision && (
                  <Box bg={selected.hrDecision.decision === 'approved' ? 'green.50' : 'red.50'} borderRadius="xl" border="1px solid" borderColor={selected.hrDecision.decision === 'approved' ? 'green.200' : 'red.200'} p={4}>
                    <Flex justify="space-between" align="center">
                      <HStack spacing={2}>
                        <Icon as={selected.hrDecision.decision === 'approved' ? FiCheckCircle : FiXCircle} color={selected.hrDecision.decision === 'approved' ? 'green.700' : 'red.700'} />
                        <Text fontWeight="800" color={selected.hrDecision.decision === 'approved' ? 'green.900' : 'red.900'}>
                          HR Final Authorization: {selected.hrDecision.decision.toUpperCase()}
                        </Text>
                      </HStack>
                      <Text fontSize="2xs" color="gray.500">{formatDateTime(selected.hrDecision.decidedAt)}</Text>
                    </Flex>
                    {selected.hrDecision.note && (
                      <Text mt={2} fontSize="sm" color={selected.hrDecision.decision === 'approved' ? 'green.900' : 'red.900'}>
                        <strong>HR Remark:</strong> {selected.hrDecision.note}
                      </Text>
                    )}
                  </Box>
                )}

                {/* Audit Trail Timeline */}
                <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs">
                  <CardBody p={5}>
                    <Heading size="sm" mb={4}>
                      Audit History & Timeline
                    </Heading>
                    <Stack spacing={3.5}>
                      {(selected.history || []).map((event, index) => (
                        <Flex key={`${event.occurredAt}-${index}`} gap={3}>
                          <Flex
                            w="30px"
                            h="30px"
                            bg="teal.50"
                            borderRadius="full"
                            align="center"
                            justify="center"
                            flexShrink={0}
                          >
                            <Icon as={FiCheck} color="teal.600" />
                          </Flex>
                          <Box>
                            <HStack spacing={2}>
                              <Text fontWeight="800" fontSize="xs" textTransform="capitalize">
                                {event.action.replace(/_/g, ' ')}
                              </Text>
                              <Badge fontSize="2xs" colorScheme="gray">{event.actorRole || 'System'}</Badge>
                            </HStack>
                            <Text fontSize="xs" color="gray.600" mt={0.5}>
                              {event.note || 'Action recorded in audit log'}
                            </Text>
                            <Text fontSize="2xs" color="gray.400">
                              {formatDateTime(event.occurredAt)}
                            </Text>
                          </Box>
                        </Flex>
                      ))}
                    </Stack>
                  </CardBody>
                </Card>

                {/* Manager Reassignment Box for HR */}
                {isHr && selected.status === 'pending_manager' && (
                  <Card borderRadius="2xl" border="1px solid" borderColor="gray.200" shadow="xs">
                    <CardBody p={5}>
                      <Heading size="sm">Manager Routing Adjustment</Heading>
                      <Text mt={1} mb={4} fontSize="xs" color="gray.500">
                        This request is currently with the manager below. HR can reassign it to a different reviewer if needed.
                      </Text>
                      <Select
                        borderRadius="xl"
                        value={selected.manager?._id || selected.manager || ''}
                        onChange={(event) => reassignRequest(event.target.value)}
                        isDisabled={reassigning}
                      >
                        {managerDirectory.managers.map((manager) => (
                          <option key={manager._id} value={manager._id}>
                            {personName(manager)} — {manager.jobTitle || manager.role}
                          </option>
                        ))}
                      </Select>
                    </CardBody>
                  </Card>
                )}

                {/* Active Decision Control Box */}
                {((selected.actor === 'manager' && selected.status === 'pending_manager') ||
                  (selected.actor === 'hr' && ['pending_manager', 'pending_hr'].includes(selected.status)) ||
                  (isHr && ['pending_manager', 'pending_hr'].includes(selected.status))) && (
                  <Card border="2px solid" borderColor="teal.300" borderRadius="2xl" shadow="sm">
                    <CardBody p={5}>
                      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                        <Box>
                          <Heading size="sm">Issue Decision</Heading>
                          <Text mt={1} fontSize="xs" color="gray.600">
                            {isHr
                              ? 'HR has full authority to review all details and issue an immediate final approval or rejection.'
                              : 'Review the details and issue your line manager approval or rejection.'}
                          </Text>
                        </Box>
                        <Badge colorScheme={isHr ? 'teal' : 'blue'} p={2} borderRadius="lg">
                          {isHr ? 'Direct HR Authority' : 'Line Manager Review'}
                        </Badge>
                      </Flex>

                      <Textarea
                        mt={4}
                        borderRadius="xl"
                        value={decisionNote}
                        onChange={(event) => setDecisionNote(event.target.value)}
                        placeholder="Approval remark or mandatory rejection reason..."
                        minH="100px"
                      />

                      <Divider my={4} />

                      <Flex justify="flex-end" gap={3}>
                        <Button
                          leftIcon={<FiX />}
                          colorScheme="red"
                          variant="outline"
                          borderRadius="xl"
                          isDisabled={deciding}
                          onClick={() => decide(isHr ? 'hr' : 'manager', 'rejected')}
                        >
                          Reject Request
                        </Button>
                        <Button
                          leftIcon={<FiCheck />}
                          colorScheme="teal"
                          borderRadius="xl"
                          isLoading={deciding}
                          isDisabled={deciding}
                          onClick={() => decide(isHr ? 'hr' : 'manager', 'approved')}
                        >
                          {isHr ? 'Approve Request (HR Final)' : 'Approve & Forward to HR'}
                        </Button>
                      </Flex>
                    </CardBody>
                  </Card>
                )}
              </Stack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default EmployeeRequestsPage;
