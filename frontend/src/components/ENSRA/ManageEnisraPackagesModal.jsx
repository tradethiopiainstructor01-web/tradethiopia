import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
  Flex,
  Box,
  Divider,
  Icon,
  Tag
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { FiPackage, FiPlus, FiCheck } from 'react-icons/fi';
import {
  fetchPackages,
  createPackage,
  updatePackage,
  deletePackage
} from '../../services/packageService';
import { DEFAULT_ENISRA_PACKAGES } from '../../constants/enisraPackages';

const formatCurrency = (val) =>
  `ETB ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const ManageEnisraPackagesModal = ({ isOpen, onClose, onPackagesUpdated }) => {
  const [packages, setPackages] = useState(DEFAULT_ENISRA_PACKAGES);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const toast = useToast();

  // New package form state
  const [newPkg, setNewPkg] = useState({
    packageNumber: '',
    price: '',
    description: '',
    servicesText: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Editing package state
  const [editingPkg, setEditingPkg] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await fetchPackages('Enisra');
      if (Array.isArray(data) && data.length > 0) {
        setPackages(data);
      } else {
        setPackages(DEFAULT_ENISRA_PACKAGES);
      }
    } catch (err) {
      console.warn('Fallback to default Enisra packages:', err.message);
      setPackages(DEFAULT_ENISRA_PACKAGES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPackages();
      setEditingPkg(null);
      setTabIndex(0);
    }
  }, [isOpen]);

  const handleAddPackage = async (e) => {
    e?.preventDefault();
    if (!newPkg.price || Number(newPkg.price) <= 0) {
      toast({
        title: 'Price required',
        description: 'Please specify a valid price in ETB.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    const services = (newPkg.servicesText || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const nextNumber = newPkg.packageNumber
      ? Number(newPkg.packageNumber)
      : (packages.length > 0 ? Math.max(...packages.map(p => Number(p.packageNumber) || 0)) + 1 : 1);

    const payload = {
      packageNumber: nextNumber,
      name: `Enisra Package ${nextNumber}`,
      price: Number(newPkg.price),
      description: newPkg.description || (services.length > 0 ? services[0] : `Enisra Package ${nextNumber}`),
      services: services.length > 0 ? services : [`Enisra Package ${nextNumber} Inclusions`],
      market: 'Enisra'
    };

    setIsSaving(true);
    try {
      await createPackage(payload);
      toast({
        title: 'Package Added',
        description: `Enisra Package #${nextNumber} created successfully and added to dropdown.`,
        status: 'success',
        duration: 4000,
        isClosable: true
      });
      setNewPkg({ packageNumber: '', price: '', description: '', servicesText: '' });
      await loadPackages();
      setTabIndex(0);
      if (onPackagesUpdated) onPackagesUpdated();
    } catch (err) {
      toast({
        title: 'Failed to create package',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (pkg) => {
    setEditingPkg({
      ...pkg,
      servicesText: Array.isArray(pkg.services) ? pkg.services.join('\n') : (pkg.services || '')
    });
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editingPkg) return;

    if (!editingPkg._id) {
      toast({
        title: 'Default Package',
        description: 'You can create a new customized package in the "+ Add New Package" tab.',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
      setEditingPkg(null);
      return;
    }

    const services = (editingPkg.servicesText || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      packageNumber: Number(editingPkg.packageNumber),
      price: Number(editingPkg.price),
      description: editingPkg.description,
      services,
      market: 'Enisra'
    };

    setIsUpdating(true);
    try {
      await updatePackage(editingPkg._id, payload);
      toast({
        title: 'Package Updated',
        description: `Enisra Package #${editingPkg.packageNumber} updated.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      setEditingPkg(null);
      await loadPackages();
      if (onPackagesUpdated) onPackagesUpdated();
    } catch (err) {
      toast({
        title: 'Failed to update package',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (pkg) => {
    if (!pkg._id) {
      toast({
        title: 'Default Catalog Item',
        description: 'System catalog packages cannot be removed.',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (!window.confirm(`Delete Enisra Package #${pkg.packageNumber}?`)) return;

    try {
      await deletePackage(pkg._id);
      toast({
        title: 'Package removed',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
      await loadPackages();
      if (onPackagesUpdated) onPackagesUpdated();
    } catch (err) {
      toast({
        title: 'Error deleting package',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="teal.600" pb={2}>
          <HStack spacing={2}>
            <Icon as={FiPackage} />
            <Text>Enisra Packages (Dropdown Catalog)</Text>
          </HStack>
          <Text fontSize="xs" color="gray.500" fontWeight="normal" mt={1}>
            These packages are exclusive to Enisra and appear in the Follow-up Course/Package dropdown.
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p={4}>
          <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="teal" variant="enclosed">
            <TabList mb={3}>
              <Tab fontWeight="bold">Current Packages ({packages.length})</Tab>
              <Tab fontWeight="bold">+ Add New Package</Tab>
            </TabList>

            <TabPanels>
              {/* TAB 1: Existing Packages list / edit */}
              <TabPanel p={0}>
                {loading ? (
                  <Flex justify="center" py={8}>
                    <Spinner color="teal.500" />
                  </Flex>
                ) : editingPkg ? (
                  /* Inline Edit Form */
                  <Box as="form" onSubmit={handleSaveEdit} p={3} borderWidth="1px" borderRadius="md" bg="gray.50" _dark={{ bg: 'gray.800' }}>
                    <Flex justify="space-between" align="center" mb={3}>
                      <Text fontWeight="bold" color="teal.600">
                        Edit Enisra Package #{editingPkg.packageNumber}
                      </Text>
                      <Button size="xs" variant="ghost" onClick={() => setEditingPkg(null)}>Cancel</Button>
                    </Flex>
                    <VStack spacing={3}>
                      <FormControl isRequired>
                        <FormLabel fontSize="xs">Price (ETB)</FormLabel>
                        <Input
                          size="sm"
                          type="number"
                          value={editingPkg.price}
                          onChange={(e) => setEditingPkg({ ...editingPkg, price: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs">Description</FormLabel>
                        <Input
                          size="sm"
                          value={editingPkg.description}
                          onChange={(e) => setEditingPkg({ ...editingPkg, description: e.target.value })}
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel fontSize="xs">Services (1 per line)</FormLabel>
                        <Textarea
                          size="sm"
                          rows={4}
                          value={editingPkg.servicesText}
                          onChange={(e) => setEditingPkg({ ...editingPkg, servicesText: e.target.value })}
                        />
                      </FormControl>
                      <HStack w="full" justify="flex-end" pt={2}>
                        <Button size="sm" variant="ghost" onClick={() => setEditingPkg(null)}>Cancel</Button>
                        <Button size="sm" colorScheme="teal" type="submit" isLoading={isUpdating}>
                          Save Changes
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                ) : (
                  <Box overflowX="auto">
                    <Table size="sm" variant="simple">
                      <Thead bg="gray.50" _dark={{ bg: 'gray.700' }}>
                        <Tr>
                          <Th>#</Th>
                          <Th>Title in Dropdown</Th>
                          <Th>Price</Th>
                          <Th textAlign="right">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {packages.map((pkg) => (
                          <Tr key={pkg._id || `enisra-pkg-${pkg.packageNumber}`}>
                            <Td fontWeight="bold">
                              <Tag size="sm" colorScheme="teal">#{pkg.packageNumber}</Tag>
                            </Td>
                            <Td>
                              <Text fontSize="xs" fontWeight="bold">Package {pkg.packageNumber}</Text>
                              <Text fontSize="10px" color="gray.500" noOfLines={1}>
                                {pkg.description || (Array.isArray(pkg.services) ? pkg.services[0] : '')}
                              </Text>
                            </Td>
                            <Td fontWeight="bold" color="teal.600">
                              {formatCurrency(pkg.price)}
                            </Td>
                            <Td textAlign="right">
                              <HStack spacing={1} justify="flex-end">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  colorScheme="blue"
                                  onClick={() => startEdit(pkg)}
                                >
                                  Edit
                                </Button>
                                {pkg._id && (
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => handleDelete(pkg)}
                                  >
                                    <DeleteIcon />
                                  </Button>
                                )}
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </TabPanel>

              {/* TAB 2: Add New Package */}
              <TabPanel p={0}>
                <Box as="form" onSubmit={handleAddPackage} pt={2}>
                  <VStack spacing={3}>
                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold">Package Number</FormLabel>
                      <Input
                        size="sm"
                        type="number"
                        placeholder={`Next available (${packages.length + 1})`}
                        value={newPkg.packageNumber}
                        onChange={(e) => setNewPkg({ ...newPkg, packageNumber: e.target.value })}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold">Price (ETB)</FormLabel>
                      <Input
                        size="sm"
                        type="number"
                        placeholder="e.g. 35000"
                        value={newPkg.price}
                        onChange={(e) => setNewPkg({ ...newPkg, price: e.target.value })}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="xs" fontWeight="bold">Short Description</FormLabel>
                      <Input
                        size="sm"
                        placeholder="e.g. 10 matchmaking + front-page listing"
                        value={newPkg.description}
                        onChange={(e) => setNewPkg({ ...newPkg, description: e.target.value })}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold">Included Services (1 per line)</FormLabel>
                      <Textarea
                        size="sm"
                        rows={4}
                        placeholder={`10 jobs matchmaking per year\n3 months front page listing\nCandidate shortlisting`}
                        value={newPkg.servicesText}
                        onChange={(e) => setNewPkg({ ...newPkg, servicesText: e.target.value })}
                      />
                    </FormControl>

                    <Button
                      w="full"
                      size="sm"
                      colorScheme="teal"
                      type="submit"
                      isLoading={isSaving}
                      leftIcon={<AddIcon />}
                      mt={2}
                    >
                      Save Package to Enisra Dropdown
                    </Button>
                  </VStack>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter pt={2}>
          <Button size="sm" onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ManageEnisraPackagesModal;

