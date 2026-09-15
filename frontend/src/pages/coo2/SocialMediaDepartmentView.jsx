import { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FiRefreshCw,
  FiShare2,
  FiEye,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiCamera,
  FiMaximize2,
} from 'react-icons/fi';
import axiosInstance from '../../services/axiosInstance';
import DepartmentKpiGraphics from './DepartmentKpiGraphics';

const STATUS_COLORS = {
  'Target met': 'green',
  'On Track': 'green',
  'Below target': 'orange',
  'At Risk': 'yellow',
  'Behind': 'red',
  'Not reported': 'gray',
  'No measurable target': 'blue',
};

export default function SocialMediaDepartmentView({
  periodType = 'weekly',
  periodKey = '',
  periodDisplayLabel = '',
  statusFilter = 'All',
  searchQuery = '',
}) {
  const [request, setRequest] = useState({ loading: true, data: null, error: '' });
  const [refresh, setRefresh] = useState(0);
  const [activeEvidenceImg, setActiveEvidenceImg] = useState(null);
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();

  useEffect(() => {
    let active = true;
    setRequest({ loading: true, data: null, error: '' });

    axiosInstance
      .get('/social-kpi-reports', {
        params: { periodType, periodKey },
      })
      .then(({ data }) => {
        if (!active) return;
        setRequest({ loading: false, data, error: '' });
      })
      .catch((error) => {
        if (!active) return;
        setRequest({
          loading: false,
          data: null,
          error: error.response?.data?.message || 'Unable to load Social Media KPI report.',
        });
      });

    return () => {
      active = false;
    };
  }, [periodType, periodKey, refresh]);

  useEffect(() => {
    const update = () => {
      if (document.visibilityState === 'visible') setRefresh((value) => value + 1);
    };
    const timer = window.setInterval(update, 30000);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);

  const report = request.data?.report || request.data?.currentReport;
  const metrics = report?.metrics || [];

  // Categorize metrics by section
  const sections = useMemo(() => {
    const map = {};
    metrics.forEach((m) => {
      const sec = m.section || 'General';
      if (!map[sec]) map[sec] = [];
      map[sec].push(m);
    });
    return map;
  }, [metrics]);

  // Overall calculations
  const summaryTotals = useMemo(() => {
    let totalTarget = 0;
    let totalActual = 0;
    let metCount = 0;
    let scoredCount = 0;

    metrics.forEach((m) => {
      if (m.target !== null && m.actual !== null) {
        totalTarget += Number(m.target) || 0;
        totalActual += Number(m.actual) || 0;
        scoredCount += 1;
        if (Number(m.actual) >= Number(m.target) && Number(m.target) > 0) {
          metCount += 1;
        }
      }
    });

    const overallRate = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : (totalActual > 0 ? '100' : '0');
    return { totalTarget, totalActual, overallRate, metCount, scoredCount, totalMetrics: metrics.length };
  }, [metrics]);

  // Quick stat helpers
  const findMetric = (id) => metrics.find((m) => m.id === id) || { target: 0, actual: 0 };
  const totalPosts = findMetric('totalPosts');
  const totalFollowers = findMetric('totalFollowers');
  const views = findMetric('views');
  const leads = findMetric('leads');
  const campaigns = findMetric('campaigns');

  const filterRows = (rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.filter((row) => {
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const label = String(row.label || row.name || '').toLowerCase();
        const sec = String(row.section || '').toLowerCase();
        if (!label.includes(q) && !sec.includes(q)) return false;
      }
      return true;
    });
  };

  // Convert to format for DepartmentKpiGraphics
  const departmentKpiRows = useMemo(() => {
    return metrics.map((m) => {
      const target = Number(m.target) || 0;
      const actual = Number(m.actual) || 0;
      const achievement = target > 0 ? (actual / target) * 100 : (actual > 0 ? 100 : 0);
      const status = (target === 0 && actual === 0) ? 'Not reported' : actual >= target ? 'Target met' : 'Below target';
      return {
        id: m.id,
        name: `${m.section ? m.section + ': ' : ''}${m.label}`,
        target,
        actual,
        achievement,
        status,
        unit: 'count',
      };
    });
  }, [metrics]);

  return (
    <Box maxW="1400px" mx="auto">
      {/* Header Banner */}
      <Box
        bg="linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
        color="white"
        p={{ base: 5, md: 6 }}
        borderRadius="xl"
        mb={6}
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <HStack spacing={3} mb={1}>
              <Heading as="h1" fontSize={{ base: '22px', md: '28px' }} fontWeight="800">
                Social Media &amp; Marketing KPIs
              </Heading>
              <Badge
                colorScheme={report ? 'green' : 'yellow'}
                px={2.5}
                py={0.5}
                borderRadius="full"
                fontSize="12px"
              >
                {report ? 'Report Submitted' : 'Pending Submission'}
              </Badge>
            </HStack>
            <Text fontSize="14px" color="gray.300">
              {periodDisplayLabel || periodKey} · Operational Reach, Content Publication &amp; Platform Metrics
            </Text>
          </Box>
          <Button
            size="sm"
            leftIcon={<FiRefreshCw />}
            onClick={() => setRefresh((v) => v + 1)}
            isLoading={request.loading}
            bg="whiteAlpha.200"
            _hover={{ bg: 'whiteAlpha.300' }}
            color="white"
          >
            Refresh Telemetry
          </Button>
        </Flex>
      </Box>

      {request.loading ? (
        <HStack py={12} justify="center">
          <Spinner size="lg" color="blue.500" />
          <Text ml={3} fontWeight="600" color="gray.600">
            Loading Social Media KPI report...
          </Text>
        </HStack>
      ) : request.error ? (
        <Alert status="error" borderRadius="lg" mb={6}>
          <AlertIcon />
          {request.error}
        </Alert>
      ) : !report ? (
        <Box bg="white" p={8} borderRadius="xl" borderWidth="1px" borderColor="gray.200" textAlign="center">
          <Icon as={FiAlertCircle} boxSize={10} color="orange.400" mb={3} />
          <Heading size="md" mb={2}>
            No Social Media KPI report for this period
          </Heading>
          <Text color="gray.600" maxW="600px" mx="auto" mb={4}>
            No submission has been recorded for {periodDisplayLabel || periodKey} ({periodType}). When the Social Media team submits their {periodType} KPI report, it will display here automatically.
          </Text>
          <Text fontSize="xs" color="gray.400">
            Checking for real-time submissions every 30 seconds...
          </Text>
        </Box>
      ) : (
        <Box display="grid" gap={6}>
          {/* Submission Info Bar */}
          <Flex
            bg="white"
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
            justify="space-between"
            align="center"
            wrap="wrap"
            gap={3}
          >
            <HStack spacing={3}>
              <Badge colorScheme="green" px={3} py={1} borderRadius="full" fontSize="12px">
                ✓ Verified Submission
              </Badge>
              <Text fontSize="sm" fontWeight="600">
                Period: {report.startDate} – {report.endDate}
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              Submitted by <strong>{report.submittedByName || 'Social Media Lead'}</strong> on{' '}
              {new Date(report.submittedAt).toLocaleString()}
            </Text>
          </Flex>

          {/* Quick Stat Cards */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={4}>
            <Box bg="white" p={4} borderRadius="xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
              <Stat>
                <StatLabel fontSize="xs" fontWeight="700" color="gray.500">
                  Total Posts
                </StatLabel>
                <StatNumber fontSize="2xl" fontWeight="800" color="#2563eb">
                  {totalPosts.actual?.toLocaleString() || 0}
                </StatNumber>
                <StatHelpText fontSize="xs" color="gray.600">
                  Target: {totalPosts.target?.toLocaleString() || 0} (
                  {totalPosts.target > 0
                    ? `${((totalPosts.actual / totalPosts.target) * 100).toFixed(0)}%`
                    : 'N/A'}
                  )
                </StatHelpText>
              </Stat>
            </Box>

            <Box bg="white" p={4} borderRadius="xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
              <Stat>
                <StatLabel fontSize="xs" fontWeight="700" color="gray.500">
                  Followers Growth
                </StatLabel>
                <StatNumber fontSize="2xl" fontWeight="800" color="#16a34a">
                  {totalFollowers.actual?.toLocaleString() || 0}
                </StatNumber>
                <StatHelpText fontSize="xs" color="gray.600">
                  Target: {totalFollowers.target?.toLocaleString() || 0} (
                  {totalFollowers.target > 0
                    ? `${((totalFollowers.actual / totalFollowers.target) * 100).toFixed(0)}%`
                    : 'N/A'}
                  )
                </StatHelpText>
              </Stat>
            </Box>

            <Box bg="white" p={4} borderRadius="xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
              <Stat>
                <StatLabel fontSize="xs" fontWeight="700" color="gray.500">
                  Total Views
                </StatLabel>
                <StatNumber fontSize="2xl" fontWeight="800" color="#7c3aed">
                  {views.actual?.toLocaleString() || 0}
                </StatNumber>
                <StatHelpText fontSize="xs" color="gray.600">
                  Target: {views.target?.toLocaleString() || 0}
                </StatHelpText>
              </Stat>
            </Box>

            <Box bg="white" p={4} borderRadius="xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
              <Stat>
                <StatLabel fontSize="xs" fontWeight="700" color="gray.500">
                  Leads Generated
                </StatLabel>
                <StatNumber fontSize="2xl" fontWeight="800" color="#ea580c">
                  {leads.actual?.toLocaleString() || 0}
                </StatNumber>
                <StatHelpText fontSize="xs" color="gray.600">
                  Target: {leads.target?.toLocaleString() || 0} (
                  {leads.target > 0
                    ? `${((leads.actual / leads.target) * 100).toFixed(0)}%`
                    : 'N/A'}
                  )
                </StatHelpText>
              </Stat>
            </Box>

            <Box bg="white" p={4} borderRadius="xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
              <Stat>
                <StatLabel fontSize="xs" fontWeight="700" color="gray.500">
                  Overall Achievement
                </StatLabel>
                <StatNumber
                  fontSize="2xl"
                  fontWeight="800"
                  color={
                    Number(summaryTotals.overallRate) >= 80
                      ? '#16a34a'
                      : Number(summaryTotals.overallRate) >= 50
                      ? '#d97706'
                      : '#dc2626'
                  }
                >
                  {summaryTotals.overallRate}%
                </StatNumber>
                <StatHelpText fontSize="xs" color="gray.600">
                  {summaryTotals.metCount} of {summaryTotals.scoredCount} targets met
                </StatHelpText>
              </Stat>
            </Box>
          </SimpleGrid>

          {/* Department Analytics Visual Graphics */}
          <DepartmentKpiGraphics rows={departmentKpiRows} department="Social Media" />

          {/* Detailed Metric Tables */}
          {Object.entries(sections).map(([sectionTitle, sectionRows]) => {
            const rows = filterRows(sectionRows);
            return (
              <Box
                key={sectionTitle}
                bg="white"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="gray.200"
                overflow="hidden"
                boxShadow="sm"
              >
                <Box
                  bg="#213f70"
                  color="white"
                  px={6}
                  py={3}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Heading as="h2" fontSize="16px" fontWeight="700">
                    {sectionTitle}
                  </Heading>
                  <Badge bg="whiteAlpha.300" color="white" px={2.5} py={0.5} borderRadius="full" fontSize="11px">
                    {rows.length} metrics
                  </Badge>
                </Box>
                <TableContainer>
                  <Table size="sm" variant="simple">
                    <Thead bg="#f8fafc">
                      <Tr>
                        <Th fontSize="12px">Metric</Th>
                        <Th isNumeric fontSize="12px">
                          Target
                        </Th>
                        <Th isNumeric fontSize="12px">
                          Achieved
                        </Th>
                        <Th isNumeric fontSize="12px">
                          Achievement %
                        </Th>
                        <Th textAlign="center" fontSize="12px">
                          Status
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {rows.map((row, index) => {
                        const target = Number(row.target) || 0;
                        const actual = Number(row.actual) || 0;
                        const achievement =
                          target > 0
                            ? ((actual / target) * 100).toFixed(1)
                            : actual > 0
                            ? '100'
                            : '0';
                        const status =
                          target === 0 && actual === 0
                            ? 'Not reported'
                            : actual >= target
                            ? 'Target met'
                            : 'Below target';
                        const statusColor = STATUS_COLORS[status] || 'gray';

                        return (
                          <Tr key={row.id || index} _hover={{ bg: '#f1f5f9' }}>
                            <Td fontWeight="600" fontSize="13px" py={3}>
                              {row.label}
                            </Td>
                            <Td isNumeric fontSize="13px">
                              {row.target !== null ? target.toLocaleString() : '—'}
                            </Td>
                            <Td isNumeric fontSize="13px" fontWeight="700">
                              {row.actual !== null ? actual.toLocaleString() : '—'}
                            </Td>
                            <Td isNumeric fontSize="13px" fontWeight="700">
                              {target > 0 ? (
                                <Badge
                                  colorScheme={
                                    Number(achievement) >= 80
                                      ? 'green'
                                      : Number(achievement) >= 50
                                      ? 'yellow'
                                      : 'red'
                                  }
                                >
                                  {achievement}%
                                </Badge>
                              ) : (
                                <Badge colorScheme="gray">N/A</Badge>
                              )}
                            </Td>
                            <Td textAlign="center">
                              <Badge colorScheme={statusColor}>{status}</Badge>
                            </Td>
                          </Tr>
                        );
                      })}
                      {!rows.length && (
                        <Tr>
                          <Td colSpan={5} textAlign="center" py={6} color="gray.500">
                            No metrics match your search.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}

          {/* SEO & Search Rankings Card */}
          {(report.seoTarget || report.seoActual) && (
            <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
              <Heading size="xs" textTransform="uppercase" letterSpacing="0.05em" color="purple.600" mb={3}>
                SEO Rankings &amp; Search Visibility
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box bg="purple.50" p={3} borderRadius="lg">
                  <Text fontSize="xs" fontWeight="700" color="purple.700" mb={1}>
                    SEO Target:
                  </Text>
                  <Text fontSize="sm" color="gray.800">
                    {report.seoTarget || 'None specified'}
                  </Text>
                </Box>
                <Box bg="purple.50" p={3} borderRadius="lg">
                  <Text fontSize="xs" fontWeight="700" color="purple.700" mb={1}>
                    SEO Achieved / Search Term:
                  </Text>
                  <Text fontSize="sm" color="gray.800">
                    {report.seoActual || 'None specified'}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>
          )}

          {/* Accomplishments & Concerns Card */}
          {report.summaryNotes && (
            <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
              <Heading size="xs" textTransform="uppercase" letterSpacing="0.05em" color="blue.600" mb={2}>
                Accomplishments, Concerns &amp; Summary Notes
              </Heading>
              <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" lineHeight="1.6">
                {report.summaryNotes}
              </Text>
            </Box>
          )}

          {/* Evidence Photos & Proof Screenshots */}
          {Array.isArray(report.evidencePhotos) && report.evidencePhotos.filter(Boolean).length > 0 && (
            <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
              <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
                <HStack spacing={2}>
                  <Icon as={FiCamera} color="teal.500" boxSize={4} />
                  <Heading size="xs" textTransform="uppercase" letterSpacing="0.05em" color="teal.600">
                    Attached Evidence &amp; Proof Screenshots
                  </Heading>
                </HStack>
                <Badge colorScheme="teal" borderRadius="full" px={2} py={0.5} fontSize="xs">
                  {report.evidencePhotos.filter(Boolean).length} Photo{report.evidencePhotos.filter(Boolean).length > 1 ? 's' : ''}
                </Badge>
              </Flex>

              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                {report.evidencePhotos.filter(Boolean).map((photo, idx) => (
                  <Box
                    key={idx}
                    borderWidth="1px"
                    borderColor="teal.200"
                    borderRadius="lg"
                    overflow="hidden"
                    bg="gray.50"
                    position="relative"
                    cursor="pointer"
                    onClick={() => {
                      setActiveEvidenceImg({
                        src: photo,
                        title: `Evidence Proof ${idx + 1} (${periodDisplayLabel || report.periodKey})`,
                      });
                      onImageOpen();
                    }}
                  >
                    <Box h="180px" w="100%" overflow="hidden" position="relative" bg="blackAlpha.900">
                      <Image
                        src={photo}
                        alt={`Evidence ${idx + 1}`}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        transition="transform 0.25s ease"
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
                        <HStack spacing={1} bg="blackAlpha.700" color="white" px={3} py={1} borderRadius="full">
                          <Icon as={FiEye} />
                          <Text fontSize="xs" fontWeight="600">Click to View Full Image</Text>
                        </HStack>
                      </Flex>
                    </Box>
                    <Flex p={2} justify="space-between" align="center" bg="teal.50">
                      <Text fontSize="xs" fontWeight="600" color="teal.800">
                        Evidence Photo #{idx + 1}
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="teal"
                        leftIcon={<Icon as={FiMaximize2} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEvidenceImg({
                            src: photo,
                            title: `Evidence Proof ${idx + 1} (${periodDisplayLabel || report.periodKey})`,
                          });
                          onImageOpen();
                        }}
                      >
                        Enlarge
                      </Button>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </Box>
      )}

      {/* Full-Screen Evidence Photo Lightbox Modal */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="4xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(6px)" />
        <ModalContent bg="gray.900" color="white" overflow="hidden" borderRadius="xl">
          <ModalHeader fontSize="md" borderBottomWidth="1px" borderColor="whiteAlpha.200" py={3}>
            <HStack spacing={2}>
              <Icon as={FiCamera} color="teal.400" />
              <Text>{activeEvidenceImg?.title || 'Evidence Screenshot'}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={4} display="flex" justifyContent="center" alignItems="center">
            {activeEvidenceImg?.src && (
              <Image
                src={activeEvidenceImg.src}
                alt="Evidence preview"
                maxH="80vh"
                maxW="100%"
                objectFit="contain"
                borderRadius="md"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
