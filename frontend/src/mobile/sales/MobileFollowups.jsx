import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react';
import {
  FiCalendar,
  FiFilter,
  FiMail,
  FiMoreVertical,
  FiPhone,
  FiPlus,
  FiSearch,
  FiSliders
} from 'react-icons/fi';
import { getAllCustomers } from '../../services/customerService';
import { fetchPackageSales } from '../../services/packageService';

const TABLE_PREF_KEY = 'salesFollowupCustomerTablePrefs';

const mobileColumns = [
  { key: 'customerName', label: 'Customer Name', required: true },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'contactTitle', label: 'Training Title' },
  { key: 'callStatus', label: 'Call Status' },
  { key: 'followupStatus', label: 'Follow-up Status' },
  { key: 'schedulePreference', label: 'Schedule' },
  { key: 'packageScope', label: 'Package Scope' },
  { key: 'date', label: 'Date' },
  { key: 'note', label: 'Note' }
];

const filterOptions = [
  { label: 'All', value: '' },
  { label: 'Callback', value: 'Callback' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Pending', value: 'Pending' }
];

const packageFilterOptions = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Expired', value: 'Expired' }
];

const statusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'callback':
      return 'purple';
    case 'completed':
    case 'called':
      return 'green';
    case 'pending':
      return 'orange';
    case 'not called':
      return 'gray';
    case 'busy':
    case 'cancelled':
      return 'red';
    default:
      return 'blue';
  }
};

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'NA';
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const readVisibleColumns = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(TABLE_PREF_KEY) || 'null');
    const known = mobileColumns.map((column) => column.key);
    const savedOrder = Array.isArray(saved?.order) ? saved.order.filter((key) => known.includes(key)) : [];
    const hidden = Array.isArray(saved?.hidden) ? saved.hidden : [];
    const order = [...savedOrder, ...known.filter((key) => !savedOrder.includes(key))];

    return order
      .map((key) => mobileColumns.find((column) => column.key === key))
      .filter((column) => column && !hidden.includes(column.key));
  } catch {
    return mobileColumns;
  }
};

const getFieldValue = (customer, key) => {
  switch (key) {
    case 'customerName':
      return customer.customerName || 'Unnamed customer';
    case 'contactTitle':
      return customer.contactTitle || customer.courseName || 'N/A';
    case 'date':
      return formatDate(customer.date || customer.createdAt);
    case 'schedulePreference':
      return customer.schedulePreference || customer.schedule || 'Regular';
    case 'packageScope':
      return customer.packageScope || 'Local';
    default:
      return customer[key] || 'N/A';
  }
};

const MobileFollowupCard = ({ customer, visibleColumns }) => {
  const extraColumns = visibleColumns.filter(
    (column) => !['customerName', 'phone', 'email', 'callStatus', 'followupStatus', 'date'].includes(column.key)
  );

  return (
    <Box bg="white" borderRadius="14px" p={4} boxShadow="0 8px 22px rgba(15, 23, 42, 0.08)" borderWidth="1px" borderColor="#edf2f7">
      <Flex align="flex-start" justify="space-between" gap={3}>
        <HStack align="flex-start" spacing={3} minW={0}>
          <Center w="42px" h="42px" borderRadius="12px" bg="#e9f6ff" color="#1086d4" flexShrink={0} fontWeight="900">
            {getInitials(customer.customerName)}
          </Center>
          <Box minW={0}>
            <Text color="#162033" fontSize="15px" fontWeight="900" noOfLines={1}>
              {customer.customerName || 'Unnamed customer'}
            </Text>
            <HStack spacing={1.5} mt={1} color="#586579">
              <Icon as={FiPhone} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{customer.phone || 'No phone'}</Text>
            </HStack>
            <HStack spacing={1.5} mt={1} color="#586579">
              <Icon as={FiMail} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{customer.email || 'No email'}</Text>
            </HStack>
          </Box>
        </HStack>
        <Box textAlign="right" flexShrink={0}>
          <Text fontSize="10px" color="#283647" fontWeight="700">{formatDate(customer.date || customer.createdAt)}</Text>
          <Text fontSize="10px" color="#283647" fontWeight="700" mt={1}>{formatTime(customer.date || customer.createdAt)}</Text>
        </Box>
      </Flex>

      <HStack spacing={2} mt={4} flexWrap="wrap">
        {customer.callStatus && (
          <Badge colorScheme={statusColor(customer.callStatus)} fontSize="9px" px={2} py={1} borderRadius="md">
            {customer.callStatus}
          </Badge>
        )}
        {customer.followupStatus && (
          <Badge colorScheme={statusColor(customer.followupStatus)} fontSize="9px" px={2} py={1} borderRadius="md">
            {customer.followupStatus}
          </Badge>
        )}
      </HStack>

      {extraColumns.length > 0 && (
        <SimpleGrid columns={2} spacing={2} mt={4}>
          {extraColumns.slice(0, 4).map((column) => (
            <Box key={column.key} bg="#f8fafc" borderRadius="10px" p={2} minW={0}>
              <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
                {column.label}
              </Text>
              <Text fontSize="10px" color="#253244" fontWeight="800" noOfLines={1}>
                {getFieldValue(customer, column.key)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <Flex align="center" justify="space-between" mt={4}>
        <HStack spacing={3}>
          <Center as="button" w="30px" h="30px" borderRadius="8px" bg="#e9fbf1" color="#19a56b">
            <Icon as={FiPhone} boxSize={4} />
          </Center>
          <Center as="button" w="30px" h="30px" borderRadius="8px" bg="#eaf4ff" color="#3182ce">
            <Icon as={FiMail} boxSize={4} />
          </Center>
          <Center as="button" w="30px" h="30px" borderRadius="8px" bg="#f2ecff" color="#8956dc">
            <Icon as={FiCalendar} boxSize={4} />
          </Center>
        </HStack>
        <IconButton aria-label="More actions" icon={<FiMoreVertical />} variant="ghost" color="#253244" size="sm" />
      </Flex>
    </Box>
  );
};

const MobilePackageCard = ({ sale }) => {
  const packageValue = Number(sale.packageValue || (Number(sale.packageType) || 0) * 1000 || 0);

  return (
    <Box bg="white" borderRadius="14px" p={4} boxShadow="0 8px 22px rgba(15, 23, 42, 0.08)" borderWidth="1px" borderColor="#edf2f7">
      <Flex align="flex-start" justify="space-between" gap={3}>
        <HStack align="flex-start" spacing={3} minW={0}>
          <Center w="42px" h="42px" borderRadius="12px" bg="#fff7df" color="#d9901f" flexShrink={0} fontWeight="900">
            {getInitials(sale.customerName || sale.companyName || sale.contactPerson)}
          </Center>
          <Box minW={0}>
            <Text color="#162033" fontSize="15px" fontWeight="900" noOfLines={1}>
              {sale.customerName || sale.companyName || 'Package customer'}
            </Text>
            <HStack spacing={1.5} mt={1} color="#586579">
              <Icon as={FiPhone} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{sale.phoneNumber || sale.phone || 'No phone'}</Text>
            </HStack>
            <HStack spacing={1.5} mt={1} color="#586579">
              <Icon as={FiMail} boxSize={3} />
              <Text fontSize="11px" fontWeight="700" noOfLines={1}>{sale.email || 'No email'}</Text>
            </HStack>
          </Box>
        </HStack>
        <Box textAlign="right" flexShrink={0}>
          <Text fontSize="10px" color="#283647" fontWeight="700">{formatDate(sale.purchaseDate || sale.createdAt)}</Text>
          <Text fontSize="10px" color="#283647" fontWeight="700" mt={1}>{sale.customerType || 'Package'}</Text>
        </Box>
      </Flex>

      <HStack spacing={2} mt={4} flexWrap="wrap">
        <Badge colorScheme="orange" fontSize="9px" px={2} py={1} borderRadius="md">
          {sale.packageName || 'Package Sale'}
        </Badge>
        <Badge colorScheme={statusColor(sale.status)} fontSize="9px" px={2} py={1} borderRadius="md">
          {sale.status || 'Active'}
        </Badge>
      </HStack>

      <SimpleGrid columns={2} spacing={2} mt={4}>
        <Box bg="#f8fafc" borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Package Type
          </Text>
          <Text fontSize="10px" color="#253244" fontWeight="800" noOfLines={1}>
            {sale.packageType ? `#${sale.packageType}` : 'N/A'}
          </Text>
        </Box>
        <Box bg="#f8fafc" borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Value
          </Text>
          <Text fontSize="10px" color="#253244" fontWeight="800" noOfLines={1}>
            ETB {packageValue.toLocaleString()}
          </Text>
        </Box>
        <Box bg="#f8fafc" borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Agent
          </Text>
          <Text fontSize="10px" color="#253244" fontWeight="800" noOfLines={1}>
            {sale.agentName || 'N/A'}
          </Text>
        </Box>
        <Box bg="#f8fafc" borderRadius="10px" p={2} minW={0}>
          <Text fontSize="8px" color="#718096" fontWeight="900" textTransform="uppercase" noOfLines={1}>
            Contact
          </Text>
          <Text fontSize="10px" color="#253244" fontWeight="800" noOfLines={1}>
            {sale.contactPerson || 'N/A'}
          </Text>
        </Box>
      </SimpleGrid>

      <Flex align="center" justify="space-between" mt={4}>
        <HStack spacing={3}>
          <Center as="button" w="30px" h="30px" borderRadius="8px" bg="#e9fbf1" color="#19a56b">
            <Icon as={FiPhone} boxSize={4} />
          </Center>
          <Center as="button" w="30px" h="30px" borderRadius="8px" bg="#eaf4ff" color="#3182ce">
            <Icon as={FiMail} boxSize={4} />
          </Center>
          <Center as="button" w="30px" h="30px" borderRadius="8px" bg="#fff7df" color="#d9901f">
            <Icon as={FiCalendar} boxSize={4} />
          </Center>
        </HStack>
        <IconButton aria-label="More actions" icon={<FiMoreVertical />} variant="ghost" color="#253244" size="sm" />
      </Flex>
    </Box>
  );
};

const MobileFollowups = () => {
  const [customers, setCustomers] = useState([]);
  const [packageSales, setPackageSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [section, setSection] = useState('trainings');
  const visibleColumns = useMemo(readVisibleColumns, []);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const data = await getAllCustomers();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load mobile follow-ups', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        setPackagesLoading(true);
        const data = await fetchPackageSales();
        setPackageSales(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load mobile package sales', error);
      } finally {
        setPackagesLoading(false);
      }
    };

    loadPackages();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch = !query || [
        customer.customerName,
        customer.phone,
        customer.email,
        customer.contactTitle,
        customer.courseName
      ].some((value) => String(value || '').toLowerCase().includes(query));

      const matchesStatus = !statusFilter
        || customer.callStatus === statusFilter
        || customer.followupStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return packageSales.filter((sale) => {
      const matchesSearch = !query || [
        sale.customerName,
        sale.companyName,
        sale.contactPerson,
        sale.phoneNumber,
        sale.phone,
        sale.email,
        sale.packageName,
        sale.packageType
      ].some((value) => String(value || '').toLowerCase().includes(query));

      const matchesStatus = !statusFilter || sale.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [packageSales, search, statusFilter]);

  const activeFilters = section === 'packages' ? packageFilterOptions : filterOptions;
  const isLoading = section === 'packages' ? packagesLoading : loading;
  const visibleItems = section === 'packages' ? filteredPackages : filteredCustomers;

  return (
    <Box position="relative">
      <InputGroup mb={3}>
        <InputLeftElement pointerEvents="none">
          <Icon as={FiSearch} color="#8b98a8" />
        </InputLeftElement>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          bg="white"
          borderColor="#e2e8f0"
          borderRadius="10px"
          placeholder={section === 'packages' ? 'Search packages...' : 'Search contacts...'}
          fontSize="14px"
          h="42px"
        />
      </InputGroup>

      <Flex align="center" justify="space-between" mb={3} gap={2}>
        <HStack spacing={1} borderWidth="1px" borderColor="#dce7ef" borderRadius="10px" p={0.5} bg="white">
          <Button
            size="sm"
            borderRadius="8px"
            colorScheme={section === 'trainings' ? 'teal' : 'gray'}
            variant={section === 'trainings' ? 'solid' : 'ghost'}
            onClick={() => {
              setSection('trainings');
              setStatusFilter('');
            }}
          >
            Trainings
          </Button>
          <Button
            size="sm"
            borderRadius="8px"
            colorScheme={section === 'packages' ? 'teal' : 'gray'}
            variant={section === 'packages' ? 'solid' : 'ghost'}
            onClick={() => {
              setSection('packages');
              setStatusFilter('');
            }}
          >
            Packages
          </Button>
        </HStack>
        <HStack spacing={1}>
          <IconButton aria-label="Search" icon={<FiSearch />} variant="ghost" color="#253244" size="sm" />
          <IconButton aria-label="Filters" icon={<FiFilter />} variant="ghost" color="#253244" size="sm" />
        </HStack>
      </Flex>

      <HStack spacing={2} overflowX="auto" pb={2} mb={3}>
        {activeFilters.map((option) => {
          const active = statusFilter === option.value;
          return (
            <Button
              key={option.label}
              size="sm"
              flexShrink={0}
              borderRadius="9px"
              colorScheme={active ? 'teal' : 'gray'}
              variant={active ? 'solid' : 'outline'}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
        <IconButton aria-label="Customize fields" icon={<FiSliders />} size="sm" variant="outline" flexShrink={0} />
      </HStack>

      {isLoading ? (
        <Center py={12}>
          <Spinner color="teal.500" />
        </Center>
      ) : (
        <VStack align="stretch" spacing={3}>
          <Text fontSize="13px" color="#253244" fontWeight="900">
            {visibleItems.length} results
          </Text>
          {section === 'packages'
            ? filteredPackages.map((sale) => (
              <MobilePackageCard key={sale.id || sale._id || `${sale.customerName}-${sale.packageName}`} sale={sale} />
            ))
            : filteredCustomers.map((customer) => (
              <MobileFollowupCard key={customer._id || customer.id} customer={customer} visibleColumns={visibleColumns} />
            ))}
        </VStack>
      )}

      <IconButton
        aria-label="Add contact"
        icon={<FiPlus />}
        position="fixed"
        right={5}
        bottom="86px"
        size="lg"
        borderRadius="full"
        bg="#13a6a3"
        color="white"
        boxShadow="0 12px 28px rgba(19, 166, 163, 0.35)"
        _hover={{ bg: '#0f8f8c' }}
      />
    </Box>
  );
};

export default MobileFollowups;
