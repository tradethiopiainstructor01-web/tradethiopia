import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  Box,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Divider,
  Flex,
  useToast,
  Select,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  VStack,
  HStack
} from '@chakra-ui/react';
import axios from '../../services/axiosInstance';

const OrderDetailsDrawer = ({ isOpen, onClose, orderId, onStatusUpdate }) => {
  // Financial Configuration
  const FINANCIAL_CONFIG = {
    VAT_RATE: 0.15, // 15% VAT
    WITHHOLDING_THRESHOLD: 10000, // 10,000 ETB threshold
    WITHHOLDING_RATE: 0.03, // 3% withholding tax
    PROFIT_MARGIN: 0.20 // 20% profit margin
  };

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const toast = useToast();

  // Fetch order details
  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/orders/${orderId}`);
      setOrder(response.data);
      setNewStatus(response.data.status);
      setNotes(response.data.notes || '');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch order details',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order.status) {
      onClose();
      return;
    }

    // If trying to deliver the order, check if payment is complete
    if (newStatus === 'Delivered') {
      const orderTotal = order.totalAmount || 0;
      const paymentAmount = order.paymentAmount || 0;
      
      // For any payment type, full payment must be made before delivery
      if (paymentAmount < orderTotal) {
        toast({
          title: 'Full Payment Required',
          description: `Full payment of ETB ${orderTotal.toLocaleString()} is required before delivery. Current payment: ETB ${paymentAmount.toLocaleString()}. Balance due: ETB ${(orderTotal - paymentAmount).toLocaleString()}`,
          status: 'warning',
          duration: 5000,
          isClosable: true
        });
        return;
      }
    }

    try {
      await axios.put(`/orders/${orderId}`, {
        status: newStatus,
        notes: notes
      });
      
      toast({
        title: 'Success',
        description: 'Order status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Refresh order details
      fetchOrderDetails();
      
      // Notify parent component
      if (onStatusUpdate) {
        onStatusUpdate(orderId, newStatus);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Calculate order profit (now using actual payment amount)
  const calculateOrderProfit = (order) => {
    // Gross profit is the actual payment received from the customer
    return order.paymentAmount || 0;
  };

  // Calculate VAT with configurable rate
  const calculateVAT = (amount) => {
    return amount * FINANCIAL_CONFIG.VAT_RATE;
  };

  // Calculate Withholding Tax with threshold and variable rates
  const calculateWithholdingTax = (amount) => {
    // Ethiopian withholding tax rules:
    // 3% for amounts >= 10,000 ETB
    // 0% for amounts < 10,000 ETB
    if (amount >= FINANCIAL_CONFIG.WITHHOLDING_THRESHOLD) {
      return amount * FINANCIAL_CONFIG.WITHHOLDING_RATE;
    }
    return 0;
  };

  // Calculate Net Profit (what the business actually earns)
  const calculateNetProfit = (order) => {
    const grossProfit = calculateOrderProfit(order);
    const vat = calculateVAT(order.totalAmount);
    const withholdingTax = calculateWithholdingTax(order.totalAmount);
    return grossProfit - vat - withholdingTax;
  };

  // Calculate Revenue After Tax (what the business actually receives)
  const calculateRevenueAfterTax = (order) => {
    const vat = calculateVAT(order.totalAmount);
    const withholdingTax = calculateWithholdingTax(order.totalAmount);
    return order.totalAmount - vat - withholdingTax;
  };

  if (!order) {
    return null;
  }

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton size="sm" />
        <DrawerHeader py={3} px={4}>
          <Text fontSize="sm" fontWeight="bold">Order Details</Text>
          <Text fontSize="2xs" color="gray.500">#{order._id.substring(0, 8)}</Text>
        </DrawerHeader>

        <DrawerBody py={2} px={3}>
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <>
              {/* Order Summary - Compact */}
              <Card size="sm" mb={3}>
                <CardHeader py={2} px={3}>
                  <Text fontSize="xs" fontWeight="bold">Order Summary</Text>
                </CardHeader>
                <CardBody py={2} px={3}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Box>
                      <Text fontSize="2xs" color="gray.500">Status</Text>
                      <Badge 
                        fontSize="2xs"
                        colorScheme={
                          order.status === 'Pending' ? 'orange' :
                          order.status === 'Confirmed' ? 'blue' :
                          order.status === 'Processing' ? 'yellow' :
                          order.status === 'Shipped' ? 'purple' :
                          order.status === 'Delivered' ? 'green' : 'red'
                        }
                      >
                        {order.status}
                      </Badge>
                    </Box>
                    
                    <Box>
                      <Text fontSize="2xs" color="gray.500">Created</Text>
                      <Text fontSize="2xs">{new Date(order.createdAt).toLocaleDateString()}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="2xs" color="gray.500">Payment</Text>
                      <Badge 
                        fontSize="2xs"
                        colorScheme={
                          order.paymentType === 'Advance' ? 'purple' :
                          order.paymentType === 'Half' ? 'yellow' : 'green'
                        }>
                        {order.paymentType}
                      </Badge>
                    </Box>
                    
                    <Box>
                      <Text fontSize="2xs" color="gray.500">Payment Status</Text>
                      <Badge 
                        fontSize="2xs"
                        colorScheme={
                          order.paymentAmount >= order.totalAmount ? 'green' :
                          order.paymentAmount > 0 ? 'yellow' : 'red'
                        }>
                        {order.paymentAmount >= order.totalAmount ? 'Fully Paid' :
                         order.paymentAmount > 0 ? 'Partially Paid' : 'Unpaid'}
                      </Badge>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Financial Details - Compact */}
              <Card size="sm" mb={3}>
                <CardHeader py={2} px={3}>
                  <Text fontSize="xs" fontWeight="bold">Financial Details</Text>
                </CardHeader>
                <CardBody py={2} px={3}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                    <Stat>
                      <StatLabel fontSize="2xs">Order Total</StatLabel>
                      <StatNumber fontSize="sm">ETB {order.totalAmount.toLocaleString()}</StatNumber>
                      <Text fontSize="2xs" color="gray.500">
                        Total amount customer should pay
                      </Text>
                    </Stat>
                    
                    <Stat>
                      <StatLabel fontSize="2xs">Amount Paid</StatLabel>
                      <StatNumber 
                        fontSize="sm"
                        color={order.paymentAmount >= order.totalAmount ? 'green.500' : 'red.500'}>
                        ETB {order.paymentAmount.toLocaleString()}
                      </StatNumber>
                      {order.totalAmount > 0 && (
                        <Text fontSize="2xs" color={order.paymentAmount >= order.totalAmount ? 'green.500' : 'red.500'}>
                          Balance: ETB {(order.totalAmount - (order.paymentAmount || 0)).toLocaleString()}
                        </Text>
                      )}
                    </Stat>
                  </SimpleGrid>
                  
                  <Divider my={2} />
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Stat>
                      <StatLabel fontSize="2xs">Gross Revenue</StatLabel>
                      <StatNumber fontSize="xs">ETB {(order.paymentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
                      <Text fontSize="2xs" color="gray.500">
                        Actual payment received
                      </Text>
                    </Stat>
                    
                    <Stat>
                      <StatLabel fontSize="2xs">VAT ({(FINANCIAL_CONFIG.VAT_RATE * 100).toFixed(0)}%)</StatLabel>
                      <StatNumber fontSize="xs">ETB {calculateVAT(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
                      <Text fontSize="2xs" color="gray.500">
                        Government tax on sales
                      </Text>
                    </Stat>
                    
                    <Stat>
                      <StatLabel fontSize="2xs">Withholding Tax</StatLabel>
                      <StatNumber fontSize="xs">ETB {calculateWithholdingTax(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
                      {order.totalAmount >= FINANCIAL_CONFIG.WITHHOLDING_THRESHOLD ? (
                        <Text fontSize="2xs" color="gray.500">
                          {(FINANCIAL_CONFIG.WITHHOLDING_RATE * 100).toFixed(0)}% of ETB {order.totalAmount.toLocaleString()}
                        </Text>
                      ) : (
                        <Text fontSize="2xs" color="gray.500">
                          Below ETB {FINANCIAL_CONFIG.WITHHOLDING_THRESHOLD.toLocaleString()} threshold
                        </Text>
                      )}
                    </Stat>
                    
                    <Stat>
                      <StatLabel fontSize="2xs">Net Revenue</StatLabel>
                      <StatNumber fontSize="xs" color="green.500">ETB {calculateNetProfit(order).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
                      <Text fontSize="2xs" color="gray.500">
                        (Gross Revenue - VAT - Withholding)
                      </Text>
                    </Stat>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Customer & Agent - Compact Side by Side */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                <Card size="sm">
                  <CardHeader py={2} px={3}>
                    <Text fontSize="xs" fontWeight="bold">Customer</Text>
                  </CardHeader>
                  <CardBody py={2} px={3}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" fontWeight="medium">{order.customerName}</Text>
                      {order.customerEmail && <Text fontSize="2xs">{order.customerEmail}</Text>}
                      {order.customerPhone && <Text fontSize="2xs">{order.customerPhone}</Text>}
                    </VStack>
                  </CardBody>
                </Card>
                
                <Card size="sm">
                  <CardHeader py={2} px={3}>
                    <Text fontSize="xs" fontWeight="bold">Sales Agent</Text>
                  </CardHeader>
                  <CardBody py={2} px={3}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" fontWeight="medium">{order.salesAgent?.name}</Text>
                      {order.salesAgent?.email && <Text fontSize="2xs">{order.salesAgent.email}</Text>}
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Order Items - Compact */}
              <Card size="sm" mb={3}>
                <CardHeader py={2} px={3}>
                  <Text fontSize="xs" fontWeight="bold">Order Items</Text>
                </CardHeader>
                <CardBody py={2} px={2}>
                  <TableContainer>
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th px={2} py={1} fontSize="2xs">Item</Th>
                          <Th px={2} py={1} fontSize="2xs">SKU</Th>
                          <Th px={2} py={1} fontSize="2xs" isNumeric>Qty</Th>
                          <Th px={2} py={1} fontSize="2xs" isNumeric>Price</Th>
                          <Th px={2} py={1} fontSize="2xs" isNumeric>Total</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {order.items.map((item, index) => (
                          <Tr key={index} fontSize="2xs">
                            <Td px={2} py={1}>{item.name}</Td>
                            <Td px={2} py={1}>{item.sku}</Td>
                            <Td px={2} py={1} isNumeric>{item.quantity}</Td>
                            <Td px={2} py={1} isNumeric>{item.unitPrice.toLocaleString()}</Td>
                            <Td px={2} py={1} isNumeric>{item.totalPrice.toLocaleString()}</Td>
                          </Tr>
                        ))}
                        <Tr>
                          <Td colSpan={4} px={2} py={1} fontWeight="bold" fontSize="2xs">Order Total</Td>
                          <Td px={2} py={1} isNumeric fontWeight="bold" fontSize="2xs">
                            ETB {order.totalAmount.toLocaleString()}
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>

              {/* Notes */}
              {order.notes && (
                <Card size="sm" mb={3}>
                  <CardHeader py={2} px={3}>
                    <Text fontSize="xs" fontWeight="bold">Order Notes</Text>
                  </CardHeader>
                  <CardBody py={2} px={3}>
                    <Text fontSize="2xs">{order.notes}</Text>
                  </CardBody>
                </Card>
              )}

              {/* Status Update Form - Compact */}
              <Card size="sm">
                <CardHeader py={2} px={3}>
                  <Text fontSize="xs" fontWeight="bold">Update Order Status</Text>
                </CardHeader>
                <CardBody py={2} px={3}>
                  <FormControl mb={3}>
                    <FormLabel fontSize="2xs">Status</FormLabel>
                    <Select
                      size="sm"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl mb={3}>
                    <FormLabel fontSize="2xs">Notes</FormLabel>
                    <Textarea
                      size="sm"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this status update"
                      fontSize="2xs"
                    />
                  </FormControl>
                </CardBody>
              </Card>
            </>
          )}
        </DrawerBody>

        <DrawerFooter py={3} px={4}>
          <Button size="sm" variant="outline" mr={2} onClick={onClose}>
            Close
          </Button>
          <Button 
            size="sm"
            colorScheme="teal" 
            onClick={handleStatusUpdate}
            isDisabled={newStatus === order.status}
          >
            Update Status
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default OrderDetailsDrawer;