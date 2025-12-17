import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Badge,
  Button,
  HStack,
} from '@chakra-ui/react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';

const FinanceMessagesPage = ({ embedded = false }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Finance dashboard specific colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('cyan.50', 'cyan.900');
  const headerColor = useColorModeValue('cyan.800', 'cyan.100');
  const backgroundColor = embedded ? 'transparent' : useColorModeValue('gray.50', 'gray.900');
  const padding = embedded ? 0 : 3;
  const minHeight = embedded ? 'auto' : '100vh';

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      // Filter for general notifications which are likely broadcast messages
      const broadcastMessages = data.filter(msg => msg.type === 'general');
      setMessages(broadcastMessages);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Mark a single message as read
  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      // Update the local state to reflect the change
      setMessages(messages.map(msg => 
        msg._id === id ? { ...msg, read: true } : msg
      ));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Mark all messages as read
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      // Update the local state to reflect the change
      setMessages(messages.map(msg => ({ ...msg, read: true })));
    } catch (err) {
      console.error('Error marking all messages as read:', err);
    }
  };

  // Count unread messages
  const unreadCount = messages.filter(msg => !msg.read).length;

  return (
    <Box p={padding} bg={backgroundColor} minH={minHeight}>
      <Box mb={4}>
        <Heading as="h1" size="sm" mb={2} color={headerColor}>
          Notice Board
        </Heading>
        <Text fontSize="xs" color="gray.500" mb={2}>
          View all broadcast messages from management
        </Text>
        <HStack spacing={2}>
          {unreadCount > 0 && (
            <Badge colorScheme="red" fontSize="xs" px={1.5} py={0.5} borderRadius="full">
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button 
              size="xs" 
              onClick={markAllAsRead}
              colorScheme="cyan"
              variant="outline"
              height="24px" minH="unset"
            >
              Mark all as read
            </Button>
          )}
        </HStack>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="120px">
          <Spinner size="md" color="cyan.500" />
        </Box>
      ) : error ? (
        <Alert status="error" borderRadius="md" variant="left-accent" size="sm">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle fontSize="xs">Error!</AlertTitle>
            <AlertDescription display="block" fontSize="xs">
              {error}
            </AlertDescription>
          </Box>
        </Alert>
      ) : messages.length === 0 ? (
        <Alert status="info" borderRadius="md" variant="left-accent" colorScheme="cyan" size="sm">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle fontSize="xs">No messages</AlertTitle>
            <AlertDescription display="block" fontSize="xs">
              There are no broadcast messages at this time.
            </AlertDescription>
          </Box>
        </Alert>
      ) : (
        <VStack spacing={3} align="stretch">
          {messages.map((message) => (
            <Card 
              key={message._id} 
              bg={cardBg} 
              borderWidth="1px" 
              borderColor={borderColor} 
              borderRadius="md"
              boxShadow="xs"
              size="sm"
            >
              <CardHeader pb={1.5} pt={2} px={3} bg={headerBg}>
                <Heading as="h3" size="xs" color={headerColor}>
                  Notice
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  {formatDateTime(message.createdAt)}
                </Text>
                <HStack spacing={1.5} mt={1.5}>
                  {!message.read && (
                    <Badge colorScheme="red" borderRadius="full" fontSize="xs" px={1} py={0.5}>
                      Unread
                    </Badge>
                  )}
                  {!message.read && (
                    <Button 
                      size="xs" 
                      onClick={() => markAsRead(message._id)}
                      colorScheme="cyan"
                      variant="outline"
                      height="20px" minH="unset"
                    >
                      Mark as read
                    </Button>
                  )}
                </HStack>
              </CardHeader>
              <Divider />
              <CardBody py={2} px={3}>
                <Text fontSize="xs" whiteSpace="pre-wrap">{message.text}</Text>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default FinanceMessagesPage;