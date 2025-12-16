import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Badge,
  Input,
  SimpleGrid,
  StackDivider,
  Tag,
  Text,
  Textarea,
  Select,
  useColorMode,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { AttachmentIcon, RepeatIcon } from "@chakra-ui/icons";
import apiClient from "../utils/apiClient";
import { useUserStore } from "../store/user";
import { useNavigate } from "react-router-dom";
import { getUserDepartment } from "../utils/department";

const PRIORITIES = ["High", "Medium", "Low"];

const formatDate = (value) => {
  if (!value) return "No date";
  const parsed = typeof value === "string" ? new Date(value) : value;
  const timestamp = parsed ? parsed.getTime?.() : NaN;
  if (Number.isNaN(timestamp)) return "No date";
  return new Date(timestamp).toLocaleDateString();
};

const getRequestStatusColor = (status) => {
  const normalized = (status || "Pending").toLowerCase();
  if (normalized === "completed") return "green";
  if (normalized === "approved") return "teal";
  return "orange";
};

export default function RequestPage() {
  const toast = useToast();
  const navigateUser = useUserStore((state) => state.currentUser);
  const customerSuccessRoles = new Set([
    "customerservice",
    "customer_success_manager",
    "customersuccessmanager",
    "customersuccess",
  ]);
  const showSalesReturnButton = navigateUser?.role === "sales";
  const showCustomerSuccessReturnButton = navigateUser?.role
    ? customerSuccessRoles.has(navigateUser.role)
    : false;
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const fileInputRef = useRef(null);
  const todayString = new Date().toISOString().split("T")[0];
  const cardBg = useColorModeValue("white", "gray.700");
  const cardTextColor = useColorModeValue("gray.800", "gray.50");
  const cardHelperColor = useColorModeValue("gray.500", "gray.300");
  const detailTextColor = useColorModeValue("gray.600", "gray.300");
  const cardDividerColor = useColorModeValue("gray.200", "gray.600");
  const recentItemBg = useColorModeValue("gray.50", "gray.600");

  const initialDepartment = getUserDepartment(navigateUser);
  const [form, setForm] = useState(() => ({
    department: initialDepartment || "",
    details: "",
    priority: "Medium",
    date: todayString,
    attachment: null,
  }));
  const [recentRequests, setRecentRequests] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submittedByLabel = useMemo(() => {
    if (!navigateUser) return "Unknown user";
    return navigateUser.email || navigateUser.username || navigateUser.displayRole || "User";
  }, [navigateUser]);

  const normalizeForm = (field, value) =>
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

  const departmentDisplayLabel = form.department || "your department";

  useEffect(() => {
    const dept = getUserDepartment(navigateUser);
    setForm((prev) => ({
      ...prev,
      department: dept || prev.department,
    }));
  }, [navigateUser]);

  const fetchRecentRequests = useCallback(async () => {
    if (!form.department) {
      setRecentRequests([]);
      return;
    }
    setFetching(true);
    try {
      const response = await apiClient.get("/requests", {
        params: { department: form.department },
      });
      const data = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];
      setRecentRequests(data.slice(0, 5));
    } catch (error) {
      console.error("Unable to load requests:", error);
      setRecentRequests([]);
      toast({
        title: "Unable to load requests",
        description: error.message || "Please try again later.",
        status: "error",
      });
    } finally {
      setFetching(false);
    }
  }, [form.department, toast]);

  useEffect(() => {
    fetchRecentRequests();
  }, [fetchRecentRequests]);

  const handleSubmit = async () => {
    if (!navigateUser) {
      toast({
        title: "Not signed in",
        description: "Please log in before submitting requests.",
        status: "warning",
      });
      return;
    }
    if (!form.department || !form.details.trim() || !form.date || !form.priority) {
      toast({
        title: "Missing required fields",
        description: "Department, details, date, and priority are required.",
        status: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("department", form.department);
      payload.append("details", form.details.trim());
      payload.append("priority", form.priority);
      payload.append("date", form.date);
      payload.append("createdBy", submittedByLabel);
      if (navigateUser?._id) {
        payload.append("createdById", navigateUser._id);
      }
      if (form.attachment) {
        payload.append("attachment", form.attachment);
      }

      const response = await apiClient.post("/requests", payload);
      const entry = response.data?.data || response.data;
      if (entry) {
        setRecentRequests((prev) => [entry, ...prev].slice(0, 5));
      }
      toast({ title: "Request submitted", status: "success" });
      setForm((prev) => ({
        ...prev,
        details: "",
        priority: "Medium",
        date: new Date().toISOString().split("T")[0],
        attachment: null,
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Request submission failed", error);
      toast({
        title: "Request failed",
        description: error.message || "Try again later.",
        status: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!navigateUser) {
    return (
      <Center minH="100vh" bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <VStack spacing={4} bg={cardBg} color={cardTextColor} p={6} borderRadius="xl" boxShadow="lg">
          <Heading size="md">Sign in to submit requests</Heading>
          <Text textAlign="center" color={cardHelperColor}>
            Finance needs to know who is submitting a request. Please sign in to continue.
          </Text>
          <Button colorScheme="teal" onClick={() => navigate("/login")}>
            Go to Login
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
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
        <Box maxW={{ base: "100%", md: "70%" }}>
          <Heading size="2xl">Unified Request Center</Heading>
          <Text fontSize="md" color={cardHelperColor}>
            All departments can submit their requests here. Finance reviews and approves everything centrally.
          </Text>
          <Text fontSize="sm" mt={2}>
            Finance is the single source of truth for approvals. Pick a department, add the details, and let the team handle the follow up.
          </Text>
        </Box>
        <HStack spacing={2}>
          <Tag colorScheme="teal">Submitted by: {submittedByLabel}</Tag>
          {showSalesReturnButton && (
            <Button size="sm" variant="ghost" onClick={() => navigate("/sdashboard")}>
              Back to Sales
            </Button>
          )}
          {showCustomerSuccessReturnButton && (
            <Button size="sm" variant="ghost" onClick={() => navigate("/Cdashboard")}>
              Back to Customer Success
            </Button>
          )}
          <Button size="sm" variant="outline" leftIcon={<RepeatIcon />} onClick={toggleColorMode}>
            {colorMode === "light" ? "Dark" : "Light"} mode
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid
        columns={{ base: 1, md: 2 }}
        spacing={6}
        divider={<StackDivider borderColor={cardDividerColor} />}
      >
        <Box bg={cardBg} color={cardTextColor} borderRadius="xl" boxShadow="lg" p={6}>
          <VStack align="stretch" spacing={4}>
            <Heading size="lg">Submit a request</Heading>
            <Text fontSize="sm" color={cardHelperColor}>
              Finance needs department, details, date, and priority. Attachments are optional.
            </Text>

            <FormControl isRequired>
              <FormLabel>Department</FormLabel>
              <Input
                value={form.department || ""}
                placeholder="Department not configured"
                isReadOnly
              />
              <FormHelperText>Assigned automatically from your profile.</FormHelperText>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Details</FormLabel>
              <Textarea
                value={form.details}
                onChange={(event) => normalizeForm("details", event.target.value)}
                placeholder="Describe the request in detail"
                minH="140px"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Priority</FormLabel>
              <Select value={form.priority} onChange={(event) => normalizeForm("priority", event.target.value)}>
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
                value={form.date}
                onChange={(event) => normalizeForm("date", event.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Optional attachment</FormLabel>
              <Input
                type="file"
                accept="image/*,application/pdf"
                ref={fileInputRef}
                onChange={(event) => normalizeForm("attachment", event.target.files?.[0] || null)}
              />
            </FormControl>
            <Button colorScheme="teal" onClick={handleSubmit} isLoading={submitting}>
              Submit request
            </Button>
          </VStack>
        </Box>

        <Box bg={cardBg} color={cardTextColor} borderRadius="xl" boxShadow="lg" p={6}>
          <VStack align="stretch" spacing={4}>
            <Heading size="lg">Recent submissions</Heading>
            <Text fontSize="sm" color={cardHelperColor}>
              Showing the latest five requests for {departmentDisplayLabel}.
            </Text>
            {fetching ? (
              <Text color={cardHelperColor}>Loading requests...</Text>
            ) : recentRequests.length === 0 ? (
              <Text color={cardHelperColor}>No requests yet</Text>
            ) : (
              recentRequests.map((entry) => (
                <Box key={entry._id || entry.createdAt} p={3} borderRadius="lg" bg={recentItemBg}>
                  <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                    <Text fontWeight="semibold">{entry.department} request</Text>
                    <HStack spacing={2}>
                      <Tag
                        size="sm"
                        colorScheme={
                          entry.priority === "High" ? "red" : entry.priority === "Medium" ? "orange" : "gray"
                        }
                      >
                        {entry.priority || "Medium"}
                      </Tag>
                      <Badge
                        size="sm"
                        colorScheme={getRequestStatusColor(entry.status)}
                        variant="subtle"
                        textTransform="capitalize"
                      >
                        {entry.status || "Pending"}
                      </Badge>
                    </HStack>
                  </Flex>
                  <Text fontSize="xs" color={cardHelperColor} mt={1}>
                    Submitted {formatDate(entry.date || entry.createdAt)} • Status: {entry.status || "Pending"}
                  </Text>
                  <Text fontSize="xs" color={cardHelperColor} mb={1}>
                    By {entry.createdBy}
                  </Text>
                  {entry.attachment?.filename && (
                    <Button
                      as="a"
                      href={entry.attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      size="xs"
                      variant="ghost"
                      leftIcon={<AttachmentIcon />}
                    >
                      {entry.attachment.filename}
                    </Button>
                  )}
                  <Text fontSize="sm" color={detailTextColor} noOfLines={2}>
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
