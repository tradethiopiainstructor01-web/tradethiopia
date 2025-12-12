import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Grid,
  GridItem,
  HStack,
  VStack,
  Icon,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  FormControl,
  FormLabel,
  Input,
  Select,
  Tag,
  useToast,
} from '@chakra-ui/react';
import apiClient from '../../utils/apiClient';
import { 
  FaChartBar, 
  FaChartPie, 
  FaMoneyBillWave, 
  FaShoppingCart, 
  FaTruck, 
  FaUsers, 
  FaBoxes,
  FaDollarSign,
  FaReceipt,
  FaBalanceScale,
  FaWarehouse
} from 'react-icons/fa';
import FinanceDashboard from '../../components/finance/FinanceDashboard';
import FinanceLayout from './FinanceLayout';
import MonthlyReport from '../../components/finance/MonthlyReport';
import FinanceMessagesPage from '../FinanceMessagesPage';

const REQUEST_DEPARTMENTS = [
  "Social Media",
  "TradexTV",
  "IT",
  "HR",
  "Sales",
  "Customer Success",
  "Finance",
];
const REQUEST_STATUSES = ["Pending", "Approved", "Completed"];
const REQUEST_PRIORITIES = ["High", "Medium", "Low"];

const FinanceDashboardPage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const cardTextColor = useColorModeValue('gray.900', 'gray.100');
  const helperTextColor = useColorModeValue('gray.500', 'gray.300');
  const detailTextColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const insetBg = useColorModeValue('gray.50', 'gray.600');
  const toast = useToast();
  const initialFilters = { department: "", priority: "", status: "", fromDate: "", toDate: "" };
  const [filters, setFilters] = useState(initialFilters);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };
  const resetFilters = () => {
    setFilters({ ...initialFilters });
  };

  // Mock data for financial metrics
  const financialMetrics = [
    { title: 'Total Revenue', value: 'ETB 1,245,678', change: '+12.5%', icon: FaDollarSign, color: 'green' },
    { title: 'Total Orders', value: '1,248', change: '+8.2%', icon: FaReceipt, color: 'blue' },
    { title: 'Inventory Value', value: 'ETB 876,432', change: '+5.7%', icon: FaBoxes, color: 'purple' },
    { title: 'Pending Orders', value: '42', change: '-3.1%', icon: FaShoppingCart, color: 'orange' },
    { title: 'Suppliers', value: '24', change: '+2.0%', icon: FaTruck, color: 'teal' },
    { title: 'Customers', value: '156', change: '+4.5%', icon: FaUsers, color: 'pink' }
  ];

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const requestSummary = useMemo(() => {
    const total = requests.length;
    const open = requests.filter((req) => (req.status || 'Pending') !== 'Completed').length;
    const highPriority = requests.filter((req) => req.priority === 'High').length;
    return { total, open, highPriority };
  }, [requests]);

  const formatRequestDate = (value) => {
    if (!value) return 'No due date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No due date';
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch ((status || 'Pending').toLowerCase()) {
      case 'approved':
        return 'blue';
      case 'completed':
        return 'green';
      default:
        return 'orange';
    }
  };

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.priority) params.priority = filters.priority;
      if (filters.status) params.status = filters.status;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      const response = await apiClient.get('/requests', { params });
      const payload = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];
      setRequests(payload);
    } catch (err) {
      console.error('Failed to load requests', err);
      toast({
        title: 'Unable to load requests',
        description: err.message || 'Please try again later',
        status: 'error',
      });
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, [
    filters.department,
    filters.priority,
    filters.status,
    filters.fromDate,
    filters.toDate,
    toast,
  ]);

  const handleStatusChange = async (requestId, newStatus) => {
    if (!requestId || !newStatus) return;
    setStatusUpdatingId(requestId);
    try {
      await apiClient.patch(`/requests/${requestId}/status`, { status: newStatus });
      toast({ title: "Status updated", status: "success" });
    } catch (err) {
      console.error("Failed to update request status", err);
      toast({
        title: "Unable to update status",
        description: err.message || "Please try again later",
        status: "error",
      });
    } finally {
      setStatusUpdatingId(null);
      fetchRequests();
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <FinanceLayout>
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading as="h1" size="xl" color={headerColor}>
            Enterprise Finance Dashboard
          </Heading>
          <HStack spacing={3}>
            <Button colorScheme="teal">Generate Report</Button>
            <Button colorScheme="blue">Export Data</Button>
          </HStack>
        </Flex>

        {/* Financial Overview Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 6 }} spacing={6} mb={8}>
          {financialMetrics.map((metric, index) => (
            <Card key={index} bg={cardBg} boxShadow="md">
              <CardBody>
                <Flex justify="space-between" align="center" mb={2}>
                  <Icon as={metric.icon} boxSize={8} color={`${metric.color}.500`} />
                  <Badge colorScheme={metric.change.startsWith('+') ? 'green' : 'red'}>
                    {metric.change}
                  </Badge>
                </Flex>
                <Stat>
                  <StatLabel fontSize="sm" mb={1}>{metric.title}</StatLabel>
                  <StatNumber fontSize="lg" fontWeight="bold">{metric.value}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        <Tabs variant="enclosed" colorScheme="teal" mb={8}>
          <TabList>
            <Tab>Financial Overview</Tab>
            <Tab>Monthly Report</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              {/* Financial Charts and Reports */}
              <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} mb={8}>
                <Card bg={cardBg} boxShadow="md">
                  <CardHeader>
                    <Heading as="h2" size="md">Revenue Overview</Heading>
                  </CardHeader>
                  <CardBody>
                  <Box height="300px" display="flex" alignItems="center" justifyContent="center">
                    <Text color={helperTextColor}>Revenue chart visualization would appear here</Text>
                  </Box>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg} boxShadow="md">
                  <CardHeader>
                    <Heading as="h2" size="md">Top Products</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      {[1, 2, 3, 4, 5].map((item) => (
                        <Flex key={item} justify="space-between" align="center">
                      <Text color={cardTextColor}>Product {item}</Text>
                      <Text fontWeight="bold" color={cardTextColor}>
                        ETB {Math.floor(Math.random() * 10000) + 5000}
                      </Text>
                    </Flex>
                  ))}
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>
            <TabPanel>
              <MonthlyReport />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Box 
          bg={cardBg} 
          boxShadow="md" 
          borderRadius="lg" 
          mb={8} 
          p={{ base: 3, md: 4 }} 
          maxH="600px" 
          overflow="hidden"
        >
          <FinanceMessagesPage embedded />
        </Box>

        {/* Inventory Management Section */}
        <Card bg={cardBg} boxShadow="md" mb={8}>
          <CardHeader>
            <Heading as="h2" size="md">Inventory Management</Heading>
          </CardHeader>
          <CardBody>
            <FinanceDashboard />
          </CardBody>
        </Card>

        {/* Recent Transactions */}
        <Card bg={cardBg} boxShadow="md">
          <CardHeader>
            <Heading as="h2" size="md">Recent Transactions</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              {[1, 2, 3, 4, 5].map((item) => (
                <Flex
                  key={item}
                  justify="space-between"
                  align="center"
                  p={3}
                  borderRadius="md"
                  _hover={{ bg: insetBg }}
                >
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" color={cardTextColor}>
                      Transaction #{1000 + item}
                    </Text>
                    <Text fontSize="sm" color={helperTextColor}>
                      Customer Name {item}
                    </Text>
                  </VStack>
                  <Text fontWeight="bold" color="green.500">+ETB {Math.floor(Math.random() * 5000) + 1000}</Text>
                  <Badge colorScheme="green">Completed</Badge>
                </Flex>
              ))}
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} boxShadow="md" mt={6}>
          <CardHeader>
            <Flex direction={{ base: "column", md: "row" }} align="center" justify="space-between" gap={2}>
              <Box>
                <Heading size="md">Team requests</Heading>
                <Text fontSize="sm" color={helperTextColor}>
                  Finance tracks requests submitted by every department.
                </Text>
              </Box>
              <Button size="sm" variant="outline" onClick={fetchRequests} isLoading={requestsLoading}>
                Refresh
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 5 }} spacing={3} mb={4}>
              <FormControl>
                <FormLabel fontSize="xs">Department</FormLabel>
                <Select
                  value={filters.department}
                  onChange={(event) => handleFilterChange("department", event.target.value)}
                >
                  <option value="">All</option>
                  {REQUEST_DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Priority</FormLabel>
                <Select
                  value={filters.priority}
                  onChange={(event) => handleFilterChange("priority", event.target.value)}
                >
                  <option value="">All</option>
                  {REQUEST_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Status</FormLabel>
                <Select
                  value={filters.status}
                  onChange={(event) => handleFilterChange("status", event.target.value)}
                >
                  <option value="">All</option>
                  {REQUEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">From date</FormLabel>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(event) => handleFilterChange("fromDate", event.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">To date</FormLabel>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(event) => handleFilterChange("toDate", event.target.value)}
                />
              </FormControl>
            </SimpleGrid>
            <HStack spacing={3} mb={4} wrap="wrap">
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Clear filters
              </Button>
              <Button size="sm" colorScheme="teal" onClick={fetchRequests} isLoading={requestsLoading}>
                Apply filters
              </Button>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={4}>
              <Box p={3} borderRadius="md" border="1px solid" borderColor={borderColor} bg={insetBg}>
                <Text fontSize="xs" color={helperTextColor}>
                  Total requests
                </Text>
                <Heading size="md">{requestSummary.total}</Heading>
              </Box>
              <Box p={3} borderRadius="md" border="1px solid" borderColor={borderColor} bg={insetBg}>
                <Text fontSize="xs" color={helperTextColor}>
                  Open
                </Text>
                <Heading size="md">{requestSummary.open}</Heading>
              </Box>
              <Box p={3} borderRadius="md" border="1px solid" borderColor={borderColor} bg={insetBg}>
                <Text fontSize="xs" color={helperTextColor}>
                  High priority
                </Text>
                <Heading size="md">{requestSummary.highPriority}</Heading>
              </Box>
            </SimpleGrid>
            {requestsLoading ? (
              <Text textAlign="center" color={helperTextColor}>
                Loading requests...
              </Text>
            ) : requests.length === 0 ? (
              <Text textAlign="center" color={helperTextColor}>
                No requests have been submitted yet.
              </Text>
            ) : (
              <VStack spacing={3} align="stretch">
                {requests.slice(0, 6).map((request) => {
                  const label =
                    request.title ||
                    `${request.department ? request.department : "Request"} request`;
                  return (
                    <Box
                      key={request._id || request.createdAt}
                      p={3}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={borderColor}
                      bg={insetBg}
                    >
                      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                        <Text fontWeight="semibold" flex="1" isTruncated>
                          {label}
                        </Text>
                        <HStack spacing={2}>
                          <Tag
                            size="sm"
                            colorScheme={
                              request.priority === "High"
                                ? "red"
                                : request.priority === "Medium"
                                ? "orange"
                                : "gray"
                            }
                          >
                            {request.priority || "Medium"}
                          </Tag>
                          <Badge colorScheme={getStatusColor(request.status)}>
                            {request.status || "Pending"}
                          </Badge>
                        </HStack>
                      </Flex>
                      <Text fontSize="xs" color={helperTextColor} mt={1}>
                        {request.department?.toUpperCase() || "GENERAL"} • Due{" "}
                        {formatRequestDate(request.date || request.createdAt)}
                      </Text>
                      <Text fontSize="xs" color={helperTextColor}>
                        Submitted by {request.createdBy || "Team"} on{" "}
                        {formatRequestDate(request.createdAt)}
                      </Text>
                      {request.details && (
                        <Text fontSize="sm" color={detailTextColor} mt={2}>
                          {request.details}
                        </Text>
                      )}
                      <Select
                        size="sm"
                        mt={3}
                        value={request.status || "Pending"}
                        onChange={(event) => handleStatusChange(request._id, event.target.value)}
                        isDisabled={statusUpdatingId === request._id}
                      >
                        {REQUEST_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </CardBody>
        </Card>
      </Box>
    </FinanceLayout>
  );
};

export default FinanceDashboardPage;
