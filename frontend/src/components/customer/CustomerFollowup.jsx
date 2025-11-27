import React, { useState, useEffect } from "react";
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
  Menu,
  MenuButton,
  MenuList,
  MenuItemOption,
  MenuOptionGroup,
  TableContainer,
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
  SettingsIcon,
  ChevronDownIcon,
} from "@chakra-ui/icons";
import EditCustomerInfo from "./EditCustomerInfo";
import {
  fetchTrainingFollowups,
  createTrainingFollowup,
  updateTrainingFollowup,
  deleteTrainingFollowup,
  fetchEnsraFollowups,
  createEnsraFollowup,
  deleteEnsraFollowup,
} from "../../services/api";

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
  const [trainingSearch, setTrainingSearch] = useState("");
  const [trainingProgressFilter, setTrainingProgressFilter] = useState("all");
  const [trainingSortAsc, setTrainingSortAsc] = useState(true);
  const [ensraSearch, setEnsraSearch] = useState("");
  const [ensraTypeFilter, setEnsraTypeFilter] = useState("all");
  const [ensraSortAsc, setEnsraSortAsc] = useState(true);
  const [isTrainingEditOpen, setIsTrainingEditOpen] = useState(false);
  const [trainingEditData, setTrainingEditData] = useState(null);
  const [isEnsraEditOpen, setIsEnsraEditOpen] = useState(false);
  const [ensraEditData, setEnsraEditData] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    followup: {
      clientName: true,
      companyName: true,
      phone: true,
      email: true,
      package: true,
      service: true,
      deadline: true,
      actions: true,
    },
    pendingB2B: {
      client: true,
      company: true,
      email: true,
      phone: true,
      type: true,
      industry: true,
      country: true,
      package: true,
      actions: true,
    },
    completedSales: {
      agentName: true,
      customerName: true,
      trainingProgram: true,
      phone: true,
      email: true,
      schedulePreference: true,
    },
    trainingFollowup: {
      startDate: true,
      agentName: true,
      customerName: true,
      email: true,
      phone: true,
      fieldOfWork: true,
      course: true,
      schedule: true,
      materialStatus: true,
      progress: true,
      idInfo: true,
      packageStatus: true,
      actions: true,
    },
    ensra: {
      type: true,
      packageType: true,
      companyName: true,
      positionsOffered: true,
      salaryRange: true,
      jobRequirements: true,
      jobSeekerName: true,
      jobSeekerSkills: true,
      jobSeekerExperience: true,
      jobSeekerEducation: true,
      jobSeekerExpectedSalary: true,
      actions: true,
    },
  });
  const toast = useToast();
  
  // Responsive breakpoints
  const [isLargerThan768] = useMediaQuery("(min-width: 768px)");
  const [isLargerThan1024] = useMediaQuery("(min-width: 1024px)");
  
  // Color mode values for consistent theming
  const cardBg = useColorModeValue("white", "gray.700");
  const headerBg = useColorModeValue("blue.500", "blue.600");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const tableBg = useColorModeValue("white", "gray.800");
  const tableBorderColor = useColorModeValue("gray.200", "gray.700");
  const rowHoverBg = useColorModeValue("gray.50", "gray.700");

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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/salescustomers`, {
        params: { followupStatus: "Completed" }
      });

      if (Array.isArray(response.data)) {
        const completed = response.data
          .filter((item) => (item.followupStatus || "").toLowerCase() === "completed")
          .map((item) => ({
            id: item._id || item.id,
            agentName: item.agentName || item.agent?.name || item.agentId || "Unknown agent",
            customerName: item.customerName || item.clientName,
            trainingProgram: item.contactTitle,
            phone: item.phone || item.phoneNumber,
            email: item.email,
            schedulePreference: item.schedulePreference || item.scheduleShift || "-",
          }));
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
    type: "company", // company or jobSeeker
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

  const handleEnsraSubmit = async (e) => {
    e.preventDefault();
    try {
    await createEnsraFollowup({
      ...ensraForm,
      type: ensraForm.type === "individual" ? "jobSeeker" : ensraForm.type, // legacy safety
    });

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
    await loadEnsraFollowups();
  } catch (err) {
    console.error("Failed to save ENSRA follow-up", err);
    toast({
      title: "Error",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};

const handleTrainingSubmit = async (e) => {
  e.preventDefault();
  try {
    await createTrainingFollowup(trainingForm);

    // Show success toast
    toast({
      title: "Training data captured",
      description: "Training registration data has been recorded.",
      status: "success",
      duration: 4000,
      isClosable: true,
    });

    // Reset form
    setTrainingForm({
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

    // Refresh the training follow-ups list
    await loadTrainingFollowups();
  } catch (err) {
    console.error("Failed to save training follow-up", err);
    toast({
      title: "Error",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};
  const handleInlineTrainingChange = async (id, field, value) => {
  // optimistic update
  setTrainingFollowups((prev) =>
    prev.map((item) =>
      item._id === id
        ? { ...item, [field]: value }
        : item
    )
  );

  try {
    await updateTrainingFollowup(id, { [field]: value });
  } catch (err) {
    console.error("Failed to update training follow-up", err);
    toast({
      title: "Error updating training",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
    loadTrainingFollowups();
  }
};

const loadTrainingFollowups = async () => {
  try {
    const result = await fetchTrainingFollowups();
    setTrainingFollowups(Array.isArray(result) ? result : []);
  } catch (err) {
    console.error("Failed to load training follow-ups", err);
    setTrainingFollowups([]);
  }
};

const loadEnsraFollowups = async () => {
  try {
    const result = await fetchEnsraFollowups();
    const normalized = Array.isArray(result)
      ? result.map((item) => ({
          ...item,
          type: item.type === "individual" ? "jobSeeker" : item.type,
        }))
      : [];
    setEnsraFollowups(normalized);
  } catch (err) {
    console.error("Failed to load ENSRA follow-ups", err);
    setEnsraFollowups([]);
  }
};

const handleDeleteTrainingFollowup = async (id) => {
  if (!window.confirm("Delete this training follow-up?")) return;
  try {
    await deleteTrainingFollowup(id);
    toast({
      title: "Training follow-up deleted",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    await loadTrainingFollowups();
  } catch (err) {
    console.error("Failed to delete training follow-up", err);
    toast({
      title: "Error deleting training follow-up",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};

const handleDeleteEnsraFollowup = async (id) => {
  if (!window.confirm("Delete this ENSRA follow-up?")) return;
  try {
    await deleteEnsraFollowup(id);
    toast({
      title: "ENSRA follow-up deleted",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    await loadEnsraFollowups();
  } catch (err) {
    console.error("Failed to delete ENSRA follow-up", err);
    toast({
      title: "Error deleting ENSRA follow-up",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};

const openTrainingEdit = (item) => {
  setTrainingEditData({ ...item });
  setIsTrainingEditOpen(true);
};

const handleTrainingEditChange = (field, value) => {
  setTrainingEditData((prev) => ({ ...prev, [field]: value }));
};

const saveTrainingEdit = async () => {
  if (!trainingEditData?._id) return;
  try {
    await updateTrainingFollowup(trainingEditData._id, trainingEditData);
    toast({
      title: "Training follow-up updated",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    setIsTrainingEditOpen(false);
    setTrainingEditData(null);
    await loadTrainingFollowups();
  } catch (err) {
    console.error("Failed to update training follow-up", err);
    toast({
      title: "Error updating training follow-up",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};

const openEnsraEdit = (item) => {
  setEnsraEditData({
    ...item,
    type: item.type === "individual" ? "jobSeeker" : item.type,
  });
  setIsEnsraEditOpen(true);
};

const handleEnsraEditChange = (field, value) => {
  setEnsraEditData((prev) => ({ ...prev, [field]: value }));
};

const saveEnsraEdit = async () => {
  const id = ensraEditData?._id || ensraEditData?.id;
  if (!id) return;
  try {
    await updateEnsraFollowup(id, ensraEditData);
    toast({
      title: "ENSRA follow-up updated",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    setIsEnsraEditOpen(false);
    setEnsraEditData(null);
    await loadEnsraFollowups();
  } catch (err) {
    console.error("Failed to update ENSRA follow-up", err);
    toast({
      title: "Error updating ENSRA follow-up",
      description: err.response?.data?.message || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  }
};
  // Derived, filtered, and sorted arrays for Training Follow-Up
  const filteredTrainingFollowups = [...trainingFollowups]
    .filter((item) => {
      const term = trainingSearch.trim().toLowerCase();
      if (!term) return true;
      return (
        (item.customerName && item.customerName.toLowerCase().includes(term)) ||
        (item.agentName && item.agentName.toLowerCase().includes(term)) ||
        (item.email && item.email.toLowerCase().includes(term))
      );
    })
    .filter((item) => {
      if (trainingProgressFilter === "all") return true;
      return (item.progress || "").toLowerCase() === trainingProgressFilter.toLowerCase();
    })
    .sort((a, b) => {
      const nameA = (a.customerName || "").toLowerCase();
      const nameB = (b.customerName || "").toLowerCase();
      if (nameA < nameB) return trainingSortAsc ? -1 : 1;
      if (nameA > nameB) return trainingSortAsc ? 1 : -1;
      return 0;
    });

  // Derived, filtered, and sorted arrays for ENSRA Follow-Up
  const filteredEnsraFollowups = [...ensraFollowups]
    .filter((item) => {
      const term = ensraSearch.trim().toLowerCase();
      if (!term) return true;
      const company = (item.companyName || "").toLowerCase();
      const seeker = (item.jobSeekerName || "").toLowerCase();
      return company.includes(term) || seeker.includes(term);
    })
    .filter((item) => {
      if (ensraTypeFilter === "all") return true;
      return (item.type || "").toLowerCase() === ensraTypeFilter.toLowerCase();
    })
    .sort((a, b) => {
      const nameA = ((a.companyName || a.jobSeekerName || "").toLowerCase());
      const nameB = ((b.companyName || b.jobSeekerName || "").toLowerCase());
      if (nameA < nameB) return ensraSortAsc ? -1 : 1;
      if (nameA > nameB) return ensraSortAsc ? 1 : -1;
      return 0;
    });

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
  loadTrainingFollowups();
  loadEnsraFollowups();
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

  const renderColumnMenu = (tableKey, columns) => {
    const current = visibleColumns[tableKey] || {};
    const selected = Object.entries(current)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    const handleChange = (values) => {
      setVisibleColumns((prev) => ({
        ...prev,
        [tableKey]: columns.reduce(
          (acc, col) => ({
            ...acc,
            [col.key]: values.includes(col.key),
          }),
          {}
        ),
      }));
    };

    return (
      <Menu closeOnSelect={false}>
        <MenuButton
          as={Button}
          size="sm"
          leftIcon={<SettingsIcon />}
          rightIcon={<ChevronDownIcon />}
          variant="outline"
          colorScheme="blue"
        >
          Columns
        </MenuButton>
        <MenuList maxH="300px" overflowY="auto">
          <MenuOptionGroup type="checkbox" value={selected} onChange={handleChange}>
            {columns.map((col) => (
              <MenuItemOption key={col.key} value={col.key}>
                {col.label}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    );
  };

  // Compact table cell component for better spacing
  const CompactCell = ({ children, isHeader = false }) => (
    <Td 
      py={isHeader ? 3 : 2} 
      px={3} 
      fontSize={isHeader ? "sm" : "sm"}
      fontWeight={isHeader ? "bold" : "normal"}
      borderBottom="1px solid"
      borderColor={borderColor}
      whiteSpace="nowrap"
    >
      {children}
    </Td>
  );

  // Compact header cell component
  const CompactHeaderCell = ({ children }) => (
    <Th 
      py={3} 
      px={3} 
      fontSize="sm"
      color="white"
      textTransform="none"
      position="sticky"
      top={0}
      bg={headerBg}
      zIndex={1}
      boxShadow="sm"
      borderColor={borderColor}
    >
      {children}
    </Th>
  );

  const followupColumnOptions = [
    { key: "clientName", label: "Client Name" },
    { key: "companyName", label: "Company" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "package", label: "Package" },
    { key: "service", label: "Service" },
    { key: "deadline", label: "Deadline" },
    { key: "actions", label: "Actions" },
  ];

  const pendingB2BColumnOptions = [
    { key: "client", label: "Client" },
    { key: "company", label: "Company" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "type", label: "Type" },
    { key: "industry", label: "Industry" },
    { key: "country", label: "Country" },
    { key: "package", label: "Package" },
    { key: "actions", label: "Actions" },
  ];

  const completedSalesColumnOptions = [
    { key: "agentName", label: "Agent" },
    { key: "customerName", label: "Customer" },
    { key: "trainingProgram", label: "Training Program" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "schedulePreference", label: "Schedule Preference" },
  ];

  const trainingFollowupColumnOptions = [
    { key: "startDate", label: "Training Start Date" },
    { key: "agentName", label: "Agent Name" },
    { key: "customerName", label: "Customer Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone Number" },
    { key: "fieldOfWork", label: "Field of Work" },
    { key: "course", label: "Course" },
    { key: "schedule", label: "Schedule & Shift" },
    { key: "materialStatus", label: "Material Delivery Status" },
    { key: "progress", label: "Progress" },
    { key: "idInfo", label: "ID Info" },
    { key: "packageStatus", label: "Package Status" },
    { key: "actions", label: "Actions" },
  ];

  const ensraColumnOptions = [
    { key: "type", label: "Type" },
    { key: "packageType", label: "Package Type" },
    { key: "companyName", label: "Company Name" },
    { key: "positionsOffered", label: "Positions Offered" },
    { key: "salaryRange", label: "Salary Range" },
    { key: "jobRequirements", label: "Job Requirements" },
    { key: "jobSeekerName", label: "Job Seeker Name" },
    { key: "jobSeekerSkills", label: "Skills" },
    { key: "jobSeekerExperience", label: "Experience" },
    { key: "jobSeekerEducation", label: "Education" },
    { key: "jobSeekerExpectedSalary", label: "Expected Salary" },
    { key: "actions", label: "Actions" },
  ];

  const followupColumnsToRender = [
    {
      key: "clientName",
      visible: visibleColumns.followup.clientName,
      header: "Client Name",
      render: (item) => <CompactCell>{item.clientName}</CompactCell>,
    },
    {
      key: "companyName",
      visible: visibleColumns.followup.companyName,
      header: "Company",
      render: (item) => <CompactCell>{item.companyName}</CompactCell>,
    },
    {
      key: "phone",
      visible: visibleColumns.followup.phone && !isMobile,
      header: "Phone",
      render: (item) => <CompactCell>{item.phoneNumber}</CompactCell>,
    },
    {
      key: "email",
      visible: visibleColumns.followup.email && !isMobile,
      header: "Email",
      render: (item) => <CompactCell>{item.email}</CompactCell>,
    },
    {
      key: "package",
      visible: visibleColumns.followup.package,
      header: "Package",
      render: (item) => (
        <CompactCell>
          <Badge colorScheme="purple" fontSize="xs">
            {item.packageType || "Not specified"}
          </Badge>
        </CompactCell>
      ),
    },
    {
      key: "service",
      visible: visibleColumns.followup.service && !isLargerThan768,
      header: "Service",
      render: (item) => (
        <CompactCell>
          <Text noOfLines={1} fontSize="xs">
            {item.serviceProvided}
          </Text>
        </CompactCell>
      ),
    },
    {
      key: "deadline",
      visible: visibleColumns.followup.deadline,
      header: "Deadline",
      render: (item) => (
        <CompactCell>{new Date(item.deadline).toLocaleDateString()}</CompactCell>
      ),
    },
    {
      key: "actions",
      visible: visibleColumns.followup.actions,
      header: "Actions",
      render: (item) => (
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
      ),
    },
  ].filter((col) => col.visible);

  const pendingB2BColumnsToRender = [
    {
      key: "client",
      visible: visibleColumns.pendingB2B.client,
      header: "Client",
      render: (customer) => <CompactCell>{customer.clientName}</CompactCell>,
    },
    {
      key: "company",
      visible: visibleColumns.pendingB2B.company,
      header: "Company",
      render: (customer) => <CompactCell>{customer.companyName}</CompactCell>,
    },
    {
      key: "email",
      visible: visibleColumns.pendingB2B.email && !isMobile,
      header: "Email",
      render: (customer) => <CompactCell>{customer.email}</CompactCell>,
    },
    {
      key: "phone",
      visible: visibleColumns.pendingB2B.phone && !isMobile,
      header: "Phone",
      render: (customer) => <CompactCell>{customer.phoneNumber}</CompactCell>,
    },
    {
      key: "type",
      visible: visibleColumns.pendingB2B.type,
      header: "Type",
      render: (customer) => (
        <CompactCell>
          <Badge
            colorScheme={customer.type === "buyer" ? "green" : "purple"}
            fontSize="xs"
          >
            {customer.type}
          </Badge>
        </CompactCell>
      ),
    },
    {
      key: "industry",
      visible: visibleColumns.pendingB2B.industry && !isLargerThan768,
      header: "Industry",
      render: (customer) => <CompactCell>{customer.industry}</CompactCell>,
    },
    {
      key: "country",
      visible: visibleColumns.pendingB2B.country,
      header: "Country",
      render: (customer) => <CompactCell>{customer.country}</CompactCell>,
    },
    {
      key: "package",
      visible: visibleColumns.pendingB2B.package,
      header: "Package",
      render: (customer) => (
        <CompactCell>
          <Badge colorScheme="blue" fontSize="xs">
            {customer.packageType || "Not specified"}
          </Badge>
        </CompactCell>
      ),
    },
    {
      key: "actions",
      visible: visibleColumns.pendingB2B.actions,
      header: "Actions",
      render: (customer) => (
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
      ),
    },
  ].filter((col) => col.visible);

  const completedSalesColumnsToRender = [
    {
      key: "agentName",
      visible: visibleColumns.completedSales.agentName,
      header: "Agent",
      render: (item) => <CompactCell>{item.agentName}</CompactCell>,
    },
    {
      key: "customerName",
      visible: visibleColumns.completedSales.customerName,
      header: "Customer Name",
      render: (item) => <CompactCell>{item.customerName}</CompactCell>,
    },
    {
      key: "trainingProgram",
      visible: visibleColumns.completedSales.trainingProgram,
      header: "Training Program",
      render: (item) => <CompactCell>{item.trainingProgram}</CompactCell>,
    },
    {
      key: "phone",
      visible: visibleColumns.completedSales.phone && !isMobile,
      header: "Phone",
      render: (item) => <CompactCell>{item.phone}</CompactCell>,
    },
    {
      key: "email",
      visible: visibleColumns.completedSales.email && !isMobile,
      header: "Email",
      render: (item) => <CompactCell>{item.email}</CompactCell>,
    },
    {
      key: "schedulePreference",
      visible: visibleColumns.completedSales.schedulePreference,
      header: "Schedule Preference",
      render: (item) => <CompactCell>{item.schedulePreference}</CompactCell>,
    },
  ].filter((col) => col.visible);

  const trainingFollowupColumnsToRender = [
    {
      key: "startDate",
      visible: visibleColumns.trainingFollowup.startDate,
      header: "Training Start Date",
      render: (item) => (
        <CompactCell>
          {item.startDate ? new Date(item.startDate).toLocaleDateString() : "-"}
        </CompactCell>
      ),
    },
    {
      key: "agentName",
      visible: visibleColumns.trainingFollowup.agentName,
      header: "Agent Name",
      render: (item) => <CompactCell>{item.agentName}</CompactCell>,
    },
    {
      key: "customerName",
      visible: visibleColumns.trainingFollowup.customerName,
      header: "Customer Name",
      render: (item) => <CompactCell>{item.customerName}</CompactCell>,
    },
    {
      key: "email",
      visible: visibleColumns.trainingFollowup.email,
      header: "Email",
      render: (item) => <CompactCell>{item.email}</CompactCell>,
    },
    {
      key: "phone",
      visible: visibleColumns.trainingFollowup.phone,
      header: "Phone Number",
      render: (item) => <CompactCell>{item.phoneNumber}</CompactCell>,
    },
    {
      key: "fieldOfWork",
      visible: visibleColumns.trainingFollowup.fieldOfWork,
      header: "Field of Work",
      render: (item) => <CompactCell>{item.fieldOfWork}</CompactCell>,
    },
    {
      key: "course",
      visible: visibleColumns.trainingFollowup.course,
      header: "Course",
      render: (item) => <CompactCell>{item.trainingType}</CompactCell>,
    },
    {
      key: "schedule",
      visible: visibleColumns.trainingFollowup.schedule,
      header: "Schedule & Shift",
      render: (item) => (
        <CompactCell>
          <Tooltip label={item.scheduleShift || "Not set"} hasArrow>
            <Input
              as="select"
              size="sm"
              value={item.scheduleShift || ""}
              onChange={(e) =>
                handleInlineTrainingChange(item._id, "scheduleShift", e.target.value)
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
      ),
    },
    {
      key: "materialStatus",
      visible: visibleColumns.trainingFollowup.materialStatus,
      header: "Material Delivery Status",
      render: (item) => (
        <CompactCell>
          <Tooltip label={item.materialStatus || "Not set"} hasArrow>
            <Input
              as="select"
              size="sm"
              value={item.materialStatus || ""}
              onChange={(e) =>
                handleInlineTrainingChange(item._id, "materialStatus", e.target.value)
              }
            >
              <option value="">Select status</option>
              <option value="Not Delivered">Not Delivered</option>
              <option value="Delivered">Delivered</option>
            </Input>
          </Tooltip>
        </CompactCell>
      ),
    },
    {
      key: "progress",
      visible: visibleColumns.trainingFollowup.progress,
      header: "Progress",
      render: (item) => (
        <CompactCell>
          <Tooltip label={item.progress || "Not set"} hasArrow>
            <Input
              as="select"
              size="sm"
              value={item.progress || ""}
              onChange={(e) =>
                handleInlineTrainingChange(item._id, "progress", e.target.value)
              }
            >
              <option value="">Select progress</option>
              <option value="Not Started">Not Started</option>
              <option value="Started">Started</option>
              <option value="Dropped">Dropped</option>
            </Input>
          </Tooltip>
        </CompactCell>
      ),
    },
    {
      key: "idInfo",
      visible: visibleColumns.trainingFollowup.idInfo,
      header: "ID Info",
      render: (item) => <CompactCell>{item.idInfo}</CompactCell>,
    },
    {
      key: "packageStatus",
      visible: visibleColumns.trainingFollowup.packageStatus,
      header: "Package Status",
      render: (item) => <CompactCell>{item.packageStatus}</CompactCell>,
    },
    {
      key: "actions",
      visible: visibleColumns.trainingFollowup.actions,
      header: "Actions",
      render: (item) => (
        <CompactCell>
          <HStack spacing={2}>
            <Tooltip label="Edit training follow-up">
              <IconButton
                aria-label="Edit training follow-up"
                icon={<EditIcon />}
                size="xs"
                colorScheme="blue"
                variant="outline"
                onClick={() => openTrainingEdit(item)}
              />
            </Tooltip>
            <Tooltip label="Delete training follow-up">
              <IconButton
                aria-label="Delete training follow-up"
                icon={<DeleteIcon />}
                size="xs"
                colorScheme="red"
                variant="outline"
                onClick={() => handleDeleteTrainingFollowup(item._id)}
              />
            </Tooltip>
          </HStack>
        </CompactCell>
      ),
    },
  ].filter((col) => col.visible);

  const ensraColumnsToRender = [
    {
      key: "type",
      visible: visibleColumns.ensra.type,
      header: "Type",
      render: (item) => <CompactCell>{item.type}</CompactCell>,
    },
    {
      key: "packageType",
      visible: visibleColumns.ensra.packageType,
      header: "Package Type",
      render: (item) => <CompactCell>{item.packageType}</CompactCell>,
    },
    {
      key: "companyName",
      visible: visibleColumns.ensra.companyName,
      header: "Company Name",
      render: (item) => <CompactCell>{item.companyName}</CompactCell>,
    },
    {
      key: "positionsOffered",
      visible: visibleColumns.ensra.positionsOffered,
      header: "Positions Offered",
      render: (item) => <CompactCell>{item.positionsOffered}</CompactCell>,
    },
    {
      key: "salaryRange",
      visible: visibleColumns.ensra.salaryRange,
      header: "Salary Range",
      render: (item) => <CompactCell>{item.salaryRange}</CompactCell>,
    },
    {
      key: "jobRequirements",
      visible: visibleColumns.ensra.jobRequirements,
      header: "Job Requirements",
      render: (item) => <CompactCell>{item.jobRequirements}</CompactCell>,
    },
    {
      key: "jobSeekerName",
      visible: visibleColumns.ensra.jobSeekerName,
      header: "Job Seeker Name",
      render: (item) => <CompactCell>{item.jobSeekerName}</CompactCell>,
    },
    {
      key: "jobSeekerSkills",
      visible: visibleColumns.ensra.jobSeekerSkills,
      header: "Skills",
      render: (item) => <CompactCell>{item.jobSeekerSkills}</CompactCell>,
    },
    {
      key: "jobSeekerExperience",
      visible: visibleColumns.ensra.jobSeekerExperience,
      header: "Experience",
      render: (item) => <CompactCell>{item.jobSeekerExperience}</CompactCell>,
    },
    {
      key: "jobSeekerEducation",
      visible: visibleColumns.ensra.jobSeekerEducation,
      header: "Education",
      render: (item) => <CompactCell>{item.jobSeekerEducation}</CompactCell>,
    },
    {
      key: "jobSeekerExpectedSalary",
      visible: visibleColumns.ensra.jobSeekerExpectedSalary,
      header: "Expected Salary",
      render: (item) => <CompactCell>{item.jobSeekerExpectedSalary}</CompactCell>,
    },
    {
      key: "actions",
      visible: visibleColumns.ensra.actions,
      header: "Actions",
      render: (item) => (
        <CompactCell>
          <HStack spacing={2}>
            <Tooltip label="Edit ENSRA follow-up">
              <IconButton
                aria-label="Edit ENSRA follow-up"
                icon={<EditIcon />}
                size="xs"
                colorScheme="blue"
                variant="outline"
                onClick={() => openEnsraEdit(item)}
              />
            </Tooltip>
            <Tooltip label="Delete ENSRA follow-up">
              <IconButton
                aria-label="Delete ENSRA follow-up"
                icon={<DeleteIcon />}
                size="xs"
                colorScheme="red"
                variant="outline"
                onClick={() => handleDeleteEnsraFollowup(item._id || item.id)}
              />
            </Tooltip>
          </HStack>
        </CompactCell>
      ),
    },
  ].filter((col) => col.visible);

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
        
        <Box overflowX="auto" maxW="100%">
          <Tabs variant="enclosed" colorScheme="blue" isFitted={!isMobile}>
            <TabList mb={4} flexWrap={isMobile ? "wrap" : "nowrap"}>
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
                <CheckIcon />
                <Text>Training Follow-Up</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <DownloadIcon /><CheckIcon />
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
                        {renderColumnMenu("followup", followupColumnOptions)}
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
                          <TableContainer
                            overflowX="auto"
                            border="1px solid"
                            borderColor={tableBorderColor}
                            borderRadius="lg"
                            bg={tableBg}
                            boxShadow="sm"
                          >
                            <Table 
                              variant="striped"
                              colorScheme="gray"
                              size="sm" 
                              minWidth={isMobile ? "600px" : "auto"}
                            >
                              <Thead bg={headerBg}>
                                <Tr>
                                  {followupColumnsToRender.map((col) => (
                                    <CompactHeaderCell key={col.key}>{col.header}</CompactHeaderCell>
                                  ))}
                                </Tr>
                              </Thead>
                            <Tbody>
                                {Array.isArray(filteredData) && filteredData.map((item) => (
                                  <Tr 
                                    key={item._id} 
                                    onClick={() => isMobile && handleRowClick(item)}
                                    _hover={{ bg: rowHoverBg }}
                                    cursor={isMobile ? "pointer" : "default"}
                                  >
                                    {followupColumnsToRender.map((col) => (
                                      <React.Fragment key={col.key}>{col.render(item)}</React.Fragment>
                                    ))}
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                            
                            {(!Array.isArray(filteredData) || filteredData.length === 0) && (
                              <Text textAlign="center" py={8} color="gray.500">
                                No customers found
                              </Text>
                            )}
                          </TableContainer>
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
                      <HStack spacing={2}>
                        {renderColumnMenu("pendingB2B", pendingB2BColumnOptions)}
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
                      </HStack>
                    </Flex>
                    
                    {loadingB2B ? (
                      <Flex justify="center" py={10}>
                        <Spinner size="xl" />
                        <Text ml={4}>Loading pending B2B customers...</Text>
                      </Flex>
                    ) : (
                      <TableContainer
                        overflowX="auto"
                        border="1px solid"
                        borderColor={tableBorderColor}
                        borderRadius="lg"
                        bg={tableBg}
                        boxShadow="sm"
                      >
                        <Table
                          variant="striped"
                          colorScheme="gray"
                          size="sm"
                          minWidth={isMobile ? "900px" : "auto"}
                        >
                          <Thead bg={headerBg}>
                            <Tr>
                              {pendingB2BColumnsToRender.map((col) => (
                                <CompactHeaderCell key={col.key}>{col.header}</CompactHeaderCell>
                              ))}
                            </Tr>
                          </Thead>
                          <Tbody>
                            {Array.isArray(pendingB2BCustomers) && pendingB2BCustomers.length > 0 ? (
                              pendingB2BCustomers.map((customer) => (
                                <Tr 
                                  key={customer._id}
                                  _hover={{ bg: rowHoverBg }}
                                >
                                  {pendingB2BColumnsToRender.map((col) => (
                                    <React.Fragment key={col.key}>{col.render(customer)}</React.Fragment>
                                  ))}
                                </Tr>
                              ))
                            ) : (
                              <Tr>
                                <Td colSpan={pendingB2BColumnsToRender.length || 1} textAlign="center" py={10}>
                                  <Text color="gray.500">
                                    No pending B2B customers found. All B2B customers have been imported.
                                  </Text>
                                </Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </TableContainer>
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
                        {renderColumnMenu("completedSales", completedSalesColumnOptions)}
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
                      <TableContainer
                        overflowX="auto"
                        border="1px solid"
                        borderColor={tableBorderColor}
                        borderRadius="lg"
                        bg={tableBg}
                        boxShadow="sm"
                      >
                        <Table
                          variant="striped"
                          colorScheme="gray"
                          size="sm"
                          minWidth={isMobile ? "700px" : "auto"}
                        >
                          <Thead bg={headerBg}>
                            <Tr>
                              {completedSalesColumnsToRender.map((col) => (
                                <CompactHeaderCell key={col.key}>{col.header}</CompactHeaderCell>
                              ))}
                            </Tr>
                          </Thead>
                          <Tbody>
                            {Array.isArray(completedSales) && completedSales.length > 0 ? (
                              completedSales.map((item) => (
                                <Tr
                                  key={item.id || item._id}
                                  _hover={{ bg: rowHoverBg }}
                                >
                                  {completedSalesColumnsToRender.map((col) => (
                                    <React.Fragment key={col.key}>{col.render(item)}</React.Fragment>
                                  ))}
                                </Tr>
                              ))
                            ) : (
                              <Tr>
                                <Td colSpan={completedSalesColumnsToRender.length || 1} textAlign="center" py={10}>
                                  <Text color="gray.500">
                                    No completed sales found for training.
                                  </Text>
                                </Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    
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

                    {/* Training search / filter / sort controls */}
                    <Flex direction={isMobile ? "column" : "row"} gap={3} align="center">
                      <Box flex={1} width="100%">
                        <Input
                          placeholder="Search by customer, agent, or email..."
                          value={trainingSearch}
                          onChange={(e) => setTrainingSearch(e.target.value)}
                          size="sm"
                          borderRadius="md"
                          borderColor={borderColor}
                        />
                      </Box>
                      <HStack spacing={3} width={isMobile ? "100%" : "auto"} justify={isMobile ? "space-between" : "flex-end"}>
                        <Box minW="160px">
                          <Input
                            as="select"
                            size="sm"
                            value={trainingProgressFilter}
                            onChange={(e) => setTrainingProgressFilter(e.target.value)}
                          >
                            <option value="all">All Progress</option>
                            <option value="Not Started">Not Started</option>
                            <option value="Started">Started</option>
                            <option value="Dropped">Dropped</option>
                          </Input>
                        </Box>
                        {renderColumnMenu("trainingFollowup", trainingFollowupColumnOptions)}
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => setTrainingSortAsc((prev) => !prev)}
                        >
                          Sort {trainingSortAsc ? "A-Z" : "Z-A"}
                        </Button>
                      </HStack>
                    </Flex>

                    <TableContainer
                      overflowX="auto"
                      border="1px solid"
                      borderColor={tableBorderColor}
                      borderRadius="lg"
                      bg={tableBg}
                      boxShadow="sm"
                    >
                      <Table
                        variant="striped"
                        colorScheme="gray"
                        size="sm"
                        minWidth={isMobile ? "900px" : "auto"}
                      >
                        <Thead bg={headerBg}>
                          <Tr>
                            {trainingFollowupColumnsToRender.map((col) => (
                              <CompactHeaderCell key={col.key}>{col.header}</CompactHeaderCell>
                            ))}
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredTrainingFollowups.length > 0 ? (
                            filteredTrainingFollowups.map((item) => (
                                <Tr key={item._id} _hover={{ bg: rowHoverBg }}>
                                  {trainingFollowupColumnsToRender.map((col) => (
                                    <React.Fragment key={col.key}>{col.render(item)}</React.Fragment>
                                  ))}
                                </Tr>
                              ))
                            ) : (
                              <Tr>
                                <Td colSpan={trainingFollowupColumnsToRender.length || 1} textAlign="center" py={10}>
                                  <Text color="gray.500">
                                    No training follow-up records found.
                                  </Text>
                                </Td>
                              </Tr>
                            )}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    
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
                      <HStack spacing={2}>
                        {renderColumnMenu("ensra", ensraColumnOptions)}
                        <Tooltip label="Add ENSRA customer">
                          <IconButton
                            aria-label="Add ENSRA customer"
                            icon={<AddIcon />}
                            colorScheme="teal"
                            size="sm"
                            onClick={() => setShowEnsraFormCard(true)}
                          />
                        </Tooltip>
                      </HStack>
                    </Flex>

                    {/* ENSRA search / filter / sort controls */}
                    <Flex direction={isMobile ? "column" : "row"} gap={3} align="center">
                      <Box flex={1} width="100%">
                        <Input
                          placeholder="Search by company or job seeker name..."
                          value={ensraSearch}
                          onChange={(e) => setEnsraSearch(e.target.value)}
                          size="sm"
                          borderRadius="md"
                          borderColor={borderColor}
                        />
                      </Box>
                      <HStack spacing={3} width={isMobile ? "100%" : "auto"} justify={isMobile ? "space-between" : "flex-end"}>
                        <Box minW="160px">
                          <Input
                            as="select"
                            size="sm"
                            value={ensraTypeFilter}
                            onChange={(e) => setEnsraTypeFilter(e.target.value)}
                          >
                            <option value="all">All Types</option>
                            <option value="company">Company</option>
                            <option value="jobSeeker">Job Seeker</option>
                          </Input>
                        </Box>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => setEnsraSortAsc((prev) => !prev)}
                        >
                          Sort {ensraSortAsc ? "A-Z" : "Z-A"}
                        </Button>
                      </HStack>
                    </Flex>

                    <TableContainer
                      overflowX="auto"
                      border="1px solid"
                      borderColor={tableBorderColor}
                      borderRadius="lg"
                      bg={tableBg}
                      boxShadow="sm"
                    >
                      <Table
                        variant="striped"
                        colorScheme="gray"
                        size="sm"
                        minWidth={isMobile ? "900px" : "auto"}
                      >
                        <Thead bg={headerBg}>
                          <Tr>
                            {ensraColumnsToRender.map((col) => (
                              <CompactHeaderCell key={col.key}>{col.header}</CompactHeaderCell>
                            ))}
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredEnsraFollowups.length > 0 ? (
                            filteredEnsraFollowups.map((item) => (
                                <Tr key={item._id || item.id} _hover={{ bg: rowHoverBg }}>
                                  {ensraColumnsToRender.map((col) => (
                                    <React.Fragment key={col.key}>{col.render(item)}</React.Fragment>
                                  ))}
                                </Tr>
                              ))
                            ) : (
                              <Tr>
                                <Td colSpan={ensraColumnsToRender.length || 1} textAlign="center" py={10}>
                                  <Text color="gray.500">
                                    No ENSRA follow-up records found.
                                  </Text>
                                </Td>
                              </Tr>
                            )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                    

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
                                      <Radio value="jobSeeker">Job Seeker - Managing opportunities</Radio>
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

                                {ensraForm.type === "jobSeeker" && (
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
                                    (ensraForm.type === "jobSeeker" && !ensraForm.jobSeekerName)
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
        </Box>
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

      {/* Training Edit Modal */}
      <Modal isOpen={isTrainingEditOpen} onClose={() => setIsTrainingEditOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Training Follow-Up</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {trainingEditData && (
              <VStack spacing={3} align="stretch">
                <Input
                  placeholder="Agent Name"
                  value={trainingEditData.agentName || ""}
                  onChange={(e) => handleTrainingEditChange("agentName", e.target.value)}
                />
                <Input
                  placeholder="Customer Name"
                  value={trainingEditData.customerName || ""}
                  onChange={(e) => handleTrainingEditChange("customerName", e.target.value)}
                />
                <Input
                  placeholder="Email"
                  value={trainingEditData.email || ""}
                  onChange={(e) => handleTrainingEditChange("email", e.target.value)}
                />
                <Input
                  placeholder="Phone Number"
                  value={trainingEditData.phoneNumber || ""}
                  onChange={(e) => handleTrainingEditChange("phoneNumber", e.target.value)}
                />
                <Input
                  placeholder="Course"
                  value={trainingEditData.trainingType || ""}
                  onChange={(e) => handleTrainingEditChange("trainingType", e.target.value)}
                />
                <Input
                  as="select"
                  value={trainingEditData.scheduleShift || ""}
                  onChange={(e) => handleTrainingEditChange("scheduleShift", e.target.value)}
                >
                  <option value="">Select schedule</option>
                  <option value="Regular">Regular</option>
                  <option value="Night">Night</option>
                  <option value="Weekend">Weekend</option>
                  <option value="Night/Weekend">Night/Weekend</option>
                </Input>
                <Input
                  as="select"
                  value={trainingEditData.materialStatus || ""}
                  onChange={(e) => handleTrainingEditChange("materialStatus", e.target.value)}
                >
                  <option value="">Select material status</option>
                  <option value="Not Delivered">Not Delivered</option>
                  <option value="Delivered">Delivered</option>
                </Input>
                <Input
                  as="select"
                  value={trainingEditData.progress || ""}
                  onChange={(e) => handleTrainingEditChange("progress", e.target.value)}
                >
                  <option value="">Select progress</option>
                  <option value="Not Started">Not Started</option>
                  <option value="Started">Started</option>
                  <option value="Dropped">Dropped</option>
                </Input>
                <Input
                  placeholder="ID Info"
                  value={trainingEditData.idInfo || ""}
                  onChange={(e) => handleTrainingEditChange("idInfo", e.target.value)}
                />
                <Input
                  placeholder="Package Status"
                  value={trainingEditData.packageStatus || ""}
                  onChange={(e) => handleTrainingEditChange("packageStatus", e.target.value)}
                />
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={() => setIsTrainingEditOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={saveTrainingEdit}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ENSRA Edit Modal */}
      <Modal isOpen={isEnsraEditOpen} onClose={() => setIsEnsraEditOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit ENSRA Follow-Up</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {ensraEditData && (
              <VStack spacing={3} align="stretch">
                <Input
                  as="select"
                  value={ensraEditData.type || ""}
                  onChange={(e) => handleEnsraEditChange("type", e.target.value)}
                >
                  <option value="company">Company</option>
                  <option value="jobSeeker">Job Seeker</option>
                </Input>
                <Input
                  placeholder="Package Type"
                  value={ensraEditData.packageType || ""}
                  onChange={(e) => handleEnsraEditChange("packageType", e.target.value)}
                />
                <Input
                  placeholder="Company Name"
                  value={ensraEditData.companyName || ""}
                  onChange={(e) => handleEnsraEditChange("companyName", e.target.value)}
                />
                <Input
                  placeholder="Positions Offered (comma separated)"
                  value={
                    Array.isArray(ensraEditData.positionsOffered)
                      ? ensraEditData.positionsOffered.join(", ")
                      : ensraEditData.positionsOffered || ""
                  }
                  onChange={(e) => handleEnsraEditChange("positionsOffered", e.target.value)}
                />
                <Input
                  placeholder="Salary Range"
                  value={ensraEditData.salaryRange || ""}
                  onChange={(e) => handleEnsraEditChange("salaryRange", e.target.value)}
                />
                <Textarea
                  placeholder="Job Requirements"
                  value={ensraEditData.jobRequirements || ""}
                  onChange={(e) => handleEnsraEditChange("jobRequirements", e.target.value)}
                />
                <Input
                  placeholder="Job Seeker Name"
                  value={ensraEditData.jobSeekerName || ""}
                  onChange={(e) => handleEnsraEditChange("jobSeekerName", e.target.value)}
                />
                <Input
                  placeholder="Job Seeker Skills (comma separated)"
                  value={
                    Array.isArray(ensraEditData.jobSeekerSkills)
                      ? ensraEditData.jobSeekerSkills.join(", ")
                      : ensraEditData.jobSeekerSkills || ""
                  }
                  onChange={(e) => handleEnsraEditChange("jobSeekerSkills", e.target.value)}
                />
                <Input
                  placeholder="Job Seeker Experience"
                  value={ensraEditData.jobSeekerExperience || ""}
                  onChange={(e) => handleEnsraEditChange("jobSeekerExperience", e.target.value)}
                />
                <Input
                  placeholder="Job Seeker Education"
                  value={ensraEditData.jobSeekerEducation || ""}
                  onChange={(e) => handleEnsraEditChange("jobSeekerEducation", e.target.value)}
                />
                <Input
                  placeholder="Job Seeker Expected Salary"
                  value={ensraEditData.jobSeekerExpectedSalary || ""}
                  onChange={(e) => handleEnsraEditChange("jobSeekerExpectedSalary", e.target.value)}
                />
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={() => setIsEnsraEditOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={saveEnsraEdit}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
