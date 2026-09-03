import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  ButtonGroup,
  Input,
  Select,
  HStack,
  VStack,
  Icon,
  IconButton,
  Tooltip,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useColorModeValue,
  Card,
  CardBody,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Avatar,
  Image,
  Tag,
  TagLabel,
  TagCloseButton,
  Divider,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiMaximize2,
  FiExternalLink,
  FiCamera,
  FiFileText,
  FiDollarSign,
  FiAward,
  FiCheckCircle,
  FiCalendar,
  FiUserCheck,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
  FiX,
  FiBookOpen,
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { getStudentRegistrations, getStudentRegistrationById } from '../../services/studentRegistrationService';

export default function TessbinCOCStudentsListView() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [timePeriodFilter, setTimePeriodFilter] = useState('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Lightbox Modal for Full View Images
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

  const handleOpenStudentDetail = async (student) => {
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

  const handleOpenFullImage = (url, title, studentName) => {
    if (!url) return;
    setFullViewImage({
      url,
      title: title || 'Verification Document',
      studentName: studentName || selectedStudent?.fullName || 'Student',
    });
    onImageModalOpen();
  };

  // Theme colors
  const cardBg = useColorModeValue('white', '#1E293B');
  const headerBg = useColorModeValue('#F8FAFC', '#0F172A');
  const borderColor = useColorModeValue('#E2E8F0', '#334155');
  const textColor = useColorModeValue('#0F172A', '#F8FAFC');
  const mutedColor = useColorModeValue('#64748B', '#94A3B8');
  const hoverRowBg = useColorModeValue('#F1F5F9', '#1E293B');

  // Fetch COC Paid Students
  const fetchCocPaidStudents = async () => {
    setLoading(true);
    try {
      // Backend supports filtering directly by cocPaymentStatus=Paid
      const data = await getStudentRegistrations({ cocPaymentStatus: 'Paid' });
      const rawList = Array.isArray(data) ? data : [];
      // Ensure only strictly COC Paid students are displayed
      const paidOnly = rawList.filter((s) => {
        const acceptedCourses = [
          'coffeecupping',
          'coffeeindustrycuppingandqualityassessment',
        ];
        const isCoffeeCupping = [s.learningDepartment, s.program].some((value) =>
          acceptedCourses.includes(
            (value || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '')
          )
        );
        return isCoffeeCupping &&
          (s.cocPaymentStatus || '').toString().trim().toLowerCase() === 'paid';
      });
      // Sort latest to oldest
      paidOnly.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setStudents(paidOnly);
    } catch (error) {
      toast({
        title: 'Failed to load COC Students List',
        description: error.message || 'Please check your connection and try again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCocPaidStudents();
  }, []);

  // Time Period Helper
  const parseDate = (d) => (d ? new Date(d) : null);

  const filterByTimePeriod = (dateStr, period) => {
    if (!dateStr || period === 'ALL') return true;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return true;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    switch (period) {
      case 'TODAY':
        return date >= todayStart && date < todayEnd;
      case 'YESTERDAY': {
        const yStart = new Date(todayStart.getTime() - 86400000);
        return date >= yStart && date < todayStart;
      }
      case 'THIS_WEEK': {
        const dayOfWeek = todayStart.getDay(); // 0 is Sunday
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(todayStart.getTime() - diffToMonday * 86400000);
        return date >= weekStart;
      }
      case 'LAST_WEEK': {
        const dayOfWeek = todayStart.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const thisWeekStart = new Date(todayStart.getTime() - diffToMonday * 86400000);
        const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400000);
        return date >= lastWeekStart && date < thisWeekStart;
      }
      case 'PAST_7_DAYS': {
        const past7 = new Date(now.getTime() - 7 * 86400000);
        return date >= past7;
      }
      case 'THIS_MONTH':
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      case 'MONTH_2026_08':
        return date.getFullYear() === 2026 && date.getMonth() === 7; // Aug = 7
      case 'MONTH_2026_07':
        return date.getFullYear() === 2026 && date.getMonth() === 6; // Jul = 6
      case 'MONTH_2026_06':
        return date.getFullYear() === 2026 && date.getMonth() === 5; // Jun = 5
      case 'YEAR_2026':
        return date.getFullYear() === 2026;
      case 'YEAR_2025':
        return date.getFullYear() === 2025;
      case 'CUSTOM': {
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(customStartDate) : new Date(0);
        const end = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : new Date(8640000000000000);
        return date >= start && date <= end;
      }
      default:
        return true;
    }
  };

  // Distinct Departments
  const departments = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.learningDepartment) set.add(s.learningDepartment);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (student.fullName || '').toLowerCase().includes(q);
        const matchesId = (student.studentId || '').toLowerCase().includes(q);
        const matchesPhone = (student.phone || '').toLowerCase().includes(q);
        const matchesEmail = (student.email || '').toLowerCase().includes(q);
        const matchesAgent = (student.registeredBy || '').toLowerCase().includes(q);
        const matchesDept = (student.learningDepartment || '').toLowerCase().includes(q);
        const matchesBank = (student.paymentBank || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPhone && !matchesEmail && !matchesAgent && !matchesDept && !matchesBank) {
          return false;
        }
      }

      // 2. Time Period
      const dateToUse = student.createdAt || student.enrollmentDate;
      if (!filterByTimePeriod(dateToUse, timePeriodFilter)) {
        return false;
      }

      // 3. Department
      if (departmentFilter !== 'ALL' && student.learningDepartment !== departmentFilter) {
        return false;
      }

      // 4. Shift
      if (shiftFilter !== 'ALL' && student.preferredTimeSlot !== shiftFilter) {
        return false;
      }

      return true;
    });
  }, [students, searchQuery, timePeriodFilter, customStartDate, customEndDate, departmentFilter, shiftFilter]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, timePeriodFilter, customStartDate, customEndDate, departmentFilter, shiftFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalPaid = students.length;
    const importExport = students.filter(
      (s) => (s.learningDepartment || '').toLowerCase().includes('import') || (s.learningDepartment || '').toLowerCase().includes('export')
    ).length;
    const coffeeCupping = students.filter(
      (s) => (s.learningDepartment || '').toLowerCase().includes('coffee')
    ).length;
    const now = new Date();
    const thisMonth = students.filter((s) => {
      const d = parseDate(s.createdAt);
      return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;

    return { totalPaid, importExport, coffeeCupping, thisMonth };
  }, [students]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredStudents.map((s, idx) => ({
        '#': idx + 1,
        'Student ID': s.studentId || 'N/A',
        'Full Name': s.fullName || 'N/A',
        'Gender': s.gender || 'N/A',
        'Phone': s.phone || 'N/A',
        'Email': s.email || 'N/A',
        'Learning Department': s.learningDepartment || 'N/A',
        'Shift / Slot': s.preferredTimeSlot || 'Morning',
        'Registered By (CS Agent)': s.registeredBy || 'Customer Success',
        'Registered Date': s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
        'Payment Option': s.paymentOption || 'Full Payment',
        'General Payment Status': s.paymentStatus || 'Waiting',
        'COC Payment Status': 'PAID',
        'Class Completion': s.classCompletionStatus || (s.classCompleted ? 'Completed' : 'In Progress'),
        'FS / Receipt #': s.fsNumber || 'N/A',
        'Bank': s.paymentBank || 'N/A',
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'COC_Paid_Students');
      const filename = `Tessbin_COC_Paid_Students_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Export Successful',
        description: `Exported ${dataToExport.length} COC Paid student records to Excel.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error.message || 'Unable to generate Excel file.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setTimePeriodFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setDepartmentFilter('ALL');
    setShiftFilter('ALL');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    timePeriodFilter !== 'ALL' ||
    departmentFilter !== 'ALL' ||
    shiftFilter !== 'ALL';

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const selectedNationalIdFront = selectedStudent?.nationalIdFrontImage || selectedStudent?.nationalIdImage || '';
  const selectedNationalIdBack = selectedStudent?.nationalIdBackImage || '';

  return (
    <Box p={{ base: 4, md: 6 }} maxW="100%" mx="auto">
      {/* Read-Only Notice & Banner */}
      <Box
        mb={6}
        p={4}
        borderRadius="2xl"
        bgGradient="linear(to-r, #064E3B, #047857)"
        color="white"
        boxShadow="0 10px 25px -5px rgba(5, 150, 105, 0.3)"
        border="1px solid rgba(255, 255, 255, 0.15)"
      >
        <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
          <HStack spacing={3.5}>
            <Flex
              w="48px"
              h="48px"
              borderRadius="xl"
              bg="rgba(255, 255, 255, 0.2)"
              align="center"
              justify="center"
              backdropFilter="blur(10px)"
            >
              <Icon as={FiAward} boxSize="26px" color="white" />
            </Flex>
            <Box>
              <HStack spacing={2}>
                <Heading size="md" fontWeight="900" letterSpacing="tight">
                  COC Students List
                </Heading>
                <Badge colorScheme="green" bg="#10B981" color="white" fontSize="11px" px={2.5} py={0.5} borderRadius="full" fontWeight="800">
                  COC PAID ONLY
                </Badge>
                <Badge colorScheme="purple" bg="rgba(255,255,255,0.25)" color="white" fontSize="11px" px={2.5} py={0.5} borderRadius="full" fontWeight="800">
                  READ-ONLY
                </Badge>
              </HStack>
              <Text fontSize="12px" color="whiteAlpha.900" mt={1}>
                Shows only students whose COC fees are verified as <b>PAID</b> from Customer Service registration. This view is read-only for Tessbin Admin.
              </Text>
            </Box>
          </HStack>

          <HStack spacing={2} alignSelf={{ base: 'stretch', md: 'auto' }} justify={{ base: 'flex-end', md: 'flex-start' }}>
            <Button
              size="sm"
              leftIcon={<FiRefreshCw />}
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={fetchCocPaidStudents}
              isLoading={loading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              leftIcon={<FiDownload />}
              bg="white"
              color="#065F46"
              _hover={{ bg: 'gray.100' }}
              fontWeight="800"
              onClick={handleExportExcel}
              isDisabled={filteredStudents.length === 0}
            >
              Export Excel
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* KPI Stats Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="sm">
          <CardBody p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="11px" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="wider">
                  Total COC Paid
                </Text>
                <Heading size="lg" color="#059669" fontWeight="900" mt={1}>
                  {stats.totalPaid}
                </Heading>
                <Text fontSize="11px" color={mutedColor} mt={0.5}>
                  Verified from Customer Service
                </Text>
              </Box>
              <Flex w="46px" h="46px" bg="#ECFDF5" color="#059669" borderRadius="xl" align="center" justify="center">
                <Icon as={FiCheckCircle} boxSize="24px" />
              </Flex>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="sm">
          <CardBody p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="11px" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="wider">
                  Import & Export
                </Text>
                <Heading size="lg" color="#2563EB" fontWeight="900" mt={1}>
                  {stats.importExport}
                </Heading>
                <Text fontSize="11px" color={mutedColor} mt={0.5}>
                  COC fee completed
                </Text>
              </Box>
              <Flex w="46px" h="46px" bg="#EFF6FF" color="#2563EB" borderRadius="xl" align="center" justify="center">
                <Icon as={FiBookOpen} boxSize="24px" />
              </Flex>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="sm">
          <CardBody p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="11px" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="wider">
                  Coffee Cupping
                </Text>
                <Heading size="lg" color="#D97706" fontWeight="900" mt={1}>
                  {stats.coffeeCupping}
                </Heading>
                <Text fontSize="11px" color={mutedColor} mt={0.5}>
                  COC fee completed
                </Text>
              </Box>
              <Flex w="46px" h="46px" bg="#FFFBEB" color="#D97706" borderRadius="xl" align="center" justify="center">
                <Icon as={FiAward} boxSize="24px" />
              </Flex>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" boxShadow="sm">
          <CardBody p={4}>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="11px" fontWeight="700" color={mutedColor} textTransform="uppercase" letterSpacing="wider">
                  Registered This Month
                </Text>
                <Heading size="lg" color="#7C3AED" fontWeight="900" mt={1}>
                  {stats.thisMonth}
                </Heading>
                <Text fontSize="11px" color={mutedColor} mt={0.5}>
                  Current month intake
                </Text>
              </Box>
              <Flex w="46px" h="46px" bg="#F5F3FF" color="#7C3AED" borderRadius="xl" align="center" justify="center">
                <Icon as={FiCalendar} boxSize="24px" />
              </Flex>
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Enterprise Filter Control Bar */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" mb={5} boxShadow="sm">
        <CardBody p={4}>
          <VStack spacing={3} align="stretch">
            <Flex
              direction={{ base: 'column', md: 'row' }}
              gap={3}
              align={{ base: 'stretch', md: 'center' }}
              wrap="wrap"
            >
              {/* Search input */}
              <Box flex="1" minW={{ base: '100%', md: '280px' }}>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color={mutedColor} />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by student name, ID, phone, email, agent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    borderRadius="lg"
                    borderColor={borderColor}
                    _focus={{ borderColor: '#059669', boxShadow: '0 0 0 1px #059669' }}
                  />
                  {searchQuery && (
                    <InputRightElement>
                      <IconButton
                        aria-label="Clear search"
                        icon={<FiX />}
                        size="xs"
                        variant="ghost"
                        onClick={() => setSearchQuery('')}
                      />
                    </InputRightElement>
                  )}
                </InputGroup>
              </Box>

              {/* Standard Time Period Dropdown */}
              <Box minW={{ base: '100%', sm: '180px' }}>
                <Select
                  size="sm"
                  borderRadius="lg"
                  borderColor={borderColor}
                  value={timePeriodFilter}
                  onChange={(e) => setTimePeriodFilter(e.target.value)}
                  fontWeight="600"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="YESTERDAY">Yesterday</option>
                  <option value="THIS_WEEK">This Week</option>
                  <option value="LAST_WEEK">Last Week</option>
                  <option value="PAST_7_DAYS">Past 7 Days</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="MONTH_2026_08">August 2026</option>
                  <option value="MONTH_2026_07">July 2026</option>
                  <option value="MONTH_2026_06">June 2026</option>
                  <option value="YEAR_2026">Year 2026</option>
                  <option value="YEAR_2025">Year 2025</option>
                  <option value="CUSTOM">Custom Date Range...</option>
                </Select>
              </Box>

              {/* Department Dropdown */}
              <Box minW={{ base: '100%', sm: '170px' }}>
                <Select
                  size="sm"
                  borderRadius="lg"
                  borderColor={borderColor}
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  fontWeight="600"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </Select>
              </Box>

              {/* Shift Dropdown */}
              <Box minW={{ base: '100%', sm: '140px' }}>
                <Select
                  size="sm"
                  borderRadius="lg"
                  borderColor={borderColor}
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  fontWeight="600"
                >
                  <option value="ALL">All Shifts</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Weekend">Weekend</option>
                </Select>
              </Box>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  leftIcon={<FiX />}
                  onClick={handleResetFilters}
                  fontWeight="700"
                >
                  Reset All
                </Button>
              )}
            </Flex>

            {/* Custom Date Range Picker */}
            {timePeriodFilter === 'CUSTOM' && (
              <Flex gap={3} align="center" wrap="wrap" p={3} bg={headerBg} borderRadius="lg" border="1px dashed" borderColor={borderColor}>
                <Text fontSize="12px" fontWeight="700" color={mutedColor}>
                  Custom Range:
                </Text>
                <HStack spacing={2}>
                  <Text fontSize="11px">From:</Text>
                  <Input
                    type="date"
                    size="xs"
                    w="150px"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    borderRadius="md"
                  />
                </HStack>
                <HStack spacing={2}>
                  <Text fontSize="11px">To:</Text>
                  <Input
                    type="date"
                    size="xs"
                    w="150px"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    borderRadius="md"
                  />
                </HStack>
              </Flex>
            )}

            {/* Filter Summary & Active Tags */}
            <Flex justify="space-between" align="center" pt={1} wrap="wrap" gap={2}>
              <HStack spacing={2} wrap="wrap">
                <Text fontSize="11px" fontWeight="700" color={mutedColor}>
                  Showing: <b>{filteredStudents.length}</b> of <b>{students.length}</b> COC Paid Students
                </Text>
                {timePeriodFilter !== 'ALL' && (
                  <Tag size="sm" colorScheme="green" borderRadius="full">
                    <TagLabel>Period: {timePeriodFilter.replace('_', ' ')}</TagLabel>
                    <TagCloseButton onClick={() => setTimePeriodFilter('ALL')} />
                  </Tag>
                )}
                {departmentFilter !== 'ALL' && (
                  <Tag size="sm" colorScheme="blue" borderRadius="full">
                    <TagLabel>Dept: {departmentFilter}</TagLabel>
                    <TagCloseButton onClick={() => setDepartmentFilter('ALL')} />
                  </Tag>
                )}
                {shiftFilter !== 'ALL' && (
                  <Tag size="sm" colorScheme="purple" borderRadius="full">
                    <TagLabel>Shift: {shiftFilter}</TagLabel>
                    <TagCloseButton onClick={() => setShiftFilter('ALL')} />
                  </Tag>
                )}
              </HStack>
            </Flex>
          </VStack>
        </CardBody>
      </Card>

      {/* COC Paid Students Table */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" overflow="hidden" boxShadow="sm">
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead bg={headerBg}>
              <Tr>
                <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                  FULL NAME
                </Th>
                <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                  STUDENT ID
                </Th>
                <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                  CONTACT
                </Th>
                <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                  DEPARTMENT & SHIFT
                </Th>
                <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                  REGISTERED BY
                </Th>
                <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                  REGISTRATION DATE
                </Th>
                <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                  DOCUMENTS
                </Th>
                <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800">
                  COC STATUS
                </Th>
                <Th py={3.5} color={mutedColor} fontSize="11px" fontWeight="800" textAlign="right">
                  ACTION
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={8} py={12} textAlign="center">
                    <VStack spacing={2}>
                      <Icon as={FiRefreshCw} boxSize="24px" color="#059669" className="rotate" />
                      <Text fontSize="13px" color={mutedColor}>
                        Loading COC Paid students from Customer Service...
                      </Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : paginatedStudents.length === 0 ? (
                <Tr>
                  <Td colSpan={8} py={12} textAlign="center">
                    <VStack spacing={2}>
                      <Icon as={FiAward} boxSize="32px" color={mutedColor} opacity={0.5} />
                      <Heading size="sm" color={textColor}>
                        No COC Paid Students Found
                      </Heading>
                      <Text fontSize="12px" color={mutedColor} maxW="400px">
                        {hasActiveFilters
                          ? 'No records match your selected filter criteria. Try resetting filters.'
                          : 'No students with COC fee marked as Paid have been registered by Customer Service yet.'}
                      </Text>
                      {hasActiveFilters && (
                        <Button size="xs" colorScheme="green" mt={2} onClick={handleResetFilters}>
                          Reset All Filters
                        </Button>
                      )}
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                paginatedStudents.map((student) => {
                  const hasDocs = Boolean(student.hasPassportPhoto || student.hasNationalIdFrontImage || student.hasNationalIdBackImage || student.hasNationalIdImage || student.hasPaymentScreenshot || student.passportPhoto || student.nationalIdFrontImage || student.nationalIdBackImage || student.nationalIdImage || student.paymentScreenshot);
                  return (
                    <Tr
                      key={student._id || student.studentId}
                      _hover={{ bg: hoverRowBg }}
                      transition="background 0.15s"
                    >
                      {/* Full Name */}
                      <Td py={3}>
                        <Box>
                          <Text fontSize="13px" fontWeight="800" color={textColor}>
                            {student.fullName || 'Unnamed Student'}
                          </Text>
                          {student.gender && (
                            <Text fontSize="10px" color={mutedColor} mt={0.5}>
                              {student.gender}
                            </Text>
                          )}
                        </Box>
                      </Td>

                      {/* Student ID */}
                      <Td py={3}>
                        <Badge
                          colorScheme="purple"
                          fontSize="11px"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                          fontWeight="800"
                        >
                          {student.studentId || 'N/A'}
                        </Badge>
                      </Td>

                      {/* Contact */}
                      <Td py={3}>
                        <Text fontSize="12px" fontWeight="600" color={textColor}>
                          {student.phone || 'N/A'}
                        </Text>
                        <Text fontSize="11px" color={mutedColor}>
                          {student.email || 'N/A'}
                        </Text>
                      </Td>

                      {/* Department & Shift */}
                      <Td py={3}>
                        <Text fontSize="12px" fontWeight="700" color={textColor}>
                          {student.learningDepartment || 'General'}
                        </Text>
                        <HStack spacing={1} mt={0.5}>
                          <Icon as={FiClock} boxSize="11px" color={mutedColor} />
                          <Text fontSize="11px" color={mutedColor}>
                            {student.preferredTimeSlot || 'Morning'}
                          </Text>
                        </HStack>
                      </Td>

                      {/* Registered By */}
                      <Td py={3}>
                        <HStack spacing={1.5}>
                          <Icon as={FiUserCheck} color="#059669" boxSize="13px" />
                          <Text fontSize="12px" fontWeight="600" color={textColor}>
                            {student.registeredBy || 'Customer Success'}
                          </Text>
                        </HStack>
                        {student.registeredByEmail && (
                          <Text fontSize="10px" color={mutedColor}>
                            {student.registeredByEmail}
                          </Text>
                        )}
                      </Td>

                      {/* Registration Date */}
                      <Td py={3}>
                        <Text fontSize="12px" fontWeight="600" color={textColor}>
                          {formatDateTime(student.createdAt)}
                        </Text>
                      </Td>

                      {/* Verification Documents */}
                      <Td py={3}>
                        {hasDocs ? (
                          <Badge
                            colorScheme="purple"
                            fontSize="10px"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                            cursor="pointer"
                            onClick={() => handleOpenStudentDetail(student)}
                          >
                            Photos & Docs
                          </Badge>
                        ) : (
                          <Text fontSize="11px" color={mutedColor}>
                            None
                          </Text>
                        )}
                      </Td>

                      {/* COC Status */}
                      <Td py={3}>
                        <Badge
                          colorScheme="green"
                          bg="#10B981"
                          color="white"
                          fontSize="11px"
                          px={2.5}
                          py={1}
                          borderRadius="md"
                          fontWeight="800"
                          boxShadow="0 2px 6px rgba(16, 185, 129, 0.3)"
                        >
                          COC PAID
                        </Badge>
                      </Td>

                      {/* Actions */}
                      <Td py={3} textAlign="right">
                        <Button
                          size="xs"
                          colorScheme="green"
                          bg="#059669"
                          _hover={{ bg: '#047857' }}
                          color="white"
                          leftIcon={<FiMaximize2 />}
                          onClick={() => handleOpenStudentDetail(student)}
                          fontWeight="700"
                        >
                          Full View
                        </Button>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <Flex
            p={4}
            borderTop="1px solid"
            borderColor={borderColor}
            justify="space-between"
            align="center"
            wrap="wrap"
            gap={2}
          >
            <Text fontSize="12px" color={mutedColor}>
              Page <b>{currentPage}</b> of <b>{totalPages}</b> ({filteredStudents.length} total students)
            </Text>
            <HStack spacing={2}>
              <IconButton
                size="sm"
                icon={<FiChevronLeft />}
                aria-label="Previous Page"
                isDisabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              />
              <IconButton
                size="sm"
                icon={<FiChevronRight />}
                aria-label="Next Page"
                isDisabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              />
            </HStack>
          </Flex>
        )}
      </Card>

      {/* Read-Only Student Profile & Verification Documents Modal */}
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
                      border="2px solid #059669"
                      _hover={{ transform: 'scale(1.08)' }}
                      transition="all 0.15s"
                    />
                  </Tooltip>
                ) : (
                  <Flex w="44px" h="44px" bg="#ECFDF5" color="#059669" borderRadius="xl" align="center" justify="center">
                    <Icon as={FiAward} boxSize="22px" />
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
                {/* Status Bar */}
                <Flex
                  p={4}
                  bg={useColorModeValue('#F0FDF4', '#064E3B')}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="#86EFAC"
                  justify="space-between"
                  align="center"
                  wrap="wrap"
                  gap={3}
                >
                  <HStack spacing={2}>
                    <Icon as={FiCheckCircle} color="#059669" boxSize="18px" />
                    <Text fontSize="12px" fontWeight="800" color="#065F46">
                      COC PAYMENT VERIFIED
                    </Text>
                    <Badge colorScheme="green" bg="#10B981" color="white" fontSize="12px" px={2.5} py={0.5} borderRadius="md" fontWeight="800">
                      PAID
                    </Badge>
                  </HStack>
                  <HStack spacing={2} flexWrap="wrap">
                    <Badge colorScheme="blue" fontSize="11px" px={2.5} py={1} borderRadius="md" fontWeight="700">
                      Class: {selectedStudent.classCompletionStatus || (selectedStudent.classCompleted ? 'Completed' : 'In Progress')}
                    </Badge>
                    <Badge colorScheme="purple" fontSize="11px" px={2.5} py={1} borderRadius="md" fontWeight="700">
                      Fee Option: {selectedStudent.paymentOption || 'Full Payment'}
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
                      <Icon as={FiCamera} color="#059669" boxSize="18px" />
                      <Text fontSize="13px" fontWeight="800" color={textColor} textTransform="uppercase" letterSpacing="wide">
                        Student Verification Documents & Photos
                      </Text>
                    </HStack>
                    <Text fontSize="11px" color={mutedColor}>
                      Click any document to view full resolution
                    </Text>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
                    {/* 1. Passport Photo (3x4) */}
                    <Box
                      border="1px solid"
                      borderColor={selectedStudent.passportPhoto ? '#A7F3D0' : borderColor}
                      borderRadius="xl"
                      p={3}
                      bg={cardBg}
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      transition="all 0.2s"
                      _hover={{ borderColor: '#059669', boxShadow: 'md' }}
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
                            colorScheme="green"
                            bg="#059669"
                            _hover={{ bg: '#047857' }}
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

                    {/* 2. National ID / Kebele Card Front */}
                    <Box
                      border="1px solid"
                      borderColor={selectedNationalIdFront ? '#A7F3D0' : borderColor}
                      borderRadius="xl"
                      p={3}
                      bg={cardBg}
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      transition="all 0.2s"
                      _hover={{ borderColor: '#059669', boxShadow: 'md' }}
                    >
                      <Box>
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontSize="12px" fontWeight="800" color={textColor}>
                            National ID Front
                          </Text>
                          {selectedNationalIdFront ? (
                            <Badge colorScheme="green" fontSize="10px">Available</Badge>
                          ) : (
                            <Badge colorScheme="gray" fontSize="10px">Not Provided</Badge>
                          )}
                        </Flex>
                        {selectedNationalIdFront ? (
                          <Box
                            position="relative"
                            borderRadius="lg"
                            overflow="hidden"
                            bg="blackAlpha.900"
                            cursor="zoom-in"
                            onClick={() => handleOpenFullImage(selectedNationalIdFront, 'National ID Front', selectedStudent.fullName)}
                            role="group"
                          >
                            <Image
                              src={selectedNationalIdFront}
                              alt="National ID Front"
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
                            <Text fontSize="11px">No National ID front uploaded</Text>
                          </Flex>
                        )}
                      </Box>
                      {selectedNationalIdFront && (
                        <ButtonGroup size="xs" mt={3} isAttached w="full">
                          <Button
                            flex="1"
                            colorScheme="green"
                            bg="#059669"
                            _hover={{ bg: '#047857' }}
                            color="white"
                            leftIcon={<FiMaximize2 />}
                            onClick={() => handleOpenFullImage(selectedNationalIdFront, 'National ID Front', selectedStudent.fullName)}
                          >
                            Full View
                          </Button>
                          <Button
                            variant="outline"
                            borderColor={borderColor}
                            leftIcon={<FiDownload />}
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = selectedNationalIdFront;
                              link.download = `National_ID_Front_${selectedStudent.fullName.replace(/\s+/g, '_')}.png`;
                              link.click();
                            }}
                          >
                            Download
                          </Button>
                        </ButtonGroup>
                      )}
                    </Box>

                    {/* 3. National ID / Kebele Card Back */}
                    <Box border="1px solid" borderColor={selectedNationalIdBack ? '#A7F3D0' : borderColor} borderRadius="xl" p={3} bg={cardBg}>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="12px" fontWeight="800" color={textColor}>National ID Back</Text>
                        <Badge colorScheme={selectedNationalIdBack ? 'green' : 'gray'} fontSize="10px">
                          {selectedNationalIdBack ? 'Available' : 'Not Provided'}
                        </Badge>
                      </Flex>
                      {selectedNationalIdBack ? (
                        <>
                          <Box borderRadius="lg" overflow="hidden" bg="blackAlpha.900" cursor="zoom-in" onClick={() => handleOpenFullImage(selectedNationalIdBack, 'National ID Back', selectedStudent.fullName)}>
                            <Image src={selectedNationalIdBack} alt="National ID Back" h="170px" w="100%" objectFit="contain" />
                          </Box>
                          <Button size="xs" mt={3} w="full" colorScheme="green" leftIcon={<FiMaximize2 />} onClick={() => handleOpenFullImage(selectedNationalIdBack, 'National ID Back', selectedStudent.fullName)}>
                            Full View
                          </Button>
                        </>
                      ) : (
                        <Flex h="170px" bg={useColorModeValue('gray.100', 'gray.800')} borderRadius="lg" align="center" justify="center" direction="column" color={mutedColor}>
                          <Icon as={FiFileText} boxSize="28px" mb={1} opacity={0.5} />
                          <Text fontSize="11px">No National ID back uploaded</Text>
                        </Flex>
                      )}
                    </Box>

                    {/* 4. Payment Receipt Screenshot */}
                    <Box
                      border="1px solid"
                      borderColor={selectedStudent.paymentScreenshot ? '#A7F3D0' : borderColor}
                      borderRadius="xl"
                      p={3}
                      bg={cardBg}
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      transition="all 0.2s"
                      _hover={{ borderColor: '#059669', boxShadow: 'md' }}
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
                            colorScheme="green"
                            bg="#059669"
                            _hover={{ bg: '#047857' }}
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
                  </Box>
                </SimpleGrid>

                {/* Financial & COC Details */}
                <Box p={3} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                  <Text fontSize="10px" fontWeight="800" color={mutedColor} textTransform="uppercase" mb={2}>
                    Payment & COC Fee Information
                  </Text>
                  <SimpleGrid columns={{ base: 1, sm: 4 }} spacing={2}>
                    <Box>
                      <Text fontSize="10px" color={mutedColor}>COC Status</Text>
                      <Badge colorScheme="green" mt={0.5}>PAID</Badge>
                    </Box>
                    <Box>
                      <Text fontSize="10px" color={mutedColor}>Tuition Option</Text>
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
                  bg="#059669"
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
                  colorScheme="green"
                  bg="#059669"
                  _hover={{ bg: '#047857' }}
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
              High resolution verification document viewer • COC Paid Student
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
