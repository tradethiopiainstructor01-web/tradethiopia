import React, { useEffect, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, Flex, Heading, Input, Spinner, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { getCustomerDepartmentKpi, submitCustomerDepartmentKpi } from '../../services/customerDepartmentKpiService';
import TessbinReportingPeriodPicker from '../tessbin/TessbinReportingPeriodPicker';

export function customerPeriodKey(type, date) {
  if (type === 'monthly') return date.slice(0, 7);
  if (type === 'quarterly') return `${date.slice(0, 4)}-Q${Math.ceil(Number(date.slice(5, 7)) / 3)}`;
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const year = day.getUTCFullYear();
  const week = Math.ceil(((day - new Date(Date.UTC(year, 0, 1))) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export default function CustomerDepartmentKpiReport({ readOnly = false, periodType: suppliedType, periodKey: suppliedKey, periodDisplayLabel }) {
  const [type, setType] = useState('monthly');
  const [date, setDate] = useState(() => new Date(Date.now() + 10800000).toISOString().slice(0, 10));
  const periodType = suppliedType || type;
  const periodKey = suppliedKey || customerPeriodKey(periodType, date);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [dirty, setDirty] = useState(false);
  const toast = useToast();
  useEffect(() => {
    let active = true;
    setLoading(true); setReport(null); setError(''); setDirty(false);
    getCustomerDepartmentKpi(periodType, periodKey).then((data) => { if (active) setReport(data); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load KPI report.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [periodType, periodKey, refresh]);
  const edit = (key, field, value) => {
    setDirty(true);
    setReport((old) => ({ ...old, metrics: old.metrics.map((row) => row.key === key ? { ...row, [field]: value === '' ? null : Number(value) } : row) }));
  };
  const valid = report?.metrics.every((row) => ['target', 'actual'].every((field) => Number.isSafeInteger(row[field]) && row[field] >= 0));
  const submit = async () => {
    setSaving(true);
    try {
      setReport(await submitCustomerDepartmentKpi({ periodType, periodKey, metrics: report.metrics })); setDirty(false);
      toast({ title: 'Submitted to COO2', description: `Customer service KPIs for ${periodKey} are available in COO2.`, status: 'success', duration: 5000, isClosable: true });
    } catch (err) { toast({ title: 'Submission failed', description: err.response?.data?.message || err.message, status: 'error', duration: 5000, isClosable: true }); }
    finally { setSaving(false); }
  };
  return <Box bg={readOnly ? undefined : 'white'} borderWidth={readOnly ? 0 : '1px'} borderRadius={readOnly ? 0 : 'xl'} p={readOnly ? 0 : { base: 3, md: 6 }} maxW={readOnly ? '1400px' : undefined} mx={readOnly ? 'auto' : undefined} mb={6}>
    {readOnly ? <Box bg="#213f70" color="white" px={{ base: 5, md: 7 }} py={4} mb={7}>
      <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} wrap="wrap" gap={3}>
        <Box><Heading as="h1" fontSize={{ base: '27px', md: '36px' }} lineHeight="1.2">Customer Success</Heading>
          <Text mt={2} fontSize={{ base: '15px', md: '18px' }} fontStyle="italic">B2B and Training KPIs</Text></Box>
        <Flex align="center" wrap="wrap" gap={3}>
          <Button size="sm" variant="outline" bg="whiteAlpha.200" _hover={{ bg: 'whiteAlpha.300' }} color="white" borderColor="whiteAlpha.400" onClick={() => setRefresh((value) => value + 1)} isLoading={loading}>Refresh</Button>
          <Badge bg="whiteAlpha.300" color="white" px={3} py={1} borderRadius="full" fontSize="12.5px">Period: {periodDisplayLabel || periodKey}</Badge>
        </Flex>
      </Flex>
    </Box> : <Flex justify="space-between" align="center" gap={3} mb={4} wrap="wrap">
      <Box><Heading size="md">Customer Service KPI Report</Heading><Text color="gray.600">B2B and Training · {periodKey}</Text></Box>
      <Button size="sm" onClick={() => setRefresh((value) => value + 1)} isDisabled={loading || saving || dirty}>Refresh</Button>
    </Flex>}
    {!readOnly && <><Text mb={4}>Enter achieved results and submit the full report to COO2. Targets are prefilled from the KPI sheet and can be adjusted for the selected period.</Text>
      <TessbinReportingPeriodPicker timeframe={type} date={date} disabled={saving || dirty} onChange={(nextType, nextDate) => { setType(nextType); setDate(nextDate); }} />
      {dirty && <Flex mt={3} gap={3} align="center"><Text fontSize="sm">Submit or discard changes before changing periods.</Text><Button size="xs" isDisabled={saving} onClick={() => setRefresh((value) => value + 1)}>Discard changes</Button></Flex>}
    </>}
    {loading ? <Spinner mt={5} /> : error ? <Alert status="error" mt={4}><AlertIcon />{error}</Alert> : report && <>
      <Text my={4} fontSize="sm">{report.submittedAt ? `Last submitted: ${new Date(report.submittedAt).toLocaleString()} ${report.submittedByName || ''}` : 'No report submitted for this period.'}</Text>
      {['B2B', 'Training'].map((section) => <Box key={section} mb={readOnly ? 7 : 5} border={readOnly ? '1px solid #d1d5db' : undefined} bg="white" overflow="hidden">
        <Box bg={readOnly ? '#137b7e' : 'orange.100'} color={readOnly ? 'white' : undefined} px={readOnly ? 7 : 3} py={readOnly ? 2 : 3}>
          <Heading as="h2" size={readOnly ? undefined : 'sm'} fontSize={readOnly ? { base: '20px', md: '25px' } : undefined}>{readOnly ? `${section} KPIs` : `KPI ${section.toUpperCase()}`}</Heading>
        </Box>
        <TableContainer><Table size="sm" variant="simple" sx={readOnly ? {
          th: { color: 'white', textAlign: 'center', fontSize: { base: '12px', md: '15px' }, textTransform: 'none', letterSpacing: 'normal', py: 3, borderColor: '#cbd5e1' },
          td: { textAlign: 'center', fontSize: '14px', borderColor: '#d1d5db' },
          'td:first-of-type': { textAlign: 'left', fontWeight: 700, minWidth: '250px' },
        } : undefined}><Thead bg={readOnly ? '#213f70' : undefined}><Tr><Th>KPI</Th><Th isNumeric>Target</Th><Th isNumeric>{readOnly ? 'Actual' : 'Achieved'}</Th>{readOnly && <Th>Achievement %</Th>}<Th isNumeric>Gap</Th><Th>Status</Th></Tr></Thead>
          <Tbody>{report.metrics.filter((row) => row.section === section).map((row, index) => {
            const reported = row.actual !== null && row.actual !== undefined;
            const gap = reported ? Math.max(0, row.target - row.actual) : null;
            const status = !reported ? 'Not reported' : row.target === 0 ? 'No target' : gap === 0 ? 'Completed' : row.actual >= row.target * 0.8 ? 'On track' : 'Behind target';
            const statusColors = status === 'Completed' ? ['#dcfce7', '#166534'] : status === 'On track' ? ['#d9ead3', '#166534'] : status === 'Behind target' ? ['#f9cb9c', '#9a3412'] : ['#ffffff', '#475569'];
            return <Tr key={row.key} bg={readOnly ? (index % 2 ? '#f3f4f6' : '#ffffff') : undefined}><Td whiteSpace="normal" minW="190px">{row.kpi}{row.notes && <Text fontSize="xs" color="gray.500">{row.notes}</Text>}</Td>
              {['target', 'actual'].map((field) => <Td key={field} isNumeric>{readOnly ? row[field] ?? '—' : <Input aria-label={`${section} ${row.kpi} ${field === 'actual' ? 'achieved' : 'target'}`} type="number" min={0} step={1} w="95px" size="sm" value={row[field] ?? ''} isDisabled={saving} onChange={(event) => edit(row.key, field, event.target.value)} />}</Td>)}
              {readOnly && <Td>{reported && row.target > 0 ? `${Math.round(row.actual / row.target * 100)}%` : '—'}</Td>}
              <Td isNumeric>{gap ?? '—'}</Td><Td bg={readOnly ? statusColors[0] : undefined} color={readOnly ? statusColors[1] : undefined} fontWeight={readOnly ? 600 : undefined} whiteSpace="nowrap">{readOnly ? status.replace(/\b\w/g, (letter) => letter.toUpperCase()) : <Badge colorScheme={status === 'Completed' ? 'green' : status === 'On track' ? 'teal' : status === 'Behind target' ? 'orange' : 'gray'}>{status}</Badge>}</Td></Tr>;
          })}</Tbody></Table></TableContainer>
      </Box>)}
      {!readOnly && <><Text fontSize="sm" mb={3}>Gap is the remaining count to reach target. Enter 0 for no activity. Submitting again updates this period’s report.</Text><Button colorScheme="teal" onClick={submit} isLoading={saving} isDisabled={!valid}>Submit to COO2</Button>{!valid && <Text mt={2} fontSize="sm">Complete all achieved values with non-negative whole numbers to submit.</Text>}</>}
    </>}
  </Box>;
}
