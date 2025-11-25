import React, { useState } from 'react';
import {
  Box,
  Flex,
  IconButton,
  Text,
  VStack,
  HStack,
  Divider,
  Tooltip,
  useBreakpointValue,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import {
  FaHome,
  FaChartLine,
  FaUsers,
  FaSignOutAlt,
  FaArrowLeft,
  FaArrowRight,
  FaVideo,
  FaBars,
} from 'react-icons/fa';
import FollowUpList from "../../components/FollowUpList";
import Training from './Training.jsx';
import PDFList from '../../components/PDFList';
import Dashboard from './SalesDashboard.jsx';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('Home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const toggleSidebar = () => {
    if (isMobile) {
      setIsDrawerOpen(!isDrawerOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'Home':
        return <Dashboard />;
      case 'Resources':
        return <PDFList />;
      case 'Users':
        return <FollowUpList />;
      case 'Tutorials':
        return <Training />;
      default:
        return <Text fontSize="xl">Select an option from the Sidebar.</Text>;
    }
  };

  return (
    <>
      {/* Drawer for mobile */}
      <Drawer isOpen={isDrawerOpen} placement="left" onClose={() => setIsDrawerOpen(false)}>
        <DrawerOverlay>
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerBody p={4}>
              <VStack align="stretch" spacing={4}>
                {['Home', 'Users', 'Resources', 'Tutorials'].map((label) => (
                  <SidebarItem
                    key={label}
                    icon={label === 'Home' ? FaHome : label === 'Users' ? FaUsers : label === 'Resources' ? FaChartLine : FaVideo}
                    label={label}
                    isActive={activeItem === label}
                    onClick={() => { setActiveItem(label); setIsDrawerOpen(false); }}
                  />
                ))}
                <SidebarItem
                  icon={FaSignOutAlt}
                  label="Logout"
                  onClick={() => alert('Logging out...')}
                />
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>

      <Flex>
        {/* Sidebar for larger screens */}
        <Box
          display={{ base: 'none', md: 'block' }} // Hide on mobile
          as="aside"
          position="relative"
          bg="gray.800"
          color="white"
          w={isCollapsed ? '70px' : '250px'}
          h="auto"
          p={4}
          transition="all 0.3s ease"
        >
          <Flex direction="column" h="auto" p={0}>
            <HStack justifyContent="space-between" alignItems="center" mb={6}>
              {!isCollapsed && (
                <Text fontSize="lg" fontWeight="bold" ml={2} textTransform="uppercase">
                  Sales Dashboard
                </Text>
              )}
              <IconButton
                icon={isCollapsed ? <FaArrowRight /> : <FaArrowLeft />}
                aria-label="Toggle Sidebar"
                variant="ghost"
                color="white"
                onClick={toggleSidebar}
                size="sm"
              />
            </HStack>
            <Divider mb={4} />
            <VStack align="stretch" spacing={4}>
            {/* 'Resources',  add this to the line of code below to add the resource feature */}
              {['Home', 'Tutorials'].map((label) => (
                <SidebarItem
                  key={label}
                  icon={label === 'Home' ? FaHome : label === 'Resources' ? FaChartLine : FaVideo}
                  label={label}
                  isCollapsed={isCollapsed}
                  isActive={activeItem === label}
                  onClick={() => setActiveItem(label)}
                />
              ))}
            </VStack>
          </Flex>
        </Box>

        {/* Main Content Area */}
        <Box
          flex="1"
          p={4}
          ml={{ base: 0, md: isCollapsed ? '90px' : '100px' }} // Adjust margin based on sidebar state
          transition="margin 0.3s ease"
        >
          {/* Sidebar toggle button for mobile */}
          {isMobile && (
            <IconButton
              icon={<FaBars />}
              onClick={toggleSidebar}
              aria-label="Open Sidebar"
              display={{ base: 'block', md: 'none' }} // Show only on mobile
              mb={4}
            />
          )}
          {renderContent()}
        </Box>
      </Flex>
    </>
  );
};

const SidebarItem = ({ icon, label, isCollapsed, isActive, onClick }) => {
  return (
    <Tooltip label={isCollapsed ? label : ''} placement="right" hasArrow>
      <HStack
        as="button"
        spacing={isCollapsed ? 0 : 4}
        p={2}
        w="100%"
        bg={isActive ? 'blue.600' : 'gray.700'}
        _hover={{ bg: isActive ? 'blue.500' : 'gray.600', transform: 'scale(1.05)', transition: 'all 0.2s ease' }}
        borderRadius="md"
        justifyContent={isCollapsed ? 'center' : 'flex-start'}
        transition="background 0.3s ease"
        onClick={onClick}
      >
        <Box as={icon} fontSize="20px" />
        {!isCollapsed && <Text fontSize="md">{label}</Text>}
      </HStack>
    </Tooltip>
  );
};

export default Sidebar;
