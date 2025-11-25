import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  Flex,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useToast
} from '@chakra-ui/react';
import { FaTrashAlt } from 'react-icons/fa'; // Import trash icon for delete

const NotesContainer = ({ notes, handleEdit, handleDelete }) => {
  const { isOpen, onOpen, onClose } = useDisclosure(); // For confirmation dialog
  const [selectedNoteId, setSelectedNoteId] = useState(null); // Store selected note ID for deletion
  const [isModalOpen, setIsModalOpen] = useState(false); // For controlling the note content modal
  const [selectedNote, setSelectedNote] = useState(null); // For storing the selected note
  const [searchQuery, setSearchQuery] = useState(''); // For filtering notes by title
  const toast = useToast(); // For showing toast notifications

  // Handle Delete Action with Confirmation
  const handleConfirmDelete = () => {
    if (selectedNoteId) {
      handleDelete(selectedNoteId); // Call delete function passed from parent
      toast({
        title: "Note deleted.",
        description: "Your note was deleted successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose(); // Close the confirmation dialog
    }
  };

  // Open Modal with full note content
  const openNoteContentModal = (note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box mt={4} p={4} borderRadius="md" boxShadow="md" bg="white">
      {/* Search Filter */}
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search notes by title"
        mb={2}
        size="md"
        borderColor="gray.300"
        _focus={{ borderColor: 'teal.500' }}
        bg="gray.50"
        p={2}
      />

      {/* Notes Table Box */}
      <Box overflowX="auto" borderRadius="md" border="1px" borderColor="gray.200">
        <Table variant="striped" colorScheme="teal" size="sm">
          <Thead>
            <Tr>
              <Th fontSize="sm">Title</Th>
              <Th fontSize="sm">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <Tr key={note._id} onClick={() => openNoteContentModal(note)} _hover={{ cursor: 'pointer' }}>
                  <Td fontSize="sm" p={2}>{note.title}</Td>
                  <Td p={2}>
                    <Flex justify="space-between" align="center" gap={2}>
                      <Button
                        colorScheme="yellow"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the modal
                          handleEdit(note._id); // Open edit functionality
                        }}
                      >
                        Edit
                      </Button>
                      <IconButton
                        icon={<FaTrashAlt />}
                        aria-label="Delete Note"
                        colorScheme="red"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the modal
                          setSelectedNoteId(note._id); // Set the note to delete
                          onOpen(); // Open confirmation dialog
                        }}
                      />
                    </Flex>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan="2" textAlign="center" p={2}>No notes available.</Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog isOpen={isOpen} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Note
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onClose}>Cancel</Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      {/* Modal for Viewing Full Note Content */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedNote?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box dangerouslySetInnerHTML={{ __html: selectedNote?.content }} /> {/* Render HTML content */}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default NotesContainer;