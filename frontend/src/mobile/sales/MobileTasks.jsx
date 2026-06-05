import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiPlus,
  FiSearch,
  FiTrash2
} from 'react-icons/fi';
import { createTask, deleteTask, getMyTasks, getTaskStats, updateTask } from '../../services/taskService';

const emptyTaskForm = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'Medium',
  status: 'Pending'
};

const statusOptions = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const dateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const getTaskId = (task) => task?._id || task?.id;

const getStatusColor = (status = '') => {
  switch (status) {
    case 'Completed':
      return 'green';
    case 'In Progress':
      return 'blue';
    case 'Cancelled':
      return 'red';
    default:
      return 'orange';
  }
};

const getPriorityColor = (priority = '') => {
  switch (priority) {
    case 'Urgent':
      return 'red';
    case 'High':
      return 'pink';
    case 'Low':
      return 'green';
    default:
      return 'orange';
  }
};

const isOverdue = (task) => {
  if (!task?.dueDate || task.status === 'Completed') return false;
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const isDueToday = (task) => {
  if (!task?.dueDate) return false;
  const due = new Date(task.dueDate);
  const today = new Date();
  return due.toDateString() === today.toDateString();
};

const normalizeTaskForm = (task = {}) => ({
  title: task.title || '',
  description: task.description || '',
  dueDate: dateInputValue(task.dueDate),
  priority: task.priority || 'Medium',
  status: task.status || 'Pending'
});

const TaskStatCard = ({ icon, label, value, tone = 'teal' }) => (
  <Box bg="white" borderRadius="14px" p={3} borderWidth="1px" borderColor="#e5edf3" boxShadow="0 8px 22px rgba(15, 23, 42, 0.06)">
    <HStack spacing={3}>
      <Center w="34px" h="34px" borderRadius="10px" bg={`${tone}.50`} color={`${tone}.500`}>
        <Icon as={icon} boxSize={4} />
      </Center>
      <Box minW={0}>
        <Text fontSize="18px" color="#172033" fontWeight="900">{value || 0}</Text>
        <Text fontSize="10px" color="#64748b" fontWeight="800" noOfLines={1}>{label}</Text>
      </Box>
    </HStack>
  </Box>
);

const MobileTaskCard = ({ task, onOpen, onStatus }) => {
  const overdue = isOverdue(task);
  const dueToday = isDueToday(task);

  return (
    <Box bg="white" borderRadius="16px" p={4} borderWidth="1px" borderColor={overdue ? '#fecaca' : '#e5edf3'} boxShadow="0 10px 26px rgba(15, 23, 42, 0.07)">
      <Flex align="flex-start" justify="space-between" gap={3}>
        <Box minW={0} flex="1" as="button" type="button" textAlign="left" onClick={() => onOpen(task)}>
          <Text fontSize="15px" color="#172033" fontWeight="900" noOfLines={2}>{task.title}</Text>
          <Text fontSize="12px" color="#64748b" fontWeight="700" mt={1} noOfLines={2}>{task.description}</Text>
        </Box>
        <Badge colorScheme={getPriorityColor(task.priority)} borderRadius="md" px={2} py={1} flexShrink={0}>
          {task.priority}
        </Badge>
      </Flex>

      <HStack mt={4} spacing={2} flexWrap="wrap">
        <Badge colorScheme={getStatusColor(task.status)} borderRadius="md" px={2} py={1}>{task.status}</Badge>
        {overdue && <Badge colorScheme="red" borderRadius="md" px={2} py={1}>Overdue</Badge>}
        {dueToday && !overdue && <Badge colorScheme="teal" borderRadius="md" px={2} py={1}>Today</Badge>}
      </HStack>

      <Flex align="center" justify="space-between" mt={4}>
        <HStack color="#64748b" spacing={1.5}>
          <Icon as={FiCalendar} boxSize={3.5} />
          <Text fontSize="12px" fontWeight="800">{formatDate(task.dueDate)}</Text>
        </HStack>
        <HStack spacing={2}>
          {task.status !== 'Completed' && (
            <IconButton
              aria-label="Mark completed"
              icon={<FiCheckCircle />}
              size="sm"
              borderRadius="10px"
              colorScheme="teal"
              variant="outline"
              onClick={() => onStatus(task, 'Completed')}
            />
          )}
          <IconButton
            aria-label="Edit task"
            icon={<FiEdit3 />}
            size="sm"
            borderRadius="10px"
            variant="outline"
            onClick={() => onOpen(task, true)}
          />
        </HStack>
      </Flex>
    </Box>
  );
};

const MobileTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const taskDisclosure = useDisclosure();

  const loadTasks = async () => {
    try {
      setLoading(true);
      const [taskData, statData] = await Promise.all([
        getMyTasks(),
        getTaskStats()
      ]);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setStats(statData || {});
    } catch (error) {
      toast({
        title: 'Could not load tasks',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3200
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = !query || [task.title, task.description, task.priority, task.status]
        .some((value) => String(value || '').toLowerCase().includes(query));

      const matchesFilter = (() => {
        if (filter === 'all') return true;
        if (filter === 'today') return isDueToday(task);
        if (filter === 'overdue') return isOverdue(task);
        if (filter === 'completed') return task.status === 'Completed';
        return task.status !== 'Completed' && task.status !== 'Cancelled';
      })();

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, filter]);

  const openTask = (task = null, edit = false) => {
    setSelectedTask(task);
    setTaskForm(task ? normalizeTaskForm(task) : { ...emptyTaskForm, dueDate: todayInputValue() });
    taskDisclosure.onOpen();
    if (edit) {
      setTimeout(() => {
        const input = document.querySelector('[name="title"]');
        input?.focus?.();
      }, 100);
    }
  };

  const closeTask = () => {
    if (saving || deleting) return;
    taskDisclosure.onClose();
    setSelectedTask(null);
    setTaskForm(emptyTaskForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateLocalTask = (updatedTask) => {
    setTasks((prev) => prev.map((task) => getTaskId(task) === getTaskId(updatedTask) ? updatedTask : task));
  };

  const refreshStats = async () => {
    try {
      const statData = await getTaskStats();
      setStats(statData || {});
    } catch {
      // Non-blocking; task list already changed.
    }
  };

  const handleStatusChange = async (task, status) => {
    try {
      const updated = await updateTask(getTaskId(task), { status });
      updateLocalTask(updated);
      await refreshStats();
      toast({ title: 'Task updated', status: 'success', duration: 2200 });
    } catch (error) {
      toast({
        title: 'Could not update task',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3200
      });
    }
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();
    const userId = localStorage.getItem('userId');
    setSaving(true);
    try {
      if (selectedTask) {
        const updated = await updateTask(getTaskId(selectedTask), taskForm);
        updateLocalTask(updated);
        toast({ title: 'Task saved', status: 'success', duration: 2200 });
      } else {
        if (!userId) throw new Error('Could not determine current user');
        const created = await createTask({
          ...taskForm,
          assignedTo: userId
        });
        setTasks((prev) => [created, ...prev]);
        toast({ title: 'Task created', status: 'success', duration: 2200 });
      }
      await refreshStats();
      closeTask();
    } catch (error) {
      toast({
        title: selectedTask ? 'Could not save task' : 'Could not create task',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3600
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setDeleting(true);
    try {
      await deleteTask(getTaskId(selectedTask));
      setTasks((prev) => prev.filter((task) => getTaskId(task) !== getTaskId(selectedTask)));
      await refreshStats();
      toast({ title: 'Task deleted', status: 'success', duration: 2200 });
      closeTask();
    } catch (error) {
      toast({
        title: 'Could not delete task',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3200
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box position="relative">
      <SimpleGrid columns={2} spacing={3} mb={4}>
        <TaskStatCard icon={FiClock} label="Total" value={stats.totalTasks} tone="teal" />
        <TaskStatCard icon={FiCheckCircle} label="Completed" value={stats.completedTasks} tone="green" />
        <TaskStatCard icon={FiCalendar} label="Pending" value={stats.pendingTasks} tone="orange" />
        <TaskStatCard icon={FiAlertTriangle} label="Overdue" value={stats.overdueTasks} tone="red" />
      </SimpleGrid>

      <InputGroup mb={3}>
        <InputLeftElement pointerEvents="none">
          <Icon as={FiSearch} color="#8b98a8" />
        </InputLeftElement>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          bg="white"
          borderColor="#e2e8f0"
          borderRadius="12px"
          placeholder="Search tasks..."
          fontSize="14px"
          h="44px"
        />
      </InputGroup>

      <HStack spacing={2} overflowX="auto" pb={2} mb={3}>
        {[
          ['active', 'Active'],
          ['today', 'Today'],
          ['overdue', 'Overdue'],
          ['completed', 'Completed'],
          ['all', 'All']
        ].map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            flexShrink={0}
            borderRadius="10px"
            colorScheme={filter === value ? 'teal' : 'gray'}
            variant={filter === value ? 'solid' : 'outline'}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </HStack>

      {loading ? (
        <Center py={16}>
          <Spinner color="teal.500" />
        </Center>
      ) : (
        <VStack align="stretch" spacing={3}>
          <Flex align="center" justify="space-between">
            <Text fontSize="13px" color="#253244" fontWeight="900">
              {filteredTasks.length} tasks
            </Text>
            <Button size="sm" leftIcon={<FiPlus />} borderRadius="10px" colorScheme="teal" onClick={() => openTask()}>
              New
            </Button>
          </Flex>

          {filteredTasks.length === 0 ? (
            <Box bg="white" borderRadius="16px" p={6} borderWidth="1px" borderColor="#e5edf3" textAlign="center">
              <Center w="52px" h="52px" bg="#e8fbf7" color="#13a6a3" borderRadius="full" mx="auto" mb={3}>
                <Icon as={FiCheckCircle} boxSize={6} />
              </Center>
              <Text color="#172033" fontSize="16px" fontWeight="900">No tasks here</Text>
              <Text color="#64748b" fontSize="12px" fontWeight="700" mt={1}>
                Try another filter or create a new task.
              </Text>
            </Box>
          ) : (
            filteredTasks.map((task) => (
              <MobileTaskCard
                key={getTaskId(task)}
                task={task}
                onOpen={openTask}
                onStatus={handleStatusChange}
              />
            ))
          )}
        </VStack>
      )}

      <IconButton
        aria-label="Create task"
        icon={<FiPlus />}
        position="fixed"
        right={5}
        bottom="86px"
        size="lg"
        borderRadius="full"
        bg="#13a6a3"
        color="white"
        boxShadow="0 12px 28px rgba(19, 166, 163, 0.35)"
        _hover={{ bg: '#0f8f8c' }}
        onClick={() => openTask()}
      />

      <Modal isOpen={taskDisclosure.isOpen} onClose={closeTask} size="full" motionPreset="slideInBottom">
        <ModalOverlay bg="rgba(15, 23, 42, 0.42)" />
        <ModalContent as="form" onSubmit={handleSaveTask} mt="auto" mb={0} mx={0} maxH="90vh" borderTopRadius="26px" borderBottomRadius={0} bg="#f8fafc" overflow="hidden">
          <ModalHeader px={5} pt={5} pb={2}>
            <Flex align="center" justify="space-between" gap={3}>
              <HStack minW={0} spacing={3}>
                <IconButton aria-label="Close task" icon={<FiArrowLeft />} variant="ghost" color="#13a6a3" fontSize="22px" onClick={closeTask} />
                <Box minW={0}>
                  <Text fontSize="20px" color="#172033" fontWeight="900">{selectedTask ? 'Task Details' : 'New Task'}</Text>
                  <Text fontSize="12px" color="#64748b" fontWeight="700" noOfLines={1}>
                    {selectedTask ? `Due ${formatDate(selectedTask.dueDate)}` : 'Create a task for your sales work.'}
                  </Text>
                </Box>
              </HStack>
              {selectedTask && (
                <IconButton
                  aria-label="Delete task"
                  icon={<FiTrash2 />}
                  colorScheme="red"
                  variant="ghost"
                  isLoading={deleting}
                  onClick={handleDeleteTask}
                />
              )}
            </Flex>
          </ModalHeader>

          <ModalBody px={5} py={4} overflowY="auto">
            <VStack align="stretch" spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="12px" color="#334155" fontWeight="900">Title</FormLabel>
                <Input name="title" value={taskForm.title} onChange={handleFormChange} bg="white" h="46px" borderRadius="12px" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="12px" color="#334155" fontWeight="900">Description</FormLabel>
                <Textarea name="description" value={taskForm.description} onChange={handleFormChange} bg="white" borderRadius="12px" rows={5} />
              </FormControl>
              <SimpleGrid columns={2} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="900">Due date</FormLabel>
                  <Input name="dueDate" type="date" min={todayInputValue()} value={taskForm.dueDate} onChange={handleFormChange} bg="white" h="44px" borderRadius="12px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="12px" color="#334155" fontWeight="900">Priority</FormLabel>
                  <Select name="priority" value={taskForm.priority} onChange={handleFormChange} bg="white" h="44px" borderRadius="12px">
                    {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel fontSize="12px" color="#334155" fontWeight="900">Status</FormLabel>
                <Select name="status" value={taskForm.status} onChange={handleFormChange} bg="white" h="44px" borderRadius="12px">
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter px={5} py={4} gap={3} bg="white" borderTopWidth="1px" borderTopColor="#e2e8f0">
            <Button flex={1} h="46px" borderRadius="12px" variant="ghost" onClick={closeTask} isDisabled={saving}>
              Cancel
            </Button>
            <Button flex={1} h="46px" borderRadius="12px" bg="#13a6a3" color="white" _hover={{ bg: '#0f8f8c' }} type="submit" isLoading={saving}>
              {selectedTask ? 'Save' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MobileTasks;
