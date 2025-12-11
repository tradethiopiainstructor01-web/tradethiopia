import {
  Box,
  Flex,
  IconButton,
  VStack,
  Link,
  Text,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiFolder, FiHome, FiMenu, FiUsers, FiBookOpen, FiSearch, FiBriefcase, FiBarChart, FiDollarSign, FiFileText } from "react-icons/fi";
import { Link as RouterLink, useLocation } from "react-router-dom";

const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();

  const sidebarGradient = useColorModeValue(
    "linear(to-b, #0f172a, #0f172a)",
    "linear(to-b, #020617, #0c0e1b)"
  );
  const textColor = useColorModeValue("gray.100", "gray.200");
  const hoverBg = useColorModeValue("rgba(255,255,255,0.08)", "rgba(255,255,255,0.1)");
  const activeBorder = useColorModeValue("cyan.400", "cyan.300");

  const links = [
    { label: "Dashboard", path: "/dashboard", icon: FiHome },
    { label: "Account Management", path: "/users", icon: FiUsers },
    { label: "Asset Management", path: "/assets", icon: FiBriefcase },
    { label: "Company Documents", path: "/documentlist", icon: FiBookOpen },
    { label: "Employee Document", path: "/EmployeeDocument", icon: FiFolder },
    { label: "Quiz Center", path: "/quiz", icon: FiSearch },
    { label: "Customer List", path: "/FollowUpList", icon: FiUsers },
    { label: "Customer Report", path: "/adminCustomerReport", icon: FiFileText },
    { label: "Training", path: "/admin-training-upload", icon: FiBookOpen },
    { label: "Payroll", path: "/payroll", icon: FiDollarSign },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Box
      as="nav"
      width={isCollapsed ? "70px" : "260px"}
      height="100vh"
      position="fixed"
      left={0}
      top={0}
      bgGradient={sidebarGradient}
      color={textColor}
      transition="width 0.3s"
      zIndex="1"
      paddingTop="80px"
      borderRightWidth="1px"
      borderRightColor="rgba(255,255,255,0.1)"
      boxShadow="dark-lg"
    >
      <Flex
        align="center"
        justify="flex-end"
        px={isCollapsed ? 3 : 5}
        mb={6}
        transition="padding 0.3s"
      >
        <IconButton
          icon={<FiMenu />}
          variant="ghost"
          color="white"
          onClick={onToggleCollapse}
          aria-label="Toggle Sidebar"
          size="sm"
        />
      </Flex>

      <VStack align="stretch" spacing={1} px={isCollapsed ? 2 : 4}>
        {links.map(({ label, path, icon: Icon }) => (
          <Link
            as={RouterLink}
            to={path}
            key={label}
            _hover={{ textDecoration: "none" }}
          >
            <Flex
              align="center"
              gap={isCollapsed ? 0 : 3}
              px={3}
              py={2}
              borderRadius="md"
              bg={isActive(path) ? hoverBg : "transparent"}
              borderLeft={isActive(path) ? "4px solid" : "4px solid transparent"}
              borderLeftColor={isActive(path) ? activeBorder : "transparent"}
              transition="all 0.2s"
            >
              <Icon />
              {!isCollapsed && <Text>{label}</Text>}
            </Flex>
          </Link>
        ))}
      </VStack>

      {!isCollapsed && <Divider my={6} borderColor="rgba(255,255,255,0.2)" />}

      {!isCollapsed && (
        <Box px={4}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="gray.400">
            Productivity tools
          </Text>
          <Flex mt={2} align="center" gap={2} color="gray.300">
            <FiBarChart />
            <Text fontSize="sm">Reports & insights</Text>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;
