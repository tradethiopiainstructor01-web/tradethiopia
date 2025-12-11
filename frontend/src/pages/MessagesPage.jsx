import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
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
} from '@chakra-ui/react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService';

const MessagesPage = ({ embedded = false }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
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
      <Container maxW={embedded ? '100%' : 'container.xl'} py={embedded ? 0 : 8} px={embedded ? 0 : undefined}>
        <Box mb={8}>
        <Heading as="h1" size="xl" mb={2}>
          Notice Board
        </Heading>
        <Text color="gray.500">
          View all broadcast messages from management
        </Text>
        <Box display="flex" alignItems="center" mt={2}>
          {unreadCount > 0 && (
            <Badge colorScheme="red" mr={3}>
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Box>
      ) : error ? (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription display="block">
              {error}
            </AlertDescription>
          </Box>
        </Alert>
      ) : messages.length === 0 ? (
        <Alert status="info" borderRadius="md">
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
              <CardHeader pb={2}>
                <Heading as="h3" size="md">
                  Notice
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  {formatDateTime(message.createdAt)}
                </Text>
                <Box display="flex" alignItems="center" mt={2}>
                  {!message.read && (
                    <Badge colorScheme="red" mr={3}>
                      Unread
                    </Badge>
                  )}
                  {!message.read && (
                    <Button size="sm" onClick={() => markAsRead(message._id)}>
                      Mark as read
                    </Button>
                  )}
                </Box>
              </CardHeader>
              <Divider />
              <CardBody>
                <Text whiteSpace="pre-wrap">{message.text}</Text>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
      </Container>
    </Box>
  );
};

export default MessagesPage;
