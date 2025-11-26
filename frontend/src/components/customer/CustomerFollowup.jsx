import { useState, useEffect } from "react";
import axios from "axios";
import Layout from "./Layout";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  Text,
  Spinner,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  Textarea,
  IconButton,
  useMediaQuery,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Tooltip,
  useToast,
  Flex,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  useColorModeValue,
  Radio,
  RadioGroup,
} from "@chakra-ui/react";
import { 
  ArrowBackIcon, 
  EditIcon, 
  DeleteIcon, 
  DownloadIcon,
  SearchIcon,
  RepeatIcon,
  CheckIcon,
  SmallCloseIcon,
  AddIcon,
} from "@chakra-ui/icons";
import EditCustomerInfo from "./EditCustomerInfo";

const CustomerFollowup = () => {
  const [data, setData] = useState([]);
  const [pendingB2BCustomers, setPendingB2BCustomers] = useState([]);
  const [completedSales, setCompletedSales] = useState([]);
  const [loadingTraining, setLoadingTraining] = useState(false);
  const [trainingError, setTrainingError] = useState("");
  const [trainingFollowups, setTrainingFollowups] = useState([]);
  const [ensraFollowups, setEnsraFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingB2B, setLoadingB2B] = useState(false);
  const [error, setError] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [note, setNote] = useState("");
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpdateCard, setShowUpdateCard] = useState(false);
  const [updatedServiceProvided, setUpdatedServiceProvided] = useState("");
  const [updatedServiceNotProvided, setUpdatedServiceNotProvided] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [showEnsraFormCard, setShowEnsraFormCard] = useState(false);
  const toast = useToast();
  
  // Responsive breakpoints
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");
  const [isLargerThan1024] = useMediaQuery("(min-width: 1024px)");
  
  // Color mode values for consistent theming
  const cardBg = useColorModeValue("white", "gray.700");
  const headerBg = useColorModeValue("blue.500", "blue.600");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const [isMobile] = useMediaQuery("(max-width: 768px)");

  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups`);
      if (Array.isArray(response.data)) {
        setData(response.data);
        setFilteredData(response.data);
      } else {
        setData([]);
        setFilteredData([]);
        setError("Invalid data format received from server");
      }
      setLoading(false);
    } catch (err) {
      console.error("API Error:", err);
      setData([]);
      setFilteredData([]);
      setError("Failed to fetch data: " + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const fetchCompletedSales = async () => {
    setLoadingTraining(true);
    setTrainingError("");
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/followup`);
      if (Array.isArray(response.data)) {
        const completed = response.data.filter((item) => item.status === "Completed");
        setCompletedSales(completed);
      } else {
        setCompletedSales([]);
        setTrainingError("Invalid data format received from server");
      }
    } catch (err) {
      console.error("API Error:", err);
      setCompletedSales([]);
      setTrainingError(err.response?.data?.message || err.message);
      toast({
        title: "Error fetching completed sales",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingTraining(false);
    }
  };

  const fetchPendingB2BCustomers = async () => {
    setLoadingB2B(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups/b2b-pending`);
      if (Array.isArray(response.data)) {
        setPendingB2BCustomers(response.data);
      } else {
        setPendingB2BCustomers([]);
        toast({
          title: "Error fetching B2B customers",
          description: "Invalid data format received from server",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      setLoadingB2B(false);
    } catch (err) {
      console.error("API Error:", err);
      setPendingB2BCustomers([]);
      toast({
        title: "Error fetching B2B customers",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setLoadingB2B(false);
    }
  };

  const handleImportB2BCustomer = async (customer) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/followups/import-b2b`, {
        customerType: customer.type,
        customerId: customer._id
      });
      
      toast({
        title: "Customer imported successfully",
        description: response.data.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh both lists
      fetchData();
      fetchPendingB2BCustomers();
    } catch (err) {
      toast({
        title: "Error importing customer",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (Array.isArray(data)) {
      const filtered = data.filter(
        (item) =>
          item.clientName && item.companyName &&
          (item.clientName.toLowerCase().includes(query) ||
          item.companyName.toLowerCase().includes(query))
      );
      setFilteredData(filtered);
    }
  };

  const [trainingForm, setTrainingForm] = useState({
    trainingType: "",
    batch: "",
    startDate: "",
    duration: "",
    paymentOption: "full",
    paymentAmount: 0,
    totalAmount: 0,
    specialRequirements: "",
    previousTraining: "",
    agentName: "",
    customerName: "",
    email: "",
    phoneNumber: "",
    fieldOfWork: "",
    scheduleShift: "",
    materialStatus: "",
    progress: "",
    idInfo: "",
    packageStatus: "",
  });

  const [ensraForm, setEnsraForm] = useState({
    type: "company", // company or individual
    packageType: "", // numeric/string package id if needed
    companyName: "",
    positionsOffered: "", // comma-separated list
    salaryRange: "",
    jobRequirements: "",
    jobSeekerName: "",
    jobSeekerSkills: "",
    jobSeekerExperience: "",
    jobSeekerEducation: "",
    jobSeekerExpectedSalary: "",
  });

  const trainingPrograms = [
    { id: "International Trade Import Export", name: "International Trade Import Export", duration: "1 weeks", price: 6917 },
    { id: "Data Science", name: "Data Science", duration: "16 weeks", price: 2000 },
    { id: "Coffee Cupping", name: "Coffee Cupping", duration: "8 weeks", price: 29000 },
    { id: "UI/UX Design", name: "UI/UX Design", duration: "8 weeks", price: 1000 },
    { id: "Digital Marketing", name: "Digital Marketing", duration: "6 weeks", price: 800 },
    { id: "Cybersecurity", name: "Cybersecurity", duration: "14 weeks", price: 1800 },
    { id: "DevOps Engineering", name: "DevOps Engineering", duration: "18 weeks", price: 2200 },
    { id: "Cloud Computing", name: "Cloud Computing", duration: "16 weeks", price: 2100 },
  ];

  const handleTrainingTypeChange = (value) => {
    const program = trainingPrograms.find((p) => p.id === value);
    const totalAmount = program ? program.price : 0;
    const paymentAmount = trainingForm.paymentOption === "partial" ? totalAmount * 0.5 : totalAmount;
    setTrainingForm((prev) => ({
      ...prev,
      trainingType: value,
      duration: program ? program.duration : "",
      totalAmount,
      paymentAmount,
    }));
  };

  const handlePaymentOptionChange = (value) => {
    setTrainingForm((prev) => ({
      ...prev,
      paymentOption: value,
      paymentAmount: value === "partial" ? prev.totalAmount * 0.5 : prev.totalAmount,
    }));
  };

  const handleTrainingSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      ...trainingForm,
    };
    setTrainingFollowups((prev) => [...prev, newEntry]);
    toast({
      title: "Training data captured",
      description: "Training registration data has been recorded.",
      status: "success",
      duration: 4000,
      isClosable: true,
    });
    setTrainingForm((prev) => ({
      ...prev,
      batch: "",
      startDate: "",
      duration: "",
      paymentOption: "full",
      paymentAmount: 0,
      totalAmount: prev.totalAmount,
      specialRequirements: "",
      previousTraining: "",
      agentName: "",
      customerName: "",
      email: "",
      phoneNumber: "",
      fieldOfWork: "",
      scheduleShift: "",
      materialStatus: "",
      progress: "",
      idInfo: "",
      packageStatus: "",
    }));
  };

  const handleEnsraSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      ...ensraForm,
    };
    setEnsraFollowups((prev) => [...prev, newEntry]);
    toast({
      title: "ENSRA customer added",
      description: "ENSRA follow-up record has been created.",
      status: "success",
      duration: 4000,
      isClosable: true,
    });
    setEnsraForm({
      type: "company",
      packageType: "",
      companyName: "",
      positionsOffered: "",
      salaryRange: "",
      jobRequirements: "",
      jobSeekerName: "",
      jobSeekerSkills: "",
      jobSeekerExperience: "",
      jobSeekerEducation: "",
      jobSeekerExpectedSalary: "",
    });
    setShowEnsraFormCard(false);
  };

  const handleInlineTrainingChange = (id, field, value) => {
    setTrainingFollowups((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleInlineEnsraChange = (id, field, value) => {
    setEnsraFollowups((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  useEffect(() => {
    fetchData();
    fetchPendingB2BCustomers();
    fetchCompletedSales();
  }, []);

  const handleUpdateServices = async (id, updatedServiceProvided, updatedServiceNotProvided) => {
    try {
      const serviceProvided = updatedServiceProvided || selectedClient.serviceProvided || "";
      const serviceNotProvided = updatedServiceNotProvided || selectedClient.serviceNotProvided || "";

      const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/followups/${id}/services`, {
        serviceProvided,
        serviceNotProvided,
      });

      const dataResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups`);
      setData(dataResponse.data);

      setUpdatedServiceProvided("");
      setUpdatedServiceNotProvided("");
      setShowUpdateCard(false);

      alert("Services updated successfully.");
    } catch (error) {
      console.error("Failed to update services:", error.message);
      alert("Failed to update services.");
    }
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setNote("");
  };

  const handleCloseCard = () => {
    setSelectedClient(null);
  };

  const handleAddNote = async () => {
    if (!selectedClient) {
      alert("No client selected. Please select a client first.");
      return;
    }
  
    if (note.trim() === "") {
      alert("Please enter a note.");
      return;
    }
  
    console.log("Adding note:", note);
    console.log("Client ID:", selectedClient._id);
  
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/followups/${selectedClient._id}/notes`, { text: note });
      if (response.status === 200 || response.status === 201) {
        alert("Note added successfully.");
        setNote("");
        fetchData();
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (err) {
      console.error("Failed to add note:", err);
      if (err.response) {
        alert(`Failed to add note: ${err.response.data.error || err.response.statusText}`);
      } else if (err.request) {
        alert("Failed to add note: No response from server");
      } else {
        alert(`Failed to add note: ${err.message}`);
      }
    }
  };

  const handleUpdateLastCalled = async () => {
    try {
      const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/followups/${selectedClient._id}/lastCalled`);
      const updatedTime = response.data.lastCalled;
      alert("Last called time updated successfully.");
      setSelectedClient((prev) => ({ ...prev, lastCalled: updatedTime }));
    } catch (err) {
      console.error(err);
      alert("Failed to update last called time.");
    }
  };

  const handleRowClick = (item) => {
    setSelectedRow(item);
    setIsMobileView(true);
  };

  const handleBackToCompanyList = () => {
    setSelectedRow(null);
    setIsMobileView(false);
  };

  const openNotesModal = () => {
    setIsNotesModalOpen(true);
  };

  const closeNotesModal = () => {
    setIsNotesModalOpen(false);
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/followups/${id}`);
      alert("Customer deleted successfully.");
      fetchData();
    } catch (err) {
      alert("Failed to delete customer.");
    }
  };

  // Compact table cell component for better spacing
  const CompactCell = ({ children, isHeader = false }) => (
    <Td 
      py={isHeader ? 3 : 2} 
      px={2} 
      fontSize={isHeader ? "sm" : "sm"}
      fontWeight={isHeader ? "bold" : "normal"}
    >
      {children}
    </Td>
  );

  // Compact header cell component
  const CompactHeaderCell = ({ children }) => (
    <Th 
      py={3} 
      px={2} 
      fontSize="sm"
      color="white"
      textTransform="none"
    >
      {children}
    </Th>
  );

  return (
    <Layout overflowX="auto" maxW="1200px" mx="auto" py={4} px={2}>
      <VStack spacing={6} align="stretch">
        <Heading 
          as="h1" 
          size={isMobile ? "lg" : "xl"} 
          textAlign="center" 
          color={headerBg}
          fontWeight="bold"
        >
          Customer Success Follow-up
        </Heading>
        
        <Tabs variant="enclosed" colorScheme="blue" isFitted={isMobile}>
          <TabList mb={4}>
            <Tab>
              <HStack spacing={2}>
                <CheckIcon />
                <Text>B2B Customers Follow-up</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <DownloadIcon />
                <Text>Pending B2B Customers</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <DownloadIcon />
                <Text>Training</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <DownloadIcon />
                <Text>Training Follow-Up</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <DownloadIcon />
                <Text>ENSRA Follow-Up</Text>
              </HStack>
            </Tab>
          </TabList>
          
          <TabPanels>
            {/* Existing Follow-up Customers Tab */}
            <TabPanel px={0}>
              <Card bg={cardBg} boxShadow="md" borderRadius="lg">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {/* Search and Actions */}
                    <Flex 
                      direction={isMobile ? "column" : "row"} 
                      gap={3} 
                      justify="space-between" 
                      align="center"
                    >
                      <Flex flex={1} maxWidth={isMobile ? "100%" : "300px"}>
                        <Input
                          placeholder="Search by client or company..."
                          value={searchQuery}
                          onChange={handleSearch}
                          size="md"
                          borderRadius="md"
                          borderColor={borderColor}
                          leftElement={<SearchIcon color="gray.300" />}
                        />
                      </Flex>
                      
                      <HStack spacing={2}>
                        <Tooltip label="Refresh data">
                          <IconButton
                            aria-label="Refresh"
                            icon={<RepeatIcon />}
                            colorScheme="blue"
                            size="md"
                            onClick={fetchData}
                          />
                        </Tooltip>
                      </HStack>
                    </Flex>
                    
                    {loading ? (
                      <Flex justify="center" py={10}>
                        <Spinner size="xl" />
                      </Flex>
                    ) : error ? (
                      <Text color="red.500" fontSize="lg" textAlign="center">
                        {error}
                      </Text>
                    ) : (
                      <>
                        {isMobile && isMobileView ? (
                          <Box>
                            <Button 
                              leftIcon={<ArrowBackIcon />} 
                              onClick={handleBackToCompanyList} 
                              mb={4}
                              size="sm"
                              colorScheme="blue"
                            >
                              Back
                            </Button>
                            <VStack spacing={4} align="stretch">
                              <Card>
                                <CardBody>
                                  <VStack spacing={3} align="stretch">
                                    <HStack justify="space-between">
                                      <Text fontWeight="bold">Client:</Text>
                                      <Text>{selectedRow.clientName}</Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                      <Text fontWeight="bold">Company:</Text>
                                      <Text>{selectedRow.companyName}</Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                      <Text fontWeight="bold">Phone:</Text>
                                      <Text>{selectedRow.phoneNumber}</Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                      <Text fontWeight="bold">Email:</Text>
                                      <Text>{selectedRow.email}</Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                      <Text fontWeight="bold">Package:</Text>
                                      <Badge colorScheme="purple">{selectedRow.packageType || 'Not specified'}</Badge>
                                    </HStack>
                                    <HStack justify="space-between">
                                      <Text fontWeight="bold">Deadline:</Text>
                                      <Text>{new Date(selectedRow.deadline).toLocaleDateString()}</Text>
                                    </HStack>
                                    <Divider />
                                    <HStack spacing={2}>
                                      <Button
                                        colorScheme="teal"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedClient(selectedRow);
                                          openNotesModal();
                                        }}
                                      >
                                        Add Note
                                      </Button>
                                      <Button
                                        colorScheme="teal"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedClient(selectedRow);
                                          setShowUpdateCard(true);
                                        }}
                                      >
                                        Update
                                      </Button>
                                      <IconButton
                                        aria-label="Edit customer"
                                        icon={<EditIcon />}
                                        colorScheme="blue"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedClient(selectedRow);
                                          onEditOpen();
                                        }}
                                      />
                                    </HStack>
                                  </VStack>
                                </CardBody>
                              </Card>
                            </VStack>
                          </Box>
                        ) : (
                          <Box overflowX="auto">
                            <Table 
                              variant="simple" 
                              size="sm" 
                              minWidth={isMobile ? "600px" : "auto"}
                            >
                              <Thead bg={headerBg}>
                                <Tr>
                                  <CompactHeaderCell>Client Name</CompactHeaderCell>
                                  <CompactHeaderCell>Company</CompactHeaderCell>
                                  {!isMobile && <CompactHeaderCell>Phone</CompactHeaderCell>}
                                  {!isMobile && <CompactHeaderCell>Email</CompactHeaderCell>}
                                  <CompactHeaderCell>Package</CompactHeaderCell>
                                  {!isLargerThan768 && <CompactHeaderCell>Service</CompactHeaderCell>}
                                  <CompactHeaderCell>Deadline</CompactHeaderCell>
                                  <CompactHeaderCell>Actions</CompactHeaderCell>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {Array.isArray(filteredData) && filteredData.map((item) => (
                                  <Tr 
                                    key={item._id} 
                                    onClick={() => isMobile && handleRowClick(item)}
                                    _hover={{ bg: useColorModeValue("gray.50", "gray.600") }}
                                    cursor={isMobile ? "pointer" : "default"}
                                  >
                                    <CompactCell>{item.clientName}</CompactCell>
                                    <CompactCell>{item.companyName}</CompactCell>
                                    {!isMobile && <CompactCell>{item.phoneNumber}</CompactCell>}
                                    {!isMobile && <CompactCell>{item.email}</CompactCell>}
                                    <CompactCell>
                                      <Badge colorScheme="purple" fontSize="xs">
                                        {item.packageType || 'Not specified'}
                                      </Badge>
                                    </CompactCell>
                                    {!isLargerThan768 && (
                                      <CompactCell>
                                        <Text noOfLines={1} fontSize="xs">
                                          {item.serviceProvided}
                                        </Text>
                                      </CompactCell>
                                    )}
                                    <CompactCell>
                                      {new Date(item.deadline).toLocaleDateString()}
                                    </CompactCell>
                                    <CompactCell>
                                      <HStack spacing={1}>
                                        <Tooltip label="Update Services">
                                          <IconButton
                                            aria-label="Update Services"
                                            icon={<EditIcon />}
                                            colorScheme="teal"
                                            size="xs"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedClient(item);
                                              setShowUpdateCard(true);
                                            }}
                                          />
                                        </Tooltip>
                                        <Tooltip label="Edit Customer">
                                          <IconButton
                                            aria-label="Edit customer"
                                            icon={<EditIcon />}
                                            colorScheme="blue"
                                            size="xs"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedClient(item);
                                              onEditOpen();
                                            }}
                                          />
                                        </Tooltip>
                                        <Tooltip label="Delete Customer">
                                          <IconButton
                                            aria-label="Delete customer"
                                            icon={<SmallCloseIcon />}
                                            colorScheme="red"
                                            size="xs"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteCustomer(item._id);
                                            }}
                                          />
                                        </Tooltip>
                                      </HStack>
                                    </CompactCell>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                            
                            {(!Array.isArray(filteredData) || filteredData.length === 0) && (
                              <Text textAlign="center" py={8} color="gray.500">
                                No customers found
                              </Text>
                            )}
                          </Box>
                        )}
                      </>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* Pending B2B Customers Tab */}
            <TabPanel px={0}>
              <Card bg={cardBg} boxShadow="md" borderRadius="lg">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {/* B2B Actions */}
                    <Flex justify="space-between" align="center">
                      <Heading size="md" color={headerBg}>
                        Pending B2B Customers for Import
                      </Heading>
                      <Tooltip label="Refresh B2B customer list">
                        <IconButton
                          aria-label="Refresh B2B"
                          icon={<RepeatIcon />}
                          colorScheme="blue"
                          onClick={fetchPendingB2BCustomers}
                          isLoading={loadingB2B}
                          size="md"
                        />
                      </Tooltip>
                    </Flex>
                    
                    {loadingB2B ? (
                      <Flex justify="center" py={10}>
                        <Spinner size="xl" />
                        <Text ml={4}>Loading pending B2B customers...</Text>
                      </Flex>
                    ) : (
                      <Box overflowX="auto">
                        <Table 
                          variant="simple" 
                          size="sm" 
                          minWidth={isMobile ? "700px" : "auto"}
                        >
                          <Thead bg={headerBg}>
                            <Tr>
                              <CompactHeaderCell>Client</CompactHeaderCell>
                              <CompactHeaderCell>Company</CompactHeaderCell>
                              {!isMobile && <CompactHeaderCell>Email</CompactHeaderCell>}
                              {!isMobile && <CompactHeaderCell>Phone</CompactHeaderCell>}
                              <CompactHeaderCell>Type</CompactHeaderCell>
                              {!isLargerThan768 && <CompactHeaderCell>Industry</CompactHeaderCell>}
                              <CompactHeaderCell>Country</CompactHeaderCell>
                              <CompactHeaderCell>Package</CompactHeaderCell>
                              <CompactHeaderCell>Actions</CompactHeaderCell>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {Array.isArray(pendingB2BCustomers) && pendingB2BCustomers.length > 0 ? (
                              pendingB2BCustomers.map((customer) => (
                                <Tr 
                                  key={customer._id}
                                  _hover={{ bg: useColorModeValue("gray.50", "gray.600") }}
                                >
                                  <CompactCell>{customer.clientName}</CompactCell>
                                  <CompactCell>{customer.companyName}</CompactCell>
                                  {!isMobile && <CompactCell>{customer.email}</CompactCell>}
                                  {!isMobile && <CompactCell>{customer.phoneNumber}</CompactCell>}
                                  <CompactCell>
                                    <Badge 
                                      colorScheme={customer.type === 'buyer' ? 'green' : 'purple'}
                                      fontSize="xs"
                                    >
                                      {customer.type}
                                    </Badge>
                                  </CompactCell>
                                  {!isLargerThan768 && <CompactCell>{customer.industry}</CompactCell>}
                                  <CompactCell>{customer.country}</CompactCell>
                                  <CompactCell>
                                    <Badge colorScheme="blue" fontSize="xs">
                                      {customer.packageType || 'Not specified'}
                                    </Badge>
                                  </CompactCell>
                                  <CompactCell>
                                    <Tooltip label="Import this customer to follow-up system">
                                      <Button
                                        size="xs"
                                        colorScheme="teal"
                                        leftIcon={<DownloadIcon />}
                                        onClick={() => handleImportB2BCustomer(customer)}
                                      >
                                        Import
                                      </Button>
                                    </Tooltip>
                                  </CompactCell>
                                </Tr>
                              ))
                            ) : (
                              <Tr>
                                <Td colSpan={isMobile ? 6 : 9} textAlign="center" py={10}>
                                  <Text color="gray.500">
                                    No pending B2B customers found. All B2B customers have been imported.
                                  </Text>
                                </Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel px={0}>
              <Card bg={cardBg} boxShadow="md" borderRadius="lg">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Heading size="md" color={headerBg}>
                        Training from Completed Sales
                      </Heading>
                      <HStack spacing={2}>
                        <Tooltip label="Refresh completed sales">
                          <IconButton
                            aria-label="Refresh Training"
                            icon={<RepeatIcon />}
                            colorScheme="blue"
                            onClick={fetchCompletedSales}
                            isLoading={loadingTraining}
                            size="md"
                          />
                        </Tooltip>
                      </HStack>
                    </Flex>

                    {loadingTraining ? (
                      <Flex justify="center" py={10}>
                        <Spinner size="xl" />
                      </Flex>
                    ) : trainingError ? (
                      <Text color="red.500" fontSize="lg" textAlign="center">
                        {trainingError}
                      </Text>
                    ) : (
                      <Box overflowX="auto">
                        <Table
                          variant="simple"
                          size="sm"
                          minWidth={isMobile ? "700px" : "auto"}
                        >
                          <Thead bg={headerBg}>
                            <Tr>
                              <CompactHeaderCell>Customer</CompactHeaderCell>
                              {!isMobile && <CompactHeaderCell>Email</CompactHeaderCell>}
                              {!isMobile && <CompactHeaderCell>Phone</CompactHeaderCell>}
                              <CompactHeaderCell>Status</CompactHeaderCell>
                              <CompactHeaderCell>Follow-up Date</CompactHeaderCell>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {Array.isArray(completedSales) && completedSales.length > 0 ? (
                              completedSales.map((item) => (
                                <Tr
                                  key={item._id}
                                  _hover={{ bg: useColorModeValue("gray.50", "gray.600") }}
                                >
                                  <CompactCell>{item.fullName || item.clientName}</CompactCell>
                                  {!isMobile && <CompactCell>{item.email}</CompactCell>}
                                  {!isMobile && <CompactCell>{item.phoneNumber}</CompactCell>}
                                  <CompactCell>
                                    <Badge colorScheme="green" fontSize="xs">
                                      {item.status}
                                    </Badge>
                                  </CompactCell>
                                  <CompactCell>
                                    {item.followUpDate
                                      ? new Date(item.followUpDate).toLocaleDateString()
                                      : "-"}
                                  </CompactCell>
                                </Tr>
                              ))
                            ) : (
                              <Tr>
                                <Td colSpan={isMobile ? 4 : 5} textAlign="center" py={10}>
                                  <Text color="gray.500">
                                    No completed sales found for training.
                                  </Text>
                                </Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </Box>
                    )}

                    <Divider />

                    <Box as="form" onSubmit={handleTrainingSubmit}>
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm" color={headerBg}>
                          Training Registration
                        </Heading>
                        <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Training Program
                            </Text>
                            <Input
                              as="select"
                              value={trainingForm.trainingType}
                              onChange={(e) => handleTrainingTypeChange(e.target.value)}
                            >
                              <option value="">Select program</option>
                              {trainingPrograms.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </Input>
                          </Box>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Batch/Group
                            </Text>
                            <Input
                              value={trainingForm.batch}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, batch: e.target.value }))
                              }
                              placeholder="e.g., Batch A"
                            />
                          </Box>
                        </Stack>

                        <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Agent Name
                            </Text>
                            <Input
                              value={trainingForm.agentName}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, agentName: e.target.value }))
                              }
                              placeholder="Agent handling this training"
                            />
                          </Box>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Customer Name
                            </Text>
                            <Input
                              value={trainingForm.customerName}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, customerName: e.target.value }))
                              }
                              placeholder="Customer full name"
                            />
                          </Box>
                        </Stack>

                        <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Email
                            </Text>
                            <Input
                              type="email"
                              value={trainingForm.email}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, email: e.target.value }))
                              }
                              placeholder="Customer email"
                            />
                          </Box>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Phone Number
                            </Text>
                            <Input
                              value={trainingForm.phoneNumber}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                              }
                              placeholder="Customer phone"
                            />
                          </Box>
                        </Stack>

                        <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Start Date
                            </Text>
                            <Input
                              type="date"
                              value={trainingForm.startDate}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, startDate: e.target.value }))
                              }
                            />
                          </Box>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Duration
                            </Text>
                            <Input value={trainingForm.duration} isReadOnly />
                          </Box>
                        </Stack>

                        <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Field the Customer is Working In
                            </Text>
                            <Input
                              value={trainingForm.fieldOfWork}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, fieldOfWork: e.target.value }))
                              }
                              placeholder="e.g., Finance, IT, Marketing"
                            />
                          </Box>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Schedule and Shift
                            </Text>
                            <Input
                              as="select"
                              value={trainingForm.scheduleShift}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, scheduleShift: e.target.value }))
                              }
                            >
                              <option value="">Select schedule</option>
                              <option value="Regular">Regular</option>
                              <option value="Night">Night</option>
                              <option value="Weekend">Weekend</option>
                              <option value="Night/Weekend">Night/Weekend</option>
                            </Input>
                          </Box>
                        </Stack>

                        <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Payment Option
                            </Text>
                            <HStack spacing={3}>
                              <Button
                                size="sm"
                                variant={trainingForm.paymentOption === "full" ? "solid" : "outline"}
                                colorScheme="teal"
                                onClick={() => handlePaymentOptionChange("full")}
                              >
                                Full
                              </Button>
                              <Button
                                size="sm"
                                variant={trainingForm.paymentOption === "partial" ? "solid" : "outline"}
                                colorScheme="teal"
                                onClick={() => handlePaymentOptionChange("partial")}
                              >
                                Partial (50%)
                              </Button>
                            </HStack>
                          </Box>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Amount
                            </Text>
                            <Input
                              value={trainingForm.paymentAmount}
                              isReadOnly
                            />
                          </Box>
                        </Stack>

                        <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Material Delivery Status
                            </Text>
                            <Input
                              as="select"
                              value={trainingForm.materialStatus}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, materialStatus: e.target.value }))
                              }
                            >
                              <option value="">Select status</option>
                              <option value="Not Delivered">Not Delivered</option>
                              <option value="Delivered">Delivered</option>
                            </Input>
                          </Box>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Progress of the Training
                            </Text>
                            <Input
                              as="select"
                              value={trainingForm.progress}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, progress: e.target.value }))
                              }
                            >
                              <option value="">Select progress</option>
                              <option value="Not Started">Not Started</option>
                              <option value="Started">Started</option>
                              <option value="Dropped">Dropped</option>
                            </Input>
                          </Box>
                        </Stack>

                        <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              ID Card Upload or ID Number
                            </Text>
                            <Input
                              value={trainingForm.idInfo}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, idInfo: e.target.value }))
                              }
                              placeholder="ID number or link to ID"
                            />
                          </Box>
                          <Box flex={1}>
                            <Text mb={1} fontWeight="medium">
                              Package Status
                            </Text>
                            <Input
                              as="select"
                              value={trainingForm.packageStatus}
                              onChange={(e) =>
                                setTrainingForm((prev) => ({ ...prev, packageStatus: e.target.value }))
                              }
                            >
                              <option value="">Select status</option>
                              <option value="Pending">Pending</option>
                              <option value="Active">Active</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </Input>
                          </Box>
                        </Stack>

                        <Textarea
                          placeholder="Previous training/experience"
                          value={trainingForm.previousTraining}
                          onChange={(e) =>
                            setTrainingForm((prev) => ({
                              ...prev,
                              previousTraining: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                        <Textarea
                          placeholder="Special requirements"
                          value={trainingForm.specialRequirements}
                          onChange={(e) =>
                            setTrainingForm((prev) => ({
                              ...prev,
                              specialRequirements: e.target.value,
                            }))
                          }
                          rows={3}
                        />

                        <Button
                          type="submit"
                          colorScheme="teal"
                          width="full"
                          isDisabled={!trainingForm.trainingType}
                        >
                          Save Training Data
                        </Button>
                      </VStack>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel px={0}>
              <Card bg={cardBg} boxShadow="md" borderRadius="lg">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color={headerBg}>
                      Training Follow-Up
                    </Heading>
                    <Box overflowX="auto">
                      <Table
                        variant="simple"
                        size="sm"
                        minWidth={isMobile ? "900px" : "auto"}
                      >
                        <Thead bg={headerBg}>
                          <Tr>
                            <CompactHeaderCell>Training Start Date</CompactHeaderCell>
                            <CompactHeaderCell>Agent Name</CompactHeaderCell>
                            <CompactHeaderCell>Customer Name</CompactHeaderCell>
                            <CompactHeaderCell>Email</CompactHeaderCell>
                            <CompactHeaderCell>Phone Number</CompactHeaderCell>
                            <CompactHeaderCell>Field of Work</CompactHeaderCell>
                            <CompactHeaderCell>Course</CompactHeaderCell>
                            <CompactHeaderCell>Schedule & Shift</CompactHeaderCell>
                            <CompactHeaderCell>Material Delivery Status</CompactHeaderCell>
                            <CompactHeaderCell>Progress</CompactHeaderCell>
                            <CompactHeaderCell>ID Info</CompactHeaderCell>
                            <CompactHeaderCell>Package Status</CompactHeaderCell>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {trainingFollowups.length > 0 ? (
                            trainingFollowups.map((item) => (
                              <Tr key={item.id}>
                                <CompactCell>
                                  {item.startDate ? new Date(item.startDate).toLocaleDateString() : "-"}
                                </CompactCell>
                                <CompactCell>{item.agentName}</CompactCell>
                                <CompactCell>{item.customerName}</CompactCell>
                                <CompactCell>{item.email}</CompactCell>
                                <CompactCell>{item.phoneNumber}</CompactCell>
                                <CompactCell>{item.fieldOfWork}</CompactCell>
                                <CompactCell>{item.trainingType}</CompactCell>
                                <CompactCell>
                                  <Tooltip label={item.scheduleShift || "Not set"} hasArrow>
                                    <Input
                                      as="select"
                                      size="sm"
                                      value={item.scheduleShift || ""}
                                      onChange={(e) =>
                                        handleInlineTrainingChange(
                                          item.id,
                                          "scheduleShift",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="">Select schedule</option>
                                      <option value="Regular">Regular</option>
                                      <option value="Night">Night</option>
                                      <option value="Weekend">Weekend</option>
                                      <option value="Night/Weekend">Night/Weekend</option>
                                    </Input>
                                  </Tooltip>
                                </CompactCell>
                                <CompactCell>
                                  <Tooltip label={item.materialStatus || "Not set"} hasArrow>
                                    <Input
                                      as="select"
                                      size="sm"
                                      value={item.materialStatus || ""}
                                      onChange={(e) =>
                                        handleInlineTrainingChange(
                                          item.id,
                                          "materialStatus",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="">Select status</option>
                                      <option value="Not Delivered">Not Delivered</option>
                                      <option value="Delivered">Delivered</option>
                                    </Input>
                                  </Tooltip>
                                </CompactCell>
                                <CompactCell>
                                  <Tooltip label={item.progress || "Not set"} hasArrow>
                                    <Input
                                      as="select"
                                      size="sm"
                                      value={item.progress || ""}
                                      onChange={(e) =>
                                        handleInlineTrainingChange(
                                          item.id,
                                          "progress",
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="">Select progress</option>
                                      <option value="Not Started">Not Started</option>
                                      <option value="Started">Started</option>
                                      <option value="Dropped">Dropped</option>
                                    </Input>
                                  </Tooltip>
                                </CompactCell>
                                <CompactCell>{item.idInfo}</CompactCell>
                                <CompactCell>{item.packageStatus}</CompactCell>
                              </Tr>
                            ))
                          ) : (
                            <Tr>
                              <Td colSpan={12} textAlign="center" py={10}>
                                <Text color="gray.500">
                                  No training follow-up records yet.
                                </Text>
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            <TabPanel px={0}>
              <Card bg={cardBg} boxShadow="md" borderRadius="lg">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Heading size="md" color={headerBg}>
                        ENSRA Follow-Up
                      </Heading>
                      <Tooltip label="Add ENSRA customer">
                        <IconButton
                          aria-label="Add ENSRA customer"
                          icon={<AddIcon />}
                          colorScheme="teal"
                          size="sm"
                          onClick={() => setShowEnsraFormCard(true)}
                        />
                      </Tooltip>
                    </Flex>

                    <Box overflowX="auto">
                      <Table
                        variant="simple"
                        size="sm"
                        minWidth={isMobile ? "900px" : "auto"}
                      >
                        <Thead bg={headerBg}>
                          <Tr>
                            <CompactHeaderCell>Type</CompactHeaderCell>
                            <CompactHeaderCell>Package Type</CompactHeaderCell>
                            <CompactHeaderCell>Company Name</CompactHeaderCell>
                            <CompactHeaderCell>Positions Offered</CompactHeaderCell>
                            <CompactHeaderCell>Salary Range</CompactHeaderCell>
                            <CompactHeaderCell>Job Requirements</CompactHeaderCell>
                            <CompactHeaderCell>Job Seeker Name</CompactHeaderCell>
                            <CompactHeaderCell>Skills</CompactHeaderCell>
                            <CompactHeaderCell>Experience</CompactHeaderCell>
                            <CompactHeaderCell>Education</CompactHeaderCell>
                            <CompactHeaderCell>Expected Salary</CompactHeaderCell>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {ensraFollowups.length > 0 ? (
                            ensraFollowups.map((item) => (
                              <Tr key={item.id}>
                                <CompactCell>{item.type}</CompactCell>
                                <CompactCell>{item.packageType}</CompactCell>
                                <CompactCell>{item.companyName}</CompactCell>
                                <CompactCell>{item.positionsOffered}</CompactCell>
                                <CompactCell>{item.salaryRange}</CompactCell>
                                <CompactCell>{item.jobRequirements}</CompactCell>
                                <CompactCell>{item.jobSeekerName}</CompactCell>
                                <CompactCell>{item.jobSeekerSkills}</CompactCell>
                                <CompactCell>{item.jobSeekerExperience}</CompactCell>
                                <CompactCell>{item.jobSeekerEducation}</CompactCell>
                                <CompactCell>{item.jobSeekerExpectedSalary}</CompactCell>
                              </Tr>
                            ))
                          ) : (
                            <Tr>
                              <Td colSpan={12} textAlign="center" py={10}>
                                <Text color="gray.500">
                                  No ENSRA follow-up records yet.
                                </Text>
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </Box>

                    {showEnsraFormCard && (
                      <>
                        <Box
                          position="fixed"
                          top={0}
                          left={0}
                          right={0}
                          bottom={0}
                          bg="rgba(0,0,0,0.5)"
                          zIndex={1000}
                          onClick={() => setShowEnsraFormCard(false)}
                        />
                        <Card
                          position="fixed"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          zIndex={1001}
                          width={isMobile ? "95%" : "600px"}
                          bg={cardBg}
                          boxShadow="xl"
                        >
                          <CardHeader pb={2}>
                            <Flex justify="space-between" align="center">
                              <Heading size="md">Add ENSRA Customer</Heading>
                              <IconButton
                                aria-label="Close"
                                icon={<SmallCloseIcon />}
                                size="sm"
                                onClick={() => setShowEnsraFormCard(false)}
                              />
                            </Flex>
                          </CardHeader>
                          <CardBody>
                            <Box as="form" onSubmit={handleEnsraSubmit}>
                              <VStack spacing={4} align="stretch">
                                <Box>
                                  <Text mb={1} fontWeight="medium">
                                    Registration Type
                                  </Text>
                                  <RadioGroup
                                    value={ensraForm.type}
                                    onChange={(value) =>
                                      setEnsraForm((prev) => ({
                                        ...prev,
                                        type: value,
                                      }))
                                    }
                                  >
                                    <HStack spacing={4}>
                                      <Radio value="company">Company - Looking to hire</Radio>
                                      <Radio value="individual">Individual - Managing job seekers</Radio>
                                    </HStack>
                                  </RadioGroup>
                                </Box>

                                {ensraForm.type === "company" && (
                                  <>
                                    <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                                      <Box flex={1}>
                                        <Text mb={1} fontWeight="medium">
                                          Package Type
                                        </Text>
                                        <Input
                                          value={ensraForm.packageType}
                                          onChange={(e) =>
                                            setEnsraForm((prev) => ({
                                              ...prev,
                                              packageType: e.target.value,
                                            }))
                                          }
                                          placeholder="e.g., 1, 2, 3"
                                        />
                                      </Box>
                                      <Box flex={1}>
                                        <Text mb={1} fontWeight="medium">
                                          Company Name
                                        </Text>
                                        <Input
                                          value={ensraForm.companyName}
                                          onChange={(e) =>
                                            setEnsraForm((prev) => ({
                                              ...prev,
                                              companyName: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter company name"
                                        />
                                      </Box>
                                    </Stack>

                                    <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                                      <Box flex={1}>
                                        <Text mb={1} fontWeight="medium">
                                          Positions Offered
                                        </Text>
                                        <Input
                                          value={ensraForm.positionsOffered}
                                          onChange={(e) =>
                                            setEnsraForm((prev) => ({
                                              ...prev,
                                              positionsOffered: e.target.value,
                                            }))
                                          }
                                          placeholder="Comma-separated positions"
                                        />
                                      </Box>
                                      <Box flex={1}>
                                        <Text mb={1} fontWeight="medium">
                                          Salary Range
                                        </Text>
                                        <Input
                                          value={ensraForm.salaryRange}
                                          onChange={(e) =>
                                            setEnsraForm((prev) => ({
                                              ...prev,
                                              salaryRange: e.target.value,
                                            }))
                                          }
                                          placeholder="e.g., $50,000 - $80,000"
                                        />
                                      </Box>
                                    </Stack>

                                    <Box>
                                      <Text mb={1} fontWeight="medium">
                                        Job Requirements
                                      </Text>
                                      <Textarea
                                        value={ensraForm.jobRequirements}
                                        onChange={(e) =>
                                          setEnsraForm((prev) => ({
                                            ...prev,
                                            jobRequirements: e.target.value,
                                          }))
                                        }
                                        placeholder="Describe job requirements, qualifications, etc."
                                        rows={4}
                                      />
                                    </Box>
                                  </>
                                )}

                                {ensraForm.type === "individual" && (
                                  <>
                                    <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                                      <Box flex={1}>
                                        <Text mb={1} fontWeight="medium">
                                          Job Seeker Name
                                        </Text>
                                        <Input
                                          value={ensraForm.jobSeekerName}
                                          onChange={(e) =>
                                            setEnsraForm((prev) => ({
                                              ...prev,
                                              jobSeekerName: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter job seeker name"
                                        />
                                      </Box>
                                      <Box flex={1}>
                                        <Text mb={1} fontWeight="medium">
                                          Skills
                                        </Text>
                                        <Input
                                          value={ensraForm.jobSeekerSkills}
                                          onChange={(e) =>
                                            setEnsraForm((prev) => ({
                                              ...prev,
                                              jobSeekerSkills: e.target.value,
                                            }))
                                          }
                                          placeholder="Comma-separated skills"
                                        />
                                      </Box>
                                    </Stack>

                                    <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                                      <Box flex={1}>
                                        <Text mb={1} fontWeight="medium">
                                          Experience
                                        </Text>
                                        <Input
                                          value={ensraForm.jobSeekerExperience}
                                          onChange={(e) =>
                                            setEnsraForm((prev) => ({
                                              ...prev,
                                              jobSeekerExperience: e.target.value,
                                            }))
                                          }
                                          placeholder="e.g., 2 years"
                                        />
                                      </Box>
                                      <Box flex={1}>
                                        <Text mb={1} fontWeight="medium">
                                          Education
                                        </Text>
                                        <Input
                                          value={ensraForm.jobSeekerEducation}
                                          onChange={(e) =>
                                            setEnsraForm((prev) => ({
                                              ...prev,
                                              jobSeekerEducation: e.target.value,
                                            }))
                                          }
                                          placeholder="e.g., Bachelor's Degree"
                                        />
                                      </Box>
                                    </Stack>

                                    <Box>
                                      <Text mb={1} fontWeight="medium">
                                        Expected Salary
                                      </Text>
                                      <Input
                                        value={ensraForm.jobSeekerExpectedSalary}
                                        onChange={(e) =>
                                          setEnsraForm((prev) => ({
                                            ...prev,
                                            jobSeekerExpectedSalary: e.target.value,
                                          }))
                                        }
                                        placeholder="e.g., $60,000"
                                      />
                                    </Box>
                                  </>
                                )}

                                <Button
                                  type="submit"
                                  colorScheme="teal"
                                  width="full"
                                  isDisabled={
                                    (ensraForm.type === "company" && !ensraForm.companyName) ||
                                    (ensraForm.type === "individual" && !ensraForm.jobSeekerName)
                                  }
                                >
                                  Register for ENSRA
                                </Button>
                              </VStack>
                            </Box>
                          </CardBody>
                        </Card>
                      </>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Drawer for EditCustomerInfo */}
      <Drawer isOpen={isEditOpen} placement="right" onClose={onEditClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Edit Customer</DrawerHeader>
          <DrawerBody>
            {selectedClient && (
              <EditCustomerInfo 
                customer={selectedClient} 
                onSuccess={() => { 
                  fetchData(); 
                  onEditClose(); 
                }} 
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Notes Modal */}
      <Modal isOpen={isNotesModalOpen} onClose={closeNotesModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Note</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              placeholder="Enter your note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" onClick={handleAddNote}>
              Add Note
            </Button>
            <Button colorScheme="red" onClick={closeNotesModal} ml={3}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Pop-out card for selected client */}
      {selectedClient && !showUpdateCard && (
        <>
          <Box 
            position="fixed" 
            top={0} 
            left={0} 
            right={0} 
            bottom={0} 
            bg="rgba(0,0,0,0.5)" 
            zIndex={1000}
            onClick={handleCloseCard}
          />
          <Card 
            position="fixed" 
            top="50%" 
            left="50%" 
            transform="translate(-50%, -50%)" 
            zIndex={1001}
            width={isMobile ? "90%" : "400px"}
            bg={cardBg}
            boxShadow="xl"
          >
            <CardHeader pb={2}>
              <Flex justify="space-between" align="center">
                <Heading size="md">{selectedClient.clientName}</Heading>
                <IconButton
                  aria-label="Close"
                  icon={<SmallCloseIcon />}
                  size="sm"
                  onClick={handleCloseCard}
                />
              </Flex>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">Package:</Text>
                  <Badge colorScheme="purple">{selectedClient.packageType || 'Not specified'}</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Last Called:</Text>
                  <Text>
                    {selectedClient.lastCalled ? new Date(selectedClient.lastCalled).toLocaleString() : "N/A"}
                  </Text>
                </HStack>
                <Divider />
                <Text fontWeight="bold">Last Note:</Text>
                {selectedClient.notes && selectedClient.notes.length > 0 ? (
                  <>
                    <Text fontSize="sm">
                      {selectedClient.notes[selectedClient.notes.length - 1].text}
                    </Text>
                    <Button
                      colorScheme="teal"
                      size="sm"
                      onClick={() => setShowAllNotes(true)}
                    >
                      View All Notes
                    </Button>
                  </>
                ) : (
                  <Text fontSize="sm" color="gray.500">No notes available.</Text>
                )}
                {showAllNotes && (
                  <>
                    <Box 
                      position="fixed" 
                      top={0} 
                      left={0} 
                      right={0} 
                      bottom={0} 
                      bg="rgba(0,0,0,0.5)" 
                      zIndex={1002}
                      onClick={() => setShowAllNotes(false)}
                    />
                    <Card 
                      position="fixed" 
                      top="50%" 
                      left="50%" 
                      transform="translate(-50%, -50%)" 
                      zIndex={1003}
                      width={isMobile ? "90%" : "400px"}
                      bg={cardBg}
                      boxShadow="xl"
                    >
                      <CardHeader pb={2}>
                        <Flex justify="space-between" align="center">
                          <Heading size="sm">All Notes</Heading>
                          <IconButton
                            aria-label="Close"
                            icon={<SmallCloseIcon />}
                            size="sm"
                            onClick={() => setShowAllNotes(false)}
                          />
                        </Flex>
                      </CardHeader>
                      <CardBody maxH="200px" overflowY="auto">
                        <VStack spacing={2} align="stretch">
                          {selectedClient.notes.map((note, index) => (
                            <Box key={index} p={2} bg="gray.50" borderRadius="md">
                              <Text fontSize="sm">{note.text}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {new Date(note.createdAt).toLocaleString()}
                              </Text>
                            </Box>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>
                  </>
                )}
                <Divider />
                <Textarea
                  placeholder="Add a note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  size="sm"
                  rows={3}
                />
                <HStack spacing={2}>
                  <Button 
                    colorScheme="teal" 
                    size="sm" 
                    onClick={handleAddNote}
                    flex={1}
                  >
                    Add Note
                  </Button>
                  <Button 
                    colorScheme="teal" 
                    size="sm" 
                    onClick={handleUpdateLastCalled}
                    flex={1}
                  >
                    Update Last Called
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </>
      )}

      {/* Update card for services */}
      {showUpdateCard && (
        <>
          <Box 
            position="fixed" 
            top={0} 
            left={0} 
            right={0} 
            bottom={0} 
            bg="rgba(0,0,0,0.5)" 
            zIndex={1000}
            onClick={() => setShowUpdateCard(false)}
          />
          <Card 
            position="fixed" 
            top="50%" 
            left="50%" 
            transform="translate(-50%, -50%)" 
            zIndex={1001}
            width={isMobile ? "90%" : "400px"}
            bg={cardBg}
            boxShadow="xl"
          >
            <CardHeader pb={2}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Update Services</Heading>
                <IconButton
                  aria-label="Close"
                  icon={<SmallCloseIcon />}
                  size="sm"
                  onClick={() => {
                    setShowUpdateCard(false);
                    setSelectedClient(null);
                  }}
                />
              </Flex>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <Text fontWeight="bold">
                  For {selectedClient.clientName}
                </Text>
                <Textarea
                  placeholder="Service provided"
                  value={updatedServiceProvided || ""}
                  onChange={(e) => setUpdatedServiceProvided(e.target.value)}
                  size="sm"
                  rows={3}
                />
                <Textarea
                  placeholder="Service not provided"
                  value={updatedServiceNotProvided || ""}
                  onChange={(e) => setUpdatedServiceNotProvided(e.target.value)}
                  size="sm"
                  rows={3}
                />
                <HStack spacing={2}>
                  <Button
                    colorScheme="teal"
                    size="sm"
                    onClick={() =>
                      handleUpdateServices(selectedClient._id, updatedServiceProvided, updatedServiceNotProvided)
                    }
                    flex={1}
                  >
                    Update
                  </Button>
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => {
                      setShowUpdateCard(false);
                      setSelectedClient(null);
                    }}
                    flex={1}
                  >
                    Close
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </>
      )}
    </Layout>
  );
};

export default CustomerFollowup;