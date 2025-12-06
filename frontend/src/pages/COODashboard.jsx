
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
  useToast,
  Textarea,
} from '@chakra-ui/react';
import { DownloadIcon, ExternalLinkIcon, ChevronDownIcon, HamburgerIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/user';

const MotionBox = chakra(motion.div);
import KpiCards from '../components/kpiCards';
import AnalyticsGraphs from '../components/AnalyticsGraphs';
import NotificationsPanel from '../components/NotificationsPanel';
import DailyFollowupSuccess from '../components/DailyFollowupSuccess';
import { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';

const baseTradexSummary = [
  { label: 'Active follow-ups', value: '-', sublabel: '' },
  { label: 'MTD revenue', value: '-', sublabel: '' },
  { label: 'Top platform', value: '-', sublabel: '' },
  { label: 'Avg services/fu', value: '-', sublabel: '' },
];

const COODashboard = () => {
  const [departments, setDepartments] = useState(['All', 'TradexTV', 'Customer Succes', 'Finance', 'Sales Manager', 'IT']);
  const [selectedDept, setSelectedDept] = useState('All');
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState({ followups: true, assets: true, resources: true });
  const tabListRef = React.useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isTradexModalOpen, onOpen: onOpenTradexModal, onClose: onCloseTradexModal } = useDisclosure();
  const { isOpen: isReportsOpen, onOpen: onOpenReports, onClose: onCloseReports } = useDisclosure();
  // department report modal removed
  const { isOpen: isSidePanelOpen, onOpen: onOpenSidePanel, onClose: onCloseSidePanel } = useDisclosure();
  const { isOpen: isDeptDrawerOpen, onOpen: onOpenDeptDrawer, onClose: onCloseDeptDrawer } = useDisclosure();
  const { isOpen: isBroadcastOpen, onOpen: onOpenBroadcast, onClose: onCloseBroadcast } = useDisclosure();
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [excludedDepartments, setExcludedDepartments] = useState(['Host', 'Sales Forces']);
  const [itSummary, setItSummary] = useState({ total: 0, completed: 0, open: 0, points: 0 });
  const [loadingIt, setLoadingIt] = useState(false);
  const [salesStats, setSalesStats] = useState({
    total: 0,
    completedDeals: 0,
    calledCustomers: 0,
    newProspects: 0,
    totalCommission: 0,
    grossCommission: 0
  });
  const [loadingSales, setLoadingSales] = useState(false);
  const [revenueBreakdown, setRevenueBreakdown] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [followupSummary, setFollowupSummary] = useState({ total: 0, active: 0, agents: 0, packages: 0 });
  const [loadingRevenueOps, setLoadingRevenueOps] = useState(false);
  const [csStats, setCsStats] = useState({ total: 0, active: 0, completed: 0, newCustomers: 0, returningCustomers: 0 });
  const [loadingCsStats, setLoadingCsStats] = useState(false);
  const [financeStats, setFinanceStats] = useState({ revenue: 0, expenses: 0, profit: 0, invoices: 0 });
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [financeReports, setFinanceReports] = useState([]);
  const [loadingFinanceReports, setLoadingFinanceReports] = useState(false);
  const [revenueActuals, setRevenueActuals] = useState([]);
  const monthOrder = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const profitLossReport = useMemo(() => {
    const match = financeReports.find((r) => {
      const title = (r?.title || r?.name || '').toLowerCase();
      return title.includes('profit') || title.includes('loss') || title.includes('p&l');
    });
    return match || null;
  }, [financeReports]);

  const revenueTrend = useMemo(() => {
    if (Array.isArray(revenueActuals) && revenueActuals.length) {
      const normalized = revenueActuals.map((row) => {
        const m = (row.month || '').toString().toLowerCase();
        const idx = monthOrder.indexOf(m);
        return {
          label: `${row.month || 'Mo'} ${row.year || ''}`.trim(),
          value: Number(row.actual) || 0,
          order: idx >= 0 ? idx : 99,
          year: Number(row.year) || 0,
        };
      });
      const sorted = normalized.sort((a, b) => (a.year === b.year ? a.order - b.order : a.year - b.year));
      return sorted.slice(-6);
    }
    return [
      { label: 'Jan', value: 1200000 },
      { label: 'Feb', value: 1350000 },
      { label: 'Mar', value: 1420000 },
      { label: 'Apr', value: 1500000 },
      { label: 'May', value: 1580000 },
      { label: 'Jun', value: 1620000 },
    ];
  }, [revenueActuals]);

  const deptMix = useMemo(() => ([
    { label: 'Sales', value: 38, color: 'blue.500' },
    { label: 'Finance', value: 22, color: 'purple.500' },
    { label: 'Customer Success', value: 18, color: 'green.500' },
    { label: 'IT', value: 12, color: 'orange.400' },
    { label: 'Ops', value: 10, color: 'pink.400' },
  ]), []);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  // Department drawer removed
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const toast = useToast();
  const isCoo = (currentUser?.role || '').toLowerCase() === 'coo';
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
  const etbFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 0,
      }),
    []
  );

  const fixedDepartments = ['All', 'TradexTV', 'Customer Succes', 'Finance', 'Sales Manager', 'IT'];
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
  const deptRouteMap = useMemo(() => ({
    tradextv: '/tradextv-dashboard',
    'sales manager': '/salesmanager',
    finance: '/finance-dashboard',
    it: '/it',
    'customer succes': '/cdashboard',
  }), []);
  const fallbackTradexRevenueRows = [
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

  // Lightweight department report snapshots for the popup
  const departmentReports = useMemo(() => {
    const sample = [
      { status: 'On track', color: 'green', risks: 2, tasks: 14, sla: '93%' },
      { status: 'Watch', color: 'yellow', risks: 4, tasks: 18, sla: '88%' },
      { status: 'Attention', color: 'orange', risks: 6, tasks: 22, sla: '84%' },
    ];
    return departments
      .filter((d) => d !== 'All' && !excludedDepartments.includes(d))
      .map((dept, idx) => {
        const ref = sample[idx % sample.length];
        return {
          department: dept,
          status: ref.status,
          color: ref.color,
          risks: ref.risks,
          tasks: ref.tasks,
          sla: ref.sla,
        };
      });
  }, [departments, excludedDepartments]);

  const currentDeptReport = useMemo(() => {
    const fallback = { department: selectedDept, status: 'N/A', color: 'gray', risks: 0, tasks: 0, sla: '—' };
    const found = departmentReports.find((d) => d.department === selectedDept);
    return found || fallback;
  }, [departmentReports, selectedDept]);

  const fetchItSummary = useCallback(async () => {
    if (!currentUser?.token) return;
    setLoadingIt(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/it/reports/all`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      const reports = Array.isArray(res.data?.data) ? res.data.data : [];
      const completed = reports.filter((r) => (r.status || '').toLowerCase() === 'done' || (r.taskRef?.status || '').toLowerCase() === 'done').length;
      const points = reports.reduce((acc, r) => acc + (Number(r.points) || Number(r.featureCount) || 0), 0);
      // If tasks are all completed reports, open count will be zero; otherwise best-effort
      const open = Math.max(reports.length - completed, 0);
      setItSummary({
        total: reports.length,
        completed,
        open,
        points,
      });
    } catch (err) {
      console.warn('Failed to load IT reports summary', err);
    } finally {
      setLoadingIt(false);
    }
  }, [currentUser?.token]);

  const fetchSalesStats = useCallback(async () => {
    setLoadingSales(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/sales-customers/stats`, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
      });
      const data = res.data || {};
      setSalesStats({
        total: data.total || 0,
        completedDeals: data.completedDeals || 0,
        calledCustomers: data.calledCustomers || 0,
        newProspects: data.new || data.active || 0,
        totalCommission: data.totalCommission || 0,
        grossCommission: data.grossCommission || 0
      });
    } catch (err) {
      console.warn('Failed to load sales stats', err);
      setSalesStats({
        total: 0,
        completedDeals: 0,
        calledCustomers: 0,
        newProspects: 0,
        totalCommission: 0,
        grossCommission: 0
      });
    } finally {
      setLoadingSales(false);
    }
  }, [currentUser?.token]);

  const fetchCsStats = useCallback(async () => {
    setLoadingCsStats(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups/stats`, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
      });
      const data = res.data || {};
      setCsStats({
        total: data.totalFollowups || 0,
        active: data.activeFollowups || 0,
        completed: data.completedFollowups || 0,
        newCustomers: data.newCustomers || 0,
        returningCustomers: data.returningCustomers || 0
      });
    } catch (err) {
      console.warn('Failed to load CS stats', err);
      setCsStats({ total: 0, active: 0, completed: 0, newCustomers: 0, returningCustomers: 0 });
    } finally {
      setLoadingCsStats(false);
    }
  }, [currentUser?.token]);

  const fetchFinanceStats = useCallback(async () => {
    setLoadingFinance(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/finance/summary`, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
      });
      const data = res.data || {};
      setFinanceStats({
        revenue: data.revenue || 0,
        expenses: data.expenses || 0,
        profit: data.profit || 0,
        invoices: data.invoices || 0,
      });
    } catch (err) {
      console.warn('Failed to load finance stats', err);
      setFinanceStats({ revenue: 0, expenses: 0, profit: 0, invoices: 0 });
    } finally {
      setLoadingFinance(false);
    }
  }, [currentUser?.token]);

  const fetchFinanceReports = useCallback(async () => {
    setLoadingFinanceReports(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/finance/reports`, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
      });
      const rows = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setFinanceReports(rows.slice(0, 5));
    } catch (err) {
      console.warn('Failed to load finance reports', err);
      setFinanceReports([]);
    } finally {
      setLoadingFinanceReports(false);
    }
  }, [currentUser?.token]);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() && !broadcastTitle.trim()) {
      toast({ title: 'Add a title or message first', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setSendingBroadcast(true);
    try {
      const targetDepts = departments.filter((d) => d && d.toLowerCase() !== 'all');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/notifications/broadcast`, {
        title: broadcastTitle || 'Notice',
        message: broadcastMessage,
        departments: targetDepts,
        audience: 'all'
      }, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}
      });
      toast({ title: 'Broadcast sent', status: 'success', duration: 3000, isClosable: true });
      setBroadcastTitle('');
      setBroadcastMessage('');
      onCloseBroadcast();
    } catch (err) {
      toast({ title: 'Failed to send', description: err?.message || 'Unknown error', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const salesChartData = useMemo(() => {
    const items = [
      { label: 'Gross Commission', value: salesStats.grossCommission || 0, color: 'orange.400', isCurrency: true },
      { label: 'Net Commission', value: salesStats.totalCommission || 0, color: 'yellow.500', isCurrency: true },
      { label: 'Deals Closed', value: salesStats.completedDeals || 0, color: 'green.500' },
      { label: 'Total Customers', value: salesStats.total || 0, color: 'blue.500' },
    ];
    const maxVal = Math.max(...items.map(i => i.value || 0), 1);
    return items.map((item) => ({
      ...item,
      height: `${Math.max((item.value / maxVal) * 100, 8)}%`,
      display: item.isCurrency ? etbFormatter.format(item.value || 0) : item.value,
    }));
  }, [salesStats, etbFormatter]);

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
    if (isReportsOpen) {
      fetchItSummary();
      fetchSalesStats();
      fetchCsStats();
      fetchFinanceStats();
      fetchFinanceReports();
    }
  }, [isReportsOpen, fetchItSummary, fetchSalesStats, fetchCsStats, fetchFinanceStats, fetchFinanceReports]);

  const fetchRevenueAndFollowups = useCallback(async () => {
    if (!import.meta.env.VITE_API_URL) return;
    setLoadingRevenueOps(true);
    try {
      // Revenue breakdown
      const revRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/revenue-actuals`);
      const rows = Array.isArray(revRes.data) ? revRes.data : Array.isArray(revRes.data?.data) ? revRes.data.data : [];
      setRevenueActuals(rows);
      const mapped = rows.slice(0, 4).map((row) => ({
        label: row.metric || row.name || 'Metric',
        value: row.actual != null ? currencyFormatter.format(row.actual) : '-',
        change:
          row.target != null && row.actual != null
            ? `${(((row.actual - row.target) / (row.target || 1)) * 100).toFixed(1)}%`
            : row.change || '+0%',
        target: row.target != null ? currencyFormatter.format(row.target) : undefined,
      }));
      setRevenueBreakdown(mapped.length ? mapped : [
        { label: 'New Deals', value: '$4.2M', change: '+6.2%', target: '$3.9M' },
        { label: 'Renewals', value: '$3.1M', change: '+3.4%', target: '$3.0M' },
        { label: 'Expansion', value: '$1.6M', change: '+2.1%', target: '$1.5M' },
        { label: 'Churn Risk', value: '$0.4M', change: '-1.2%', target: '$0.3M' },
      ]);
    } catch (err) {
      console.warn('Failed to load revenue breakdown', err);
      setRevenueActuals([]);
      setRevenueBreakdown([
        { label: 'New Deals', value: '$4.2M', change: '+6.2%', target: '$3.9M' },
        { label: 'Renewals', value: '$3.1M', change: '+3.4%', target: '$3.0M' },
        { label: 'Expansion', value: '$1.6M', change: '+2.1%', target: '$1.5M' },
        { label: 'Churn Risk', value: '$0.4M', change: '-1.2%', target: '$0.3M' },
      ]);
    }

    try {
      // Customer follow-up summary
      const fuRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/followup/report`, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {},
      });
      const data = Array.isArray(fuRes.data?.data) ? fuRes.data.data : Array.isArray(fuRes.data) ? fuRes.data : [];
      const total = data.length;
      const active = data.filter((r) => r.lastCalled).length;
      const agents = new Set(data.map((r) => r.agentName || r.creator?.username || r.assignedTo).filter(Boolean)).size;
      const packages = new Set(data.map((r) => r.packageType || r.package || r.packageNumber).filter(Boolean)).size;
      setFollowupSummary({ total, active, agents, packages });
    } catch (err) {
      console.warn('Failed to load follow-up summary', err);
      setFollowupSummary({ total: 0, active: 0, agents: 0, packages: 0 });
    } finally {
      setLoadingRevenueOps(false);
    }
  }, [currencyFormatter, currentUser?.token]);

  useEffect(() => {
    fetchRevenueAndFollowups();
  }, [fetchRevenueAndFollowups]);

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
        // Prefer Tradex-tagged revenue rows, otherwise take top 3 entries
        const tradexRows = entries
          .filter((e) => (e.metric || '').toLowerCase().includes('tradex'))
          .map((row) => ({
            metric: row.metric || 'Metric',
            target: Number(row.target) || 0,
            actual: Number(row.actual) || 0,
          }));
        const fallbackRows = entries.slice(0, 3).map((row) => ({
          metric: row.metric || 'Metric',
          target: Number(row.target) || 0,
          actual: Number(row.actual) || 0,
        }));
        const pickedRows = (tradexRows.length ? tradexRows : fallbackRows).slice(0, 3);
        if (pickedRows.length) {
          setTradexRevenueRows(pickedRows);
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
    if ((selectedDept || '').toLowerCase() === 'sales') {
      fetchSalesStats();
    }
  }, [selectedDept, fetchSalesStats]);

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

  const [tradexSummaryData, setTradexSummaryData] = useState(baseTradexSummary);
  const [tradexDeliverables, setTradexDeliverables] = useState([]);
  const [tradexLoading, setTradexLoading] = useState(false);
  const [tradexRevenueRows, setTradexRevenueRows] = useState(fallbackTradexRevenueRows);
  const fallbackTradexDeliverables = [
    { service: 'Channel relaunch plan', owner: 'Programming', status: 'In progress', due: '2025-12-12' },
    { service: 'New sponsor packages', owner: 'Sales Ops', status: 'Draft', due: '2025-12-15' },
    { service: 'Studio revamp', owner: 'Production', status: 'Design', due: '2025-12-20' },
    { service: 'Q1 content calendar', owner: 'Content', status: 'Review', due: '2025-12-18' },
  ];

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

  // Lightweight customer service snapshot for COO view
  const csSummary = [
    { label: 'Tickets today', value: '124', detail: '+8% vs daily avg', tone: 'blue' },
    { label: 'SLA met', value: '92%', detail: 'First response < 1h', tone: 'green' },
    { label: 'CSAT', value: '4.6 / 5', detail: 'Last 30 days', tone: 'purple' },
    { label: 'Backlog', value: '38', detail: '15 older than 48h', tone: 'orange' },
  ];

  const csQueues = [
    { queue: 'Phone', owner: 'Aman', open: 12, sla: '88%', aging: '5 > 48h' },
    { queue: 'Email', owner: 'Liya', open: 26, sla: '94%', aging: '6 > 48h' },
    { queue: 'Chat', owner: 'Sara', open: 18, sla: '91%', aging: '3 > 48h' },
    { queue: 'Social', owner: 'Mekdes', open: 9, sla: '89%', aging: '1 > 48h' },
  ];

  const handleLogout = () => {
    clearUser();
    navigate('/login');
  };

  return (
    <Box bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh" py={{ base: 5, md: 7 }}>
    <Container maxW="8xl">
      {/* Department tabs at top */}
      <Flex align="center" gap={3} mb={4} wrap="wrap">
        <IconButton
          aria-label="Open reports sidebar"
          icon={<HamburgerIcon />}
          onClick={onOpenSidePanel}
          size="sm"
          variant="outline"
          colorScheme="purple"
          boxShadow="0 8px 20px rgba(88,28,135,0.25)"
          _hover={{ transform: 'translateY(-1px)' }}
        />
        <Button size="sm" variant="ghost" onClick={onOpenDeptDrawer}>Departments</Button>
        {/* Tabs removed; use drawer for navigation */}
      </Flex>

        <MotionBox
          bgGradient="linear(to-r, #dbeafe, #bfdbfe)"
          color="blue.900"
          p={{ base: 4, md: 6 }}
          borderRadius="2xl"
          boxShadow="0 18px 40px rgba(59,130,246,0.15)"
          mb={{ base: 5, md: 6 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Flex align={{ base: 'flex-start', md: 'center' }} gap={4} wrap="wrap">
            <Box>
              <Text fontSize="xs" opacity={0.7}>Operations Control</Text>
              <Heading fontSize={{ base: 'xl', md: '2xl' }} color="blue.900">COO Dashboard</Heading>
              <Tag mt={3} colorScheme="blue" variant="solid" size="sm">
                {timeRangeLabels[timeRange] || 'Custom window'}
              </Tag>
            </Box>
            <Flex gap={3} wrap="wrap" align="center">
              <ButtonGroup size="sm" variant="outline" colorScheme="blue">
                <Button leftIcon={<DownloadIcon />} onClick={() => {}}>
                  Export
                </Button>
                <Button leftIcon={<ExternalLinkIcon />} onClick={() => {}}>
                  Share
                </Button>
              </ButtonGroup>
              <Button size="sm" variant="solid" colorScheme="green" onClick={onOpenBroadcast} leftIcon={<ExternalLinkIcon />}>
                Broadcast notice
              </Button>
              <Button size="sm" variant="solid" colorScheme="blue" onClick={onOpenReports} leftIcon={<ExternalLinkIcon />}>
                Department reports
              </Button>
            </Flex>
            <Spacer />
            <HStack spacing={3} align="center">
              <Menu placement="bottom-end" isLazy>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  colorScheme="blue"
                  leftIcon={<Avatar name={currentUser?.username || 'User'} src={currentUser?.avatar} size="sm" />}
                  rightIcon={<ChevronDownIcon />}
                  px={3}
                  minW={{ base: '200px', md: '240px' }}
                >
                  <Flex justify="space-between" align="center" w="100%">
                    <Box textAlign="left">
                      <Text fontWeight="semibold" fontSize="sm">{currentUser?.username || 'Unknown user'}</Text>
                      <Text fontSize="xs" opacity={0.8}>{currentUser?.role || 'Role not set'}</Text>
                    </Box>
                  </Flex>
                </MenuButton>
                <MenuList>
                  <MenuItem isDisabled>COO: {currentUser?.username || 'Not set'}</MenuItem>
                  <MenuItem isDisabled>{currentUser?.role || 'Role not set'}</MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={onOpenBroadcast}>Broadcast notice</MenuItem>
                  <MenuDivider />
                  <MenuItem color="red.500" onClick={handleLogout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </MotionBox>

        {/* Department tabs moved to top; block removed here */}

        {/* Filter metrics removed per request */}

        {/* Sales tab snapshot (from Sales dashboard drawer) */}
        {selectedDept.toLowerCase() === 'sales' && (
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
            transition={{ duration: 0.45 }}
            mb={4}
          >
            <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={3}>
              <Box display="none">
                <Heading size="md">Sales Report</Heading>
                <Text fontSize="sm" color="gray.600">Live snapshot from Sales dashboard drawer</Text>
              </Box>
              <Tag colorScheme="green" variant="subtle">Live</Tag>
            </Flex>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={4}>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">Total Customers</Text>
                <Heading size="md">{loadingSales ? '...' : salesStats.total}</Heading>
              </Box>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">Completed Deals</Text>
                <Heading size="md" color="green.500">{loadingSales ? '...' : salesStats.completedDeals}</Heading>
              </Box>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">Called Customers</Text>
                <Heading size="md" color="purple.500">{loadingSales ? '...' : salesStats.calledCustomers}</Heading>
              </Box>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">New Prospects</Text>
                <Heading size="md" color="teal.500">{loadingSales ? '...' : salesStats.newProspects}</Heading>
              </Box>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">Gross Commission</Text>
                <Heading size="md" color="orange.500">
                  {loadingSales ? '...' : `ETB ${Number(salesStats.grossCommission || 0).toFixed(2)}`}
                </Heading>
              </Box>
              <Box p={3} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" bg="gray.50">
                <Text fontSize="xs" color="gray.600">Net Commission</Text>
                <Heading size="md" color="yellow.600">
                  {loadingSales ? '...' : `ETB ${Number(salesStats.totalCommission || 0).toFixed(2)}`}
                </Heading>
              </Box>
            </SimpleGrid>
            <Box mt={6}>
              <Text fontWeight="semibold" mb={2}>Sales at a glance</Text>
              <Flex align="flex-end" gap={3} h="180px" border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" p={4} bg="gray.50">
                {salesChartData.map((item) => (
                  <Flex key={item.label} direction="column" align="center" flex="1" minW="60px">
                    <Box
                      w="100%"
                      maxW="70px"
                      borderRadius="md"
                      bg={item.color}
                      height={item.height}
                      transition="all 0.2s ease"
                    />
                    <Text mt={2} fontSize="xs" textAlign="center" noOfLines={2}>{item.label}</Text>
                    <Text fontSize="xs" color="gray.600">{loadingSales ? '...' : item.display}</Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </MotionBox>
        )}

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
              <Box mt={4}>
                <Text fontWeight="semibold" mb={2}>Department reports</Text>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  {departmentReports.map((dept) => (
                    <Box
                      key={`manage-${dept.department}`}
                      borderWidth="1px"
                      borderColor="blackAlpha.100"
                      borderRadius="lg"
                      p={3}
                      bg="gray.50"
                    >
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="semibold">{dept.department}</Text>
                        {dept.department !== 'IT' && (
                          <Badge colorScheme={dept.color}>{dept.status}</Badge>
                        )}
                      </HStack>
                      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={2}>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Tasks</Text>
                          <Text fontWeight="bold">{dept.tasks}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Risks</Text>
                          <Text fontWeight="bold">{dept.risks}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600">SLA</Text>
                          <Text fontWeight="bold">{dept.sla}</Text>
                        </Box>
                      </Grid>
                    </Box>
                  ))}
                  {departmentReports.length === 0 && (
                    <Box borderWidth="1px" borderColor="blackAlpha.100" borderRadius="lg" p={3} bg="gray.50">
                      <Text fontSize="sm" color="gray.600">No departments selected.</Text>
                    </Box>
                  )}
                </SimpleGrid>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose} size="sm">Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Department Reports Popup */}
        <Modal isOpen={isReportsOpen} onClose={onCloseReports} size="xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Department Reports</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4} color="gray.600">
                Quick snapshot from every visible department.
              </Text>
              <Box
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                p={4}
                mb={4}
                bg={useColorModeValue('gray.50', 'gray.700')}
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <Heading size="sm">Sales Report</Heading>
                  <Badge colorScheme="green">Live</Badge>
                </Flex>
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Total Customers</Text>
                    <Heading size="md">{loadingSales ? '...' : salesStats.total}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Completed Deals</Text>
                    <Heading size="md" color="green.500">{loadingSales ? '...' : salesStats.completedDeals}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Called Customers</Text>
                    <Heading size="md" color="purple.500">{loadingSales ? '...' : salesStats.calledCustomers}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">New Prospects</Text>
                    <Heading size="md" color="teal.500">{loadingSales ? '...' : salesStats.newProspects}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Gross Commission</Text>
                    <Heading size="md" color="orange.500">{loadingSales ? '...' : `ETB ${Number(salesStats.grossCommission || 0).toFixed(2)}`}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Net Commission</Text>
                    <Heading size="md" color="yellow.600">{loadingSales ? '...' : `ETB ${Number(salesStats.totalCommission || 0).toFixed(2)}`}</Heading>
                  </Box>
                </SimpleGrid>
              </Box>
              <Box
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                p={4}
                mb={4}
                bg={useColorModeValue('gray.50', 'gray.700')}
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <Heading size="sm">IT Report</Heading>
                  <Badge colorScheme="purple">Latest</Badge>
                </Flex>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Total</Text>
                    <Heading size="md">{loadingIt ? '…' : itSummary.total}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Completed</Text>
                    <Heading size="md" color="green.500">{loadingIt ? '…' : itSummary.completed}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Open</Text>
                    <Heading size="md" color="orange.500">{loadingIt ? '…' : itSummary.open}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">Points</Text>
                    <Heading size="md" color="blue.500">{loadingIt ? '…' : itSummary.points}</Heading>
                  </Box>
                </SimpleGrid>
              </Box>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {departmentReports.map((dept) => (
                  <Box
                    key={dept.department}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                    p={4}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  >
                    <HStack justify="space-between" mb={2}>
                      <Heading size="sm">{dept.department}</Heading>
                      {dept.department !== 'IT' && (
                        <Badge colorScheme={dept.color}>{dept.status}</Badge>
                      )}
                    </HStack>
                    <VStack align="stretch" spacing={2}>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">Open tasks</Text>
                        <Tag colorScheme="blue" variant="subtle">{dept.tasks}</Tag>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">Open risks</Text>
                        <Tag colorScheme="orange" variant="subtle">{dept.risks}</Tag>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="gray.600">SLA</Text>
                        <Tag colorScheme="green" variant="subtle">{dept.sla}</Tag>
                      </Flex>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onCloseReports}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Flex align="flex-start" gap={{ base: 4, lg: 6 }} direction={{ base: 'column', lg: 'row' }}>
          <MotionBox
            bg="white"
            p={{ base: sidebarCollapsed ? 2 : 3, md: sidebarCollapsed ? 2 : 4 }}
            borderRadius="xl"
            border="1px solid"
            borderColor="blackAlpha.100"
            boxShadow="0 18px 40px rgba(15, 23, 42, 0.05)"
            minW={{ lg: sidebarCollapsed ? '76px' : '260px' }}
            w={{ base: '100%', lg: sidebarCollapsed ? '76px' : '260px' }}
            position={{ lg: 'sticky' }}
            top={{ lg: '100px' }}
            transition="all 0.2s ease"
          >
            <VStack align="stretch" spacing={3}>
              <Flex justify="flex-end">
                <IconButton
                  aria-label="Collapse sidebar"
                  icon={sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                />
              </Flex>
              {departmentReports.map((dept, idx) => {
                const gradient = accentGradients[idx % accentGradients.length];
                const isIt = dept.department.toLowerCase() === 'it';
                const metrics = isIt ? [
                  { label: 'Total', value: loadingIt ? '...' : itSummary.total },
                  { label: 'Completed', value: loadingIt ? '...' : itSummary.completed },
                  { label: 'Open', value: loadingIt ? '...' : itSummary.open },
                ] : [
                  { label: 'Tasks', value: dept.tasks },
                  { label: 'Risks', value: dept.risks },
                  { label: 'SLA', value: dept.sla },
                ];
                return (
                  <Box
                    key={`sidebar-dept-${dept.department}`}
                    bgGradient={gradient}
                    color="white"
                    borderRadius="xl"
                    p={sidebarCollapsed ? 3 : 4}
                    boxShadow="md"
                  >
                    <Flex justify="space-between" align="center" mb={sidebarCollapsed ? 1 : 2}>
                      <Heading size="sm" noOfLines={1}>{sidebarCollapsed ? dept.department[0] : dept.department}</Heading>
                      {!sidebarCollapsed && dept.department !== 'IT' && <Badge colorScheme="blackAlpha" variant="subtle">{dept.status}</Badge>}
                      {!sidebarCollapsed && isIt && <Badge colorScheme="blackAlpha" variant="subtle">IT</Badge>}
                    </Flex>
                    {!sidebarCollapsed && (
                      <VStack align="stretch" spacing={1} fontSize="sm">
                        {metrics.map((m) => (
                          <Flex key={m.label} justify="space-between">
                            <Text>{m.label}</Text>
                            <Text fontWeight="bold">{m.value}</Text>
                          </Flex>
                        ))}
                      </VStack>
                    )}
                  </Box>
                );
              })}
            </VStack>
          </MotionBox>

          <VStack spacing={6} align="stretch" flex="1">
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
              transition={{ duration: 0.45 }}
            >
              <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={3}>
                <Box>
                  <Heading size="md">TradexTV report</Heading>
                  <Text fontSize="sm" color="gray.600">COO snapshot across revenue, social and deliverables.</Text>
                </Box>
                <Tag colorScheme="purple" variant="subtle">TradexTV</Tag>
              </Flex>

              <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={4}>
                {tradexSummaryData.map((item, idx) => (
                  <Box key={`tradex-summary-${item.label}-${idx}`} p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                    <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">{item.label}</Text>
                    <Heading size="md" mt={1}>{tradexLoading ? '...' : item.value}</Heading>
                    {item.sublabel && <Text fontSize="xs" color="gray.600">{item.sublabel}</Text>}
                  </Box>
                ))}
              </SimpleGrid>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <Box border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" p={3} bg="gray.50">
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">Revenue pulse</Heading>
                    <Tag size="sm" colorScheme="green" variant="subtle">vs target</Tag>
                  </Flex>
                  <VStack align="stretch" spacing={3}>
                    {(tradexRevenueRows.length ? tradexRevenueRows : fallbackTradexRevenueRows).map((row) => {
                      const pct = row.target ? Math.min(Math.round((row.actual / row.target) * 100), 180) : 100;
                      const ahead = row.actual >= row.target;
                      return (
                        <Box key={row.metric}>
                          <Flex justify="space-between" align="center">
                            <Box>
                              <Text fontSize="sm" fontWeight="semibold">{row.metric}</Text>
                              <Text fontSize="xs" color="gray.600">
                                {currencyFormatter.format(row.actual || 0)} / {currencyFormatter.format(row.target || 0)}
                              </Text>
                            </Box>
                            <Tag size="sm" colorScheme={ahead ? 'green' : 'yellow'} variant="subtle">
                              {pct}%
                            </Tag>
                          </Flex>
                          <Progress value={pct} colorScheme={ahead ? 'green' : 'yellow'} height="8px" borderRadius="full" mt={2} />
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>

                <Box border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" p={3} bg="gray.50">
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">Social reach</Heading>
                    <Tag size="sm" colorScheme="blue" variant="subtle">Weekly</Tag>
                  </Flex>
                  <VStack align="stretch" spacing={3}>
                    {tradexSocialReport.map((row) => {
                      const pct = row.target ? Math.min(Math.round((row.actual / row.target) * 100), 180) : 100;
                      return (
                        <Flex key={row.platform} align="center" justify="space-between" borderRadius="md" border="1px solid" borderColor="blackAlpha.100" p={2} bg="white">
                          <Box>
                            <Text fontWeight="semibold">{row.platform}</Text>
                            <Text fontSize="xs" color="gray.600">Target {row.target.toLocaleString()} | Actual {row.actual.toLocaleString()}</Text>
                          </Box>
                          <Box minW="140px">
                            <Progress value={pct} colorScheme={pct >= 100 ? 'green' : 'blue'} height="8px" borderRadius="full" />
                          </Box>
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>
              </Grid>

              <Box mt={5}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Heading size="sm">Top deliverables</Heading>
                  <Tag size="sm" colorScheme="purple" variant="subtle">{tradexDeliverables.length ? 'Live' : 'Sample'}</Tag>
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {(tradexDeliverables.length ? tradexDeliverables : fallbackTradexDeliverables).map((item, idx) => (
                    <Box key={`tradex-deliverable-${idx}`} border="1px solid" borderColor="blackAlpha.100" borderRadius="lg" p={3} bg="white">
                      <Text fontWeight="semibold">{item.service}</Text>
                      <Text fontSize="xs" color="gray.600">Owner: {item.owner}</Text>
                      <Flex justify="space-between" align="center" mt={2}>
                        <Tag size="sm" colorScheme="blue" variant="subtle">{item.status}</Tag>
                        <Text fontSize="xs" color="gray.600">{item.due || 'No due date'}</Text>
                      </Flex>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
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
              mb={4}
            >
              <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
                <Box>
                  <Heading size="md">Executive analysis</Heading>
                  <Text fontSize="sm" color="gray.600">Revenue trend, P&L pulse, and department mix.</Text>
                </Box>
                <Tag colorScheme="purple" variant="subtle">Live + Sample</Tag>
              </Flex>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>Revenue trend</Text>
                  <VStack align="stretch" spacing={2}>
                    {revenueTrend.map((row) => (
                      <Box key={`rev-${row.label}`}>
                        <Flex justify="space-between" fontSize="xs" color="gray.600">
                          <Text>{row.label}</Text>
                          <Text fontWeight="semibold">{currencyFormatter.format(row.value)}</Text>
                        </Flex>
                        <Box h="8px" borderRadius="full" bg="gray.100" overflow="hidden">
                          <Box h="100%" w={`${Math.min((row.value / (revenueTrend[revenueTrend.length - 1].value || 1)) * 100, 100)}%`} bgGradient="linear(to-r, blue.400, purple.500)" />
                        </Box>
                      </Box>
                    ))}
                  </VStack>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>Profit &amp; Loss snapshot</Text>
                  <VStack align="stretch" spacing={3} p={3} borderRadius="lg" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600">Revenue</Text>
                      <Text fontWeight="bold" color="blue.600">
                        {profitLossReport?.revenue != null ? etbFormatter.format(profitLossReport.revenue) : etbFormatter.format(financeStats.revenue || 0)}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600">Expenses</Text>
                      <Text fontWeight="bold" color="red.500">
                        {profitLossReport?.expenses != null ? etbFormatter.format(profitLossReport.expenses) : etbFormatter.format(financeStats.expenses || 0)}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600">Net Profit</Text>
                      <Text fontWeight="bold" color="green.600">
                        {profitLossReport?.profit != null ? etbFormatter.format(profitLossReport.profit) : etbFormatter.format(financeStats.profit || 0)}
                      </Text>
                    </Flex>
                  </VStack>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>Department mix</Text>
                  <VStack align="stretch" spacing={2}>
                    {deptMix.map((row) => (
                      <Box key={`mix-${row.label}`}>
                        <Flex justify="space-between" fontSize="xs" color="gray.600">
                          <Text>{row.label}</Text>
                          <Text fontWeight="semibold">{row.value}%</Text>
                        </Flex>
                        <Box h="8px" borderRadius="full" bg="gray.100" overflow="hidden">
                          <Box h="100%" w={`${row.value}%`} bg={row.color} opacity={0.9} />
                        </Box>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </SimpleGrid>
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
              display="none"
            >
            <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={3}>
              <Box />
              <Tag size="md" colorScheme="purple" variant="subtle">{selectedDept === 'All' ? 'All departments' : selectedDept}</Tag>
            </Flex>
            <Grid templateColumns={{ base: '1fr', md: '1.1fr 1fr 1fr' }} gap={4}>
              <Box>
                <Text fontWeight="semibold" mb={3}>Revenue breakdown</Text>
                <VStack align="stretch" spacing={3}>
                  {(loadingRevenueOps ? [{ label: 'Loading', value: '...', change: '', target: '' }] : revenueBreakdown).map((item) => {
                    const isNegative = (item.change || '').startsWith('-');
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
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">{item.label}</Text>
                            <Heading size="md">{item.value}</Heading>
                            {item.target && (
                              <Text fontSize="xs" color="gray.600">Target {item.target}</Text>
                            )}
                          </Box>
                          <Tag colorScheme={isNegative ? 'red' : 'green'} variant="subtle">
                            {item.change || '—'}
                          </Tag>
                        </Flex>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={3}>Customer follow-up</Text>
                <Box
                  border="1px solid"
                  borderColor="blackAlpha.100"
                  borderRadius="lg"
                  p={3}
                  bg="gray.50"
                >
                  <SimpleGrid columns={{ base: 2, md: 2 }} spacing={3}>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Total records</Text>
                      <Heading size="md">{loadingRevenueOps ? '…' : followupSummary.total}</Heading>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Active (last called)</Text>
                      <Heading size="md" color="green.500">{loadingRevenueOps ? '…' : followupSummary.active}</Heading>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Unique agents</Text>
                      <Heading size="md" color="purple.500">{loadingRevenueOps ? '…' : followupSummary.agents}</Heading>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Packages</Text>
                      <Heading size="md" color="blue.500">{loadingRevenueOps ? '…' : followupSummary.packages}</Heading>
                    </Box>
                  </SimpleGrid>
                </Box>
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
                <Heading size="md">Customer Service report</Heading>
                <Text fontSize="sm" color="gray.600">Live stats from Customer Dashboard.</Text>
              </Box>
              <Tag colorScheme="blue" variant="subtle" size="md">Live queue</Tag>
            </Flex>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={4}>
              <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Total follow-ups</Text>
                <Heading size="md" mt={1}>{loadingCsStats ? '...' : csStats.total}</Heading>
              </Box>
              <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Active</Text>
                <Heading size="md" mt={1} color="green.500">{loadingCsStats ? '...' : csStats.active}</Heading>
              </Box>
              <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Completed</Text>
                <Heading size="md" mt={1} color="blue.500">{loadingCsStats ? '...' : csStats.completed}</Heading>
              </Box>
              <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">New vs Returning</Text>
                <Heading size="md" mt={1}>{loadingCsStats ? '...' : `${csStats.newCustomers} / ${csStats.returningCustomers}`}</Heading>
              </Box>
            </SimpleGrid>
            <Box mt={6}>
              <Flex align="center" justify="space-between" mb={3}>
                <Heading size="sm">Finance report</Heading>
                <Tag size="sm" colorScheme="blue" variant="subtle">Live</Tag>
              </Flex>
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Revenue</Text>
                  <Heading size="md" mt={1}>{loadingFinance ? '...' : etbFormatter.format(financeStats.revenue || 0)}</Heading>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Expenses</Text>
                  <Heading size="md" mt={1} color="red.500">{loadingFinance ? '...' : etbFormatter.format(financeStats.expenses || 0)}</Heading>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Net Profit</Text>
                  <Heading size="md" mt={1} color="green.500">{loadingFinance ? '...' : etbFormatter.format(financeStats.profit || 0)}</Heading>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Invoices</Text>
                  <Heading size="md" mt={1} color="purple.500">{loadingFinance ? '...' : financeStats.invoices}</Heading>
                </Box>
              </SimpleGrid>
              <Box mt={4}>
                <Heading size="sm" mb={2}>Finance reports (from Finance Dashboard)</Heading>
                <Box mb={3}>
                  <Heading size="xs" color="gray.700" mb={1}>Profit & Loss</Heading>
                  {loadingFinanceReports ? (
                    <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                      <Skeleton height="14px" mb={2} />
                      <Skeleton height="14px" width="70%" />
                    </Box>
                  ) : profitLossReport ? (
                    <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="semibold">{profitLossReport.title || profitLossReport.name || 'Profit & Loss'}</Text>
                        <Tag size="sm" colorScheme="green" variant="subtle">{profitLossReport.status || 'Published'}</Tag>
                      </Flex>
                      <Text fontSize="xs" color="gray.600">{profitLossReport.period || profitLossReport.date || profitLossReport.createdAt || ''}</Text>
                      <SimpleGrid columns={{ base: 1, sm: 3 }} gap={2} mt={2}>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Revenue</Text>
                          <Heading size="sm">{profitLossReport.revenue != null ? etbFormatter.format(profitLossReport.revenue) : '-'}</Heading>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Expenses</Text>
                          <Heading size="sm" color="red.500">{profitLossReport.expenses != null ? etbFormatter.format(profitLossReport.expenses) : '-'}</Heading>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600">Net Profit</Text>
                          <Heading size="sm" color="green.600">
                            {profitLossReport.profit != null ? etbFormatter.format(profitLossReport.profit) : '-'}
                          </Heading>
                        </Box>
                      </SimpleGrid>
                      {profitLossReport.summary && <Text fontSize="sm" color="gray.700" mt={2}>{profitLossReport.summary}</Text>}
                    </Box>
                  ) : (
                    <Text fontSize="sm" color="gray.500">No Profit & Loss report available.</Text>
                  )}
                </Box>
                <VStack align="stretch" spacing={2}>
                  {(loadingFinanceReports ? Array.from({ length: 3 }) : financeReports).map((row, idx) => {
                    if (loadingFinanceReports) {
                      return (
                        <Box key={`fin-skel-${idx}`} p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                          <Skeleton height="16px" mb={2} />
                          <Skeleton height="12px" width="60%" />
                        </Box>
                      );
                    }
                    return (
                      <Box key={`finance-report-${row?._id || idx}`} p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Text fontWeight="semibold">{row?.title || row?.name || 'Report'}</Text>
                            <Text fontSize="xs" color="gray.600">{row?.period || row?.date || row?.createdAt || ''}</Text>
                          </Box>
                          <Tag colorScheme="blue" variant="subtle">{row?.status || 'Published'}</Tag>
                        </Flex>
                        {row?.summary && <Text fontSize="sm" color="gray.700" mt={1}>{row.summary}</Text>}
                      </Box>
                    );
                  })}
                  {!loadingFinanceReports && financeReports.length === 0 && (
                    <Text fontSize="sm" color="gray.500">No finance reports available.</Text>
                  )}
                </VStack>
              </Box>
            </Box>
            <Box mt={6}>
              <Flex align="center" justify="space-between" mb={3}>
                <Heading size="sm">Sales report</Heading>
                <Tag size="sm" colorScheme="green" variant="subtle">Live</Tag>
              </Flex>
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Customers</Text>
                  <Heading size="md" mt={1}>{loadingSales ? '...' : salesStats.total}</Heading>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Deals</Text>
                  <Heading size="md" mt={1} color="green.500">{loadingSales ? '...' : salesStats.completedDeals}</Heading>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Net Comm.</Text>
                  <Heading size="md" mt={1} color="blue.500">
                    {loadingSales ? '...' : etbFormatter.format(salesStats.totalCommission || 0)}
                  </Heading>
                </Box>
                <Box p={3} borderRadius="md" border="1px solid" borderColor="blackAlpha.100" bg="gray.50">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">New Prospects</Text>
                  <Heading size="md" mt={1} color="teal.500">{loadingSales ? '...' : salesStats.newProspects}</Heading>
                </Box>
              </SimpleGrid>
            </Box>
            <Box borderWidth="1px" borderColor="blackAlpha.100" borderRadius="md" overflow="hidden">
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Queue</Th>
                    <Th>Owner</Th>
                    <Th isNumeric>Open</Th>
                    <Th>SLA</Th>
                    <Th>Aging</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {csQueues.map((row) => (
                    <Tr key={row.queue}>
                      <Td>{row.queue}</Td>
                      <Td>{row.owner}</Td>
                      <Td isNumeric>{row.open}</Td>
                      <Td>
                        <Badge colorScheme={parseInt(row.sla) >= 92 ? 'green' : 'yellow'} variant="subtle">
                          {row.sla}
                        </Badge>
                      </Td>
                      <Td>{row.aging}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </MotionBox>

          <VStack spacing={5} align="stretch">
            <MotionBox bg="white" p={4} borderRadius="md" boxShadow="sm" whileHover={{ scale: 1.01 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <DailyFollowupSuccess department={effectiveDept} />
            </MotionBox>
            <MotionBox bg="white" p={4} borderRadius="md" boxShadow="sm" whileHover={{ scale: 1.01 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <AnalyticsGraphs />
            </MotionBox>
          </VStack>

          </VStack>
        </Flex>
    </Container>

    {/* Collapsible Sidebar Drawer */}
    <Drawer isOpen={isSidePanelOpen} placement="left" onClose={onCloseSidePanel} size="xs">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Departments</DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={3}>
            {departments
              .filter((d) => d !== 'All' && !excludedDepartments.includes(d))
              .map((dept, idx) => {
                const gradient = accentGradients[idx % accentGradients.length];
                return (
                  <Box key={`sidepanel-${dept}`} borderWidth="1px" borderColor="blackAlpha.100" borderRadius="lg" p={3} bgGradient={gradient} color="white">
                    <Heading size="sm" mb={2}>{dept}</Heading>
                    <Button
                      size="xs"
                      mt={3}
                      variant="outline"
                      colorScheme="whiteAlpha"
                      onClick={() => {
                        const route = deptRouteMap[dept.toLowerCase()];
                        if (route) navigate(route);
                        onCloseSidePanel();
                      }}
                    >
                      Open
                    </Button>
                  </Box>
                );
              })}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>

    {/* Broadcast Notification Modal */}
    <Modal isOpen={isBroadcastOpen} onClose={onCloseBroadcast} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Send broadcast notification</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={3} align="stretch">
            <Input
              placeholder="Title (optional)"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
            />
            <Textarea
              placeholder="Write a message for everyone..."
              minH="120px"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onCloseBroadcast}>Cancel</Button>
          <Button colorScheme="green" onClick={handleBroadcast} isLoading={sendingBroadcast}>
            Send
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    {/* Departments Drawer */}
    <Drawer isOpen={isDeptDrawerOpen} placement="left" onClose={onCloseDeptDrawer} size="xs">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Departments</DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={3}>
            <Input
              placeholder="Search departments..."
              size="sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <VStack align="stretch" spacing={2} maxH="60vh" overflowY="auto">
              {displayedDepartments.map((dept) => (
                <Button
                  key={`drawer-${dept}`}
                  justifyContent="space-between"
                  size="sm"
                  variant={selectedDept === dept ? 'solid' : 'ghost'}
                  colorScheme={selectedDept === dept ? 'blue' : 'gray'}
                  isDisabled={dept === 'Sales Manager' && !isCoo}
                  onClick={() => {
                    setSelectedDept(dept);
                    const route = deptRouteMap[dept.toLowerCase()];
                    if (route && (dept !== 'Sales Manager' || isCoo)) navigate(route);
                    onCloseDeptDrawer();
                  }}
                >
                  {dept}
                </Button>
              ))}
            </VStack>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>

  </Box>
  );
};

// `DailyFollowupSuccess` component extracted to `components/DailyFollowupSuccess.jsx`

export default COODashboard;
