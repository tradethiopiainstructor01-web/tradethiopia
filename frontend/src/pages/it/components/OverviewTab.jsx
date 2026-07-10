import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Progress,
  Select,
  SimpleGrid,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import {
  FiChevronRight,
  FiSearch,
  FiList,
  FiTarget,
  FiLayers,
  FiPieChart,
} from 'react-icons/fi';
import axios from 'axios';
import { useUserStore } from '../../../store/user';

const INTERNAL_SUBTASKS = [
  'Functionality',
  'Features',
  'Update',
  'Troubleshoot',
  'Renewal',
  'AI/ML',
];
const EXTERNAL_SUBTASKS = ['New', 'Update', 'Comment', 'Renewal'];

const TaskTable = ({ tasks, onToggleStatus, onUpdatePoints, emptyMessage, isCompact }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingPoints, setEditingPoints] = useState(1);

  const statusColor = (status) => {
    if (status === 'done') return 'green';
    if (status === 'ongoing') return 'blue';
    return 'yellow';
  };

  const startEditing = (taskId, currentPoints) => {
    setEditingTaskId(taskId);
    setEditingPoints(currentPoints || 1);
  };

  const savePoints = (taskId) => {
    const points = parseInt(editingPoints);
    if (!isNaN(points) && points >= 1 && onUpdatePoints) {
      onUpdatePoints(taskId, points);
      setEditingTaskId(null);
      setEditingPoints(1);
    }
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingPoints(1);
  };

  return (
    <TableContainer>
      <Table variant="simple" size={isCompact ? 'sm' : 'md'}>
        <Thead>
          <Tr>
            <Th>Task</Th>
            <Th>Type</Th>
            <Th>Category</Th>
            <Th>Points</Th>
            <Th>Status</Th>
            <Th>Assignee</Th>
            <Th>Due</Th>
            <Th textAlign="right">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {!tasks || tasks.length === 0 ? (
            <Tr>
              <Td colSpan={8} textAlign="center" py={10}>
                <Text color="gray.500">{emptyMessage}</Text>
              </Td>
            </Tr>
          ) : (
            tasks.map((task) => (
              <Tr key={task._id || task.id}>
                <Td>
                  <Text fontWeight="semibold">{task.taskName || task.client || 'N/A'}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {task.platform || task.category || ''}
                  </Text>
                </Td>
                <Td>
                  <Tag size="sm" colorScheme={task.projectType === 'internal' ? 'blue' : 'purple'}>
                    {task.projectType === 'internal' ? 'Internal' : 'External'}
                  </Tag>
                </Td>
                <Td>{task.category || task.platform || 'N/A'}</Td>
                <Td>
                  {editingTaskId === (task._id || task.id) && task.status === 'done' ? (
                    <HStack spacing={2}>
                      <NumberInput
                        size="sm"
                        value={editingPoints}
                        min={1}
                        max={100}
                        w="80px"
                        onChange={(_, valueAsNumber) => setEditingPoints(valueAsNumber || 1)}
                      >
                        <NumberInputField />
                      </NumberInput>
                      <Button size="xs" colorScheme="green" onClick={() => savePoints(task._id || task.id)}>
                        Save
                      </Button>
                      <Button size="xs" variant="ghost" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </HStack>
                  ) : (
                    <>
                      <Text fontWeight="bold">{task.featureCount || (task.status === 'done' ? 1 : 0)}</Text>
                      {task.status === 'done' && onUpdatePoints && (
                        <Button
                          size="xs"
                          variant="link"
                          colorScheme="blue"
                          mt={1}
                          onClick={() => startEditing(task._id || task.id, task.featureCount || 1)}
                        >
                          Edit
                        </Button>
                      )}
                    </>
                  )}
                </Td>
                <Td>
                  <Badge colorScheme={statusColor(task.status)}>{task.status}</Badge>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Avatar size="xs" name={(task.assignedTo && task.assignedTo[0]) || 'Staff'} />
                    <Text fontSize="sm">{(task.assignedTo && task.assignedTo.join(', ')) || 'Unassigned'}</Text>
                  </HStack>
                </Td>
                <Td>{task.endDate ? new Date(task.endDate).toLocaleDateString() : 'N/A'}</Td>
                <Td textAlign="right">
                  <Button
                    size="sm"
                    colorScheme={task.status === 'done' ? 'gray' : 'green'}
                    variant="outline"
                    rightIcon={<FiChevronRight />}
                    onClick={() => onToggleStatus(task._id || task.id, task.status)}
                  >
                    {task.status === 'done' ? 'Reopen' : 'Mark Done'}
                  </Button>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default function OverviewTab({ tasks, weeklyTarget, setWeeklyTarget, fetchTasks }) {
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    progress: 'all',
    query: '',
  });
  
  const { currentUser } = useUserStore();
  const token = currentUser?.token;

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  const handleToggleStatus = async (taskId, currentStatus) => {
    const isDone = currentStatus === 'done';
    const nextStatus = isDone ? 'ongoing' : 'done';
    let featureCount = 1;

    if (!isDone) {
      const input = prompt('Enter the number of features/points for this task:', '1');
      if (input === null) return;
      const parsed = parseInt(input);
      if (!isNaN(parsed) && parsed >= 1) {
        featureCount = parsed;
      }
    }

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/it/${taskId}`, {
        status: nextStatus,
        featureCount
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchTasks();
    } catch (err) {
      console.error('Toggle status error', err);
    }
  };

  const handleUpdatePoints = async (taskId, newPoints) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/it/${taskId}`, {
        featureCount: newPoints
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchTasks();
    } catch (err) {
      console.error('Update points error', err);
    }
  };

  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((task) => {
      const matchesType = filters.type === 'all' || task.projectType === filters.type;
      
      const categoryText = task.category || task.platform || '';
      const matchesCategory = filters.category === 'all' || categoryText.includes(filters.category);
      
      let matchesProgress = true;
      if (filters.progress === 'low') {
        matchesProgress = task.status === 'pending';
      } else if (filters.progress === 'mid') {
        matchesProgress = task.status === 'ongoing';
      } else if (filters.progress === 'complete') {
        matchesProgress = task.status === 'done';
      }

      const query = filters.query.trim().toLowerCase();
      const matchesQuery =
        query === '' ||
        (task.taskName && task.taskName.toLowerCase().includes(query)) ||
        (task.client && task.client.toLowerCase().includes(query)) ||
        (task.platform && task.platform.toLowerCase().includes(query)) ||
        (task.category && task.category.toLowerCase().includes(query)) ||
        (task.assignedTo && task.assignedTo.some(a => a.toLowerCase().includes(query)));
        
      return matchesType && matchesCategory && matchesProgress && matchesQuery;
    });
  }, [filters, tasks]);

  const doneTasks = (tasks || []).filter((task) => task.status === 'done');
  const internalPoints = doneTasks
    .filter((task) => task.projectType === 'internal')
    .reduce((sum, task) => sum + (task.featureCount || 1), 0);
  const externalPoints = doneTasks
    .filter((task) => task.projectType === 'external')
    .reduce((sum, task) => sum + (task.featureCount || 1), 0);
  const totalPoints = internalPoints + externalPoints;
  const safeTarget = Math.max(weeklyTarget, 1);
  const progressPercent = Math.min((totalPoints / safeTarget) * 100, 100);
  const targetAchieved = totalPoints >= weeklyTarget;
  const remainingGap = Math.max(weeklyTarget - totalPoints, 0);

  const summaryCards = [
    {
      label: 'Active Tasks',
      value: (tasks || []).length,
      helper: `${doneTasks.length} completed`,
      icon: FiList,
    },
    {
      label: 'Weekly Points',
      value: `${totalPoints}/${weeklyTarget}`,
      helper: targetAchieved ? 'Target achieved' : `${remainingGap} points to go`,
      icon: FiTarget,
    },
    {
      label: 'Internal Focus',
      value: internalPoints,
      helper: 'Internal contributions',
      icon: FiLayers,
    },
    {
      label: 'External Focus',
      value: externalPoints,
      helper: 'External deliveries',
      icon: FiPieChart,
    },
  ];

  return (
    <VStack spacing={8} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
        {summaryCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card key={card.label} borderRadius="2xl" boxShadow="md" bg={cardBg}>
              <CardBody>
                <HStack justify="space-between">
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">
                      {card.label}
                    </Text>
                    <Heading size="md">{card.value}</Heading>
                    <Text fontSize="xs" color="gray.500">
                      {card.helper}
                    </Text>
                  </VStack>
                  <IconButton
                    aria-label={card.label}
                    icon={<IconComponent />}
                    variant="ghost"
                    size="md"
                    isRound
                    color="blue.500"
                  />
                </HStack>
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>

      <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
        <CardBody>
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between" gap={4}>
            <Box>
              <Text fontSize="sm" color="gray.500">
                Weekly target ({weeklyTarget} points)
              </Text>
              <Heading size="lg">
                {totalPoints}/{weeklyTarget} points
              </Heading>
              <Text fontSize="sm" color={targetAchieved ? 'green.400' : 'orange.400'}>
                Target achieved: {targetAchieved ? 'Yes' : 'No'}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Remaining gap: {remainingGap}
              </Text>
              <HStack spacing={2} mt={2}>
                <NumberInput
                  size="sm"
                  w="120px"
                  min={5}
                  max={200}
                  value={weeklyTarget}
                  onChange={(_, value) => setWeeklyTarget(value || 0)}
                  clampValueOnBlur
                  borderRadius="lg"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="xs" color="gray.500">
                  Adjust weekly goal
                </Text>
              </HStack>
            </Box>
            <Progress
              value={progressPercent}
              colorScheme={targetAchieved ? 'green' : 'orange'}
              borderRadius="xl"
              size="lg"
              w={{ base: '100%', md: '40%' }}
              hasStripe={!targetAchieved}
            />
          </Flex>
        </CardBody>
      </Card>

      <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
        <CardHeader pb={2} px={6}>
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between" gap={4}>
            <Box>
              <Heading size="md">Task System</Heading>
              <Text fontSize="sm" color="gray.500">
                Filter and manage open requests with auto-calculated scores.
              </Text>
            </Box>
            <HStack spacing={2}>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={<FiSearch color="gray" />} />
                <Input
                  placeholder="Search tasks"
                  value={filters.query}
                  onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="lg"
                />
              </InputGroup>
              <Select
                value={filters.type}
                onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                variant="filled"
                w="150px"
                borderRadius="lg"
              >
                <option value="all">All Types</option>
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </Select>
              <Select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                variant="filled"
                w="180px"
                borderRadius="lg"
              >
                <option value="all">All Categories</option>
                {[...new Set([...INTERNAL_SUBTASKS, ...EXTERNAL_SUBTASKS])].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
              <Select
                value={filters.progress}
                onChange={(e) => setFilters((prev) => ({ ...prev, progress: e.target.value }))}
                variant="filled"
                w="170px"
                borderRadius="lg"
              >
                <option value="all">All Progress</option>
                <option value="low">Pending</option>
                <option value="mid">In Progress</option>
                <option value="complete">Completed</option>
              </Select>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody px={6} pt={0}>
          <TaskTable
            tasks={filteredTasks}
            onToggleStatus={handleToggleStatus}
            onUpdatePoints={handleUpdatePoints}
            emptyMessage="No tasks match the filters"
          />
        </CardBody>
      </Card>
    </VStack>
  );
}
