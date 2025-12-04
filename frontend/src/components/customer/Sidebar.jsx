import { useState, useRef } from "react";
import {
  Box,
  Flex,
  IconButton,
  VStack,
  Link,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import {
  FiHome,
  FiPlusCircle,
  FiMenu,
  FiUsers,
  // FiBook,
  FiBookOpen,
  FiGlobe,
  FiBook,
  FiFileText,
} from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { MdLibraryBooks } from "react-icons/md";
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { FiSettings } from "react-icons/fi";

const SSidebar = ({ isCollapsed: collapsedProp, toggleCollapse: toggleProp }) => {
  // Allow the sidebar to be controlled by a parent while preserving a local fallback.
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const scrollBoxRef = useRef(null);
  const location = useLocation();

  const isControlled = typeof collapsedProp === "boolean" && typeof toggleProp === "function";
  const isCollapsed = isControlled ? collapsedProp : internalCollapsed;
  const toggleCollapse = () => {
    if (isControlled) {
      toggleProp();
    } else {
      setInternalCollapsed((prevState) => !prevState);
    }
  };

  // Scroll up/down functions
  const scrollUp = () => {
    if (scrollBoxRef.current) {
      scrollBoxRef.current.scrollBy({ top: -100, behavior: "smooth" });
    }
  };
  const scrollDown = () => {
    if (scrollBoxRef.current) {
      scrollBoxRef.current.scrollBy({ top: 100, behavior: "smooth" });
    }
  };

  const isActive = (path) => location.pathname === path;

  const sidebarBg = useColorModeValue("linear-gradient(180deg, #f9fbff, #f1f5ff)", "linear-gradient(180deg, #0b1224, #0f1e3a)");
  const textColor = useColorModeValue("gray.800", "white");
  const accentColor = useColorModeValue("#2563eb", "teal.200");
  const iconColor = useColorModeValue("gray.600", "white");
  const activeIconColor = useColorModeValue("blue.600", "teal.200");
  const activeTextColor = useColorModeValue("blue.800", "white");

  return (
    <Box
      as="nav"
      width={isCollapsed ? "72px" : "240px"}
      minHeight="100vh"
      maxHeight="100vh"
      position="fixed"
      left={0}
      top={0}
      bgGradient={sidebarBg}
      color={textColor}
      transition="width 0.25s ease"
      zIndex="1000"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      boxShadow="lg"
      pos="relative"
    >
      {/* Sidebar Header */}
      <Flex
        justify={isCollapsed ? "center" : "space-between"}
        align="center"
        px={isCollapsed ? 0 : 4}
        py={4}
        flexShrink={0}
      >
        {!isCollapsed && (
          <Flex align="center" gap={2}>
            <Box w="10px" h="32px" bgGradient={useColorModeValue("linear(to-b, blue.400, purple.400)", "linear(to-b, teal.300, cyan.400)")} borderRadius="full" />
            <Text fontWeight="bold" fontSize="lg" letterSpacing="0.5px" color={textColor}>
              Customer Hub
            </Text>
          </Flex>
        )}
      </Flex>
      <IconButton
        icon={isCollapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
        variant="solid"
        colorScheme={isCollapsed ? "teal" : "blue"}
        size="sm"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={toggleCollapse}
        position="absolute"
        top="12px"
        right={isCollapsed ? "6px" : "10px"}
        borderRadius="full"
        boxShadow="md"
      />

      {/* Scroll Up Button */}
      {/* <Flex justify="center" align="center" p={1}>
        <IconButton
          icon={<span style={{fontSize:18}}>&uarr;</span>}
          variant="ghost"
          color="white"
          aria-label="Scroll Up"
          onClick={scrollUp}
          size="sm"
        />
      </Flex> */}

      {/* Sidebar Links with scroll */}
  <Box flex="1" overflowY="auto" minHeight={0} maxHeight="100vh" ref={scrollBoxRef}>
        <VStack align="start" spacing={4} p={2}>
          <SidebarLink
            isCollapsed={isCollapsed}
            to="/Cdashboard"
            icon={<FiHome />}
            label="Dashboard"
            active={isActive("/Cdashboard")}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
          />
                    <SidebarLink
            isCollapsed={isCollapsed}
            to="/b2b-dashboard"
            icon={<FiGlobe />}
            label="B2B Marketplace"
            active={isActive("/b2b-dashboard")}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
          />
          <SidebarLink
            isCollapsed={isCollapsed}
            to="/CustomerFollowup"
            icon={<FiUsers />}
            label="Follow Up"
            active={isActive("/CustomerFollowup")}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
          />
          <SidebarLink
            isCollapsed={isCollapsed}
            to="/CustomerReport"
            icon={<FiBookOpen />}
            label="Customer Report"
            active={isActive("/CustomerReport")}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
          />

          <SidebarLink
            isCollapsed={isCollapsed}
            to="/followup-report"
            icon={<FiFileText />}
            label="Follow-up Report"
            active={isActive("/followup-report")}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
          />

          <SidebarLink
            isCollapsed={isCollapsed}
            to="/training"
            icon={<FiBook />}
            label="Training"
            active={isActive("/training")}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
          />
          <SidebarLink
            isCollapsed={isCollapsed}
            to="/customer-settings"
            icon={<FiSettings />}
            label="Customer Settings"
            active={isActive("/customer-settings")}
            iconColor={iconColor}
            activeIconColor={activeIconColor}
            textColor={textColor}
            activeTextColor={activeTextColor}
          />

          {/* Removed Resources link as requested */}
        </VStack>
      </Box>

      {/* Scroll Down Button */}
      <Flex justify="center" align="center" p={1}>
        <IconButton
          icon={<span style={{fontSize:18}}>&darr;</span>}
          variant="ghost"
          color="white"
          aria-label="Scroll Down"
          onClick={scrollDown}
          size="sm"
        />
      </Flex>
    </Box>
  );
};

/* Sidebar Link Component */
const SidebarLink = ({ isCollapsed, to, icon, label, active, iconColor, activeIconColor, textColor, activeTextColor }) => (
  <Tooltip label={label} isDisabled={!isCollapsed} placement="right" hasArrow>
    <Link
      as={RouterLink}
      to={to}
      _hover={{ textDecoration: "none" }}
      aria-label={label}
    >
      <Flex
        align="center"
        p={2}
        borderRadius="md"
        bg={active ? "rgba(56, 189, 248, 0.15)" : "transparent"}
        border={active ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid transparent"}
        _hover={{ bg: "rgba(56, 189, 248, 0.08)", borderColor: "rgba(56, 189, 248, 0.3)" }}
        transition="all 0.2s ease"
      >
        <Box color={active ? activeIconColor : iconColor} fontSize="18px">
          {icon}
        </Box>
        {!isCollapsed && (
          <Text ml={3} whiteSpace="nowrap" fontSize="14px" color={active ? activeTextColor : textColor}>
            {label}
          </Text>
        )}
      </Flex>
    </Link>
  </Tooltip>
);

export default SSidebar;
