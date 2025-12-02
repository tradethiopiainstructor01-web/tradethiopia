import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  Text,
  Badge,
  HStack,
  Select,
  useToast,
  Collapse,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  useColorModeValue,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiPlus, FiCalendar, FiUser, FiList, FiInbox } from 'react-icons/fi';
import axios from 'axios';
import AddTaskForm from './AddTaskForm';
import { useUserStore } from '../../store/user'; // Import the user store

const statusColor = (s) => {
  switch (s) {
    case 'done': return 'green';
    case 'ongoing': return 'blue';
    case 'pending': return 'yellow';
    default: return 'gray';
  }
};

const InternalTable = ({ search }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const { currentUser } = useUserStore(); // Get current user from store
  const token = currentUser?.token; // Get token from current user
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/it?projectType=internal`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTasks(response.data.data || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to load tasks', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const markComplete = async (id) => {
    // Prompt for feature count
    const featureCount = prompt('Enter the number of features/points for this task:', '1');
    
    // If user cancels, don't proceed
    if (featureCount === null) return;
    
    // Validate input
    const points = parseInt(featureCount);
    if (isNaN(points) || points < 1) {
      toast({ title: 'Invalid input', description: 'Please enter a valid number of points (minimum 1)', status: 'error' });
      return;
    }
    
    try {
      console.log('Marking task as complete with ID:', id);
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/it/${id}`, {
        status: 'done',
        featureCount: points
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Refresh the tasks list
        fetchTasks();
        toast({ title: 'Task marked completed', status: 'success' });
      } else {
        toast({ title: 'Update failed', description: response.data.message || 'Failed to update task', status: 'error' });
      }
    } catch (err) {
      console.error('Mark complete error:', err);
      toast({ title: 'Update failed', description: err.response?.data?.message || err.message || 'Failed to update task', status: 'error' });
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        console.log('Deleting task with ID:', id);
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/it/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          // Refresh the tasks list
          fetchTasks();
          toast({ title: 'Task deleted', status: 'success' });
        } else {
          toast({ title: 'Delete failed', description: response.data.message || 'Failed to delete task', status: 'error' });
        }
      } catch (err) {
        console.error('Delete task error:', err);
        toast({ title: 'Delete failed', description: err.response?.data?.message || err.message || 'Failed to delete task', status: 'error' });
      }
    }
  };

  const filtered = tasks
    .filter(t => t.status !== 'done') // Exclude completed tasks
    .filter(t => filter === 'all' ? true : t.status === filter)
    .filter(t => !searchTerm || 
      [
        t.taskName, 
        ...(t.platform ? t.platform.split(', ') : []),
        ...(Array.isArray(t.actionType) ? t.actionType : [t.actionType || ''])
      ]
        .join(' ')
        .toLowerCase()
        .includes((searchTerm || '').toLowerCase())
    )
    .sort((a, b) => sort === 'newest' ? new Date(b.startDate) - new Date(a.startDate) : new Date(a.startDate) - new Date(b.startDate));

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <Spinner size="xl" />
    </Box>
  );

  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color={useColorModeValue('gray.800', 'white')}>
            Internal Projects
          </Heading>
          <Text color={useColorModeValue('gray.600', 'gray.400')}>
            Manage internal IT projects and tasks
          </Text>
        </Box>
        
        <Button 
          leftIcon={<FiPlus />} 
          colorScheme="blue"
          onClick={() => setShowAdd(true)}
        >
          Add Internal Task
        </Button>
      </HStack>

      {/* Stats Overview */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Total Tasks
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" mt={1}>
                {tasks.length}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                In Progress
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" mt={1} color="blue.500">
                {tasks.filter(t => t.status === 'ongoing').length}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Completed
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" mt={1} color="green.500">
                {tasks.filter(t => t.status === 'done').length}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                High Priority
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" mt={1} color="red.500">
                {tasks.filter(t => t.priority === 'High').length}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters */}
      <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <HStack spacing={4} flexWrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="lg"
              />
            </InputGroup>
            
            <Select 
              maxW="200px" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              borderRadius="lg"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="ongoing">In Progress</option>
              <option value="done">Completed</option>
            </Select>
            
            <Select 
              maxW="200px" 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              borderRadius="lg"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </Select>
            
            <Button 
              leftIcon={<FiFilter />} 
              variant="outline"
              onClick={fetchTasks}
            >
              Refresh
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Tasks Table */}
      {filtered.length > 0 ? (
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Task Name</Th>
                  <Th>Platform</Th>
                  <Th>Action Type</Th>
                  <Th>Timeline</Th>
                  <Th>Status</Th>
                  <Th>Priority</Th>
                  <Th>Assignee</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((task) => (
                  <Tr key={task._id || task.id}>
                    <Td fontWeight="medium">{task.taskName || 'N/A'}</Td>
                    <Td>
                      <Wrap spacing={2}>
                        {task.platform ? (
                          task.platform.split(', ').map((plat, idx) => (
                            <WrapItem key={idx}>
                              <Badge colorScheme="blue" variant="subtle">
                                {plat}
                              </Badge>
                            </WrapItem>
                          ))
                        ) : (
                          <Badge colorScheme="blue" variant="subtle">
                            N/A
                          </Badge>
                        )}
                      </Wrap>
                    </Td>
                    <Td>
                      {Array.isArray(task.actionType) ? (
                        task.actionType.join(', ')
                      ) : (
                        task.actionType || 'N/A'
                      )}
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <Icon as={FiCalendar} color={useColorModeValue('gray.500', 'gray.400')} boxSize={4} />
                        <Text fontSize="sm">
                          {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                        </Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={statusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'green'}>
                        {task.priority}
                      </Badge>
                    </Td>
                    <Td>
                      <Wrap spacing={2}>
                        {task.assignedTo.map((person, idx) => (
                          <WrapItem key={idx}>
                            <HStack spacing={1}>
                              <Icon as={FiUser} color={useColorModeValue('gray.500', 'gray.400')} boxSize={4} />
                              <Text fontSize="sm">{person}</Text>
                            </HStack>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        {task.status !== 'done' && (
                          <Button 
                            size="sm" 
                            colorScheme="green"
                            onClick={() => markComplete(task._id || task.id)}
                          >
                            Mark Complete
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          colorScheme="red"
                          onClick={() => deleteTask(task._id || task.id)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      ) : (
        <Card bg={bg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Box textAlign="center" py={12} color={useColorModeValue('gray.500', 'gray.400')}>
              <Icon as={FiSearch} boxSize={12} mb={4} />
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                No internal tasks found
              </Text>
              <Text>
                Try adjusting your search or filter criteria
              </Text>
            </Box>
          </CardBody>
        </Card>
      )}

      {/* Add Task Modal */}
      <AddTaskForm 
        isOpen={showAdd} 
        onClose={() => setShowAdd(false)} 
        onDone={fetchTasks}
        defaultProjectType="internal"
      />
    </VStack>
  );
};

export default InternalTable;