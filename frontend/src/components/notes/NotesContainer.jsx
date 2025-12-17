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
import { FaTrashAlt } from 'react-icons/fa';

const NotesContainer = ({ notes, handleEdit, handleDelete }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  const handleConfirmDelete = () => {
    if (selectedNoteId) {
      handleDelete(selectedNoteId);
      toast({
        title: 'Note deleted.',
        description: 'Your note was deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    }
  };

  const openNoteContentModal = (note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box mt={4} p={4} borderRadius="md" boxShadow="md" bg="white">
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
                          e.stopPropagation();
                          handleEdit(note._id);
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
                          e.stopPropagation();
                          setSelectedNoteId(note._id);
                          onOpen();
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedNote?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box dangerouslySetInnerHTML={{ __html: selectedNote?.content }} />
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
