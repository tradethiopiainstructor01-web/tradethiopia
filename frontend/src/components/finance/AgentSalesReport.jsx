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
  AlertDescription,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  IconButton
} from '@chakra-ui/react';
import { FaSync, FaChartBar, FaUsers, FaMedal } from 'react-icons/fa';
import { getAgentSalesPerformance } from '../../services/financeService';

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

const AgentSalesReport = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  // Fetch report data based on time range
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch agent sales performance data
      const data = await getAgentSalesPerformance(timeRange);
      
      // Process data for top performers
      const sortedPerformers = [...data.agentPerformance].sort((a, b) => 
        b.totalNetCommission - a.totalNetCommission
      ).slice(0, 5);
      
      setTopPerformers(sortedPerformers);
      setReportData(data);
    } catch (err) {
      console.error('Error fetching agent sales report data:', err);
      setError('Failed to fetch agent sales report data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchReportData();
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

  return (
    <Box>
      {error && (
        <Alert status="error" variant="left-accent" borderRadius="md" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription display="block">
              {error}
            </AlertDescription>
          </Box>
        </Alert>
      )}
      
      <Flex justify="space-between" align="center" mb={6}>
        <Heading 
          as="h2" 
          size="lg"
          color={headerColor}
          fontWeight="bold"
        >
          Agent Sales Performance
        </Heading>
        <Flex align="center">
          <Select 
            size="sm" 
            w="fit-content" 
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            variant="filled"
            mr={2}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </Select>
          <IconButton 
            aria-label="Refresh data" 
            icon={<FaSync />} 
            size="sm" 
            onClick={handleRefresh}
          />
        </Flex>
      </Flex>

      {/* Summary Cards */}
      {reportData && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
          <Card 
            bg={cardBg} 
            boxShadow="md"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
          >
            <CardBody textAlign="center">
              <Flex justify="center" mb={2}>
                <Box as={FaUsers} fontSize="24px" color="blue.500" />
              </Flex>
              <Text fontSize="sm" color="gray.500" mb={2}>Total Agents</Text>
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="blue.500">
                {reportData.teamStats?.totalAgents || 0}
              </Text>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="md"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
          >
            <CardBody textAlign="center">
              <Flex justify="center" mb={2}>
                <Box as={FaChartBar} fontSize="24px" color="green.500" />
              </Flex>
              <Text fontSize="sm" color="gray.500" mb={2}>Total Sales</Text>
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="green.500">
                {reportData.teamStats?.totalTeamSales || 0}
              </Text>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="md"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
          >
            <CardBody textAlign="center">
              <Flex justify="center" mb={2}>
                <Box as={FaMedal} fontSize="24px" color="purple.500" />
              </Flex>
              <Text fontSize="sm" color="gray.500" mb={2}>Gross Commission</Text>
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="purple.500">
                ETB {(reportData.teamStats?.totalTeamGrossCommission || 0).toLocaleString()}
              </Text>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="md"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
          >
            <CardBody textAlign="center">
              <Flex justify="center" mb={2}>
                <Box as={FaMedal} fontSize="24px" color="orange.500" />
              </Flex>
              <Text fontSize="sm" color="gray.500" mb={2}>Net Commission</Text>
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="orange.500">
                ETB {(reportData.teamStats?.totalTeamNetCommission || 0).toLocaleString()}
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card 
          bg={cardBg} 
          boxShadow="md"
          borderRadius="lg"
          mb={6}
        >
          <CardBody>
            <Heading 
              as="h3" 
              size="md" 
              color={headerColor}
              mb={4}
            >
              Top Performers
            </Heading>
            
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Rank</Th>
                    <Th>Agent</Th>
                    <Th isNumeric>Sales</Th>
                    <Th isNumeric>Gross Commission</Th>
                    <Th isNumeric>Net Commission</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {topPerformers.map((agent, index) => (
                    <Tr key={agent._id}>
                      <Td>
                        <Badge 
                          colorScheme={index === 0 ? "yellow" : index === 1 ? "gray" : index === 2 ? "orange" : "gray"}
                          fontSize="md"
                          p={1}
                        >
                          #{index + 1}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontWeight="medium">{agent.fullName || agent.username}</Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontWeight="bold" color="blue.500">{agent.completedDeals}</Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontWeight="bold" color="purple.500">
                          ETB {agent.totalGrossCommission.toLocaleString()}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontWeight="bold" color="orange.500">
                          ETB {agent.totalNetCommission.toLocaleString()}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      )}

      {/* Full Agent Performance Table */}
      {reportData && reportData.agentPerformance && reportData.agentPerformance.length > 0 && (
        <Card 
          bg={cardBg} 
          boxShadow="md"
          borderRadius="lg"
        >
          <CardBody>
            <Heading 
              as="h3" 
              size="md" 
              color={headerColor}
              mb={4}
            >
              All Agent Performance
            </Heading>
            
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Agent</Th>
                    <Th isNumeric>Completed Sales</Th>
                    <Th isNumeric>Total Sales Value</Th>
                    <Th isNumeric>Gross Commission</Th>
                    <Th isNumeric>Tax Deduction</Th>
                    <Th isNumeric>Net Commission</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {reportData.agentPerformance.map((agent) => {
                    // Calculate commission details for display
                    const commissionData = calculateCommission(agent.totalSales);
                    
                    return (
                      <Tr key={agent._id}>
                        <Td>
                          <Text fontWeight="medium">{agent.fullName || agent.username}</Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontWeight="bold" color="blue.500">{agent.completedDeals}</Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontWeight="bold" color="green.500">
                            ETB {agent.totalSales.toLocaleString()}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontWeight="bold" color="purple.500">
                            ETB {commissionData.grossCommission.toLocaleString()}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontWeight="bold" color="red.500">
                            ETB {commissionData.commissionTax.toLocaleString()}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontWeight="bold" color="orange.500">
                            ETB {commissionData.netCommission.toLocaleString()}
                          </Text>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default AgentSalesReport;