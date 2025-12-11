import React, { useState, useEffect } from 'react';
import { 
  VStack, 
  Box, 
  IconButton, 
  Tooltip, 
  Text, 
  Flex, 
  Button,
  Divider,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Icon,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import { 
  FiHome, 
  FiList, 
  FiFileText, 
  FiSettings, 
  FiUser, 
  FiActivity, 
  FiChevronDown,
  FiBell,
  FiMessageSquare
} from 'react-icons/fi';
import { getNotifications } from '../../services/notificationService';

const NavButton = ({ icon, label, active, onClick, colorScheme, unreadCount = 0 }) => (
  <Tooltip label={label} placement="right" hasArrow>
    <Button
      leftIcon={icon}
      justifyContent={{ base: 'center', lg: 'flex-start' }}
      variant={active ? 'solid' : 'ghost'}
      colorScheme={active ? colorScheme : 'gray'}
      onClick={onClick}
      w="full"
      size={{ base: 'md', lg: 'lg' }}
      borderRadius="lg"
      fontWeight="normal"
      position="relative"
    >
      <Text display={{ base: 'none', lg: 'block' }}>{label}</Text>
      {unreadCount > 0 && label === 'Notice Board' && (
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
    </Button>
  </Tooltip>
);

const ITSidebar = ({ active, setActive }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
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
    <Box height="100%" display="flex" flexDirection="column">
      <Flex direction="column" flex="1">
        {/* Brand */}
        <Box px={{ base: 0, lg: 4 }} py={6} textAlign={{ base: 'center', lg: 'left' }}>
          <Text 
            fontWeight="bold" 
            fontSize={{ base: 'lg', lg: '2xl' }} 
            display={{ base: 'none', lg: 'block' }}
            bgGradient="linear(to-r, blue.500, purple.500)"
            bgClip="text"
          >
            IT Dashboard
          </Text>
          <Text 
            fontWeight="bold" 
            fontSize="lg" 
            display={{ base: 'block', lg: 'none' }}
            bgGradient="linear(to-r, blue.500, purple.500)"
            bgClip="text"
          >
            IT
          </Text>
        </Box>

        {/* Navigation */}
        <VStack spacing={2} align={{ base: 'center', lg: 'stretch' }} px={{ lg: 2 }} flex="1">
          <NavButton 
            icon={<FiHome />} 
            label="Dashboard" 
            active={active === 'dashboard'} 
            onClick={() => setActive('dashboard')} 
            colorScheme="blue"
          />
          
          <Box w="full" mt={6}>
            <Text 
              display={{ base: 'none', lg: 'block' }} 
              px={4} 
              py={2} 
              color="gray.500" 
              fontSize="xs" 
              fontWeight="bold"
              letterSpacing="wide"
            >
              PROJECTS
            </Text>
          </Box>
          
          <NavButton 
            icon={<FiList />} 
            label="External Tasks" 
            active={active === 'external'} 
            onClick={() => setActive('external')} 
            colorScheme="purple"
          />
          
          <NavButton 
            icon={<FiList />} 
            label="Internal Tasks" 
            active={active === 'internal'} 
            onClick={() => setActive('internal')} 
            colorScheme="blue"
          />
          
          <NavButton 
            icon={<FiFileText />} 
            label="Reports" 
            active={active === 'reports'} 
            onClick={() => setActive('reports')} 
            colorScheme="green"
          />
          
          <NavButton 
            icon={<FiMessageSquare />} 
            label="Notice Board" 
            active={active === 'notice-board'} 
            onClick={() => {
              setActive('notice-board');
              fetchUnreadCount();
            }} 
            colorScheme="teal"
            unreadCount={unreadCount}
          />
          
          <Box w="full" mt={6}>
            <Text 
              display={{ base: 'none', lg: 'block' }} 
              px={4} 
              py={2} 
              color="gray.500" 
              fontSize="xs" 
              fontWeight="bold"
              letterSpacing="wide"
            >
              SETTINGS
            </Text>
          </Box>
          
          <NavButton 
            icon={<FiSettings />} 
            label="Settings" 
            active={active === 'settings'} 
            onClick={() => setActive('settings')} 
            colorScheme="gray"
          />
        </VStack>
      </Flex>

      {/* User Profile */}
      <Box borderTop={`1px solid ${borderColor}`} py={4}>
        <Menu>
          <MenuButton
            as={Button}
            variant="ghost"
            w="full"
            py={3}
            borderRadius="lg"
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
          >
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Avatar size="sm" name="Admin User" src="" />
                <Box display={{ base: 'none', lg: 'block' }} textAlign="left">
                  <Text fontWeight="medium" fontSize="sm">Admin User</Text>
                  <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                    IT Administrator
                  </Text>
                </Box>
              </HStack>
              <Icon 
                as={FiChevronDown} 
                display={{ base: 'none', lg: 'block' }} 
                color={useColorModeValue('gray.500', 'gray.400')} 
              />
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<FiUser />}>Profile</MenuItem>
            <MenuItem icon={<FiActivity />}>Activity Log</MenuItem>
            <MenuDivider />
            <MenuItem>Sign Out</MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </Box>
  );
};

export default ITSidebar;
