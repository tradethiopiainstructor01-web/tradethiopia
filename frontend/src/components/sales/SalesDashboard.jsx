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
  Button
} from '@chakra-ui/react';
import { Bar } from 'react-chartjs-2';
import { MdPeople, MdCheckCircle, MdPendingActions, MdError, MdNote } from 'react-icons/md';
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
    <Box p={5} bg={colorMode === 'light' ? 'gray.100' : 'gray.900'} color={colorMode === 'light' ? 'black' : 'white'} minH="100vh">
      <Flex justify="space-between" align="center" mb={5}>
        <Heading fontSize="2xl">Sales Dashboard</Heading>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" minH="300px">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <>
          {error && <Text color="red.500">{error}</Text>}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Card boxShadow="lg" _hover={{ transform: 'scale(1.05)', transition: '0.2s' }} bg="blue.400" color="white">
              <CardBody textAlign="center">
                <Icon as={MdPeople} w={8} h={8} mb={3} />
                <Text fontSize="3xl" fontWeight="bold">{data.totalCustomers}</Text>
                <Text>Total Customers</Text>
              </CardBody>
            </Card>

            <Card boxShadow="lg" _hover={{ transform: 'scale(1.05)', transition: '0.2s' }} bg="green.400" color="white">
              <CardBody textAlign="center">
                <Icon as={MdCheckCircle} w={8} h={8} mb={3} />
                <Text fontSize="3xl" fontWeight="bold">{data.completed}</Text>
                <Text>Completed Follow-ups</Text>
              </CardBody>
            </Card>

            <Card boxShadow="lg" _hover={{ transform: 'scale(1.05)', transition: '0.2s' }} bg="yellow.400" color="white">
              <CardBody textAlign="center">
                <Icon as={MdPendingActions} w={8} h={8} mb={3} />
                <Text fontSize="3xl" fontWeight="bold">{data.pending}</Text>
                <Text>Pending Follow-ups</Text>
              </CardBody>
            </Card>

            <Card boxShadow="lg" _hover={{ transform: 'scale(1.05)', transition: '0.2s' }} bg="red.400" color="white">
              <CardBody textAlign="center">
                <Icon as={MdError} w={8} h={8} mb={3} />
                <Text fontSize="3xl" fontWeight="bold">{data.rejected}</Text>
                <Text>Rejected Follow-ups</Text>
              </CardBody>
            </Card>
          </SimpleGrid>

          <Flex mt={10} p={5} bg="white" borderRadius="lg" boxShadow="lg" align="flex-start" justify="space-between">
            {/* Notes Summary Section */}
            <Box flex="1" mr={5} p={5} bg="white" borderRadius="md">
              <Text fontSize="2xl" fontWeight="bold" mb={4} color="teal.600">
                Notes Summary
              </Text>
              
              <Flex align="center" mb={2}>
                <Text fontSize="lg" color="gray.700" mr={2}>
                  Total Notes:
                </Text>
                <Badge colorScheme="teal" fontSize="md" borderRadius="full" px={2}>
                  {notes.length}
                </Badge>
              </Flex>
              
              <Text fontSize="lg" color="gray.700" mb={2}>
                Latest Notes:
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
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
                      onClick={() => openNote(note._id)} // Open note on click
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
            </Box>

            {/* Bar Chart Section */}
            <Box flex="1" minW="300px">
              <Bar 
                data={chartData} 
                options={options} 
                height={200} 
              />
            </Box>
          </Flex>

          {/* Modal for Viewing Full Note Content */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>{selectedNote?.title}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text>{selectedNote?.content}</Text> {/* Display the note content */}
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