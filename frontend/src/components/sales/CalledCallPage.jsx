import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  IconButton,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useDisclosure,
  useToast,
  Spinner,
  HStack,
  VStack,
  Tooltip,
  InputGroup,
  InputLeftElement,
  Divider,
  Icon,
} from '@chakra-ui/react';
import {
  FaPhoneAlt,
  FaPhoneVolume,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFileDownload,
  FaFileExcel,
  FaCheckCircle,
  FaCopy,
  FaBuilding,
  FaInfoCircle,
} from 'react-icons/fa';
import { FiRefreshCw, FiUploadCloud } from 'react-icons/fi';
import {
  fetchCalledCalls,
  createCalledCall,
  updateCalledCall,
  deleteCalledCall,
  bulkCreateCalledCalls,
} from '../../services/calledCallService';
import { useUserStore } from '../../store/user';

const CALL_RESULT_OPTIONS = [
  'Interested',
  'Callback Requested',
  'Deal Closed',
  'Busy',
  'No Answer',
  'Not Interested',
  'Wrong Number',
];

const RESULT_CONFIG = {
  Interested: { color: 'green', label: 'Interested' },
  'Callback Requested': { color: 'yellow', label: 'Callback Requested' },
  'Deal Closed': { color: 'blue', label: 'Deal Closed' },
  Busy: { color: 'orange', label: 'Busy' },
  'No Answer': { color: 'gray', label: 'No Answer' },
  'Not Interested': { color: 'red', label: 'Not Interested' },
  'Wrong Number': { color: 'purple', label: 'Wrong Number' },
};

const INITIAL_FORM = {
  customerName: '',
  phoneNumber: '',
  callDate: new Date().toISOString().slice(0, 10),
  callResult: 'Interested',
  companyName: '',
  email: '',
  city: '',
  notes: '',
};

export const normalizePhoneNumber = (raw) => {
  if (raw === null || raw === undefined) return '';
  let str = String(raw).trim();
  if (!str) return '';

  // Handle scientific notation e.g. 9.11223e+08
  if (/^[0-9.]+[eE][+-]?[0-9]+$/.test(str)) {
    try {
      const num = Number(str);
      if (!Number.isNaN(num)) {
        str = Math.round(num).toString();
      }
    } catch {
      // ignore
    }
  }

  // Remove .0 suffix often added by Excel numeric format
  str = str.replace(/\.0+$/, '');

  const hasPlus = str.startsWith('+');
  const digitsOnly = str.replace(/\D/g, '');

  if (digitsOnly.length < 7) return '';

  // Ethiopian 9 digits starting with 9 or 7 -> 09... / 07...
  if (digitsOnly.length === 9 && (digitsOnly.startsWith('9') || digitsOnly.startsWith('7'))) {
    return `0${digitsOnly}`;
  }

  // Ethiopian 12 digits starting with 2519 or 2517 -> 09... / 07...
  if (digitsOnly.length === 12 && (digitsOnly.startsWith('2519') || digitsOnly.startsWith('2517'))) {
    return `0${digitsOnly.slice(3)}`;
  }

  // 10 digits starting with 0
  if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
    return digitsOnly;
  }

  if (hasPlus) {
    return `+${digitsOnly}`;
  }

  return digitsOnly;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const CalledCallPage = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const toast = useToast();

  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    todayCalls: 0,
    interestedCount: 0,
    dealClosedCount: 0,
    noAnswerCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('All');
  const [detailsFilter, setDetailsFilter] = useState('all'); // 'all', 'needs_details', 'complete'

  // Modal State for Add / Edit
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Import Modal State
  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose,
  } = useDisclosure();
  const fileInputRef = useRef(null);
  const [importFile, setImportFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [importStats, setImportStats] = useState({ total: 0, valid: 0, invalid: 0 });
  const [defaultResult, setDefaultResult] = useState('Interested');
  const [defaultNote, setDefaultNote] = useState('Imported from Excel');

  // Detail View Modal State
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();
  const [selectedCall, setSelectedCall] = useState(null);

  // Open import from custom event (e.g. from sidebar shortcut)
  useEffect(() => {
    const handleOpenImportEvent = () => {
      handleOpenImport();
    };
    window.addEventListener('called-call:open-import', handleOpenImportEvent);
    return () => window.removeEventListener('called-call:open-import', handleOpenImportEvent);
  }, []);

  const loadData = async (searchValue = search, resultValue = resultFilter) => {
    try {
      setLoading(true);
      const params = {};
      if (searchValue.trim()) params.search = searchValue.trim();
      if (resultValue !== 'All') params.callResult = resultValue;

      const response = await fetchCalledCalls(params);
      if (response?.success) {
        setCalls(response.data || []);
        if (response.stats) {
          setStats(response.stats);
        }
      }
    } catch (error) {
      console.error('Failed to load called calls:', error);
      toast({
        title: 'Error loading calls',
        description: error.response?.data?.message || 'Could not fetch called calls list',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resultFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      ...INITIAL_FORM,
      callDate: new Date().toISOString().slice(0, 10),
    });
    onOpen();
  };

  const handleOpenEdit = (call) => {
    setEditingId(call._id);
    setFormData({
      customerName: call.customerName || call.clientName || '',
      phoneNumber: call.phoneNumber || '',
      callDate: call.callDate
        ? new Date(call.callDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      callResult: call.callResult || call.callStatus || 'Interested',
      companyName: call.companyName || '',
      email: call.email || '',
      city: call.city || '',
      notes: call.notes || '',
    });
    onOpen();
  };

  const handleOpenImport = () => {
    setImportFile(null);
    setParsedRows([]);
    setImportStats({ total: 0, valid: 0, invalid: 0 });
    setDefaultResult('Interested');
    setDefaultNote('Imported from Excel');
    onImportOpen();
  };

  const processFile = async (file) => {
    if (!file) return;
    setImportFile(file);
    setIsParsing(true);
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('No sheets found in the uploaded file.');
      }
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

      if (!rawRows || rawRows.length === 0) {
        toast({
          title: 'Empty File',
          description: 'The selected spreadsheet contains no rows.',
          status: 'warning',
          duration: 3500,
          isClosable: true,
        });
        setIsParsing(false);
        return;
      }

      // Keys to identify phone columns
      const phoneHeaderRegex = /phone|mobile|tel|contact|cell|number|ph|call|ስልክ|ቁጥር/i;
      const nameHeaderRegex = /name|customer|client|prospect|person|caller|full\s*name|ስም/i;
      const companyHeaderRegex = /company|organization|business|employer|corp|enterprise|firm|ድርጅት/i;
      const emailHeaderRegex = /email|mail/i;
      const cityHeaderRegex = /city|location|town|address/i;
      const notesHeaderRegex = /note|notes|remark|remarks|comment|comments|detail|details/i;
      const resultHeaderRegex = /result|status|outcome|call\s*result|call\s*status/i;

      const validList = [];
      let invalidCount = 0;

      rawRows.forEach((row, index) => {
        const entries = Object.entries(row);
        let detectedPhone = '';
        let detectedName = '';
        let detectedCompany = '';
        let detectedEmail = '';
        let detectedCity = '';
        let detectedNotes = '';
        let detectedResult = '';

        // 1. Try to find by column header name
        for (const [key, val] of entries) {
          const trimmedKey = key.trim();
          const strVal = String(val || '').trim();

          if (!detectedPhone && phoneHeaderRegex.test(trimmedKey)) {
            const normalized = normalizePhoneNumber(strVal);
            if (normalized) detectedPhone = normalized;
          }
          if (!detectedName && nameHeaderRegex.test(trimmedKey)) {
            detectedName = strVal;
          }
          if (!detectedCompany && companyHeaderRegex.test(trimmedKey)) {
            detectedCompany = strVal;
          }
          if (!detectedEmail && emailHeaderRegex.test(trimmedKey)) {
            detectedEmail = strVal;
          }
          if (!detectedCity && cityHeaderRegex.test(trimmedKey)) {
            detectedCity = strVal;
          }
          if (!detectedNotes && notesHeaderRegex.test(trimmedKey)) {
            detectedNotes = strVal;
          }
          if (!detectedResult && resultHeaderRegex.test(trimmedKey)) {
            detectedResult = strVal;
          }
        }

        // 2. If phone not found by column header, scan all cell values in row
        if (!detectedPhone) {
          for (const [_, val] of entries) {
            const normalized = normalizePhoneNumber(val);
            if (normalized) {
              detectedPhone = normalized;
              break;
            }
          }
        }

        if (detectedPhone) {
          validList.push({
            id: `row-${index}`,
            rowNum: index + 1,
            phoneNumber: detectedPhone,
            customerName: detectedName || `Prospect ${detectedPhone}`,
            hasOriginalName: Boolean(detectedName),
            companyName: detectedCompany || '',
            email: detectedEmail || '',
            city: detectedCity || '',
            notes: detectedNotes || defaultNote,
            callResult: CALL_RESULT_OPTIONS.includes(detectedResult) ? detectedResult : defaultResult,
            callDate: new Date().toISOString().slice(0, 10),
          });
        } else {
          invalidCount++;
        }
      });

      setParsedRows(validList);
      setImportStats({
        total: rawRows.length,
        valid: validList.length,
        invalid: invalidCount,
      });

      if (validList.length === 0) {
        toast({
          title: 'No Valid Phone Numbers Found',
          description: 'Could not detect any phone numbers in the uploaded spreadsheet. Please check the file.',
          status: 'error',
          duration: 4500,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Failed to parse excel:', err);
      toast({
        title: 'File Parse Error',
        description: err.message || 'Could not parse the selected spreadsheet.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedRows || parsedRows.length === 0) return;
    try {
      setIsImporting(true);
      const payload = parsedRows.map((r) => ({
        phoneNumber: r.phoneNumber,
        customerName: r.customerName,
        companyName: r.companyName,
        email: r.email,
        city: r.city,
        notes: r.notes || defaultNote,
        callResult: r.callResult || defaultResult,
        callDate: r.callDate,
      }));

      const res = await bulkCreateCalledCalls(payload);
      if (res?.success) {
        toast({
          title: 'Import Successful',
          description: `Accepted and imported ${res.count || payload.length} sales call records! You can now insert/complete the remaining details in the table.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onImportClose();
        loadData();
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: error.response?.data?.message || 'Failed to save imported call records.',
        status: 'error',
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      toast({
        title: 'Customer Name Required',
        description: 'Please enter the customer name.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.phoneNumber.trim()) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter the customer phone number.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        clientName: formData.customerName.trim(),
        callStatus: formData.callResult,
      };

      if (editingId) {
        await updateCalledCall(editingId, payload);
        toast({
          title: 'Record Updated',
          description: 'Sales call updated successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createCalledCall(payload);
        toast({
          title: 'Record Saved',
          description: 'Sales call data inserted successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      loadData();
    } catch (error) {
      console.error('Error saving called call:', error);
      toast({
        title: 'Save Failed',
        description: error.response?.data?.message || 'Could not save called call record.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sales call record?')) {
      return;
    }

    try {
      await deleteCalledCall(id);
      toast({
        title: 'Record Deleted',
        description: 'Called call record has been removed.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error.response?.data?.message || 'Could not delete record.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    toast({
      title: 'Copied',
      description: `Phone number ${phone} copied to clipboard`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleExportCSV = () => {
    if (!calls || calls.length === 0) {
      toast({
        title: 'No Data',
        description: 'No called calls to export.',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    const headers = [
      'No.',
      'Customer Name',
      'Phone Number',
      'Call Date',
      'Call Result',
      'Company',
      'Notes',
      'Agent',
    ];

    const rows = calls.map((c, idx) => [
      idx + 1,
      `"${c.customerName || c.clientName || ''}"`,
      `"${c.phoneNumber || ''}"`,
      `"${c.callDate ? new Date(c.callDate).toLocaleDateString() : ''}"`,
      `"${c.callResult || c.callStatus || ''}"`,
      `"${c.companyName || ''}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      `"${c.salesAgentName || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `call_sales_table_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box w="100%" minW={0}>
      {/* Top Banner */}
      <Box
        bg="white"
        _dark={{ bg: 'gray.800', color: 'gray.100', borderColor: 'gray.700' }}
        color="#132238"
        p={{ base: 4, md: 5 }}
        borderRadius="14px"
        mb={5}
        boxShadow="0 6px 20px rgba(15, 23, 42, 0.055)"
        border="1px solid"
        borderColor="#e2e8f0"
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          gap={4}
        >
          <Box>
            <HStack spacing={3} mb={1}>
              <Box p={2} bg="#e6f7f5" color="#0b8f7d" _dark={{ bg: 'whiteAlpha.100', color: 'teal.200' }} borderRadius="10px">
                <FaPhoneVolume size={20} />
              </Box>
              <Heading size="lg" fontWeight="800" letterSpacing="-0.03em" color="#132238" _dark={{ color: 'gray.100' }}>
                Call Sales Table Formats
              </Heading>
            </HStack>
            <Text color="#64748b" _dark={{ color: 'gray.400' }} fontSize="sm">
              Here’s a simple table for tracking sales calls and customers.
            </Text>
          </Box>

          <HStack spacing={3} wrap="wrap">
            <Button
              leftIcon={<FaFileExcel />}
              colorScheme="teal"
              variant="solid"
              size="md"
              bg="#0d9488"
              _hover={{ bg: '#0f766e' }}
              onClick={handleOpenImport}
            >
              Import Excel
            </Button>
            <Button
              leftIcon={<FaFileDownload />}
              variant="outline"
              colorScheme="teal"
              size="md"
              color="#087f70"
              borderColor="#0d9488"
              _hover={{ bg: '#f0fdfa' }}
              onClick={handleExportCSV}
            >
              Export
            </Button>
            <Button
              leftIcon={<FiRefreshCw />}
              variant="ghost"
              color="#475569"
              size="md"
              _hover={{ bg: '#f0fdfa', color: '#087f70' }}
              onClick={() => loadData()}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="teal"
              size="md"
              boxShadow="0 4px 14px rgba(13, 148, 136, 0.22)"
              _hover={{ transform: 'translateY(-1px)', boxShadow: '0 6px 18px rgba(13, 148, 136, 0.30)' }}
              onClick={handleOpenAdd}
            >
              Insert Call Data
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* KPI / Statistics Cards */}
      <SimpleGrid columns={{ base: 2, sm: 2, lg: 5 }} spacing={4} mb={6}>
        <Card bg="white" _dark={{ bg: 'gray.800', borderColor: 'teal.400' }} shadow="sm" borderRadius="xl" borderTop="3px solid" borderColor="teal.500">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                Total Calls
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="extrabold" color="teal.600">
                {stats.totalCalls}
              </StatNumber>
              <StatHelpText fontSize="xs" mb={0}>
                Lifetime calls
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" _dark={{ bg: 'gray.800', borderColor: 'teal.400' }} shadow="sm" borderRadius="xl" borderTop="3px solid" borderColor="teal.500">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                Today's Calls
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="extrabold" color="teal.600">
                {stats.todayCalls}
              </StatNumber>
              <StatHelpText fontSize="xs" mb={0}>
                Logged today
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" _dark={{ bg: 'gray.800', borderColor: 'teal.400' }} shadow="sm" borderRadius="xl" borderTop="3px solid" borderColor="teal.500">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                Interested
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="extrabold" color="teal.600">
                {stats.interestedCount}
              </StatNumber>
              <StatHelpText fontSize="xs" mb={0}>
                Prospects
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" _dark={{ bg: 'gray.800', borderColor: 'teal.400' }} shadow="sm" borderRadius="xl" borderTop="3px solid" borderColor="teal.500">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                Deals Closed
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="extrabold" color="teal.600">
                {stats.dealClosedCount}
              </StatNumber>
              <StatHelpText fontSize="xs" mb={0}>
                Converted
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" _dark={{ bg: 'gray.800', borderColor: 'teal.400' }} shadow="sm" borderRadius="xl" borderTop="3px solid" borderColor="teal.500">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                No Answer / Busy
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="extrabold" color="teal.600">
                {stats.noAnswerCount}
              </StatNumber>
              <StatHelpText fontSize="xs" mb={0}>
                Follow-up required
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filter and Search Bar */}
      <Card bg="white" _dark={{ bg: 'gray.800' }} shadow="sm" borderRadius="xl" mb={6}>
        <CardBody p={4}>
          <Flex direction={{ base: 'column', md: 'row' }} gap={3} align="center">
            <Box flex="1" w="100%">
              <form onSubmit={handleSearchSubmit}>
                <InputGroup size="md">
                  <InputLeftElement pointerEvents="none">
                    <FaSearch color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by Customer Name, Phone Number, notes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    borderRadius="lg"
                  />
                </InputGroup>
              </form>
            </Box>

            <HStack spacing={2} w={{ base: '100%', md: 'auto' }}>
              <Select
                size="md"
                w={{ base: '100%', md: '200px' }}
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                borderRadius="lg"
              >
                <option value="All">All Call Results</option>
                {CALL_RESULT_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>

              {(search || resultFilter !== 'All') && (
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => {
                    setSearch('');
                    setResultFilter('All');
                    loadData('', 'All');
                  }}
                >
                  Clear
                </Button>
              )}
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Main Table: Exact Formats */}
      <Card bg="white" _dark={{ bg: 'gray.800', borderColor: 'gray.700' }} shadow="sm" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.100">
        <Box className="called-call-table-heading" p={4} borderBottom="1px solid" borderColor="gray.100" bg="gray.50" _dark={{ bg: '#202b3b', borderColor: 'gray.700' }}>
          <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} gap={3} flexWrap="wrap">
            <Box>
              <Text fontSize="md" fontWeight="bold" color="gray.800" _dark={{ color: 'gray.100' }}>
                Call Sales Table
              </Text>
              <HStack spacing={2} mt={1} flexWrap="wrap">
                <Button
                  size="xs"
                  variant={detailsFilter === 'all' ? 'solid' : 'ghost'}
                  colorScheme="teal"
                  borderRadius="full"
                  onClick={() => setDetailsFilter('all')}
                >
                  All ({calls.length})
                </Button>
                <Button
                  size="xs"
                  variant={detailsFilter === 'needs_details' ? 'solid' : 'ghost'}
                  colorScheme="purple"
                  borderRadius="full"
                  onClick={() => setDetailsFilter('needs_details')}
                >
                  Needs Details ({calls.filter(c => (c.customerName || '').startsWith('Prospect ') || !c.companyName).length})
                </Button>
                <Button
                  size="xs"
                  variant={detailsFilter === 'complete' ? 'solid' : 'ghost'}
                  colorScheme="green"
                  borderRadius="full"
                  onClick={() => setDetailsFilter('complete')}
                >
                  Complete ({calls.filter(c => !(c.customerName || '').startsWith('Prospect ') && Boolean(c.companyName)).length})
                </Button>
              </HStack>
            </Box>
            <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={<FaFileExcel />}
                colorScheme="teal"
                variant="outline"
                onClick={handleOpenImport}
              >
                Import Excel
              </Button>
              <Button
                size="sm"
                leftIcon={<FaPlus />}
                colorScheme="teal"
                onClick={handleOpenAdd}
              >
                Add Row
              </Button>
            </HStack>
          </Flex>
        </Box>

        {loading ? (
          <Flex justify="center" align="center" minH="260px" direction="column" gap={3}>
            <Spinner size="xl" color="teal.500" thickness="4px" />
            <Text color="gray.500" fontSize="sm">
              Loading sales calls...
            </Text>
          </Flex>
        ) : calls.length === 0 ? (
          <Flex justify="center" align="center" minH="280px" direction="column" p={8} textAlign="center">
            <Box p={4} bg="teal.50" color="teal.600" _dark={{ bg: 'whiteAlpha.100', color: 'teal.300' }} borderRadius="full" mb={4}>
              <FaPhoneVolume size={36} />
            </Box>
            <Heading size="md" color="gray.700" _dark={{ color: 'gray.100' }} mb={2}>
              No Calls Logged Yet
            </Heading>
            <Text color="gray.500" _dark={{ color: 'gray.300' }} maxW="420px" mb={5} fontSize="sm">
              Use the table or import your spreadsheet to insert sales calls data.
            </Text>
            <HStack spacing={3}>
              <Button leftIcon={<FaFileExcel />} colorScheme="teal" variant="outline" onClick={handleOpenImport}>
                Import Excel
              </Button>
              <Button leftIcon={<FaPlus />} colorScheme="teal" onClick={handleOpenAdd}>
                Insert First Call
              </Button>
            </HStack>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" size="md">
              <Thead bg="#edf8f7" _dark={{ bg: 'whiteAlpha.100' }}>
                <Tr>
                  <Th color="#475569" _dark={{ color: 'gray.300' }} width="70px" textAlign="center">
                    No.
                  </Th>
                  <Th color="#475569" _dark={{ color: 'gray.300' }}>Customer Name</Th>
                  <Th color="#475569" _dark={{ color: 'gray.300' }}>Phone Number</Th>
                  <Th color="#475569" _dark={{ color: 'gray.300' }}>Call Date</Th>
                  <Th color="#475569" _dark={{ color: 'gray.300' }}>Call Result</Th>
                  <Th color="#475569" _dark={{ color: 'gray.300' }} textAlign="center" width="160px">
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {calls
                  .filter((call) => {
                    const isNeeds = (call.customerName || '').startsWith('Prospect ') || !call.companyName;
                    if (detailsFilter === 'needs_details') return isNeeds;
                    if (detailsFilter === 'complete') return !isNeeds;
                    return true;
                  })
                  .map((call, index) => {
                  const currentResult = call.callResult || call.callStatus || 'Interested';
                  const resultConf = RESULT_CONFIG[currentResult] || {
                    color: 'gray',
                    label: currentResult,
                  };
                  const isNeedsDetails = (call.customerName || '').startsWith('Prospect ') || !call.companyName;

                  return (
                    <Tr
                      key={call._id}
                      _hover={{ bg: 'teal.50' }}
                      transition="background-color 0.15s ease"
                    >
                      {/* No. */}
                      <Td fontWeight="bold" color="gray.600" textAlign="center">
                        {index + 1}
                      </Td>

                      {/* Customer Name */}
                      <Td>
                        <VStack align="start" spacing={0.5}>
                          <HStack spacing={2}>
                            <Text fontWeight="bold" color="gray.800" fontSize="sm">
                              {call.customerName || call.clientName}
                            </Text>
                            {isNeedsDetails && (
                              <Badge colorScheme="purple" fontSize="9px" px={1.5} py={0.5} borderRadius="full">
                                Needs Details
                              </Badge>
                            )}
                          </HStack>
                          {call.companyName ? (
                            <HStack spacing={1} color="gray.500" fontSize="xs">
                              <FaBuilding size={10} />
                              <Text>{call.companyName}</Text>
                              {call.city && <Text>• {call.city}</Text>}
                            </HStack>
                          ) : (
                            <Text color="gray.400" fontSize="xs" fontStyle="italic">
                              Company not set
                            </Text>
                          )}
                        </VStack>
                      </Td>

                      {/* Phone Number */}
                      <Td>
                        <HStack spacing={1.5}>
                          <Text fontSize="sm" fontWeight="semibold" color="teal.700">
                            {call.phoneNumber}
                          </Text>
                          <Tooltip label="Copy phone">
                            <IconButton
                              icon={<FaCopy size={11} />}
                              size="xs"
                              variant="ghost"
                              onClick={() => handleCopyPhone(call.phoneNumber)}
                              aria-label="Copy phone"
                            />
                          </Tooltip>
                          <Tooltip label="Call now">
                            <IconButton
                              as="a"
                              href={`tel:${call.phoneNumber}`}
                              icon={<FaPhoneAlt size={11} />}
                              size="xs"
                              colorScheme="teal"
                              variant="ghost"
                              aria-label="Call directly"
                            />
                          </Tooltip>
                        </HStack>
                      </Td>

                      {/* Call Date */}
                      <Td fontSize="sm" color="gray.700" whiteSpace="nowrap">
                        {formatDate(call.callDate)}
                      </Td>

                      {/* Call Result */}
                      <Td>
                        <Badge
                          colorScheme={resultConf.color}
                          px={2.5}
                          py={0.5}
                          borderRadius="full"
                          textTransform="capitalize"
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {resultConf.label}
                        </Badge>
                      </Td>

                      {/* Actions */}
                      <Td textAlign="center">
                        <HStack spacing={1.5} justify="center">
                          {isNeedsDetails ? (
                            <Button
                              size="xs"
                              colorScheme="teal"
                              variant="solid"
                              leftIcon={<FaEdit size={10} />}
                              onClick={() => handleOpenEdit(call)}
                              title="Insert remaining customer details"
                            >
                              Insert Details
                            </Button>
                          ) : (
                            <Tooltip label="Edit">
                              <IconButton
                                icon={<FaEdit size={13} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="yellow"
                                aria-label="Edit Call"
                                onClick={() => handleOpenEdit(call)}
                              />
                            </Tooltip>
                          )}

                          <Tooltip label="View Details">
                            <IconButton
                              icon={<FaInfoCircle size={13} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              aria-label="View Details"
                              onClick={() => {
                                setSelectedCall(call);
                                onDetailOpen();
                              }}
                            />
                          </Tooltip>

                          <Tooltip label="Delete">
                            <IconButton
                              icon={<FaTrash size={13} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              aria-label="Delete Call"
                              onClick={() => handleDelete(call._id)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>

      {/* Insert / Edit Modal Dialog */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <form onSubmit={handleSave}>
            <ModalHeader borderBottom="1px solid" borderColor="gray.100" pb={3}>
              <HStack spacing={2.5}>
                <Box p={2} bg="teal.50" color="teal.600" borderRadius="md">
                  <FaPhoneVolume size={18} />
                </Box>
                <Box>
                  <Text fontSize="lg" fontWeight="bold">
                    {editingId ? 'Edit Sales Call Entry' : 'Insert Call Sales Data'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Log customer details and call result.
                  </Text>
                </Box>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody py={4}>
              <VStack spacing={3.5} align="stretch">
                {/* Customer Name */}
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    Customer Name
                  </FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g., Abebe Kebede"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    borderRadius="md"
                  />
                </FormControl>

                {/* Phone Number */}
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    Phone Number
                  </FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g., 0911223344"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    borderRadius="md"
                  />
                </FormControl>

                {/* Call Date */}
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    Call Date
                  </FormLabel>
                  <Input
                    size="sm"
                    type="date"
                    value={formData.callDate}
                    onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                    borderRadius="md"
                  />
                </FormControl>

                {/* Call Result */}
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">
                    Call Result
                  </FormLabel>
                  <Select
                    size="sm"
                    value={formData.callResult}
                    onChange={(e) => setFormData({ ...formData, callResult: e.target.value })}
                    borderRadius="md"
                  >
                    {CALL_RESULT_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {/* Company Name (Optional) */}
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="semibold" color="gray.600">
                    Company / Organization (Optional)
                  </FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g., Tana Trading PLC"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    borderRadius="md"
                  />
                </FormControl>

                {/* Conversation Notes (Optional) */}
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="semibold" color="gray.600">
                    Call Notes & Comments (Optional)
                  </FormLabel>
                  <Textarea
                    size="sm"
                    rows={3}
                    placeholder="Key points discussed during call..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    borderRadius="md"
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter borderTop="1px solid" borderColor="gray.100" pt={3}>
              <Button variant="ghost" mr={3} onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="teal"
                isLoading={saving}
                size="sm"
                leftIcon={<FaCheckCircle />}
              >
                {editingId ? 'Update Record' : 'Save Call Data'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Detail Modal */}
      {selectedCall && (
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="md">
          <ModalOverlay />
          <ModalContent borderRadius="xl">
            <ModalHeader borderBottom="1px solid" borderColor="gray.100">
              <HStack justify="space-between">
                <Text fontSize="md" fontWeight="bold">
                  {selectedCall.customerName || selectedCall.clientName}
                </Text>
                <Badge
                  colorScheme={RESULT_CONFIG[selectedCall.callResult || selectedCall.callStatus]?.color || 'gray'}
                  borderRadius="full"
                  px={2.5}
                >
                  {selectedCall.callResult || selectedCall.callStatus}
                </Badge>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={4}>
              <VStack align="stretch" spacing={3} fontSize="sm">
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="bold">
                    PHONE & CONTACT
                  </Text>
                  <HStack mt={1}>
                    <Text fontWeight="semibold">{selectedCall.phoneNumber}</Text>
                    <Button
                      as="a"
                      href={`tel:${selectedCall.phoneNumber}`}
                      size="xs"
                      colorScheme="teal"
                      leftIcon={<FaPhoneAlt />}
                    >
                      Call Now
                    </Button>
                  </HStack>
                  {selectedCall.email && <Text color="gray.600">{selectedCall.email}</Text>}
                </Box>

                <SimpleGrid columns={2} spacing={2}>
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold">
                      CALL DATE
                    </Text>
                    <Text fontWeight="medium">{formatDate(selectedCall.callDate)}</Text>
                  </Box>

                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold">
                      CALL RESULT
                    </Text>
                    <Text fontWeight="semibold">
                      {selectedCall.callResult || selectedCall.callStatus}
                    </Text>
                  </Box>
                </SimpleGrid>

                {selectedCall.companyName && (
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold">
                      COMPANY
                    </Text>
                    <Text>
                      {selectedCall.companyName} {selectedCall.city ? `(${selectedCall.city})` : ''}
                    </Text>
                  </Box>
                )}

                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="bold">
                    NOTES
                  </Text>
                  <Box bg="gray.50" p={3} borderRadius="md" mt={1}>
                    <Text whiteSpace="pre-wrap" color="gray.700">
                      {selectedCall.notes || 'No notes provided.'}
                    </Text>
                  </Box>
                </Box>

                <Divider />

                <Flex justify="space-between" fontSize="xs" color="gray.500">
                  <Text>Agent: {selectedCall.salesAgentName || 'Sales Agent'}</Text>
                  <Text>ID: {selectedCall._id?.slice(-6)}</Text>
                </Flex>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button
                size="sm"
                variant="outline"
                colorScheme="yellow"
                mr={2}
                onClick={() => {
                  onDetailClose();
                  handleOpenEdit(selectedCall);
                }}
              >
                Edit
              </Button>
              <Button size="sm" onClick={onDetailClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Excel Import Modal */}
      <Modal isOpen={isImportOpen} onClose={onImportClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader borderBottom="1px solid" borderColor="gray.100" pb={3}>
            <HStack spacing={2.5}>
              <Box p={2} bg="green.50" color="green.600" borderRadius="md">
                <FaFileExcel size={20} />
              </Box>
              <Box>
                <Text fontSize="lg" fontWeight="bold">
                  Import Phone Numbers from Excel / CSV
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Accepts phone numbers in any format. Accept the numbers now and insert the remaining customer details afterward.
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={4}>
            <VStack spacing={4} align="stretch">
              {/* File upload box */}
              <Box
                borderWidth="2px"
                borderStyle="dashed"
                borderColor={importFile ? 'green.400' : 'gray.300'}
                borderRadius="xl"
                p={5}
                textAlign="center"
                bg={importFile ? 'green.50' : 'gray.50'}
                _dark={{ bg: 'whiteAlpha.50', borderColor: 'gray.600' }}
                cursor="pointer"
                onClick={() => fileInputRef.current?.click()}
                _hover={{ borderColor: 'teal.500', bg: 'teal.50' }}
                transition="all 0.2s"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processFile(file);
                    e.target.value = '';
                  }}
                />
                <Icon as={FiUploadCloud} boxSize={8} color="teal.500" mb={2} />
                <Text fontSize="sm" fontWeight="bold" color="gray.700" _dark={{ color: 'gray.200' }}>
                  {importFile ? importFile.name : 'Click to select or drag & drop an Excel file (.xlsx, .xls, .csv)'}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Accepts standard (+251..., 09..., 07...), 9-digit, spaces, or international phone numbers across any column.
                </Text>
              </Box>

              {isParsing && (
                <Flex align="center" justify="center" py={4} gap={3}>
                  <Spinner size="md" color="teal.500" />
                  <Text fontSize="sm" color="gray.600">Reading and validating phone numbers...</Text>
                </Flex>
              )}

              {/* Stats badges */}
              {importStats.total > 0 && !isParsing && (
                <SimpleGrid columns={3} spacing={3}>
                  <Box p={3} bg="gray.50" _dark={{ bg: 'whiteAlpha.100' }} borderRadius="md" textAlign="center">
                    <Text fontSize="xs" color="gray.500">Rows in File</Text>
                    <Text fontSize="lg" fontWeight="bold">{importStats.total}</Text>
                  </Box>
                  <Box p={3} bg="green.50" _dark={{ bg: 'green.900' }} borderRadius="md" textAlign="center">
                    <Text fontSize="xs" color="green.700" _dark={{ color: 'green.200' }}>Accepted Phones</Text>
                    <Text fontSize="lg" fontWeight="bold" color="green.600" _dark={{ color: 'green.300' }}>{importStats.valid}</Text>
                  </Box>
                  <Box p={3} bg="orange.50" _dark={{ bg: 'orange.900' }} borderRadius="md" textAlign="center">
                    <Text fontSize="xs" color="orange.700" _dark={{ color: 'orange.200' }}>Skipped (No Phone)</Text>
                    <Text fontSize="lg" fontWeight="bold" color="orange.600" _dark={{ color: 'orange.300' }}>{importStats.invalid}</Text>
                  </Box>
                </SimpleGrid>
              )}

              {/* Batch Defaults */}
              {parsedRows.length > 0 && (
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} p={3} bg="gray.50" _dark={{ bg: 'whiteAlpha.50' }} borderRadius="lg">
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Default Initial Call Result</FormLabel>
                    <Select
                      size="sm"
                      value={defaultResult}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDefaultResult(val);
                        setParsedRows(prev => prev.map(r => ({ ...r, callResult: val })));
                      }}
                      borderRadius="md"
                    >
                      {CALL_RESULT_OPTIONS.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Default Initial Note</FormLabel>
                    <Input
                      size="sm"
                      value={defaultNote}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDefaultNote(val);
                        setParsedRows(prev => prev.map(r => ({ ...r, notes: val })));
                      }}
                      borderRadius="md"
                      placeholder="e.g. Imported from Excel"
                    />
                  </FormControl>
                </SimpleGrid>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                    Preview (showing first {Math.min(5, parsedRows.length)} of {parsedRows.length} accepted rows):
                  </Text>
                  <Box overflowX="auto" maxH="200px" overflowY="auto" borderWidth="1px" borderColor="gray.200" borderRadius="md">
                    <Table size="xs" variant="simple">
                      <Thead bg="gray.100" _dark={{ bg: 'gray.700' }}>
                        <Tr>
                          <Th>#</Th>
                          <Th>Phone Number</Th>
                          <Th>Customer Name</Th>
                          <Th>Company</Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {parsedRows.slice(0, 10).map((r, i) => (
                          <Tr key={r.id}>
                            <Td>{i + 1}</Td>
                            <Td fontWeight="semibold" color="teal.600">{r.phoneNumber}</Td>
                            <Td>{r.customerName}</Td>
                            <Td>{r.companyName || '-'}</Td>
                            <Td><Badge colorScheme="green" fontSize="9px">{r.callResult}</Badge></Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                  <Text fontSize="2xs" color="gray.500" mt={1}>
                    Remaining fields can be inserted/edited for each record anytime directly in the table.
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter borderTop="1px solid" borderColor="gray.100" pt={3}>
            <Button variant="ghost" size="sm" mr={3} onClick={onImportClose}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              size="sm"
              leftIcon={<FaCheckCircle />}
              isDisabled={parsedRows.length === 0}
              isLoading={isImporting}
              loadingText="Importing..."
              onClick={handleConfirmImport}
            >
              Accept & Insert {parsedRows.length} Calls
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CalledCallPage;
