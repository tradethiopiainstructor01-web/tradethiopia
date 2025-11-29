import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  HStack,
  Spacer,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  useColorMode,
  useDisclosure,
  MenuDivider,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FaBell, FaUserCircle, FaMoon, FaSun, FaStickyNote, FaBars } from 'react-icons/fa';
import NotesDrawer from './NoteDrawer';
import { useUserStore } from '../../store/user';
import { useNavigate } from 'react-router-dom';

const Snavbar = ({ onToggleSidebar }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });

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

  // Gradient background based on color mode
  const gradientBg = colorMode === 'light'
    ? 'linear(to-r, gray.800, blue.800, teal.500)'
    : 'linear(to-r, gray.800, blue.800, teal.600)';

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      bgGradient={gradientBg}
      px={4}
      py={3}
      shadow="md"
      transition="background 0.2s ease"
    >
      <Flex alignItems="center" justifyContent="space-between">
        {isMobile && (
          <IconButton
            icon={<FaBars />}
            aria-label="Toggle Sidebar"
            variant="ghost"
            color="white"
            onClick={onToggleSidebar}
            mr={2}
          />
        )}
        <Spacer />
        <HStack spacing={4}>
          <IconButton
            icon={<FaBell />}
            aria-label="Notifications"
            variant="ghost"
            color="white"
          />
          <IconButton
            icon={<FaStickyNote />}
            aria-label="Notes"
            variant="ghost"
            color="white"
            onClick={onOpen}
          />
          <IconButton
            icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
            aria-label="Toggle Theme"
            variant="ghost"
            color="white"
            onClick={toggleColorMode}
          />
          <Menu>
            <MenuButton>
              <Avatar
                name={currentUser?.username || "User"}
                size="sm"
                bg="teal.300"
                icon={<FaUserCircle fontSize="20px" />}
              />
            </MenuButton>
            <MenuList>
              <Box p={4}>
                <Text fontWeight="bold" fontSize="lg">{currentUser?.username || "User"}</Text>
                <Text fontSize="sm" color="gray.500">{currentUser?.role || "Role not available"}</Text>
              </Box>
              <MenuDivider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
      <NotesDrawer isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};

export default Snavbar;