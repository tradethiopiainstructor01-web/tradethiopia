import React from 'react';
import {
  Box,
  Text,
  VStack,
  Heading,
  Center,
  Spinner,
  SimpleGrid,
  Tabs,
  TabList,
  Tab,
  TabIndicator,
  Grid,
  Container,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  Stack,
  useColorModeValue,
  HStack,
  IconButton,
  Select,
  Button,
  Flex,
  ButtonGroup,
  Input,
  Wrap,
  WrapItem,
  Skeleton,
  SkeletonText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Tag,
  Avatar,
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react';
import { ArrowLeftIcon, ArrowRightIcon, DownloadIcon, ExternalLinkIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/user';

const MotionBox = chakra(motion.div);
import KpiCards from '../components/kpiCards';
import AnalyticsGraphs from '../components/AnalyticsGraphs';
import TasksAndAlerts from '../components/TasksAndAlerts';
import NotificationsPanel from '../components/NotificationsPanel';
import PerformanceViewer from '../components/PerformanceViewer';
import DailyFollowupSuccess from '../components/DailyFollowupSuccess';
import { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';

const baseTradexSummary = [
  { label: 'Active follow-ups', value: '-', sublabel: '' },
  { label: 'MTD revenue', value: '-', sublabel: '' },
  { label: 'Top platform', value: '-', sublabel: '' },
  { label: 'Avg services/fu', value: '-', sublabel: '' },
];

const COODashboard = () => {
  const [departments, setDepartments] = useState(['All', 'TradexTV', 'Customer Succes', 'Finance', 'Sales', 'IT']);
  const [selectedDept, setSelectedDept] = useState('All');
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState({ followups: true, assets: true, resources: true });
  const tabListRef = React.useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isTradexModalOpen, onOpen: onOpenTradexModal, onClose: onCloseTradexModal } = useDisclosure();
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [excludedDepartments, setExcludedDepartments] = useState(['Host', 'Sales Forces']);
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentGradients = [
    'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
    'linear-gradient(135deg, #10B981 0%, #22D3EE 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    'linear-gradient(135deg, #F472B6 0%, #6366F1 100%)',
  ];
  const activeDeptCount = Math.max(departments.filter(d => !excludedDepartments.includes(d)).length - 1, 0); // minus "All"
  const timeRangeLabels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    '365d': 'Last 12 months'
  };
  const revenueSummary = { total: '$12.4M', change: '+4.3% MoM' }; // placeholder aggregate for display
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    []
  );

  const fixedDepartments = ['All', 'TradexTV', 'Customer Succes', 'Finance', 'Sales', 'IT'];
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);

  const scrollTabs = (delta) => {
    if (tabListRef.current) {
      tabListRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const displayedDepartments = departments.filter(d => {
    if (d === 'All') return true;
    if (excludedDepartments.includes(d)) return false;
    if (!searchTerm.trim()) return true;
    return d.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  const secondRowSet = React.useMemo(
    () => new Set(['customer service', 'host', 'sales officer']),
    []
  );
  const orderedDepartments = React.useMemo(() => {
    const first = [];
    const second = [];
    displayedDepartments.forEach((d) => {
      if (secondRowSet.has(d.toLowerCase())) {
        second.push(d);
      } else {
        first.push(d);
      }
    });
    return [...first, ...second];
  }, [displayedDepartments, secondRowSet]);

  const effectiveDept = useMemo(() => {
    const label = selectedDept || '';
    return label.toLowerCase().includes('tradex') ? 'tradextv' : label;
  }, [selectedDept]);
  const tradexRevenueRows = [
    { metric: 'MTD revenue', target: 1200000, actual: 1290000 },
    { metric: 'New bookings', target: 550000, actual: 590000 },
    { metric: 'Renewals & upsell', target: 320000, actual: 345000 },
  ];
  const tradexSocialReport = [
    { platform: 'YouTube', target: 833, actual: 720 },
    { platform: 'TikTok', target: 1666, actual: 1810 },
    { platform: 'Facebook', target: 4166, actual: 3920 },
    { platform: 'LinkedIn', target: 416, actual: 402 },
  ];

  const toggleExcluded = (dept) => {
    if (dept === 'All') return;
    setExcludedDepartments(prev => {
      if (prev.includes(dept)) return prev.filter(x => x !== dept);
      return [...prev, dept];
    });
    // if the currently selected dept was excluded, move selection to All
    if (dept === selectedDept) setSelectedDept('All');
  };

  const handlePointerDown = (e) => {
    const el = tabListRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    scrollLeftRef.current = el.scrollLeft;
    el.classList.add('dragging');
  };

  const handlePointerMove = (e) => {
    const el = tabListRef.current;
    if (!el || !isDraggingRef.current) return;
    const x = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    const walk = startXRef.current - x;
    el.scrollLeft = scrollLeftRef.current + walk;
  };

  const handlePointerUp = () => {
    const el = tabListRef.current;
    isDraggingRef.current = false;
    if (el) el.classList.remove('dragging');
  };

  useEffect(() => {
    setDepartments(fixedDepartments);
    setLoadingDepts(false);
  }, []);

  const fetchTradexData = useCallback(async () => {
    try {
      setTradexLoading(true);
      const [revRes, socRes, fuRes] = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_URL}/api/revenue-actuals`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/social-actuals`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/tradex-followups`),
      ]);

      const summary = [...baseTradexSummary];

      // Revenue
      if (revRes.status === 'fulfilled' && Array.isArray(revRes.value.data)) {
        const entries = revRes.value.data;
        const mtd = entries.find((e) => e.metric === 'MTD revenue');
        if (mtd) {
          summary[1] = {
            label: 'MTD revenue',
            value: currencyFormatter.format(mtd.actual || 0),
            sublabel: mtd.target ? `Target ${currencyFormatter.format(mtd.target)}` : '',
          };
        }
      }

      // Social
      if (socRes.status === 'fulfilled' && Array.isArray(socRes.value.data)) {
        const entries = socRes.value.data;
        if (entries.length) {
          const top = [...entries].sort((a, b) => (b.actual || 0) - (a.actual || 0))[0];
          summary[2] = {
            label: 'Top platform',
            value: top.platform,
            sublabel: `${(top.actual || 0).toLocaleString()} vs ${top.target?.toLocaleString?.() || 0}`,
          };
        }
      }

      // Followups
      if (fuRes.status === 'fulfilled' && Array.isArray(fuRes.value.data)) {
        const followups = fuRes.value.data;
        summary[0] = {
          label: 'Active follow-ups',
          value: String(followups.length),
          sublabel: 'TradexTV',
        };
        const avgServices =
          followups.length === 0
            ? 0
            : followups.reduce((acc, f) => acc + (Array.isArray(f.services) ? f.services.length : 0), 0) /
              followups.length;
        summary[3] = {
          label: 'Avg services/fu',
          value: avgServices.toFixed(1),
          sublabel: 'Across active follow-ups',
        };
        const deliverables = followups.slice(0, 6).map((fu) => ({
          service: Array.isArray(fu.services) && fu.services.length ? fu.services[0] : fu.packageType || 'Service',
          owner: fu.createdBy || fu.owner || 'Unassigned',
          status: fu.status || 'In progress',
          due: fu.deadline ? new Date(fu.deadline).toISOString().split('T')[0] : '',
        }));
        setTradexDeliverables(deliverables);
      }

      setTradexSummaryData(summary);
    } catch (err) {
      console.error('Failed to load Tradex data', err);
    } finally {
      setTradexLoading(false);
    }
  }, [currencyFormatter]);

  // center the active tab in view when selection changes
  useEffect(() => {
    if (!tabListRef.current) return;
    const el = tabListRef.current.querySelector(`[data-dept="${selectedDept}"]`);
    if (el && el.scrollIntoView) {
      try {
        el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch (e) {
        // fallback: adjust scrollLeft manually
        const parent = tabListRef.current;
        const rect = el.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const offset = rect.left - parentRect.left - (parentRect.width / 2) + (rect.width / 2);
        parent.scrollBy({ left: offset, behavior: 'smooth' });
      }
    }
  }, [selectedDept]);

  useEffect(() => {
    if ((selectedDept || '').toLowerCase().includes('tradex')) {
      onOpenTradexModal();
    }
  }, [selectedDept, onOpenTradexModal]);

  useEffect(() => {
    fetchTradexData();
  }, [fetchTradexData]);

  // keep selection valid when filters hide a tab
  useEffect(() => {
    if (!displayedDepartments.includes(selectedDept)) {
      setSelectedDept('All');
    }
  }, [displayedDepartments, selectedDept]);

  const handleWheel = (e) => {
    if (!tabListRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      tabListRef.current.scrollBy({ left: e.deltaY, behavior: 'smooth' });
    }
  };

  const revenueBreakdown = [
    { label: 'New Deals', value: '$4.2M', change: '+6.2%' },
    { label: 'Renewals', value: '$3.1M', change: '+3.4%' },
    { label: 'Expansion', value: '$1.6M', change: '+2.1%' },
    { label: 'Churn Risk', value: '$0.4M', change: '-1.2%' },
  ];

  const [tradexSummaryData, setTradexSummaryData] = useState(baseTradexSummary);
  const [tradexDeliverables, setTradexDeliverables] = useState([]);
  const [tradexLoading, setTradexLoading] = useState(false);

  const slaRows = [
    { priority: 'Critical', target: '4h', achieved: '92%', overdue: 6 },
    { priority: 'High', target: '8h', achieved: '89%', overdue: 12 },
    { priority: 'Normal', target: '24h', achieved: '94%', overdue: 18 },
    { priority: 'Low', target: '72h', achieved: '97%', overdue: 4 },
  ];

  const utilization = [
    { name: 'Field Teams', value: 78, status: 'Healthy' },
    { name: 'Support', value: 64, status: 'Watch' },
    { name: 'Sales Ops', value: 82, status: 'Healthy' },
    { name: 'Logistics', value: 55, status: 'Light' },
  ];

  const awards = [
    {
      title: 'Manager of the Month',
      name: 'Dawit Alemu',
      department: 'Sales Ops',
      highlight: 'SLA adherence 96%',
      avatar: 'https://i.pravatar.cc/100?img=47',
    },
    {
      title: 'Employee of the Month',
      name: 'Liya Bekele',
      department: 'Field Teams',
      highlight: '+18% follow-up completion',
      avatar: 'https://i.pravatar.cc/100?img=32',
    },
    {
      title: 'Instructor of the Year',
      name: 'Marta Tesfaye',
      department: 'Training & Enablement',
      highlight: '120+ learners certified, 4.9/5 rating',
      avatar: 'https://i.pravatar.cc/100?img=11',
    },
    {
      title: 'Team Leader of the Month',
      name: 'Yohannes Girma',
      department: 'Logistics',
      highlight: 'Team productivity up 14%',
      avatar: 'https://i.pravatar.cc/100?img=22',
    },
  ];

  const handleLogout = () => {
    clearUser();
    navigate('/login');
  };

  return (
    <Box bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh" py={{ base: 5, md: 7 }}>
      <Container maxW="8xl">
        <MotionBox
          bg={cardBg}
          color={useColorModeValue('gray.900', 'gray.50')}
          p={{ base: 4, md: 6 }}
          borderRadius="xl"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
          mb={{ base: 5, md: 6 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Flex align={{ base: 'flex-start', md: 'center' }} gap={4} wrap="wrap">
            <Box>
              <Heading fontSize={{ base: 'xl', md: '2xl' }}>COO Dashboard</Heading>
              <Text mt={2} color="gray.600">Operational snapshot with condensed KPIs and alerts by department.</Text>
              <Flex mt={3} gap={2} align="center" wrap="wrap">
                <Badge colorScheme="purple" variant="subtle">Live</Badge>
                <Tag colorScheme="blue" variant="subtle">Departments {activeDeptCount}</Tag>
                <Tag colorScheme="green" variant="subtle">{timeRangeLabels[timeRange] || 'Custom window'}</Tag>
              </Flex>
            </Box>
            <Flex gap={3} wrap="wrap" align="center">
              <ButtonGroup size="sm" variant="solid" colorScheme="purple">
                <Button leftIcon={<DownloadIcon />} onClick={() => {}}>
                  Export
                </Button>
                <Button leftIcon={<ExternalLinkIcon />} variant="outline" onClick={() => {}}>
                  Share
                </Button>
              </ButtonGroup>
              <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" px={3.5} py={2.5} minW="140px" bg={useColorModeValue('white', 'gray.700')}>
                <Text fontSize="xs" color="gray.600">Total revenue</Text>
                <Text fontWeight="bold" fontSize="lg">{revenueSummary.total}</Text>
                <Text fontSize="xs" color="green.500" mt={0.5}>{revenueSummary.change}</Text>
              </Box>
            </Flex>
            <Spacer />
            <VStack align="flex-end" spacing={2}>
              <Menu placement="bottom-end" isLazy>
                <MenuButton
                  as={Button}
                  variant="outline"
                  colorScheme="purple"
                  leftIcon={<Avatar name={currentUser?.username || 'User'} src={currentUser?.avatar} size="sm" />}
                  rightIcon={<ChevronDownIcon />}
                  px={3}
                  minW={{ base: '200px', md: '240px' }}
                >
                  <Flex justify="space-between" align="center" w="100%">
                    <Box textAlign="left">
                      <Text fontWeight="semibold" fontSize="sm">{currentUser?.username || 'Unknown user'}</Text>
                      <Text fontSize="xs" color="gray.600">{currentUser?.role || 'Role not set'}</Text>
                    </Box>
                  </Flex>
                </MenuButton>
                <MenuList>
                  <MenuItem isDisabled>COO: {currentUser?.username || 'Not set'}</MenuItem>
                  <MenuItem isDisabled>{currentUser?.role || 'Role not set'}</MenuItem>
                  <MenuDivider />
                  <MenuItem color="red.500" onClick={handleLogout}>Logout</MenuItem>
                </MenuList>
              </Menu>
              <NotificationsPanel
                buttonProps={{
                  colorScheme: 'purple',
                  variant: 'ghost',
                  size: 'sm',
                  rightIcon: <ChevronDownIcon />,
                }}
                buttonLabel="Notifications"
              />
            </VStack>
          </Flex>
        </MotionBox>

        {/* Department tabs with chevrons and scroll-snap */}
          <Flex align="center" gap={3} mb={4}>
          <IconButton
            aria-label="Scroll left"
            icon={<ArrowLeftIcon />}
            onClick={() => scrollTabs(-220)}
            size="sm"
            variant="ghost"
          />
          <Button size="sm" variant="ghost" onClick={onOpen}>Manage Departments</Button>
          <Tabs
            variant="unstyled"
            colorScheme="blue"
            flex="1"
            onChange={(index) => setSelectedDept(orderedDepartments[index] || 'All')}
          >
            <Box position="relative" flex="1" overflowX="hidden">
              {loadingDepts && (
                <Box px={{ base: 1.5, md: 2 }} pb={2}>
                  <Skeleton height="38px" borderRadius="md" />
                </Box>
              )}
              {/* left fade */}
              <Box
                pointerEvents="none"
                position="absolute"
                left={0}
                top={0}
                bottom={0}
                width="48px"
                bgGradient="linear(to-r, rgba(255,255,255,1), rgba(255,255,255,0))"
                display={{ base: 'block', md: 'none' }}
                zIndex={2}
              />
              {/* right fade */}
              <Box
                pointerEvents="none"
                position="absolute"
                right={0}
                top={0}
                bottom={0}
                width="48px"
                bgGradient="linear(to-l, rgba(255,255,255,1), rgba(255,255,255,0))"
                display={{ base: 'block', md: 'none' }}
                zIndex={2}
              />

              <Box
                border="1px solid"
                borderColor="blackAlpha.100"
                bgGradient="linear(to-r, whiteAlpha.900, whiteAlpha.800)"
                boxShadow="0 20px 50px rgba(15, 23, 42, 0.08)"
                backdropFilter="blur(10px)"
                borderRadius="xl"
                px={{ base: 1.5, md: 2 }}
                py={{ base: 1.25, md: 1.75 }}
              >
                <TabList
                  ref={tabListRef}
                  position="relative"
                  overflowX="hidden"
                  overflowY="visible"
                  style={{ width: '100%', minWidth: 0 }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                  onWheel={handleWheel}
                  css={{
                    gap: '6px',
                    paddingInline: '2px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    rowGap: '8px',
                    alignItems: 'center',
                    touchAction: 'pan-y',
                    userSelect: 'none',
                    cursor: 'grab',
                    transition: 'all 200ms ease',
                    '&.dragging': { cursor: 'grabbing' },
                  }}
                >
                  {loadingDepts ? (
                    <HStack spacing={2}>
                      <Skeleton height="38px" width="120px" borderRadius="full" />
                      <Skeleton height="38px" width="120px" borderRadius="full" />
                      <Skeleton height="38px" width="120px" borderRadius="full" />
                    </HStack>
                  ) : orderedDepartments.length === 0 ? (
                    <Box px={3} py={2}>
                      <Text fontSize="sm" color="gray.500">No departments match your search.</Text>
                    </Box>
                  ) : (
                    (() => {
                      const firstRow = orderedDepartments.filter((d) => !secondRowSet.has(d.toLowerCase()));
                      const secondRow = orderedDepartments.filter((d) => secondRowSet.has(d.toLowerCase()));
                      const renderTab = (d, idx) => {
                        const accent = accentGradients[idx % accentGradients.length];
                        return (
                          <Tab
                            key={d}
                            whiteSpace="nowrap"
                            px={{ base: 2, md: 2.5 }}
                            py={{ base: 1.4, md: 1.75 }}
                            borderRadius="999px"
                            bg="whiteAlpha.900"
                            maxW={{ base: '150px', md: '180px' }}
                            minW={{ base: '110px', md: '120px' }}
                            border="1px solid"
                            borderColor="blackAlpha.100"
                            boxShadow="0 12px 30px rgba(15, 23, 42, 0.06)"
                            _hover={{
                              transform: 'translateY(-1px)',
                              borderColor: 'blue.200',
                              boxShadow: '0 14px 34px rgba(79, 70, 229, 0.16)',
                            }}
                            _selected={{
                              bg: accent,
                              color: 'white',
                              borderColor: 'transparent',
                              boxShadow: '0 16px 40px rgba(79, 70, 229, 0.28)',
                              transform: 'translateY(-2px)',
                            }}
                            _focusVisible={{ boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.35)' }}
                            css={{ scrollSnapAlign: 'center' }}
                            transition="all 180ms ease"
                            data-dept={d}
                          >
                            <HStack spacing={2} align="center" maxW="100%" title={d}>
                              <Box
                                boxSize="10px"
                                borderRadius="full"
                                bgGradient={accent}
                                boxShadow="0 0 0 4px rgba(99, 102, 241, 0.12)"
                              />
                              <Text
                                fontSize={{ base: 'xs', md: 'sm' }}
                                fontWeight={700}
                                noOfLines={1}
                                flex="1"
                                textOverflow="ellipsis"
                                overflow="hidden"
                                whiteSpace="nowrap"
                              >
                                {d}
                              </Text>
                            </HStack>
                          </Tab>
                        );
                      };
                      const tabs = [];
                      firstRow.forEach((d, idx) => tabs.push(renderTab(d, idx)));
                      if (secondRow.length) {
                        tabs.push(<Box key="break" flexBasis="100%" height="0" />);
                        secondRow.forEach((d, idx) => tabs.push(renderTab(d, idx + firstRow.length)));
                      }
                      return tabs;
                    })()
                  )}
                </TabList>
                {!loadingDepts && (
                  <TabIndicator
                    mt={2}
                    height="3px"
                    borderRadius="full"
                    bgGradient="linear(to-r, blue.400, purple.500)"
                    boxShadow="0 6px 14px rgba(99, 102, 241, 0.35)"
                  />
                )}
              </Box>
            </Box>
          </Tabs>
          <IconButton
            aria-label="Scroll right"
            icon={<ArrowRightIcon />}
            onClick={() => scrollTabs(220)}
            size="sm"
            variant="ghost"
          />
        </Flex>

        {/* Filter metrics: timeframe + metric toggles + quick search */}
        <Box
          bg="white"
          borderRadius="xl"
          border="1px solid"
          borderColor="blackAlpha.100"
          boxShadow="0 20px 50px rgba(15, 23, 42, 0.06)"
          p={{ base: 3, md: 4 }}
          mb={4}
        >
          <Wrap spacing={3} align="center">
            <WrapItem>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                width={{ base: '160px', md: '180px' }}
                size="sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="365d">Last 12 months</option>
              </Select>
            </WrapItem>

            <WrapItem>
              <ButtonGroup size="sm" isAttached variant="outline">
                <Button
                  colorScheme={metrics.followups ? 'blue' : 'gray'}
                  onClick={() => setMetrics((m) => ({ ...m, followups: !m.followups }))}
                >
                  Follow-ups
                </Button>
                <Button
                  colorScheme={metrics.assets ? 'blue' : 'gray'}
                  onClick={() => setMetrics((m) => ({ ...m, assets: !m.assets }))}
                >
                  Assets
                </Button>
                <Button
                  colorScheme={metrics.resources ? 'blue' : 'gray'}
                  onClick={() => setMetrics((m) => ({ ...m, resources: !m.resources }))}
                >
                  Resources
                </Button>
              </ButtonGroup>
            </WrapItem>

            <WrapItem flex="1" minW={{ base: '180px', md: '260px' }}>
              <Input
                placeholder="Quick search departments..."
                size="sm"
                width="100%"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </WrapItem>
          </Wrap>
        </Box>

        {/* Manage Departments Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Manage Departments</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box mb={3}>
                <Text fontSize="sm" color="gray.700">Toggle which departments appear on the COO dashboard.</Text>
                <Text fontSize="xs" color="gray.500">“All” stays enabled for quick resets.</Text>
              </Box>
              <Flex justify="space-between" align="center" mb={2} wrap="wrap" gap={2}>
                <Tag colorScheme="blue" variant="subtle">Visible: {departments.length - excludedDepartments.length}</Tag>
                <Tag colorScheme="gray" variant="subtle">Hidden: {excludedDepartments.length}</Tag>
              </Flex>
              <Box
                border="1px solid"
                borderColor="blackAlpha.100"
                borderRadius="md"
                p={3}
                bg="gray.50"
              >
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2} maxH="320px" overflowY="auto">
                  {loadingDepts ? (
                    <SkeletonText noOfLines={6} spacing={3} />
                  ) : (
                    departments.map(d => (
                      <Checkbox
                        key={d}
                        isChecked={!excludedDepartments.includes(d)}
                        onChange={() => toggleExcluded(d)}
                        isDisabled={d === 'All'}
                        colorScheme="blue"
                      >
                        {d === 'All' ? (
                          <Text as="span" fontWeight="semibold">All (always on)</Text>
                        ) : (
                          d
                        )}
                      </Checkbox>
                    ))
                  )}
                </SimpleGrid>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose} size="sm">Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isTradexModalOpen} onClose={onCloseTradexModal} size="lg" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>TradexTV snapshot</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={3} bg="white">
                  <Text fontWeight="semibold" mb={2}>Revenue vs target</Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Metric</Th>
                        <Th>Target</Th>
                        <Th>Actual</Th>
                        <Th>Delta</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {tradexRevenueRows.map((row) => {
                        const diff = row.actual - row.target;
                        const pct = row.target ? (diff / row.target) * 100 : 0;
                        const isPositive = diff >= 0;
                        return (
                          <Tr key={row.metric}>
                            <Td>{row.metric}</Td>
                            <Td>{row.target.toLocaleString()}</Td>
                            <Td>{row.actual.toLocaleString()}</Td>
                            <Td>
                              <Tag colorScheme={isPositive ? 'green' : 'orange'} variant="subtle">
                                {`${isPositive ? '+' : ''}${pct.toFixed(1)}%`}
                              </Tag>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
                <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={3} bg="white">
                  <Text fontWeight="semibold" mb={2}>Monthly social media</Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Platform</Th>
                        <Th>Target / mo</Th>
                        <Th>Actual / mo</Th>
                        <Th>Delta</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {tradexSocialReport.map((item) => {
                        const diff = item.actual - item.target;
                        const pct = item.target ? (diff / item.target) * 100 : 0;
                        const hit = diff >= 0;
                        return (
                          <Tr key={item.platform}>
                            <Td>{item.platform}</Td>
                            <Td>{item.target.toLocaleString()}</Td>
                            <Td>{item.actual.toLocaleString()}</Td>
                            <Td>
                              <Tag colorScheme={hit ? 'green' : 'orange'} variant="subtle">
                                {`${hit ? '+' : ''}${pct.toFixed(1)}%`}
                              </Tag>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button size="sm" onClick={onCloseTradexModal} colorScheme="purple">
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <VStack spacing={6} align="stretch">
          <Box>
            <KpiCards department={effectiveDept} timeRange={timeRange} metrics={metrics} />
          </Box>

          <MotionBox
            bg="white"
            p={{ base: 4, md: 5 }}
            borderRadius="xl"
            border="1px solid"
            borderColor="blackAlpha.100"
            boxShadow="0 20px 50px rgba(15, 23, 42, 0.06)"
            whileHover={{ scale: 1.01 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={3}>
              <Box>
                <Heading size="md">Revenue & Ops overview</Heading>
                <Text fontSize="sm" color="gray.600">Timeframe: {timeRangeLabels[timeRange]}</Text>
              </Box>
              <Tag size="md" colorScheme="purple" variant="subtle">{selectedDept === 'All' ? 'All departments' : selectedDept}</Tag>
            </Flex>
            <Grid templateColumns={{ base: '1fr', md: '1.1fr 1fr 1fr' }} gap={4}>
              <Box>
                <Text fontWeight="semibold" mb={3}>Revenue breakdown</Text>
                <VStack align="stretch" spacing={3}>
                  {revenueBreakdown.map((item) => {
                    const isNegative = item.change.startsWith('-');
                    return (
                      <Box
                        key={item.label}
                        p={3}
                        border="1px solid"
                        borderColor="blackAlpha.100"
                        borderRadius="lg"
                        bg="gray.50"
                      >
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Text fontSize="sm" color="gray.600">{item.label}</Text>
                            <Heading size="md">{item.value}</Heading>
                          </Box>
                          <Tag colorScheme={isNegative ? 'red' : 'green'} variant="subtle">
                            {item.change}
                          </Tag>
                        </Flex>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={3}>Follow-up SLA</Text>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Priority</Th>
                      <Th>Target</Th>
                      <Th>Achieved</Th>
                      <Th isNumeric>Overdue</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {slaRows.map((row) => (
                      <Tr key={row.priority}>
                        <Td>
                          <Tag colorScheme={row.priority === 'Critical' ? 'red' : row.priority === 'High' ? 'orange' : 'blue'}>
                            {row.priority}
                          </Tag>
                        </Td>
                        <Td>{row.target}</Td>
                        <Td>{row.achieved}</Td>
                        <Td isNumeric>{row.overdue}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={3}>Resource utilization</Text>
                <VStack align="stretch" spacing={3}>
                  {utilization.map((item) => (
                    <Box key={item.name}>
                      <Flex justify="space-between" mb={1} align="center">
                        <Text fontSize="sm">{item.name}</Text>
                        <Tag size="sm" colorScheme={item.status === 'Healthy' ? 'green' : item.status === 'Watch' ? 'yellow' : 'blue'}>
                          {item.value}%
                        </Tag>
                      </Flex>
                      <Progress value={item.value} size="sm" colorScheme={item.value >= 75 ? 'green' : item.value >= 60 ? 'yellow' : 'blue'} borderRadius="full" />
                    </Box>
                  ))}
                </VStack>
              </Box>
            </Grid>
          </MotionBox>

          <MotionBox
            bg="white"
            p={{ base: 4, md: 5 }}
            borderRadius="xl"
            border="1px solid"
            borderColor="blackAlpha.100"
            boxShadow="0 20px 50px rgba(15, 23, 42, 0.06)"
            whileHover={{ scale: 1.01 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={3}>
              <Box>
                <Heading size="md">Awards</Heading>
                <Text fontSize="sm" color="gray.600">Celebrating monthly standouts</Text>
              </Box>
              <Tag colorScheme="green" variant="subtle" size="md">Updated this month</Tag>
            </Flex>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              {awards.map((award) => (
                <Box
                  key={award.title}
                  p={4}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="blackAlpha.100"
                  bg="gray.50"
                  boxShadow="0 12px 30px rgba(15, 23, 42, 0.06)"
                >
                  <Flex align="center" gap={3} mb={3}>
                    <Avatar name={award.name} src={award.avatar} size="md" />
                    <Box>
                      <Text fontWeight="semibold">{award.title}</Text>
                      <Text fontSize="sm" color="gray.600">{award.name}</Text>
                      <Tag size="sm" colorScheme="purple" mt={1}>{award.department}</Tag>
                    </Box>
                  </Flex>
                  <Text fontSize="sm" color="gray.700">{award.highlight}</Text>
                </Box>
              ))}
            </Grid>
          </MotionBox>

          <VStack spacing={5} align="stretch">
            <MotionBox bg="white" p={4} borderRadius="md" boxShadow="sm" whileHover={{ scale: 1.01 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={3}>
                <Box>
                  <Heading size="md">TradexTV report</Heading>
                  <Text fontSize="sm" color="gray.600">Cross-team visibility into creative deliverables.</Text>
                </Box>
                <Tag colorScheme="purple" variant="subtle">COO view</Tag>
              </Flex>
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={4}>
                {tradexSummaryData.map((item) => (
                  <Box key={item.label} borderWidth="1px" borderColor="blackAlpha.100" borderRadius="md" p={3} bg="gray.50">
                    <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">{item.label}</Text>
                    <Heading size="md" mt={1}>{item.value}</Heading>
                    <Text fontSize="xs" color="gray.600" mt={0.5}>{item.sublabel}</Text>
                  </Box>
                ))}
              </SimpleGrid>
              <Box borderWidth="1px" borderColor="blackAlpha.100" borderRadius="md" overflow="hidden">
                <Table size="sm">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Service</Th>
                      <Th>Owner</Th>
                      <Th>Status</Th>
                      <Th isNumeric>Due</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tradexDeliverables.map((row) => (
                      <Tr key={`${row.service}-${row.owner}`}>
                        <Td>{row.service}</Td>
                        <Td>{row.owner}</Td>
                        <Td>
                          <Badge colorScheme={(() => {
                            const s = row.status.toLowerCase();
                            if (s.includes('review')) return 'yellow';
                            if (s.includes('queue')) return 'gray';
                            if (s.includes('progress')) return 'purple';
                            return 'green';
                          })()} variant="subtle">
                            {row.status}
                          </Badge>
                        </Td>
                        <Td isNumeric>{row.due}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </MotionBox>
            <MotionBox bg="white" p={4} borderRadius="md" boxShadow="sm" whileHover={{ scale: 1.01 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <PerformanceViewer department={effectiveDept} />
            </MotionBox>
            <MotionBox bg="white" p={4} borderRadius="md" boxShadow="sm" whileHover={{ scale: 1.01 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <DailyFollowupSuccess department={effectiveDept} />
            </MotionBox>
            <MotionBox bg="white" p={4} borderRadius="md" boxShadow="sm" whileHover={{ scale: 1.01 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <AnalyticsGraphs />
            </MotionBox>
          </VStack>

          <Box display={{ base: 'block', md: 'flex' }} gap={6}>
          <MotionBox flex="1" bg="white" p={4} borderRadius="md" boxShadow="sm" whileHover={{ scale: 1.01 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <TasksAndAlerts />
          </MotionBox>
        </Box>
      </VStack>
    </Container>
  </Box>
  );
};

// `DailyFollowupSuccess` component extracted to `components/DailyFollowupSuccess.jsx`

export default COODashboard;
