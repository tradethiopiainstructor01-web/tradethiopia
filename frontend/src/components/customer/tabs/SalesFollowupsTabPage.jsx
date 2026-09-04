import React, { useEffect, useRef, useState, memo } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Select,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Tooltip,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  SimpleGrid,
  VStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { RepeatIcon, SearchIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { updateCustomer, deleteCustomer } from "../../../services/customerService";

const statusColor = (status = "") => {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "completed":
      return "green";
    case "cancelled":
      return "red";
    case "scheduled":
      return "purple";
    case "prospect":
      return "blue";
    case "imported":
      return "cyan";
    default:
      return "yellow";
  }
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

const valueOrDash = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim()) || "—";

const SalesFollowupsTabPage = ({
  salesCustomers = [],
  pagination = {},
  loading,
  error,
  onRefresh,
  cardBg,
  borderColor,
}) => {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const onRefreshRef = useRef(onRefresh);
  const toast = useToast();

  const [editCustomer, setEditCustomer] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteCancelRef = useRef(null);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onRefreshRef.current?.({
        page,
        limit: 15,
        search,
        followupStatus: "Completed",
        packageScope: scope === "all" ? "" : scope,
        dateFrom,
        dateTo,
      });
    }, search ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [page, search, scope, dateFrom, dateTo]);

  const total = Number(pagination.total) || 0;
  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);
  const currentPage = Math.min(Math.max(1, Number(pagination.page) || page), totalPages);
  const firstRecord = total ? (currentPage - 1) * 15 + 1 : 0;
  const lastRecord = total ? Math.min(firstRecord + salesCustomers.length - 1, total) : 0;

  const refreshCurrentPage = () => onRefreshRef.current?.({
    page,
    limit: 15,
    search,
    followupStatus: "Completed",
    packageScope: scope === "all" ? "" : scope,
    dateFrom,
    dateTo,
  });

  const handleOpenEdit = (customer) => {
    setEditCustomer({
      ...customer,
      customerName: customer.customerName || '',
      contactTitle: customer.contactTitle || customer.courseName || customer.trainingType || '',
      phone: customer.phone || customer.phoneNumber || '',
      email: customer.email || '',
      callStatus: customer.callStatus || 'Called',
      followupStatus: customer.followupStatus || 'Completed',
      schedulePreference: customer.schedulePreference || customer.scheduleShift || 'Regular',
      packageScope: customer.packageScope || 'Local',
      note: customer.note || '',
      assignedInstructor: customer.assignedInstructor || customer.instructorName || '',
      batch: customer.batch || customer.group || customer.batchGroup || '',
      idInfo: customer.idInfo || customer.studentId || '',
      startDate: customer.startDate || customer.trainingStartDate ? new Date(customer.startDate || customer.trainingStartDate).toISOString().slice(0, 10) : '',
      endDate: customer.endDate || customer.trainingEndDate ? new Date(customer.endDate || customer.trainingEndDate).toISOString().slice(0, 10) : '',
    });
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditCustomer(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editCustomer) return;
    const targetId = editCustomer._id || editCustomer.id;
    if (!targetId) return;

    setIsSavingEdit(true);
    try {
      await updateCustomer(targetId, editCustomer);
      toast({
        title: "Follow-up updated",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      handleCloseEdit();
      refreshCurrentPage();
    } catch (err) {
      toast({
        title: "Failed to update",
        description: err.message || "An error occurred while updating.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteClick = (customer) => {
    setDeleteCustomerTarget(customer);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteCustomerTarget) return;
    const targetId = deleteCustomerTarget._id || deleteCustomerTarget.id;
    if (!targetId) return;

    setIsDeleting(true);
    try {
      await deleteCustomer(targetId);
      toast({
        title: "Follow-up deleted",
        status: "info",
        duration: 2500,
        isClosable: true,
      });
      setIsDeleteOpen(false);
      setDeleteCustomerTarget(null);
      refreshCurrentPage();
    } catch (err) {
      toast({
        title: "Failed to delete",
        description: err.message || "An error occurred while deleting.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={4}>
      <Flex gap={3} direction={{ base: "column", lg: "row" }} justify="space-between" mb={4}>
        <Box>
          <Text fontSize="lg" fontWeight="700">Sales Customer Follow-ups</Text>
          <Text fontSize="sm" color="gray.500">
            Completed sales customers and their latest follow-up details.
          </Text>
        </Box>
        <Button
          leftIcon={<RepeatIcon />}
          size="sm"
          variant="outline"
          onClick={refreshCurrentPage}
          isLoading={loading}
        >
          Refresh
        </Button>
      </Flex>

      <Flex gap={2} direction={{ base: "column", md: "row" }} mb={4}>
        <Box position="relative" flex="1">
          <SearchIcon position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search customer, phone, email, agent or product"
            size="sm"
            pl={9}
            borderRadius="lg"
          />
        </Box>
        <Select value={scope} onChange={(event) => {
          setScope(event.target.value);
          setPage(1);
        }} size="sm" maxW={{ md: "170px" }}>
          <option value="all">All package scopes</option>
          <option value="Local">Local</option>
          <option value="International">International</option>
        </Select>
        <Input
          type="date"
          aria-label="From date"
          title="From date"
          value={dateFrom}
          onChange={(event) => {
            setDateFrom(event.target.value);
            setPage(1);
          }}
          size="sm"
          maxW={{ md: "165px" }}
        />
        <Input
          type="date"
          aria-label="To date"
          title="To date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(event) => {
            setDateTo(event.target.value);
            setPage(1);
          }}
          size="sm"
          maxW={{ md: "165px" }}
        />
        {(dateFrom || dateTo) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
          >
            Clear dates
          </Button>
        )}
      </Flex>

      {loading ? (
        <Flex justify="center" py={12}><Spinner color="teal.500" /></Flex>
      ) : error ? (
        <Box py={8} textAlign="center">
          <Text color="red.500" mb={3}>{error}</Text>
          <Button size="sm" onClick={refreshCurrentPage}>Try again</Button>
        </Box>
      ) : (
        <>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.500">
              Showing {firstRecord}-{lastRecord} of {total} sales follow-ups
            </Text>
          </HStack>
          <TableContainer border="1px solid" borderColor={borderColor} borderRadius="lg">
            <Table size="sm" minW="2400px" variant="striped" colorScheme="gray">
              <Thead bg="teal.600">
                <Tr>
                  {[
                    "Training Start Date",
                    "Training End Date",
                    "Customer Services",
                    "Assigned Instructor",
                    "Customer Name",
                    "Email",
                    "Phone Number",
                    "Field of Work",
                    "Course",
                    "Batch/Group",
                    "Schedule & Shift",
                    "Material Delivery Status",
                    "Progress",
                    "ID Info",
                    "Actions",
                  ].map((heading) => (
                    <Th key={heading} color="white" whiteSpace="nowrap">{heading}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {salesCustomers.map((customer) => (
                  <Tr key={customer._id} _hover={{ bg: "gray.50" }}>
                    <Td whiteSpace="nowrap">{formatDate(customer.startDate || customer.trainingStartDate)}</Td>
                    <Td whiteSpace="nowrap">{formatDate(customer.endDate || customer.trainingEndDate)}</Td>
                    <Td>{valueOrDash(customer.agentName, customer.registeredBy, customer.csMember)}</Td>
                    <Td>{valueOrDash(customer.assignedInstructor, customer.instructorName)}</Td>
                    <Td fontWeight="600">{valueOrDash(customer.customerName)}</Td>
                    <Td>{valueOrDash(customer.email)}</Td>
                    <Td>{valueOrDash(customer.phone, customer.phoneNumber)}</Td>
                    <Td>{valueOrDash(customer.fieldOfWork, customer.productInterest)}</Td>
                    <Td>{valueOrDash(customer.trainingType, customer.courseName, customer.contactTitle)}</Td>
                    <Td>{valueOrDash(customer.batch, customer.group, customer.batchGroup)}</Td>
                    <Td>{valueOrDash(customer.scheduleShift, customer.preferredTimeSlot, customer.schedulePreference)}</Td>
                    <Td>{valueOrDash(customer.materialStatus, customer.materialDeliveryStatus, 'Not Delivered')}</Td>
                    <Td>
                      <Badge colorScheme={statusColor(customer.progress || customer.followupStatus)}>
                        {valueOrDash(customer.progress, customer.followupStatus)}
                      </Badge>
                    </Td>
                    <Td>{valueOrDash(customer.idInfo, customer.studentId)}</Td>
                    <Td>
                      <HStack spacing={1}>
                        <Button
                          as="a"
                          href={customer.phone ? `tel:${customer.phone}` : undefined}
                          size="xs"
                          variant="outline"
                          colorScheme="teal"
                          isDisabled={!customer.phone}
                        >
                          Call
                        </Button>
                        <Button
                          as="a"
                          href={customer.email ? `mailto:${customer.email}` : undefined}
                          size="xs"
                          variant="outline"
                          colorScheme="blue"
                          isDisabled={!customer.email}
                        >
                          Email
                        </Button>
                        <Tooltip label="Edit follow-up" hasArrow>
                          <IconButton
                            icon={<EditIcon />}
                            size="xs"
                            colorScheme="teal"
                            variant="outline"
                            onClick={() => handleOpenEdit(customer)}
                            aria-label="Edit follow-up"
                          />
                        </Tooltip>
                        <Tooltip label="Delete follow-up" hasArrow>
                          <IconButton
                            icon={<DeleteIcon />}
                            size="xs"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => handleDeleteClick(customer)}
                            aria-label="Delete follow-up"
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
                {!salesCustomers.length && (
                  <Tr><Td colSpan={17} textAlign="center" py={10} color="gray.500">No sales follow-ups match these filters.</Td></Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
          <Flex justify="space-between" align="center" mt={4} gap={3} flexWrap="wrap">
            <Text fontSize="sm" color="gray.500">
              Page {currentPage} of {totalPages} · 15 rows per page
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                isDisabled={loading || currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                colorScheme="teal"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                isDisabled={loading || currentPage >= totalPages}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </>
      )}

      {/* Edit Customer Follow-up Modal */}
      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg="teal.500" color="white">
            Edit Sales Customer Follow-up
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={4}>
            {editCustomer && (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold">Customer Name</FormLabel>
                    <Input
                      name="customerName"
                      size="sm"
                      value={editCustomer.customerName || ''}
                      onChange={handleEditChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Course / Training Title</FormLabel>
                    <Input
                      name="contactTitle"
                      size="sm"
                      value={editCustomer.contactTitle || ''}
                      onChange={handleEditChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Phone</FormLabel>
                    <Input
                      name="phone"
                      size="sm"
                      value={editCustomer.phone || ''}
                      onChange={handleEditChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Email</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      size="sm"
                      value={editCustomer.email || ''}
                      onChange={handleEditChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Follow-up Status</FormLabel>
                    <Select
                      name="followupStatus"
                      size="sm"
                      value={editCustomer.followupStatus || 'Completed'}
                      onChange={handleEditChange}
                    >
                      <option value="Prospect">Prospect</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Schedule Preference</FormLabel>
                    <Select
                      name="schedulePreference"
                      size="sm"
                      value={editCustomer.schedulePreference || 'Regular'}
                      onChange={handleEditChange}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Weekend">Weekend</option>
                      <option value="Night">Night</option>
                      <option value="Online">Online</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Package Scope</FormLabel>
                    <Select
                      name="packageScope"
                      size="sm"
                      value={editCustomer.packageScope || 'Local'}
                      onChange={handleEditChange}
                    >
                      <option value="Local">Local</option>
                      <option value="International">International</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">ID / Student Info</FormLabel>
                    <Input
                      name="idInfo"
                      size="sm"
                      value={editCustomer.idInfo || ''}
                      onChange={handleEditChange}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">Notes</FormLabel>
                  <Textarea
                    name="note"
                    size="sm"
                    rows={3}
                    value={editCustomer.note || ''}
                    onChange={handleEditChange}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg="gray.50">
            <Button variant="outline" mr={3} size="sm" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              size="sm"
              isLoading={isSavingEdit}
              onClick={handleSaveEdit}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={deleteCancelRef}
        onClose={() => setIsDeleteOpen(false)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Sales Follow-up
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete the follow-up record for <strong>{deleteCustomerTarget?.customerName || 'this customer'}</strong>? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={deleteCancelRef} onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default memo(SalesFollowupsTabPage);
