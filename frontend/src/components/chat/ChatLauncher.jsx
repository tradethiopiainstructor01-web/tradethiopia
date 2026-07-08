import {
  Badge,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  Tooltip,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import ChatWorkspace from './ChatWorkspace';
import { useChatSummary } from '../../hooks/useChatSummary';

const ChatLauncher = ({ icon, ariaLabel = 'Open workspace chat', iconButtonProps = {}, unreadCount, preferredView = 'default' }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { summary } = useChatSummary();
  const badgeCount = typeof unreadCount === 'number' ? unreadCount : summary.unreadCount;
  const launcherBg = useColorModeValue('white', 'whiteAlpha.100');
  const launcherBorder = useColorModeValue('blue.100', 'whiteAlpha.200');
  const launcherHover = useColorModeValue('blue.50', 'whiteAlpha.200');
  const launcherShadow = useColorModeValue('0 10px 28px rgba(14, 165, 233, 0.18)', '0 10px 28px rgba(56, 189, 248, 0.16)');
  const drawerBodyBg = useColorModeValue('gray.50', 'gray.950');

  return (
    <>
      <Tooltip label={ariaLabel}>
        <IconButton
          icon={
            <Box position="relative" display="flex" alignItems="center" justifyContent="center">
              <Box
                position="absolute"
                inset="-8px"
                borderRadius="full"
                bg={badgeCount > 0 ? 'cyan.300' : 'transparent'}
                opacity={badgeCount > 0 ? 0.22 : 0}
                animation={badgeCount > 0 ? 'chatPulse 1.6s infinite' : 'none'}
              />
              <Box position="relative" display="flex" alignItems="center" justifyContent="center">
                {icon}
              </Box>
              {badgeCount > 0 && (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  position="absolute"
                  top="-10px"
                  right="-12px"
                  fontSize="10px"
                  minW="20px"
                  h="20px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 0 0 3px white"
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </Badge>
              )}
            </Box>
          }
          aria-label={ariaLabel}
          onClick={onOpen}
          border="1px solid"
          borderColor={launcherBorder}
          bg={launcherBg}
          boxShadow={badgeCount > 0 ? launcherShadow : 'none'}
          sx={{
            '@keyframes chatPulse': {
              '0%': { transform: 'scale(1)', opacity: 0.22 },
              '70%': { transform: 'scale(1.25)', opacity: 0.05 },
              '100%': { transform: 'scale(1)', opacity: 0.22 },
            },
          }}
          _hover={{ bg: launcherHover, transform: 'translateY(-1px)' }}
          {...iconButtonProps}
        />
      </Tooltip>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
        <DrawerOverlay />
        <DrawerContent maxW={{ base: '100vw', md: '1120px' }}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" bg={launcherBg}>
            Workspace Chat
          </DrawerHeader>
          <DrawerBody p={{ base: 2, md: 4 }} bg={drawerBodyBg}>
            <ChatWorkspace embedded preferredView={preferredView} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ChatLauncher;
