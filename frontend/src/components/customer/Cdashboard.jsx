import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import axios from 'axios';
import { 
  Box, 
  Flex, 
  Grid, 
  GridItem, 
  Card, 
  CardBody, 
  Heading, 
  Text, 
  Stat, 
  StatLabel, 
  StatNumber,
  Icon, 
  Spinner, 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription,
  useColorModeValue,
  useBreakpointValue,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  SkeletonCircle
} from '@chakra-ui/react';
import { 
  FaUsers, 
  FaUserPlus, 
  FaUserCheck, 
  FaHandshake
} from 'react-icons/fa';
import { 
  Doughnut 
} from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  ArcElement,
  Title, 
  Tooltip as ChartTooltip, 
  Legend
} from 'chart.js';
import { Link } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  ArcElement,
  Title, 
  ChartTooltip, 
  Legend
);

const CDashboard = () => {
  const [customerData, setCustomerData] = useState({
    total: 0,
    new: 0,
    active: 0,
    buyers: 0,
    sellers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    packageDistribution: [],
    industryData: []
  });

  // Responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardMinHeight = useBreakpointValue({ base: '120px', md: '140px' });
  const chartHeight = useBreakpointValue({ base: "200px", md: "250px" });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const chartTextColor = useColorModeValue('gray.700', 'gray.200');

  // Fetch customer data from the backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats data
        const statsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups/stats`);
        
        // Fetch analytics data (fallback to empty data if not available)
        let analyticsData = {
          packageDistribution: [],
          industryData: []
        };
        
        try {
          const analyticsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups/analytics`);
          analyticsData = analyticsResponse.data || analyticsData;
        } catch (analyticsError) {
          console.warn('Analytics endpoint not available, using default data');
          // Provide sample data for demonstration with packages 1-8
          analyticsData = {
            packageDistribution: [
              { package: '1', count: 30 },
              { package: '2', count: 25 },
              { package: '3', count: 20 },
              { package: '4', count: 15 },
              { package: '5', count: 18 },
              { package: '6', count: 12 },
              { package: '7', count: 10 },
              { package: '8', count: 8 }
            ],
            industryData: [
              { industry: 'Technology', count: 45 },
              { industry: 'Healthcare', count: 32 },
              { industry: 'Finance', count: 28 },
              { industry: 'Manufacturing', count: 22 },
              { industry: 'Retail', count: 18 }
            ]
          };
        }
        
        // Fetch B2B data (buyers and sellers)
        let b2bData = {
          buyers: 0,
          sellers: 0
        };
        
        try {
          const buyersResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/buyers`);
          const sellersResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/sellers`);
          b2bData.buyers = Array.isArray(buyersResponse.data) ? buyersResponse.data.length : 0;
          b2bData.sellers = Array.isArray(sellersResponse.data) ? sellersResponse.data.length : 0;
        } catch (b2bError) {
          console.warn('B2B data not available');
        }
        
        // Process stats data
        if (statsResponse.data && typeof statsResponse.data === 'object') {
          setCustomerData({
            total: statsResponse.data.total || 0,
            new: statsResponse.data.new || 0,
            active: statsResponse.data.active || 0,
            buyers: b2bData.buyers,
            sellers: b2bData.sellers
          });
        }
        
        // Process analytics data with validation
        setAnalyticsData({
          packageDistribution: Array.isArray(analyticsData.packageDistribution) ? analyticsData.packageDistribution : [],
          industryData: Array.isArray(analyticsData.industryData) ? analyticsData.industryData : []
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err.response ? err.response.data : err.message);
        setError('Failed to fetch dashboard data: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Package distribution data with validation (packages 1-8)
  const packageChartData = {
    labels: Array.isArray(analyticsData.packageDistribution) ? analyticsData.packageDistribution.map(item => item?.package || '') : [],
    datasets: [
      {
        data: Array.isArray(analyticsData.packageDistribution) ? analyticsData.packageDistribution.map(item => item?.count || 0) : [],
        backgroundColor: [
          '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', 
          '#F44336', '#00BCD4', '#8BC34A', '#795548'
        ],
        borderWidth: 0
      }
    ]
  };

  // Industry distribution data with validation
  const industryChartData = {
    labels: Array.isArray(analyticsData.industryData) ? analyticsData.industryData.map(item => item?.industry || '') : [],
    datasets: [
      {
        data: Array.isArray(analyticsData.industryData) ? analyticsData.industryData.map(item => item?.count || 0) : [],
        backgroundColor: [
          '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'
        ],
        borderWidth: 0
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: chartTextColor,
          font: {
            size: isMobile ? 10 : 12
          },
          padding: isMobile ? 8 : 12
        }
      }
    }
  };

  // Stat cards data
  const statCards = [
    {
      title: 'Total Customers',
      value: customerData.total,
      icon: FaUsers,
      color: 'teal'
    },
    {
      title: 'New Customers',
      value: customerData.new,
      icon: FaUserPlus,
      color: 'blue'
    },
    {
      title: 'Active Customers',
      value: customerData.active,
      icon: FaUserCheck,
      color: 'green'
    },
    {
      title: 'B2B Marketplace',
      value: `${customerData.buyers + customerData.sellers}`,
      icon: FaHandshake,
      color: 'purple'
    }
  ];

  if (loading) {
    return (
      <Layout>
        <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
          <Skeleton height="40px" width="300px" mb={6} />
          
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} bg={cardBg} boxShadow="md" borderRadius="xl">
                <CardBody>
                  <Flex direction="column" align="center" justify="center">
                    <SkeletonCircle size="8" mb={2} />
                    <Skeleton height="20px" width="60%" mb={1} />
                    <Skeleton height="24px" width="80%" />
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <Card bg={cardBg} boxShadow="md" borderRadius="xl" p={4}>
              <Skeleton height={chartHeight} borderRadius="md" />
            </Card>
            <Card bg={cardBg} boxShadow="md" borderRadius="xl" p={4}>
              <Skeleton height={chartHeight} borderRadius="md" />
            </Card>
          </Grid>
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box p={6} bg={bgColor} minHeight="100vh">
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="lg"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Error Loading Dashboard
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              {error}
            </AlertDescription>
          </Alert>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
        <Heading 
          as="h1" 
          size={{ base: "lg", md: "xl" }} 
          color={headerColor}
          textAlign={{ base: "center", md: "left" }}
          fontWeight="bold"
          mb={6}
        >
          Customer Dashboard
        </Heading>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
          {statCards.map((card, index) => (
            <Card 
              key={index} 
              bg={cardBg} 
              boxShadow="md" 
              borderRadius="xl"
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-3px)', boxShadow: 'lg' }}
            >
              <CardBody>
                <Flex direction="column" align="center" justify="center">
                  <Icon 
                    as={card.icon} 
                    boxSize={8} 
                    color={`${card.color}.500`} 
                    mb={2}
                  />
                  <Stat textAlign="center">
                    <StatLabel 
                      fontSize="sm" 
                      fontWeight="medium" 
                      color={textColor}
                      mb={1}
                    >
                      {card.title}
                    </StatLabel>
                    <StatNumber 
                      fontSize={{ base: "xl", md: "2xl" }} 
                      fontWeight="bold" 
                      color={`${card.color}.500`}
                    >
                      {card.value}
                    </StatNumber>
                  </Stat>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {/* Charts */}
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
          <Card 
            bg={cardBg} 
            boxShadow="md" 
            borderRadius="xl"
            transition="all 0.2s"
            _hover={{ boxShadow: 'lg' }}
          >
            <CardBody p={4}>
              <Text fontWeight="bold" color={headerColor} mb={3} textAlign="center">
                Package Distribution (1-8)
              </Text>
              <Box height={chartHeight}>
                <Doughnut data={packageChartData} options={chartOptions} />
              </Box>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="md" 
            borderRadius="xl"
            transition="all 0.2s"
            _hover={{ boxShadow: 'lg' }}
          >
            <CardBody p={4}>
              <Text fontWeight="bold" color={headerColor} mb={3} textAlign="center">
                Top Industries
              </Text>
              <Box height={chartHeight}>
                <Doughnut data={industryChartData} options={chartOptions} />
              </Box>
            </CardBody>
          </Card>
        </Grid>
      </Box>
    </Layout>
  );
};

export default CDashboard;