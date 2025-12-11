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
import { getMetrics, getOrders, getDemands } from '../../services/financeService';
import AgentSalesReport from './AgentSalesReport';

const FinanceDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openOrders, setOpenOrders] = useState(0);
  const [openDemands, setOpenDemands] = useState(0);

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
  return (
    <>
      <Box mb={6}>
        <Heading size="lg">Finance Overview</Heading>
        <Text color="gray.600">Key finance metrics and quick actions</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Revenue</StatLabel>
              <StatNumber>${metrics ? (metrics.totalRevenue || 0).toLocaleString() : '0'}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" /> 12% vs last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Outstanding Invoices</StatLabel>
              <StatNumber>${metrics ? (metrics.outstandingInvoices || 0).toLocaleString() : '0'}</StatNumber>
              <StatHelpText>
                <StatArrow type="decrease" /> 4% vs last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Stock Value</StatLabel>
              <StatNumber>${metrics ? (metrics.stockValue || 0).toLocaleString() : '0'}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" /> 3% this month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Box mb={6}>
        <Heading size="md" mb={3}>Quick Actions</Heading>
        <HStack spacing={3}>
          <Button as={Link} to="/finance/inventory" colorScheme="teal">Manage Inventory</Button>
          <Button as={Link} to="/finance/orders" colorScheme="purple">Manage Orders {openOrders ? `(${openOrders})` : ''}</Button>
          <Button as={Link} to="/finance/demands" colorScheme="orange">View Demands {openDemands ? `(${openDemands})` : ''}</Button>
          <Button colorScheme="blue">Create Invoice</Button>
          <Button colorScheme="gray">View Reports</Button>
        </HStack>
      </Box>

      {/* Agent Sales Report Section */}
      <Box mb={8}>
        <AgentSalesReport />
      </Box>

      <Box>
        <Heading size="md" mb={3}>Activity</Heading>
        <VStack spacing={3} align="stretch">
          <Card>
            <CardBody>
              <Text fontWeight="semibold">Recent stock adjustments</Text>
              <Text fontSize="sm" color="gray.500">No recent adjustments</Text>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Text fontWeight="semibold">Payment status</Text>
              <Text fontSize="sm" color="gray.500">All payments processed</Text>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </>
  );
};

export default FinanceDashboard;
