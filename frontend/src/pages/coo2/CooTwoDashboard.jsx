// src/pages/coo2/CooTwoDashboard.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Flex,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import CooSidebar from './CooSidebar';
import CooHeader from './CooHeader';
import OverviewView from './OverviewView';
import AnalyticsView from './AnalyticsView';
import ReportsView from './ReportsView';
import NotificationsView from './NotificationsView';
import AgentsView from './AgentsView';
import CreateReportModal from './CreateReportModal';
import QuickSearchModal from './QuickSearchModal';
import { useUserStore } from '../../store/user';
import axiosInstance from '../../services/axiosInstance';
import { useLocation } from 'react-router-dom';

const CooTwoDashboard = () => {
  const location = useLocation();
  const { currentUser } = useUserStore();
  const [activeTab, setActiveTab] = useState('departments');
  const [selectedDept, setSelectedDept] = useState('all');
  const [dateRange, setDateRange] = useState('Weekly');
  const [, setDataRevision] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [mainSidebarCollapsed, setMainSidebarCollapsed] = useState(false);
  const [departmentsMenuOpen, setDepartmentsMenuOpen] = useState(false);
  const mainScrollRef = useRef(null);

  // Filter states
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const currentWeekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  const currentWeekStr = `${currentYear}-W${String(currentWeekNum).padStart(2, '0')}`;
  const currentQuarterStr = String(Math.floor(now.getMonth() / 3) + 1);

  const [periodType, setPeriodType] = useState('weekly');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedWeek, setSelectedWeek] = useState(currentWeekStr);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarterStr);
  const [statusFilter, setStatusFilter] = useState('All');

  const periodKey = useMemo(() => {
    if (periodType === 'weekly') {
      return selectedWeek || `${selectedYear}-W01`;
    }
    if (periodType === 'quarterly') {
      return `${selectedYear}-Q${selectedQuarter}`;
    }
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  }, [periodType, selectedYear, selectedMonth, selectedWeek, selectedQuarter]);

  const periodDisplayLabel = useMemo(() => {
    if (periodType === 'weekly') {
      const wNum = selectedWeek?.split('-W')[1] || '01';
      return `Week ${wNum}, ${selectedYear}`;
    }
    if (periodType === 'quarterly') {
      return `Q${selectedQuarter} ${selectedYear}`;
    }
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(selectedMonth, 10) - 1;
    return `${monthNames[monthIndex] || selectedMonth} ${selectedYear}`;
  }, [periodType, selectedYear, selectedMonth, selectedWeek, selectedQuarter]);

  const handleResetFilters = () => {
    setPeriodType('weekly');
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonthStr);
    setSelectedWeek(currentWeekStr);
    setSelectedQuarter(currentQuarterStr);
    setStatusFilter('All');
    setSearchQuery('');
  };

  const handleSetCurrentPeriod = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonthStr);
    setSelectedWeek(currentWeekStr);
    setSelectedQuarter(currentQuarterStr);
  };

  const {
    isOpen: isReportModalOpen,
    onOpen: onOpenReportModal,
    onClose: onCloseReportModal,
  } = useDisclosure();

  const {
    isOpen: isSearchModalOpen,
    onOpen: onOpenSearchModal,
    onClose: onCloseSearchModal,
  } = useDisclosure();

  const toast = useToast();

  const openDepartments = () => {
    setActiveTab('departments');
    setMainSidebarCollapsed(false);
    setDepartmentsMenuOpen(true);
  };

  const selectDepartment = (deptId, reportType, reportKey) => {
    if (reportType && reportKey) {
      setPeriodType(reportType);
      setSelectedYear(Number(reportKey.slice(0, 4)));
      if (reportType === 'weekly') setSelectedWeek(reportKey);
      if (reportType === 'monthly') setSelectedMonth(reportKey.slice(5, 7));
      if (reportType === 'quarterly') setSelectedQuarter(reportKey.slice(-1));
      setStatusFilter('All');
      setSearchQuery('');
    }
    setSelectedDept(deptId);
    openDepartments();
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dept = params.get('dept');
    const type = params.get('periodType');
    const key = params.get('periodKey');
    const formats = { weekly: /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/, monthly: /^\d{4}-(0[1-9]|1[0-2])$/, quarterly: /^\d{4}-Q[1-4]$/ };
    if (dept && formats[type]?.test(key)) selectDepartment(dept, type, key);
  }, [location.search]);

  const selectMainTab = (tab) => {
    if (tab === 'departments') {
      setActiveTab('departments');
      setMainSidebarCollapsed(false);
      setDepartmentsMenuOpen((isOpen) => activeTab === 'departments' ? !isOpen : true);
      return;
    }

    setActiveTab(tab);
    setDepartmentsMenuOpen(false);
    if (tab === 'agents') setMainSidebarCollapsed(false);
  };

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearchModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearchModal]);

  useEffect(() => {
    let active = true;
    const refreshUnread = () => axiosInstance.get('/notifications')
      .then((res) => {
        if (active && Array.isArray(res?.data)) {
          const unread = res.data.filter((n) => !n.read).length;
          setUnreadNotifsCount(unread);
        }
      })
      .catch((err) => console.warn('Could not load unread count:', err));
    refreshUnread();
    const timer = window.setInterval(refreshUnread, 15000);
    window.addEventListener('focus', refreshUnread);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refreshUnread); };
  }, [activeTab]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab, selectedDept]);

  const handleRefresh = () => {
    toast({
      title: 'Real-time telemetry updated',
      description: 'Fetched latest operational metrics across 10 departments.',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
  };

  return (
    <Flex h="100dvh" maxH="100dvh" minH={0} bg="#f8fafc" color="#0f172a" overflow="hidden">
      {/* 1. Main Dark Left Sidebar */}
      <CooSidebar
        activeTab={activeTab}
        setActiveTab={selectMainTab}
        unreadNotifsCount={unreadNotifsCount}
        currentUser={currentUser}
        collapsed={mainSidebarCollapsed}
        selectedDept={selectedDept}
        setSelectedDept={selectDepartment}
        departmentsMenuOpen={departmentsMenuOpen}
        onToggleCollapse={() => setMainSidebarCollapsed(!mainSidebarCollapsed)}
      />

      {/* 2. Main Dashboard Body Container */}
      <Flex direction="column" flex={1} minW={0} minH={0} h="100%" overflow="hidden">
        {/* Header Bar */}
        <CooHeader
          onToggleSidebar={() => setMainSidebarCollapsed(!mainSidebarCollapsed)}
          periodType={periodType}
          setPeriodType={setPeriodType}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
          selectedQuarter={selectedQuarter}
          setSelectedQuarter={setSelectedQuarter}
          periodKey={periodKey}
          periodDisplayLabel={periodDisplayLabel}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onResetFilters={handleResetFilters}
          onSetCurrentPeriod={handleSetCurrentPeriod}
          selectedDepartment={selectedDept}
          onSelectDepartment={selectDepartment}
          onOpenSearchModal={onOpenSearchModal}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onCreateReportClick={onOpenReportModal}
          unreadCount={unreadNotifsCount}
          currentUser={currentUser}
          onRefresh={handleRefresh}
          onNotificationsClick={() => selectMainTab('notifications')}
          onDataImported={() => setDataRevision((revision) => revision + 1)}
        />

        {/* Dynamic Views Rendering */}
        <Box
          ref={mainScrollRef}
          p={{ base: 4, md: 6, lg: 8 }}
          flex={1}
          minH={0}
          overflowY="auto"
          overflowX="hidden"
          overscrollBehavior="contain"
          sx={{
            scrollbarGutter: 'stable',
            scrollbarWidth: 'thin',
            scrollbarColor: '#94a3b8 #f1f5f9',
            '&::-webkit-scrollbar': { width: '8px', background: '#f1f5f9' },
            '&::-webkit-scrollbar-track': { background: '#f1f5f9' },
            '&::-webkit-scrollbar-thumb': {
              background: '#94a3b8',
              border: '2px solid #f1f5f9',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb:hover': { background: '#64748b' },
            '&::-webkit-scrollbar-button': { display: 'none', width: 0, height: 0 },
          }}
        >
          {activeTab === 'departments' && (
            <OverviewView
              departmentId={selectedDept}
              currentUser={currentUser}
              dateRange={dateRange}
              setDateRange={setDateRange}
              periodType={periodType}
              periodKey={periodKey}
              periodDisplayLabel={periodDisplayLabel}
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              onNavigateTab={selectMainTab}
              onSelectDepartment={selectDepartment}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView periodType={periodType} periodKey={periodKey} periodDisplayLabel={periodDisplayLabel} />}

          {activeTab === 'reports' && (
            <ReportsView onCreateReportModalOpen={onOpenReportModal} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              unreadCount={unreadNotifsCount}
              setUnreadCount={setUnreadNotifsCount}
              onNavigateDepartment={selectDepartment}
            />
          )}

          {activeTab === 'agents' && <AgentsView />}

          {activeTab === 'projects' && (
            <Box bg="#ffffff" p={6} borderRadius="16px" border="1px solid #e2e8f0">
              <Box mb={5}>
                <Box as="h2" fontSize="22px" fontWeight="800" color="#0f172a" mb={1}>
                  Cross-Departmental Strategic Projects
                </Box>
                <Box as="p" fontSize="13.5px" color="#64748b">
                  Real-time milestone tracking across 142 active enterprise and divisional initiatives.
                </Box>
              </Box>
              <OverviewView
                departmentId={selectedDept}
                currentUser={currentUser}
                dateRange={dateRange}
                setDateRange={setDateRange}
                periodType={periodType}
                periodKey={periodKey}
                periodDisplayLabel={periodDisplayLabel}
                statusFilter={statusFilter}
                searchQuery={searchQuery}
                onNavigateTab={selectMainTab}
              />
            </Box>
          )}

          {activeTab === 'users' && (
            <Box bg="#ffffff" p={6} borderRadius="16px" border="1px solid #e2e8f0">
              <Box mb={5}>
                <Box as="h2" fontSize="22px" fontWeight="800" color="#0f172a" mb={1}>
                  Workforce & Department Leadership Directory
                </Box>
                <Box as="p" fontSize="13.5px" color="#64748b">
                  Operational department heads, team distribution, and active assignments.
                </Box>
              </Box>
              <AnalyticsView periodType={periodType} periodKey={periodKey} periodDisplayLabel={periodDisplayLabel} />
            </Box>
          )}

          {activeTab === 'documentation' && (
            <Box bg="#ffffff" p={6} borderRadius="16px" border="1px solid #e2e8f0">
              <Box mb={4}>
                <Box as="h2" fontSize="20px" fontWeight="800" color="#0f172a" mb={1}>
                  2 COO Executive Platform Documentation
                </Box>
                <Box as="p" fontSize="13.5px" color="#64748b">
                  Operational standard operating procedures (SOPs), API specifications, and workflow guides.
                </Box>
              </Box>
            </Box>
          )}

          {activeTab === 'settings' && (
            <Box bg="#ffffff" p={6} borderRadius="16px" border="1px solid #e2e8f0">
              <Box mb={4}>
                <Box as="h2" fontSize="20px" fontWeight="800" color="#0f172a" mb={1}>
                  Executive Platform Settings
                </Box>
                <Box as="p" fontSize="13.5px" color="#64748b">
                  Configure department threshold alerts, telemetry refresh intervals, and report delivery channels.
                </Box>
              </Box>
            </Box>
          )}

          {activeTab === 'help' && (
            <Box bg="#ffffff" p={6} borderRadius="16px" border="1px solid #e2e8f0">
              <Box mb={4}>
                <Box as="h2" fontSize="20px" fontWeight="800" color="#0f172a" mb={1}>
                  Operations Helpdesk & Escalations
                </Box>
                <Box as="p" fontSize="13.5px" color="#64748b">
                  Direct escalation bridge to technical leads, department managers, and board administrators.
                </Box>
              </Box>
            </Box>
          )}

          {!['departments', 'analytics', 'reports', 'notifications', 'agents', 'projects', 'users', 'documentation', 'settings', 'help'].includes(activeTab) && (
            <OverviewView
              departmentId={selectedDept}
              currentUser={currentUser}
              dateRange={dateRange}
              setDateRange={setDateRange}
              periodType={periodType}
              periodKey={periodKey}
              periodDisplayLabel={periodDisplayLabel}
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              onNavigateTab={selectMainTab}
            />
          )}
        </Box>
      </Flex>

      {/* Modals */}
      <CreateReportModal
        isOpen={isReportModalOpen}
        onClose={onCloseReportModal}
        defaultDept={selectedDept}
      />

      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={onCloseSearchModal}
        onSelectDepartment={(deptId) => {
          selectDepartment(deptId);
        }}
        onSelectTab={selectMainTab}
      />
    </Flex>
  );
};

export default CooTwoDashboard;
