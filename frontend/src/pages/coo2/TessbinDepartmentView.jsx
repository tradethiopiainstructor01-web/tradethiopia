import { useEffect, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, Flex, Heading, HStack, Spinner, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import axiosInstance from '../../services/axiosInstance';
import DepartmentKpiGraphics from './DepartmentKpiGraphics';

export default function TessbinDepartmentView({ periodType, periodKey, periodDisplayLabel, searchQuery = '' }) {
  const [request, setRequest] = useState({ loading: true, data: null, error: '' });
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setRequest({ loading: true, data: null, error: '' });
    axiosInstance.get('/coo-dashboard/tessbin-kpi-report', { signal: controller.signal, params: { periodType, periodKey } })
      .then(({ data }) => { if (!controller.signal.aborted) setRequest({ loading: false, data, error: '' }); })
      .catch((error) => { if (!controller.signal.aborted) setRequest({ loading: false, data: null, error: error.response?.data?.message || 'Unable to load Tessbin submissions.' }); });
    return () => controller.abort();
  }, [periodType, periodKey, refresh]);
  useEffect(() => {
    const update = () => { if (document.visibilityState === 'visible') setRefresh((value) => value + 1); };
    const timer = window.setInterval(update, 30000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  const report = request.data?.report;
  const rows = (request.data?.metrics || []).filter((row) => row.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  const format = (value) => value === null ? 'Not reported' : Number(value).toLocaleString();

  return <Box>
    <Flex justify="space-between" align="center" gap={4} flexWrap="wrap" mb={5}>
      <Box><Heading size="lg">Tessbin KPI submissions</Heading><Text mt={2}>{periodDisplayLabel || periodKey} · Submitted targets and actual results</Text></Box>
      <Button onClick={() => setRefresh((value) => value + 1)} isLoading={request.loading}>Refresh</Button>
    </Flex>
    {request.loading ? <HStack py={8}><Spinner /><Text>Loading Tessbin report…</Text></HStack>
      : request.error ? <Alert status="error"><AlertIcon />{request.error}</Alert>
        : !report ? <Alert status="info"><AlertIcon />No submitted Tessbin report for this period. Select the matching week, month, or quarter. Saved drafts appear after Tessbin submits them.</Alert>
          : <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.200">
            <Flex gap={3} align="center" flexWrap="wrap" mb={4}>
              <Badge colorScheme="green">Submitted</Badge>
              <Text fontWeight="semibold">{report.periodStart} – {report.periodEnd}</Text>
              <Text fontSize="sm" color="gray.600">Submitted {new Date(report.submittedAt).toLocaleString()}</Text>
            </Flex>
            <DepartmentKpiGraphics rows={rows} department="Tessbin" />
            <TableContainer>
              <Table size="sm" aria-label="Submitted Tessbin KPI results">
                <Thead><Tr><Th>KPI</Th><Th>Unit</Th><Th isNumeric>Target</Th><Th isNumeric>Actual</Th><Th isNumeric>Achievement</Th><Th>Status</Th></Tr></Thead>
                <Tbody>{rows.map((row) => <Tr key={row.id}>
                  <Td py={4}>{row.name}</Td><Td>{row.unit}</Td><Td isNumeric>{format(row.target)}</Td><Td isNumeric>{format(row.actual)}</Td>
                  <Td isNumeric>{row.achievement === null ? 'Not scored' : `${row.achievement.toFixed(1)}%`}</Td>
                  <Td><Badge colorScheme={row.status === 'Target met' ? 'green' : row.status === 'Below target' ? 'orange' : 'gray'}>{row.status}</Badge></Td>
                </Tr>)}{!rows.length && <Tr><Td colSpan={6}>No KPIs match your search.</Td></Tr>}</Tbody>
              </Table>
            </TableContainer>
            {report.notes && <Box mt={5}><Text fontWeight="semibold">Achievements, challenges & next steps</Text><Text whiteSpace="pre-wrap" mt={2}>{report.notes}</Text></Box>}
            <Text fontSize="xs" color="gray.500" mt={4}>Checks for new submissions every 30 seconds while this page is visible.</Text>
          </Box>}
  </Box>;
}
