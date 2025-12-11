import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Card,
  CardBody,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  Button,
  Select,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Badge,
  IconButton,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { AddIcon, DownloadIcon, ViewIcon, LockIcon, CheckIcon } from '@chakra-ui/icons';
import Layout from '../Layout';
import { fetchPayrollData, calculatePayroll, submitHrAdjustment, submitFinanceAdjustment, approvePayroll, lockPayroll } from '../../services/payrollService';
import useAgentCommission from '../../hooks/useAgentCommission';
const PayrollPage = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isHrModalOpen, setIsHrModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [hrFormData, setHrFormData] = useState({
    userId: '',
    date: '',
    overtimeHours: 0,
    lateMinutes: 0,
    absence: false
  });
  const [financeFormData, setFinanceFormData] = useState({
    userId: '',
    financeAllowances: 0,
    financeDeductions: 0,
    hrAllowances: 0
  });
  
  const toast = useToast();
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headerBg = useColorModeValue('teal.600', 'teal.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tableBg = useColorModeValue('white', 'gray.800');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch payroll data
  const fetchPayrollDataHandler = async () => {
    try {
      setLoading(true);
      const data = await fetchPayrollData(selectedMonth, {
        year: selectedYear,
        department: selectedDepartment,
        role: selectedRole
      });
      setPayrollData(data);
      setError('');
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      setError('Failed to fetch payroll data');
      toast({
        title: 'Error',
        description: 'Failed to fetch payroll data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch departments
  const fetchDepartments = async () => {
    try {
      // This would typically come from an API endpoint
      setDepartments(['sales', 'HR', 'finance', 'IT', 'admin']);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };
  
  // Calculate payroll for all employees
  const calculatePayrollHandler = async () => {
    try {
      setLoading(true);
      const data = await calculatePayroll({
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error calculating payroll:', err);
      toast({
        title: 'Error',
        description: 'Failed to calculate payroll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Submit HR adjustment
  const submitHrAdjustmentHandler = async () => {
    try {
      const data = await submitHrAdjustment({
        ...hrFormData,
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsHrModalOpen(false);
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error submitting HR adjustment:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit HR adjustment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Submit Finance adjustment
  const submitFinanceAdjustmentHandler = async () => {
    try {
      const data = await submitFinanceAdjustment({
        ...financeFormData,
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsFinanceModalOpen(false);
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error submitting Finance adjustment:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit Finance adjustment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Approve payroll
  const approvePayrollHandler = async (payrollId) => {
    try {
      const data = await approvePayroll(payrollId);
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error approving payroll:', err);
      toast({
        title: 'Error',
        description: 'Failed to approve payroll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Lock payroll
  const lockPayrollHandler = async (payrollId) => {
    try {
      const data = await lockPayroll(payrollId);
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error locking payroll:', err);
      toast({
        title: 'Error',
        description: 'Failed to lock payroll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Export to CSV
  const exportToCSV = () => {
    // Implementation for CSV export
    toast({
      title: 'Export Started',
      description: 'Payroll data export started',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Export to PDF
  const exportToPDF = () => {
    // Implementation for PDF export
    toast({
      title: 'Export Started',
      description: 'Payroll data export started',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Open HR modal
  const openHrModal = (employee) => {
    setSelectedEmployee(employee);
    setHrFormData({
      userId: employee.userId._id || employee.userId,
      date: new Date().toISOString().split('T')[0],
      overtimeHours: 0,
      lateMinutes: 0,
      absence: false
    });
    setIsHrModalOpen(true);
  };
  
  // Open Finance modal
  const openFinanceModal = (employee) => {
    setSelectedEmployee(employee);
    setFinanceFormData({
      userId: employee.userId._id || employee.userId,
      financeAllowances: employee.financeAllowances || 0,
      financeDeductions: employee.financeDeductions || 0,
      hrAllowances: employee.hrAllowances || 0
    });
    setIsFinanceModalOpen(true);
  };
  
  // Handle HR form change
  const handleHrFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHrFormData({
      ...hrFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle Finance form change
  const handleFinanceFormChange = (e) => {
    const { name, value } = e.target;
    setFinanceFormData({
      ...financeFormData,
      [name]: parseFloat(value) || 0
    });
  };
  
  // Effect to fetch data on mount and when filters change
  useEffect(() => {
    fetchPayrollDataHandler();
    fetchDepartments();
  }, [selectedMonth, selectedYear, selectedDepartment, selectedRole]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'yellow';
      case 'hr_submitted': return 'blue';
      case 'finance_reviewed': return 'purple';
      case 'approved': return 'green';
      case 'locked': return 'red';
      default: return 'gray';
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <Box p={6} bg={bgColor} minHeight="100vh">
          <Flex justify="center" align="center" height="100%">
            <Spinner size="xl" />
          </Flex>
        </Box>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <Box p={6} bg={bgColor} minHeight="100vh">
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="lg"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Error Loading Payroll Data
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              {error}
            </AlertDescription>
          </Alert>
        </Box>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Box p={6} bg={bgColor} minHeight="100vh">
        <Heading 
          as="h1" 
          size="xl" 
          color={headerColor}
          mb={6}
          pb={2}
          borderBottom="2px solid"
          borderBottomColor={headerColor}
          display="inline-block"
        >
          Payroll Management
        </Heading>
        
        {/* Filters and Actions */}
        <Card mb={6} bg={cardBg} boxShadow="md" borderRadius="lg">
          <CardBody py={4} px={5}>
            <Flex 
              direction={{ base: 'column', md: 'row' }} 
              justify="space-between" 
              align={{ base: 'start', md: 'center' }}
              gap={4}
            >
              <Flex direction={{ base: 'column', md: 'row' }} gap={3}>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  width={{ base: '100%', md: '140px' }}
                  size="sm"
                  borderRadius="md"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const month = date.toISOString().slice(0, 7);
                    return (
                      <option key={month} value={month}>
                        {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </option>
                    );
                  })}
                </Select>
                
                <Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  placeholder="All Departments"
                  width={{ base: '100%', md: '140px' }}
                  size="sm"
                  borderRadius="md"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </option>
                  ))}
                </Select>
                
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  placeholder="All Roles"
                  width={{ base: '100%', md: '140px' }}
                  size="sm"
                  borderRadius="md"
                >
                  <option value="sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="finance">Finance</option>
                  <option value="IT">IT</option>
                  <option value="admin">Admin</option>
                </Select>
              </Flex>
              
              <Flex gap={2}>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="teal"
                  onClick={calculatePayrollHandler}
                  size="sm"
                  px={4}
                >
                  Calculate
                </Button>
                
                <Button
                  leftIcon={<DownloadIcon />}
                  colorScheme="blue"
                  onClick={exportToCSV}
                  size="sm"
                  px={4}
                >
                  CSV
                </Button>
                
                <Button
                  leftIcon={<DownloadIcon />}
                  colorScheme="purple"
                  onClick={exportToPDF}
                  size="sm"
                  px={4}
                >
                  PDF
                </Button>
              </Flex>
            </Flex>
          </CardBody>
        </Card>
        
        {/* Payroll Summary */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
          <Card bg={cardBg} boxShadow="md" borderRadius="lg" borderLeft="4px solid" borderLeftColor="teal.500">
            <CardBody py={3} px={4}>
              <Stat>
                <StatLabel fontSize="sm" color="gray.500">Total Employees</StatLabel>
                <StatNumber fontSize="xl" fontWeight="bold" color="teal.600">{payrollData.length}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} boxShadow="md" borderRadius="lg" borderLeft="4px solid" borderLeftColor="blue.500">
            <CardBody py={3} px={4}>
              <Stat>
                <StatLabel fontSize="sm" color="gray.500">Total Payroll</StatLabel>
                <StatNumber fontSize="xl" fontWeight="bold" color="blue.600">
                  {formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.finalSalary || 0), 0))}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} boxShadow="md" borderRadius="lg" borderLeft="4px solid" borderLeftColor="purple.500">
            <CardBody py={3} px={4}>
              <Stat>
                <StatLabel fontSize="sm" color="gray.500">Avg. Salary</StatLabel>
                <StatNumber fontSize="xl" fontWeight="bold" color="purple.600">
                  {payrollData.length > 0 
                    ? formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.finalSalary || 0), 0) / payrollData.length)
                    : formatCurrency(0)}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} boxShadow="md" borderRadius="lg" borderLeft="4px solid" borderLeftColor="red.500">
            <CardBody py={3} px={4}>
              <Stat>
                <StatLabel fontSize="sm" color="gray.500">Locked Payrolls</StatLabel>
                <StatNumber fontSize="xl" fontWeight="bold" color="red.600">
                  {payrollData.filter(emp => emp.status === 'locked').length}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </Grid>
        
        {/* Payroll Table */}
        <Card bg={cardBg} boxShadow="md" borderRadius="lg">
          <CardBody>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th 
                    py={3}
                    px={3}
                    fontSize="sm"
                    fontWeight="bold"
                    color="white"
                    position="sticky"
                    top={0}
                    bg={headerBg}
                    zIndex={1}
                    boxShadow="sm"
                    borderColor={borderColor}
                  >
                    Employee
                  </Th>
                  <Th 
                    py={3}
                    px={3}
                    fontSize="sm"
                    fontWeight="bold"
                    color="white"
                    position="sticky"
                    top={0}
                    bg={headerBg}
                    zIndex={1}
                    boxShadow="sm"
                    borderColor={borderColor}
                  >
                    Department
                  </Th>
                  <Th 
                    py={3}
                    px={3}
                    fontSize="sm"
                    fontWeight="bold"
                    color="white"
                    position="sticky"
                    top={0}
                    bg={headerBg}
                    zIndex={1}
                    boxShadow="sm"
                    borderColor={borderColor}
                  >
                    Basic Salary
                  </Th>
                  <Th 
                    py={3}
                    px={3}
                    fontSize="sm"
                    fontWeight="bold"
                    color="white"
                    position="sticky"
                    top={0}
                    bg={headerBg}
                    zIndex={1}
                    boxShadow="sm"
                    borderColor={borderColor}
                  >
                    Adjustments
                  </Th>
                  <Th 
                    py={3}
                    px={3}
                    fontSize="sm"
                    fontWeight="bold"
                    color="white"
                    position="sticky"
                    top={0}
                    bg={headerBg}
                    zIndex={1}
                    boxShadow="sm"
                    borderColor={borderColor}
                  >
                    Commission
                  </Th>
                  <Th 
                    py={3}
                    px={3}
                    fontSize="sm"
                    fontWeight="bold"
                    color="white"
                    position="sticky"
                    top={0}
                    bg={headerBg}
                    zIndex={1}
                    boxShadow="sm"
                    borderColor={borderColor}
                  >
                    Final Salary
                  </Th>
                  <Th 
                    py={3}
                    px={3}
                    fontSize="sm"
                    fontWeight="bold"
                    color="white"
                    position="sticky"
                    top={0}
                    bg={headerBg}
                    zIndex={1}
                    boxShadow="sm"
                    borderColor={borderColor}
                  >
                    Status
                  </Th>
                  <Th 
                    py={3}
                    px={3}
                    fontSize="sm"
                    fontWeight="bold"
                    color="white"
                    position="sticky"
                    top={0}
                    bg={headerBg}
                    zIndex={1}
                    boxShadow="sm"
                    borderColor={borderColor}
                  >
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {payrollData.map((employee) => (
                  <Tr 
                    key={employee._id}
                    _hover={{ bg: rowHoverBg }}
                    transition="background-color 0.2s"
                  >
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      <Text fontWeight="bold">
                        {employee.employeeName || employee.userId?.fullName || employee.userId?.username}
                      </Text>
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      <Badge colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="full">
                        {employee.department}
                      </Badge>
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      {formatCurrency(employee.basicSalary)}
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      {formatCurrency(
                        (employee.overtimePay || 0) +
                        (employee.hrAllowances || 0) +
                        (employee.financeAllowances || 0) -
                        (employee.lateDeduction || 0) -
                        (employee.absenceDeduction || 0) -
                        (employee.financeDeductions || 0)
                      )}
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      {formatCurrency(employee.salesCommission || 0)}
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor} fontWeight="bold" color="teal.500">
                      {formatCurrency(employee.finalSalary)}
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      <Badge colorScheme={getStatusColor(employee.status)} fontSize="xs" px={2} py={1} borderRadius="full">
                        {employee.status?.replace('_', ' ')}
                      </Badge>
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      <Flex gap={1}>
                        <Tooltip label="View Details">
                          <IconButton
                            icon={<ViewIcon />}
                            size="xs"
                            colorScheme="blue"
                            // onClick={() => viewEmployeeDetails(employee)}
                          />
                        </Tooltip>
                        
                        {employee.status !== 'locked' && (
                          <>
                            <Tooltip label="HR Adjustment">
                              <IconButton
                                icon={<AddIcon />}
                                size="xs"
                                colorScheme="orange"
                                onClick={() => openHrModal(employee)}
                              />
                            </Tooltip>
                            
                            <Tooltip label="Finance Adjustment">
                              <IconButton
                                icon={<AddIcon />}
                                size="xs"
                                colorScheme="purple"
                                onClick={() => openFinanceModal(employee)}
                              />
                            </Tooltip>
                            
                            {employee.status === 'finance_reviewed' && (
                              <Tooltip label="Approve">
                                <IconButton
                                  icon={<CheckIcon />}
                                  size="xs"
                                  colorScheme="green"
                                  onClick={() => approvePayrollHandler(employee._id)}
                                />
                              </Tooltip>
                            )}
                            
                            {employee.status === 'approved' && (
                              <Tooltip label="Lock">
                                <IconButton
                                  icon={<LockIcon />}
                                  size="xs"
                                  colorScheme="red"
                                  onClick={() => lockPayrollHandler(employee._id)}
                                />
                              </Tooltip>
                            )}
                          </>
                        )}
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            
            {payrollData.length === 0 && (
              <Flex justify="center" align="center" py={10}>
                <Text color="gray.500">No payroll data found for the selected filters</Text>
              </Flex>
            )}
          </CardBody>
        </Card>
        
        {/* HR Adjustment Modal */}
        <Modal isOpen={isHrModalOpen} onClose={() => setIsHrModalOpen(false)} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader fontSize="lg" fontWeight="bold" bg={headerBg} color="white" borderTopRadius="lg">
              HR Attendance Adjustment
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={5}>
              {selectedEmployee && (
                <Box mb={4}>
                  <Text fontSize="sm"><strong>Employee:</strong> {selectedEmployee.employeeName}</Text>
                  <Text fontSize="sm"><strong>Department:</strong> {selectedEmployee.department}</Text>
                </Box>
              )}
              
              <FormControl mb={4}>
                <FormLabel fontSize="sm">Date</FormLabel>
                <Input
                  type="date"
                  name="date"
                  value={hrFormData.date}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel fontSize="sm">Overtime Hours</FormLabel>
                <Input
                  type="number"
                  name="overtimeHours"
                  value={hrFormData.overtimeHours}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel fontSize="sm">Late Minutes</FormLabel>
                <Input
                  type="number"
                  name="lateMinutes"
                  value={hrFormData.lateMinutes}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel fontSize="sm">Absence</FormLabel>
                <Input
                  type="checkbox"
                  name="absence"
                  isChecked={hrFormData.absence}
                  onChange={handleHrFormChange}
                  size="sm"
                />
              </FormControl>
            </ModalBody>
            
            <ModalFooter bg={cardBg} borderBottomRadius="lg">
              <Button 
                colorScheme="blue" 
                mr={3} 
                onClick={submitHrAdjustmentHandler}
                size="sm"
                px={6}
              >
                Submit
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsHrModalOpen(false)}
                size="sm"
                px={6}
              >
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        {/* Finance Adjustment Modal */}
        <Modal isOpen={isFinanceModalOpen} onClose={() => setIsFinanceModalOpen(false)} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader fontSize="lg" fontWeight="bold" bg={headerBg} color="white" borderTopRadius="lg">
              Finance Adjustment
            </ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody py={5}>
              {selectedEmployee && (
                <Box mb={4}>
                  <Text fontSize="sm"><strong>Employee:</strong> {selectedEmployee.employeeName}</Text>
                  <Text fontSize="sm"><strong>Department:</strong> {selectedEmployee.department}</Text>
                </Box>
              )}
              
              <FormControl mb={4}>
                <FormLabel fontSize="sm">Finance Allowances</FormLabel>
                <Input
                  type="number"
                  name="financeAllowances"
                  value={financeFormData.financeAllowances}
                  onChange={handleFinanceFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel fontSize="sm">Finance Deductions</FormLabel>
                <Input
                  type="number"
                  name="financeDeductions"
                  value={financeFormData.financeDeductions}
                  onChange={handleFinanceFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel fontSize="sm">HR Allowances</FormLabel>
                <Input
                  type="number"
                  name="hrAllowances"
                  value={financeFormData.hrAllowances}
                  onChange={handleFinanceFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
            </ModalBody>
            
            <ModalFooter bg={cardBg} borderBottomRadius="lg">
              <Button 
                colorScheme="blue" 
                mr={3} 
                onClick={submitFinanceAdjustmentHandler}
                size="sm"
                px={6}
              >
                Submit
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsFinanceModalOpen(false)}
                size="sm"
                px={6}
              >
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
};

export default PayrollPage;