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
  Divider,
  Progress,
  Grid,
  GridItem,
  HStack,
  VStack,
  Tooltip,
  Switch,
  Tag,
  TagLabel,
  TagCloseButton,
  Checkbox
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  DownloadIcon, 
  CalendarIcon, 
  InfoIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@chakra-ui/icons';
import axios from '../../services/axiosInstance';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

const FinanceDashboard = () => {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    unit: '',
    sku: '',
    supplier: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // table or grid
  const [selectedItems, setSelectedItems] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onClose: onBulkClose } = useDisclosure();
  const toast = useToast();

  // Fetch stock items
  const fetchStockItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/stock`);
      setStockItems(response.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(item => item.category))];
      setCategories(uniqueCategories);
      
      // Extract unique suppliers
      const uniqueSuppliers = [...new Set(response.data.map(item => item.supplier).filter(Boolean))];
      setSuppliers(uniqueSuppliers);
    } catch (err) {
      setError('Failed to fetch stock items');
      toast({
        title: 'Error',
        description: 'Failed to fetch stock items',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock items on component mount
  useEffect(() => {
    fetchStockItems();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        // Update existing stock item
        await axios.put(`/stock/${currentItemId}`, formData);
        toast({
          title: 'Success',
          description: 'Stock item updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        // Create new stock item
        await axios.post(`/stock`, formData);
        toast({
          title: 'Success',
          description: 'Stock item created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
      
      // Reset form and refresh data
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        quantity: '',
        unit: '',
        sku: '',
        supplier: ''
      });
      setIsEditing(false);
      setCurrentItemId(null);
      onClose();
      fetchStockItems();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save stock item',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Handle edit action
  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit,
      sku: item.sku,
      supplier: item.supplier || ''
    });
    setIsEditing(true);
    setCurrentItemId(item._id);
    onOpen();
  };

  // Handle delete action
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stock item?')) {
      try {
        await axios.delete(`/stock/${id}`);
        toast({
          title: 'Success',
          description: 'Stock item deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        fetchStockItems();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to delete stock item',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    }
  };

  // Open modal for new item
  const handleAddNewItem = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      quantity: '',
      unit: '',
      sku: '',
      supplier: ''
    });
    setIsEditing(false);
    setCurrentItemId(null);
    onOpen();
  };

  // Toggle item selection
  const toggleItemSelection = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // Select all items
  const selectAllItems = () => {
    if (selectedItems.length === filteredStockItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredStockItems.map(item => item._id));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      try {
        // Delete all selected items
        await Promise.all(selectedItems.map(id => 
          axios.delete(`/stock/${id}`)
        ));
        
        toast({
          title: 'Success',
          description: `${selectedItems.length} items deleted successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        
        setSelectedItems([]);
        fetchStockItems();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to delete items',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    }
  };

  // Sort items
  const sortItems = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort stock items
  const filteredStockItems = stockItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle special cases
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Calculate inventory statistics
  const totalItems = stockItems.length;
  const totalValue = stockItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lowStockItems = stockItems.filter(item => item.quantity < 10).length;
  const outOfStockItems = stockItems.filter(item => item.quantity === 0).length;
  const totalCategories = categories.length;
  const totalSuppliers = suppliers.length;

  // Prepare data for charts
  const categoryData = {
    labels: categories,
    datasets: [
      {
        label: 'Items per Category',
        data: categories.map(category => 
          stockItems.filter(item => item.category === category).length
        ),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const valueByCategoryData = {
    labels: categories,
    datasets: [
      {
        label: 'Value per Category (ETB)',
        data: categories.map(category => 
          stockItems
            .filter(item => item.category === category)
            .reduce((sum, item) => sum + (item.price * item.quantity), 0)
        ),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Inventory Distribution',
      },
    },
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="lg" color="teal.600">
          Enterprise Finance Dashboard
        </Heading>
        <HStack spacing={3}>
          <Button 
            leftIcon={<DownloadIcon />} 
            colorScheme="blue" 
            variant="outline"
          >
            Export Report
          </Button>
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="teal" 
            onClick={handleAddNewItem}
          >
            Add New Item
          </Button>
        </HStack>
      </Flex>

      {/* KPI Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 6 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Items</StatLabel>
              <StatNumber>{totalItems}</StatNumber>
              <StatHelpText>In inventory</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Value</StatLabel>
              <StatNumber>ETB {totalValue.toLocaleString()}</StatNumber>
              <StatHelpText>Inventory worth</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Categories</StatLabel>
              <StatNumber>{totalCategories}</StatNumber>
              <StatHelpText>Product types</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Suppliers</StatLabel>
              <StatNumber>{totalSuppliers}</StatNumber>
              <StatHelpText>Partners</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Low Stock</StatLabel>
              <StatNumber color="orange.500">{lowStockItems}</StatNumber>
              <StatHelpText>Under 10 units</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Out of Stock</StatLabel>
              <StatNumber color="red.500">{outOfStockItems}</StatNumber>
              <StatHelpText>No inventory</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Charts */}
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6} mb={6}>
        <Card>
          <CardBody>
            <Bar data={categoryData} options={chartOptions} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Pie data={valueByCategoryData} options={chartOptions} />
          </CardBody>
        </Card>
      </Grid>

      {/* Controls */}
      <Card mb={6}>
        <CardBody>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4} wrap="wrap">
            <InputGroup flex={{ base: '1', md: '2' }}>
              <InputLeftElement pointerEvents='none'>
                <SearchIcon color='gray.300' />
              </InputLeftElement>
              <Input
                placeholder="Search by name, SKU, description, or supplier"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Select 
              placeholder="Filter by category" 
              flex="1"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </Select>
            
            <Select 
              placeholder="Sort by" 
              flex="1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="price">Price</option>
              <option value="quantity">Quantity</option>
              <option value="createdAt">Date Added</option>
            </Select>
            
            <Button 
              leftIcon={sortOrder === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />} 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
            
            <Button 
              colorScheme="red" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSortBy('createdAt');
                setSortOrder('desc');
              }}
            >
              Clear Filters
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Action Bar */}
      {selectedItems.length > 0 && (
        <Card mb={4} bg="blue.50" borderColor="blue.200" borderWidth="1px">
          <CardBody>
            <Flex justify="space-between" align="center">
              <Text fontWeight="bold" color="blue.800">
                {selectedItems.length} item(s) selected
              </Text>
              <HStack>
                <Button 
                  size="sm" 
                  colorScheme="red" 
                  leftIcon={<DeleteIcon />} 
                  onClick={handleBulkDelete}
                >
                  Delete Selected
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedItems([])}
                >
                  Clear Selection
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>
      )}

      {/* Stock Items Table */}
      <Card>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading as="h3" size="md">Stock Inventory</Heading>
            <HStack>
              <Text fontSize="sm" color="gray.500">
                {filteredStockItems.length} items
              </Text>
              <Switch 
                isChecked={viewMode === 'grid'} 
                onChange={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              />
              <Text fontSize="sm">Grid View</Text>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          {viewMode === 'table' ? (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>
                      <Checkbox 
                        isChecked={selectedItems.length === filteredStockItems.length && filteredStockItems.length > 0}
                        isIndeterminate={selectedItems.length > 0 && selectedItems.length < filteredStockItems.length}
                        onChange={selectAllItems}
                      />
                    </Th>
                    <Th>
                      <Button variant="ghost" onClick={() => sortItems('sku')} rightIcon={sortBy === 'sku' ? (sortOrder === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />) : null}>
                        SKU
                      </Button>
                    </Th>
                    <Th>
                      <Button variant="ghost" onClick={() => sortItems('name')} rightIcon={sortBy === 'name' ? (sortOrder === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />) : null}>
                        Name
                      </Button>
                    </Th>
                    <Th>
                      <Button variant="ghost" onClick={() => sortItems('category')} rightIcon={sortBy === 'category' ? (sortOrder === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />) : null}>
                        Category
                      </Button>
                    </Th>
                    <Th isNumeric>
                      <Button variant="ghost" onClick={() => sortItems('price')} rightIcon={sortBy === 'price' ? (sortOrder === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />) : null}>
                        Price (ETB)
                      </Button>
                    </Th>
                    <Th isNumeric>
                      <Button variant="ghost" onClick={() => sortItems('quantity')} rightIcon={sortBy === 'quantity' ? (sortOrder === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />) : null}>
                        Quantity
                      </Button>
                    </Th>
                    <Th>Unit</Th>
                    <Th>Supplier</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredStockItems.length > 0 ? (
                    filteredStockItems.map((item) => (
                      <Tr key={item._id}>
                        <Td>
                          <Checkbox 
                            isChecked={selectedItems.includes(item._id)}
                            onChange={() => toggleItemSelection(item._id)}
                          />
                        </Td>
                        <Td>
                          <Text fontWeight="bold">{item.sku}</Text>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">{item.name}</Text>
                            {item.description && (
                              <Tooltip label={item.description} hasArrow>
                                <Text fontSize="sm" color="gray.500" noOfLines={1}>
                                  {item.description}
                                </Text>
                              </Tooltip>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <Badge colorScheme="teal">{item.category}</Badge>
                        </Td>
                        <Td isNumeric>{item.price.toLocaleString()}</Td>
                        <Td isNumeric>
                          <VStack align="end" spacing={1}>
                            <Text fontWeight={item.quantity === 0 ? 'bold' : 'normal'}>
                              {item.quantity}
                            </Text>
                            {item.quantity < 20 && (
                              <Progress 
                                value={item.quantity} 
                                max={20} 
                                size="sm" 
                                colorScheme={item.quantity === 0 ? 'red' : item.quantity < 5 ? 'orange' : 'green'} 
                                width="100px" 
                                borderRadius="full" 
                              />
                            )}
                          </VStack>
                        </Td>
                        <Td>{item.unit}</Td>
                        <Td>
                          {item.supplier ? (
                            <Tag size="sm" colorScheme="blue">
                              <TagLabel>{item.supplier}</TagLabel>
                            </Tag>
                          ) : (
                            <Text color="gray.400">N/A</Text>
                          )}
                        </Td>
                        <Td>
                          <HStack>
                            <IconButton
                              aria-label="Edit item"
                              icon={<EditIcon />}
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleEdit(item)}
                            />
                            <IconButton
                              aria-label="Delete item"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDelete(item._id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={9} textAlign="center">
                        <VStack py={10}>
                          <InfoIcon boxSize={10} color="gray.300" />
                          <Text fontSize="lg" color="gray.500">No stock items found</Text>
                          <Text fontSize="sm" color="gray.400">Try adjusting your search or filter criteria</Text>
                        </VStack>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            // Grid View
            <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
              {filteredStockItems.length > 0 ? (
                filteredStockItems.map((item) => (
                  <Card key={item._id}>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Flex justify="space-between" w="100%">
                          <Badge colorScheme="teal">{item.category}</Badge>
                          <Badge colorScheme={item.quantity === 0 ? 'red' : item.quantity < 10 ? 'orange' : 'green'}>
                            {item.quantity}
                          </Badge>
                        </Flex>
                        <Heading size="sm" noOfLines={2}>{item.name}</Heading>
                        <Text fontSize="sm" color="gray.500">SKU: {item.sku}</Text>
                        <Text fontWeight="bold" color="teal.600">ETB {item.price.toLocaleString()}</Text>
                        <Text fontSize="sm">Unit: {item.unit}</Text>
                        {item.supplier && (
                          <Text fontSize="sm">Supplier: {item.supplier}</Text>
                        )}
                        <HStack mt={2}>
                          <IconButton
                            aria-label="Edit item"
                            icon={<EditIcon />}
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleEdit(item)}
                          />
                          <IconButton
                            aria-label="Delete item"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDelete(item._id)}
                          />
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <GridItem colSpan={4}>
                  <VStack py={10}>
                    <InfoIcon boxSize={10} color="gray.300" />
                    <Text fontSize="lg" color="gray.500">No stock items found</Text>
                    <Text fontSize="sm" color="gray.400">Try adjusting your search or filter criteria</Text>
                  </VStack>
                </GridItem>
              )}
            </Grid>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? 'Edit Stock Item' : 'Add New Stock Item'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Tabs>
                <TabList>
                  <Tab>Basic Information</Tab>
                  <Tab>Pricing & Inventory</Tab>
                  <Tab>Supplier Details</Tab>
                </TabList>
                
                <TabPanels>
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Item Name</FormLabel>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter item name"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        <Input
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Enter item description"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Category</FormLabel>
                        <Input
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          placeholder="Enter category"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>SKU</FormLabel>
                        <Input
                          name="sku"
                          value={formData.sku}
                          onChange={handleInputChange}
                          placeholder="Enter SKU"
                          isDisabled={isEditing}
                        />
                      </FormControl>
                    </VStack>
                  </TabPanel>
                  
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Price (ETB)</FormLabel>
                        <Input
                          name="price"
                          type="number"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="Enter price"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Quantity</FormLabel>
                        <Input
                          name="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          placeholder="Enter quantity"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Unit</FormLabel>
                        <Select
                          name="unit"
                          value={formData.unit}
                          onChange={handleInputChange}
                          placeholder="Select unit"
                        >
                          <option value="pcs">Pieces (pcs)</option>
                          <option value="kg">Kilograms (kg)</option>
                          <option value="g">Grams (g)</option>
                          <option value="l">Liters (l)</option>
                          <option value="ml">Milliliters (ml)</option>
                          <option value="m">Meters (m)</option>
                          <option value="cm">Centimeters (cm)</option>
                          <option value="box">Box</option>
                          <option value="pack">Pack</option>
                        </Select>
                      </FormControl>
                    </VStack>
                  </TabPanel>
                  
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>Supplier</FormLabel>
                        <Input
                          name="supplier"
                          value={formData.supplier}
                          onChange={handleInputChange}
                          placeholder="Enter supplier name"
                        />
                      </FormControl>
                      
                      <Text fontSize="sm" color="gray.500">
                        Supplier information helps track sourcing and procurement.
                      </Text>
                    </VStack>
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
                isDisabled={!formData.name || !formData.category || !formData.price || !formData.quantity || !formData.unit || !formData.sku}
              >
                {isEditing ? 'Update Item' : 'Add Item'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FinanceDashboard;