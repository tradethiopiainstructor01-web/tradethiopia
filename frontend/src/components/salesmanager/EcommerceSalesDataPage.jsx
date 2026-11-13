import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel, Heading,
  HStack, Input, Select, SimpleGrid, Spinner, Tab, Table, TabList, TabPanel,
  TabPanels, Tabs, Tbody, Td, Text, Th, Thead, Tr, VStack, useToast,
} from '@chakra-ui/react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import {
  getAllManagerEcommerceRows,
  getManagerEcommerceTable,
  listManagerEcommerceTables,
} from '../../services/ecommerceTableService';
import { tableColumnWidth } from '../../utils/ecommerceImport';

const errorMessage = (error) => error.response?.data?.message || error.message || 'Please try again.';

const ownerId = (table) => String(typeof table.owner === 'object' ? table.owner?._id || '' : table.owner || '');
const ownerName = (table) => {
  if (!table.owner) return 'Former sales user';
  if (typeof table.owner === 'string') return table.owner;
  return table.owner.fullName || table.owner.username || table.owner.email || 'Sales user';
};

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

function SummaryCard({ label, value, detail }) {
  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={4}>
      <Text color="gray.500" fontSize="sm" fontWeight="semibold">{label}</Text>
      <Text mt={1} fontSize="2xl" fontWeight="bold" color="gray.800">{value}</Text>
      <Text mt={1} color="gray.500" fontSize="xs">{detail}</Text>
    </Box>
  );
}

function ManagerChannelTable({ channel }) {
  const toast = useToast();
  const [tables, setTables] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedTable, setSelectedTable] = useState('');
  const [table, setTable] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    setError('');
    listManagerEcommerceTables(channel)
      .then((data) => {
        if (!active) return;
        const ordered = [...data].sort((a, b) => ownerName(a).localeCompare(ownerName(b)) || a.name.localeCompare(b.name));
        setTables(ordered);
      })
      .catch((loadError) => active && setError(errorMessage(loadError)))
      .finally(() => active && setCatalogLoading(false));
    return () => { active = false; };
  }, [channel, refresh]);

  const agents = useMemo(() => {
    const unique = new Map();
    tables.forEach((item) => unique.set(ownerId(item), ownerName(item)));
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [tables]);

  const visibleTables = useMemo(() => (
    selectedAgent === 'all' ? tables : tables.filter((item) => ownerId(item) === selectedAgent)
  ), [selectedAgent, tables]);

  useEffect(() => {
    if (!visibleTables.some((item) => item._id === selectedTable)) {
      setSelectedTable(visibleTables[0]?._id || '');
      setPage(1);
      setSearch('');
      setQuery('');
    }
  }, [visibleTables, selectedTable]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    if (!selectedTable) {
      setTable(null);
      return () => { active = false; };
    }
    setTableLoading(true);
    setError('');
    getManagerEcommerceTable(channel, selectedTable, { page, search: query || undefined })
      .then((data) => active && setTable(data))
      .catch((loadError) => active && setError(errorMessage(loadError)))
      .finally(() => active && setTableLoading(false));
    return () => { active = false; };
  }, [channel, selectedTable, page, query, refresh]);

  const selectedSummary = tables.find((item) => item._id === selectedTable);
  const totalRows = tables.reduce((sum, item) => sum + (item.rowCount || 0), 0);
  const pageSize = table?.pageSize || 50;
  const matchCount = table?.matchCount ?? 0;
  const currentPage = table?.page || 1;
  const totalPages = Math.max(1, Math.ceil(matchCount / pageSize));
  const pageWindowStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = [...new Set([1, ...Array.from({ length: Math.min(5, totalPages) }, (_, index) => pageWindowStart + index), totalPages])].sort((a, b) => a - b);
  const columns = table?.columns || [];
  const width = 64 + columns.reduce((sum, column) => sum + tableColumnWidth(column), 0);

  const download = async () => {
    if (!table?._id) return;
    setExporting(true);
    try {
      const [XLSX, rows] = await Promise.all([import('xlsx'), getAllManagerEcommerceRows(channel, table._id)]);
      const sheet = XLSX.utils.aoa_to_sheet([columns, ...rows.map((row) => row.values)]);
      sheet['!cols'] = columns.map((column) => ({ wpx: tableColumnWidth(column) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, 'eCommerce Sales Data');
      const safeAgent = ownerName(selectedSummary || table).replace(/[^\p{L}\p{N} _-]/gu, '_');
      const safeTable = table.name.replace(/[^\p{L}\p{N} _-]/gu, '_');
      XLSX.writeFile(workbook, `${safeAgent} - ${safeTable}.xlsx`);
    } catch (exportError) {
      toast({ title: 'Export failed', description: errorMessage(exportError), status: 'error', duration: 6000 });
    } finally {
      setExporting(false);
    }
  };

  if (catalogLoading && !tables.length) {
    return <HStack justify="center" py={16}><Spinner /><Text>Loading eCommerce sales data…</Text></HStack>;
  }

  return (
    <VStack align="stretch" spacing={5}>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <SummaryCard label="Saved rows" value={totalRows.toLocaleString()} detail={`Across ${channel === 'cold-call' ? 'Cold Call' : 'Bulk SMS'} worksheets`} />
        <SummaryCard label="Sales users" value={agents.length.toLocaleString()} detail="Users with inserted eCommerce data" />
        <SummaryCard label="Worksheets" value={tables.length.toLocaleString()} detail="All saved tables in this channel" />
      </SimpleGrid>

      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 5 }}>
        <Flex gap={4} align="end" wrap="wrap">
          <FormControl maxW={{ base: '100%', md: '280px' }}>
            <FormLabel>Sales user</FormLabel>
            <Select value={selectedAgent} onChange={(event) => setSelectedAgent(event.target.value)}>
              <option value="all">All sales users</option>
              {agents.map(([id, name]) => <option key={id || name} value={id}>{name}</option>)}
            </Select>
          </FormControl>
          <FormControl flex="1" minW={{ base: '100%', md: '300px' }}>
            <FormLabel>Worksheet / table</FormLabel>
            <Select value={selectedTable} onChange={(event) => { setSelectedTable(event.target.value); setPage(1); setSearch(''); setQuery(''); }} isDisabled={!visibleTables.length}>
              {!visibleTables.length && <option value="">No saved worksheets</option>}
              {visibleTables.map((item) => (
                <option key={item._id} value={item._id}>{ownerName(item)} — {item.name} ({(item.rowCount || 0).toLocaleString()} rows)</option>
              ))}
            </Select>
          </FormControl>
          <Button leftIcon={<FiRefreshCw />} variant="outline" onClick={() => setRefresh((value) => value + 1)} isLoading={catalogLoading}>Refresh</Button>
        </Flex>
      </Box>

      {error && <Alert status="error" borderRadius="lg"><AlertIcon /><Box flex="1">{error}</Box><Button size="sm" onClick={() => setRefresh((value) => value + 1)}>Retry</Button></Alert>}

      {!error && !tables.length && (
        <Alert status="info" borderRadius="lg"><AlertIcon />No {channel === 'cold-call' ? 'Cold Call' : 'Bulk SMS'} eCommerce data has been inserted by the sales team yet.</Alert>
      )}

      {!error && table && (
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden">
          <Flex p={{ base: 4, md: 5 }} gap={4} align={{ base: 'stretch', md: 'center' }} justify="space-between" direction={{ base: 'column', md: 'row' }} borderBottom="1px solid" borderColor="gray.200">
            <Box>
              <HStack wrap="wrap">
                <Heading size="md">{table.name}</Heading>
                <Badge colorScheme="purple">Read only</Badge>
                <Badge colorScheme="teal">All original columns</Badge>
              </HStack>
              <Text mt={2} color="gray.600" fontSize="sm">
                Inserted by <Text as="span" fontWeight="semibold">{ownerName(selectedSummary || table)}</Text>
                {selectedSummary?.owner?.email ? ` · ${selectedSummary.owner.email}` : ''} · Updated {formatDate(table.updatedAt)}
              </Text>
            </Box>
            <Button leftIcon={<FiDownload />} colorScheme="teal" variant="outline" onClick={download} isLoading={exporting}>Export all rows</Button>
          </Flex>

          <Flex p={4} gap={3} align="center" wrap="wrap">
            <Input maxW="420px" aria-label="Search eCommerce sales data" placeholder="Search any column…" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Badge colorScheme="teal">{(table.rowCount || 0).toLocaleString()} saved rows</Badge>
            <Badge>{columns.length.toLocaleString()} columns</Badge>
            {tableLoading && <Spinner size="sm" />}
          </Flex>

          <Box overflowX="auto" maxH="62vh" borderTop="1px solid" borderColor="gray.200">
            <Table size="sm" w={`${width}px`} sx={{ tableLayout: 'fixed', 'th, td': { borderRight: '1px solid', borderColor: 'gray.200' } }}>
              <colgroup><col style={{ width: 64 }} />{columns.map((column, index) => <col key={`${column}-${index}`} style={{ width: tableColumnWidth(column) }} />)}</colgroup>
              <Thead position="sticky" top={0} zIndex={1} bg="purple.50">
                <Tr><Th>#</Th>{columns.map((column, index) => <Th key={`${column}-${index}`} py={4} textTransform="none" whiteSpace="normal">{column}</Th>)}</Tr>
              </Thead>
              <Tbody>
                {(table.rows || []).map((row, rowIndex) => (
                  <Tr key={row.id || rowIndex} bg={rowIndex % 2 ? 'gray.50' : 'white'} _hover={{ bg: 'purple.50' }}>
                    <Td color="gray.500">{(currentPage - 1) * pageSize + rowIndex + 1}</Td>
                    {columns.map((_, columnIndex) => <Td key={columnIndex} py={3} verticalAlign="top" whiteSpace="pre-wrap" overflowWrap="anywhere">{row.values[columnIndex]}</Td>)}
                  </Tr>
                ))}
                {!tableLoading && !(table.rows || []).length && <Tr><Td colSpan={columns.length + 1} py={12} textAlign="center" color="gray.500">{query ? 'No rows match your search.' : 'This worksheet has no saved rows.'}</Td></Tr>}
              </Tbody>
            </Table>
          </Box>

          <Flex p={4} justify="space-between" gap={3} align="center" wrap="wrap">
            <Text fontSize="sm" color="gray.600">{matchCount.toLocaleString()} matching rows · Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}</Text>
            <HStack as="nav" aria-label={`${channel} manager table pagination`} spacing={1} wrap="wrap">
              <Button size="sm" isDisabled={tableLoading || currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
              {pageNumbers.map((number, index) => <Fragment key={number}>
                {index > 0 && number - pageNumbers[index - 1] > 1 && <Text px={1}>…</Text>}
                <Button size="sm" minW={8} colorScheme={number === currentPage ? 'purple' : 'gray'} variant={number === currentPage ? 'solid' : 'outline'} isDisabled={tableLoading || number === currentPage} onClick={() => setPage(number)}>{number}</Button>
              </Fragment>)}
              <Button size="sm" isDisabled={tableLoading || currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button>
            </HStack>
          </Flex>
        </Box>
      )}
    </VStack>
  );
}

export default function EcommerceSalesDataPage() {
  return (
    <Box w="100%" minW={0}>
      <Box bgGradient="linear(to-r, purple.700, blue.600)" color="white" p={{ base: 5, md: 7 }} borderRadius="xl" mb={6}>
        <Heading size={{ base: 'md', md: 'lg' }}>eCommerce Cold Call &amp; Bulk SMS</Heading>
        <Text mt={2} maxW="780px" color="whiteAlpha.900">View all Cold Call follow-up records and Bulk SMS contacts inserted by every sales user. Choose either tab below, then filter by sales user or worksheet.</Text>
      </Box>
      <Tabs colorScheme="purple" isLazy lazyBehavior="keepMounted">
        <TabList><Tab fontWeight="semibold">Cold Call</Tab><Tab fontWeight="semibold">Bulk SMS</Tab></TabList>
        <TabPanels>
          <TabPanel px={0} py={5}><ManagerChannelTable channel="cold-call" /></TabPanel>
          <TabPanel px={0} py={5}><ManagerChannelTable channel="bulk-sms" /></TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
