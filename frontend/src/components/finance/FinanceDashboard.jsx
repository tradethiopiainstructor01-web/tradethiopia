import React from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Card,
  CardBody
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getMetrics, getOrders, getDemands, getFinanceSummary } from '../../services/financeService';
import AgentSalesReport from './AgentSalesReport';
import FinancePayrollTable from './FinancePayrollTable';

const FinanceDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openOrders, setOpenOrders] = useState(0);
  const [openDemands, setOpenDemands] = useState(0);
  const [financeSummary, setFinanceSummary] = useState(null);

  const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return `$${number.toLocaleString()}`;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getMetrics();
        setMetrics(data);
        // load orders/demands counts
        try {
          const res = await getOrders({ page: 1, limit: 1000 });
          const orders = res && res.data ? res.data : (res || []);
          setOpenOrders((orders || []).filter(o => o.status !== 'fulfilled').length);
        } catch (e) { console.warn('failed to load orders count', e); }
        try {
          const demands = await getDemands();
          setOpenDemands((demands || []).filter(d => d.status === 'open').length);
        } catch (e) { console.warn('failed to load demands count', e); }
      } catch (err) {
        console.error('Failed to load metrics', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadFinanceSummary = async () => {
      try {
        const data = await getFinanceSummary();
        setFinanceSummary(data);
      } catch (err) {
        console.warn('Failed to load finance summary', err);
      } finally {
      }
    };
    loadFinanceSummary();
  }, []);
  return (
    <>
      <Box mb={3}>
        <Heading size="xs">Finance Overview</Heading>
        <Text fontSize="xs" color="gray.600">Key finance metrics and quick actions</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2} mb={3}>
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="xs">Total Revenue</StatLabel>
              <StatNumber fontSize="sm">
                {financeSummary ? formatCurrency(financeSummary.revenue) : '$0'}
              </StatNumber>
              <StatHelpText fontSize="xs">
                {financeSummary ? (
                  <>
                    <StatArrow type="increase" />
                    {' '}
                    {`Follow-ups ${formatCurrency(financeSummary.followupRevenue)} | Orders ${formatCurrency(financeSummary.orderRevenue)} | Packages ${formatCurrency(financeSummary.packageRevenue)}`}
                  </>
                ) : (
                  <>
                    <StatArrow type="increase" />
                    {' '}
                    loading...
                  </>
                )}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="xs">Expenses (recorded)</StatLabel>
              <StatNumber fontSize="sm">
                {financeSummary ? formatCurrency(financeSummary.totalCostsRecorded || financeSummary.expenses) : '$0'}
              </StatNumber>
              <StatHelpText fontSize="xs">
                Payroll spend: {financeSummary ? formatCurrency(financeSummary.payrollCost) : '$0'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="xs">Net Profit</StatLabel>
              <StatNumber fontSize="sm">
                {financeSummary ? formatCurrency(financeSummary.profit) : '$0'}
              </StatNumber>
              <StatHelpText fontSize="xs">
                {financeSummary ? 'Revenue - Expenses' : 'Loading...'}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} mb={3}>
        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="xs">Outstanding Invoices</StatLabel>
              <StatNumber fontSize="sm">${metrics ? (metrics.outstandingInvoices || 0).toLocaleString() : '0'}</StatNumber>
              <StatHelpText fontSize="xs">
                <StatArrow type="decrease" /> 4% vs last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card size="sm">
          <CardBody py={2} px={3}>
            <Stat>
              <StatLabel fontSize="xs">Stock Value</StatLabel>
              <StatNumber fontSize="sm">${metrics ? (metrics.stockValue || 0).toLocaleString() : '0'}</StatNumber>
              <StatHelpText fontSize="xs">
                <StatArrow type="increase" /> 3% this month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Box mb={3}>
        <Heading size="xs" mb={2}>Quick Actions</Heading>
        <HStack spacing={1} flexWrap="wrap">
          <Button as={Link} to="/finance/inventory" colorScheme="teal" size="xs" height="24px" minH="unset">Manage Inventory</Button>
          <Button as={Link} to="/finance/orders" colorScheme="purple" size="xs" height="24px" minH="unset">Manage Orders {openOrders ? `(${openOrders})` : ''}</Button>
          <Button as={Link} to="/finance/demands" colorScheme="orange" size="xs" height="24px" minH="unset">View Demands {openDemands ? `(${openDemands})` : ''}</Button>
          <Button colorScheme="blue" size="xs" height="24px" minH="unset">Create Invoice</Button>
          <Button colorScheme="gray" size="xs" height="24px" minH="unset">View Reports</Button>
        </HStack>
      </Box>

      {/* Agent Sales Report Section */}
      <Box mb={4}>
        <AgentSalesReport />
      </Box>

      <Box mb={3}>
        <Heading size="xs" mb={2}>Activity</Heading>
        <VStack spacing={2} align="stretch">
          <Card size="sm">
            <CardBody py={2} px={3}>
              <Text fontWeight="semibold" fontSize="sm">Recent stock adjustments</Text>
              <Text fontSize="xs" color="gray.500">No recent adjustments</Text>
            </CardBody>
          </Card>

          <Card size="sm">
            <CardBody py={2} px={3}>
              <Text fontWeight="semibold" fontSize="sm">Payment status</Text>
              <Text fontSize="xs" color="gray.500">All payments processed</Text>
            </CardBody>
          </Card>
        </VStack>
      </Box>

      <Box mt={4}>
        <Heading size="xs" mb={2}>Payroll Snapshot</Heading>
        <FinancePayrollTable />
      </Box>
    </>
  );
};

export default FinanceDashboard;
