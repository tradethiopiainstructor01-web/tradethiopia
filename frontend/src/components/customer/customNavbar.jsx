import React, { useState } from "react";
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
  MenuDivider,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  VStack,
  useDisclosure,
  Link,
  Tooltip,
} from "@chakra-ui/react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { FiMenu, FiHome, FiUsers, FiBookOpen } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { useUserStore } from "../../store/user";
import { useNavigate } from "react-router-dom";

const Cnavbar = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure(); // For Drawer

  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const [notifications, setNotifications] = useState([]);

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userStatus");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  
  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <>
      <Box
        bgGradient="linear(to-r, #001f3f, blue.900, blue.700)"
        px={4}
        py={2}
        shadow="md"
        zIndex="1000"
        position="relative"
      >
        <Flex alignItems="center">
          {/* Menu button for mobile view */}
          <IconButton
            icon={<FiMenu />}
            aria-label="Open Menu"
            variant="ghost"
            color="white"
            display={{ base: "block", md: "none" }} // Show only on small screens
            onClick={onOpen}
          />

          {/* Title */}
          <Text fontWeight="bold" fontSize="lg" color="white" ml={2}>
            Customer Success
          </Text>

          <Spacer />

           {/* Icons and Profile */}
           <HStack spacing={4}>
            {/* Notifications Dropdown */}
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaBell />}
                aria-label="Notifications"
                variant="ghost"
                color="white"
              />
              <MenuList>
                {notifications.length > 0 ? (
                  <>
                    {notifications.map((notification) => (
                      <MenuItem key={notification.id}>
                        <Box>
                          <Text fontWeight="bold">{notification.message}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {notification.timestamp}
                          </Text>
                        </Box>
                      </MenuItem>
                    ))}
                    <MenuDivider />
                    <MenuItem onClick={clearNotifications}>Clear All</MenuItem>
                  </>
                ) : (
                  <MenuItem>
                    <Text>No new notifications</Text>
                  </MenuItem>
                )}
              </MenuList>
            </Menu>

            {/* Profile Dropdown */}
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaUserCircle fontSize="20px" />}
                aria-label="User Profile"
                variant="ghost"
                color="white"
              />
              <MenuList>
                <Box p={4}>
                  <Text fontWeight="bold" fontSize="lg">
                    {currentUser?.username || "User"}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {currentUser?.role || "Role not available"}
                  </Text>
                </Box>
                <MenuDivider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      {/* Drawer for Mobile Menu (Only Navigation Links) */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack align="start" spacing={4} mt={8}>
              <NavItem to="/Cdashboard" icon={<FiHome />} label="Dashboard" onClose={onClose} />
              <NavItem to="/CustomerFollowup" icon={<FiUsers />} label="Follow Up" onClose={onClose} />
              <NavItem to="/training" icon={<FiBookOpen />} label="Training" onClose={onClose} />
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

// Individual Nav Item Component
const NavItem = ({ to, icon, label, onClose }) => (
  <Tooltip label={label} placement="right" hasArrow>
    <Link
      as={RouterLink}
      to={to}
      _hover={{ textDecoration: "none", color: "blue.500" }}
      onClick={onClose}
      style={{ width: "100%" }}
    >
      <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.100" }}>
        {icon}
        <Text ml={3} whiteSpace="nowrap" fontSize="16px">
          {label}
        </Text>
      </Flex>
    </Link>
  </Tooltip>
);

export default Cnavbar;