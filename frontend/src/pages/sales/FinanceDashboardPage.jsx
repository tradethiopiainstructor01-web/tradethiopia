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
      <Box py={1} px={2}>
        <Flex justify="space-between" align="center" mb={2}>
          <Heading as="h1" size="md" color={headerColor}>
            Enterprise Finance Dashboard
          </Heading>
        <HStack spacing={1}>
          <Button size="xs" colorScheme="teal" height="24px" minH="unset">Generate Report</Button>
          <Button size="xs" colorScheme="blue" height="24px" minH="unset">Export Data</Button>
        </HStack>
      </Flex>

      <Box mb={3}>
        <Card bg={cardBg} boxShadow="xs" size="sm">
          <CardBody py={2} px={3}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={1}>
              <Box>
                <Heading size="xs">Payroll</Heading>
                <Text color="gray.500" fontSize="xs">
                  View submitted payroll data, adjustments, and approvals without leaving the finance dashboard.
                </Text>
              </Box>
              <Button
                as={Link}
                to="/payroll"
                colorScheme="purple"
                variant="outline"
                size="xs"
                height="24px" minH="unset"
              >
                Open Payroll
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </Box>

      {/* Financial Overview Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 6 }} spacing={2} mb={3}>
        {financialMetrics.map((metric, index) => (
            <Card key={index} bg={cardBg} boxShadow="xs" size="sm">
              <CardBody py={2} px={3}>
                <Flex justify="space-between" align="center" mb={1}>
                  <Icon as={metric.icon} boxSize={5} color={`${metric.color}.500`} />
                  <Badge fontSize="xs" colorScheme={metric.change.startsWith('+') ? 'green' : 'red'} px={1} py={0.5}>
                    {metric.change}
                  </Badge>
                </Flex>
                <Stat>
                  <StatLabel fontSize="xs" mb={0.5}>{metric.title}</StatLabel>
                  <StatNumber fontSize="sm" fontWeight="bold">{metric.value}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        <Tabs variant="enclosed" colorScheme="teal" mb={3} size="sm">
          <TabList>
            <Tab px={3} py={2}>Financial Overview</Tab>
            <Tab px={3} py={2}>Monthly Report</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0} py={2}>
              {/* Financial Charts and Reports */}
              <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={3} mb={4}>
                <Card bg={cardBg} boxShadow="xs" size="sm">
                  <CardHeader py={2} px={3}>
                    <Heading as="h2" size="xs">Revenue Overview</Heading>
                  </CardHeader>
                  <CardBody py={2} px={3}>
                  <Box height="150px" display="flex" alignItems="center" justifyContent="center">
                    <Text color={helperTextColor} fontSize="xs">Revenue chart visualization would appear here</Text>
                  </Box>
                  </CardBody>
                </Card>
                
                <Card bg={cardBg} boxShadow="xs" size="sm">
                  <CardHeader py={2} px={3}>
                    <Heading as="h2" size="xs">Top Products</Heading>
                  </CardHeader>
                  <CardBody py={2} px={3}>
                    <VStack align="stretch" spacing={2}>
                      {[1, 2, 3, 4, 5].map((item) => (
                        <Flex key={item} justify="space-between" align="center">
                      <Text fontSize="sm" color={cardTextColor}>Product {item}</Text>
                      <Text fontWeight="bold" color={cardTextColor} fontSize="sm">
                        ETB {Math.floor(Math.random() * 10000) + 5000}
                      </Text>
                    </Flex>
                  ))}
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>
            <TabPanel px={0} py={2}>
              <MonthlyReport />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Box 
          bg={cardBg} 
          boxShadow="xs" 
          borderRadius="md" 
          mb={4} 
          p={{ base: 1, md: 2 }} 
          maxH="300px" 
          overflow="hidden"
        >
          <FinanceMessagesPage embedded />
        </Box>

        {/* Inventory Management Section */}
        <Card bg={cardBg} boxShadow="xs" mb={4} size="sm">
          <CardHeader py={2} px={3}>
            <Heading as="h2" size="xs">Inventory Management</Heading>
          </CardHeader>
          <CardBody py={2} px={3}>
            <FinanceDashboard />
          </CardBody>
        </Card>

        {/* Recent Transactions */}
        <Card bg={cardBg} boxShadow="xs" mb={4} size="sm">
          <CardHeader py={2} px={3}>
            <Heading as="h2" size="xs">Recent Transactions</Heading>
          </CardHeader>
          <CardBody py={2} px={3}>
            <VStack align="stretch" spacing={2}>
              {[1, 2, 3, 4, 5].map((item) => (
                <Flex
                  key={item}
                  justify="space-between"
                  align="center"
                  p={2}
                  borderRadius="md"
                  _hover={{ bg: insetBg }}
                >
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" color={cardTextColor} fontSize="sm">
                      Transaction #{1000 + item}
                    </Text>
                    <Text fontSize="xs" color={helperTextColor}>
                      Customer Name {item}
                    </Text>
                  </VStack>
                  <Text fontWeight="bold" color="green.500" fontSize="sm">+ETB {Math.floor(Math.random() * 5000) + 1000}</Text>
                  <Badge fontSize="xs" colorScheme="green">Completed</Badge>
                </Flex>
              ))}
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} boxShadow="xs" size="sm">
          <CardHeader py={2} px={3}>
            <Flex direction={{ base: "column", md: "row" }} align="center" justify="space-between" gap={2}>
              <Box>
                <Heading size="xs">Team requests</Heading>
                <Text fontSize="xs" color={helperTextColor}>
                  A quick summary of the most recent department requests.
                </Text>
              </Box>
              <HStack spacing={1}>
                <Button size="xs" variant="outline" onClick={refreshTeamRequests} isLoading={teamRequestsLoading} height="24px" minH="unset">
                  Refresh
                </Button>
                <Button size="xs" colorScheme="teal" as={Link} to="/finance/team-requests" height="24px" minH="unset">
                  Manage requests
                </Button>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody py={2} px={3}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={2} mb={2}>
              <Box p={2} borderRadius="md" border="1px solid" borderColor={borderColor} bg={insetBg}>
                <Text fontSize="xs" color={helperTextColor}>
                  Total requests
                </Text>
                <Heading size="xs">{requestSummary.total}</Heading>
              </Box>
              <Box p={2} borderRadius="md" border="1px solid" borderColor={borderColor} bg={insetBg}>
                <Text fontSize="xs" color={helperTextColor}>
                  Open
                </Text>
                <Heading size="xs">{requestSummary.open}</Heading>
              </Box>
              <Box p={2} borderRadius="md" border="1px solid" borderColor={borderColor} bg={insetBg}>
                <Text fontSize="xs" color={helperTextColor}>
                  High priority
                </Text>
                <Heading size="xs">{requestSummary.highPriority}</Heading>
              </Box>
            </SimpleGrid>
            <VStack align="stretch" spacing={2}>
              {teamRequestsLoading ? (
                <Text textAlign="center" color={helperTextColor} fontSize="xs">Loading requests...</Text>
              ) : teamRequests.length === 0 ? (
                <Text textAlign="center" color={helperTextColor} fontSize="xs">No team requests yet.</Text>
              ) : (
                teamRequests.slice(0, 3).map((request) => {
                  const label = request.title || `${request.department || "Team"} request`;
                  return (
                    <Box
                      key={request._id || request.createdAt || label}
                      p={2}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={borderColor}
                      bg={insetBg}
                    >
                      <Flex justify="space-between" align="center" mb={1}>
                        <Text fontWeight="semibold" fontSize="xs" isTruncated maxW="70%">
                          {label}
                        </Text>
                        <Badge colorScheme={getPriorityColor(request.priority)} fontSize="xs" px={1} py={0.5}>
                          {request.priority || "Medium"}
                        </Badge>
                      </Flex>
                      <HStack spacing={1} fontSize="xs" color="gray.500" mb={1}>
                        <Text>{request.department || "Department"}</Text>
                        <Text>-</Text>
                        <Badge colorScheme={getStatusColor(request.status)} fontSize="xx-small">
                          {request.status || "Pending"}
                        </Badge>
                        <Text>-</Text>
                        <Text>{formatRequestDate(request.createdAt || request.date)}</Text>
                      </HStack>
                      {request.details && (
                        <Text fontSize="xs" color={detailTextColor} noOfLines={2}>
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
  );
};

export default FinanceDashboardPage;