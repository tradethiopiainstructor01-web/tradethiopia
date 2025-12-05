import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  Stack,
  RadioGroup,
  Radio,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Heading,
  Text,
  Divider,
  HStack,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Switch,
  FormHelperText,
  Icon,
  Tooltip,
  useToast,
  Checkbox,
  CheckboxGroup,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { FiInfo, FiUpload } from 'react-icons/fi';
import axios from 'axios';
import { useUserStore } from '../../store/user'; // Import the user store

const AddTaskForm = ({ isOpen, onClose, onDone, defaultProjectType }) => {
  const [projectType, setProjectType] = useState(defaultProjectType || 'internal');
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState([]); // Changed to array for multiple selections
  const [platform, setPlatform] = useState([]); // Changed to array for multiple selections
  const [actionType, setActionType] = useState(
    (defaultProjectType || 'internal') === 'external' ? 'new' : []
  ); // Default to 'new' for external tasks, empty array for internal tasks
  const [client, setClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('pending'); // Default to 'pending'
  const [urgent, setUrgent] = useState(false);
  
  // Reset form fields when project type changes
  useEffect(() => {
    // Reset fields that are specific to project type
    setCategory([]);
    setPlatform([]);
    setActionType(projectType === 'external' ? 'new' : []); // String for external, array for internal
  }, [projectType]);

  const toast = useToast();
  const { currentUser } = useUserStore(); // Get current user from store
  const token = currentUser?.token; // Get token from current user
  const userRole = currentUser?.role; // Get user role
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const submit = async () => {
    // Check if user is authenticated
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to create tasks',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Check if user has required role
    if (userRole !== 'IT' && userRole !== 'admin') {
      toast({
        title: 'Insufficient permissions',
        description: 'You do not have permission to create tasks',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Frontend validation: all required fields must be filled
    if (projectType === 'internal') {
      if (!taskName || !taskName.trim()) {
        toast({
          title: 'Missing field',
          description: 'Task Name is required for internal tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (!platform || (Array.isArray(platform) && platform.length === 0)) {
        toast({
          title: 'Missing field',
          description: 'Please select at least one Platform for internal tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const hasActionType =
        (Array.isArray(actionType) && actionType.length > 0) ||
        (!Array.isArray(actionType) && String(actionType).trim().length > 0);

      if (!hasActionType) {
        toast({
          title: 'Missing field',
          description: 'Please select at least one Action Type for internal tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    } else {
      // external
      if (!client || !client.trim()) {
        toast({
          title: 'Missing field',
          description: 'Client Name is required for external tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (!category || (Array.isArray(category) && category.length === 0)) {
        toast({
          title: 'Missing field',
          description: 'Please select at least one Category for external tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const hasActionType =
        (Array.isArray(actionType) && actionType.length > 0) ||
        (!Array.isArray(actionType) && String(actionType).trim().length > 0);

      if (!hasActionType) {
        toast({
          title: 'Missing field',
          description: 'Please select an Action Type for external tasks.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    // Common required dates for both types
    if (!startDate || !endDate) {
      toast({
        title: 'Missing field',
        description: 'Start Date and End Date are required.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Debugging: Log the actionType value and type
    console.log('Project Type:', projectType);
    console.log('Action Type Value:', actionType);
    console.log('Action Type Type:', typeof actionType);
    console.log('Is Array:', Array.isArray(actionType));
    
    // Process actionType to ensure it's always a string
    let processedActionType;
    if (projectType === 'internal') {
      if (Array.isArray(actionType)) {
        // For internal tasks, join the array into a comma-separated string
        processedActionType = actionType.join(', ');
        console.log('Internal project - joined array to string:', processedActionType);
      } else {
        processedActionType = actionType;
        console.log('Internal project - using actionType as is:', processedActionType);
      }
    } else {
      // External project
      if (Array.isArray(actionType)) {
        // For external tasks, take the first element
        processedActionType = actionType[0] || '';
        console.log('External project - taking first element:', processedActionType);
      } else {
        processedActionType = actionType;
        console.log('External project - using actionType as is:', processedActionType);
      }
    }
    
    // Ensure it's definitely a primitive string using multiple methods
    processedActionType = String(processedActionType);
    processedActionType = '' + processedActionType;
    
    // Final verification
    console.log('Final processedActionType:', processedActionType);
    console.log('Final processedActionType type:', typeof processedActionType);
    console.log('Final processedActionType is array:', Array.isArray(processedActionType));
    
    // Create payload with processed actionType using explicit object creation
    const finalPayload = {
      taskName: projectType === 'internal' ? taskName : undefined,
      projectType: projectType,
      category: projectType === 'external' ? (Array.isArray(category) ? category.join(', ') : category) : undefined,
      platform: projectType === 'internal' ? (Array.isArray(platform) ? platform.join(', ') : platform) : undefined,
      client: projectType === 'external' ? client : undefined,
      actionType: processedActionType, // This should be a string
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: status,
      urgent: urgent,
    };
    
    console.log('Final Payload:', finalPayload);
    console.log('Final Action Type in Payload:', finalPayload.actionType);
    console.log('Final Action Type Type:', typeof finalPayload.actionType);
    console.log('Final Action Type Is Array:', Array.isArray(finalPayload.actionType));
    
    // Create payload to send using explicit object creation with no references
    const payloadToSend = {
      taskName: projectType === 'internal' ? taskName : undefined,
      projectType: projectType,
      category: projectType === 'external' ? (Array.isArray(category) ? category.join(', ') : category) : undefined,
      platform: projectType === 'internal' ? (Array.isArray(platform) ? platform.join(', ') : platform) : undefined,
      client: projectType === 'external' ? client : undefined,
      actionType: processedActionType, // This should be a string
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: status,
      urgent: urgent,
    };
    
    // Final verification before sending
    console.log('Payload to send:', payloadToSend);
    console.log('Action Type to send:', payloadToSend.actionType);
    console.log('Action Type to send type:', typeof payloadToSend.actionType);
    console.log('Action Type to send is array:', Array.isArray(payloadToSend.actionType));
    
    // Additional verification
    console.log('Stringified payload:', JSON.stringify(payloadToSend));
    console.log('Stringified actionType:', JSON.stringify(payloadToSend.actionType));
    
    // Force actionType to be a string one more time
    payloadToSend.actionType = String(payloadToSend.actionType);
    console.log('After final String() conversion:', payloadToSend.actionType);
    console.log('Type after final conversion:', typeof payloadToSend.actionType);
    
    // Final final verification
    console.log('BEFORE SENDING - Final payload:', JSON.parse(JSON.stringify(payloadToSend)));
    console.log('BEFORE SENDING - Final actionType:', payloadToSend.actionType);
    console.log('BEFORE SENDING - Final actionType type:', typeof payloadToSend.actionType);
    console.log('BEFORE SENDING - Final actionType is array:', Array.isArray(payloadToSend.actionType));
    
    try {
      console.log('Sending axios request with:', {
        url: `${import.meta.env.VITE_API_URL}/api/it`,
        data: payloadToSend,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      await axios.post(`${import.meta.env.VITE_API_URL}/api/it`, payloadToSend, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      if (onDone) onDone();
      onClose();
      
      // Reset form
      setTaskName('');
      setCategory([]);
      setPlatform([]);
      setActionType(projectType === 'external' ? 'new' : []); // Reset to default values based on project type
      setClient('');
      setStartDate('');
      setEndDate('');
      setStatus('pending');
      setUrgent(false);

      toast({
        title: 'Task created',
        description: 'The task has been successfully created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error creating task',
        description: err.response?.data?.message || 'Failed to create the task',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // External task category options
  const externalCategoryOptions = [
    'website',
    'company profile',
    'logo',
    'broacher',
    'banner',
    'flayer',
    'roller up',
    'business card',
    'letterheads'
  ];

  // Internal task platform options
  const internalPlatformOptions = [
    'Tradeethiopian.com',
    'Tradethiopia.com',
    'Tesbinn.com',
    'Tradextv.com',
    'Trainings',
    'Documentation',
    'Meetings',
    'Maintenance'
  ];

  // Action type options based on project type
  const getActionTypeOptions = () => {
    if (projectType === 'external') {
      return [
        { value: 'new', label: 'NEW' },
        { value: 'comment', label: 'Comment' },
        { value: 'update', label: 'Update/Renewal' }
      ];
    } else {
      return [
        { value: 'Function', label: 'Function' },
        { value: 'Features', label: 'Features' },
        { value: 'update', label: 'Update' },
        { value: 'troubleshoot', label: 'Troubleshoot' },
        { value: 'renewal', label: 'Renewal' },
        { value: 'AI/ML', label: 'AI/ML' },
        { value: 'New', label: 'New' }
      ];
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bg} borderRadius="2xl" maxW={{ base: '95%', md: '600px' }}>
        <ModalHeader pb={2}>
          <VStack align="stretch" spacing={1}>
            <Heading size="lg" color={useColorModeValue('gray.800', 'white')}>
              Create New Task
            </Heading>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
              Fill in the details below to create a new IT task
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton 
          borderRadius="full" 
          _focus={{ boxShadow: 'none' }}
        />
        
        <ModalBody py={2}>
          <VStack spacing={6} align="stretch">
            {/* Project Type */}
            <Card variant="outline" borderRadius="xl" borderColor={borderColor}>
              <CardHeader pb={2}>
                <HStack spacing={2}>
                  <FormLabel mb={0} fontWeight="semibold">Project Type</FormLabel>
                  <Tooltip label="Select whether this is an internal or external project" hasArrow>
                    <Icon as={FiInfo} color={useColorModeValue('gray.500', 'gray.400')} boxSize={4} />
                  </Tooltip>
                </HStack>
              </CardHeader>
              <CardBody pt={2}>
                <RadioGroup onChange={setProjectType} value={projectType}>
                  <Stack direction="row" spacing={6}>
                    <Radio value="internal" colorScheme="blue">Internal</Radio>
                    <Radio value="external" colorScheme="purple">External</Radio>
                  </Stack>
                </RadioGroup>
              </CardBody>
            </Card>

            {/* Task Details */}
            <Card variant="outline" borderRadius="xl" borderColor={borderColor}>
              <CardHeader pb={2}>
                <FormLabel mb={0} fontWeight="semibold">Task Details</FormLabel>
              </CardHeader>
              <CardBody pt={2}>
                <Stack spacing={4}>
                  {projectType === 'internal' && (
                    <FormControl isRequired>
                      <FormLabel>Task Name</FormLabel>
                      <Input 
                        value={taskName} 
                        onChange={e => setTaskName(e.target.value)} 
                        placeholder="Enter task name"
                        borderRadius="lg"
                      />
                    </FormControl>
                  )}

                  {projectType === 'external' ? (
                    <>
                      <FormControl isRequired>
                        <FormLabel>Client Name</FormLabel>
                        <Input 
                          value={client} 
                          onChange={e => setClient(e.target.value)} 
                          placeholder="Enter client name"
                          borderRadius="lg"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Category</FormLabel>
                        <CheckboxGroup 
                          value={category} 
                          onChange={setCategory}
                        >
                          <Wrap spacing={2}>
                            {externalCategoryOptions.map((option) => (
                              <WrapItem key={option}>
                                <Checkbox value={option} borderRadius="lg" borderColor={borderColor}>
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </Checkbox>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </CheckboxGroup>
                      </FormControl>
                    </>
                  ) : (
                    <>
                      <FormControl isRequired>
                        <FormLabel>Platform</FormLabel>
                        <CheckboxGroup 
                          value={platform} 
                          onChange={setPlatform}
                        >
                          <Wrap spacing={2}>
                            {internalPlatformOptions.map((option) => (
                              <WrapItem key={option}>
                                <Checkbox value={option} borderRadius="lg" borderColor={borderColor}>
                                  {option}
                                </Checkbox>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </CheckboxGroup>
                      </FormControl>
                    </>
                  )}

                  <FormControl isRequired>
                    <FormLabel>Action Type</FormLabel>
                    {projectType === 'external' ? (
                      <Select 
                        value={Array.isArray(actionType) ? actionType[0] || '' : actionType} 
                        onChange={e => setActionType(e.target.value)}
                        borderRadius="lg"
                      >
                        {getActionTypeOptions().map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Select>
                    ) : (
                      <CheckboxGroup 
                        value={actionType} 
                        onChange={setActionType}
                      >
                        <Wrap spacing={2}>
                          {getActionTypeOptions().map((option) => (
                            <WrapItem key={option.value}>
                              <Checkbox value={option.value} borderRadius="lg" borderColor={borderColor}>
                                {option.label}
                              </Checkbox>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </CheckboxGroup>
                    )}
                  </FormControl>
                </Stack>
              </CardBody>
            </Card>

            {/* Timeline & Status */}
            <Card variant="outline" borderRadius="xl" borderColor={borderColor}>
              <CardHeader pb={2}>
                <FormLabel mb={0} fontWeight="semibold">Timeline & Status</FormLabel>
              </CardHeader>
              <CardBody pt={2}>
                <Stack spacing={4}>
                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>Start Date</FormLabel>
                      <Input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)} 
                        borderRadius="lg"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>End Date</FormLabel>
                      <Input 
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                        borderRadius="lg"
                      />
                    </FormControl>
                  </HStack>
                  
                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      value={status} 
                      onChange={e => setStatus(e.target.value)}
                      borderRadius="lg"
                    >
                      <option value="pending">Pending</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="done">Done</option>
                    </Select>
                  </FormControl>
                  
                  <HStack justify="space-between">
                    <FormLabel htmlFor="urgent-switch" mb={0}>
                      Mark as Urgent
                    </FormLabel>
                    <Switch 
                      id="urgent-switch" 
                      isChecked={urgent} 
                      onChange={e => setUrgent(e.target.checked)} 
                      colorScheme="red"
                    />
                  </HStack>
                </Stack>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>

        <ModalFooter pt={4} pb={6}>
          <HStack spacing={3}>
            <Button 
              variant="ghost" 
              onClick={onClose}
              borderRadius="lg"
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={submit} 
              borderRadius="lg"
              px={8}
            >
              Create Task
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddTaskForm;
