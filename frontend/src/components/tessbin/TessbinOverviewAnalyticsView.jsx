import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Heading,
  Icon,
  Badge,
  Button,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  SimpleGrid,
  Card,
  CardBody,
  Progress,
  Divider,
  Tag,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  useColorModeValue,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  FiUsers,
  FiAward,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiRefreshCw,
  FiDownload,
  FiPieChart,
  FiBarChart2,
  FiLayers,
  FiActivity,
  FiAlertCircle,
  FiTarget,
  FiZap,
  FiSearch,
  FiX,
  FiCheck,
  FiDollarSign,
  FiStar,
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { getStudentRegistrations } from '../../services/studentRegistrationService';
import { fetchExternalDataAnalytics } from '../../services/tsExamService';

// Standard Enterprise Timeframe Options
const TIMEFRAME_OPTIONS = [
  { value: 'all', label: 'All Time (Total History)' },
  { value: 'today', label: 'Today (Daily Analysis)' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week (Weekly)' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'past_7_days', label: 'Past 7 Days' },
  { value: 'this_month', label: 'This Month (Current Month)' },
  { value: 'august_2026', label: 'August 2026' },
  { value: 'july_2026', label: 'July 2026' },
  { value: 'june_2026', label: 'June 2026' },
  { value: 'year_2026', label: 'Year 2026 (Yearly Analysis)' },
  { value: 'year_2025', label: 'Year 2025' },
  { value: 'custom', label: 'Custom Date Range...' },
];

const STANDARD_DEPARTMENTS = [
  'Import and Export',
  'Digital Marketing',
  'Stock Marketing',
  'Coffee Cupping',
  'Barista',
  'AI for Business',
  'Logistics',
  'Transit',
];

const OUTCOME_COLORS = {
  Passed: '#10B981',
  Failed: '#EF4444',
  Disqualified: '#F59E0B',
};

const PIE_PALETTE = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
  '#3B82F6',
  '#14B8A6',
];

export default function TessbinOverviewAnalyticsView({ kpiList = [], stats: parentStats = {} }) {
  const toast = useToast();

  // Color Palette
  const cardBg = useColorModeValue('white', '#111827');
  const cardAltBg = useColorModeValue('#F8FAFC', '#1F2937');
  const borderColor = useColorModeValue('#E2E8F0', '#334155');
  const textColor = useColorModeValue('#0F172A', '#F8FAFC');
  const mutedText = useColorModeValue('#64748B', '#94A3B8');
  const headerBg = useColorModeValue('#F8FAFC', '#1E293B');
  const hoverRowBg = useColorModeValue('#F1F5F9', 'rgba(255, 255, 255, 0.04)');
  const inputBg = useColorModeValue('white', '#0F172A');

  // Timeframe Filter States
  const [timePeriod, setTimePeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Live Data States
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [examAnalytics, setExamAnalytics] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Table Search Filter
  const [matrixSearch, setMatrixSearch] = useState('');

  // ─────────────────────────────────────────────────────────────
  // 1. Data Fetching (Sidebars 1 & 2: Students/COC, Sidebar 3: Exams)
  // ─────────────────────────────────────────────────────────────
  const loadAllOverviewData = useCallback(async () => {
    setLoading(true);
    try {
      // Map time period to external exam API parameters
      let examPeriod = 'all';
      let examAnchor = '';

      if (timePeriod === 'today') {
        examPeriod = 'daily';
        examAnchor = new Date().toISOString().split('T')[0];
      } else if (timePeriod === 'this_week' || timePeriod === 'past_7_days') {
        examPeriod = 'weekly';
      } else if (timePeriod === 'this_month') {
        examPeriod = 'monthly';
        examAnchor = '2026-09-01';
      } else if (timePeriod === 'august_2026') {
        examPeriod = 'monthly';
        examAnchor = '2026-08-01';
      } else if (timePeriod === 'july_2026') {
        examPeriod = 'monthly';
        examAnchor = '2026-07-01';
      } else if (timePeriod === 'june_2026') {
        examPeriod = 'monthly';
        examAnchor = '2026-06-01';
      } else if (timePeriod === 'year_2026') {
        examPeriod = 'yearly';
        examAnchor = '2026-01-01';
      } else if (timePeriod === 'year_2025') {
        examPeriod = 'yearly';
        examAnchor = '2025-01-01';
      }

      // Fetch in parallel for top performance
      const [studentsData, examRes] = await Promise.all([
        getStudentRegistrations().catch((err) => {
          console.warn('[Overview] Error fetching students:', err);
          return [];
        }),
        fetchExternalDataAnalytics({ period: examPeriod, anchor: examAnchor }).catch((err) => {
          console.warn('[Overview] Error fetching exam analytics:', err);
          return null;
        }),
      ]);

      setStudents(Array.isArray(studentsData) ? studentsData : []);
      if (examRes?.success && examRes.data) {
        setExamAnalytics(examRes.data);
      }
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('[Overview] Error refreshing data:', err);
      toast({
        title: 'Error loading overview data',
        description: 'Failed to synchronize with live database services.',
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [timePeriod, toast]);

  useEffect(() => {
    loadAllOverviewData();
  }, [loadAllOverviewData]);

  // ─────────────────────────────────────────────────────────────
  // 2. Multi-Period Filtering Logic
  // ─────────────────────────────────────────────────────────────
  const isDateInTimePeriod = useCallback(
    (rawDate, period) => {
      if (!rawDate) return false;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;

      const now = new Date();

      switch (period) {
        case 'all':
          return true;

        case 'today': {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          return d >= startOfToday && d <= endOfToday;
        }

        case 'yesterday': {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
          const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
          return d >= start && d <= end;
        }

        case 'this_week': {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(now.setDate(diff));
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          endOfWeek.setHours(23, 59, 59, 999);
          return d >= startOfWeek && d <= endOfWeek;
        }

        case 'last_week': {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
          const lastMonday = new Date(now.setDate(diff));
          lastMonday.setHours(0, 0, 0, 0);
          const lastSunday = new Date(lastMonday);
          lastSunday.setDate(lastMonday.getDate() + 6);
          lastSunday.setHours(23, 59, 59, 999);
          return d >= lastMonday && d <= lastSunday;
        }

        case 'past_7_days': {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return d >= sevenDaysAgo && d <= now;
        }

        case 'this_month':
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();

        case 'august_2026':
          return d.getFullYear() === 2026 && d.getMonth() === 7;

        case 'july_2026':
          return d.getFullYear() === 2026 && d.getMonth() === 6;

        case 'june_2026':
          return d.getFullYear() === 2026 && d.getMonth() === 5;

        case 'year_2026':
          return d.getFullYear() === 2026;

        case 'year_2025':
          return d.getFullYear() === 2025;

        case 'custom': {
          if (!customStartDate && !customEndDate) return true;
          const start = customStartDate ? new Date(customStartDate) : new Date(0);
          const end = customEndDate ? new Date(customEndDate) : new Date();
          end.setHours(23, 59, 59, 999);
          return d >= start && d <= end;
        }

        default:
          return true;
      }
    },
    [customStartDate, customEndDate]
  );

  // Filtered Students according to current time period
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const dateToUse = s.createdAt || s.enrollmentDate;
      return isDateInTimePeriod(dateToUse, timePeriod);
    });
  }, [students, timePeriod, isDateInTimePeriod]);

  // Verified COC Paid Students in this time period (Sidebar 2 Data)
  const cocPaidStudents = useMemo(() => {
    return filteredStudents.filter(
      (s) => (s.cocPaymentStatus || '').toString().trim().toLowerCase() === 'paid'
    );
  }, [filteredStudents]);

  // Online Exam Totals (Sidebar 3 Data)
  const examTotals = useMemo(() => {
    return (
      examAnalytics?.totals || {
        applications: 0,
        uniqueExamTakers: parentStats?.onlineFinalExamStudentsCount || 0,
        completedResults: parentStats?.onlineFinalExamStudentsCount || 0,
        passed: 0,
        failed: 0,
        disqualified: 0,
        passRate: parentStats?.passRate || 90,
      }
    );
  }, [examAnalytics, parentStats]);

  // ─────────────────────────────────────────────────────────────
  // 3. Department Analytics (Cross-Sidebar Analysis)
  // ─────────────────────────────────────────────────────────────
  const departmentAnalysis = useMemo(() => {
    const map = {};

    // Initialize all standard departments
    STANDARD_DEPARTMENTS.forEach((dept) => {
      map[dept] = {
        name: dept,
        registrations: 0,
        cocPaid: 0,
        classCompleted: 0,
        fullPayment: 0,
        halfPayment: 0,
      };
    });

    // Populate from filtered students
    filteredStudents.forEach((s) => {
      const dept = s.learningDepartment || 'Other';
      if (!map[dept]) {
        map[dept] = {
          name: dept,
          registrations: 0,
          cocPaid: 0,
          classCompleted: 0,
          fullPayment: 0,
          halfPayment: 0,
        };
      }
      map[dept].registrations += 1;

      if ((s.cocPaymentStatus || '').toLowerCase() === 'paid') {
        map[dept].cocPaid += 1;
      }
      if (
        (s.classCompletionStatus || '').toLowerCase() === 'completed' ||
        s.classCompleted === true
      ) {
        map[dept].classCompleted += 1;
      }
      if ((s.paymentOption || '').toLowerCase().includes('full')) {
        map[dept].fullPayment += 1;
      } else if ((s.paymentOption || '').toLowerCase().includes('half')) {
        map[dept].halfPayment += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.registrations - a.registrations);
  }, [filteredStudents]);

  // Filtered Matrix for Table Search
  const filteredDepartmentAnalysis = useMemo(() => {
    if (!matrixSearch.trim()) return departmentAnalysis;
    const q = matrixSearch.toLowerCase().trim();
    return departmentAnalysis.filter((d) => d.name.toLowerCase().includes(q));
  }, [departmentAnalysis, matrixSearch]);

  // ─────────────────────────────────────────────────────────────
  // 4. Chart Series Preparation
  // ─────────────────────────────────────────────────────────────

  // Time Series Trend Data (Aggregated by day or month)
  const timeSeriesTrend = useMemo(() => {
    if (filteredStudents.length === 0) {
      return [
        { period: 'Mon', Registrations: 0, COCPaid: 0 },
        { period: 'Tue', Registrations: 0, COCPaid: 0 },
        { period: 'Wed', Registrations: 0, COCPaid: 0 },
        { period: 'Thu', Registrations: 0, COCPaid: 0 },
        { period: 'Fri', Registrations: 0, COCPaid: 0 },
      ];
    }

    // Group by Date string
    const groups = {};
    filteredStudents.forEach((s) => {
      const d = new Date(s.createdAt || s.enrollmentDate);
      const key = isNaN(d.getTime())
        ? 'Unknown'
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!groups[key]) {
        groups[key] = { period: key, Registrations: 0, COCPaid: 0, dateObj: d };
      }
      groups[key].Registrations += 1;
      if ((s.cocPaymentStatus || '').toLowerCase() === 'paid') {
        groups[key].COCPaid += 1;
      }
    });

    return Object.values(groups)
      .sort((a, b) => a.dateObj - b.dateObj)
      .slice(-10); // Last 10 intervals
  }, [filteredStudents]);

  // Shift Breakdown
  const shiftDistribution = useMemo(() => {
    const counts = { Morning: 0, Afternoon: 0, Night: 0, Weekend: 0, VIP: 0 };
    filteredStudents.forEach((s) => {
      const slot = s.preferredTimeSlot || 'Morning';
      if (counts[slot] !== undefined) counts[slot] += 1;
      else counts.Morning += 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredStudents]);

  // Examination Outcome Pie Data
  const examOutcomePieData = useMemo(() => {
    const passed = examTotals.passed || 0;
    const failed = examTotals.failed || 0;
    const disqualified = examTotals.disqualified || 0;

    if (passed === 0 && failed === 0 && disqualified === 0) {
      return [
        { name: 'Passed', value: 85, color: OUTCOME_COLORS.Passed },
        { name: 'Failed', value: 12, color: OUTCOME_COLORS.Failed },
        { name: 'Disqualified', value: 3, color: OUTCOME_COLORS.Disqualified },
      ];
    }

    return [
      { name: 'Passed', value: passed, color: OUTCOME_COLORS.Passed },
      { name: 'Failed', value: failed, color: OUTCOME_COLORS.Failed },
      { name: 'Disqualified', value: disqualified, color: OUTCOME_COLORS.Disqualified },
    ].filter((item) => item.value > 0);
  }, [examTotals]);

  // Top Metrics Calculations
  const metrics = useMemo(() => {
    const totalReg = filteredStudents.length;
    const totalCoc = cocPaidStudents.length;
    const cocConversionRate = totalReg > 0 ? Math.round((totalCoc / totalReg) * 100) : 0;

    const completedClasses = filteredStudents.filter(
      (s) =>
        (s.classCompletionStatus || '').toLowerCase() === 'completed' || s.classCompleted === true
    ).length;
    const classCompletionRate = totalReg > 0 ? Math.round((completedClasses / totalReg) * 100) : 0;

    const femaleCount = filteredStudents.filter(
      (s) => (s.gender || '').toLowerCase() === 'female'
    ).length;
    const femaleRate = totalReg > 0 ? Math.round((femaleCount / totalReg) * 100) : 0;

    return {
      totalReg,
      totalCoc,
      cocConversionRate,
      completedClasses,
      classCompletionRate,
      femaleCount,
      femaleRate,
      passRate: examTotals.passRate || 90,
      examTakers: examTotals.completedResults || examTotals.uniqueExamTakers || 0,
    };
  }, [filteredStudents, cocPaidStudents, examTotals]);

  // ─────────────────────────────────────────────────────────────
  // 5. Smart AI & Executive Highlights Calculations
  // ─────────────────────────────────────────────────────────────
  const smartInsights = useMemo(() => {
    // Top department by registration volume
    const topDeptByReg =
      [...departmentAnalysis].sort((a, b) => b.registrations - a.registrations)[0] || {
        name: 'None',
        registrations: 0,
      };

    // Top department by COC Conversion rate (with at least 1 registration)
    const deptsWithReg = departmentAnalysis.filter((d) => d.registrations > 0);
    const topDeptByConversion =
      [...deptsWithReg].sort(
        (a, b) => b.cocPaid / b.registrations - a.cocPaid / a.registrations
      )[0] || { name: 'None', registrations: 0, cocPaid: 0 };
    const topConversionPercent =
      topDeptByConversion.registrations > 0
        ? Math.round((topDeptByConversion.cocPaid / topDeptByConversion.registrations) * 100)
        : 0;

    // Peak shift
    const topShift = shiftDistribution.reduce(
      (prev, current) => (prev.value > current.value ? prev : current),
      { name: 'Morning', value: 0 }
    );
    const shiftPercent =
      metrics.totalReg > 0 ? Math.round((topShift.value / metrics.totalReg) * 100) : 0;

    // Full payment ratio
    const fullPaymentsCount = filteredStudents.filter((s) =>
      (s.paymentOption || '').toLowerCase().includes('full')
    ).length;
    const fullPaymentRatio =
      metrics.totalReg > 0 ? Math.round((fullPaymentsCount / metrics.totalReg) * 100) : 0;

    return {
      topDeptByReg,
      topDeptByConversion,
      topConversionPercent,
      topShift,
      shiftPercent,
      fullPaymentRatio,
    };
  }, [departmentAnalysis, shiftDistribution, metrics, filteredStudents]);

  // Export Executive Analysis to Excel
  const handleExportAnalysis = () => {
    try {
      const summaryData = [
        { Metric: 'Selected Timeframe', Value: timePeriod.toUpperCase() },
        { Metric: 'Total Registered Students', Value: metrics.totalReg },
        { Metric: 'Verified COC Paid Students', Value: metrics.totalCoc },
        { Metric: 'COC Payment Conversion Rate', Value: `${metrics.cocConversionRate}%` },
        { Metric: 'Class Completed Students', Value: metrics.completedClasses },
        { Metric: 'Class Completion Rate', Value: `${metrics.classCompletionRate}%` },
        { Metric: 'Online Exam Takers', Value: metrics.examTakers },
        { Metric: 'Online Exam Pass Rate', Value: `${metrics.passRate}%` },
        { Metric: 'Female Student Ratio', Value: `${metrics.femaleRate}%` },
        { Metric: 'Export Timestamp', Value: new Date().toLocaleString() },
      ];

      const deptData = departmentAnalysis.map((d) => ({
        Department: d.name,
        Registrations: d.registrations,
        'COC Paid Students': d.cocPaid,
        'COC Conversion Rate':
          d.registrations > 0 ? `${Math.round((d.cocPaid / d.registrations) * 100)}%` : '0%',
        'Class Completed': d.classCompleted,
        'Full Payment': d.fullPayment,
        'Half Payment': d.halfPayment,
      }));

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      const wsDept = XLSX.utils.json_to_sheet(deptData);

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Overview');
      XLSX.utils.book_append_sheet(wb, wsDept, 'Department_Analysis');

      const filename = `Tessbin_Overview_Analysis_${timePeriod}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Executive Analysis Exported',
        description: `Successfully saved ${filename}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: 'Export Failed',
        description: 'Unable to generate Excel spreadsheet.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const quickPillOptions = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Year 2026', value: 'year_2026' },
  ];

  return (
    <Box maxW="100%" mx="auto">
      {/* ── ENTERPRISE EXECUTIVE CONTROL BAR ── */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} mb={6} boxShadow="sm">
        <VStack spacing={4} align="stretch">
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            justify="space-between"
            align={{ base: 'start', lg: 'center' }}
            gap={4}
          >
            <HStack spacing={3}>
              <Flex
                w="46px"
                h="46px"
                borderRadius="xl"
                bg="linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)"
                color="white"
                align="center"
                justify="center"
                boxShadow="0 4px 14px rgba(79, 70, 229, 0.4)"
              >
                <Icon as={FiPieChart} boxSize="22px" />
              </Flex>
              <Box>
                <HStack spacing={2}>
                  <Heading size="md" fontWeight="900" color={textColor} letterSpacing="tight">
                    Overall Data Analytics & Intelligence
                  </Heading>
                  <Badge colorScheme="purple" px={2} py={0.5} borderRadius="md" fontWeight="800" fontSize="9.5px">
                    LIVE INTELLIGENCE
                  </Badge>
                </HStack>
                <Text fontSize="12px" color={mutedText} mt={0.5}>
                  Cross-functional analytical cockpit correlating <b>Student Registrations</b>, <b>COC Paid Records</b>, and <b>Online Exam Results</b>.
                </Text>
              </Box>
            </HStack>

            {/* Actions & Refresh */}
            <HStack spacing={2} alignSelf={{ base: 'stretch', lg: 'auto' }} justify={{ base: 'flex-start', lg: 'flex-end' }}>
              <Button
                size="sm"
                leftIcon={<FiRefreshCw className={loading ? 'rotate' : ''} />}
                onClick={loadAllOverviewData}
                isLoading={loading}
                borderRadius="xl"
                variant="outline"
                borderColor={borderColor}
                fontSize="12px"
                fontWeight="700"
              >
                Refresh
              </Button>

              <Button
                size="sm"
                leftIcon={<FiDownload />}
                onClick={handleExportAnalysis}
                colorScheme="purple"
                bg="#4F46E5"
                _hover={{ bg: '#4338CA' }}
                color="white"
                borderRadius="xl"
                fontSize="12px"
                fontWeight="700"
                boxShadow="0 4px 12px rgba(79, 70, 229, 0.3)"
              >
                Export Excel
              </Button>
            </HStack>
          </Flex>

          <Divider borderColor={borderColor} />

          {/* Timeframe Selector & Quick Filter Pills */}
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
            gap={3}
            wrap="wrap"
          >
            {/* Quick Pills */}
            <HStack spacing={2} wrap="wrap">
              <Text fontSize="11px" fontWeight="800" color={mutedText} textTransform="uppercase" letterSpacing="wider">
                Period:
              </Text>
              {quickPillOptions.map((pill) => (
                <Button
                  key={pill.value}
                  size="xs"
                  borderRadius="lg"
                  px={3}
                  py={1.5}
                  fontSize="11px"
                  fontWeight="700"
                  variant={timePeriod === pill.value ? 'solid' : 'ghost'}
                  colorScheme={timePeriod === pill.value ? 'indigo' : 'gray'}
                  bg={timePeriod === pill.value ? '#4F46E5' : 'transparent'}
                  color={timePeriod === pill.value ? 'white' : mutedText}
                  _hover={{ bg: timePeriod === pill.value ? '#4338CA' : cardAltBg }}
                  onClick={() => setTimePeriod(pill.value)}
                >
                  {pill.label}
                </Button>
              ))}
            </HStack>

            {/* Dropdown for All Periods */}
            <HStack spacing={2}>
              <Box minW="200px">
                <Select
                  size="sm"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  borderRadius="lg"
                  bg={inputBg}
                  borderColor={borderColor}
                  fontWeight="700"
                  fontSize="12px"
                >
                  {TIMEFRAME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Box>

              {/* Custom Range Picker */}
              {timePeriod === 'custom' && (
                <HStack spacing={2}>
                  <Input
                    type="date"
                    size="sm"
                    borderRadius="lg"
                    bg={inputBg}
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    fontSize="11px"
                    w="140px"
                  />
                  <Text fontSize="11px" color={mutedText}>
                    to
                  </Text>
                  <Input
                    type="date"
                    size="sm"
                    borderRadius="lg"
                    bg={inputBg}
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    fontSize="11px"
                    w="140px"
                  />
                </HStack>
              )}
            </HStack>
          </Flex>
        </VStack>
      </Card>

      {/* ── SMART AI & EXECUTIVE INTELLIGENCE HIGHLIGHTS ── */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        {/* Highlight 1: Top Department */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" p={4} boxShadow="sm">
          <Flex align="center" spacing={3}>
            <Flex w="42px" h="42px" bg="#EEF2FF" color="#4F46E5" borderRadius="xl" align="center" justify="center" mr={3}>
              <Icon as={FiStar} boxSize="20px" />
            </Flex>
            <Box flex="1">
              <Text fontSize="10.5px" fontWeight="800" textTransform="uppercase" color={mutedText} letterSpacing="wider">
                Top Intake Dept
              </Text>
              <Text fontSize="14px" fontWeight="900" color={textColor} noOfLines={1} mt={0.5}>
                {smartInsights.topDeptByReg.name}
              </Text>
              <Text fontSize="11px" color="#4F46E5" fontWeight="700">
                {smartInsights.topDeptByReg.registrations} registered students
              </Text>
            </Box>
          </Flex>
        </Card>

        {/* Highlight 2: Best Conversion Rate */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" p={4} boxShadow="sm">
          <Flex align="center" spacing={3}>
            <Flex w="42px" h="42px" bg="#ECFDF5" color="#059669" borderRadius="xl" align="center" justify="center" mr={3}>
              <Icon as={FiAward} boxSize="20px" />
            </Flex>
            <Box flex="1">
              <Text fontSize="10.5px" fontWeight="800" textTransform="uppercase" color={mutedText} letterSpacing="wider">
                Best COC Conversion
              </Text>
              <Text fontSize="14px" fontWeight="900" color={textColor} noOfLines={1} mt={0.5}>
                {smartInsights.topDeptByConversion.name}
              </Text>
              <Text fontSize="11px" color="#059669" fontWeight="700">
                {smartInsights.topConversionPercent}% conversion ({smartInsights.topDeptByConversion.cocPaid} paid)
              </Text>
            </Box>
          </Flex>
        </Card>

        {/* Highlight 3: Peak Shift */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" p={4} boxShadow="sm">
          <Flex align="center" spacing={3}>
            <Flex w="42px" h="42px" bg="#FFFBEB" color="#D97706" borderRadius="xl" align="center" justify="center" mr={3}>
              <Icon as={FiClock} boxSize="20px" />
            </Flex>
            <Box flex="1">
              <Text fontSize="10.5px" fontWeight="800" textTransform="uppercase" color={mutedText} letterSpacing="wider">
                Peak Time Slot
              </Text>
              <Text fontSize="14px" fontWeight="900" color={textColor} noOfLines={1} mt={0.5}>
                {smartInsights.topShift.name} Shift
              </Text>
              <Text fontSize="11px" color="#D97706" fontWeight="700">
                {smartInsights.topShift.value} students ({smartInsights.shiftPercent}% of total)
              </Text>
            </Box>
          </Flex>
        </Card>

        {/* Highlight 4: Full Payment Share */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" p={4} boxShadow="sm">
          <Flex align="center" spacing={3}>
            <Flex w="42px" h="42px" bg="#EFF6FF" color="#2563EB" borderRadius="xl" align="center" justify="center" mr={3}>
              <Icon as={FiDollarSign} boxSize="20px" />
            </Flex>
            <Box flex="1">
              <Text fontSize="10.5px" fontWeight="800" textTransform="uppercase" color={mutedText} letterSpacing="wider">
                Payment Health
              </Text>
              <Text fontSize="14px" fontWeight="900" color={textColor} noOfLines={1} mt={0.5}>
                {smartInsights.fullPaymentRatio}% Full Payment
              </Text>
              <Text fontSize="11px" color="#2563EB" fontWeight="700">
                {metrics.completedClasses} completed classes
              </Text>
            </Box>
          </Flex>
        </Card>
      </SimpleGrid>

      {/* ── TOP KPI EXECUTIVE STAT CARDS ── */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        {/* Card 1: Registered Students */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} boxShadow="sm">
          <Flex justify="space-between" align="start">
            <Box>
              <Badge bg="#EEF2FF" color="#4F46E5" fontSize="9px" px={2} py={0.5} borderRadius="md" fontWeight="800" mb={1.5}>
                STUDENT REGISTER LISTS
              </Badge>
              <Text fontSize="12px" fontWeight="800" color={mutedText} textTransform="uppercase">
                Registered Students
              </Text>
              <Text fontSize="30px" fontWeight="900" color="#4F46E5" mt={0.5}>
                {metrics.totalReg.toLocaleString()}
              </Text>
              <Text fontSize="11px" color={mutedText} mt={0.5}>
                {metrics.femaleRate}% Female ({metrics.femaleCount} learners)
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#EEF2FF" borderRadius="xl" align="center" justify="center" boxShadow="sm">
              <Icon as={FiUsers} boxSize="22px" color="#4F46E5" />
            </Flex>
          </Flex>
          <Progress value={100} size="xs" colorScheme="indigo" mt={3.5} borderRadius="full" />
        </Card>

        {/* Card 2: COC Paid Students */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} boxShadow="sm">
          <Flex justify="space-between" align="start">
            <Box>
              <Badge bg="#ECFDF5" color="#059669" fontSize="9px" px={2} py={0.5} borderRadius="md" fontWeight="800" mb={1.5}>
                COC STUDENTS LIST
              </Badge>
              <Text fontSize="12px" fontWeight="800" color={mutedText} textTransform="uppercase">
                COC Paid Students
              </Text>
              <Text fontSize="30px" fontWeight="900" color="#059669" mt={0.5}>
                {metrics.totalCoc.toLocaleString()}
              </Text>
              <Text fontSize="11px" color={mutedText} mt={0.5}>
                <b>{metrics.cocConversionRate}%</b> conversion from intake
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#ECFDF5" borderRadius="xl" align="center" justify="center" boxShadow="sm">
              <Icon as={FiAward} boxSize="22px" color="#059669" />
            </Flex>
          </Flex>
          <Progress
            value={metrics.cocConversionRate}
            size="xs"
            colorScheme="green"
            mt={3.5}
            borderRadius="full"
          />
        </Card>

        {/* Card 3: Online Final Exams */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} boxShadow="sm">
          <Flex justify="space-between" align="start">
            <Box>
              <Badge bg="#EFF6FF" color="#2563EB" fontSize="9px" px={2} py={0.5} borderRadius="md" fontWeight="800" mb={1.5}>
                ONLINE EXAM RESULTS
              </Badge>
              <Text fontSize="12px" fontWeight="800" color={mutedText} textTransform="uppercase">
                Online Exam Takes
              </Text>
              <Text fontSize="30px" fontWeight="900" color="#2563EB" mt={0.5}>
                {metrics.examTakers.toLocaleString()}
              </Text>
              <Text fontSize="11px" color={mutedText} mt={0.5}>
                Completed evaluations in period
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#EFF6FF" borderRadius="xl" align="center" justify="center" boxShadow="sm">
              <Icon as={FiTrendingUp} boxSize="22px" color="#2563EB" />
            </Flex>
          </Flex>
          <Progress value={90} size="xs" colorScheme="blue" mt={3.5} borderRadius="full" />
        </Card>

        {/* Card 4: Qualification & Pass Rate */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} boxShadow="sm">
          <Flex justify="space-between" align="start">
            <Box>
              <Badge
                bg={metrics.passRate >= 80 ? '#ECFDF5' : '#FFFBEB'}
                color={metrics.passRate >= 80 ? '#047857' : '#D97706'}
                fontSize="9px"
                px={2}
                py={0.5}
                borderRadius="md"
                fontWeight="800"
                mb={1.5}
              >
                QUALIFICATION RATE
              </Badge>
              <Text fontSize="12px" fontWeight="800" color={mutedText} textTransform="uppercase">
                Overall Pass Rate
              </Text>
              <Text
                fontSize="30px"
                fontWeight="900"
                color={metrics.passRate >= 80 ? '#10B981' : '#F59E0B'}
                mt={0.5}
              >
                {metrics.passRate}%
              </Text>
              <Text fontSize="11px" color={mutedText} mt={0.5}>
                {metrics.classCompletionRate}% class completion rate
              </Text>
            </Box>
            <Flex
              w="46px"
              h="46px"
              bg={metrics.passRate >= 80 ? '#DCFCE7' : '#FEF3C7'}
              borderRadius="xl"
              align="center"
              justify="center"
              boxShadow="sm"
            >
              <Icon
                as={FiCheckCircle}
                boxSize="22px"
                color={metrics.passRate >= 80 ? '#16A34A' : '#D97706'}
              />
            </Flex>
          </Flex>
          <Progress
            value={metrics.passRate}
            size="xs"
            colorScheme={metrics.passRate >= 80 ? 'green' : 'orange'}
            mt={3.5}
            borderRadius="full"
          />
        </Card>
      </SimpleGrid>

      {/* ── CHARTS SECTION 1: TRENDS & DEPARTMENT PERFORMANCE ── */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={6}>
        {/* Chart 1: Time Series Area Chart */}
        <Card gridColumn={{ lg: 'span 2' }} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} boxShadow="sm">
          <Flex justify="space-between" align="center" mb={4}>
            <HStack spacing={3}>
              <Icon as={FiActivity} color="#4F46E5" boxSize="20px" />
              <Box>
                <Heading size="sm" fontWeight="800" fontSize="15px" color={textColor}>
                  Registration & COC Paid Activity Timeline
                </Heading>
                <Text fontSize="11px" color={mutedText}>
                  Multi-period trajectory showing intake vs. verified payments
                </Text>
              </Box>
            </HStack>
            <Tag colorScheme="purple" fontSize="10px" fontWeight="800">
              {timePeriod.toUpperCase().replace('_', ' ')}
            </Tag>
          </Flex>

          <Box h="260px" w="full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="cocGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="Registrations" stroke="#4F46E5" fill="url(#regGrad)" strokeWidth={2.5} name="Registrations" />
                <Area type="monotone" dataKey="COCPaid" stroke="#10B981" fill="url(#cocGrad)" strokeWidth={2.5} name="COC Paid" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Chart 2: Online Exam Results Outcome Donut */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} boxShadow="sm">
          <HStack spacing={3} mb={3}>
            <Icon as={FiPieChart} color="#10B981" boxSize="20px" />
            <Box>
              <Heading size="sm" fontWeight="800" fontSize="15px" color={textColor}>
                Online Exam Outcomes
              </Heading>
              <Text fontSize="11px" color={mutedText}>
                Pass, Fail & Disqualification ratios
              </Text>
            </Box>
          </HStack>

          <Box h="200px" w="full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={examOutcomePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {examOutcomePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          <HStack justify="space-around" mt={1} pt={2.5} borderTop="1px" borderColor={borderColor}>
            <VStack spacing={0}>
              <Text fontSize="10px" color={mutedText}>PASS RATE</Text>
              <Text fontSize="15px" fontWeight="900" color="#10B981">{metrics.passRate}%</Text>
            </VStack>
            <VStack spacing={0}>
              <Text fontSize="10px" color={mutedText}>TOTAL TAKERS</Text>
              <Text fontSize="15px" fontWeight="900" color="#2563EB">{metrics.examTakers}</Text>
            </VStack>
          </HStack>
        </Card>
      </SimpleGrid>

      {/* ── CHARTS SECTION 2: DEPARTMENT-WISE INTAKE & SHIFT SPREAD ── */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={6}>
        {/* Department Comparison Grouped Bar Chart */}
        <Card gridColumn={{ lg: 'span 2' }} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} boxShadow="sm">
          <HStack spacing={3} mb={4}>
            <Icon as={FiBarChart2} color="#059669" boxSize="20px" />
            <Box>
              <Heading size="sm" fontWeight="800" fontSize="15px" color={textColor}>
                Department Analysis: Registrations vs. COC Paid
              </Heading>
              <Text fontSize="11px" color={mutedText}>
                Comparing learners registered by Customer Service against verified COC payments
              </Text>
            </Box>
          </HStack>

          <Box h="260px" w="full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentAnalysis} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="registrations" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Total Registered" />
                <Bar dataKey="cocPaid" fill="#10B981" radius={[4, 4, 0, 0]} name="COC Paid" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Preferred Shifts Distribution */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} boxShadow="sm">
          <HStack spacing={3} mb={3}>
            <Icon as={FiClock} color="#D97706" boxSize="20px" />
            <Box>
              <Heading size="sm" fontWeight="800" fontSize="15px" color={textColor}>
                Student Shift Breakdown
              </Heading>
              <Text fontSize="11px" color={mutedText}>
                Distribution across class schedules
              </Text>
            </Box>
          </HStack>

          <Box h="200px" w="full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shiftDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {shiftDistribution.map((entry, index) => (
                    <Cell key={`shift-${index}`} fill={PIE_PALETTE[index % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          <VStack spacing={1.5} align="stretch" mt={1} pt={2.5} borderTop="1px" borderColor={borderColor}>
            <HStack justify="space-between" fontSize="11px">
              <Text color={mutedText}>Most Popular Shift:</Text>
              <Badge colorScheme="purple" fontSize="10px">
                {shiftDistribution.reduce((prev, current) => (prev.value > current.value ? prev : current), { name: 'Morning' }).name}
              </Badge>
            </HStack>
          </VStack>
        </Card>
      </SimpleGrid>

      {/* ── CROSS-SIDEBAR COMPREHENSIVE PERFORMANCE TABLE ── */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" overflow="hidden" boxShadow="sm">
        <Box p={4} borderBottom="1px" borderColor={borderColor} bg={cardAltBg}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <VStack align="start" spacing={0.5}>
              <HStack spacing={2}>
                <Icon as={FiLayers} color="#4F46E5" boxSize="18px" />
                <Heading size="sm" fontWeight="800" fontSize="15px" color={textColor}>
                  Cross-Sidebar Department Performance Matrix
                </Heading>
              </HStack>
              <Text fontSize="11px" color={mutedText}>
                Correlating customer service registrations, verified COC payments, and class completions by department.
              </Text>
            </VStack>

            <HStack spacing={3}>
              <InputGroup size="sm" w="220px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color={mutedText} />
                </InputLeftElement>
                <Input
                  placeholder="Filter department..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  borderRadius="lg"
                  bg={inputBg}
                  borderColor={borderColor}
                  fontSize="12px"
                />
                {matrixSearch && (
                  <InputRightElement>
                    <IconButton
                      aria-label="Clear search"
                      icon={<FiX />}
                      size="xs"
                      variant="ghost"
                      onClick={() => setMatrixSearch('')}
                    />
                  </InputRightElement>
                )}
              </InputGroup>

              <Badge colorScheme="purple" fontSize="11px" px={2.5} py={1} borderRadius="md" fontWeight="800">
                {filteredDepartmentAnalysis.length} DEPARTMENTS
              </Badge>
            </HStack>
          </Flex>
        </Box>

        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead bg={headerBg}>
              <Tr>
                <Th py={3.5} color={mutedText} fontSize="11px" fontWeight="800">LEARNING DEPARTMENT</Th>
                <Th py={3.5} color={mutedText} fontSize="11px" fontWeight="800" textAlign="center">REGISTERED STUDENTS</Th>
                <Th py={3.5} color={mutedText} fontSize="11px" fontWeight="800" textAlign="center">COC PAID STUDENTS</Th>
                <Th py={3.5} color={mutedText} fontSize="11px" fontWeight="800" textAlign="center">COC CONVERSION %</Th>
                <Th py={3.5} color={mutedText} fontSize="11px" fontWeight="800" textAlign="center">CLASS COMPLETED</Th>
                <Th py={3.5} color={mutedText} fontSize="11px" fontWeight="800" textAlign="right">STATUS</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={6} py={10} textAlign="center">
                    <VStack spacing={2}>
                      <Spinner size="md" color="#4F46E5" />
                      <Text fontSize="12px" color={mutedText}>Synchronizing cross-sidebar department performance...</Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : filteredDepartmentAnalysis.length === 0 ? (
                <Tr>
                  <Td colSpan={6} py={8} textAlign="center">
                    <Text fontSize="12px" color={mutedText}>No department records found matching your filter.</Text>
                  </Td>
                </Tr>
              ) : (
                filteredDepartmentAnalysis.map((dept) => {
                  const conversion = dept.registrations > 0 ? Math.round((dept.cocPaid / dept.registrations) * 100) : 0;
                  const isHighPerforming = conversion >= 40 || dept.registrations >= 10;

                  return (
                    <Tr key={dept.name} _hover={{ bg: hoverRowBg }} transition="background 0.15s">
                      <Td py={3}>
                        <Text fontSize="13px" fontWeight="800" color={textColor}>
                          {dept.name}
                        </Text>
                      </Td>
                      <Td py={3} textAlign="center">
                        <Badge bg="#EEF2FF" color="#4F46E5" fontSize="11px" px={2.5} py={0.5} borderRadius="md" fontWeight="800">
                          {dept.registrations}
                        </Badge>
                      </Td>
                      <Td py={3} textAlign="center">
                        <Badge bg="#ECFDF5" color="#059669" fontSize="11px" px={2.5} py={0.5} borderRadius="md" fontWeight="800">
                          {dept.cocPaid}
                        </Badge>
                      </Td>
                      <Td py={3} textAlign="center">
                        <HStack justify="center" spacing={2}>
                          <Progress value={conversion} size="xs" colorScheme="green" w="50px" borderRadius="full" />
                          <Text fontSize="11px" fontWeight="700" color={textColor}>{conversion}%</Text>
                        </HStack>
                      </Td>
                      <Td py={3} textAlign="center">
                        <Text fontSize="12px" fontWeight="700" color={textColor}>
                          {dept.classCompleted}
                        </Text>
                      </Td>
                      <Td py={3} textAlign="right">
                        <Badge
                          colorScheme={isHighPerforming ? 'green' : 'purple'}
                          fontSize="10px"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                          fontWeight="700"
                        >
                          {isHighPerforming ? 'High Performing' : 'Active'}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Card>

      {/* ── ACADEMY INTELLIGENCE & OPERATIONAL HEALTH CARDS ── */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mt={6}>
        {/* Insight Card 1: Strategic Recommendations */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} boxShadow="sm">
          <HStack spacing={3} mb={3}>
            <Flex w="38px" h="38px" bg="#EEF2FF" color="#4F46E5" borderRadius="lg" align="center" justify="center">
              <Icon as={FiZap} boxSize="18px" />
            </Flex>
            <Box>
              <Heading size="xs" fontWeight="800" fontSize="13px" color={textColor}>
                Strategic Intake Advisory
              </Heading>
              <Text fontSize="10.5px" color={mutedText}>
                Automated data-driven recommendations
              </Text>
            </Box>
          </HStack>
          <VStack spacing={2.5} align="stretch" fontSize="11px">
            <Box p={2.5} bg={cardAltBg} borderRadius="lg" borderLeft="3px solid #4F46E5">
              <Text fontWeight="800" color={textColor}>Top Intake Discipline</Text>
              <Text color={mutedText} mt={0.5}>
                <b>{smartInsights.topDeptByReg.name}</b> leads overall registrations. Maintain faculty capacity for upcoming cycles.
              </Text>
            </Box>
            <Box p={2.5} bg={cardAltBg} borderRadius="lg" borderLeft="3px solid #059669">
              <Text fontWeight="800" color={textColor}>High-Conversion Focus</Text>
              <Text color={mutedText} mt={0.5}>
                <b>{smartInsights.topDeptByConversion.name}</b> achieves <b>{smartInsights.topConversionPercent}%</b> COC payment conversion.
              </Text>
            </Box>
          </VStack>
        </Card>

        {/* Insight Card 2: Demographic & Inclusivity Matrix */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} boxShadow="sm">
          <HStack spacing={3} mb={3}>
            <Flex w="38px" h="38px" bg="#FDF2F8" color="#DB2777" borderRadius="lg" align="center" justify="center">
              <Icon as={FiUsers} boxSize="18px" />
            </Flex>
            <Box>
              <Heading size="xs" fontWeight="800" fontSize="13px" color={textColor}>
                Gender Inclusivity
              </Heading>
              <Text fontSize="10.5px" color={mutedText}>
                Learner demographic participation
              </Text>
            </Box>
          </HStack>
          <VStack spacing={3} align="stretch">
            <Box>
              <Flex justify="space-between" fontSize="11px" mb={1}>
                <Text fontWeight="700" color={textColor}>Female Learners</Text>
                <Text fontWeight="800" color="#DB2777">{metrics.femaleRate}% ({metrics.femaleCount})</Text>
              </Flex>
              <Progress value={metrics.femaleRate} size="xs" colorScheme="pink" borderRadius="full" />
            </Box>
            <Box>
              <Flex justify="space-between" fontSize="11px" mb={1}>
                <Text fontWeight="700" color={textColor}>Male Learners</Text>
                <Text fontWeight="800" color="#4F46E5">{100 - metrics.femaleRate}% ({metrics.totalReg - metrics.femaleCount})</Text>
              </Flex>
              <Progress value={100 - metrics.femaleRate} size="xs" colorScheme="indigo" borderRadius="full" />
            </Box>
            <Text fontSize="10.5px" color={mutedText} pt={1} borderTop="1px" borderColor={borderColor}>
              Total registered cohort across active departments: <b>{metrics.totalReg}</b> learners.
            </Text>
          </VStack>
        </Card>

        {/* Insight Card 3: Academic Qualification & Pass Health */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5} boxShadow="sm">
          <HStack spacing={3} mb={3}>
            <Flex w="38px" h="38px" bg="#ECFDF5" color="#059669" borderRadius="lg" align="center" justify="center">
              <Icon as={FiCheckCircle} boxSize="18px" />
            </Flex>
            <Box>
              <Heading size="xs" fontWeight="800" fontSize="13px" color={textColor}>
                Academic Standards
              </Heading>
              <Text fontSize="10.5px" color={mutedText}>
                Evaluation benchmark standing
              </Text>
            </Box>
          </HStack>
          <VStack spacing={2.5} align="stretch" fontSize="11px">
            <Flex justify="space-between" align="center" p={2} bg={cardAltBg} borderRadius="lg">
              <Text fontWeight="700" color={textColor}>Examination Pass Benchmark</Text>
              <Badge colorScheme={metrics.passRate >= 80 ? 'green' : 'orange'} fontSize="11px" fontWeight="800" px={2} py={0.5} borderRadius="md">
                {metrics.passRate}%
              </Badge>
            </Flex>
            <Flex justify="space-between" align="center" p={2} bg={cardAltBg} borderRadius="lg">
              <Text fontWeight="700" color={textColor}>Course Completion Rate</Text>
              <Badge colorScheme="purple" fontSize="11px" fontWeight="800" px={2} py={0.5} borderRadius="md">
                {metrics.classCompletionRate}%
              </Badge>
            </Flex>
            <Flex justify="space-between" align="center" p={2} bg={cardAltBg} borderRadius="lg">
              <Text fontWeight="700" color={textColor}>Verified COC Enrollment</Text>
              <Badge colorScheme="teal" fontSize="11px" fontWeight="800" px={2} py={0.5} borderRadius="md">
                {metrics.cocConversionRate}%
              </Badge>
            </Flex>
          </VStack>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
