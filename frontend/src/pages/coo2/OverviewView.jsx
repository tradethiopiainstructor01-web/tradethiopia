// src/pages/coo2/OverviewView.jsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Box,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  HStack,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,
  Button,
  useToast,
} from '@chakra-ui/react';
import { FiDatabase } from 'react-icons/fi';
import { getHrKpis, getHrLiveStats } from '../../services/hrKpiService';
import { getSalesDepartmentKpis } from '../../services/salesDepartmentKpiService';
import CustomerDepartmentKpiReport from '../../components/customer/CustomerDepartmentKpiReport';
import { getFinanceDepartmentKpis } from '../../services/financeDepartmentKpiService';
import TessbinDepartmentView from './TessbinDepartmentView';
import SocialMediaDepartmentView from './SocialMediaDepartmentView';
import axiosInstance from '../../services/axiosInstance';
import { buildDepartmentSnapshot } from './departmentSnapshot';
import {
  CUSTOMER_SUCCESS_KPI_DETAILS,
  FINANCE_KPI_DETAILS,
  HR_KPI_DETAILS,
  IT_KPI_DETAILS,
  SALES_KPI_DETAILS,
  SOCIAL_MEDIA_KPI_DETAILS,
  TRADEX_TV_KPI_DETAILS,
} from './cooData';

const STATUS_STYLES = {
  'On Track': { background: '#d9ead3', color: '#166534' },
  'At Risk': { background: '#ffe599', color: '#854d0e' },
  Behind: { background: '#f9cb9c', color: '#9a3412' },
  'No measurable target': { background: '#f1f5f9', color: '#475569' },
  'Not Reported': { background: '#ffffff', color: '#475569' },
  Completed: { background: '#dcfce7', color: '#166534' },
  Exceeded: { background: '#bbf7d0', color: '#14532d' },
  'Behind Target': { background: '#fed7aa', color: '#9a3412' },
  Pending: { background: '#f1f5f9', color: '#475569' },
};

const HR_DASHBOARD_KPIS = [
  { key: 'postVacancies', label: 'Post Vacancies', unit: 'vacancies' },
  { key: 'screenCvs', label: 'Screen CVs', unit: 'CVs' },
  { key: 'conductInterviews', label: 'Conduct Interviews', unit: 'interviews' },
  { key: 'facilitateInternalTrainings', label: 'Facilitate Internal Trainings', unit: 'sessions' },
  { key: 'attendancePunctuality', label: 'Employee Attendance & Punctuality', unit: '%' },
  { key: 'checkingJobEnisra', label: 'Checking hr@tradethiopia.com', unit: 'checks' },
  { key: 'newHires', label: 'Number of New Hires', unit: 'hires' },
  { key: 'resignations', label: 'Number of Resignations', unit: 'resignations' },
  { key: 'candidatesPool', label: 'Number of Candidates Pool', unit: 'candidates' },
  { key: 'staffTrainingParticipants', label: 'Staff Participating in Trainings', unit: 'participants' },
];

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '' || isNaN(value)) {
    return '0';
  }
  return Number(value).toLocaleString();
};

const getCurrentHrPeriod = (dateRange) => {
  const now = new Date();
  const year = now.getFullYear();
  const periodType = String(dateRange || 'Monthly').toLowerCase();

  if (periodType === 'weekly') {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return { periodType, periodKey: `${year}-W${String(week).padStart(2, '0')}` };
  }

  if (periodType === 'quarterly') {
    return { periodType, periodKey: `${year}-Q${Math.floor(now.getMonth() / 3) + 1}` };
  }

  return {
    periodType: 'monthly',
    periodKey: `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  };
};

const AchievementLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="#111827" fontSize="13" fontWeight="600">
    {value}%
  </text>
);

const CountLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#111827" fontSize="12">
    {value}
  </text>
);

const AmountLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="#111827" fontSize="12">
    {formatNumber(value)}
  </text>
);

const DetailTable = ({
  title,
  rows = [],
  firstColumnLabel = 'KPI',
  actualLabel = 'Actual',
  statusLabel = 'Status',
  statusFilter = 'All',
  searchQuery = '',
}) => {
  const filteredRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.filter((row) => {
      // Status filter
      if (statusFilter && statusFilter !== 'All') {
        const rowStatus = row.status || 'Pending';
        if (statusFilter === 'Not Reported') {
          if (rowStatus !== 'Not Reported' && rowStatus !== 'Pending') return false;
        } else if (rowStatus !== statusFilter) {
          return false;
        }
      }
      // Search query
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const firstCol = String(row.kpi || row.department || row.item || row.service || '').toLowerCase();
        const note = String(row.note || row.notes || '').toLowerCase();
        const status = String(row.status || '').toLowerCase();
        if (!firstCol.includes(q) && !note.includes(q) && !status.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, searchQuery]);

  return (
    <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
      <Box bg="#137b7e" color="white" px={7} py={2} display="flex" justifyContent="space-between" alignItems="center">
        <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>{title}</Heading>
        {filteredRows.length !== rows.length && (
          <Badge bg="whiteAlpha.300" color="white" px={2.5} py={0.5} borderRadius="full" fontSize="12px">
            {filteredRows.length} of {rows.length} rows
          </Badge>
        )}
      </Box>
      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead bg="#213f70">
            <Tr>
              {[firstColumnLabel, 'Target', actualLabel, 'Achievement %', statusLabel].map((heading) => (
                <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '15px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                  {heading}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {filteredRows.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={6} color="#64748b" fontStyle="italic">
                  No KPI metrics match the current filter criteria ({statusFilter !== 'All' ? `Status: ${statusFilter}` : ''} {searchQuery ? `Search: "${searchQuery}"` : ''}).
                </Td>
              </Tr>
            ) : (
              filteredRows.map((row, index) => {
                const isZeroTarget = Number(row.target) === 0;
                const isZeroActual = Number(row.actual) === 0;
                const effectiveStatus = (isZeroTarget && isZeroActual)
                  ? 'Not Reported'
                  : (isZeroTarget && row.status === 'On Track')
                    ? 'Not Reported'
                    : (row.status || 'Not Reported');
                const statusStyle = STATUS_STYLES[effectiveStatus] || STATUS_STYLES['Not Reported'] || STATUS_STYLES.Pending;
                return (
                  <Tr key={row.kpi || index} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
                    <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db">{row.kpi}</Td>
                    <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.target)}</Td>
                    <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.actual)}</Td>
                    <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                      {isZeroTarget || row.achievement === null || row.achievement === undefined || isNaN(row.achievement) ? '0%' : `${row.achievement}%`}
                    </Td>
                    <Td textAlign="center" fontSize="14px" fontWeight="600" bg={statusStyle.background} color={statusStyle.color} borderColor="#d1d5db">
                      {effectiveStatus}
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const ComparisonChart = ({ title, rows = [], actualLabel = 'Actual' }) => {
  const values = (rows || []).flatMap((row) => [Number(row?.target) || 0, Number(row?.actual) || 0]);
  const maximum = values.length > 0 ? Math.max(...values, 0) : 0;
  const upperBound = Math.max(4, Math.ceil((maximum + 1) / 5) * 5);

  return (
    <Box bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
      <Heading as="h2" textAlign="center" fontSize={{ base: '21px', md: '27px' }} mb={3}>{title}</Heading>
      <Box h={{ base: '390px', md: '440px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 28, right: 20, left: 10, bottom: 115 }}>
            <CartesianGrid stroke="#9ca3af" vertical={false} />
            <XAxis dataKey="kpi" interval={0} angle={-42} textAnchor="end" height={115} tick={{ fill: '#111827', fontSize: 12 }} />
            <YAxis domain={[0, upperBound]} allowDecimals={false} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontWeight: 700 } }} />
            <ChartTooltip />
            <Legend verticalAlign="bottom" />
            <Bar dataKey="target" name="Target" fill="#5285bf" maxBarSize={38}>
              <LabelList dataKey="target" content={<CountLabel />} />
            </Bar>
            <Bar dataKey="actual" name={actualLabel} fill="#c65353" maxBarSize={38}>
              <LabelList dataKey="actual" content={<CountLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

const CustomerSuccessTable = () => (
  <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
    <Box bg="#137b7e" color="white" px={7} py={2}>
      <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>Customer Success KPIs</Heading>
    </Box>
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead bg="#213f70">
          <Tr>
            {['KPI', 'Target', 'Actual', 'Note'].map((heading) => (
              <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '15px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                {heading}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {CUSTOMER_SUCCESS_KPI_DETAILS.map((row, index) => (
            <Tr key={row.kpi} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
              <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db">{row.kpi}</Td>
              <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.target)}</Td>
              <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.actual)}</Td>
              <Td textAlign="center" fontSize="14px" minW="300px" borderColor="#d1d5db">{row.note}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

const CustomerSuccessChart = () => (
  <Box bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
    <Heading as="h2" textAlign="center" fontSize={{ base: '21px', md: '27px' }} mb={3}>Customer Success Raw Scores</Heading>
    <Box h={{ base: '350px', md: '420px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={CUSTOMER_SUCCESS_KPI_DETAILS} margin={{ top: 28, right: 20, left: 10, bottom: 45 }}>
          <CartesianGrid stroke="#9ca3af" vertical={false} />
          <XAxis dataKey="kpi" interval={0} tick={{ fill: '#111827', fontSize: 12 }} />
          <YAxis domain={[0, 80]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80]} label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fontWeight: 700 } }} />
          <ChartTooltip />
          <Bar dataKey="actual" name="Score" fill="#5285bf" maxBarSize={120}>
            <LabelList dataKey="actual" content={<CountLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Box>
);

const DEFAULT_FINANCE_ROWS = [
  { kpi: 'Weekly Revenue', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Weekly Expenses', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Net Position', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Receivables Collected', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Tax Status', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
];

const FinanceDashboardKpiTable = ({
  rows = [],
  periodKey = '',
  statusFilter = 'All',
  searchQuery = '',
  submittedInfo = null,
}) => {
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter && statusFilter !== 'All') {
        const rowStatus = row.status || 'Not Reported';
        if (statusFilter === 'Not Reported') {
          if (rowStatus !== 'Not Reported' && rowStatus !== 'Pending') return false;
        } else if (rowStatus !== statusFilter) {
          return false;
        }
      }
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const label = String(row.kpi || row.item || '').toLowerCase();
        const notes = String(row.notes || '').toLowerCase();
        if (!label.includes(q) && !notes.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, searchQuery]);

  return (
    <Box border="1px solid #d1d5db" bg="white" overflow="hidden" boxShadow="sm">
      <Box bg="#137b7e" color="white" px={7} py={2} display="flex" justifyContent="space-between" alignItems="center" wrap="wrap" gap={2}>
        <HStack spacing={3}>
          <Heading as="h2" fontSize={{ base: '18px', md: '22px' }}>
            Finance Operational KPIs (ETB)
          </Heading>
          {submittedInfo ? (
            <Badge bg="#10b981" color="white" px={2.5} py={0.5} borderRadius="full" fontSize="11px">
              Submitted by {submittedInfo.submittedByName}
            </Badge>
          ) : (
            <Badge bg="whiteAlpha.300" color="white" px={2.5} py={0.5} borderRadius="full" fontSize="11px">
              Operational Baseline
            </Badge>
          )}
        </HStack>
        {periodKey && (
          <Badge bg="whiteAlpha.200" color="white" px={3} py={1} borderRadius="full" fontSize="11.5px">
            {periodKey}
          </Badge>
        )}
      </Box>
      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead bg="#213f70">
            <Tr>
              {['Metric', 'Target', 'Actual', 'Achievement %', 'Status', 'Notes'].map((heading) => (
                <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '14px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                  {heading}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {filteredRows.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" py={6} color="#64748b" fontStyle="italic">
                  No Finance KPIs match the current filter criteria ({statusFilter !== 'All' ? `Status: ${statusFilter}` : ''} {searchQuery ? `Search: "${searchQuery}"` : ''}).
                </Td>
              </Tr>
            ) : (
              filteredRows.map((row, index) => {
                const isZeroTarget = Number(row.target) === 0;
                const isZeroActual = Number(row.actual) === 0;
                const status = (isZeroTarget && isZeroActual && (!row.status || row.status === 'Pending')) ? 'Not Reported' : (row.status || 'Not Reported');
                const statusStyle = STATUS_STYLES[status] || STATUS_STYLES['Not Reported'] || STATUS_STYLES.Pending;
                const achievement = Number(row.target) > 0 ? Math.round((Number(row.actual) / Number(row.target)) * 100) : 0;
                return (
                  <Tr key={row.kpi || row.item} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
                    <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db" minW="220px">
                      {row.kpi || row.item}
                    </Td>
                    <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                      {formatNumber(row.target)}
                    </Td>
                    <Td textAlign="center" fontSize="14px" fontWeight={row.kpi === 'Net Position' ? '700' : '500'} borderColor="#d1d5db" color={row.kpi === 'Net Position' && row.actual < 0 ? 'red.600' : 'inherit'}>
                      {formatNumber(row.actual)}
                    </Td>
                    <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                      {achievement}%
                    </Td>
                    <Td textAlign="center" fontSize="14px" fontWeight="600" bg={statusStyle.background} color={statusStyle.color} borderColor="#d1d5db" whiteSpace="nowrap">
                      {status}
                    </Td>
                    <Td fontSize="14px" borderColor="#d1d5db" minW="200px">
                      {row.notes || ''}
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const FinanceDepartmentView = ({
  dateRange,
  periodType,
  periodKey: propPeriodKey,
  periodDisplayLabel,
  statusFilter = 'All',
  searchQuery = '',
}) => {
  const [kpiRecord, setKpiRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const defaultPeriod = useMemo(() => getCurrentHrPeriod(dateRange), [dateRange]);
  const activePeriodType = periodType || defaultPeriod.periodType;
  const activePeriodKey = propPeriodKey || defaultPeriod.periodKey;

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');

    getFinanceDepartmentKpis(activePeriodType, activePeriodKey)
      .then((response) => {
        if (active) setKpiRecord(response?.data || null);
      })
      .catch((err) => {
        if (active) setLoadError(err?.message || 'Could not load Finance department KPIs.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activePeriodType, activePeriodKey]);

  const liveRows = useMemo(() => {
    const raw = kpiRecord?.financials || DEFAULT_FINANCE_ROWS;
    return raw.map((item) => {
      const target = Number(item.target) || 0;
      const actual = Number(item.actual) || 0;
      const isZero = target === 0 && actual === 0;
      return {
        ...item,
        target,
        actual,
        achievement: target > 0 ? Math.round((actual / target) * 100) : 0,
        status: isZero && !kpiRecord?.submittedAt ? 'Not Reported' : (item.status || 'Not Reported'),
        notes: item.notes || '',
      };
    });
  }, [kpiRecord]);

  const chartRows = useMemo(() => {
    return liveRows.map((r) => ({
      item: String(r.kpi || r.item || '').replace('Weekly ', ''),
      Target: r.target,
      Actual: r.actual,
      amount: r.actual,
    }));
  }, [liveRows]);

  const revRow = liveRows.find((r) => String(r.kpi || r.item || '').includes('Revenue'));
  const expRow = liveRows.find((r) => String(r.kpi || r.item || '').includes('Expenses'));
  const netRow = liveRows.find((r) => String(r.kpi || r.item || '') === 'Net Position');
  const recRow = liveRows.find((r) => String(r.kpi || r.item || '').includes('Receivables'));
  const taxRow = liveRows.find((r) => String(r.kpi || r.item || '').includes('Tax'));

  return (
    <Box maxW="1400px" mx="auto">
      <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
        <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} wrap="wrap" gap={3}>
          <Box>
            <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">Finance &amp; Accounts</Heading>
            <Text mt={2} fontSize={{ base: '15px', md: '18px' }} fontStyle="italic">
              Weekly revenue, operational expenses, net margins &amp; cash flows
            </Text>
          </Box>
          <HStack spacing={2} wrap="wrap">
            {kpiRecord?.submittedAt ? (
              <Badge bg="#10b981" color="white" px={3} py={1} borderRadius="full" fontSize="12px">
                Submitted by {kpiRecord.submittedByName || 'Finance Manager'} ({new Date(kpiRecord.submittedAt).toLocaleDateString()})
              </Badge>
            ) : (
              <Badge bg="whiteAlpha.300" color="white" px={3} py={1} borderRadius="full" fontSize="12px">
                Live DB Baseline
              </Badge>
            )}
            <Badge bg="whiteAlpha.400" color="white" px={3} py={1} borderRadius="full" fontSize="12px">
              Period: {periodDisplayLabel || activePeriodKey}
            </Badge>
          </HStack>
        </Flex>
      </Box>

      <Box display="grid" gap={7}>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={4}>
          <Box bg="white" p={4} borderRadius="8px" border="1px solid #d1d5db" boxShadow="xs">
            <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">Revenue</Text>
            <Text fontSize="22px" fontWeight="800" color="#0f766e" mt={1}>
              {formatNumber(revRow?.actual)} <Text as="span" fontSize="12px" color="#64748b">ETB</Text>
            </Text>
            <Text fontSize="11px" color="#94a3b8">Target: {formatNumber(revRow?.target)}</Text>
          </Box>
          <Box bg="white" p={4} borderRadius="8px" border="1px solid #d1d5db" boxShadow="xs">
            <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">Expenses</Text>
            <Text fontSize="22px" fontWeight="800" color="#dc2626" mt={1}>
              {formatNumber(expRow?.actual)} <Text as="span" fontSize="12px" color="#64748b">ETB</Text>
            </Text>
            <Text fontSize="11px" color="#94a3b8">Target: {formatNumber(expRow?.target)}</Text>
          </Box>
          <Box bg="white" p={4} borderRadius="8px" border="1px solid #d1d5db" boxShadow="xs">
            <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">Net Position</Text>
            <Text fontSize="22px" fontWeight="800" color={Number(netRow?.actual) >= 0 ? '#16a34a' : '#ea580c'} mt={1}>
              {formatNumber(netRow?.actual)} <Text as="span" fontSize="12px" color="#64748b">ETB</Text>
            </Text>
            <Text fontSize="11px" color="#94a3b8">Target: {formatNumber(netRow?.target)}</Text>
          </Box>
          <Box bg="white" p={4} borderRadius="8px" border="1px solid #d1d5db" boxShadow="xs">
            <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">Receivables</Text>
            <Text fontSize="22px" fontWeight="800" color="#2563eb" mt={1}>
              {formatNumber(recRow?.actual)} <Text as="span" fontSize="12px" color="#64748b">ETB</Text>
            </Text>
            <Text fontSize="11px" color="#94a3b8">Target: {formatNumber(recRow?.target)}</Text>
          </Box>
          <Box bg="white" p={4} borderRadius="8px" border="1px solid #d1d5db" boxShadow="xs">
            <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">Tax Status</Text>
            <Text fontSize="22px" fontWeight="800" color="#7c3aed" mt={1}>
              {formatNumber(taxRow?.actual)} <Text as="span" fontSize="12px" color="#64748b">ETB</Text>
            </Text>
            <Text fontSize="11px" color="#94a3b8">Target: {formatNumber(taxRow?.target)}</Text>
          </Box>
        </SimpleGrid>

        {isLoading && (
          <Box bg="white" border="1px solid #d1d5db" p={8} textAlign="center">
            <Text color="#475569" fontWeight="600">Loading Finance dashboard KPIs…</Text>
          </Box>
        )}

        {!isLoading && loadError && (
          <Box bg="#fff7ed" border="1px solid #fdba74" color="#9a3412" p={4} fontWeight="600">
            {loadError}
          </Box>
        )}

        {!isLoading && !loadError && (
          <>
            <FinanceDashboardKpiTable
              rows={liveRows}
              periodKey={activePeriodKey}
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              submittedInfo={kpiRecord?.submittedAt ? { submittedByName: kpiRecord.submittedByName } : null}
            />
            <Box bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
              <Heading as="h2" textAlign="center" fontSize={{ base: '20px', md: '24px' }} mb={3}>
                Finance Target vs Actual (ETB)
              </Heading>
              <Box h={{ base: '320px', md: '380px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRows} margin={{ top: 20, right: 30, left: 25, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="item" tick={{ fill: '#334155', fontSize: 12 }} />
                    <YAxis tickFormatter={(val) => formatNumber(val)} tick={{ fill: '#334155', fontSize: 12 }} />
                    <ChartTooltip formatter={(val) => [`${formatNumber(val)} ETB`]} />
                    <Legend />
                    <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Actual" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

const TradexTvTable = () => (
  <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
    <Box bg="#137b7e" color="white" px={7} py={2}>
      <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>Tradex TV KPIs</Heading>
    </Box>
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead bg="#213f70">
          <Tr>
            {['KPI', 'Value'].map((heading) => (
              <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '15px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                {heading}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {TRADEX_TV_KPI_DETAILS.map((row, index) => (
            <Tr key={row.kpi} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
              <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db">{row.kpi}</Td>
              <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.value)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

const TradexTvChart = () => (
  <Box bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
    <Heading as="h2" textAlign="center" fontSize={{ base: '21px', md: '27px' }} mb={3}>
      Tradex TV — All Metrics at Zero
    </Heading>
    <Box h={{ base: '360px', md: '430px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={TRADEX_TV_KPI_DETAILS} margin={{ top: 28, right: 20, left: 10, bottom: 105 }}>
          <CartesianGrid stroke="#9ca3af" vertical={false} />
          <XAxis dataKey="kpi" interval={0} angle={-42} textAnchor="end" height={105} tick={{ fill: '#111827', fontSize: 12 }} />
          <YAxis domain={[0, 1]} ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontWeight: 700 } }} />
          <ChartTooltip />
          <Bar dataKey="value" name="Count" fill="#5285bf" minPointSize={1} maxBarSize={110}>
            <LabelList dataKey="value" content={<CountLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Box>
);

const HrTable = () => (
  <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
    <Box bg="#137b7e" color="white" px={7} py={2}>
      <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>HR KPIs</Heading>
    </Box>
    <TableContainer>
      <Table size="sm" variant="simple">
        <Thead bg="#213f70">
          <Tr>
            {['KPI', 'Value'].map((heading) => (
              <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '15px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                {heading}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {HR_KPI_DETAILS.map((row, index) => (
            <Tr key={row.kpi} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
              <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db">{row.kpi}</Td>
              <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                {typeof row.value === 'number' ? formatNumber(row.value) : row.value}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </Box>
);

const HrChart = () => {
  const chartRows = HR_KPI_DETAILS.slice(0, 3);
  return (
    <Box bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
      <Heading as="h2" textAlign="center" fontSize={{ base: '21px', md: '27px' }} mb={3}>HR Headcount Movement</Heading>
      <Box h={{ base: '340px', md: '410px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows} margin={{ top: 28, right: 20, left: 10, bottom: 35 }}>
            <CartesianGrid stroke="#9ca3af" vertical={false} />
            <XAxis dataKey="kpi" interval={0} tick={{ fill: '#111827', fontSize: 12 }} />
            <YAxis domain={[0, 35]} ticks={[0, 5, 10, 15, 20, 25, 30, 35]} allowDecimals={false} label={{ value: 'People', angle: -90, position: 'insideLeft', style: { fontWeight: 700 } }} />
            <ChartTooltip />
            <Bar dataKey="value" name="People" fill="#5285bf" maxBarSize={120}>
              <LabelList dataKey="value" content={<CountLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};


const resolveKpiStatus = (target, actual, rawStatus) => {
  const t = Number(target) || 0;
  const a = Number(actual) || 0;
  if (t === 0 && a === 0) {
    return (rawStatus && rawStatus !== 'Pending' && rawStatus !== 'Not Reported') ? rawStatus : 'Not Reported';
  }
  if (rawStatus && rawStatus !== 'Pending' && rawStatus !== 'Not Reported') {
    if (rawStatus === 'Behind Target') return 'Behind';
    return rawStatus;
  }
  if (t > 0) {
    const ratio = (a / t) * 100;
    if (ratio >= 100) return 'Completed';
    if (ratio >= 80) return 'On Track';
    if (ratio >= 50) return 'At Risk';
    return 'Behind';
  }
  return a > 0 ? 'Completed' : 'Not Reported';
};

const normalizeFilterStatus = (status) => {
  const s = String(status || '').toLowerCase().trim();
  if (s.includes('behind')) return 'Behind';
  if (s.includes('track')) return 'On Track';
  if (s.includes('risk')) return 'At Risk';
  if (s.includes('complet')) return 'Completed';
  if (s.includes('not') || s.includes('pending')) return 'Not Reported';
  return status;
};

const matchesStatusFilter = (itemStatus, statusFilter) => {
  if (!statusFilter || statusFilter === 'All') return true;
  return normalizeFilterStatus(itemStatus) === normalizeFilterStatus(statusFilter);
};

const HrDashboardKpiTable = ({ rows, periodKey, statusFilter = 'All', searchQuery = '' }) => {
  const filteredRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.filter((row) => {
      const effectiveStatus = row.status || resolveKpiStatus(row.target, row.actual, row.status);
      if (!matchesStatusFilter(effectiveStatus, statusFilter)) return false;
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const label = String(row.label || row.kpi || '').toLowerCase();
        const notes = String(row.notes || '').toLowerCase();
        const status = String(effectiveStatus || '').toLowerCase();
        if (!label.includes(q) && !notes.includes(q) && !status.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, searchQuery]);

  return (
    <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
      <Box bg="#137b7e" color="white" px={7} py={2} display="flex" alignItems="center" justifyContent="space-between" gap={4}>
        <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>HR Dashboard KPIs</Heading>
        <HStack spacing={2}>
          {filteredRows.length !== rows.length && (
            <Badge bg="whiteAlpha.300" color="white" px={2.5} py={0.5} borderRadius="full" fontSize="12px">
              {filteredRows.length} of {rows.length}
            </Badge>
          )}
          <Text fontSize="sm" fontWeight="700" whiteSpace="nowrap">Period: {periodKey}</Text>
        </HStack>
      </Box>
      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead bg="#213f70">
            <Tr>
              {['KPI', 'Target', 'Actual', 'Achievement %', 'Status', 'Notes'].map((heading) => (
                <Th key={heading} color="white" textAlign="center" fontSize={{ base: '12px', md: '15px' }} textTransform="none" letterSpacing="normal" py={3} borderColor="#cbd5e1">
                  {heading}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {filteredRows.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" py={6} color="#64748b" fontStyle="italic">
                  No HR KPIs match the current filter criteria ({statusFilter !== 'All' ? `Status: ${statusFilter}` : ''} {searchQuery ? `Search: "${searchQuery}"` : ''}).
                </Td>
              </Tr>
            ) : (
              filteredRows.map((row, index) => {
                const status = resolveKpiStatus(row.target, row.actual, row.status);
                const statusStyle = STATUS_STYLES[status] || STATUS_STYLES['Not Reported'] || STATUS_STYLES.Pending;
                const achievement = Number(row.target) > 0 
                  ? Math.round((Number(row.actual) / Number(row.target)) * 100) 
                  : (Number(row.actual) > 0 ? 100 : 0);
                return (
                  <Tr key={row.key} bg={index % 2 ? '#f3f4f6' : '#ffffff'}>
                    <Td fontWeight="700" fontSize="14px" borderColor="#d1d5db" minW="250px">{row.label}</Td>
                    <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">{formatNumber(row.target)}</Td>
                    <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                      {formatNumber(row.actual)} {row.unit === '%' ? '%' : ''}
                    </Td>
                    <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                      {achievement}%
                    </Td>
                    <Td textAlign="center" fontSize="14px" fontWeight="600" bg={statusStyle.background} color={statusStyle.color} borderColor="#d1d5db" whiteSpace="nowrap">
                      {status}
                    </Td>
                    <Td fontSize="14px" borderColor="#d1d5db" minW="220px">{row.notes || ''}</Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const HrDepartmentView = ({
  dateRange,
  periodType,
  periodKey: propPeriodKey,
  periodDisplayLabel,
  statusFilter = 'All',
  searchQuery = '',
}) => {
  const [kpiRecord, setKpiRecord] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingStats, setIsSyncingStats] = useState(false);
  const [loadError, setLoadError] = useState('');
  const toast = useToast();
  const defaultPeriod = useMemo(() => getCurrentHrPeriod(dateRange), [dateRange]);
  const activePeriodType = periodType || defaultPeriod.periodType;
  const activePeriodKey = propPeriodKey || defaultPeriod.periodKey;

  const fetchHrData = useCallback(() => {
    setIsLoading(true);
    setLoadError('');

    Promise.all([
      getHrKpis(activePeriodType, activePeriodKey),
      getHrLiveStats().catch(() => ({ data: null })),
    ])
      .then(([kpiResponse, statsResponse]) => {
        setKpiRecord(kpiResponse?.data || null);
        if (statsResponse?.data) {
          setLiveStats(statsResponse.data);
        }
      })
      .catch((error) => {
        setLoadError(error?.response?.data?.message || 'Unable to load the live HR KPI dashboard.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activePeriodType, activePeriodKey]);

  useEffect(() => {
    fetchHrData();
  }, [fetchHrData]);

  const handleSyncTelemetry = async () => {
    setIsSyncingStats(true);
    try {
      const [kpiRes, statsRes] = await Promise.all([
        getHrKpis(activePeriodType, activePeriodKey),
        getHrLiveStats(),
      ]);
      setKpiRecord(kpiRes?.data || null);
      if (statsRes?.data) {
        setLiveStats(statsRes.data);
      }
      toast({
        title: 'HR Telemetry Synced',
        description: 'Successfully updated live HR metrics from database.',
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Sync Failed',
        description: 'Could not fetch updated HR metrics.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSyncingStats(false);
    }
  };

  const liveRows = useMemo(() => HR_DASHBOARD_KPIS.map((item) => {
    const metric = kpiRecord?.[item.key] || {};
    const target = Number(metric.target) || 0;
    const actual = Number(metric.actual) || 0;
    const achievement = target > 0 ? Math.round((actual / target) * 100) : (actual > 0 ? 100 : 0);
    const status = resolveKpiStatus(target, actual, metric.status);
    return {
      ...item,
      target,
      actual,
      achievement,
      status,
      notes: metric.notes || '',
      kpi: item.label,
    };
  }), [kpiRecord]);

  const chartRows = useMemo(() => {
    return liveRows.filter((row) => {
      if (!matchesStatusFilter(row.status, statusFilter)) return false;
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const label = String(row.label || row.kpi || '').toLowerCase();
        if (!label.includes(q)) return false;
      }
      return true;
    });
  }, [liveRows, statusFilter, searchQuery]);

  return (
    <Box maxW="1400px" mx="auto">
      <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
        <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} wrap="wrap" gap={3}>
          <Box>
            <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">HR &amp; Development</Heading>
            <Text mt={2} fontSize={{ base: '15px', md: '18px' }} fontStyle="italic">
              Workforce headcount and development KPIs
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              size="sm"
              colorScheme="teal"
              variant="outline"
              bg="whiteAlpha.200"
              _hover={{ bg: 'whiteAlpha.300' }}
              color="white"
              borderColor="whiteAlpha.400"
              isLoading={isSyncingStats}
              onClick={handleSyncTelemetry}
            >
              Sync DB Telemetry
            </Button>
            <Badge bg="whiteAlpha.300" color="white" px={3} py={1} borderRadius="full" fontSize="12.5px">
              Period: {periodDisplayLabel || activePeriodKey}
            </Badge>
          </HStack>
        </Flex>
      </Box>

      <Box display="grid" gap={7}>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
          <Box bg="white" p={4} borderRadius="8px" border="1px solid #d1d5db" boxShadow="xs">
            <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">New Hires</Text>
            <Text fontSize="24px" fontWeight="800" color="#213f70" mt={1}>
              {formatNumber(liveRows.find((r) => r.key === 'newHires')?.actual)}
            </Text>
            <Text fontSize="11px" color="#94a3b8">Target: {formatNumber(liveRows.find((r) => r.key === 'newHires')?.target)}</Text>
          </Box>
          <Box bg="white" p={4} borderRadius="8px" border="1px solid #d1d5db" boxShadow="xs">
            <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">Candidates Pool</Text>
            <Text fontSize="24px" fontWeight="800" color="#213f70" mt={1}>
              {formatNumber(liveRows.find((r) => r.key === 'candidatesPool')?.actual)}
            </Text>
            <Text fontSize="11px" color="#94a3b8">
              {liveStats?.activeCandidates ? `Active DB: ${liveStats.activeCandidates}` : 'Active pipeline'}
            </Text>
          </Box>
          <Box bg="white" p={4} borderRadius="8px" border="1px solid #d1d5db" boxShadow="xs">
            <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">Vacancies Posted</Text>
            <Text fontSize="24px" fontWeight="800" color="#213f70" mt={1}>
              {formatNumber(liveRows.find((r) => r.key === 'postVacancies')?.actual)}
            </Text>
            <Text fontSize="11px" color="#94a3b8">Target: {formatNumber(liveRows.find((r) => r.key === 'postVacancies')?.target)}</Text>
          </Box>
          <Box bg="white" p={4} borderRadius="8px" border="1px solid #d1d5db" boxShadow="xs">
            <Text fontSize="12px" fontWeight="700" color="#64748b" textTransform="uppercase">Attendance &amp; Punctuality</Text>
            <Text fontSize="24px" fontWeight="800" color="#213f70" mt={1}>
              {formatNumber(liveRows.find((r) => r.key === 'attendancePunctuality')?.actual)}%
            </Text>
            <Text fontSize="11px" color="#94a3b8">Compliance baseline</Text>
          </Box>
        </SimpleGrid>

        {isLoading && (
          <Box bg="white" border="1px solid #d1d5db" p={8} textAlign="center">
            <Text color="#475569" fontWeight="600">Loading HR dashboard KPIs…</Text>
          </Box>
        )}

        {!isLoading && loadError && (
          <Box bg="#fff7ed" border="1px solid #fdba74" color="#9a3412" p={4} fontWeight="600">
            {loadError}
          </Box>
        )}

        {!isLoading && !loadError && (
          <>
            <HrDashboardKpiTable
              rows={liveRows}
              periodKey={activePeriodKey}
              statusFilter={statusFilter}
              searchQuery={searchQuery}
            />
            <ComparisonChart title="HR KPI Target vs Actual" rows={chartRows} />
          </>
        )}
      </Box>
    </Box>
  );
};

const SalesDepartmentView = ({
  dateRange,
  periodType,
  periodKey: propPeriodKey,
  periodDisplayLabel,
  statusFilter = 'All',
  searchQuery = '',
}) => {
  const [kpiRecord, setKpiRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const defaultPeriod = useMemo(() => getCurrentHrPeriod(dateRange), [dateRange]);
  const activePeriodType = periodType || defaultPeriod.periodType;
  const activePeriodKey = propPeriodKey || defaultPeriod.periodKey;

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');

    getSalesDepartmentKpis(activePeriodType, activePeriodKey)
      .then((response) => {
        if (active) setKpiRecord(response?.data || null);
      })
      .catch((error) => {
        if (active) setLoadError(error?.response?.data?.message || 'Unable to load live Sales KPI data.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activePeriodType, activePeriodKey]);

  const measurements = kpiRecord?.measurements || [];
  const services = kpiRecord?.services || [];
  const products = kpiRecord?.products || [];
  const isLiveSubmitted = !!kpiRecord?.submittedAt;

  const filteredServices = useMemo(() => {
    return services.filter((row) => {
      if (statusFilter && statusFilter !== 'All') {
        const rowStatus = row.status || 'Pending';
        if (statusFilter === 'Not Reported') {
          if (rowStatus !== 'Not Reported' && rowStatus !== 'Pending') return false;
        } else if (rowStatus !== statusFilter) {
          return false;
        }
      }
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const label = String(row.kpi || row.service || '').toLowerCase();
        if (!label.includes(q)) return false;
      }
      return true;
    });
  }, [services, statusFilter, searchQuery]);

  return (
    <Box maxW="1400px" mx="auto">
      <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
        <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} wrap="wrap" gap={3}>
          <Box>
            <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">Sales &amp; Services</Heading>
            <Text mt={2} fontSize={{ base: '15px', md: '18px' }} fontStyle="italic">
              Service-line conversion performance &amp; sales department metrics
            </Text>
          </Box>
          <HStack spacing={2.5} wrap="wrap">
            <Badge
              bg={isLiveSubmitted ? '#10b981' : '#0284c7'}
              color="white"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="12.5px"
              textTransform="none"
              boxShadow="sm"
            >
              {isLiveSubmitted ? `Reported by ${kpiRecord.submittedByName || 'Sales Manager'}` : 'Real MongoDB Live Data (Pending Submission)'}
            </Badge>
            <Badge bg="whiteAlpha.300" color="white" px={3} py={1} borderRadius="full" fontSize="12.5px">
              Period: {periodDisplayLabel || activePeriodKey}
            </Badge>
          </HStack>
        </Flex>
      </Box>

      {isLoading && (
        <Box bg="white" border="1px solid #d1d5db" p={8} textAlign="center" mb={7}>
          <Spinner color="#213f70" size="lg" mb={3} />
          <Text color="#475569" fontWeight="600">Fetching live Sales department KPIs from Sales Manager &amp; MongoDB...</Text>
        </Box>
      )}

      {!isLoading && loadError && (
        <Box bg="#fff7ed" border="1px solid #fdba74" color="#9a3412" p={4} mb={7} fontWeight="600">
          {loadError}
        </Box>
      )}

      {!isLiveSubmitted && !isLoading && !loadError && (
        <Alert status="info" borderRadius="8px" mb={6} bg="#f0f9ff" borderColor="#bae6fd" borderWidth="1px">
          <AlertIcon as={FiDatabase} color="#0284c7" />
          <Box>
            <Text fontWeight="700" color="#0369a1" fontSize="13.5px">
              Live Database Operational Actuals
            </Text>
            <Text fontSize="13px" color="#0284c7">
              Displaying real operational counts and revenues dynamically aggregated from active MongoDB records (SalesCustomer, PackageSale, Orders, and Revenue ledger) for {periodDisplayLabel || activePeriodKey}.
            </Text>
          </Box>
        </Alert>
      )}

      {kpiRecord?.summaryNotes && (
        <Box bg="#f0fdf4" border="1px solid #86efac" p={4} borderRadius="8px" mb={7}>
          <Heading as="h4" fontSize="15px" color="#166534" mb={1}>
            Executive Notes from Sales Manager ({kpiRecord.submittedByName || 'Sales Manager'}):
          </Heading>
          <Text fontSize="14px" color="#14532d">
            {kpiRecord.summaryNotes}
          </Text>
        </Box>
      )}

      <Box display="grid" gap={7}>
        <DetailTable
          title={isLiveSubmitted ? "Sales Measurements (Submitted Report)" : "Sales Measurements (Real Database Operational Actuals)"}
          rows={measurements}
          firstColumnLabel="Measurement"
          statusFilter={statusFilter}
          searchQuery={searchQuery}
        />
        <DetailTable
          title="Service Lines"
          rows={services}
          firstColumnLabel="Service"
          actualLabel="Achieved"
          statusFilter={statusFilter}
          searchQuery={searchQuery}
        />
        <DetailTable
          title="Product KPIs"
          rows={products}
          firstColumnLabel="Product"
          actualLabel="Achieved"
          statusFilter={statusFilter}
          searchQuery={searchQuery}
        />
        <ComparisonChart
          title="Service Lines: Target vs Achieved"
          rows={filteredServices}
          actualLabel="Achieved"
        />
      </Box>
    </Box>
  );
};

const OverviewView = ({
  departmentId = 'all',
  onSelectDepartment,
  dateRange = 'Weekly',
  periodType,
  periodKey: propPeriodKey,
  periodDisplayLabel,
  statusFilter = 'All',
  searchQuery = '',
}) => {
  const defaultPeriod = useMemo(() => getCurrentHrPeriod(dateRange), [dateRange]);
  const activePeriodType = periodType || defaultPeriod.periodType;
  const activePeriodKey = propPeriodKey || defaultPeriod.periodKey;
  const activeDisplayPeriod = periodDisplayLabel || dateRange;

  const [liveHrKpi, setLiveHrKpi] = useState(null);
  const [liveFinanceKpi, setLiveFinanceKpi] = useState(null);
  const [snapshotRequest, setSnapshotRequest] = useState({ loading: true, data: null, error: '' });
  const [snapshotRevision, setSnapshotRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setSnapshotRequest({ loading: true, data: null, error: '' });
    axiosInstance.get('/coo-dashboard/department-analytics', {
      signal: controller.signal,
      params: { periodType: activePeriodType, periodKey: activePeriodKey },
    }).then(({ data }) => {
      if (!Array.isArray(data.departments) || !Array.isArray(data.metrics)) throw new Error('Invalid department response');
      if (!controller.signal.aborted) setSnapshotRequest({ loading: false, data, error: '' });
    }).catch(() => {
      if (!controller.signal.aborted) setSnapshotRequest({ loading: false, data: null, error: 'Unable to load department data. Please retry.' });
    });
    return () => controller.abort();
  }, [activePeriodType, activePeriodKey, snapshotRevision]);

  useEffect(() => {
    let isMounted = true;
    getHrKpis({ periodType: activePeriodType, periodKey: activePeriodKey })
      .then((data) => {
        if (isMounted) setLiveHrKpi(data?.currentReport || data?.report || data || null);
      })
      .catch(() => {});

    getFinanceDepartmentKpis({ periodType: activePeriodType, periodKey: activePeriodKey })
      .then((data) => {
        if (isMounted) setLiveFinanceKpi(data?.currentReport || data?.report || data || null);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [activePeriodType, activePeriodKey]);

  const hrLiveRows = useMemo(() => HR_DASHBOARD_KPIS.map((item) => {
    const metric = liveHrKpi?.[item.key] || {};
    const target = Number(metric.target) || 0;
    const actual = Number(metric.actual) || 0;
    const achievement = target > 0 ? Math.round((actual / target) * 100) : (actual > 0 ? 100 : 0);
    const status = resolveKpiStatus(target, actual, metric.status);
    return {
      ...item,
      target,
      actual,
      achievement,
      status,
      notes: metric.notes || '',
      kpi: item.label,
    };
  }), [liveHrKpi]);

  const filteredHrRows = useMemo(() => {
    return hrLiveRows.filter((row) => {
      if (!matchesStatusFilter(row.status, statusFilter)) return false;
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const label = String(row.label || row.kpi || '').toLowerCase();
        const notes = String(row.notes || '').toLowerCase();
        const status = String(row.status || '').toLowerCase();
        if (!label.includes(q) && !notes.includes(q) && !status.includes(q)) return false;
      }
      return true;
    });
  }, [hrLiveRows, statusFilter, searchQuery]);

  const financeLiveRows = useMemo(() => {
    const raw = liveFinanceKpi?.financials || DEFAULT_FINANCE_ROWS;
    return raw.map((item) => {
      const target = Number(item.target) || 0;
      const actual = Number(item.actual) || 0;
      const achievement = target > 0 ? Math.round((actual / target) * 100) : 0;
      const isZero = target === 0 && actual === 0;
      return {
        ...item,
        target,
        actual,
        achievement,
        status: isZero && !liveFinanceKpi?.submittedAt ? 'Not Reported' : (item.status || 'Not Reported'),
        notes: item.notes || '',
      };
    });
  }, [liveFinanceKpi]);

  const dynamicDepartmentSummary = useMemo(
    () => buildDepartmentSnapshot(snapshotRequest.data || {}),
    [snapshotRequest.data],
  );

  const filteredDepartmentSummary = useMemo(() => {
    return dynamicDepartmentSummary.filter((row) => {
      // Status filter
      if (!matchesStatusFilter(row.status, statusFilter)) return false;
      // Search query
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const dept = String(row.department || '').toLowerCase();
        const metric = String(row.keyMetric || '').toLowerCase();
        const status = String(row.status || '').toLowerCase();
        if (!dept.includes(q) && !metric.includes(q) && !status.includes(q)) return false;
      }
      return true;
    });
  }, [dynamicDepartmentSummary, statusFilter, searchQuery]);

  if (departmentId === 'tessbin') {
    return <TessbinDepartmentView periodType={activePeriodType} periodKey={activePeriodKey}
      periodDisplayLabel={periodDisplayLabel} searchQuery={searchQuery} />;
  }

  if (departmentId === 'it') {
    return (
      <Box maxW="1400px" mx="auto">
        <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
          <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">IT &amp; Technology</Heading>
          <Text mt={3} fontSize={{ base: '16px', md: '20px' }} fontStyle="italic">
            Internal platforms, external collateral, and operations
          </Text>
        </Box>

        <Box display="grid" gap={7}>
          <DetailTable title="Internal Deliverables" rows={IT_KPI_DETAILS.internal} statusFilter={statusFilter} searchQuery={searchQuery} />
          <DetailTable title="External Collateral" rows={IT_KPI_DETAILS.external} statusFilter={statusFilter} searchQuery={searchQuery} />
          <ComparisonChart title="Internal Platforms: Target vs Actual" rows={IT_KPI_DETAILS.internal} />
          <ComparisonChart title="External Collateral: Target vs Actual" rows={IT_KPI_DETAILS.external} />
        </Box>
      </Box>
    );
  }

  if (departmentId === 'social_media') {
    return (
      <SocialMediaDepartmentView
        dateRange={dateRange}
        periodType={activePeriodType}
        periodKey={activePeriodKey}
        periodDisplayLabel={periodDisplayLabel}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
      />
    );
  }

  if (departmentId === 'sales') {
    return (
      <SalesDepartmentView
        dateRange={dateRange}
        periodType={activePeriodType}
        periodKey={activePeriodKey}
        periodDisplayLabel={periodDisplayLabel}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
      />
    );
  }

  if (departmentId === 'tradex') {
    return (
      <Box maxW="1400px" mx="auto">
        <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
          <Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">Tradex TV — Business</Heading>
          <Text mt={3} fontSize={{ base: '16px', md: '20px' }} fontStyle="italic">
            Content production and audience metrics
          </Text>
        </Box>

        <Box display="grid" gap={7}>
          <TradexTvTable />
          <TradexTvChart />
        </Box>
      </Box>
    );
  }

  if (departmentId === 'customer_services') {
    return <CustomerDepartmentKpiReport readOnly periodType={activePeriodType} periodKey={activePeriodKey} periodDisplayLabel={periodDisplayLabel} />;
  }

  if (departmentId === 'finance') {
    return (
      <FinanceDepartmentView
        dateRange={dateRange}
        periodType={activePeriodType}
        periodKey={activePeriodKey}
        periodDisplayLabel={periodDisplayLabel}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
      />
    );
  }

  const normDept = String(departmentId || '').toLowerCase().trim();
  if (normDept === 'hr' || normDept === 'hr & development' || normDept === 'hr_development' || normDept === 'hr-development') {
    return (
      <HrDepartmentView
        dateRange={dateRange}
        periodType={activePeriodType}
        periodKey={activePeriodKey}
        periodDisplayLabel={periodDisplayLabel}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
      />
    );
  }

  if (snapshotRequest.loading) {
    return <HStack justify="center" py={12}><Spinner /><Text>Loading department data...</Text></HStack>;
  }
  if (snapshotRequest.error) {
    return <Alert status="error"><AlertIcon />{snapshotRequest.error}
      <Button ml={4} onClick={() => setSnapshotRevision((value) => value + 1)}>Retry</Button>
    </Alert>;
  }

  return (
    <Box maxW="1400px" mx="auto">
      <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
        <Heading as="h1" fontSize={{ base: '24px', md: '34px' }} lineHeight="1.2">
          Tradethiopia Group — Department KPI Summary
        </Heading>
        <Text mt={2} fontSize={{ base: '16px', md: '21px' }} fontStyle="italic">
          Operations Division | {activeDisplayPeriod} Report
        </Text>
      </Box>

      <Box border="1px solid #d1d5db" bg="white" overflow="hidden">
        <Box bg="#137b7e" color="white" px={7} py={2} display="flex" justifyContent="space-between" alignItems="center">
          <Heading as="h2" fontSize={{ base: '20px', md: '25px' }}>
            Department Snapshot
          </Heading>
          {filteredDepartmentSummary.length !== dynamicDepartmentSummary.length && (
            <Badge bg="whiteAlpha.300" color="white" px={2.5} py={0.5} borderRadius="full" fontSize="12px">
              {filteredDepartmentSummary.length} of {dynamicDepartmentSummary.length} departments
            </Badge>
          )}
        </Box>

        {/* Active Filter Bar */}
        {(statusFilter !== 'All' || (searchQuery && searchQuery.trim())) && (
          <Flex bg="#f8fafc" px={7} py={2} justify="space-between" align="center" borderBottom="1px solid #cbd5e1" wrap="wrap" gap={2}>
            <HStack spacing={2} wrap="wrap">
              <Text fontSize="12.5px" fontWeight="700" color="#475569">Active Filters:</Text>
              {statusFilter !== 'All' && (
                <Badge colorScheme="blue" fontSize="11.5px">Status: {statusFilter}</Badge>
              )}
              {searchQuery && searchQuery.trim() && (
                <Badge colorScheme="purple" fontSize="11.5px">Search: "{searchQuery.trim()}"</Badge>
              )}
            </HStack>
            <Text fontSize="12px" fontWeight="600" color="#64748b">
              Showing {filteredDepartmentSummary.length} of {dynamicDepartmentSummary.length} departments
            </Text>
          </Flex>
        )}

        <TableContainer>
          <Table size="sm" variant="simple">
            <Thead bg="#213f70">
              <Tr>
                {['Department', 'Key Metric', 'Target', 'Actual', 'Achievement %', 'Status'].map((heading) => (
                  <Th
                    key={heading}
                    color="white"
                    textAlign="center"
                    fontSize={{ base: '12px', md: '15px' }}
                    textTransform="none"
                    letterSpacing="normal"
                    py={3}
                    borderColor="#cbd5e1"
                  >
                    {heading}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {filteredDepartmentSummary.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8} color="#64748b" fontStyle="italic">
                    No departments match your filter criteria ({statusFilter !== 'All' ? `Status: ${statusFilter}` : ''} {searchQuery ? `Search: "${searchQuery}"` : ''}).
                  </Td>
                </Tr>
              ) : (
                filteredDepartmentSummary.map((row, index) => {
                  const statusStyle = STATUS_STYLES[row.status] || STATUS_STYLES.Behind;
                  return (
                    <Tr
                      key={row.department}
                      bg={index % 2 ? '#f3f4f6' : '#ffffff'}
                      cursor={onSelectDepartment && row.deptId ? 'pointer' : 'default'}
                      _hover={onSelectDepartment && row.deptId ? { bg: '#e0f2fe' } : undefined}
                      onClick={() => {
                        if (onSelectDepartment && row.deptId) {
                          onSelectDepartment(row.deptId);
                        }
                      }}
                      title={onSelectDepartment && row.deptId ? `Click to view ${row.department} department details` : undefined}
                    >
                      <Td fontWeight="700" fontSize="14px" whiteSpace="nowrap" borderColor="#d1d5db">
                        {row.department}
                      </Td>
                      <Td textAlign="center" fontSize="14px" minW="260px" borderColor="#d1d5db">
                        {row.keyMetric}
                      </Td>
                      <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                        {row.target === null ? 'N/A' : formatNumber(row.target)}
                      </Td>
                      <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                        {row.actual === null ? 'N/A' : formatNumber(row.actual)}
                      </Td>
                      <Td textAlign="center" fontSize="14px" borderColor="#d1d5db">
                        {row.achievement === null ? 'N/A' : `${Number(row.achievement.toFixed(1))}%`}
                      </Td>
                      <Td
                        textAlign="center"
                        fontSize="14px"
                        fontWeight="600"
                        bg={statusStyle.background}
                        color={statusStyle.color}
                        borderColor="#d1d5db"
                        whiteSpace="nowrap"
                      >
                        {row.status}
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <Box mt={7} bg="white" border="1px solid #d1d5db" px={{ base: 3, md: 6 }} pt={5} pb={2}>
        <Heading as="h2" textAlign="center" fontSize={{ base: '21px', md: '29px' }} mb={3}>
          Department Achievement % (average of measurable KPIs)
        </Heading>
        {!filteredDepartmentSummary.some((row) => row.departmentAchievement !== null) ? (
          <Text textAlign="center" py={12} color="#64748b">No measurable targets are available for this period.</Text>
        ) : <Box h={{ base: '390px', md: '460px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredDepartmentSummary.filter((row) => row.departmentAchievement !== null).map((row) => ({ ...row, achievement: Number(row.departmentAchievement.toFixed(1)) }))} margin={{ top: 28, right: 20, left: 12, bottom: 125 }}>
              <CartesianGrid stroke="#9ca3af" vertical={false} />
              <XAxis
                dataKey="department"
                interval={0}
                angle={-42}
                textAnchor="end"
                height={125}
                tick={{ fill: '#111827', fontSize: 12 }}
                axisLine={{ stroke: '#6b7280' }}
              />
              <YAxis
                domain={[0, (max) => Math.max(100, max)]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: '#111827', fontSize: 12 }}
                label={{ value: 'Achievement %', angle: -90, position: 'insideLeft', offset: -2, style: { fontWeight: 700 } }}
              />
              <ChartTooltip formatter={(value) => [`${value}%`, 'Achievement']} />
              <Bar dataKey="achievement" fill="#5285bf" maxBarSize={62}>
                <LabelList dataKey="achievement" content={<AchievementLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>}
      </Box>

      {/* Live HR Department Operational KPIs Display on COO2 Dashboard */}
      <Box mt={8}>
        <HrDashboardKpiTable
          rows={hrLiveRows}
          periodKey={activePeriodKey}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
        />
      </Box>

      <Box mt={7}>
        <ComparisonChart
          title="HR & Development: Target vs Actual"
          rows={filteredHrRows}
        />
      </Box>

      {/* Live Finance Department Operational KPIs Display on COO2 Dashboard */}
      <Box mt={8}>
        <FinanceDashboardKpiTable
          rows={financeLiveRows}
          periodKey={activePeriodKey}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          submittedInfo={liveFinanceKpi?.submittedAt ? { submittedByName: liveFinanceKpi.submittedByName } : null}
        />
      </Box>
    </Box>
  );
};

export default OverviewView;
