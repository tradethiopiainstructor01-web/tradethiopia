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
  FormControl,
  FormLabel,
  Textarea,
} from '@chakra-ui/react';
import axios from 'axios';

const NotesModal = ({ isOpen, onClose, customer, onSave }) => {
  const [note, setNote] = useState('');
  const [action, setAction] = useState('add'); // Track the action

  useEffect(() => {
    if (customer) {
      setNote(customer.notes[0] || ''); // Initialize note state when customer changes
    }
  }, [customer]);

  const handleNoteAction = async () => {
    if (customer) {
      try {
        const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/followup/${customer._id}`, {
          action,
          note: action === 'edit' ? { oldNote: customer.notes[0], newNote: note } : note, // Adjust based on action
        });

        onSave(response.data); // Pass the updated customer back to the parent
        onClose();
      } catch (error) {
        console.error('Error saving note:', error);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{action === 'edit' ? 'Edit Note' : 'Add Note'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Note</FormLabel>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add your note here"
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="teal" onClick={handleNoteAction}>
            {action === 'edit' ? 'Save Note' : 'Add Note'}
          </Button>
          <Button colorScheme="red" onClick={() => setAction('remove')}>
            Remove Note
          </Button>
          <Button colorScheme="gray" onClick={onClose} ml={3}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NotesModal;