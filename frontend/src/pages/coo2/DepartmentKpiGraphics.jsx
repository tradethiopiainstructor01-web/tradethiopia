import { useEffect, useState } from 'react';
import { Badge, Box, Flex, HStack, Select, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const colors = { 'Target met': '#16a34a', 'Below target': '#f59e0b', 'No measurable target': '#94a3b8', 'Not reported': '#cbd5e1' };
const format = (value) => value === null ? 'Not set' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
const AchievementTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return <Box bg="white" p={3} border="1px solid #e2e8f0" borderRadius="10px" boxShadow="md" maxW="300px">
    <Text fontWeight="700" fontSize="13px">{row.name}</Text>
    <Text fontSize="12px">{format(row.achievement)}% achievement · {row.status}</Text>
    <Text fontSize="12px">Actual: {format(row.actual)} {row.unit} · Target: {format(row.target)} {row.unit}</Text>
    <Text fontSize="12px" color="#64748b" mt={1}>{row.analysis}</Text>
  </Box>;
};

export default function DepartmentKpiGraphics({ rows, department }) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id || '');
  useEffect(() => {
    if (!rows.some((row) => row.id === selectedId)) setSelectedId(rows[0]?.id || '');
  }, [rows, selectedId]);
  const selected = rows.find((row) => row.id === selectedId) || rows[0];
  const scored = rows.filter((row) => row.achievement !== null).sort((a, b) => a.achievement - b.achievement);
  const unscored = rows.filter((row) => row.achievement === null);
  const attention = scored.find((row) => row.status === 'Below target');
  if (!selected) return null;
  const comparison = [
    ...(selected.actual === null ? [] : [{ name: 'Actual', value: selected.actual, color: '#2563eb' }]),
    ...(selected.target === null ? [] : [{ name: 'Target', value: selected.target, color: '#cbd5e1' }]),
  ];
  return <Box mb={5}>
    {attention && <Flex bg="#fffbeb" border="1px solid #fde68a" borderRadius="10px" p={3} mb={4} gap={2} wrap="wrap" align="center">
      <Badge colorScheme="orange">Needs attention</Badge>
      <Text fontSize="13px"><strong>{attention.name}</strong> · {attention.analysis}</Text>
      <Text fontSize="11px" color="#92400e">Lowest achievement among scored KPIs.</Text>
    </Flex>}
    <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}>
      <Box border="1px solid #e2e8f0" borderRadius="12px" p={4} minW={0}>
        <Text fontWeight="700" fontSize="14px">Achievement by KPI</Text>
        <Text fontSize="12px" color="#64748b" mb={3}>Lowest achievement first · dashed line = target met</Text>
        {scored.length ? <Box maxH="360px" overflowY="auto" aria-label={department + ' KPI achievement chart'}>
          <Box h={Math.max(180, scored.length * 48 + 35) + 'px'}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scored} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, (max) => Math.max(110, max)]} tickFormatter={(value) => value + '%'} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={125} interval={0} tick={{ fontSize: 11 }} tickFormatter={(name) => name.length > 20 ? name.slice(0, 19) + '…' : name} />
                <Tooltip content={<AchievementTooltip />} />
                <ReferenceLine x={100} stroke="#64748b" strokeDasharray="4 4" />
                <Bar dataKey="achievement" radius={[0, 5, 5, 0]} maxBarSize={22}>
                  {scored.map((row) => <Cell key={row.id} fill={colors[row.status]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box> : <VStack py={9} spacing={2} align="start"><Badge colorScheme="gray">Targets needed</Badge><Text fontSize="13px" color="#64748b">Achievement becomes available when measurable targets and actual results are recorded.</Text></VStack>}
        <HStack spacing={4} mt={2}>{['Target met', 'Below target'].map((status) => <HStack key={status} spacing={1}><Box w="8px" h="8px" borderRadius="full" bg={colors[status]} /><Text fontSize="11px" color="#64748b">{status}</Text></HStack>)}</HStack>
      </Box>
      <Box border="1px solid #e2e8f0" borderRadius="12px" p={4} minW={0}>
        <Text fontWeight="700" fontSize="14px" mb={2}>Actual vs target</Text>
        <Select size="sm" borderRadius="8px" value={selected.id} onChange={(event) => setSelectedId(event.target.value)} aria-label={'Select ' + department + ' KPI to compare'}>
          {rows.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </Select>
        <Text fontSize="12px" color="#64748b" mt={2}>{selected.unit} · {selected.lowerIsBetter ? 'Lower is better' : 'Higher is better'}</Text>
        <Box h="200px">
          {comparison.length ? <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparison} margin={{ top: 15, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} width={65} />
              <Tooltip formatter={(value) => [format(value) + ' ' + selected.unit, selected.name]} />
              <Bar dataKey="value" maxBarSize={65} radius={[6, 6, 0, 0]}>{comparison.map((row) => <Cell key={row.name} fill={row.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer> : <Text py={8} color="#64748b">No recorded values for this KPI.</Text>}
        </Box>
        <HStack justify="space-between" fontSize="12px" mb={2}><Text>Actual: <strong>{format(selected.actual)}</strong></Text><Text>Target: <strong>{format(selected.target)}</strong></Text></HStack>
        <Text fontSize="12px" color="#475569">{selected.analysis}</Text>
      </Box>
    </SimpleGrid>
    {unscored.length > 0 && <Box mt={4} bg="#f8fafc" borderRadius="10px" p={3}>
      <Text fontSize="12px" fontWeight="700" mb={2}>Awaiting targets or results ({unscored.length})</Text>
      <Flex wrap="wrap" gap={2}>{unscored.map((row) => <Badge key={row.id} colorScheme="gray" whiteSpace="normal" textTransform="none" px={2} py={1}>{row.name}: {row.actual === null ? 'Not reported' : format(row.actual) + ' ' + row.unit} · {row.status}</Badge>)}</Flex>
    </Box>}
  </Box>;
}
