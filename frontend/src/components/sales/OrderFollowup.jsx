import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useToast,
  IconButton,
  Badge,
  Spinner,
  InputGroup,
  InputLeftElement,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Checkbox,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  CheckIcon, 
  CloseIcon,
  ChevronDownIcon
} from '@chakra-ui/icons';
import axios from 'axios';

const OrderFollowup = () => {
  const [orders, setOrders] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    items: [],
    notes: ''
  });
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const toast = useToast();

  // Fetch orders, stock items, and customers
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders`);
      setOrders(ordersResponse.data);
      
      // Fetch stock items
      const stockResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/stock`);
      setStockItems(stockResponse.data);
      
      // Fetch customers
      const customersResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/sales-customers`);
      setCustomers(customersResponse.data);
    } catch (err) {
      setError('Failed to fetch data');
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch order statistics
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0
  });

  const fetchOrderStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/stats`);
      setOrderStats(response.data);
    } catch (err) {
      console.error('Failed to fetch order stats');
    }
  };

  useEffect(() => {
    fetchOrderStats();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle customer selection
  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    const customer = customers.find(c => c._id === customerId);
    
    setFormData({
      ...formData,
      customerId,
      customerName: customer ? customer.customerName : ''
    });
  };

  // Add item to order
  const addItemToOrder = () => {
    if (!selectedStockItem || itemQuantity <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please select an item and enter a valid quantity',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    // Check if item already exists in order
    const existingItemIndex = formData.items.findIndex(
      item => item.stockItemId === selectedStockItem._id
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += itemQuantity;
      updatedItems[existingItemIndex].totalPrice = 
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      
      setFormData({
        ...formData,
        items: updatedItems
      });
    } else {
      // Add new item
      const newItem = {
        stockItemId: selectedStockItem._id,
        name: selectedStockItem.name,
        sku: selectedStockItem.sku,
        quantity: itemQuantity,
        unitPrice: selectedStockItem.price,
        totalPrice: selectedStockItem.price * itemQuantity
      };

      setFormData({
        ...formData,
        items: [...formData.items, newItem]
      });
    }

    // Reset selection
    setSelectedStockItem(null);
    setItemQuantity(1);
  };

  // Remove item from order
  const removeItemFromOrder = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerId || formData.items.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select a customer and add at least one item',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    try {
      if (isEditing) {
        // For editing, we'll just update the status/notes
        await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${currentOrderId}`, {
          status: formData.status,
          notes: formData.notes
        });
        toast({
          title: 'Success',
          description: 'Order updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        // Create new order
        await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, formData);
        toast({
          title: 'Success',
          description: 'Order created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
      
      // Reset form and refresh data
      setFormData({
        customerId: '',
        customerName: '',
        items: [],
        notes: ''
      });
      setIsEditing(false);
      setCurrentOrderId(null);
      onClose();
      fetchData();
      fetchOrderStats();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save order',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Handle edit action
  const handleEdit = (order) => {
    setFormData({
      customerId: order.customerId._id || order.customerId,
      customerName: order.customerName,
      items: order.items,
      notes: order.notes || '',
      status: order.status
    });
    setIsEditing(true);
    setCurrentOrderId(order._id);
    onOpen();
  };

  // Handle view order details
  const handleViewOrder = (order) => {
    setFormData({
      customerId: order.customerId._id || order.customerId,
      customerName: order.customerName,
      items: order.items,
      notes: order.notes || '',
      status: order.status
    });
    setCurrentOrderId(order._id);
    onViewOpen();
  };

  // Handle delete action
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/orders/${id}`);
        toast({
          title: 'Success',
          description: 'Order deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        fetchData();
        fetchOrderStats();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to delete order',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    }
  };

  // Handle status update
  const handleStatusUpdate = async (orderId, status) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}`, {
        status
      });
      toast({
        title: 'Success',
        description: 'Order status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      fetchData();
      fetchOrderStats();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Open modal for new order
  const handleAddNewOrder = () => {
    setFormData({
      customerId: '',
      customerName: '',
      items: [],
      notes: ''
    });
    setIsEditing(false);
    setCurrentOrderId(null);
    onOpen();
  };

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus ? order.status === selectedStatus : true;
    return matchesSearch && matchesStatus;
  });

  // Calculate order total
  const calculateOrderTotal = (items) => {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="lg" color="teal.600">
          Order Follow-up
        </Heading>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="teal" 
          onClick={handleAddNewOrder}
        >
          Create New Order
        </Button>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
        <Stat>
          <StatLabel>Total Orders</StatLabel>
          <StatNumber>{orderStats.totalOrders}</StatNumber>
        </Stat>
        
        <Stat>
          <StatLabel>Pending Orders</StatLabel>
          <StatNumber color="orange.500">{orderStats.pendingOrders}</StatNumber>
        </Stat>
        
        <Stat>
          <StatLabel>Confirmed Orders</StatLabel>
          <StatNumber color="blue.500">{orderStats.confirmedOrders}</StatNumber>
        </Stat>
        
        <Stat>
          <StatLabel>Total Revenue</StatLabel>
          <StatNumber>ETB {orderStats.totalRevenue.toLocaleString()}</StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Search and Filter Controls */}
      <Card mb={6}>
        <CardBody>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <InputGroup flex="1">
              <InputLeftElement pointerEvents='none'>
                <SearchIcon color='gray.300' />
              </InputLeftElement>
              <Input
                placeholder="Search by customer name or order ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select 
              placeholder="Filter by status" 
              flex="1"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
            
            <Button 
              colorScheme="red" 
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('');
              }}
            >
              Clear Filters
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <Heading as="h3" size="md">Orders</Heading>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Order ID</Th>
                  <Th>Customer</Th>
                  <Th>Items</Th>
                  <Th isNumeric>Total (ETB)</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <Tr key={order._id}>
                      <Td>
                        <Text fontWeight="bold">#{order._id.substring(0, 8)}</Text>
                      </Td>
                      <Td>
                        <Text fontWeight="medium">{order.customerName}</Text>
                      </Td>
                      <Td>
                        <Flex direction="column">
                          {order.items.slice(0, 2).map((item, index) => (
                            <Text key={index} fontSize="sm">
                              {item.name} x {item.quantity}
                            </Text>
                          ))}
                          {order.items.length > 2 && (
                            <Text fontSize="sm" color="gray.500">
                              +{order.items.length - 2} more items
                            </Text>
                          )}
                        </Flex>
                      </Td>
                      <Td isNumeric>
                        {calculateOrderTotal(order.items).toLocaleString()}
                      </Td>
                      <Td>
                        <Badge 
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
                      </Td>
                      <Td>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Td>
                      <Td>
                        <Flex gap={2}>
                          <Button 
                            size="sm" 
                            colorScheme="teal" 
                            onClick={() => handleViewOrder(order)}
                          >
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            colorScheme="blue" 
                            onClick={() => handleEdit(order)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            colorScheme="red" 
                            onClick={() => handleDelete(order._id)}
                          >
                            Delete
                          </Button>
                        </Flex>
                        
                        {/* Status Update Buttons */}
                        <Flex gap={1} mt={2} wrap="wrap">
                          {order.status !== 'Confirmed' && (
                            <Button 
                              size="xs" 
                              colorScheme="blue" 
                              onClick={() => handleStatusUpdate(order._id, 'Confirmed')}
                            >
                              Confirm
                            </Button>
                          )}
                          {order.status !== 'Processing' && (
                            <Button 
                              size="xs" 
                              colorScheme="yellow" 
                              onClick={() => handleStatusUpdate(order._id, 'Processing')}
                            >
                              Process
                            </Button>
                          )}
                          {order.status !== 'Shipped' && (
                            <Button 
                              size="xs" 
                              colorScheme="purple" 
                              onClick={() => handleStatusUpdate(order._id, 'Shipped')}
                            >
                              Ship
                            </Button>
                          )}
                          {order.status !== 'Delivered' && (
                            <Button 
                              size="xs" 
                              colorScheme="green" 
                              onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                            >
                              Deliver
                            </Button>
                          )}
                        </Flex>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} textAlign="center">
                      <Text>No orders found</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Create/Edit Order Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="600px">
          <ModalHeader>
            {isEditing ? 'Edit Order' : 'Create New Order'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Tabs>
                <TabList>
                  <Tab>Order Details</Tab>
                  <Tab>Items</Tab>
                </TabList>
                
                <TabPanels>
                  <TabPanel>
                    <Flex direction="column" gap={4}>
                      <FormControl isRequired>
                        <FormLabel>Customer</FormLabel>
                        <Select
                          name="customerId"
                          value={formData.customerId}
                          onChange={handleCustomerChange}
                          placeholder="Select customer"
                        >
                          {customers.map((customer) => (
                            <option key={customer._id} value={customer._id}>
                              {customer.customerName}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Notes</FormLabel>
                        <Input
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Enter any notes for this order"
                        />
                      </FormControl>
                      
                      {isEditing && (
                        <FormControl>
                          <FormLabel>Status</FormLabel>
                          <Select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </Select>
                        </FormControl>
                      )}
                    </Flex>
                  </TabPanel>
                  
                  <TabPanel>
                    <Flex direction="column" gap={4}>
                      {!isEditing && (
                        <>
                          <Flex gap={2}>
                            <Select
                              flex="1"
                              placeholder="Select item"
                              value={selectedStockItem?._id || ''}
                              onChange={(e) => {
                                const item = stockItems.find(i => i._id === e.target.value);
                                setSelectedStockItem(item || null);
                              }}
                            >
                              {stockItems.map((item) => (
                                <option key={item._id} value={item._id}>
                                  {item.name} - ETB {item.price} ({item.sku})
                                </option>
                              ))}
                            </Select>
                            
                            <Input
                              type="number"
                              min="1"
                              value={itemQuantity}
                              onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                              width="100px"
                            />
                            
                            <Button 
                              onClick={addItemToOrder}
                              colorScheme="teal"
                            >
                              Add
                            </Button>
                          </Flex>
                          
                          <Divider />
                        </>
                      )}
                      
                      {formData.items.length > 0 ? (
                        <TableContainer>
                          <Table size="sm">
                            <Thead>
                              <Tr>
                                <Th>Item</Th>
                                <Th>SKU</Th>
                                <Th isNumeric>Qty</Th>
                                <Th isNumeric>Price</Th>
                                <Th isNumeric>Total</Th>
                                {!isEditing && <Th>Actions</Th>}
                              </Tr>
                            </Thead>
                            <Tbody>
                              {formData.items.map((item, index) => (
                                <Tr key={index}>
                                  <Td>{item.name}</Td>
                                  <Td>{item.sku}</Td>
                                  <Td isNumeric>{item.quantity}</Td>
                                  <Td isNumeric>{item.unitPrice.toLocaleString()}</Td>
                                  <Td isNumeric>{item.totalPrice.toLocaleString()}</Td>
                                  {!isEditing && (
                                    <Td>
                                      <IconButton
                                        aria-label="Remove item"
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        colorScheme="red"
                                        onClick={() => removeItemFromOrder(index)}
                                      />
                                    </Td>
                                  )}
                                </Tr>
                              ))}
                              <Tr>
                                <Td colSpan={4} fontWeight="bold">Total</Td>
                                <Td isNumeric fontWeight="bold">
                                  ETB {calculateOrderTotal(formData.items).toLocaleString()}
                                </Td>
                                <Td></Td>
                              </Tr>
                            </Tbody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Text textAlign="center" color="gray.500" py={4}>
                          No items added to this order
                        </Text>
                      )}
                    </Flex>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="teal" 
                type="submit"
              >
                {isEditing ? 'Update Order' : 'Create Order'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* View Order Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="600px">
          <ModalHeader>Order Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" gap={4}>
              <Flex justify="space-between">
                <Box>
                  <Text fontWeight="bold">Order ID:</Text>
                  <Text>#{currentOrderId?.substring(0, 8)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Date:</Text>
                  <Text>{new Date().toLocaleDateString()}</Text>
                </Box>
              </Flex>
              
              <Divider />
              
              <Box>
                <Text fontWeight="bold">Customer:</Text>
                <Text>{formData.customerName}</Text>
              </Box>
              
              <Box>
                <Text fontWeight="bold">Items:</Text>
                <TableContainer mt={2}>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Item</Th>
                        <Th>SKU</Th>
                        <Th isNumeric>Qty</Th>
                        <Th isNumeric>Price</Th>
                        <Th isNumeric>Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {formData.items.map((item, index) => (
                        <Tr key={index}>
                          <Td>{item.name}</Td>
                          <Td>{item.sku}</Td>
                          <Td isNumeric>{item.quantity}</Td>
                          <Td isNumeric>{item.unitPrice.toLocaleString()}</Td>
                          <Td isNumeric>{item.totalPrice.toLocaleString()}</Td>
                        </Tr>
                      ))}
                      <Tr>
                        <Td colSpan={4} fontWeight="bold">Total</Td>
                        <Td isNumeric fontWeight="bold">
                          ETB {calculateOrderTotal(formData.items).toLocaleString()}
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
              
              <Box>
                <Text fontWeight="bold">Status:</Text>
                <Badge 
                  colorScheme={
                    formData.status === 'Pending' ? 'orange' :
                    formData.status === 'Confirmed' ? 'blue' :
                    formData.status === 'Processing' ? 'yellow' :
                    formData.status === 'Shipped' ? 'purple' :
                    formData.status === 'Delivered' ? 'green' : 'red'
                  }
                >
                  {formData.status}
                </Badge>
              </Box>
              
              {formData.notes && (
                <Box>
                  <Text fontWeight="bold">Notes:</Text>
                  <Text>{formData.notes}</Text>
                </Box>
              )}
            </Flex>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onViewClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default OrderFollowup;