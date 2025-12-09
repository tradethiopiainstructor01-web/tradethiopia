import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  useColorModeValue,
  useBreakpointValue,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  Button,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stack,
  HStack,
  VStack,
  Badge,
  Progress,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
  useToast,
  Spinner,
  StackDivider,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure
} from '@chakra-ui/react';
import {
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiFilter,
  FiRefreshCw,
  FiMoreVertical,
  FiDownload,
  FiShare2,
  FiPrinter
} from 'react-icons/fi';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { getDashboardStats, getSalesForecast, getTeamPerformance } from '../../services/salesManagerService';
import { useUserStore } from '../../store/user';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Generate mock forecast data if API fails
const generateMockForecast = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const forecastMonths = months.slice(0, 12);
  
  const actualData = Array(12).fill(0).map((_, i) => 
    Math.floor(Math.random() * 100000) + 50000
  );
  
  const forecastData = actualData.map((val, i) => 
    i <= currentMonth ? val : Math.floor(val * (0.9 + Math.random() * 0.3))
  );
  
  return {
    labels: forecastMonths,
    actual: actualData,
    forecast: forecastData,
    confidence: forecastData.map(() => Math.floor(Math.random() * 30) + 70)
  };
};

// Debug wrapper component
const DebugWrapper = ({ children }) => {
  console.log('DebugWrapper rendered');
  return children;
};

const SalesManagerDashboard = () => {
  console.log('SalesManagerDashboard component rendering...');
  console.log('Environment:', process.env.NODE_ENV);
  
  // Get current user from store
  const currentUser = useUserStore((state) => state.currentUser);
  console.log('Current user in dashboard:', currentUser);
  console.log('User role:', currentUser?.role);
  console.log('LocalStorage userRole:', localStorage.getItem('userRole'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalCustomers: 0,
    newCustomers: 0,
    totalDeals: 0,
    closedDeals: 0,
    totalRevenue: 0,
    revenueTarget: 500000,
    monthlyGrowth: 0,
    quarterlyGrowth: 0,
    ytdGrowth: 0
  });
  
  const [forecastData, setForecastData] = useState({
    labels: [],
    actual: [],
    forecast: [],
    confidence: []
  });
  
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const chartRef = useRef(null);

  // Responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: true, md: true, lg: false });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const dangerColor = useColorModeValue('red.500', 'red.300');
  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: useColorModeValue('#4A5568', '#E2E8F0'),
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: useColorModeValue('white', '#2D3748'),
        titleColor: useColorModeValue('#2D3748', '#E2E8F0'),
        bodyColor: useColorModeValue('#4A5568', '#CBD5E0'),
        borderColor: useColorModeValue('#E2E8F0', '#4A5568'),
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')
        },
        ticks: {
          color: useColorModeValue('#4A5568', '#A0AEC0')
        }
      },
      y: {
        grid: {
          color: useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')
        },
        ticks: {
          color: useColorModeValue('#4A5568', '#A0AEC0'),
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Sales forecast chart data
  const salesChartData = {
    labels: forecastData.labels,
    datasets: [
      {
        label: 'Actual Sales',
        data: forecastData.actual,
        borderColor: primaryColor,
        backgroundColor: useColorModeValue('rgba(66, 153, 225, 0.1)', 'rgba(66, 153, 225, 0.2)'),
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'Forecast',
        data: forecastData.forecast,
        borderColor: warningColor,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5
      }
    ]
  };

  // Team performance chart data
  const teamPerformanceData = {
    labels: teamPerformance?.agentPerformance?.map(agent => agent.name) || [],
    datasets: [
      {
        label: 'Deals Closed',
        data: teamPerformance?.agentPerformance?.map(agent => agent.dealsClosed) || [],
        backgroundColor: [
          'rgba(66, 153, 225, 0.8)',
          'rgba(72, 187, 120, 0.8)',
          'rgba(246, 173, 85, 0.8)',
          'rgba(229, 62, 62, 0.8)',
          'rgba(159, 122, 234, 0.8)'
        ],
        borderColor: [
          'rgba(66, 153, 225, 1)',
          'rgba(72, 187, 120, 1)',
          'rgba(246, 173, 85, 1)',
          'rgba(229, 62, 62, 1)',
          'rgba(159, 122, 234, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Debug log when component mounts
  const applyStatsFallback = () => {
    setStats({
      totalAgents: 12,
      activeAgents: 9,
      totalCustomers: 1287,
      newCustomers: 42,
      totalDeals: 356,
      closedDeals: 243,
      totalRevenue: 1256800,
      revenueTarget: 1500000,
      monthlyGrowth: 8.5,
      quarterlyGrowth: 22.3,
      ytdGrowth: 45.7
    });
  };

  const fetchAllData = useCallback(async () => {
    console.log('Starting data fetch...');
    console.log('Current timeRange:', timeRange);
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchDashboardStats(),
        fetchSalesForecast(),
        fetchTeamPerformance(),
        fetchRecentActivities()
      ]);
    } catch (err) {
      // soften the failure: use mock data and keep page usable
      const message = err?.response?.status === 404
        ? 'Data not available yet; showing sample data.'
        : 'Failed to load dashboard data. ' + (err.message || '');
      setError(message);
      console.error('Error loading dashboard data:', err);
      applyStatsFallback();
      setForecastData(generateMockForecast());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    console.log('SalesManagerDashboard mounted or updated');
    fetchAllData();
  }, [fetchAllData]);

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      console.log('🔍 Fetching dashboard stats...');
      console.log('Token:', localStorage.getItem('userToken')?.substring(0, 20) + '...');
      const data = await getDashboardStats();
      console.log('✅ Dashboard stats received:', data);
      setStats(prev => ({
        ...prev,
        ...data
      }));
    } catch (err) {
      console.error('❌ Error fetching dashboard stats:', err);
      console.error('Error details:', err.response?.data || err.message);
      applyStatsFallback();
      // Propagate only for non-404 to avoid breaking UX when endpoints are missing
      if (err?.response?.status !== 404) {
        throw err;
      }
    }
  };

  // Fetch sales forecast data
  const fetchSalesForecast = async () => {
    try {
      const data = await getSalesForecast({ range: timeRange });
      setForecastData(data);
    } catch (err) {
      console.error('Error fetching sales forecast:', err);
      // Fallback to mock data
      setForecastData(generateMockForecast());
    }
  };

  // Fetch team performance data
  const fetchTeamPerformance = async () => {
    try {
      const data = await getTeamPerformance();
      setTeamPerformance(data);
    } catch (err) {
      console.error('Error fetching team performance:', err);
      // Mock team performance data
      setTeamPerformance([
        { id: 1, name: 'John D.', dealsClosed: 42, target: 50, revenue: 125000 },
        { id: 2, name: 'Sarah M.', dealsClosed: 38, target: 45, revenue: 118000 },
        { id: 3, name: 'Mike T.', dealsClosed: 35, target: 40, revenue: 98500 },
        { id: 4, name: 'Emma L.', dealsClosed: 31, target: 40, revenue: 87500 },
        { id: 5, name: 'David K.', dealsClosed: 28, target: 35, revenue: 78500 }
      ]);
      if (err?.response?.status !== 404) {
        throw err;
      }
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      // This would be an API call in a real app
      // const data = await getRecentActivities();
      // Mock data for now
      const mockActivities = [
        { id: 1, type: 'sale', user: 'John D.', details: 'Closed deal with Acme Corp', amount: 12500, timestamp: '2023-11-15T14:32:00Z' },
        { id: 2, type: 'customer', user: 'Sarah M.', details: 'New lead from website', amount: null, timestamp: '2023-11-15T13:45:00Z' },
        { id: 3, type: 'deal', user: 'Mike T.', details: 'Deal in progress - follow up scheduled', amount: 8500, timestamp: '2023-11-15T11:20:00Z' },
        { id: 4, type: 'sale', user: 'Emma L.', details: 'Renewal contract signed', amount: 3200, timestamp: '2023-11-15T10:15:00Z' },
        { id: 5, type: 'meeting', user: 'David K.', details: 'Product demo with TechStart Inc', amount: null, timestamp: '2023-11-15T09:30:00Z' },
        { id: 6, type: 'task', user: 'System', details: 'Task assigned: Follow up with potential clients', amount: null, timestamp: '2023-11-15T08:45:00Z' },
        { id: 7, type: 'task', user: 'System', details: 'Task deadline approaching: Prepare quarterly report', amount: null, timestamp: '2023-11-15T08:30:00Z' }
      ];
      setRecentActivities(mockActivities);
    } catch (err) {
      console.error('Error fetching recent activities:', err);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAllData();
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Calculate progress percentage
  const progressPercentage = Math.min(Math.round((stats.totalRevenue / (stats.revenueTarget || 1)) * 100), 100);

  console.log('Rendering dashboard with state:', { loading, error, stats });

  if (loading && !isRefreshing) {
    console.log('Loading state: true');
    return (
      <Flex justify="center" align="center" minH="300px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading dashboard data...</Text>
          <Text fontSize="sm" color="gray.500">If this takes too long, please check your connection</Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    console.error('Error in SalesManagerDashboard:', error);
    return (
      <Box bg="red.50" p={6} borderRadius="lg" mb={4}>
        <VStack spacing={3} align="stretch">
          <Heading size="md" color="red.600">Error Loading Dashboard</Heading>
          <Text color="red.700">{error}</Text>
          <Button 
            leftIcon={<FiRefreshCw />} 
            colorScheme="red" 
            variant="outline"
            onClick={handleRefresh}
            alignSelf="flex-start"
          >
            Retry
          </Button>
        </VStack>
      </Box>
    );
  }

  // Stat cards data
  const statCards = [
    {
      title: 'Total Agents',
      value: stats.totalAgents,
      icon: FiUsers,
      color: 'teal'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: FiUsers,
      color: 'blue'
    },
    {
      title: 'Completed Deals',
      value: stats.totalCompletedDeals,
      icon: FiUserCheck,
      color: 'green'
    },
    {
      title: 'Total Revenue',
      value: `ETB ${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: 'purple'
    }
  ];

  return (
    <DebugWrapper>
      <Box p={{ base: 3, md: 4 }} bg={bgColor} minHeight="100vh">
        {/* Debug Info - Shows current user role */}
        <Alert status="info" mb={4} borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="bold">Current User: {currentUser?.username || currentUser?.email || 'Not logged in'}</Text>
            <Text fontSize="sm">Role: {currentUser?.role || localStorage.getItem('userRole') || 'No role found'}</Text>
            {currentUser?.role !== 'salesmanager' && (
              <Text fontSize="sm" color="red.500" mt={1}>
                ⚠️ You need to be logged in as a Sales Manager to view this dashboard!
              </Text>
            )}
          </Box>
        </Alert>
        
        <Flex justify="space-between" align="center" mb={4}>
          <Heading 
            as="h1" 
            size={{ base: "md", md: "lg" }}
            color={textColor}
            fontWeight="semibold"
          >
            Sales Dashboard
          </Heading>
          <Button 
            size="sm" 
            colorScheme="blue" 
            variant="ghost" 
            leftIcon={<FiRefreshCw size={16} />}
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            Refresh
          </Button>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={5}>
          {statCards.map((card, index) => (
            <Card 
              key={index} 
              bg={cardBg} 
              boxShadow="sm" 
              borderRadius="lg"
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
              borderWidth="1px"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
            >
              <CardBody p={3}>
                <Flex direction="column" align="center" textAlign="center">
                  <Flex
                    align="center"
                    justify="center"
                    w={8}
                    h={8}
                    mb={2}
                    rounded="lg"
                    bg={`${card.color}.100`}
                    color={`${card.color}.600`}
                  >
                    <Icon as={card.icon} boxSize={4} />
                  </Flex>
                  <Text 
                    fontSize="xs"
                    fontWeight="medium" 
                    color="gray.500"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    mb={0.5}
                  >
                    {card.title}
                  </Text>
                  <Text
                    fontSize={{ base: "lg", md: "xl" }} 
                    fontWeight="bold" 
                    color={useColorModeValue('gray.800', 'white')}
                    lineHeight="shorter"
                  >
                    {card.value}
                  </Text>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {/* Main Content Area */}
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={4}>
          {/* Left Column */}
          <Box>
            {/* Sales Overview Chart */}
            <Card 
              bg={cardBg}
              borderWidth="1px"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
              boxShadow="sm"
              borderRadius="lg"
              mb={4}
            >
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="sm" color={textColor}>
                    Sales Overview
                  </Heading>
                  <Select 
                    size="xs" 
                    w="fit-content" 
                    value={timeRange}
                    onChange={(e) => handleTimeRangeChange(e.target.value)}
                    variant="filled"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </Select>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <Box h="300px">
                  <Line data={salesChartData} options={chartOptions} />
                </Box>
              </CardBody>
            </Card>

            {/* Team Performance */}
            <Card 
              bg={cardBg}
              borderWidth="1px"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
              boxShadow="sm"
              borderRadius="lg"
            >
              <CardHeader pb={2}>
                <Heading size="sm" color={textColor}>
                  Team Performance
                </Heading>
              </CardHeader>
              <CardBody pt={0}>
                <Box h="300px">
                  <Bar data={teamPerformanceData} options={chartOptions} />
                </Box>
              </CardBody>
            </Card>
          </Box>

          {/* Right Column */}
          <Box>
            {/* Recent Activities */}
            <Card 
              bg={cardBg}
              borderWidth="1px"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
              boxShadow="sm"
              borderRadius="lg"
              h="100%"
            >
              <CardHeader pb={2}>
                <Heading size="sm" color={textColor}>
                  Recent Activities
                </Heading>
              </CardHeader>
              <CardBody p={0}>
                <VStack align="stretch" spacing={0} divider={<StackDivider />}>
                  {recentActivities.map((activity) => (
                    <Box key={activity.id} p={3} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                      <Flex justify="space-between" mb={1}>
                        <Text fontSize="sm" fontWeight="medium" color={textColor}>
                          {activity.user}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </Flex>
                      <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {activity.details}
                      </Text>
                      {activity.amount && (
                        <Badge colorScheme="green" mt={1}>
                          {formatCurrency(activity.amount)}
                        </Badge>
                      )}
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </Grid>
      </Box>
    </DebugWrapper>
  );
};

// Add display name for better debugging
SalesManagerDashboard.displayName = 'SalesManagerDashboard';

// Add missing icon
const FiCheckCircle = (props) => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default SalesManagerDashboard;
