import React, { useState, useEffect } from 'react';
import { 
  Box, Flex, HStack, VStack, Heading, Text, 
  Input, InputGroup, InputLeftElement, useColorModeValue, 
  SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, 
  Container, IconButton, useDisclosure, Badge, Progress,
  Card, CardHeader, CardBody, CardFooter, Button, Divider,
  Avatar, Menu, MenuButton, MenuList, MenuItem, MenuDivider,
  Icon, Tooltip, Skeleton, SkeletonText
} from '@chakra-ui/react';
import { 
  FiSearch, FiPlus, FiExternalLink, FiClock, 
  FiCheckCircle, FiAlertTriangle, FiInbox, FiBarChart2,
  FiHome, FiList, FiFileText, FiSettings, FiUser, FiBell,
  FiChevronDown, FiCalendar, FiTrendingUp, FiActivity, FiFilter,
  FiMoreVertical, FiInfo
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ITSidebar from './ITSidebar';
import ExternalTable from './ExternalTable';
import InternalTable from './InternalTable';
import AddTaskForm from './AddTaskForm';
import Reports from './Reports';
import axios from 'axios';

const MotionBox = motion.div;

// Enhanced Stat Card Component
const StatCard = ({ label, value, icon: Icon, colorScheme, helpText, trend, ...rest }) => (
  <MotionBox
    bg={useColorModeValue('white', 'gray.800')}
    p={6}
    borderRadius="2xl"
    boxShadow="0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)"
    borderWidth="1px"
    borderColor={useColorModeValue('gray.100', 'gray.700')}
    whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
    transition={{ duration: 0.3 }}
    position="relative"
    overflow="hidden"
    {...rest}
  >
    {/* Decorative Element */}
    <Box 
      position="absolute" 
      top="-20px" 
      right="-20px" 
      w="100px" 
      h="100px" 
      borderRadius="full" 
      bg={`${colorScheme}.50`}
      opacity="0.3"
    />
    
    <HStack spacing={4} align="center" position="relative" zIndex="1">
      <Box 
        p={3} 
        bg={`linear-gradient(135deg, ${colorScheme}.400, ${colorScheme}.600)`} 
        color="white" 
        borderRadius="xl"
        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
      >
        <Icon size={24} />
      </Box>
      <Box flex="1">
        <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')} fontWeight="medium">
          {label}
        </Text>
        <HStack alignItems="flex-end" spacing={2}>
          <Heading size="lg" mt={1} color={useColorModeValue('gray.800', 'white')}>
            {value}
          </Heading>
          {trend && (
            <Badge colorScheme={trend > 0 ? 'green' : 'red'} variant="subtle" fontSize="xs">
              {trend > 0 ? '+' : ''}{trend}%
            </Badge>
          )}
        </HStack>
        {helpText && (
          <Text mt={1} fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
            {helpText}
          </Text>
        )}
      </Box>
    </HStack>
  </MotionBox>
);

// Task Card Component
const TaskCard = ({ task, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'green';
      case 'ongoing': return 'blue';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'red';
      case 'Medium': return 'orange';
      case 'Low': return 'green';
      default: return 'gray';
    }
  };

  return (
    <MotionBox
      bg={useColorModeValue('white', 'gray.800')}
      borderRadius="xl"
      boxShadow="0 4px 6px rgba(0, 0, 0, 0.05)"
      p={5}
      cursor="pointer"
      whileHover={{ y: -3, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      borderWidth="1px"
      borderColor={useColorModeValue('gray.100', 'gray.700')}
    >
      <HStack justify="space-between" mb={3}>
        <Badge colorScheme={getStatusColor(task.status)} fontSize="xs">
          {task.status}
        </Badge>
        <Badge colorScheme={getPriorityColor(task.priority)} variant="subtle" fontSize="xs">
          {task.priority}
        </Badge>
      </HStack>
      
      <Text fontWeight="semibold" mb={2} noOfLines={1}>
        {task.title}
      </Text>
      
      <HStack spacing={2} mb={3}>
        <Icon as={FiCalendar} color={useColorModeValue('gray.500', 'gray.400')} boxSize={4} />
        <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
          {new Date(task.updatedAt).toLocaleDateString()}
        </Text>
      </HStack>
      
      <HStack justify="space-between">
        <HStack spacing={2}>
          <Avatar size="xs" name={task.assignee} src="" />
          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
            {task.assignee}
          </Text>
        </HStack>
        <Icon as={FiExternalLink} color={useColorModeValue('gray.500', 'gray.400')} boxSize={4} />
      </HStack>
    </MotionBox>
  );
};

// Project Distribution Chart
const ProjectDistributionChart = ({ data }) => {
  const COLORS = ['#4299E1', '#9F7AEA'];
  
  return (
    <Box h="300px">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip 
            contentStyle={{ 
              backgroundColor: useColorModeValue('white', 'gray.800'),
              borderColor: useColorModeValue('gray.200', 'gray.600'),
              borderRadius: '8px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Performance Chart
const PerformanceChart = ({ data }) => {
  return (
    <Box h="300px">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={useColorModeValue('gray.200', 'gray.600')} />
          <XAxis 
            dataKey="name" 
            stroke={useColorModeValue('gray.500', 'gray.400')} 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke={useColorModeValue('gray.500', 'gray.400')} 
            tick={{ fontSize: 12 }}
          />
          <RechartsTooltip 
            contentStyle={{ 
              backgroundColor: useColorModeValue('white', 'gray.800'),
              borderColor: useColorModeValue('gray.200', 'gray.600'),
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="completed" 
            stroke="#48BB78" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="inProgress" 
            stroke="#4299E1" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

const ITLayout = () => {
  const [active, setActive] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState({ 
    total: 0, 
    internal: 0, 
    external: 0, 
    completed: 0,
    inProgress: 0,
    pending: 0,
    highPriority: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch real data from the backend instead of using mock data
        // For now, we'll initialize with empty data
        setRecentTasks([]);
        setStats({
          total: 0,
          internal: 0,
          external: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          highPriority: 0
        });
        
        // Initialize charts with empty data
        setPerformanceData([]);
        setDistributionData([]);
      } catch (err) {
        console.warn('Failed to fetch IT data', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const renderDashboard = () => (
    <VStack spacing={8} align="stretch">
      {/* Stats Overview */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
        <StatCard 
          label="Total Tasks" 
          value={stats.total}
          icon={FiInbox}
          colorScheme="blue"
          helpText={`${stats.completed} completed`}
          trend={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) - 50 : 0}
        />
        <StatCard 
          label="In Progress" 
          value={stats.inProgress}
          icon={FiClock}
          colorScheme="yellow"
          helpText={`${stats.pending} pending`}
          trend={stats.inProgress > 0 ? Math.round((stats.inProgress / (stats.inProgress + stats.pending)) * 100) - 50 : 0}
        />
        <StatCard 
          label="High Priority" 
          value={stats.highPriority}
          icon={FiAlertTriangle}
          colorScheme="red"
          helpText="Needs attention"
          trend={stats.highPriority > 0 ? Math.round((stats.highPriority / stats.total) * 100) : 0}
        />
        <StatCard 
          label="Completed" 
          value={stats.completed}
          icon={FiCheckCircle}
          colorScheme="green"
          helpText={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% success rate`}
          trend={stats.completed > 0 ? Math.round((stats.completed / stats.total) * 100) - 50 : 0}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Performance Chart */}
        <Card bg={cardBg} borderRadius="2xl" boxShadow="sm" borderWidth="1px">
          <CardHeader pb={2}>
            <HStack justify="space-between">
              <Box>
                <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                  Performance Overview
                </Heading>
                <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                  Tasks completed vs in progress
                </Text>
              </Box>
              <Button size="sm" variant="outline" leftIcon={<FiBarChart2 />}>
                View Details
              </Button>
            </HStack>
          </CardHeader>
          <CardBody pt={2}>
            <PerformanceChart data={performanceData} />
          </CardBody>
        </Card>

        {/* Project Distribution */}
        <Card bg={cardBg} borderRadius="2xl" boxShadow="sm" borderWidth="1px">
          <CardHeader pb={2}>
            <HStack justify="space-between">
              <Box>
                <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                  Project Distribution
                </Heading>
                <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                  Internal vs External
                </Text>
              </Box>
              <IconButton 
                icon={<FiMoreVertical />} 
                aria-label="More options"
                variant="ghost"
                size="sm"
              />
            </HStack>
          </CardHeader>
          <CardBody pt={2}>
            <ProjectDistributionChart data={distributionData} />
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Recent Activity */}
      <Card bg={cardBg} borderRadius="2xl" boxShadow="sm" borderWidth="1px">
        <CardHeader pb={4}>
          <HStack justify="space-between">
            <Box>
              <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                Recent Activity
              </Heading>
              <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                Latest updates and tasks
              </Text>
            </Box>
            <HStack>
              <Button 
                size="sm" 
                variant="outline" 
                leftIcon={<FiFilter />}
              >
                Filter
              </Button>
              <Button 
                size="sm" 
                colorScheme="blue" 
                leftIcon={<FiPlus />}
                onClick={onOpen}
              >
                New Task
              </Button>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody pt={2}>
          {isLoading ? (
            <VStack spacing={4}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height="120px" borderRadius="xl" />
              ))}
            </VStack>
          ) : recentTasks.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
              {recentTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => console.log('Task clicked:', task.id)}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Box textAlign="center" py={12} color={useColorModeValue('gray.500', 'gray.400')}>
              <Icon as={FiInbox} boxSize={12} mb={4} />
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                No recent activities
              </Text>
              <Text>
                There are no tasks to display at the moment.
              </Text>
            </Box>
          )}
        </CardBody>
      </Card>
    </VStack>
  );

  // Pre-render all components to maintain consistent hook order
  const externalTable = <ExternalTable search={query} />;
  const internalTable = <InternalTable search={query} />;
  const addTaskForm = <AddTaskForm isOpen={isOpen} onClose={onClose} onDone={() => setActive('dashboard')} />;
  const reports = <Reports />;
  const dashboard = renderDashboard();

  const renderContent = () => {
    switch (active) {
      case 'external': 
        return externalTable;
      case 'internal': 
        return internalTable;
      case 'add': 
        return addTaskForm;
      case 'reports': 
        return reports;
      default:
        return dashboard;
    }
  };

  return (
    <Flex minH="100vh" bg={bg}>
      {/* Sidebar */}
      <Box 
        as="aside" 
        width={{ base: '80px', lg: '280px' }} 
        p={{ base: 3, lg: 6 }}
        borderRight="1px solid" 
        borderColor={useColorModeValue('gray.100', 'gray.700')}
        bg={useColorModeValue('white', 'gray.800')}
        position="relative"
        zIndex="docked"
      >
        <VStack align="stretch" spacing={8} h="full">
          {/* Logo/Brand */}
          <Box px={{ base: 0, lg: 2 }} py={4} textAlign={{ base: 'center', lg: 'left' }}>
            <Text 
              fontWeight="bold" 
              fontSize={{ base: 'lg', lg: '2xl' }} 
              display={{ base: 'none', lg: 'block' }}
              bgGradient="linear(to-r, blue.500, purple.500)"
              bgClip="text"
            >
              IT Dashboard
            </Text>
            <Text 
              fontWeight="bold" 
              fontSize="lg" 
              display={{ base: 'block', lg: 'none' }}
              bgGradient="linear(to-r, blue.500, purple.500)"
              bgClip="text"
            >
              IT
            </Text>
          </Box>

          {/* Navigation */}
          <VStack spacing={2} align={{ base: 'center', lg: 'stretch' }} px={{ lg: 2 }} flex="1">
            <Tooltip label="Dashboard" placement="right" hasArrow>
              <Button
                leftIcon={<FiHome />}
                justifyContent={{ base: 'center', lg: 'flex-start' }}
                variant={active === 'dashboard' ? 'solid' : 'ghost'}
                colorScheme={active === 'dashboard' ? 'blue' : 'gray'}
                onClick={() => setActive('dashboard')}
                w="full"
                size={{ base: 'md', lg: 'lg' }}
                borderRadius="lg"
              >
                <Text display={{ base: 'none', lg: 'block' }}>Dashboard</Text>
              </Button>
            </Tooltip>
            
            <Box w="full">
              <Text 
                display={{ base: 'none', lg: 'block' }} 
                px={4} 
                py={2} 
                color="gray.500" 
                fontSize="sm" 
                fontWeight="medium"
              >
                PROJECTS
              </Text>
            </Box>
            
            <Tooltip label="External Tasks" placement="right" hasArrow>
              <Button
                leftIcon={<FiList />}
                justifyContent={{ base: 'center', lg: 'flex-start' }}
                variant={active === 'external' ? 'solid' : 'ghost'}
                colorScheme={active === 'external' ? 'purple' : 'gray'}
                onClick={() => setActive('external')}
                w="full"
                size={{ base: 'md', lg: 'lg' }}
                borderRadius="lg"
              >
                <Text display={{ base: 'none', lg: 'block' }}>External Tasks</Text>
              </Button>
            </Tooltip>
            
            <Tooltip label="Internal Tasks" placement="right" hasArrow>
              <Button
                leftIcon={<FiList />}
                justifyContent={{ base: 'center', lg: 'flex-start' }}
                variant={active === 'internal' ? 'solid' : 'ghost'}
                colorScheme={active === 'internal' ? 'blue' : 'gray'}
                onClick={() => setActive('internal')}
                w="full"
                size={{ base: 'md', lg: 'lg' }}
                borderRadius="lg"
              >
                <Text display={{ base: 'none', lg: 'block' }}>Internal Tasks</Text>
              </Button>
            </Tooltip>
            
            <Tooltip label="Reports" placement="right" hasArrow>
              <Button
                leftIcon={<FiFileText />}
                justifyContent={{ base: 'center', lg: 'flex-start' }}
                variant={active === 'reports' ? 'solid' : 'ghost'}
                colorScheme={active === 'reports' ? 'green' : 'gray'}
                onClick={() => setActive('reports')}
                w="full"
                size={{ base: 'md', lg: 'lg' }}
                borderRadius="lg"
              >
                <Text display={{ base: 'none', lg: 'block' }}>Reports</Text>
              </Button>
            </Tooltip>
          </VStack>

          {/* User Profile */}
          <Box>
            <Divider mb={4} display={{ base: 'none', lg: 'block' }} />
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                w="full"
                py={4}
                borderRadius="xl"
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              >
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Avatar size="sm" name="User Name" src="" />
                    <Box display={{ base: 'none', lg: 'block' }} textAlign="left">
                      <Text fontWeight="medium" fontSize="sm">Admin User</Text>
                      <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                        IT Administrator
                      </Text>
                    </Box>
                  </HStack>
                  <Icon 
                    as={FiChevronDown} 
                    display={{ base: 'none', lg: 'block' }} 
                    color={useColorModeValue('gray.500', 'gray.400')} 
                  />
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FiUser />}>Profile</MenuItem>
                <MenuItem icon={<FiSettings />}>Settings</MenuItem>
                <MenuItem icon={<FiActivity />}>Activity Log</MenuItem>
                <MenuDivider />
                <MenuItem>Sign Out</MenuItem>
              </MenuList>
            </Menu>
          </Box>
        </VStack>
      </Box>

      {/* Main Content */}
      <Box as="main" flex="1" overflowY="auto" p={{ base: 4, lg: 8 }}>
        <Container maxW="container.xl" px={{ base: 0, lg: 4 }}>
          {/* Header */}
          <Box 
            bg={cardBg}
            p={{ base: 4, lg: 6 }}
            borderRadius="2xl"
            boxShadow="0 4px 6px rgba(0, 0, 0, 0.05)"
            mb={8}
            position="sticky"
            top={0}
            zIndex="sticky"
            borderBottom="1px solid"
            borderColor={useColorModeValue('gray.100', 'gray.700')}
          >
            <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" align={{ base: 'stretch', lg: 'center' }} gap={4}>
              <Box>
                <Heading size="lg" mb={1} color={useColorModeValue('gray.800', 'white')}>
                  IT Operations Dashboard
                </Heading>
                <Text color={useColorModeValue('gray.600', 'gray.300')} fontSize="sm">
                  Manage and monitor all IT projects and tasks
                </Text>
              </Box>

              <HStack spacing={4} w={{ base: 'full', lg: 'auto' }}>
                <InputGroup maxW={{ base: '100%', lg: '300px' }}>
                  <InputLeftElement pointerEvents="none" color="gray.400">
                    <FiSearch />
                  </InputLeftElement>
                  <Input 
                    placeholder="Search tasks, projects..." 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                    }}
                    borderRadius="lg"
                    transition="all 0.2s"
                  />
                </InputGroup>
                
                <IconButton 
                  icon={<FiBell />} 
                  aria-label="Notifications"
                  variant="ghost"
                  borderRadius="full"
                  position="relative"
                >
                  <Box 
                    position="absolute" 
                    top="0" 
                    right="0" 
                    w={2} 
                    h={2} 
                    bg="red.500" 
                    borderRadius="full" 
                  />
                </IconButton>
              </HStack>
            </Flex>
          </Box>

          {/* Main Content */}
          <Box>
            {isLoading ? (
              <Box textAlign="center" py={20}>
                <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="2" />
              </Box>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {renderContent()}
              </motion.div>
            )}
          </Box>
        </Container>
      </Box>
    </Flex>
  );
};

export default ITLayout;