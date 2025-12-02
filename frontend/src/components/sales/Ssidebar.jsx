import React from 'react';
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
} from '@chakra-ui/react';
import {
  FaHome,
  FaChartLine,
  FaUsers,
  FaArrowLeft,
  FaArrowRight,
  FaVideo,
  FaMoneyBillWave,
  FaShoppingCart
} from 'react-icons/fa';

const SSidebar = ({ isCollapsed, toggleCollapse, activeItem, setActiveItem }) => {
  // Color mode values
  const sidebarBg = useColorModeValue('gray.800', 'gray.900');
  const textColor = useColorModeValue('white', 'gray.100');
  const borderColor = useColorModeValue('whiteAlpha.300', 'whiteAlpha.200');

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
        {/* {['Home', 'Followup', 'Finance', 'Orders', 'Tutorials'].map((label) => ( */}
          {['Home', 'Followup', 'Orders', 'Tutorials'].map((label) => (
          <SidebarItem
            key={label}
            icon={
              label === 'Home'
                ? FaHome
                : label === 'Followup'
                // ? FaUsers
                // : label === 'Finance'
                ? FaMoneyBillWave
                : label === 'Orders'
                ? FaShoppingCart
                : label === 'Resources'
                ? FaChartLine
                : FaVideo
            }
            label={label}
            isCollapsed={isCollapsed}
            isActive={activeItem === label}
            onClick={() => setActiveItem(label)}
          />
        ))}
      </VStack>
    </Flex>
  );
};

const SidebarItem = ({ icon, label, isCollapsed, isActive, onClick }) => {
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
      >
        <Box as={icon} fontSize="20px" />
        {!isCollapsed && <Text fontSize="md" fontWeight="medium">{label}</Text>}
      </HStack>
    </Tooltip>
  );
};

export default SSidebar;