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
import axios from 'axios';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

const Dashboard = () => {
  const [data, setData] = useState({
    totalCustomers: 0,
    completed: 0,
    pending: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { colorMode } = useColorMode();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/followup`);
        const followUps = response.data;

        const totalCustomers = followUps.length;
        const completed = followUps.filter(f => f.status === 'Completed').length;
        const pending = followUps.filter(f => f.status === 'Pending').length;
        const rejected = followUps.filter(f => f.status === 'Rejected').length;

        setData({ totalCustomers, completed, pending, rejected });
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
    labels: ['Completed', 'Pending', 'Rejected'],
    datasets: [
      {
        label: 'Follow-ups',
        data: [data.completed, data.pending, data.rejected],
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
          {error && <Text color="red.500">{error}</Text>}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
            <Card 
              boxShadow="md" 
              _hover={{ transform: 'translateY(-3px)', boxShadow: 'lg' }} 
              bg="blue.400" 
              color="white"
              transition="all 0.2s"
            >
              <CardBody textAlign="center">
                <Icon as={MdPeople} w={8} h={8} mb={3} />
                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">{data.totalCustomers}</Text>
                <Text>Total Customers</Text>
              </CardBody>
            </Card>

            <Card 
              boxShadow="md" 
              _hover={{ transform: 'translateY(-3px)', boxShadow: 'lg' }} 
              bg="green.400" 
              color="white"
              transition="all 0.2s"
            >
              <CardBody textAlign="center">
                <Icon as={MdCheckCircle} w={8} h={8} mb={3} />
                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">{data.completed}</Text>
                <Text>Completed Follow-ups</Text>
              </CardBody>
            </Card>

            <Card 
              boxShadow="md" 
              _hover={{ transform: 'translateY(-3px)', boxShadow: 'lg' }} 
              bg="yellow.400" 
              color="white"
              transition="all 0.2s"
            >
              <CardBody textAlign="center">
                <Icon as={MdPendingActions} w={8} h={8} mb={3} />
                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">{data.pending}</Text>
                <Text>Pending Follow-ups</Text>
              </CardBody>
            </Card>

            <Card 
              boxShadow="md" 
              _hover={{ transform: 'translateY(-3px)', boxShadow: 'lg' }} 
              bg="red.400" 
              color="white"
              transition="all 0.2s"
            >
              <CardBody textAlign="center">
                <Icon as={MdError} w={8} h={8} mb={3} />
                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">{data.rejected}</Text>
                <Text>Rejected Follow-ups</Text>
              </CardBody>
            </Card>
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
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">3</Text>
                  <Text fontSize="sm" color="blue.500">2 due soon</Text>
                </Box>
                
                <Box p={4} bg="green.50" borderRadius="md" border="1px" borderColor="green.200">
                  <Flex align="center" mb={2}>
                    <Icon as={FiCheck} color="green.500" mr={2} />
                    <Text fontWeight="bold" color="green.700">Completed Tasks</Text>
                  </Flex>
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">5</Text>
                  <Text fontSize="sm" color="green.500">This week</Text>
                </Box>
                
                <Box p={4} bg="orange.50" borderRadius="md" border="1px" borderColor="orange.200">
                  <Flex align="center" mb={2}>
                    <Icon as={FiClock} color="orange.500" mr={2} />
                    <Text fontWeight="bold" color="orange.700">Overdue Tasks</Text>
                  </Flex>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.600">1</Text>
                  <Text fontSize="sm" color="orange.500">Requires immediate attention</Text>
                </Box>
              </SimpleGrid>
              
              <Button 
                mt={4} 
                colorScheme="teal" 
                size="sm" 
                onClick={() => window.location.href = '/sdashboard#tasks'}
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