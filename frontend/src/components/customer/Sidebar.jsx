import { useState, useRef } from "react";
import {
  Box,
  Flex,
  IconButton,
  VStack,
  Link,
  Text,
  Tooltip,
} from "@chakra-ui/react";
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

const SSidebar = ({ isCollapsed: collapsedProp, toggleCollapse: toggleProp }) => {
  // Allow the sidebar to be controlled by a parent while preserving a local fallback.
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const scrollBoxRef = useRef(null);

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

  return (
    <Box
      as="nav"
      width={isCollapsed ? "70px" : "200px"}
      minHeight="100vh"
      maxHeight="100vh"
      position="fixed"
      left={0}
      top={0}
      bg="#001f3f"
      color="white"
      transition="width 0.3s"
      zIndex="1000"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Sidebar Header */}
      <Flex
        justify={isCollapsed ? "center" : "flex-start"}
        align="center"
        p={4}
        flexShrink={0}
      >
        {!isCollapsed && (
          <Text fontWeight="bold" fontSize="lg" color="white">
            Customer Service
          </Text>
        )}
      </Flex>

      {/* Collapse Toggle Button */}
      <Flex justify="flex-end" align="center" p={4} flexShrink={0}>
        <IconButton
          icon={<FiMenu />}
          variant="ghost"
          color="white"
          onClick={toggleCollapse}
          aria-label="Toggle Sidebar"
        />
      </Flex>

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
          />
                    <SidebarLink
            isCollapsed={isCollapsed}
            to="/b2b-dashboard"
            icon={<FiGlobe />}
            label="B2B Marketplace"
          />
          <SidebarLink
            isCollapsed={isCollapsed}
            to="/CustomerFollowup"
            icon={<FiUsers />}
            label="Follow Up"
          />
          <SidebarLink
            isCollapsed={isCollapsed}
            to="/CustomerReport"
            icon={<FiBookOpen />}
            label="Customer Report"
          />

          <SidebarLink
            isCollapsed={isCollapsed}
            to="/training"
            icon={<FiBook />}
            label="Training"
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
const SidebarLink = ({ isCollapsed, to, icon, label }) => (
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
        _hover={{ bg: "#003366" }}
        transition="background-color 0.3s ease"
      >
        {icon}
        {!isCollapsed && (
          <Text ml={3} whiteSpace="nowrap" fontSize="14px">
            {label}
          </Text>
        )}
      </Flex>
    </Link>
  </Tooltip>
);

export default SSidebar;
