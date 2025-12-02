import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  useToast, 
  Spinner, 
  Flex, 
  useColorModeValue,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Select,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Text
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import { 
  FiUser, 
  FiPhone, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiClock,
  FiDownload
} from 'react-icons/fi';
import FollowupCustomerTable from './FollowupCustomerTable';
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../services/customerService';
import { fetchCourses } from '../../services/api';
import axios from 'axios';

const FollowupPage = () => {
  const [customers, setCustomers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    active: 0,
    completedDeals: 0,
    calledCustomers: 0,
    totalCommission: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    callStatus: '',
    followupStatus: '',
    sortBy: 'date'
  });
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [exportColumns, setExportColumns] = useState({
    'Customer Name': true,
    'Contact Title': true,
    'Phone': true,
    'Call Status': true,
    'Follow-up Status': true,
    'Schedule': true,
    'Date': true,
    'Email': true,
    'Note': true,
    'Supervisor Comment': true
  });
  const toast = useToast();

  // Date filter states
  const [dateFilterType, setDateFilterType] = useState('All'); // All | DateRange | Week | Year
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekValue, setWeekValue] = useState(''); // yyyy-Www
  const [yearValue, setYearValue] = useState('');

  const headerColor = useColorModeValue('gray.700', 'white');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    // Load customers first so client-side prospect count is computed correctly,
    // then fetch server stats to merge, avoiding overwriting with stale local state.
    const init = async () => {
      const totalCommission = await fetchCustomers();
      await fetchCoursesData();
      await fetchStats(totalCommission);
    };
    init();
  }, []);

  const fetchCoursesData = async () => {
    try {
      const data = await fetchCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      // Set empty array on error to ensure dropdown works
      setCourses([]);
    }
  };

  // Calculate total commission for all completed sales
  const calculateTotalCommission = (customers) => {
    if (!Array.isArray(customers) || customers.length === 0) {
      return 0;
    }
    
    const filteredCustomers = customers
      .filter(customer => {
        // Filter for completed deals with valid commission data
        const hasValidCommission = customer.commission && 
               typeof customer.commission === 'object' &&
               customer.commission.hasOwnProperty('netCommission') &&
               typeof customer.commission.netCommission === 'number' &&
               !isNaN(customer.commission.netCommission);
               
        const isValid = customer.followupStatus === 'Completed' && hasValidCommission;
        return isValid;
      });
      
    if (filteredCustomers.length === 0) {
      return 0;
    }
    
    const result = filteredCustomers
      .reduce((total, customer) => {
        const commission = customer.commission.netCommission || 0;
        const validCommission = typeof commission === 'number' && !isNaN(commission) ? commission : 0;
        return total + validCommission;
      }, 0);
      
    return result;
  };

  // Calculate total commission for the month
  const calculateMonthlyCommission = (customers) => {
    if (!Array.isArray(customers)) return 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return customers
      .filter(customer => {
        // Filter for completed deals in the current month
        return customer.followupStatus === 'Completed' && 
               customer.commission && 
               customer.commission.netCommission &&
               customer.date && 
               new Date(customer.date) >= startOfMonth && 
               new Date(customer.date) <= endOfMonth;
      })
      .reduce((total, customer) => {
        return total + customer.commission.netCommission;
      }, 0);
  };

  const fetchStats = async (currentCommission = null) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sales-customers/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });
      // Merge server stats with our locally calculated commission
      setStats(prev => ({
        ...response.data,
        totalCommission: currentCommission !== null ? currentCommission : (prev.totalCommission || 0)
      }));
      try {
        const prospectCount = (customers || []).filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
        setStats(prev => ({ ...prev, new: prospectCount }));
      } catch (err) {
        // ignore
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getAllCustomers();
      // Map the data to match the expected structure in the table
      const mappedData = data.map(customer => ({
        ...customer,
        _id: customer._id,
        id: customer._id,
        date: customer.date || customer.createdAt || new Date().toISOString(),
        schedulePreference: customer.schedulePreference || customer.schedule || 'Regular',
        // Include commission data if it exists
        commission: customer.commission,
        coursePrice: customer.coursePrice
      }));
      setCustomers(mappedData);
      
      // Calculate total commission BEFORE setting other stats
      const totalCommission = calculateTotalCommission(mappedData);
      
      // compute active prospects locally (followupStatus === 'Prospect')
      try {
        const prospectCount = mappedData.filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
        setStats(prev => ({ total: prev.total, new: prospectCount, active: prev.active, completedDeals: prev.completedDeals, calledCustomers: prev.calledCustomers, totalCommission }));
      } catch (err) {
        // ignore
      }
      
      setError(null);
      return totalCommission;
    } catch (err) {
      setError('Failed to fetch customers: ' + err.message);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (customerData) => {
    try {
      const newCustomer = await createCustomer(customerData);
      // Map the new customer to match the expected structure
      const mappedCustomer = {
        ...newCustomer,
        _id: newCustomer._id,
        id: newCustomer._id,
        date: newCustomer.date || newCustomer.createdAt || new Date().toISOString(),
        schedulePreference: newCustomer.schedulePreference || newCustomer.schedule || 'Regular',
        // Include commission data if it exists
        commission: newCustomer.commission || customerData.commission,
        coursePrice: newCustomer.coursePrice || customerData.coursePrice
      };
      setCustomers(prev => {
        const next = [...prev, mappedCustomer];
        // update active prospects count
        try {
              const prospectCount = next.filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
              setStats(prevS => ({ ...prevS, new: prospectCount }));
        } catch (err) {}
        // Calculate total commission
        const totalCommission = calculateTotalCommission(next);
        setStats(prevS => ({ ...prevS, totalCommission }));
        return next;
      });
      // Refresh stats
      fetchStats(null);
      // No success toast - handled with visual indicator in table
    } catch (err) {
      toast({
        title: "Error adding customer",
        description: err.message || "Failed to add customer",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdate = async (id, customerData) => {
    // Optimistic update: apply change locally immediately
    let previousCustomers;
    try {
      setCustomers(prev => {
        previousCustomers = prev;
        const next = prev.map(cust => cust.id === id ? { ...cust, ...customerData } : cust);
        try {
              const prospectCount = next.filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
              setStats(prevS => ({ ...prevS, new: prospectCount }));
        } catch (err) {}
        // Calculate total commission
        const totalCommission = calculateTotalCommission(next);
        setStats(prevS => ({ ...prevS, totalCommission }));
        return next;
      });

      // Fire the API update in background
      const updatedCustomer = await updateCustomer(id, customerData);
      // Reconcile with server response (ensure ids and dates are normalized)
      const mappedCustomer = {
        ...updatedCustomer,
        _id: updatedCustomer._id,
        id: updatedCustomer._id,
        date: updatedCustomer.date || updatedCustomer.createdAt || new Date().toISOString(),
        schedulePreference: updatedCustomer.schedulePreference || updatedCustomer.schedule || 'Regular',
        // Include commission data if it exists
        commission: updatedCustomer.commission || customerData.commission,
        coursePrice: updatedCustomer.coursePrice || customerData.coursePrice
      };
      // Update the customer in the list with the server response
      setCustomers(prev => prev.map(cust => cust.id === id ? mappedCustomer : cust));
      // Refresh stats
      fetchStats(null);
      // Calculate total commission
      const totalCommission = calculateTotalCommission(
        prev.map(cust => cust.id === id ? mappedCustomer : cust)
      );
      setStats(prev => ({ ...prev, totalCommission }));
      // No success toast - handled with visual indicator in table
    } catch (err) {
      // Rollback to previous state on error
      if (previousCustomers) {
        setCustomers(previousCustomers);
        // Recalculate total commission with previous data
        const totalCommission = calculateTotalCommission(previousCustomers);
        setStats(prev => ({ ...prev, totalCommission }));
      }
      toast({
        title: "Error updating customer",
        description: err.message || "Failed to update customer",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id);
      setCustomers(prev => {
        const next = prev.filter(cust => cust.id !== id);
        // update active prospects count
        try {
              const prospectCount = next.filter(c => (c.followupStatus || '').toString().toLowerCase() === 'prospect').length;
              setStats(prevS => ({ ...prevS, new: prospectCount }));
      } catch (err) {}
      // Calculate total commission
      const totalCommission = calculateTotalCommission(next);
      setStats(prevS => ({ ...prevS, totalCommission }));
      return next;
    });
    // Refresh stats
    fetchStats(null);
    // No success toast - handled with visual indicator in table
  } catch (err) {
    toast({
      title: "Error deleting customer",
      description: err.message || "Failed to delete customer",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }
};

  const exportVisible = () => {
    const headers = Object.keys(exportColumns).filter(key => exportColumns[key]);
    const csvContent = [
      headers.join(','),
      ...customers.map(customer => 
        headers.map(header => {
          switch(header) {
            case 'Customer Name': return `"${customer.customerName || ''}"`;
            case 'Contact Title': return `"${customer.contactTitle || ''}"`;
            case 'Phone': return `"${customer.phone || ''}"`;
            case 'Call Status': return `"${customer.callStatus || ''}"`;
            case 'Follow-up Status': return `"${customer.followupStatus || ''}"`;
            case 'Schedule': return `"${customer.schedulePreference || ''}"`;
            case 'Date': return `"${customer.date ? new Date(customer.date).toLocaleDateString() : ''}"`;
            case 'Email': return `"${customer.email || ''}"`;
            case 'Note': return `"${customer.note || ''}"`;
            case 'Supervisor Comment': return `"${customer.supervisorComment || ''}"`;
            default: return '""';
          }
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customer_followup_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter customers based on search and filters
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !filters.search || 
      (customer.customerName && customer.customerName.toLowerCase().includes(filters.search.toLowerCase())) ||
      (customer.phone && customer.phone.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesCallStatus = !filters.callStatus || customer.callStatus === filters.callStatus;
    const matchesFollowupStatus = !filters.followupStatus || customer.followupStatus === filters.followupStatus;
    const matchesSchedule = !scheduleFilter || customer.schedulePreference === scheduleFilter;
    
    return matchesSearch && matchesCallStatus && matchesFollowupStatus && matchesSchedule;
  });

  // Apply sorting
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (filters.sortBy === 'name') {
      return a.customerName.localeCompare(b.customerName);
    } else if (filters.sortBy === 'date') {
      return new Date(b.date) - new Date(a.date);
    } else if (filters.sortBy === 'status') {
      return a.followupStatus.localeCompare(b.followupStatus);
    }
    return 0;
  });

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="300px" bg="white" borderRadius="lg" boxShadow="md">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box bg="red.50" p={4} borderRadius="lg" mb={4}>
        <Text color="red.500" fontWeight="medium">{error}</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={6} mb={8}>
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody>
            <Stat>
              <StatLabel fontWeight="medium" color={secondaryTextColor}>Total Customers</StatLabel>
              <StatNumber fontSize="2xl" color="teal.600">{stats.total}</StatNumber>
              <StatHelpText fontSize="sm" color={secondaryTextColor}>in database</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody>
            <Stat>
              <StatLabel fontWeight="medium" color={secondaryTextColor}>New Prospects</StatLabel>
              <StatNumber fontSize="2xl" color="blue.500">{stats.new}</StatNumber>
              <StatHelpText fontSize="sm" color={secondaryTextColor}>awaiting follow-up</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody>
            <Stat>
              <StatLabel fontWeight="medium" color={secondaryTextColor}>Total Commission</StatLabel>
              <StatNumber fontSize="2xl" color="green.500">ETB {typeof stats.totalCommission === 'number' ? stats.totalCommission.toFixed(2) : '0.00'}</StatNumber>
              <StatHelpText fontSize="sm" color={secondaryTextColor}>from all sales</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody>
            <Stat>
              <StatLabel fontWeight="medium" color={secondaryTextColor}>Completed Deals</StatLabel>
              <StatNumber fontSize="2xl" color="green.500">{stats.completedDeals}</StatNumber>
              <StatHelpText fontSize="sm" color={secondaryTextColor}>this period</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody>
            <Stat>
              <StatLabel fontWeight="medium" color={secondaryTextColor}>Called Today</StatLabel>
              <StatNumber fontSize="2xl" color="purple.500">{stats.calledCustomers}</StatNumber>
              <StatHelpText fontSize="sm" color={secondaryTextColor}>customers contacted</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters and Controls */}
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between" 
        align={{ base: 'stretch', md: 'center' }} 
        mb={6} 
        gap={4}
        p={4}
        bg={cardBg}
        borderRadius="lg"
        boxShadow="sm"
      >
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          gap={3} 
          flex={1}
          maxWidth={{ base: '100%', md: '60%' }}
        >
          <InputGroup size="md" flex={1}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search customers..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              borderRadius="md"
            />
          </InputGroup>
          
          <Select 
            placeholder="Call Status" 
            size="md"
            value={filters.callStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, callStatus: e.target.value }))}
            maxWidth="150px"
            borderRadius="md"
          >
            <option value="Called">Called</option>
            <option value="Not Called">Not Called</option>
            <option value="Busy">Busy</option>
            <option value="No Answer">No Answer</option>
            <option value="Callback">Callback</option>
          </Select>
          
          <Select 
            placeholder="Follow-up Status" 
            size="md"
            value={filters.followupStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, followupStatus: e.target.value }))}
            maxWidth="150px"
            borderRadius="md"
          >
            <option value="Prospect">Prospect</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
          
          <Select 
            placeholder="Schedule" 
            size="md"
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value)}
            maxWidth="150px"
            borderRadius="md"
          >
            <option value="Regular">Regular</option>
            <option value="Weekend">Weekend</option>
            <option value="Night">Night</option>
            <option value="Online">Online</option>
          </Select>
        </Flex>
        
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          gap={3} 
          justify="flex-end"
        >
          <Menu>
            <MenuButton as={Button} rightIcon={<FiDownload />} colorScheme="teal" size="sm" borderRadius="md">
              Export
            </MenuButton>
            <MenuList>
              <MenuItem>
                <Checkbox 
                  isChecked={exportColumns['Customer Name']} 
                  onChange={(e) => setExportColumns(prev => ({ ...prev, 'Customer Name': e.target.checked }))}
                >
                  Customer Name
                </Checkbox>
              </MenuItem>
              <MenuItem>
                <Checkbox 
                  isChecked={exportColumns['Contact Title']} 
                  onChange={(e) => setExportColumns(prev => ({ ...prev, 'Contact Title': e.target.checked }))}
                >
                  Contact Title
                </Checkbox>
              </MenuItem>
              <MenuItem>
                <Checkbox 
                  isChecked={exportColumns['Phone']} 
                  onChange={(e) => setExportColumns(prev => ({ ...prev, 'Phone': e.target.checked }))}
                >
                  Phone
                </Checkbox>
              </MenuItem>
              <MenuItem>
                <Checkbox 
                  isChecked={exportColumns['Call Status']} 
                  onChange={(e) => setExportColumns(prev => ({ ...prev, 'Call Status': e.target.checked }))}
                >
                  Call Status
                </Checkbox>
              </MenuItem>
              <MenuItem>
                <Checkbox 
                  isChecked={exportColumns['Follow-up Status']} 
                  onChange={(e) => setExportColumns(prev => ({ ...prev, 'Follow-up Status': e.target.checked }))}
                >
                  Follow-up Status
                </Checkbox>
              </MenuItem>
              <MenuItem>
                <Checkbox 
                  isChecked={exportColumns['Schedule']} 
                  onChange={(e) => setExportColumns(prev => ({ ...prev, 'Schedule': e.target.checked }))}
                >
                  Schedule
                </Checkbox>
              </MenuItem>
              <MenuItem>
                <Checkbox 
                  isChecked={exportColumns['Date']} 
                  onChange={(e) => setExportColumns(prev => ({ ...prev, 'Date': e.target.checked }))}
                >
                  Date
                </Checkbox>
              </MenuItem>
              <MenuItem>
                <Checkbox 
                  isChecked={exportColumns['Email']} 
                  onChange={(e) => setExportColumns(prev => ({ ...prev, 'Email': e.target.checked }))}
                >
                  Email
                </Checkbox>
              </MenuItem>
              <MenuItem>
                <Checkbox 
                  isChecked={exportColumns['Note']} 
                  onChange={(e) => setExportColumns(prev => ({ ...prev, 'Note': e.target.checked }))}
                >
                  Note
                </Checkbox>
              </MenuItem>
              <MenuItem>
                <Checkbox 
                  isChecked={exportColumns['Supervisor Comment']} 
                  onChange={(e) => setExportColumns(prev => ({ ...prev, 'Supervisor Comment': e.target.checked }))}
                >
                  Supervisor Comment
                </Checkbox>
              </MenuItem>
              <MenuItem>
                <Button colorScheme="teal" size="sm" onClick={exportVisible} borderRadius="md">Download</Button>
              </MenuItem>
            </MenuList>
          </Menu>

          <Button 
            onClick={() => { 
              setDateFilterType('All'); 
              setStartDate(''); 
              setEndDate(''); 
              setWeekValue(''); 
              setYearValue(''); 
            }} 
            variant="ghost"
            size="sm"
            borderRadius="md"
          >
            Clear Date
          </Button>
        </Flex>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" minH="300px" bg="white" borderRadius="lg" boxShadow="md">
          <Spinner size="xl" color="teal.500" thickness="4px" />
        </Flex>
      ) : error ? (
        <Box bg="red.50" p={4} borderRadius="lg" mb={4}>
          <Text color="red.500" fontWeight="medium">{error}</Text>
        </Box>
      ) : (
        <Box bg="white" p={0} borderRadius="lg" boxShadow="md" w="100%" maxW="100%">
          <FollowupCustomerTable
            customers={sortedCustomers}
            courses={courses}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onAdd={handleAdd}
          />
        </Box>
      )}
    </Box>
  );
};

export default FollowupPage;