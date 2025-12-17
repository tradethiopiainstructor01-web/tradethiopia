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
  IconButton,
  HStack,
  VStack
} from '@chakra-ui/react';
import { FaSync, FaChartLine, FaUsers, FaMedal } from 'react-icons/fa';
import axiosInstance from '../../services/axiosInstance';
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

const MonthlyReport = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  // Refresh data
  const handleRefresh = () => {
    fetchReportData();
  };

  // Fetch report data based on time range
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch agent sales performance data for all agents
      const data = await getAgentSalesPerformance(timeRange);
      
      // Process data for top performers
      const sortedPerformers = [...data.agentPerformance].sort((a, b) => 
        b.totalNetCommission - a.totalNetCommission
      ).slice(0, 5);
      
      setTopPerformers(sortedPerformers);
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      // Set default data to prevent empty display
      const defaultData = {
        teamStats: {
          totalAgents: 0,
          totalTeamSales: 0,
          totalTeamGrossCommission: 0,
          totalTeamNetCommission: 0,
          averageGrossCommissionPerAgent: 0
        },
        agentPerformance: []
      };
      setReportData(defaultData);
      setTopPerformers([]);
      setError('Failed to fetch report data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Fetch data when component mounts or time range changes
  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="150px">
        <Spinner size="md" />
      </Flex>
    );
  }

  return (
    <Box>
      {error && (
        <Alert status="warning" variant="left-accent" borderRadius="md" mb={2} size="sm">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle fontSize="xs">Warning</AlertTitle>
            <AlertDescription display="block" fontSize="xs">
              {error}
            </AlertDescription>
          </Box>
        </Alert>
      )}
      
      <Flex justify="space-between" align="center" mb={3}>
        <Heading 
          as="h2" 
          size="xs"
          color={headerColor}
          fontWeight="bold"
        >
          Agent Sales Performance Report
        </Heading>
        <Flex align="center">
          <Select 
            size="xs" 
            w="fit-content" 
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            variant="filled"
            mr={1}
            height="24px"
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
            size="xs" 
            onClick={handleRefresh}
            height="24px"
            minW="24px"
          />
        </Flex>
      </Flex>

      {/* Summary Cards */}
      {reportData && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={2} mb={3}>
          <Card 
            bg={cardBg} 
            boxShadow="xs"
            _hover={{ transform: 'translateY(-1px)', boxShadow: 'sm' }}
            transition="all 0.2s"
            size="sm"
          >
            <CardBody py={2} px={3} textAlign="center">
              <Flex justify="center" mb={1}>
                <Box as={FaUsers} fontSize="16px" color="blue.500" />
              </Flex>
              <Stat>
                <StatLabel fontSize="xs" color="gray.500" mb={0.5}>Total Agents</StatLabel>
                <StatNumber fontSize="sm" fontWeight="bold" color="blue.500">
                  {reportData.teamStats?.totalAgents || 0}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="xs"
            _hover={{ transform: 'translateY(-1px)', boxShadow: 'sm' }}
            transition="all 0.2s"
            size="sm"
          >
            <CardBody py={2} px={3} textAlign="center">
              <Flex justify="center" mb={1}>
                <Box as={FaChartLine} fontSize="16px" color="green.500" />
              </Flex>
              <Stat>
                <StatLabel fontSize="xs" color="gray.500" mb={0.5}>Total Sales</StatLabel>
                <StatNumber fontSize="sm" fontWeight="bold" color="green.500">
                  {reportData.teamStats?.totalTeamSales || 0}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="xs"
            _hover={{ transform: 'translateY(-1px)', boxShadow: 'sm' }}
            transition="all 0.2s"
            size="sm"
          >
            <CardBody py={2} px={3} textAlign="center">
              <Flex justify="center" mb={1}>
                <Box as={FaMedal} fontSize="16px" color="purple.500" />
              </Flex>
              <Stat>
                <StatLabel fontSize="xs" color="gray.500" mb={0.5}>Gross Commission</StatLabel>
                <StatNumber fontSize="sm" fontWeight="bold" color="purple.500">
                  ETB {(reportData.teamStats?.totalTeamGrossCommission || 0).toLocaleString()}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="xs"
            _hover={{ transform: 'translateY(-1px)', boxShadow: 'sm' }}
            transition="all 0.2s"
            size="sm"
          >
            <CardBody py={2} px={3} textAlign="center">
              <Flex justify="center" mb={1}>
                <Box as={FaMedal} fontSize="16px" color="orange.500" />
              </Flex>
              <Stat>
                <StatLabel fontSize="xs" color="gray.500" mb={0.5}>Net Commission</StatLabel>
                <StatNumber fontSize="sm" fontWeight="bold" color="orange.500">
                  ETB {(reportData.teamStats?.totalTeamNetCommission || 0).toLocaleString()}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card 
          bg={cardBg} 
          boxShadow="xs"
          borderRadius="md"
          mb={3}
          size="sm"
        >
          <CardBody py={2} px={3}>
            <Heading 
              as="h3" 
              size="xs" 
              color={headerColor}
              mb={2}
            >
              Top Performing Agents
            </Heading>
            
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th fontSize="xs" p={1}>Rank</Th>
                    <Th fontSize="xs" p={1}>Agent</Th>
                    <Th isNumeric fontSize="xs" p={1}>Sales</Th>
                    <Th isNumeric fontSize="xs" p={1}>Gross Commission</Th>
                    <Th isNumeric fontSize="xs" p={1}>Net Commission</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {topPerformers.map((agent, index) => (
                    <Tr key={agent._id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                      <Td p={1}>
                        <Badge 
                          colorScheme={index === 0 ? "yellow" : index === 1 ? "gray" : index === 2 ? "orange" : "gray"}
                          fontSize="xs"
                          p={0.5}
                        >
                          #{index + 1}
                        </Badge>
                      </Td>
                      <Td p={1}>
                        <Text fontSize="xs" fontWeight="medium">{agent.fullName || agent.username}</Text>
                      </Td>
                      <Td isNumeric p={1}>
                        <Text fontSize="xs" fontWeight="bold" color="blue.500">{agent.completedDeals}</Text>
                      </Td>
                      <Td isNumeric p={1}>
                        <Text fontSize="xs" fontWeight="bold" color="purple.500">
                          ETB {agent.totalGrossCommission.toLocaleString()}
                        </Text>
                      </Td>
                      <Td isNumeric p={1}>
                        <Text fontSize="xs" fontWeight="bold" color="orange.500">
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

      {/* Detailed Report Table */}
      {reportData && reportData.agentPerformance && reportData.agentPerformance.length > 0 && (
        <Card 
          bg={cardBg} 
          boxShadow="xs"
          borderRadius="md"
          size="sm"
        >
          <CardBody py={2} px={3}>
            <Heading 
              as="h3" 
              size="xs" 
              color={headerColor}
              mb={2}
            >
              All Agent Performance Details
            </Heading>
            
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th fontSize="xs" p={1}>Agent</Th>
                    <Th isNumeric fontSize="xs" p={1}>Completed Sales</Th>
                    <Th isNumeric fontSize="xs" p={1}>Total Sales Value</Th>
                    <Th isNumeric fontSize="xs" p={1}>Gross Commission</Th>
                    <Th isNumeric fontSize="xs" p={1}>Tax Deduction</Th>
                    <Th isNumeric fontSize="xs" p={1}>Net Commission</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {reportData.agentPerformance.map((agent) => {
                    // Calculate commission details for display
                    const commissionData = calculateCommission(agent.totalSales);
                    
                    return (
                      <Tr key={agent._id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                        <Td p={1}>
                          <Text fontSize="xs" fontWeight="medium">{agent.fullName || agent.username}</Text>
                        </Td>
                        <Td isNumeric p={1}>
                          <Text fontSize="xs" fontWeight="bold" color="blue.500">{agent.completedDeals}</Text>
                        </Td>
                        <Td isNumeric p={1}>
                          <Text fontSize="xs" fontWeight="bold" color="green.500">
                            ETB {agent.totalSales.toLocaleString()}
                          </Text>
                        </Td>
                        <Td isNumeric p={1}>
                          <Text fontSize="xs" fontWeight="bold" color="purple.500">
                            ETB {commissionData.grossCommission.toLocaleString()}
                          </Text>
                        </Td>
                        <Td isNumeric p={1}>
                          <Text fontSize="xs" fontWeight="bold" color="red.500">
                            ETB {commissionData.commissionTax.toLocaleString()}
                          </Text>
                        </Td>
                        <Td isNumeric p={1}>
                          <Text fontSize="xs" fontWeight="bold" color="orange.500">
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

      {/* No data message */}
      {reportData && reportData.agentPerformance && reportData.agentPerformance.length === 0 && (
        <Card bg={cardBg} boxShadow="xs" borderRadius="md" size="sm">
          <CardBody textAlign="center" py={4} px={3}>
            <Text fontSize="xs" color="gray.500">
              No agent performance data available for the selected time period.
            </Text>
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default MonthlyReport;