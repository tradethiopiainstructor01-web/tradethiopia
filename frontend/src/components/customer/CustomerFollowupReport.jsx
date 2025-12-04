import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from './Layout';
import jsPDF from "jspdf";
import 'jspdf-autotable';
import {
  Box,
  Flex,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Skeleton,
  Badge,
  Tooltip,
  HStack,
  VStack,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Textarea,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Icon,
  Divider
} from "@chakra-ui/react";
import { 
  FiDownload, 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiCalendar, 
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiBarChart2,
  FiTrendingUp
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

const CustomerFollowupReport = () => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  // Color mode values
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerColor = useColorModeValue("blue.700", "blue.200");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    const fetchFollowups = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/followups`);
        
        if (response.data && Array.isArray(response.data)) {
          setFollowups(response.data);
          calculateStats(response.data);
        } else {
          setError("Invalid data format received from server");
        }
      } catch (err) {
        console.error("Error fetching followups:", err);
        setError("Failed to load follow-up data. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load follow-up data",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFollowups();
  }, []);

  const calculateStats = (data) => {
    const now = new Date();
    const stats = {
      total: data.length,
      active: 0,
      completed: 0,
      pending: 0,
      overdue: 0
    };

    data.forEach(item => {
      if (item.status === 'completed') {
        stats.completed++;
      } else if (item.status === 'pending') {
        stats.pending++;
        
        // Check if the follow-up is overdue
        if (item.dueDate && new Date(item.dueDate) < now) {
          stats.overdue++;
        }
      }
    });

    stats.active = stats.total - stats.completed;
    setStats(stats);
  };

  const handleViewDetails = (followup) => {
    setSelectedFollowup(followup);
    onOpen();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = 'Follow-up Report';
    const headers = [
      'Customer',
      'Type',
      'Status',
      'Due Date',
      'Assigned To',
      'Last Updated'
    ];
    
    const data = filteredFollowups.map(followup => [
      followup.customerName || 'N/A',
      followup.type || 'General',
      followup.status || 'pending',
      followup.dueDate ? new Date(followup.dueDate).toLocaleDateString() : 'N/A',
      followup.assignedTo || 'Unassigned',
      followup.updatedAt ? new Date(followup.updatedAt).toLocaleString() : 'N/A'
    ]);

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    // Add date
    doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Add table
    doc.autoTable({
      head: [headers],
      body: data,
      startY: 40,
      styles: {
        fontSize: 10,
        cellPadding: 2,
        valign: 'middle',
        overflow: 'linebreak',
        tableWidth: 'wrap',
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 10 }
    });

    doc.save('followup-report.pdf');
    
    toast({
      title: "Report exported",
      description: "Follow-up report has been exported as PDF",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const filteredFollowups = followups.filter(followup => {
    // Filter by search term
    const matchesSearch = 
      !searchTerm || 
      (followup.customerName && followup.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (followup.assignedTo && followup.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (followup.type && followup.type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || followup.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'orange';
      case 'overdue':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (followup) => {
    if (followup.status === 'completed') return 'Completed';
    if (followup.status === 'pending') {
      if (followup.dueDate && new Date(followup.dueDate) < new Date()) {
        return 'Overdue';
      }
      return 'Pending';
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <Layout>
        <Box p={6}>
          <Skeleton height="40px" width="300px" mb={6} />
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="120px" borderRadius="lg" />
            ))}
          </SimpleGrid>
          <Skeleton height="400px" borderRadius="lg" />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box p={6}>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Flex direction="column" align="center" justify="center" py={10}>
                <Icon as={FiAlertCircle} boxSize={12} color="red.500" mb={4} />
                <Text fontSize="xl" fontWeight="bold" color="red.500" mb={2}>
                  Error Loading Report
                </Text>
                <Text color={secondaryTextColor} textAlign="center" mb={4}>
                  {error}
                </Text>
                <Button 
                  colorScheme="blue" 
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </Flex>
            </CardBody>
          </Card>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p={6}>
        {/* Header Section */}
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
          <Box>
            <Heading as="h1" size="xl" color={headerColor} mb={2}>
              Customer Follow-up Report
            </Heading>
            <Text color={secondaryTextColor}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              leftIcon={<FiDownload />}
              onClick={handleExportPDF}
              colorScheme="blue"
              size="md"
              boxShadow="md"
              _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
              transition="all 0.2s"
            >
              Export as PDF
            </Button>
          </HStack>
        </Flex>

        {/* Stats Overview */}
        <SimpleGrid 
          columns={{ base: 1, sm: 2, md: 2, lg: 4 }} 
          spacing={{ base: 4, md: 6 }} 
          mb={{ base: 6, md: 8 }}
        >
          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="blue.100"
                    color="blue.500"
                    mr={3}
                  >
                    <Icon as={FiUser} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Total Follow-ups
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="blue.500">
                  {stats.total}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="orange.100"
                    color="orange.500"
                    mr={3}
                  >
                    <Icon as={FiClock} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Active Follow-ups
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="orange.500">
                  {stats.active}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="green.100"
                    color="green.500"
                    mr={3}
                  >
                    <Icon as={FiCheckCircle} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Completed
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="green.500">
                  {stats.completed}
                </StatNumber>
                <StatHelpText>
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of total
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="red.100"
                    color="red.500"
                    mr={3}
                  >
                    <Icon as={FiAlertCircle} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Overdue
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="red.500">
                  {stats.overdue}
                </StatNumber>
                <StatHelpText>
                  {stats.pending > 0 ? Math.round((stats.overdue / stats.pending) * 100) : 0}% of pending
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters and Search */}
        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          mb={{ base: 6, md: 8 }}
        >
          <CardBody>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
              <InputGroup maxW="400px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by customer, type, or assignee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg={useColorModeValue('white', 'gray.700')}
                />
              </InputGroup>
              
              <HStack spacing={4} flexWrap="wrap">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  maxW="200px"
                  bg={useColorModeValue('white', 'gray.700')}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </Select>
                
                <Text color={secondaryTextColor} fontSize="sm">
                  Showing {filteredFollowups.length} of {followups.length} follow-ups
                </Text>
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Follow-up Table */}
        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          overflowX="auto"
        >
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md">Follow-up Details</Heading>
              <HStack spacing={3}>
                <Text color={secondaryTextColor} fontSize="sm">
                  Last updated: {new Date().toLocaleTimeString()}
                </Text>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody p={0}>
            <Table variant="simple" size="md">
              <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                <Tr>
                  <Th>Customer</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Due Date</Th>
                  <Th>Assigned To</Th>
                  <Th>Last Updated</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredFollowups.length > 0 ? (
                  filteredFollowups.map((followup) => (
                    <Tr key={followup._id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                      <Td>
                        <Text fontWeight="medium">{followup.customerName || 'N/A'}</Text>
                        <Text fontSize="sm" color={secondaryTextColor}>
                          {followup.phone || followup.email || 'No contact info'}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue" variant="subtle">
                          {followup.type || 'General'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={getStatusColor(followup.status)}
                          variant="subtle"
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          {getStatusLabel(followup)}
                        </Badge>
                      </Td>
                      <Td>
                        {followup.dueDate ? (
                          <>
                            <Text>{new Date(followup.dueDate).toLocaleDateString()}</Text>
                            <Text fontSize="xs" color={secondaryTextColor}>
                              {new Date(followup.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </>
                        ) : (
                          'Not set'
                        )}
                      </Td>
                      <Td>
                        <HStack>
                          <Box
                            w={3}
                            h={3}
                            borderRadius="full"
                            bg={followup.assignedTo ? 'green.500' : 'gray.300'}
                          />
                          <Text>{followup.assignedTo || 'Unassigned'}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        {followup.updatedAt ? (
                          <Tooltip label={new Date(followup.updatedAt).toLocaleString()}>
                            <Text>
                              {new Date(followup.updatedAt).toLocaleDateString()}
                            </Text>
                          </Tooltip>
                        ) : (
                          'N/A'
                        )}
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          leftIcon={<FiEye />}
                          onClick={() => handleViewDetails(followup)}
                          colorScheme="blue"
                          variant="ghost"
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={7} textAlign="center" py={8}>
                      <VStack spacing={2}>
                        <Icon as={FiAlertCircle} boxSize={8} color={secondaryTextColor} />
                        <Text color={secondaryTextColor}>
                          No follow-ups found matching your criteria
                        </Text>
                      </VStack>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Follow-up Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent bg={cardBg}>
            <ModalHeader>Follow-up Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedFollowup ? (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                      Customer
                    </Text>
                    <Heading size="md" mb={2}>
                      {selectedFollowup.customerName || 'N/A'}
                    </Heading>
                    <HStack spacing={4}>
                      {selectedFollowup.phone && (
                        <HStack>
                          <Icon as={FiPhone} color={secondaryTextColor} />
                          <Text>{selectedFollowup.phone}</Text>
                        </HStack>
                      )}
                      {selectedFollowup.email && (
                        <HStack>
                          <Icon as={FiMail} color={secondaryTextColor} />
                          <Text>{selectedFollowup.email}</Text>
                        </HStack>
                      )}
                    </HStack>
                  </Box>

                  <Divider />

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Type
                      </Text>
                      <Text>{selectedFollowup.type || 'General'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Status
                      </Text>
                      <Badge 
                        colorScheme={getStatusColor(selectedFollowup.status)}
                        variant="subtle"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        {getStatusLabel(selectedFollowup)}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Assigned To
                      </Text>
                      <Text>{selectedFollowup.assignedTo || 'Unassigned'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Priority
                      </Text>
                      <Text>{selectedFollowup.priority || 'Medium'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Created At
                      </Text>
                      <Text>
                        {selectedFollowup.createdAt 
                          ? new Date(selectedFollowup.createdAt).toLocaleString() 
                          : 'N/A'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                        Due Date
                      </Text>
                      <Text>
                        {selectedFollowup.dueDate 
                          ? new Date(selectedFollowup.dueDate).toLocaleString() 
                          : 'Not set'}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  <Box>
                    <Text fontSize="sm" color={secondaryTextColor} mb={1}>
                      Description
                    </Text>
                    <Box 
                      p={3} 
                      bg={useColorModeValue('gray.50', 'gray.700')} 
                      borderRadius="md"
                      minH="100px"
                    >
                      {selectedFollowup.description || 'No description provided.'}
                    </Box>
                  </Box>

                  {selectedFollowup.notes && selectedFollowup.notes.length > 0 && (
                    <Box>
                      <Text fontSize="sm" color={secondaryTextColor} mb={2}>
                        Notes
                      </Text>
                      <VStack align="stretch" spacing={3}>
                        {selectedFollowup.notes.map((note, index) => (
                          <Box 
                            key={index} 
                            p={3} 
                            bg={useColorModeValue('gray.50', 'gray.700')} 
                            borderRadius="md"
                            borderLeft="4px"
                            borderLeftColor="blue.500"
                          >
                            <Text>{note.content}</Text>
                            <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                              {note.createdBy} • {new Date(note.createdAt).toLocaleString()}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              ) : (
                <Text>Loading follow-up details...</Text>
              )}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
};

export default CustomerFollowupReport;
