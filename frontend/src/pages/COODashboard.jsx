import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Badge,
  Icon,
  VStack,
  HStack,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiUsers, FiTrendingUp, FiClock, FiCheckCircle, FiDollarSign, FiZap, FiBarChart2, FiAward } from 'react-icons/fi';

const mockSales = [
  { name: 'Alice', deals: 12, revenue: 58000 },
  { name: 'Bob', deals: 9, revenue: 43000 },
  { name: 'Carol', deals: 15, revenue: 72000 },
  { name: 'David', deals: 7, revenue: 31000 },
];

const mockCustomers = [
  { segment: 'Enterprise', count: 24, growth: 12 },
  { segment: 'SMB', count: 108, growth: 8 },
  { segment: 'Startup', count: 56, growth: 15 },
];

const mockProjects = [
  { name: 'TradexTV', progress: 72, owner: 'Media', budget: 120000 },
  { name: 'IT Platform', progress: 58, owner: 'IT', budget: 95000 },
  { name: 'B2B Expansion', progress: 81, owner: 'Sales', budget: 140000 },
  { name: 'Customer Success Revamp', progress: 64, owner: 'CS', budget: 60000 },
];

const COODashboard = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textMuted = useColorModeValue('gray.600', 'gray.400');

  const [sales] = useState(mockSales);
  const [customers] = useState(mockCustomers);
  const [projects] = useState(mockProjects);
  const [totals, setTotals] = useState({
    revenue: 0,
    deals: 0,
    projectsOnTrack: 0,
    nps: 76,
  });

  useEffect(() => {
    const revenue = sales.reduce((sum, s) => sum + s.revenue, 0);
    const deals = sales.reduce((sum, s) => sum + s.deals, 0);
    const projectsOnTrack = projects.filter((p) => p.progress >= 60).length;
    setTotals({ revenue, deals, projectsOnTrack, nps: 76 });
  }, [sales, projects]);

  return (
    <Box p={{ base: 4, md: 6 }} bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh">
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
        <Box>
          <Heading size="lg">COO Dashboard</Heading>
          <Text color={textMuted}>Company-wide performance snapshot</Text>
        </Box>
        <HStack spacing={3}>
          <Badge colorScheme="teal" px={3} py={1} borderRadius="full">Live</Badge>
          <Text color={textMuted} fontSize="sm">{new Date().toLocaleString()}</Text>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4} mb={6}>
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Stat>
              <StatLabel>Revenue</StatLabel>
              <StatNumber>${totals.revenue.toLocaleString()}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                12.4% vs last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Stat>
              <StatLabel>Deals Closed</StatLabel>
              <StatNumber>{totals.deals}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                5 new logos
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Stat>
              <StatLabel>Projects On Track</StatLabel>
              <StatNumber>{totals.projectsOnTrack}/{projects.length}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                Healthy pipeline
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Stat>
              <StatLabel>NPS</StatLabel>
              <StatNumber>{totals.nps}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                +3 pts vs last quarter
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mb={6}>
        <Card bg={cardBg} shadow="md">
          <CardHeader>
            <HStack spacing={2}>
              <Icon as={FiTrendingUp} color="teal.500" />
              <Heading size="md">Sales Performance</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Rep</Th>
                  <Th isNumeric>Deals</Th>
                  <Th isNumeric>Revenue</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sales.map((s, idx) => (
                  <Tr key={idx}>
                    <Td>{s.name}</Td>
                    <Td isNumeric>{s.deals}</Td>
                    <Td isNumeric>${s.revenue.toLocaleString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        <Card bg={cardBg} shadow="md">
          <CardHeader>
            <HStack spacing={2}>
              <Icon as={FiUsers} color="blue.500" />
              <Heading size="md">Customer Segments</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              {customers.map((c, idx) => (
                <Flex key={idx} justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="semibold">{c.segment}</Text>
                    <Text color={textMuted} fontSize="sm">Growth {c.growth}%</Text>
                  </Box>
                  <HStack minW="140px">
                    <Progress flex="1" value={c.growth} colorScheme="teal" borderRadius="full" />
                    <Badge colorScheme="purple">{c.count}</Badge>
                  </HStack>
                </Flex>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card bg={cardBg} shadow="md" mb={6}>
        <CardHeader>
          <HStack spacing={2}>
            <Icon as={FiBarChart2} color="orange.500" />
            <Heading size="md">Strategic Projects</Heading>
          </HStack>
        </CardHeader>
        <CardBody>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Project</Th>
                <Th>Owner</Th>
                <Th isNumeric>Progress</Th>
                <Th isNumeric>Budget</Th>
              </Tr>
            </Thead>
            <Tbody>
              {projects.map((p, idx) => (
                <Tr key={idx}>
                  <Td>{p.name}</Td>
                  <Td>{p.owner}</Td>
                  <Td isNumeric>
                    <VStack align="stretch" spacing={1}>
                      <Progress value={p.progress} colorScheme={p.progress >= 75 ? 'green' : 'yellow'} borderRadius="full" />
                      <Text fontSize="xs" color={textMuted}>{p.progress}%</Text>
                    </VStack>
                  </Td>
                  <Td isNumeric>${p.budget.toLocaleString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <HStack spacing={3}>
              <Icon as={FiCheckCircle} color="green.500" boxSize={6} />
              <Box>
                <Heading size="sm">Service Quality</Heading>
                <Text color={textMuted} fontSize="sm">SLA adherence 94%</Text>
              </Box>
            </HStack>
          </CardBody>
        </Card>
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <HStack spacing={3}>
              <Icon as={FiClock} color="blue.500" boxSize={6} />
              <Box>
                <Heading size="sm">Ops Efficiency</Heading>
                <Text color={textMuted} fontSize="sm">MTTR 3.1 hrs</Text>
              </Box>
            </HStack>
          </CardBody>
        </Card>
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <HStack spacing={3}>
              <Icon as={FiAward} color="purple.500" boxSize={6} />
              <Box>
                <Heading size="sm">CSAT</Heading>
                <Text color={textMuted} fontSize="sm">4.6 / 5</Text>
              </Box>
            </HStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default COODashboard;
