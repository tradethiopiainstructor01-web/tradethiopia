import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  Card,
  CardBody,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  useColorModeValue,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import Layout from '../Layout';
import { fetchPayrollData } from '../../services/payrollService';
import useAgentCommission from '../../hooks/useAgentCommission';

const EmployeePayrollView = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
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

  // Get current user's username from localStorage
  const currentUsername = localStorage.getItem('userName') || '';

  // Use the agent commission hook
  const { commission: agentCommission, loading: commissionLoading, error: commissionError } = useAgentCommission(currentUsername);

  // Fetch employee payroll data
  const fetchPayrollDataHandler = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch the current user's payroll data
      // For now, we'll simulate with sample data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sample data - in real implementation, this would come from the backend
      const sampleData = [
        {
          _id: '1',
          month: '2023-12',
          year: 2023,
          basicSalary: 5000,
          overtimePay: 500,
          lateDeduction: 100,
          absenceDeduction: 0,
          salesCommission: 1200,
          financeAllowances: 300,
          financeDeductions: 50,
          finalSalary: 6750,
          status: 'locked'
        },
        {
          _id: '2',
          month: '2023-11',
          year: 2023,
          basicSalary: 5000,
          overtimePay: 300,
          lateDeduction: 0,
          absenceDeduction: 200,
          salesCommission: 1000,
          financeAllowances: 200,
          financeDeductions: 0,
          finalSalary: 6300,
          status: 'locked'
        },
        {
          _id: '3',
          month: '2023-10',
          year: 2023,
          basicSalary: 5000,
          overtimePay: 0,
          lateDeduction: 150,
          absenceDeduction: 0,
          salesCommission: 800,
          financeAllowances: 100,
          financeDeductions: 75,
          finalSalary: 5675,
          status: 'locked'
        }
      ];
      
      setPayrollData(sampleData);
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
  
  // Effect to fetch data on mount and when filters change
  useEffect(() => {
    fetchPayrollDataHandler();
  }, [selectedMonth, selectedYear]);
  
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
          My Payroll
        </Heading>
        
        {/* Filters */}
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
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  width={{ base: '100%', md: '140px' }}
                  size="sm"
                  borderRadius="md"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </Select>
              </Flex>
            </Flex>
          </CardBody>
        </Card>
        
        {/* Payroll History */}
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
                    Period
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
                </Tr>
              </Thead>
              <Tbody>
                {payrollData.map((record) => (
                  <Tr 
                    key={record._id}
                    _hover={{ bg: rowHoverBg }}
                    transition="background-color 0.2s"
                  >
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      <Text fontWeight="bold">
                        {new Date(record.year, record.month.split('-')[1] - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </Text>
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      {formatCurrency(record.basicSalary)}
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      {formatCurrency(
                        (record.overtimePay || 0) -
                        (record.lateDeduction || 0) -
                        (record.absenceDeduction || 0) +
                        (record.financeAllowances || 0) -
                        (record.financeDeductions || 0)
                      )}
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      {formatCurrency(record.salesCommission || 0)}
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor} fontWeight="bold" color="teal.500">
                      {formatCurrency(record.finalSalary)}
                    </Td>
                    <Td py={2} px={3} fontSize="sm" borderBottom="1px solid" borderColor={borderColor}>
                      <Badge colorScheme={getStatusColor(record.status)} fontSize="xs" px={2} py={1} borderRadius="full">
                        {record.status?.replace('_', ' ')}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            
            {payrollData.length === 0 && (
              <Flex justify="center" align="center" py={10}>
                <Text color="gray.500">No payroll data found for the selected period</Text>
              </Flex>
            )}
          </CardBody>
        </Card>
      </Box>
    </Layout>
  );
};

export default EmployeePayrollView;