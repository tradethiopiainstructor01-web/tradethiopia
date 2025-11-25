import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Spinner,
  Select,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useColorMode,
} from '@chakra-ui/react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import axios from 'axios';

const AnalyticsGraphs = () => {
  const { colorMode } = useColorMode();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('status');
  const toast = useToast();
  const COLORS = colorMode === "light" ? ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'] : ['#82ca9d', '#8884d8', '#ffc658', '#ff8042', '#00C49F'];

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/followup`);
      console.log("Response Data:", response.data); // Log the response data
      
      // The API returns {success: true, data: [...]} structure
      // We need to extract the actual follow-ups array from response.data.data
      const followUpsData = response.data && response.data.data ? response.data.data : [];
      setFollowUps(followUpsData);
    } catch (error) {
      console.error("Error fetching data:", error); // Log the error
      toast({
        title: 'Data Load Error',
        description: error.response?.data?.message || 'Failed to load follow-up data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Memoizing data transformations
  const statusCounts = useMemo(() => {
    // Ensure followUps is an array before using reduce
    if (!Array.isArray(followUps)) {
      return {};
    }
    
    return followUps.reduce((acc, curr) => {
      // Ensure curr and curr.status exist before accessing
      if (curr && curr.status) {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
      }
      return acc;
    }, {});
  }, [followUps]);

  const followUpDates = useMemo(() => {
    // Ensure followUps is an array before using reduce
    if (!Array.isArray(followUps)) {
      return {};
    }
    
    return followUps.reduce((acc, curr) => {
      // Ensure curr and curr.followUpDate exist before accessing
      if (curr && curr.followUpDate) {
        const date = new Date(curr.followUpDate).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
      }
      return acc;
    }, {});
  }, [followUps]);

  const statusData = useMemo(() =>
    Object.keys(statusCounts).map((key) => ({
      name: key,
      value: statusCounts[key],
    })), [statusCounts]
  );

  const followUpDateData = useMemo(() =>
    Object.keys(followUpDates).map((key) => ({
      date: key,
      count: followUpDates[key],
    })), [followUpDates]
  );

  // Ensure we have valid data for the last follow-up date calculation
  const lastFollowUpDate = useMemo(() => {
    if (!Array.isArray(followUps) || followUps.length === 0) {
      return 'N/A';
    }
    
    try {
      const validDates = followUps
        .filter(f => f && f.followUpDate)
        .map(f => new Date(f.followUpDate));
      
      if (validDates.length === 0) {
        return 'N/A';
      }
      
      const maxDate = new Date(Math.max(...validDates));
      return maxDate.toLocaleDateString();
    } catch (error) {
      console.error('Error calculating last follow-up date:', error);
      return 'N/A';
    }
  }, [followUps]);

  if (loading) {
    return (
      <Flex align="center" justify="center" h="100vh">
        <Spinner size="xl" />
        <Text ml={4}>Loading analytics data...</Text>
      </Flex>
    );
  }

  return (
    <Box p={5} pl={{ base: 5, md: 10 }} pr={{ base: 2, md: 10 }} bg={colorMode === "light" ? "gray.100" : "gray.800"}> {/* Change background based on color mode */}
      <Flex direction={{ base: 'column', md: 'row' }} mb={5} gap={5}>
        {/* Stats Box */}
        <Box
          bg={colorMode === "light" ? "white" : "gray.700"} // Change box background
          p={5}
          borderRadius="md"
          boxShadow="lg"
          flex="2"
          transition="all 0.3s ease"
          _hover={{
            boxShadow: 'xl',
            transform: 'translateY(-5px)',
          }}
        >
          <Flex direction="column" mb={5}>
            <Text fontSize="lg" fontWeight="bold" mb={2} color={colorMode === "light" ? "black" : "white"}>Filter Metrics:</Text>
            <Select
              width="100%"
              maxWidth="300px"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              bg={colorMode === "light" ? "white" : "gray.600"} // Change select background
              color={colorMode === "light" ? "black" : "white"} // Change select text color
            >
              <option value="status">Status</option>
              <option value="date">Follow-Up Dates</option>
            </Select>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Stat
              bg={colorMode === "light" ? "white" : "gray.700"} // Change stat background
              p={5}
              borderRadius="md"
              boxShadow="md"
              textAlign="center"
              transition="all 0.3s ease"
              _hover={{
                boxShadow: 'lg',
                transform: 'translateY(-5px)',
              }}
            >
              <StatLabel color={colorMode === "light" ? "black" : "white"}>Unique Statuses</StatLabel>
              <StatNumber color={colorMode === "light" ? "black" : "white"}>{Object.keys(statusCounts).length}</StatNumber>
              <StatHelpText color={colorMode === "light" ? "gray.600" : "gray.300"}>Across all records</StatHelpText>
            </Stat>
            <Stat
              bg={colorMode === "light" ? "white" : "gray.700"} // Change stat background
              p={5}
              borderRadius="md"
              boxShadow="md"
              textAlign="center"
              transition="all 0.3s ease"
              _hover={{
                boxShadow: 'lg',
                transform: 'translateY(-5px)',
              }}
            >
              <StatLabel color={colorMode === "light" ? "black" : "white"}>Last Follow-Up Date</StatLabel>
              <StatNumber color={colorMode === "light" ? "black" : "white"}>
                {lastFollowUpDate}
              </StatNumber>
              <StatHelpText color={colorMode === "light" ? "gray.600" : "gray.300"}>Most recent</StatHelpText>
            </Stat>
          </SimpleGrid>
        </Box>

        {/* Charts Box */}
        <Box
          bg={colorMode === "light" ? "white" : "gray.700"} // Change chart box background
          p={5}
          borderRadius="md"
          boxShadow="lg"
          flex="2"
          transition="all 0.3s ease"
          _hover={{
            boxShadow: 'xl',
            transform: 'translateY(-5px)',
          }}
        >
          {selectedMetric === 'status' ? (
            <PieChart width={400} height={300}>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <LineChart width={400} height={300} data={followUpDateData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke={colorMode === "light" ? "#8884d8" : "#82ca9d"} /> {/* Change line color */}
            </LineChart>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default AnalyticsGraphs;