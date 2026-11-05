import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Box,
  Flex,
  IconButton,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  useColorMode,
  MenuDivider,
  Badge,
  Spinner,
  Button
} from '@chakra-ui/react';
import { FaBell, FaBars, FaCheck, FaComments, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import NotesLauncher from '../notes/NotesLauncher';
import ChatLauncher from '../chat/ChatLauncher';
import { useUserStore } from '../../store/user';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notificationService';

const ENSRANavbar = ({ onToggleSidebar, isSidebarCollapsed = false }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  useEffect(() => {
    if (!currentUser?._id) return;
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    newSocket.emit('registerUser', currentUser._id);
    newSocket.on('newNotification', (notification) => {
      const newNotification = {
        id: notification.id,
        message: notification.text,
        read: notification.read,
        time: getTimeAgo(notification.createdAt),
        taskId: notification.taskId,
        targetId: notification.targetId
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, [currentUser?._id]);

  const fetchUserNotifications = async () => {
    if (!currentUser?._id) return;
    setLoadingNotifications(true);
    try {
      const data = await getNotifications();
      const formattedNotifications = data.map((n) => ({
        id: n._id,
        message: n.message || n.text || n.title,
        read: n.read || false,
        time: getTimeAgo(n.createdAt),
        taskId: n.taskId,
        targetId: n.targetId
      }));
      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleLogout = () => {
    clearUser();
    navigate('/login');
  };

  return (
    <Box
      className="sales-desktop-header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      h="68px"
      bg="#ffffff"
      _dark={{ bg: 'gray.900', borderColor: 'whiteAlpha.200' }}
      borderBottom="1px solid"
      borderColor="#e2e8f0"
      zIndex={1000}
      boxShadow="0 4px 20px rgba(15, 118, 110, 0.04)"
      px={{ base: 3, md: 6 }}
    >
      <Flex h="100%" align="center" justify="space-between">
        {/* Left: Mobile hamburger & Workspace Title */}
        <HStack spacing={3}>
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            icon={<FaBars />}
            variant="ghost"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation"
          />
          <Box>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight="800"
              color="#0d9488"
              _dark={{ color: 'teal.300' }}
              letterSpacing="-0.01em"
            >
              Enisra Workspace
            </Text>
            <Text fontSize="xs" color="gray.500" display={{ base: 'none', sm: 'block' }}>
              Employee Portal
            </Text>
          </Box>
        </HStack>

        {/* Right: Actions & User Menu */}
        <HStack spacing={{ base: 2, md: 3 }}>
          {/* Notes Launcher */}
          <NotesLauncher />

          {/* Chat Launcher */}
          <ChatLauncher
            icon={<FaComments />}
            ariaLabel="Open Chat"
            iconButtonProps={{
              size: 'md',
              variant: 'ghost',
              color: 'gray.600',
              _dark: { color: 'gray.300' },
              borderRadius: 'full',
            }}
          />

          {/* Color Mode Toggle */}
          <IconButton
            icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
            variant="ghost"
            color="gray.600"
            _dark={{ color: 'gray.300' }}
            borderRadius="full"
            aria-label="Toggle Color Mode"
            onClick={toggleColorMode}
          />

          {/* Notifications Dropdown */}
          <Menu onOpen={fetchUserNotifications}>
            <MenuButton
              as={IconButton}
              icon={
                <Box position="relative">
                  <FaBell />
                  {unreadCount > 0 && (
                    <Badge
                      position="absolute"
                      top="-8px"
                      right="-8px"
                      bg="#ef4444"
                      color="white"
                      borderRadius="full"
                      fontSize="10px"
                      minW="16px"
                      h="16px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Box>
              }
              variant="ghost"
              borderRadius="full"
              aria-label="Notifications"
            />
            <MenuList maxH="380px" overflowY="auto" minW="300px" p={2}>
              <Flex justify="space-between" align="center" px={3} py={2} borderBottom="1px solid" borderColor="gray.100">
                <Text fontWeight="bold" fontSize="sm">Notifications</Text>
                {unreadCount > 0 && (
                  <Button size="xs" variant="ghost" colorScheme="teal" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
              </Flex>
              {loadingNotifications ? (
                <Flex justify="center" py={4}><Spinner size="sm" color="teal.500" /></Flex>
              ) : notifications.length === 0 ? (
                <Text fontSize="xs" color="gray.500" textAlign="center" py={4}>No notifications</Text>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <MenuItem
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    bg={notif.read ? 'transparent' : 'teal.50'}
                    _dark={{ bg: notif.read ? 'transparent' : 'whiteAlpha.100' }}
                    borderRadius="md"
                    my={1}
                  >
                    <Box fontSize="xs" w="full">
                      <Text fontWeight={notif.read ? 'normal' : 'bold'}>{notif.message}</Text>
                      <Text fontSize="10px" color="gray.400" mt={0.5}>{notif.time}</Text>
                    </Box>
                  </MenuItem>
                ))
              )}
            </MenuList>
          </Menu>

          {/* User Profile Menu */}
          <Menu>
            <MenuButton>
              <HStack spacing={2} cursor="pointer" p={1} borderRadius="full" _hover={{ bg: 'gray.100', _dark: { bg: 'whiteAlpha.100' } }}>
                <Avatar
                  size="sm"
                  name={currentUser?.fullName || currentUser?.username || 'Enisra Employee'}
                  src={currentUser?.photoUrl || currentUser?.photo}
                  bg="teal.600"
                  color="white"
                />
                <Box textAlign="left" display={{ base: 'none', lg: 'block' }}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.700" _dark={{ color: 'gray.200' }} lineHeight="1.1">
                    {currentUser?.fullName || currentUser?.username || 'Enisra User'}
                  </Text>
                  <Text fontSize="10px" color="gray.500">
                    {currentUser?.jobTitle || 'Enisra'}
                  </Text>
                </Box>
              </HStack>
            </MenuButton>
            <MenuList>
              <Box px={3} py={2}>
                <Text fontSize="xs" fontWeight="bold">{currentUser?.fullName || currentUser?.username}</Text>
                <Text fontSize="xs" color="gray.500">{currentUser?.email}</Text>
                <Badge colorScheme="teal" mt={1}>Role: Enisra</Badge>
              </Box>
              <MenuDivider />
              <MenuItem icon={<FaSignOutAlt />} color="red.500" onClick={handleLogout}>
                Sign Out
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default ENSRANavbar;

