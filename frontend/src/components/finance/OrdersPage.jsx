import React, { useEffect, useState } from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Button, Text, Badge, HStack, Input, Select, Flex, Heading, useColorModeValue } from '@chakra-ui/react';
import { getOrders, fulfillOrder, exportOrders, bulkFulfill } from '../../services/financeService';
import OrderDetailsModal from './OrderDetailsModal';
import OrderDetailsDrawer from './OrderDetailsDrawer';
import FinanceLayout from './FinanceLayout';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState({ status: 'all', q: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const opts = { page, limit: pageSize };
      if (filter.status && filter.status !== 'all') opts.status = filter.status;
      if (filter.q) opts.q = filter.q;
      const res = await getOrders(opts);
      if (res && res.data) {
        setOrders(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.pages || 1);
        setPage(res.page || page);
      } else {
        setOrders(res || []);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, pageSize, filter.status, filter.q]);

  const handleFulfill = async (order) => {
    if (!order || !order._id) return;
    try {
      await fulfillOrder(order.followup?._id, order._id);
      // reload
      await load();
    } catch (err) {
      console.error('Fulfill failed', err);
      alert(err?.response?.data?.message || 'Fulfill failed');
    }
  };

  const openDetails = (order) => {
    setSelectedOrder(order);
    // open drawer instead of modal
    setModalOpen(true);
  };

  const toggleSelect = (orderId) => {
    setSelectedIds(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
  };

  const selectAll = (checked) => {
    if (checked) setSelectedIds((orders || []).map(o => o._id));
    else setSelectedIds([]);
  };

  const handleBulkFulfill = async () => {
    if (!selectedIds.length) return alert('No orders selected');
    if (!confirm(`Fulfill ${selectedIds.length} orders? This will decrement stock.`)) return;
    try {
      await bulkFulfill(selectedIds);
      setSelectedIds([]);
      await load();
      alert('Bulk fulfill completed');
    } catch (err) {
      console.error('Bulk fulfill failed', err);
      alert(err?.response?.data?.message || 'Bulk fulfill failed');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportOrders({ status: filter.status === 'all' ? undefined : filter.status, q: filter.q || undefined });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      alert(err?.response?.data?.message || 'Export failed');
    }
  };

  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'agent' : 'agent';

  const displayed = orders;

  return (
    <FinanceLayout>
      <Box>
        <Heading size="lg" mb={2}>Orders</Heading>
        <Text color={useColorModeValue('gray.600','gray.400')} mb={4}>Manage reservations and fulfill orders coming from Sales</Text>
      <Flex mb={4} gap={2}>
        <Input placeholder="Search orders or followup" value={filter.q} onChange={(e) => setFilter(f => ({ ...f, q: e.target.value }))} />
        <Select w="200px" value={filter.status} onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="fulfilled">Fulfilled</option>
        </Select>
        <Button onClick={load}>Refresh</Button>
        <Button colorScheme="blue" onClick={handleExport}>Export CSV</Button>
        {(userRole === 'finance' || userRole === 'admin') && <Button colorScheme="green" onClick={handleBulkFulfill} isDisabled={!selectedIds.length}>Bulk Fulfill ({selectedIds.length})</Button>}
      </Flex>

      <Table size="sm">
        <Thead>
          <Tr>
            <Th><input type="checkbox" onChange={(e) => selectAll(e.target.checked)} checked={selectedIds.length === orders.length && orders.length > 0} /></Th>
            <Th>Order ID</Th>
            <Th>Followup</Th>
            <Th>Status</Th>
            <Th>Lines</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {displayed.map(o => (
            <Tr key={o._id}>
              <Td><input type="checkbox" checked={selectedIds.includes(o._id)} onChange={() => toggleSelect(o._id)} /></Td>
              <Td>{o._id}</Td>
              <Td>{o.followup?.clientName || o.followup?._id || '—'}</Td>
              <Td><Badge colorScheme={o.status === 'fulfilled' ? 'green' : o.status === 'partial' ? 'yellow' : 'gray'}>{o.status}</Badge></Td>
              <Td>
                {o.lines && o.lines.map(l => (
                  <Box key={l._id} mb={2}>
                    <Text fontSize="sm">{l.item?.name || l.item} — requested: {l.requestedQty} allocated: {l.allocatedQty}</Text>
                    <Text fontSize="xs" color="gray.600">{(l.allocations || []).map(a => `${a.amount} from ${a.source}`).join(', ')}</Text>
                  </Box>
                ))}
              </Td>
              <Td>
                <HStack>
                  <Button size="sm" onClick={() => openDetails(o)}>Details</Button>
                  {o.status !== 'fulfilled' && <Button size="sm" colorScheme="green" onClick={() => handleFulfill(o)} isDisabled={!(userRole === 'finance' || userRole === 'admin')}>Fulfill</Button>}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Flex mt={4} justify="space-between" align="center">
        <HStack>
          <Button size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} isDisabled={page === 1}>Prev</Button>
          <Text>Page {page} / {totalPages}</Text>
          <Button size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} isDisabled={page === totalPages}>Next</Button>
        </HStack>
        <HStack>
          <Text>Page size</Text>
          <Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} w="100px">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </Select>
        </HStack>
      </Flex>

      {/* Use drawer for ERP-style details */}
      <OrderDetailsDrawer isOpen={modalOpen} onClose={() => setModalOpen(false)} order={selectedOrder} onFulfilled={async () => { await handleFulfill(selectedOrder); setModalOpen(false); }} />
      </Box>
    </FinanceLayout>
  );
};

export default OrdersPage;
