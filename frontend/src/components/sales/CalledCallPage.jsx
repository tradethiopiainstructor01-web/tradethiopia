import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import {
  FaPhoneAlt,
  FaPhoneVolume,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFileDownload,
  FaCheckCircle,
  FaCopy,
  FaBuilding,
  FaInfoCircle,
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import {
  fetchCalledCalls,
  createCalledCall,
  updateCalledCall,
  deleteCalledCall,
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

  // Modal State for Add / Edit
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Detail View Modal State
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();
  const [selectedCall, setSelectedCall] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (resultFilter !== 'All') params.callResult = resultFilter;

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
    <Box p={{ base: 3, md: 6 }} maxW="1600px" mx="auto">
      {/* Top Banner */}
      <Box
        bg="gray.900"
        color="white"
        p={{ base: 5, md: 6 }}
        borderRadius="2xl"
        mb={6}
        boxShadow="xl"
        border="1px solid"
        borderColor="whiteAlpha.200"
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          gap={4}
        >
          <Box>
            <HStack spacing={3} mb={1}>
              <Box p={2} bg="teal.500" color="white" borderRadius="lg">
                <FaPhoneVolume size={20} />
              </Box>
              <Heading size="lg" fontWeight="extrabold" letterSpacing="tight">
                Call Sales Table Formats
              </Heading>
            </HStack>
            <Text color="gray.300" fontSize="md">
              Here’s a simple table for tracking sales calls and customers.
            </Text>
          </Box>

          <HStack spacing={3} wrap="wrap">
            <Button
              leftIcon={<FaFileDownload />}
              variant="outline"
              colorScheme="teal"
              size="md"
              color="white"
              borderColor="teal.400"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={handleExportCSV}
            >
              Export
            </Button>
            <Button
              leftIcon={<FiRefreshCw />}
              variant="ghost"
              color="gray.300"
              size="md"
              _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
              onClick={loadData}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="teal"
              size="md"
              boxShadow="0 4px 14px rgba(14, 140, 128, 0.4)"
              _hover={{ transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(14, 140, 128, 0.6)' }}
              onClick={handleOpenAdd}
            >
              Insert Call Data
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* KPI / Statistics Cards */}
      <SimpleGrid columns={{ base: 2, sm: 2, lg: 5 }} spacing={4} mb={6}>
        <Card bg="white" shadow="sm" borderRadius="xl" borderTop="4px solid" borderColor="teal.500">
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

        <Card bg="white" shadow="sm" borderRadius="xl" borderTop="4px solid" borderColor="blue.500">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                Today's Calls
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="extrabold" color="blue.600">
                {stats.todayCalls}
              </StatNumber>
              <StatHelpText fontSize="xs" mb={0}>
                Logged today
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" shadow="sm" borderRadius="xl" borderTop="4px solid" borderColor="green.500">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                Interested
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="extrabold" color="green.600">
                {stats.interestedCount}
              </StatNumber>
              <StatHelpText fontSize="xs" mb={0}>
                Prospects
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" shadow="sm" borderRadius="xl" borderTop="4px solid" borderColor="purple.500">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                Deals Closed
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="extrabold" color="purple.600">
                {stats.dealClosedCount}
              </StatNumber>
              <StatHelpText fontSize="xs" mb={0}>
                Converted
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" shadow="sm" borderRadius="xl" borderTop="4px solid" borderColor="orange.500">
          <CardBody p={4}>
            <Stat>
              <StatLabel fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                No Answer / Busy
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="extrabold" color="orange.600">
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
      <Card bg="white" shadow="sm" borderRadius="xl" mb={6}>
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
      <Card bg="white" shadow="sm" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.100">
        <Box p={4} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="md" fontWeight="bold" color="gray.800">
                Call Sales Table
              </Text>
              <Text fontSize="xs" color="gray.500">
                Showing {calls.length} entries
              </Text>
            </Box>
            <Button
              size="sm"
              leftIcon={<FaPlus />}
              colorScheme="teal"
              onClick={handleOpenAdd}
            >
              Add Row
            </Button>
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
            <Box p={4} bg="teal.50" color="teal.600" borderRadius="full" mb={4}>
              <FaPhoneVolume size={36} />
            </Box>
            <Heading size="md" color="gray.700" mb={2}>
              No Calls Logged Yet
            </Heading>
            <Text color="gray.500" maxW="420px" mb={5} fontSize="sm">
              Use the table or click the button below to insert your sales calls data.
            </Text>
            <Button leftIcon={<FaPlus />} colorScheme="teal" onClick={handleOpenAdd}>
              Insert First Call
            </Button>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" size="md">
              <Thead bg="gray.900">
                <Tr>
                  <Th color="white" width="70px" textAlign="center">
                    No.
                  </Th>
                  <Th color="white">Customer Name</Th>
                  <Th color="white">Phone Number</Th>
                  <Th color="white">Call Date</Th>
                  <Th color="white">Call Result</Th>
                  <Th color="white" textAlign="center" width="120px">
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {calls.map((call, index) => {
                  const currentResult = call.callResult || call.callStatus || 'Interested';
                  const resultConf = RESULT_CONFIG[currentResult] || {
                    color: 'gray',
                    label: currentResult,
                  };

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
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" color="gray.800" fontSize="sm">
                            {call.customerName || call.clientName}
                          </Text>
                          {call.companyName && (
                            <HStack spacing={1} color="gray.500" fontSize="xs">
                              <FaBuilding size={10} />
                              <Text>{call.companyName}</Text>
                              {call.city && <Text>• {call.city}</Text>}
                            </HStack>
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
                        <HStack spacing={1} justify="center">
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
    </Box>
  );
};

export default CalledCallPage;
