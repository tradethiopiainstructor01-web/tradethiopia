import React, { useEffect, useState } from 'react';
import { Box, Heading, VStack, Text } from '@chakra-ui/react';
import { getNotifications, markNotificationAsRead } from '../../services/notificationService';

const ENISRANoticeBoard = () => {
  const [notes, setNotes] = useState([]);

  const fetch = async () => {
    try {
      const data = await getNotifications();
      // show general/broadcast notifications
      const broadcast = data.filter(n => n.type === 'general' || n.type === 'broadcast');
      setNotes(broadcast);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <Box>
      <Heading>Notice Board</Heading>
      <VStack spacing={4} align="stretch" mt={4}>
        {notes.length === 0 && <Text>No notices</Text>}
        {notes.map(note => (
          <Box key={note._id} p={3} borderWidth="1px" borderRadius="md">
            <Text fontWeight="bold">{note.title || 'Notice'}</Text>
            <Text fontSize="sm" color="gray.500">{new Date(note.createdAt).toLocaleString()}</Text>
            <Text mt={2}>{note.message || note.body || note.text}</Text>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default ENISRANoticeBoard;
