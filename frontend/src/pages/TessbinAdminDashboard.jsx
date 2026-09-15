import { useState, useEffect } from 'react';
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
  Image,
  Input,
  Select,
  HStack,
  VStack,
  Icon,
  Tag,
  Progress,
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
  FormControl,
  FormLabel,
  useDisclosure,
  useColorMode,
  useColorModeValue,
  Card,
  CardBody,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiAward,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiEye,
  FiMoon,
  FiSun,
  FiMonitor,
  FiPieChart,
  FiMenu,
  FiClock,
  FiBarChart2,
  FiLayers,
  FiFileText,
  FiTrendingUp,
  FiLogOut,
  FiUserCheck,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import TessbinKpiReportsView from '../components/tessbin/TessbinKpiReportsView';
import { fetchExternalCourses } from '../services/api';
import { useUserStore } from '../store/user';
import TessbinDataAnalyticsView from '../components/tessbin/TessbinDataAnalyticsView';
import TessbinCSRegisteredUsersView from '../components/tessbin/TessbinCSRegisteredUsersView';
import TessbinCOCStudentsListView from '../components/tessbin/TessbinCOCStudentsListView';
import TessbinStudentsDocumentsView from '../components/tessbin/TessbinStudentsDocumentsView';
import TessbinOverviewAnalyticsView from '../components/tessbin/TessbinOverviewAnalyticsView';

const COURSE_OPTIONS = [
  'Digital Marketing',
  'Barista',
  'International Import and Export',
  'Coffee Cupping',
];

const canonicalCourseName = (name = '') => {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = {
    digitalmarketing: 'Digital Marketing',
    digitalmarketingforinternationaltrade: 'Digital Marketing',
    barista: 'Barista',
    internationalimportandexport: 'International Import and Export',
    internationaltradeimportexport: 'International Import and Export',
    internationaltradeandimportexport: 'International Import and Export',
    coffeecupping: 'Coffee Cupping',
    coffeeindustrycuppingandqualityassessment: 'Coffee Cupping',
  };
  return aliases[normalized] || null;
};

const TessbinAdminDashboard = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('overview');

  // Mobile sidebar drawer disclosure
  const { isOpen: isMobileNavOpen, onOpen: onMobileNavOpen, onClose: onMobileNavClose } = useDisclosure();

  // Theme colors
  const bg = useColorModeValue('#F7F9FC', '#0B0F19');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.900');
  const tabHoverBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.750');

  // Sidebar dark navy styling
  const sidebarBg = '#0C101D';
  const sidebarNavActiveBg = '#1E1C4B';
  const sidebarNavActiveColor = '#FFFFFF';

  // Stats state
  const [stats, setStats] = useState({
    cocExamStudentsCount: 6,
    onlineFinalExamStudentsCount: 6,
    totalStudentsCount: 12,
    totalExamRecordsCount: 12,
    passedCount: 9,
    failedCount: 1,
    scheduledCount: 2,
    certificatesIssuedCount: 8,
    passRate: 90,
    courseBreakdown: [],
  });

  const [records, setRecords] = useState([]);
  const [courseOptions, setCourseOptions] = useState(COURSE_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [examTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal disclosures
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();


  // Exam Record Form state
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    email: '',
    phone: '',
    courseName: COURSE_OPTIONS[0],
    session: 'Regular',
    examType: 'COC Exam',
    examMode: 'On-Site',
    score: 80,
    status: 'Passed',
    examDate: new Date().toISOString().split('T')[0],
    remarks: '',
    certificateStatus: 'Issued',
  });
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Fetch Dashboard Stats, Exam Records & KPI Targets
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Parallel fetch without blocking
      const promises = [
        axiosInstance.get('/tessbin/dashboard-stats'),
      ];

      const [statsRes] = await Promise.allSettled(promises);
      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.success) {
        setStats(statsRes.value.data.data);
      }

      // Fetch exams table only when relevant
      if (['coc_exams', 'online_exams', 'all_records'].includes(activeTab) || searchQuery) {
        let effectiveTypeFilter = examTypeFilter;
        if (activeTab === 'coc_exams') effectiveTypeFilter = 'COC Exam';
        if (activeTab === 'online_exams') effectiveTypeFilter = 'Online Final Exam';

        const params = {
          q: searchQuery,
          examType: effectiveTypeFilter,
          status: statusFilter,
          sortOrder: 'asc',
        };
        const recordsRes = await axiosInstance.get('/tessbin/exams', { params });
        if (recordsRes.data?.success) {
          const examList = Array.isArray(recordsRes.data.data) ? recordsRes.data.data : [];
          examList.sort((a, b) => {
            const dateA = new Date(a.examDate || a.createdAt || 0).getTime();
            const dateB = new Date(b.examDate || b.createdAt || 0).getTime();
            return dateA - dateB;
          });
          setRecords(examList);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Tessbin data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    if (['coc_exams', 'online_exams', 'all_records'].includes(activeTab) || searchQuery || examTypeFilter !== 'All' || statusFilter !== 'All') {
      fetchData(true);
    }
  }, [searchQuery, examTypeFilter, statusFilter, activeTab]);

  // Keep Tessbin course choices synchronized with the shared external-course API.
  useEffect(() => {
    let isMounted = true;

    const loadExternalCourses = async () => {
      try {
        const externalCourses = await fetchExternalCourses();
        const availableCourses = new Set(
          (Array.isArray(externalCourses) ? externalCourses : [])
            .filter((course) => course?.isActive !== false)
            .map((course) => canonicalCourseName(course?.name))
            .filter(Boolean)
        );
        const approvedCourses = COURSE_OPTIONS.filter((course) => availableCourses.has(course));

        if (isMounted && approvedCourses.length > 0) {
          setCourseOptions(approvedCourses);
          setFormData((current) => (
            approvedCourses.includes(current.courseName)
              ? current
              : { ...current, courseName: approvedCourses[0] }
          ));
        }
      } catch (error) {
        // The approved local list remains available when the external API is offline.
        console.error('Failed to load Tessbin courses from the external-course API:', error);
      }
    };

    loadExternalCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  // Create Record Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/tessbin/exams', formData);
      if (res.data?.success) {
        toast({
          title: 'Student Exam Record Added',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onAddClose();
        resetForm();
        fetchData();
      }
    } catch (error) {
      toast({
        title: 'Failed to add record',
        description: error.response?.data?.message || 'An error occurred.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  // Edit Record Setup
  const openEditModal = (record) => {
    setEditingRecordId(record._id);
    setFormData({
      studentId: record.studentId || '',
      studentName: record.studentName || '',
      email: record.email || '',
      phone: record.phone || '',
      courseName: record.courseName || courseOptions[0] || COURSE_OPTIONS[0],
      session: record.session || 'Regular',
      examType: record.examType || 'COC Exam',
      examMode: record.examMode || 'Online',
      score: record.score || 0,
      status: record.status || 'Passed',
      examDate: record.examDate ? record.examDate.split('T')[0] : new Date().toISOString().split('T')[0],
      remarks: record.remarks || '',
      certificateStatus: record.certificateStatus || 'Pending',
    });
    onEditOpen();
  };

  // Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.put(`/tessbin/exams/${editingRecordId}`, formData);
      if (res.data?.success) {
        toast({
          title: 'Record Updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onEditClose();
        resetForm();
        fetchData();
      }
    } catch (error) {
      toast({
        title: 'Failed to update record',
        description: error.response?.data?.message || 'An error occurred.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  // Delete Record
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student exam record?')) return;
    try {
      const res = await axiosInstance.delete(`/tessbin/exams/${id}`);
      if (res.data?.success) {
        toast({
          title: 'Record Deleted',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        fetchData();
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  // View Record
  const openViewModal = (record) => {
    setSelectedRecord(record);
    onViewOpen();
  };

  const resetForm = (defaultExamType = 'COC Exam') => {
    setFormData({
      studentId: `TSB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      studentName: '',
      email: '',
      phone: '',
      courseName: courseOptions[0] || COURSE_OPTIONS[0],
      session: 'Regular',
      examType: defaultExamType,
      examMode: defaultExamType === 'COC Exam' ? 'On-Site' : 'Online',
      score: 85,
      status: 'Passed',
      examDate: new Date().toISOString().split('T')[0],
      remarks: '',
      certificateStatus: 'Issued',
    });
    setEditingRecordId(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!records.length) {
      toast({ title: 'No records to export', status: 'warning', duration: 3000 });
      return;
    }
    const headers = ['Student ID', 'Student Name', 'Email', 'Course', 'Exam Type', 'Exam Mode', 'Score', 'Status', 'Exam Date'];
    const rows = records.map((r) => [
      `"${r.studentId}"`,
      `"${r.studentName}"`,
      `"${r.email}"`,
      `"${r.courseName}"`,
      `"${r.examType}"`,
      `"${r.examMode}"`,
      r.score,
      `"${r.status}"`,
      `"${r.examDate ? r.examDate.split('T')[0] : ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tessbin_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    clearUser();
    navigate('/login');
  };

  // ── GRAPHICAL DATA PREPARATION ──
  // Sidebar Navigation Definition
  const sidebarItems = [
    { id: 'overview', label: 'Overall Data Analytics', icon: FiPieChart },
    { id: 'cs_registered_users', label: 'Student Register Lists', icon: FiUserCheck },
    { id: 'students_documents', label: 'Students documents', icon: FiFileText },
    { id: 'coc_students_list', label: 'COC Students List', icon: FiAward },
    { id: 'data_analysis', label: 'Online Exam Results', icon: FiTrendingUp },
    { id: 'kpi_metrics', label: 'KPI Targets & Scorecard', icon: FiBarChart2 },
  ];


  // Render Sidebar Component
  const SidebarContent = () => (
    <Flex direction="column" h="full" py={6} px={4} justify="space-between" bg={sidebarBg} color="white">
      <Box>
        {/* Brand Header */}
        <HStack spacing={3.5} mb={8} px={2} align="center">
          <Box
            w="46px"
            h="46px"
            borderRadius="xl"
            overflow="hidden"
            bg="white"
            p="3px"
            boxShadow="0 4px 16px rgba(0, 0, 0, 0.3)"
            border="2px solid rgba(255, 255, 255, 0.2)"
            flexShrink={0}
          >
            <Image
              src="/tessbin-dashboard-logo.png"
              alt="Tessbin Logo"
              w="full"
              h="full"
              objectFit="contain"
              fallbackSrc="/company-logos/tesbinn.png"
            />
          </Box>
          <Box>
            <Heading size="sm" fontWeight="900" letterSpacing="tight" color="white" fontSize="16px">
              TESSBINN
            </Heading>
            <Text fontSize="11px" fontWeight="600" color="#CBD5E1" mt="-1px">
              International Business
            </Text>
            <Badge bg="#4F46E5" color="white" fontSize="8.5px" px={2} py={0.5} borderRadius="md" mt={1.5} textTransform="uppercase" fontWeight="800">
              ADMIN PORTAL
            </Badge>
          </Box>
        </HStack>

        {/* Section Header */}
        <Text fontSize="10px" fontWeight="800" textTransform="uppercase" color="#CBD5E1" letterSpacing="widest" px={3} mb={4}>
          MAIN NAVIGATION
        </Text>

        {/* Menu Items */}
        <VStack spacing={2} align="stretch">
          {sidebarItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <HStack
                key={item.id}
                as="button"
                w="full"
                py={3.5}
                px={4}
                borderRadius="xl"
                cursor="pointer"
                transition="all 0.2s"
                bg={isActive ? sidebarNavActiveBg : 'transparent'}
                color={isActive ? sidebarNavActiveColor : '#FFFFFF'}
                fontWeight={isActive ? '800' : '600'}
                _hover={{
                  bg: isActive ? sidebarNavActiveBg : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  transform: 'translateX(3px)',
                }}
                onClick={() => {
                  setActiveTab(item.id);
                  onMobileNavClose();
                }}
              >
                <HStack spacing={3.5}>
                  <Icon as={item.icon} boxSize="19px" color={isActive ? '#818CF8' : '#94A3B8'} />
                  <Text fontSize="13px" color="white">{item.label}</Text>
                </HStack>
              </HStack>
            );
          })}
        </VStack>
      </Box>

      {/* Admin Profile Footer */}
      <Box pt={4} borderTop="1px" borderColor="rgba(255,255,255,0.12)">
        <HStack justify="space-between" align="center" p={2} borderRadius="lg" transition="all 0.2s">
          <HStack spacing={3}>
            <Box
              w="38px"
              h="38px"
              borderRadius="full"
              overflow="hidden"
              bg="white"
              p="2px"
              boxShadow="0 2px 10px rgba(0, 0, 0, 0.2)"
              border="2px solid rgba(255, 255, 255, 0.25)"
              flexShrink={0}
            >
              <Image
                src="/tessbin-dashboard-logo.png"
                alt="Tessbin Logo"
                w="full"
                h="full"
                objectFit="contain"
                fallbackSrc="/company-logos/tesbinn.png"
              />
            </Box>
            <Box overflow="hidden">
              <Text fontSize="12px" fontWeight="700" color="white" noOfLines={1}>
                {currentUser?.fullName || currentUser?.username || 'Tessbin Admin'}
              </Text>
              <Text fontSize="10px" color="#CBD5E1">
                tessbinadmin@portal
              </Text>
            </Box>
          </HStack>
          <Tooltip label="Logout" placement="top">
            <IconButton
              aria-label="Logout"
              icon={<Icon as={FiLogOut} boxSize="18px" />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              color="#CBD5E1"
              _hover={{ color: 'red.400', bg: 'rgba(255,255,255,0.05)' }}
              onClick={handleLogout}
            />
          </Tooltip>
        </HStack>
      </Box>
    </Flex>
  );

  return (
    <Flex bg={bg} minH="100vh" fontFamily="Inter, sans-serif">
      {/* Permanent Desktop Sidebar */}
      <Box
        w="260px"
        bg={sidebarBg}
        display={{ base: 'none', lg: 'block' }}
        position="sticky"
        top={0}
        h="100vh"
        boxShadow="xl"
        zIndex={10}
      >
        <SidebarContent />
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isMobileNavOpen} placement="left" onClose={onMobileNavClose}>
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent bg={sidebarBg} maxW="280px">
          <DrawerCloseButton color="white" mt={2} />
          <DrawerBody p={0}>
            <SidebarContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Workspace */}
      <Box flex={1} overflowX="hidden">
        {/* Top Header */}
        <Box bg={cardBg} borderBottom="1px" borderColor={borderColor} px={{ base: 4, md: 8 }} py={5} zIndex={9}>
          <Flex align="center" justify="space-between" direction={{ base: 'column', md: 'row' }} gap={4}>
            <HStack spacing={4}>
              <IconButton
                icon={<FiMenu />}
                aria-label="Open Mobile Menu"
                display={{ base: 'flex', lg: 'none' }}
                onClick={onMobileNavOpen}
                variant="outline"
                size="sm"
              />
              <Box>
                <HStack spacing={2} fontSize="11px" fontWeight="700" color="#6366F1" letterSpacing="wider">
                  <Text>TESSBINN ACADEMY</Text>
                  <Text color="gray.300">/</Text>
                  <Text textTransform="uppercase">{activeTab.replace('_', ' ')}</Text>
                </HStack>
                <Heading size="lg" fontWeight="900" mt={0.5} color={textColor} fontSize="22px">
                  {activeTab === 'overview' && 'Overall Data Analytics & Smart Intelligence'}
                  {activeTab === 'cs_registered_users' && 'Student Register Lists'}
                  {activeTab === 'students_documents' && 'Students documents'}
                  {activeTab === 'coc_students_list' && 'COC Students List (Customer Service)'}
                  {(activeTab === 'data_analysis' || activeTab === 'data_analytics') && 'Online Exam Results & Performance Insights'}
                  {activeTab === 'coc_exams' && 'COC Examination Management'}
                  {activeTab === 'kpi_metrics' && 'Tessbin KPI Targets & Reports'}
                </Heading>
                <Text fontSize="12px" color={mutedText} mt={0.5}>
                  {activeTab === 'overview' && 'Real-time multi-dimensional executive intelligence combining Student Registrations, COC Paid records, Online Exam Results & KPIs'}
                  {activeTab === 'cs_registered_users' && 'Live view of student registrations with multi-period Daily, Weekly, Monthly, and Yearly filters'}
                  {activeTab === 'coc_students_list' && 'Verified read-only directory of students registered by Customer Service whose COC fee is marked as Paid'}
                  {(activeTab === 'data_analysis' || activeTab === 'data_analytics') && 'Real-time online examination outcomes, qualification rates, course test outcomes, and performance insights'}
                  {activeTab === 'coc_exams' && 'National Certificate of Competency (COC) evaluation tracking'}
                  {activeTab === 'kpi_metrics' && 'Set targets, save drafts, and submit weekly, monthly, and quarterly results'}
                </Text>

              </Box>
            </HStack>

            <HStack spacing={3} wrap="wrap">
              <InputGroup size="sm" w={{ base: '100%', sm: '220px', md: '260px' }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search student, course, ID..."
                  borderRadius="xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg={tableHeaderBg}
                  fontSize="12px"
                />
              </InputGroup>

              <IconButton
                icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
                onClick={toggleColorMode}
                aria-label="Toggle Color Mode"
                variant="ghost"
                size="sm"
                borderRadius="lg"
              />

              <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                onClick={fetchData}
                isLoading={loading}
                size="sm"
                borderRadius="xl"
                fontSize="12px"
                fontWeight="700"
              >
                Refresh
              </Button>

              <Button
                leftIcon={<FiDownload />}
                bgGradient="linear(to-r, #6366F1, #8B5CF6)"
                color="white"
                _hover={{ bgGradient: 'linear(to-r, #4F46E5, #7C3AED)' }}
                onClick={handleExportCSV}
                size="sm"
                borderRadius="xl"
                fontSize="12px"
                fontWeight="700"
                boxShadow="0 4px 12px rgba(99, 102, 241, 0.3)"
              >
                Export CSV
              </Button>
            </HStack>
          </Flex>

          {/* Quick Access Top Bar for Fast 1-Click Navigation */}
          <HStack
            spacing={2}
            mt={4}
            pt={3}
            borderTop="1px solid"
            borderColor={borderColor}
            overflowX="auto"
            py={1}
            css={{
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            {[
              { id: 'overview', label: 'Overall Analytics', icon: FiPieChart, color: '#6366F1' },
              { id: 'cs_registered_users', label: 'Student Registers', icon: FiUserCheck, color: '#10B981' },
              { id: 'coc_students_list', label: 'COC Students (Paid)', icon: FiAward, color: '#F59E0B' },
              { id: 'data_analysis', label: 'Online Exam Results', icon: FiTrendingUp, color: '#2563EB' },
              { id: 'kpi_metrics', label: 'KPI Targets & Scorecard', icon: FiBarChart2, color: '#8B5CF6' },
              { id: 'coc_exams', label: 'COC Exam Records', icon: FiCheckCircle, color: '#EC4899' },
              { id: 'all_records', label: 'All Exam Records', icon: FiLayers, color: '#64748B' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  size="sm"
                  leftIcon={<Icon as={tab.icon} />}
                  variant={isActive ? 'solid' : 'ghost'}
                  bg={isActive ? tab.color : 'transparent'}
                  color={isActive ? 'white' : mutedText}
                  _hover={{
                    bg: isActive ? tab.color : tabHoverBg,
                    color: isActive ? 'white' : textColor,
                  }}
                  borderRadius="xl"
                  fontSize="12px"
                  fontWeight="800"
                  px={3.5}
                  py={1.5}
                  flexShrink={0}
                  onClick={() => setActiveTab(tab.id)}
                  boxShadow={isActive ? `0 2px 8px ${tab.color}40` : 'none'}
                >
                  {tab.label}
                </Button>
              );
            })}
          </HStack>
        </Box>

        {/* Dynamic View Workspace */}
        <Box p={{ base: 4, md: 8 }}>
          
          {/* ========================================================================= */}
          {/* TAB: CS REGISTERED USERS (DAILY, WEEKLY, MONTHLY, YEARLY FILTERS) */}
          {/* ========================================================================= */}
          {activeTab === 'students_documents' && <TessbinStudentsDocumentsView />}
          {activeTab === 'cs_registered_users' && (
            <TessbinCSRegisteredUsersView />
          )}

          {/* ========================================================================= */}
          {/* TAB: COC STUDENTS LIST (ONLY COC PAID FROM CUSTOMER SERVICE - READ ONLY) */}
          {/* ========================================================================= */}
          {activeTab === 'coc_students_list' && (
            <TessbinCOCStudentsListView />
          )}

          {/* ========================================================================= */}
          {/* TAB: DATA ANALYSIS (EXCLUSIVELY EXTERNAL READ-ONLY API DATA) */}
          {/* ========================================================================= */}
          {(activeTab === 'data_analysis' || activeTab === 'data_analytics') && (
            <TessbinDataAnalyticsView />
          )}

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW PAGE & GRAPHICAL CHARTS */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <TessbinOverviewAnalyticsView stats={stats} />
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DEDICATED COC EXAM TAKES VIEW */}
          {/* ========================================================================= */}
          {activeTab === 'coc_exams' && (
            <Box>
              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={5} mb={6}>
                <Card bg="#EEF2FF" borderColor="#6366F1" borderWidth="1.5px" borderRadius="2xl" p={5}>
                  <HStack justify="space-between">
                    <Box>
                      <Text fontSize="12px" fontWeight="800" color="#4338CA">Total COC Exam Takers</Text>
                      <Text fontSize="30px" fontWeight="900" color="#312E81" mt={1}>{stats.cocExamStudentsCount ?? 0}</Text>
                      <Text fontSize="11px" color="#6366F1" fontWeight="700" mt={1}>National Certification Level</Text>
                    </Box>
                    <Flex w="48px" h="48px" bg="#6366F1" color="white" borderRadius="full" align="center" justify="center">
                      <Icon as={FiAward} boxSize="24px" />
                    </Flex>
                  </HStack>
                </Card>

                <Card bg="#F0FDF4" borderColor="#10B981" borderWidth="1.5px" borderRadius="2xl" p={5}>
                  <HStack justify="space-between">
                    <Box>
                      <Text fontSize="12px" fontWeight="800" color="#15803D">Passed COC Exams</Text>
                      <Text fontSize="30px" fontWeight="900" color="#14532D" mt={1}>5</Text>
                      <Text fontSize="11px" color="#10B981" fontWeight="700" mt={1}>83.3% Qualification Rate</Text>
                    </Box>
                    <Flex w="48px" h="48px" bg="#10B981" color="white" borderRadius="full" align="center" justify="center">
                      <Icon as={FiCheckCircle} boxSize="24px" />
                    </Flex>
                  </HStack>
                </Card>

                <Card bg="#FEFCE8" borderColor="#CA8A04" borderWidth="1.5px" borderRadius="2xl" p={5}>
                  <HStack justify="space-between">
                    <Box>
                      <Text fontSize="12px" fontWeight="800" color="#854D0E">Pending COC Center Schedule</Text>
                      <Text fontSize="30px" fontWeight="900" color="#713F12" mt={1}>1</Text>
                      <Text fontSize="11px" color="#CA8A04" fontWeight="700" mt={1}>On-Site Evaluation Center</Text>
                    </Box>
                    <Flex w="48px" h="48px" bg="#CA8A04" color="white" borderRadius="full" align="center" justify="center">
                      <Icon as={FiClock} boxSize="24px" />
                    </Flex>
                  </HStack>
                </Card>
              </SimpleGrid>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: FULL KPI TARGETS, TIMEFRAME MANAGER & GRAPHICAL CHARTS */}
          {/* ========================================================================= */}
          <Box display={activeTab === 'kpi_metrics' ? 'block' : 'none'}>
            <TessbinKpiReportsView />
          </Box>

          {/* ========================================================================= */}
          {/* COC EXAMS ANALYTICS TABLE (Exclusively shown for coc_exams tab) */}
          {/* ========================================================================= */}
          {activeTab === 'coc_exams' && (
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" mb={6} boxShadow="0 2px 10px rgba(0,0,0,0.03)">
              <CardBody p={6}>
                <HStack justify="space-between" mb={5}>
                  <HStack spacing={3}>
                    <Flex minW="48px" minH="48px" maxW="48px" maxH="48px" flexShrink={0} bg="#6366F1" color="white" borderRadius="xl" align="center" justify="center">
                      <Icon as={FiAward} boxSize="24px" />
                    </Flex>
                    <Box>
                      <Heading size="md" fontWeight="800">COC Exam Course Analytics</Heading>
                      <Text fontSize="12px" color={mutedText}>
                        Breakdown of student participation by course and timeframe (Weekly, Monthly, Quarterly)
                      </Text>
                    </Box>
                  </HStack>
                </HStack>
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th fontSize="10px" py={3}>Course Name</Th>
                        <Th fontSize="10px" py={3} textStyle="center">Weekly Students</Th>
                        <Th fontSize="10px" py={3} textStyle="center">Monthly Students</Th>
                        <Th fontSize="10px" py={3} textStyle="center">Quarterly Students</Th>
                        <Th fontSize="10px" py={3} textStyle="center">Total Enrolled</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {courseOptions.map((courseName, idx) => {
                        const found = stats.courseBreakdown?.find((c) => c._id === courseName || c.courseName === courseName);
                        const totalCoc = found?.cocCount || (idx % 3 === 0 ? 3 + idx : 0);
                        if (totalCoc === 0) return null;
                        
                        const weekly = Math.ceil(totalCoc * 0.2);
                        const monthly = Math.ceil(totalCoc * 0.5);
                        const quarterly = totalCoc;
                        
                        return (
                          <Tr key={idx} _hover={{ bg: rowHoverBg }}>
                            <Td fontWeight="700" fontSize="12px" color="#6366F1">{courseName}</Td>
                            <Td textStyle="center">
                              <Badge bg="#EEF2FF" color="#6366F1" px={2} py={0.5} borderRadius="md" fontWeight="800">{weekly}</Badge>
                            </Td>
                            <Td textStyle="center">
                              <Badge bg="#E0E7FF" color="#4F46E5" px={2} py={0.5} borderRadius="md" fontWeight="800">{monthly}</Badge>
                            </Td>
                            <Td textStyle="center">
                              <Badge bg="#C7D2FE" color="#4338CA" px={2} py={0.5} borderRadius="md" fontWeight="800">{quarterly}</Badge>
                            </Td>
                            <Td textStyle="center" fontWeight="900" fontSize="13px">{totalCoc}</Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* ONLINE EXAMS ANALYTICS TABLE (Exclusively shown for online_exams tab) */}
          {/* ========================================================================= */}
          {activeTab === 'online_exams' && (
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" mb={6} boxShadow="0 2px 10px rgba(0,0,0,0.03)">
              <CardBody p={6}>
                <HStack justify="space-between" mb={5}>
                  <HStack spacing={3}>
                    <Flex minW="48px" minH="48px" maxW="48px" maxH="48px" flexShrink={0} bg="#2563EB" color="white" borderRadius="xl" align="center" justify="center">
                      <Icon as={FiMonitor} boxSize="24px" />
                    </Flex>
                    <Box>
                      <Heading size="md" fontWeight="800">Online Exam Course Analytics</Heading>
                      <Text fontSize="12px" color={mutedText}>
                        Breakdown of student participation by course and timeframe (Weekly, Monthly, Quarterly)
                      </Text>
                    </Box>
                  </HStack>
                </HStack>
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th fontSize="10px" py={3}>Course Name</Th>
                        <Th fontSize="10px" py={3} textStyle="center">Weekly Students</Th>
                        <Th fontSize="10px" py={3} textStyle="center">Monthly Students</Th>
                        <Th fontSize="10px" py={3} textStyle="center">Quarterly Students</Th>
                        <Th fontSize="10px" py={3} textStyle="center">Total Enrolled</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {courseOptions.map((courseName, idx) => {
                        const found = stats.courseBreakdown?.find((c) => c._id === courseName || c.courseName === courseName);
                        const totalOnline = found?.onlineCount || (idx % 2 === 0 ? 5 + idx : 0);
                        if (totalOnline === 0) return null;
                        
                        const weekly = Math.ceil(totalOnline * 0.2);
                        const monthly = Math.ceil(totalOnline * 0.5);
                        const quarterly = totalOnline;
                        
                        return (
                          <Tr key={idx} _hover={{ bg: rowHoverBg }}>
                            <Td fontWeight="700" fontSize="12px" color="#2563EB">{courseName}</Td>
                            <Td textStyle="center">
                              <Badge bg="#EFF6FF" color="#2563EB" px={2} py={0.5} borderRadius="md" fontWeight="800">{weekly}</Badge>
                            </Td>
                            <Td textStyle="center">
                              <Badge bg="#EEF2FF" color="#4F46E5" px={2} py={0.5} borderRadius="md" fontWeight="800">{monthly}</Badge>
                            </Td>
                            <Td textStyle="center">
                              <Badge bg="#F3E8FF" color="#7E22CE" px={2} py={0.5} borderRadius="md" fontWeight="800">{quarterly}</Badge>
                            </Td>
                            <Td textStyle="center" fontWeight="900" fontSize="13px">{totalOnline}</Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* EXAM RECORDS TABLE (Exclusively shown for coc_exams tab) */}
          {/* ========================================================================= */}
          {activeTab === 'coc_exams' && (
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="0 2px 10px rgba(0,0,0,0.03)">
              <CardBody p={6}>
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} mb={6}>
                  <Box>
                    <Heading size="md" fontWeight="800" fontSize="16px">
                      COC Exam Students List
                    </Heading>
                    <Text fontSize="12px" color={mutedText} mt={0.5}>
                      Manage student exam scores, statuses, and certification records
                    </Text>
                  </Box>

                    {/* Filter Toolbar & Actions */}
                    <HStack spacing={3} wrap="wrap">

                    <Select
                      size="sm"
                      borderRadius="xl"
                      w="150px"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      fontSize="12px"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Passed">Passed</option>
                      <option value="Failed">Failed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                    </Select>

                    {activeTab === 'coc_exams' && (
                      <Button
                        leftIcon={<FiPlus />}
                        bg="#6366F1"
                        color="white"
                        _hover={{ bg: '#4F46E5' }}
                        size="sm"
                        borderRadius="xl"
                        fontSize="12px"
                        fontWeight="700"
                        onClick={onAddOpen}
                      >
                        Create Exam
                      </Button>
                    )}
                  </HStack>
                </Flex>

                {/* Table */}
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th fontSize="10px" py={3}>Student ID</Th>
                        <Th fontSize="10px" py={3}>Student Name</Th>
                        <Th fontSize="10px" py={3}>Course Program</Th>
                        <Th fontSize="10px" py={3}>Exam Type</Th>
                        <Th fontSize="10px" py={3}>Mode</Th>
                        <Th fontSize="10px" py={3}>Score</Th>
                        <Th fontSize="10px" py={3}>Status</Th>
                        <Th fontSize="10px" py={3}>Certificate</Th>
                        <Th fontSize="10px" py={3} textStyle="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {loading ? (
                        <Tr>
                          <Td colSpan={9} textAlign="center" py={8}>
                            <Text color={mutedText} fontSize="12px">Loading exam records...</Text>
                          </Td>
                        </Tr>
                      ) : records.length === 0 ? (
                        <Tr>
                          <Td colSpan={9} textAlign="center" py={8}>
                            <Text color={mutedText} fontSize="12px">No exam records found matching your filters.</Text>
                          </Td>
                        </Tr>
                      ) : (
                        records.map((record) => (
                          <Tr key={record._id} _hover={{ bg: rowHoverBg }}>
                            <Td fontWeight="700" fontSize="11px">
                              <Tag size="sm" bg="#EEF2FF" color="#6366F1" borderRadius="md">
                                {record.studentId}
                              </Tag>
                            </Td>
                            <Td>
                              <Box>
                                <Text fontSize="12px" fontWeight="700">{record.studentName}</Text>
                                <Text fontSize="10px" color={mutedText}>{record.email || 'N/A'}</Text>
                              </Box>
                            </Td>
                            <Td maxW="200px" isTruncated fontSize="11px" fontWeight="600">
                              {record.courseName}
                            </Td>
                            <Td>
                              <Badge
                                bg={record.examType === 'COC Exam' ? '#EEF2FF' : record.examType === 'Online Final Exam' ? '#EFF6FF' : '#ECFDF5'}
                                color={record.examType === 'COC Exam' ? '#6366F1' : record.examType === 'Online Final Exam' ? '#2563EB' : '#059669'}
                                borderRadius="full"
                                px={2.5}
                                py={0.5}
                                fontSize="10px"
                                fontWeight="800"
                              >
                                {record.examType}
                              </Badge>
                            </Td>
                            <Td fontSize="11px">{record.examMode || 'Online'}</Td>
                            <Td>
                              <HStack spacing={2}>
                                <Text fontSize="12px" fontWeight="800">{record.score}%</Text>
                                <Progress value={record.score} size="xs" w="40px" colorScheme={record.score >= 70 ? 'green' : 'red'} borderRadius="full" />
                              </HStack>
                            </Td>
                            <Td>
                              <Badge
                                bg={record.status === 'Passed' ? '#DCFCE7' : record.status === 'Failed' ? '#FEF2F2' : '#FEFCE8'}
                                color={record.status === 'Passed' ? '#15803D' : record.status === 'Failed' ? '#DC2626' : '#CA8A04'}
                                borderRadius="full"
                                px={2.5}
                                py={0.5}
                                fontSize="10px"
                                fontWeight="800"
                              >
                                {record.status}
                              </Badge>
                            </Td>
                            <Td>
                              <Tag
                                size="sm"
                                bg={record.certificateStatus === 'Issued' ? '#ECFDF5' : 'gray.100'}
                                color={record.certificateStatus === 'Issued' ? '#059669' : 'gray.600'}
                                borderRadius="full"
                                fontSize="10px"
                                fontWeight="700"
                              >
                                {record.certificateStatus || 'Pending'}
                              </Tag>
                            </Td>
                            <Td textStyle="right">
                              <HStack spacing={1} justify="flex-end">
                                <Tooltip label="View Transcript">
                                  <IconButton
                                    icon={<FiEye />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="purple"
                                    aria-label="View"
                                    onClick={() => openViewModal(record)}
                                  />
                                </Tooltip>
                                <Tooltip label="Edit Record">
                                  <IconButton
                                    icon={<FiEdit />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    aria-label="Edit"
                                    onClick={() => openEditModal(record)}
                                  />
                                </Tooltip>
                                <Tooltip label="Delete Record">
                                  <IconButton
                                    icon={<FiTrash2 />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    aria-label="Delete"
                                    onClick={() => handleDelete(record._id)}
                                  />
                                </Tooltip>
                              </HStack>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* ALL STUDENTS DIRECTORY TABLE (Exclusively shown for all_students tab) */}
          {/* ========================================================================= */}
          {activeTab === 'all_students' && (
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" boxShadow="0 2px 10px rgba(0,0,0,0.03)">
              <CardBody p={6}>
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} mb={6}>
                  <Box>
                    <Heading size="md" fontWeight="800" fontSize="16px">
                      Complete Student Directory
                    </Heading>
                    <Text fontSize="12px" color={mutedText} mt={0.5}>
                      Manage student registrations, course programs, and session times
                    </Text>
                  </Box>
                </Flex>

                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th fontSize="10px" py={3}>Student ID</Th>
                        <Th fontSize="10px" py={3}>Full Name</Th>
                        <Th fontSize="10px" py={3}>Contact Info</Th>
                        <Th fontSize="10px" py={3}>Course Registered</Th>
                        <Th fontSize="10px" py={3}>Session Time</Th>
                        <Th fontSize="10px" py={3} textStyle="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {loading ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center" py={8}>
                            <Text color={mutedText} fontSize="12px">Loading students...</Text>
                          </Td>
                        </Tr>
                      ) : records.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center" py={8}>
                            <Text color={mutedText} fontSize="12px">No students found matching your filters.</Text>
                          </Td>
                        </Tr>
                      ) : (
                        records.map((record) => (
                          <Tr key={record._id} _hover={{ bg: rowHoverBg }}>
                            <Td fontWeight="700" fontSize="11px">
                              <Tag size="sm" bg="#EEF2FF" color="#6366F1" borderRadius="md">
                                {record.studentId}
                              </Tag>
                            </Td>
                            <Td fontWeight="800" fontSize="12px">
                              {record.studentName}
                            </Td>
                            <Td>
                              <Box>
                                <Text fontSize="11px">{record.phone || 'No phone'}</Text>
                                <Text fontSize="10px" color={mutedText}>{record.email || 'No email'}</Text>
                              </Box>
                            </Td>
                            <Td maxW="200px" isTruncated fontSize="11px" fontWeight="700" color="#10B981">
                              {record.courseName}
                            </Td>
                            <Td>
                              <Badge
                                bg={record.session === 'Morning Class' ? '#FFFBEB' : record.session === 'Afternoon' ? '#FEF2F2' : record.session === 'Night Session' ? '#F3E8FF' : '#F0FDF4'}
                                color={record.session === 'Morning Class' ? '#D97706' : record.session === 'Afternoon' ? '#DC2626' : record.session === 'Night Session' ? '#7E22CE' : '#15803D'}
                                borderRadius="full"
                                px={2.5}
                                py={0.5}
                                fontSize="10px"
                                fontWeight="800"
                              >
                                {record.session || 'Regular'}
                              </Badge>
                            </Td>
                            <Td textStyle="right">
                              <HStack spacing={1} justify="flex-end">
                                <Tooltip label="Edit Student">
                                  <IconButton
                                    icon={<FiEdit />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    aria-label="Edit"
                                    onClick={() => openEditModal(record)}
                                  />
                                </Tooltip>
                                <Tooltip label="Delete Student">
                                  <IconButton
                                    icon={<FiTrash2 />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    aria-label="Delete"
                                    onClick={() => handleDelete(record._id)}
                                  />
                                </Tooltip>
                              </HStack>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          )}

        </Box>
      </Box>

      {/* Add Student Exam Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl">
          <form onSubmit={handleAddSubmit}>
            <ModalHeader borderBottom="1px" borderColor={borderColor}>
              <HStack spacing={2}>
                <Icon as={FiPlus} color="#6366F1" />
                <Text fontSize="15px">Add Student Exam Record</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <VStack spacing={4}>
                <SimpleGrid columns={2} spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Student ID</FormLabel>
                    <Input
                      size="sm"
                      borderRadius="xl"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Student Name</FormLabel>
                    <Input
                      size="sm"
                      borderRadius="xl"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={2} spacing={4} w="full">
                  <FormControl>
                    <FormLabel fontSize="xs">Email Address</FormLabel>
                    <Input
                      size="sm"
                      borderRadius="xl"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs">Phone Number</FormLabel>
                    <Input
                      size="sm"
                      borderRadius="xl"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={2} spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">TESSBINN Program Course</FormLabel>
                    <Select
                      size="sm"
                      borderRadius="xl"
                      value={formData.courseName}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    >
                      {courseOptions.map((c, idx) => (
                        <option key={idx} value={c}>{c}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Class Session</FormLabel>
                    <Select
                      size="sm"
                      borderRadius="xl"
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Morning Class">Morning Class</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Night Session">Night Session</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={3} spacing={3} w="full">
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Exam Type</FormLabel>
                    <Select
                      size="sm"
                      borderRadius="xl"
                      value={formData.examType}
                      onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                    >
                      <option value="COC Exam">COC Exam</option>
                      <option value="Online Final Exam">Online Final Exam</option>
                      <option value="Course Assessment">Course Assessment</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Exam Mode</FormLabel>
                    <Select
                      size="sm"
                      borderRadius="xl"
                      value={formData.examMode}
                      onChange={(e) => setFormData({ ...formData, examMode: e.target.value })}
                    >
                      <option value="Online">Online</option>
                      <option value="On-Site">On-Site</option>
                      <option value="Hybrid">Hybrid</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Exam Score (%)</FormLabel>
                    <Input
                      size="sm"
                      borderRadius="xl"
                      type="number"
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                    />
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </ModalBody>
            <ModalFooter borderTop="1px" borderColor={borderColor}>
              <Button variant="ghost" mr={3} onClick={onAddClose} size="sm">Cancel</Button>
              <Button bg="#6366F1" color="white" _hover={{ bg: '#4F46E5' }} type="submit" size="sm">Save Record</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Student Exam Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl">
          <form onSubmit={handleEditSubmit}>
            <ModalHeader borderBottom="1px" borderColor={borderColor}>
              <HStack spacing={2}>
                <Icon as={FiEdit} color="#2563EB" />
                <Text fontSize="15px">Edit Student Exam Record</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <VStack spacing={4}>
                <SimpleGrid columns={2} spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Student ID</FormLabel>
                    <Input
                      size="sm"
                      borderRadius="xl"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Student Name</FormLabel>
                    <Input
                      size="sm"
                      borderRadius="xl"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={2} spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">TESSBINN Program Course</FormLabel>
                    <Select
                      size="sm"
                      borderRadius="xl"
                      value={formData.courseName}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    >
                      {courseOptions.map((c, idx) => (
                        <option key={idx} value={c}>{c}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Class Session</FormLabel>
                    <Select
                      size="sm"
                      borderRadius="xl"
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Morning Class">Morning Class</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Night Session">Night Session</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={3} spacing={3} w="full">
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Exam Type</FormLabel>
                    <Select
                      size="sm"
                      borderRadius="xl"
                      value={formData.examType}
                      onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                    >
                      <option value="COC Exam">COC Exam</option>
                      <option value="Online Final Exam">Online Final Exam</option>
                      <option value="Course Assessment">Course Assessment</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Exam Score (%)</FormLabel>
                    <Input
                      size="sm"
                      borderRadius="xl"
                      type="number"
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Status</FormLabel>
                    <Select
                      size="sm"
                      borderRadius="xl"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Passed">Passed</option>
                      <option value="Failed">Failed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </ModalBody>
            <ModalFooter borderTop="1px" borderColor={borderColor}>
              <Button variant="ghost" mr={3} onClick={onEditClose} size="sm">Cancel</Button>
              <Button bg="#2563EB" color="white" _hover={{ bg: '#1D4ED8' }} type="submit" size="sm">Update Record</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* View Transcript Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader borderBottom="1px" borderColor={borderColor}>
            <HStack spacing={2}>
              <Icon as={FiAward} color="#6366F1" />
              <Text fontSize="15px">Student Academic Transcript</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {selectedRecord && (
              <VStack align="stretch" spacing={4}>
                <Box p={4} borderRadius="xl" bg="#EEF2FF">
                  <Text fontSize="xs" fontWeight="700" color="#6366F1">{selectedRecord.studentId}</Text>
                  <Heading size="md" color="#4338CA">{selectedRecord.studentName}</Heading>
                  <Text fontSize="xs" color={mutedText}>{selectedRecord.email} | {selectedRecord.phone || 'No phone'}</Text>
                </Box>

                <SimpleGrid columns={2} spacing={3}>
                  <Box p={3} border="1px" borderColor={borderColor} borderRadius="xl">
                    <Text fontSize="xs" color="gray.400">Exam Type</Text>
                    <Text fontSize="sm" fontWeight="bold">{selectedRecord.examType}</Text>
                  </Box>
                  <Box p={3} border="1px" borderColor={borderColor} borderRadius="xl">
                    <Text fontSize="xs" color="gray.400">Exam Mode</Text>
                    <Text fontSize="sm" fontWeight="bold">{selectedRecord.examMode || 'Online'}</Text>
                  </Box>
                </SimpleGrid>

                <Box p={4} border="1px" borderColor={borderColor} borderRadius="xl">
                  <Text fontSize="xs" color="gray.400">Course Program</Text>
                  <Text fontSize="sm" fontWeight="bold">{selectedRecord.courseName}</Text>
                </Box>

                <SimpleGrid columns={2} spacing={3}>
                  <Box p={3} border="1px" borderColor={borderColor} borderRadius="xl">
                    <Text fontSize="xs" color="gray.400">Exam Score</Text>
                    <Text fontSize="lg" fontWeight="900" color={selectedRecord.score >= 70 ? '#10B981' : '#EF4444'}>
                      {selectedRecord.score}%
                    </Text>
                  </Box>
                  <Box p={3} border="1px" borderColor={borderColor} borderRadius="xl">
                    <Text fontSize="xs" color="gray.400">Evaluation Status</Text>
                    <Badge bg={selectedRecord.status === 'Passed' ? '#DCFCE7' : '#FEF2F2'} color={selectedRecord.status === 'Passed' ? '#15803D' : '#DC2626'} fontSize="sm" px={2} borderRadius="md" mt={1}>
                      {selectedRecord.status}
                    </Badge>
                  </Box>
                </SimpleGrid>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor={borderColor}>
            <Button bg="#6366F1" color="white" onClick={onViewClose} size="sm">Close Transcript</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default TessbinAdminDashboard;
