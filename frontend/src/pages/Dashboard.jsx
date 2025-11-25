// File: src/pages/Dashboard.jsx

import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import KpiCards from '../components/kpiCards';
import AnalyticsGraphs from '../components/AnalyticsGraphs';
import TasksAndAlerts from '../components/TasksAndAlerts';
import NotificationsPanel from '../components/NotificationsPanel';
import AssetDashboard from '../components/AssetDashboard';

const Dashboard = () => {
  return (
    // Reduce padding to move content upwards
    <Box pt={3} p={4} mt={-65}>
   {/* <Box mb={1} textAlign="left">
      <Text
        fontSize={{ base: '1xl', md: '2xl' }}         // Responsive font sizes
        fontWeight="bold"
        bgGradient="linear(to-r, teal.400, cyan.500, blue.500)" // Gradient color
        bgClip="text"                                  // Uses gradient as text color
        letterSpacing="wider"
        textShadow="1px 1px 2px rgba(0, 0, 0, 0.3)"    // Subtle shadow
        textTransform="uppercase"
        p={2}
      >
        Dashboard
      </Text>
    </Box> */}
      
      {/* Reduced gap between KpiCards and AnalyticsGraphs */}
      <Box mb={4}>
        <KpiCards />
      </Box>
      <Box mb={4}>
        <AssetDashboard />
      </Box>


      {/* Analytics Section */}
      <Flex direction="column" align="center" mb={4}>
        <AnalyticsGraphs />
      </Flex>
    </Box>
  );
};

export default Dashboard;
