import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  HStack,
  VStack,
  Text,
  Heading,
  useColorModeValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useDisclosure,
  Divider,
  Badge,
} from '@chakra-ui/react';
import {
  FiMenu,
  FiHome,
  FiBox,
  FiBarChart2,
  FiMessageSquare,
  FiDollarSign,
  FiUsers,
  FiShield,
  FiFileInvoice,
  FiShoppingCart,
} from 'react-icons/fi';
import { RxHamburgerMenu } from 'react-icons/rx';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { getNotifications } from '../../services/notificationService';

const SidebarItem = ({ icon: Icon, label, to, unreadCount = 0 }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeBg = useColorModeValue('rgba(255,255,255,0.08)', 'rgba(255,255,255,0.06)');
  const color = useColorModeValue('white', 'teal.200');

  return (
    <RouterLink to={to} style={{ textDecoration: 'none' }}>
      <HStack
        spacing={3}
        p={3}
        borderRadius="md"
        bg={isActive ? activeBg : 'transparent'}
        _hover={{ bg: activeBg }}
        color={color}
        position="relative"
      >
        <Box as={Icon} boxSize={5} />
        <Text fontSize="sm">{label}</Text>
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
      </HStack>
    </RouterLink>
  );
};

const Sidebar = ({ onClose, mobile = false, unreadCount = 0, showNoticeBoard = true }) => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarBg = useColorModeValue('linear-gradient(180deg,#06b6d4 0%,#0ea5a4 100%)', 'linear-gradient(180deg,#164e63 0%,#0e7490 100%)');
  const textColor = useColorModeValue('white', 'cyan.100');
  const accent = useColorModeValue('cyan.100', 'cyan.200');

  return (
    <Box
      as="nav"
      position={mobile ? 'relative' : 'fixed'}
      top={mobile ? 0 : '64px'}
      left={0}
      zIndex={20}
      h={mobile ? '100vh' : 'calc(100vh - 64px)'}
      w={mobile ? 'full' : (collapsed ? '70px' : '220px')}
      bgGradient={sidebarBg}
      color={textColor}
      borderRight={mobile ? 'none' : '1px solid'}
      borderColor={useColorModeValue('teal.100','teal.900')}
      transition="width 0.3s"
      boxShadow={mobile ? 'none' : 'md'}
      py={4}
      px={mobile ? 4 : (collapsed ? 2 : 4)}
      display={{ base: mobile ? 'block' : 'none', md: mobile ? 'none' : 'block' }}
    >
      {!mobile && (
        <IconButton
          icon={<RxHamburgerMenu size={22} />}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          variant="ghost"
          color={accent}
          mb={6}
          onClick={() => setCollapsed((c) => !c)}
          _hover={{ bg: useColorModeValue('teal.50','teal.900') }}
          w="full"
        />
      )}
      <VStack align="stretch" spacing={3}>
        {!collapsed && <Heading size="sm" mb={2} color={accent}>Finance</Heading>}
        <SidebarItem icon={FiHome} label={collapsed && !mobile ? '' : 'Dashboard'} to="/finance-dashboard" />
        <SidebarItem icon={FiBarChart2} label={collapsed && !mobile ? '' : 'Financial Reports'} to="/finance-dashboard/reports" />
        <SidebarItem icon={FiBox} label={collapsed && !mobile ? '' : 'Inventory'} to="/finance-dashboard/inventory" />
        <SidebarItem icon={FiShoppingCart} label={collapsed && !mobile ? '' : 'Orders'} to="/finance-dashboard/orders" />
        <SidebarItem icon={FiDollarSign} label={collapsed && !mobile ? '' : 'Pricing'} to="/finance-dashboard/pricing" />
        <SidebarItem icon={FiDollarSign} label={collapsed && !mobile ? '' : 'Revenue'} to="/finance-dashboard/revenue" />
        <SidebarItem icon={FiUsers} label={collapsed && !mobile ? '' : 'Purchase'} to="/finance-dashboard/purchase" />
        <SidebarItem icon={FiShield} label={collapsed && !mobile ? '' : 'Costs'} to="/finance-dashboard/costs" />
        <SidebarItem icon={FiDollarSign} label={collapsed && !mobile ? '' : 'Payroll'} to="/finance-dashboard/payroll" />
        <SidebarItem icon={FiFileInvoice} label={collapsed && !mobile ? '' : 'Invoices'} to="/finance-dashboard/invoices" />
        <SidebarItem icon={FiDollarSign} label={collapsed && !mobile ? '' : 'Commission Approval'} to="/finance-dashboard/commission-approval" />
        {showNoticeBoard && (
          <SidebarItem 
            icon={FiMessageSquare} 
            label={collapsed && !mobile ? '' : 'Notice Board'} 
            to="/finance/messages" 
            unreadCount={unreadCount} 
          />
        )}
        <SidebarItem icon={FiDollarSign} label={collapsed && !mobile ? '' : 'Commission Approved'} to="/finance-dashboard/commission-approval" />
        {(!collapsed || mobile) && <>
          <Divider borderColor={accent} my={2} />
          <Text fontSize="xs" color={accent} whiteSpace="normal">Manage finance-related features</Text>
        </>}
      </VStack>
    </Box>
  );
};


const FinanceLayout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await getNotifications();
      const broadcastMessages = data.filter(msg => msg.type === 'general');
      const unread = broadcastMessages.filter(msg => !msg.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <Box minH="100vh" bg={pageBg}>
      <IconButton
        aria-label="Open finance navigation"
        icon={<FiMenu />}
        onClick={onOpen}
        position="fixed"
        top={4}
        left={4}
        zIndex="banner"
        colorScheme="teal"
      />
      {/* Drawer-based sidebar */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent maxW="80vw">
          <DrawerCloseButton />
          <DrawerBody p={0}>
            <Sidebar onClose={onClose} mobile unreadCount={unreadCount} showNoticeBoard />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <Box
        transition="margin-left 0.3s"
        minH="100vh"
      >
        <Box p={{ base: 2, sm: 4, md: 8 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default FinanceLayout;
