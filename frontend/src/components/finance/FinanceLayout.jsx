import React, { useState } from 'react';
import {
  Box,
  Flex,
  IconButton,
  Avatar,
  HStack,
  VStack,
  Text,
  Link,
  Heading,
  useColorModeValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useDisclosure,
  Button,
  Divider,
  useColorMode,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { FiMenu, FiHome, FiBox, FiBarChart2, FiCreditCard, FiSun, FiMoon } from 'react-icons/fi';
import { RxHamburgerMenu } from 'react-icons/rx';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user';

const SidebarItem = ({ icon: Icon, label, to }) => {
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
      >
        <Box as={Icon} boxSize={5} />
        <Text fontSize="sm">{label}</Text>
      </HStack>
    </RouterLink>
  );
};

const Sidebar = ({ onClose, mobile = false }) => {
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
        <SidebarItem icon={FiHome} label={collapsed && !mobile ? '' : 'Dashboard'} to="/finance" />
        <SidebarItem icon={FiBox} label={collapsed && !mobile ? '' : 'Inventory'} to="/finance/inventory" />
        <SidebarItem icon={FiBox} label={collapsed && !mobile ? '' : 'Orders'} to="/finance/orders" />
        <SidebarItem icon={FiBarChart2} label={collapsed && !mobile ? '' : 'Reports'} to="/finance/reports" />
        <SidebarItem icon={FiCreditCard} label={collapsed && !mobile ? '' : 'Transactions'} to="/finance/transactions" />
        <SidebarItem icon={FiBox} label={collapsed && !mobile ? '' : 'Demands'} to="/finance/demands" />
        {(!collapsed || mobile) && <>
          <Divider borderColor={accent} my={2} />
          <Text fontSize="xs" color={accent} whiteSpace="normal">Manage finance-related features</Text>
        </>}
      </VStack>
    </Box>
  );
};


const Topbar = ({ onOpen }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const topBg = useColorModeValue('whiteAlpha.900', 'gray.800');
  const accentBorder = useColorModeValue('teal.100', 'teal.900');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const currentUser = useUserStore((state) => state.currentUser);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Flex
      justify="space-between"
      align="center"
      px={{ base: 2, md: 6 }}
      height="64px"
      bg={topBg}
      boxShadow="sm"
      borderBottom="2px solid"
      borderColor={accentBorder}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <HStack spacing={4}>
        {/* Burger menu for mobile */}
        <Box display={{ base: 'block', md: 'none' }}>
          <IconButton icon={<RxHamburgerMenu size={22} />} variant="ghost" color={useColorModeValue('teal.600','teal.200')} onClick={onOpen} aria-label="Open menu" />
        </Box>
        <Heading size="sm" color={useColorModeValue('teal.700','teal.200')} letterSpacing="wider">Finance Dashboard</Heading>
      </HStack>
      <HStack spacing={3}>
        <IconButton
          aria-label="Toggle color mode"
          icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
          onClick={toggleColorMode}
          variant="ghost"
          color={useColorModeValue('teal.600','teal.200')}
        />
        <Menu>
          <MenuButton as={Avatar} size="sm" name={currentUser?.username || 'User'} cursor="pointer" />
          <MenuList>
            <Box p={3} textAlign="center">
              <Avatar size="lg" name={currentUser?.username} mb={2} />
              <Text fontSize="lg" fontWeight="bold">{currentUser?.username}</Text>
              <Text fontSize="md">Role: {currentUser?.role}</Text>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};

const FinanceLayout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const pageBg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box minH="100vh" bg={pageBg}>
      {/* Topbar always at the top */}
      <Topbar onOpen={onOpen} />
      {/* Sidebar for desktop, fixed and flush with topbar */}
      {/* Desktop sidebar */}
      <Sidebar />
      {/* Mobile drawer */}
      {/* Mobile sidebar in Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent maxW="80vw">
          <DrawerCloseButton />
          <DrawerBody p={0}>
            <Sidebar onClose={onClose} mobile />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      {/* Main content, margin left for sidebar on desktop, padding for spacing */}
      <Box
        ml={{ base: 0, md: '220px' }}
        pt={{ base: '64px', md: 0 }}
        transition="margin-left 0.3s"
        minH="calc(100vh - 64px)"
      >
        <Box p={{ base: 2, sm: 4, md: 8 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default FinanceLayout;
