import { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  ButtonGroup,
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
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  FiAlertCircle,
  FiArrowRight,
  FiCalendar,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiEye,
  FiImage,
  FiMaximize2,
  FiTarget,
  FiTrash2,
  FiTrendingUp,
  FiUploadCloud,
  FiX,
  FiZap,
} from 'react-icons/fi';
import api from '../../services/axiosInstance';
import { SectionIntro, SurfaceCard } from './SocialMediaPrimitives';

const periodLabels = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };

const currentPeriod = (type) => {
  const now = new Date();
  const year = now.getFullYear();
  if (type === 'yearly') return `${year}`;
  if (type === 'monthly') return `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (type === 'quarterly') return `${year}-Q${Math.floor(now.getMonth() / 3) + 1}`;
  const day = new Date(Date.UTC(year, now.getMonth(), now.getDate()));
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const weekYear = day.getUTCFullYear();
  const week = Math.ceil(((day - new Date(Date.UTC(weekYear, 0, 1))) / 86400000 + 1) / 7);
  return `${weekYear}-W${String(week).padStart(2, '0')}`;
};

const formatPeriodDisplayName = (type, key) => {
  if (!key) return '';
  if (type === 'yearly') return `Year ${key}`;
  if (type === 'monthly') {
    const [y, m] = key.split('-');
    if (y && m) {
      const date = new Date(Number(y), Number(m) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return key;
  }
  if (type === 'quarterly') {
    const [y, q] = key.split('-Q');
    const quarterNames = { '1': 'Q1 (Jan–Mar)', '2': 'Q2 (Apr–Jun)', '3': 'Q3 (Jul–Sep)', '4': 'Q4 (Oct–Dec)' };
    return `${quarterNames[q] || `Q${q}`} ${y}`;
  }
  if (type === 'weekly') {
    const [y, w] = key.split('-W');
    return `Week ${w}, ${y}`;
  }
  return key;
};

const blankReport = () => ({
  periodType: 'weekly',
  periodKey: currentPeriod('weekly'),
  metrics: [],
  seoTarget: '',
  seoActual: '',
  summaryNotes: '',
  evidencePhotos: [],
});

export default function SocialKpiSubmission() {
  const [form, setForm] = useState(blankReport);
  const [defaultMetrics, setDefaultMetrics] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const toast = useToast();

  const activeCardBg = useColorModeValue('blue.50', 'rgba(37, 99, 235, 0.15)');
  const activeCardBorder = useColorModeValue('blue.500', 'blue.400');
  const cardBorder = useColorModeValue('gray.200', 'whiteAlpha.200');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get('/social-kpi-reports')
      .then(({ data }) => {
        if (!active) return;
        setDefaultMetrics(data.defaults || []);
        setReports(data.reports || []);
        
        // Auto-select current weekly report if it exists, or populate defaults
        const currentWeeklyKey = currentPeriod('weekly');
        const existingWeekly = (data.reports || []).find(
          (r) => r.periodType === 'weekly' && r.periodKey === currentWeeklyKey
        );
        if (existingWeekly) {
          setForm({
            ...blankReport(),
            ...existingWeekly,
            periodType: 'weekly',
            periodKey: currentWeeklyKey,
          });
        } else {
          setForm((prev) => ({
            ...prev,
            periodType: 'weekly',
            periodKey: currentWeeklyKey,
            metrics: data.defaults || [],
          }));
        }
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Unable to load KPI reports.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);

  // When changing periodType or periodKey, auto-populate if existing report matches
  const handlePeriodChange = (newType, newKey) => {
    const existing = reports.find((r) => r.periodType === newType && r.periodKey === newKey);
    if (existing) {
      setForm({
        ...blankReport(),
        ...existing,
        periodType: newType,
        periodKey: newKey,
      });
    } else {
      setForm((prev) => ({
        ...prev,
        periodType: newType,
        periodKey: newKey,
        metrics: defaultMetrics.map((dm) => ({ ...dm, target: null, actual: null })),
        seoTarget: '',
        seoActual: '',
        summaryNotes: '',
      }));
    }
  };

  const change = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  const handlePhotoUpload = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, JPEG, WebP).',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Data = uploadEvent.target?.result;
      if (typeof base64Data === 'string') {
        setForm((prev) => {
          const currentPhotos = [...(prev.evidencePhotos || [])];
          currentPhotos[index] = base64Data;
          return { ...prev, evidencePhotos: currentPhotos.slice(0, 3) };
        });
        toast({
          title: `Evidence Photo ${index + 1} attached`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setForm((prev) => {
      const currentPhotos = [...(prev.evidencePhotos || [])];
      currentPhotos.splice(index, 1);
      return { ...prev, evidencePhotos: currentPhotos };
    });
  };

  const updateMetric = (id, field, value) =>
    setForm((previous) => ({
      ...previous,
      metrics: previous.metrics.map((row) =>
        row.id === id ? { ...row, [field]: value === '' ? null : Number(value) } : row
      ),
    }));

  const metricsTotals = useMemo(() => {
    let totalTarget = 0;
    let totalActual = 0;
    let filledCount = 0;
    (form.metrics || []).forEach((m) => {
      if (m.target !== null && m.actual !== null) {
        totalTarget += Number(m.target) || 0;
        totalActual += Number(m.actual) || 0;
        filledCount += 1;
      }
    });
    const achievement = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : (totalActual > 0 ? '100' : '0');
    return { totalTarget, totalActual, achievement, filledCount, totalCount: form.metrics?.length || 0 };
  }, [form.metrics]);

  const existingReportForPeriod = useMemo(() => {
    return reports.find((r) => r.periodType === form.periodType && r.periodKey === form.periodKey);
  }, [reports, form.periodType, form.periodKey]);

  // Compute status for the 4 core reporting periods (Current Week, Month, Quarter, Year)
  const currentPeriodsStatus = useMemo(() => {
    const periods = [
      { type: 'weekly', title: 'Current Week', icon: FiCalendar },
      { type: 'monthly', title: 'Current Month', icon: FiCalendar },
      { type: 'quarterly', title: 'Current Quarter', icon: FiTrendingUp },
      { type: 'yearly', title: 'Current Year', icon: FiTarget },
    ];

    return periods.map((p) => {
      const key = currentPeriod(p.type);
      const existing = reports.find((r) => r.periodType === p.type && r.periodKey === key);
      const isSelected = form.periodType === p.type && form.periodKey === key;
      const formattedName = formatPeriodDisplayName(p.type, key);

      let totalTarget = 0;
      let totalActual = 0;
      if (existing && existing.metrics) {
        existing.metrics.forEach((m) => {
          totalTarget += Number(m.target) || 0;
          totalActual += Number(m.actual) || 0;
        });
      }
      const achievement =
        totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : totalActual > 0 ? '100' : '0';

      return {
        ...p,
        key,
        formattedName,
        existing,
        isSelected,
        achievement,
        totalTarget,
        totalActual,
      };
    });
  }, [reports, form.periodType, form.periodKey]);

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.periodType || !form.periodKey) {
      setError('Choose a reporting period.');
      return;
    }
    if (
      form.metrics.some(
        (row) => ![row.target, row.actual].every((value) => Number.isSafeInteger(value) && value >= 0)
      )
    ) {
      setError('Complete every target and achieved value with a non-negative whole number (use 0 if none).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/social-kpi-reports', form);
      setReports((previous) => [data, ...previous.filter((row) => row._id !== data._id)].slice(0, 50));
      toast({
        title: 'KPI report submitted successfully',
        description: `Social media ${periodLabels[form.periodType] || ''} report for ${form.periodKey} submitted & live in COO2 dashboard.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Your entries are still available; please retry.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner aria-label="Loading KPI reports" />;
  if (!form.metrics.length && !defaultMetrics.length)
    return (
      <Alert status="error">
        <AlertIcon />
        {error || 'Unable to initialize KPI forms.'}
        <Button ml={3} size="sm" onClick={() => setReload((value) => value + 1)}>
          Retry
        </Button>
      </Alert>
    );

  return (
    <Stack spacing={6}>
      <SectionIntro
        eyebrow="Analytics &amp; Performance"
        title="Submit Social Media KPI"
        description="Submit weekly, monthly, quarterly and yearly KPI reports for content publication, follower growth, SEO and campaigns to automatically feed the COO2 Executive Dashboard."
      />

      {/* ── 4 Current Reporting Periods Status Overview ── */}
      <Box>
        <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
          <Heading size="xs" textTransform="uppercase" letterSpacing="0.06em" color="gray.500" _dark={{ color: 'gray.400' }}>
            Current Reporting Periods Status
          </Heading>
          <Text fontSize="xs" color="gray.500">
            Click any card to load, review, or submit for that period
          </Text>
        </Flex>

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
          {currentPeriodsStatus.map((period) => (
            <Card
              key={period.type}
              as="button"
              type="button"
              textAlign="left"
              onClick={() => handlePeriodChange(period.type, period.key)}
              variant="outline"
              borderRadius="xl"
              transition="all 0.2s ease"
              cursor="pointer"
              borderWidth={period.isSelected ? '2px' : '1px'}
              borderColor={period.isSelected ? activeCardBorder : cardBorder}
              bg={period.isSelected ? activeCardBg : 'transparent'}
              boxShadow={period.isSelected ? '0 4px 14px rgba(37,99,235,0.18)' : 'none'}
              _hover={{
                transform: 'translateY(-2px)',
                borderColor: activeCardBorder,
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
              }}
            >
              <CardBody p={3.5}>
                <Flex justify="space-between" align="flex-start" mb={2}>
                  <HStack spacing={1.5}>
                    <Icon
                      as={period.icon}
                      boxSize={4}
                      color={period.isSelected ? 'blue.500' : 'gray.400'}
                    />
                    <Text fontSize="xs" fontWeight="700">
                      {period.title}
                    </Text>
                  </HStack>
                  {period.existing ? (
                    <Badge colorScheme="green" fontSize="9px" px={1.5} py={0.5} borderRadius="full">
                      <HStack spacing={1}>
                        <Icon as={FiCheckCircle} boxSize={2.5} />
                        <Text>Submitted</Text>
                      </HStack>
                    </Badge>
                  ) : (
                    <Badge colorScheme="orange" fontSize="9px" px={1.5} py={0.5} borderRadius="full">
                      <HStack spacing={1}>
                        <Icon as={FiAlertCircle} boxSize={2.5} />
                        <Text>Pending</Text>
                      </HStack>
                    </Badge>
                  )}
                </Flex>

                <Text fontSize="sm" fontWeight="800" noOfLines={1} mb={1}>
                  {period.formattedName}
                </Text>
                <Text fontSize="10px" color="gray.500" fontFamily="mono" mb={2}>
                  {period.key}
                </Text>

                <Divider my={1.5} borderColor={cardBorder} />

                {period.existing ? (
                  <VStack align="stretch" spacing={0.5}>
                    <Flex justify="space-between" align="center">
                      <Text fontSize="10px" color="gray.500">
                        Achievement:
                      </Text>
                      <Badge
                        fontSize="10px"
                        colorScheme={
                          Number(period.achievement) >= 80
                            ? 'green'
                            : Number(period.achievement) >= 50
                            ? 'yellow'
                            : 'red'
                        }
                      >
                        {period.achievement}%
                      </Badge>
                    </Flex>
                    <Text fontSize="9px" color="gray.500" noOfLines={1}>
                      by {period.existing.submittedByName || 'Manager'}
                    </Text>
                    <HStack spacing={1} color="blue.500" pt={1} justify="flex-end">
                      <Text fontSize="10px" fontWeight="700">
                        Edit submission
                      </Text>
                      <Icon as={FiEdit3} boxSize={2.5} />
                    </HStack>
                  </VStack>
                ) : (
                  <VStack align="stretch" spacing={0.5}>
                    <Text fontSize="10px" color="orange.600" _dark={{ color: 'orange.300' }} fontWeight="600">
                      Action Required
                    </Text>
                    <Text fontSize="9px" color="gray.500">
                      Not yet submitted to COO2
                    </Text>
                    <HStack spacing={1} color="blue.600" _dark={{ color: 'blue.300' }} pt={1} justify="flex-end">
                      <Text fontSize="10px" fontWeight="700">
                        Submit now
                      </Text>
                      <Icon as={FiArrowRight} boxSize={2.5} />
                    </HStack>
                  </VStack>
                )}
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      <SurfaceCard>
        <Box as="form" p={{ base: 3, md: 6 }} onSubmit={submit}>
          <Stack as="fieldset" disabled={saving} spacing={6} border={0} p={0} m={0} minW={0}>
            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {/* ── Context & Status Alert Banner ── */}
            {existingReportForPeriod ? (
              <Alert
                status="success"
                variant="left-accent"
                borderRadius="md"
                bg={useColorModeValue('green.50', 'rgba(16, 185, 129, 0.12)')}
                borderColor="green.500"
              >
                <AlertIcon color="green.500" />
                <Box fontSize="sm" flex="1">
                  <HStack spacing={2} mb={1} wrap="wrap">
                    <Badge colorScheme="green" fontSize="xs" px={2} py={0.5} borderRadius="md">
                      ✅ Live on COO2 Dashboard
                    </Badge>
                    <Text fontWeight="800" color={useColorModeValue('green.800', 'green.200')}>
                      Editing existing {periodLabels[form.periodType]} submission for {formatPeriodDisplayName(form.periodType, form.periodKey)} ({form.periodKey})
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={useColorModeValue('gray.700', 'gray.300')}>
                    Originally submitted by <strong>{existingReportForPeriod.submittedByName || 'Manager'}</strong> on{' '}
                    {new Date(existingReportForPeriod.submittedAt).toLocaleString()}.
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    💡 <em>Tip: Modifying any target or achieved values below and clicking <strong>Update Report</strong> will instantly refresh the COO2 Executive Dashboard for this period.</em>
                  </Text>
                </Box>
              </Alert>
            ) : (
              <Alert
                status="info"
                variant="left-accent"
                borderRadius="md"
                bg={useColorModeValue('blue.50', 'rgba(37, 99, 235, 0.1)')}
                borderColor="blue.500"
              >
                <AlertIcon color="blue.500" />
                <Box fontSize="sm" flex="1">
                  <HStack spacing={2} mb={0.5} wrap="wrap">
                    <Badge colorScheme="blue" fontSize="xs" px={2} py={0.5} borderRadius="md">
                      ✨ New Submission
                    </Badge>
                    <Text fontWeight="700">
                      Creating {periodLabels[form.periodType]} Report for {formatPeriodDisplayName(form.periodType, form.periodKey)} ({form.periodKey})
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
                    Enter the targets and achievements for this period. Once submitted, results are immediately visualized on the COO2 Executive Dashboard.
                  </Text>
                </Box>
              </Alert>
            )}

            {/* ── Frequency & Period Selection with Quick Jump ── */}
            <Box>
              <Flex justify="space-between" align="center" mb={2} wrap="wrap" gap={2}>
                <Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em" color="gray.500">
                  Select Period &amp; Frequency
                </Text>
                <HStack spacing={1.5} wrap="wrap">
                  <Text fontSize="xs" color="gray.500" mr={1}>
                    Quick Jump:
                  </Text>
                  {['weekly', 'monthly', 'quarterly', 'yearly'].map((type) => {
                    const key = currentPeriod(type);
                    const isCur = form.periodType === type && form.periodKey === key;
                    return (
                      <Button
                        key={type}
                        size="xs"
                        variant={isCur ? 'solid' : 'outline'}
                        colorScheme="blue"
                        borderRadius="full"
                        onClick={() => handlePeriodChange(type, key)}
                      >
                        Current {periodLabels[type]}
                      </Button>
                    );
                  })}
                </HStack>
              </Flex>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontWeight="600" fontSize="sm">Report Frequency</FormLabel>
                  <Select
                    value={form.periodType}
                    onChange={(event) => {
                      const newType = event.target.value;
                      const newKey = currentPeriod(newType);
                      handlePeriodChange(newType, newKey);
                    }}
                  >
                    {Object.entries(periodLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {form.periodType === 'yearly' ? (
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" fontSize="sm">Reporting Year</FormLabel>
                    <Input
                      aria-label="Reporting year"
                      type="number"
                      min={1900}
                      max={9998}
                      required
                      value={form.periodKey}
                      onChange={(event) => handlePeriodChange('yearly', event.target.value)}
                    />
                  </FormControl>
                ) : form.periodType === 'quarterly' ? (
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" fontSize="sm">Year and Quarter</FormLabel>
                    <SimpleGrid columns={2} spacing={2}>
                      <Input
                        aria-label="Reporting year"
                        type="number"
                        min={1900}
                        max={9998}
                        required
                        value={form.periodKey.split('-Q')[0]}
                        onChange={(event) =>
                          handlePeriodChange(
                            'quarterly',
                            `${event.target.value}-Q${form.periodKey.split('-Q')[1] || '1'}`
                          )
                        }
                      />
                      <Select
                        aria-label="Reporting quarter"
                        value={form.periodKey.split('-Q')[1] || '1'}
                        onChange={(event) =>
                          handlePeriodChange(
                            'quarterly',
                            `${form.periodKey.split('-Q')[0]}-Q${event.target.value}`
                          )
                        }
                      >
                        {[1, 2, 3, 4].map((quarter) => (
                          <option key={quarter} value={quarter}>
                            Q{quarter}
                          </option>
                        ))}
                      </Select>
                    </SimpleGrid>
                  </FormControl>
                ) : (
                  <FormControl isRequired>
                    <FormLabel fontWeight="600" fontSize="sm">
                      {form.periodType === 'weekly'
                        ? 'Reporting Week (Monday–Sunday)'
                        : 'Reporting Month'}
                    </FormLabel>
                    <Input
                      type={form.periodType === 'weekly' ? 'week' : 'month'}
                      required
                      value={form.periodKey}
                      onChange={(event) => handlePeriodChange(form.periodType, event.target.value)}
                    />
                  </FormControl>
                )}
              </SimpleGrid>
            </Box>

            {/* Performance Summary Pill */}
            <Flex
              bg="blue.50"
              _dark={{ bg: 'blue.900' }}
              p={3}
              borderRadius="lg"
              justify="space-between"
              align="center"
              wrap="wrap"
              gap={2}
            >
              <HStack spacing={4}>
                <Box>
                  <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
                    Total Target
                  </Text>
                  <Text fontSize="md" fontWeight="bold">
                    {metricsTotals.totalTarget.toLocaleString()}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
                    Total Achieved
                  </Text>
                  <Text fontSize="md" fontWeight="bold">
                    {metricsTotals.totalActual.toLocaleString()}
                  </Text>
                </Box>
              </HStack>
              <HStack spacing={2}>
                <Text fontSize="xs" fontWeight="600">
                  Overall Achievement:
                </Text>
                <Badge
                  colorScheme={
                    Number(metricsTotals.achievement) >= 80
                      ? 'green'
                      : Number(metricsTotals.achievement) >= 50
                      ? 'yellow'
                      : 'red'
                  }
                  fontSize="sm"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                >
                  {metricsTotals.achievement}%
                </Badge>
              </HStack>
            </Flex>

            <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
              Enter targets and achieved results for the entire selected period ({periodLabels[form.periodType]} {form.periodKey}). Enter 0 for no activity. Achievement = achieved ÷ target × 100.
            </Text>

            {[...new Set(form.metrics.map((row) => row.section))].map((section) => (
              <Box key={section} borderWidth="1px" borderRadius="lg" p={4}>
                <Heading size="xs" textTransform="uppercase" letterSpacing="0.05em" mb={3} color="blue.600" _dark={{ color: 'blue.300' }}>
                  {section}
                </Heading>
                <TableContainer>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Metric</Th>
                        <Th isNumeric>Target</Th>
                        <Th isNumeric>Achieved</Th>
                        <Th isNumeric>Achievement</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {form.metrics
                        .filter((row) => row.section === section)
                        .map((row) => (
                          <Tr key={row.id}>
                            <Td fontWeight="500">{row.label}</Td>
                            {['target', 'actual'].map((field) => (
                              <Td key={field} isNumeric>
                                <Input
                                  aria-label={`${section}: ${row.label} ${
                                    field === 'actual' ? 'achieved' : 'target'
                                  }`}
                                  type="number"
                                  min={0}
                                  max={Number.MAX_SAFE_INTEGER}
                                  step={1}
                                  required
                                  width="110px"
                                  textAlign="right"
                                  value={row[field] ?? ''}
                                  onChange={(event) => updateMetric(row.id, field, event.target.value)}
                                />
                              </Td>
                            ))}
                            <Td isNumeric fontWeight="600">
                              {row.target > 0 && row.actual !== null ? (
                                <Badge
                                  colorScheme={
                                    row.actual / row.target >= 0.8
                                      ? 'green'
                                      : row.actual / row.target >= 0.5
                                      ? 'yellow'
                                      : 'red'
                                  }
                                >
                                  {((row.actual / row.target) * 100).toFixed(1)}%
                                </Badge>
                              ) : row.target === 0 && row.actual === 0 ? (
                                <Badge colorScheme="gray">0%</Badge>
                              ) : (
                                <Badge colorScheme="gray">N/A</Badge>
                              )}
                            </Td>
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            ))}

            <Box borderWidth="1px" borderRadius="lg" p={4}>
              <Heading size="xs" textTransform="uppercase" letterSpacing="0.05em" mb={3} color="purple.600" _dark={{ color: 'purple.300' }}>
                SEO &amp; Search Rankings
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="xs">SEO Target</FormLabel>
                  <Input
                    maxLength={5000}
                    placeholder="e.g. First page of Google for coffee export"
                    value={form.seoTarget}
                    onChange={(event) => change('seoTarget', event.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">SEO Achieved / Search Term</FormLabel>
                  <Input
                    maxLength={5000}
                    placeholder="e.g. Rank 5 for Coffee Cupping Training in Addis Ababa"
                    value={form.seoActual}
                    onChange={(event) => change('seoActual', event.target.value)}
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            {/* Evidence & Screenshots (Up to 3 Photos) */}
            <Box borderWidth="1px" borderRadius="lg" p={4}>
              <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
                <HStack spacing={2}>
                  <Icon as={FiCamera} color="teal.500" boxSize={4} />
                  <Heading size="xs" textTransform="uppercase" letterSpacing="0.05em" color="teal.600" _dark={{ color: 'teal.300' }}>
                    Evidence &amp; Screenshots (Up to 3 Photos)
                  </Heading>
                </HStack>
                <Badge colorScheme="teal" borderRadius="full" px={2} py={0.5} fontSize="xs">
                  {(form.evidencePhotos || []).filter(Boolean).length} / 3 Photos Attached
                </Badge>
              </Flex>
              <Text fontSize="xs" color="gray.500" mb={4}>
                Attach up to 3 screenshots or proof photos (e.g. analytics dashboards, post performance, follower reach proofs) for executive verification. Maximum 5MB per photo.
              </Text>

              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
                {[0, 1, 2].map((index) => {
                  const photo = form.evidencePhotos?.[index];
                  return (
                    <Box
                      key={index}
                      borderWidth="2px"
                      borderStyle={photo ? 'solid' : 'dashed'}
                      borderColor={photo ? 'teal.300' : 'gray.200'}
                      borderRadius="lg"
                      p={3}
                      position="relative"
                      bg={photo ? 'teal.50' : 'gray.50'}
                      _dark={{
                        borderColor: photo ? 'teal.500' : 'whiteAlpha.300',
                        bg: photo ? 'rgba(20, 184, 166, 0.1)' : 'whiteAlpha.50',
                      }}
                      textAlign="center"
                    >
                      {photo ? (
                        <VStack spacing={2} align="center">
                          <Box
                            position="relative"
                            w="100%"
                            h="140px"
                            borderRadius="md"
                            overflow="hidden"
                            cursor="pointer"
                            bg="blackAlpha.800"
                            onClick={() => {
                              setPreviewImage({ src: photo, title: `Evidence Photo ${index + 1}` });
                              onImageOpen();
                            }}
                          >
                            <Image
                              src={photo}
                              alt={`Evidence ${index + 1}`}
                              w="100%"
                              h="100%"
                              objectFit="cover"
                              transition="transform 0.2s"
                              _hover={{ transform: 'scale(1.05)' }}
                            />
                            <Flex
                              position="absolute"
                              top={0}
                              left={0}
                              right={0}
                              bottom={0}
                              bg="blackAlpha.400"
                              opacity={0}
                              _hover={{ opacity: 1 }}
                              justify="center"
                              align="center"
                              transition="opacity 0.2s"
                            >
                              <Icon as={FiEye} color="white" boxSize={6} />
                            </Flex>
                          </Box>

                          <HStack spacing={2} w="100%" justify="space-between">
                            <Button
                              size="xs"
                              leftIcon={<Icon as={FiEye} />}
                              variant="outline"
                              colorScheme="teal"
                              onClick={() => {
                                setPreviewImage({ src: photo, title: `Evidence Photo ${index + 1}` });
                                onImageOpen();
                              }}
                            >
                              View
                            </Button>

                            <Button
                              size="xs"
                              leftIcon={<Icon as={FiTrash2} />}
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => removePhoto(index)}
                            >
                              Remove
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <VStack spacing={2} py={4}>
                          <Icon as={FiUploadCloud} boxSize={8} color="gray.400" />
                          <Text fontSize="xs" fontWeight="600" color="gray.600" _dark={{ color: 'gray.300' }}>
                            Photo {index + 1}
                          </Text>
                          <Text fontSize="10px" color="gray.400">
                            PNG, JPG, WebP up to 5MB
                          </Text>
                          <Button
                            as="label"
                            htmlFor={`photo-upload-${index}`}
                            size="xs"
                            colorScheme="teal"
                            variant="outline"
                            cursor="pointer"
                            leftIcon={<Icon as={FiCamera} />}
                          >
                            Upload Photo
                          </Button>
                          <Input
                            id={`photo-upload-${index}`}
                            type="file"
                            accept="image/*"
                            display="none"
                            onChange={(e) => handlePhotoUpload(e, index)}
                          />
                        </VStack>
                      )}
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>

            <FormControl>
              <FormLabel fontWeight="600">Accomplishments, Concerns &amp; Summary Notes</FormLabel>
              <Textarea
                maxLength={5000}
                rows={3}
                value={form.summaryNotes}
                onChange={(event) => change('summaryNotes', event.target.value)}
                placeholder="Key highlights, campaign results, roadblocks, or notes for executive COO review..."
              />
            </FormControl>

            <HStack spacing={3} wrap="wrap">
              <Button
                type="submit"
                colorScheme={existingReportForPeriod ? 'green' : 'blue'}
                size="md"
                isLoading={saving}
                loadingText="Saving Report..."
                leftIcon={<Icon as={existingReportForPeriod ? FiCheckCircle : FiArrowRight} />}
              >
                {existingReportForPeriod
                  ? `Update ${periodLabels[form.periodType]} KPI for ${formatPeriodDisplayName(form.periodType, form.periodKey)}`
                  : `Submit ${periodLabels[form.periodType]} KPI for ${formatPeriodDisplayName(form.periodType, form.periodKey)}`}
              </Button>

              <Button
                variant="outline"
                size="md"
                isDisabled={saving}
                onClick={() => handlePeriodChange(form.periodType, form.periodKey)}
              >
                Reset Changes
              </Button>
            </HStack>
          </Stack>
        </Box>
      </SurfaceCard>

      <SurfaceCard>
        <Box p={{ base: 3, md: 6 }}>
          <Heading size="sm" mb={4}>
            Submission History
          </Heading>
          {!reports.length ? (
            <Text color="gray.500">No KPI reports submitted yet.</Text>
          ) : (
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Reporting Period</Th>
                    <Th>Date Range</Th>
                    <Th isNumeric>Achievement</Th>
                    <Th>Evidence</Th>
                    <Th>Submitted By</Th>
                    <Th>Submitted At</Th>
                    <Th>Status</Th>
                    <Th textAlign="right">Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {reports.map((report) => {
                    let totalTarget = 0;
                    let totalActual = 0;
                    (report.metrics || []).forEach((m) => {
                      totalTarget += Number(m.target) || 0;
                      totalActual += Number(m.actual) || 0;
                    });
                    const achievement =
                      totalTarget > 0
                        ? ((totalActual / totalTarget) * 100).toFixed(1)
                        : totalActual > 0
                        ? '100'
                        : '0';

                    const photos = (report.evidencePhotos || []).filter(Boolean);

                    return (
                      <Tr key={report._id}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="700">
                              {periodLabels[report.periodType] || 'Custom'} ({report.periodKey || ''})
                            </Text>
                            <Text fontSize="10px" color="gray.500">
                              {formatPeriodDisplayName(report.periodType, report.periodKey)}
                            </Text>
                          </VStack>
                        </Td>
                        <Td fontSize="xs" color="gray.500">
                          {report.startDate} – {report.endDate}
                        </Td>
                        <Td isNumeric>
                          <Badge
                            colorScheme={
                              Number(achievement) >= 80
                                ? 'green'
                                : Number(achievement) >= 50
                                ? 'yellow'
                                : 'red'
                            }
                            fontSize="xs"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                          >
                            {achievement}%
                          </Badge>
                        </Td>
                        <Td>
                          {photos.length > 0 ? (
                            <HStack spacing={1}>
                              {photos.map((photo, pIdx) => (
                                <Box
                                  key={pIdx}
                                  w="28px"
                                  h="28px"
                                  borderRadius="md"
                                  overflow="hidden"
                                  borderWidth="1px"
                                  borderColor="teal.300"
                                  cursor="pointer"
                                  onClick={() => {
                                    setPreviewImage({
                                      src: photo,
                                      title: `Evidence ${pIdx + 1} - ${periodLabels[report.periodType]} (${report.periodKey})`,
                                    });
                                    onImageOpen();
                                  }}
                                >
                                  <Image src={photo} alt="proof" w="100%" h="100%" objectFit="cover" />
                                </Box>
                              ))}
                              <Badge colorScheme="teal" fontSize="9px" px={1} borderRadius="sm">
                                {photos.length} Photo{photos.length > 1 ? 's' : ''}
                              </Badge>
                            </HStack>
                          ) : (
                            <Text fontSize="xs" color="gray.400">
                              None
                            </Text>
                          )}
                        </Td>
                        <Td fontSize="xs" fontWeight="500">
                          {report.submittedByName || '—'}
                        </Td>
                        <Td fontSize="xs" color="gray.500">
                          {new Date(report.submittedAt).toLocaleString()}
                        </Td>
                        <Td>
                          <Badge colorScheme="green" variant="subtle" fontSize="10px">
                            Live
                          </Badge>
                        </Td>
                        <Td textAlign="right">
                          <Button
                            size="xs"
                            colorScheme="blue"
                            variant="outline"
                            leftIcon={<Icon as={FiEdit3} boxSize={3} />}
                            isDisabled={saving}
                            onClick={() => {
                              setForm({ ...blankReport(), ...report });
                              setError('');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            Edit
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </SurfaceCard>

      {/* Full-Screen Evidence Photo Lightbox Modal */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="3xl" isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" color="white" overflow="hidden" borderRadius="xl">
          <ModalHeader fontSize="md" borderBottomWidth="1px" borderColor="whiteAlpha.200" py={3}>
            <HStack spacing={2}>
              <Icon as={FiCamera} color="teal.400" />
              <Text>{previewImage?.title || 'Evidence Photo Preview'}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={4} display="flex" justifyContent="center" alignItems="center">
            {previewImage?.src && (
              <Image
                src={previewImage.src}
                alt="Evidence preview"
                maxH="75vh"
                maxW="100%"
                objectFit="contain"
                borderRadius="md"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Stack>
  );
}

