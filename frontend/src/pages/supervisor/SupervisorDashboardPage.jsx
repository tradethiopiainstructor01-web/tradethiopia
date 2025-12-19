import React, { useMemo } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorMode,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import {
  FiArrowUpRight,
  FiBriefcase,
  FiLogOut,
  FiUsers,
  FiTrendingUp,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user';

const metricData = [
  {
    title: 'Total Revenue',
    value: 'ETB 12,480,000',
    change: '+8% vs last month',
    icon: FiTrendingUp,
    color: 'teal.500',
  },
  {
    title: 'Total Expense',
    value: 'ETB 9,120,000',
    change: '-3% vs budget',
    icon: FiBriefcase,
    color: 'orange.500',
  },
  {
    title: 'Total Profit',
    value: 'ETB 3,360,000',
    change: '+32% margin',
    icon: FiArrowUpRight,
    color: 'green.500',
  },
];

const SupervisorDashboardPage = () => {
  const heroBg = useColorModeValue('teal.50', 'teal.900');
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);

  const profileData = useMemo(
    () => ({
      name: 'Meron Gebru',
      department: 'Finance & Oversight',
      email: 'meron@tradethiopia.com',
      phone: '+251 916 123 456',
      status: 'Active',
    }),
    [],
  );

  return (
    <Box>
      {/* Hero Section - Positioned at the top */}
      <Box
        borderRadius="2xl"
        p={{ base: 5, md: 8 }}
        bg={heroBg}
        mb={6}
        boxShadow="md"
      >
        <Flex
          align="center"
          justify="center"
          flexWrap="wrap"
          gap={4}
          mb={4}
        >
          <Box textAlign="center">
            <Heading size="lg" mb={2}>
              Supervisor Hub
            </Heading>
            <Text color="gray.500" maxW="xl">
              Track finance performance, review forecasts, and keep the team aligned
              from a single control surface.
            </Text>
          </Box>
        </Flex>
        <Flex
          align="center"
          justify="center"
          pt={4}
        >
          <Flex align="center" gap={4}>
          </Flex>
        </Flex>
      </Box>

      {/* Key Metrics Section */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        {metricData.map((metric) => (
          <Stat
            key={metric.title}
            px={5}
            py={6}
            borderRadius="lg"
            bg={useColorModeValue('white', 'gray.800')}
            boxShadow="sm"
          >
            <Flex justify="space-between" align="center">
              <StatLabel fontSize="sm" color="gray.500">
                {metric.title}
              </StatLabel>
              <Icon as={metric.icon} color={metric.color} boxSize={5} />
            </Flex>
            <StatNumber fontSize="2xl">{metric.value}</StatNumber>
            <Text fontSize="xs" color="gray.400">
              {metric.change}
            </Text>
          </Stat>
        ))}
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={4}>
        <Box
          borderRadius="lg"
          p={6}
          bg={useColorModeValue('white', 'gray.800')}
          boxShadow="sm"
        >
          <Flex justify="space-between" mb={4}>
            <Heading size="md">Operational Pulse</Heading>
            <Badge colorScheme="blue">Updated just now</Badge>
          </Flex>
          <Text color="gray.500">
            Monitor cash inflows, forecast gaps, and upcoming approvals. Supervise
            procurement, orders, and payroll in one view to stay ahead of risks.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={6}>
            <Box>
              <Text fontSize="xs" color="gray.400">
                Pending approvals
              </Text>
              <Heading size="lg" color="orange.500">
                14
              </Heading>
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.400">
                Delayed payments
              </Text>
              <Heading size="lg" color="red.500">
                6
              </Heading>
            </Box>
          </SimpleGrid>
        </Box>
        <VStack spacing={4} align="stretch">
        </VStack>
      </Grid>
    </Box>
  );
};

export default SupervisorDashboardPage;
