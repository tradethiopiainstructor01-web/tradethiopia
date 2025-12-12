import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardBody, 
  Grid, 
  Heading, 
  Stat, 
  StatLabel, 
  StatNumber, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Text, 
  useColorModeValue 
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowBackIcon } from '@chakra-ui/icons';
import Layout from '../Layout';
import { getPayrollDetails, fetchSalesDataForCommission } from '../../services/payrollService';

const EmployeePayrollView = () => {
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('blue.500', 'blue.700');
  const headerColor = useColorModeValue('white', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  useEffect(() => {
    const fetchPayrollDetails = async () => {
      try {
        setLoading(true);
        const searchParams = new URLSearchParams(location.search);
        const userId = searchParams.get('userId');
        const month = searchParams.get('month');
        const year = searchParams.get('year');
        
        if (!userId || !month || !year) {
          throw new Error('Missing required parameters');
        }
        
        const data = await getPayrollDetails(userId, { month, year });
        setPayrollData(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching payroll details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollDetails();
  }, [location.search]);

  if (loading) {
    return (
      <Layout>
        <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
          <Text>Loading payroll details...</Text>
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
          <Text color="red.500">Error: {error}</Text>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
        {/* Back Button and Heading */}
        <Box display="flex" alignItems="center" mb={6}>
          <ArrowBackIcon 
            onClick={() => navigate(-1)} 
            cursor="pointer" 
            mr={3} 
            boxSize={6} 
            color="blue.500"
          />
          <Heading as="h1" size="lg" color={headerColor}>
            Payroll Details for {payrollData?.employeeName || 'Employee'}
          </Heading>
        </Box>

        {/* Payroll Summary */}
        {payrollData && (
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6} mb={6}>
            <StatCard 
              title="Gross Salary" 
              value={formatCurrency(payrollData.grossSalary || payrollData.basicSalary || 0)} 
              color="blue.500" 
            />
            <StatCard 
              title="Total Deductions" 
              value={formatCurrency((payrollData.incomeTax || 0) + (payrollData.pension || 0) + (payrollData.lateDeduction || 0) + (payrollData.absenceDeduction || 0) + (payrollData.financeDeductions || 0))} 
              color="orange.500" 
            />
            <StatCard 
              title="Total Allowances" 
              value={formatCurrency((payrollData.hrAllowances || 0) + (payrollData.financeAllowances || 0) + (payrollData.salesCommission || 0))} 
              color="green.500" 
            />
            <StatCard 
              title="Net Salary" 
              value={formatCurrency(payrollData.netSalary || payrollData.finalSalary || 0)} 
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
                        {formatCurrency(payrollData.basicSalary || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Overtime Pay</Text>
                        <Text fontSize={{ base: "xxs", md: "xs" }} color="gray.500">
                          {payrollData.overtimeHours || 0} hours
                        </Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency(payrollData.overtimePay || 0)}
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
                        <Text fontWeight="bold">Sales Commission</Text>
                        <Text fontSize={{ base: "xxs", md: "xs" }} color="gray.500">
                          {payrollData.numberOfSales || 0} sales
                        </Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency(payrollData.salesCommission || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr bg="gray.100" _hover={{ bg: "gray.200" }} transition="background-color 0.2s">
                      <Td py={{ base: 2, md: 3 }} px={{ base: 2, md: 3 }} fontSize={{ base: "sm", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Gross Salary</Text>
                        <Text fontSize={{ base: "xxs", md: "xs" }} color="gray.500">
                          (Basic + Overtime + Allowances + Commission)
                        </Text>
                      </Td>
                      <Td py={{ base: 2, md: 3 }} px={{ base: 2, md: 3 }} fontSize={{ base: "sm", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric fontWeight="bold">
                        {formatCurrency(payrollData.grossSalary || payrollData.basicSalary || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Income Tax</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        -{formatCurrency(payrollData.incomeTax || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Pension (7%)</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        -{formatCurrency(payrollData.pension || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Late Deduction</Text>
                        <Text fontSize={{ base: "xxs", md: "xs" }} color="gray.500">
                          {payrollData.lateDays || 0} days
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
                          {payrollData.absenceDays || 0} days
                        </Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        -{formatCurrency(payrollData.absenceDeduction || 0)}
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
                    
                    <Tr bg="teal.50" _hover={{ bg: "teal.100" }} transition="background-color 0.2s">
                      <Td py={{ base: 2, md: 3 }} px={{ base: 2, md: 3 }} fontSize={{ base: "sm", md: "md" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>Net Salary</Text>
                      </Td>
                      <Td py={{ base: 2, md: 3 }} px={{ base: 2, md: 3 }} fontSize={{ base: "sm", md: "md" }} borderBottom="1px solid" borderColor={borderColor} isNumeric fontWeight="bold" color="teal.600">
                        {formatCurrency(payrollData.netSalary || payrollData.finalSalary || 0)}
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        )}

        {/* Tax and Pension Calculation Details */}
        {payrollData && (
          <Card mb={6} bg={cardBg} boxShadow="md" borderRadius="lg">
            <CardBody py={4} px={{ base: 2, md: 5 }}>
              <Heading as="h2" size="md" color={headerColor} mb={4}>
                Tax and Pension Calculation Details
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
                        Calculation Type
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
                        Formula
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
                        <Text fontWeight="bold">Income Tax</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text>Based on Ethiopian tax brackets</Text>
                        <Text fontSize="xxs" color="gray.500">
                          {(payrollData.grossSalary || payrollData.basicSalary || 0) <= 600 ? "0%" :
                           (payrollData.grossSalary || payrollData.basicSalary || 0) <= 1600 ? "10% on amount exceeding ETB 600" :
                           (payrollData.grossSalary || payrollData.basicSalary || 0) <= 3200 ? "ETB 100 + 15% on amount exceeding ETB 1,600" :
                           (payrollData.grossSalary || payrollData.basicSalary || 0) <= 5200 ? "ETB 340 + 20% on amount exceeding ETB 3,200" :
                           (payrollData.grossSalary || payrollData.basicSalary || 0) <= 10000 ? "ETB 740 + 25% on amount exceeding ETB 5,200" :
                           "ETB 1,940 + 30% on amount exceeding ETB 10,000"}
                        </Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency(payrollData.incomeTax || 0)}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Pension</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text>7% of Basic Salary</Text>
                        <Text fontSize="xxs" color="gray.500">
                          {formatCurrency(payrollData.basicSalary || 0)} × 7%
                        </Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency(payrollData.pension || 0)}
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        )}

        {/* Overtime Calculation Details */}
        {payrollData && payrollData.overtimeHours > 0 && (
          <Card mb={6} bg={cardBg} boxShadow="md" borderRadius="lg">
            <CardBody py={4} px={{ base: 2, md: 5 }}>
              <Heading as="h2" size="md" color={headerColor} mb={4}>
                Overtime Calculation Details
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
                        Overtime Type
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
                        Hours
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
                        Rate
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
                        <Text fontWeight="bold">Daytime Overtime</Text>
                        <Text fontSize="xxs" color="gray.500">(6am–10pm)</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        {payrollData.daytimeOvertimeHours || 0} hours
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        1.5× Base Rate
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency((payrollData.daytimeOvertimeHours || 0) * ((payrollData.basicSalary || 0) / 30 / 8 * 1.5))}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Night Overtime</Text>
                        <Text fontSize="xxs" color="gray.500">(10pm–6am)</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        {payrollData.nightOvertimeHours || 0} hours
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        1.75× Base Rate
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency((payrollData.nightOvertimeHours || 0) * ((payrollData.basicSalary || 0) / 30 / 8 * 1.75))}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Rest Day Overtime</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        {payrollData.restDayOvertimeHours || 0} hours
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        2.0× Base Rate
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency((payrollData.restDayOvertimeHours || 0) * ((payrollData.basicSalary || 0) / 30 / 8 * 2.0))}
                      </Td>
                    </Tr>
                    
                    <Tr _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Public Holiday Overtime</Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        {payrollData.holidayOvertimeHours || 0} hours
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        2.5× Base Rate
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric>
                        {formatCurrency((payrollData.holidayOvertimeHours || 0) * ((payrollData.basicSalary || 0) / 30 / 8 * 2.5))}
                      </Td>
                    </Tr>
                    
                    <Tr bg="gray.100" _hover={{ bg: "gray.200" }} transition="background-color 0.2s">
                      <Td colSpan={3} py={{ base: 2, md: 3 }} px={{ base: 2, md: 3 }} fontSize={{ base: "sm", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold">Total Overtime Pay</Text>
                      </Td>
                      <Td py={{ base: 2, md: 3 }} px={{ base: 2, md: 3 }} fontSize={{ base: "sm", md: "sm" }} borderBottom="1px solid" borderColor={borderColor} isNumeric fontWeight="bold">
                        {formatCurrency(payrollData.overtimePay || 0)}
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
              <Heading as="h2" size="md" color={headerColor} mb={4}>
                Status and History
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
                        Status
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
                        Updated By
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
                        Timestamp
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        <Text fontWeight="bold" color={
                          payrollData.status === 'draft' ? 'yellow.500' :
                          payrollData.status === 'hr_submitted' ? 'blue.500' :
                          payrollData.status === 'finance_reviewed' ? 'purple.500' :
                          payrollData.status === 'approved' ? 'green.500' :
                          payrollData.status === 'locked' ? 'red.500' : 'gray.500'
                        }>
                          {payrollData.status?.toUpperCase() || 'UNKNOWN'}
                        </Text>
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        {payrollData.hrSubmittedBy?.fullName || payrollData.financeReviewedBy?.fullName || payrollData.approvedBy?.fullName || 'N/A'}
                      </Td>
                      <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                        {payrollData.updatedAt ? new Date(payrollData.updatedAt).toLocaleString() : 'N/A'}
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>
              
              {payrollData.auditLog && payrollData.auditLog.length > 0 && (
                <>
                  <Heading as="h3" size="sm" color={headerColor} mt={6} mb={3}>
                    Audit Log
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
                            Timestamp
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {payrollData.auditLog.map((log, index) => (
                          <Tr key={index} _hover={{ bg: rowHoverBg }} transition="background-color 0.2s">
                            <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                              {log.changedBy?.fullName || 'System'}
                            </Td>
                            <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                              {log.fieldName}
                            </Td>
                            <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                              {typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue) : log.oldValue} → {typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : log.newValue}
                            </Td>
                            <Td py={{ base: 1, md: 2 }} px={{ base: 2, md: 3 }} fontSize={{ base: "xs", md: "sm" }} borderBottom="1px solid" borderColor={borderColor}>
                              {new Date(log.changedAt).toLocaleString()}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>

                    </Table>
                  </Box>
                </>
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