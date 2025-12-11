import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  IconButton,
  Text,
  VStack,
  HStack,
  Divider,
  Tooltip,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import {
  FaHome,
  FaChartLine,
  FaUsers,
  FaArrowLeft,
  FaArrowRight,
  FaVideo,
  FaMoneyBillWave,
  FaShoppingCart,
  FaClipboardList
} from 'react-icons/fa';
import { FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../../services/notificationService';

const SSidebar = ({ isCollapsed, toggleCollapse, activeItem, setActiveItem }) => {
  // Color mode values
  const sidebarBg = useColorModeValue('gray.800', 'gray.900');
  const textColor = useColorModeValue('white', 'gray.100');
  const borderColor = useColorModeValue('whiteAlpha.300', 'whiteAlpha.200');
  
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch notifications to count unread messages
  const fetchUnreadCount = async () => {
    try {
      const data = await getNotifications();
      // Filter for general notifications (broadcast messages) and count unread
      const broadcastMessages = data.filter(msg => msg.type === 'general');
      const unread = broadcastMessages.filter(msg => !msg.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up interval to periodically refresh the count
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Flex direction="column" h="100%" bg={sidebarBg} color={textColor}>
      <HStack justifyContent="space-between" alignItems="center" mb={6} mt={2} px={4}>
        {!isCollapsed && (
          <Text fontSize="md" fontWeight="bold" textTransform="uppercase" color="teal.300">
            Dashboard
          </Text>
        )}
        <IconButton
          icon={isCollapsed ? <FaArrowRight /> : <FaArrowLeft />}
          aria-label="Toggle Sidebar"
          variant="ghost"
          color="white"
          onClick={toggleCollapse}
          size="sm"
          _hover={{ bg: 'whiteAlpha.200' }}
        />
      </HStack>
      <Divider mb={4} borderColor={borderColor} />
      <VStack align="stretch" spacing={2} px={2}>
          {['Home', 'Followup', 'Orders', 'Tutorials', 'Tasks', 'Monthly Report', 'Notice Board'].map((label) => (
          <SidebarItem
            key={label}
            icon={
              label === 'Home'
                ? FaHome
                : label === 'Followup'
                ? FaMoneyBillWave
                : label === 'Orders'
                ? FaShoppingCart
                : label === 'Resources'
                ? FaChartLine
                : label === 'Tasks'
                ? FiCheckCircle
                : label === 'Notice Board'
                ? FiMessageSquare
                : FaVideo
            }
            label={label}
            isCollapsed={isCollapsed}
            isActive={activeItem === label}
            onClick={() => {
              setActiveItem(label);
              if (label === 'Notice Board') {
                fetchUnreadCount();
              }
            }}
            unreadCount={label === 'Notice Board' ? unreadCount : 0}
          />
        ))}
      </VStack>
    </Flex>
  );
};

const SidebarItem = ({ icon, label, isCollapsed, isActive, onClick, unreadCount }) => {
  return (
    <Tooltip label={isCollapsed ? label : ''} placement="right" hasArrow>
      <HStack
        as="button"
        spacing={isCollapsed ? 0 : 4}
        p={3}
        w="100%"
        bg={isActive ? 'teal.600' : 'gray.700'}
        _hover={{ bg: isActive ? 'teal.500' : 'gray.600', transform: 'translateX(2px)', transition: 'all 0.2s ease' }}
        borderRadius="lg"
        justifyContent={isCollapsed ? 'center' : 'flex-start'}
        transition="all 0.3s ease"
        onClick={onClick}
        boxShadow={isActive ? 'md' : 'sm'}
        position="relative"
      >
        <Box as={icon} fontSize="20px" />
        {!isCollapsed && (
          <>
            <Text fontSize="md" fontWeight="medium">{label}</Text>
            {unreadCount > 0 && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="8px"
                right="8px"
                fontSize="10px"
                w="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {unreadCount}
              </Badge>
            )}
          </>
        )}
      </HStack>
    </Tooltip>
  );
};

export default SSidebar;
