import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Box, Center, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { FiBell, FiCheck, FiMenu } from 'react-icons/fi';
import DocumentReminderToast from '../../sales/DocumentReminderToast';
import { useUserStore } from '../../../store/user';
import { markAllNotificationsAsRead, markNotificationAsRead } from '../../../services/notificationService';

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'ME';
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
};

const getTimeAgo = (dateString) => {
  const diffInSeconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

// Notifications behave like the desktop sales navbar (components/sales/Snavbar.jsx).
const MobileSalesTopBar = ({ onMenu, onProfile, documentReminder }) => {
  const currentUser = useUserStore((state) => state.currentUser);
  const [notifications, setNotifications] = useState([]);
  const userName = currentUser?.fullName || currentUser?.username || localStorage.getItem('userName') || '';
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const badgeCount = unreadCount + (documentReminder?.total > 0 ? 1 : 0);

  useEffect(() => {
    if (!currentUser?._id) return undefined;
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socket.emit('registerUser', currentUser._id);
    socket.on('newNotification', (notification) => {
      setNotifications((prev) => [{
        id: notification.id,
        message: notification.text,
        read: notification.read,
        time: getTimeAgo(notification.createdAt)
      }, ...prev]);
    });
    return () => socket.close();
  }, [currentUser?._id]);

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <Box bg="white" borderBottom="1px solid" borderColor="#E8EDF5" px={3} py={2.5}>
      <Flex align="center" justify="space-between" gap={2}>
        <Flex align="center" gap={2} minW={0}>
          {onMenu && (
            <IconButton
              aria-label="Open menu"
              icon={<FiMenu />}
              variant="ghost"
              color="#081A34"
              fontSize="22px"
              size="sm"
              onClick={onMenu}
            />
          )}
          <Box lineHeight="1" minW={0}>
            <Text fontSize="21px" fontWeight="800" letterSpacing="-0.02em" noOfLines={1}>
              <Text as="span" color="#0E8C80">Trade</Text>
              <Text as="span" color="#081A34">Ethiopia</Text>
            </Text>
            <Text fontSize="10px" color="#6E7890" textAlign="center" mt="2px">Business Group</Text>
          </Box>
        </Flex>
        <Flex align="center" gap={2}>
          <Menu isLazy>
            <MenuButton
              as={IconButton}
              aria-label="Notifications"
              icon={(
                <Box position="relative">
                  <FiBell />
                  {badgeCount > 0 && (
                    <Center
                      position="absolute"
                      top="-9px"
                      right="-9px"
                      minW="17px"
                      h="17px"
                      px={1}
                      borderRadius="full"
                      bg="#E5484D"
                      color="white"
                      fontSize="10px"
                      fontWeight="700"
                      borderWidth="2px"
                      borderColor="white"
                    >
                      {badgeCount}
                    </Center>
                  )}
                </Box>
              )}
              variant="ghost"
              color="#081A34"
              fontSize="20px"
            />
            <MenuList w="360px" minW={0} maxW="calc(100vw - 24px)" p={0} zIndex="popover" overflow="hidden">
              <Flex align="center" justify="space-between" px={4} py={3} borderBottom="1px solid" borderColor="#E8EDF5">
                <Text fontWeight="bold">Notifications</Text>
                <IconButton
                  size="sm"
                  variant="ghost"
                  color="#0E8C80"
                  icon={<FiCheck />}
                  aria-label="Mark all as read"
                  onClick={(event) => {
                    event.stopPropagation();
                    markAllAsRead();
                  }}
                />
              </Flex>
              <Box maxH="70vh" overflowY="auto">
                {documentReminder?.total > 0 && <Box p={3}><DocumentReminderToast {...documentReminder} /></Box>}
                {notifications.map((notification) => (
                  <MenuItem key={notification.id} py={3} onClick={() => markAsRead(notification.id)}>
                    <Flex align="center" w="100%">
                      <Box w="8px" h="8px" borderRadius="full" bg={notification.read ? 'transparent' : '#0E8C80'} mr={3} flexShrink={0} />
                      <Box flex="1" minW={0}>
                        <Text fontSize="sm" noOfLines={2}>{notification.message}</Text>
                        <Text fontSize="xs" color="gray.500" mt={1}>{notification.time}</Text>
                      </Box>
                    </Flex>
                  </MenuItem>
                ))}
                {!notifications.length && !(documentReminder?.total > 0) && (
                  <Text p={4} textAlign="center" color="gray.500" fontSize="sm">No new notifications</Text>
                )}
              </Box>
            </MenuList>
          </Menu>
          <Center
            as="button"
            type="button"
            aria-label="Open profile"
            onClick={onProfile}
            w="40px"
            h="40px"
            borderRadius="full"
            bg="#0E8C80"
            color="white"
            fontSize="14px"
            fontWeight="700"
          >
            {getInitials(userName)}
          </Center>
        </Flex>
      </Flex>
    </Box>
  );
};

export default MobileSalesTopBar;
