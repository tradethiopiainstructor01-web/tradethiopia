import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Button,
  HStack,
  VStack,
  Flex
} from '@chakra-ui/react';
import { FaChartBar, FaChartPie, FaFileInvoice } from 'react-icons/fa';
import FinanceLayout from './FinanceLayout';
import { getExpenseReport, getRevenueReport } from '../../services/financeService';

const FinanceReportsPage = () => {
  const [revenueSummary, setRevenueSummary] = useState(null);
  const [expenseSummary, setExpenseSummary] = useState(null);

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        const data = await getRevenueReport();
        setRevenueSummary(data);
      } catch (err) {
        console.error('Failed to load revenue report', err);
      }
    };

    loadRevenue();
  }, []);

  useEffect(() => {
    const loadExpenseSummary = async () => {
      try {
        const data = await getExpenseReport();
        setExpenseSummary(data);
      } catch (err) {
        console.error('Failed to load expense report', err);
      }
    };

    loadExpenseSummary();
  }, []);

  const formatEtb = (value) => {
    const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
    return `ETB ${amount.toLocaleString()}`;
  };

  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const expenseBreakdownEntries = expenseSummary?.expenseBreakdown && typeof expenseSummary.expenseBreakdown === 'object'
    ? Object.entries(expenseSummary.expenseBreakdown)
        .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    : [];
  const monthlyExpenses = Array.isArray(expenseSummary?.monthlyExpenses)
    ? expenseSummary.monthlyExpenses
    : [];
  const recentExpenses = Array.isArray(expenseSummary?.recentExpenses)
    ? expenseSummary.recentExpenses
    : [];
  const profitValue = Number(((revenueSummary?.totalRevenue || 0) - (expenseSummary?.totalExpenses || 0)).toFixed(2));
  const weeklyRevenue = Array.isArray(revenueSummary?.weeklyRevenue)
    ? revenueSummary.weeklyRevenue
    : [];
  const monthlyRevenue = Array.isArray(revenueSummary?.monthlyRevenue)
    ? revenueSummary.monthlyRevenue
    : [];
  const weeklyExpenses = Array.isArray(expenseSummary?.weeklyExpenses)
    ? expenseSummary.weeklyExpenses
    : [];
  const trainingCost = expenseSummary?.breakdown?.training || 0;
  const rentalCost = expenseSummary?.breakdown?.rental || 0;
  const utilityPlusOther = (expenseSummary?.breakdown?.utility || 0) + (expenseSummary?.breakdown?.other || 0);
  const payrollCost = expenseSummary?.payrollCost || 0;
  const monthlyExpensesList = monthlyExpenses;

  return (
    <FinanceLayout>
      <Box>
        <HStack justify="space-between" mb={6}>
          <Heading as="h1" size="xl" color={headerColor}>
            Financial Reports
          </Heading>
          <HStack>
            <Button leftIcon={<FaFileInvoice />} colorScheme="teal">
              Generate Report
            </Button>
            <Button colorScheme="blue">Export Data</Button>
          </HStack>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
          <Card bg={cardBg} boxShadow="md">
            <CardHeader>
              <Heading as="h2" size="md">Revenue Report</Heading>
            </CardHeader>
            <CardBody>
              {revenueSummary ? (
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>Follow-up revenue</Text>
                  <Stat>
                    <StatLabel>Total follow-up revenue</StatLabel>
                    <StatNumber>ETB {revenueSummary.followupRevenue.toLocaleString()}</StatNumber>
                    <StatHelpText>Orders revenue contribution: ETB {revenueSummary.orderRevenue.toLocaleString()}</StatHelpText>
                    <StatHelpText>Packages revenue contribution: ETB {revenueSummary.packageRevenue.toLocaleString()}</StatHelpText>
                    <StatLabel mt={3}>Combined revenue</StatLabel>
                    <StatNumber>{`ETB ${revenueSummary.totalRevenue.toLocaleString()}`}</StatNumber>
                  </Stat>
                </Box>
              ) : (
                <Box height="200px" display="flex" alignItems="center" justifyContent="center">
                  <Text color="gray.500">Loading revenue data…</Text>
                </Box>
              )}
            </CardBody>
          </Card>

          <Card bg={cardBg} boxShadow="md">
            <CardHeader>
              <Heading as="h2" size="md">Expense Report</Heading>
            </CardHeader>
            <CardBody>
              {expenseSummary ? (
                <VStack align="stretch" spacing={4}>
                  <Stat>
                    <StatLabel>Total Costs Recorded</StatLabel>
                    <StatNumber>{formatEtb(expenseSummary.totalCostsRecorded || expenseSummary.totalExpenses)}</StatNumber>
                    <StatHelpText>Across all expense categories</StatHelpText>
                  </Stat>
                  <VStack spacing={1} align="stretch">
                    <Flex justify="space-between">
                      <Text fontSize="sm" color="gray.600">Training Cost</Text>
                      <Text fontWeight="bold">{formatEtb(trainingCost)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="sm" color="gray.600">Rental Cost</Text>
                      <Text fontWeight="bold">{formatEtb(rentalCost)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="sm" color="gray.600">Utility + Other</Text>
                      <Text fontWeight="bold">{formatEtb(utilityPlusOther)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="sm" color="gray.600">Payroll</Text>
                      <Text fontWeight="bold">{formatEtb(payrollCost)}</Text>
                    </Flex>
                  </VStack>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                    {expenseBreakdownEntries.length ? (
                      expenseBreakdownEntries.map(([category, amount]) => (
                        <Box key={category} bg={cardBg} borderRadius="md" boxShadow="sm" p={3}>
                          <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">
                            {category === 'other' ? 'Utility + Other' : `${category.charAt(0).toUpperCase()}${category.slice(1)} Cost`}
                          </Text>
                          <Text fontSize="lg" fontWeight="semibold">
                            {formatEtb(amount)}
                          </Text>
                        </Box>
                      ))
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        No category breakdown yet.
                      </Text>
                    )}
                  </SimpleGrid>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Monthly trend
                    </Text>
                    {monthlyExpenses.length ? (
                      <SimpleGrid columns={{ base: 2, md: 3 }} gap={2}>
                        {monthlyExpenses.map((item) => (
                          <Box key={item.label} bg="gray.50" borderRadius="md" p={2}>
                            <Text fontSize="xs" color="gray.500">
                              {item.label}
                            </Text>
                            <Text fontSize="sm" fontWeight="semibold">
                              {formatEtb(item.total)}
                            </Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        No monthly expense data available.
                      </Text>
                    )}
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Recent expenses
                    </Text>
                    {recentExpenses.length ? (
                      <VStack align="stretch" spacing={2}>
                        {recentExpenses.slice(0, 3).map((expense) => (
                          <Box
                            key={expense._id || expense.title}
                            px={3}
                            py={2}
                            border="1px solid"
                            borderColor="gray.100"
                            borderRadius="md"
                          >
                            <Text fontSize="sm" fontWeight="semibold">
                              {expense.title || 'Expense'}
                            </Text>
                            <Text fontSize="sm">{formatEtb(expense.amount)}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {expense.incurredOn
                                ? new Date(expense.incurredOn).toLocaleDateString()
                                : 'Date unknown'}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        No recent expenses recorded.
                      </Text>
                    )}
                  </Box>
                </VStack>
              ) : (
                <Box height="200px" display="flex" alignItems="center" justifyContent="center">
                  <Text color="gray.500">Expense chart visualization</Text>
                </Box>
              )}
            </CardBody>
          </Card>


        <Card bg={cardBg} boxShadow="md">
          <CardHeader>
            <Heading as="h2" size="md">Revenue • Expense • Profit Report</Heading>
          </CardHeader>
            <CardBody>
              {(revenueSummary || expenseSummary) ? (
                <>
                  <VStack align="stretch" spacing={3}>
                    <Stat>
                      <StatLabel>Net Profit</StatLabel>
                      <StatNumber color="green.500">{formatEtb(profitValue)}</StatNumber>
                      <StatHelpText>Revenue − Expenses</StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Total Revenue</StatLabel>
                      <StatNumber>{formatEtb(revenueSummary?.totalRevenue || 0)}</StatNumber>
                      <StatHelpText>
                        Follow-ups {formatEtb(revenueSummary?.followupRevenue || 0)}, Orders {formatEtb(revenueSummary?.orderRevenue || 0)}
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Total Expenses</StatLabel>
                      <StatNumber color="red.500">{formatEtb(expenseSummary?.totalExpenses || 0)}</StatNumber>
                      <StatHelpText>
                        Costs recorded {formatEtb(expenseSummary?.totalCostsRecorded || expenseSummary?.totalExpenses || 0)}, Payroll {formatEtb(expenseSummary?.payrollCost || 0)}
                      </StatHelpText>
                    </Stat>
                  </VStack>
                </>
              ) : (
                <Box height="200px" display="flex" alignItems="center" justifyContent="center">
                  <Text color="gray.500">Loading profit & loss data...</Text>
                </Box>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card bg={cardBg} boxShadow="md">
          <CardHeader>
            <Heading as="h2" size="md">Detailed Reports</Heading>
          </CardHeader>
          <CardBody>
            <Text>Comprehensive financial reports and analytics will be displayed here.</Text>
          </CardBody>
        </Card>
        {(weeklyRevenue.length || weeklyExpenses.length || monthlyRevenue.length || monthlyExpensesList.length) && (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
            <Card bg={cardBg} boxShadow="md">
              <CardHeader>
                <Heading as="h2" size="md">Weekly Revenue & Expenses</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" color="gray.500">Revenue</Text>
                    {weeklyRevenue.length ? weeklyRevenue.map((item) => (
                      <Flex key={`rev-week-${item.label}`} justify="space-between">
                        <Text fontSize="sm">{item.label}</Text>
                        <Text fontSize="sm" fontWeight="semibold">{formatEtb(item.total)}</Text>
                      </Flex>
                    )) : (
                      <Text fontSize="sm" color="gray.500">No weekly revenue recorded yet.</Text>
                    )}
                  </VStack>
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" color="gray.500">Expenses</Text>
                    {weeklyExpenses.length ? weeklyExpenses.map((item) => (
                      <Flex key={`exp-week-${item.label}`} justify="space-between">
                        <Text fontSize="sm">{item.label}</Text>
                        <Text fontSize="sm" fontWeight="semibold">{formatEtb(item.total)}</Text>
                      </Flex>
                    )) : (
                      <Text fontSize="sm" color="gray.500">No weekly expenses recorded yet.</Text>
                    )}
                  </VStack>
                </SimpleGrid>
              </CardBody>
            </Card>
            <Card bg={cardBg} boxShadow="md">
              <CardHeader>
                <Heading as="h2" size="md">Monthly Revenue & Expenses</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" color="gray.500">Revenue</Text>
                    {monthlyRevenue.length ? monthlyRevenue.map((item) => (
                      <Flex key={`rev-month-${item.label}`} justify="space-between">
                        <Text fontSize="sm">{item.label}</Text>
                        <Text fontSize="sm" fontWeight="semibold">{formatEtb(item.total)}</Text>
                      </Flex>
                    )) : (
                      <Text fontSize="sm" color="gray.500">No monthly revenue data yet.</Text>
                    )}
                  </VStack>
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" color="gray.500">Expenses</Text>
                    {monthlyExpensesList.length ? monthlyExpensesList.map((item) => (
                      <Flex key={`exp-month-${item.label}`} justify="space-between">
                        <Text fontSize="sm">{item.label}</Text>
                        <Text fontSize="sm" fontWeight="semibold">{formatEtb(item.total)}</Text>
                      </Flex>
                    )) : (
                      <Text fontSize="sm" color="gray.500">No monthly expenses recorded yet.</Text>
                    )}
                  </VStack>
                </SimpleGrid>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}
      </Box>
    </FinanceLayout>
  );
};

export default FinanceReportsPage;
