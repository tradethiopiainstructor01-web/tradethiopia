import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
  Select,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FiSend,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiPackage,
  FiLayers,
  FiRefreshCw,
  FiEye,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiInfo,
  FiDatabase,
  FiRotateCcw,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  LabelList,
} from 'recharts';
import {
  getSalesDepartmentKpis,
  saveSalesDepartmentKpi,
  getSalesLiveStats,
  getRealOperationalSalesKpis,
} from '../../services/salesDepartmentKpiService';

const STATUS_COLORS = {
  'On Track': { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  Completed: { bg: '#bbf7d0', text: '#14532d', border: '#86efac' },
  'At Risk': { bg: '#fef9c3', text: '#854d0e', border: '#fef08a' },
  Behind: { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' },
  'Not Reported': { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
  Pending: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

const formatNumber = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString();
};

const getIsoWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

const MONTHS = [
  { value: '01', short: 'Jan', label: 'January' },
  { value: '02', short: 'Feb', label: 'February' },
  { value: '03', short: 'Mar', label: 'March' },
  { value: '04', short: 'Apr', label: 'April' },
  { value: '05', short: 'May', label: 'May' },
  { value: '06', short: 'Jun', label: 'June' },
  { value: '07', short: 'Jul', label: 'July' },
  { value: '08', short: 'Aug', label: 'August' },
  { value: '09', short: 'Sep', label: 'September' },
  { value: '10', short: 'Oct', label: 'October' },
  { value: '11', short: 'Nov', label: 'November' },
  { value: '12', short: 'Dec', label: 'December' },
];

const QUARTERS = [
  { value: 'Q1', label: 'Q1 (Jan - Mar)' },
  { value: 'Q2', label: 'Q2 (Apr - Jun)' },
  { value: 'Q3', label: 'Q3 (Jul - Sep)' },
  { value: 'Q4', label: 'Q4 (Oct - Dec)' },
];

const getWeekDateRange = (year, weekNo) => {
  const simple = new Date(year, 0, 1 + (weekNo - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

  const formatShort = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${formatShort(ISOweekStart)} - ${formatShort(ISOweekEnd)}`;
};

const generateWeeksForYear = (year) => {
  const weeks = [];
  for (let i = 1; i <= 52; i++) {
    const val = `W${String(i).padStart(2, '0')}`;
    const range = getWeekDateRange(year, i);
    weeks.push({
      value: val,
      weekNum: i,
      label: `Week ${i} (${range})`,
    });
  }
  return weeks;
};

const SalesCooKpiPage = () => {
  const toast = useToast();
  const { isOpen: isPreviewOpen, onOpen: onOpenPreview, onClose: onClosePreview } = useDisclosure();

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentIsoWeek = getIsoWeekNumber(now);
  const currentWeekStr = `W${String(currentIsoWeek).padStart(2, '0')}`;
  const currentQuarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;

  const [periodType, setPeriodType] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedWeek, setSelectedWeek] = useState(currentWeekStr);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);

  // Compute periodKey automatically from dropdown selections
  const periodKey = useMemo(() => {
    if (periodType === 'weekly') {
      return `${selectedYear}-${selectedWeek}`;
    }
    if (periodType === 'quarterly') {
      return `${selectedYear}-${selectedQuarter}`;
    }
    return `${selectedYear}-${selectedMonth}`;
  }, [periodType, selectedYear, selectedMonth, selectedWeek, selectedQuarter]);

  // Compute human-friendly period label
  const periodDisplayLabel = useMemo(() => {
    if (periodType === 'weekly') {
      const weekNum = parseInt(selectedWeek.replace('W', ''), 10);
      const dateRange = getWeekDateRange(selectedYear, weekNum);
      const isThisWeek = selectedYear === currentYear && selectedWeek === currentWeekStr;
      return `Week ${weekNum} (${dateRange})${isThisWeek ? ' ★ Current' : ''}`;
    }
    if (periodType === 'quarterly') {
      const qObj = QUARTERS.find((q) => q.value === selectedQuarter);
      return `${qObj ? qObj.label : selectedQuarter} ${selectedYear}`;
    }
    const mObj = MONTHS.find((m) => m.value === selectedMonth);
    const isThisMonth = selectedYear === currentYear && selectedMonth === currentMonth;
    return `${mObj ? mObj.label : selectedMonth} ${selectedYear}${isThisMonth ? ' ★ Current' : ''}`;
  }, [periodType, selectedYear, selectedMonth, selectedWeek, selectedQuarter, currentYear, currentWeekStr, currentMonth]);

  const availableWeeks = useMemo(() => {
    return generateWeeksForYear(selectedYear);
  }, [selectedYear]);

  const handleSetCurrentPeriod = () => {
    setSelectedYear(currentYear);
    if (periodType === 'weekly') {
      setSelectedWeek(currentWeekStr);
    } else if (periodType === 'quarterly') {
      setSelectedQuarter(currentQuarter);
    } else {
      setSelectedMonth(currentMonth);
    }
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingStats, setFetchingStats] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState(null);
  const [isRealDataSynced, setIsRealDataSynced] = useState(false);
  const [liveOperationalStats, setLiveOperationalStats] = useState(null);

  // Form State
  const [measurements, setMeasurements] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [summaryNotes, setSummaryNotes] = useState('');

  // Load KPI data from backend
  const loadKpis = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSalesDepartmentKpis(periodType, periodKey);
      const data = res?.data || {};

      setMeasurements(data.measurements || []);
      setServices(data.services || []);
      setProducts(data.products || []);
      setSummaryNotes(data.summaryNotes || '');
      setLastSubmitted(data.submittedAt ? { at: data.submittedAt, by: data.submittedByName } : null);
      setIsRealDataSynced(Boolean(data.isLiveOperational || res?.operationalRealData));
      if (res?.operationalRealData?.stats) {
        setLiveOperationalStats(res.operationalRealData.stats);
      }
    } catch (err) {
      console.error('Failed to load Sales KPIs:', err);
      toast({
        title: 'Error loading KPI data',
        description: err?.response?.data?.message || err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [periodType, periodKey, toast]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  // Update field helpers
  const handleRowChange = (section, index, field, value) => {
    const updateSection = (prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };

      if (field === 'target' || field === 'actual') {
        const rawTarget = field === 'target' ? value : row.target;
        const rawActual = field === 'actual' ? value : row.actual;
        const target = (rawTarget === '' || isNaN(rawTarget) || rawTarget === null || rawTarget === undefined) ? 0 : Number(rawTarget);
        const actual = (rawActual === '' || isNaN(rawActual) || rawActual === null || rawActual === undefined) ? 0 : Number(rawActual);
        row.target = target;
        row.actual = actual;
        const achievement = target > 0 ? Math.round((actual / target) * 100) : 0;
        row.achievement = achievement;

        if (target === 0 && actual === 0) {
          row.status = 'Not Reported';
        } else if (target > 0) {
          if (achievement >= 100) row.status = 'Completed';
          else if (achievement >= 80) row.status = 'On Track';
          else if (achievement >= 50) row.status = 'At Risk';
          else row.status = 'Behind';
        } else {
          row.status = 'On Track';
        }
      }

      updated[index] = row;
      return updated;
    };

    if (section === 'measurements') setMeasurements(updateSection);
    else if (section === 'services') setServices(updateSection);
    else if (section === 'products') setProducts(updateSection);
  };

  // Submit to COO2
  const handleSubmit = async () => {
    try {
      setSaving(true);
      const sanitizeSection = (rows) => (rows || []).map((r) => {
        const target = (r.target === '' || isNaN(r.target) || r.target === null || r.target === undefined) ? 0 : Number(r.target);
        const actual = (r.actual === '' || isNaN(r.actual) || r.actual === null || r.actual === undefined) ? 0 : Number(r.actual);
        const achievement = target > 0 ? Math.round((actual / target) * 100) : 0;
        return {
          ...r,
          target,
          actual,
          achievement,
          status: r.status || (target === 0 && actual === 0 ? 'Not Reported' : 'Pending'),
        };
      });

      const payload = {
        periodType,
        periodKey,
        year: parseInt(periodKey.split('-')[0]) || new Date().getFullYear(),
        measurements: sanitizeSection(measurements),
        services: sanitizeSection(services),
        products: sanitizeSection(products),
        summaryNotes,
      };

      const res = await saveSalesDepartmentKpi(payload);
      const data = res?.data;

      setLastSubmitted({
        at: data?.submittedAt || new Date(),
        by: data?.submittedByName || 'Sales Manager',
      });

      toast({
        title: 'KPI Report Submitted to COO2',
        description: `Successfully transmitted ${periodType} KPI metrics (${periodKey}) to executive dashboard.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Submission failed:', err);
      toast({
        title: 'Submission Failed',
        description: err?.response?.data?.message || err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Sync with real MongoDB database operational data
  const handleSyncRealData = async () => {
    try {
      setFetchingStats(true);
      const res = await getRealOperationalSalesKpis(periodType, periodKey);
      const opData = res?.data || {};

      if (opData.measurements && opData.measurements.length > 0) {
        setMeasurements(opData.measurements);
      }
      if (opData.services && opData.services.length > 0) {
        setServices(opData.services);
      }
      if (opData.products && opData.products.length > 0) {
        setProducts(opData.products);
      }
      if (opData.stats) {
        setLiveOperationalStats(opData.stats);
      }
      setIsRealDataSynced(true);

      toast({
        title: 'Real Database Operational Data Synced',
        description: `Loaded real operational metrics from MongoDB for ${periodKey}.`,
        status: 'success',
        duration: 3500,
        isClosable: true,
      });
    } catch (err) {
      console.error('Failed to sync real operational data:', err);
      toast({
        title: 'Could not sync real data',
        description: err?.response?.data?.message || err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setFetchingStats(false);
    }
  };

  // Completely reset all targets, actuals, and achievements to zero
  const handleResetAllToZero = () => {
    const zeroRows = (rows) => (rows || []).map((r) => ({
      ...r,
      target: 0,
      actual: 0,
      achievement: 0,
      status: 'Not Reported',
    }));
    setMeasurements((prev) => zeroRows(prev));
    setServices((prev) => zeroRows(prev));
    setProducts((prev) => zeroRows(prev));
    setSummaryNotes('');
    toast({
      title: 'Completely Reset to Zero',
      description: 'All targets, actuals, and achievements have been reset to 0.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Stat summary calculations
  const statsSummary = useMemo(() => {
    const revRow = measurements.find((m) => m.kpi === 'Total Revenue') || {};
    const totalRevTarget = Number(revRow.target) || 0;
    const totalRevActual = Number(revRow.actual) || 0;
    const revAchievement = totalRevTarget > 0 ? Math.round((totalRevActual / totalRevTarget) * 100) : 0;

    const totalServiceTarget = services.reduce((acc, curr) => acc + (Number(curr.target) || 0), 0);
    const totalServiceActual = services.reduce((acc, curr) => acc + (Number(curr.actual) || 0), 0);
    const serviceAchievement = totalServiceTarget > 0 ? Math.round((totalServiceActual / totalServiceTarget) * 100) : 0;

    const totalProductTarget = products.reduce((acc, curr) => acc + (Number(curr.target) || 0), 0);
    const totalProductActual = products.reduce((acc, curr) => acc + (Number(curr.actual) || 0), 0);

    const allMetrics = [...measurements, ...services, ...products];
    const completedCount = allMetrics.filter((m) => m.status === 'Completed' || m.status === 'On Track').length;
    const totalTracked = allMetrics.length || 1;
    const overallScore = Math.round((completedCount / totalTracked) * 100);

    return {
      totalRevTarget,
      totalRevActual,
      revAchievement,
      totalServiceTarget,
      totalServiceActual,
      serviceAchievement,
      totalProductTarget,
      totalProductActual,
      overallScore,
    };
  }, [measurements, services, products]);

  const renderKpiTable = (rows, sectionName, title, firstColLabel = 'KPI') => (
    <Card borderRadius="14px" border="1px solid #e2e8f0" overflow="hidden" boxShadow="sm" mb={6}>
      <Box bg="#006994" color="white" px={6} py={3.5} display="flex" justifyContent="space-between" alignItems="center">
        <Heading as="h3" fontSize={{ base: '16px', md: '18px' }} fontWeight="700">
          {title}
        </Heading>
        <Badge bg="whiteAlpha.300" color="white" px={2.5} py={1} borderRadius="full" fontSize="12px">
          {rows.length} Metrics
        </Badge>
      </Box>

      <TableContainer overflowX="auto">
        <Table variant="simple" size="sm" minW="1020px">
          <Thead bg="#f8fafc">
            <Tr>
              <Th color="#334155" py={4} fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="0.5px" minW="210px" w="210px">
                {firstColLabel}
              </Th>
              <Th color="#334155" py={4} fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="0.5px" textAlign="center" minW="155px" w="155px">
                Target
              </Th>
              <Th color="#334155" py={4} fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="0.5px" textAlign="center" minW="155px" w="155px">
                Actual / Achieved
              </Th>
              <Th color="#334155" py={4} fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="0.5px" textAlign="center" minW="105px" w="105px">
                Achieve %
              </Th>
              <Th color="#334155" py={4} fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="0.5px" textAlign="center" minW="165px" w="165px">
                Status
              </Th>
              <Th color="#334155" py={4} fontSize="12px" fontWeight="700" textTransform="uppercase" letterSpacing="0.5px" minW="235px">
                Manager Notes / Justification
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((row, idx) => {
              const statusTheme = STATUS_COLORS[row.status] || STATUS_COLORS.Pending;
              return (
                <Tr key={row.kpi} _hover={{ bg: '#fbfcfd' }}>
                  <Td fontWeight="700" color="#1e293b" fontSize="13.5px" minW="210px" w="210px" py={3}>
                    {row.kpi}
                  </Td>
                  <Td textAlign="center" minW="155px" w="155px" py={3}>
                    <Box maxW="135px" mx="auto">
                      <NumberInput
                        size="sm"
                        min={0}
                        w="100%"
                        value={row.target ?? 0}
                        onChange={(_, val) => handleRowChange(sectionName, idx, 'target', isNaN(val) || val === '' ? 0 : val)}
                        clampValueOnBlur={false}
                      >
                        <NumberInputField
                          textAlign="center"
                          fontWeight="600"
                          bg="#ffffff"
                          borderRadius="8px"
                          borderColor="#cbd5e1"
                          fontSize="13px"
                          px={2}
                          _focus={{ borderColor: '#006994', boxShadow: '0 0 0 1px #006994' }}
                        />
                      </NumberInput>
                      {Number(row.target) >= 1000 && (
                        <Text fontSize="10.5px" color="#64748b" fontWeight="600" mt={0.5} textAlign="center">
                          {Number(row.target).toLocaleString()}
                        </Text>
                      )}
                    </Box>
                  </Td>
                  <Td textAlign="center" minW="155px" w="155px" py={3}>
                    <Box maxW="135px" mx="auto">
                      <NumberInput
                        size="sm"
                        min={0}
                        w="100%"
                        value={row.actual ?? 0}
                        onChange={(_, val) => handleRowChange(sectionName, idx, 'actual', isNaN(val) || val === '' ? 0 : val)}
                        clampValueOnBlur={false}
                      >
                        <NumberInputField
                          textAlign="center"
                          fontWeight="700"
                          color="#006994"
                          bg="#ffffff"
                          borderRadius="8px"
                          borderColor="#cbd5e1"
                          fontSize="13px"
                          px={2}
                          _focus={{ borderColor: '#006994', boxShadow: '0 0 0 1px #006994' }}
                        />
                      </NumberInput>
                      {Number(row.actual) >= 1000 && (
                        <Text fontSize="10.5px" color="#006994" fontWeight="600" mt={0.5} textAlign="center">
                          {Number(row.actual).toLocaleString()}
                        </Text>
                      )}
                    </Box>
                  </Td>
                  <Td textAlign="center" minW="105px" w="105px" py={3}>
                    <Badge
                      px={2.5}
                      py={1}
                      borderRadius="full"
                      fontSize="12px"
                      fontWeight="800"
                      colorScheme={
                        row.achievement >= 100 ? 'green' :
                        row.achievement >= 80 ? 'teal' :
                        row.achievement >= 50 ? 'yellow' : 'orange'
                      }
                    >
                      {row.achievement !== null && row.achievement !== undefined && !isNaN(row.achievement) ? `${row.achievement}%` : '0%'}
                    </Badge>
                  </Td>
                  <Td textAlign="center" minW="165px" w="165px" py={3}>
                    <Box maxW="150px" mx="auto">
                      <Select
                        size="sm"
                        w="100%"
                        minW="140px"
                        value={row.status || 'Pending'}
                        onChange={(e) => handleRowChange(sectionName, idx, 'status', e.target.value)}
                        bg={statusTheme.bg}
                        color={statusTheme.text}
                        borderColor={statusTheme.border}
                        fontWeight="700"
                        borderRadius="8px"
                        fontSize="12.5px"
                        cursor="pointer"
                      >
                        <option value="On Track">On Track</option>
                        <option value="Completed">Completed</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Behind">Behind</option>
                        <option value="Not Reported">Not Reported</option>
                        <option value="Pending">Pending</option>
                      </Select>
                    </Box>
                  </Td>
                  <Td minW="235px" py={3}>
                    <Input
                      size="sm"
                      placeholder="Operational note..."
                      value={row.notes || ''}
                      onChange={(e) => handleRowChange(sectionName, idx, 'notes', e.target.value)}
                      borderRadius="8px"
                      fontSize="12.5px"
                      bg="#ffffff"
                      borderColor="#cbd5e1"
                      _focus={{ borderColor: '#006994', boxShadow: '0 0 0 1px #006994' }}
                    />
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </Card>
  );

  return (
    <Box p={{ base: 4, md: 6, lg: 8 }} maxW="1500px" mx="auto">
      {/* 1. Header Banner */}
      <Card
        borderRadius="16px"
        bg="linear-gradient(135deg, #004d74 0%, #006994 50%, #0096c7 100%)"
        color="white"
        p={{ base: 5, md: 7 }}
        mb={7}
        boxShadow="md"
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          gap={4}
        >
          <Box>
            <HStack spacing={2} mb={1}>
              <Badge colorScheme="teal" bg="whiteAlpha.300" color="white" px={3} py={0.8} borderRadius="full" fontSize="11.5px">
                COO2 Executive Reporting
              </Badge>
              {lastSubmitted && (
                <Badge colorScheme="green" bg="green.500" color="white" px={3} py={0.8} borderRadius="full" fontSize="11.5px">
                  <HStack spacing={1}>
                    <FiCheckCircle />
                    <Text as="span">Submitted by {lastSubmitted.by}</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>
            <Heading as="h1" fontSize={{ base: '22px', md: '28px' }} fontWeight="800">
              Sales &amp; Services COO KPI Submission
            </Heading>
            <Text mt={1.5} fontSize="14px" color="whiteAlpha.900" maxW="800px">
              Input and report weekly, monthly, and quarterly department conversions, product sales, and revenue to the COO2 Executive Dashboard.
            </Text>
          </Box>

          <HStack spacing={3} wrap="wrap">
            <Button
              leftIcon={<FiDatabase />}
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              size="sm"
              isLoading={fetchingStats}
              onClick={handleSyncRealData}
            >
              Sync Real Database Actuals
            </Button>
            <Button
              leftIcon={<FiRotateCcw />}
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              size="sm"
              onClick={handleResetAllToZero}
            >
              Reset All to 0
            </Button>
            <Button
              leftIcon={<FiEye />}
              variant="solid"
              bg="whiteAlpha.200"
              color="white"
              _hover={{ bg: 'whiteAlpha.300' }}
              size="sm"
              onClick={onOpenPreview}
            >
              COO2 Preview
            </Button>
            <Button
              leftIcon={<FiSend />}
              colorScheme="teal"
              bg="#10b981"
              color="white"
              _hover={{ bg: '#059669' }}
              size="sm"
              px={5}
              isLoading={saving}
              loadingText="Submitting..."
              onClick={handleSubmit}
            >
              Submit to COO2
            </Button>
          </HStack>
        </Flex>

        {/* Period Selector Bar */}
        <Divider my={4} borderColor="whiteAlpha.300" />

        <Flex
          direction={{ base: 'column', lg: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', lg: 'center' }}
          gap={4}
          wrap="wrap"
        >
          {/* Frequency Selector */}
          <HStack spacing={1.5} bg="whiteAlpha.200" p={1} borderRadius="10px" alignSelf={{ base: 'flex-start', lg: 'center' }}>
            {['monthly', 'weekly', 'quarterly'].map((type) => (
              <Button
                key={type}
                size="xs"
                px={3.5}
                py={3}
                borderRadius="8px"
                fontWeight="700"
                textTransform="capitalize"
                bg={periodType === type ? 'white' : 'transparent'}
                color={periodType === type ? '#006994' : 'white'}
                _hover={{ bg: periodType === type ? 'white' : 'whiteAlpha.300' }}
                onClick={() => setPeriodType(type)}
              >
                {type}
              </Button>
            ))}
          </HStack>

          {/* Time Dropdowns: Year + Month/Week/Quarter */}
          <Flex wrap="wrap" align="center" gap={3}>
            {/* Year Selector (2020..) */}
            <HStack spacing={1.5}>
              <Text fontSize="12px" fontWeight="700" color="whiteAlpha.900">Year:</Text>
              <Select
                size="sm"
                w="95px"
                bg="white"
                color="#0f172a"
                fontWeight="700"
                borderRadius="8px"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </HStack>

            {/* Monthly view: Month dropdown (January, February... August..) */}
            {periodType === 'monthly' && (
              <HStack spacing={1.5}>
                <Text fontSize="12px" fontWeight="700" color="whiteAlpha.900">Month:</Text>
                <Select
                  size="sm"
                  w="155px"
                  bg="white"
                  color="#0f172a"
                  fontWeight="700"
                  borderRadius="8px"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label} ({m.short})
                    </option>
                  ))}
                </Select>
              </HStack>
            )}

            {/* Weekly view: Auto-calculated weeks */}
            {periodType === 'weekly' && (
              <HStack spacing={1.5}>
                <Text fontSize="12px" fontWeight="700" color="whiteAlpha.900">Week:</Text>
                <Select
                  size="sm"
                  w="225px"
                  bg="white"
                  color="#0f172a"
                  fontWeight="700"
                  borderRadius="8px"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                >
                  {availableWeeks.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label} {selectedYear === currentYear && w.value === currentWeekStr ? '★ Current' : ''}
                    </option>
                  ))}
                </Select>
              </HStack>
            )}

            {/* Quarterly view */}
            {periodType === 'quarterly' && (
              <HStack spacing={1.5}>
                <Text fontSize="12px" fontWeight="700" color="whiteAlpha.900">Quarter:</Text>
                <Select
                  size="sm"
                  w="160px"
                  bg="white"
                  color="#0f172a"
                  fontWeight="700"
                  borderRadius="8px"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                >
                  {QUARTERS.map((q) => (
                    <option key={q.value} value={q.value}>{q.label}</option>
                  ))}
                </Select>
              </HStack>
            )}

            {/* Quick button to jump to Current time */}
            <Button
              size="sm"
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              leftIcon={<FiClock />}
              onClick={handleSetCurrentPeriod}
              fontSize="12px"
            >
              Current {periodType === 'weekly' ? 'Week' : periodType === 'quarterly' ? 'Quarter' : 'Month'}
            </Button>
          </Flex>

          {/* Active Period Display Badge */}
          <HStack spacing={2}>
            <Badge bg="white" color="#006994" px={3} py={1.5} borderRadius="full" fontSize="12px" fontWeight="800" boxShadow="sm">
              <HStack spacing={1}>
                <FiCalendar />
                <Text as="span">{periodDisplayLabel}</Text>
              </HStack>
            </Badge>
          </HStack>
        </Flex>
      </Card>

      {/* 2. Top Summary KPI Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        <Card border="1px solid #e2e8f0" borderRadius="14px" boxShadow="sm">
          <CardBody p={5}>
            <Flex justify="space-between" align="flex-start">
              <Box>
                <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">
                  Target Revenue
                </Text>
                <Heading as="h4" fontSize="20px" fontWeight="800" color="#0f172a" mt={1}>
                  ETB {formatNumber(statsSummary.totalRevActual)}
                </Heading>
                <Text fontSize="12px" color="#64748b" mt={0.5}>
                  Goal: ETB {formatNumber(statsSummary.totalRevTarget)}
                </Text>
              </Box>
              <Box p={2.5} borderRadius="10px" bg="#ecfdf5" color="#10b981">
                <FiDollarSign size={20} />
              </Box>
            </Flex>
            <Badge mt={2.5} colorScheme={statsSummary.revAchievement >= 80 ? 'green' : statsSummary.revAchievement >= 50 ? 'yellow' : 'orange'}>
              {statsSummary.revAchievement}% Achieved
            </Badge>
          </CardBody>
        </Card>

        <Card border="1px solid #e2e8f0" borderRadius="14px" boxShadow="sm">
          <CardBody p={5}>
            <Flex justify="space-between" align="flex-start">
              <Box>
                <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">
                  Service Conversions
                </Text>
                <Heading as="h4" fontSize="20px" fontWeight="800" color="#0f172a" mt={1}>
                  {formatNumber(statsSummary.totalServiceActual)} Deals
                </Heading>
                <Text fontSize="12px" color="#64748b" mt={0.5}>
                  Goal: {formatNumber(statsSummary.totalServiceTarget)} Deals
                </Text>
              </Box>
              <Box p={2.5} borderRadius="10px" bg="#eff6ff" color="#3b82f6">
                <FiLayers size={20} />
              </Box>
            </Flex>
            <Badge mt={2.5} colorScheme={statsSummary.serviceAchievement >= 80 ? 'green' : 'orange'}>
              {statsSummary.serviceAchievement}% of Services
            </Badge>
          </CardBody>
        </Card>

        <Card border="1px solid #e2e8f0" borderRadius="14px" boxShadow="sm">
          <CardBody p={5}>
            <Flex justify="space-between" align="flex-start">
              <Box>
                <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">
                  Product Shipments
                </Text>
                <Heading as="h4" fontSize="20px" fontWeight="800" color="#0f172a" mt={1}>
                  {formatNumber(statsSummary.totalProductActual)} Units
                </Heading>
                <Text fontSize="12px" color="#64748b" mt={0.5}>
                  Target: {formatNumber(statsSummary.totalProductTarget)} Units
                </Text>
              </Box>
              <Box p={2.5} borderRadius="10px" bg="#faf5ff" color="#a855f7">
                <FiPackage size={20} />
              </Box>
            </Flex>
            <Badge mt={2.5} colorScheme="purple">
              Equipment &amp; Hardware
            </Badge>
          </CardBody>
        </Card>

        <Card border="1px solid #e2e8f0" borderRadius="14px" boxShadow="sm">
          <CardBody p={5}>
            <Flex justify="space-between" align="flex-start">
              <Box>
                <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">
                  KPI Health Score
                </Text>
                <Heading as="h4" fontSize="20px" fontWeight="800" color="#0f172a" mt={1}>
                  {statsSummary.overallScore}%
                </Heading>
                <Text fontSize="12px" color="#64748b" mt={0.5}>
                  On Track or Completed
                </Text>
              </Box>
              <Box p={2.5} borderRadius="10px" bg="#fff7ed" color="#f97316">
                <FiActivity size={20} />
              </Box>
            </Flex>
            <Badge mt={2.5} colorScheme={statsSummary.overallScore >= 70 ? 'green' : 'red'}>
              {statsSummary.overallScore >= 70 ? 'Healthy' : 'Needs Action'}
            </Badge>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* 3. Main Data Entry Area */}
      {loading ? (
        <Flex justify="center" align="center" minH="240px">
          <Spinner size="xl" color="#006994" thickness="4px" />
        </Flex>
      ) : (
        <>
          <Alert status="info" borderRadius="12px" mb={5} bg="#f0f9ff" borderColor="#bae6fd" borderWidth="1px" boxShadow="xs">
            <AlertIcon as={FiDatabase} color="#0284c7" boxSize="18px" />
            <Box flex="1">
              <HStack spacing={2} wrap="wrap">
                <Text fontWeight="700" color="#0369a1" fontSize="13.5px">
                  Real Operational Data Source
                </Text>
                <Badge colorScheme="blue" bg="#e0f2fe" color="#0369a1" fontSize="11px" px={2.5} py={0.5} borderRadius="full">
                  Period: {periodDisplayLabel}
                </Badge>
                {isRealDataSynced && (
                  <Badge colorScheme="green" bg="#dcfce7" color="#15803d" fontSize="11px" px={2.5} py={0.5} borderRadius="full">
                    Live Database Records Loaded
                  </Badge>
                )}
              </HStack>
              <Text fontSize="12.5px" color="#0284c7" mt={0.5}>
                Metrics are aggregated from real MongoDB database records (SalesCustomer, PackageSale, Orders, and Revenue ledger) for {periodDisplayLabel}.
                {liveOperationalStats && (
                  <Text as="span" fontWeight="700" ml={1} color="#0c4a6e">
                    (Real Revenue: ETB {formatNumber(liveOperationalStats.totalRevenue)} | Leads: {formatNumber(liveOperationalStats.newClients)} | Conversions: {formatNumber(liveOperationalStats.completedDeals)} deals)
                  </Text>
                )}
              </Text>
            </Box>
            <Button
              size="xs"
              colorScheme="blue"
              bg="#0284c7"
              color="white"
              _hover={{ bg: '#0369a1' }}
              leftIcon={<FiDatabase />}
              isLoading={fetchingStats}
              onClick={handleSyncRealData}
            >
              Sync DB Actuals
            </Button>
          </Alert>

          <Tabs variant="enclosed" colorScheme="teal">
          <TabList mb={4} borderBottom="2px solid #e2e8f0">
            <Tab fontWeight="700" fontSize="14px">
              1. Sales Measurements ({measurements.length})
            </Tab>
            <Tab fontWeight="700" fontSize="14px">
              2. Service Lines ({services.length})
            </Tab>
            <Tab fontWeight="700" fontSize="14px">
              3. Product KPIs ({products.length})
            </Tab>
            <Tab fontWeight="700" fontSize="14px">
              4. Executive Comments
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              {renderKpiTable(measurements, 'measurements', 'Sales Operational Measurements', 'Measurement Metric')}
            </TabPanel>

            <TabPanel p={0}>
              {renderKpiTable(services, 'services', 'Service-Line Conversion Performance', 'Service Package')}
            </TabPanel>

            <TabPanel p={0}>
              {renderKpiTable(products, 'products', 'Product Delivery & Machine KPIs', 'Product Name')}
            </TabPanel>

            <TabPanel p={0}>
              <Card borderRadius="14px" border="1px solid #e2e8f0" p={6} mb={6}>
                <Heading as="h3" fontSize="17px" fontWeight="700" mb={2} color="#1e293b">
                  Executive Notes &amp; Recommendations for COO2
                </Heading>
                <Text fontSize="13px" color="#64748b" mb={4}>
                  Share context on conversion blockers, market dynamics, agent team achievements, or resource needs with leadership.
                </Text>
                <Textarea
                  rows={5}
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  placeholder="e.g., Export documentation conversions were impacted by delayed regulatory clearance this week..."
                  borderRadius="8px"
                  bg="#ffffff"
                  borderColor="#cbd5e1"
                  fontSize="14px"
                />
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
        </>
      )}

      {/* 4. Bottom Submission Footer */}
      <Flex justify="space-between" align="center" bg="#ffffff" p={4} borderRadius="12px" border="1px solid #e2e8f0" boxShadow="sm">
        <HStack spacing={2} color="#64748b" fontSize="13px">
          <FiInfo />
          <Text>Changes saved locally until you click <strong>Submit to COO2</strong>.</Text>
        </HStack>

        <HStack spacing={3}>
          <Button variant="outline" size="sm" onClick={loadKpis}>
            Discard / Reset
          </Button>
          <Button
            leftIcon={<FiSend />}
            colorScheme="teal"
            bg="#006994"
            color="white"
            _hover={{ bg: '#00557a' }}
            size="sm"
            px={6}
            isLoading={saving}
            onClick={handleSubmit}
          >
            Submit KPI Report to COO2
          </Button>
        </HStack>
      </Flex>

      {/* 5. Live COO2 Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onClosePreview} size="6xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(3px)" />
        <ModalContent borderRadius="16px">
          <ModalHeader bg="#213f70" color="white" borderTopRadius="16px">
            <Flex justify="space-between" align="center">
              <Box>
                <Heading as="h2" fontSize="20px">COO2 Dashboard Live Preview</Heading>
                <Text fontSize="12.5px" color="whiteAlpha.800" fontWeight="normal">
                  Preview of how the COO2 Executive will see your {periodType} submission for {periodKey}
                </Text>
              </Box>
              <Badge bg="#10b981" color="white" px={3} py={1} borderRadius="full">
                Period: {periodKey}
              </Badge>
            </Flex>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={6} bg="#f8fafc">
            {/* Sales Measurements Preview */}
            <Box mb={6} border="1px solid #d1d5db" bg="white" overflow="hidden" borderRadius="8px">
              <Box bg="#137b7e" color="white" px={5} py={2}>
                <Heading as="h3" fontSize="18px">Sales Measurements</Heading>
              </Box>
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead bg="#213f70">
                    <Tr>
                      {['Measurement', 'Target', 'Actual', 'Achievement %', 'Status'].map((h) => (
                        <Th key={h} color="white" textAlign="center" py={2.5}>{h}</Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {measurements.map((r, i) => {
                      const st = STATUS_COLORS[r.status] || STATUS_COLORS.Behind;
                      return (
                        <Tr key={r.kpi} bg={i % 2 ? '#f8fafc' : 'white'}>
                          <Td fontWeight="700">{r.kpi}</Td>
                          <Td textAlign="center">{formatNumber(r.target)}</Td>
                          <Td textAlign="center">{formatNumber(r.actual)}</Td>
                          <Td textAlign="center">{r.achievement !== null && r.achievement !== undefined && !isNaN(r.achievement) ? `${r.achievement}%` : '0%'}</Td>
                          <Td textAlign="center" fontWeight="600" bg={st.bg} color={st.text}>{r.status}</Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            {/* Service Lines Chart Preview */}
            <Box bg="white" border="1px solid #d1d5db" p={5} borderRadius="8px" mb={6}>
              <Heading as="h3" textAlign="center" fontSize="18px" mb={3}>
                Service Lines: Target vs Achieved
              </Heading>
              <Box h="320px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={services} margin={{ top: 20, right: 10, left: 0, bottom: 80 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="kpi" angle={-35} textAnchor="end" interval={0} height={80} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="target" name="Target" fill="#5285bf" maxBarSize={32} />
                    <Bar dataKey="actual" name="Achieved" fill="#c65353" maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </ModalBody>
          <ModalFooter bg="#ffffff" borderBottomRadius="16px">
            <Button colorScheme="blue" onClick={onClosePreview}>
              Close Preview
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SalesCooKpiPage;
