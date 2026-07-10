import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
  SimpleGrid,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Icon,
  Spinner
} from '@chakra-ui/react';
import { FiTarget, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { getSalesTargets, getAgentSalesStats } from '../../services/salesTargetService';
import { useUserStore } from '../../store/user';

const SalesTargetsPage = () => {
  const [targets, setTargets] = useState([]);
  const [salesStats, setSalesStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentUser } = useUserStore();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get targets for the current user
        const targetsResponse = await getSalesTargets(currentUser?._id);
        console.log('Fetched targets:', targetsResponse);
        
        // Get sales stats for the current user
        const statsResponse = await getAgentSalesStats();
        console.log('Fetched stats:', statsResponse);
        
        setTargets(targetsResponse.data || []);
        setSalesStats(statsResponse);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch sales data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?._id) {
      fetchData();
    }
  }, [currentUser]);

  // Calculate performance percentage
  const calculatePerformance = (actual, target) => {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.round((actual / target) * 100));
  };

  // Get current targets (active ones)
  const currentTargets = targets.filter(target => {
    const now = new Date();
    return new Date(target.periodStart) <= now && new Date(target.periodEnd) >= now;
  });

  // Get past targets
  const pastTargets = targets.filter(target => {
    const now = new Date();
    return new Date(target.periodEnd) < now;
  });

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box bg="red.50" p={4} borderRadius="lg" mb={4}>
        <Text color="red.500" fontWeight="medium">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading 
          as="h1" 
          size="xl" 
          color={headerColor}
        >
          My Sales Targets
        </Heading>
      </Flex>

      {/* Current Targets Summary */}
      {currentTargets.length > 0 ? (
        <>
          <Heading size="md" mb={4} color={textColor}>Current Targets</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
            {currentTargets.map((target, index) => (
              <Card key={index} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Badge colorScheme={target.periodType === 'weekly' ? 'blue' : 'green'}>
                      {target.periodType?.toUpperCase()}
                    </Badge>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(target.periodStart).toLocaleDateString()} - {new Date(target.periodEnd).toLocaleDateString()}
                    </Text>
                  </Flex>
                  
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel fontSize="sm">Sales Target</StatLabel>
                      <StatNumber fontSize="2xl">{target.weeklySalesTarget || target.monthlySalesTarget || 0}</StatNumber>
                    </Stat>
                    
                    <Stat>
                      <StatLabel fontSize="sm">Current Progress</StatLabel>
                      <StatNumber fontSize="2xl">
                        {calculatePerformance(salesStats?.completedDeals || 0, target.weeklySalesTarget || target.monthlySalesTarget || 0)}%
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>
                  
                  <Box mt={4}>
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="sm">Progress</Text>
                      <Text fontSize="sm">
                        {salesStats?.completedDeals || 0}/{target.weeklySalesTarget || target.monthlySalesTarget || 0} sales
                      </Text>
                    </Flex>
                    <Progress 
                      value={calculatePerformance(salesStats?.completedDeals || 0, target.weeklySalesTarget || target.monthlySalesTarget || 0)} 
                      size="sm" 
                      colorScheme="teal" 
                      borderRadius="full" 
                    />
                  </Box>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </>
      ) : (
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={8}>
          <CardBody>
            <Flex direction="column" align="center" py={8}>
              <Icon as={FiTarget} boxSize={12} color="gray.400" mb={4} />
              <Heading size="md" color={textColor} mb={2}>No Active Targets</Heading>
              <Text color="gray.500">You don't have any active sales targets assigned at the moment.</Text>
            </Flex>
          </CardBody>
        </Card>
      )}

      {/* Target History */}
      {pastTargets.length > 0 && (
        <>
          <Heading size="md" mb={4} color={textColor}>Target History</Heading>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Period</Th>
                      <Th>Type</Th>
                      <Th>Sales Target</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pastTargets.map((target, index) => (
                      <Tr key={index}>
                        <Td>
                          {new Date(target.periodStart).toLocaleDateString()} - {new Date(target.periodEnd).toLocaleDateString()}
                        </Td>
                        <Td>
                          <Badge colorScheme={target.periodType === 'weekly' ? 'blue' : 'green'}>
                            {target.periodType}
                          </Badge>
                        </Td>
                        <Td>{target.weeklySalesTarget || target.monthlySalesTarget || 0} sales</Td>
                        <Td>
                          <Badge colorScheme="red">Expired</Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </>
      )}
    </Box>
  );
};

export default SalesTargetsPage;