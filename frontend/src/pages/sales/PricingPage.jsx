import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Grid,
  GridItem,
  HStack,
  VStack,
  Icon,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  Select,
  Textarea,
  FormLabel,
  FormControl,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tag,
  TagLabel,
  IconButton,
  Spinner
} from '@chakra-ui/react';
import { 
  FaDollarSign, 
  FaGraduationCap, 
  FaBox, 
  FaPlus, 
  FaEdit, 
  FaTrash,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import axios from 'axios';
import FinanceLayout from './FinanceLayout';
import { fetchCourses, createCourse, updateCourse, deleteCourse } from '../../services/api';

const PricingPage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const toast = useToast();

  // State for training courses
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState({
    name: '',
    price: '',
    category: ''
  });
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // State for packages
  const [packages, setPackages] = useState([]);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    price: '',
    department: '',
    services: []
  });
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [serviceInput, setServiceInput] = useState('');
  const [packagesLoading, setPackagesLoading] = useState(false);

  // Modal states
  const { isOpen: isCourseModalOpen, onOpen: onCourseModalOpen, onClose: onCourseModalClose } = useDisclosure();
  const { isOpen: isPackageModalOpen, onOpen: onPackageModalOpen, onClose: onPackageModalClose } = useDisclosure();

  // Mock data for departments
  const departments = ['Sales', 'Marketing', 'IT', 'HR', 'Finance', 'Operations'];

  // Mock data for course categories
  const courseCategories = ['Business', 'Technology', 'Marketing', 'Leadership', 'Language', 'Finance'];

  // Load initial data
  useEffect(() => {
    loadCourses();
    loadPackages();
  }, []);

  const loadCourses = async () => {
    setCoursesLoading(true);
    try {
      const data = await fetchCourses();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast({
        title: 'Error loading courses',
        description: error.message || 'Failed to load courses',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadPackages = async () => {
    setPackagesLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/packages`);
      setPackages(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load packages:', error);
      toast({
        title: 'Error loading packages',
        description: error.message || 'Failed to load packages',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setPackagesLoading(false);
    }
  };

  // Course form handlers
  const handleCourseInputChange = (e) => {
    const { name, value } = e.target;
    setCourseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCourse = async () => {
    if (!courseForm.name || !courseForm.price) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      const courseData = {
        ...courseForm,
        price: parseFloat(courseForm.price)
      };

      if (editingCourseId) {
        // Update existing course
        const updatedCourse = await updateCourse(editingCourseId, courseData);
        setCourses(prev => prev.map(course => course._id === editingCourseId ? updatedCourse : course));
        toast({ title: 'Course updated', status: 'success' });
      } else {
        // Create new course
        const newCourse = await createCourse(courseData);
        setCourses(prev => [...prev, newCourse]);
        toast({ title: 'Course added', status: 'success' });
      }

      resetCourseForm();
      onCourseModalClose();
    } catch (error) {
      console.error('Failed to save course:', error);
      toast({
        title: 'Error saving course',
        description: error.message || 'Failed to save course',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleEditCourse = (course) => {
    setCourseForm({
      name: course.name,
      price: course.price.toString(),
      category: course.category || ''
    });
    setEditingCourseId(course._id);
    onCourseModalOpen();
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      await deleteCourse(id);
      setCourses(prev => prev.filter(course => course._id !== id));
      toast({ title: 'Course deleted', status: 'info' });
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast({
        title: 'Error deleting course',
        description: error.message || 'Failed to delete course',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const resetCourseForm = () => {
    setCourseForm({
      name: '',
      price: '',
      category: ''
    });
    setEditingCourseId(null);
  };

  // Package form handlers
  const handlePackageInputChange = (e) => {
    const { name, value } = e.target;
    setPackageForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddService = () => {
    if (serviceInput.trim() && !packageForm.services.includes(serviceInput.trim())) {
      setPackageForm(prev => ({
        ...prev,
        services: [...prev.services, serviceInput.trim()]
      }));
      setServiceInput('');
    }
  };

  const handleRemoveService = (service) => {
    setPackageForm(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service)
    }));
  };

  const handleAddPackage = async () => {
    if (!packageForm.name || !packageForm.price || !packageForm.department) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      const packageData = {
        ...packageForm,
        price: parseFloat(packageForm.price)
      };

      // For now, we'll use the existing package API
      // In a real implementation, you might want to create a separate API endpoint
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/packages`, packageData);
      
      if (editingPackageId) {
        setPackages(prev => prev.map(pkg => pkg._id === editingPackageId ? response.data : pkg));
        toast({ title: 'Package updated', status: 'success' });
      } else {
        setPackages(prev => [...prev, response.data]);
        toast({ title: 'Package added', status: 'success' });
      }

      resetPackageForm();
      onPackageModalClose();
    } catch (error) {
      console.error('Failed to save package:', error);
      toast({
        title: 'Error saving package',
        description: error.message || 'Failed to save package',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleEditPackage = (pkg) => {
    setPackageForm({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price.toString(),
      department: pkg.department || '',
      services: pkg.services || []
    });
    setEditingPackageId(pkg._id);
    onPackageModalOpen();
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) {
      return;
    }

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/packages/${id}`);
      setPackages(prev => prev.filter(pkg => pkg._id !== id));
      toast({ title: 'Package deleted', status: 'info' });
    } catch (error) {
      console.error('Failed to delete package:', error);
      toast({
        title: 'Error deleting package',
        description: error.message || 'Failed to delete package',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const resetPackageForm = () => {
    setPackageForm({
      name: '',
      description: '',
      price: '',
      department: '',
      services: []
    });
    setEditingPackageId(null);
    setServiceInput('');
  };

  return (
    <FinanceLayout>
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading as="h1" size="xl" color={headerColor}>
            Pricing Management
          </Heading>
          <HStack spacing={3}>
            <Button colorScheme="teal">Export Pricing Data</Button>
          </HStack>
        </Flex>

      {/* Pricing Overview Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card bg={cardBg} boxShadow="md">
          <CardBody>
            <Stat>
              <StatLabel>Total Courses</StatLabel>
              <StatNumber>{courses.length}</StatNumber>
              <StatHelpText>Training programs</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md">
          <CardBody>
            <Stat>
              <StatLabel>Total Packages</StatLabel>
              <StatNumber>{packages.length}</StatNumber>
              <StatHelpText>Service bundles</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md">
          <CardBody>
            <Stat>
              <StatLabel>Avg Course Price</StatLabel>
              <StatNumber>
                ETB {courses.length > 0 
                  ? (courses.reduce((sum, course) => sum + course.price, 0) / courses.length).toFixed(0)
                  : 0}
              </StatNumber>
              <StatHelpText>Per course</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md">
          <CardBody>
            <Stat>
              <StatLabel>Avg Package Price</StatLabel>
              <StatNumber>
                ETB {packages.length > 0 
                  ? (packages.reduce((sum, pkg) => sum + pkg.price, 0) / packages.length).toFixed(0)
                  : 0}
              </StatNumber>
              <StatHelpText>Per package</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Tabs variant="enclosed" colorScheme="teal">
        <TabList mb={4}>
          <Tab>Training Courses</Tab>
          <Tab>Service Packages</Tab>
        </TabList>

        <TabPanels>
          {/* Training Courses Tab */}
          <TabPanel>
            <Card bg={cardBg} boxShadow="md" mb={6}>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading as="h2" size="md">Training Courses</Heading>
                  <Button 
                    leftIcon={<FaPlus />} 
                    colorScheme="teal" 
                    onClick={() => {
                      resetCourseForm();
                      onCourseModalOpen();
                    }}
                  >
                    Add Course
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody>
                {coursesLoading ? (
                  <Flex justify="center" py={8}>
                    <Spinner size="lg" />
                  </Flex>
                ) : courses.length > 0 ? (
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Course Name</Th>
                          <Th>Category</Th>
                          <Th isNumeric>Price (ETB)</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {courses.map((course) => (
                          <Tr key={course._id}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold">{course.name}</Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Badge colorScheme="teal">{course.category}</Badge>
                            </Td>
                            <Td isNumeric>{course.price.toLocaleString()}</Td>
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  aria-label="Edit course"
                                  icon={<FaEdit />}
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handleEditCourse(course)}
                                />
                                <IconButton
                                  aria-label="Delete course"
                                  icon={<FaTrash />}
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleDeleteCourse(course._id)}
                                />
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Text textAlign="center" py={8} color="gray.500">
                    No courses found. Add your first course to get started.
                  </Text>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Service Packages Tab */}
          <TabPanel>
            <Card bg={cardBg} boxShadow="md" mb={6}>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading as="h2" size="md">Service Packages</Heading>
                  <Button 
                    leftIcon={<FaPlus />} 
                    colorScheme="teal" 
                    onClick={() => {
                      resetPackageForm();
                      onPackageModalOpen();
                    }}
                  >
                    Add Package
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody>
                {packagesLoading ? (
                  <Flex justify="center" py={8}>
                    <Spinner size="lg" />
                  </Flex>
                ) : packages.length > 0 ? (
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Package Name</Th>
                          <Th>Department</Th>
                          <Th>Services</Th>
                          <Th isNumeric>Price (ETB)</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {packages.map((pkg) => (
                          <Tr key={pkg._id}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold">{pkg.name}</Text>
                                <Text fontSize="sm" color="gray.500">{pkg.description}</Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Badge colorScheme="purple">{pkg.department}</Badge>
                            </Td>
                            <Td>
                              <HStack spacing={1} wrap="wrap">
                                {pkg.services && pkg.services.map((service, idx) => (
                                  <Tag key={idx} size="sm" colorScheme="blue">
                                    <TagLabel>{service}</TagLabel>
                                  </Tag>
                                ))}
                              </HStack>
                            </Td>
                            <Td isNumeric>{pkg.price.toLocaleString()}</Td>
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  aria-label="Edit package"
                                  icon={<FaEdit />}
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handleEditPackage(pkg)}
                                />
                                <IconButton
                                  aria-label="Delete package"
                                  icon={<FaTrash />}
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleDeletePackage(pkg._id)}
                                />
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Text textAlign="center" py={8} color="gray.500">
                    No packages found. Add your first package to get started.
                  </Text>
                )}
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Course Modal */}
      <Modal isOpen={isCourseModalOpen} onClose={() => {
        onCourseModalClose();
        resetCourseForm();
      }} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingCourseId ? 'Edit Training Course' : 'Add New Training Course'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Course Name</FormLabel>
                <Input
                  name="name"
                  value={courseForm.name}
                  onChange={handleCourseInputChange}
                  placeholder="Enter course name"
                />
              </FormControl>
              
              <HStack width="100%" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Price (ETB)</FormLabel>
                  <Input
                    name="price"
                    type="number"
                    value={courseForm.price}
                    onChange={handleCourseInputChange}
                    placeholder="Enter price"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Category</FormLabel>
                  <Select
                    name="category"
                    value={courseForm.category}
                    onChange={handleCourseInputChange}
                    placeholder="Select category"
                  >
                    {courseCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => {
              onCourseModalClose();
              resetCourseForm();
            }}>
              Cancel
            </Button>
            <Button 
              colorScheme="teal" 
              onClick={handleAddCourse}
            >
              {editingCourseId ? 'Update Course' : 'Add Course'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Package Modal */}
      <Modal isOpen={isPackageModalOpen} onClose={() => {
        onPackageModalClose();
        resetPackageForm();
      }} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingPackageId ? 'Edit Service Package' : 'Add New Service Package'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Package Name</FormLabel>
                <Input
                  name="name"
                  value={packageForm.name}
                  onChange={handlePackageInputChange}
                  placeholder="Enter package name"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={packageForm.description}
                  onChange={handlePackageInputChange}
                  placeholder="Enter package description"
                />
              </FormControl>
              
              <HStack width="100%" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Price (ETB)</FormLabel>
                  <Input
                    name="price"
                    type="number"
                    value={packageForm.price}
                    onChange={handlePackageInputChange}
                    placeholder="Enter price"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Department</FormLabel>
                  <Select
                    name="department"
                    value={packageForm.department}
                    onChange={handlePackageInputChange}
                    placeholder="Select department"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>Services</FormLabel>
                <HStack>
                  <Input
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    placeholder="Enter service name"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddService();
                      }
                    }}
                  />
                  <Button onClick={handleAddService} colorScheme="teal">Add</Button>
                </HStack>
                <HStack mt={2} wrap="wrap">
                  {packageForm.services.map((service, idx) => (
                    <Tag key={idx} size="md" variant="solid" colorScheme="teal">
                      <TagLabel>{service}</TagLabel>
                      <IconButton
                        as="span"
                        ml={2}
                        size="xs"
                        aria-label="Remove service"
                        icon={<FaTimes />}
                        onClick={() => handleRemoveService(service)}
                      />
                    </Tag>
                  ))}
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => {
              onPackageModalClose();
              resetPackageForm();
            }}>
              Cancel
            </Button>
            <Button 
              colorScheme="teal" 
              onClick={handleAddPackage}
            >
              {editingPackageId ? 'Update Package' : 'Add Package'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
    </FinanceLayout>
  );
};

export default PricingPage;