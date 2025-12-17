import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Spinner,
  Flex,
  Heading,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Badge,
  IconButton,
  Tooltip,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Switch,
  FormControl,
  FormLabel,
  Textarea,
  HStack,
  VStack
} from '@chakra-ui/react';
import { AddIcon, SearchIcon, RepeatIcon, ViewIcon, EditIcon, DeleteIcon, StarIcon, CloseIcon } from '@chakra-ui/icons';
import axios from 'axios';
import Layout from '../components/customer/Layout';
import BuyerForm from '../components/BuyerForm';
import SellerForm from '../components/SellerForm';
import MatchDetails from '../components/MatchDetails';
import CustomerDetails from '../components/CustomerDetails';
import NotesLauncher from '../components/notes/NotesLauncher';

const B2BDashboard = () => {
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [savedMatches, setSavedMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [detailViewType, setDetailViewType] = useState('match'); // 'match', 'buyer', or 'seller'
  const [savedBy, setSavedBy] = useState('user@example.com'); // In a real app, this would come from auth context
  const toast = useToast();
  
  const { isOpen: isBuyerDrawerOpen, onOpen: onBuyerDrawerOpen, onClose: onBuyerDrawerClose } = useDisclosure();
  const { isOpen: isSellerDrawerOpen, onOpen: onSellerDrawerOpen, onClose: onSellerDrawerClose } = useDisclosure();
  const { isOpen: isMatchModalOpen, onOpen: onMatchModalOpen, onClose: onMatchModalClose } = useDisclosure();
  const { isOpen: isDetailModalOpen, onOpen: onDetailModalOpen, onClose: onDetailModalClose } = useDisclosure();

  // Fetch buyers and sellers
  const fetchData = async () => {
    setLoading(true);
    try {
      const [buyersRes, sellersRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/buyers`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/sellers`)
      ]);
      
      console.log('Buyers raw data:', buyersRes.data);
      console.log('Sellers raw data:', sellersRes.data);
      
      // Log details of each buyer's products
      buyersRes.data.forEach((buyer, index) => {
        console.log(`Buyer ${index} (${buyer.companyName}):`, {
          hasProducts: !!buyer.products,
          productsType: Array.isArray(buyer.products) ? 'array' : typeof buyer.products,
          productsLength: Array.isArray(buyer.products) ? buyer.products.length : 'N/A',
          products: buyer.products
        });
      });
      
      // Log details of each seller's products and certifications
      sellersRes.data.forEach((seller, index) => {
        console.log(`Seller ${index} (${seller.companyName}):`, {
          hasProducts: !!seller.products,
          productsType: Array.isArray(seller.products) ? 'array' : typeof seller.products,
          productsLength: Array.isArray(seller.products) ? seller.products.length : 'N/A',
          products: seller.products,
          hasCertifications: !!seller.certifications,
          certificationsType: Array.isArray(seller.certifications) ? 'array' : typeof seller.certifications,
          certificationsLength: Array.isArray(seller.certifications) ? seller.certifications.length : 'N/A',
          certifications: seller.certifications
        });
      });
      
      // Ensure products array exists for each buyer
      const buyersWithProducts = buyersRes.data.map(buyer => ({
        ...buyer,
        products: Array.isArray(buyer.products) ? buyer.products : []
      }));
      
      // Ensure products array exists for each seller
      const sellersWithProducts = sellersRes.data.map(seller => ({
        ...seller,
        products: Array.isArray(seller.products) ? seller.products : [],
        certifications: Array.isArray(seller.certifications) ? seller.certifications : []
      }));
      
      setBuyers(buyersWithProducts);
      setSellers(sellersWithProducts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error fetching data',
        description: error.response?.data?.error || 'Failed to fetch data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Run matching algorithm
  const runMatching = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/b2b/match`);
      setMatches(res.data.matches);
      setActiveTab(2); // Switch to matches tab
      toast({
        title: 'Matching completed',
        description: `Found ${res.data.matches.length} potential matches`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error running matching',
        description: error.response?.data?.error || 'Failed to run matching',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete buyer
  const deleteBuyer = async (id) => {
    if (window.confirm('Are you sure you want to delete this buyer?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/buyers/${id}`);
        toast({
          title: 'Buyer deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchData();
      } catch (error) {
        toast({
          title: 'Error deleting buyer',
          description: error.response?.data?.error || 'Failed to delete buyer',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Delete seller
  const deleteSeller = async (id) => {
    if (window.confirm('Are you sure you want to delete this seller?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/sellers/${id}`);
        toast({
          title: 'Seller deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchData();
      } catch (error) {
        toast({
          title: 'Error deleting seller',
          description: error.response?.data?.error || 'Failed to delete seller',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Fetch saved matches
  const fetchSavedMatches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/saved-matches`, {
        params: { savedBy: savedBy }
      });
      setSavedMatches(res.data);
    } catch (error) {
      console.error('Error fetching saved matches:', error.response?.data || error.message);
      toast({
        title: 'Error fetching saved matches',
        description: error.response?.data?.error || 'Failed to fetch saved matches',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Save a match
  const saveMatch = async (match) => {
    try {
      const matchData = {
        buyerId: match.buyerId,
        sellerId: match.sellerId,
        buyerName: match.buyerName,
        sellerName: match.sellerName,
        matchingProducts: match.matchingProducts,
        matchingCriteria: match.matchingCriteria,
        matchReasons: match.matchReasons,
        score: match.score,
        industryMatch: match.industryMatch,
        countryMatch: match.countryMatch,
        savedBy
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/api/saved-matches`, matchData);
      
      toast({
        title: 'Match saved',
        description: 'This match has been saved for later',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchSavedMatches(); // Refresh saved matches
    } catch (error) {
      toast({
        title: 'Error saving match',
        description: error.response?.data?.error || 'Failed to save match',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Delete a saved match
  const deleteSavedMatch = async (id) => {
    if (window.confirm('Are you sure you want to remove this saved match?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/saved-matches/${id}`);
        
        toast({
          title: 'Match removed',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchSavedMatches(); // Refresh saved matches
      } catch (error) {
        toast({
          title: 'Error removing match',
          description: error.response?.data?.error || 'Failed to remove match',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Clear all saved matches
  const clearAllSavedMatches = async () => {
    if (window.confirm('Are you sure you want to clear all saved matches?')) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/saved-matches/clear`, { savedBy });
        
        toast({
          title: 'All matches cleared',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchSavedMatches(); // Refresh saved matches
      } catch (error) {
        toast({
          title: 'Error clearing matches',
          description: error.response?.data?.error || 'Failed to clear matches',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Check if a match is already saved
  const isMatchSaved = (match) => {
    return savedMatches.some(savedMatch => 
      savedMatch.buyerId === match.buyerId && savedMatch.sellerId === match.sellerId
    );
  };

  // Filter data based on search term
  const filteredBuyers = buyers.filter(buyer => {
    // Ensure buyer object and its properties exist
    if (!buyer) return false;
    
    const companyName = buyer.companyName || '';
    const industry = buyer.industry || '';
    const country = buyer.country || '';
    
    return companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
           country.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredSellers = sellers.filter(seller => {
    // Ensure seller object and its properties exist
    if (!seller) return false;
    
    const companyName = seller.companyName || '';
    const industry = seller.industry || '';
    const country = seller.country || '';
    
    return companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
           country.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredMatches = matches.filter(match => 
    match.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (match.matchingProducts && match.matchingProducts.some(product => 
      product.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const filteredSavedMatches = savedMatches.filter(match => 
    match.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (match.matchingProducts && match.matchingProducts.some(product => 
      product.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  // Handle view match details
  const handleViewMatch = (match) => {
    setSelectedItem(match);
    setDetailViewType('match');
    onDetailModalOpen();
  };

  // Handle view customer details
  const handleViewCustomer = async (customer, type) => {
    console.log('=== handleViewCustomer Debug Info ===');
    console.log('Initial customer data:', JSON.stringify(customer, null, 2));
    console.log('Customer has products property:', !!customer.products);
    console.log('Customer products:', customer.products);
    console.log('Customer type:', type);
    console.log('========================');
    
    // Always fetch the full customer details to ensure we have the latest data
    try {
      setLoading(true);
      const endpoint = type === 'buyer' 
        ? `${import.meta.env.VITE_API_URL}/api/buyers/${customer._id}`
        : `${import.meta.env.VITE_API_URL}/api/sellers/${customer._id}`;
      
      console.log('Fetching full customer details from:', endpoint);
      const response = await axios.get(endpoint);
      console.log('Full customer details response:', JSON.stringify(response.data, null, 2));
      
      setSelectedItem(response.data);
      setDetailViewType(type); // 'buyer' or 'seller'
      onDetailModalOpen();
    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
      toast({
        title: `Error fetching ${type} details`,
        description: error.response?.data?.error || `Failed to fetch ${type} details`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit buyer
  const handleEditBuyer = (buyer) => {
    setSelectedItem(buyer);
    onBuyerDrawerOpen();
  };

  // Handle edit seller
  const handleEditSeller = (seller) => {
    setSelectedItem(seller);
    onSellerDrawerOpen();
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchData();
        await fetchSavedMatches();
      }
    };
    
    loadData().catch(error => {
      console.error('Error in useEffect:', error);
    });
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Layout>
      <Box p={6}>
        <Flex justifyContent="space-between" alignItems="center" mb={6}>
          <Heading as="h1" size="xl">B2B International Marketplace</Heading>
          <HStack spacing={3}>
            <Button 
              leftIcon={<RepeatIcon />} 
              colorScheme="teal" 
              onClick={runMatching}
              isLoading={loading}
            >
              Run Matching
            </Button>
            <NotesLauncher
              buttonProps={{
                size: 'sm',
                variant: 'ghost',
                colorScheme: 'teal',
                'aria-label': 'Notes',
              }}
              tooltipLabel="Notes"
            />
          </HStack>
        </Flex>

        <Card mb={6}>
          <CardBody>
            <StatGroup>
              <Stat>
                <StatLabel>Buyers</StatLabel>
                <StatNumber>{buyers.length}</StatNumber>
                <StatHelpText>Registered companies</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Sellers</StatLabel>
                <StatNumber>{sellers.length}</StatNumber>
                <StatHelpText>Registered companies</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Matches</StatLabel>
                <StatNumber>{matches.length}</StatNumber>
                <StatHelpText>Potential connections</StatHelpText>
              </Stat>
            </StatGroup>
          </CardBody>
        </Card>

        <Flex mb={4} gap={3} alignItems="center">
          <Input
            placeholder="Search buyers, sellers, or products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            width="300px"
          />
          <Tooltip label="Refresh data">
            <IconButton
              icon={<RepeatIcon />}
              onClick={fetchData}
              isLoading={loading}
              size="sm"
            />
          </Tooltip>
          
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="teal" 
            onClick={() => {
              setSelectedItem(null);
              onBuyerDrawerOpen();
            }}
            display={activeTab === 0 ? 'inline-flex' : 'none'}
            size="sm"
          >
            Add Buyer
          </Button>
          
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="teal" 
            onClick={() => {
              setSelectedItem(null);
              onSellerDrawerOpen();
            }}
            display={activeTab === 1 ? 'inline-flex' : 'none'}
            size="sm"
          >
            Add Seller
          </Button>
        </Flex>

        <Tabs index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Buyers ({buyers.length})</Tab>
            <Tab>Sellers ({sellers.length})</Tab>
            <Tab>Matches ({matches.length})</Tab>
            <Tab>Saved Matches ({savedMatches.length})</Tab>
          </TabList>

          <TabPanels>
            {/* Buyers Tab */}
            <TabPanel>
              <Box overflowX="auto">
                {loading ? (
                  <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" />
                  </Flex>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Company Name</Th>
                        <Th>Contact Person</Th>
                        <Th>Email</Th>
                        <Th>Country</Th>
                        <Th>Industry</Th>
                        <Th>Products</Th>
                        <Th>Status</Th>
                        <Th width="120px">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredBuyers.map((buyer) => (
                        <Tr key={buyer._id}>
                          <Td>{buyer.companyName}</Td>
                          <Td>{buyer.contactPerson}</Td>
                          <Td>{buyer.email}</Td>
                          <Td>{buyer.country}</Td>
                          <Td>{buyer.industry}</Td>
                          <Td>
                            <Flex wrap="wrap" gap={1}>
                              {buyer.products && Array.isArray(buyer.products) && buyer.products.length > 0 ? (
                                <>
                                  {buyer.products.slice(0, 3).map((product, idx) => (
                                    <Badge key={`${buyer._id}-${idx}`} colorScheme="blue" fontSize="0.7em" py="0.5">
                                      {product}
                                    </Badge>
                                  ))}
                                  {buyer.products.length > 3 && (
                                    <Badge colorScheme="gray" fontSize="0.7em" py="0.5">
                                      +{buyer.products.length - 3}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <Text fontSize="0.8em" color="gray.500">
                                  {buyer.products ? 'No products' : 'Products not loaded'}
                                </Text>
                              )}
                            </Flex>
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={buyer.status === 'Active' ? 'green' : buyer.status === 'Inactive' ? 'yellow' : 'red'}
                              fontSize="0.8em"
                            >
                              {buyer.status}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <IconButton 
                                aria-label="View" 
                                icon={<ViewIcon />} 
                                size="xs"
                                onClick={() => handleViewCustomer(buyer, 'buyer')}
                              />
                              <IconButton 
                                aria-label="Edit" 
                                icon={<EditIcon />} 
                                size="xs"
                                onClick={() => handleEditBuyer(buyer)}
                              />
                              <IconButton 
                                aria-label="Delete" 
                                icon={<DeleteIcon />} 
                                size="xs"
                                colorScheme="red"
                                onClick={() => deleteBuyer(buyer._id)}
                              />
                            </HStack>
                          </Td>

                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </TabPanel>

            {/* Sellers Tab */}
            <TabPanel>
              <Box overflowX="auto">
                {loading ? (
                  <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" />
                  </Flex>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Company Name</Th>
                        <Th>Contact Person</Th>
                        <Th>Email</Th>
                        <Th>Country</Th>
                        <Th>Industry</Th>
                        <Th>Products</Th>
                        <Th>Certifications</Th>
                        <Th>Status</Th>
                        <Th width="120px">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredSellers.map((seller) => (
                        <Tr key={seller._id}>
                          <Td>{seller.companyName}</Td>
                          <Td>{seller.contactPerson}</Td>
                          <Td>{seller.email}</Td>
                          <Td>{seller.country}</Td>
                          <Td>{seller.industry}</Td>
                          <Td>
                            <Flex wrap="wrap" gap={1}>
                              {seller.products && Array.isArray(seller.products) && seller.products.length > 0 ? (
                                <>
                                  {seller.products.slice(0, 3).map((product, idx) => (
                                    <Badge key={`${seller._id}-${idx}`} colorScheme="blue" fontSize="0.7em" py="0.5">
                                      {product}
                                    </Badge>
                                  ))}
                                  {seller.products.length > 3 && (
                                    <Badge colorScheme="gray" fontSize="0.7em" py="0.5">
                                      +{seller.products.length - 3}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <Text fontSize="0.8em" color="gray.500">
                                  {seller.products ? 'No products' : 'Products not loaded'}
                                </Text>
                              )}
                            </Flex>
                          </Td>
                          <Td>
                            <Flex wrap="wrap" gap={1}>
                              {seller.certifications && Array.isArray(seller.certifications) && seller.certifications.length > 0 ? (
                                <>
                                  {seller.certifications.slice(0, 2).map((cert, idx) => (
                                    <Badge key={`${seller._id}-cert-${idx}`} colorScheme="green" fontSize="0.7em" py="0.5">
                                      {cert}
                                    </Badge>
                                  ))}
                                  {seller.certifications.length > 2 && (
                                    <Badge colorScheme="gray" fontSize="0.7em" py="0.5">
                                      +{seller.certifications.length - 2}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <Text fontSize="0.8em" color="gray.500">
                                  {seller.certifications ? 'No certifications' : 'Certifications not loaded'}
                                </Text>
                              )}
                            </Flex>
                          </Td>

                          <Td>
                            <Badge 
                              colorScheme={seller.status === 'Active' ? 'green' : seller.status === 'Inactive' ? 'yellow' : 'red'}
                              fontSize="0.8em"
                            >
                              {seller.status}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <IconButton 
                                aria-label="View" 
                                icon={<ViewIcon />} 
                                size="xs"
                                onClick={() => handleViewCustomer(seller, 'seller')}
                              />
                              <IconButton 
                                aria-label="Edit" 
                                icon={<EditIcon />} 
                                size="xs"
                                onClick={() => handleEditSeller(seller)}
                              />
                              <IconButton 
                                aria-label="Delete" 
                                icon={<DeleteIcon />} 
                                size="xs"
                                colorScheme="red"
                                onClick={() => deleteSeller(seller._id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </TabPanel>

            {/* Matches Tab */}
            <TabPanel>
              <Box overflowX="auto">
                {loading ? (
                  <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" />
                  </Flex>
                ) : matches.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" height="200px" textAlign="center">
                    <Text fontSize="lg" mb={4}>No matches found yet.</Text>
                    <Text mb={4}>Run the matching algorithm to find potential connections between buyers and sellers.</Text>
                    <Button 
                      leftIcon={<RepeatIcon />} 
                      colorScheme="teal" 
                      onClick={runMatching}
                    >
                      Run Matching Now
                    </Button>
                  </Flex>
                ) : (
                  <>
                    <Flex mb={4} justify="space-between">
                      <Text fontWeight="bold">Showing {matches.length} potential matches</Text>
                    </Flex>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Buyer Company</Th>
                          <Th>Seller Company</Th>
                          <Th>Match Score</Th>
                          <Th>Why Matched</Th>
                          <Th>Matching Products</Th>
                          <Th width="140px">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredMatches.map((match, index) => (
                          <Tr key={index}>
                            <Td>{match.buyerName}</Td>
                            <Td>{match.sellerName}</Td>
                            <Td>
                              <Badge colorScheme={match.score > 70 ? 'green' : match.score > 40 ? 'yellow' : 'red'}>
                                {match.score}%
                              </Badge>
                            </Td>
                            <Td>
                              {match.matchReasons && match.matchReasons.length > 0 ? (
                                <Flex direction="column" fontSize="0.8em">
                                  <Text noOfLines={1}>
                                    • {match.matchReasons[0]}
                                  </Text>
                                  {match.matchReasons.length > 1 && (
                                    <Text color="gray.500" fontSize="0.7em">
                                      +{match.matchReasons.length - 1} more
                                    </Text>
                                  )}
                                </Flex>
                              ) : (
                                <Text fontSize="0.8em">No reasons</Text>
                              )}
                            </Td>
                            <Td>
                              {match.matchingProducts && match.matchingProducts.length > 0 ? (
                                <Flex wrap="wrap" gap={1}>
                                  {match.matchingProducts.slice(0, 2).map((product, idx) => (
                                    <Badge key={idx} colorScheme="blue" fontSize="0.7em" py="0.5">
                                      {product}
                                    </Badge>
                                  ))}
                                  {match.matchingProducts.length > 2 && (
                                    <Badge colorScheme="gray" fontSize="0.7em" py="0.5">
                                      +{match.matchingProducts.length - 2}
                                    </Badge>
                                  )}
                                </Flex>
                              ) : (
                                <Text fontSize="0.8em">No products</Text>
                              )}
                            </Td>
                            <Td>
                              <VStack spacing={1} align="stretch">
                                <Button 
                                  size="xs" 
                                  leftIcon={<ViewIcon />} 
                                  onClick={() => handleViewMatch(match)}
                                  width="100%"
                                >
                                  Details
                                </Button>
                                <Button
                                  size="xs"
                                  leftIcon={isMatchSaved(match) ? <StarIcon /> : null}
                                  colorScheme={isMatchSaved(match) ? "yellow" : "gray"}
                                  onClick={() => saveMatch(match)}
                                  isLoading={loading}
                                  width="100%"
                                >
                                  {isMatchSaved(match) ? "Saved" : "Save"}
                                </Button>
                              </VStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </>
                )}
              </Box>
            </TabPanel>

            {/* Saved Matches Tab */}
            <TabPanel>
              <Box overflowX="auto">
                {loading ? (
                  <Flex justify="center" align="center" height="200px">
                    <Spinner size="xl" />
                  </Flex>
                ) : filteredSavedMatches.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" height="200px" textAlign="center">
                    <Text fontSize="lg" mb={4}>No saved matches found.</Text>
                    <Text mb={4}>Save interesting matches from the Matches tab to view them here.</Text>
                  </Flex>
                ) : (
                  <>
                    <Flex mb={4} justify="space-between">
                      <Text fontWeight="bold">Showing {filteredSavedMatches.length} saved matches</Text>
                    </Flex>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Buyer Company</Th>
                          <Th>Seller Company</Th>
                          <Th>Match Score</Th>
                          <Th>Why Matched</Th>
                          <Th>Matching Products</Th>
                          <Th>Saved Date</Th>
                          <Th width="140px">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredSavedMatches.map((match, index) => (
                          <Tr key={match._id || `saved-${index}`}>
                            <Td>{match.buyerName}</Td>
                            <Td>{match.sellerName}</Td>
                            <Td>
                              <Badge colorScheme={match.score > 70 ? 'green' : match.score > 40 ? 'yellow' : 'red'}>
                                {match.score}%
                              </Badge>
                            </Td>
                            <Td>
                              {match.matchReasons && match.matchReasons.length > 0 ? (
                                <Flex direction="column" fontSize="0.8em">
                                  <Text noOfLines={1}>
                                    • {match.matchReasons[0]}
                                  </Text>
                                  {match.matchReasons.length > 1 && (
                                    <Text color="gray.500" fontSize="0.7em">
                                      +{match.matchReasons.length - 1} more
                                    </Text>
                                  )}
                                </Flex>
                              ) : (
                                <Text fontSize="0.8em">No reasons</Text>
                              )}
                            </Td>
                            <Td>
                              {match.matchingProducts && match.matchingProducts.length > 0 ? (
                                <Flex wrap="wrap" gap={1}>
                                  {match.matchingProducts.slice(0, 2).map((product, idx) => (
                                    <Badge key={idx} colorScheme="blue" fontSize="0.7em" py="0.5">
                                      {product}
                                    </Badge>
                                  ))}
                                  {match.matchingProducts.length > 2 && (
                                    <Badge colorScheme="gray" fontSize="0.7em" py="0.5">
                                      +{match.matchingProducts.length - 2}
                                    </Badge>
                                  )}
                                </Flex>
                              ) : (
                                <Text fontSize="0.8em">No products</Text>
                              )}
                            </Td>
                            <Td>{new Date(match.createdAt).toLocaleDateString()}</Td>
                            <Td>
                              <VStack spacing={1} align="stretch">
                                <Button 
                                  size="xs" 
                                  leftIcon={<ViewIcon />} 
                                  onClick={() => handleViewMatch(match)}
                                  width="100%"
                                >
                                  Details
                                </Button>
                                <Button
                                  size="xs"
                                  leftIcon={<DeleteIcon />}
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={() => deleteSavedMatch(match._id)}
                                  width="100%"
                                >
                                  Remove
                                </Button>
                              </VStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </>
                )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Buyer Form Drawer */}
      <Drawer isOpen={isBuyerDrawerOpen} placement="right" size="md" onClose={onBuyerDrawerClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{selectedItem ? 'Edit Buyer' : 'Add New Buyer'}</DrawerHeader>
          <DrawerBody>
            <BuyerForm 
              initialData={selectedItem} 
              onSuccess={() => {
                fetchData();
                onBuyerDrawerClose();
              }} 
            />
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onBuyerDrawerClose}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Seller Form Drawer */}
      <Drawer isOpen={isSellerDrawerOpen} placement="right" size="md" onClose={onSellerDrawerClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{selectedItem ? 'Edit Seller' : 'Add New Seller'}</DrawerHeader>
          <DrawerBody>
            <SellerForm 
              initialData={selectedItem} 
              onSuccess={() => {
                fetchData();
                onSellerDrawerClose();
              }} 
            />
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onSellerDrawerClose}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Detail View Modal (for customers and matches) */}
      <Modal isOpen={isDetailModalOpen} onClose={onDetailModalClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="80%">
          <ModalHeader>
            {detailViewType === 'match' ? 'Match Details' : 
             detailViewType === 'buyer' ? 'Buyer Details' : 'Seller Details'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedItem && detailViewType === 'match' ? (
              <MatchDetails 
                match={selectedItem} 
                onBack={onDetailModalClose} 
                onSaveMatch={saveMatch}
                isMatchSaved={isMatchSaved(selectedItem)}
                savedBy={savedBy}
              />
            ) : selectedItem && (detailViewType === 'buyer' || detailViewType === 'seller') ? (
              <CustomerDetails 
                customer={selectedItem} 
                customerType={detailViewType}
                onBack={onDetailModalClose} 
                onEdit={detailViewType === 'buyer' ? handleEditBuyer : handleEditSeller}
              />
            ) : (
              <Text>No details available</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onDetailModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default B2BDashboard;
