import { Badge, Box, Button, CloseButton, Flex, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FiAlertOctagon, FiUploadCloud } from 'react-icons/fi';

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.75; }
`;

// Opens the "missing documents only" follow-up view in the sales workspace.
export const openMissingDocuments = () => {
  window.dispatchEvent(new CustomEvent('navigateToSection', { detail: { section: 'Missing Documents' } }));
};

export default function DocumentReminderToast({ total, items, onDismiss, onOpenDocuments = openMissingDocuments }) {
  const bg = useColorModeValue('red.50', 'gray.800');
  const color = useColorModeValue('red.900', 'red.100');
  const muted = useColorModeValue('red.800', 'gray.300');
  const divider = useColorModeValue('red.200', 'whiteAlpha.200');
  const shown = items.slice(0, 3);
  const remaining = total - shown.length;

  return (
    <Box bg={bg} color={color} p={4} borderRadius="xl" borderWidth="1px" borderColor="red.400"
      borderLeftWidth="6px" boxShadow="0 10px 30px rgba(197, 48, 48, 0.25)" width="100%" role="alert" aria-live="assertive">
      <Flex align="start" gap={3}>
        <Icon as={FiAlertOctagon} color="red.500" boxSize={7} mt={0.5} animation={`${pulse} 1.6s ease-in-out infinite`} />
        <Box flex={1} minW={0}>
          <Text fontSize="xs" fontWeight="black" letterSpacing="wider" color="red.500">ACTION REQUIRED</Text>
          <Text fontWeight="extrabold" fontSize="md" lineHeight="short">
            Upload the missing documents now
          </Text>
          <Text fontSize="sm" color={muted} mt={1}>
            <b>{total}</b> of your completed sale{total === 1 ? ' is' : 's are'} missing documents.
            Finance cannot verify a sale until its bank slip and ID are uploaded.
          </Text>
        </Box>
        {onDismiss && <CloseButton size="sm" aria-label="Dismiss document warning" onClick={onDismiss} />}
      </Flex>

      <Box mt={3}>
        {shown.map((item, index) => (
          <Box key={item._id || index} py={2} borderTopWidth="1px" borderColor={divider}>
            <Text fontSize="sm" fontWeight="bold" overflowWrap="anywhere">{item.customerName || 'Unnamed customer'}</Text>
            <Flex gap={1.5} flexWrap="wrap" mt={1}>
              {(item.missingDocuments || []).map((document) => (
                <Badge key={document} colorScheme="red" variant="solid" textTransform="none" borderRadius="md" px={2}>
                  No {document.toLowerCase()}
                </Badge>
              ))}
            </Flex>
          </Box>
        ))}
      </Box>

      <Flex align="center" justify="space-between" gap={3} mt={2} flexWrap="wrap">
        <Text fontSize="xs" color={muted} fontWeight="semibold">
          {remaining > 0 ? `+ ${remaining} more sale${remaining === 1 ? '' : 's'} waiting for documents` : 'Fix these before your next follow-up.'}
        </Text>
        {onOpenDocuments && (
          <Button size="sm" colorScheme="red" leftIcon={<FiUploadCloud />}
            onClick={() => { onOpenDocuments(); onDismiss?.(); }}>
            Upload now
          </Button>
        )}
      </Flex>
    </Box>
  );
}
