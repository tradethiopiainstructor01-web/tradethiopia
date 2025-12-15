import React from 'react';
import { Link } from 'react-router-dom';
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
} from '@chakra-ui/react';
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
import { useTeamRequests } from '../../hooks/useTeamRequests';
import FinanceDashboard from '../../components/finance/FinanceDashboard';
import FinanceLayout from './FinanceLayout';
import MonthlyReport from '../../components/finance/MonthlyReport';
import FinanceMessagesPage from '../FinanceMessagesPage';

const FinanceDashboardPage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const cardTextColor = useColorModeValue('gray.900', 'gray.100');
  const helperTextColor = useColorModeValue('gray.500', 'gray.300');
  const detailTextColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const insetBg = useColorModeValue('gray.50', 'gray.600');

  const {
    requests: teamRequests,
    loading: teamRequestsLoading,
    requestSummary,
    fetchRequests: refreshTeamRequests,
  } = useTeamRequests();

  // Mock data for financial metrics
  const financialMetrics = [
    { title: 'Total Revenue', value: 'ETB 1,245,678', change: '+12.5%', icon: FaDollarSign, color: 'green' },
    { title: 'Total Orders', value: '1,248', change: '+8.2%', icon: FaReceipt, color: 'blue' },
    { title: 'Inventory Value', value: 'ETB 876,432', change: '+5.7%', icon: FaBoxes, color: 'purple' },
    { title: 'Pending Orders', value: '42', change: '-3.1%', icon: FaShoppingCart, color: 'orange' },
    { title: 'Suppliers', value: '24', change: '+2.0%', icon: FaTruck, color: 'teal' },
    { title: 'Customers', value: '156', change: '+4.5%', icon: FaUsers, color: 'pink' }
  ];

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

  const getPriorityColor = (priority) => {
    switch ((priority || 'Medium').toLowerCase()) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      default:
        return 'gray';
    }
  };

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

      <Box mb={8}>
        <Card bg={cardBg} boxShadow="md">
          <CardBody>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
              <Box>
                <Heading size="md">Payroll</Heading>
                <Text color="gray.500" fontSize="sm">
                  View submitted payroll data, adjustments, and approvals without leaving the finance dashboard.
                </Text>
              </Box>
              <Button
                as={Link}
                to="/payroll"
                colorScheme="purple"
                variant="outline"
              >
                Open Payroll
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </Box>

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
                  A quick summary of the most recent department requests.
                </Text>
              </Box>
              <HStack spacing={2}>
                <Button size="sm" variant="outline" onClick={refreshTeamRequests} isLoading={teamRequestsLoading}>
                  Refresh
                </Button>
                <Button size="sm" colorScheme="teal" as={Link} to="/finance/team-requests">
                  Manage requests
                </Button>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody>
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
            <VStack align="stretch" spacing={3}>
              {teamRequestsLoading ? (
                <Text textAlign="center" color={helperTextColor}>Loading requests...</Text>
              ) : teamRequests.length === 0 ? (
                <Text textAlign="center" color={helperTextColor}>No team requests yet.</Text>
              ) : (
                teamRequests.slice(0, 3).map((request) => {
                  const label = request.title || `${request.department || "Team"} request`;
                  return (
                    <Box
                      key={request._id || request.createdAt || label}
                      p={4}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={borderColor}
                      bg={insetBg}
                    >
                      <Flex justify="space-between" align="center" mb={1}>
                        <Text fontWeight="semibold" fontSize="sm" isTruncated maxW="70%">
                          {label}
                        </Text>
                        <Badge colorScheme={getPriorityColor(request.priority)} fontSize="10px">
                          {request.priority || "Medium"}
                        </Badge>
                      </Flex>
                      <HStack spacing={2} fontSize="xs" color="gray.500" mb={1}>
                        <Text>{request.department || "Department"}</Text>
                        <Text>-</Text>
                        <Badge colorScheme={getStatusColor(request.status)} fontSize="xx-small">
                          {request.status || "Pending"}
                        </Badge>
                        <Text>-</Text>
                        <Text>{formatRequestDate(request.createdAt || request.date)}</Text>
                      </HStack>
                      {request.details && (
                        <Text fontSize="sm" color={detailTextColor} noOfLines={2}>
                          {request.details}
                        </Text>
                      )}
                    </Box>
                  );
                })
              )}
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </FinanceLayout>
  );
};

export default FinanceDashboardPage;


