import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  chakra,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Button,
  Select,
  useToast,
  Tag,
  TagLabel,
  TagCloseButton,
  Badge,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";
import Layout from "./Layout";

const CustomerSettings = () => {
  const toast = useToast();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingB2B, setPendingB2B] = useState([]);
  const [csUsers, setCsUsers] = useState([]);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState({});
  const [form, setForm] = useState({
    packageNumber: "",
    services: [],
    serviceInput: "",
    price: "",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);
  const weeklyTargetsKey = "customerWeeklyTargets";
  const [weeklyTargets, setWeeklyTargets] = useState({
    education: {
      userManuals: 300,
      trainingVideos: 300,
      faqGuides: 200,
      telegramGuidance: 200,
      followupReminders: 600,
    },
    officers: {
      officer1: 300,
      officer2: 300,
      officer3: 300,
      officer4: 300,
      manager: 800,
    },
    quality: {
      satisfaction: 90,
      serviceAccuracy: 95,
      compliance: 100,
      crossResponse: 100,
      timeToResolveHours: 24,
      trainingToB2B: 30,
      renewals: 20,
    },
  });

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/packages`);
        setPackages(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load packages", err);
        toast({ title: "Failed to load packages", status: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();

    try {
      const saved = localStorage.getItem(weeklyTargetsKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setWeeklyTargets((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      /* ignore */
    }
  }, [toast]);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchCsUsers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, { headers });

        // Normalize possible response shapes
        const raw =
          (Array.isArray(res.data) && res.data) ||
          res.data?.users ||
          res.data?.data ||
          [];

        const users = Array.isArray(raw) ? raw : [];

        const customerServiceAgents = users.filter((u) => {
          const role = (u.role || u.roleName || "").toLowerCase().replace(/[\s_-]+/g, "");
          return role === "customerservice";
        });

        setCsUsers(customerServiceAgents);
      } catch (err) {
        console.error("Failed to load CS users", err);
      }
    };

    const fetchPendingB2B = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/followups/b2b-pending`, { headers });
        setPendingB2B(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load pending B2B customers", err);
      }
    };

    fetchCsUsers();
    fetchPendingB2B();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddService = () => {
    const service = form.serviceInput.trim();
    if (!service) return;
    if ((form.services || []).includes(service)) return;
    setForm((prev) => ({
      ...prev,
      services: [...(prev.services || []), service],
      serviceInput: "",
    }));
  };

  const handleRemoveService = (svc) => {
    setForm((prev) => ({
      ...prev,
      services: (prev.services || []).filter((s) => s !== svc),
    }));
  };

  const resetForm = () => {
    setForm({ packageNumber: "", services: [], serviceInput: "", price: "", description: "" });
    setEditingId(null);
  };

  const handleAdd = () => {
    const services = form.services || [];
    if (!form.packageNumber || services.length === 0 || !form.price) {
      toast({
        title: "Missing fields",
        description: "Package number, at least one service, and price are required.",
        status: "warning",
      });
      return;
    }
    const exists = packages.some((p) => String(p.packageNumber) === String(form.packageNumber));
    if (exists) {
      toast({
        title: "Duplicate package number",
        description: "Use a unique number for each package.",
        status: "error",
      });
      return;
    }
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/packages`, {
        packageNumber: form.packageNumber,
        services,
        price: parseFloat(form.price) || 0,
        description: form.description,
      })
      .then((res) => {
        setPackages((prev) => [...prev, res.data]);
        resetForm();
        toast({ title: "Package added", status: "success" });
      })
      .catch((err) => {
        toast({
          title: "Failed to add package",
          description: err.response?.data?.message || err.message,
          status: "error",
        });
      });
  };

  const startEdit = (pkg) => {
    setEditingId(pkg._id);
    setForm({
      packageNumber: pkg.packageNumber,
      services: pkg.services || [],
      serviceInput: "",
      price: pkg.price,
      description: pkg.description || "",
    });
  };

  const saveEdit = () => {
    const services = form.services || [];
    if (services.length === 0) {
      toast({ title: "Add at least one service", status: "warning" });
      return;
    }
    axios
      .put(`${import.meta.env.VITE_API_URL}/api/packages/${editingId}`, {
        packageNumber: form.packageNumber,
        services,
        price: parseFloat(form.price) || 0,
        description: form.description,
      })
      .then((res) => {
        setPackages((prev) => prev.map((p) => (p._id === editingId ? res.data : p)));
        resetForm();
        toast({ title: "Package updated", status: "success" });
      })
      .catch((err) => {
        toast({
          title: "Failed to update",
          description: err.response?.data?.message || err.message,
          status: "error",
        });
      });
  };

  const deletePkg = (id) => {
    axios
      .delete(`${import.meta.env.VITE_API_URL}/api/packages/${id}`)
      .then(() => {
        setPackages((prev) => prev.filter((p) => p._id !== id));
        toast({ title: "Package deleted", status: "info" });
      })
      .catch((err) => {
        toast({
          title: "Failed to delete",
          description: err.response?.data?.message || err.message,
          status: "error",
        });
      });
  };

  const saveWeeklyTargets = () => {
    try {
      localStorage.setItem(weeklyTargetsKey, JSON.stringify(weeklyTargets));
      toast({ title: "Weekly targets saved", status: "success" });
    } catch (err) {
      toast({
        title: "Could not save targets",
        description: err.message,
        status: "error",
      });
    }
  };

  const handleAssignB2B = async (customer) => {
    const token = localStorage.getItem("userToken");
    const agentId = selectedAgent[customer._id];
    if (!token) {
      toast({ title: "Please log in first", status: "error" });
      return;
    }
    if (!agentId) {
      toast({ title: "Select an agent", status: "warning" });
      return;
    }
    setAssigningId(customer._id);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/followups/import-b2b`,
        { customerType: customer.type, customerId: customer._id, agentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "Assigned and imported", status: "success" });
      setPendingB2B((prev) => prev.filter((c) => c._id !== customer._id));
    } catch (err) {
      toast({
        title: "Failed to assign",
        description: err.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Layout>
      <Box bgGradient="linear(to-b, gray.50, white)" minH="100vh" p={{ base: 4, md: 8 }}>
        <Flex align="center" justify="space-between" mb={6}>
          <Box>
            <Heading size="lg">Customer Settings</Heading>
            <Text color="gray.500" fontSize="sm">
              Manage packages, services, pricing, and weekly targets in one place.
            </Text>
          </Box>
          {loading && <Text color="gray.500" fontSize="sm">Loading...</Text>}
        </Flex>

        <Card
          mb={6}
          border="1px solid"
          borderColor="gray.200"
          boxShadow="xl"
          bg="white"
          rounded="2xl"
        >
          <CardHeader
            pb={2}
            bgGradient="linear(to-r, teal.500, blue.500)"
            color="white"
            roundedTop="2xl"
          >
            <Flex align="center" justify="space-between">
              <Box>
                <Text fontSize="sm" opacity={0.9}>
                  {editingId ? "Update an existing package" : "Create a new package"}
                </Text>
                <Heading size="md" mt={1}>
                  {editingId ? "Edit Package" : "Add Package"}
                </Heading>
              </Box>
              <Button
                size="sm"
                variant="outline"
                color="white"
                borderColor="whiteAlpha.700"
                leftIcon={<CloseIcon boxSize={2.5} />}
                onClick={resetForm}
              >
                Reset
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack spacing={5}>
              <Stack
                direction={{ base: "column", md: "row" }}
                spacing={4}
                align="flex-start"
              >
                <NumberInput
                  value={form.packageNumber}
                  min={1}
                  onChange={(val) => handleChange("packageNumber", val)}
                  flex={1}
                >
                  <NumberInputField placeholder="Package number (use numbers)" />
                </NumberInput>
                <Input
                  placeholder="Add a service name"
                  value={form.serviceInput}
                  onChange={(e) => handleChange("serviceInput", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddService();
                    }
                  }}
                  flex={2}
                />
                <Button
                  colorScheme="teal"
                  leftIcon={<AddIcon />}
                  onClick={handleAddService}
                  minW="140px"
                >
                  Add Service
                </Button>
              </Stack>

              <HStack spacing={2} wrap="wrap">
                {(form.services || []).map((svc) => (
                  <Tag
                    key={svc}
                    size="md"
                    borderRadius="full"
                    colorScheme="blue"
                    variant="subtle"
                  >
                    <TagLabel>{svc}</TagLabel>
                    <TagCloseButton onClick={() => handleRemoveService(svc)} />
                  </Tag>
                ))}
                {form.services.length === 0 && (
                  <Text color="gray.500" fontSize="sm">
                    Add at least one service to this package.
                  </Text>
                )}
              </HStack>

              <Stack
                direction={{ base: "column", md: "row" }}
                spacing={4}
                align="stretch"
              >
                <NumberInput
                  value={form.price}
                  min={0}
                  precision={2}
                  onChange={(val) => handleChange("price", val)}
                  flex={1}
                >
                  <NumberInputField placeholder="Price" />
                </NumberInput>
                <Input
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  flex={2}
                />
              </Stack>

              <HStack spacing={3}>
                <Button
                  colorScheme="teal"
                  leftIcon={editingId ? <CheckIcon /> : <AddIcon />}
                  onClick={editingId ? saveEdit : handleAdd}
                >
                  {editingId ? "Save Changes" : "Add Package"}
                </Button>
                {editingId && (
                  <Button variant="ghost" leftIcon={<CloseIcon />} onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </HStack>
            </Stack>
          </CardBody>
        </Card>

        <Card border="1px solid" borderColor="gray.200" rounded="2xl" boxShadow="xl" mb={6}>
          <CardHeader pb={2}>
            <Heading size="md">Packages & Services</Heading>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                      Package #
                    </Th>
                    <Th fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                      Services
                    </Th>
                    <Th fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                      Price
                    </Th>
                    <Th fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                      Description
                    </Th>
                    <Th textAlign="right" fontSize="xs" textTransform="uppercase" letterSpacing="0.08em">
                      Actions
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {packages.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py={6}>
                        <Text color="gray.500">No packages added yet.</Text>
                      </Td>
                    </Tr>
                  ) : (
                    packages.map((pkg) => (
                      <Tr key={pkg._id} _hover={{ bg: "gray.50" }}>
                        <Td fontWeight="bold">{pkg.packageNumber}</Td>
                        <Td>
                          <Flex gap={2} wrap="wrap">
                            {(pkg.services || []).map((svc, idx) => (
                              <Tag key={idx} size="sm" variant="solid" colorScheme="purple">
                                <TagLabel>{svc}</TagLabel>
                              </Tag>
                            ))}
                          </Flex>
                        </Td>
                        <Td fontWeight="semibold">${Number(pkg.price || 0).toFixed(2)}</Td>
                        <Td maxW="300px">
                          <chakra.span noOfLines={2}>
                            {pkg.description || "-"}
                          </chakra.span>
                        </Td>
                        <Td textAlign="right">
                          <HStack justify="flex-end" spacing={2}>
                            <IconButton
                              aria-label="Edit package"
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(pkg)}
                            />
                            <IconButton
                              aria-label="Delete package"
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => deletePkg(pkg._id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>

        <Card border="1px solid" borderColor="gray.200" rounded="2xl" boxShadow="xl">
          <CardHeader pb={2}>
            <Heading size="md">Weekly Targets</Heading>
            <Text color="gray.500" fontSize="sm">
              Set weekly targets here; reports compare actuals against these numbers.
            </Text>
          </CardHeader>
          <CardBody>
            <Stack spacing={5}>
              <Box>
                <Heading size="sm" mb={2}>Customer Education Targets</Heading>
                <Stack spacing={3}>
                  {[
                    { key: "userManuals", label: "User Manuals Sent" },
                    { key: "trainingVideos", label: "Training Videos Shared" },
                    { key: "faqGuides", label: "FAQ Guides Sent" },
                    { key: "telegramGuidance", label: "Telegram Guidance Messages" },
                    { key: "followupReminders", label: "Follow-up Reminders" },
                  ].map((row) => (
                    <HStack key={row.key}>
                      <Text flex={1}>{row.label}</Text>
                      <NumberInput
                        value={weeklyTargets.education[row.key]}
                        min={0}
                        onChange={(val) =>
                          setWeeklyTargets((prev) => ({
                            ...prev,
                            education: { ...prev.education, [row.key]: Number(val) || 0 },
                          }))
                        }
                        maxW="140px"
                      >
                        <NumberInputField />
                      </NumberInput>
                    </HStack>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Heading size="sm" mb={2}>Individual Customer Success Officer Targets</Heading>
                <Stack spacing={3}>
                  {[
                    { key: "officer1", label: "Officer 1" },
                    { key: "officer2", label: "Officer 2" },
                    { key: "officer3", label: "Officer 3" },
                    { key: "officer4", label: "Officer 4" },
                    { key: "manager", label: "Customer Success Manager" },
                  ].map((row) => (
                    <HStack key={row.key}>
                      <Text flex={1}>{row.label}</Text>
                      <NumberInput
                        value={weeklyTargets.officers[row.key]}
                        min={0}
                        onChange={(val) =>
                          setWeeklyTargets((prev) => ({
                            ...prev,
                            officers: { ...prev.officers, [row.key]: Number(val) || 0 },
                          }))
                        }
                        maxW="140px"
                      >
                        <NumberInputField />
                      </NumberInput>
                    </HStack>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Heading size="sm" mb={2}>Team Quality Metrics</Heading>
                <Stack spacing={3}>
                  {[
                    { key: "satisfaction", label: "Satisfaction Score (%)" },
                    { key: "serviceAccuracy", label: "Service Delivery Accuracy (%)" },
                    { key: "compliance", label: "Policy Compliance (%)" },
                    { key: "crossResponse", label: "Cross-Department Response (%)" },
                    { key: "timeToResolveHours", label: "Time-to-Resolve (hours)" },
                    { key: "trainingToB2B", label: "Training-to-B2B Conversions" },
                    { key: "renewals", label: "Renewals" },
                  ].map((row) => (
                    <HStack key={row.key}>
                      <Text flex={1}>{row.label}</Text>
                      <NumberInput
                        value={weeklyTargets.quality[row.key]}
                        min={0}
                        onChange={(val) =>
                          setWeeklyTargets((prev) => ({
                            ...prev,
                            quality: { ...prev.quality, [row.key]: Number(val) || 0 },
                          }))
                        }
                        maxW="140px"
                      >
                        <NumberInputField />
                      </NumberInput>
                    </HStack>
                  ))}
                </Stack>
              </Box>

              <HStack>
                <Button colorScheme="teal" onClick={saveWeeklyTargets} leftIcon={<CheckIcon />}>
                  Save Weekly Targets
                </Button>
                <Button variant="ghost" onClick={() => setWeeklyTargets({
                  education: {
                    userManuals: 300,
                    trainingVideos: 300,
                    faqGuides: 200,
                    telegramGuidance: 200,
                    followupReminders: 600,
                  },
                  officers: {
                    officer1: 300,
                    officer2: 300,
                    officer3: 300,
                    officer4: 300,
                    manager: 800,
                  },
                  quality: {
                    satisfaction: 90,
                    serviceAccuracy: 95,
                    compliance: 100,
                    crossResponse: 100,
                    timeToResolveHours: 24,
                    trainingToB2B: 30,
                    renewals: 20,
                  },
                })} leftIcon={<CloseIcon />}>
                  Reset to defaults
                </Button>
              </HStack>
            </Stack>
          </CardBody>
        </Card>

        <Card border="1px solid" borderColor="gray.200" rounded="2xl" boxShadow="xl" mb={6}>
          <CardHeader pb={2}>
            <Heading size="md">Assign B2B Customers</Heading>
            <Text color="gray.500" fontSize="sm">
              Select a customer service agent for each pending B2B customer.
            </Text>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Client</Th>
                    <Th>Company</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Type</Th>
                    <Th>Assign to Agent</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {pendingB2B.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={6}>
                        <Text color="gray.500">No pending B2B customers.</Text>
                      </Td>
                    </Tr>
                  ) : (
                    pendingB2B.map((cust) => (
                      <Tr key={cust._id}>
                        <Td>{cust.clientName}</Td>
                        <Td>{cust.companyName}</Td>
                        <Td>{cust.email}</Td>
                        <Td>{cust.phoneNumber}</Td>
                        <Td>
                          <Badge colorScheme={cust.type === "buyer" ? "green" : "purple"}>
                            {cust.type}
                          </Badge>
                        </Td>
                        <Td>
                          <Select
                            placeholder="Select agent"
                            size="sm"
                            value={selectedAgent[cust._id] || ""}
                            onChange={(e) =>
                              setSelectedAgent((prev) => ({ ...prev, [cust._id]: e.target.value }))
                            }
                          >
                            {csUsers.map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.username || u.email || u._id}
                              </option>
                            ))}
                          </Select>
                        </Td>
                        <Td textAlign="right">
                          <Button
                            size="sm"
                            colorScheme="teal"
                            isLoading={assigningId === cust._id}
                            onClick={() => handleAssignB2B(cust)}
                          >
                            Assign
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      </Box>
    </Layout>
  );
};

export default CustomerSettings;
