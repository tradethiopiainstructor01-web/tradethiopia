import React from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  VStack,
  Box,
  Text,
  Badge,
  Button,
  Spinner,
  Stack,
  Flex,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notificationService';

const ENSRANotificationsDrawer = ({
  isOpen,
  onClose,
  notifications = [],
  loading = false,
  onRefresh,
}) => {
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsAsRead();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const bodyBg = useColorModeValue('white', 'gray.700');

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" fontWeight="bold">
          Notifications
        </DrawerHeader>

        <DrawerBody bg={bodyBg} px={4} py={6}>
          <Flex align="center" justify="space-between" mb={4}>
            <Stack spacing={1}>
              <Text fontSize="md" fontWeight="bold">
                {unreadCount} {unreadCount === 1 ? 'Unread' : 'Unread'} Items
              </Text>
              <Text fontSize="sm" color="gray.500">
                {notifications.length} total
              </Text>
            </Stack>
            <Button size="sm" onClick={handleMarkAll} variant="ghost">
              Clear all
            </Button>
          </Flex>

          <Divider mb={4} />

          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner />
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch">
              {notifications.length === 0 && (
                <Text textAlign="center" color="gray.500">
                  No notifications yet.
                </Text>
              )}
              {notifications.map((notification) => (
                <Box
                  key={notification._id || notification.id}
                  px={4}
                  py={3}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                  bg={notification.read ? 'inherit' : useColorModeValue('gray.50', 'gray.800')}
                >
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="semibold" fontSize="md">
                      {notification.title || notification.type || 'Notification'}
                    </Text>
                    <Badge colorScheme={notification.read ? 'gray' : 'teal'}>
                      {notification.read ? 'Read' : 'New'}
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.500" noOfLines={2}>
                    {notification.message || notification.body || notification.text || 'No additional details.'}
                  </Text>
                  <Flex justify="space-between" align="center" mt={2}>
                    <Text fontSize="xs" color="gray.400">
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                    </Text>
                    {!notification.read && (
                      <Button size="xs" onClick={() => handleMarkAsRead(notification._id || notification.id)} variant="outline">
                        Mark as read
                      </Button>
                    )}
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default ENSRANotificationsDrawer;
