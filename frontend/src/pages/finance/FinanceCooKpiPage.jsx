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
  Input,
  Select,
  Textarea,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FiSend,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiRotateCcw,
  FiDatabase,
  FiPieChart,
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
  getFinanceDepartmentKpis,
  saveFinanceDepartmentKpi,
  getFinanceLiveStats,
} from '../../services/financeDepartmentKpiService';

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
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

const DEFAULT_METRICS = [
  { kpi: 'Weekly Revenue', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Weekly Expenses', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Net Position', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Receivables Collected', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Tax Status', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
];

const FinanceCooKpiPage = () => {
  const toast = useToast();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
  const currentWeekNum = String(getIsoWeekNumber(now)).padStart(2, '0');
  const currentQuarterNum = Math.floor(now.getMonth() / 3) + 1;

  const [periodType, setPeriodType] = useState('weekly');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${currentMonthNum}`);
  const [selectedWeek, setSelectedWeek] = useState(`${currentYear}-W${currentWeekNum}`);
  const [selectedQuarter, setSelectedQuarter] = useState(`${currentYear}-Q${currentQuarterNum}`);

  const activePeriodKey = useMemo(() => {
    if (periodType === 'weekly') return selectedWeek;
    if (periodType === 'quarterly') return selectedQuarter;
    return selectedMonth;
  }, [periodType, selectedWeek, selectedQuarter, selectedMonth]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [financials, setFinancials] = useState(DEFAULT_METRICS);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [submissionInfo, setSubmissionInfo] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
  const [isOperationalBaseline, setIsOperationalBaseline] = useState(false);

  const loadKpiData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resKpi, resStats] = await Promise.all([
        getFinanceDepartmentKpis(periodType, activePeriodKey),
        getFinanceLiveStats(periodType, activePeriodKey).catch(() => null),
      ]);

      if (resKpi?.data) {
        const d = resKpi.data;
        if (d.financials && d.financials.length > 0) {
          setFinancials(d.financials);
        } else {
          setFinancials(DEFAULT_METRICS);
        }
        setSummaryNotes(d.summaryNotes || '');
        setIsOperationalBaseline(Boolean(d.isOperationalBaseline));

        if (d.submittedAt) {
          setSubmissionInfo({
            submittedAt: d.submittedAt,
            submittedByName: d.submittedByName || 'Finance Manager',
            status: d.status,
          });
        } else {
          setSubmissionInfo(null);
        }
      }

      if (resStats?.stats) {
        setLiveStats(resStats.stats);
      }
    } catch (err) {
      console.error('Failed to load Finance KPI data:', err);
      toast({
        title: 'Error loading data',
        description: err.message || 'Could not load Finance KPIs',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [periodType, activePeriodKey, toast]);

  useEffect(() => {
    loadKpiData();
  }, [loadKpiData]);

  // Sync real operational actuals from database
  const handleSyncOperationalData = async () => {
    setIsLoading(true);
    try {
      const res = await getFinanceLiveStats(periodType, activePeriodKey);
      if (res?.stats) {
        const stats = res.stats;
        setFinancials((prev) =>
          prev.map((item) => {
            let opActual = 0;
            if (item.kpi === 'Weekly Revenue') opActual = stats.revenue || 0;
            else if (item.kpi === 'Weekly Expenses') opActual = stats.expenses || 0;
            else if (item.kpi === 'Net Position') opActual = stats.netPosition || 0;
            else if (item.kpi === 'Receivables Collected') opActual = stats.receivablesCollected || 0;
            else if (item.kpi === 'Tax Status') opActual = stats.taxStatus || 0;

            const target = Number(item.target) || 0;
            const achieve = target > 0 ? Math.round((opActual / target) * 100) : 0;
            let status = 'Not Reported';
            if (target > 0) {
              if (achieve >= 100) status = 'Completed';
              else if (achieve >= 80) status = 'On Track';
              else if (achieve >= 50) status = 'At Risk';
              else status = 'Behind';
            }

            return {
              ...item,
              actual: opActual,
              achievement: achieve,
              status,
            };
          })
        );
        toast({
          title: 'Synced Live Data',
          description: `Updated actuals from live payments, expenses, and costs for ${activePeriodKey}.`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Sync failed',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset all targets and actuals to 0
  const handleResetAllToZero = () => {
    setFinancials((prev) =>
      prev.map((item) => ({
        ...item,
        target: 0,
        actual: 0,
        achievement: 0,
        status: 'Not Reported',
      }))
    );
    toast({
      title: 'Reset to 0',
      description: 'All targets and actuals set strictly to 0, status set to Not Reported.',
      status: 'info',
      duration: 2500,
      isClosable: true,
    });
  };

  const handleMetricChange = (index, field, value) => {
    setFinancials((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === 'target' || field === 'actual') {
        const target = field === 'target' ? Number(value) || 0 : Number(item.target) || 0;
        const actual = field === 'actual' ? Number(value) || 0 : Number(item.actual) || 0;
        const achieve = target > 0 ? Math.round((actual / target) * 100) : 0;
        item.achievement = achieve;

        if (target === 0 && actual === 0) {
          item.status = 'Not Reported';
        } else if (target > 0) {
          if (achieve >= 100) item.status = 'Completed';
          else if (achieve >= 80) item.status = 'On Track';
          else if (achieve >= 50) item.status = 'At Risk';
          else item.status = 'Behind';
        }
      }

      next[index] = item;
      return next;
    });
  };

  const handleSave = async (submitToCoo = false) => {
    setIsSaving(true);
    try {
      const payload = {
        periodType,
        periodKey: activePeriodKey,
        financials,
        summaryNotes,
        submitToCoo,
      };

      const res = await saveFinanceDepartmentKpi(payload);
      if (res?.success) {
        toast({
          title: submitToCoo ? 'Submitted to COO2!' : 'Draft Saved',
          description: res.message || 'Finance KPI record updated.',
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
        loadKpiData();
      }
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not save Finance KPI report',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const chartData = useMemo(() => {
    return financials.map((f) => ({
      kpi: f.kpi.replace('Weekly ', ''),
      Target: Number(f.target) || 0,
      Actual: Number(f.actual) || 0,
    }));
  }, [financials]);

  const revActual = Number(financials.find((f) => f.kpi.includes('Revenue'))?.actual) || 0;
  const expActual = Number(financials.find((f) => f.kpi.includes('Expenses'))?.actual) || 0;
  const netActual = Number(financials.find((f) => f.kpi === 'Net Position')?.actual) || (revActual - expActual);
  const recActual = Number(financials.find((f) => f.kpi.includes('Receivables'))?.actual) || 0;
  const taxActual = Number(financials.find((f) => f.kpi.includes('Tax'))?.actual) || 0;

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1400px" mx="auto" minH="100vh">
      {/* Top Banner */}
      <Box
        bg="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)"
        color="white"
        p={{ base: 5, md: 7 }}
        borderRadius="16px"
        boxShadow="0 10px 25px -5px rgba(15, 118, 110, 0.3)"
        mb={7}
      >
        <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} wrap="wrap" gap={4}>
          <Box>
            <HStack spacing={3} mb={1}>
              <Icon as={FiDollarSign} boxSize={7} color="#2dd4bf" />
              <Heading as="h1" fontSize={{ base: '22px', md: '30px' }} fontWeight="800">
                Finance COO KPI Submissions
              </Heading>
            </HStack>
            <Text color="gray.300" fontSize={{ base: '13px', md: '15px' }}>
              Report operational revenue, expenses, net margins &amp; taxes directly to the COO2 Executive Dashboard
            </Text>
          </Box>

          <HStack spacing={3} wrap="wrap">
            {submissionInfo ? (
              <Badge
                bg="#10b981"
                color="white"
                px={3.5}
                py={1.5}
                borderRadius="full"
                fontSize="12.5px"
                fontWeight="700"
                display="flex"
                alignItems="center"
                gap={1.5}
              >
                <Icon as={FiCheckCircle} />
                Submitted to COO2 ({new Date(submissionInfo.submittedAt).toLocaleDateString()})
              </Badge>
            ) : (
              <Badge
                bg="#e2e8f0"
                color="#475569"
                px={3.5}
                py={1.5}
                borderRadius="full"
                fontSize="12px"
                fontWeight="700"
              >
                {isOperationalBaseline ? 'Live DB Baseline (Unsubmitted)' : 'Draft / Unsubmitted'}
              </Badge>
            )}
            <Badge bg="whiteAlpha.300" color="white" px={3} py={1.5} borderRadius="full" fontSize="12px">
              Period: {activePeriodKey}
            </Badge>
          </HStack>
        </Flex>
      </Box>

      {/* Period Selector Bar */}
      <Card bg="white" shadow="sm" borderRadius="12px" mb={7} border="1px solid" borderColor="gray.200">
        <CardBody p={5}>
          <Flex wrap="wrap" justify="space-between" align="center" gap={4}>
            <HStack spacing={3} wrap="wrap">
              <Box>
                <Text fontSize="11px" fontWeight="700" color="gray.500" mb={1} textTransform="uppercase">
                  Period Type
                </Text>
                <Select
                  size="sm"
                  w="140px"
                  borderRadius="8px"
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value)}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="700" color="gray.500" mb={1} textTransform="uppercase">
                  Year
                </Text>
                <Select
                  size="sm"
                  w="110px"
                  borderRadius="8px"
                  value={selectedYear}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setSelectedYear(y);
                    setSelectedMonth(`${y}-${currentMonthNum}`);
                    setSelectedWeek(`${y}-W${currentWeekNum}`);
                    setSelectedQuarter(`${y}-Q${currentQuarterNum}`);
                  }}
                >
                  {[2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Select>
              </Box>

              {periodType === 'weekly' && (
                <Box>
                  <Text fontSize="11px" fontWeight="700" color="gray.500" mb={1} textTransform="uppercase">
                    Week
                  </Text>
                  <Select
                    size="sm"
                    w="150px"
                    borderRadius="8px"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                  >
                    {Array.from({ length: 53 }, (_, i) => {
                      const wStr = String(i + 1).padStart(2, '0');
                      return (
                        <option key={wStr} value={`${selectedYear}-W${wStr}`}>
                          Week {i + 1}
                        </option>
                      );
                    })}
                  </Select>
                </Box>
              )}

              {periodType === 'monthly' && (
                <Box>
                  <Text fontSize="11px" fontWeight="700" color="gray.500" mb={1} textTransform="uppercase">
                    Month
                  </Text>
                  <Select
                    size="sm"
                    w="160px"
                    borderRadius="8px"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {[
                      '01 - January', '02 - February', '03 - March', '04 - April',
                      '05 - May', '06 - June', '07 - July', '08 - August',
                      '09 - September', '10 - October', '11 - November', '12 - December',
                    ].map((m, i) => {
                      const mNum = String(i + 1).padStart(2, '0');
                      return (
                        <option key={mNum} value={`${selectedYear}-${mNum}`}>
                          {m}
                        </option>
                      );
                    })}
                  </Select>
                </Box>
              )}

              {periodType === 'quarterly' && (
                <Box>
                  <Text fontSize="11px" fontWeight="700" color="gray.500" mb={1} textTransform="uppercase">
                    Quarter
                  </Text>
                  <Select
                    size="sm"
                    w="140px"
                    borderRadius="8px"
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                  >
                    <option value={`${selectedYear}-Q1`}>Q1 (Jan - Mar)</option>
                    <option value={`${selectedYear}-Q2`}>Q2 (Apr - Jun)</option>
                    <option value={`${selectedYear}-Q3`}>Q3 (Jul - Sep)</option>
                    <option value={`${selectedYear}-Q4`}>Q4 (Oct - Dec)</option>
                  </Select>
                </Box>
              )}

              <Button
                size="sm"
                leftIcon={<FiCalendar />}
                variant="outline"
                colorScheme="teal"
                mt={5}
                onClick={() => {
                  setSelectedYear(currentYear);
                  setSelectedMonth(`${currentYear}-${currentMonthNum}`);
                  setSelectedWeek(`${currentYear}-W${currentWeekNum}`);
                  setSelectedQuarter(`${currentYear}-Q${currentQuarterNum}`);
                }}
              >
                Current Period
              </Button>
            </HStack>

            <HStack spacing={2} mt={{ base: 2, md: 4 }}>
              <Button
                size="sm"
                leftIcon={<FiDatabase />}
                colorScheme="blue"
                variant="subtle"
                onClick={handleSyncOperationalData}
                isLoading={isLoading}
              >
                Sync Live DB Data
              </Button>

              <Button
                size="sm"
                leftIcon={<FiRotateCcw />}
                colorScheme="orange"
                variant="outline"
                onClick={handleResetAllToZero}
              >
                Reset All to 0
              </Button>

              <Button
                size="sm"
                leftIcon={<FiRefreshCw />}
                variant="ghost"
                onClick={loadKpiData}
                isLoading={isLoading}
              >
                Refresh
              </Button>
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* 5 Operational Financial Stat Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={4} mb={7}>
        <Card bg="white" border="1px solid" borderColor="gray.200" borderRadius="12px">
          <CardBody p={4}>
            <Text fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase">Revenue</Text>
            <Text fontSize="22px" fontWeight="800" color="#0f766e" mt={1}>
              {formatNumber(revActual)} <Text as="span" fontSize="12px" color="gray.500">ETB</Text>
            </Text>
            <Text fontSize="11px" color="gray.400" mt={1}>Collected payments &amp; sales</Text>
          </CardBody>
        </Card>

        <Card bg="white" border="1px solid" borderColor="gray.200" borderRadius="12px">
          <CardBody p={4}>
            <Text fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase">Expenses</Text>
            <Text fontSize="22px" fontWeight="800" color="#dc2626" mt={1}>
              {formatNumber(expActual)} <Text as="span" fontSize="12px" color="gray.500">ETB</Text>
            </Text>
            <Text fontSize="11px" color="gray.400" mt={1}>Operating costs &amp; bills</Text>
          </CardBody>
        </Card>

        <Card bg="white" border="1px solid" borderColor="gray.200" borderRadius="12px">
          <CardBody p={4}>
            <Text fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase">Net Position</Text>
            <Text fontSize="22px" fontWeight="800" color={netActual >= 0 ? '#16a34a' : '#ea580c'} mt={1}>
              {formatNumber(netActual)} <Text as="span" fontSize="12px" color="gray.500">ETB</Text>
            </Text>
            <Text fontSize="11px" color="gray.400" mt={1}>Revenue minus expenses</Text>
          </CardBody>
        </Card>

        <Card bg="white" border="1px solid" borderColor="gray.200" borderRadius="12px">
          <CardBody p={4}>
            <Text fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase">Receivables</Text>
            <Text fontSize="22px" fontWeight="800" color="#2563eb" mt={1}>
              {formatNumber(recActual)} <Text as="span" fontSize="12px" color="gray.500">ETB</Text>
            </Text>
            <Text fontSize="11px" color="gray.400" mt={1}>Settled invoices/orders</Text>
          </CardBody>
        </Card>

        <Card bg="white" border="1px solid" borderColor="gray.200" borderRadius="12px">
          <CardBody p={4}>
            <Text fontSize="11px" fontWeight="700" color="gray.500" textTransform="uppercase">Tax Status</Text>
            <Text fontSize="22px" fontWeight="800" color="#7c3aed" mt={1}>
              {formatNumber(taxActual)} <Text as="span" fontSize="12px" color="gray.500">ETB</Text>
            </Text>
            <Text fontSize="11px" color="gray.400" mt={1}>VAT &amp; withholding tax</Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* KPI Input Table */}
      <Card bg="white" shadow="sm" borderRadius="12px" mb={7} border="1px solid" borderColor="gray.200">
        <Box bg="#137b7e" color="white" px={6} py={3} borderTopRadius="12px">
          <Flex justify="space-between" align="center">
            <Heading as="h2" fontSize="18px" fontWeight="700">
              Finance Department KPI Metrics
            </Heading>
            <Text fontSize="12px" opacity={0.9}>
              Sync from DB or enter adjustments before submitting
            </Text>
          </Flex>
        </Box>

        <TableContainer p={2}>
          <Table size="sm" variant="simple">
            <Thead bg="#213f70">
              <Tr>
                <Th color="white" py={3}>Metric</Th>
                <Th color="white" textAlign="center" w="180px">Target (ETB)</Th>
                <Th color="white" textAlign="center" w="180px">Actual (ETB)</Th>
                <Th color="white" textAlign="center" w="120px">Achievement</Th>
                <Th color="white" textAlign="center" w="150px">Status</Th>
                <Th color="white">Notes</Th>
              </Tr>
            </Thead>
            <Tbody>
              {financials.map((row, idx) => {
                const statusStyle = STATUS_COLORS[row.status] || STATUS_COLORS['Not Reported'];
                return (
                  <Tr key={row.kpi} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="700" fontSize="14px" color="gray.800">
                      {row.kpi}
                    </Td>
                    <Td textAlign="center">
                      <Input
                        size="sm"
                        type="number"
                        textAlign="center"
                        value={row.target}
                        onChange={(e) => handleMetricChange(idx, 'target', e.target.value)}
                        borderRadius="6px"
                      />
                    </Td>
                    <Td textAlign="center">
                      <Input
                        size="sm"
                        type="number"
                        textAlign="center"
                        value={row.actual}
                        onChange={(e) => handleMetricChange(idx, 'actual', e.target.value)}
                        borderRadius="6px"
                        fontWeight="700"
                        color={row.kpi === 'Net Position' && row.actual < 0 ? 'red.500' : 'gray.800'}
                      />
                    </Td>
                    <Td textAlign="center" fontWeight="700" fontSize="13px">
                      {row.achievement}%
                    </Td>
                    <Td textAlign="center">
                      <Select
                        size="xs"
                        value={row.status}
                        onChange={(e) => handleMetricChange(idx, 'status', e.target.value)}
                        bg={statusStyle.bg}
                        color={statusStyle.text}
                        borderColor={statusStyle.border}
                        fontWeight="700"
                        borderRadius="full"
                        textAlign="center"
                      >
                        <option value="Not Reported">Not Reported</option>
                        <option value="On Track">On Track</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Behind">Behind</option>
                        <option value="Completed">Completed</option>
                      </Select>
                    </Td>
                    <Td>
                      <Input
                        size="sm"
                        placeholder="Optional remarks..."
                        value={row.notes || ''}
                        onChange={(e) => handleMetricChange(idx, 'notes', e.target.value)}
                        borderRadius="6px"
                        fontSize="12px"
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </Card>

      {/* Visual Chart Card */}
      <Card bg="white" shadow="sm" borderRadius="12px" mb={7} border="1px solid" borderColor="gray.200">
        <CardBody p={5}>
          <Heading as="h3" fontSize="16px" mb={4} color="gray.700">
            Target vs Actual Comparison (ETB)
          </Heading>
          <Box h="320px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="kpi" tick={{ fill: '#334155', fontSize: 12 }} />
                <YAxis tickFormatter={(val) => formatNumber(val)} tick={{ fill: '#334155', fontSize: 12 }} />
                <ChartTooltip formatter={(val) => [`${formatNumber(val)} ETB`]} />
                <Legend />
                <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>

      {/* Submission & Notes Section */}
      <Card bg="white" shadow="sm" borderRadius="12px" border="1px solid" borderColor="gray.200">
        <CardBody p={6}>
          <Heading as="h3" fontSize="16px" color="gray.800" mb={3}>
            Executive Notes for COO2
          </Heading>
          <Textarea
            rows={3}
            placeholder="Add comments on weekly variances, pending receivables, tax filings, or working capital needs..."
            value={summaryNotes}
            onChange={(e) => setSummaryNotes(e.target.value)}
            borderRadius="8px"
            mb={5}
            fontSize="14px"
          />

          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <Box>
              {submissionInfo && (
                <Text fontSize="12px" color="gray.500">
                  Last submitted by <Text as="span" fontWeight="700" color="gray.700">{submissionInfo.submittedByName}</Text> on {new Date(submissionInfo.submittedAt).toLocaleString()}
                </Text>
              )}
            </Box>

            <HStack spacing={3}>
              <Button
                variant="outline"
                colorScheme="gray"
                onClick={() => handleSave(false)}
                isLoading={isSaving}
              >
                Save Draft
              </Button>

              <Button
                leftIcon={<FiSend />}
                colorScheme="teal"
                bg="#0f766e"
                _hover={{ bg: '#0d9488' }}
                onClick={() => handleSave(true)}
                isLoading={isSaving}
              >
                Submit to COO2 Dashboard
              </Button>
            </HStack>
          </Flex>
        </CardBody>
      </Card>
    </Box>
  );
};

export default FinanceCooKpiPage;
