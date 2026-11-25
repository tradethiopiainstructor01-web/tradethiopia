import { useEffect, useMemo, useState } from 'react';
import {
  Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel, Heading,
  HStack, Input, Select, SimpleGrid, Spinner, Tab, TabList, TabPanel, TabPanels,
  Tabs, Text, Table, Thead, Tbody, Tr, Th, Td, Progress,
} from '@chakra-ui/react';
import { FiArrowLeft, FiFileText, FiFolder, FiRefreshCw } from 'react-icons/fi';
import { listManagerEcommerceFolders, listManagerEcommerceTables } from '../../services/ecommerceTableService';
import { ManagerChannelTable } from './EcommerceSalesDataPage';
import { summarizeImportCatalogs } from '../../utils/ecommerceImportStats';

const ownerId = (item) => String(item.owner?._id || item.owner || '');
const ownerName = (item) => item.owner?.fullName || item.owner?.username || item.owner?.email || (typeof item.owner === 'string' ? item.owner : 'Former sales user');
const folderKey = (item) => String(item.folder?._id || item.folder || `legacy:${ownerId(item)}`);

function ImportedFolders({ channel, folders, tables, loading, onRefresh }) {
  const [agent, setAgent] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedTable, setSelectedTable] = useState('');

  const groups = useMemo(() => {
    const all = new Map(folders.map((folder) => [String(folder._id), { ...folder, tables: [] }]));
    tables.forEach((table) => {
      const key = folderKey(table);
      if (!all.has(key)) all.set(key, { _id: key, name: table.folder ? 'Unavailable folder' : 'Existing imports', owner: table.owner, tables: [] });
      all.get(key).tables.push(table);
    });
    return [...all.values()].sort((a, b) => ownerName(a).localeCompare(ownerName(b)) || a.name.localeCompare(b.name));
  }, [folders, tables]);
  const agents = useMemo(() => [...new Map(groups.map((group) => [ownerId(group), ownerName(group)])).entries()], [groups]);
  const currentFolder = groups.find((folder) => folder._id === selectedFolder);
  const tableIds = useMemo(() => currentFolder?.tables.map((table) => table._id) || [], [currentFolder]);
  const term = search.trim().toLowerCase();
  const visibleFolders = groups.filter((folder) => (agent === 'all' || ownerId(folder) === agent)
    && `${folder.name} ${ownerName(folder)} ${folder.tables.map((table) => table.name).join(' ')}`.toLowerCase().includes(term));
  const visibleTables = (currentFolder?.tables || []).filter((table) => table.name.toLowerCase().includes(term));

  return <Box>
    <Flex gap={3} align="center" justify="space-between" wrap="wrap" mb={5}>
      <HStack wrap="wrap">
        {selectedFolder && <Button variant="ghost" leftIcon={<FiArrowLeft />} onClick={() => {
          if (selectedTable) setSelectedTable(''); else setSelectedFolder('');
          setSearch('');
        }}>{selectedTable ? 'Back to folder' : 'All folders'}</Button>}
        <Heading size="md">{currentFolder ? currentFolder.name : 'All imported folders'}</Heading>
        {currentFolder && <Badge colorScheme="purple">{ownerName(currentFolder)}</Badge>}
      </HStack>
      {!selectedTable && <Button leftIcon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={onRefresh}>Refresh</Button>}
    </Flex>
    {selectedFolder && !currentFolder ? <Alert status="info"><AlertIcon />This folder is no longer available. Return to All folders.</Alert>
          : selectedTable ? <ManagerChannelTable key={`${channel}:${selectedTable}`} channel={channel} tableIds={tableIds} initialTableId={selectedTable} /> : <>
            <Flex gap={4} mb={5} wrap="wrap" align="end">
              {!selectedFolder && <FormControl maxW="300px">
                <FormLabel htmlFor={`${channel}-import-agent`}>Sales user</FormLabel>
                <Select id={`${channel}-import-agent`} value={agent} onChange={(event) => setAgent(event.target.value)}>
                  <option value="all">All sales users</option>
                  {agents.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </Select>
              </FormControl>}
              <Input maxW="420px" aria-label="Search imported folders and tables" placeholder={selectedFolder ? 'Search tables…' : 'Search folders, tables, or sales users…'} value={search} onChange={(event) => setSearch(event.target.value)} />
              <Badge colorScheme="purple">{selectedFolder ? `${currentFolder.tables.length} tables` : `${visibleFolders.length} folders`}</Badge>
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
              {(selectedFolder ? visibleTables : visibleFolders).map((item) => <Box as="button" type="button" key={item._id} textAlign="left" p={5} bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl"
                _hover={{ borderColor: 'purple.400', bg: 'purple.50' }} _focusVisible={{ boxShadow: 'outline' }}
                onClick={() => { if (selectedFolder) setSelectedTable(item._id); else setSelectedFolder(item._id); setSearch(''); }}>
                <Box color="purple.500" mb={3}>{selectedFolder ? <FiFileText size={28} /> : <FiFolder size={28} />}</Box>
                <Heading size="sm" overflowWrap="anywhere">{item.name}</Heading>
                <Text color="gray.600" fontSize="sm" mt={2}>{ownerName(item)}</Text>
                <Text color="gray.600" fontSize="sm" mt={2}>{selectedFolder
                  ? `${(item.rowCount || 0).toLocaleString()} saved rows · Open table`
                  : `${item.tables.length} tables · ${item.tables.reduce((sum, table) => sum + (table.rowCount || 0), 0).toLocaleString()} rows`}</Text>
              </Box>)}
            </SimpleGrid>
            {!(selectedFolder ? visibleTables : visibleFolders).length && <Alert status="info" mt={4}><AlertIcon />{term || agent !== 'all' ? 'No imports match your filters.' : selectedFolder ? 'No tables have been imported into this folder yet.' : 'No folders or tables have been imported in this tab yet.'}</Alert>}
          </>}
  </Box>;
}

function ImportsOverview({ catalogs }) {
  const stats = useMemo(() => summarizeImportCatalogs(catalogs), [catalogs]);
  return <Box as="section" aria-label="Import overview" mb={6}>
    <Heading size="md">Import overview</Heading>
    <Text color="gray.600" fontSize="sm" mt={1} mb={4}>Across both channels and all sales users. Saved rows may include the same contact in different tables.</Text>
    <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={4} mb={4}>
      {[
        ['Folders', stats.folders, 'Created folders, including empty ones'],
        ['Tables', stats.tables, 'Saved worksheets across both channels'],
        ['Saved rows', stats.rows, 'Total rows in all saved tables'],
        ['Sales users', stats.salesUsers, 'Users with folders or tables'],
      ].map(([label, value, detail]) => <Box key={label} role="group" aria-label={label} bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={4}>
        <Text fontSize="sm" color="gray.600">{label}</Text>
        <Text fontSize="3xl" fontWeight="bold" color="purple.700">{value.toLocaleString()}</Text>
        <Text fontSize="xs" color="gray.500">{detail}</Text>
      </Box>)}
    </SimpleGrid>
    <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden">
      <Box overflowX="auto">
        <Table size="sm" aria-label="Imports by channel">
          <Thead bg="purple.50"><Tr><Th>Channel</Th><Th isNumeric>Folders</Th><Th isNumeric>Tables</Th><Th isNumeric>Saved rows</Th><Th isNumeric>Sales users</Th><Th minW="170px">Share of rows</Th></Tr></Thead>
          <Tbody>{stats.channels.map((channel) => {
            const share = stats.rows ? channel.rows / stats.rows * 100 : 0;
            return <Tr key={channel.channel}>
              <Td fontWeight="semibold" whiteSpace="nowrap">{channel.channel === 'cold-call' ? 'Cold Call' : 'Bulk SMS'}</Td>
              <Td isNumeric>{channel.folders.toLocaleString()}</Td><Td isNumeric>{channel.tables.toLocaleString()}</Td>
              <Td isNumeric>{channel.rows.toLocaleString()}</Td><Td isNumeric>{channel.salesUsers.toLocaleString()}</Td>
              <Td py={3}><Text fontSize="xs" mb={1}>{share.toFixed(1)}%</Text><Progress value={share} size="sm" borderRadius="full" colorScheme={channel.channel === 'cold-call' ? 'purple' : 'teal'} aria-label={`${channel.channel} share of saved rows`} /></Td>
            </Tr>;
          })}</Tbody>
        </Table>
      </Box>
      <Flex p={4} gap={4} wrap="wrap" fontSize="sm" color="gray.600" borderTop="1px solid" borderColor="gray.200">
        <Text>Empty folders: <b>{stats.emptyFolders.toLocaleString()}</b></Text>
        <Text>Empty tables: <b>{stats.emptyTables.toLocaleString()}</b></Text>
        <Text>Tables without a folder: <b>{stats.unfiledTables.toLocaleString()}</b></Text>
        <Text>Last table update: <b>{stats.lastUpdated === null ? 'Not available' : new Date(stats.lastUpdated).toLocaleString()}</b></Text>
      </Flex>
    </Box>
  </Box>;
}

export default function EcommerceImportsPage() {
  const [catalogs, setCatalogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const onRefresh = () => setRefresh((value) => value + 1);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all(['cold-call', 'bulk-sms'].map(async (channel) => {
      const [folders, tables] = await Promise.all([listManagerEcommerceFolders(channel), listManagerEcommerceTables(channel)]);
      return { channel, folders, tables };
    })).then((data) => active && setCatalogs(data))
      .catch((e) => active && setError(e.response?.data?.message || e.message || 'Unable to load imports.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [refresh]);

  return <Box w="100%" minW={0}>
    <Box bg="white" p={{ base: 4, md: 6 }} border="1px solid" borderColor="gray.200" borderRadius="xl" mb={5}>
      <Flex gap={3} justify="space-between" align="center" wrap="wrap">
        <Heading size="lg">eCommerce Imports</Heading>
        <Button leftIcon={<FiRefreshCw />} variant="outline" isLoading={loading} onClick={onRefresh}>Refresh overview</Button>
      </Flex>
      <Text mt={2} color="gray.600">Browse every sales user’s imported Cold Call and Bulk SMS worksheets by folder. Open a table to view, search, or export its saved rows.</Text>
    </Box>
    {error && <Alert status="error" mb={4}><AlertIcon /><Box flex={1}>{error}{catalogs && ' Showing the last loaded overview and folders.'}</Box><Button onClick={onRefresh} isLoading={loading}>Retry</Button></Alert>}
    {!catalogs && loading && <HStack py={12} justify="center"><Spinner /><Text>Loading import overview…</Text></HStack>}
    {catalogs && <>
      <ImportsOverview catalogs={catalogs} />
      <Tabs colorScheme="purple" isLazy lazyBehavior="keepMounted">
      <TabList><Tab>Cold Call</Tab><Tab>Bulk SMS</Tab></TabList>
      <TabPanels>
        {catalogs.map((catalog) => <TabPanel key={catalog.channel} px={0} py={5}><ImportedFolders {...catalog} loading={loading} onRefresh={onRefresh} /></TabPanel>)}
      </TabPanels>
      </Tabs>
    </>}
  </Box>;
}
