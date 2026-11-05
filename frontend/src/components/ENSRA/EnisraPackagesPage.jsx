import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Flex,
  HStack,
  VStack,
  Badge,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  useToast,
  useColorModeValue,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Tag,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  CheckCircleIcon,
  SearchIcon,
  InfoOutlineIcon
} from '@chakra-ui/icons';
import {
  FiPackage,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiCheckCircle,
  FiPlus,
  FiShoppingCart,
  FiFileText,
  FiCalendar,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import {
  fetchPackages,
  createPackage,
  updatePackage,
  deletePackage,
  fetchPackageSales,
  createPackageSale
} from '../../services/packageService';

export const DEFAULT_ENISRA_PACKAGES = [
  {
    packageNumber: 1,
    market: 'Enisra',
    price: 2700,
    services: [
      "1 job match-making per year",
      "3 months product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media"
    ],
    description: "1 job match-making per year. 3 months product/service listing on enisra's front page. 1-year advertisement on enisra's all social media."
  },
  {
    packageNumber: 2,
    market: 'Enisra',
    price: 7500,
    services: [
      "5 jobs match-making per year",
      "3 months of product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media",
      "Candidate shortlisting"
    ],
    description: "5 jobs match-making per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting."
  },
  {
    packageNumber: 3,
    market: 'Enisra',
    price: 12000,
    services: [
      "10 jobs matchmaking per year",
      "3 months of product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media",
      "Candidate shortlisting",
      "Candidates screening (interview and examination)",
      "Promoting the company at events"
    ],
    description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events."
  },
  {
    packageNumber: 4,
    market: 'Enisra',
    price: 17000,
    services: [
      "10 jobs matchmaking per year",
      "3 months of product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media",
      "Candidate shortlisting",
      "Candidates screening (interview and examination)",
      "Promoting the company at events",
      "Facilitating quarter or annual meeting",
      "1 professional advertisement brochure",
      "Business profile development",
      "Email marketing consultation"
    ],
    description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting. Candidates screening. Promoting the company at events. Facilitating quarter or annual meeting. 1 brochure. Business profile development. Email marketing consultation."
  },
  {
    packageNumber: 5,
    market: 'Enisra',
    price: 21000,
    services: [
      "10 jobs matchmaking per year",
      "3 months of product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media",
      "Candidate shortlisting & screening",
      "Promoting the company at events",
      "Facilitating quarter or annual meeting",
      "1 professional advertisement brochure",
      "Business profile development & Email marketing consultation",
      "Annual or quarter revenue consultation",
      "Developing Pro-forma & End-to-End documentation support"
    ],
    description: "10 jobs matchmaking per year. 3 months product/service listing. 1-year advertisement. Screening, events, meetings, brochure, profile, email marketing, revenue consultation, pro-forma, end-to-end documentation."
  },
  {
    packageNumber: 6,
    market: 'Enisra',
    price: 27500,
    services: [
      "10 jobs matchmaking per year",
      "3 months product/service listing on enisra's front page",
      "1-year advertisement on all social media",
      "Candidate screening & event promotion",
      "Meeting facilitation, brochure, profile development",
      "Email marketing & revenue consultation",
      "Pro-forma development & documentation support",
      "Insurance & banking plan consultation for employment life development",
      "Business Training",
      "Facilitating transportation service for employees",
      "Facilitating Uniforms for employees"
    ],
    description: "Complete business & workforce solution with training, employee transportation facilitation, uniforms, insurance & banking plan consultation, documentation, pro-forma, and marketing."
  },
  {
    packageNumber: 7,
    market: 'Enisra',
    price: 50000,
    services: [
      "10 jobs matchmaking per year",
      "Full Enisra front page & social media promotions",
      "Candidate screening, event promotion, quarterly/annual meetings",
      "Brochure, business profile, email & revenue consultation",
      "Insurance/banking plan, business training, transport & uniforms",
      "Business Documentary",
      "Quick job matching for accidental / outsourcing job"
    ],
    description: "Premium enterprise package including Business Documentary, emergency/outsourcing quick matchmaking, full marketing, training, and employee life development."
  },
  {
    packageNumber: 8,
    market: 'Enisra',
    price: 75000,
    services: [
      "10 jobs matchmaking per year",
      "Full digital & social media campaign coverage",
      "Comprehensive HR consultancy, screening, and placement",
      "Business Documentary & event promotion",
      "Consulting for removal of unused properties",
      "Facilitating time stamp machine applicability & operational training",
      "Facilitation for hotel service and transportation during field jobs",
      "Staff training and continuous consultation",
      "Before and after employment support / HR consultancy",
      "Facilitating participation in one expo"
    ],
    description: "Ultimate executive package with expo participation, timestamp machine operations, field job hotel & transportation facilitation, unused property disposal consulting, documentary, and full HR consultancy."
  }
];

const formatCurrency = (val) => {
  return `ETB ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const EnisraPackagesPage = ({ embedded = false }) => {
  const [packages, setPackages] = useState(DEFAULT_ENISRA_PACKAGES);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headerColor = useColorModeValue('teal.600', 'teal.200');

  // Modals disclosure
  const addModal = useDisclosure();
  const editModal = useDisclosure();
  const saleModal = useDisclosure();

  // State for Add Package
  const [newPkg, setNewPkg] = useState({
    packageNumber: '',
    price: '',
    description: '',
    servicesText: ''
  });
  const [isSubmittingPkg, setIsSubmittingPkg] = useState(false);

  // State for Edit Package
  const [editingPkg, setEditingPkg] = useState(null);
  const [isEditingPkg, setIsEditingPkg] = useState(false);

  // State for Record Sale
  const [newSale, setNewSale] = useState({
    customerName: '',
    contactPerson: '',
    email: '',
    phoneNumber: '',
    packageType: '1',
    packagePrice: 2700,
    packageName: 'Enisra Package 1',
    notes: ''
  });
  const [isRecordingSale, setIsRecordingSale] = useState(false);

  // Load Enisra Packages
  const loadPackagesData = async () => {
    try {
      setLoading(true);
      const data = await fetchPackages('Enisra');
      if (Array.isArray(data) && data.length > 0) {
        setPackages(data);
      } else {
        setPackages(DEFAULT_ENISRA_PACKAGES);
      }
    } catch (err) {
      console.warn('Could not fetch Enisra packages from server, using catalog:', err.message);
      setPackages(DEFAULT_ENISRA_PACKAGES);
    } finally {
      setLoading(false);
    }
  };

  // Load Enisra Sales
  const loadSalesData = async () => {
    try {
      setSalesLoading(true);
      const data = await fetchPackageSales('Enisra');
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load Enisra sales:', err.message);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    loadPackagesData();
    loadSalesData();
  }, []);

  // Handle Add Package
  const handleCreatePackage = async (e) => {
    e?.preventDefault();
    if (!newPkg.price || Number(newPkg.price) <= 0) {
      toast({
        title: 'Price required',
        description: 'Please specify a valid price in ETB.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    const services = newPkg.servicesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const nextNumber = newPkg.packageNumber 
      ? Number(newPkg.packageNumber) 
      : (packages.length > 0 ? Math.max(...packages.map(p => Number(p.packageNumber) || 0)) + 1 : 1);

    const payload = {
      packageNumber: nextNumber,
      price: Number(newPkg.price),
      description: newPkg.description || (services.length > 0 ? services[0] : `Enisra Package ${nextNumber}`),
      services: services.length > 0 ? services : [`Enisra Package ${nextNumber} Standard Inclusions`],
      market: 'Enisra'
    };

    setIsSubmittingPkg(true);
    try {
      const saved = await createPackage(payload);
      toast({
        title: 'Package Created!',
        description: `Enisra Package #${saved.packageNumber || nextNumber} added successfully.`,
        status: 'success',
        duration: 4000,
        isClosable: true
      });
      addModal.onClose();
      setNewPkg({ packageNumber: '', price: '', description: '', servicesText: '' });
      await loadPackagesData();
    } catch (err) {
      toast({
        title: 'Error adding package',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSubmittingPkg(false);
    }
  };

  // Handle Edit Package
  const handleOpenEdit = (pkg) => {
    setEditingPkg({
      ...pkg,
      servicesText: Array.isArray(pkg.services) ? pkg.services.join('\n') : (pkg.services || '')
    });
    editModal.onOpen();
  };

  const handleUpdatePackage = async (e) => {
    e?.preventDefault();
    if (!editingPkg?._id) {
      toast({
        title: 'Cannot edit default seed package directly',
        description: 'You can create a new package with the updated parameters.',
        status: 'info',
        duration: 4000,
        isClosable: true
      });
      editModal.onClose();
      return;
    }

    const services = (editingPkg.servicesText || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      packageNumber: Number(editingPkg.packageNumber),
      price: Number(editingPkg.price),
      description: editingPkg.description,
      services,
      market: 'Enisra'
    };

    setIsEditingPkg(true);
    try {
      await updatePackage(editingPkg._id, payload);
      toast({
        title: 'Package Updated',
        description: `Enisra Package #${editingPkg.packageNumber} has been updated.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      editModal.onClose();
      await loadPackagesData();
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setIsEditingPkg(false);
    }
  };

  // Handle Delete Package
  const handleDeletePackage = async (pkg) => {
    if (!pkg._id) {
      toast({
        title: 'Default catalog item',
        description: 'Default Enisra packages cannot be deleted, but you can add custom packages.',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete Enisra Package #${pkg.packageNumber}?`)) {
      return;
    }

    try {
      await deletePackage(pkg._id);
      toast({
        title: 'Package deleted',
        description: `Enisra Package #${pkg.packageNumber} was removed.`,
        status: 'info',
        duration: 3000,
        isClosable: true
      });
      await loadPackagesData();
    } catch (err) {
      toast({
        title: 'Failed to delete',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    }
  };

  // Handle Open Record Sale with pre-selected package
  const handleOpenSale = (pkg = null) => {
    const selected = pkg || packages[0] || { packageNumber: 1, price: 2700 };
    setNewSale({
      customerName: '',
      contactPerson: '',
      email: '',
      phoneNumber: '',
      packageType: String(selected.packageNumber),
      packagePrice: selected.price,
      packageName: `Enisra Package ${selected.packageNumber}`,
      notes: ''
    });
    saleModal.onOpen();
  };

  const handlePackageSelectChange = (e) => {
    const pkgNum = e.target.value;
    const found = packages.find(p => String(p.packageNumber) === String(pkgNum));
    setNewSale(prev => ({
      ...prev,
      packageType: pkgNum,
      packageName: `Enisra Package ${pkgNum}`,
      packagePrice: found ? found.price : prev.packagePrice
    }));
  };

  const handleRecordSaleSubmit = async (e) => {
    e?.preventDefault();
    if (!newSale.customerName.trim()) {
      toast({
        title: 'Customer Name Required',
        description: 'Please provide the client or company name.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsRecordingSale(true);
    try {
      const payload = {
        ...newSale,
        market: 'Enisra',
        customerType: 'EnisraPackageSales',
        purchaseDate: new Date(),
        status: 'Active'
      };

      await createPackageSale(payload);
      toast({
        title: 'Sale Registered!',
        description: `Successfully registered sale for ${newSale.customerName}.`,
        status: 'success',
        duration: 4000,
        isClosable: true
      });
      saleModal.onClose();
      await loadSalesData();
    } catch (err) {
      toast({
        title: 'Error recording sale',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsRecordingSale(false);
    }
  };

  const filteredPackages = packages.filter(pkg => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const num = String(pkg.packageNumber);
    const desc = (pkg.description || '').toLowerCase();
    const services = Array.isArray(pkg.services) ? pkg.services.join(' ').toLowerCase() : '';
    return num.includes(term) || desc.includes(term) || services.includes(term);
  });

  const minPrice = packages.length > 0 ? Math.min(...packages.map(p => p.price || 0)) : 0;
  const maxPrice = packages.length > 0 ? Math.max(...packages.map(p => p.price || 0)) : 0;

  return (
    <Box p={embedded ? 2 : { base: 3, md: 6 }}>
      {/* Header & Action Bar */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        gap={4}
        mb={6}
      >
        <Box>
          <HStack spacing={3}>
            <Icon as={FiPackage} w={7} h={7} color="teal.500" />
            <Heading as="h1" size={{ base: 'md', md: 'lg' }} color={headerColor}>
              Enisra Packages
            </Heading>
          </HStack>
          <Text fontSize="sm" color={textColor} mt={1}>
            Official Enisra recruitment & workforce service packages. Sell and manage packages directly.
          </Text>
        </Box>

        <HStack spacing={3} flexWrap="wrap">
          <Button
            leftIcon={<AddIcon />}
            colorScheme="teal"
            onClick={addModal.onOpen}
            size="md"
            boxShadow="md"
          >
            Add Package
          </Button>
          <Button
            leftIcon={<FiShoppingCart />}
            colorScheme="purple"
            onClick={() => handleOpenSale()}
            size="md"
            boxShadow="md"
          >
            Record Sale
          </Button>
        </HStack>
      </Flex>

      {/* Summary KPI Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        <Card bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardBody p={4}>
            <Stat>
              <Flex align="center" justify="space-between">
                <Box>
                  <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">TOTAL ENISRA PACKAGES</StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="extrabold" color="teal.600">
                    {packages.length}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0}>Active in catalog</StatHelpText>
                </Box>
                <Icon as={FiPackage} w={8} h={8} color="teal.400" />
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardBody p={4}>
            <Stat>
              <Flex align="center" justify="space-between">
                <Box>
                  <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">ENTRY LEVEL PACKAGE</StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="extrabold" color="green.600">
                    {formatCurrency(minPrice)}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0}>Package 1</StatHelpText>
                </Box>
                <Icon as={FiDollarSign} w={8} h={8} color="green.400" />
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardBody p={4}>
            <Stat>
              <Flex align="center" justify="space-between">
                <Box>
                  <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">PREMIUM TIER PACKAGE</StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="extrabold" color="purple.600">
                    {formatCurrency(maxPrice)}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0}>Package {packages.length}</StatHelpText>
                </Box>
                <Icon as={FiTrendingUp} w={8} h={8} color="purple.400" />
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardBody p={4}>
            <Stat>
              <Flex align="center" justify="space-between">
                <Box>
                  <StatLabel fontSize="xs" color="gray.500" fontWeight="bold">ENISRA SALES RECORDED</StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="extrabold" color="blue.600">
                    {sales.length}
                  </StatNumber>
                  <StatHelpText fontSize="xs" mb={0}>Total package sales</StatHelpText>
                </Box>
                <Icon as={FiUsers} w={8} h={8} color="blue.400" />
              </Flex>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Tabs */}
      <Tabs variant="enclosed" colorScheme="teal" bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4} boxShadow="sm">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3} mb={4}>
          <TabList borderBottom="none">
            <Tab fontWeight="bold">Package Catalog</Tab>
            <Tab fontWeight="bold">Table View</Tab>
            <Tab fontWeight="bold">
              Sales Records
              {sales.length > 0 && (
                <Badge ml={2} colorScheme="purple" borderRadius="full">
                  {sales.length}
                </Badge>
              )}
            </Tab>
          </TabList>

          <InputGroup maxW="280px" size="sm">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search Enisra packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="md"
            />
          </InputGroup>
        </Flex>

        <TabPanels>
          {/* TAB 1: Visual Cards Grid */}
          <TabPanel p={0} pt={3}>
            {loading ? (
              <Flex justify="center" align="center" py={12}>
                <Spinner size="xl" color="teal.500" />
              </Flex>
            ) : filteredPackages.length === 0 ? (
              <Box textAlign="center" py={12} color="gray.500">
                <Icon as={FiPackage} boxSize={12} mb={3} color="gray.300" />
                <Text fontSize="lg" fontWeight="semibold">No Enisra packages matched your search.</Text>
                <Button mt={3} size="sm" colorScheme="teal" onClick={addModal.onOpen}>
                  Add New Package
                </Button>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={5}>
                {filteredPackages.map((pkg) => {
                  const servicesList = Array.isArray(pkg.services)
                    ? pkg.services
                    : (pkg.description ? [pkg.description] : []);

                  return (
                    <Card
                      key={pkg._id || `enisra-${pkg.packageNumber}`}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={borderColor}
                      boxShadow="sm"
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      transition="all 0.2s"
                      _hover={{ transform: 'translateY(-3px)', boxShadow: 'md' }}
                      overflow="hidden"
                    >
                      <Box bg="teal.50" _dark={{ bg: 'teal.900' }} p={4} borderBottomWidth="1px" borderColor={borderColor}>
                        <Flex justify="space-between" align="center" mb={1}>
                          <Badge colorScheme="teal" px={2} py={0.5} borderRadius="full" fontSize="xs">
                            ENISRA #{pkg.packageNumber}
                          </Badge>
                          <HStack spacing={1}>
                            <Button
                              size="xs"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => handleOpenEdit(pkg)}
                              title="Edit package"
                            >
                              <EditIcon />
                            </Button>
                            {pkg._id && (
                              <Button
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDeletePackage(pkg)}
                                title="Delete package"
                              >
                                <DeleteIcon />
                              </Button>
                            )}
                          </HStack>
                        </Flex>
                        <Heading size="md" color="teal.700" _dark={{ color: 'teal.200' }} mt={1}>
                          Package {pkg.packageNumber}
                        </Heading>
                        <Text fontSize="2xl" fontWeight="black" color="gray.800" _dark={{ color: 'white' }} mt={2}>
                          {formatCurrency(pkg.price)}
                        </Text>
                      </Box>

                      <CardBody p={4} flex="1">
                        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.400" mb={2}>
                          INCLUDED SERVICES & BENEFITS:
                        </Text>
                        <VStack align="stretch" spacing={2}>
                          {servicesList.slice(0, 5).map((srv, idx) => (
                            <HStack key={idx} align="flex-start" spacing={2}>
                              <Icon as={FiCheckCircle} color="green.500" mt={0.5} boxSize={3.5} flexShrink={0} />
                              <Text fontSize="xs" color={textColor} lineHeight="short">
                                {srv}
                              </Text>
                            </HStack>
                          ))}
                          {servicesList.length > 5 && (
                            <Text fontSize="xs" color="teal.500" fontWeight="bold">
                              + {servicesList.length - 5} more benefits included
                            </Text>
                          )}
                        </VStack>
                      </CardBody>

                      <CardFooter p={4} pt={0}>
                        <Button
                          leftIcon={<FiShoppingCart />}
                          colorScheme="teal"
                          w="full"
                          size="sm"
                          onClick={() => handleOpenSale(pkg)}
                        >
                          Sell Package {pkg.packageNumber}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </SimpleGrid>
            )}
          </TabPanel>

          {/* TAB 2: Table View & Direct Editor */}
          <TabPanel p={0} pt={3}>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead bg="gray.50" _dark={{ bg: 'gray.700' }}>
                  <Tr>
                    <Th>#</Th>
                    <Th>Package Name</Th>
                    <Th>Price (ETB)</Th>
                    <Th>Services Count</Th>
                    <Th>Summary Description</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredPackages.map((pkg) => (
                    <Tr key={pkg._id || `enisra-tr-${pkg.packageNumber}`}>
                      <Td fontWeight="bold">
                        <Tag size="sm" colorScheme="teal">#{pkg.packageNumber}</Tag>
                      </Td>
                      <Td fontWeight="semibold">Enisra Package {pkg.packageNumber}</Td>
                      <Td fontWeight="bold" color="teal.600">
                        {formatCurrency(pkg.price)}
                      </Td>
                      <Td>
                        {Array.isArray(pkg.services) ? `${pkg.services.length} items` : '1 item'}
                      </Td>
                      <Td maxW="340px" isTruncated fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                        {pkg.description || (Array.isArray(pkg.services) ? pkg.services.join(', ') : '')}
                      </Td>
                      <Td textAlign="right">
                        <HStack spacing={2} justify="flex-end">
                          <Button
                            size="xs"
                            colorScheme="purple"
                            leftIcon={<FiShoppingCart />}
                            onClick={() => handleOpenSale(pkg)}
                          >
                            Sell
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="blue"
                            onClick={() => handleOpenEdit(pkg)}
                          >
                            Edit
                          </Button>
                          {pkg._id && (
                            <Button
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeletePackage(pkg)}
                            >
                              <DeleteIcon />
                            </Button>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>

          {/* TAB 3: Enisra Package Sales */}
          <TabPanel p={0} pt={3}>
            {salesLoading ? (
              <Flex justify="center" align="center" py={12}>
                <Spinner size="xl" color="purple.500" />
              </Flex>
            ) : sales.length === 0 ? (
              <Box textAlign="center" py={12} color="gray.500">
                <Icon as={FiShoppingCart} boxSize={12} mb={3} color="gray.300" />
                <Text fontSize="lg" fontWeight="semibold">No Enisra package sales recorded yet.</Text>
                <Text fontSize="sm" color="gray.400" mb={4}>Click "Record Sale" above to register your first Enisra client.</Text>
                <Button colorScheme="purple" size="sm" onClick={() => handleOpenSale()}>
                  Record Sale
                </Button>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead bg="gray.50" _dark={{ bg: 'gray.700' }}>
                    <Tr>
                      <Th>Customer / Company</Th>
                      <Th>Contact Person</Th>
                      <Th>Package Sold</Th>
                      <Th>Package Price</Th>
                      <Th>Est. Commission (7.5%)</Th>
                      <Th>Date</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sales.map((sale) => (
                      <Tr key={sale.id || sale._id}>
                        <Td fontWeight="bold">{sale.customerName}</Td>
                        <Td>
                          <VStack align="flex-start" spacing={0}>
                            <Text fontSize="xs" fontWeight="semibold">{sale.contactPerson || '-'}</Text>
                            {sale.phone && <Text fontSize="xs" color="gray.500">{sale.phone}</Text>}
                          </VStack>
                        </Td>
                        <Td>
                          <Tag size="sm" colorScheme="teal">
                            {sale.packageName || `Package ${sale.packageType}`}
                          </Tag>
                        </Td>
                        <Td fontWeight="semibold">{formatCurrency(sale.packagePrice || sale.packageValue)}</Td>
                        <Td color="green.600" fontWeight="bold">
                          {formatCurrency(sale.totalCommission || ((sale.packagePrice || 0) * 0.075))}
                        </Td>
                        <Td fontSize="xs">
                          {sale.purchaseDate ? new Date(sale.purchaseDate).toLocaleDateString() : '-'}
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={
                              sale.status === 'Active' ? 'green' :
                              sale.status === 'Pending' ? 'yellow' : 'gray'
                            }
                          >
                            {sale.status || 'Active'}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* MODAL: ADD ENISRA PACKAGE */}
      <Modal isOpen={addModal.isOpen} onClose={addModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleCreatePackage}>
          <ModalHeader color="teal.600">Add New Enisra Package</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Package Number</FormLabel>
                <Input
                  type="number"
                  placeholder={`Next available (e.g. ${packages.length + 1})`}
                  value={newPkg.packageNumber}
                  onChange={(e) => setNewPkg({ ...newPkg, packageNumber: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">Price (ETB)</FormLabel>
                <Input
                  type="number"
                  placeholder="e.g. 35000"
                  value={newPkg.price}
                  onChange={(e) => setNewPkg({ ...newPkg, price: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Description / Headline</FormLabel>
                <Input
                  placeholder="Short summary of this package tier"
                  value={newPkg.description}
                  onChange={(e) => setNewPkg({ ...newPkg, description: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  Included Services (1 service per line)
                </FormLabel>
                <Textarea
                  rows={4}
                  placeholder={`10 jobs matchmaking per year\nFront-page company branding for 6 months\nCandidate pre-screening & assessment`}
                  value={newPkg.servicesText}
                  onChange={(e) => setNewPkg({ ...newPkg, servicesText: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={addModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="teal" type="submit" isLoading={isSubmittingPkg}>
              Save Package
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL: EDIT ENISRA PACKAGE */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleUpdatePackage}>
          <ModalHeader color="teal.600">Edit Enisra Package #{editingPkg?.packageNumber}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingPkg && (
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Price (ETB)</FormLabel>
                  <Input
                    type="number"
                    value={editingPkg.price}
                    onChange={(e) => setEditingPkg({ ...editingPkg, price: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Description</FormLabel>
                  <Input
                    value={editingPkg.description}
                    onChange={(e) => setEditingPkg({ ...editingPkg, description: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Services (1 per line)
                  </FormLabel>
                  <Textarea
                    rows={5}
                    value={editingPkg.servicesText}
                    onChange={(e) => setEditingPkg({ ...editingPkg, servicesText: e.target.value })}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={editModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="teal" type="submit" isLoading={isEditingPkg}>
              Update Package
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL: RECORD ENISRA SALE */}
      <Modal isOpen={saleModal.isOpen} onClose={saleModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleRecordSaleSubmit}>
          <ModalHeader color="purple.600">Record Enisra Package Sale</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">Customer / Company Name</FormLabel>
                <Input
                  placeholder="e.g. Acme Tech Ethiopia"
                  value={newSale.customerName}
                  onChange={(e) => setNewSale({ ...newSale, customerName: e.target.value })}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} w="full">
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Contact Person</FormLabel>
                  <Input
                    placeholder="Full name"
                    value={newSale.contactPerson}
                    onChange={(e) => setNewSale({ ...newSale, contactPerson: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">Phone Number</FormLabel>
                  <Input
                    placeholder="+251 9..."
                    value={newSale.phoneNumber}
                    onChange={(e) => setNewSale({ ...newSale, phoneNumber: e.target.value })}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Email Address</FormLabel>
                <Input
                  type="email"
                  placeholder="company@domain.com"
                  value={newSale.email}
                  onChange={(e) => setNewSale({ ...newSale, email: e.target.value })}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Enisra Package Tier</FormLabel>
                  <Select value={newSale.packageType} onChange={handlePackageSelectChange}>
                    {packages.map(p => (
                      <option key={p.packageNumber} value={p.packageNumber}>
                        Package {p.packageNumber} — {formatCurrency(p.price)}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Final Deal Price (ETB)</FormLabel>
                  <Input
                    type="number"
                    value={newSale.packagePrice}
                    onChange={(e) => setNewSale({ ...newSale, packagePrice: Number(e.target.value) })}
                  />
                </FormControl>
              </SimpleGrid>

              {/* Commission Preview Card */}
              <Box w="full" p={3} bg="purple.50" _dark={{ bg: 'purple.900' }} borderRadius="md" borderWidth="1px" borderColor="purple.200">
                <Flex justify="space-between" align="center">
                  <Text fontSize="xs" fontWeight="bold" color="purple.800" _dark={{ color: 'purple.200' }}>
                    Agent Commission (7.5%):
                  </Text>
                  <Text fontSize="sm" fontWeight="extrabold" color="purple.700" _dark={{ color: 'purple.300' }}>
                    {formatCurrency((Number(newSale.packagePrice) || 0) * 0.075)}
                  </Text>
                </Flex>
                <Flex justify="space-between" align="center" mt={1} fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                  <Text>Milestone 1 (50% on advance):</Text>
                  <Text fontWeight="semibold">{formatCurrency(((Number(newSale.packagePrice) || 0) * 0.075) / 2)}</Text>
                </Flex>
                <Flex justify="space-between" align="center" mt={1} fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                  <Text>Milestone 2 (50% on completion):</Text>
                  <Text fontWeight="semibold">{formatCurrency(((Number(newSale.packagePrice) || 0) * 0.075) / 2)}</Text>
                </Flex>
              </Box>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Notes / Special Agreements</FormLabel>
                <Textarea
                  rows={2}
                  placeholder="Specific requirements or payment conditions..."
                  value={newSale.notes}
                  onChange={(e) => setNewSale({ ...newSale, notes: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={saleModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="purple" type="submit" isLoading={isRecordingSale}>
              Confirm & Save Deal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EnisraPackagesPage;

