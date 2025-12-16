import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Spinner,
  Icon,
  useColorMode,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { Bar } from 'react-chartjs-2';
import { MdPeople, MdCheckCircle, MdPendingActions, MdError, MdNote } from 'react-icons/md';
import { FiCheckCircle, FiCheck, FiClock } from 'react-icons/fi';
import axiosInstance from '../../services/axiosInstance';
import { getMyTasks, getTaskStats } from '../../services/taskService';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

const formatNumber = (value) => {
  const number = Number(value) || 0;
  return number.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB'
  }).format(Number(value) || 0);
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followupMetrics, setFollowupMetrics] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });
  const [deliveredOrders, setDeliveredOrders] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const { colorMode } = useColorMode();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0
  });
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notes`);
        const data = await response.json();
        setNotes(data);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    fetchNotes();
  }, []);

  const openNote = async (noteId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notes/${noteId}`);
      const noteData = await response.json();
      setSelectedNote(noteData);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching note details:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
      const [followupStatsRes, tasksRes, taskStatsRes, ordersStatsRes, completedCustomersRes] = await Promise.all([
        axiosInstance.get('/followups/stats'),
        getMyTasks(),
        getTaskStats(),
        axiosInstance.get('/orders/stats'),
        axiosInstance.get('/sales-customers', { params: { followupStatus: 'Completed' } })
      ]);

        const followupStats = followupStatsRes.data || {};
        const orderStats = ordersStatsRes.data || {};

        setFollowupMetrics({
          total: followupStats.total || 0,
          completed: followupStats.completed || 0,
          pending: followupStats.pending || 0,
          overdue: followupStats.overdue || 0,
        });

        setDeliveredOrders(orderStats.deliveredOrders || 0);

      const completedCustomers = Array.isArray(completedCustomersRes.data) ? completedCustomersRes.data : [];
      const commissionSum = completedCustomers.reduce((sum, customer) => {
        const netCommission = Number(customer?.commission?.netCommission ?? 0);
        return sum + (Number.isFinite(netCommission) ? netCommission : 0);
      }, 0);
      setTotalCommission(commissionSum);

        // Set task data
        setTasks(tasksRes);
        setTaskStats(taskStatsRes);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        label: 'Follow-ups',
        data: [followupMetrics.completed, followupMetrics.pending, followupMetrics.overdue],
        backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
        borderRadius: 5,
      },
    ],
  };

  const options = {
    maintainAspectRatio: true,
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
          },
        },
      },
    },
  };

  return (
    <Box p={{ base: 2, md: 6 }} bg={bgColor} minHeight="100vh">
      <Heading 
        as="h1" 
        size={{ base: "lg", md: "xl" }} 
        color={headerColor}
        textAlign={{ base: "center", md: "left" }}
        fontWeight="bold"
        mb={6}
      >
        Sales Dashboard
      </Heading>

      {loading ? (
        <Flex justify="center" align="center" minH="300px">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <>
          {error && <Text color="red.500">{error}</Text>
}
          <SimpleGrid columns={{ base: 1, md: 3, lg: 4 }} spacing={3} mb={6}>
            {[
              {
                icon: MdPeople,
                value: formatNumber(followupMetrics.total),
                label: 'Total Follow-ups',
                bg: 'blue.400'
              },
              {
                icon: MdCheckCircle,
                value: formatNumber(followupMetrics.completed),
                label: 'Completed Follow-ups',
                bg: 'green.400'
              },
              {
                icon: MdPendingActions,
                value: formatNumber(followupMetrics.pending),
                label: 'Pending Follow-ups',
                bg: 'yellow.400'
              },
              {
                icon: MdError,
                value: formatNumber(followupMetrics.overdue),
                label: 'Overdue Follow-ups',
                bg: 'red.400'
              },
              {
                icon: FiCheckCircle,
                value: formatNumber(deliveredOrders),
                label: 'Delivered Orders',
                bg: 'teal.500'
              },
              {
                icon: MdNote,
                value: formatCurrency(totalCommission),
                label: 'Total Commission',
                bg: 'purple.500'
              }
            ].map((card) => (
              <Card
                key={card.label}
                boxShadow="md"
                _hover={{ transform: 'translateY(-3px)', boxShadow: 'lg' }}
                bg={card.bg}
                color="white"
                transition="all 0.2s"
              >
                <CardBody textAlign="center" py={4} px={3}>
                  <Icon as={card.icon} w={6} h={6} mb={2} />
                  <Text fontSize="xl" fontWeight="bold">{card.value}</Text>
                  <Text fontSize="xs">{card.label}</Text>
                </CardBody>
              </Card>
            ))}

          </SimpleGrid>

          <Flex 
            direction={{ base: "column", md: "row" }} 
            mt={6} 
            gap={6}
          >
            {/* Notes Summary Section */}
            <Card 
              flex="1" 
              p={5} 
              bg={cardBg} 
              borderRadius="lg" 
              boxShadow="md"
              transition="all 0.2s"
              _hover={{ boxShadow: 'lg' }}
            >
              <CardBody>
                <Text 
                  fontSize="xl" 
                  fontWeight="bold" 
                  mb={4} 
                  color={headerColor}
                >
                  Notes Summary
                </Text>
                
                <Flex align="center" mb={4}>
                  <Text fontSize="lg" color={textColor} mr={2}>
                    Total Notes:
                  </Text>
                  <Badge colorScheme="teal" fontSize="md" borderRadius="full" px={2}>
                    {notes.length}
                  </Badge>
                </Flex>
                
                <Text fontSize="lg" color={textColor} mb={3}>
                  Latest Notes:
                </Text>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {notes.length > 0 ? (
                    notes.slice(-3).reverse().map(note => (
                      <Box 
                        key={note._id} 
                        borderWidth={1} 
                        borderColor="gray.200" 
                        borderRadius="md" 
                        p={3} 
                        bg="gray.50" 
                        _hover={{ bg: "gray.100", cursor: 'pointer', transition: '0.2s' }} 
                        onClick={() => openNote(note._id)}
                      >
                        <Flex align="center">
                          <MdNote size={20} color="teal.500" style={{ marginRight: '8px' }} />
                          <Text fontSize="md" color="teal.600" fontWeight="semibold">{note.title}</Text>
                        </Flex>
                      </Box>
                    ))
                  ) : (
                    <Text fontSize="sm" color="gray.500">No notes available.</Text>
                  )}
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Bar Chart Section */}
            <Card 
              flex="1" 
              minW="300px" 
              bg={cardBg} 
              borderRadius="lg" 
              boxShadow="md"
              transition="all 0.2s"
              _hover={{ boxShadow: 'lg' }}
              p={5}
            >
              <CardBody>
                <Bar 
                  data={chartData} 
                  options={options} 
                  height={200} 
                />
              </CardBody>
            </Card>
          </Flex>

          {/* Task Reminders Section */}
          <Card 
            mt={6} 
            p={5} 
            bg={cardBg} 
            borderRadius="lg" 
            boxShadow="md"
            transition="all 0.2s"
            _hover={{ boxShadow: 'lg' }}
          >
            <CardBody>
              <Text 
                fontSize="xl" 
                fontWeight="bold" 
                mb={4} 
                color={headerColor}
              >
                Task Reminders
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Box p={4} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                  <Flex align="center" mb={2}>
                    <Icon as={FiCheckCircle} color="blue.500" mr={2} />
                    <Text fontWeight="bold" color="blue.700">Pending Tasks</Text>
                  </Flex>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">{taskStats.pendingTasks}</Text>
                  <Text fontSize="sm" color="blue.500">{taskStats.pendingTasks > 0 ? `${Math.min(2, taskStats.pendingTasks)} due soon` : 'No pending tasks'}</Text>
                </Box>
                
                <Box p={4} bg="green.50" borderRadius="md" border="1px" borderColor="green.200">
                  <Flex align="center" mb={2}>
                    <Icon as={FiCheck} color="green.500" mr={2} />
                    <Text fontWeight="bold" color="green.700">Completed Tasks</Text>
                  </Flex>
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">{taskStats.completedTasks}</Text>
                  <Text fontSize="sm" color="green.500">This week</Text>
                </Box>
                
                <Box p={4} bg="orange.50" borderRadius="md" border="1px" borderColor="orange.200">
                  <Flex align="center" mb={2}>
                    <Icon as={FiClock} color="orange.500" mr={2} />
                    <Text fontWeight="bold" color="orange.700">Overdue Tasks</Text>
                  </Flex>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.600">{taskStats.overdueTasks}</Text>
                  <Text fontSize="sm" color="orange.500">{taskStats.overdueTasks > 0 ? 'Requires immediate attention' : 'No overdue tasks'}</Text>
                </Box>
              </SimpleGrid>
              
              <Button 
                mt={4} 
                colorScheme="teal" 
                size="sm" 
                onClick={() => window.dispatchEvent(new CustomEvent('navigateToSection', { detail: { section: 'Tasks' } }))}
              >
                View All Tasks
              </Button>
            </CardBody>
          </Card>

          {/* Modal for Viewing Full Note Content */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>{selectedNote?.title}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text>{selectedNote?.content}</Text>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
