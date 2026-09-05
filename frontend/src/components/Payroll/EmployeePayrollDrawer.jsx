import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerFooter,
  Box,
  Card,
  CardBody,
  Grid,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Flex,
  HStack,
  VStack,
  Button,
  Divider,
  Icon,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { FiDollarSign, FiCreditCard, FiPrinter, FiShield, FiCalendar, FiClock, FiUser, FiInfo } from 'react-icons/fi';
import { getPayrollDetails } from '../../services/payrollService';

const StatCard = ({ title, value, color, isBold = false }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Card 
      bg={cardBg} 
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      shadow="sm"
    >
      <CardBody py={3} px={4}>
        <Text fontSize="xs" fontWeight="semibold" color={labelColor} mb={1}>
          {title}
        </Text>
        <Text fontSize={{ base: "lg", md: "xl" }} fontWeight={isBold ? "extrabold" : "bold"} color={color}>
          {value}
        </Text>
      </CardBody>
    </Card>
  );
};

const EmployeePayrollDrawer = ({ isOpen, onClose, employee, month, year }) => {
  const [payrollData, setPayrollData] = useState(employee || null);
  const [loading, setLoading] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const sectionHeaderBg = useColorModeValue('#3182CE', '#2B6CB0'); // Classic vibrant blue matching screenshot
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.750');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const summaryRowBg = useColorModeValue('gray.100', 'gray.700');
  const netRowBg = useColorModeValue('teal.50', 'rgba(13, 148, 136, 0.15)');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount || 0);
  };

  useEffect(() => {
    if (!isOpen) return;

    // Pre-populate immediately with available employee data for instant UI render
    if (employee) {
      setPayrollData(employee);
    }

    // Fetch full populated record in background
    const empUserId = employee?.userId?._id || employee?.userId || employee?._id;
    const reqMonth = month || employee?.month || new Date().toISOString().slice(0, 7);
    const reqYear = year || employee?.year || new Date().getFullYear();

    if (empUserId) {
      setLoading(true);
      getPayrollDetails(empUserId, { month: reqMonth, year: reqYear })
        .then((data) => {
          if (data) {
            setPayrollData((prev) => ({ ...prev, ...data }));
          }
        })
        .catch((err) => {
          console.error("Error fetching detailed payroll data:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, employee, month, year]);

  if (!payrollData) return null;

  const empName = payrollData.employeeName || payrollData.userId?.fullName || payrollData.userId?.username || 'Employee';
  const gross = Number(payrollData.grossSalary || payrollData.basicSalary || 0);
  const tax = Number(payrollData.incomeTax || 0);
  const pensionEE = Number(payrollData.pension || 0);
  const pensionER = Number(payrollData.employerPension || (Number(payrollData.basicSalary || 0) * 0.11));
  const late = Number(payrollData.lateDeduction || 0);
  const absence = Number(payrollData.absenceDeduction || 0);
  const financeDed = Number(payrollData.financeDeductions || 0);
  const loan = Number(payrollData.loan || 0);
  const totalDeductions = tax + pensionEE + late + absence + financeDed + loan;

  const hrAllow = Number(payrollData.hrAllowances || 0);
  const financeAllow = Number(payrollData.financeAllowances || 0);
  const commission = Number(payrollData.salesCommission || 0);
  const transport = Number(payrollData.transportAllowance || 0);
  const totalAllowances = hrAllow + financeAllow + commission + transport;

  const netPay = Number(payrollData.netSalary || payrollData.finalSalary || 0);
  const bankAcc = payrollData.salaryBankAccountNumber || payrollData.userId?.personalInformation?.salaryBankAccountNumber || payrollData.userId?.bankAccountNumber || 'N/A';
  const tin = payrollData.tinNumber || payrollData.userId?.personalInformation?.tinNumber || 'N/A';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <Badge colorScheme="gray">Draft</Badge>;
      case 'hr_submitted':
        return <Badge colorScheme="blue">HR Submitted</Badge>;
      case 'finance_reviewed':
        return <Badge colorScheme="purple">Finance Reviewed</Badge>;
      case 'approved':
        return <Badge colorScheme="green">Approved</Badge>;
      case 'locked':
        return <Badge colorScheme="red">Locked & Disbursed</Badge>;
      default:
        return <Badge colorScheme="teal">{status || 'Draft'}</Badge>;
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" size="xl" onClose={onClose}>
      <DrawerOverlay backdropFilter="blur(3px)" />
      <DrawerContent maxW={{ base: '100%', md: '750px', lg: '850px' }}>
        <DrawerCloseButton mt={2} />
        
        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} pb={3}>
          <Flex justify="space-between" align="center" pr={8}>
            <VStack align="start" spacing={1}>
              <HStack spacing={2} align="center">
                <Icon as={FiUser} color="blue.500" boxSize={5} />
                <Heading size="md" color={textColor}>
                  Payroll Details for {empName}
                </Heading>
              </HStack>
              <HStack spacing={2} fontSize="xs" color={mutedText}>
                <Badge colorScheme="teal" textTransform="capitalize">
                  {payrollData.department || 'General'}
                </Badge>
                <HStack spacing={1}>
                  <Icon as={FiCalendar} />
                  <Text>{payrollData.month || month || 'Current'} ({payrollData.year || year})</Text>
                </HStack>
                {getStatusBadge(payrollData.status)}
              </HStack>
            </VStack>
            {loading && <Spinner size="sm" color="blue.500" />}
          </Flex>
        </DrawerHeader>

        <DrawerBody py={5} px={{ base: 3, md: 6 }}>
          <VStack spacing={5} align="stretch">
            
            {/* 1. Four Summary Stat Cards (Exact match to user screenshot) */}
            <Grid templateColumns={{ base: "1fr 1fr", sm: "repeat(4, 1fr)" }} gap={3}>
              <StatCard 
                title="Gross Salary" 
                value={formatCurrency(gross)} 
                color="blue.500" 
              />
              <StatCard 
                title="Total Deductions" 
                value={formatCurrency(totalDeductions)} 
                color="orange.500" 
              />
              <StatCard 
                title="Total Allowances" 
                value={formatCurrency(totalAllowances)} 
                color="green.500" 
              />
              <StatCard 
                title="Net Salary" 
                value={formatCurrency(netPay)} 
                color="teal.500" 
                isBold={true}
              />
            </Grid>

            {/* 2. Salary Breakdown Card & Table (Exact match to user screenshot) */}
            <Card bg={cardBg} boxShadow="sm" borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
              <CardBody py={4} px={{ base: 2, md: 4 }}>
                <Heading as="h3" size="sm" color="blue.600" mb={3} display="flex" alignItems="center" gap={2}>
                  <Icon as={FiDollarSign} />
                  Salary Breakdown
                </Heading>

                <Box overflowX="auto" borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                  <Table variant="simple" size="sm">
                    <Thead bg={sectionHeaderBg}>
                      <Tr>
                        <Th color="white" py={2.5} fontSize="xs" textTransform="uppercase">
                          COMPONENT
                        </Th>
                        <Th color="white" py={2.5} fontSize="xs" textTransform="uppercase" isNumeric>
                          AMOUNT
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr _hover={{ bg: rowHoverBg }}>
                        <Td py={2} fontWeight="medium">Basic Salary</Td>
                        <Td py={2} isNumeric fontWeight="semibold">{formatCurrency(payrollData.basicSalary || 0)}</Td>
                      </Tr>

                      <Tr _hover={{ bg: rowHoverBg }}>
                        <Td py={2}>
                          <Text fontWeight="medium">Overtime Pay</Text>
                          <Text fontSize="10px" color={mutedText}>
                            {payrollData.overtimeHours || 0} hours
                          </Text>
                        </Td>
                        <Td py={2} isNumeric>{formatCurrency(payrollData.overtimePay || 0)}</Td>
                      </Tr>

                      <Tr _hover={{ bg: rowHoverBg }}>
                        <Td py={2} fontWeight="medium">HR Allowances</Td>
                        <Td py={2} isNumeric>{formatCurrency(hrAllow)}</Td>
                      </Tr>

                      <Tr _hover={{ bg: rowHoverBg }}>
                        <Td py={2} fontWeight="medium">Finance Allowances</Td>
                        <Td py={2} isNumeric>{formatCurrency(financeAllow)}</Td>
                      </Tr>

                      <Tr _hover={{ bg: rowHoverBg }}>
                        <Td py={2}>
                          <Text fontWeight="medium">Sales Commission</Text>
                          <Text fontSize="10px" color={mutedText}>
                            {payrollData.numberOfSales || 0} sales
                          </Text>
                        </Td>
                        <Td py={2} isNumeric>{formatCurrency(commission)}</Td>
                      </Tr>

                      {transport > 0 && (
                        <Tr _hover={{ bg: rowHoverBg }}>
                          <Td py={2}>
                            <Text fontWeight="medium" color="teal.600">Transport Allowance</Text>
                            <Text fontSize="10px" color={mutedText}>Non-taxable statutory benefit</Text>
                          </Td>
                          <Td py={2} isNumeric color="teal.600" fontWeight="semibold">+{formatCurrency(transport)}</Td>
                        </Tr>
                      )}

                      {/* Gross Salary Highlight Row */}
                      <Tr bg={summaryRowBg}>
                        <Td py={2.5}>
                          <Text fontWeight="bold">Gross Salary</Text>
                          <Text fontSize="10px" color={mutedText}>
                            (Basic + Overtime + Allowances + Commission)
                          </Text>
                        </Td>
                        <Td py={2.5} isNumeric fontWeight="extrabold">{formatCurrency(gross)}</Td>
                      </Tr>

                      <Tr _hover={{ bg: rowHoverBg }}>
                        <Td py={2} fontWeight="medium">Income Tax (Schedule A)</Td>
                        <Td py={2} isNumeric color="red.500">-{formatCurrency(tax)}</Td>
                      </Tr>

                      <Tr _hover={{ bg: rowHoverBg }}>
                        <Td py={2} fontWeight="medium">Pension (7% Employee)</Td>
                        <Td py={2} isNumeric color="red.500">-{formatCurrency(pensionEE)}</Td>
                      </Tr>

                      <Tr _hover={{ bg: rowHoverBg }}>
                        <Td py={2}>
                          <Text fontWeight="medium">Late Deduction</Text>
                          <Text fontSize="10px" color={mutedText}>
                            {payrollData.lateDays || 0} days (300 ETB/day)
                          </Text>
                        </Td>
                        <Td py={2} isNumeric color={late > 0 ? "red.500" : undefined}>
                          -{formatCurrency(late)}
                        </Td>
                      </Tr>

                      <Tr _hover={{ bg: rowHoverBg }}>
                        <Td py={2}>
                          <Text fontWeight="medium">Absence Deduction</Text>
                          <Text fontSize="10px" color={mutedText}>
                            {payrollData.absenceDays || 0} days
                          </Text>
                        </Td>
                        <Td py={2} isNumeric color={absence > 0 ? "red.500" : undefined}>
                          -{formatCurrency(absence)}
                        </Td>
                      </Tr>

                      {loan > 0 && (
                        <Tr _hover={{ bg: rowHoverBg }}>
                          <Td py={2} fontWeight="medium">Loan Deduction</Td>
                          <Td py={2} isNumeric color="red.500">-{formatCurrency(loan)}</Td>
                        </Tr>
                      )}

                      <Tr _hover={{ bg: rowHoverBg }}>
                        <Td py={2} fontWeight="medium">Finance Deductions</Td>
                        <Td py={2} isNumeric color={financeDed > 0 ? "red.500" : undefined}>
                          -{formatCurrency(financeDed)}
                        </Td>
                      </Tr>

                      {/* Net Salary Highlight Row */}
                      <Tr bg={netRowBg}>
                        <Td py={3}>
                          <Text fontWeight="extrabold" color="teal.700" fontSize="sm">Net Payable Salary</Text>
                          <Text fontSize="10px" color="teal.600">Disbursed to Bank Account</Text>
                        </Td>
                        <Td py={3} isNumeric fontWeight="extrabold" color="teal.700" fontSize="md">
                          {formatCurrency(netPay)}
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>

            {/* 3. Ethiopian Statutory & Bank Transfer Card */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
              <Card bg={cardBg} boxShadow="sm" borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                <CardBody py={3} px={4}>
                  <Heading as="h4" size="xs" color="purple.600" mb={3} display="flex" alignItems="center" gap={1.5}>
                    <Icon as={FiShield} />
                    🇪🇹 Statutory Pension Fund (18%)
                  </Heading>
                  <VStack align="stretch" spacing={2} fontSize="xs">
                    <Flex justify="space-between">
                      <Text color={mutedText}>Employee Contribution (7%):</Text>
                      <Text fontWeight="bold" color="red.500">-{formatCurrency(pensionEE)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text color={mutedText}>Employer Contribution (11%):</Text>
                      <Text fontWeight="bold" color="purple.600">+{formatCurrency(pensionER)}</Text>
                    </Flex>
                    <Divider />
                    <Flex justify="space-between">
                      <Text fontWeight="bold">Total POEPF Pension Remitted:</Text>
                      <Text fontWeight="extrabold" color="purple.700">
                        {formatCurrency(pensionEE + pensionER)}
                      </Text>
                    </Flex>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={cardBg} boxShadow="sm" borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                <CardBody py={3} px={4}>
                  <Heading as="h4" size="xs" color="blue.600" mb={3} display="flex" alignItems="center" gap={1.5}>
                    <Icon as={FiCreditCard} />
                    Bank Account & Tax Details
                  </Heading>
                  <VStack align="stretch" spacing={2} fontSize="xs">
                    <Flex justify="space-between">
                      <Text color={mutedText}>CBE Account Number:</Text>
                      <Text fontWeight="bold" fontFamily="monospace" color="blue.600">
                        {bankAcc}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text color={mutedText}>TIN Number:</Text>
                      <Text fontWeight="bold" fontFamily="monospace" color="gray.600">
                        {tin}
                      </Text>
                    </Flex>
                    <Divider />
                    <Flex justify="space-between">
                      <Text color={mutedText}>Days Worked (Accrual):</Text>
                      <Text fontWeight="bold">{payrollData.daysWorked || 30} / 30 Days</Text>
                    </Flex>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>

            {/* 4. Overtime & Attendance Breakdown if any */}
            {(payrollData.overtimeHours > 0 || payrollData.lateDays > 0 || payrollData.absenceDays > 0) && (
              <Card bg={cardBg} boxShadow="sm" borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                <CardBody py={3} px={4}>
                  <Heading as="h4" size="xs" color="orange.600" mb={3} display="flex" alignItems="center" gap={1.5}>
                    <Icon as={FiClock} />
                    Attendance & Labor Hours
                  </Heading>
                  <Grid templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }} gap={3} fontSize="xs">
                    <Box p={2} bg={summaryRowBg} borderRadius="md">
                      <Text color={mutedText}>Daytime OT (1.5×):</Text>
                      <Text fontWeight="bold">{payrollData.daytimeOvertimeHours || 0} hrs</Text>
                    </Box>
                    <Box p={2} bg={summaryRowBg} borderRadius="md">
                      <Text color={mutedText}>Night OT (1.75×):</Text>
                      <Text fontWeight="bold">{payrollData.nightOvertimeHours || 0} hrs</Text>
                    </Box>
                    <Box p={2} bg={summaryRowBg} borderRadius="md">
                      <Text color={mutedText}>Rest Day OT (2.0×):</Text>
                      <Text fontWeight="bold">{payrollData.restDayOvertimeHours || 0} hrs</Text>
                    </Box>
                    <Box p={2} bg={summaryRowBg} borderRadius="md">
                      <Text color={mutedText}>Holiday OT (2.5×):</Text>
                      <Text fontWeight="bold">{payrollData.holidayOvertimeHours || 0} hrs</Text>
                    </Box>
                  </Grid>
                </CardBody>
              </Card>
            )}

            {/* 5. Audit Log and History */}
            {payrollData.auditLog && payrollData.auditLog.length > 0 && (
              <Card bg={cardBg} boxShadow="sm" borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                <CardBody py={3} px={4}>
                  <Heading as="h4" size="xs" color="gray.600" mb={2} display="flex" alignItems="center" gap={1.5}>
                    <Icon as={FiInfo} />
                    Audit Trail & Timeline
                  </Heading>
                  <VStack align="stretch" spacing={1.5} fontSize="xs">
                    {payrollData.auditLog.map((log, i) => (
                      <Flex key={i} justify="space-between" py={1} borderBottom="1px dashed" borderColor={borderColor}>
                        <Text fontWeight="medium">
                          {log.fieldName}: <Text as="span" color="teal.600">{log.newValue || 'Updated'}</Text>
                        </Text>
                        <Text color={mutedText} fontSize="10px">
                          {log.role} • {new Date(log.changedAt).toLocaleDateString()}
                        </Text>
                      </Flex>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            )}

          </VStack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" borderColor={borderColor} py={3}>
          <HStack spacing={3} w="full" justify="space-between">
            <Button 
              leftIcon={<Icon as={FiPrinter} />} 
              size="sm" 
              variant="outline" 
              onClick={() => window.print()}
            >
              Print Details
            </Button>
            <Button colorScheme="blue" size="sm" onClick={onClose}>
              Close
            </Button>
          </HStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default EmployeePayrollDrawer;
