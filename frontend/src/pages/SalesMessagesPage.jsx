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

const SalesMessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Sales dashboard specific colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('#e2e8f0', 'gray.700');
  const headingColor = useColorModeValue('#132238', 'white');
  const bodyColor = useColorModeValue('#334155', 'gray.200');

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
    <Box w="100%" minW={0}>
      <Box mb={6}>
        <Heading as="h1" fontSize={{ md: '26px', xl: '30px' }} lineHeight="1.15" mb={1} color={headingColor} letterSpacing="-0.035em">
          Notice Board
        </Heading>
        <Text color="#64748b" _dark={{ color: 'gray.400' }} fontSize="sm" mb={4}>
          View all broadcast messages from management
        </Text>
        <HStack spacing={3}>
          {unreadCount > 0 && (
            <Badge bg="#fff1f2" color="#be123c" _dark={{ bg: 'rgba(190,18,60,0.18)', color: 'red.200' }} fontSize="xs" px={2.5} py={1} borderRadius="full" textTransform="none">
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button 
              size="sm"
              onClick={markAllAsRead}
              colorScheme="teal"
              variant="outline"
            >
              Mark all as read
            </Button>
          )}
        </HStack>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" color="teal.500" />
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
        <Alert status="info" borderRadius="md" variant="left-accent" colorScheme="teal">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>No messages</AlertTitle>
            <AlertDescription display="block">
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
              borderRadius="12px"
              boxShadow="0 3px 12px rgba(15, 23, 42, 0.04)"
              borderLeftWidth="3px"
              borderLeftColor={message.read ? '#cbd5e1' : '#0d9488'}
              overflow="hidden"
            >
              <CardHeader px={4} pt={4} pb={3} bg={cardBg}>
                <HStack justify="space-between" align="start" gap={4}>
                  <Box minW={0}>
                    <HStack spacing={2} mb={1}>
                      <Heading as="h3" fontSize="sm" fontWeight="700" color={headingColor}>Management notice</Heading>
                      {!message.read && <Badge bg="#e6f7f5" color="#087f70" _dark={{ bg: 'whiteAlpha.100', color: 'teal.200' }} borderRadius="full" fontSize="10px">New</Badge>}
                    </HStack>
                    <Text fontSize="xs" color="#94a3b8">{formatDateTime(message.createdAt)}</Text>
                  </Box>
                  {!message.read && (
                    <Button 
                      size="xs"
                      onClick={() => markAsRead(message._id)}
                      colorScheme="teal"
                      variant="ghost"
                      flexShrink={0}
                    >
                      Mark as read
                    </Button>
                  )}
                </HStack>
              </CardHeader>
              <Divider borderColor="#edf1f3" _dark={{ borderColor: 'gray.700' }} />
              <CardBody px={4} py={3.5}>
                <Text whiteSpace="pre-wrap" color={bodyColor} fontSize="sm" lineHeight="1.65">{message.text}</Text>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default SalesMessagesPage;
