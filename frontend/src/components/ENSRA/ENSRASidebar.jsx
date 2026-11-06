import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Divider,
  Tooltip,
  useColorModeValue,
  Badge,
  Image,
} from '@chakra-ui/react';
import {
  FaHome,
  FaChartLine,
  FaMoneyBillWave,
  FaShoppingCart,
  FaClipboardList,
  FaRegCalendarAlt,
  FaExclamationTriangle,
  FaPhoneAlt,
  FaBoxOpen,
  FaSms,
} from 'react-icons/fa';
import { FiCheckCircle, FiMessageSquare, FiUploadCloud } from 'react-icons/fi';
import { getNotifications } from '../../services/notificationService';

const sidebarItems = [
  { label: 'Home', icon: FaHome },
  { label: 'Followup', icon: FaMoneyBillWave },
  { label: 'Cold Call', icon: FaPhoneAlt },
  { label: 'Bulk SMS', icon: FaSms },
  { label: 'Orders', icon: FaShoppingCart },
  { label: 'Tasks', icon: FiCheckCircle },
  { label: 'Content Tracker', icon: FaRegCalendarAlt },
  { label: 'Monthly Report', icon: FaChartLine },
  { label: 'Notice Board', icon: FiMessageSquare },
  { label: 'Requests', icon: FaClipboardList },
  { label: 'Upload Documents', icon: FiUploadCloud },
  { label: 'My Warnings', icon: FaExclamationTriangle },
];

const ENSRASidebar = ({ isCollapsed, toggleCollapse, activeItem, setActiveItem }) => {
  const sidebarBg = useColorModeValue('#ffffff', 'gray.900');
  const textColor = useColorModeValue('#1e293b', 'gray.100');
  const borderColor = useColorModeValue('#e2e8f0', 'whiteAlpha.200');
  
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const data = await getNotifications();
      const broadcastMessages = data.filter(msg => msg.type === 'general' || msg.type === 'broadcast');
      const unread = broadcastMessages.filter(msg => !msg.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Flex
      direction="column"
      h="100%"
      bg={sidebarBg}
      color={textColor}
      borderRight="1px solid"
      borderColor={borderColor}
      boxShadow="4px 0 20px rgba(15, 118, 110, 0.04)"
    >
      <HStack
        justifyContent="space-between"
        alignItems="center"
        minH={isCollapsed ? '68px' : '104px'}
        mb={3}
        px={isCollapsed ? 2 : 4}
        position="relative"
      >
        {!isCollapsed && (
          <VStack spacing={1} flex="1" justify="center">
            <Image
              src="/company-logos/enisra.png"
              fallbackSrc="/enisra.jpg"
              alt="Enisra"
              boxSize="52px"
              objectFit="contain"
              borderRadius="full"
            />
            <Text
              fontSize="sm"
              fontWeight="800"
              color="#0d9488"
              _dark={{ color: 'teal.200' }}
              letterSpacing="-0.02em"
            >
              Enisra
            </Text>
          </VStack>
        )}
        {isCollapsed && (
          <Image
            src="/company-logos/enisra.png"
            fallbackSrc="/enisra.jpg"
            alt="Enisra"
            boxSize="38px"
            objectFit="contain"
            borderRadius="full"
            mx="auto"
          />
        )}
      </HStack>

      <Divider mb={3} borderColor={borderColor} />

      <VStack align="stretch" spacing={1.5} px={3} overflowY="auto" flex="1">
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isCollapsed={isCollapsed}
            isActive={activeItem === item.label}
            onClick={() => {
              setActiveItem(item.label);
              if (item.label === 'Notice Board') {
                fetchUnreadCount();
              }
            }}
            unreadCount={item.label === 'Notice Board' ? unreadCount : 0}
          />
        ))}
      </VStack>
    </Flex>
  );
};

const SidebarItem = ({ icon, label, isCollapsed, isActive, onClick, unreadCount }) => {
  const inactiveColor = useColorModeValue('#475569', '#cbd5e1');
  const inactiveHoverBg = useColorModeValue('#f0fdfa', 'whiteAlpha.100');
  const inactiveHoverColor = useColorModeValue('teal.600', 'teal.300');

  const button = (
    <HStack
      as="button"
      type="button"
      spacing={isCollapsed ? 0 : 4}
      p={3}
      w="100%"
      bg={isActive ? 'linear-gradient(135deg, #0a8f7c, #08a28b)' : 'transparent'}
      color={isActive ? 'white' : inactiveColor}
      _hover={{
        bg: isActive ? 'linear-gradient(135deg, #087c6c, #07927d)' : inactiveHoverBg,
        color: isActive ? 'white' : inactiveHoverColor,
        transform: 'translateX(2px)'
      }}
      borderRadius="12px"
      justifyContent={isCollapsed ? 'center' : 'flex-start'}
      transition="all 0.25s ease"
      onClick={onClick}
      boxShadow={isActive ? '0 4px 14px rgba(13, 148, 136, 0.22)' : 'none'}
      position="relative"
    >
      <Box as={icon} fontSize="19px" />
      {!isCollapsed && (
        <>
          <Text fontSize="sm" fontWeight={isActive ? '600' : '500'}>{label}</Text>
          {unreadCount > 0 && (
            <Badge
              bg={isActive ? '#ffe4e6' : '#ef4444'}
              color={isActive ? '#9f1239' : 'white'}
              borderRadius="full"
              position="absolute"
              top="8px"
              right="8px"
              fontSize="10px"
              minW="20px"
              h="20px"
              px={1}
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
  );

  if (!isCollapsed) {
    return button;
  }

  return (
    <Tooltip label={label} placement="right" hasArrow>
      {button}
    </Tooltip>
  );
};

export default ENSRASidebar;
