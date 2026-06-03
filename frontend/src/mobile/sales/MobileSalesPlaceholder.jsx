import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';

const MobileSalesPlaceholder = ({ title, description }) => (
  <VStack align="stretch" spacing={4}>
    <Box borderWidth="1px" borderColor="#edf2f7" borderRadius="12px" bg="white" p={5} boxShadow="0 8px 20px rgba(15, 23, 42, 0.06)">
      <Heading color="#162033" fontSize="28px" mb={2}>
        {title}
      </Heading>
      <Text color="#697386" fontSize="15px" fontWeight="700">
        {description}
      </Text>
    </Box>
  </VStack>
);

export default MobileSalesPlaceholder;
