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
  const padding = embedded ? 0 : 6;
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
      <Box mb={8}>
        <Heading as="h1" size="xl" mb={2} color={headerColor}>
          Notice Board
        </Heading>
        <Text color="gray.500" mb={4}>
          View all broadcast messages from management
        </Text>
        <HStack spacing={4}>
          {unreadCount > 0 && (
            <Badge colorScheme="red" fontSize="md" px={3} py={1} borderRadius="full">
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button 
              size="md" 
              onClick={markAllAsRead}
              colorScheme="cyan"
              variant="outline"
            >
              Mark all as read
            </Button>
          )}
        </HStack>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" color="cyan.500" />
        </Box>
      ) : error ? (
        <Alert status="error" borderRadius="md" variant="left-accent">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription display="block">
              {error}
            </AlertDescription>
          </Box>
        </Alert>
      ) : messages.length === 0 ? (
        <Alert status="info" borderRadius="md" variant="left-accent" colorScheme="cyan">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>No messages</AlertTitle>
            <AlertDescription display="block">
              There are no broadcast messages at this time.
            </AlertDescription>
          </Box>
        </Alert>
      ) : (
        <VStack spacing={6} align="stretch">
          {messages.map((message) => (
            <Card 
              key={message._id} 
              bg={cardBg} 
              borderWidth="1px" 
              borderColor={borderColor} 
              borderRadius="lg"
              boxShadow="sm"
            >
              <CardHeader pb={2} bg={headerBg}>
                <Heading as="h3" size="md" color={headerColor}>
                  Notice
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  {formatDateTime(message.createdAt)}
                </Text>
                <HStack spacing={3} mt={2}>
                  {!message.read && (
                    <Badge colorScheme="red" borderRadius="full">
                      Unread
                    </Badge>
                  )}
                  {!message.read && (
                    <Button 
                      size="sm" 
                      onClick={() => markAsRead(message._id)}
                      colorScheme="cyan"
                      variant="outline"
                    >
                      Mark as read
                    </Button>
                  )}
                </HStack>
              </CardHeader>
              <Divider />
              <CardBody>
                <Text whiteSpace="pre-wrap">{message.text}</Text>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default FinanceMessagesPage;
