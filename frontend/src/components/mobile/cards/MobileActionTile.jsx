import React from 'react';
import { Box, Icon, Text, VStack } from '@chakra-ui/react';

const MobileActionTile = ({ icon, label }) => (
  <Box
    borderWidth="1px"
    borderColor="#274257"
    borderRadius="12px"
    bg="#142129"
    minH="110px"
    px={3}
    py={4}
    display="flex"
    alignItems="center"
    justifyContent="center"
  >
    <VStack spacing={2}>
      <Icon as={icon} boxSize={9} color="#dbe4ee" />
      <Text color="#dbe4ee" fontSize="19px" fontWeight="800">
        {label}
      </Text>
    </VStack>
  </Box>
);

export default MobileActionTile;
