import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Select,
  StackDivider,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import apiClient from "../utils/apiClient";
import { useUserStore } from "../store/user";

const REQUEST_TYPES = ["Creative", "Approval", "Collaboration", "Strategy", "General"];
const REQUEST_PRIORITIES = ["High", "Medium", "Low"];

const formatDate = (value) => {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const RequestPanel = ({
  department,
  title = "Submit Request",
  description,
  platformOptions = [],
  platformLabel = "Platform",
  showPlatform = true,
}) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  const currentUser = useUserStore((state) => state.currentUser);
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Fix: Only update platform when platformOptions actually change
  const defaultPlatform = useMemo(() => platformOptions[0] || "", [platformOptions]);
  
  const [form, setForm] = useState({
    title: "",
    platform: defaultPlatform,
    requestType: REQUEST_TYPES[0],
    priority: "Medium",
    dueDate: "",
    details: "",
  });

  // Fix: Only update form.platform when defaultPlatform actually changes
  useEffect(() => {
    setForm((prev) => {
      // Only update if the platform value is actually different
      if (prev.platform !== defaultPlatform) {
        return {
          ...prev,
          platform: defaultPlatform,
        };
      }
      return prev;
    });
  }, [defaultPlatform]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/requests", {
        params: { department },
      });
      const data = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];
      setRequests(data);
    } catch (err) {
      console.error("Failed to load requests:", err);
      toastRef.current?.({
        title: "Unable to load requests",
        description: err.message || "Please try again later",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const resetForm = () => {
    setForm({
      title: "",
      platform: defaultPlatform,
      requestType: REQUEST_TYPES[0],
      priority: "Medium",
      dueDate: "",
      details: "",
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", status: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        department,
        title: form.title.trim(),
        platform: showPlatform ? form.platform || undefined : undefined,
        requestType: form.requestType,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        details: form.details.trim() || undefined,
        requestedBy: currentUser?.email || currentUser?.username || "System",
        requestedById: currentUser?.id || currentUser?._id,
      };
      const response = await apiClient.post("/requests", payload);
      const entry = response.data?.data || response.data;
      if (entry) {
        setRequests((prev) => [entry, ...prev]);
      }
      resetForm();
      toast({ title: "Request submitted", status: "success" });
    } catch (err) {
      console.error("Failed to submit request:", err);
      toast({
        title: "Request failed",
        description: err.message || "Please try again later",
        status: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    const total = requests.length;
    const open = requests.filter((req) => (req.status || "open") !== "resolved").length;
    const highPriority = requests.filter((req) => req.priority === "High").length;
    return { total, open, highPriority };
  }, [requests]);

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
      <Card borderRadius="2xl" bg={cardBg} boxShadow="md" border="1px solid" borderColor={borderColor}>
        <CardHeader>
          <Heading size="lg">{title}</Heading>
          {description && <Text fontSize="sm" color="gray.500">{description}</Text>}
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch" divider={<StackDivider borderColor="gray.200" />}>
            <FormControl isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Brief summary of the request"
              />
            </FormControl>
            {showPlatform && (
              <FormControl>
                <FormLabel>{platformLabel}</FormLabel>
                <Select
                  value={form.platform}
                  onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
                >
                  {platformOptions.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl>
              <FormLabel>Type</FormLabel>
              <Select
                value={form.requestType}
                onChange={(e) => setForm((prev) => ({ ...prev, requestType: e.target.value }))}
              >
                {REQUEST_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Priority</FormLabel>
              <Select
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
              >
                {REQUEST_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Due date</FormLabel>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Details</FormLabel>
              <Textarea
                value={form.details}
                onChange={(e) => setForm((prev) => ({ ...prev, details: e.target.value }))}
                placeholder="Notes, context, or requirements"
                minH="120px"
              />
            </FormControl>
          </VStack>
        </CardBody>
        <CardFooter>
          <Button colorScheme="teal" onClick={handleSubmit} isLoading={submitting} w="full">
            Submit request
          </Button>
        </CardFooter>
      </Card>

      <Card borderRadius="2xl" bg={cardBg} boxShadow="md" border="1px solid" borderColor={borderColor}>
        <CardHeader>
          <Flex align="center" justify="space-between" w="100%">
            <Heading size="lg">Open requests</Heading>
            <Button variant="ghost" size="sm" onClick={fetchRequests} isLoading={loading}>
              Refresh
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={3} spacing={3} mb={4}>
            <Box p={3} borderRadius="md" border="1px solid" borderColor="gray.200" bg="gray.50">
              <Text fontSize="xs" color="gray.500">Total</Text>
              <Heading size="md">{summary.total}</Heading>
            </Box>
            <Box p={3} borderRadius="md" border="1px solid" borderColor="gray.200" bg="gray.50">
              <Text fontSize="xs" color="gray.500">Open</Text>
              <Heading size="md">{summary.open}</Heading>
            </Box>
            <Box p={3} borderRadius="md" border="1px solid" borderColor="gray.200" bg="gray.50">
              <Text fontSize="xs" color="gray.500">High priority</Text>
              <Heading size="md">{summary.highPriority}</Heading>
            </Box>
          </SimpleGrid>

          {loading ? (
            <Text textAlign="center" color="gray.500">Loading requests...</Text>
          ) : requests.length === 0 ? (
            <Text textAlign="center" color="gray.500">No requests yet</Text>
          ) : (
            <VStack spacing={3} align="stretch">
              {requests.slice(0, 6).map((request) => (
                <Box
                  key={request._id || request.createdAt}
                  p={3}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="gray.50"
                >
                  <HStack justify="space-between" align="start">
                    <Text fontWeight="semibold" flex="1" isTruncated>
                      {request.title}
                    </Text>
                    <Badge colorScheme={request.priority === "High" ? "red" : request.priority === "Medium" ? "orange" : "gray"}>
                      {request.priority}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {request.platform ? `${request.platform} • ` : ""}
                    {request.department?.toUpperCase() || department.toUpperCase()} • due {formatDate(request.dueDate)}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Submitted by {request.requestedBy || "Team"} on {formatDate(request.createdAt)}
                  </Text>
                  {request.details && (
                    <Text fontSize="sm" color="gray.600" mt={2}>
                      {request.details}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </CardBody>
      </Card>
    </SimpleGrid>
  );
};

export default RequestPanel;