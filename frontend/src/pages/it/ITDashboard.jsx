import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiPlus, FiMessageSquare } from 'react-icons/fi';
import axios from 'axios';

// Component imports
import ITSidebar from './components/ITSidebar';
import OverviewTab from './components/OverviewTab';
import InternalTasksTab from './components/InternalTasksTab';
import ExternalTasksTab from './components/ExternalTasksTab';
import PerformanceTab from './components/PerformanceTab';
import KPITab from './components/KPITab';
import ReportsTab from './components/ReportsTab';
import AddTaskForm from './components/AddTaskForm';

// Global shared imports
import NoticeBoardPanel from '../../components/NoticeBoardPanel';
import NotesLauncher from '../../components/notes/NotesLauncher';
import ChatLauncher from '../../components/chat/ChatLauncher';
import { useUserStore } from '../../store/user';

const TASK_STORAGE_KEY = 'tradethiopia_it_tasks';
const TARGET_STORAGE_KEY = 'tradethiopia_weekly_target';
const WEEKLY_TARGET_POINTS = 40;

export default function ITDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabFromUrl = searchParams.get('tab') || 'dashboard';

  const { currentUser, users, loading: usersLoading, error: usersError, fetchUsers, clearUser } = useUserStore();
  const token = currentUser?.token;

  const [activeSection, setActiveSection] = useState(activeTabFromUrl);
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);

  const [weeklyTarget, setWeeklyTarget] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(TARGET_STORAGE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
    return WEEKLY_TARGET_POINTS;
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  // Sync tab status with URL query parameters
  useEffect(() => {
    const tab = searchParams.get('tab') || 'dashboard';
    setActiveSection(tab);
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    if (newTab === 'dashboard') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: newTab });
    }
    setActiveSection(newTab);
  };

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setLoadingTasks(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/it`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTasks(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [token]);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoadingReports(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/it/reports/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setReports(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoadingReports(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchReports();
    }
  }, [token, fetchTasks, fetchReports]);

  useEffect(() => {
    if (users.length === 0 && !usersLoading && !usersError) {
      fetchUsers();
    }
  }, [users.length, usersLoading, usersError, fetchUsers]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(TARGET_STORAGE_KEY, String(weeklyTarget));
    } catch (err) {
      console.warn('Unable to persist weekly target', err);
    }
  }, [weeklyTarget]);

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userStatus');
    localStorage.removeItem('userName');
    localStorage.removeItem('infoStatus');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <OverviewTab
            tasks={tasks}
            weeklyTarget={weeklyTarget}
            setWeeklyTarget={setWeeklyTarget}
            fetchTasks={fetchTasks}
          />
        );
      case 'internal':
        return (
          <InternalTasksTab
            tasks={tasks}
            loading={loadingTasks}
            fetchTasks={fetchTasks}
          />
        );
      case 'external':
        return (
          <ExternalTasksTab
            tasks={tasks}
            loading={loadingTasks}
            fetchTasks={fetchTasks}
          />
        );
      case 'performance':
        return <PerformanceTab tasks={tasks} users={users} />;
      case 'kpi':
        return <KPITab users={users} usersLoading={usersLoading} />;
      case 'reports':
        return (
          <ReportsTab
            reports={reports}
            loading={loadingReports}
            fetchReports={fetchReports}
          />
        );
      default:
        return (
          <OverviewTab
            tasks={tasks}
            weeklyTarget={weeklyTarget}
            setWeeklyTarget={setWeeklyTarget}
            fetchTasks={fetchTasks}
          />
        );
    }
  };

  return (
    <Flex minH="100vh" bg={pageBg} w="100%" overflowX="hidden">
      <ITSidebar
        activeSection={activeSection}
        setActiveSection={handleTabChange}
        setModalOpen={setModalOpen}
        handleLogout={handleLogout}
      />

      <Box flex="1" p={{ base: 4, lg: 8 }} minW={0}>
        {activeSection === 'notice-board' ? (
          <NoticeBoardPanel title="IT Notice Board" subtitle="Internal announcements and alerts" />
        ) : (
          <>
            <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
              <Heading size="xl">IT Department Dashboard</Heading>
              <HStack spacing={2}>
                <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => setModalOpen(true)}>
                  New Task
                </Button>
                <Button colorScheme="teal" variant="outline" onClick={() => navigate("/requests")}>
                  Requests
                </Button>
                <ChatLauncher
                  icon={<FiMessageSquare />}
                  ariaLabel="Open IT workspace chat"
                  iconButtonProps={{
                    size: 'sm',
                    variant: 'ghost',
                    colorScheme: 'blue',
                    borderRadius: 'full',
                  }}
                />
                <NotesLauncher
                  buttonProps={{
                    size: 'sm',
                    variant: 'ghost',
                    colorScheme: 'blue',
                    'aria-label': 'Notes',
                  }}
                  tooltipLabel="Notes"
                />
              </HStack>
            </Flex>
            <Box
              bg={cardBg}
              borderRadius="2xl"
              p={{ base: 4, md: 6 }}
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
            >
              {renderContent()}
            </Box>
          </>
        )}
      </Box>

      <AddTaskForm
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onDone={fetchTasks}
      />
    </Flex>
  );
}
