import { useState, useEffect } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  HStack,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';

const NoticeBoardPanel = ({
  title = 'Notice Board',
  subtitle = 'View all broadcast messages from management',
  embedded = false,
}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('blue.50', 'blue.900');
  const headerColor = useColorModeValue('blue.800', 'blue.100');
  const containerBg = useColorModeValue('gray.50', 'gray.900');

  const containerStyles = embedded
    ? { bg: 'transparent', p: 0, minH: 'auto' }
    : { bg: containerBg, p: 6, minH: '100vh' };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      const broadcastMessages = Array.isArray(data)
        ? data.filter((msg) => msg.type === 'general')
        : [];
      setMessages(broadcastMessages);
    } catch (err) {
      console.error('Error fetching notice board messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setMessages((prev) => prev.map((msg) => (msg._id === id ? { ...msg, read: true } : msg)));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setMessages((prev) => prev.map((msg) => ({ ...msg, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const unreadCount = messages.filter((msg) => !msg.read).length;

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Box {...containerStyles}>
      <Box mb={embedded ? 4 : 8}>
        <Heading as="h1" size={embedded ? 'lg' : 'xl'} mb={2} color={headerColor}>
          {title}
        </Heading>
        <Text color="gray.500" mb={4}>
          {subtitle}
        </Text>
        <HStack spacing={4}>
          {unreadCount > 0 && (
            <Badge colorScheme="red" fontSize="md" px={3} py={1} borderRadius="full">
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button size="md" onClick={markAllAsRead} colorScheme="blue" variant="outline">
              Mark all as read
            </Button>
          )}
        </HStack>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" color="blue.500" />
        </Box>
      ) : error ? (
        <Alert status="error" borderRadius="md" variant="left-accent">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription display="block">{error}</AlertDescription>
          </Box>
        </Alert>
      ) : messages.length === 0 ? (
        <Alert status="info" borderRadius="md" variant="left-accent" colorScheme="blue">
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
            <Card key={message._id} bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" boxShadow="sm">
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
                    <Button size="sm" onClick={() => markAsRead(message._id)} colorScheme="blue" variant="outline">
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

export default NoticeBoardPanel;
