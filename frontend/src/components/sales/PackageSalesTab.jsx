import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  VStack,
  Input,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Table,
  Tbody,
  Text,
  Textarea,
  Th,
  Thead,
  Td,
  Tr,
  useDisclosure,
  useToast,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Tooltip
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, CheckIcon, CheckCircleIcon, TimeIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import {
  FiUpload,
  FiPackage,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiUser,
  FiCalendar,
  FiArrowRight,
  FiShield,
  FiFileText,
  FiLayers,
  FiTrendingUp,
  FiCopy,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiPhone,
  FiMail,
  FiGlobe,
  FiMapPin,
  FiActivity,
  FiX,
  FiExternalLink
} from 'react-icons/fi';
import {
  fetchPackageSales,
  fetchPackageSalesFollowups,
  fetchUserProfile,
  createPackageSale,
  fetchPackages
} from '../../services/packageService';

// Official Package Catalog Definitions (matching backend database)
export const DEFAULT_LOCAL_PACKAGES = [
  { packageNumber: 1, market: 'Local', price: 16000, description: 'Local Package 1' },
  { packageNumber: 2, market: 'Local', price: 22399, description: 'Local Package 2' },
  { packageNumber: 3, market: 'Local', price: 48997, description: 'Local Package 3' },
  { packageNumber: 4, market: 'Local', price: 97702, description: 'Local Package 4' },
  { packageNumber: 5, market: 'Local', price: 150000, description: 'Local Package 5' },
  { packageNumber: 6, market: 'Local', price: 200000, description: 'Local Package 6' },
  { packageNumber: 7, market: 'Local', price: 300000, description: 'Local Package 7' },
  { packageNumber: 8, market: 'Local', price: 400000, description: 'Local Package 8' },
];

export const DEFAULT_INTL_PACKAGES = [
  { packageNumber: 1, market: 'International', price: 16000, description: 'International Package 1' },
  { packageNumber: 2, market: 'International', price: 26000, description: 'International Package 2' },
  { packageNumber: 3, market: 'International', price: 45000, description: 'International Package 3' },
  { packageNumber: 4, market: 'International', price: 102000, description: 'International Package 4' },
  { packageNumber: 5, market: 'International', price: 210000, description: 'International Package 5' },
  { packageNumber: 6, market: 'International', price: 290000, description: 'International Package 6' },
  { packageNumber: 7, market: 'International', price: 410000, description: 'International Package 7' },
];

// Standard 7.5% sales commission split into two milestones (50% advance / 50% delivery)
const calculateCommission = (salesValue = 0) => {
  const commissionRate = 0.075;
  const price = Number(salesValue) || 0;
  const grossCommission = price * commissionRate;
  const commissionTax = 0; // Handled centrally in Ethiopian payroll Schedule A
  const netCommission = grossCommission;
  
  const firstCommission = netCommission / 2;
  const secondCommission = netCommission / 2;
  
  return {
    grossCommission: Number(grossCommission.toFixed(2)),
    commissionTax: Number(commissionTax.toFixed(2)),
    netCommission: Number(netCommission.toFixed(2)),
    firstCommission: Number(firstCommission.toFixed(2)),
    secondCommission: Number(secondCommission.toFixed(2))
  };
};

const PackageSalesTab = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const addCustomerDisclosure = useDisclosure();
  const profileDisclosure = useDisclosure();
  const commissionDisclosure = useDisclosure();
  const [profileLoading, setProfileLoading] = useState(false);
  const [agentProfile, setAgentProfile] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const { isOpen: isAddOpen, onOpen: onOpenAdd, onClose: onCloseAdd } = addCustomerDisclosure;
  const { isOpen: isProfileOpen, onOpen: onOpenProfile, onClose: onCloseProfile } = profileDisclosure;
  const { isOpen: isCommissionOpen, onOpen: onOpenCommission, onClose: onCloseCommission } = commissionDisclosure;
  const [packagesCatalog, setPackagesCatalog] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    customerName: '',
    contactTitle: '',
    phone: '',
    email: '',
    market: 'Local',
    packageType: '1',
    packageName: 'Local Package 1',
    packagePrice: 16000,
    note: ''
  });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [followups, setFollowups] = useState([]);
  const [followupsLoading, setFollowupsLoading] = useState(true);
  const [followupsError, setFollowupsError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef(null);
  const [activeStepTab, setActiveStepTab] = useState(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [copiedText, setCopiedText] = useState('');

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast({
      title: `${label} copied!`,
      status: 'info',
      duration: 1800,
      isClosable: true
    });
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Load packages catalog from backend
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      try {
        const pkgs = await fetchPackages();
        if (isMounted && Array.isArray(pkgs) && pkgs.length > 0) {
          setPackagesCatalog(pkgs);
        }
      } catch (err) {
        console.warn('Using default package catalog definitions:', err);
      }
    };
    loadCatalog();
    return () => { isMounted = false; };
  }, []);

  // Helper to reliably retrieve official package price for any sale
  const getSalePrice = useCallback((sale = {}) => {
    if (sale.packagePrice && Number(sale.packagePrice) > 0) return Number(sale.packagePrice);
    if (sale.packageValue && Number(sale.packageValue) > 0) return Number(sale.packageValue);
    const num = parseInt(sale.packageType, 10);
    const mkt = sale.market || 'Local';
    const found = packagesCatalog.find(p => p.packageNumber === num && p.market === mkt);
    if (found?.price) return found.price;
    const defaultList = (mkt === 'International') ? DEFAULT_INTL_PACKAGES : DEFAULT_LOCAL_PACKAGES;
    const fallback = defaultList.find(p => p.packageNumber === num);
    if (fallback?.price) return fallback.price;
    return (num || 0) * 1000;
  }, [packagesCatalog]);

  // Helper to resolve price when selecting package in form
  const getPackagePriceForSelection = useCallback((market, pkgNum) => {
    const num = parseInt(pkgNum, 10);
    const mkt = market || 'Local';
    const found = packagesCatalog.find(p => p.packageNumber === num && p.market === mkt);
    if (found?.price) return found.price;
    const defaultList = (mkt === 'International') ? DEFAULT_INTL_PACKAGES : DEFAULT_LOCAL_PACKAGES;
    const fallback = defaultList.find(p => p.packageNumber === num);
    return fallback?.price || 16000;
  }, [packagesCatalog]);

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPackageSales();
      setSales(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch package sales';
      setError(message);
      console.error('Error fetching package sales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFollowups = useCallback(async () => {
    try {
      setFollowupsLoading(true);
      const data = await fetchPackageSalesFollowups();
      setFollowups(Array.isArray(data) ? data : []);
      setFollowupsError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch package follow-ups';
      setFollowupsError(message);
      console.error('Error fetching package sales follow-ups:', err);
    } finally {
      setFollowupsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    loadFollowups();
  }, [loadFollowups]);

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarketChange = (e) => {
    const market = e.target.value;
    const price = getPackagePriceForSelection(market, newCustomer.packageType);
    setNewCustomer((prev) => ({
      ...prev,
      market,
      packagePrice: price,
      packageName: `${market} Package ${prev.packageType}`
    }));
  };

  const handlePackageTypeChange = (e) => {
    const packageType = e.target.value;
    const price = getPackagePriceForSelection(newCustomer.market, packageType);
    setNewCustomer((prev) => ({
      ...prev,
      packageType,
      packagePrice: price,
      packageName: `${prev.market} Package ${packageType}`
    }));
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.customerName.trim()) {
      toast({ title: 'Name required', status: 'warning', duration: 2000 });
      return;
    }

    setSavingCustomer(true);
    try {
      const price = Number(newCustomer.packagePrice) || getPackagePriceForSelection(newCustomer.market, newCustomer.packageType);
      const salePayload = {
        customerName: newCustomer.customerName.trim(),
        contactPerson: newCustomer.contactTitle?.trim(),
        phoneNumber: newCustomer.phone?.trim(),
        email: newCustomer.email?.trim()?.toLowerCase(),
        packageName: newCustomer.packageName?.trim() || `${newCustomer.market} Package ${newCustomer.packageType}`,
        packageType: String(newCustomer.packageType),
        market: newCustomer.market || 'Local',
        packagePrice: price,
        packageValue: price,
        status: 'Active',
        purchaseDate: new Date().toISOString(),
        notes: newCustomer.note?.trim()
      };

      await createPackageSale(salePayload);
      await Promise.all([loadSales(), loadFollowups()]);
      toast({
        title: 'Package sale registered!',
        description: `Sale registered for ETB ${price.toLocaleString()} with 7.5% commission (ETB ${(price * 0.075).toLocaleString()}).`,
        status: 'success',
        duration: 3500
      });
      setNewCustomer({
        customerName: '',
        contactTitle: '',
        phone: '',
        email: '',
        market: 'Local',
        packageType: '1',
        packageName: 'Local Package 1',
        packagePrice: 16000,
        note: ''
      });
      onCloseAdd();
    } catch (err) {
      console.error('Failed to create customer from package sales', err);
      toast({
        title: 'Could not add customer',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 3000
      });
    } finally {
      setSavingCustomer(false);
    }
  };

  const handlePrefillNewCustomer = (sale) => {
    setNewCustomer({
      customerName: sale.customerName || '',
      contactTitle: sale.contactPerson || '',
      phone: sale.phone || '',
      email: sale.email || '',
      packageName: sale.packageName || '',
      packageType: sale.packageType || '',
      note: `From package sale (${sale.customerType})`
    });
    onOpenAdd();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status = '') => {
    const normalized = status.toString().toLowerCase();
    if (normalized === 'active') return 'green';
    if (normalized === 'expired') return 'red';
    if (normalized === 'cancelled') return 'orange';
    if (normalized === 'pending') return 'yellow';
    return 'gray';
  };

  const getFollowupBadgeColor = (status = '') => {
    const normalized = status.toString().toLowerCase();
    if (normalized === 'overdue') return 'red';
    if (normalized === 'pending') return 'yellow';
    if (normalized === 'cancelled') return 'orange';
    if (normalized === 'completed') return 'green';
    return 'gray';
  };

  const handleShowAgentProfile = async (agentId) => {
    if (!agentId) return;
    setProfileLoading(true);
    try {
      const profile = await fetchUserProfile(agentId);
      setAgentProfile(profile);
      onOpenProfile();
    } catch (err) {
      console.error('Error fetching agent profile:', err);
      toast({
        title: 'Unable to load profile',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 3000
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleShowCommission = (sale) => {
    setSelectedSale(sale);
    onOpenCommission();
  };

  const normalizeEnumValue = (value, allowed) => {
    if (value === null || value === undefined || value === '') return undefined;
    const normalized = value.toString().trim().toLowerCase();
    if (!normalized) return undefined;
    return allowed.find(option => option.toLowerCase() === normalized);
  };

  const parseImportedDate = (value, XLSX) => {
    if (!value) return undefined;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }
    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        return new Date(parsed.y, parsed.m - 1, parsed.d).toISOString();
      }
    }
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toISOString();
    }
    return undefined;
  };

  const normalizePackageType = (value) => {
    if (value === null || value === undefined || value === '') return undefined;
    const raw = value.toString().trim();
    if (!raw) return undefined;
    return raw.replace(/package\s*/i, '').trim();
  };

  const getImportValue = (row, keys) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }
    return '';
  };

  const buildImportedSale = (row, XLSX) => {
    const customerNameRaw = getImportValue(row, ['Customer Name', 'customerName', 'Customer', 'Name', 'Company', 'Company Name']);
    const contactPersonRaw = getImportValue(row, ['Contact Person', 'contactPerson', 'Contact', 'Representative']);
    const emailRaw = getImportValue(row, ['Email', 'email']);
    const phoneRaw = getImportValue(row, ['Phone', 'phone', 'Phone Number', 'Mobile']);
    const packageNameRaw = getImportValue(row, ['Package Name', 'packageName']);
    const packageTypeRaw = getImportValue(row, ['Package Type', 'packageType', 'Package']);
    const purchaseDateRaw = getImportValue(row, ['Purchase Date', 'purchaseDate', 'Date']);
    const expiryDateRaw = getImportValue(row, ['Expiry Date', 'expiryDate', 'Expiration']);
    const statusRaw = getImportValue(row, ['Status', 'status']);
    const notesRaw = getImportValue(row, ['Notes', 'Note', 'notes']);

    const fallbackName = customerNameRaw || contactPersonRaw || emailRaw || phoneRaw;
    if (!fallbackName) return null;

    const customerName = fallbackName.toString().trim();
    if (!customerName) return null;

    const normalizedPackageType = normalizePackageType(packageTypeRaw);

    const payload = {
      customerName,
      contactPerson: contactPersonRaw ? contactPersonRaw.toString().trim() : undefined,
      email: emailRaw ? emailRaw.toString().trim().toLowerCase() : undefined,
      phoneNumber: phoneRaw ? phoneRaw.toString().trim() : undefined,
      packageName: packageNameRaw
        ? packageNameRaw.toString().trim()
        : (normalizedPackageType ? `Package ${normalizedPackageType}` : undefined),
      packageType: normalizedPackageType,
      purchaseDate: parseImportedDate(purchaseDateRaw, XLSX),
      expiryDate: parseImportedDate(expiryDateRaw, XLSX),
      status: normalizeEnumValue(statusRaw, ['Active', 'Expired', 'Cancelled']),
      notes: notesRaw ? notesRaw.toString().trim() : undefined
    };

    return Object.fromEntries(Object.entries(payload).filter(([_, value]) => value !== undefined && value !== ''));
  };

  const runBatch = async (items, batchSize, worker) => {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const settled = await Promise.allSettled(batch.map(worker));
      results.push(...settled);
    }
    return results;
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) {
        throw new Error('No worksheet found in the selected file.');
      }
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
      if (!rows.length) {
        toast({
          title: 'No rows found',
          description: 'The selected file does not contain any rows to import.',
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
        return;
      }

      const payloads = rows.map((row) => buildImportedSale(row, XLSX)).filter(Boolean);
      if (!payloads.length) {
        toast({
          title: 'Nothing to import',
          description: 'No valid package sales rows were found. Please check your column headers.',
          status: 'warning',
          duration: 3500,
          isClosable: true
        });
        return;
      }

      const results = await runBatch(payloads, 10, (payload) => createPackageSale(payload));
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failureCount = results.length - successCount;
      const skippedCount = rows.length - payloads.length;

      await Promise.all([loadSales(), loadFollowups()]);

      toast({
        title: 'Import complete',
        description: `Imported ${successCount} row(s). ${skippedCount ? `Skipped ${skippedCount}. ` : ''}${failureCount ? `Failed ${failureCount}.` : ''}`.trim(),
        status: failureCount ? 'warning' : 'success',
        duration: 4000,
        isClosable: true
      });
    } catch (err) {
      console.error('Package sales import failed', err);
      toast({
        title: 'Import failed',
        description: err.message || 'Unable to import the selected file.',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Spinner size="xl" color="teal.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} bg="red.50" borderRadius="md">
        <Text color="red.500" fontWeight="medium">{error}</Text>
      </Box>
    );
  }

  // Calculate total commission using actual package pricing
  const totalCommission = sales.reduce((total, sale) => {
    const packageValue = getSalePrice(sale);
    const commission = calculateCommission(packageValue);
    return total + commission.netCommission;
  }, 0);

  // Calculate average package value using actual package pricing
  const avgPackageValue = sales.length > 0 
    ? sales.reduce((total, sale) => total + getSalePrice(sale), 0) / sales.length
    : 0;

  return (
    <Box overflowX="auto">
      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Card border="1px solid" borderColor="gray.100" shadow="sm">
          <CardBody>
            <Stat>
              <StatLabel color="gray.600">Total Package Deals</StatLabel>
              <StatNumber color="teal.700">{sales.length}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card border="1px solid" borderColor="gray.100" shadow="sm">
          <CardBody>
            <Stat>
              <StatLabel color="gray.600">Total Earned Commission (7.5%)</StatLabel>
              <StatNumber color="teal.600">ETB {totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card border="1px solid" borderColor="gray.100" shadow="sm">
          <CardBody>
            <Stat>
              <StatLabel color="gray.600">Avg. Package Deal Value</StatLabel>
              <StatNumber color="blue.600">ETB {avgPackageValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Flex mb={4} justifyContent="space-between" alignItems="center" wrap="wrap" gap={3}>
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="teal.800">Package Sales & Deals</Text>
          <Text fontSize="xs" color="gray.500">Track deal lifecycles, real catalog pricing, and 7.5% milestone commissions</Text>
        </Box>
        <HStack spacing={3}>
          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            leftIcon={<FiUpload />}
            onClick={() => importFileRef.current?.click()}
            isLoading={isImporting}
            isDisabled={isImporting}
          >
            Import Excel
          </Button>
          <Button size="sm" colorScheme="teal" onClick={onOpenAdd} leftIcon={<AddIcon />}>New customer</Button>
        </HStack>
        <input
          ref={importFileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
      </Flex>
      
      {/* 1. Sliding Drawer for Registering New Package Deal */}
      <Drawer isOpen={isAddOpen} onClose={onCloseAdd} placement="right" size="lg">
        <DrawerOverlay backdropFilter="blur(3px)" bg="blackAlpha.600" />
        <DrawerContent maxW={{ base: '100vw', sm: '540px', md: '620px' }} shadow="2xl">
          <DrawerHeader bg="teal.600" color="white" py={4} px={6}>
            <Flex justify="space-between" align="center">
              <HStack spacing={3}>
                <Flex w="36px" h="36px" borderRadius="lg" bg="whiteAlpha.200" align="center" justify="center">
                  <Icon as={FiPackage} w={5} h={5} />
                </Flex>
                <Box>
                  <Text fontSize="md" fontWeight="bold">Register New Package Deal</Text>
                  <Text fontSize="xs" color="teal.100">Official catalog pricing & 7.5% milestone split</Text>
                </Box>
              </HStack>
              <DrawerCloseButton position="static" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
            </Flex>
          </DrawerHeader>

          <DrawerBody
            py={5}
            px={{ base: 4, md: 6 }}
            bg="gray.50"
            overflowY="auto"
            sx={{
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: '#f1f5f9' },
              '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
              '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' }
            }}
          >
            <VStack spacing={4} align="stretch">
              {/* Customer Profile Card */}
              <Box p={4} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="xs">
                <Text fontSize="xs" fontWeight="bold" color="teal.800" textTransform="uppercase" letterSpacing="wider" mb={3}>
                  <Icon as={FiUser} mr={1.5} /> Customer & Company Information
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} mb={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="semibold" color="gray.700">Customer / Company Name</FormLabel>
                    <Input
                      size="sm"
                      borderRadius="md"
                      name="customerName"
                      value={newCustomer.customerName}
                      onChange={handleNewCustomerChange}
                      placeholder="e.g. AM Star Group Trading"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="semibold" color="gray.700">Contact Title / Person</FormLabel>
                    <Input
                      size="sm"
                      borderRadius="md"
                      name="contactTitle"
                      value={newCustomer.contactTitle}
                      onChange={handleNewCustomerChange}
                      placeholder="e.g. Managing Director"
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="semibold" color="gray.700">Phone Number</FormLabel>
                    <Input 
                      size="sm"
                      borderRadius="md"
                      name="phone" 
                      value={newCustomer.phone} 
                      onChange={handleNewCustomerChange} 
                      placeholder="+251 9..." 
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="semibold" color="gray.700">Email Address</FormLabel>
                    <Input 
                      size="sm"
                      borderRadius="md"
                      name="email" 
                      value={newCustomer.email} 
                      onChange={handleNewCustomerChange} 
                      placeholder="client@example.com" 
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Market Segment & Package Selection */}
              <Box p={4} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="xs">
                <Text fontSize="xs" fontWeight="bold" color="teal.800" textTransform="uppercase" letterSpacing="wider" mb={3}>
                  <Icon as={FiLayers} mr={1.5} /> Market Segment & Catalog Pricing
                </Text>

                <FormControl mb={3}>
                  <FormLabel fontSize="xs" fontWeight="semibold" color="gray.700" mb={1.5}>Market Segment</FormLabel>
                  <SimpleGrid columns={2} spacing={2}>
                    <Button
                      size="sm"
                      variant={newCustomer.market === 'Local' ? 'solid' : 'outline'}
                      colorScheme="teal"
                      leftIcon={<Icon as={FiMapPin} />}
                      onClick={() => handleMarketChange({ target: { value: 'Local' } })}
                      justifyContent="flex-start"
                      height="44px"
                    >
                      <Box textAlign="left">
                        <Text fontSize="xs" fontWeight="bold">Local Ethiopian</Text>
                        <Text fontSize="10px" opacity={0.85}>ETB 16K – 400K (8 Tiers)</Text>
                      </Box>
                    </Button>
                    <Button
                      size="sm"
                      variant={newCustomer.market === 'International' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      leftIcon={<Icon as={FiGlobe} />}
                      onClick={() => handleMarketChange({ target: { value: 'International' } })}
                      justifyContent="flex-start"
                      height="44px"
                    >
                      <Box textAlign="left">
                        <Text fontSize="xs" fontWeight="bold">International</Text>
                        <Text fontSize="10px" opacity={0.85}>ETB 16K – 410K (7 Tiers)</Text>
                      </Box>
                    </Button>
                  </SimpleGrid>
                </FormControl>

                <FormControl isRequired mb={3}>
                  <FormLabel fontSize="xs" fontWeight="semibold" color="gray.700">Select Package & Official Price</FormLabel>
                  <Select
                    size="sm"
                    borderRadius="md"
                    name="packageType"
                    value={newCustomer.packageType}
                    onChange={handlePackageTypeChange}
                    fontWeight="semibold"
                  >
                    {(newCustomer.market === 'International' ? DEFAULT_INTL_PACKAGES : DEFAULT_LOCAL_PACKAGES).map((pkg) => (
                      <option key={pkg.packageNumber} value={pkg.packageNumber}>
                        Package {pkg.packageNumber} — ETB {pkg.price.toLocaleString()}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="semibold" color="gray.700">Deal Label / Package Title</FormLabel>
                  <Input
                    size="sm"
                    borderRadius="md"
                    name="packageName"
                    value={newCustomer.packageName}
                    onChange={handleNewCustomerChange}
                    placeholder="e.g. Premium Export Consultancy"
                  />
                </FormControl>
              </Box>

              {/* Live Interactive Commission Preview Card */}
              <Box p={4} bg="teal.50" borderRadius="xl" border="1px solid" borderColor="teal.200" shadow="xs">
                <Flex justify="space-between" align="center" mb={2.5}>
                  <Text fontSize="xs" fontWeight="bold" color="teal.800" textTransform="uppercase" letterSpacing="wider">
                    <Icon as={FiTrendingUp} mr={1.5} /> Live Commission Preview
                  </Text>
                  <Badge colorScheme="green" fontSize="10px">7.5% Standard Rate</Badge>
                </Flex>
                <SimpleGrid columns={2} spacing={2.5}>
                  <Box bg="white" p={2.5} borderRadius="lg" textAlign="center" border="1px solid" borderColor="teal.100" shadow="xs">
                    <Text fontSize="10px" color="gray.500" fontWeight="bold">PACKAGE VALUE</Text>
                    <Text fontSize="sm" fontWeight="extrabold" color="gray.800">
                      ETB {Number(newCustomer.packagePrice || 0).toLocaleString()}
                    </Text>
                  </Box>
                  <Box bg="white" p={2.5} borderRadius="lg" textAlign="center" border="1px solid" borderColor="teal.100" shadow="xs">
                    <Text fontSize="10px" color="teal.600" fontWeight="bold">TOTAL COMM (7.5%)</Text>
                    <Text fontSize="sm" fontWeight="extrabold" color="teal.700">
                      ETB {(Number(newCustomer.packagePrice || 0) * 0.075).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </Box>
                  <Box bg="white" p={2.5} borderRadius="lg" textAlign="center" border="1px solid" borderColor="purple.100" shadow="xs">
                    <Text fontSize="10px" color="purple.600" fontWeight="bold">MILESTONE 1 (50%)</Text>
                    <Text fontSize="xs" fontWeight="extrabold" color="purple.700">
                      ETB {(Number(newCustomer.packagePrice || 0) * 0.075 / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text fontSize="9px" color="gray.400">Advance upon deposit</Text>
                  </Box>
                  <Box bg="white" p={2.5} borderRadius="lg" textAlign="center" border="1px solid" borderColor="blue.100" shadow="xs">
                    <Text fontSize="10px" color="blue.600" fontWeight="bold">MILESTONE 2 (50%)</Text>
                    <Text fontSize="xs" fontWeight="extrabold" color="blue.700">
                      ETB {(Number(newCustomer.packagePrice || 0) * 0.075 / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text fontSize="9px" color="gray.400">Upon service delivery</Text>
                  </Box>
                </SimpleGrid>
              </Box>

              {/* Notes & Terms */}
              <Box p={4} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="xs">
                <Text fontSize="xs" fontWeight="bold" color="gray.700" textTransform="uppercase" letterSpacing="wider" mb={2}>
                  <Icon as={FiFileText} mr={1.5} /> Notes & Payment Terms
                </Text>
                <Textarea
                  size="sm"
                  borderRadius="md"
                  name="note"
                  value={newCustomer.note}
                  onChange={handleNewCustomerChange}
                  placeholder="Deposit reference number, bank slip details, or special client requests..."
                  rows={2}
                />
              </Box>
            </VStack>
          </DrawerBody>

          <DrawerFooter bg="white" borderTop="1px solid" borderColor="gray.200" py={3} px={6}>
            <HStack spacing={3} w="100%" justify="flex-end">
              <Button variant="outline" size="sm" onClick={onCloseAdd}>Cancel</Button>
              <Button colorScheme="teal" size="sm" onClick={handleCreateCustomer} isLoading={savingCustomer} leftIcon={<AddIcon />}>
                Save Package Deal
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      {/* 2. Sliding Drawer for Agent Profile */}
      <Drawer
        isOpen={isProfileOpen}
        onClose={() => {
          setAgentProfile(null);
          onCloseProfile();
        }}
        placement="right"
        size="md"
      >
        <DrawerOverlay backdropFilter="blur(3px)" bg="blackAlpha.600" />
        <DrawerContent maxW={{ base: '100vw', sm: '420px' }} shadow="2xl">
          <DrawerHeader bg="gray.800" color="white" py={4} px={6}>
            <HStack spacing={3}>
              <Icon as={FiUser} w={5} h={5} color="teal.300" />
              <Text fontSize="md" fontWeight="bold">Agent Profile</Text>
            </HStack>
            <DrawerCloseButton color="white" />
          </DrawerHeader>
          <DrawerBody p={6} bg="gray.50" overflowY="auto">
            {profileLoading ? (
              <Flex justify="center" align="center" minH="140px">
                <Spinner size="lg" color="teal.500" />
              </Flex>
            ) : (
              <VStack spacing={4} align="stretch">
                <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="xs" textAlign="center">
                  <Flex w="56px" h="56px" borderRadius="full" bg="teal.500" color="white" align="center" justify="center" mx="auto" mb={3} shadow="md">
                    <Icon as={FiUser} w={6} h={6} />
                  </Flex>
                  <Text fontWeight="bold" fontSize="lg" color="gray.800">
                    {agentProfile?.fullName || agentProfile?.username || 'Profile'}
                  </Text>
                  <Badge colorScheme="teal" mt={1}>
                    {agentProfile?.role || 'Agent'}
                  </Badge>
                </Box>

                <Box bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="xs">
                  <VStack align="stretch" spacing={2.5} fontSize="xs">
                    <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                      <Text color="gray.500" fontWeight="semibold">Email:</Text>
                      <Text fontWeight="medium">{agentProfile?.email || 'N/A'}</Text>
                    </Flex>
                    <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                      <Text color="gray.500" fontWeight="semibold">Phone:</Text>
                      <Text fontWeight="medium">{agentProfile?.phone || 'N/A'}</Text>
                    </Flex>
                    <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                      <Text color="gray.500" fontWeight="semibold">Location:</Text>
                      <Text fontWeight="medium">{agentProfile?.location || 'N/A'}</Text>
                    </Flex>
                    <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                      <Text color="gray.500" fontWeight="semibold">Employment:</Text>
                      <Text fontWeight="medium">{agentProfile?.employmentType || 'N/A'}</Text>
                    </Flex>
                    <Flex justify="space-between" py={1.5}>
                      <Text color="gray.500" fontWeight="semibold">Notes:</Text>
                      <Text fontWeight="medium">{agentProfile?.notes || '—'}</Text>
                    </Flex>
                  </VStack>
                </Box>
              </VStack>
            )}
          </DrawerBody>
          <DrawerFooter bg="white" borderTop="1px solid" borderColor="gray.200" py={3} px={6}>
            <Button size="sm" colorScheme="teal" onClick={onCloseProfile}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      {/* 3. Sliding Drawer for FedEx-Inspired Deal & Commission Tracker */}
      <Drawer isOpen={isCommissionOpen} onClose={onCloseCommission} placement="right" size="xl">
        <DrawerOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
        <DrawerContent maxW={{ base: '100vw', md: '740px', lg: '860px' }} shadow="2xl">
          <DrawerHeader bg="gray.900" color="white" py={4} px={6}>
            <Flex justify="space-between" align="center">
              <HStack spacing={3}>
                <Flex w="38px" h="38px" borderRadius="lg" bg="whiteAlpha.200" align="center" justify="center">
                  <Icon as={FiPackage} w={5} h={5} color="teal.300" />
                </Flex>
                <Box>
                  <Text fontSize="md" fontWeight="bold">Deal & Commission Tracker</Text>
                  <Text fontSize="xs" color="gray.400">Real-Time Milestone Progress & Payroll Disbursements</Text>
                </Box>
              </HStack>
              <HStack spacing={3}>
                {selectedSale && (
                  <Badge colorScheme="teal" px={3} py={1} borderRadius="full" fontSize="xs">
                    {selectedSale.market || 'Local'} • Package #{selectedSale.packageType || '1'}
                  </Badge>
                )}
                <DrawerCloseButton position="static" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
              </HStack>
            </Flex>
          </DrawerHeader>

          <DrawerBody
            p={{ base: 4, md: 6 }}
            bg="gray.50"
            overflowY="auto"
            sx={{
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: '#f1f5f9' },
              '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
              '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' }
            }}
          >
            {selectedSale && (() => {
              const salePrice = getSalePrice(selectedSale);
              const comm = calculateCommission(salePrice);
              const isFirstApproved = selectedSale.firstCommissionApproved;
              const isSecondApproved = selectedSale.secondCommissionApproved;
              const isFullyApproved = selectedSale.commissionApproved || (isFirstApproved && isSecondApproved);
              const isPaidInPayroll = Boolean(selectedSale.firstCommissionPaid || selectedSale.payrollMonth);

              // History list for the FedEx "Travel History" tab
              const historyEntries = Array.isArray(selectedSale.dealHistory) && selectedSale.dealHistory.length > 0
                ? selectedSale.dealHistory
                : [
                    {
                      stage: 'deal_created',
                      title: 'Deal Registered',
                      description: `Registered for ${selectedSale.customerName} (${selectedSale.packageName || 'Package ' + selectedSale.packageType})`,
                      timestamp: selectedSale.purchaseDate || selectedSale.createdAt || new Date(),
                      updatedBy: selectedSale.agent || 'Sales Agent'
                    },
                    ...(isFirstApproved ? [{
                      stage: 'milestone_1_approved',
                      title: 'Advance Paid & Milestone 1 Approved',
                      description: `50% commission (ETB ${comm.firstCommission.toLocaleString()}) verified and approved by Finance`,
                      timestamp: selectedSale.approvedAt || new Date(),
                      updatedBy: 'Finance'
                    }] : []),
                    ...(isSecondApproved ? [{
                      stage: 'milestone_2_approved',
                      title: 'Project Delivered & Milestone 2 Approved',
                      description: `50% commission (ETB ${comm.secondCommission.toLocaleString()}) verified and approved by Finance`,
                      timestamp: selectedSale.approvedAt || new Date(),
                      updatedBy: 'Finance'
                    }] : []),
                    ...(isFullyApproved && !isSecondApproved ? [{
                      stage: 'fully_approved',
                      title: 'Full Commission Approved',
                      description: `100% commission (ETB ${comm.netCommission.toLocaleString()}) approved for monthly payroll`,
                      timestamp: selectedSale.approvedAt || new Date(),
                      updatedBy: 'Finance'
                    }] : []),
                    ...(isPaidInPayroll ? [{
                      stage: 'payroll_disbursed',
                      title: 'Commission Disbursed in Payroll',
                      description: `Included in ${selectedSale.payrollMonth || 'Monthly'} Payroll Payout via CBE Transfer`,
                      timestamp: selectedSale.firstCommissionPaidAt || new Date(),
                      updatedBy: 'HR / Finance'
                    }] : [])
                  ];

              return (
                <VStack spacing={5} align="stretch">
                  {/* Top Status Banner (Delivery Style like FedEx) */}
                  <Box
                    p={5}
                    bg="white"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={isFullyApproved ? 'green.200' : isFirstApproved ? 'purple.200' : 'blue.200'}
                    shadow="sm"
                    textAlign="center"
                    position="relative"
                    overflow="hidden"
                  >
                    <Flex justify="center" align="center" gap={2} mb={2}>
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg={isFullyApproved ? 'green.500' : isFirstApproved ? 'purple.500' : 'blue.500'}
                      />
                      <Badge
                        px={3}
                        py={1}
                        borderRadius="full"
                        colorScheme={isFullyApproved ? 'green' : isFirstApproved ? 'purple' : 'blue'}
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        {isFullyApproved
                          ? 'Delivered & Fully Approved'
                          : isFirstApproved
                          ? 'Milestone 1 Approved (50% Advance)'
                          : 'Deal Registered — Pending Deposit'}
                      </Badge>
                    </Flex>
                    <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="black" color="gray.800">
                      {isFullyApproved
                        ? '100% Commission Approved for Payroll'
                        : isFirstApproved
                        ? 'Advance Payment Verified — 50% Payable'
                        : 'Awaiting Advance Payment Verification'}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Customer: <strong>{selectedSale.customerName}</strong> • Signed by Sales Agent: <strong>{selectedSale.agent || 'Sales Agent'}</strong>
                    </Text>
                    <Text fontSize="xs" color="gray.400" mt={0.5}>
                      Last Updated: {formatDate(selectedSale.approvedAt || selectedSale.purchaseDate)}
                    </Text>
                  </Box>

                  {/* Horizontal 4-Step Stepper Progress Bar (The FedEx Visual Stepper) */}
                  <Box p={{ base: 4, md: 6 }} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm">
                    <Flex justify="space-between" align="flex-start" position="relative">
                      {/* Connecting progress track line */}
                      <Box
                        position="absolute"
                        top="20px"
                        left="40px"
                        right="40px"
                        height="4px"
                        bg="gray.200"
                        zIndex={1}
                      >
                        <Box
                          height="100%"
                          bg="teal.500"
                          transition="width 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                          width={
                            isPaidInPayroll
                              ? '100%'
                              : isFullyApproved
                              ? '66%'
                              : isFirstApproved
                              ? '33%'
                              : '0%'
                          }
                        />
                      </Box>

                      {/* Step 1: Deal Created */}
                      <VStack 
                        zIndex={2} 
                        spacing={2} 
                        width="25%" 
                        textAlign="center" 
                        cursor="pointer" 
                        onClick={() => setActiveStepTab(activeStepTab === 1 ? null : 1)}
                        _hover={{ transform: 'translateY(-2px)' }}
                        transition="all 0.2s ease"
                      >
                        <Flex
                          w="42px"
                          h="42px"
                          borderRadius="full"
                          bg="teal.500"
                          color="white"
                          align="center"
                          justify="center"
                          shadow="md"
                          border={activeStepTab === 1 ? "3px solid #0d9488" : "none"}
                        >
                          <Icon as={CheckIcon} w={4} h={4} />
                        </Flex>
                        <Text fontSize="xs" fontWeight="bold" color="gray.800">1. Deal Created</Text>
                        <Text fontSize="10px" color="gray.500">{formatDate(selectedSale.purchaseDate)}</Text>
                        <Badge colorScheme="teal" fontSize="9px">ETB {salePrice.toLocaleString()}</Badge>
                      </VStack>

                      {/* Step 2: Advance Paid (Milestone 1 - 50%) */}
                      <VStack 
                        zIndex={2} 
                        spacing={2} 
                        width="25%" 
                        textAlign="center" 
                        cursor="pointer" 
                        onClick={() => setActiveStepTab(activeStepTab === 2 ? null : 2)}
                        _hover={{ transform: 'translateY(-2px)' }}
                        transition="all 0.2s ease"
                      >
                        <Flex
                          w="42px"
                          h="42px"
                          borderRadius="full"
                          bg={isFirstApproved || isFullyApproved ? 'teal.500' : 'white'}
                          color={isFirstApproved || isFullyApproved ? 'white' : 'gray.400'}
                          border="3px solid"
                          borderColor={isFirstApproved || isFullyApproved ? 'teal.500' : 'gray.300'}
                          align="center"
                          justify="center"
                          shadow="md"
                          boxShadow={activeStepTab === 2 ? "0 0 0 3px rgba(13, 148, 136, 0.4)" : "md"}
                        >
                          {isFirstApproved || isFullyApproved ? (
                            <Icon as={CheckIcon} w={4} h={4} />
                          ) : (
                            <Text fontSize="sm" fontWeight="bold">2</Text>
                          )}
                        </Flex>
                        <Text fontSize="xs" fontWeight="bold" color={isFirstApproved || isFullyApproved ? 'gray.800' : 'gray.500'}>
                          2. Advance (50%)
                        </Text>
                        <Text fontSize="10px" color={isFirstApproved || isFullyApproved ? 'teal.600' : 'gray.400'}>
                          {isFirstApproved || isFullyApproved ? 'Approved by Fin.' : 'Pending Deposit'}
                        </Text>
                        <Badge colorScheme={isFirstApproved || isFullyApproved ? 'purple' : 'gray'} fontSize="9px">
                          ETB {comm.firstCommission.toLocaleString()}
                        </Badge>
                      </VStack>

                      {/* Step 3: Delivered (Milestone 2 - 50%) */}
                      <VStack 
                        zIndex={2} 
                        spacing={2} 
                        width="25%" 
                        textAlign="center" 
                        cursor="pointer" 
                        onClick={() => setActiveStepTab(activeStepTab === 3 ? null : 3)}
                        _hover={{ transform: 'translateY(-2px)' }}
                        transition="all 0.2s ease"
                      >
                        <Flex
                          w="42px"
                          h="42px"
                          borderRadius="full"
                          bg={isSecondApproved || isFullyApproved ? 'teal.500' : 'white'}
                          color={isSecondApproved || isFullyApproved ? 'white' : 'gray.400'}
                          border="3px solid"
                          borderColor={isSecondApproved || isFullyApproved ? 'teal.500' : 'gray.300'}
                          align="center"
                          justify="center"
                          shadow="md"
                          boxShadow={activeStepTab === 3 ? "0 0 0 3px rgba(13, 148, 136, 0.4)" : "md"}
                        >
                          {isSecondApproved || isFullyApproved ? (
                            <Icon as={CheckIcon} w={4} h={4} />
                          ) : (
                            <Text fontSize="sm" fontWeight="bold">3</Text>
                          )}
                        </Flex>
                        <Text fontSize="xs" fontWeight="bold" color={isSecondApproved || isFullyApproved ? 'gray.800' : 'gray.500'}>
                          3. Delivered (50%)
                        </Text>
                        <Text fontSize="10px" color={isSecondApproved || isFullyApproved ? 'teal.600' : 'gray.400'}>
                          {isSecondApproved || isFullyApproved ? 'Approved by Fin.' : 'Pending Delivery'}
                        </Text>
                        <Badge colorScheme={isSecondApproved || isFullyApproved ? 'blue' : 'gray'} fontSize="9px">
                          ETB {comm.secondCommission.toLocaleString()}
                        </Badge>
                      </VStack>

                      {/* Step 4: Payroll Disbursed */}
                      <VStack 
                        zIndex={2} 
                        spacing={2} 
                        width="25%" 
                        textAlign="center" 
                        cursor="pointer" 
                        onClick={() => setActiveStepTab(activeStepTab === 4 ? null : 4)}
                        _hover={{ transform: 'translateY(-2px)' }}
                        transition="all 0.2s ease"
                      >
                        <Flex
                          w="42px"
                          h="42px"
                          borderRadius="full"
                          bg={isPaidInPayroll ? 'teal.500' : 'white'}
                          color={isPaidInPayroll ? 'white' : 'gray.400'}
                          border="3px solid"
                          borderColor={isPaidInPayroll ? 'teal.500' : 'gray.300'}
                          align="center"
                          justify="center"
                          shadow="md"
                          boxShadow={activeStepTab === 4 ? "0 0 0 3px rgba(13, 148, 136, 0.4)" : "md"}
                        >
                          {isPaidInPayroll ? (
                            <Icon as={CheckIcon} w={4} h={4} />
                          ) : (
                            <Text fontSize="sm" fontWeight="bold">4</Text>
                          )}
                        </Flex>
                        <Text fontSize="xs" fontWeight="bold" color={isPaidInPayroll ? 'gray.800' : 'gray.500'}>
                          4. Payroll Payout
                        </Text>
                        <Text fontSize="10px" color={isPaidInPayroll ? 'teal.600' : 'gray.400'}>
                          {selectedSale.payrollMonth ? `Disbursed (${selectedSale.payrollMonth})` : 'Monthly Schedule'}
                        </Text>
                        <Badge colorScheme={isPaidInPayroll ? 'green' : 'gray'} fontSize="9px">
                          ETB {comm.netCommission.toLocaleString()}
                        </Badge>
                      </VStack>
                    </Flex>

                    {/* Interactive Step Detail Spotlight */}
                    {activeStepTab && (
                      <Box mt={4} p={3} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
                        {activeStepTab === 1 && (
                          <HStack justify="space-between">
                            <Box>
                              <Text fontSize="xs" fontWeight="bold" color="teal.800">Stage 1: Deal Creation</Text>
                              <Text fontSize="11px" color="gray.600">Registered on {formatDate(selectedSale.purchaseDate)} for {selectedSale.customerName}. Contract value: ETB {salePrice.toLocaleString()}.</Text>
                            </Box>
                            <Badge colorScheme="green">Completed</Badge>
                          </HStack>
                        )}
                        {activeStepTab === 2 && (
                          <HStack justify="space-between">
                            <Box>
                              <Text fontSize="xs" fontWeight="bold" color="purple.800">Stage 2: Advance Payment Milestone (50%)</Text>
                              <Text fontSize="11px" color="gray.600">Pays 50% commission (ETB {comm.firstCommission.toLocaleString()}). Unlocked once the client's bank deposit is verified by Finance.</Text>
                            </Box>
                            <Badge colorScheme={isFirstApproved ? "green" : "yellow"}>{isFirstApproved ? "Approved" : "Pending Deposit"}</Badge>
                          </HStack>
                        )}
                        {activeStepTab === 3 && (
                          <HStack justify="space-between">
                            <Box>
                              <Text fontSize="xs" fontWeight="bold" color="blue.800">Stage 3: Service Delivery Milestone (50%)</Text>
                              <Text fontSize="11px" color="gray.600">Pays the remaining 50% commission (ETB {comm.secondCommission.toLocaleString()}). Unlocked after complete trade service handover.</Text>
                            </Box>
                            <Badge colorScheme={isSecondApproved ? "green" : "yellow"}>{isSecondApproved ? "Approved" : "Pending Delivery"}</Badge>
                          </HStack>
                        )}
                        {activeStepTab === 4 && (
                          <HStack justify="space-between">
                            <Box>
                              <Text fontSize="xs" fontWeight="bold" color="teal.800">Stage 4: Payroll Disbursement</Text>
                              <Text fontSize="11px" color="gray.600">Total net commission (ETB {comm.netCommission.toLocaleString()}) aggregated into the agent's monthly gross salary and paid via CBE transfer.</Text>
                            </Box>
                            <Badge colorScheme={isPaidInPayroll ? "green" : "purple"}>{isPaidInPayroll ? "Disbursed" : "Scheduled"}</Badge>
                          </HStack>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Mid-level Quick Facts Bar */}
                  <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3}>
                    <Box p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" shadow="xs">
                      <Text fontSize="10px" fontWeight="bold" color="gray.500" textTransform="uppercase">FROM AGENT</Text>
                      <Text fontSize="xs" fontWeight="bold" color="gray.800" noOfLines={1}>
                        {selectedSale.agent || 'Sales Agent'}
                      </Text>
                    </Box>
                    <Box p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" shadow="xs">
                      <Flex justify="space-between" align="center">
                        <Text fontSize="10px" fontWeight="bold" color="gray.500" textTransform="uppercase">TO CLIENT</Text>
                        <Icon 
                          as={copiedText === 'Customer name' ? FiCheck : FiCopy} 
                          w={3} 
                          h={3} 
                          color={copiedText === 'Customer name' ? "green.500" : "gray.400"} 
                          cursor="pointer" 
                          onClick={() => handleCopy(selectedSale.customerName, 'Customer name')}
                        />
                      </Flex>
                      <Text fontSize="xs" fontWeight="bold" color="gray.800" noOfLines={1}>
                        {selectedSale.customerName}
                      </Text>
                    </Box>
                    <Box p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" shadow="xs">
                      <Text fontSize="10px" fontWeight="bold" color="gray.500" textTransform="uppercase">PACKAGE VALUE</Text>
                      <Text fontSize="xs" fontWeight="extrabold" color="blue.700">
                        ETB {salePrice.toLocaleString()}
                      </Text>
                    </Box>
                    <Box p={3} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" shadow="xs">
                      <Text fontSize="10px" fontWeight="bold" color="gray.500" textTransform="uppercase">NET COMMISSION (7.5%)</Text>
                      <Text fontSize="xs" fontWeight="extrabold" color="teal.700">
                        ETB {comm.netCommission.toLocaleString()}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  {/* FedEx-Style Tabs: Deal & Commission History vs Package Facts */}
                  <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" overflow="hidden" shadow="sm">
                    <Tabs colorScheme="teal" variant="enclosed" isFitted>
                      <TabList bg="gray.50">
                        <Tab fontWeight="bold" fontSize="xs" py={3}>
                          <Icon as={FiClock} mr={2} /> Deal & Commission History
                        </Tab>
                        <Tab fontWeight="bold" fontSize="xs" py={3}>
                          <Icon as={FiFileText} mr={2} /> Package & Financial Facts
                        </Tab>
                      </TabList>

                      <TabPanels>
                        {/* Tab 1: Chronological Audit Log (FedEx "Travel History" style) */}
                        <TabPanel p={4}>
                          <Flex justify="space-between" align="center" mb={3}>
                            <Text fontSize="xs" fontWeight="bold" color="gray.600">Audit History Timeline</Text>
                            <Button 
                              size="xs" 
                              variant="ghost" 
                              colorScheme="teal" 
                              rightIcon={<Icon as={isHistoryExpanded ? FiChevronUp : FiChevronDown} />}
                              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                            >
                              {isHistoryExpanded ? 'Collapse History' : 'Expand History'}
                            </Button>
                          </Flex>

                          {isHistoryExpanded && (
                            <VStack align="stretch" spacing={3}>
                              {historyEntries.map((item, idx) => (
                                <Flex key={idx} align="flex-start" position="relative" p={2} borderRadius="md" _hover={{ bg: 'gray.50' }}>
                                  {/* Timeline vertical node */}
                                  <VStack mr={3} spacing={0} align="center">
                                    <Flex
                                      w="26px"
                                      h="26px"
                                      borderRadius="full"
                                      bg="teal.500"
                                      color="white"
                                      align="center"
                                      justify="center"
                                      shadow="xs"
                                    >
                                      <Icon as={CheckCircleIcon} w={3.5} h={3.5} />
                                    </Flex>
                                    {idx < historyEntries.length - 1 && (
                                      <Box w="2px" h="38px" bg="teal.200" my={1} />
                                    )}
                                  </VStack>
                                  <Box flex="1" pb={2}>
                                    <Flex justify="space-between" align="baseline">
                                      <Text fontSize="xs" fontWeight="bold" color="gray.800">
                                        {item.title}
                                      </Text>
                                      <Text fontSize="10px" color="gray.400">
                                        {new Date(item.timestamp).toLocaleString()}
                                      </Text>
                                    </Flex>
                                    <Text fontSize="xs" color="gray.600" mt={0.5}>
                                      {item.description}
                                    </Text>
                                    {item.updatedBy && (
                                      <Text fontSize="10px" color="teal.600" fontWeight="medium" mt={0.5}>
                                        Updated by: {item.updatedBy}
                                      </Text>
                                    )}
                                  </Box>
                                </Flex>
                              ))}
                            </VStack>
                          )}
                        </TabPanel>

                        {/* Tab 2: Package & Financial Facts (FedEx "Shipment Facts" style) */}
                        <TabPanel p={4}>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <Box>
                              <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={2}>
                                Customer & Deal Specifications
                              </Text>
                              <VStack align="stretch" spacing={2} fontSize="xs">
                                <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                                  <Text color="gray.600">Customer Name:</Text>
                                  <Text fontWeight="semibold">{selectedSale.customerName}</Text>
                                </Flex>
                                <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                                  <Text color="gray.600">Contact Person:</Text>
                                  <Text fontWeight="semibold">{selectedSale.contactPerson || 'N/A'}</Text>
                                </Flex>
                                <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                                  <Text color="gray.600">Phone Number:</Text>
                                  <HStack spacing={1}>
                                    <Text fontWeight="semibold">{selectedSale.phone || 'N/A'}</Text>
                                    {selectedSale.phone && (
                                      <Icon 
                                        as={FiCopy} 
                                        w={3} 
                                        h={3} 
                                        color="gray.400" 
                                        cursor="pointer" 
                                        onClick={() => handleCopy(selectedSale.phone, 'Phone number')} 
                                      />
                                    )}
                                  </HStack>
                                </Flex>
                                <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                                  <Text color="gray.600">Market Segment:</Text>
                                  <Badge colorScheme="blue">{selectedSale.market || 'Local'}</Badge>
                                </Flex>
                                <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                                  <Text color="gray.600">Package Title:</Text>
                                  <Text fontWeight="semibold">{selectedSale.packageName}</Text>
                                </Flex>
                              </VStack>
                            </Box>

                            <Box>
                              <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={2}>
                                Commission & Disbursement Schedule
                              </Text>
                              <VStack align="stretch" spacing={2} fontSize="xs">
                                <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                                  <Text color="gray.600">Package Value:</Text>
                                  <Text fontWeight="bold">ETB {salePrice.toLocaleString()}</Text>
                                </Flex>
                                <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                                  <Text color="gray.600">Commission Rate:</Text>
                                  <Badge colorScheme="teal">7.5%</Badge>
                                </Flex>
                                <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                                  <Text color="gray.600">Milestone 1 (50% Advance):</Text>
                                  <HStack spacing={1}>
                                    <Text fontWeight="bold">ETB {comm.firstCommission.toLocaleString()}</Text>
                                    <Badge colorScheme={isFirstApproved ? 'green' : 'yellow'} fontSize="10px">
                                      {isFirstApproved ? 'Approved' : 'Pending'}
                                    </Badge>
                                  </HStack>
                                </Flex>
                                <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                                  <Text color="gray.600">Milestone 2 (50% Delivery):</Text>
                                  <HStack spacing={1}>
                                    <Text fontWeight="bold">ETB {comm.secondCommission.toLocaleString()}</Text>
                                    <Badge colorScheme={isSecondApproved ? 'green' : 'yellow'} fontSize="10px">
                                      {isSecondApproved ? 'Approved' : 'Pending'}
                                    </Badge>
                                  </HStack>
                                </Flex>
                                <Flex justify="space-between" py={1.5} borderBottom="1px solid" borderColor="gray.100">
                                  <Text color="gray.600">Payroll Integration:</Text>
                                  <Badge colorScheme={isPaidInPayroll ? 'green' : 'purple'}>
                                    {selectedSale.payrollMonth ? `Disbursed in ${selectedSale.payrollMonth}` : 'Schedule A Progressive Tax'}
                                  </Badge>
                                </Flex>
                              </VStack>
                            </Box>
                          </SimpleGrid>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </Box>
                </VStack>
              );
            })()}
          </DrawerBody>

          <DrawerFooter bg="white" borderTop="1px solid" borderColor="gray.200" py={3} px={6} justifyContent="space-between">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Icon as={FiCopy} />}
              onClick={() => {
                if (!selectedSale) return;
                const salePrice = getSalePrice(selectedSale);
                const comm = calculateCommission(salePrice);
                const summary = `Deal Summary:\nCustomer: ${selectedSale.customerName}\nPackage: ${selectedSale.packageName || 'Package ' + selectedSale.packageType} (${selectedSale.market || 'Local'})\nValue: ETB ${salePrice.toLocaleString()}\nCommission (7.5%): ETB ${comm.netCommission.toLocaleString()} (Milestone 1: ETB ${comm.firstCommission.toLocaleString()}, Milestone 2: ETB ${comm.secondCommission.toLocaleString()})\nAgent: ${selectedSale.agent || 'Sales Agent'}`;
                handleCopy(summary, 'Deal summary');
              }}
            >
              Copy Summary
            </Button>
            <Button colorScheme="teal" size="sm" onClick={onCloseCommission}>Done Viewing</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      {/* Package Sales Table */}
      <Table variant="striped" size="sm">
        <Thead>
          <Tr bg="teal.600">
            <Th color="white">Customer Name</Th>
            <Th color="white">Package Title</Th>
            <Th color="white">Package Value</Th>
            <Th color="white">Commission (7.5%)</Th>
            <Th color="white">Phone</Th>
            <Th color="white">Call Status</Th>
            <Th color="white">Date</Th>
            <Th color="white">Deal Stage</Th>
            <Th color="white" textAlign="center">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {sales.length > 0 ? (
            sales.map((sale) => {
              const salePrice = getSalePrice(sale);
              const comm = calculateCommission(salePrice);
              const isFirstApproved = sale.firstCommissionApproved;
              const isSecondApproved = sale.secondCommissionApproved;
              const isFullyApproved = sale.commissionApproved || (isFirstApproved && isSecondApproved);

              return (
                <Tr key={sale.id} _hover={{ bg: 'gray.50' }}>
                  <Td fontWeight="semibold">{sale.customerName}</Td>
                  <Td>
                    <VStack align="flex-start" spacing={0}>
                      <Text fontSize="xs" fontWeight="bold">{sale.packageName || `Package ${sale.packageType}`}</Text>
                      <Text fontSize="10px" color="gray.500">{sale.market || 'Local'} • #{sale.packageType || '1'}</Text>
                    </VStack>
                  </Td>
                  <Td fontWeight="bold" color="blue.700">
                    ETB {salePrice.toLocaleString()}
                  </Td>
                  <Td fontWeight="extrabold" color="teal.700">
                    ETB {comm.netCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Td>
                  <Td fontSize="xs">{sale.phone || '-'}</Td>
                  <Td>
                    <Badge colorScheme="green" fontSize="10px">Called</Badge>
                  </Td>
                  <Td fontSize="xs">{formatDate(sale.purchaseDate)}</Td>
                  <Td>
                    <Badge
                      colorScheme={isFullyApproved ? 'green' : isFirstApproved ? 'purple' : 'blue'}
                      fontSize="10px"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                    >
                      {isFullyApproved
                        ? 'Delivered (100%)'
                        : isFirstApproved
                        ? 'Advance Paid (50%)'
                        : 'Deal Registered'}
                    </Badge>
                  </Td>
                  <Td textAlign="center">
                    <HStack spacing={2} justify="center">
                      <Button 
                        size="xs" 
                        onClick={() => handlePrefillNewCustomer(sale)}
                        leftIcon={<AddIcon />}
                      >
                        Add
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="teal"
                        onClick={() => handleShowCommission(sale)}
                        leftIcon={<Icon as={FiPackage} />}
                      >
                        Track Deal
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              );
            })
          ) : (
            <Tr>
              <Td colSpan={9} textAlign="center" py={8}>
                <Text>No package sales data available</Text>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      <Box mt={8}>
        <Text fontSize="lg" fontWeight="bold" mb={3}>Package Sales Follow-ups</Text>
        {followupsLoading ? (
          <Flex justify="center" align="center" minH="120px">
            <Spinner size="lg" color="teal.500" />
          </Flex>
        ) : followupsError ? (
          <Box bg="red.50" p={3} borderRadius="md">
            <Text color="red.600" fontWeight="medium">{followupsError}</Text>
          </Box>
        ) : (
          <Table variant="striped" size="sm">
            <Thead>
              <Tr bg="teal.500">
                <Th color="white">Customer</Th>
                <Th color="white">Package</Th>
                <Th color="white">Follow-up Status</Th>
                <Th color="white">Next Follow-up</Th>
                <Th color="white">Days</Th>
                <Th color="white">Agent</Th>
                <Th color="white">Last Interaction</Th>
                <Th color="white">Call Status</Th>
                <Th color="white">Urgency</Th>
              </Tr>
            </Thead>
            <Tbody>
              {followups.length > 0 ? (
                followups.map((followup) => (
                  <Tr key={followup.id || `${followup.customerId}-${followup.packageId}`}>
                    <Td>{followup.customerName || 'Unknown'}</Td>
                    <Td>{followup.packageName || 'N/A'}</Td>
                    <Td>
                      <Badge colorScheme={getFollowupBadgeColor(followup.followUpStatus)}>
                        {followup.followUpStatus}
                      </Badge>
                    </Td>
                    <Td>{formatDate(followup.nextFollowUpDate)}</Td>
                    <Td>{followup.daysUntilNextFollowUp ?? 'N/A'}</Td>
                    <Td>{followup.agent || 'Unassigned'}</Td>
                    <Td>{formatDate(followup.lastInteractionDate)}</Td>
                    <Td>{followup.callStatus || '-'}</Td>
                    <Td>
                      <Badge colorScheme={followup.urgency === 'High' ? 'red' : 'green'}>
                        {followup.urgency}
                      </Badge>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={9} textAlign="center" py={8}>
                    <Text>No follow-up tasks created for package sales yet.</Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        )}
      </Box>
    </Box>
  );
};

export default PackageSalesTab;
