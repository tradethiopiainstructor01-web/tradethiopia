import React, { useState, useEffect, useCallback } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
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
  SimpleGrid
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { fetchPackageSales, fetchPackageSalesFollowups, fetchUserProfile, createPackageSale } from '../../services/packageService';

// Commission calculation function (same as commission.js but without social media boost)
// Split net commission into two equal parts
const calculateCommission = (salesValue = 0) => {
  const commissionRate = 0.075;
  
  const price = Number(salesValue) || 0;
  
  // Calculate commission without social media boost
  const grossCommission = price * commissionRate;
  const commissionTax = 0; // No tax for package sales
  const netCommission = grossCommission; // Full commission since no tax
  
  // Split net commission into two equal parts
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
  const [newCustomer, setNewCustomer] = useState({
    customerName: '',
    contactTitle: '',
    phone: '',
    email: '',
    packageName: '',
    packageType: '',
    note: ''
  });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [followups, setFollowups] = useState([]);
  const [followupsLoading, setFollowupsLoading] = useState(true);
  const [followupsError, setFollowupsError] = useState(null);

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

  const handleCreateCustomer = async () => {
    if (!newCustomer.customerName.trim()) {
      toast({ title: 'Name required', status: 'warning', duration: 2000 });
      return;
    }

    setSavingCustomer(true);
    try {
      const salePayload = {
        customerName: newCustomer.customerName.trim(),
        contactPerson: newCustomer.contactTitle?.trim(),
        phoneNumber: newCustomer.phone?.trim(),
        email: newCustomer.email?.trim()?.toLowerCase(),
        packageName: newCustomer.packageName?.trim(),
        packageType: newCustomer.packageType,
        status: 'Active',
        purchaseDate: new Date().toISOString(),
        notes: newCustomer.note?.trim()
      };

      await createPackageSale(salePayload);
      await Promise.all([loadSales(), loadFollowups()]);
      toast({ title: 'Customer added', status: 'success', duration: 2500 });
      setNewCustomer({
        customerName: '',
        contactTitle: '',
        phone: '',
        email: '',
        packageName: '',
        packageType: '',
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

  // Calculate total commission
  const totalCommission = sales.reduce((total, sale) => {
    const packageValue = sale.packageType ? sale.packageType * 1000 : 0;
    const commission = calculateCommission(packageValue);
    return total + commission.netCommission;
  }, 0);

  // Calculate average package value
  const avgPackageValue = sales.length > 0 
    ? sales.reduce((total, sale) => total + (sale.packageType ? sale.packageType * 1000 : 0), 0) / sales.length
    : 0;

  return (
    <Box overflowX="auto">
      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Sales</StatLabel>
              <StatNumber>{sales.length}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Commission</StatLabel>
              <StatNumber>ETB {totalCommission.toFixed(2)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Avg. Package Value</StatLabel>
              <StatNumber>ETB {avgPackageValue.toFixed(2)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="lg" fontWeight="bold">Package Sales</Text>
        <Button size="sm" colorScheme="teal" onClick={onOpenAdd} leftIcon={<AddIcon />}>New customer</Button>
      </Box>
      
      {/* Add Customer Modal */}
      <Modal isOpen={isAddOpen} onClose={onCloseAdd} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New customer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3} isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                name="customerName"
                value={newCustomer.customerName}
                onChange={handleNewCustomerChange}
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Contact title</FormLabel>
              <Input
                name="contactTitle"
                value={newCustomer.contactTitle}
                onChange={handleNewCustomerChange}
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Phone</FormLabel>
              <Input name="phone" value={newCustomer.phone} onChange={handleNewCustomerChange} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Email</FormLabel>
              <Input name="email" value={newCustomer.email} onChange={handleNewCustomerChange} />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Package name</FormLabel>
              <Input
                name="packageName"
                value={newCustomer.packageName}
                onChange={handleNewCustomerChange}
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Package type</FormLabel>
              <Select
                name="packageType"
                value={newCustomer.packageType}
                onChange={handleNewCustomerChange}
                placeholder="Select package type"
              >
                <option value="1">Package 1</option>
                <option value="2">Package 2</option>
                <option value="3">Package 3</option>
                <option value="4">Package 4</option>
                <option value="5">Package 5</option>
                <option value="6">Package 6</option>
                <option value="7">Package 7</option>
                <option value="8">Package 8</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                name="note"
                value={newCustomer.note}
                onChange={handleNewCustomerChange}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCloseAdd}>Cancel</Button>
            <Button colorScheme="teal" onClick={handleCreateCustomer} isLoading={savingCustomer}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Agent Profile Modal */}
      <Modal
        isOpen={isProfileOpen}
        onClose={() => {
          setAgentProfile(null);
          onCloseProfile();
        }}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Agent profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {profileLoading ? (
              <Flex justify="center" align="center" minH="120px">
                <Spinner size="lg" color="teal.500" />
              </Flex>
            ) : (
              <>
                <Text fontWeight="bold" fontSize="lg">
                  {agentProfile?.fullName || agentProfile?.username || 'Profile'}
                </Text>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  {agentProfile?.role || 'Agent'}
                </Text>
                <Text mb={1}>
                  <Text as="span" color="gray.600" fontWeight="semibold">Email: </Text>
                  {agentProfile?.email || 'N/A'}
                </Text>
                <Text mb={1}>
                  <Text as="span" color="gray.600" fontWeight="semibold">Phone: </Text>
                  {agentProfile?.phone || 'N/A'}
                </Text>
                <Text mb={1}>
                  <Text as="span" color="gray.600" fontWeight="semibold">Location: </Text>
                  {agentProfile?.location || 'N/A'}
                </Text>
                <Text mb={1}>
                  <Text as="span" color="gray.600" fontWeight="semibold">Employment: </Text>
                  {agentProfile?.employmentType || 'N/A'}
                </Text>
                <Text>
                  <Text as="span" color="gray.600" fontWeight="semibold">Notes: </Text>
                  {agentProfile?.notes || '—'}
                </Text>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Commission Details Modal */}
      <Modal isOpen={isCommissionOpen} onClose={onCloseCommission} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Commission Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedSale && (
              <Box>
                <Text fontWeight="bold" fontSize="lg" mb={4}>
                  {selectedSale.customerName} - {selectedSale.packageName}
                </Text>
                
                <SimpleGrid columns={1} spacing={3}>
                  <Box p={3} bg="blue.50" borderRadius="md">
                    <Text fontSize="sm" color="gray.600">Package Value</Text>
                    <Text fontSize="xl" fontWeight="bold">
                      ETB {(selectedSale.packageType ? selectedSale.packageType * 1000 : 0).toFixed(2)}
                    </Text>
                  </Box>
                  
                  {(() => {
                    const packageValue = selectedSale.packageType ? selectedSale.packageType * 1000 : 0;
                    const commission = calculateCommission(packageValue);
                    return (
                      <>
                        <Box p={3} bg="green.50" borderRadius="md">
                          <Text fontSize="sm" color="gray.600">Gross Commission (7.5%)</Text>
                          <Text fontSize="xl" fontWeight="bold" color="green.600">
                            ETB {commission.grossCommission.toFixed(2)}
                          </Text>
                        </Box>
                        
                        <Box p={3} bg="orange.50" borderRadius="md">
                          <Text fontSize="sm" color="gray.600">Commission Tax</Text>
                          <Text fontSize="xl" fontWeight="bold" color="orange.600">
                            ETB {commission.commissionTax.toFixed(2)}
                          </Text>
                        </Box>
                        
                        <Box p={3} bg="teal.50" borderRadius="md">
                          <Text fontSize="sm" color="gray.600">Net Commission</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="teal.600">
                            ETB {commission.netCommission.toFixed(2)}
                          </Text>
                        </Box>
                        
                        <Box p={3} bg="purple.50" borderRadius="md">
                          <Text fontSize="sm" color="gray.600">First Commission (50%)</Text>
                          <Text fontSize="xl" fontWeight="bold" color="purple.600">
                            ETB {commission.firstCommission.toFixed(2)}
                          </Text>
                        </Box>
                        
                        <Box p={3} bg="pink.50" borderRadius="md">
                          <Text fontSize="sm" color="gray.600">Second Commission (50%)</Text>
                          <Text fontSize="xl" fontWeight="bold" color="pink.600">
                            ETB {commission.secondCommission.toFixed(2)}
                          </Text>
                        </Box>
                      </>
                    );
                  })()}
                </SimpleGrid>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" onClick={onCloseCommission}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Package Sales Table */}
      <Table variant="striped" size="sm">
        <Thead>
          <Tr bg="teal.500">
            <Th color="white">Customer Name</Th>
            <Th color="white">Type of Package</Th>
            <Th color="white">Package Number</Th>
            <Th color="white">Phone</Th>
            <Th color="white">Call Status</Th>
            <Th color="white">Date</Th>
            <Th color="white">Email</Th>
            <Th color="white">Notes</Th>
            <Th color="white">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {sales.length > 0 ? (
            sales.map((sale) => (
              <Tr key={sale.id} _hover={{ bg: 'gray.50' }}>
                <Td>{sale.customerName}</Td>
                <Td>{sale.packageName}</Td>
                <Td>#{sale.packageType || 'N/A'}</Td>
                <Td>{sale.phone || '-'}</Td>
                <Td>
                  <Badge colorScheme="green">Called</Badge>
                </Td>
                <Td>{formatDate(sale.purchaseDate)}</Td>
                <Td>{sale.email || '-'}</Td>
                <Td>{sale.customerType} - {sale.status || 'Active'}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Button 
                      size="xs" 
                      onClick={() => handlePrefillNewCustomer(sale)}
                      leftIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      colorScheme="teal"
                      onClick={() => handleShowCommission(sale)}
                    >
                      Commission
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))
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
