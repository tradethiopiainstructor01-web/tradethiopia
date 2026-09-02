import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  Divider,
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
  Table,
  Tag,
  TagCloseButton,
  TagLabel,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiUserCheck,
  FiCalendar,
  FiClock,
  FiDownload,
  FiRefreshCw,
  FiSearch,
  FiEye,
  FiCheckCircle,
  FiDollarSign,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCcw,
  FiMaximize2,
  FiExternalLink,
  FiCamera,
  FiFileText,
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { getStudentRegistrations, getStudentRegistrationById } from '../../services/studentRegistrationService';

const DEPARTMENTS = [
  'All Departments',
  'Import and Export',
  'Digital Marketing',
  'Stock Marketing',
  'Barista',
  'AI for Business',
  'Coffee Cupping',
  'Logistics',
  'Transit',
];

const ITEMS_PER_PAGE = 15;

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TessbinCSRegisteredUsersView() {
  const toast = useToast();

  // Color mode values
  const cardBg = useColorModeValue('white', '#1E293B');
  const borderColor = useColorModeValue('#E2E8F0', '#334155');
  const headerBg = useColorModeValue('#F8FAFC', '#0F172A');
  const textColor = useColorModeValue('#0F172A', '#F8FAFC');
  const mutedColor = useColorModeValue('#64748B', '#94A3B8');
  const tableHoverBg = useColorModeValue('#F1F5F9', 'rgba(255, 255, 255, 0.04)');
  const inputBg = useColorModeValue('white', '#0F172A');

  // Main Data State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Standard Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [timePeriod, setTimePeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [completionFilter, setCompletionFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = latest to old

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Full View Image Lightbox Modal
  const {
    isOpen: isImageModalOpen,
    onOpen: onImageModalOpen,
    onClose: onImageModalClose,
  } = useDisclosure();
  const [fullViewImage, setFullViewImage] = useState({
    url: '',
    title: '',
    studentName: '',
  });

  const handleOpenFullImage = (url, title, studentName = '') => {
    if (!url) return;
    setFullViewImage({
      url,
      title: title || 'Verification Document',
      studentName: studentName || selectedStudent?.fullName || 'Student',
    });
    onImageModalOpen();
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudentRegistrations();
      let studentList = Array.isArray(data) ? data : [];

      // Sort by newest first
      studentList.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.enrollmentDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.enrollmentDate || 0).getTime();
        return dateB - dateA;
      });

      setStudents(studentList);
    } catch (err) {
      console.error('Error fetching CS student registrations:', err);
      toast({
        title: 'Error fetching registrations',
        description: err.message || 'Could not load student registrations',
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Standard Time Filtering Logic
  const filterByTime = useCallback(
    (student) => {
      if (timePeriod === 'all') return true;
      const d = new Date(student.createdAt || student.enrollmentDate);
      if (isNaN(d.getTime())) return false;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Daily: Today
      if (timePeriod === 'today') {
        const studentDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return studentDay.getTime() === today.getTime();
      }

      // Daily: Yesterday
      if (timePeriod === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const studentDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return studentDay.getTime() === yesterday.getTime();
      }

      // Weekly: Past 7 Days
      if (timePeriod === 'past_7_days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= sevenDaysAgo && d <= now;
      }

      // Weekly: This Current Week
      if (timePeriod === 'this_week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setHours(23, 59, 59, 999);

        return d >= startOfWeek && d <= endOfWeek;
      }

      // Weekly: Last Week
      if (timePeriod === 'last_week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(diff);
        startOfLastWeek.setHours(0, 0, 0, 0);

        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);
        endOfLastWeek.setHours(23, 59, 59, 999);

        return d >= startOfLastWeek && d <= endOfLastWeek;
      }

      // Monthly: This Month
      if (timePeriod === 'this_month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }

      // Monthly: Last Month
      if (timePeriod === 'last_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      }

      // Specific Month: "month-YYYY-MM" (e.g. month-2026-06 for June, month-2026-08 for August)
      if (timePeriod.startsWith('month-')) {
        const parts = timePeriod.split('-');
        const targetYear = parseInt(parts[1], 10);
        const targetMonth = parseInt(parts[2], 10) - 1; // 0-indexed
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      }

      // Specific Year: "year-YYYY" (e.g. year-2026, year-2025)
      if (timePeriod.startsWith('year-')) {
        const targetYear = parseInt(timePeriod.replace('year-', ''), 10);
        return d.getFullYear() === targetYear;
      }

      // Custom Range
      if (timePeriod === 'custom') {
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(customStartDate) : new Date(0);
        const end = customEndDate ? new Date(customEndDate) : new Date();
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }

      return true;
    },
    [timePeriod, customStartDate, customEndDate]
  );

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students
      .filter(filterByTime)
      .filter((s) => {
        if (departmentFilter === 'All Departments') return true;
        return (s.learningDepartment || '').toLowerCase() === departmentFilter.toLowerCase();
      })
      .filter((s) => {
        if (paymentStatusFilter === 'All') return true;
        return (s.paymentStatus || '').toLowerCase() === paymentStatusFilter.toLowerCase();
      })
      .filter((s) => {
        if (completionFilter === 'All') return true;
        const status = (s.classCompletionStatus || (s.classCompleted ? 'Completed' : 'Not Completed')).toLowerCase();
        return status === completionFilter.toLowerCase();
      })
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          (s.studentId || '').toLowerCase().includes(q) ||
          (s.fullName || '').toLowerCase().includes(q) ||
          (s.phone || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          (s.registeredBy || '').toLowerCase().includes(q) ||
          (s.learningDepartment || '').toLowerCase().includes(q) ||
          (s.paymentBank || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.enrollmentDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.enrollmentDate || 0).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [
    students,
    filterByTime,
    departmentFilter,
    paymentStatusFilter,
    completionFilter,
    searchQuery,
    sortOrder,
  ]);

  // Statistics Cards
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const completed = filteredStudents.filter(
      (s) => (s.classCompletionStatus || '').toLowerCase() === 'completed' || s.classCompleted === true
    ).length;
    const paid = filteredStudents.filter(
      (s) => (s.paymentStatus || '').toLowerCase() === 'paid'
    ).length;
    const now = new Date();
    const todayRegistrations = students.filter((s) => {
      const d = new Date(s.createdAt || s.enrollmentDate);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }).length;

    return { total, completed, paid, todayRegistrations };
  }, [filteredStudents, students]);

  // Reset All Filters
  const resetFilters = () => {
    setSearchQuery('');
    setTimePeriod('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setDepartmentFilter('All Departments');
    setPaymentStatusFilter('All');
    setCompletionFilter('All');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const isFiltered =
    searchQuery !== '' ||
    timePeriod !== 'all' ||
    departmentFilter !== 'All Departments' ||
    paymentStatusFilter !== 'All' ||
    completionFilter !== 'All';

  // Active filter label for time period
  const getTimePeriodLabel = (val) => {
    const map = {
      all: 'All Time',
      today: 'Today',
      yesterday: 'Yesterday',
      this_week: 'This Week',
      last_week: 'Last Week',
      past_7_days: 'Past 7 Days',
      this_month: 'This Month (September 2026)',
      last_month: 'Last Month',
      'month-2026-08': 'August 2026',
      'month-2026-07': 'July 2026',
      'month-2026-06': 'June 2026',
      'month-2026-05': 'May 2026',
      'month-2026-04': 'April 2026',
      'month-2026-03': 'March 2026',
      'month-2026-02': 'February 2026',
      'month-2026-01': 'January 2026',
      'year-2026': 'Year 2026',
      'year-2025': 'Year 2025',
      custom: 'Custom Range',
    };
    return map[val] || val;
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  // Export to Excel
  const exportToExcel = () => {
    if (!filteredStudents.length) {
      toast({
        title: 'No data to export',
        description: 'There are no student registrations matching the current filters.',
        status: 'info',
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const rows = filteredStudents.map((s) => ({
      'Student ID': s.studentId || '',
      'Full Name': s.fullName || '',
      'Phone': s.phone || '',
      'Email': s.email || '',
      'Gender': s.gender || '',
      'Learning Department': s.learningDepartment || '',
      'Program': s.program || '',
      'Preferred Time Slot': s.preferredTimeSlot || '',
      'Registration Date': formatDateTime(s.createdAt),
      'Enrollment Date': formatDate(s.enrollmentDate),
      'Exam Date': formatDate(s.examDate),
      'Registered By': s.registeredBy || '',
      'Payment Option': s.paymentOption || '',
      'Payment Status': s.paymentStatus || '',
      'Payment Bank': s.paymentBank || '',
      'FS Number': s.fsNumber || '',
      'Class Completion': s.classCompletionStatus || (s.classCompleted ? 'Completed' : 'Not Completed'),
      'Status': s.status || '',
      'Notes': s.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CS_Registrations');

    XLSX.writeFile(
      workbook,
      `Tessbin_CS_Registrations_${timePeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    toast({
      title: 'Exported successfully',
      description: `${rows.length} records exported to Excel.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleOpenDetail = async (student) => {
    setSelectedStudent(student);
    onOpen();
    if (student?._id || student?.id) {
      try {
        const fullStudent = await getStudentRegistrationById(student._id || student.id);
        if (fullStudent) {
          setSelectedStudent(fullStudent);
        }
      } catch (err) {
        console.warn('Could not load full student details:', err);
      }
    }
  };

  return (
    <Box>
      {/* Header Banner */}
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        mb={6}
      >
        <Box>
          <HStack spacing={3}>
            <Flex
              w="42px"
              h="42px"
              bg="#4F46E5"
              color="white"
              borderRadius="xl"
              align="center"
              justify="center"
              boxShadow="0 4px 14px rgba(79, 70, 229, 0.4)"
            >
              <Icon as={FiUserCheck} boxSize="22px" />
            </Flex>
            <Box>
              <Heading size="md" fontWeight="900" color={textColor} letterSpacing="tight">
                Customer Success Registered Users
              </Heading>
              <Text fontSize="12px" color={mutedColor} mt={0.5}>
                Monitor all students registered by Customer Success with standard date and status filters
              </Text>
            </Box>
          </HStack>
        </Box>

        <HStack spacing={3}>
          <Tooltip label="Reload Data">
            <IconButton
              icon={<FiRefreshCw />}
              size="sm"
              variant="outline"
              borderColor={borderColor}
              isLoading={loading}
              onClick={fetchData}
              aria-label="Refresh registrations"
            />
          </Tooltip>
          <Button
            leftIcon={<FiDownload />}
            size="sm"
            colorScheme="indigo"
            bg="#4F46E5"
            _hover={{ bg: '#4338CA' }}
            color="white"
            borderRadius="xl"
            fontWeight="700"
            fontSize="12px"
            onClick={exportToExcel}
          >
            Export Excel
          </Button>
        </HStack>
      </Flex>

      {/* KPI Stats Overview */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={4}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="11px" fontWeight="800" textTransform="uppercase" color={mutedColor}>
                Filtered Registrations
              </Text>
              <Text fontSize="28px" fontWeight="900" color="#4F46E5" mt={0.5}>
                {stats.total}
              </Text>
              <Text fontSize="10px" color={mutedColor} mt={1}>
                {timePeriod === 'all' ? 'All recorded students' : getTimePeriodLabel(timePeriod)}
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#EEF2FF" color="#4F46E5" borderRadius="xl" align="center" justify="center">
              <Icon as={FiUsers} boxSize="22px" />
            </Flex>
          </Flex>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={4}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="11px" fontWeight="800" textTransform="uppercase" color={mutedColor}>
                Today's Registrations
              </Text>
              <Text fontSize="28px" fontWeight="900" color="#059669" mt={0.5}>
                {stats.todayRegistrations}
              </Text>
              <Text fontSize="10px" color={mutedColor} mt={1}>
                Registered today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#ECFDF5" color="#059669" borderRadius="xl" align="center" justify="center">
              <Icon as={FiCalendar} boxSize="22px" />
            </Flex>
          </Flex>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={4}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="11px" fontWeight="800" textTransform="uppercase" color={mutedColor}>
                Class Completed
              </Text>
              <Text fontSize="28px" fontWeight="900" color="#2563EB" mt={0.5}>
                {stats.completed}
              </Text>
              <Text fontSize="10px" color={mutedColor} mt={1}>
                {stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% completion rate` : '0%'}
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#EFF6FF" color="#2563EB" borderRadius="xl" align="center" justify="center">
              <Icon as={FiCheckCircle} boxSize="22px" />
            </Flex>
          </Flex>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={4}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="11px" fontWeight="800" textTransform="uppercase" color={mutedColor}>
                Paid In Full / Verified
              </Text>
              <Text fontSize="28px" fontWeight="900" color="#D97706" mt={0.5}>
                {stats.paid}
              </Text>
              <Text fontSize="10px" color={mutedColor} mt={1}>
                Verified payments
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#FFFBEB" color="#D97706" borderRadius="xl" align="center" justify="center">
              <Icon as={FiDollarSign} boxSize="22px" />
            </Flex>
          </Flex>
        </Card>
      </SimpleGrid>

      {/* Standard Unified Filter Bar */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} mb={6}>
        <VStack spacing={4} align="stretch">
          {/* Main Filter Row */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={3}>
            {/* 1. Search Box */}
            <Box>
              <Text fontSize="11px" fontWeight="700" color={mutedColor} mb={1.5}>
                Search
              </Text>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color={mutedColor} />
                </InputLeftElement>
                <Input
                  placeholder="Name, ID, phone, agent..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  borderRadius="lg"
                  bg={inputBg}
                />
              </InputGroup>
            </Box>

            {/* 2. Standard Time Period Dropdown */}
            <Box>
              <Text fontSize="11px" fontWeight="700" color={mutedColor} mb={1.5}>
                Date / Time Filter
              </Text>
              <Select
                size="sm"
                value={timePeriod}
                onChange={(e) => {
                  setTimePeriod(e.target.value);
                  setCurrentPage(1);
                }}
                borderRadius="lg"
                bg={inputBg}
                fontWeight="600"
              >
                <option value="all">All Time</option>
                
                <optgroup label="── Daily ──">
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                </optgroup>

                <optgroup label="── Weekly ──">
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="past_7_days">Past 7 Days</option>
                </optgroup>

                <optgroup label="── Monthly (2026) ──">
                  <option value="this_month">This Month (September 2026)</option>
                  <option value="month-2026-08">August 2026</option>
                  <option value="month-2026-07">July 2026</option>
                  <option value="month-2026-06">June 2026</option>
                  <option value="month-2026-05">May 2026</option>
                  <option value="month-2026-04">April 2026</option>
                  <option value="month-2026-03">March 2026</option>
                  <option value="month-2026-02">February 2026</option>
                  <option value="month-2026-01">January 2026</option>
                  <option value="last_month">Last Month</option>
                </optgroup>

                <optgroup label="── Yearly ──">
                  <option value="year-2026">Year 2026</option>
                  <option value="year-2025">Year 2025</option>
                </optgroup>

                <optgroup label="── Custom ──">
                  <option value="custom">Custom Date Range...</option>
                </optgroup>
              </Select>
            </Box>

            {/* 3. Department Dropdown */}
            <Box>
              <Text fontSize="11px" fontWeight="700" color={mutedColor} mb={1.5}>
                Department
              </Text>
              <Select
                size="sm"
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                borderRadius="lg"
                bg={inputBg}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </Select>
            </Box>

            {/* 4. Payment Status Dropdown */}
            <Box>
              <Text fontSize="11px" fontWeight="700" color={mutedColor} mb={1.5}>
                Payment Status
              </Text>
              <Select
                size="sm"
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                borderRadius="lg"
                bg={inputBg}
              >
                <option value="All">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="Waiting">Waiting</option>
                <option value="Unpaid">Unpaid</option>
              </Select>
            </Box>

            {/* 5. Class Completion Status Dropdown */}
            <Box>
              <Text fontSize="11px" fontWeight="700" color={mutedColor} mb={1.5}>
                Class Status
              </Text>
              <Select
                size="sm"
                value={completionFilter}
                onChange={(e) => {
                  setCompletionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                borderRadius="lg"
                bg={inputBg}
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Not Completed">Not Completed / In Progress</option>
                <option value="Stopped">Stopped</option>
              </Select>
            </Box>
          </SimpleGrid>

          {/* Conditional Custom Date Range Row */}
          {timePeriod === 'custom' && (
            <Flex
              p={3}
              bg={useColorModeValue('gray.50', 'gray.800')}
              borderRadius="lg"
              align="center"
              gap={3}
              wrap="wrap"
            >
              <Text fontSize="12px" fontWeight="700" color={textColor}>
                From:
              </Text>
              <Input
                type="date"
                size="sm"
                w="160px"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                bg={inputBg}
                borderRadius="md"
              />
              <Text fontSize="12px" fontWeight="700" color={textColor}>
                To:
              </Text>
              <Input
                type="date"
                size="sm"
                w="160px"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                bg={inputBg}
                borderRadius="md"
              />
              <Button
                size="xs"
                variant="ghost"
                colorScheme="blue"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
              >
                Clear Dates
              </Button>
            </Flex>
          )}

          {/* Toolbar Bottom Row: Active Filter Tags & Sort */}
          <Flex justify="space-between" align="center" wrap="wrap" gap={2} pt={1}>
            <HStack spacing={2} wrap="wrap">
              <Text fontSize="11px" fontWeight="700" color={mutedColor}>
                Active Filters:
              </Text>

              {timePeriod !== 'all' && (
                <Tag size="sm" colorScheme="purple" borderRadius="full">
                  <TagLabel>{getTimePeriodLabel(timePeriod)}</TagLabel>
                  <TagCloseButton onClick={() => setTimePeriod('all')} />
                </Tag>
              )}

              {departmentFilter !== 'All Departments' && (
                <Tag size="sm" colorScheme="blue" borderRadius="full">
                  <TagLabel>{departmentFilter}</TagLabel>
                  <TagCloseButton onClick={() => setDepartmentFilter('All Departments')} />
                </Tag>
              )}

              {paymentStatusFilter !== 'All' && (
                <Tag size="sm" colorScheme="green" borderRadius="full">
                  <TagLabel>Payment: {paymentStatusFilter}</TagLabel>
                  <TagCloseButton onClick={() => setPaymentStatusFilter('All')} />
                </Tag>
              )}

              {completionFilter !== 'All' && (
                <Tag size="sm" colorScheme="orange" borderRadius="full">
                  <TagLabel>Class: {completionFilter}</TagLabel>
                  <TagCloseButton onClick={() => setCompletionFilter('All')} />
                </Tag>
              )}

              {searchQuery && (
                <Tag size="sm" colorScheme="teal" borderRadius="full">
                  <TagLabel>Search: "{searchQuery}"</TagLabel>
                  <TagCloseButton onClick={() => setSearchQuery('')} />
                </Tag>
              )}

              {!isFiltered && (
                <Text fontSize="11px" color={mutedColor} fontStyle="italic">
                  None (showing all)
                </Text>
              )}

              {isFiltered && (
                <Button
                  size="xs"
                  variant="link"
                  colorScheme="red"
                  leftIcon={<FiRotateCcw />}
                  onClick={resetFilters}
                  ml={2}
                >
                  Reset All
                </Button>
              )}
            </HStack>

            <HStack spacing={2}>
              <Button
                size="xs"
                variant="outline"
                borderColor={borderColor}
                borderRadius="lg"
                onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              >
                Sort: {sortOrder === 'desc' ? 'Latest to Old' : 'Oldest to Latest'}
              </Button>
            </HStack>
          </Flex>
        </VStack>
      </Card>

      {/* Main Table */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" overflow="hidden" boxShadow="sm">
        {loading ? (
          <Flex justify="center" align="center" py={20}>
            <Spinner size="xl" color="#4F46E5" thickness="3px" />
            <Text ml={4} fontWeight="600" color={mutedColor}>
              Loading student registrations...
            </Text>
          </Flex>
        ) : filteredStudents.length === 0 ? (
          <Box py={16} textAlign="center">
            <Icon as={FiUsers} boxSize="48px" color={mutedColor} mb={3} opacity={0.5} />
            <Heading size="sm" color={textColor}>
              No Registrations Found
            </Heading>
            <Text fontSize="13px" color={mutedColor} mt={1} maxW="400px" mx="auto">
              No student registrations match the selected filters.
            </Text>
            <Button mt={4} size="sm" colorScheme="blue" variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </Box>
        ) : (
          <>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead bg={headerBg}>
                  <Tr>
                    <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                      STUDENT ID
                    </Th>
                    <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                      FULL NAME
                    </Th>
                    <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                      CONTACT
                    </Th>
                    <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                      DEPARTMENT & SHIFT
                    </Th>
                    <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                      REGISTERED DATE
                    </Th>
                    <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                      REGISTERED BY (CS)
                    </Th>
                    <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                      PAYMENT
                    </Th>
                    <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                      CLASS STATUS
                    </Th>
                    <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800" textAlign="center">
                      ACTIONS
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedStudents.map((s) => {
                    const isCompleted =
                      (s.classCompletionStatus || '').toLowerCase() === 'completed' || s.classCompleted === true;
                    const paymentStatus = (s.paymentStatus || 'Waiting').toLowerCase();

                    return (
                      <Tr
                        key={s._id || s.id || s.studentId}
                        _hover={{ bg: tableHoverBg }}
                        transition="background-color 0.15s"
                      >
                        <Td py={3}>
                          <Badge
                            bg="#EEF2FF"
                            color="#4F46E5"
                            px={2.5}
                            py={0.5}
                            borderRadius="md"
                            fontWeight="800"
                            fontSize="11px"
                          >
                            {s.studentId || 'N/A'}
                          </Badge>
                        </Td>
                        <Td py={3}>
                          <Box>
                            <Text fontWeight="700" color={textColor} fontSize="13px">
                              {s.fullName || 'Unnamed Student'}
                            </Text>
                            <HStack spacing={2} mt={0.5}>
                              {s.gender && (
                                <Text fontSize="10px" color={mutedColor}>
                                  {s.gender}
                                </Text>
                              )}
                              {(s.nationalIdImage || s.passportPhoto || s.paymentScreenshot) && (
                                <Badge colorScheme="purple" fontSize="9px" px={1.5} py={0.2} borderRadius="full">
                                  Photos & Docs
                                </Badge>
                              )}
                            </HStack>
                          </Box>
                        </Td>
                        <Td py={3}>
                          <Text fontSize="12px" fontWeight="600" color={textColor}>
                            {s.phone || '-'}
                          </Text>
                          <Text fontSize="11px" color={mutedColor}>
                            {s.email || '-'}
                          </Text>
                        </Td>
                        <Td py={3}>
                          <Text fontSize="12px" fontWeight="700" color={textColor}>
                            {s.learningDepartment || 'General'}
                          </Text>
                          <HStack spacing={1} mt={0.5}>
                            <Icon as={FiClock} boxSize="10px" color={mutedColor} />
                            <Text fontSize="11px" color={mutedColor}>
                              {s.preferredTimeSlot || 'Morning'}
                            </Text>
                          </HStack>
                        </Td>
                        <Td py={3}>
                          <Text fontSize="12px" fontWeight="600" color={textColor}>
                            {formatDateTime(s.createdAt)}
                          </Text>
                          {s.enrollmentDate && (
                            <Text fontSize="10px" color={mutedColor}>
                              Enrolled: {formatDate(s.enrollmentDate)}
                            </Text>
                          )}
                        </Td>
                        <Td py={3}>
                          <Badge
                            bg="#F0FDF4"
                            color="#15803D"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                            fontWeight="700"
                            fontSize="11px"
                          >
                            {s.registeredBy || 'Customer Success'}
                          </Badge>
                          {s.registeredByEmail && (
                            <Text fontSize="10px" color={mutedColor} mt={0.5}>
                              {s.registeredByEmail}
                            </Text>
                          )}
                        </Td>
                        <Td py={3}>
                          <Badge
                            colorScheme={
                              paymentStatus === 'paid'
                                ? 'green'
                                : paymentStatus === 'unpaid'
                                ? 'red'
                                : 'yellow'
                            }
                            fontSize="10px"
                            fontWeight="700"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                          >
                            {s.paymentStatus || 'Waiting'}
                          </Badge>
                          <Text fontSize="10px" color={mutedColor} mt={0.5}>
                            {s.paymentOption || 'Full Payment'}
                          </Text>
                        </Td>
                        <Td py={3}>
                          <Badge
                            colorScheme={isCompleted ? 'blue' : 'gray'}
                            fontSize="10px"
                            fontWeight="700"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                          >
                            {isCompleted ? 'Completed' : s.classCompletionStatus || 'In Progress'}
                          </Badge>
                        </Td>
                        <Td py={3} textAlign="center">
                          <Button
                            leftIcon={<FiEye />}
                            size="xs"
                            variant="solid"
                            colorScheme="indigo"
                            bg="#4F46E5"
                            _hover={{ bg: '#4338CA' }}
                            color="white"
                            borderRadius="lg"
                            fontWeight="700"
                            onClick={() => handleOpenDetail(s)}
                          >
                            Full View
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>

            {/* Pagination Controls */}
            <Flex
              p={4}
              borderTop="1px solid"
              borderColor={borderColor}
              justify="space-between"
              align="center"
              wrap="wrap"
              gap={3}
            >
              <Text fontSize="12px" color={mutedColor}>
                Showing <b>{Math.min(filteredStudents.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</b> to{' '}
                <b>{Math.min(filteredStudents.length, currentPage * ITEMS_PER_PAGE)}</b> of{' '}
                <b>{filteredStudents.length}</b> registrations
              </Text>

              <HStack spacing={2}>
                <IconButton
                  icon={<FiChevronLeft />}
                  size="sm"
                  variant="outline"
                  borderColor={borderColor}
                  isDisabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                />
                <Text fontSize="12px" fontWeight="700" color={textColor} px={2}>
                  Page {currentPage} of {totalPages}
                </Text>
                <IconButton
                  icon={<FiChevronRight />}
                  size="sm"
                  variant="outline"
                  borderColor={borderColor}
                  isDisabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                />
              </HStack>
            </Flex>
          </>
        )}
      </Card>

      {/* Student Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(5px)" bg="rgba(0,0,0,0.6)" />
        <ModalContent borderRadius="2xl" bg={cardBg} borderColor={borderColor} borderWidth="1px" overflow="hidden" boxShadow="2xl">
          <ModalHeader borderBottom="1px solid" borderColor={borderColor} pb={4} bg={headerBg}>
            <Flex justify="space-between" align="center" pr={8}>
              <HStack spacing={3}>
                {selectedStudent?.passportPhoto ? (
                  <Tooltip label="Click for full photo view">
                    <Avatar
                      size="md"
                      src={selectedStudent.passportPhoto}
                      name={selectedStudent.fullName}
                      cursor="pointer"
                      onClick={() => handleOpenFullImage(selectedStudent.passportPhoto, '3×4 Passport Photo', selectedStudent.fullName)}
                      border="2px solid #4F46E5"
                      _hover={{ transform: 'scale(1.08)' }}
                      transition="all 0.15s"
                    />
                  </Tooltip>
                ) : (
                  <Flex w="44px" h="44px" bg="#EEF2FF" color="#4F46E5" borderRadius="xl" align="center" justify="center">
                    <Icon as={FiUserCheck} boxSize="22px" />
                  </Flex>
                )}
                <Box>
                  <HStack spacing={2}>
                    <Heading size="md" color={textColor} fontWeight="800">
                      {selectedStudent?.fullName || 'Student Details'}
                    </Heading>
                    <Badge colorScheme="purple" fontSize="12px" px={2} py={0.5} borderRadius="md" fontWeight="800">
                      {selectedStudent?.studentId || 'N/A'}
                    </Badge>
                  </HStack>
                  <Text fontSize="12px" color={mutedColor} mt={0.5}>
                    Department: <b>{selectedStudent?.learningDepartment || 'General'}</b> • Shift: <b>{selectedStudent?.preferredTimeSlot || 'Morning'}</b>
                  </Text>
                </Box>
              </HStack>
            </Flex>
          </ModalHeader>
          <ModalCloseButton top="18px" right="20px" />

          <ModalBody py={5} px={6}>
            {selectedStudent && (
              <VStack spacing={5} align="stretch">
                {/* ID and Status Banner */}
                <Flex
                  p={4}
                  bg={useColorModeValue('#F8FAFC', '#0F172A')}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                  justify="space-between"
                  align="center"
                  wrap="wrap"
                  gap={3}
                >
                  <HStack spacing={3}>
                    <Text fontSize="12px" fontWeight="700" color={mutedColor}>
                      STUDENT ID:
                    </Text>
                    <Badge colorScheme="purple" fontSize="13px" px={2.5} py={1} borderRadius="md" fontWeight="800">
                      {selectedStudent.studentId || 'N/A'}
                    </Badge>
                  </HStack>
                  <HStack spacing={2} flexWrap="wrap">
                    <Badge
                      colorScheme={
                        (selectedStudent.paymentStatus || '').toLowerCase() === 'paid'
                          ? 'green'
                          : (selectedStudent.paymentStatus || '').toLowerCase() === 'unpaid'
                          ? 'red'
                          : 'yellow'
                      }
                      fontSize="11px"
                      px={2.5}
                      py={1}
                      borderRadius="md"
                      fontWeight="700"
                    >
                      Payment: {selectedStudent.paymentStatus || 'Waiting'}
                    </Badge>
                    <Badge
                      colorScheme={
                        (selectedStudent.classCompletionStatus || '').toLowerCase() === 'completed' || selectedStudent.classCompleted
                          ? 'blue'
                          : 'gray'
                      }
                      fontSize="11px"
                      px={2.5}
                      py={1}
                      borderRadius="md"
                      fontWeight="700"
                    >
                      Class: {selectedStudent.classCompletionStatus || (selectedStudent.classCompleted ? 'Completed' : 'In Progress')}
                    </Badge>
                    <Badge
                      colorScheme={selectedStudent.cocPaymentStatus === 'Paid' ? 'green' : 'gray'}
                      fontSize="11px"
                      px={2.5}
                      py={1}
                      borderRadius="md"
                      fontWeight="700"
                    >
                      CoC: {selectedStudent.cocPaymentStatus || 'Unpaid'}
                    </Badge>
                  </HStack>
                </Flex>

                {/* Verification Documents & Photos Section */}
                <Box
                  p={4}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="xl"
                  bg={useColorModeValue('#FAFAFA', '#0F172A')}
                >
                  <Flex justify="space-between" align="center" mb={3}>
                    <HStack spacing={2}>
                      <Icon as={FiCamera} color="#4F46E5" boxSize="18px" />
                      <Text fontSize="13px" fontWeight="800" color={textColor} textTransform="uppercase" letterSpacing="wide">
                        Student Verification Documents & Photos
                      </Text>
                    </HStack>
                    <Text fontSize="11px" color={mutedColor}>
                      Click any document to view full resolution
                    </Text>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    {/* 1. Passport Photo (3x4) */}
                    <Box
                      border="1px solid"
                      borderColor={selectedStudent.passportPhoto ? '#C7D2FE' : borderColor}
                      borderRadius="xl"
                      p={3}
                      bg={cardBg}
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      transition="all 0.2s"
                      _hover={{ borderColor: '#4F46E5', boxShadow: 'md' }}
                    >
                      <Box>
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontSize="12px" fontWeight="800" color={textColor}>
                            3×4 Passport Photo
                          </Text>
                          {selectedStudent.passportPhoto ? (
                            <Badge colorScheme="green" fontSize="10px">Available</Badge>
                          ) : (
                            <Badge colorScheme="gray" fontSize="10px">Not Provided</Badge>
                          )}
                        </Flex>
                        {selectedStudent.passportPhoto ? (
                          <Box
                            position="relative"
                            borderRadius="lg"
                            overflow="hidden"
                            bg="blackAlpha.900"
                            cursor="zoom-in"
                            onClick={() => handleOpenFullImage(selectedStudent.passportPhoto, '3×4 Passport Photo', selectedStudent.fullName)}
                            role="group"
                          >
                            <Image
                              src={selectedStudent.passportPhoto}
                              alt="Passport Photo"
                              h="170px"
                              w="100%"
                              objectFit="cover"
                              transition="transform 0.2s"
                              _groupHover={{ transform: 'scale(1.05)', opacity: 0.9 }}
                            />
                            <Flex
                              position="absolute"
                              inset={0}
                              bg="blackAlpha.600"
                              opacity={0}
                              _groupHover={{ opacity: 1 }}
                              transition="opacity 0.2s"
                              align="center"
                              justify="center"
                              color="white"
                              direction="column"
                              gap={1}
                            >
                              <Icon as={FiMaximize2} boxSize="22px" />
                              <Text fontSize="11px" fontWeight="700">Click for Full View</Text>
                            </Flex>
                          </Box>
                        ) : (
                          <Flex h="170px" bg={useColorModeValue('gray.100', 'gray.800')} borderRadius="lg" align="center" justify="center" direction="column" color={mutedColor}>
                            <Icon as={FiCamera} boxSize="28px" mb={1} opacity={0.5} />
                            <Text fontSize="11px">No passport photo uploaded</Text>
                          </Flex>
                        )}
                      </Box>
                      {selectedStudent.passportPhoto && (
                        <ButtonGroup size="xs" mt={3} isAttached w="full">
                          <Button
                            flex="1"
                            colorScheme="indigo"
                            bg="#4F46E5"
                            _hover={{ bg: '#4338CA' }}
                            color="white"
                            leftIcon={<FiMaximize2 />}
                            onClick={() => handleOpenFullImage(selectedStudent.passportPhoto, '3×4 Passport Photo', selectedStudent.fullName)}
                          >
                            Full View
                          </Button>
                          <Button
                            variant="outline"
                            borderColor={borderColor}
                            leftIcon={<FiDownload />}
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = selectedStudent.passportPhoto;
                              link.download = `Passport_Photo_${selectedStudent.fullName.replace(/\s+/g, '_')}.png`;
                              link.click();
                            }}
                          >
                            Download
                          </Button>
                        </ButtonGroup>
                      )}
                    </Box>

                    {/* 2. National ID / Kebele Card */}
                    <Box
                      border="1px solid"
                      borderColor={selectedStudent.nationalIdImage ? '#C7D2FE' : borderColor}
                      borderRadius="xl"
                      p={3}
                      bg={cardBg}
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      transition="all 0.2s"
                      _hover={{ borderColor: '#4F46E5', boxShadow: 'md' }}
                    >
                      <Box>
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontSize="12px" fontWeight="800" color={textColor}>
                            National ID / Kebele
                          </Text>
                          {selectedStudent.nationalIdImage ? (
                            <Badge colorScheme="green" fontSize="10px">Available</Badge>
                          ) : (
                            <Badge colorScheme="gray" fontSize="10px">Not Provided</Badge>
                          )}
                        </Flex>
                        {selectedStudent.nationalIdImage ? (
                          <Box
                            position="relative"
                            borderRadius="lg"
                            overflow="hidden"
                            bg="blackAlpha.900"
                            cursor="zoom-in"
                            onClick={() => handleOpenFullImage(selectedStudent.nationalIdImage, 'National ID / Kebele Card', selectedStudent.fullName)}
                            role="group"
                          >
                            <Image
                              src={selectedStudent.nationalIdImage}
                              alt="National ID"
                              h="170px"
                              w="100%"
                              objectFit="contain"
                              transition="transform 0.2s"
                              _groupHover={{ transform: 'scale(1.05)', opacity: 0.9 }}
                            />
                            <Flex
                              position="absolute"
                              inset={0}
                              bg="blackAlpha.600"
                              opacity={0}
                              _groupHover={{ opacity: 1 }}
                              transition="opacity 0.2s"
                              align="center"
                              justify="center"
                              color="white"
                              direction="column"
                              gap={1}
                            >
                              <Icon as={FiMaximize2} boxSize="22px" />
                              <Text fontSize="11px" fontWeight="700">Click for Full View</Text>
                            </Flex>
                          </Box>
                        ) : (
                          <Flex h="170px" bg={useColorModeValue('gray.100', 'gray.800')} borderRadius="lg" align="center" justify="center" direction="column" color={mutedColor}>
                            <Icon as={FiFileText} boxSize="28px" mb={1} opacity={0.5} />
                            <Text fontSize="11px">No National ID uploaded</Text>
                          </Flex>
                        )}
                      </Box>
                      {selectedStudent.nationalIdImage && (
                        <ButtonGroup size="xs" mt={3} isAttached w="full">
                          <Button
                            flex="1"
                            colorScheme="indigo"
                            bg="#4F46E5"
                            _hover={{ bg: '#4338CA' }}
                            color="white"
                            leftIcon={<FiMaximize2 />}
                            onClick={() => handleOpenFullImage(selectedStudent.nationalIdImage, 'National ID / Kebele Card', selectedStudent.fullName)}
                          >
                            Full View
                          </Button>
                          <Button
                            variant="outline"
                            borderColor={borderColor}
                            leftIcon={<FiDownload />}
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = selectedStudent.nationalIdImage;
                              link.download = `National_ID_${selectedStudent.fullName.replace(/\s+/g, '_')}.png`;
                              link.click();
                            }}
                          >
                            Download
                          </Button>
                        </ButtonGroup>
                      )}
                    </Box>

                    {/* 3. Payment Receipt Screenshot */}
                    <Box
                      border="1px solid"
                      borderColor={selectedStudent.paymentScreenshot ? '#C7D2FE' : borderColor}
                      borderRadius="xl"
                      p={3}
                      bg={cardBg}
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      transition="all 0.2s"
                      _hover={{ borderColor: '#4F46E5', boxShadow: 'md' }}
                    >
                      <Box>
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontSize="12px" fontWeight="800" color={textColor}>
                            Bank Payment Receipt
                          </Text>
                          {selectedStudent.paymentScreenshot ? (
                            <Badge colorScheme="green" fontSize="10px">Available</Badge>
                          ) : (
                            <Badge colorScheme="gray" fontSize="10px">Not Provided</Badge>
                          )}
                        </Flex>
                        {selectedStudent.paymentScreenshot ? (
                          <Box
                            position="relative"
                            borderRadius="lg"
                            overflow="hidden"
                            bg="blackAlpha.900"
                            cursor="zoom-in"
                            onClick={() => handleOpenFullImage(selectedStudent.paymentScreenshot, 'Bank Payment Receipt', selectedStudent.fullName)}
                            role="group"
                          >
                            <Image
                              src={selectedStudent.paymentScreenshot}
                              alt="Payment Receipt"
                              h="170px"
                              w="100%"
                              objectFit="contain"
                              transition="transform 0.2s"
                              _groupHover={{ transform: 'scale(1.05)', opacity: 0.9 }}
                            />
                            <Flex
                              position="absolute"
                              inset={0}
                              bg="blackAlpha.600"
                              opacity={0}
                              _groupHover={{ opacity: 1 }}
                              transition="opacity 0.2s"
                              align="center"
                              justify="center"
                              color="white"
                              direction="column"
                              gap={1}
                            >
                              <Icon as={FiMaximize2} boxSize="22px" />
                              <Text fontSize="11px" fontWeight="700">Click for Full View</Text>
                            </Flex>
                          </Box>
                        ) : (
                          <Flex h="170px" bg={useColorModeValue('gray.100', 'gray.800')} borderRadius="lg" align="center" justify="center" direction="column" color={mutedColor}>
                            <Icon as={FiDollarSign} boxSize="28px" mb={1} opacity={0.5} />
                            <Text fontSize="11px">No receipt screenshot uploaded</Text>
                          </Flex>
                        )}
                      </Box>
                      {selectedStudent.paymentScreenshot && (
                        <ButtonGroup size="xs" mt={3} isAttached w="full">
                          <Button
                            flex="1"
                            colorScheme="indigo"
                            bg="#4F46E5"
                            _hover={{ bg: '#4338CA' }}
                            color="white"
                            leftIcon={<FiMaximize2 />}
                            onClick={() => handleOpenFullImage(selectedStudent.paymentScreenshot, 'Bank Payment Receipt', selectedStudent.fullName)}
                          >
                            Full View
                          </Button>
                          <Button
                            variant="outline"
                            borderColor={borderColor}
                            leftIcon={<FiDownload />}
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = selectedStudent.paymentScreenshot;
                              link.download = `Payment_Receipt_${selectedStudent.fullName.replace(/\s+/g, '_')}.png`;
                              link.click();
                            }}
                          >
                            Download
                          </Button>
                        </ButtonGroup>
                      )}
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Personal & Course Info */}
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  <Box p={3} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                    <Text fontSize="10px" fontWeight="800" color={mutedColor} textTransform="uppercase">
                      Contact Information
                    </Text>
                    <Text fontSize="13px" fontWeight="700" color={textColor} mt={1}>
                      {selectedStudent.fullName}
                    </Text>
                    <Text fontSize="12px" color={textColor} mt={0.5}>
                      Phone: {selectedStudent.phone || 'N/A'}
                    </Text>
                    <Text fontSize="12px" color={textColor} mt={0.5}>
                      Email: {selectedStudent.email || 'N/A'}
                    </Text>
                    <Text fontSize="11px" color={mutedColor} mt={0.5}>
                      Gender: {selectedStudent.gender || 'Not specified'}
                    </Text>
                  </Box>

                  <Box p={3} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                    <Text fontSize="10px" fontWeight="800" color={mutedColor} textTransform="uppercase">
                      Academic Details
                    </Text>
                    <Text fontSize="13px" fontWeight="700" color={textColor} mt={1}>
                      {selectedStudent.learningDepartment || 'General'}
                    </Text>
                    <Text fontSize="12px" color={textColor} mt={0.5}>
                      Program: {selectedStudent.program || 'N/A'}
                    </Text>
                    <Text fontSize="12px" color={textColor} mt={0.5}>
                      Shift / Slot: {selectedStudent.preferredTimeSlot || 'Morning'}
                    </Text>
                    <Text fontSize="11px" color={mutedColor} mt={0.5}>
                      Readiness: {selectedStudent.readinessStatus || 'In preparation'}
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* Dates & Registrar */}
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  <Box p={3} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                    <Text fontSize="10px" fontWeight="800" color={mutedColor} textTransform="uppercase">
                      Important Dates
                    </Text>
                    <Text fontSize="12px" color={textColor} mt={1}>
                      Registered: <b>{formatDateTime(selectedStudent.createdAt)}</b>
                    </Text>
                    <Text fontSize="12px" color={textColor} mt={0.5}>
                      Enrolled: <b>{formatDate(selectedStudent.enrollmentDate)}</b>
                    </Text>
                    <Text fontSize="12px" color={textColor} mt={0.5}>
                      Exam Date: <b>{formatDate(selectedStudent.examDate)}</b>
                    </Text>
                  </Box>

                  <Box p={3} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                    <Text fontSize="10px" fontWeight="800" color={mutedColor} textTransform="uppercase">
                      Registration Metadata
                    </Text>
                    <Text fontSize="12px" color={textColor} mt={1}>
                      Registered By: <b>{selectedStudent.registeredBy || 'Customer Success'}</b>
                    </Text>
                    <Text fontSize="11px" color={mutedColor} mt={0.5}>
                      Agent Email: {selectedStudent.registeredByEmail || 'N/A'}
                    </Text>
                    {selectedStudent.updatedBy && (
                      <Text fontSize="11px" color={mutedColor} mt={0.5}>
                        Last Updated By: {selectedStudent.updatedBy}
                      </Text>
                    )}
                  </Box>
                </SimpleGrid>

                {/* Financial Details */}
                <Box p={3} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="10px" fontWeight="800" color={mutedColor} textTransform="uppercase" mb={2}>
                    Payment & Bank Information
                  </Text>
                  <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={2}>
                    <Box>
                      <Text fontSize="10px" color={mutedColor}>Option</Text>
                      <Text fontSize="12px" fontWeight="700">{selectedStudent.paymentOption || 'Full Payment'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="10px" color={mutedColor}>Bank</Text>
                      <Text fontSize="12px" fontWeight="700">{selectedStudent.paymentBank || 'N/A'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="10px" color={mutedColor}>FS / Receipt #</Text>
                      <Text fontSize="12px" fontWeight="700">{selectedStudent.fsNumber || 'N/A'}</Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Notes */}
                {selectedStudent.notes && (
                  <Box p={3} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                    <Text fontSize="10px" fontWeight="800" color={mutedColor} textTransform="uppercase">
                      Notes & Instructions
                    </Text>
                    <Text fontSize="12px" mt={1}>
                      {selectedStudent.notes}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter borderTop="1px solid" borderColor={borderColor}>
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Full View Image Lightbox Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={onImageModalClose}
        size="5xl"
        isCentered
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.88)" backdropFilter="blur(8px)" />
        <ModalContent
          bg="#0B0F19"
          color="white"
          borderRadius="2xl"
          overflow="hidden"
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.7)"
          border="1px solid rgba(255, 255, 255, 0.12)"
          maxW={{ base: '95vw', md: '85vw', lg: '1100px' }}
        >
          <ModalHeader
            borderBottom="1px solid rgba(255, 255, 255, 0.1)"
            px={6}
            py={4}
            bg="#111827"
          >
            <Flex justify="space-between" align="center" pr={8}>
              <HStack spacing={3}>
                <Flex
                  w="36px"
                  h="36px"
                  borderRadius="lg"
                  bg="#4F46E5"
                  align="center"
                  justify="center"
                >
                  <Icon as={FiMaximize2} boxSize="18px" color="white" />
                </Flex>
                <Box>
                  <Heading size="sm" color="white" fontWeight="800">
                    {fullViewImage.title}
                  </Heading>
                  <Text fontSize="xs" color="gray.400" mt={0.5}>
                    Student: {fullViewImage.studentName}
                  </Text>
                </Box>
              </HStack>
              <HStack spacing={2}>
                <Button
                  size="xs"
                  colorScheme="indigo"
                  bg="#4F46E5"
                  _hover={{ bg: '#4338CA' }}
                  leftIcon={<FiDownload />}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = fullViewImage.url;
                    link.download = `${fullViewImage.title.replace(/\s+/g, '_')}_${fullViewImage.studentName.replace(/\s+/g, '_')}.png`;
                    link.click();
                  }}
                >
                  Download
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="rgba(255, 255, 255, 0.2)"
                  color="white"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                  leftIcon={<FiExternalLink />}
                  onClick={() => {
                    const win = window.open();
                    win.document.write(`<img src="${fullViewImage.url}" style="max-width:100%; height:auto; margin:auto; display:block;" />`);
                  }}
                >
                  Open in Tab
                </Button>
              </HStack>
            </Flex>
          </ModalHeader>
          <ModalCloseButton color="white" top="14px" right="16px" />
          <ModalBody
            p={6}
            display="flex"
            justifyContent="center"
            alignItems="center"
            bg="#030712"
            minH="450px"
          >
            <Image
              src={fullViewImage.url}
              alt={fullViewImage.title}
              maxH="75vh"
              maxW="100%"
              objectFit="contain"
              borderRadius="lg"
              boxShadow="0 10px 30px rgba(0,0,0,0.5)"
              transition="transform 0.2s"
              _hover={{ transform: 'scale(1.02)' }}
            />
          </ModalBody>
          <ModalFooter
            borderTop="1px solid rgba(255, 255, 255, 0.1)"
            bg="#111827"
            justifyContent="space-between"
            px={6}
            py={3}
          >
            <Text fontSize="xs" color="gray.400">
              High resolution verification document viewer • Tessbin Admin
            </Text>
            <Button size="sm" variant="ghost" color="gray.300" onClick={onImageModalClose}>
              Close Preview
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
