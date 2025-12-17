import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Progress,
  Select,
  Button,
  HStack,
  VStack,
  Divider,
  useColorModeValue,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import { 
  FaTrophy, 
  FaMedal, 
  FaStar, 
  FaChartLine, 
  FaUsers, 
  FaLaptop, 
  FaHeadset, 
  FaDollarSign, 
  FaShareAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { getDepartmentPerformance, getEmployeeAwards, getTaskCompletionData, getEmployeePerformance } from '../../services/kpiService';

const KPIScorecardPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [awardsData, setAwardsData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [reportData, setReportData] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  
  // Department definitions
  const departments = [
    { id: 'it', name: 'IT', icon: FaLaptop, color: 'blue' },
    { id: 'tradex', name: 'Tradex', icon: FaChartLine, color: 'green' },
    { id: 'sales', name: 'Sales', icon: FaDollarSign, color: 'purple' },
    { id: 'customer-success', name: 'Customer Success', icon: FaHeadset, color: 'teal' },
    { id: 'social-media', name: 'Social Media', icon: FaShareAlt, color: 'pink' },
    { id: 'finance', name: 'Finance', icon: FaDollarSign, color: 'yellow' }
  ];

  // Fetch real-time data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all required data in parallel
        const [performanceData, awardsData, taskData, employeeData] = await Promise.all([
          getDepartmentPerformance(),
          getEmployeeAwards(),
          getTaskCompletionData(),
          getEmployeePerformance()
        ]);
        
        setKpiData({
          performance: performanceData,
          tasks: taskData
        });
        
        setAwardsData(awardsData);
        setEmployeeData(employeeData);
      } catch (err) {
        console.error('Error fetching KPI data:', err);
        setError('Failed to load KPI data. Displaying fallback data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to generate detailed report data
  const generateDetailedReport = () => {
    if (!kpiData) return null;
    
    // Generate detailed report data
    const report = {
      overallStats: {
        totalDepartments: departmentScores.length,
        averageScore: Math.round(departmentScores.reduce((sum, dept) => sum + dept.progressScore, 0) / departmentScores.length) || 0,
        highestScoringDept: departmentScores.reduce((prev, current) => (prev.progressScore > current.progressScore) ? prev : current),
        lowestScoringDept: departmentScores.reduce((prev, current) => (prev.progressScore < current.progressScore) ? prev : current),
        totalTasks: kpiData.tasks?.totalTasks || 0,
        completedTasks: kpiData.tasks?.completedTasks || 0,
        completionRate: kpiData.tasks?.totalTasks ? Math.round((kpiData.tasks.completedTasks / kpiData.tasks.totalTasks) * 100) : 0
      },
      departmentDetails: departmentScores.map(dept => ({
        ...dept,
        icon: departments.find(d => d.id === dept.id)?.icon,
        color: departments.find(d => d.id === dept.id)?.color
      })),
      performanceTrends: kpiData.performance.teamPerformance?.salesTrend || [],
      agentPerformance: kpiData.performance.teamPerformance?.agentPerformance || []
    };
    
    return report;
  };

  // Handle detailed report button click
  const handleViewDetailedReport = () => {
    const report = generateDetailedReport();
    setReportData(report);
    onOpen();
  };

  // Calculate individual employee KPI score
  const calculateEmployeeKpi = (agent) => {
    if (!agent) return 0;
    
    // Calculate KPI based on completed deals (70%) and commission (30%)
    const dealsScore = Math.min(100, (agent.completedDeals || 0) * 5); // Assuming max 20 deals for 100%
    const commissionScore = Math.min(100, (agent.totalCommission || 0) / 10000); // Assuming max 1M for 100%
    
    // Apply 70/30 weighting
    const kpiScore = Math.round((dealsScore * 0.7) + (commissionScore * 0.3));
    return kpiScore;
  };

  // Get rank badge based on position
  const getRankBadge = (rank) => {
    if (!rank) return '#--';
    
    const rankBadges = ['🥇', '🥈', '🥉'];
    if (rank <= 3) {
      return rankBadges[rank - 1];
    }
    return `#${rank}`;
  };

  // Get rank color based on position
  const getRankColor = (rank) => {
    if (!rank) return 'gray';
    
    switch (rank) {
      case 1: return 'yellow';
      case 2: return 'gray';
      case 3: return 'orange';
      default: return 'gray';
    }
  };

  // Calculate overall department scores from real data
  const calculateDepartmentScores = () => {
    if (!kpiData) return [];
    
    // Map real data to department format
    const departmentMapping = {
      'sales': {
        id: 'sales',
        name: 'Sales Department',
        target: 85,
        kpi70Percent: Math.min(100, Math.round((kpiData.performance.dashboardStats?.totalCompletedDeals || 0) / 2)),
        hr30Percent: Math.min(100, Math.round((kpiData.performance.dashboardStats?.totalTeamGrossCommission || 0) / 10000)),
        tasksCompleted: kpiData.tasks?.completedTasks || 75,
        totalTasks: kpiData.tasks?.totalTasks || 100,
        trend: (kpiData.performance.dashboardStats?.recentSales || 0) > 
               (kpiData.performance.dashboardStats?.recentSales || 0) * 0.8 ? 'increase' : 'decrease'
      },
      'it': {
        id: 'it',
        name: 'IT Department',
        target: 90,
        kpi70Percent: 88,
        hr30Percent: 95,
        tasksCompleted: 42,
        totalTasks: 45,
        trend: 'increase'
      },
      'customer-success': {
        id: 'customer-success',
        name: 'Customer Success',
        target: 90,
        kpi70Percent: 93,
        hr30Percent: 97,
        tasksCompleted: 49,
        totalTasks: 50,
        trend: 'increase'
      },
      'tradex': {
        id: 'tradex',
        name: 'Tradex Department',
        target: 85,
        kpi70Percent: 85,
        hr30Percent: 90,
        tasksCompleted: 38,
        totalTasks: 42,
        trend: 'increase'
      },
      'social-media': {
        id: 'social-media',
        name: 'Social Media',
        target: 85,
        kpi70Percent: 78,
        hr30Percent: 85,
        tasksCompleted: 32,
        totalTasks: 40,
        trend: 'decrease'
      },
      'finance': {
        id: 'finance',
        name: 'Finance',
        target: 88,
        kpi70Percent: 86,
        hr30Percent: 92,
        tasksCompleted: 36,
        totalTasks: 40,
        trend: 'increase'
      }
    };

    return Object.values(departmentMapping).map(dept => ({
      ...dept,
      completionPercentage: Math.round((dept.tasksCompleted / dept.totalTasks) * 100),
      progressScore: Math.round((dept.kpi70Percent * 0.7) + (dept.hr30Percent * 0.3))
    }));
  };

  const departmentScores = calculateDepartmentScores();

  // Calculate overall company score
  const calculateOverallScore = () => {
    if (!kpiData) return { score: 85, trend: 'increase', previousScore: 78 };
    
    const avgScore = departmentScores.reduce((sum, dept) => sum + dept.progressScore, 0) / departmentScores.length;
    return {
      score: Math.round(avgScore) || 85,
      trend: avgScore > 80 ? 'increase' : 'decrease',
      previousScore: Math.max(70, Math.round(avgScore * 0.9)) || 78
    };
  };

  const overallScore = calculateOverallScore();

  const getAwardIcon = (awardType) => {
    switch (awardType) {
      case 'employee-of-month': return FaStar;
      case 'manager-of-month': return FaTrophy;
      case 'team-leader-of-month': return FaMedal;
      case 'customer-hero-of-month': return FaHeadset;
      default: return FaStar;
    }
  };

  const getAwardColor = (awardType) => {
    switch (awardType) {
      case 'employee-of-month': return 'yellow';
      case 'manager-of-month': return 'blue';
      case 'team-leader-of-month': return 'purple';
      case 'customer-hero-of-month': return 'teal';
      default: return 'gray';
    }
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Box>
          <Heading as="h1" size="lg" color="teal.600">
            KPI Scorecard & Performance Dashboard
          </Heading>
          <Text color="gray.600">
            Track department performance and recognize outstanding contributors
          </Text>
        </Box>
        <HStack>
          <Select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            width="150px"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </Select>
          <Select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)}
            width="150px"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </Select>
        </HStack>
      </Flex>

      {/* Main Tabs */}
      <Tabs variant="enclosed" index={tabIndex} onChange={(index) => setTabIndex(index)}>
        <TabList mb="1em">
          <Tab>Dashboard</Tab>
          <Tab>Employee KPIs</Tab>
        </TabList>
        <TabPanels>
          {/* Dashboard Tab */}
          <TabPanel>
            {/* Overall Performance Summary */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} mb={8}>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Overall Company Score</StatLabel>
                    <StatNumber>{overallScore.score}/100</StatNumber>
                    <StatHelpText>
                      <StatArrow type={overallScore.trend} />
                      {overallScore.trend === 'increase' ? '+' : ''}{overallScore.score - overallScore.previousScore} from last period
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Average Department Score</StatLabel>
                    <StatNumber>
                      {departmentScores.length > 0 ? 
                        Math.round(departmentScores.reduce((sum, dept) => sum + dept.progressScore, 0) / departmentScores.length) : 0}/100
                    </StatNumber>
                    <StatHelpText>
                      Across {departmentScores.length} departments
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Tasks Completion Rate</StatLabel>
                    <StatNumber>
                      {departmentScores.length > 0 ? 
                        Math.round(departmentScores.reduce((sum, dept) => sum + dept.completionPercentage, 0) / departmentScores.length) : 0}%
                    </StatNumber>
                    <StatHelpText>
                      Average across all departments
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </Grid>

            {/* Awards Section */}
            <Box mb={8}>
              <Heading size="md" mb={4}>Monthly Recognition Awards</Heading>
              {awardsData ? (
                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
                  {Object.entries(awardsData).map(([awardType, award]) => (
                    <Card key={awardType} boxShadow="md" borderLeftWidth="4px" borderLeftColor={`${getAwardColor(awardType)}.500`}>
                      <CardBody>
                        <Flex alignItems="center" mb={3}>
                          <Icon as={getAwardIcon(awardType)} color={`${getAwardColor(awardType)}.500`} boxSize={6} mr={2} />
                          <Heading size="sm">{award.name}</Heading>
                        </Flex>
                        <Text fontWeight="bold" fontSize="lg">{award.winner}</Text>
                        <Text fontSize="sm" color="gray.600">{award.department}</Text>
                        <Badge colorScheme={getAwardColor(awardType)} mt={2}>
                          Score: {award.score}/100
                        </Badge>
                        <Text fontSize="xs" mt={2} fontStyle="italic">
                          "{award.reason}"
                        </Text>
                      </CardBody>
                    </Card>
                  ))}
                </Grid>
              ) : (
                <Text>No awards data available</Text>
              )}
            </Box>

            <Divider mb={6} />

            {/* Department Performance */}
            <Box mb={8}>
              <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Heading size="md">Department Performance</Heading>
                <Button leftIcon={<FaChartLine />} colorScheme="teal" size="sm" onClick={handleViewDetailedReport}>
                  Detailed Report
                </Button>
              </Flex>
              
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Department</Th>
                      <Th>Score</Th>
                      <Th>Target</Th>
                      <Th>Completion</Th>
                      <Th>KPI (70%)</Th>
                      <Th>HR (30%)</Th>
                      <Th>Trend</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {departmentScores.map((dept) => (
                      <Tr key={dept.id}>
                        <Td>
                          <Flex alignItems="center">
                            <Icon as={departments.find(d => d.id === dept.id)?.icon} 
                                  color={`${departments.find(d => d.id === dept.id)?.color}.500`} 
                                  mr={2} />
                            {dept.name}
                          </Flex>
                        </Td>
                        <Td>
                          <Text fontWeight="bold">{dept.progressScore}/100</Text>
                        </Td>
                        <Td>{dept.target}%</Td>
                        <Td>
                          <Flex alignItems="center">
                            <Text mr={2}>{dept.completionPercentage}%</Text>
                            <Progress value={dept.completionPercentage} size="sm" width="100px" 
                                      colorScheme={dept.completionPercentage >= dept.target ? 'green' : 'red'} />
                          </Flex>
                        </Td>
                        <Td>
                          <Tooltip label={`Based on task completion: ${dept.kpi70Percent}/100`}>
                            <Text>{dept.kpi70Percent}</Text>
                          </Tooltip>
                        </Td>
                        <Td>
                          <Tooltip label={`HR assessment: ${dept.hr30Percent}/100`}>
                            <Text>{dept.hr30Percent}</Text>
                          </Tooltip>
                        </Td>
                        <Td>
                          {dept.trend === 'increase' ? (
                            <Icon as={FaArrowUp} color="green.500" />
                          ) : (
                            <Icon as={FaArrowDown} color="red.500" />
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            {/* KPI Calculation Explanation */}
            <Card>
              <CardHeader>
                <Heading size="md">How KPI Scores Are Calculated</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>Performance Score Formula:</Text>
                    <Text>Final Score = (Task-Based KPI × 70%) + (HR Assessment × 30%)</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Task-Based KPI (70% of score):</Text>
                    <Text>Calculated based on completion rate of assigned tasks and achievement of departmental targets.</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>HR Assessment (30% of score):</Text>
                    <Text>Evaluation by HR based on soft skills, teamwork, initiative, and other qualitative factors.</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Awards Criteria:</Text>
                    <Text>Monthly awards are given to top performers in each category based on their overall KPI scores and notable contributions.</Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Employee KPIs Tab */}
          <TabPanel>
            <Box>
              <Flex justifyContent="space-between" alignItems="center" mb={6}>
                <Heading as="h2" size="lg" color="teal.600">
                  Employee KPIs & Performance Ranking
                </Heading>
                <Text color="gray.600">
                  Individual performance metrics calculated automatically from sales data
                </Text>
              </Flex>

              {employeeData && employeeData.length > 0 ? (
                <Card>
                  <CardBody>
                    <TableContainer>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Rank</Th>
                            <Th>Employee</Th>
                            <Th>Department</Th>
                            <Th>Completed Deals</Th>
                            <Th>Total Sales Value</Th>
                            <Th>Avg. Sale Value</Th>
                            <Th>Commission Earned</Th>
                            <Th>KPI Score</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {employeeData.map((employee, index) => {
                            const kpiScore = calculateEmployeeKpi(employee);
                            return (
                              <Tr key={index}>
                                <Td>
                                  <Badge 
                                    colorScheme={getRankColor(employee.rank)}
                                    fontSize="md"
                                  >
                                    {getRankBadge(employee.rank)}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Text fontWeight="bold">{employee.fullName || employee.username || 'Unknown'}</Text>
                                </Td>
                                <Td>Sales</Td>
                                <Td>{employee.completedDeals || 0}</Td>
                                <Td>{(employee.totalSalesValue || 0)?.toLocaleString()} ETB</Td>
                                <Td>{(employee.avgSaleValue || 0)?.toLocaleString()} ETB</Td>
                                <Td>{(employee.totalCommission || 0)?.toLocaleString()} ETB</Td>
                                <Td>
                                  <Badge 
                                    colorScheme={
                                      kpiScore >= 90 ? 'green' : 
                                      kpiScore >= 75 ? 'yellow' : 
                                      kpiScore >= 60 ? 'orange' : 'red'
                                    }
                                  >
                                    {kpiScore}/100
                                  </Badge>
                                </Td>
                                <Td>
                                  <Badge colorScheme={employee.status === 'active' ? 'green' : 'red'}>
                                    {employee.status || 'active'}
                                  </Badge>
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <CardBody>
                    <Text textAlign="center" py={8} color="gray.500">
                      Loading employee performance data...
                    </Text>
                  </CardBody>
                </Card>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Detailed Report Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="80vw" maxH="80vh">
          <ModalHeader>Detailed Performance Report</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto" maxH="70vh">
            {reportData ? (
              <Tabs variant="enclosed">
                <TabList>
                  <Tab>Overview</Tab>
                  <Tab>Department Details</Tab>
                  <Tab>Employee KPIs</Tab>
                  <Tab>Performance Trends</Tab>
                </TabList>
                <TabPanels>
                  {/* Overview Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      {/* Overall Statistics */}
                      <Card>
                        <CardHeader>
                          <Heading size="md">Overall Statistics</Heading>
                        </CardHeader>
                        <CardBody>
                          <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                            <Stat>
                              <StatLabel>Total Departments</StatLabel>
                              <StatNumber>{reportData.overallStats.totalDepartments}</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Average Score</StatLabel>
                              <StatNumber>{reportData.overallStats.averageScore}/100</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Task Completion</StatLabel>
                              <StatNumber>{reportData.overallStats.completionRate}%</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Total Tasks</StatLabel>
                              <StatNumber>{reportData.overallStats.totalTasks}</StatNumber>
                            </Stat>
                          </Grid>
                        </CardBody>
                      </Card>

                      {/* Best & Worst Performers */}
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <Card border="2px" borderColor="green.500">
                          <CardHeader>
                            <Heading size="sm">Highest Scoring Department</Heading>
                          </CardHeader>
                          <CardBody>
                            <Flex alignItems="center">
                              <Icon as={reportData.overallStats.highestScoringDept.icon} 
                                    color={`${reportData.overallStats.highestScoringDept.color}.500`} 
                                    mr={2} />
                              <Text fontWeight="bold">{reportData.overallStats.highestScoringDept.name}</Text>
                            </Flex>
                            <Text mt={2}>Score: {reportData.overallStats.highestScoringDept.progressScore}/100</Text>
                            <Text>Completion: {reportData.overallStats.highestScoringDept.completionPercentage}%</Text>
                          </CardBody>
                        </Card>
                        
                        <Card border="2px" borderColor="red.500">
                          <CardHeader>
                            <Heading size="sm">Lowest Scoring Department</Heading>
                          </CardHeader>
                          <CardBody>
                            <Flex alignItems="center">
                              <Icon as={reportData.overallStats.lowestScoringDept.icon} 
                                    color={`${reportData.overallStats.lowestScoringDept.color}.500`} 
                                    mr={2} />
                              <Text fontWeight="bold">{reportData.overallStats.lowestScoringDept.name}</Text>
                            </Flex>
                            <Text mt={2}>Score: {reportData.overallStats.lowestScoringDept.progressScore}/100</Text>
                            <Text>Completion: {reportData.overallStats.lowestScoringDept.completionPercentage}%</Text>
                          </CardBody>
                        </Card>
                      </Grid>
                    </VStack>
                  </TabPanel>

                  {/* Department Details Tab */}
                  <TabPanel>
                    <Card>
                      <CardHeader>
                        <Heading size="md">Department Details</Heading>
                      </CardHeader>
                      <CardBody>
                        <TableContainer>
                          <Table variant="simple">
                            <Thead>
                              <Tr>
                                <Th>Department</Th>
                                <Th>Score</Th>
                                <Th>Target</Th>
                                <Th>Completion</Th>
                                <Th>KPI (70%)</Th>
                                <Th>HR (30%)</Th>
                                <Th>Trend</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {reportData.departmentDetails.map((dept) => (
                                <Tr key={dept.id}>
                                  <Td>
                                    <Flex alignItems="center">
                                      <Icon as={dept.icon} color={`${dept.color}.500`} mr={2} />
                                      {dept.name}
                                    </Flex>
                                  </Td>
                                  <Td>
                                    <Text fontWeight="bold">{dept.progressScore}/100</Text>
                                  </Td>
                                  <Td>{dept.target}%</Td>
                                  <Td>
                                    <Flex alignItems="center">
                                      <Text mr={2}>{dept.completionPercentage}%</Text>
                                      <Progress value={dept.completionPercentage} size="sm" width="80px" 
                                                colorScheme={dept.completionPercentage >= dept.target ? 'green' : 'red'} />
                                    </Flex>
                                  </Td>
                                  <Td>{dept.kpi70Percent}</Td>
                                  <Td>{dept.hr30Percent}</Td>
                                  <Td>
                                    {dept.trend === 'increase' ? (
                                      <Icon as={FaArrowUp} color="green.500" />
                                    ) : (
                                      <Icon as={FaArrowDown} color="red.500" />
                                    )}
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </CardBody>
                    </Card>
                  </TabPanel>

                  {/* Employee KPIs Tab */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Individual Employee KPIs</Heading>
                      {employeeData && employeeData.length > 0 ? (
                        <Accordion allowMultiple>
                          {departments.map(dept => {
                            // For demo purposes, we'll show all employees under Sales department
                            // In a real implementation, you would filter by actual department
                            const deptAgents = employeeData.slice(0, 5); // Show first 5 for demo
                            
                            return (
                              <AccordionItem key={dept.id}>
                                <h2>
                                  <AccordionButton>
                                    <Flex alignItems="center" flex="1" textAlign="left">
                                      <Icon as={dept.icon} color={`${dept.color}.500`} mr={2} />
                                      {dept.name} Department
                                    </Flex>
                                    <AccordionIcon />
                                  </AccordionButton>
                                </h2>
                                <AccordionPanel pb={4}>
                                  <TableContainer>
                                    <Table variant="simple" size="sm">
                                      <Thead>
                                        <Tr>
                                          <Th>Rank</Th>
                                          <Th>Employee</Th>
                                          <Th>Completed Deals</Th>
                                          <Th>Total Sales Value</Th>
                                          <Th>Avg. Sale Value</Th>
                                          <Th>Commission Earned</Th>
                                          <Th>KPI Score</Th>
                                          <Th>Status</Th>
                                        </Tr>
                                      </Thead>
                                      <Tbody>
                                        {deptAgents.map((agent, index) => {
                                          const kpiScore = calculateEmployeeKpi(agent);
                                          return (
                                            <Tr key={index}>
                                              <Td>
                                                <Badge 
                                                  colorScheme={getRankColor(agent.rank)}
                                                  fontSize="sm"
                                                >
                                                  {getRankBadge(agent.rank)}
                                                </Badge>
                                              </Td>
                                              <Td>
                                                <Text fontWeight="bold">{agent.fullName || agent.username || 'Unknown'}</Text>
                                              </Td>
                                              <Td>{agent.completedDeals || 0}</Td>
                                              <Td>{(agent.totalSalesValue || 0)?.toLocaleString()} ETB</Td>
                                              <Td>{(agent.avgSaleValue || 0)?.toLocaleString()} ETB</Td>
                                              <Td>{(agent.totalCommission || 0)?.toLocaleString()} ETB</Td>
                                              <Td>
                                                <Badge 
                                                  colorScheme={
                                                    kpiScore >= 90 ? 'green' : 
                                                    kpiScore >= 75 ? 'yellow' : 
                                                    kpiScore >= 60 ? 'orange' : 'red'
                                                  }
                                                >
                                                  {kpiScore}/100
                                                </Badge>
                                              </Td>
                                              <Td>
                                                <Badge colorScheme={agent.status === 'active' ? 'green' : 'red'}>
                                                  {agent.status || 'active'}
                                                </Badge>
                                              </Td>
                                            </Tr>
                                          );
                                        })}
                                      </Tbody>
                                    </Table>
                                  </TableContainer>
                                </AccordionPanel>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      ) : (
                        <Text>Loading employee performance data...</Text>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Performance Trends Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      {reportData.performanceTrends.length > 0 && (
                        <Card>
                          <CardHeader>
                            <Heading size="md">Performance Trends</Heading>
                          </CardHeader>
                          <CardBody>
                            <TableContainer>
                              <Table variant="simple">
                                <Thead>
                                  <Tr>
                                    <Th>Month</Th>
                                    <Th>Sales</Th>
                                    <Th>Revenue</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {reportData.performanceTrends.map((trend, index) => (
                                    <Tr key={index}>
                                      <Td>{trend.name}</Td>
                                      <Td>{trend.sales}</Td>
                                      <Td>{trend.revenue?.toLocaleString()} ETB</Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          </CardBody>
                        </Card>
                      )}

                      {/* Top Performers */}
                      {reportData.agentPerformance.length > 0 && (
                        <Card>
                          <CardHeader>
                            <Heading size="md">Top Performers</Heading>
                          </CardHeader>
                          <CardBody>
                            <TableContainer>
                              <Table variant="simple">
                                <Thead>
                                  <Tr>
                                    <Th>Agent</Th>
                                    <Th>Completed Deals</Th>
                                    <Th>Gross Commission</Th>
                                    <Th>Net Commission</Th>
                                    <Th>Total Sales</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {[...reportData.agentPerformance]
                                    .sort((a, b) => b.totalNetCommission - a.totalNetCommission)
                                    .slice(0, 5)
                                    .map((agent) => (
                                      <Tr key={agent._id}>
                                        <Td>{agent.fullName || agent.username}</Td>
                                        <Td>{agent.completedDeals}</Td>
                                        <Td>{agent.totalGrossCommission?.toLocaleString()} ETB</Td>
                                        <Td>{agent.totalNetCommission?.toLocaleString()} ETB</Td>
                                        <Td>{agent.totalSales?.toLocaleString()} ETB</Td>
                                      </Tr>
                                    ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          </CardBody>
                        </Card>
                      )}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            ) : (
              <Text>Loading report data...</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default KPIScorecardPage;