import React from 'react';
import {
  Box,
  Container,
  useColorModeValue,
} from '@chakra-ui/react';
import RequestPage from '../../pages/RequestPage';

const ENISRARequestEmbedded = () => {
  // Background colors based on color mode
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  
  return (
    <Box bg={bgColor} minH="100vh" py={6} px={4}>
      <Container maxW="container.xl">
        {/* Embedded Unified Request System */}
        <RequestPage
          maxWidth="1100px"
          departmentOverride="ENISRA"
          backRouteOverride="/enisra"
          backLabelOverride="ENSRA"
        />
      </Container>
    </Box>
  );
};

export default ENISRARequestEmbedded;
