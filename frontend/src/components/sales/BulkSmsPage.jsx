import { useEffect, useState } from 'react';
import { Box, Heading, HStack, Text } from '@chakra-ui/react';
import { FaSms } from 'react-icons/fa';
import BulkSmsPanel from './BulkSmsPanel';
import { fetchCalledCalls } from '../../services/calledCallService';

// Standalone "Bulk SMS" sidebar page used by the Sales and Enisra dashboards.
const BulkSmsPage = () => {
  const [calls, setCalls] = useState([]);

  // Cold Call rows power the "From Call Table" shortcut; failure here is non-fatal.
  useEffect(() => {
    let active = true;
    fetchCalledCalls()
      .then((res) => {
        if (active && res?.success) setCalls(res.data || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <Box w="100%" minW={0}>
      <Box
        bg="white"
        _dark={{ bg: 'gray.800', color: 'gray.100', borderColor: 'gray.700' }}
        p={{ base: 4, md: 5 }}
        borderRadius="14px"
        mb={5}
        boxShadow="0 6px 20px rgba(15, 23, 42, 0.055)"
        border="1px solid"
        borderColor="#e2e8f0"
      >
        <HStack spacing={3} mb={1}>
          <Box p={2} bg="#e6f7f5" color="#0b8f7d" _dark={{ bg: 'whiteAlpha.100', color: 'teal.200' }} borderRadius="10px">
            <FaSms size={20} />
          </Box>
          <Heading size="lg" fontWeight="800" letterSpacing="-0.03em" color="#132238" _dark={{ color: 'gray.100' }}>
            Bulk SMS
          </Heading>
        </HStack>
        <Text color="#64748b" _dark={{ color: 'gray.400' }} fontSize="sm">
          Send one SMS to many phone numbers. Insert numbers in the table, paste a copied list, or import an Excel file.
        </Text>
      </Box>

      <BulkSmsPanel calls={calls} />
    </Box>
  );
};

export default BulkSmsPage;
