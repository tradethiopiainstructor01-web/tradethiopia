import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  FormControl,
  FormLabel,
  Input,
  Button,
  Box,
  Flex,
  useToast,
  Divider,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import NotesContainer from './NotesContainer';

const NotesDrawer = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/notes`)
        .then((response) => {
          setNotes(response.data);
        })
        .catch((error) => {
          console.error('Error fetching notes:', error);
        });
    }
  }, [isOpen]);

  const handleSave = () => {
    const noteData = { title, content };

    if (selectedNoteId) {
      axios.put(`${import.meta.env.VITE_API_URL}/api/notes/${selectedNoteId}`, noteData)
        .then((response) => {
          const updatedNotes = notes.map((note) =>
            note._id === selectedNoteId ? response.data : note
          );
          setNotes(updatedNotes);
          toast({
            title: 'Note updated.',
            description: 'Your note was updated successfully.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        })
        .catch((error) => {
          console.error('Error updating note:', error);
        });
    } else {
      axios.post(`${import.meta.env.VITE_API_URL}/api/notes`, noteData)
        .then((response) => {
          setNotes([...notes, response.data]);
          toast({
            title: 'Note saved.',
            description: 'Your note was saved successfully.',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        })
        .catch((error) => {
          console.error('Error saving note:', error);
        });
    }

    setTitle('');
    setContent('');
    setSelectedNoteId(null);
  };

  const handleEdit = (noteId) => {
    const note = notes.find((n) => n._id === noteId);
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setSelectedNoteId(noteId);
  };

  const handleDelete = (noteId) => {
    axios.delete(`${import.meta.env.VITE_API_URL}/api/notes/${noteId}`)
      .then(() => {
        setNotes((prevNotes) => prevNotes.filter((note) => note._id !== noteId));
      })
      .catch((error) => {
        console.error('Error deleting note:', error);
      });
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="lg">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          <Heading size="md">Manage Your Notes</Heading>
        </DrawerHeader>

        <Divider />

        <DrawerBody>
          <VStack spacing={4} align="stretch">
            <FormControl id="title" isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title"
                size="lg"
                borderColor="gray.300"
              />
            </FormControl>

            <FormControl id="content" isRequired>
              <FormLabel>Content</FormLabel>
              <ReactQuill
                value={content}
                onChange={setContent}
                placeholder="Enter contents here ...."
                theme="snow"
                modules={{
                  toolbar: [
                    [{ header: '1' }, { header: '2' }, { font: [] }],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ align: [] }],
                    ['bold', 'italic', 'underline'],
                    ['link'],
                    [{ color: [] }, { background: [] }],
                    ['emoji'],
                    ['clean'],
                  ],
                }}
                style={{ minHeight: '200px', maxHeight: '300px' }}
              />
            </FormControl>

            <Flex justify="space-between">
              <Button colorScheme="teal" onClick={handleSave} size="md">
                Save Note
              </Button>
              <Button variant="outline" colorScheme="red" onClick={onClose} size="md">
                Cancel
              </Button>
            </Flex>

            <Divider />

            <Box>
              <Text fontSize="lg" fontWeight="bold">Your Notes:</Text>
              <NotesContainer notes={notes} handleEdit={handleEdit} handleDelete={handleDelete} />
            </Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default NotesDrawer;
