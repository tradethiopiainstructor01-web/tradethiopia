import { useEffect, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, Flex, HStack, Select, SimpleGrid, Spinner, Table, Tbody, Td, Text, Th, Thead, Tr, VStack } from '@chakra-ui/react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import axiosInstance from '../../services/axiosInstance';
import DepartmentKpiGraphics from './DepartmentKpiGraphics';

const card = { bg: 'white', p: 5, borderRadius: '16px', border: '1px solid #e2e8f0' };
const percent = (value) => value === null ? 'No measurable target' : `${value.toFixed(1)}%`;

const AnalyticsView = ({ periodType, periodKey, periodDisplayLabel }) => {
  const [request, setRequest] = useState({ loading: true, data: null, error: '' });
  const [revision, setRevision] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  useEffect(() => {
    const controller = new AbortController();
    setRequest({ loading: true, data: null, error: '' });
    axiosInstance.get('/coo-dashboard/department-analytics', { signal: controller.signal, params: { periodType, periodKey } }).then(({ data }) => {
      if (!Array.isArray(data.metrics) || !Array.isArray(data.departments) || !Array.isArray(data.distribution)) throw new Error('Invalid KPI response');
      if (!controller.signal.aborted) setRequest({ loading: false, data, error: '' });
    }).catch(() => {
      if (!controller.signal.aborted) setRequest({ loading: false, data: null, error: 'Unable to load KPI data. Please retry.' });
    });
    return () => controller.abort();
  }, [periodType, periodKey, revision]);
  const allDepartments = request.data?.departments || [];
  const departments = allDepartments.filter((item) => selectedDepartment === 'all' || item.name === selectedDepartment);
  const metrics = (request.data?.metrics || []).filter((item) => selectedDepartment === 'all' || item.department === selectedDepartment);
  const distribution = (request.data?.distribution || []).map((item) => ({ ...item, value: metrics.filter((metric) => metric.status === item.name).length }));
  const scoredCount = metrics.filter((item) => item.achievement !== null).length;
  const metCount = metrics.filter((item) => item.status === 'Target met').length;
  const scoredDepartments = departments.filter((item) => item.achievement !== null);
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
        <Box>
          <Text fontSize="22px" fontWeight="800" color="#0f172a">Department KPI & Achievement Analytics</Text>
          <Text fontSize="13.5px" color="#64748b">{periodDisplayLabel || periodKey} · Recorded operational KPIs and target achievement.</Text>
        </Box>
        <HStack flexWrap="wrap">
          <Select size="sm" w="210px" bg="white" borderRadius="8px" aria-label="Filter analytics by department" value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)}>
            <option value="all">All departments</option>
            {allDepartments.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
          </Select>
          <Button size="sm" onClick={() => setRevision((value) => value + 1)} isLoading={request.loading}>Refresh</Button>
        </HStack>
      </Flex>
      {request.loading ? <HStack py={12} justify="center"><Spinner /><Text>Loading KPI data…</Text></HStack>
        : request.error ? <Alert status="error"><AlertIcon />{request.error}</Alert>
          : <>
              <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={4} mb={5}>
                {[
                  { label: 'Recorded KPIs', value: metrics.length, note: departments.filter((item) => item.count > 0).length + ' departments reporting', color: '#2563eb' },
                  { label: 'Targets met', value: metCount, note: scoredCount ? Math.round(metCount / scoredCount * 100) + '% of measurable KPIs' : 'No measurable KPIs', color: '#16a34a' },
                  { label: 'Below target', value: metrics.filter((item) => item.status === 'Below target').length, note: 'Results needing attention', color: '#d97706' },
                  { label: 'Not scored', value: metrics.length - scoredCount, note: 'Missing measurable targets or results', color: '#64748b' },
                ].map((item) => <Box {...card} key={item.label} borderTop={'3px solid ' + item.color}>
                  <Text fontSize="12px" color="#64748b">{item.label}</Text>
                  <Text fontSize="30px" fontWeight="800" color={item.color}>{item.value}</Text>
                  <Text fontSize="11px" color="#64748b">{item.note}</Text>
                </Box>)}
              </SimpleGrid>
              <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={5} mb={6}>
                <Box {...card} gridColumn={{ lg: 'span 2' }}>
                  <Text fontSize="14px" fontWeight="700">Cross-Department KPI Achievement (%)</Text>
                  <Text fontSize="12px" color="#64748b" mb={4}>Average achievement of recorded KPIs with targets. The target line represents 100% achievement.</Text>
                  {scoredDepartments.length === 0 ? <Text py={12} color="#64748b">No measurable targets are available for this period.</Text> :
                    <Box h="320px"><ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoredDepartments} margin={{ top: 15, right: 15, left: 0, bottom: 55 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, (max) => Math.max(100, max)]} tickFormatter={(value) => `${value}%`} />
                        <Tooltip formatter={(value) => [percent(value), 'Achievement']} />
                        <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="5 5" />
                        <Bar dataKey="achievement" name="Achievement" fill="#2563eb" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer></Box>}
                </Box>
                <Box {...card}>
                  <Text fontSize="14px" fontWeight="700">KPI Target Achievement</Text>
                  <Text fontSize="12px" color="#64748b">Recorded KPI results by target outcome.</Text>
                  <Box h="230px">{metrics.length === 0 ? <Text py={12} color="#64748b">No KPI records for this period.</Text> : <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distribution.filter((item) => item.value > 0)} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {distribution.filter((item) => item.value > 0).map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'KPI records']} />
                    </PieChart>
                  </ResponsiveContainer>}</Box>
                  <VStack align="stretch" spacing={3}>{distribution.map((item) => <Flex key={item.name} justify="space-between">
                    <HStack><Box w="8px" h="8px" borderRadius="full" bg={item.color} /><Text fontSize="13px">{item.name}</Text></HStack>
                    <Text fontSize="13px" fontWeight="700">{item.value}</Text>
                  </Flex>)}</VStack>
                </Box>
              </SimpleGrid>
              <VStack align="stretch" spacing={5}>
                {departments.map((department) => {
                  const rows = metrics.filter((metric) => metric.department === department.name);
                  return <Box {...card} key={department.name}>
                    <Flex justify="space-between" gap={3} mb={2} wrap="wrap">
                      <Text fontSize="18px" fontWeight="700">{department.name} KPI Analysis</Text>
                      <Badge colorScheme={department.achievement === null ? 'gray' : 'blue'}>
                        {department.achievement === null ? 'Not scored' : percent(department.achievement) + ' average achievement'}
                      </Badge>
                    </Flex>
                    <Text color="#64748b" fontSize="13px" mb={4}>{department.analysis}</Text>
                    <DepartmentKpiGraphics rows={rows} department={department.name} />
                    {rows.length > 0 && <Box overflowX="auto"><Table size="sm">
                      <Thead><Tr>{['KPI', 'Actual', 'Target', 'Achievement', 'Analysis & source'].map((label) => <Th key={label}>{label}</Th>)}</Tr></Thead>
                      <Tbody>{rows.map((metric) => <Tr key={metric.id}>
                        <Td minW="160px">{metric.name}</Td>
                        <Td whiteSpace="nowrap">{metric.actual === null ? 'Not reported' : metric.actual.toLocaleString() + ' ' + metric.unit}</Td>
                        <Td whiteSpace="nowrap">{metric.target === null ? 'Not set' : metric.target.toLocaleString() + ' ' + metric.unit}</Td>
                        <Td>{percent(metric.achievement)}</Td>
                        <Td minW="280px">
                          <Text fontWeight="600">{metric.status}</Text>
                          <Text fontSize="12px">{metric.analysis}</Text>
                          <Text fontSize="11px" color="#64748b" mt={1}>{metric.source}</Text>
                          {metric.updatedAt && <Text fontSize="11px" color="#64748b">Updated: {new Date(metric.updatedAt).toLocaleString()}</Text>}
                        </Td>
                      </Tr>)}</Tbody>
                    </Table></Box>}
                  </Box>;
                })}
              </VStack>
            </>}
    </Box>
  );
};
export default AnalyticsView;
