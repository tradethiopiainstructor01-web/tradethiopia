import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Modal,
  ModalContent,
  ModalOverlay,
  CircularProgress,
  CircularProgressLabel,
  Stack,
  Text,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FiAlertTriangle, FiCheck, FiUploadCloud } from 'react-icons/fi';
import { openMissingDocuments } from './DocumentReminderToast';

const WARNING_SECONDS = 7;
const MAX_LISTED = 5;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12); }
`;

// Full-screen warning shown while completed sales are missing documents. It
// cannot be closed until the agent has had WARNING_SECONDS to read it.
export default function DocumentWarningOverlay({ isOpen, total, items = [], onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);

  useEffect(() => {
    if (!isOpen) return undefined;
    setSecondsLeft(WARNING_SECONDS);
    const timer = window.setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds <= 1) window.clearInterval(timer);
        return Math.max(0, seconds - 1);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  const canClose = secondsLeft === 0;
  const close = () => { if (canClose) onClose(); };
  const shown = items.slice(0, MAX_LISTED);
  const remaining = total - shown.length;

  return (
    <Modal isOpen={isOpen} onClose={close} size="full" closeOnOverlayClick={false} closeOnEsc={canClose}>
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      {/* Fixed to the viewport: the message scrolls if needed, the countdown and buttons never leave the screen. */}
      <ModalContent bg="red.700" color="white" m={0} borderRadius={0} h="100dvh" maxH="100dvh" overflow="hidden"
        display="flex" flexDirection="column" role="alertdialog" aria-live="assertive">
        <Box flex="1" minH={0} overflowY="auto" display="flex" px={4} py={{ base: 5, md: 6 }}>
          {/* my="auto" centres short content without cutting off the top of tall content. */}
          <Stack spacing={{ base: 3, md: 4 }} maxW="640px" w="100%" mx="auto" my="auto" textAlign="center" align="center">
            <Icon as={FiAlertTriangle} boxSize={{ base: 10, md: 12 }} color="yellow.300" flexShrink={0}
              animation={`${pulse} 1.2s ease-in-out infinite`} />

            <Box>
              <Text fontSize="xs" fontWeight="black" letterSpacing="widest" color="yellow.300">
                WARNING
              </Text>
              <Heading size={{ base: 'md', md: 'lg' }} mt={1}>
                Submit your missing documents now
              </Heading>
            </Box>

            <Text fontSize={{ base: 'sm', md: 'md' }}>
              <b>{total}</b> of your completed sale{total === 1 ? ' is' : 's are'} missing the bank slip or ID.
            </Text>

            <Box bg="blackAlpha.400" borderRadius="lg" px={4} py={3} borderWidth="2px" borderColor="yellow.300" w="100%">
              <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">
                If you do not submit the missing documents, your account will be locked or deactivated.
              </Text>
            </Box>

            <Box w="100%" textAlign="left" bg="whiteAlpha.200" borderRadius="lg" px={4} py={1}>
              {shown.map((item, index) => (
                <Flex key={item._id || index} py={1.5} gap={2} align="center" justify="space-between" flexWrap="wrap"
                  borderTopWidth={index ? '1px' : 0} borderColor="whiteAlpha.300">
                  <Text fontSize="sm" fontWeight="semibold" overflowWrap="anywhere">{item.customerName || 'Unnamed customer'}</Text>
                  <Flex gap={1.5} flexWrap="wrap">
                    {(item.missingDocuments || []).map((document) => (
                      <Badge key={document} bg="yellow.300" color="red.900" textTransform="none" borderRadius="md" px={2}>
                        No {document.toLowerCase()}
                      </Badge>
                    ))}
                  </Flex>
                </Flex>
              ))}
              {remaining > 0 && (
                <Text fontSize="xs" py={1.5} borderTopWidth="1px" borderColor="whiteAlpha.300">
                  + {remaining} more sale{remaining === 1 ? '' : 's'} missing documents
                </Text>
              )}
            </Box>
          </Stack>
        </Box>

        <Box flexShrink={0} bg="red.800" borderTopWidth="1px" borderColor="whiteAlpha.300" px={4} py={3}>
          <Flex maxW="640px" mx="auto" align="center" gap={{ base: 3, md: 4 }} direction={{ base: 'column', sm: 'row' }}>
            <Flex align="center" gap={3} flex="1" minW={0}>
              <CircularProgress value={(secondsLeft / WARNING_SECONDS) * 100} size="56px" thickness="10px"
                color="yellow.300" trackColor="whiteAlpha.300" flexShrink={0}
                sx={{ '& circle': { transition: 'stroke-dasharray 1s linear' } }}>
                <CircularProgressLabel>
                  {canClose
                    ? <Icon as={FiCheck} boxSize={6} color="yellow.300" />
                    : <Text fontSize="xl" fontWeight="black" lineHeight="1">{secondsLeft}</Text>}
                </CircularProgressLabel>
              </CircularProgress>
              <Text fontSize="sm" textAlign="left" aria-live="polite">
                {canClose
                  ? 'You can continue now.'
                  : `Please read this warning — ${secondsLeft} second${secondsLeft === 1 ? '' : 's'} left`}
              </Text>
            </Flex>
            <Flex gap={2} w={{ base: '100%', sm: 'auto' }} direction={{ base: 'column', sm: 'row' }}>
              <Button bg="yellow.300" color="red.900" _hover={{ bg: 'yellow.200' }} leftIcon={<FiUploadCloud />}
                isDisabled={!canClose} onClick={() => { openMissingDocuments(); onClose(); }}>
                Upload documents now
              </Button>
              <Button variant="outline" color="white" borderColor="whiteAlpha.700" _hover={{ bg: 'whiteAlpha.200' }}
                isDisabled={!canClose} onClick={close}>
                {canClose ? 'I understand' : `Wait ${secondsLeft}s`}
              </Button>
            </Flex>
          </Flex>
        </Box>
      </ModalContent>
    </Modal>
  );
}
