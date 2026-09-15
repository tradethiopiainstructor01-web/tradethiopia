import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
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
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  Table,
  TableContainer,
  TabList,
  Tabs,
  Tbody,
  Td,
  Text,
  Textarea,
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
  FiActivity,
  FiAlertCircle,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit2,
  FiFilter,
  FiLayers,
  FiMonitor,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { getTessbinKpiReport, saveTessbinKpiReport, getTessbinLiveCounts } from '../../services/tessbinKpiService';
import TessbinKpiTargetsForm from './TessbinKpiTargetsForm';
import { reportingPeriodOptions, reportingPeriodStart } from '../../utils/tessbinReportingPeriods';

const PRIMARY_PURPLE = '#1E1B4B';
const ACCENT_PURPLE = '#6366F1';

// Config metadata for the 4 Tessbin KPIs (HR Style)
const KPI_CONFIG = [
  {
    key: 'coc',
    label: 'COC Exam Students',
    short: 'COC Exams',
    description: 'Students who took or completed national TVET / COC exams',
    icon: FiAward,
    color: 'purple',
    unit: 'Students',
  },
  {
    key: 'online',
    label: 'Online Final Exam Students',
    short: 'Online Finals',
    description: 'Students who completed academic online final examinations',
    icon: FiMonitor,
    color: 'blue',
    unit: 'Students',
  },
  {
    key: 'students',
    label: 'New Registered Students',
    short: 'Registrations',
    description: 'New students admitted & registered during this period',
    icon: FiUsers,
    color: 'teal',
    unit: 'Students',
  },
  {
    key: 'evaluations',
    label: 'Evaluations Submitted',
    short: 'Evaluations',
    description: 'Official course evaluations & training feedback forms submitted',
    icon: FiCheckCircle,
    color: 'green',
    unit: 'Evaluations',
  },
];

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

const QUARTERS = [
  { value: 'Q1', month: '01', label: 'Q1 (Jan - Mar)' },
  { value: 'Q2', month: '04', label: 'Q2 (Apr - Jun)' },
  { value: 'Q3', month: '07', label: 'Q3 (Jul - Sep)' },
  { value: 'Q4', month: '10', label: 'Q4 (Oct - Dec)' },
];

const todayIso = () => new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
const displayDate = (value) => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const periodLabel = (report) => report ? `${displayDate(report.periodStart)} – ${displayDate(report.periodEnd)}` : '';

export default function TessbinKpiReportsView() {
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const currentYear = now.getFullYear().toString();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentQuarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;

  const [viewMode, setViewMode] = useState('submissions'); // 'submissions' | 'targets_matrix'
  const [periodType, setPeriodType] = useState('monthly'); // 'weekly' | 'monthly' | 'quarterly'
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);

  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // Table Filters
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('All');

  // Edit Modal State
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [editFormData, setEditFormData] = useState({ target: '', actual: '', notes: '' });
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  const toast = useToast();

  // Color tokens
  const pageBg = useColorModeValue('#F8FAFC', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('#E2E8F0', 'gray.700');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.900');

  // Compute active anchor date string (YYYY-MM-DD) based on filter selections
  const activeDate = useMemo(() => {
    if (periodType === 'weekly') {
      if (selectedWeek) return selectedWeek;
      return todayIso();
    }
    if (periodType === 'quarterly') {
      const qObj = QUARTERS.find((q) => q.value === selectedQuarter) || QUARTERS[0];
      return `${selectedYear}-${qObj.month}-01`;
    }
    return `${selectedYear}-${selectedMonth}-01`;
  }, [periodType, selectedYear, selectedMonth, selectedWeek, selectedQuarter]);

  // Weekly options calculated for selected year
  const weeklyOptions = useMemo(() => {
    return reportingPeriodOptions('weekly', Number(selectedYear), todayIso());
  }, [selectedYear]);

  // Initialize selected week to current week if empty
  useEffect(() => {
    if (periodType === 'weekly' && !selectedWeek) {
      const currentStart = reportingPeriodStart('weekly', todayIso());
      const match = weeklyOptions.find((w) => w.start === currentStart) || weeklyOptions[0];
      if (match) setSelectedWeek(match.value);
    }
  }, [periodType, selectedWeek, weeklyOptions]);

  // Load KPI Report for active period
  const loadKpis = useCallback(async (timeframe, date) => {
    setLoading(true);
    setError('');
    try {
      const res = await getTessbinKpiReport(timeframe, date);
      if (res.success) {
        setReport(res.data.report);
        setHistory(res.data.history || []);
        setDirty(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load Tessbin KPI report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKpis(periodType, activeDate);
  }, [periodType, activeDate, refresh, loadKpis]);

  // Prevent accidental navigation when unsaved
  useEffect(() => {
    const warn = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const handleTabChange = (index) => {
    const types = ['weekly', 'monthly', 'quarterly'];
    const nextType = types[index];
    if (dirty && !window.confirm('Discard unsaved changes and switch reporting frequency?')) return;
    setDirty(false);
    setPeriodType(nextType);
  };

  // Sync Live Data from database records
  const handleSyncLiveData = async () => {
    setSyncing(true);
    try {
      const res = await getTessbinLiveCounts(periodType, activeDate);
      if (res.success && res.data?.counts) {
        const counts = res.data.counts;
        setReport((prev) => {
          if (!prev) return prev;
          const updatedMetrics = prev.metrics.map((m) => {
            if (counts[m.key] !== undefined) {
              return { ...m, actual: Number(counts[m.key]) };
            }
            return m;
          });
          return { ...prev, metrics: updatedMetrics };
        });
        setDirty(true);
        toast({
          title: 'Live System Data Synced',
          description: `Aggregated: COC Exams (${counts.coc || 0}), Online Finals (${counts.online || 0}), Registrations (${counts.students || 0}), Evaluations (${counts.evaluations || 0})`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Sync failed',
        description: err.response?.data?.message || err.message || 'Could not calculate live counts.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Inline edit metric helper
  const editMetric = (key, field, value) => {
    setDirty(true);
    setReport((prev) => ({
      ...prev,
      metrics: prev.metrics.map((row) => (row.key === key ? { ...row, [field]: value === '' ? null : Number(value) } : row)),
    }));
  };

  // Open Modal Edit
  const handleOpenEdit = (cfg) => {
    setSelectedMetric(cfg);
    const m = report?.metrics?.find((r) => r.key === cfg.key) || { target: '', actual: '' };
    setEditFormData({
      target: m.target ?? '',
      actual: m.actual ?? '',
      notes: report?.notes || '',
    });
    onEditOpen();
  };

  // Save Modal Edit
  const handleSaveModalMetric = () => {
    if (!selectedMetric || !report) return;
    setDirty(true);
    setReport((prev) => ({
      ...prev,
      metrics: prev.metrics.map((row) =>
        row.key === selectedMetric.key
          ? {
              ...row,
              target: editFormData.target === '' ? null : Number(editFormData.target),
              actual: editFormData.actual === '' ? null : Number(editFormData.actual),
            }
          : row
      ),
    }));
    onEditClose();
    toast({
      title: `${selectedMetric.label} Updated`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // Save draft or submit report to COO
  const handleSaveReport = async (status) => {
    if (!report) return;
    setSaving(status);
    setError('');
    try {
      const res = await saveTessbinKpiReport({
        timeframe: periodType,
        date: activeDate,
        revision: report.revision,
        metrics: report.metrics,
        notes: report.notes || '',
        status,
      });

      if (res.success) {
        setReport(res.data);
        setHistory((prev) => [res.data, ...prev.filter((item) => item.periodStart !== res.data.periodStart)].sort((a, b) => b.periodStart.localeCompare(a.periodStart)).slice(0, 12));
        setDirty(false);
        toast({
          title: status === 'submitted' ? 'Tessbin KPI Report Submitted' : 'Draft Saved',
          description:
            status === 'submitted'
              ? 'Published to COO Dashboard → Departments → Tessbin for this reporting period.'
              : 'Draft preserved successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save. Your entries are still in the form.');
    } finally {
      setSaving('');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!report) return;
    let csvContent = 'data:text/csv;charset=utf-8,KPI Name,Frequency,Period Start,Period End,Target,Actual,Achievement %,Status,Notes\n';
    KPI_CONFIG.forEach((cfg) => {
      const m = report.metrics.find((row) => row.key === cfg.key) || { target: null, actual: null };
      const pct = m.target > 0 && m.actual !== null ? ((m.actual / m.target) * 100).toFixed(1) + '%' : 'N/A';
      const statusText = m.target > 0 && m.actual !== null ? (m.actual >= m.target ? 'Completed' : m.actual / m.target >= 0.8 ? 'On Track' : 'Behind Target') : 'Pending';
      csvContent += `"${cfg.label}","${periodType.toUpperCase()}","${report.periodStart}","${report.periodEnd}","${m.target ?? ''}","${m.actual ?? ''}","${pct}","${statusText}","${(report.notes || '').replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tessbin_KPI_${periodType}_${report.periodStart}_to_${report.periodEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSubmitted = report?.status === 'submitted';
  const isComplete = report?.metrics?.every((row) => Number.isSafeInteger(row.target) && row.target > 0 && Number.isSafeInteger(row.actual) && row.actual >= 0);

  // Overall calculations for HR-style Stat Cards
  let totalTargetSum = 0;
  let totalActualSum = 0;
  let completedCount = 0;
  let onTrackCount = 0;

  KPI_CONFIG.forEach((cfg) => {
    const row = report?.metrics?.find((m) => m.key === cfg.key);
    if (row && row.target > 0) {
      totalTargetSum += row.target;
      if (row.actual !== null && row.actual !== undefined) {
        totalActualSum += row.actual;
        if (row.actual >= row.target) completedCount++;
        else if (row.actual / row.target >= 0.8) onTrackCount++;
      }
    }
  });

  const overallCompletionRate = totalTargetSum > 0 ? Math.min(100, Math.round((totalActualSum / totalTargetSum) * 100)) : 0;

  const getStatusBadge = (actual, target) => {
    if (target > 0 && Number.isSafeInteger(actual)) {
      if (actual >= target) {
        return (
          <Badge colorScheme="green" px={2.5} py={1} borderRadius="full" fontSize="11px" fontWeight="700">
            Completed
          </Badge>
        );
      }
      if (actual / target >= 0.8) {
        return (
          <Badge colorScheme="teal" px={2.5} py={1} borderRadius="full" fontSize="11px" fontWeight="700">
            On Track
          </Badge>
        );
      }
      return (
        <Badge colorScheme="orange" px={2.5} py={1} borderRadius="full" fontSize="11px" fontWeight="700">
          Behind Target
        </Badge>
      );
    }
    return (
      <Badge colorScheme="gray" px={2.5} py={1} borderRadius="full" fontSize="11px" fontWeight="700">
        Pending
      </Badge>
    );
  };

  // Filtered metrics for Summary Table
  const filteredMetrics = useMemo(() => {
    return KPI_CONFIG.filter((cfg) => {
      const row = report?.metrics?.find((m) => m.key === cfg.key);
      const matchesSearch =
        cfg.label.toLowerCase().includes(tableSearch.toLowerCase()) ||
        cfg.description.toLowerCase().includes(tableSearch.toLowerCase());

      if (!matchesSearch) return false;
      if (tableStatusFilter === 'All') return true;

      const hasResult = row && row.target > 0 && Number.isSafeInteger(row.actual);
      if (tableStatusFilter === 'Completed') return hasResult && row.actual >= row.target;
      if (tableStatusFilter === 'On Track') return hasResult && row.actual < row.target && row.actual / row.target >= 0.8;
      if (tableStatusFilter === 'Behind Target') return hasResult && row.actual / row.target < 0.8;
      if (tableStatusFilter === 'Pending') return !hasResult;
      return true;
    });
  }, [report, tableSearch, tableStatusFilter]);

  const activeMonthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label || 'Month';
  const activeQuarterLabel = QUARTERS.find((q) => q.value === selectedQuarter)?.label || selectedQuarter;

  return (
    <Box p={{ base: 3, md: 5 }} bg={pageBg} borderRadius="2xl" minH="100vh">
      {/* Top Header Banner */}
      <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }} justify="space-between" mb={6} gap={4}>
        <Box>
          <HStack spacing={3} mb={1}>
            <Flex w="42px" h="42px" bg={ACCENT_PURPLE} color="white" borderRadius="xl" align="center" justify="center" shadow="sm">
              <Icon as={FiTrendingUp} boxSize={5} />
            </Flex>
            <Box>
              <Heading size="lg" color={PRIMARY_PURPLE} fontWeight="900" letterSpacing="-0.02em">
                Tessbin KPI Submissions
              </Heading>
              <Text fontSize="sm" color={mutedText}>
                Filter weekly, monthly, and quarterly Tessbin KPI metrics by Year and Period.
              </Text>
            </Box>
          </HStack>
        </Box>

        <HStack spacing={3} wrap="wrap">
          <Button
            leftIcon={<Icon as={FiLayers} />}
            variant={viewMode === 'targets_matrix' ? 'solid' : 'outline'}
            colorScheme="purple"
            size="sm"
            fontWeight="700"
            borderRadius="lg"
            onClick={() => setViewMode(viewMode === 'targets_matrix' ? 'submissions' : 'targets_matrix')}
          >
            {viewMode === 'targets_matrix' ? 'Back to Submissions' : 'Plan All Targets (Matrix)'}
          </Button>

          <Button
            leftIcon={<Icon as={FiRefreshCw} />}
            isLoading={syncing}
            onClick={handleSyncLiveData}
            size="sm"
            colorScheme="purple"
            variant="outline"
            bg="white"
            fontWeight="700"
            borderRadius="lg"
            _hover={{ bg: 'purple.50' }}
          >
            Sync Live Data
          </Button>

          <Button
            leftIcon={<Icon as={FiDownload} />}
            onClick={handleExportCsv}
            size="sm"
            bg={ACCENT_PURPLE}
            color="white"
            fontWeight="700"
            borderRadius="lg"
            _hover={{ bg: PRIMARY_PURPLE }}
            isDisabled={!report}
          >
            Export CSV
          </Button>
        </HStack>
      </Flex>

      {/* Target Planning Matrix Mode */}
      {viewMode === 'targets_matrix' && (
        <Box mb={6}>
          <TessbinKpiTargetsForm
            metrics={KPI_CONFIG}
            initialDate={activeDate}
            onDirtyChange={() => {}}
            onSavingChange={() => {}}
            onSaved={() => {
              setRefresh((v) => v + 1);
              toast({ title: 'Targets updated successfully', status: 'success', duration: 3000 });
            }}
          />
        </Box>
      )}

      {/* Main Submissions Mode */}
      {viewMode === 'submissions' && (
        <>
          {/* Main Filter Bar Card (HR Style Frequency Tabs + Year & Period Selectors) */}
          <Card bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} mb={6} shadow="sm">
            <CardBody p={5}>
              <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" align={{ base: 'stretch', lg: 'center' }} gap={5}>
                {/* Frequency Tabs */}
                <Tabs variant="soft-rounded" colorScheme="purple" index={['weekly', 'monthly', 'quarterly'].indexOf(periodType)} onChange={handleTabChange}>
                  <TabList bg={useColorModeValue('gray.100', 'gray.700')} p={1} borderRadius="xl">
                    <Tab fontSize="13px" fontWeight="700" px={5}>Weekly</Tab>
                    <Tab fontSize="13px" fontWeight="700" px={5}>Monthly</Tab>
                    <Tab fontSize="13px" fontWeight="700" px={5}>Quarterly</Tab>
                  </TabList>
                </Tabs>

                {/* Filter Dropdowns */}
                <Flex wrap="wrap" align="center" gap={3}>
                  <HStack spacing={2}>
                    <Icon as={FiFilter} color={ACCENT_PURPLE} />
                    <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase">
                      Filter By:
                    </Text>
                  </HStack>

                  {/* Year Selector */}
                  <Select
                    size="sm"
                    value={selectedYear}
                    onChange={(e) => {
                      if (dirty && !window.confirm('Discard unsaved changes and switch year?')) return;
                      setSelectedYear(e.target.value);
                      setSelectedWeek('');
                    }}
                    w="110px"
                    borderRadius="lg"
                    fontWeight="700"
                    bg={cardBg}
                    borderColor="gray.300"
                    _focus={{ borderColor: ACCENT_PURPLE }}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Select>

                  {/* Month Selector */}
                  {periodType === 'monthly' && (
                    <Select
                      size="sm"
                      value={selectedMonth}
                      onChange={(e) => {
                        if (dirty && !window.confirm('Discard unsaved changes and switch month?')) return;
                        setSelectedMonth(e.target.value);
                      }}
                      w="140px"
                      borderRadius="lg"
                      fontWeight="700"
                      bg={cardBg}
                      borderColor="gray.300"
                      _focus={{ borderColor: ACCENT_PURPLE }}
                    >
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </Select>
                  )}

                  {/* Week Selector */}
                  {periodType === 'weekly' && (
                    <Select
                      size="sm"
                      value={selectedWeek}
                      onChange={(e) => {
                        if (dirty && !window.confirm('Discard unsaved changes and switch week?')) return;
                        setSelectedWeek(e.target.value);
                      }}
                      w="220px"
                      borderRadius="lg"
                      fontWeight="700"
                      bg={cardBg}
                      borderColor="gray.300"
                      _focus={{ borderColor: ACCENT_PURPLE }}
                    >
                      {weeklyOptions.map((w, idx) => (
                        <option key={w.value + idx} value={w.value}>{w.label}</option>
                      ))}
                    </Select>
                  )}

                  {/* Quarter Selector */}
                  {periodType === 'quarterly' && (
                    <Select
                      size="sm"
                      value={selectedQuarter}
                      onChange={(e) => {
                        if (dirty && !window.confirm('Discard unsaved changes and switch quarter?')) return;
                        setSelectedQuarter(e.target.value);
                      }}
                      w="160px"
                      borderRadius="lg"
                      fontWeight="700"
                      bg={cardBg}
                      borderColor="gray.300"
                      _focus={{ borderColor: ACCENT_PURPLE }}
                    >
                      {QUARTERS.map((q) => (
                        <option key={q.value} value={q.value}>{q.label}</option>
                      ))}
                    </Select>
                  )}

                  {/* Active Period Badge */}
                  <Badge colorScheme="purple" fontSize="13px" px={3.5} py={1.5} borderRadius="lg" ml={{ base: 0, sm: 2 }}>
                    {periodType === 'monthly'
                      ? `${activeMonthLabel} ${selectedYear}`
                      : periodType === 'quarterly'
                      ? `${activeQuarterLabel} ${selectedYear}`
                      : report
                      ? periodLabel(report)
                      : `WEEKLY (${selectedYear})`}
                  </Badge>

                  {/* Status Badge */}
                  <Badge
                    colorScheme={dirty ? 'orange' : isSubmitted ? 'green' : report?.revision ? 'purple' : 'gray'}
                    fontSize="12px"
                    px={3}
                    py={1.5}
                    borderRadius="lg"
                  >
                    {dirty ? 'Unsaved Changes' : isSubmitted ? 'Submitted' : report?.revision ? 'Draft Saved' : 'New Report'}
                  </Badge>
                </Flex>
              </Flex>
            </CardBody>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert status="error" mb={5} borderRadius="xl">
              <AlertIcon />
              <Box flex="1">{error}</Box>
              <Button size="sm" onClick={() => setRefresh((v) => v + 1)}>Retry</Button>
            </Alert>
          )}

          {/* Loading Indicator */}
          {loading ? (
            <HStack py={16} justify="center">
              <Spinner size="lg" color={ACCENT_PURPLE} thickness="3px" />
              <Text fontWeight="600" color={mutedText}>Loading Tessbin KPI report…</Text>
            </HStack>
          ) : report && (
            <>
              {/* Overview Stat Cards (3 Top HR-Style Metric Cards) */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={6}>
                <Card bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm">
                  <CardBody p={5}>
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.05em">
                          Overall Completion Rate
                        </Text>
                        <Heading size="xl" color={PRIMARY_PURPLE} mt={2} fontWeight="900">
                          {overallCompletionRate}%
                        </Heading>
                      </Box>
                      <Flex w="52px" h="52px" align="center" justify="center" bg="purple.50" borderRadius="xl">
                        <Icon as={FiTrendingUp} boxSize={6} color={ACCENT_PURPLE} />
                      </Flex>
                    </Flex>
                    <Progress value={overallCompletionRate} colorScheme="purple" size="sm" borderRadius="full" mt={4} />
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm">
                  <CardBody p={5}>
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.05em">
                          KPIs Completed / On Track
                        </Text>
                        <Heading size="xl" color="green.600" mt={2} fontWeight="900">
                          {completedCount + onTrackCount} <Text as="span" fontSize="lg" color="gray.400">/ {KPI_CONFIG.length}</Text>
                        </Heading>
                      </Box>
                      <Flex w="52px" h="52px" align="center" justify="center" bg="green.50" borderRadius="xl">
                        <Icon as={FiCheckCircle} boxSize={6} color="green.500" />
                      </Flex>
                    </Flex>
                    <Text fontSize="xs" color="gray.500" mt={4}>
                      {completedCount} Fully Completed &bull; {onTrackCount} On Track
                    </Text>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm">
                  <CardBody p={5}>
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.05em">
                          Attention Needed
                        </Text>
                        <Heading size="xl" color="orange.500" mt={2} fontWeight="900">
                          {KPI_CONFIG.length - (completedCount + onTrackCount)}
                        </Heading>
                      </Box>
                      <Flex w="52px" h="52px" align="center" justify="center" bg="orange.50" borderRadius="xl">
                        <Icon as={FiAlertCircle} boxSize={6} color="orange.500" />
                      </Flex>
                    </Flex>
                    <Text fontSize="xs" color="gray.500" mt={4}>
                      Metrics awaiting entry or below 80% benchmark
                    </Text>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Detailed KPI Performance Cards Grid (HR Style 2x2 Grid) */}
              <Heading size="md" color={PRIMARY_PURPLE} mb={4} fontWeight="800">
                Tessbin KPI Performance Indicators ({periodType === 'monthly' ? `${activeMonthLabel} ${selectedYear}` : report ? periodLabel(report) : activeDate})
              </Heading>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={8}>
                {KPI_CONFIG.map((cfg) => {
                  const row = report.metrics.find((m) => m.key === cfg.key) || { target: null, actual: null };
                  const pct = row.target > 0 && row.actual !== null ? Math.round((row.actual / row.target) * 100) : null;

                  return (
                    <Card
                      key={cfg.key}
                      bg={cardBg}
                      borderRadius="xl"
                      border="1px solid"
                      borderColor={borderColor}
                      shadow="sm"
                      transition="all 0.2s"
                      _hover={{ shadow: 'md', borderColor: ACCENT_PURPLE }}
                    >
                      <CardBody p={5}>
                        <Flex justify="space-between" align="flex-start" mb={3}>
                          <HStack spacing={3}>
                            <Flex w="42px" h="42px" align="center" justify="center" bg={`${cfg.color}.50`} borderRadius="lg">
                              <Icon as={cfg.icon} boxSize={5} color={`${cfg.color}.600`} />
                            </Flex>
                            <Box>
                              <Text fontWeight="800" fontSize="md" color={PRIMARY_PURPLE}>
                                {cfg.label}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {cfg.description}
                              </Text>
                            </Box>
                          </HStack>

                          <IconButton
                            icon={<Icon as={FiEdit2} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="purple"
                            onClick={() => handleOpenEdit(cfg)}
                            aria-label="Edit KPI"
                            isDisabled={isSubmitted && !dirty}
                          />
                        </Flex>

                        <Divider my={3} />

                        <Flex justify="space-between" align="center" mb={2}>
                          <HStack spacing={4}>
                            <Box>
                              <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="700">
                                Actual
                              </Text>
                              <Text fontSize="lg" fontWeight="900" color={PRIMARY_PURPLE}>
                                {row.actual !== null ? row.actual.toLocaleString() : '—'}{' '}
                                <Text as="span" fontSize="xs" color="gray.500">{cfg.unit}</Text>
                              </Text>
                            </Box>

                            <Text fontSize="lg" color="gray.300" fontWeight="300">/</Text>

                            <Box>
                              <Text fontSize="10px" color="gray.400" textTransform="uppercase" fontWeight="700">
                                Target
                              </Text>
                              <Text fontSize="lg" fontWeight="800" color="gray.600">
                                {row.target !== null ? row.target.toLocaleString() : '—'}{' '}
                                <Text as="span" fontSize="xs" color="gray.500">{cfg.unit}</Text>
                              </Text>
                            </Box>
                          </HStack>

                          <VStack align="flex-end" spacing={1}>
                            {getStatusBadge(row.actual, row.target)}
                            <Text
                              fontSize="xs"
                              fontWeight="800"
                              color={pct === null ? 'gray.400' : pct >= 100 ? 'green.600' : pct >= 80 ? 'teal.600' : 'orange.500'}
                            >
                              {pct === null ? 'Awaiting entry' : `${pct}% Achieved`}
                            </Text>
                          </VStack>
                        </Flex>

                        <Progress
                          value={pct === null ? 0 : Math.min(100, pct)}
                          colorScheme={pct >= 100 ? 'green' : pct >= 80 ? 'teal' : 'orange'}
                          size="xs"
                          borderRadius="full"
                          mt={2}
                        />
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>

              {/* Summary Table Card with Search & Status Filters */}
              <Card bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={6}>
                <CardBody p={5}>
                  <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={4} gap={4}>
                    <Box>
                      <Heading size="sm" color={PRIMARY_PURPLE} fontWeight="800">
                        Tessbin KPI Summary Table ({periodType === 'monthly' ? `${activeMonthLabel} ${selectedYear}` : report ? periodLabel(report) : activeDate})
                      </Heading>
                      <Text fontSize="xs" color="gray.500">
                        Showing {filteredMetrics.length} of {KPI_CONFIG.length} metrics &bull; Edit values directly or via action modal
                      </Text>
                    </Box>

                    {/* Table Filters */}
                    <HStack spacing={3}>
                      <InputGroup size="sm" maxW="200px">
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FiSearch} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search metric..."
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          borderRadius="lg"
                          bg={cardBg}
                        />
                      </InputGroup>

                      <Select
                        size="sm"
                        value={tableStatusFilter}
                        onChange={(e) => setTableStatusFilter(e.target.value)}
                        w="140px"
                        borderRadius="lg"
                        bg={cardBg}
                        fontWeight="600"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Completed">Completed</option>
                        <option value="On Track">On Track</option>
                        <option value="Behind Target">Behind Target</option>
                        <option value="Pending">Pending</option>
                      </Select>
                    </HStack>
                  </Flex>

                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg={tableHeaderBg}>
                        <Tr>
                          <Th py={3}>KPI Name</Th>
                          <Th py={3}>Unit</Th>
                          <Th py={3} isNumeric>Target</Th>
                          <Th py={3} isNumeric>Actual</Th>
                          <Th py={3}>Completion %</Th>
                          <Th py={3}>Status</Th>
                          <Th py={3} textAlign="right">Action</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredMetrics.length === 0 ? (
                          <Tr>
                            <Td colSpan={7} textAlign="center" py={6} color="gray.500">
                              No matching KPI metrics found for current filter.
                            </Td>
                          </Tr>
                        ) : (
                          filteredMetrics.map((cfg) => {
                            const row = report.metrics.find((m) => m.key === cfg.key) || { target: null, actual: null };
                            const pct = row.target > 0 && row.actual !== null ? Math.round((row.actual / row.target) * 100) : null;

                            return (
                              <Tr key={cfg.key} _hover={{ bg: useColorModeValue('purple.50', 'gray.700') }}>
                                <Td py={3.5} fontWeight="700" color={PRIMARY_PURPLE}>
                                  <HStack spacing={2}>
                                    <Icon as={cfg.icon} color={`${cfg.color}.500`} />
                                    <Text>{cfg.label}</Text>
                                  </HStack>
                                </Td>
                                <Td color="gray.500" fontSize="xs">{cfg.unit}</Td>
                                <Td isNumeric>
                                  <Input
                                    type="number"
                                    min={1}
                                    size="xs"
                                    w="85px"
                                    textAlign="right"
                                    borderRadius="md"
                                    placeholder="Target"
                                    value={row.target ?? ''}
                                    isDisabled={isSubmitted && !dirty}
                                    onChange={(e) => editMetric(cfg.key, 'target', e.target.value)}
                                  />
                                </Td>
                                <Td isNumeric>
                                  <Input
                                    type="number"
                                    min={0}
                                    size="xs"
                                    w="85px"
                                    textAlign="right"
                                    borderRadius="md"
                                    placeholder="Actual"
                                    value={row.actual ?? ''}
                                    isDisabled={isSubmitted && !dirty}
                                    onChange={(e) => editMetric(cfg.key, 'actual', e.target.value)}
                                  />
                                </Td>
                                <Td minW="130px">
                                  <Text fontSize="xs" fontWeight="700" mb={1}>
                                    {pct === null ? '—' : `${pct}%`}
                                  </Text>
                                  <Progress
                                    value={pct === null ? 0 : Math.min(100, pct)}
                                    colorScheme={pct >= 100 ? 'green' : pct >= 80 ? 'teal' : 'orange'}
                                    size="xs"
                                    borderRadius="full"
                                  />
                                </Td>
                                <Td>{getStatusBadge(row.actual, row.target)}</Td>
                                <Td textAlign="right">
                                  <Button
                                    size="xs"
                                    leftIcon={<Icon as={FiEdit2} />}
                                    variant="outline"
                                    colorScheme="purple"
                                    onClick={() => handleOpenEdit(cfg)}
                                    isDisabled={isSubmitted && !dirty}
                                  >
                                    Edit
                                  </Button>
                                </Td>
                              </Tr>
                            );
                          })
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>

              {/* Achievements, Challenges & Submission Actions Card */}
              <Card bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm" mb={6}>
                <CardBody p={5}>
                  <FormControl mb={4}>
                    <FormLabel htmlFor="kpi-notes" fontWeight="700" color={PRIMARY_PURPLE}>
                      Achievements, Challenges & Next Steps (Notes)
                    </FormLabel>
                    <Textarea
                      id="kpi-notes"
                      rows={3}
                      value={report.notes || ''}
                      maxLength={3000}
                      placeholder="Explain key achievements, challenges encountered, and next period action plans..."
                      isDisabled={isSubmitted && !dirty}
                      onChange={(e) => {
                        setDirty(true);
                        setReport({ ...report, notes: e.target.value });
                      }}
                    />
                  </FormControl>

                  <Flex justify="space-between" align="center" wrap="wrap" gap={4} pt={2}>
                    <Box>
                      <Text fontSize="xs" color={mutedText}>
                        {isSubmitted
                          ? `Submitted on ${new Date(report.submittedAt).toLocaleString()}`
                          : 'Save as draft anytime. Fill all 4 targets and results before submitting to COO.'}
                      </Text>
                      {dirty && (
                        <Text fontSize="xs" color="orange.500" fontWeight="700" mt={0.5}>
                          &bull; You have unsaved changes
                        </Text>
                      )}
                    </Box>

                    <HStack spacing={3}>
                      {isSubmitted && !dirty ? (
                        <Button
                          leftIcon={<Icon as={FiEdit2} />}
                          variant="outline"
                          colorScheme="purple"
                          onClick={() => {
                            setReport({ ...report, status: 'draft' });
                            setDirty(true);
                          }}
                        >
                          Revise Report
                        </Button>
                      ) : (
                        <>
                          <Button
                            leftIcon={<Icon as={FiSave} />}
                            variant="outline"
                            isLoading={saving === 'draft'}
                            isDisabled={!!saving}
                            onClick={() => handleSaveReport('draft')}
                          >
                            Save Draft
                          </Button>

                          <Button
                            leftIcon={<Icon as={FiCheckCircle} />}
                            colorScheme="purple"
                            isLoading={saving === 'submitted'}
                            isDisabled={!isComplete || !!saving}
                            onClick={() => handleSaveReport('submitted')}
                          >
                            Submit KPI Report
                          </Button>
                        </>
                      )}
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>

              {/* Recent History / Saved Periods */}
              {history.length > 0 && (
                <Card bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} shadow="sm">
                  <CardBody p={5}>
                    <Heading size="sm" color={PRIMARY_PURPLE} fontWeight="800" mb={3}>
                      Recent {periodType.toUpperCase()} Submissions History
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                      {history.slice(0, 6).map((item) => (
                        <Flex
                          key={item._id || item.periodStart}
                          p={3}
                          borderRadius="lg"
                          border="1px solid"
                          borderColor={borderColor}
                          justify="space-between"
                          align="center"
                          bg={item.periodStart === report.periodStart ? 'purple.50' : 'transparent'}
                        >
                          <Box>
                            <Text fontSize="xs" fontWeight="700">
                              {periodLabel(item)}
                            </Text>
                            <Badge
                              colorScheme={item.status === 'submitted' ? 'green' : 'purple'}
                              fontSize="10px"
                              mt={1}
                            >
                              {item.status}
                            </Badge>
                          </Box>
                          {item.periodStart !== report.periodStart && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => {
                                if (dirty && !window.confirm('Discard unsaved changes and open this period?')) return;
                                loadKpis(periodType, item.periodStart);
                              }}
                            >
                              Open
                            </Button>
                          )}
                        </Flex>
                      ))}
                    </SimpleGrid>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* Interactive Quick-Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader color={PRIMARY_PURPLE} fontWeight="800">
            <HStack spacing={2}>
              {selectedMetric && <Icon as={selectedMetric.icon} color={`${selectedMetric.color}.500`} />}
              <Text>Edit {selectedMetric?.label}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="xs" color="gray.500">
                {selectedMetric?.description} &bull; Unit: {selectedMetric?.unit}
              </Text>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700">Target Value</FormLabel>
                <Input
                  type="number"
                  min={1}
                  placeholder={`Enter ${selectedMetric?.unit || 'target'} goal`}
                  value={editFormData.target}
                  onChange={(e) => setEditFormData({ ...editFormData, target: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700">Actual Achieved Result</FormLabel>
                <Input
                  type="number"
                  min={0}
                  placeholder={`Enter actual ${selectedMetric?.unit || 'result'}`}
                  value={editFormData.actual}
                  onChange={(e) => setEditFormData({ ...editFormData, actual: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={handleSaveModalMetric}>
              Apply Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
