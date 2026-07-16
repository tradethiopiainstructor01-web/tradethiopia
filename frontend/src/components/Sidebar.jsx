import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  IconButton,
  VStack,
  Link,
  Text,
  Icon,
  useBreakpointValue,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { FiFolder, FiHome, FiMenu, FiUsers, FiBookOpen, FiSearch, FiBriefcase, FiBarChart, FiDollarSign, FiMessageSquare, FiFileText, FiAward, FiLayers, FiChevronLeft } from "react-icons/fi";
import { Link as RouterLink, useLocation } from "react-router-dom";

const SidebarItem = ({ to, icon, label, isCollapsed, isActive }) => {
  const activeBg = useColorModeValue("blue.50", "rgba(59, 130, 246, 0.12)");
  const activeColor = useColorModeValue("blue.600", "blue.400");
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const textColor = useColorModeValue("gray.600", "gray.400");

  return (
    <Link as={RouterLink} to={to} _hover={{ textDecoration: "none" }} w="full">
      <Flex
        align="center"
        px={isCollapsed ? 0 : 3}
        py={2.5}
        mx={isCollapsed ? 1 : 2}
        borderRadius="xl"
        bg={isActive ? activeBg : "transparent"}
        color={isActive ? activeColor : textColor}
        fontWeight={isActive ? "600" : "500"}
        fontSize="13px"
        transition="all 0.15s ease"
        _hover={{ bg: isActive ? activeBg : hoverBg, color: isActive ? activeColor : useColorModeValue("gray.900", "white") }}
        justify={isCollapsed ? "center" : "flex-start"}
        position="relative"
        role="group"
      >
        {isActive && (
          <Box
            position="absolute"
            left={isCollapsed ? "auto" : "-2px"}
            top="50%"
            transform="translateY(-50%)"
            w="3px"
            h="20px"
            bg={activeColor}
            borderRadius="full"
          />
        )}
        <Icon as={icon} boxSize="18px" flexShrink={0} />
        {!isCollapsed && <Text ml={3} noOfLines={1}>{label}</Text>}
      </Flex>
    </Link>
  );
};

const SectionLabel = ({ label, isCollapsed }) => {
  const labelColor = useColorModeValue("gray.400", "gray.600");
  if (isCollapsed) return <Divider my={2} borderColor={useColorModeValue("gray.200", "gray.800")} />;
  return (
    <Text
      px={4}
      pt={4}
      pb={1.5}
      fontSize="10px"
      fontWeight="700"
      textTransform="uppercase"
      letterSpacing="0.1em"
      color={labelColor}
    >
      {label}
    </Text>
  );
};

const Sidebar = ({ isCollapsed: controlledIsCollapsed, onToggleCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const breakpointValue = useBreakpointValue({ base: true, md: false });
  const location = useLocation();

  const effectiveIsCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : isCollapsed;

  useEffect(() => {
    if (controlledIsCollapsed === undefined) {
      setIsCollapsed(breakpointValue);
    }
  }, [breakpointValue, controlledIsCollapsed]);

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setIsCollapsed((prevState) => !prevState);
    }
  };

  const bg = useColorModeValue("white", "#0f172a");
  const borderColor = useColorModeValue("gray.200", "rgba(255,255,255,0.06)");

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Box
      as="nav"
      width={effectiveIsCollapsed ? "60px" : "220px"}
      height="100vh"
      position="fixed"
      left={0}
      top={0}
      bg={bg}
      borderRight="1px solid"
      borderColor={borderColor}
      transition="width 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex="10"
      pt="68px"
      overflowY="auto"
      overflowX="hidden"
    >
      {/* Collapse Toggle */}
      <Flex justify={effectiveIsCollapsed ? "center" : "flex-end"} px={2} py={3}>
        <IconButton
          icon={<Icon as={effectiveIsCollapsed ? FiMenu : FiChevronLeft} boxSize={4} />}
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          aria-label="Toggle Sidebar"
          borderRadius="lg"
          color={useColorModeValue("gray.500", "gray.400")}
          _hover={{ bg: useColorModeValue("gray.100", "whiteAlpha.100") }}
        />
      </Flex>

      {/* Navigation Links */}
      <VStack align="stretch" spacing={0.5}>
        <SectionLabel label="Main" isCollapsed={effectiveIsCollapsed} />
        <SidebarItem to="/dashboard" icon={FiHome} label="Dashboard" isCollapsed={effectiveIsCollapsed} isActive={isActive("/dashboard")} />
        <SidebarItem to="/users" icon={FiUsers} label="Accounts" isCollapsed={effectiveIsCollapsed} isActive={isActive("/users")} />
        <SidebarItem to="/assets" icon={FiBriefcase} label="Assets" isCollapsed={effectiveIsCollapsed} isActive={isActive("/assets")} />

        <SectionLabel label="Documents" isCollapsed={effectiveIsCollapsed} />
        <SidebarItem to="/documentlist" icon={FiBookOpen} label="Company Docs" isCollapsed={effectiveIsCollapsed} isActive={isActive("/documentlist")} />
        <SidebarItem to="/EmployeeDocument" icon={FiFolder} label="Employee Docs" isCollapsed={effectiveIsCollapsed} isActive={isActive("/EmployeeDocument")} />

        <SectionLabel label="HR Tools" isCollapsed={effectiveIsCollapsed} />
        <SidebarItem to="/payroll" icon={FiDollarSign} label="Payroll" isCollapsed={effectiveIsCollapsed} isActive={isActive("/payroll")} />
        <SidebarItem to="/course" icon={FiBookOpen} label="Course Editor" isCollapsed={effectiveIsCollapsed} isActive={isActive("/course")} />
        <SidebarItem to="/candidate-pool" icon={FiLayers} label="Candidate Pool" isCollapsed={effectiveIsCollapsed} isActive={isActive("/candidate-pool")} />
        <SidebarItem to="/hr-training" icon={FiBookOpen} label="HR Training" isCollapsed={effectiveIsCollapsed} isActive={isActive("/hr-training")} />
        <SidebarItem to="/quiz" icon={FiSearch} label="Quiz Center" isCollapsed={effectiveIsCollapsed} isActive={isActive("/quiz")} />

        <SectionLabel label="CRM" isCollapsed={effectiveIsCollapsed} />
        <SidebarItem to="/FollowUpList" icon={FiUsers} label="Customer List" isCollapsed={effectiveIsCollapsed} isActive={isActive("/FollowUpList")} />
        <SidebarItem to="/awards" icon={FiAward} label="Awards" isCollapsed={effectiveIsCollapsed} isActive={isActive("/awards")} />

        <SectionLabel label="Communication" isCollapsed={effectiveIsCollapsed} />
        <SidebarItem to="/chat" icon={FiMessageSquare} label="Workspace Chat" isCollapsed={effectiveIsCollapsed} isActive={isActive("/chat")} />
        <SidebarItem to="/customer/messages" icon={FiFileText} label="Notes Board" isCollapsed={effectiveIsCollapsed} isActive={isActive("/customer/messages")} />
      </VStack>
    </Box>
  );
};

export default Sidebar;
