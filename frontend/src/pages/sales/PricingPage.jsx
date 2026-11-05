import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  useColorModeValue,
  Button,
  VStack,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Textarea,
  Switch,
  FormControl,
  FormLabel,
  IconButton,
  Spinner,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Tag,
  Divider,
} from "@chakra-ui/react";
import { AddIcon, EditIcon, DeleteIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { FiBookOpen, FiPackage } from "react-icons/fi";
import {
  fetchExternalCourses,
  createExternalCourse,
  updateExternalCourse,
  deleteExternalCourse
} from "../../services/api";
import {
  fetchPackages,
  createPackage,
  updatePackage,
  deletePackage
} from "../../services/packageService";
import { DEFAULT_ENISRA_PACKAGES } from "../../constants/enisraPackages";

const emptyCourse = {
  name: "",
  description: "",
  price: "",
  isActive: true
};

const emptyPackage = {
  packageNumber: "",
  name: "",
  price: "",
  description: "",
  servicesText: ""
};

const PricingPage = () => {
  const toast = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const cardBg = useColorModeValue("white", "gray.800");
  const headerColor = useColorModeValue("teal.600", "teal.200");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Determine initial tab from query param or path
  const initialTab = useMemo(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "enisra" || tabParam === "packages" || tabParam === "1") return 1;
    if (location.pathname.includes("enisra")) return 1;
    return 0;
  }, [searchParams, location.pathname]);

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // ----------------------------------------------------
  // 1. External Courses State
  // ----------------------------------------------------
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseSaving, setCourseSaving] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseFormData, setCourseFormData] = useState(emptyCourse);

  const loadCourses = async () => {
    setCoursesLoading(true);
    try {
      const data = await fetchExternalCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({
        title: "Unable to load courses",
        description: err?.response?.data?.message || err.message || "",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setCoursesLoading(false);
    }
  };

  // ----------------------------------------------------
  // 2. Enisra Packages State
  // ----------------------------------------------------
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packageSaving, setPackageSaving] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState(null);
  const [pkgFormData, setPkgFormData] = useState(emptyPackage);

  const loadPackages = async () => {
    setPackagesLoading(true);
    try {
      const data = await fetchPackages("Enisra");
      if (Array.isArray(data) && data.length > 0) {
        setPackages(data.sort((a, b) => Number(a.packageNumber || 0) - Number(b.packageNumber || 0)));
      } else {
        setPackages(DEFAULT_ENISRA_PACKAGES);
      }
    } catch (err) {
      console.warn("Using default Enisra packages fallback:", err.message);
      setPackages(DEFAULT_ENISRA_PACKAGES);
    } finally {
      setPackagesLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    loadPackages();
  }, []);

  // ----------------------------------------------------
  // Course Calculations & Handlers
  // ----------------------------------------------------
  const courseSummary = useMemo(() => {
    const active = courses.filter(c => c.isActive !== false);
    const totalPrice = active.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
    const avgPrice = active.length ? totalPrice / active.length : 0;
    return {
      total: courses.length,
      active: active.length,
      avgPrice
    };
  }, [courses]);

  const packageSummary = useMemo(() => {
    const totalPrice = packages.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const avgPrice = packages.length ? totalPrice / packages.length : 0;
    return {
      total: packages.length,
      avgPrice
    };
  }, [packages]);

  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return `ETB ${num.toLocaleString()}`;
  };

  const handleCourseSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setCourseSaving(true);
    try {
      const payload = {
        name: courseFormData.name,
        description: courseFormData.description,
        price: Number(courseFormData.price) || 0,
        isActive: courseFormData.isActive
      };
      const isSeed = editingCourseId && typeof editingCourseId === "string" && editingCourseId.startsWith("seed-");
      if (editingCourseId && !isSeed) {
        await updateExternalCourse(editingCourseId, payload);
        toast({ title: "Course updated", status: "success", duration: 2500, isClosable: true });
      } else {
        await createExternalCourse(payload);
        toast({ title: "Course added", status: "success", duration: 2500, isClosable: true });
      }
      setCourseFormData(emptyCourse);
      setEditingCourseId(null);
      loadCourses();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || err.message || "",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setCourseSaving(false);
    }
  };

  const startEditCourse = (course) => {
    setEditingCourseId(course._id || null);
    setCourseFormData({
      name: course.name || "",
      description: course.description || "",
      price: course.price ?? "",
      isActive: course.isActive !== false
    });
  };

  const handleDeleteCourse = async (id) => {
    if (!id) {
      toast({
        title: "Cannot delete seeded course",
        description: "Add a course first, then delete real entries.",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    try {
      await deleteExternalCourse(id);
      toast({ title: "Course removed", status: "info", duration: 2500, isClosable: true });
      loadCourses();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || err.message || "",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    }
  };

  const cancelEditCourse = () => {
    setEditingCourseId(null);
    setCourseFormData(emptyCourse);
  };

  // ----------------------------------------------------
  // Enisra Package Handlers
  // ----------------------------------------------------
  const handlePackageSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (!pkgFormData.name && !pkgFormData.packageNumber) {
      toast({
        title: "Missing info",
        description: "Please provide a package name or number.",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    setPackageSaving(true);
    try {
      const servicesList = (pkgFormData.servicesText || "")
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        packageNumber: Number(pkgFormData.packageNumber) || undefined,
        name: pkgFormData.name.trim(),
        price: Number(pkgFormData.price) || 0,
        description: pkgFormData.description.trim(),
        services: servicesList.length > 0 ? servicesList : ["Standard Enisra Service"],
        market: "Enisra"
      };

      const isSeedId = editingPkgId && typeof editingPkgId === "string" && editingPkgId.startsWith("enisra-pkg-");

      if (editingPkgId && !isSeedId) {
        await updatePackage(editingPkgId, payload);
        toast({ title: "Enisra package updated", status: "success", duration: 2500, isClosable: true });
      } else {
        await createPackage(payload);
        toast({ title: "Enisra package saved", status: "success", duration: 2500, isClosable: true });
      }

      setPkgFormData(emptyPackage);
      setEditingPkgId(null);
      loadPackages();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || err.message || "",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    } finally {
      setPackageSaving(false);
    }
  };

  const startEditPackage = (pkg) => {
    setEditingPkgId(pkg._id || `enisra-pkg-${pkg.packageNumber}`);
    setPkgFormData({
      packageNumber: pkg.packageNumber ?? "",
      name: pkg.name || `Enisra Package ${pkg.packageNumber || ""}`,
      price: pkg.price ?? "",
      description: pkg.description || "",
      servicesText: Array.isArray(pkg.services) ? pkg.services.join("\n") : (pkg.services || "")
    });
  };

  const handleDeletePackage = async (pkg) => {
    const id = pkg._id;
    if (!id || (typeof id === "string" && id.startsWith("enisra-pkg-"))) {
      setPackages(prev => prev.filter(p => (p._id || p.packageNumber) !== (pkg._id || pkg.packageNumber)));
      toast({ title: "Package removed", status: "info", duration: 2500, isClosable: true });
      return;
    }
    try {
      await deletePackage(id);
      toast({ title: "Package deleted", status: "info", duration: 2500, isClosable: true });
      loadPackages();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || err.message || "",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    }
  };

  return (
    <Box>
      {/* Top Header */}
      <HStack justify="space-between" mb={5} align={{ base: "flex-start", md: "center" }} flexDir={{ base: "column", md: "row" }} spacing={4}>
        <Box>
          <Heading as="h1" size="xl" color={headerColor} mb={1}>
            Courses & Packages Management
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Finance creates and manages priced external training courses and Enisra packages here. All entries sync directly to sales and Enisra follow-up dropdowns.
          </Text>
        </Box>
      </HStack>

      {/* Tabs */}
      <Tabs
        index={activeTab}
        onChange={(index) => setActiveTab(index)}
        variant="enclosed"
        colorScheme="teal"
      >
        <TabList mb={6}>
          <Tab fontWeight="semibold" fontSize="md">
            <HStack spacing={2}>
              <Icon as={FiBookOpen} />
              <Text>External Training Courses</Text>
              <Badge colorScheme="teal" borderRadius="full" px={2}>
                {courses.length}
              </Badge>
            </HStack>
          </Tab>
          <Tab fontWeight="semibold" fontSize="md">
            <HStack spacing={2}>
              <Icon as={FiPackage} />
              <Text>Enisra Packages</Text>
              <Badge colorScheme="green" borderRadius="full" px={2}>
                {packages.length}
              </Badge>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* ============================================================ */}
          {/* PANEL 1: EXTERNAL TRAINING COURSES                           */}
          {/* ============================================================ */}
          <TabPanel p={0}>
            {/* Summary Cards */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Active External Courses</Text>
                  <Heading size="lg" color="teal.600">{courseSummary.active}</Heading>
                  <Text color="gray.400" fontSize="xs">of {courseSummary.total} total courses</Text>
                </CardBody>
              </Card>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Average Course Price</Text>
                  <Heading size="lg" color="teal.600">{formatCurrency(courseSummary.avgPrice)}</Heading>
                  <Text color="gray.400" fontSize="xs">Across active external courses</Text>
                </CardBody>
              </Card>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Sync Status</Text>
                  <Badge colorScheme="teal" mt={1} px={2} py={0.5} borderRadius="md">
                    Live for Sales Follow-up
                  </Badge>
                  <Text color="gray.500" fontSize="xs" mt={1}>
                    Sales reads training titles and prices from this external database.
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Course Form */}
            <Box
              as="form"
              onSubmit={handleCourseSubmit}
              bg={cardBg}
              p={5}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              mb={6}
              boxShadow="sm"
            >
              <HStack justify="space-between" mb={4}>
                <Heading size="md">{editingCourseId ? "Edit External Course" : "Add External Course"}</Heading>
                {editingCourseId && (
                  <Button size="xs" variant="ghost" onClick={cancelEditCourse}>
                    Reset Form
                  </Button>
                )}
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Course Title / Name</FormLabel>
                  <Input
                    value={courseFormData.name}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Basic Digital Marketing"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Price (ETB)</FormLabel>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={courseFormData.price}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. 5000"
                  />
                </FormControl>
                <FormControl gridColumn={{ md: "1 / span 2" }}>
                  <FormLabel fontSize="sm" fontWeight="semibold">Description</FormLabel>
                  <Input
                    value={courseFormData.description}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Short summary or module overview"
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0" fontSize="sm" fontWeight="semibold">Active Status</FormLabel>
                  <Switch
                    isChecked={courseFormData.isActive}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    colorScheme="teal"
                  />
                </FormControl>
              </SimpleGrid>
              <HStack mt={5} spacing={3}>
                <Button
                  type="submit"
                  colorScheme="teal"
                  leftIcon={editingCourseId ? <CheckIcon /> : <AddIcon />}
                  isLoading={courseSaving}
                >
                  {editingCourseId ? "Update External Course" : "Save External Course"}
                </Button>
                {editingCourseId && (
                  <Button variant="ghost" onClick={cancelEditCourse}>
                    Cancel
                  </Button>
                )}
              </HStack>
            </Box>

            {/* Courses Table */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" boxShadow="sm">
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Box>
                    <Heading size="md">External Courses Database</Heading>
                    <Text fontSize="xs" color="gray.500">
                      Priced courses available for assignment and conversion in follow-ups.
                    </Text>
                  </Box>
                  {coursesLoading && <Spinner size="sm" color="teal.500" />}
                </HStack>
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead bg="gray.50" _dark={{ bg: "gray.700" }}>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Description</Th>
                        <Th isNumeric>Price (ETB)</Th>
                        <Th>Status</Th>
                        <Th>Updated</Th>
                        <Th textAlign="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {courses.map(course => (
                        <Tr key={course._id || course.name}>
                          <Td fontWeight="semibold">
                            {course.name}
                          </Td>
                          <Td maxW="280px" fontSize="xs" color="gray.600" _dark={{ color: "gray.300" }} noOfLines={2}>
                            {course.description || "—"}
                          </Td>
                          <Td isNumeric fontWeight="bold" color="teal.600">
                            {formatCurrency(course.price)}
                          </Td>
                          <Td>
                            <Badge colorScheme={course.isActive === false ? "red" : "green"}>
                              {course.isActive === false ? "Inactive" : "Active"}
                            </Badge>
                          </Td>
                          <Td fontSize="xs" color="gray.500">
                            {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : "—"}
                          </Td>
                          <Td textAlign="right">
                            <HStack justify="flex-end" spacing={1}>
                              <IconButton
                                size="sm"
                                aria-label="Edit"
                                icon={<EditIcon />}
                                onClick={() => startEditCourse(course)}
                              />
                              <IconButton
                                size="sm"
                                aria-label="Delete"
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleDeleteCourse(course._id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                      {!coursesLoading && courses.length === 0 && (
                        <Tr>
                          <Td colSpan={6} textAlign="center" py={6} color="gray.500">
                            No external courses found. Add one above.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          </TabPanel>

          {/* ============================================================ */}
          {/* PANEL 2: ENISRA PACKAGES                                     */}
          {/* ============================================================ */}
          <TabPanel p={0}>
            {/* Summary Cards */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Total Enisra Packages</Text>
                  <Heading size="lg" color="teal.600">{packageSummary.total}</Heading>
                  <Text fontSize="xs" color="gray.400">Available in follow-up dropdowns</Text>
                </CardBody>
              </Card>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Average Package Price</Text>
                  <Heading size="lg" color="teal.600">{formatCurrency(packageSummary.avgPrice)}</Heading>
                  <Text fontSize="xs" color="gray.400">Standardized ETB pricing</Text>
                </CardBody>
              </Card>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                <CardBody>
                  <Text fontSize="sm" color="gray.500">Sync Status</Text>
                  <Badge colorScheme="green" mt={1} px={2} py={0.5} borderRadius="md">
                    Live in Enisra Follow-up
                  </Badge>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Changes here instantly update Enisra Follow-up dropdowns and sales records.
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Enisra Package Form */}
            <Box
              as="form"
              onSubmit={handlePackageSubmit}
              bg={cardBg}
              p={5}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              mb={6}
              boxShadow="sm"
            >
              <HStack justify="space-between" mb={4}>
                <Heading size="md">
                  {editingPkgId ? "Edit Enisra Package" : "Add New Enisra Package"}
                </Heading>
                {editingPkgId && (
                  <Button size="xs" variant="ghost" onClick={() => { setEditingPkgId(null); setPkgFormData(emptyPackage); }}>
                    Reset Form
                  </Button>
                )}
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Package Number (#)</FormLabel>
                  <Input
                    type="number"
                    min="1"
                    value={pkgFormData.packageNumber}
                    onChange={(e) => setPkgFormData(prev => ({ ...prev, packageNumber: e.target.value }))}
                    placeholder="e.g. 1, 2, 9"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Package Name</FormLabel>
                  <Input
                    value={pkgFormData.name}
                    onChange={(e) => setPkgFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Enisra Package 9"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Price (ETB)</FormLabel>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pkgFormData.price}
                    onChange={(e) => setPkgFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. 25000"
                  />
                </FormControl>
                <FormControl gridColumn={{ md: "1 / span 3" }}>
                  <FormLabel fontSize="sm" fontWeight="semibold">Description</FormLabel>
                  <Input
                    value={pkgFormData.description}
                    onChange={(e) => setPkgFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Short summary of this package"
                  />
                </FormControl>
                <FormControl gridColumn={{ md: "1 / span 3" }}>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Services & Inclusions <Text as="span" fontSize="xs" fontWeight="normal" color="gray.500">(one item per line)</Text>
                  </FormLabel>
                  <Textarea
                    rows={3}
                    value={pkgFormData.servicesText}
                    onChange={(e) => setPkgFormData(prev => ({ ...prev, servicesText: e.target.value }))}
                    placeholder={`1 job match-making per year\n3 months product/service listing on enisra's front page\n1-year advertisement on enisra's all social media`}
                  />
                </FormControl>
              </SimpleGrid>
              <HStack mt={5} spacing={3}>
                <Button
                  type="submit"
                  colorScheme="teal"
                  leftIcon={editingPkgId ? <CheckIcon /> : <AddIcon />}
                  isLoading={packageSaving}
                >
                  {editingPkgId ? "Update Enisra Package" : "Save Enisra Package"}
                </Button>
                {editingPkgId && (
                  <Button
                    variant="ghost"
                    onClick={() => { setEditingPkgId(null); setPkgFormData(emptyPackage); }}
                  >
                    Cancel
                  </Button>
                )}
              </HStack>
            </Box>

            {/* Enisra Packages Table */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" boxShadow="sm">
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Box>
                    <Heading size="md">Enisra Packages Database</Heading>
                    <Text fontSize="xs" color="gray.500">
                      Packages defined here automatically appear with their price in Enisra Follow-up.
                    </Text>
                  </Box>
                  {packagesLoading && <Spinner size="sm" color="teal.500" />}
                </HStack>
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead bg="gray.50" _dark={{ bg: "gray.700" }}>
                      <Tr>
                        <Th>#</Th>
                        <Th>Package Name</Th>
                        <Th isNumeric>Price (ETB)</Th>
                        <Th>Services & Inclusions</Th>
                        <Th>Description</Th>
                        <Th textAlign="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {packages.map(pkg => (
                        <Tr key={pkg._id || `pkg-${pkg.packageNumber}`}>
                          <Td>
                            <Badge colorScheme="teal" borderRadius="full" px={2}>
                              #{pkg.packageNumber}
                            </Badge>
                          </Td>
                          <Td fontWeight="bold" whiteSpace="nowrap">
                            {pkg.name || `Enisra Package ${pkg.packageNumber}`}
                          </Td>
                          <Td isNumeric fontWeight="bold" color="teal.600" fontSize="sm">
                            {formatCurrency(pkg.price)}
                          </Td>
                          <Td maxW="320px">
                            <VStack align="start" spacing={1} py={1}>
                              {(Array.isArray(pkg.services) ? pkg.services : [pkg.services || ""]).slice(0, 3).map((s, idx) => (
                                <Text key={idx} fontSize="2xs" color="gray.600" _dark={{ color: "gray.300" }} noOfLines={1}>
                                  • {s}
                                </Text>
                              ))}
                              {Array.isArray(pkg.services) && pkg.services.length > 3 && (
                                <Tag size="xs" colorScheme="gray">+{pkg.services.length - 3} more</Tag>
                              )}
                            </VStack>
                          </Td>
                          <Td maxW="220px">
                            <Text fontSize="xs" color="gray.500" noOfLines={2}>
                              {pkg.description || "—"}
                            </Text>
                          </Td>
                          <Td textAlign="right">
                            <HStack justify="flex-end" spacing={1}>
                              <IconButton
                                size="sm"
                                aria-label="Edit"
                                icon={<EditIcon />}
                                onClick={() => startEditPackage(pkg)}
                              />
                              <IconButton
                                size="sm"
                                aria-label="Delete"
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleDeletePackage(pkg)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                      {!packagesLoading && packages.length === 0 && (
                        <Tr>
                          <Td colSpan={6} textAlign="center" py={6} color="gray.500">
                            No Enisra packages found. Add one above.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default PricingPage;
