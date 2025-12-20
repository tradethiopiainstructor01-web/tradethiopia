import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  Spinner,
  VStack,
  HStack,
  Spacer,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Icon,
  SimpleGrid,
  Textarea
} from '@chakra-ui/react';
import { SearchIcon, RepeatIcon } from '@chakra-ui/icons';
import { FiUser, FiPhone, FiCalendar, FiEdit, FiBookOpen } from 'react-icons/fi';
import { getFilteredCustomers, getAllAgents, createReceptionCustomer, normalizePhoneNumber } from '../services/receptionService';
import { debounce } from '../utils/debounce';

const ReceptionDashboard = () => {
  // State management
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    phone: '',
    agent: '',
    customerId: '',
    dateFrom: '',
    dateTo: '',
    productInterest: ''
  });
  const [resultsCount, setResultsCount] = useState(0);
  const toast = useToast();
  const [newCustomerForm, setNewCustomerForm] = useState({
    customerName: '',
    phone: '',
    productInterest: '',
    note: ''
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Load agents for dropdown
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const agentList = await getAllAgents();
        setAgents(agentList);
      } catch (error) {
        toast({
          title: 'Error loading agents',
          description: error.message || 'Failed to load agents',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    };

    loadAgents();
  }, [toast]);

  // Fetch customers with debouncing
  const fetchCustomers = useCallback(async (searchFilters) => {
    setLoading(true);
    try {
      const data = await getFilteredCustomers(searchFilters);
      setCustomers(data);
      setResultsCount(data.length);
    } catch (error) {
      toast({
        title: 'Error fetching customers',
        description: error.message || 'Failed to fetch customers',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      setCustomers([]);
      setResultsCount(0);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((filters) => fetchCustomers(filters), 300),
    [fetchCustomers]
  );

  // Apply filters when they change
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      name: '',
      phone: '',
      agent: '',
      customerId: '',
      dateFrom: '',
      dateTo: '',
      productInterest: ''
    });
  };

  const handleNewCustomerChange = (field, value) => {
    setNewCustomerForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerForm.customerName.trim() || !newCustomerForm.phone.trim()) {
      toast({
        title: 'Missing information',
        description: 'Customer name and phone are required for reception leads.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setCreatingCustomer(true);
    try {
      await createReceptionCustomer({
        ...newCustomerForm,
        phone: normalizePhoneNumber(newCustomerForm.phone)
      });
      toast({
        title: 'Lead saved',
        description: 'The customer is queued for assignment.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      setNewCustomerForm({
        customerName: '',
        phone: '',
        productInterest: '',
        note: ''
      });
      fetchCustomers(filters);
    } catch (error) {
      toast({
        title: 'Creation failed',
        description: error.response?.data?.message || 'Unable to save the customer.',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Highlight matched text in results
  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: '#ffff00', padding: '0 2px' }}>
          {part}
        </mark>
      ) : part
    );
  };

  // Status badge colors
  const getStatusColor = (status) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'new':
        return 'green';
      case 'pending assignment':
        return 'orange';
      case 'assigned':
        return 'blue';
      case 'in progress':
        return 'cyan';
      case 'closed':
      case 'completed':
        return 'teal';
      default:
        return 'gray';
    }
  };

  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">Reception Dashboard</Text>
        <Text fontSize="sm" color="gray.500">
          Showing {resultsCount} records
        </Text>
      </Flex>

      {/* Reception lead capture */}
      <Box
        mb={6}
        p={4}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        bg={bgColor}
      >
        <Text fontWeight="semibold" mb={2}>
          Log new customer
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          <Input
            placeholder="Customer Name"
            value={newCustomerForm.customerName}
            onChange={(e) => handleNewCustomerChange('customerName', e.target.value)}
          />
          <Input
            placeholder="Phone Number"
            value={newCustomerForm.phone}
            onChange={(e) => handleNewCustomerChange('phone', e.target.value)}
          />
          <Input
            placeholder="Product Interest"
            value={newCustomerForm.productInterest}
            onChange={(e) => handleNewCustomerChange('productInterest', e.target.value)}
          />
        </SimpleGrid>
        <Textarea
          mt={3}
          placeholder="Notes (optional)"
          value={newCustomerForm.note}
          onChange={(e) => handleNewCustomerChange('note', e.target.value)}
          rows={3}
        />
        <Button
          mt={3}
          colorScheme="blue"
          onClick={handleCreateCustomer}
          isLoading={creatingCustomer}
        >
          Add customer to queue
        </Button>
      </Box>

      {/* Filter Section - Sticky on scroll */}
      <Box
        position="sticky"
        top="0"
        zIndex="10"
        bg={bgColor}
        p={4}
        mb={6}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="md"
      >
        <VStack spacing={4} align="stretch">
          {/* Filter Inputs */}
          <Flex wrap="wrap" gap={3}>
            <InputGroup flex="1" minW="200px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiUser} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Customer Name"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
              />
            </InputGroup>

            <InputGroup flex="1" minW="200px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiPhone} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Phone Number"
                value={filters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
              />
            </InputGroup>

            <Select
              flex="1"
              minW="200px"
              placeholder="Select Agent"
              value={filters.agent}
              onChange={(e) => handleFilterChange('agent', e.target.value)}
            >
              {agents.map(agent => (
                <option key={agent._id} value={agent._id}>
                  {agent.username || agent.name || agent.fullName || 'Unnamed Agent'}
                </option>
              ))}
            </Select>

            <InputGroup flex="1" minW="200px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiBookOpen} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Product Interest"
                value={filters.productInterest}
                onChange={(e) => handleFilterChange('productInterest', e.target.value)}
              />
            </InputGroup>

            <InputGroup flex="1" minW="200px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiUser} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Customer ID"
                value={filters.customerId}
                onChange={(e) => handleFilterChange('customerId', e.target.value)}
              />
            </InputGroup>

            <InputGroup flex="1" minW="150px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiCalendar} color="gray.400" />
              </InputLeftElement>
              <Input
                type="date"
                placeholder="From"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </InputGroup>

            <InputGroup flex="1" minW="150px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiCalendar} color="gray.400" />
              </InputLeftElement>
              <Input
                type="date"
                placeholder="To"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </InputGroup>

            <Button
              leftIcon={<RepeatIcon />}
              onClick={resetFilters}
              colorScheme="gray"
            >
              Reset
            </Button>
          </Flex>
        </VStack>
      </Box>

      {/* Results Counter */}
      <Flex mb={4} align="center">
        <Text fontSize="sm" color="gray.500">
          Showing {resultsCount} of {customers.length} records
        </Text>
        <Spacer />
        {loading && <Spinner size="sm" mr={2} />}
      </Flex>

      {/* Data Table */}
      <Box
        bg={bgColor}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
      >
        <Table variant="simple">
          <Thead bg={headerBg}>
          <Tr>
            <Th>Customer Name</Th>
            <Th>Phone Number</Th>
            <Th>Product Interest</Th>
            <Th>Status</Th>
            <Th>Assigned Agent</Th>
            <Th>Created Date</Th>
            <Th>Actions</Th>
          </Tr>
          </Thead>
          <Tbody>
            {customers.map((customer) => (
            <Tr 
                key={customer._id} 
                _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                transition="background-color 0.2s"
              >
                <Td>
                  <Text fontWeight="medium">
                    {highlightMatch(customer.customerName || '', filters.name)}
                  </Text>
                </Td>
                <Td>
                  <Text>
                    {highlightMatch(customer.phone || '', filters.phone)}
                  </Text>
                </Td>
                <Td>
                  <Badge colorScheme="purple" variant="subtle">
                    {highlightMatch(customer.productInterest || customer.courseName || 'General Inquiry', filters.productInterest)}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={getStatusColor(customer.pipelineStatus || customer.followupStatus)}>
                    {customer.pipelineStatus || customer.followupStatus || 'Pending Assignment'}
                  </Badge>
                </Td>
                <Td>
                  <Text>
                    {customer.agentName || 'Pending assignment'}
                  </Text>
                </Td>
                <Td>
                  {new Date(customer.createdAt || customer.date).toLocaleDateString()}
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Edit customer"
                      icon={<FiEdit />}
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {customers.length === 0 && !loading && (
          <Flex justify="center" align="center" p={10}>
            <Text color="gray.500">No customers found</Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default ReceptionDashboard;
