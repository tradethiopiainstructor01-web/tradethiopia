import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Spacer,
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
  useToast,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";
import Layout from './Layout';

const CustomerSettings = () => {
  const toast = useToast();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    packageNumber: "",
    services: [],
    serviceInput: "",
    price: "",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);

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
  }, [toast]);

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

  return (
    <Layout>
    <Box p={6} bg="gray.50" minH="100vh">
      <Heading size="lg" mb={4}>Customer Settings</Heading>

      <Card mb={6}>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">{editingId ? "Edit Package" : "Add Package"}</Heading>
            {loading && <Text color="gray.500" fontSize="sm">Loading...</Text>}
          </HStack>
        </CardHeader>
        <CardBody>
          <Stack spacing={4}>
            <HStack spacing={4}>
              <NumberInput value={form.packageNumber} min={1} onChange={(val) => handleChange("packageNumber", val)}>
                <NumberInputField placeholder="Package number (use numbers)" />
              </NumberInput>
              <Input
                placeholder="Service name"
                value={form.serviceInput}
                onChange={(e) => handleChange("serviceInput", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddService();
                  }
                }}
              />
              <Button colorScheme="blue" leftIcon={<AddIcon />} onClick={handleAddService}>
                Add Service
              </Button>
            </HStack>
            <HStack spacing={2} wrap="wrap">
              {(form.services || []).map((svc) => (
                <Button
                  key={svc}
                  size="xs"
                  variant="outline"
                  rightIcon={<CloseIcon boxSize={2} />}
                  onClick={() => handleRemoveService(svc)}
                >
                  {svc}
                </Button>
              ))}
            </HStack>
            <HStack spacing={4}>
              <NumberInput value={form.price} min={0} precision={2} onChange={(val) => handleChange("price", val)}>
                <NumberInputField placeholder="Price" />
              </NumberInput>
              <Input
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </HStack>
            <HStack>
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

      <Card>
        <CardHeader>
          <Heading size="md">Packages & Services</Heading>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table size="sm" variant="striped" colorScheme="gray">
              <Thead>
                <Tr>
                  <Th>Package #</Th>
                  <Th>Services</Th>
                  <Th>Price</Th>
                  <Th>Description</Th>
                  <Th textAlign="right">Actions</Th>
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
                    <Tr key={pkg._id}>
                      <Td>{pkg.packageNumber}</Td>
                      <Td>
                        <Stack spacing={1}>
                          {(pkg.services || []).map((svc, idx) => (
                            <Text key={idx} fontSize="sm">
                              • {svc}
                            </Text>
                          ))}
                        </Stack>
                      </Td>
                      <Td>${Number(pkg.price || 0).toFixed(2)}</Td>
                      <Td>{pkg.description || "-"}</Td>
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
    </Box>
    </Layout>
  );
};

export default CustomerSettings;
