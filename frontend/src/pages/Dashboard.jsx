// File: src/pages/Dashboard.jsx

import React, { useState } from 'react';
import { Box, Flex, Text, Button, useToast, Input, Heading, useColorModeValue, SimpleGrid, Icon, HStack } from '@chakra-ui/react';
import { FiUsers, FiBox, FiBarChart2, FiPlusCircle } from 'react-icons/fi';
import KpiCards from '../components/kpiCards';
import AnalyticsGraphs from '../components/AnalyticsGraphs';
import TasksAndAlerts from '../components/TasksAndAlerts';
import NotificationsPanel from '../components/NotificationsPanel';
import AssetDashboard from '../components/AssetDashboard';
import AwardsPanel from '../components/AwardsPanel';
import CompletedSalesTable from '../components/salesmanager/CompletedSalesTable';
import { useUserStore } from '../store/user';
import { calculateAwards } from '../services/awardService';
import { Link as RouterLink } from 'react-router-dom';

const getCurrentMonth = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}`;
};

const AdminAssetSection = ({ currentUser }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [month, setMonth] = useState(getCurrentMonth());

  const handleCalculate = async () => {
    if (!confirm(`Publish awards for ${month}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await calculateAwards(month);
      if (res && res.success) {
        toast({ title: 'Awards published', description: `Published ${res.data.length} awards`, status: 'success', duration: 5000 });
      } else {
        toast({ title: 'Failed', description: res.message || 'Unknown error', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err?.response?.data?.message || err.message || String(err), status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mb={4}>
      <Flex mb={3} align="center" justify="space-between">
        <Text fontWeight="bold">Asset Dashboard</Text>
        <Flex gap={3} align="center">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} max={getCurrentMonth()} size="sm" borderRadius="xl" />
          <Button colorScheme="teal" size="sm" onClick={handleCalculate} isLoading={loading} loadingText="Publishing..." borderRadius="xl">
            Calculate Awards ({month})
          </Button>
        </Flex>
      </Flex>
      <AssetDashboard />
    </Box>
  );
};

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
      _hover={{ borderColor: color, transform: "translateY(-2px)", shadow: "md" }}
      transition="all 0.2s ease"
      cursor="pointer"
    >
      <Flex align="center" gap={3}>
        <Flex
          w="36px" h="36px"
          align="center" justify="center"
          borderRadius="lg"
          bg={`${color}.50`}
          color={`${color}.500`}
        >
          <Icon as={icon} boxSize={4} />
        </Flex>
        <Text fontSize="sm" fontWeight="600" color={useColorModeValue("gray.700", "gray.200")}>{label}</Text>
      </Flex>
    </Box>
  );
};

const SectionCard = ({ title, children }) => {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  return (
    <Box
      bg={bg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="2xl"
      p={{ base: 4, md: 6 }}
      mb={6}
    >
      {title && (
        <Text fontWeight="700" fontSize="md" mb={4} color={useColorModeValue("gray.800", "white")}>
          {title}
        </Text>
      )}
      {children}
    </Box>
  );
};

const Dashboard = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const greetingTime = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

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
      >
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Box>
            <Text fontSize="xs" fontWeight="600" color={useColorModeValue("gray.400", "gray.500")} textTransform="uppercase" letterSpacing="wider" mb={1}>
              {greetingTime}
            </Text>
            <Heading size="lg" fontWeight="800" mb={1} color={useColorModeValue("gray.900", "white")}>
              Welcome back, {currentUser?.username || "Admin"} 👋
            </Heading>
            <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
              Here is what's happening in your organization today.
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
            <Text fontSize="10px" fontWeight="600" color="gray.400" letterSpacing="wider" textTransform="uppercase">
              TODAY
            </Text>
            <Text fontSize="sm" fontWeight="700" color={useColorModeValue("gray.800", "white")}>
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </Box>
        </Flex>

        {/* Quick Actions Row */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mt={5}>
          <QuickActionCard icon={FiPlusCircle} label="Add Employee" to="/create" color="blue" />
          <QuickActionCard icon={FiUsers} label="Manage Accounts" to="/users" color="purple" />
          <QuickActionCard icon={FiBox} label="Asset Inventory" to="/assets" color="orange" />
          <QuickActionCard icon={FiBarChart2} label="View Reports" to="/reports" color="teal" />
        </SimpleGrid>
      </Box>

      {/* KPI Cards */}
      <Box mb={6}>
        <KpiCards />
      </Box>

      {/** Show asset dashboard only for admin users */}
      {currentUser && (currentUser.role === 'admin' || currentUser.normalizedRole === 'admin') && (
        <>
          <SectionCard title="Asset Dashboard">
            <AdminAssetSection currentUser={currentUser} />
          </SectionCard>
          <SectionCard title="Monthly Awards">
            <AwardsPanel month={getCurrentMonth()} />
          </SectionCard>
          <SectionCard title="Completed Sales Follow-ups">
            <CompletedSalesTable />
          </SectionCard>
        </>
      )}

      {/* Analytics Section */}
      <SectionCard title="Analytics Overview">
        <AnalyticsGraphs />
      </SectionCard>
    </Box>
  );
};

export default Dashboard;
