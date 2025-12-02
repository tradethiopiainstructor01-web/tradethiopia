import React, { useState, useEffect } from "react";
import { 
  Box, 
  Flex, 
  HStack, 
  IconButton, 
  Text, 
  useColorModeValue,
  useDisclosure,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useBreakpointValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  VStack,
  Divider,
  Tooltip
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaBoxes, 
  FaBell, 
  FaStickyNote, 
  FaMoon, 
  FaSun, 
  FaUserCircle, 
  FaBars,
  FaHome,
  FaChartBar,
  FaShoppingCart,
  FaTruck,
  FaUsers,
  FaFileInvoice,
  FaCogs,
  FaArrowRight,
  FaDollarSign
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../../store/user';
import NotesDrawer from '../../components/sales/NoteDrawer';
import { useColorMode } from '@chakra-ui/react';

const FinanceLayout = ({ children }) => {
  const { isOpen: isSidebarOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isNotesOpen, onOpen: onNotesOpen, onClose: onNotesClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // State variables
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');
  
  // Get user data from Zustand store
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userStatus');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  // Color mode values
  const sidebarBg = useColorModeValue('gray.800', 'gray.900');
  const textColor = useColorModeValue('white', 'gray.100');
  const borderColor = useColorModeValue('whiteAlpha.300', 'whiteAlpha.200');
  const pageBg = useColorModeValue("#f5f8ff", "#0b1224");

  // Navigation items
  const navItems = [
    { label: 'Dashboard', icon: FaHome, path: '/finance-dashboard' },
    { label: 'Financial Reports', icon: FaChartBar, path: '/finance-dashboard/reports' },
    { label: 'Inventory', icon: FaBoxes, path: '/finance-dashboard/inventory' },
    { label: 'Orders', icon: FaShoppingCart, path: '/finance-dashboard/orders' },
    { label: 'Pricing', icon: FaDollarSign, path: '/finance-dashboard/pricing' },
    { label: 'Customers', icon: FaUsers, path: '/finance-dashboard/customers' },
    { label: 'Invoices', icon: FaFileInvoice, path: '/finance-dashboard/invoices' },
    { label: 'Settings', icon: FaCogs, path: '/finance-dashboard/settings' }
  ];

  // Set active item based on current location
  useEffect(() => {
    const currentItem = navItems.find(item => location.pathname === item.path);
    if (currentItem) {
      setActiveItem(currentItem.label);
    }
  }, [location.pathname]);

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  const getActiveItem = () => {
    const currentItem = navItems.find(item => isCurrentPath(item.path));
    return currentItem ? currentItem.label : 'Dashboard';
  };

  // Update active item when location changes
  useEffect(() => {
    setActiveItem(getActiveItem());
  }, [location.pathname]);

  const SidebarItem = ({ icon, label, path, isActive, onClick }) => {
    return (
      <Tooltip label={isSidebarCollapsed ? label : ''} placement="right" hasArrow>
        <HStack
          as="button"
          spacing={isSidebarCollapsed ? 0 : 3}
          p={isSidebarCollapsed ? 2 : 3}
          w="100%"
          bg={isActive ? 'teal.600' : 'gray.700'}
          _hover={{ bg: isActive ? 'teal.500' : 'gray.600', transform: 'translateX(2px)', transition: 'all 0.2s ease' }}
          borderRadius="lg"
          justifyContent={isSidebarCollapsed ? 'center' : 'flex-start'}
          transition="all 0.3s ease"
          onClick={onClick}
          boxShadow={isActive ? 'md' : 'sm'}
          cursor="pointer"
        >
          <Box as={icon} fontSize={isSidebarCollapsed ? "18px" : "20px"} />
          {!isSidebarCollapsed && <Text fontSize="sm" fontWeight="medium">{label}</Text>}
        </HStack>
      </Tooltip>
    );
  };

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      height="100vh" 
      bg={pageBg}
      color={useColorModeValue("gray.800", "whiteAlpha.900")}
    >
      {/* Main Container */}
      <Box display="flex" flex="1">
        {/* Sidebar for Larger Screens */}
        <Box
          position="fixed"
          top={0}
          left={0}
          width={isSidebarCollapsed ? "70px" : "240px"}
          height="100vh"
          transition="width 0.3s"
          display={{ base: "none", md: "block" }}
          zIndex="900"
          bg={sidebarBg}
          color={textColor}
        >
          <Flex direction="column" h="100%">
            <HStack justifyContent="space-between" alignItems="center" mb={4} mt={2} px={3}>
              {!isSidebarCollapsed && (
                <Text fontSize="sm" fontWeight="bold" textTransform="uppercase" color="teal.300">
                  Finance Portal
                </Text>
              )}
              <IconButton
                icon={isSidebarCollapsed ? <FaArrowRight /> : <FaArrowLeft />}
                aria-label="Toggle Sidebar"
                variant="ghost"
                color="white"
                onClick={toggleSidebar}
                size="xs"
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </HStack>
            <Divider mb={3} borderColor={borderColor} />
            <VStack align="stretch" spacing={1} px={2} flex="1">
              {navItems.map((item) => (
                <SidebarItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isActive={activeItem === item.label}
                  onClick={() => {
                    setActiveItem(item.label);
                    handleNavigation(item.path);
                  }}
                />
              ))}
            </VStack>
          </Flex>
        </Box>

        {/* Drawer for Mobile Screens */}
        <Drawer isOpen={isSidebarOpen} onClose={onClose} placement="left">
          <DrawerOverlay />
          <DrawerContent>
            <Flex direction="column" h="100%" bg={sidebarBg} color={textColor}>
              <HStack justifyContent="space-between" alignItems="center" mb={4} mt={2} px={3}>
                <Text fontSize="sm" fontWeight="bold" textTransform="uppercase" color="teal.300">
                  Finance Portal
                </Text>
                <IconButton
                  icon={<FaArrowLeft />}
                  aria-label="Close Sidebar"
                  variant="ghost"
                  color="white"
                  onClick={onClose}
                  size="xs"
                  _hover={{ bg: 'whiteAlpha.200' }}
                />
              </HStack>
              <Divider mb={3} borderColor={borderColor} />
              <VStack align="stretch" spacing={1} px={2} flex="1">
                {navItems.map((item) => (
                  <SidebarItem
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    path={item.path}
                    isActive={activeItem === item.label}
                    onClick={() => {
                      setActiveItem(item.label);
                      handleNavigation(item.path);
                    }}
                  />
                ))}
              </VStack>
            </Flex>
          </DrawerContent>
        </Drawer>

        {/* Main Content */}
        <Box
          ml={{
            base: 0,
            md: isSidebarCollapsed ? "70px" : "240px",
          }}
          transition="margin-left 0.3s"
          flex="1"
          width="100%"
          display="flex"
          flexDirection="column"
        >
          {/* Navbar */}
          <Box
            position="sticky"
            top={0}
            zIndex="100"
            bg={useColorModeValue("white", "gray.800")}
            boxShadow="sm"
            px={4}
            py={3}
          >
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                <IconButton
                  icon={<FaArrowLeft />}
                  aria-label="Back to Sales"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/sdashboard')}
                />
                <Text fontSize="lg" fontWeight="bold" color={useColorModeValue("teal.600", "teal.200")}>
                  Finance Dashboard
                </Text>
              </HStack>
              <HStack spacing={2}>
                <IconButton
                  display={{ base: "flex", md: "none" }}
                  icon={<FaBoxes />}
                  aria-label="Open Sidebar"
                  size="sm"
                  onClick={onOpen}
                />
                <IconButton
                  icon={<FaBell />}
                  aria-label="Notifications"
                  variant="ghost"
                  size="sm"
                />
                <IconButton
                  icon={<FaStickyNote />}
                  aria-label="Notes"
                  variant="ghost"
                  size="sm"
                  onClick={onNotesOpen}
                />
                <IconButton
                  icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                  aria-label="Toggle Theme"
                  variant="ghost"
                  size="sm"
                  onClick={toggleColorMode}
                />
                <Menu>
                  <MenuButton>
                    <Avatar
                      name={currentUser?.username || "User"}
                      size="sm"
                      bg="teal.300"
                      icon={<FaUserCircle fontSize="18px" />}
                    />
                  </MenuButton>
                  <MenuList>
                    <Box p={3}>
                      <Text fontWeight="bold" fontSize="md">{currentUser?.username || "User"}</Text>
                      <Text fontSize="xs" color="gray.500">{currentUser?.role || "Role not available"}</Text>
                    </Box>
                    <MenuDivider />
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>
          </Box>

          {/* Page Content */}
          <Box 
            flex="1"
            p={{ base: 4, md: 6 }} 
            pt={{ base: 6, md: 6 }}
            overflowY="auto"
          >
            {children}
          </Box>
        </Box>
      </Box>
      <NotesDrawer isOpen={isNotesOpen} onClose={onNotesClose} />
    </Box>
  );
};

export default FinanceLayout;