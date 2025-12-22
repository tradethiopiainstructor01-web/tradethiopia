import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Badge,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid
} from '@chakra-ui/react';
import { fetchPackageSales, approveCommission } from '../../services/packageService';

// Commission calculation function (same as in PackageSalesTab)
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

const CommissionApprovalPage = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingCommission, setApprovingCommission] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCommission, setSelectedCommission] = useState(null);

  useEffect(() => {
    const loadCommissions = async () => {
      try {
        setLoading(true);
        const data = await fetchPackageSales();
        
        // Transform package sales data into commission entries
        const commissionEntries = data.map(sale => {
          const packageValue = sale.packageType ? sale.packageType * 1000 : 0;
          const commission = calculateCommission(packageValue);
          
          return {
            id: sale.id,
            customerId: sale.customerId,
            customerName: sale.customerName,
            agent: sale.agent,
            agentId: sale.agentId,
            packageType: sale.packageType,
            packageName: sale.packageName,
            packageValue,
            grossCommission: commission.grossCommission,
            commissionTax: commission.commissionTax,
            netCommission: commission.netCommission,
            firstCommission: commission.firstCommission,
            secondCommission: commission.secondCommission,
            date: sale.purchaseDate || new Date(),
            status: 'pending', // Default status
            approved: false
          };
        });
        
        setCommissions(commissionEntries);
        setError(null);
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to fetch commissions';
        setError(message);
        console.error('Error fetching commissions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCommissions();
  }, []);

  const handleApproveCommission = (commission) => {
    setSelectedCommission(commission);
    onOpen();
  };

  const confirmApproveCommission = async () => {
    try {
      setApprovingCommission(selectedCommission.id);
      
      // Make API call to approve commission and add to payroll
      await approveCommission(selectedCommission.id, {
        agentId: selectedCommission.agentId,
        firstCommission: selectedCommission.firstCommission,
        secondCommission: selectedCommission.secondCommission
      });
      
      // Update the commission status in our local state
      setCommissions(prev => prev.map(comm => 
        comm.id === selectedCommission.id 
          ? { ...comm, status: 'approved', approved: true } 
          : comm
      ));
      
      toast({
        title: 'Commission approved',
        description: `Commission for ${selectedCommission.customerName} has been approved and added to payroll.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      onClose();
    } catch (err) {
      toast({
        title: 'Approval failed',
        description: err.message || 'Failed to approve commission',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setApprovingCommission(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  // Calculate totals for summary cards
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.netCommission, 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.netCommission, 0);
  const totalCount = commissions.length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Spinner size="xl" color="teal.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Card>
          <CardBody>
            <Text color="red.500" textAlign="center">
              Error: {error}
            </Text>
          </CardBody>
        </Card>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Commission Approval</Heading>
      </Flex>

      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Commissions</StatLabel>
              <StatNumber>{totalCount}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Pending Approval</StatLabel>
              <StatNumber color="yellow.500">ETB {totalPending.toFixed(2)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Approved</StatLabel>
              <StatNumber color="green.500">ETB {totalApproved.toFixed(2)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card>
        <CardBody>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr bg="teal.500">
                  <Th color="white">Agent</Th>
                  <Th color="white">Customer</Th>
                  <Th color="white">Package</Th>
                  <Th color="white">Package Value</Th>
                  <Th color="white">First Commission</Th>
                  <Th color="white">Second Commission</Th>
                  <Th color="white">Total Commission</Th>
                  <Th color="white">Date</Th>
                  <Th color="white">Status</Th>
                  <Th color="white">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {commissions.length > 0 ? (
                  commissions.map((commission) => (
                    <Tr key={commission.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <Text fontWeight="semibold">{commission.agent}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {commission.agentId}
                        </Text>
                      </Td>
                      <Td>
                        <Text>{commission.customerName}</Text>
                      </Td>
                      <Td>
                        <Text>{commission.packageName}</Text>
                        <Text fontSize="sm" color="gray.500">
                          Type {commission.packageType}
                        </Text>
                      </Td>
                      <Td>ETB {commission.packageValue.toFixed(2)}</Td>
                      <Td>ETB {commission.firstCommission.toFixed(2)}</Td>
                      <Td>ETB {commission.secondCommission.toFixed(2)}</Td>
                      <Td>ETB {commission.netCommission.toFixed(2)}</Td>
                      <Td>
                        {new Date(commission.date).toLocaleDateString()}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(commission.status)}>
                          {commission.status}
                        </Badge>
                      </Td>
                      <Td>
                        {!commission.approved ? (
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => handleApproveCommission(commission)}
                          >
                            Approve
                          </Button>
                        ) : (
                          <Badge colorScheme="green">Approved</Badge>
                        )}
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={10} textAlign="center" py={8}>
                      <Text>No commissions found</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* Approval Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Approve Commission</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedCommission && (
              <Box>
                <Text mb={4}>
                  Are you sure you want to approve the commission for{' '}
                  <strong>{selectedCommission.customerName}</strong>?
                </Text>
                
                <Card mb={4}>
                  <CardBody>
                    <HStack justify="space-between" mb={2}>
                      <Text>Agent:</Text>
                      <Text fontWeight="semibold">{selectedCommission.agent}</Text>
                    </HStack>
                    <HStack justify="space-between" mb={2}>
                      <Text>Package Value:</Text>
                      <Text fontWeight="semibold">
                        ETB {selectedCommission.packageValue.toFixed(2)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between" mb={2}>
                      <Text>First Commission (50%):</Text>
                      <Text fontWeight="semibold" color="purple.500">
                        ETB {selectedCommission.firstCommission.toFixed(2)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Second Commission (50%):</Text>
                      <Text fontWeight="semibold" color="pink.500">
                        ETB {selectedCommission.secondCommission.toFixed(2)}
                      </Text>
                    </HStack>
                  </CardBody>
                </Card>
                
                <Text>
                  Once approved, this commission will be directly included in the payroll.
                </Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={confirmApproveCommission}
              isLoading={approvingCommission === selectedCommission?.id}
            >
              Approve Commission
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CommissionApprovalPage;