import React from 'react';
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
  AlertDescription
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
import FinanceDashboard from '../../components/finance/FinanceDashboard';
import FinanceLayout from './FinanceLayout';
import MonthlyReport from '../../components/finance/MonthlyReport';

const FinanceDashboardPage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');

  // Mock data for financial metrics
  const financialMetrics = [
    { title: 'Total Revenue', value: 'ETB 1,245,678', change: '+12.5%', icon: FaDollarSign, color: 'green' },
    { title: 'Total Orders', value: '1,248', change: '+8.2%', icon: FaReceipt, color: 'blue' },
    { title: 'Inventory Value', value: 'ETB 876,432', change: '+5.7%', icon: FaBoxes, color: 'purple' },
    { title: 'Pending Orders', value: '42', change: '-3.1%', icon: FaShoppingCart, color: 'orange' },
    { title: 'Suppliers', value: '24', change: '+2.0%', icon: FaTruck, color: 'teal' },
    { title: 'Customers', value: '156', change: '+4.5%', icon: FaUsers, color: 'pink' }
  ];

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
                      <Text color="gray.500">Revenue chart visualization would appear here</Text>
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
                          <Text>Product {item}</Text>
                          <Text fontWeight="bold">ETB {Math.floor(Math.random() * 10000) + 5000}</Text>
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
                <Flex key={item} justify="space-between" align="center" p={3} borderRadius="md" _hover={{ bg: 'gray.50' }}>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">Transaction #{1000 + item}</Text>
                    <Text fontSize="sm" color="gray.500">Customer Name {item}</Text>
                  </VStack>
                  <Text fontWeight="bold" color="green.500">+ETB {Math.floor(Math.random() * 5000) + 1000}</Text>
                  <Badge colorScheme="green">Completed</Badge>
                </Flex>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </FinanceLayout>
  );
};

export default FinanceDashboardPage;