import { useState, useEffect, useMemo } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  IconButton,
  Progress,
  SimpleGrid,
  StackDivider,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorMode,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Switch,
  Tag,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Heading,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon, DownloadIcon, CalendarIcon, CheckIcon, EditIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import NoticeBoardPanel from "../NoticeBoardPanel";

// Initial data for all required platforms
const initialTargets = [
  { platform: 'Facebook', weeklyTarget: 5, posted: 3, actual: 3, completed: false },
  { platform: 'Instagram', weeklyTarget: 5, posted: 4, actual: 4, completed: false },
  { platform: 'LinkedIn', weeklyTarget: 3, posted: 2, actual: 2, completed: false },
  { platform: 'TikTok', weeklyTarget: 4, posted: 1, actual: 1, completed: false },
  { platform: 'Twitter (X)', weeklyTarget: 4, posted: 1, actual: 1, completed: false },
  { platform: 'Telegram', weeklyTarget: 5, posted: 2, actual: 2, completed: false },
  { platform: 'Google', weeklyTarget: 3, posted: 1, actual: 1, completed: false },
  { platform: 'YouTube', weeklyTarget: 2, posted: 0, actual: 0, completed: false }
];

const quickStats = [
  { label: "Posts Completed / Target", value: "15 / 18", sub: "83% complete" },
  { label: "Engagement %", value: "5.6%", sub: "Likes + Shares + Comments" },
  { label: "Total Reach", value: "68,400", sub: "Across all platforms" },
  { label: "Leads Generated", value: "142", sub: "Organic + Paid" },
];

const calendarSlots = [
  {
    day: "Mon",
    slot: "9:00 AM",
    type: "Video",
    staff: "Ayele",
    approval: "Pending Review",
    topic: "Product",
    completed: false,
  },
  {
    day: "Mon",
    slot: "2:00 PM",
    type: "Poster",
    staff: "Lily",
    approval: "Draft",
    topic: "Awareness",
    completed: false,
  },
  {
    day: "Tue",
    slot: "11:00 AM",
    type: "Carousel",
    staff: "Martha",
    approval: "Scheduled",
    topic: "Company News",
    completed: false,
  },
  {
    day: "Wed",
    slot: "4:00 PM",
    type: "Article",
    staff: "Hanna",
    approval: "Posted",
    topic: "Event",
    completed: true,
  },
  {
    day: "Thu",
    slot: "10:00 AM",
    type: "Video",
    staff: "Dawit",
    approval: "Pending Review",
    topic: "Testimonial",
    completed: false,
  },
  {
    day: "Fri",
    slot: "1:00 PM",
    type: "Poster",
    staff: "Lily",
    approval: "Draft",
    topic: "Awareness",
    completed: false,
  },
];

const engagementMetrics = [
  { label: "Total Impressions", value: "124,831" },
  { label: "Engagement Rate", value: "5.6%" },
  { label: "Post Reach", value: "68,400" },
  { label: "Best Content", value: "Instagram Carousel (Onboarding)" },
];

const growthMetrics = [
  { label: "New Followers", value: "+1,420" },
  { label: "Followers by Platform", value: "FB 18k · IG 24k · LI 9k · TT 12k" },
  { label: "% vs Last Week", value: "+3.1%" },
];

const leadMetrics = [
  { label: "Leads Collected", value: "142" },
  { label: "Inquiries by Platform", value: "FB 60 · IG 45 · LI 20 · TT 17" },
  { label: "Conversion Rate", value: "18.4%" },
];

const reportCharts = [
  { label: "Posts vs Target", actual: 80, target: 100 },
  { label: "Engagement vs Target", actual: 65, target: 80 },
  { label: "Response Time vs Target", actual: 55, target: 70 },
];

const statusStream = ["Draft", "Pending Review", "Scheduled", "Posted"];

const statusColorMap = {
  Draft: "gray",
  "Pending Review": "orange",
  Scheduled: "blue",
  Posted: "green",
};

// Function to calculate status based on progress
const getStatusInfo = (progress) => {
  if (progress === 100) return { status: "COMPLETED", colorScheme: "green" };
  if (progress >= 70) return { status: "ON TRACK", colorScheme: "green" };
  if (progress >= 30) return { status: "IN PROGRESS", colorScheme: "yellow" };
  if (progress >= 1) return { status: "NEEDS ATTENTION", colorScheme: "orange" };
  return { status: "BEHIND", colorScheme: "red" };
};

// Function to get week range from a date
const getWeekRange = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const start = new Date(d.setDate(diff));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};

const getWeekSaturdayDate = (date) => {
  const { start } = getWeekRange(date);
  const saturday = new Date(start);
  saturday.setDate(saturday.getDate() + 5);
  return saturday;
};

// Function to get week number
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNumber;
};

// Function to format date as readable string
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Function to check if two dates are in the same week
const isSameWeek = (date1, date2) => {
  return getWeekNumber(date1) === getWeekNumber(date2) && 
         date1.getFullYear() === date2.getFullYear();
};

const getLatestSaturday = (reference = new Date()) => {
  const date = new Date(reference);
  const day = date.getDay();
  const offset = (day + 1) % 7;
  date.setDate(date.getDate() - offset);
  return date;
};

const toInputDate = (date) => {
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const buildTargetRow = (target) => {
  const remaining = Math.max(target.weeklyTarget - target.posted, 0);
  const progress = target.weeklyTarget > 0 
    ? Math.min(100, Math.round((target.posted / target.weeklyTarget) * 100))
    : 0;
  const statusInfo = getStatusInfo(progress);

  return {
    ...target,
    remaining,
    progress,
    status: target.completed ? "COMPLETED" : statusInfo.status,
    colorScheme: target.completed ? "green" : statusInfo.colorScheme,
  };
};

const SocialMediaManager = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [weeklyTargets, setWeeklyTargets] = useState(() => {
    const savedTargets = localStorage.getItem('weeklyTargets');
    return savedTargets ? JSON.parse(savedTargets) : initialTargets;
  });
  
  const [posts, setPosts] = useState(() => {
    const savedPosts = localStorage.getItem('posts');
    return savedPosts ? JSON.parse(savedPosts) : calendarSlots;
  });
  
  const [weeklyReports, setWeeklyReports] = useState(() => {
    const savedReports = localStorage.getItem('weeklyReports');
    return savedReports ? JSON.parse(savedReports) : [];
  });
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lastResetDate, setLastResetDate] = useState(() => {
    const savedResetDate = localStorage.getItem('lastResetDate');
    return savedResetDate ? new Date(savedResetDate) : new Date();
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  
  const [newPost, setNewPost] = useState({
    day: "Mon",
    slot: "9:00 AM",
    type: "Video",
    staff: "",
    approval: "Draft",
    topic: "",
    completed: false,
  });
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [editForm, setEditForm] = useState({ weeklyTarget: 0, actual: 0 });

  const bgColor = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('weeklyTargets', JSON.stringify(weeklyTargets));
      localStorage.setItem('posts', JSON.stringify(posts));
      localStorage.setItem('weeklyReports', JSON.stringify(weeklyReports));
      localStorage.setItem('lastResetDate', lastResetDate.toISOString());
    } catch (error) {
      console.warn('Failed to persist social media data', error);
    }
  }, [weeklyTargets, posts, weeklyReports, lastResetDate]);

  // Check if we need to reset for a new week
  useEffect(() => {
    const checkAndResetForNewWeek = () => {
      if (!isSameWeek(selectedDate, lastResetDate)) {
        // Reset targets for new week
        setWeeklyTargets(prev => prev.map(target => ({
          ...target,
          posted: 0,
          actual: 0,
          remaining: target.weeklyTarget,
          completed: false,
          status: "Not Started",
          progress: 0
        })));
        
        // Reset posts for new week
        setPosts(prev => prev.map(post => ({
          ...post,
          completed: false
        })));
        
        // Update last reset date
        setLastResetDate(selectedDate);
      }
    };
    
    checkAndResetForNewWeek();
  }, [selectedDate, lastResetDate]);

  // Calculate week range based on selected date
  const weekRange = useMemo(() => {
    return getWeekRange(selectedDate);
  }, [selectedDate]);

  // Filter completed tasks for reports
  const completedTargets = useMemo(() => {
    return weeklyTargets.filter(target => target.completed);
  }, [weeklyTargets]);

  // Calculate derived data for the table
  const calculatedTargets = useMemo(() => weeklyTargets.map(buildTargetRow), [weeklyTargets]);

  const platformOptions = initialTargets.map((target) => target.platform);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthOptions = ["All", ...months];
  const currentYear = new Date().getFullYear();
  const yearOptions = [String(currentYear - 1), String(currentYear), String(currentYear + 1)];
  const [reportMonth, setReportMonth] = useState(monthOptions[new Date().getMonth() + 1]);
  const [reportYear, setReportYear] = useState(String(currentYear));
  const [reportDate, setReportDate] = useState(toInputDate(getLatestSaturday()));

  const reportEntries = useMemo(() => {
    return weeklyReports.filter((report) => {
      const rawDate = report.date || report.createdAt || report.updatedAt;
      const entryDate = rawDate ? new Date(rawDate) : new Date();
      if (Number.isNaN(entryDate.getTime())) return false;
      const entryMonth = entryDate.toLocaleString("en-US", { month: "short" });
      const entryYear = entryDate.getFullYear();
      const monthMatch = reportMonth === "All" ? true : entryMonth === reportMonth;
      const yearMatch = Number(reportYear) === entryYear;
      const dayMatch = reportDate
        ? toInputDate(entryDate) === reportDate
        : true;
      return monthMatch && yearMatch && dayMatch;
    });
  }, [weeklyReports, reportMonth, reportYear, reportDate]);

  const reportSummary = useMemo(() => {
    const totalTarget = reportEntries.reduce((sum, report) => sum + (report.weeklyTarget || 0), 0);
    const totalActual = reportEntries.reduce((sum, report) => sum + (report.actual || 0), 0);
    const delta = totalTarget ? ((totalActual - totalTarget) / totalTarget) * 100 : 0;
    const periodLabel = reportMonth === "All" ? "All months" : `${reportMonth} ${reportYear}`;
    const dateLabel = reportDate ? formatDate(reportDate) : null;
    return {
      totalTasks: reportEntries.length,
      totalTarget,
      totalActual,
      delta,
      periodLabel,
      dateLabel,
    };
  }, [reportEntries, reportMonth, reportYear, reportDate]);

  const handleEditOpen = (row) => {
    setEditingPlatform(row.platform);
    setEditForm({ weeklyTarget: row.weeklyTarget, actual: row.actual });
    onEditOpen();
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: Number.isNaN(value) ? 0 : value,
    }));
  };

  const handleEditClose = () => {
    setEditingPlatform(null);
    setEditForm({ weeklyTarget: 0, actual: 0 });
    onEditClose();
  };

  const handleEditSave = () => {
    if (!editingPlatform) return;
    const normalizedTarget = Math.max(0, Number(editForm.weeklyTarget) || 0);
    const normalizedActual = Math.max(0, Number(editForm.actual) || 0);
    const weekNumber = getWeekNumber(selectedDate);
    const year = selectedDate.getFullYear();
    const saturday = getWeekSaturdayDate(selectedDate);

    setWeeklyTargets((prev) =>
      prev.map((row) =>
        row.platform === editingPlatform
          ? {
              ...row,
              weeklyTarget: normalizedTarget,
              actual: normalizedActual,
              posted: normalizedActual,
            }
          : row
      )
    );

    setWeeklyReports((prevReports) =>
      prevReports.map((report) => {
        if (
          report.platform === editingPlatform &&
          report.weekNumber === weekNumber &&
          report.year === year
        ) {
          const updatedSnapshot = buildTargetRow({
            ...report,
            weeklyTarget: normalizedTarget,
            posted: normalizedActual,
            actual: normalizedActual,
            completed: true,
          });
          return {
            ...report,
            ...updatedSnapshot,
            weeklyTarget: normalizedTarget,
            posted: normalizedActual,
            actual: normalizedActual,
            remaining: Math.max(normalizedTarget - normalizedActual, 0),
            date: saturday.toISOString(),
          };
        }
        return report;
      })
    );
    toast({
      title: "Targets updated",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    handleEditClose();
  };

  const adjustTarget = (platform, delta) => {
    setWeeklyTargets((prev) =>
      prev.map((row) =>
        row.platform === platform
          ? { ...row, weeklyTarget: Math.max(0, row.weeklyTarget + delta) }
          : row
      )
    );
  };

  const completeTask = (platform) => {
    let reportEntry = null;
    const weekNumber = getWeekNumber(selectedDate);
    const year = selectedDate.getFullYear();
    const saturday = getWeekSaturdayDate(selectedDate);

    setWeeklyTargets((prev) => {
      const updated = prev.map((row) => {
        if (row.platform !== platform) return row;
        const completedRow = { ...row, completed: true };
        reportEntry = {
          ...buildTargetRow(completedRow),
          taskName: completedRow.platform,
          weekNumber,
          year,
          date: saturday.toISOString(),
        };
        return completedRow;
      });
      return updated;
    });

    if (reportEntry) {
      setWeeklyReports((prevReports) => {
        const existingIndex = prevReports.findIndex(
          (report) =>
            report.platform === platform &&
            report.weekNumber === reportEntry.weekNumber &&
            report.year === reportEntry.year
        );
        if (existingIndex >= 0) {
          const nextReports = [...prevReports];
          nextReports[existingIndex] = {
            ...nextReports[existingIndex],
            ...reportEntry,
          };
          return nextReports;
        }
        return [...prevReports, reportEntry];
      });
    }
  };

  const reopenTask = (platform) => {
    const weekNumber = getWeekNumber(selectedDate);
    const year = selectedDate.getFullYear();
    setWeeklyTargets((prev) =>
      prev.map((row) =>
        row.platform === platform
          ? { ...row, completed: false }
          : row
      )
    );
    setWeeklyReports((prev) =>
      prev.filter(
        (report) =>
          !(
            report.platform === platform &&
            report.weekNumber === weekNumber &&
            report.year === year
          )
      )
    );
  };

  const togglePostCompletion = (index) => {
    setPosts((prev) =>
      prev.map((post, i) =>
        i === index
          ? { ...post, completed: !post.completed }
          : post
      )
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPost = () => {
    setPosts(prev => [...prev, newPost]);
    setNewPost({
      day: "Mon",
      slot: "9:00 AM",
      type: "Video",
      staff: "",
      approval: "Draft",
      topic: "",
      completed: false,
    });
    onClose();
  };

  // Calculate final report data based on completed tasks only
  const finalReportData = useMemo(() => {
    const totalTarget = completedTargets.reduce((sum, target) => sum + target.weeklyTarget, 0);
    const totalPosted = completedTargets.reduce((sum, target) => sum + target.posted, 0);
    const totalActual = completedTargets.reduce((sum, target) => sum + target.actual, 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalPosted / totalTarget) * 100) : 0;
    
    const statusCounts = completedTargets.reduce((counts, target) => {
      counts[target.status] = (counts[target.status] || 0) + 1;
      return counts;
    }, {});
    
    return {
      totalTarget,
      totalPosted,
      totalActual,
      overallProgress,
      statusCounts
    };
  }, [completedTargets]);

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };

  // Get reports for current week

  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      <Flex justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold">
            Social Media Dashboard
          </Text>
          <Text color="gray.500">Comprehensive overview of your social media performance</Text>
        </Box>
        <HStack spacing={3}>
          <Button leftIcon={<DownloadIcon />} colorScheme="teal" variant="outline">
            Export Report
          </Button>
          <Button colorScheme="teal">Generate Insights</Button>
        </HStack>
      </Flex>

      <Alert status="info" mb={6}>
        <AlertIcon />
        <Box>
          <AlertTitle>Weekly Automation Active</AlertTitle>
          <AlertDescription>
            Tasks are automatically reset each week. Completed tasks are saved to reports.
          </AlertDescription>
        </Box>
      </Alert>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {quickStats.map((stat, index) => (
          <Card key={index} bg={cardBg} shadow="md">
            <CardBody>
              <Stat>
                <StatLabel fontSize="sm" color="gray.500" mb={2}>
                  {stat.label}
                </StatLabel>
                <StatNumber fontSize="2xl" fontWeight="bold">
                  {stat.value}
                </StatNumber>
                <Text fontSize="xs" color="gray.400" mt={1}>
                  {stat.sub}
                </Text>
              </Stat>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Tabs variant="enclosed" mb={8}>
        <TabList>
          <Tab>Weekly Targets</Tab>
          <Tab>Content Planner</Tab>
          <Tab>Performance Analytics</Tab>
          <Tab>Weekly Reports</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Card bg={cardBg} shadow="md">
              <CardHeader pb={0}>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                  <Box>
                    <Text fontSize="xl" fontWeight="bold">
                      Weekly Content Targets
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Track your progress across all platforms
                    </Text>
                  </Box>
                  <HStack>
                    <FormControl width="250px">
                      <FormLabel fontSize="sm">Select Week</FormLabel>
                      <Input 
                        type="date" 
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={handleDateChange}
                      />
                    </FormControl>
                  </HStack>
                </Flex>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Showing data for week of {formatDate(weekRange.start)} to {formatDate(weekRange.end)}
                </Text>
              </CardHeader>
              <CardBody pt={0}>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Platform</Th>
                        <Th>Weekly Target</Th>
                        <Th>Posted</Th>
                        <Th>Remaining</Th>
                        <Th>Status</Th>
                        <Th>Actual</Th>
                        <Th>Progress</Th>
                        <Th>Edit</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {calculatedTargets.map((row) => (
                        <Tr key={row.platform}>
                          <Td>
                            <Text fontWeight="semibold">{row.platform}</Text>
                          </Td>
                          <Td>
                            <HStack>
                              <IconButton
                                aria-label={`Decrease target for ${row.platform}`}
                                icon={<MinusIcon />}
                                size="xs"
                                variant="ghost"
                                onClick={() => adjustTarget(row.platform, -1)}
                              />
                              <Text>{row.weeklyTarget}</Text>
                              <IconButton
                                aria-label={`Increase target for ${row.platform}`}
                                icon={<AddIcon />}
                                size="xs"
                                variant="ghost"
                                onClick={() => adjustTarget(row.platform, 1)}
                              />
                            </HStack>
                          </Td>
                          <Td>{row.posted}</Td>
                          <Td>{row.remaining}</Td>
                          <Td>
                            <Badge colorScheme={row.colorScheme} px={2} py={1} borderRadius="full">
                              {row.status}
                            </Badge>
                          </Td>
                          <Td>{row.actual}</Td>
                          <Td width="200px">
                            <Flex align="center" gap={3}>
                              <Text fontSize="sm" minWidth="40px">
                                {row.progress}%
                              </Text>
                              <Progress 
                                value={row.progress} 
                                colorScheme={row.colorScheme} 
                                size="sm" 
                                borderRadius="full" 
                                flex={1}
                                hasStripe
                              />
                            </Flex>
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<EditIcon />}
                              onClick={() => handleEditOpen(row)}
                            >
                              Edit Points
                            </Button>
                          </Td>
                          <Td>
                            {row.completed ? (
                              <VStack spacing={2} align="stretch">
                                <Badge colorScheme="green" px={2} py={1} borderRadius="full">
                                  Completed
                                </Badge>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  colorScheme="blue"
                                  onClick={() => reopenTask(row.platform)}
                                >
                                  Reopen
                                </Button>
                              </VStack>
                            ) : (
                              <Button 
                                size="sm" 
                                colorScheme="green" 
                                leftIcon={<CheckIcon />} 
                                onClick={() => completeTask(row.platform)}
                              >
                                Complete
                              </Button>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
              <CardFooter>
                <Flex justify="space-between" w="100%">
                  <Text fontSize="sm" color="gray.500">
                    Last updated: Just now
                  </Text>
                  <Button size="sm" variant="ghost">
                    Refresh Data
                  </Button>
                </Flex>
              </CardFooter>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card bg={cardBg} shadow="md">
              <CardHeader>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                  <Box>
                    <Text fontSize="xl" fontWeight="bold">
                      Content Planner
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Schedule and manage your content
                    </Text>
                  </Box>
                  <HStack>
                    <FormControl width="250px">
                      <FormLabel fontSize="sm">Select Week</FormLabel>
                      <Input 
                        type="date" 
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={handleDateChange}
                      />
                    </FormControl>
                    <Button leftIcon={<CalendarIcon />} size="sm" colorScheme="teal" onClick={onOpen}>
                      New Post
                    </Button>
                  </HStack>
                </Flex>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Showing data for week of {formatDate(weekRange.start)} to {formatDate(weekRange.end)}
                </Text>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {posts.map((slot, index) => (
                    <Card key={index} variant="outline">
                      <CardBody>
                        <Flex justify="space-between" mb={3}>
                          <Text fontWeight="bold">{slot.day}</Text>
                          <Badge colorScheme="blue" variant="subtle">
                            {slot.slot}
                          </Badge>
                        </Flex>
                        <VStack align="start" spacing={2}>
                          <Text fontSize="sm" color="gray.500">
                            {slot.type} · {slot.topic}
                          </Text>
                          <Text fontWeight="semibold">{slot.staff}</Text>
                          <Badge colorScheme={statusColorMap[slot.approval]}>
                            {slot.approval}
                          </Badge>
                          <HStack spacing={2}>
                            <Text fontSize="xs" color="gray.400">
                              Completed:
                            </Text>
                            <Switch
                              size="sm"
                              isChecked={slot.completed}
                              onChange={() => togglePostCompletion(index)}
                              colorScheme="green"
                            />
                          </HStack>
                          <Text fontSize="xs" color="gray.400">
                            Topics covered: {slot.topic}
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card bg={cardBg} shadow="md">
              <CardHeader>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                  <Box>
                    <Text fontSize="xl" fontWeight="bold">
                      Performance Analytics
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Track your social media metrics over time
                    </Text>
                  </Box>
                  <HStack>
                    <FormControl width="250px">
                      <FormLabel fontSize="sm">Select Week</FormLabel>
                      <Input 
                        type="date" 
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={handleDateChange}
                      />
                    </FormControl>
                  </HStack>
                </Flex>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Showing data for week of {formatDate(weekRange.start)} to {formatDate(weekRange.end)}
                </Text>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <Card bg={cardBg} shadow="md">
                    <CardHeader>
                      <Text fontSize="lg" fontWeight="bold">
                        Engagement Metrics
                      </Text>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        {engagementMetrics.map((metric, index) => (
                          <Box key={index}>
                            <Text fontSize="sm" color="gray.500" mb={1}>
                              {metric.label}
                            </Text>
                            <Text fontSize="xl" fontWeight="bold">
                              {metric.value}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} shadow="md">
                    <CardHeader>
                      <Text fontSize="lg" fontWeight="bold">
                        Growth Metrics
                      </Text>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        {growthMetrics.map((metric, index) => (
                          <Box key={index}>
                            <Text fontSize="sm" color="gray.500" mb={1}>
                              {metric.label}
                            </Text>
                            <Text fontSize="xl" fontWeight="bold">
                              {metric.value}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} shadow="md">
                    <CardHeader>
                      <Text fontSize="lg" fontWeight="bold">
                        Lead Performance
                      </Text>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        {leadMetrics.map((metric, index) => (
                          <Box key={index}>
                            <Text fontSize="sm" color="gray.500" mb={1}>
                              {metric.label}
                            </Text>
                            <Text fontSize="xl" fontWeight="bold">
                              {metric.value}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                <Card bg={cardBg} shadow="md" mt={6}>
                  <CardHeader>
                    <Text fontSize="lg" fontWeight="bold">
                      Target vs Actual Performance
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
                      {reportCharts.map((chart, index) => (
                        <Box key={index}>
                          <Text fontSize="sm" color="gray.500" mb={2}>
                            {chart.label}
                          </Text>
                          <Box h="100px" position="relative">
                            <Flex 
                              position="absolute" 
                              bottom="0" 
                              left="0" 
                              right="0" 
                              height={`${chart.target}%`} 
                              maxH="100px"
                              bg="gray.200" 
                              borderRadius="md" 
                              alignItems="flex-end"
                              justifyContent="center"
                            >
                              <Text fontSize="xs" py={1}>{chart.target}%</Text>
                            </Flex>
                            <Flex 
                              position="absolute" 
                              bottom="0" 
                              left="0" 
                              right="0" 
                              height={`${chart.actual}%`} 
                              maxH="100px"
                              bg="teal.400" 
                              borderRadius="md" 
                              alignItems="flex-end"
                              justifyContent="center"
                            >
                              <Text fontSize="xs" py={1} color="white">{chart.actual}%</Text>
                            </Flex>
                          </Box>
                        </Box>
                      ))}
                    </Grid>
                  </CardBody>
                </Card>
              </CardBody>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Card bg={cardBg} shadow="md">
              <CardHeader>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                  <Box>
                    <Text fontSize="xl" fontWeight="bold">
                      Monthly Reports
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Filter by month and year to see summary details.
                    </Text>
                  </Box>
                  <HStack spacing={3} align="flex-end">
                    <FormControl width="180px">
                      <FormLabel fontSize="sm">Month</FormLabel>
                      <Select
                        size="sm"
                        value={reportMonth}
                        onChange={(e) => setReportMonth(e.target.value)}
                      >
                        {monthOptions.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl width="140px">
                      <FormLabel fontSize="sm">Year</FormLabel>
                      <Select
                        size="sm"
                        value={reportYear}
                        onChange={(e) => setReportYear(e.target.value)}
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl width="200px">
                      <FormLabel fontSize="sm">Saturday date</FormLabel>
                      <Input
                        size="sm"
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                      />
                    </FormControl>
                  </HStack>
                </Flex>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Showing data for {reportSummary.periodLabel}
                </Text>
                {reportSummary.dateLabel && (
                  <Text fontSize="xs" color="gray.400">
                    Report date: {reportSummary.dateLabel}
                  </Text>
                )}
                <Text fontSize="xs" color="gray.400">
                  Weekly reports capture data as of Saturday submissions.
                </Text>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.500">
                      Total Requests
                    </StatLabel>
                    <StatNumber fontSize="2xl" color="green.500">
                      {reportSummary.totalTasks}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.500">
                      Total Target
                    </StatLabel>
                    <StatNumber fontSize="2xl" color="teal.500">
                      {reportSummary.totalTarget}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.500">
                      Total Actual
                    </StatLabel>
                    <StatNumber fontSize="2xl" color="blue.500">
                      {reportSummary.totalActual}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.500">
                      Delta
                    </StatLabel>
                    <StatNumber fontSize="2xl" color={reportSummary.delta >= 0 ? "green.500" : "orange.500"}>
                      {reportSummary.delta.toFixed(1)}%
                    </StatNumber>
                  </Stat>
                </SimpleGrid>

                <Divider my={6} />

                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Month</Th>
                        <Th>Year</Th>
                        <Th>Date</Th>
                        <Th>Platform</Th>
                        <Th>Target</Th>
                        <Th>Actual</Th>
                        <Th>Delta</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {reportEntries.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center" py={6} color="gray.500">
                            No data for the selected period
                          </Td>
                        </Tr>
                      ) : (
                        reportEntries.map((report, index) => {
                          const rawDate = report.date || report.createdAt || report.updatedAt;
                          const entryDate = rawDate ? new Date(rawDate) : new Date();
                          const entryMonth = entryDate.toLocaleString("en-US", { month: "short" });
                          const entryYear = entryDate.getFullYear();
                          const deltaValue = report.weeklyTarget
                            ? ((report.actual - report.weeklyTarget) / report.weeklyTarget) * 100
                            : 0;
                          const deltaColor = deltaValue >= 0 ? "green.500" : "orange.500";
                          return (
                            <Tr key={report._id || `${report.platform}-${index}`}>
                              <Td fontWeight="semibold">{entryMonth}</Td>
                              <Td>{entryYear}</Td>
                              <Td>{formatDate(entryDate)}</Td>
                              <Td>{report.platform}</Td>
                              <Td>{report.weeklyTarget}</Td>
                              <Td>{report.actual}</Td>
                              <Td>
                                <Tag colorScheme={deltaValue >= 0 ? "green" : "orange"} variant="subtle">
                                  {deltaValue.toFixed(1)}%
                                </Tag>
                              </Td>
                            </Tr>
                          );
                        })
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
              <CardFooter>
                <Button leftIcon={<DownloadIcon />} colorScheme="teal">
                  Export Report
                </Button>
              </CardFooter>
            </Card>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
              <Card bg={cardBg} shadow="md">
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold">
                    Report Summary
                  </Text>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Text>
                      • All completed tasks are automatically saved to weekly reports
                    </Text>
                    <Text>
                      • Reports are preserved and never overwritten
                    </Text>
                    <Text>
                      • Each week generates a new report entry
                    </Text>
                    <Text>
                      • Data persists between sessions
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card bg={cardBg} shadow="md">
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold">
                    Automation Features
                  </Text>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Text>
                      • Tasks automatically reset at the start of each week
                    </Text>
                    <Text>
                      • Posted counts reset to 0 for new week
                    </Text>
                    <Text>
                      • Progress bars reset for fresh start
                    </Text>
                    <Text>
                      • Previous week reports are preserved
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <NoticeBoardPanel
        title="Social Media Notice Board"
        subtitle="Broadcast messages for the content team and leadership"
        embedded
      />

      {/* New Post Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Day</FormLabel>
                <Select name="day" value={newPost.day} onChange={handleInputChange}>
                  <option value="Mon">Monday</option>
                  <option value="Tue">Tuesday</option>
                  <option value="Wed">Wednesday</option>
                  <option value="Thu">Thursday</option>
                  <option value="Fri">Friday</option>
                  <option value="Sat">Saturday</option>
                  <option value="Sun">Sunday</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Time Slot</FormLabel>
                <Input 
                  name="slot" 
                  value={newPost.slot} 
                  onChange={handleInputChange} 
                  placeholder="e.g., 9:00 AM"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Content Type</FormLabel>
                <Select name="type" value={newPost.type} onChange={handleInputChange}>
                  <option value="Video">Video</option>
                  <option value="Poster">Poster</option>
                  <option value="Carousel">Carousel</option>
                  <option value="Article">Article</option>
                  <option value="Story">Story</option>
                  <option value="Live">Live Stream</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Assigned Staff</FormLabel>
                <Input 
                  name="staff" 
                  value={newPost.staff} 
                  onChange={handleInputChange} 
                  placeholder="Staff member name"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Approval Status</FormLabel>
                <Select name="approval" value={newPost.approval} onChange={handleInputChange}>
                  <option value="Draft">Draft</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Posted">Posted</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Topic/Theme</FormLabel>
                <Textarea 
                  name="topic" 
                  value={newPost.topic} 
                  onChange={handleInputChange} 
                  placeholder="Content topic or theme"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button colorScheme="teal" mr={3} onClick={handleSubmitPost}>
              Create Post
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Edit Points Modal */}
      <Modal isOpen={isEditOpen} onClose={handleEditClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" bg={cardBg}>
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold">
                Edit {editingPlatform || "Platform"} Points
              </Text>
              <Text fontSize="sm" color="gray.500">
                Update the weekly target and actual counts centrally.
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Weekly Target</FormLabel>
                <NumberInput
                  min={0}
                  value={editForm.weeklyTarget}
                  onChange={(_, valueAsNumber) => handleEditChange("weeklyTarget", valueAsNumber)}
                  clampValueOnBlur
                  borderRadius="lg"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Actual</FormLabel>
                <NumberInput
                  min={0}
                  value={editForm.actual}
                  onChange={(_, valueAsNumber) => handleEditChange("actual", valueAsNumber)}
                  clampValueOnBlur
                  borderRadius="lg"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" mr={3} onClick={handleEditSave} isDisabled={!editingPlatform}>
              Save Changes
            </Button>
            <Button variant="ghost" onClick={handleEditClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SocialMediaManager;
