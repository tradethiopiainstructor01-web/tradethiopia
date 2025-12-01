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
  useColorMode,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { FiMenu, FiHome, FiUsers, FiBookOpen } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { useUserStore } from "../../store/user";
import { useNavigate } from "react-router-dom";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

const Cnavbar = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure(); // For Drawer
  const { colorMode, toggleColorMode } = useColorMode();
  const navbarBg = useColorModeValue(
    "linear-gradient(90deg, #e9f2ff, #dfe9ff, #d6e1ff)",
    "linear-gradient(90deg, #0b1224, #0f1e3a, #0b284a)"
  );
  const accentBar = useColorModeValue("linear(to-b, blue.400, purple.400)", "linear(to-b, teal.300, cyan.400)");
  const textPrimary = useColorModeValue("gray.800", "white");
  const textSecondary = useColorModeValue("gray.600", "teal.100");

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
        bgGradient={navbarBg}
        px={5}
        py={3}
        shadow="xl"
        borderBottom="1px solid"
        borderColor={useColorModeValue("rgba(0,0,0,0.06)", "rgba(255,255,255,0.08)")}
        zIndex="1000"
        position="relative"
      >
        <Flex alignItems="center" gap={3}>
          {/* Menu button for mobile view */}
          <IconButton
            icon={<FiMenu />}
            aria-label="Open Menu"
            variant="ghost"
            color={useColorModeValue("blue.500", "teal.200")}
            display={{ base: "block", md: "none" }} // Show only on small screens
            onClick={onOpen}
          />

          {/* Title */}
          <Flex align="center" gap={3}>
            <Box
              w="12px"
              h="36px"
              bgGradient={accentBar}
              borderRadius="full"
            />
            <Box>
              <Text fontWeight="bold" fontSize="lg" color={textPrimary}>
                Customer Success
              </Text>
              <Text fontSize="xs" color={textSecondary} letterSpacing="0.5px">
                Follow-up & Engagement
              </Text>
            </Box>
          </Flex>

          <Spacer />

           {/* Icons and Profile */}
           <HStack spacing={4}>
            <Tooltip label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}>
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="ghost"
                color={useColorModeValue("blue.600", "yellow.300")}
              />
            </Tooltip>
            {/* Notifications Dropdown */}
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaBell />}
                aria-label="Notifications"
                variant="ghost"
                color={textPrimary}
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
                color={textPrimary}
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
