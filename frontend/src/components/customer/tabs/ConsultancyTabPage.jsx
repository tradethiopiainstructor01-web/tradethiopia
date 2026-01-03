// frontend/src/components/customer/tabs/ConsultancyTabPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Select,
  Text,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
  IconButton,
  HStack,
  VStack,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, ArrowBackIcon } from '@chakra-ui/icons';
import {
  fetchConsultancies,
  createConsultancy,
  updateConsultancy,
  deleteConsultancy,
} from '../../../services/api';

const createDefaultFormData = () => ({
  companyName: '',
  contactPerson: '',
  phoneNumber: '',
  email: '',
  website: '',
  businessLocation: '',
  businessType: '',
  isOperational: true,
  employeeCount: '',
  targetMarket: '',
  challenges: '',
  packageType: '',
  goals: '',
  startDate: '',
  additionalDetails: '',
  documents: {
    businessPlan: false,
    financialStatements: false,
    companyProfile: false,
    licenses: false,
    productCatalog: false,
  },
});

const toFormDateValue = (value) =>
  value ? new Date(value).toISOString().split("T")[0] : '';

const mapRecordToFormData = (record) => {
  if (!record) return createDefaultFormData();
  const { _id, id, createdAt, updatedAt, documents, ...rest } = record;
  return {
    ...createDefaultFormData(),
    ...rest,
    employeeCount:
      record?.employeeCount !== undefined && record?.employeeCount !== null
        ? String(record.employeeCount)
        : '',
    startDate: toFormDateValue(record?.startDate),
    documents: {
      ...createDefaultFormData().documents,
      ...(documents || {}),
    },
  };
};

const ConsultancyTabPage = ({ cardBg, headerBg, borderColor }) => {
  const [consultancies, setConsultancies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedConsultancy, setSelectedConsultancy] = useState(null);
  const [error, setError] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState(createDefaultFormData());
  const toast = useToast();

  const handleDrawerClose = () => {
    setFormData(createDefaultFormData());
    setSelectedConsultancy(null);
    setError("");
    onClose();
  };

  const handleOpenForNew = () => {
    setSelectedConsultancy(null);
    setFormData(createDefaultFormData());
    onOpen();
  };

  const loadConsultancies = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await fetchConsultancies();
      setConsultancies(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Failed to load consultancies", err);
      const message = err.response?.data?.message || err.message || "Unable to load consultancies.";
      setError(message);
      setConsultancies([]);
      toast({
        title: "Unable to load consultancies",
        description: message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConsultancies();
  }, [loadConsultancies]);

  const handleEdit = (record) => {
    setSelectedConsultancy(record);
    setFormData(mapRecordToFormData(record));
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!id) return;
    setDeletingId(id);
    try {
      await deleteConsultancy(id);
      toast({
        title: "Deleted",
        description: "Consultancy record removed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await loadConsultancies();
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to delete record.";
      toast({
        title: "Failed to delete",
        description: message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (selectedConsultancy) {
        const id = selectedConsultancy._id || selectedConsultancy.id;
        await updateConsultancy(id, formData);
        toast({
          title: 'Consultancy updated',
          description: 'Changes saved successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createConsultancy(formData);
        toast({
          title: 'Success',
          description: 'Consultancy record saved successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      await loadConsultancies();
      handleDrawerClose();
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to save consultancy record.';
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="xl" fontWeight="bold">Consultancy Management</Text>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={handleOpenForNew}
        >
          Add New Consultancy
        </Button>
      </Box>

      <Box
        border="1px"
        borderColor={borderColor}
        borderRadius="md"
        overflow="hidden"
      >
        <Table variant="simple">
          <Thead bg={headerBg}>
            <Tr>
              <Th>Company Name</Th>
              <Th>Contact Person</Th>
              <Th>Phone</Th>
              <Th>Email</Th>
              <Th>Business Type</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={6}>
                  <HStack spacing={2} justify="center">
                    <Spinner size="sm" />
                    <Text fontSize="sm" color="gray.500">
                      Loading consultancies...
                    </Text>
                  </HStack>
                </Td>
              </Tr>
            ) : consultancies.length > 0 ? (
              consultancies.map((item, index) => {
                const recordId = item._id || item.id;
                const rowKey = recordId || `${item.companyName}-${index}`;
                return (
                  <Tr key={rowKey}>
                    <Td>{item.companyName}</Td>
                    <Td>{item.contactPerson}</Td>
                    <Td>{item.phoneNumber}</Td>
                    <Td>{item.email}</Td>
                    <Td>
                      <Text mb={1}>{item.businessType}</Text>
                      <Badge
                        colorScheme={item.isOperational ? "green" : "orange"}
                        variant="subtle"
                      >
                        {item.isOperational ? "Operational" : "Not operational"}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          icon={<EditIcon />}
                          size="sm"
                          colorScheme="blue"
                          aria-label="Edit consultancy"
                          onClick={() => handleEdit(item)}
                        />
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          aria-label="Delete consultancy"
                          isLoading={deletingId === recordId}
                          isDisabled={!recordId}
                          onClick={() => recordId && handleDelete(recordId)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                );
              })
            ) : (
              <Tr>
                <Td colSpan={6} textAlign="center" py={4}>
                  No consultancy records found
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
        {error && (
          <Text color="red.500" fontSize="sm" mt={2}>
            {error}
          </Text>
        )}
      </Box>

      {/* Add/Edit Consultancy Form Drawer */}
      <Drawer isOpen={isOpen} onClose={handleDrawerClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">
            <HStack>
              <IconButton
                icon={<ArrowBackIcon />}
                onClick={handleDrawerClose}
                variant="ghost"
                aria-label="Back"
                mr={2}
              />
              <Text>{selectedConsultancy ? "Edit Consultancy" : "Add New Consultancy"}</Text>
            </HStack>
          </DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} py={4}>
                <FormControl isRequired>
                  <FormLabel>Company Name</FormLabel>
                  <Input
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Owner / Contact Person</FormLabel>
                  <Input
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Enter contact person name"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Phone Number</FormLabel>
                  <Input
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Website (if any)</FormLabel>
                  <Input
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="Enter website URL"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Business Location (City, Country)</FormLabel>
                  <Input
                    name="businessLocation"
                    value={formData.businessLocation}
                    onChange={handleInputChange}
                    placeholder="Enter business location"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Type of Business</FormLabel>
                  <Select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    placeholder="Select business type"
                  >
                    <option value="agriculture">Agriculture</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="services">Services</option>
                    <option value="technology">Technology</option>
                    <option value="retail">Retail</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Is the business currently operational?</FormLabel>
                  <HStack>
                    <label>
                      <input
                        type="radio"
                        name="isOperational"
                        checked={formData.isOperational === true}
                        onChange={() => setFormData({...formData, isOperational: true})}
                      /> Yes
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="isOperational"
                        checked={formData.isOperational === false}
                        onChange={() => setFormData({...formData, isOperational: false})}
                      /> No
                    </label>
                  </HStack>
                </FormControl>

                <FormControl>
                  <FormLabel>Number of Employees</FormLabel>
                  <Input
                    name="employeeCount"
                    type="number"
                    value={formData.employeeCount}
                    onChange={handleInputChange}
                    placeholder="Enter number of employees"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Target Market / Clients</FormLabel>
                  <Textarea
                    name="targetMarket"
                    value={formData.targetMarket}
                    onChange={handleInputChange}
                    placeholder="Describe your target market or clients"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Current Challenges</FormLabel>
                  <Textarea
                    name="challenges"
                    value={formData.challenges}
                    onChange={handleInputChange}
                    placeholder="Describe the challenges you are facing"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Package of Interest</FormLabel>
                  <Select
                    name="packageType"
                    value={formData.packageType}
                    onChange={handleInputChange}
                    placeholder="Select a package"
                  >
                    <option value="businessIdea">Business Idea Development</option>
                    <option value="hourlyConsultation">Hourly Consultation</option>
                    <option value="smeSetup">SME Business Setup</option>
                    <option value="investmentReady">Investment-Ready Project</option>
                    <option value="fullProject">Full Project Execution</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Goals for This Engagement</FormLabel>
                  <Textarea
                    name="goals"
                    value={formData.goals}
                    onChange={handleInputChange}
                    placeholder="Briefly describe your goals"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Preferred Start Date</FormLabel>
                  <Input
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Additional Notes</FormLabel>
                  <Textarea
                    name="additionalDetails"
                    value={formData.additionalDetails}
                    onChange={handleInputChange}
                    placeholder="Any additional information or requirements"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Documents Available</FormLabel>
                  <VStack align="start" spacing={2}>
                    <label>
                      <input
                        type="checkbox"
                        name="businessPlan"
                        checked={formData.documents.businessPlan}
                        onChange={handleInputChange}
                      /> Business Plan
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="financialStatements"
                        checked={formData.documents.financialStatements}
                        onChange={handleInputChange}
                      /> Financial Statements
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="companyProfile"
                        checked={formData.documents.companyProfile}
                        onChange={handleInputChange}
                      /> Company Profile
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="licenses"
                        checked={formData.documents.licenses}
                        onChange={handleInputChange}
                      /> Licenses or Permits
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="productCatalog"
                        checked={formData.documents.productCatalog}
                        onChange={handleInputChange}
                      /> Product/Service Catalog
                    </label>
                  </VStack>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="100%"
                  mt={4}
                  isLoading={isSaving}
                >
                  {selectedConsultancy ? "Update Consultancy" : "Save Consultancy"}
                </Button>
              </VStack>
            </form>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default ConsultancyTabPage;
