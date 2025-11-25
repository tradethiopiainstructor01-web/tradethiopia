import React, { useEffect, useState } from 'react';
import { Box, Button, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import axios from 'axios';

const ResourceList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/resources`);
        // The API returns {success: true, data: [...]} structure
        // We need to extract the actual resources array from response.data.data
        const resourcesData = response.data && response.data.data ? response.data.data : [];
        setResources(resourcesData);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setError("Failed to load resources");
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" variant="left-accent">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {Array.isArray(resources) && resources.length > 0 ? (
        resources.map(resource => (
          <Box key={resource?._id || resource?.title} borderWidth={1} borderRadius="md" p={4} mb={2}>
            <Text fontWeight="bold">{resource?.title}</Text>
            <Text>{resource?.description}</Text>
            <Text>Type: {resource?.fileType}</Text>
            <Text>Access Level: {resource?.accessLevel}</Text>
            {resource?.filePath && (
              <Button 
                as="a" 
                href={`${import.meta.env.VITE_API_URL}/${resource.filePath}`} 
                download
                mt={2}
                colorScheme="teal"
              >
                Download
              </Button>
            )}
          </Box>
        ))
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Text>No resources available</Text>
        </Box>
      )}
    </Box>
  );
};

export default ResourceList;