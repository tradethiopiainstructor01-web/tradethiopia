import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { MdCheckCircle, MdError, MdNote, MdPendingActions, MdPeople } from 'react-icons/md';
import { FiCheck, FiCheckCircle, FiClock } from 'react-icons/fi';
import axiosInstance from '../../services/axiosInstance';
import { getTaskStats } from '../../services/taskService';

// Same data and sections as the desktop Sales Dashboard (components/sales/SalesDashboard.jsx).
Chart.register(...registerables);

const theme = {
  teal: '#0E8C80',
  tealSoft: '#E3F4F1',
  ink: '#081A34',
  muted: '#6E7890',
  border: '#E8EDF5'
};

const formatNumber = (value) => (Number(value) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const formatCurrency = (value) => (Number(value) || 0).toLocaleString('en-US', { style: 'currency', currency: 'ETB' });

const SectionCard = ({ title, children }) => (
  <Box bg="white" borderRadius="14px" borderWidth="1px" borderColor={theme.border} p={4}>
    {title && <Text fontSize="16px" fontWeight="800" color={theme.ink} mb={3}>{title}</Text>}
    {children}
  </Box>
);

const MobileSalesHome = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followupMetrics, setFollowupMetrics] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });
  const [deliveredOrders, setDeliveredOrders] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [taskStats, setTaskStats] = useState({ completedTasks: 0, pendingTasks: 0, overdueTasks: 0 });
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    let isMounted = true;
    axiosInstance.get('/notes', { timeout: 8000 })
      .then((response) => {
        if (isMounted) setNotes(Array.isArray(response.data) ? response.data : []);
      })
      .catch((err) => console.error('Error fetching notes:', err));
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const requestOptions = { timeout: 8000 };
      const results = await Promise.allSettled([
        axiosInstance.get('/followups/stats', requestOptions),
        getTaskStats(requestOptions),
        axiosInstance.get('/orders/stats', requestOptions),
        axiosInstance.get('/sales-customers/stats', requestOptions)
      ]);
      if (!isMounted) return;

      const [followupsResult, tasksResult, ordersResult, salesResult] = results;
      if (followupsResult.status === 'fulfilled') {
        const stats = followupsResult.value.data || {};
        setFollowupMetrics({
          total: stats.total || 0,
          completed: stats.completed || 0,
          pending: stats.pending || 0,
          overdue: stats.overdue || 0
        });
      }
      if (tasksResult.status === 'fulfilled') setTaskStats(tasksResult.value || {});
      if (ordersResult.status === 'fulfilled') setDeliveredOrders(ordersResult.value.data?.deliveredOrders || 0);
      if (salesResult.status === 'fulfilled') setTotalCommission(salesResult.value.data?.totalCommission || 0);

      const failedCount = results.filter((result) => result.status === 'rejected').length;
      if (failedCount) setError(`${failedCount} dashboard section${failedCount > 1 ? 's are' : ' is'} temporarily unavailable.`);
      setLoading(false);
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  const openNote = async (noteId) => {
    try {
      const response = await axiosInstance.get(`/notes/${noteId}`);
      setSelectedNote(response.data);
    } catch (err) {
      console.error('Error fetching note details:', err);
    }
  };

  const statCards = [
    { icon: MdPeople, value: formatNumber(followupMetrics.total), label: 'Total Follow-ups' },
    { icon: MdCheckCircle, value: formatNumber(followupMetrics.completed), label: 'Completed Follow-ups' },
    { icon: MdPendingActions, value: formatNumber(followupMetrics.pending), label: 'Pending Follow-ups' },
    { icon: MdError, value: formatNumber(followupMetrics.overdue), label: 'Overdue Follow-ups' },
    { icon: FiCheckCircle, value: formatNumber(deliveredOrders), label: 'Delivered Orders' },
    { icon: MdNote, value: formatCurrency(totalCommission), label: 'Total Commission' }
  ];

  const taskCards = [
    {
      icon: FiCheckCircle,
      label: 'Pending Tasks',
      value: taskStats.pendingTasks || 0,
      hint: taskStats.pendingTasks > 0 ? `${Math.min(2, taskStats.pendingTasks)} due soon` : 'No pending tasks'
    },
    { icon: FiCheck, label: 'Completed Tasks', value: taskStats.completedTasks || 0, hint: 'This week' },
    {
      icon: FiClock,
      label: 'Overdue Tasks',
      value: taskStats.overdueTasks || 0,
      hint: taskStats.overdueTasks > 0 ? 'Requires immediate attention' : 'No overdue tasks'
    }
  ];

  const chartData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        label: 'Follow-ups',
        data: [followupMetrics.completed, followupMetrics.pending, followupMetrics.overdue],
        backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
        borderRadius: 5
      }
    ]
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Text as="h1" fontSize="22px" fontWeight="800" color={theme.ink}>Sales Dashboard</Text>

      {loading && (
        <HStack spacing={2} color={theme.muted}>
          <Spinner size="sm" color={theme.teal} />
          <Text fontSize="13px">Loading the latest dashboard totals...</Text>
        </HStack>
      )}
      {error && <Text fontSize="13px" color="orange.600">{error}</Text>}

      <SimpleGrid columns={2} spacing={2}>
        {statCards.map((card) => (
          <Box key={card.label} bg="white" borderRadius="14px" borderWidth="1px" borderColor={theme.border} p={3} minW={0}>
            <HStack spacing={1.5} color={theme.muted} minW={0}>
              <Icon as={card.icon} boxSize={4} color={theme.teal} flexShrink={0} />
              <Text fontSize="11px" noOfLines={1}>{card.label}</Text>
            </HStack>
            <Text mt={1} fontSize={card.label === 'Total Commission' ? '15px' : '20px'} fontWeight="800" color={theme.ink} noOfLines={1} title={card.value}>
              {card.value}
            </Text>
          </Box>
        ))}
      </SimpleGrid>

      <SectionCard title="Notes Summary">
        <HStack spacing={2} mb={3}>
          <Text fontSize="14px" color={theme.muted}>Total Notes:</Text>
          <Text fontSize="13px" fontWeight="700" px={2} borderRadius="full" bg={theme.tealSoft} color={theme.teal}>
            {notes.length}
          </Text>
        </HStack>
        <Text fontSize="14px" color={theme.muted} mb={2}>Latest Notes:</Text>
        <VStack align="stretch" spacing={2}>
          {notes.length > 0 ? (
            notes.slice(-3).reverse().map((note) => (
              <HStack
                key={note._id}
                as="button"
                type="button"
                spacing={2}
                textAlign="left"
                p={3}
                borderRadius="10px"
                borderWidth="1px"
                borderColor={theme.border}
                bg="#FAFBFD"
                _active={{ bg: theme.tealSoft }}
                onClick={() => openNote(note._id)}
              >
                <Icon as={MdNote} boxSize={5} color={theme.teal} flexShrink={0} />
                <Text fontSize="14px" fontWeight="600" color={theme.ink} noOfLines={1}>{note.title}</Text>
              </HStack>
            ))
          ) : (
            <Text fontSize="13px" color={theme.muted}>No notes available.</Text>
          )}
        </VStack>
      </SectionCard>

      <SectionCard>
        <Box h="220px">
          <Bar data={chartData} options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: true, position: 'top' } } }} />
        </Box>
      </SectionCard>

      <SectionCard title="Task Reminders">
        <VStack align="stretch" spacing={2}>
          {taskCards.map((card) => (
            <Flex key={card.label} align="center" justify="space-between" p={3} borderRadius="10px" borderWidth="1px" borderColor={theme.border}>
              <Box minW={0}>
                <HStack spacing={1.5}>
                  <Icon as={card.icon} color={theme.teal} boxSize={4} />
                  <Text fontSize="14px" fontWeight="700" color={theme.ink}>{card.label}</Text>
                </HStack>
                <Text fontSize="12px" color={theme.muted} mt={0.5}>{card.hint}</Text>
              </Box>
              <Text fontSize="22px" fontWeight="800" color={theme.ink}>{card.value}</Text>
            </Flex>
          ))}
        </VStack>
        <Button mt={3} w="100%" bg={theme.teal} color="white" _hover={{ bg: '#0A6F66' }} _active={{ bg: '#0A6F66' }} onClick={() => onNavigate('Tasks')}>
          View All Tasks
        </Button>
      </SectionCard>

      <Modal isOpen={Boolean(selectedNote)} onClose={() => setSelectedNote(null)} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader pr={12}>{selectedNote?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text whiteSpace="pre-wrap">{selectedNote?.content}</Text>
          </ModalBody>
          <ModalFooter>
            <Button bg={theme.teal} color="white" _hover={{ bg: '#0A6F66' }} onClick={() => setSelectedNote(null)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default MobileSalesHome;
