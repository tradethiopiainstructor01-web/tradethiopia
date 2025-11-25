import React from 'react';
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  Text,
  VStack,
  Divider,
  useDisclosure,
} from '@chakra-ui/react';

const NotificationsPanel = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Sample data for recent notifications and announcements
  const notifications = [
    { id: 1, message: "New user registered", type: "alert" },
    { id: 2, message: "System update scheduled", type: "alert" },
    { id: 3, message: "Server maintenance completed", type: "info" },
  ];
  
  const announcements = [
    { id: 1, message: "Company retreat scheduled for next month" },
    { id: 2, message: "New company policy on remote work" },
  ];

  return (
    <>
      {/* Button to open notifications panel */}
      <Button onClick={onOpen} colorScheme="teal" size="sm" position="fixed" top={4} right={4}>
        Notifications
      </Button>

      {/* Drawer for Notifications Panel */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" fontWeight="bold">
            Notifications
          </DrawerHeader>

          <DrawerBody>
            {/* Recent Notifications */}
            <Text fontSize="lg" fontWeight="bold" mt={4} mb={2}>
              Recent Notifications
            </Text>
            <VStack align="start" spacing={3} maxH="40vh" overflowY="auto">
              {notifications.map((notification) => (
                <Box key={notification.id} p={3} w="100%" borderRadius="md" bg="gray.100">
                  <Text>{notification.message}</Text>
                </Box>
              ))}
            </VStack>

            <Divider my={4} />

            {/* Announcements */}
            <Text fontSize="lg" fontWeight="bold" mt={4} mb={2}>
              Announcements
            </Text>
            <VStack align="start" spacing={3} maxH="40vh" overflowY="auto">
              {announcements.map((announcement) => (
                <Box key={announcement.id} p={3} w="100%" borderRadius="md" bg="blue.50">
                  <Text>{announcement.message}</Text>
                </Box>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default NotificationsPanel;
