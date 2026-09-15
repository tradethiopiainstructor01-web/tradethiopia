import { useEffect, useState } from 'react';
import {
  Alert, AlertIcon, Badge, Box, Button, Card, CardBody, Flex, FormControl,
  FormLabel, Heading, HStack, Input, Spinner, Table, TableContainer, Tbody,
  Td, Text, Th, Thead, Tr, useColorModeValue, useToast,
} from '@chakra-ui/react';
import axiosInstance from '../../services/axiosInstance';

const PERIODS = ['weekly', 'monthly', 'quarterly'];
const today = () => new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
const displayDate = (value) => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function TessbinKpiTargetsForm({ metrics, initialDate, onDirtyChange, onSavingChange, onSaved }) {
  const [date, setDate] = useState(initialDate || today);
  const [reports, setReports] = useState(null);
  const [changed, setChanged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const toast = useToast();
  const muted = useColorModeValue('gray.600', 'gray.400');
  const border = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('purple.50', 'gray.900');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.all(PERIODS.map(async (timeframe) => {
      const { data } = await axiosInstance.get('/tessbin/kpi-reports', { params: { timeframe, date }, signal: controller.signal });
      return [timeframe, data.data.report];
    })).then((entries) => {
      if (!controller.signal.aborted) { setReports(Object.fromEntries(entries)); setChanged([]); }
    }).catch((err) => {
      if (!controller.signal.aborted) { setReports(null); setError(err.response?.data?.message || 'Unable to load targets. Please retry.'); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, reload]);

  useEffect(() => { onDirtyChange(changed.length > 0); }, [changed, onDirtyChange]);
  useEffect(() => {
    const warn = (event) => { if (changed.length) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [changed]);

  const chooseDate = (value) => {
    if (!value || value === date) return;
    if (changed.length && !window.confirm('Discard unsaved targets and open another date?')) return;
    setReports(null);
    setChanged([]);
    setDate(value);
  };
  const edit = (timeframe, key, value) => {
    setReports((previous) => ({ ...previous, [timeframe]: {
      ...previous[timeframe], metrics: previous[timeframe].metrics.map((row) => row.key === key ? { ...row, target: value === '' ? null : Number(value) } : row),
    } }));
    setChanged((previous) => previous.includes(timeframe) ? previous : [...previous, timeframe]);
  };
  const save = async (event) => {
    event.preventDefault();
    if (saving || !changed.length) return;
    setSaving(true);
    onSavingChange(true);
    setError('');
    const failures = [];
    let savedCount = 0;
    for (const timeframe of changed) {
      const report = reports[timeframe];
      try {
        const { data } = await axiosInstance.put('/tessbin/kpi-reports', {
          timeframe, date, revision: report.revision, status: 'draft', metrics: report.metrics, notes: report.notes,
        });
        setReports((previous) => ({ ...previous, [timeframe]: data.data }));
        setChanged((previous) => previous.filter((item) => item !== timeframe));
        savedCount += 1;
      } catch (err) {
        failures.push(`${timeframe}: ${err.response?.data?.message || 'Could not save. Please try again.'}`);
      }
    }
    if (savedCount) onSaved(date);
    if (failures.length) setError(`${savedCount ? `${savedCount} period(s) saved. ` : ''}${failures.join(' ')} Unsaved entries remain below.`);
    else toast({ title: 'Targets saved', description: 'Open Submit results when you are ready to report progress.', status: 'success', duration: 4000, isClosable: true });
    setSaving(false);
    onSavingChange(false);
  };

  return <Card borderRadius="xl"><CardBody>
    <Flex justify="space-between" align="start" gap={4} flexWrap="wrap" mb={5}>
      <Box>
        <Heading size="md">Set your KPI targets</Heading>
        <Text color={muted} mt={2}>Enter your goals across the three columns, then save once.</Text>
        <Text fontSize="sm" color={muted} mt={1}>Each column is the total goal for its period. You can fill only the periods you need.</Text>
      </Box>
      <Badge colorScheme={changed.length ? 'orange' : 'green'}>{changed.length ? 'Unsaved targets' : 'Targets up to date'}</Badge>
    </Flex>
    <HStack mb={5} align="end" flexWrap="wrap">
      <FormControl maxW="240px">
        <FormLabel htmlFor="target-period-date">Plan for the week, month & quarter containing</FormLabel>
        <Input id="target-period-date" type="date" value={date} isDisabled={saving} onChange={(event) => chooseDate(event.target.value)} />
      </FormControl>
      <Button onClick={() => chooseDate(today())} isDisabled={saving}>Today</Button>
    </HStack>
    {error && <Alert status="error" mb={4}><AlertIcon /><Box flex="1">{error}</Box><Button size="sm" isDisabled={saving} onClick={() => {
      if (!changed.length || window.confirm('Discard unsaved targets and reload saved values?')) setReload((value) => value + 1);
    }}>Reload</Button></Alert>}
    {loading ? <HStack py={8}><Spinner /><Text>Loading targets…</Text></HStack> : reports && <Box as="form" onSubmit={save}>
      <TableContainer borderWidth="1px" borderColor={border} borderRadius="xl" overflowX="auto">
        <Table minW="780px" size="sm" aria-label="Weekly monthly and quarterly KPI target setup">
          <Thead bg={headerBg}><Tr>
            <Th scope="col">KPI metric</Th>
            {PERIODS.map((timeframe) => <Th key={timeframe} scope="col" py={4} textTransform="none" letterSpacing="normal">
              <Text fontSize="md" textTransform="capitalize">{timeframe} target</Text>
              <Text fontSize="xs" fontWeight="normal" mt={1}>{displayDate(reports[timeframe].periodStart)} – {displayDate(reports[timeframe].periodEnd)}</Text>
              {reports[timeframe].status === 'submitted' && <Badge mt={2} colorScheme="green">Submitted · locked</Badge>}
            </Th>)}
          </Tr></Thead>
          <Tbody>{metrics.map((metric) => <Tr key={metric.key}>
            <Th scope="row" py={5} whiteSpace="normal" textTransform="none" letterSpacing="normal">
              <Text fontSize="sm">{metric.title}</Text><Text fontSize="xs" fontWeight="normal" color={muted} mt={1}>{metric.unit || 'Students'}</Text>
            </Th>
            {PERIODS.map((timeframe) => <Td key={timeframe}>
              <Input type="number" min={1} step={1} w="150px" placeholder="Enter target"
                aria-label={`${metric.title}: ${timeframe} target`} value={reports[timeframe].metrics.find((row) => row.key === metric.key)?.target ?? ''}
                isDisabled={saving || reports[timeframe].status === 'submitted'} onChange={(event) => edit(timeframe, metric.key, event.target.value)} />
            </Td>)}
          </Tr>)}</Tbody>
        </Table>
      </TableContainer>
      <Flex justify="space-between" gap={4} align="center" flexWrap="wrap" mt={5}>
        <Text fontSize="sm" color={muted}>Targets save as drafts. Add actual results later in Submit results.</Text>
        <Button colorScheme="purple" type="submit" isLoading={saving} isDisabled={!changed.length || saving}>Save targets</Button>
      </Flex>
      {PERIODS.some((timeframe) => reports[timeframe].status === 'submitted') && <Text fontSize="sm" color={muted} mt={3}>To change a submitted period, open Submit results, select that period, and choose Revise report.</Text>}
    </Box>}
  </CardBody></Card>;
}
