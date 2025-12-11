import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  StackDivider,
  Tag,
  Text,
  Textarea,
  useColorMode,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import { useUserStore } from "../../store/user";

const PRIORITIES = ["High", "Medium", "Low"];
const DEPARTMENTS = ["Social Media", "TradexTV", "IT"];

const SocialMediaRequestPage = () => {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const [form, setForm] = useState({
    department: "Social Media",
    details: "",
    dueDate: "",
    priority: "High",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState([]);
  const authorizedEmail = "socialmedia@gmail.com";
  const normalizedEmail = currentUser?.email?.toLowerCase().trim() || "";
  const normalizedRole = currentUser?.role?.toLowerCase().trim() || "";

  const isAuthorized = useMemo(() => {
    return (
      normalizedEmail === authorizedEmail ||
      normalizedRole === "socialmediamanager" ||
      normalizedRole === "socialmedia"
    );
  }, [normalizedEmail, normalizedRole, authorizedEmail]);

  const normalizeForm = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleLogout = () => {
    if (typeof clearUser === "function") {
      clearUser();
    }
    navigate("/login");
  };

  const handleDashboardNav = () => {
    navigate("/social-media");
  };

  const fetchRequests = useCallback(async () => {
    try {
      const response = await apiClient.get("/requests", {
        params: { department: form.department },
      });
      const data = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];
      setSubmitted(data.slice(0, 5));
    } catch (error) {
      console.error("Unable to load requests:", error);
    }
  }, [form.department]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async () => {
    if (!form.department || !form.details.trim() || !form.dueDate || !form.priority) {
      toast({
        title: "Missing required fields",
        description: "Department, details, date, and priority are required.",
        status: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/requests", {
        title: `${form.department} request`,
        department: form.department,
        details: form.details.trim(),
        dueDate: form.dueDate,
        priority: form.priority,
        requestedBy: currentUser?.email || currentUser?.username,
        requestedById: currentUser?._id,
      });
      const entry = response.data?.data || response.data;
      setSubmitted((prev) => [entry, ...prev].slice(0, 5));
      toast({ title: "Request submitted", status: "success" });
      setForm((prev) => ({ ...prev, details: "", dueDate: "", priority: "High" }));
    } catch (error) {
      console.error("Request failed:", error);
      toast({
        title: "Unable to submit request",
        description: error.message || "Please try again later.",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Center minH="100vh" bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <VStack spacing={4} bg="white" p={6} borderRadius="xl" boxShadow="lg">
          <Text fontSize="lg" fontWeight="bold">
            Please log in to continue
          </Text>
          <Text textAlign="center" color="gray.600">
            Only the social media specialist account can access this space.
          </Text>
          <Button colorScheme="purple" onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </VStack>
      </Center>
    );
  }

  if (!isAuthorized) {
    return (
      <Center minH="100vh" bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <VStack spacing={4} bg="white" p={6} borderRadius="xl" boxShadow="lg">
          <Text fontSize="lg" fontWeight="bold">
            Access denied
          </Text>
          <Text textAlign="center" color="gray.600">
            This request center is reserved for {authorizedEmail}. Please log in with that account.
          </Text>
          <Button colorScheme="purple" onClick={() => navigate("/login")}>
            Switch Account
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box
      minH="100vh"
      bg={useColorModeValue("gray.100", "gray.900")}
      px={{ base: 4, md: 6 }}
      py={{ base: 6, md: 10 }}
    >
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
        <Box>
          <Text fontSize="3xl" fontWeight="bold">
            Social Media Requests
          </Text>
          <Text fontSize="sm" color="gray.500">
            Submit requests that finance tracks before sharing with the team.
          </Text>
        </Box>
        <HStack spacing={2}>
          <Button size="sm" variant="outline" colorScheme="teal" onClick={handleDashboardNav}>
            Dashboard
          </Button>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            variant="ghost"
            size="sm"
            onClick={toggleColorMode}
          />
          <Button size="sm" variant="ghost" colorScheme="red" onClick={handleLogout}>
            Logout
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid
        columns={{ base: 1, md: 2 }}
        spacing={6}
        divider={<StackDivider borderColor="gray.200" />}
      >
        <Box bg="white" borderRadius="xl" boxShadow="lg" p={6}>
          <VStack align="stretch" spacing={4}>
            <Heading size="lg">Social media request</Heading>
            <Text fontSize="sm" color="gray.500">
              Finance needs department, detail, date, and priority. All fields are mandatory.
            </Text>
            <FormControl isRequired>
              <FormLabel>Department</FormLabel>
              <Select
                value={form.department}
                onChange={(event) => normalizeForm("department", event.target.value)}
              >
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Details</FormLabel>
              <Textarea
                value={form.details}
                onChange={(event) => normalizeForm("details", event.target.value)}
                placeholder="Describe the request in detail"
                minH="120px"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Priority</FormLabel>
              <Select
                value={form.priority}
                onChange={(event) => normalizeForm("priority", event.target.value)}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Date</FormLabel>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(event) => normalizeForm("dueDate", event.target.value)}
              />
            </FormControl>
            <Button colorScheme="teal" onClick={handleSubmit} isLoading={loading}>
              Submit request
            </Button>
          </VStack>
        </Box>
        <Box bg="white" borderRadius="xl" boxShadow="lg" p={6}>
          <VStack align="stretch" spacing={4}>
            <Heading size="lg">Recent submissions</Heading>
            {submitted.length === 0 ? (
              <Text color="gray.500">No requests yet</Text>
            ) : (
              submitted.map((entry) => (
                <Box key={entry._id || entry.title} p={3} borderRadius="lg" bg="gray.50">
                  <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                    <Text fontWeight="semibold">{entry.title}</Text>
                    <Tag
                      size="sm"
                      colorScheme={
                        entry.priority === "High"
                          ? "red"
                          : entry.priority === "Medium"
                          ? "orange"
                          : "gray"
                      }
                    >
                      {entry.priority || "Medium"}
                    </Tag>
                  </Flex>
                  <Text fontSize="xs" color="gray.500">
                    {entry.department} •{" "}
                    {new Date(entry.dueDate || entry.createdAt).toLocaleDateString()}
                  </Text>
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                    {entry.details}
                  </Text>
                </Box>
              ))
            )}
          </VStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default SocialMediaRequestPage;
