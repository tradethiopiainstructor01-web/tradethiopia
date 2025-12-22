import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  CircularProgress,
  CircularProgressLabel,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Icon,
  useColorModeValue,
  VStack,
  HStack,
  SimpleGrid,
  Divider,
  Tooltip,
  Select,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { 
  FiUsers, 
  FiBriefcase, 
  FiDollarSign, 
  FiBarChart2, 
  FiTrendingUp, 
  FiClock, 
  FiCheckCircle,
  FiAlertCircle,
  FiPieChart,
  FiActivity
} from 'react-icons/fi';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Mock data for demonstration
const mockMetrics = {
  totalRegistrations: 5420,
  activeJobs: 128,
  placementsThisMonth: 42,
  revenue: 125000,
  satisfactionRate: 94,
  responseTime: 2.4
};

const mockChartData = {
  monthlyRegistrations: [
    { month: 'Jan', registrations: 400, placements: 25 },
    { month: 'Feb', registrations: 300, placements: 30 },
    { month: 'Mar', registrations: 200, placements: 20 },
    { month: 'Apr', registrations: 278, placements: 35 },
    { month: 'May', registrations: 189, placements: 28 },
    { month: 'Jun', registrations: 239, placements: 42 }
  ],
  packageDistribution: [
    { name: 'Starter', value: 400 },
    { name: 'Professional', value: 300 },
    { name: 'Enterprise', value: 200 },
    { name: 'Premium', value: 100 }
  ],
  recentActivities: [
    { id: 1, user: 'Tech Solutions Ltd', action: 'Registered for Professional Package', time: '2 hours ago', type: 'registration' },
    { id: 2, user: 'Sarah Johnson', action: 'Applied for Marketing Manager', time: '4 hours ago', type: 'application' },
    { id: 3, user: 'Global Innovations', action: 'Posted 3 new positions', time: '1 day ago', type: 'posting' },
    { id: 4, user: 'Michael Chen', action: 'Completed interview', time: '1 day ago', type: 'interview' },
    { id: 5, user: 'Ethio Foods Co.', action: 'Hired 2 candidates', time: '2 days ago', type: 'hire' }
  ],
  topCompanies: [
    { name: 'Tech Solutions Ltd', jobs: 12, hires: 8 },
    { name: 'Global Innovations', jobs: 8, hires: 6 },
    { name: 'Ethio Foods Co.', jobs: 6, hires: 5 },
    { name: 'MediCare Services', jobs: 5, hires: 4 },
    { name: 'Green Energy Corp', jobs: 4, hires: 3 }
  ]
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ENISRAEnhancedDashboard = () => {
  const [timeRange, setTimeRange] = useState('monthly');
  const [metrics, setMetrics] = useState(mockMetrics);
  const [chartData, setChartData] = useState(mockChartData);
  
  // Background and text colors based on color mode
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headingColor = useColorModeValue('purple.700', 'purple.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Simulate data fetching
  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, we'll use the mock data
  }, []);

  const getBadgeColor = (type) => {
    switch(type) {
      case 'registration': return 'purple';
      case 'application': return 'blue';
      case 'posting': return 'green';
      case 'interview': return 'orange';
      case 'hire': return 'teal';
      default: return 'gray';
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" py={{ base: 10, md: 14 }} px={{ base: 6, md: 10 }}>
      <Container maxW="container.xl" py={{ base: 4, md: 8, lg: 10 }}>
        <VStack spacing={{ base: 12, md: 16 }} align="stretch">
          {/* Key Metrics */}
          <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3, lg: 6 }}
            spacing={{ base: 8, md: 10 }}
            rowGap={{ base: 6, md: 8 }}
            mt={2}
          >
            <StatCard 
              title="Total Registrations" 
              value={metrics.totalRegistrations.toLocaleString()} 
              change="+12%" 
              icon={<Icon as={FiUsers} boxSize={6} />}
              color="purple"
            />
            <StatCard 
              title="Active Jobs" 
              value={metrics.activeJobs} 
              change="+5%" 
              icon={<Icon as={FiBriefcase} boxSize={6} />}
              color="blue"
            />
            <StatCard 
              title="Placements (MTD)" 
              value={metrics.placementsThisMonth} 
              change="+18%" 
              icon={<Icon as={FiCheckCircle} boxSize={6} />}
              color="green"
            />
            <StatCard 
              title="Revenue (ETB)" 
              value={metrics.revenue.toLocaleString()} 
              change="+8%" 
              icon={<Icon as={FiDollarSign} boxSize={6} />}
              color="yellow"
            />
            <StatCard 
              title="Satisfaction Rate" 
              value={`${metrics.satisfactionRate}%`} 
              change="+2%" 
              icon={<Icon as={FiBarChart2} boxSize={6} />}
              color="teal"
            />
            <StatCard 
              title="Avg. Response Time" 
              value={`${metrics.responseTime} hrs`} 
              change="-0.3 hrs" 
              icon={<Icon as={FiClock} boxSize={6} />}
              color="orange"
            />
          </SimpleGrid>

          {/* Charts Section */}
          <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={{ base: 10, md: 12 }} mt={6}>
            {/* Registrations Over Time */}
            <Card bg={cardBg} boxShadow="lg" borderRadius="xl" p={{ base: 6, md: 8 }} transition="all 0.3s ease" _hover={{ boxShadow: 'xl' }}>
              <CardHeader pb={6}>
                <Heading as="h3" size="lg" color={headingColor}>
                  <HStack spacing={3}>
                    <Icon as={FiTrendingUp} boxSize={6} />
                    <Text>Registrations & Placements Trend</Text>
                  </HStack>
                </Heading>
              </CardHeader>
              <CardBody pt={4}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData.monthlyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                    <XAxis dataKey="month" stroke={textColor} />
                    <YAxis stroke={textColor} />
                    <ChartTooltip 
                      contentStyle={{ 
                        backgroundColor: cardBg, 
                        borderColor: borderColor,
                        color: textColor,
                        borderRadius: 'md',
                        boxShadow: 'md'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="registrations" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={3}
                      name="Registrations"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="placements" 
                      stroke="#82ca9d" 
                      strokeWidth={3}
                      name="Placements"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Package Distribution */}
            <Card bg={cardBg} boxShadow="lg" borderRadius="xl" p={{ base: 6, md: 8 }} transition="all 0.3s ease" _hover={{ boxShadow: 'xl' }}>
              <CardHeader pb={6}>
                <Heading as="h3" size="lg" color={headingColor}>
                  <HStack spacing={3}>
                    <Icon as={FiPieChart} boxSize={6} />
                    <Text>Package Distribution</Text>
                  </HStack>
                </Heading>
              </CardHeader>
              <CardBody pt={4}>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={chartData.packageDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={90}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.packageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      contentStyle={{ 
                        backgroundColor: cardBg, 
                        borderColor: borderColor,
                        color: textColor,
                        borderRadius: 'md',
                        boxShadow: 'md'
                      }} 
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </Grid>

          {/* Recent Activities and Top Companies */}
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={{ base: 10, md: 12 }} mt={6}>
            {/* Recent Activities */}
            <Card bg={cardBg} boxShadow="lg" borderRadius="xl" p={{ base: 6, md: 8 }} transition="all 0.3s ease" _hover={{ boxShadow: 'xl' }}>
              <CardHeader pb={6}>
                <Heading as="h3" size="lg" color={headingColor}>
                  <HStack spacing={3}>
                    <Icon as={FiActivity} boxSize={6} />
                    <Text>Recent Activities</Text>
                  </HStack>
                </Heading>
              </CardHeader>
              <CardBody pt={4}>
                <VStack spacing={5} divider={<Divider borderColor={borderColor} />}> 
                  {chartData.recentActivities.map(activity => (
                    <HStack key={activity.id} w="full" justify="space-between" p={4} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }} borderRadius="lg" transition="all 0.2s">
                      <VStack align="flex-start" spacing={2}>
                        <Text fontWeight="semibold" color={textColor} fontSize="md">{activity.user}</Text>
                        <Text fontSize="sm" color={textColor}>{activity.action}</Text>
                      </VStack>
                      <HStack spacing={3}>
                        <Badge colorScheme={getBadgeColor(activity.type)} px={2} py={1} borderRadius="full">
                          {activity.type}
                        </Badge>
                        <Text fontSize="sm" color="gray.500">{activity.time}</Text>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>

            {/* Top Companies */}
            <Card bg={cardBg} boxShadow="lg" borderRadius="xl" p={{ base: 6, md: 8 }} transition="all 0.3s ease" _hover={{ boxShadow: 'xl' }}>
              <CardHeader pb={6}>
                <Heading as="h3" size="lg" color={headingColor}>
                  <HStack spacing={3}>
                    <Icon as={FiBarChart2} boxSize={6} />
                    <Text>Top Companies</Text>
                  </HStack>
                </Heading>
              </CardHeader>
              <CardBody pt={4}>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th color={textColor} fontSize="md" fontWeight="semibold">Company</Th>
                        <Th color={textColor} isNumeric fontSize="md" fontWeight="semibold">Jobs Posted</Th>
                        <Th color={textColor} isNumeric fontSize="md" fontWeight="semibold">Hires Made</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {chartData.topCompanies.map((company, index) => (
                        <Tr key={index} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }} transition="all 0.2s" borderRadius="md">
                          <Td color={textColor}>
                            <Text fontWeight="semibold" fontSize="md">{company.name}</Text>
                          </Td>
                          <Td color={textColor} isNumeric fontSize="lg" fontWeight="bold">{company.jobs}</Td>
                          <Td color={textColor} isNumeric fontSize="lg" fontWeight="bold">{company.hires}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
};

// Stat Card Component
const StatCard = ({ title, value, change, icon, color }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headingColor = useColorModeValue('gray.800', 'white');
  
  const isPositive = !change.startsWith('-');
  
  return (
    <Card bg={cardBg} boxShadow="lg" borderRadius="xl" height="full" transition="all 0.2s ease-in-out" _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}>
      <CardBody p={6}>
        <VStack align="stretch" spacing={5}>
          <Flex justify="space-between" align="flex-start">
            <Box flex="1">
              <Text fontSize="sm" color={textColor} mb={3} fontWeight="medium">{title}</Text>
              <Heading as="h4" size="lg" color={headingColor} mb={2}>{value}</Heading>
              <Text fontSize="sm" color={isPositive ? 'green.500' : 'red.500'} fontWeight="medium">
                {isPositive ? '↑' : '↓'} {change}
              </Text>
            </Box>
            <Box bg={`${color}.100`} p={3} borderRadius="lg" flexShrink={0}>
              {icon}
            </Box>
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ENISRAEnhancedDashboard;
