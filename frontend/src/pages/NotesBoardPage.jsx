import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import NotesDrawer from '../components/notes/NotesDrawer';

const NotesBoardPage = () => {
  return (
    <Box p={6}>
      <Heading as="h1" size="lg" mb={6}>
        Notes Board
      </Heading>
      <Text mb={6}>Manage your personal and team notes</Text>
      <NotesDrawer />
    </Box>
  );
};

export default NotesBoardPage;