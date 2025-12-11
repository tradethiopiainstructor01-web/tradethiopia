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
  AlertDescription,
  Button
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowBackIcon } from '@chakra-ui/icons';
import Layout from '../Layout';
import { getPayrollDetails, fetchSalesDataForCommission } from '../../services/payrollService';

const EmployeePayrollView = () => {
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headerBg = useColorModeValue('teal.600', 'teal.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tableBg = useColorModeValue('white', 'gray.800');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  // Parse URL parameters
  const getUrlParams = () => {
    const searchParams = new URLSearchParams(location.search);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month') || selectedMonth;
    const year = searchParams.get('year') || selectedYear;
    
    // Update state with URL parameters if they exist
    if (month) setSelectedMonth(month);
    if (year) setSelectedYear(year);
    
    return { userId, month, year };
  };

  // Get current user's username from localStorage
  const currentUsername = localStorage.getItem('userName') || '';

  // Fetch employee payroll data
  const fetchPayrollDataHandler = async () => {
    try {
      setLoading(true);
      
      // Get URL parameters
      const { userId, month, year } = getUrlParams();
      
      // If we're viewing another employee's data (from PayrollPage)
      if (userId) {
        const data = await getPayrollDetails(userId, { month, year });
        setPayrollData(data);
      } else {
        // Viewing own data - this would typically come from the backend
        // For now, we'll simulate with sample data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample data - in real implementation, this would come from the backend
        const sampleData = {
          _id: '1',
          month: selectedMonth,
          year: parseInt(selectedYear),
          employeeName: currentUsername,
          department: 'sales',
          basicSalary: 5000,
          age: 30,
          ageAdjustment: 0,
          overtimeHours: 10,
          overtimeRate: 50,
          overtimePay: 500,
          lateMinutes: 30,
          lateRate: 5,
          lateDeduction: 150,
          absenceDays: 0,
          dailyRate: 200,
          absenceDeduction: 0,
          numberOfSales: 12,
          salesCommission: 1200,
          hrAllowances: 300,
          financeAllowances: 200,
          financeDeductions: 50,
          finalSalary: 6950,
          status: 'locked',
          auditLog: []
        };
        
        setPayrollData(sampleData);
      }
      
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
      <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
        {/* Back Button and Heading */}
        <Flex 
          direction={{ base: 'column', sm: 'row' }} 
          justify="space-between" 
          align={{ base: 'start', sm: 'center' }} 
          mb={6}
          gap={4}
        >
          <Button
            leftIcon={<ArrowBackIcon />}
            onClick={() => navigate('/payroll')}
            colorScheme="teal"
            variant="outline"
            size={{ base: 'sm', md: 'md' }}
            mb={{ base: 2, sm: 0 }}
          >
            Back to Payroll
          </Button>
          
          <Heading 
            as="h1" 
            size={{ base: 'lg', md: 'xl' }} 
            color={headerColor}
            pb={2}
            borderBottom="2px solid"
            borderBottomColor={headerColor}
            display="inline-block"
          >
            {payrollData?.employeeName ? `${payrollData.employeeName}'s Payroll` : 'My Payroll'}
          </Heading>
        </Flex>
        
        {/* Filters */}
        <Card mb={6} bg={cardBg} boxShadow="md" borderRadius="lg">
          <CardBody py={4} px={5}>
            <Flex 
              direction={{ base: 'column', sm: 'row' }} 
              justify="space-between" 
              align={{ base: 'start', sm: 'center' }}
              gap={4}
            >
              <Flex direction={{ base: 'column', sm: 'row' }} gap={3}>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  width={{ base: '100%', sm: '140px' }}
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
                  width={{ base: '100%', sm: '140px' }}
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
        
        {/* Payroll Summary */}
        {payrollData && (
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6} mb={6}>
            <StatCard 
              title="Basic Salary" 
              value={formatCurrency(payrollData.basicSalary)} 
              color="blue.500" 
            />
            <StatCard 
              title="Total Adjustments" 
              value={formatCurrency(
                (payrollData.overtimePay || 0) +
                (payrollData.hrAllowances || 0) +
                (payrollData.financeAllowances || 0) -
                (payrollData.lateDeduction || 0) -
                (payrollData.absenceDeduction || 0) -
                (payrollData.financeDeductions || 0)
              )} 
              color="green.500" 
            />
            <StatCard 
              title="Sales Commission" 
              value={formatCurrency(payrollData.salesCommission || 0)} 
              color="purple.500" 
            />
            <StatCard 
              title="Final Salary" 
              value={formatCurrency(payrollData.finalSalary)} 
              color="teal.500" 
              isBold={true}
            />
          </Grid>
        )}
        
        {/* Detailed Breakdown */}
        {payrollData && (
          <Card mb={6} bg={cardBg} boxShadow="md" borderRadius="lg">
            <CardBody py={4} px={{ base: 2, md: 5 }}>
              <Heading as="h2" size="md" color={headerColor} mb={4}>
                Salary Breakdown
              </Heading>
              
              <Box overflowX="auto">
                <Table variant="simple" size={{ base: "sm", md: "sm" }}>
                  <Thead>
                    <Tr>
                      <Th 
                        py={{ base: 2, md: 3 }}
                        px={{ base: 2, md: 3 }}
                        fontSize={{ base: "xs", md: "sm" }}
                        fontWeight="bold"
                        color="white"
                        position="sticky"
                        top={0}
                        bg={headerBg}
                        zIndex={1}
                        boxShadow="sm"
                        borderColor={borderColor}
                      >
                        Component
                      </Th>
                      <Th 
                        py={{ base: 2, md: 3 }}
                        px={{ base: 2, md: 3 }}
                        fontSize={{ base: "xs", md: "sm" }}
                        fontWeight="bold"
                        color="white"
                        position="sticky"
                        top={0}
                        bg={headerBg}
                        zIndex={1}
                        boxShadow="sm"
                        borderColor={borderColor}
                        isNumeric
                      >
                        Amount
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Basic Salary</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency(payrollData.basicSalary)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Overtime Pay</Text>
                        <Text fontSize={{ base: "xxs", md: "xs" }} color="gray.500">
                          {payrollData.overtimeHours || 0} hours × {formatCurrency(payrollData.overtimeRate || 0)}/hour
                        </Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency(payrollData.overtimePay || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Late Deduction</Text>
                        <Text fontSize={{ base: "xxs", md: "xs" }} color="gray.500">
                          {payrollData.lateMinutes || 0} minutes × {formatCurrency(payrollData.lateRate || 0)}/minute
                        </Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        -{formatCurrency(payrollData.lateDeduction || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Absence Deduction</Text>
                        <Text fontSize={{ base: "xxs", md: "xs" }} color="gray.500">
                          {payrollData.absenceDays || 0} days × {formatCurrency(payrollData.dailyRate || 0)}/day
                        </Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        -{formatCurrency(payrollData.absenceDeduction || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">HR Allowances</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency(payrollData.hrAllowances || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Finance Allowances</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency(payrollData.financeAllowances || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Finance Deductions</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        -{formatCurrency(payrollData.financeDeductions || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Sales Commission</Text>
                        <Text fontSize={{ base: "xxs", md: "xs" }} color="gray.500">
                          {payrollData.numberOfSales || 0} sales
                        </Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency(payrollData.salesCommission || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr bg="teal.50" _hover={{ bg: "teal.100" }} transition="background-color 0.2s">
                      <Td py={{ base: 2, md: 3 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Final Salary</Text>
                      </Td>
                      <Td py={{ base: 2, md: 3 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric fontWeight="bold" color="teal.600">
                        {formatCurrency(payrollData.finalSalary)}
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        )}
        
        {/* Status and Audit Log */}
        {payrollData && (
          <Card mb={6} bg={cardBg} boxShadow="md" borderRadius="lg">
            <CardBody py={4} px={{ base: 2, md: 5 }}>
              <Flex 
                direction={{ base: 'column', md: 'row' }} 
                justify="space-between" 
                align={{ base: 'start', md: 'center' }} 
                mb={4}
                gap={2}
              >
                <Heading as="h2" size="md" color={headerColor}>
                  Status & History
                </Heading>
                <Badge colorScheme={getStatusColor(payrollData.status)} fontSize="sm" px={3} py={1} borderRadius="full">
                  {payrollData.status?.replace('_', ' ')}
                </Badge>
              </Flex>
              
              {payrollData.auditLog && payrollData.auditLog.length > 0 ? (
                <Box overflowX="auto">
                  <Table variant="simple" size={{ base: "sm", md: "sm" }}>
                    <Thead>
                      <Tr>
                        <Th 
                          py={{ base: 2, md: 3 }}
                          px={{ base: 2, md: 3 }}
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          color="white"
                          position="sticky"
                          top={0}
                          bg={headerBg}
                          zIndex={1}
                          boxShadow="sm"
                          borderColor={borderColor}
                        >
                          Date
                        </Th>
                        <Th 
                          py={{ base: 2, md: 3 }}
                          px={{ base: 2, md: 3 }}
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          color="white"
                          position="sticky"
                          top={0}
                          bg={headerBg}
                          zIndex={1}
                          boxShadow="sm"
                          borderColor={borderColor}
                        >
                          Changed By
                        </Th>
                        <Th 
                          py={{ base: 2, md: 3 }}
                          px={{ base: 2, md: 3 }}
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          color="white"
                          position="sticky"
                          top={0}
                          bg={headerBg}
                          zIndex={1}
                          boxShadow="sm"
                          borderColor={borderColor}
                        >
                          Field
                        </Th>
                        <Th 
                          py={{ base: 2, md: 3 }}
                          px={{ base: 2, md: 3 }}
                          fontSize={{ base: "xs", md: "sm" }}
                          fontWeight="bold"
                          color="white"
                          position="sticky"
                          top={0}
                          bg={headerBg}
                          zIndex={1}
                          boxShadow="sm"
                          borderColor={borderColor}
                        >
                          Change
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {payrollData.auditLog.map((log, index) => (
                        <Tr key={index} _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                          <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                            {new Date(log.changedAt).toLocaleString()}
                          </Td>
                          <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                            {log.changedBy?.username || log.changedBy?.fullName || 'Unknown'}
                            <Badge ml={2} fontSize="xs" colorScheme="gray">
                              {log.role}
                            </Badge>
                          </Td>
                          <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                            {log.fieldName}
                          </Td>
                          <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                            {typeof log.oldValue === 'number' && typeof log.newValue === 'number' ? (
                              <Text>
                                {formatCurrency(log.oldValue)} → {formatCurrency(log.newValue)}
                              </Text>
                            ) : (
                              <Text>
                                {String(log.oldValue)} → {String(log.newValue)}
                              </Text>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text color="gray.500" fontStyle="italic" fontSize={{ base: "sm", md: "md" }}>
                  No audit history available
                </Text>
              )}
            </CardBody>
          </Card>
        )}
      </Box>
    </Layout>
  );
};

// Stat Card Component
const StatCard = ({ title, value, color, isBold = false }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Card bg={cardBg} boxShadow="md" borderRadius="lg" border="1px solid" borderColor={borderColor}>
      <CardBody py={4} px={5}>
        <Stat>
          <StatLabel fontSize={{ base: "xs", md: "sm" }} color="gray.500" mb={1}>
            {title}
          </StatLabel>
          <StatNumber 
            fontSize={{ base: "md", md: "lg" }} 
            color={color} 
            fontWeight={isBold ? "bold" : "normal"}
          >
            {value}
          </StatNumber>
        </Stat>
      </CardBody>
    </Card>
  );
};

export default EmployeePayrollView;