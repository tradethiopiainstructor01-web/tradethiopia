import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Stack,
  IconButton,
  HStack,
  Textarea,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { FaLink, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import {
  createContentTrackerEntry,
  deleteContentTrackerEntry,
  fetchContentTrackerEntries,
  updateContentTrackerEntry,
} from '../../services/contentTrackerService';

const contentTypeOptions = ['Video', 'Graphics', 'Live Session', 'Testimonial'];

const getEntryId = (entry) => entry?._id ?? entry?.id ?? entry;

const ContentTrackerPage = () => {
  const [contentRows, setContentRows] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [modalType, setModalType] = useState(contentTypeOptions[0]);
  const [modalLink, setModalLink] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [viewEntry, setViewEntry] = useState(null);

  const normalizeResponsePayload = (payload) => payload?.data ?? payload;

  const loadEntries = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchContentTrackerEntries();
      const entries = Array.isArray(normalizeResponsePayload(response))
        ? normalizeResponsePayload(response)
        : normalizeResponsePayload(response)?.data ?? [];
      setContentRows(entries);
    } catch (err) {
      console.error('Failed to load content tracker entries', err);
      setError('Unable to load content tracker entries right now.');
      toast({
        title: 'Unable to load tracker',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const updateRowInState = (updatedEntry) => {
    if (!updatedEntry) return;
    setContentRows((prev) =>
      prev.map((row) =>
        getEntryId(row) === getEntryId(updatedEntry) ? updatedEntry : row,
      ),
    );

    if (selectedItem && getEntryId(selectedItem) === getEntryId(updatedEntry)) {
      setSelectedItem(updatedEntry);
    }
  };

  const removeRowFromState = (entryId) => {
    setContentRows((prev) =>
      prev.filter((row) => getEntryId(row) !== entryId),
    );
    if (selectedItem && getEntryId(selectedItem) === entryId) {
      setSelectedItem(null);
    }
  };

  const handleTypeChange = async (entryId, nextType) => {
    try {
      const response = await updateContentTrackerEntry(entryId, { type: nextType });
      const updated = normalizeResponsePayload(response);
      updateRowInState(updated);
    } catch (err) {
      console.error('Unable to update type', err);
      toast({
        title: 'Update failed',
        description: 'Could not save the new type.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const toggleApproved = async (entryId) => {
    try {
      const current = contentRows.find((row) => getEntryId(row) === entryId);
      const response = await updateContentTrackerEntry(entryId, {
        approved: !current?.approved,
      });
      const updated = normalizeResponsePayload(response);
      updateRowInState(updated);
    } catch (err) {
      console.error('Unable to toggle approval', err);
      toast({
        title: 'Update failed',
        description: 'Unable to toggle approval right now.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const openActionModal = (action, row) => {
    setSelectedItem(row);
    setCurrentAction(action);
    setModalType(row?.type ?? contentTypeOptions[0]);
    setModalLink(row?.link ?? '');
    setModalDescription(row?.description ?? '');
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setCurrentAction(null);
    setModalDescription('');
    setModalLink('');
    setModalType(contentTypeOptions[0]);
    onClose();
  };

  const handleCloseView = () => {
    setViewEntry(null);
    onViewClose();
  };

  const handleModalConfirm = async () => {
    if (!selectedItem) {
      handleCloseModal();
      return;
    }

    const entryId = getEntryId(selectedItem);

    try {
      if (currentAction === 'Delete') {
        await deleteContentTrackerEntry(entryId);
        removeRowFromState(entryId);
      } else if (currentAction === 'Edit') {
        const response = await updateContentTrackerEntry(entryId, {
          type: modalType,
          link: modalLink,
          description: modalDescription,
        });
        const updated = normalizeResponsePayload(response);
        updateRowInState(updated);
      }

      handleCloseModal();
    } catch (err) {
      console.error('Modal action failed', err);
      toast({
        title: 'Action failed',
        description: 'Unable to process your request.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleAddEntry = async () => {
    try {
      const payload = {
        title: 'New content entry',
        type: contentTypeOptions[0],
        link: '',
        description: '',
        approved: false,
        date: new Date().toISOString(),
      };
      const response = await createContentTrackerEntry(payload);
      const created = normalizeResponsePayload(response);
      setContentRows((prev) => [created, ...prev]);
      openActionModal('Edit', created);
    } catch (err) {
      console.error('Unable to create entry', err);
      toast({
        title: 'Creation failed',
        description: 'We could not add a new entry right now.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const visibleRows = filterDate
    ? contentRows.filter((row) => {
        if (!row?.date) return false;
        const rowDateString = new Date(row.date).toISOString().split('T')[0];
        return rowDateString === filterDate;
      })
    : contentRows;

  const actionLabelMap = {
    Edit: 'Edit Content Details',
    Delete: 'Delete Content Entry',
  };

  const renderTableSection = () => {
    if (isLoading) {
      return (
        <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" p={6}>
          <Flex align="center" gap={3}>
            <Spinner size="lg" />
            <Text fontWeight="medium">Loading content tracker data...</Text>
          </Flex>
        </Box>
      );
    }

    if (error) {
      return (
        <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" p={6}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        </Box>
      );
    }

    if (!visibleRows.length) {
      return (
        <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" p={6}>
          <Text color="gray.500" textAlign="center">
            No tracker entries yet. Click “Add” to create one.
          </Text>
        </Box>
      );
    }

    return (
      <Box bg="white" rounded="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Date</Th>
              <Th>Content</Th>
              <Th>Type</Th>
              <Th>Link</Th>
              <Th>Approved</Th>
              <Th textAlign="center">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {visibleRows.map((row) => {
              const rowId = getEntryId(row);
              return (
                <Tr key={rowId}>
                  <Td whiteSpace="nowrap">
                    {row?.date ? new Date(row.date).toISOString().split('T')[0] : '—'}
                  </Td>
                  <Td>
                    <Text fontWeight="semibold">{row.title}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {row.description || 'Add a short description when editing this entry.'}
                    </Text>
                  </Td>
                  <Td>
                    <Select
                      value={row.type}
                      onChange={(event) => handleTypeChange(rowId, event.target.value)}
                      size="sm"
                    >
                      {contentTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <FaLink />
                      <Box
                        as="a"
                        href={row.link || '#'}
                        target="_blank"
                        rel="noreferrer"
                        color="teal.500"
                      >
                        {row.link ? 'View post' : 'No link yet'}
                      </Box>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={row.approved ? 'green' : 'yellow'}>
                      {row.approved ? 'Yes' : 'No'}
                    </Badge>
                  </Td>
                  <Td>
                    <Stack direction="row" spacing={2} justify="center">
                      <IconButton
                        aria-label="Edit"
                        icon={<FaEdit />}
                        size="sm"
                        onClick={() => openActionModal('Edit', row)}
                      />
                      <IconButton
                        aria-label="View"
                        icon={<FaEye />}
                        size="sm"
                        onClick={() => {
                          setViewEntry(row);
                          onViewOpen();
                        }}
                      />
                      <IconButton
                        aria-label="Delete"
                        icon={<FaTrash />}
                        size="sm"
                        onClick={() => openActionModal('Delete', row)}
                      />
                    </Stack>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    );
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Content Tracker</Heading>
        <Button size="sm" colorScheme="teal" onClick={handleAddEntry}>
          Add
        </Button>
      </Flex>

      <Flex mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>
            Filter by date
          </Text>
          <Input
            type="date"
            value={filterDate}
            onChange={(event) => setFilterDate(event.target.value)}
            max="2026-12-31"
          />
        </Box>
        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>
            Content column description
          </Text>
          <Input
            placeholder="Search by title or notes"
            onChange={() => {}}
            isDisabled
          />
        </Box>
      </Flex>

      {renderTableSection()}

      <Modal isOpen={isOpen} onClose={handleCloseModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{actionLabelMap[currentAction] ?? 'Action'}</ModalHeader>
          <ModalCloseButton onClick={handleCloseModal} />
          <ModalBody>
            {selectedItem && currentAction === 'Edit' && (
              <Stack spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Change type
                  </Text>
                  <Select
                    value={modalType}
                    onChange={(event) => setModalType(event.target.value)}
                  >
                    {contentTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Update link
                  </Text>
                  <Input
                    value={modalLink}
                    onChange={(event) => setModalLink(event.target.value)}
                    placeholder="https://"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    Description
                  </Text>
                  <Textarea
                    value={modalDescription}
                    onChange={(event) => setModalDescription(event.target.value)}
                    placeholder="Describe what this content covers."
                    rows={3}
                  />
                </Box>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleApproved(getEntryId(selectedItem))}
                >
                  Toggle approved (currently {selectedItem.approved ? 'Yes' : 'No'})
                </Button>
              </Stack>
            )}
            {selectedItem && currentAction === 'Delete' && (
              <Text>
                Delete <strong>{selectedItem.title}</strong> from the tracker. This
                action cannot be undone.
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleModalConfirm}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isViewOpen} onClose={handleCloseView} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Entry Detail</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {viewEntry ? (
              <Box borderWidth="1px" borderRadius="lg" shadow="md" p={5} bg="white">
                <Flex justify="space-between" align="center" mb={3} gap={3}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Date
                    </Text>
                    <Text fontWeight="bold">
                      {viewEntry.date ? new Date(viewEntry.date).toISOString().split('T')[0] : '—'}
                    </Text>
                  </Box>
                  <Badge colorScheme={viewEntry.approved ? 'green' : 'yellow'}>
                    {viewEntry.approved ? 'Approved' : 'Pending'}
                  </Badge>
                </Flex>
                <Heading size="md" mb={2}>
                  {viewEntry.title}
                </Heading>
                <Text mb={2} color="gray.600">
                  {viewEntry.description || 'No description has been provided yet.'}
                </Text>
                <Text fontSize="sm" mb={1} color="gray.500">
                  Type
                </Text>
                <Text fontWeight="semibold" mb={2}>
                  {viewEntry.type || '—'}
                </Text>
                <Text fontSize="sm" mb={1} color="gray.500">
                  Link
                </Text>
                <Text
                  as="a"
                  href={viewEntry.link || '#'}
                  color="teal.500"
                  target="_blank"
                  rel="noreferrer"
                >
                  {viewEntry.link ? viewEntry.link : 'No link provided'}
                </Text>
              </Box>
            ) : (
              <Text>No entry selected.</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={handleCloseView}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ContentTrackerPage;
