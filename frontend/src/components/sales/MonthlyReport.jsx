import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Card,
  CardBody,
  Text,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import axiosInstance from '../../services/axiosInstance';

// Standardized commission calculation function
const calculateCommission = (salesValue) => {
  // Standard commission rate: 10%
  const commissionRate = 0.10;
  // Tax on commission: 5%
  const taxRate = 0.05;
  
  const grossCommission = salesValue * commissionRate;
  const commissionTax = grossCommission * taxRate;
  const netCommission = grossCommission - commissionTax;
  
  return {
    grossCommission: Math.round(grossCommission),
    commissionTax: Math.round(commissionTax),
    netCommission: Math.round(netCommission)
  };
};

const MonthlyReport = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  // Fetch report data based on time range
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch sales stats
      const statsResponse = await axiosInstance.get('/sales-customers/stats');
      const stats = statsResponse.data;
      
      // Calculate commission based on actual sales data
      const totalSalesValue = (stats.completedDeals || 0) * 15000; // Average value per sale
      const commissionData = calculateCommission(totalSalesValue);
      
      const data = {
        agentName: 'Current Agent', // This would be replaced with actual agent name
        totalSales: stats.completedDeals || 0,
        totalSalesValue: totalSalesValue,
        grossCommission: commissionData.grossCommission,
        netCommission: commissionData.netCommission,
        commissionTax: commissionData.commissionTax
      };
      
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to fetch report data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or time range changes
  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" variant="left-accent" borderRadius="md" mb={4}>
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>Error Loading Report</AlertTitle>
          <AlertDescription display="block">
            {error}
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <Box p={{ base: 2, md: 6 }} minHeight="100vh">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading 
          as="h1" 
          size={{ base: "lg", md: "xl" }}
          color={headerColor}
          fontWeight="bold"
        >
          Monthly Performance Report
        </Heading>
        <Select 
          size="sm" 
          w="fit-content" 
          value={timeRange}
          onChange={(e) => handleTimeRangeChange(e.target.value)}
          variant="filled"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </Select>
      </Flex>

      {/* Summary Cards */}
      <Flex 
        direction={{ base: "column", md: "row" }} 
        gap={4} 
        mb={6}
        wrap="wrap"
      >
        <Card 
          flex="1" 
          minW="200px" 
          bg={cardBg} 
          boxShadow="md"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
          transition="all 0.2s"
        >
          <CardBody textAlign="center">
            <Text fontSize="sm" color="gray.500" mb={2}>Total Sales</Text>
            <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="blue.500">
              {reportData?.totalSales || 0}
            </Text>
          </CardBody>
        </Card>

        <Card 
          flex="1" 
          minW="200px" 
          bg={cardBg} 
          boxShadow="md"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
          transition="all 0.2s"
        >
          <CardBody textAlign="center">
            <Text fontSize="sm" color="gray.500" mb={2}>Total Sales Value</Text>
            <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="green.500">
              ETB {(reportData?.totalSalesValue || 0).toLocaleString()}
            </Text>
          </CardBody>
        </Card>

        <Card 
          flex="1" 
          minW="200px" 
          bg={cardBg} 
          boxShadow="md"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
          transition="all 0.2s"
        >
          <CardBody textAlign="center">
            <Text fontSize="sm" color="gray.500" mb={2}>Gross Commission</Text>
            <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="purple.500">
              ETB {(reportData?.grossCommission || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </CardBody>
        </Card>

        <Card 
          flex="1" 
          minW="200px" 
          bg={cardBg} 
          boxShadow="md"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
          transition="all 0.2s"
        >
          <CardBody textAlign="center">
            <Text fontSize="sm" color="gray.500" mb={2}>Net Commission</Text>
            <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="orange.500">
              ETB {(reportData?.netCommission || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </CardBody>
        </Card>
      </Flex>

      {/* Detailed Report Table */}
      <Card 
        bg={cardBg} 
        boxShadow="md"
        borderRadius="lg"
      >
        <CardBody>
          <Heading 
            as="h2" 
            size="md" 
            color={headerColor}
            mb={4}
          >
            Detailed Performance Report
          </Heading>
          
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Metric</Th>
                  <Th isNumeric>Value</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>
                    <Text fontWeight="medium">Total Sales Completed</Text>
                  </Td>
                  <Td isNumeric>
                    <Text fontWeight="bold" color="blue.500">{reportData?.totalSales || 0}</Text>
                  </Td>
                </Tr>
                <Tr>
                  <Td>
                    <Text fontWeight="medium">Total Sales Value</Text>
                  </Td>
                  <Td isNumeric>
                    <Text fontWeight="bold" color="green.500">
                      ETB {(reportData?.totalSalesValue || 0).toLocaleString()}
                    </Text>
                  </Td>
                </Tr>
                <Tr>
                  <Td>
                    <Text fontWeight="medium">Gross Commission (10%)</Text>
                  </Td>
                  <Td isNumeric>
                    <Text fontWeight="bold" color="purple.500">
                      ETB {(reportData?.grossCommission || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Text>
                  </Td>
                </Tr>
                <Tr>
                  <Td>
                    <Text fontWeight="medium">Tax Deduction (5%)</Text>
                  </Td>
                  <Td isNumeric>
                    <Text fontWeight="bold" color="red.500">
                      ETB {(reportData?.commissionTax || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Text>
                  </Td>
                </Tr>
                <Tr>
                  <Td>
                    <Text fontWeight="medium">Net Commission</Text>
                  </Td>
                  <Td isNumeric>
                    <Text fontWeight="bold" color="orange.500" fontSize="lg">
                      ETB {(reportData?.netCommission || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Text>
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>
    </Box>
  );
};

export default MonthlyReport;