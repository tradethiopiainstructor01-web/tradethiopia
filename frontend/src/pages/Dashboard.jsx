// File: src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  useToast,
  Heading,
  useColorModeValue,
  SimpleGrid,
  Icon,
  HStack,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  Skeleton,
  Stack,
  Stat,
  StatLabel,
  useColorMode,
  Spinner
} from '@chakra-ui/react';
import {
  FiUsers,
  FiBox,
  FiPlusCircle,
  FiDollarSign,
  FiCheck,
  FiClock,
  FiTrendingUp,
  FiLayers,
  FiUserCheck,
  FiFolder
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import axiosInstance from '../services/axiosInstance';
import { useUserStore } from '../store/user';
import { Link as RouterLink } from 'react-router-dom';

const QuickActionCard = ({ icon, label, to, color }) => {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  return (
    <Box
      as={RouterLink}
      to={to}
      p={4}
      bg={bg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      _hover={{ 
        borderColor: `${color}.400`, 
        transform: "translateY(-2px)", 
        shadow: "md",
        bg: useColorModeValue(`${color}.50`, "rgba(59, 130, 246, 0.05)")
      }}
      transition="all 0.2s ease"
      cursor="pointer"
    >
      <Flex align="center" gap={3}>
        <Flex
          w="40px" h="40px"
          align="center" justify="center"
          borderRadius="xl"
          bg={`${color}.100`}
          color={`${color}.600`}
          _dark={{
            bg: `${color}.900`,
            color: `${color}.300`
          }}
        >
          <Icon as={icon} boxSize={5} />
        </Flex>
        <Text fontSize="sm" fontWeight="600" color={useColorModeValue("gray.700", "gray.200")}>{label}</Text>
      </Flex>
    </Box>
  );
};

const KpiCard = ({ icon, label, value, description, color, loading }) => {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  return (
    <Box
      p={5}
      bg={bg}
      border="1px solid"
      borderColor={border}
      borderRadius="2xl"
      position="relative"
      overflow="hidden"
      boxShadow="sm"
    >
      {loading ? (
        <Stack spacing={2}>
          <Skeleton h="14px" w="100px" />
          <Skeleton h="28px" w="60px" />
          <Skeleton h="12px" w="140px" />
        </Stack>
      ) : (
        <Flex justify="space-between" align="start">
          <Box>
            <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
              {label}
            </Text>
            <Heading size="lg" fontWeight="800" mb={1} color={useColorModeValue("gray.800", "white")}>
              {value}
            </Heading>
            <Text fontSize="xs" color="gray.500">
              {description}
            </Text>
          </Box>
          <Flex
            w="48px" h="48px"
            align="center" justify="center"
            borderRadius="2xl"
            bg={`${color}.50`}
            color={`${color}.500`}
            _dark={{ bg: `${color}.900`, color: `${color}.300` }}
          >
            <Icon as={icon} boxSize={6} />
          </Flex>
        </Flex>
      )}
    </Box>
  );
};

const Dashboard = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const toast = useToast();
  const { colorMode } = useColorMode();

  const greetingTime = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await axiosInstance.get('/users/hr-stats');
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load HR stats:", error);
      toast({
        title: 'Error loading dashboard',
        description: error.response?.data?.message || 'Could not fetch dashboard statistics.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApprove = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await axiosInstance.put(`/users/${userId}`, {
        infoStatus: 'approved',
        status: 'active'
      });
      if (res.data && res.data.success) {
        toast({
          title: 'Employee Approved',
          description: 'Employee information has been verified and their account is now active.',
          status: 'success',
          duration: 3000
        });
        // Silent refresh
        fetchStats(true);
      }
    } catch (err) {
      toast({
        title: 'Approval failed',
        description: err.response?.data?.message || err.message,
        status: 'error'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Theme-specific colors for Recharts
  const chartColors = {
    dept: ['#3182CE', '#805AD5', '#DD6B20', '#319795', '#D69E2E', '#E53E3E', '#38A169'],
    employment: colorMode === "light" ? '#3182CE' : '#90CDF4',
    candidates: colorMode === "light" ? '#805AD5' : '#D6BCFA',
    grid: useColorModeValue('#EDF2F7', '#2D3748'),
    tooltipBg: useColorModeValue('rgba(255, 255, 255, 0.96)', 'rgba(23, 25, 35, 0.98)'),
    tooltipBorder: useColorModeValue('#E2E8F0', '#4A5568')
  };

  return (
    <Box pt={2} px={{ base: 2, md: 4 }}>
      {/* Welcome Hero Banner */}
      <Box
        mb={6}
        p={{ base: 5, md: 7 }}
        borderRadius="2xl"
        bg={useColorModeValue("white", "gray.800")}
        border="1px solid"
        borderColor={useColorModeValue("gray.100", "gray.700")}
        boxShadow="sm"
      >
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Box>
            <Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
              {greetingTime}
            </Text>
            <Heading size="lg" fontWeight="800" mb={1} color={useColorModeValue("gray.900", "white")}>
              Welcome back, {currentUser?.username || "HR Officer"} 👋
            </Heading>
            <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
              Here is an overview of your organization's human resources operations.
            </Text>
          </Box>
          <Box
            px={4}
            py={2.5}
            borderRadius="xl"
            bg={useColorModeValue("gray.50", "gray.900")}
            border="1px solid"
            borderColor={useColorModeValue("gray.100", "gray.700")}
          >
            <Text fontSize="10px" fontWeight="700" color="gray.400" letterSpacing="wider" textTransform="uppercase">
              TODAY
            </Text>
            <Text fontSize="sm" fontWeight="800" color={useColorModeValue("gray.800", "white")}>
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </Box>
        </Flex>

        {/* Quick Actions Row */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mt={6}>
          <QuickActionCard icon={FiPlusCircle} label="Add Employee" to="/create" color="blue" />
          <QuickActionCard icon={FiUsers} label="Manage Accounts" to="/users" color="purple" />
          <QuickActionCard icon={FiDollarSign} label="Run Payroll" to="/payroll" color="teal" />
          <QuickActionCard icon={FiFolder} label="Review Documents" to="/EmployeeDocument" color="orange" />
        </SimpleGrid>
      </Box>

      {/* KPI Cards Grid */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        <KpiCard
          icon={FiUsers}
          label="Total Headcount"
          value={stats?.counts?.totalUsers || 0}
          description={`${stats?.counts?.activeUsers || 0} active | ${stats?.counts?.inactiveUsers || 0} inactive`}
          color="blue"
          loading={loading}
        />
        <KpiCard
          icon={FiClock}
          label="Pending Approvals"
          value={stats?.counts?.pendingInfoUsersCount || 0}
          description="Awaiting info verification"
          color="orange"
          loading={loading}
        />
        <KpiCard
          icon={FiBox}
          label="Company Assets"
          value={stats?.counts?.totalAssets || 0}
          description={`${stats?.counts?.assignedAssets || 0} assigned to employees`}
          color="teal"
          loading={loading}
        />
        <KpiCard
          icon={FiLayers}
          label="Candidates Pool"
          value={stats?.counts?.totalCandidates || 0}
          description="Applications in recruiting"
          color="purple"
          loading={loading}
        />
      </SimpleGrid>

      {/* Main Content Tabs */}
      <Tabs variant="solid-rounded" colorScheme="blue" isLazy>
        <TabList mb={4} gap={2} bg={useColorModeValue("gray.50", "gray.900")} p={1.5} borderRadius="2xl" border="1px solid" borderColor={useColorModeValue("gray.100", "gray.800")} w="max-content">
          <Tab borderRadius="xl" fontWeight="600" fontSize="sm" px={4} py={2}>
            Operational View
          </Tab>
          <Tab borderRadius="xl" fontWeight="600" fontSize="sm" px={4} py={2}>
            Strategic Insights
          </Tab>
        </TabList>

        <TabPanels>
          {/* Operational View Tab */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
              {/* Pending Employee Approvals Checklist */}
              <Box
                gridColumn={{ lg: "span 2" }}
                bg={useColorModeValue("white", "gray.800")}
                border="1px solid"
                borderColor={useColorModeValue("gray.100", "gray.700")}
                borderRadius="2xl"
                p={{ base: 4, md: 6 }}
                boxShadow="sm"
              >
                <Flex justify="space-between" align="center" mb={4}>
                  <Box>
                    <Text fontWeight="800" fontSize="md" color={useColorModeValue("gray.800", "white")}>
                      Employee Verification Checklist
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Newly registered employees awaiting info verification and approval.
                    </Text>
                  </Box>
                  <Badge colorScheme="orange" borderRadius="full" px={2} py={0.5}>
                    {stats?.pendingApprovals?.length || 0} Pending
                  </Badge>
                </Flex>

                {loading ? (
                  <Stack spacing={3}>
                    <Skeleton h="50px" borderRadius="xl" />
                    <Skeleton h="50px" borderRadius="xl" />
                  </Stack>
                ) : stats?.pendingApprovals?.length === 0 ? (
                  <Flex align="center" justify="center" direction="column" py={8} gap={2}>
                    <Icon as={FiUserCheck} boxSize={8} color="gray.400" />
                    <Text fontSize="sm" color="gray.500" fontWeight="600">All clear! No pending approvals.</Text>
                  </Flex>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th color="gray.400">Employee</Th>
                          <Th color="gray.400">Role / Position</Th>
                          <Th color="gray.400">Verification Status</Th>
                          <Th color="gray.400" textAlign="right">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {stats?.pendingApprovals?.map((user) => (
                          <Tr key={user._id} _hover={{ bg: useColorModeValue("gray.50", "rgba(255,255,255,0.02)") }} transition="background 0.15s ease">
                            <Td py={3}>
                              <HStack spacing={3}>
                                <Avatar size="sm" name={user.fullName || user.username} src={user.photoUrl} />
                                <Box>
                                  <Text fontSize="sm" fontWeight="700" color={useColorModeValue("gray.800", "white")}>
                                    {user.fullName || user.username}
                                  </Text>
                                  <Text fontSize="11px" color="gray.500">
                                    {user.email}
                                  </Text>
                                </Box>
                              </HStack>
                            </Td>
                            <Td py={3}>
                              <Text fontSize="xs" fontWeight="600" color={useColorModeValue("gray.700", "gray.300")}>
                                {user.jobTitle || 'Unassigned'}
                              </Text>
                              <Badge fontSize="9px" borderRadius="md" colorScheme="purple">
                                {user.role}
                              </Badge>
                            </Td>
                            <Td py={3}>
                              <Badge colorScheme="orange" variant="subtle" borderRadius="md">
                                pending_review
                              </Badge>
                            </Td>
                            <Td py={3} textAlign="right">
                              <Button
                                size="xs"
                                colorScheme="green"
                                leftIcon={<FiCheck />}
                                borderRadius="lg"
                                onClick={() => handleApprove(user._id)}
                                isLoading={actionLoading[user._id]}
                                loadingText="Approving"
                              >
                                Approve
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Box>

              {/* Financial Payroll Summary */}
              <Box
                bg={useColorModeValue("white", "gray.800")}
                border="1px solid"
                borderColor={useColorModeValue("gray.100", "gray.700")}
                borderRadius="2xl"
                p={{ base: 4, md: 6 }}
                boxShadow="sm"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
              >
                <Box>
                  <Text fontWeight="800" fontSize="md" color={useColorModeValue("gray.800", "white")} mb={4}>
                    Payroll Overview
                  </Text>
                  
                  {loading ? (
                    <Stack spacing={4}>
                      <Skeleton h="60px" borderRadius="xl" />
                      <Skeleton h="40px" borderRadius="xl" />
                    </Stack>
                  ) : (
                    <VStack align="stretch" spacing={4}>
                      <Box bg={useColorModeValue("teal.50", "rgba(49, 151, 149, 0.05)")} p={4} borderRadius="2xl" border="1px solid" borderColor={useColorModeValue("teal.100", "teal.900")}>
                        <Text fontSize="xs" color={useColorModeValue("teal.700", "teal.300")} fontWeight="700" mb={1} textTransform="uppercase" letterSpacing="wider">
                          Total Monthly Payroll
                        </Text>
                        <Heading size="md" color={useColorModeValue("teal.800", "teal.200")} fontWeight="800">
                          ETB {stats?.salaryData?.totalPayroll?.toLocaleString() || 0}
                        </Heading>
                      </Box>

                      <SimpleGrid columns={2} spacing={3}>
                        <Stat size="sm">
                          <StatLabel fontSize="10px" color="gray.400" fontWeight="700" textTransform="uppercase">Average Salary</StatLabel>
                          <Text fontSize="sm" fontWeight="800">ETB {stats?.salaryData?.avgSalary?.toLocaleString() || 0}</Text>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel fontSize="10px" color="gray.400" fontWeight="700" textTransform="uppercase">Max Salary</StatLabel>
                          <Text fontSize="sm" fontWeight="800">ETB {stats?.salaryData?.maxSalary?.toLocaleString() || 0}</Text>
                        </Stat>
                      </SimpleGrid>
                    </VStack>
                  )}
                </Box>

                <Button
                  as={RouterLink}
                  to="/payroll"
                  colorScheme="teal"
                  size="sm"
                  borderRadius="xl"
                  w="full"
                  mt={6}
                  rightIcon={<FiTrendingUp />}
                >
                  Manage Payroll & Budgets
                </Button>
              </Box>
            </SimpleGrid>
          </TabPanel>

          {/* Strategic Insights Tab */}
          <TabPanel p={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {/* Department Headcount Breakdown */}
              <Box
                bg={useColorModeValue("white", "gray.800")}
                border="1px solid"
                borderColor={useColorModeValue("gray.100", "gray.700")}
                borderRadius="2xl"
                p={{ base: 4, md: 6 }}
                boxShadow="sm"
                h="400px"
              >
                <Text fontWeight="800" fontSize="md" color={useColorModeValue("gray.800", "white")} mb={4}>
                  Headcount by Department
                </Text>
                {loading ? (
                  <Flex align="center" justify="center" h="280px">
                    <Spinner size="md" />
                  </Flex>
                ) : stats?.deptStats?.length === 0 ? (
                  <Flex align="center" justify="center" h="280px">
                    <Text fontSize="sm" color="gray.500">No data available.</Text>
                  </Flex>
                ) : (
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={stats?.deptStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats?.deptStats?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors.dept[index % chartColors.dept.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: chartColors.tooltipBg, 
                          borderColor: chartColors.tooltipBorder,
                          borderRadius: '12px',
                          fontSize: '12px'
                        }} 
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>

              {/* Employment Type Distribution */}
              <Box
                bg={useColorModeValue("white", "gray.800")}
                border="1px solid"
                borderColor={useColorModeValue("gray.100", "gray.700")}
                borderRadius="2xl"
                p={{ base: 4, md: 6 }}
                boxShadow="sm"
                h="400px"
              >
                <Text fontWeight="800" fontSize="md" color={useColorModeValue("gray.800", "white")} mb={4}>
                  Employment Type Distribution
                </Text>
                {loading ? (
                  <Flex align="center" justify="center" h="280px">
                    <Spinner size="md" />
                  </Flex>
                ) : stats?.employmentStats?.length === 0 ? (
                  <Flex align="center" justify="center" h="280px">
                    <Text fontSize="sm" color="gray.500">No data available.</Text>
                  </Flex>
                ) : (
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={stats?.employmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="name" stroke="gray" fontSize={11} />
                      <YAxis stroke="gray" fontSize={11} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: chartColors.tooltipBg, 
                          borderColor: chartColors.tooltipBorder,
                          borderRadius: '12px',
                          fontSize: '12px'
                        }} 
                      />
                      <Bar dataKey="value" fill={chartColors.employment} radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {stats?.employmentStats?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors.dept[index % chartColors.dept.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>

              {/* Recruitment Pipeline */}
              <Box
                bg={useColorModeValue("white", "gray.800")}
                border="1px solid"
                borderColor={useColorModeValue("gray.100", "gray.700")}
                borderRadius="2xl"
                p={{ base: 4, md: 6 }}
                boxShadow="sm"
                h="400px"
                gridColumn={{ md: "span 2" }}
              >
                <Text fontWeight="800" fontSize="md" color={useColorModeValue("gray.800", "white")} mb={4}>
                  Candidate Recruitment Stages
                </Text>
                {loading ? (
                  <Flex align="center" justify="center" h="280px">
                    <Spinner size="md" />
                  </Flex>
                ) : stats?.candidateStages?.length === 0 ? (
                  <Flex align="center" justify="center" h="280px">
                    <Text fontSize="sm" color="gray.500">No candidate pipeline data.</Text>
                  </Flex>
                ) : (
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={stats?.candidateStages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="stage" stroke="gray" fontSize={11} />
                      <YAxis stroke="gray" fontSize={11} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: chartColors.tooltipBg, 
                          borderColor: chartColors.tooltipBorder,
                          borderRadius: '12px',
                          fontSize: '12px'
                        }} 
                      />
                      <Bar dataKey="count" fill={chartColors.candidates} radius={[6, 6, 0, 0]} maxBarSize={45}>
                        {stats?.candidateStages?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors.dept[(index + 3) % chartColors.dept.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default Dashboard;
