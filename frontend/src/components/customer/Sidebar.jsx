import { useRef } from "react";
import {
  Box,
  Flex,
  VStack,
  Text,
  Link,
  Tooltip,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiHome,
  FiUsers,
  FiBookOpen,
  FiFileText,
  FiSettings,
  FiGlobe,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

import { useLocation, Link as RouterLink } from "react-router-dom";

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const scrollBoxRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const bgGlass = useColorModeValue(
    "rgba(255,255,255,0.65)",
    "rgba(20, 30, 55, 0.55)"
  );

  const border = useColorModeValue(
    "1px solid rgba(0,0,0,0.06)",
    "1px solid rgba(255,255,255,0.08)"
  );

  return (
    <Box
      h="100%"
      w="100%"
      bg={bgGlass}
      backdropFilter="blur(18px)"
      borderRight={border}
      transition="all .25s ease"
      overflow="hidden"
      shadow="xl"
      pos="relative"
    >
      {/* Collapse Button */}
      <IconButton
        icon={isCollapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
        position="absolute"
        right={isCollapsed ? "4px" : "-10px"}
        top="10px"
        size="sm"
        colorScheme="blue"
        borderRadius="full"
        shadow="md"
        onClick={toggleCollapse}
        zIndex="10"
      />

      {/* MENU CONTENT */}
      <Box
        ref={scrollBoxRef}
        mt="50px"
        px={isCollapsed ? 2 : 3}
        overflowY="auto"
        h="calc(100% - 50px)"
      >
        <VStack spacing={2} align="stretch">
          <SidebarItem
            to="/Cdashboard"
            icon={<FiHome />}
            label="Dashboard"
            active={isActive("/Cdashboard")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            to="/b2b-dashboard"
            icon={<FiGlobe />}
            label="B2B Marketplace"
            active={isActive("/b2b-dashboard")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            to="/CustomerFollowup"
            icon={<FiUsers />}
            label="Follow Up"
            active={isActive("/CustomerFollowup")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            to="/CustomerReport"
            icon={<FiBookOpen />}
            label="Customer Report"
            active={isActive("/CustomerReport")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            to="/followup-report"
            icon={<FiFileText />}
            label="Follow-up Report"
            active={isActive("/followup-report")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            to="/training"
            icon={<FiBookOpen />}
            label="Training"
            active={isActive("/training")}
            collapsed={isCollapsed}
          />

          <SidebarItem
            to="/customer-settings"
            icon={<FiSettings />}
            label="Customer Settings"
            active={isActive("/customer-settings")}
            collapsed={isCollapsed}
          />
        </VStack>
      </Box>
    </Box>
  );
};

const SidebarItem = ({ to, icon, label, active, collapsed }) => {
  const activeColor = useColorModeValue("#1d4ed8", "#5ad4ff");

  return (
    <Tooltip label={label} placement="right" isDisabled={!collapsed}>
      <Link as={RouterLink} to={to} _hover={{ textDecoration: "none" }}>
        <Flex
          align="center"
          p={2}
          borderRadius="md"
          gap={3}
          bg={active ? "rgba(46,141,255,0.18)" : "transparent"}
          borderLeft={active ? `4px solid ${activeColor}` : "4px solid transparent"}
          transition="all .25s ease"
          _hover={{
            bg: "rgba(46,141,255,0.10)",
            transform: "translateX(4px)",
          }}
        >
          <Box fontSize="20px" color={active ? activeColor : "gray.400"}>
            {icon}
          </Box>

          {!collapsed && (
            <Text
              fontSize="15px"
              fontWeight={active ? "600" : "500"}
              color={active ? activeColor : "gray.600"}
            >
              {label}
            </Text>
          )}
        </Flex>
      </Link>
    </Tooltip>
  );
};

export default Sidebar;
