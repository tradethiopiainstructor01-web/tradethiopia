import React, { useState, useEffect } from 'react';
import { Box, Heading, VStack, Text, Button } from '@chakra-ui/react';

const ENISRARequest = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // Placeholder: ideally fetch ENSRA requests from an API endpoint
    setRequests([
      { id: 1, title: 'Request A', details: 'Details for Request A' },
      { id: 2, title: 'Request B', details: 'Details for Request B' }
    ]);
  }, []);

  return (
    <Box>
      <Heading>Requests</Heading>
      <VStack mt={4} spacing={3} align="stretch">
        {requests.map(r => (
          <Box key={r.id} p={3} borderWidth="1px" borderRadius="md">
            <Text fontWeight="bold">{r.title}</Text>
            <Text fontSize="sm" color="gray.500">{r.details}</Text>
            <Button size="sm" mt={2}>View</Button>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default ENISRARequest;
