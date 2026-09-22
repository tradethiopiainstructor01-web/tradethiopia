import { Badge, Box, CloseButton, Flex, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

export default function DocumentReminderToast({ total, items, onDismiss }) {
  const bg = useColorModeValue('orange.50', 'gray.800');
  const color = useColorModeValue('orange.900', 'orange.100');
  const muted = useColorModeValue('orange.800', 'gray.300');
  return (
    <Box bg={bg} color={color} p={4} borderRadius="xl" borderWidth="1px" borderColor="orange.300"
      borderLeftWidth="4px" shadow="none" width="100%" role="alert">
      <Flex align="start" gap={3}>
        <Icon as={FiAlertTriangle} color="orange.500" boxSize={6} mt={1} />
        <Box flex={1} minW={0}>
          <Text fontWeight="bold">Warning: Missing documents</Text>
          <Text fontSize="sm" color={muted} mt={1}>
            {total} completed follow-up{total === 1 ? '' : 's'} with missing documents.
          </Text>
        </Box>
        {onDismiss && <CloseButton size="sm" aria-label="Dismiss document warning" onClick={onDismiss} />}
      </Flex>
      <Box mt={3}>
        {items.slice(0, 3).map((item, index) => (
          <Box key={item._id || index} py={2} borderTopWidth="1px" borderColor="orange.200">
            <Text fontSize="sm" fontWeight="semibold" overflowWrap="anywhere">{item.customerName || 'Unnamed customer'}</Text>
            <Flex gap={1.5} flexWrap="wrap" mt={1}>
              {(item.missingDocuments || []).map((document) => (
                <Badge key={document} colorScheme="orange" textTransform="none" borderRadius="md" px={2}>{document}</Badge>
              ))}
            </Flex>
          </Box>
        ))}
      </Box>
      {total > 3 && <Text fontSize="xs" color={muted} mt={1}>Plus {total - 3} more with missing documents.</Text>}
    </Box>
  );
}
