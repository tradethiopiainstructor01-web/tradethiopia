import {
  Box,
  Flex,
  IconButton,
  VStack,
  Link,
  Text,
  Divider,
  useColorModeValue,
  useBreakpointValue,
  Badge,
  HStack,
} from "@chakra-ui/react";
import { FiFolder, FiHome, FiPlusCircle, FiMenu, FiUsers, FiBookOpen, FiSearch, FiBriefcase, FiBarChart, FiMessageSquare, FiDollarSign, FiFileText } from "react-icons/fi";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { getNotifications } from "../services/notificationService";
import { fetchPayrollData } from "../services/payrollService";
import { useState, useEffect } from "react";

const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
  }).format(number);
};

const Sidebar = ({ isCollapsed, onToggleCollapse, topOffset = "52px" }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const [payrollSummary, setPayrollSummary] = useState({
    totalEmployees: 0,
    totalNet: 0,
  });
  const [payrollLoading, setPayrollLoading] = useState(true);
  const breakpointValue = useBreakpointValue({ base: true, md: false });

  const sidebarGradient = useColorModeValue(
    "linear(to-b, #0f172a, #0f172a)",
    "linear(to-b, #020617, #0c0e1b)"
  );
  const textColor = useColorModeValue("gray.100", "gray.200");
  const hoverBg = useColorModeValue("rgba(255,255,255,0.08)", "rgba(255,255,255,0.1)");
  const activeBorder = useColorModeValue("cyan.400", "cyan.300");

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

  useEffect(() => {
    let mounted = true;

    const loadPayrollSummary = async () => {
      try {
        const month = new Date().toISOString().slice(0, 7);
        const year = new Date().getFullYear();
        const response = await fetchPayrollData(month, { year });
        if (!mounted) return;

        const payrollRecords = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        const totalNet = payrollRecords.reduce((sum, entry) => sum + (entry.netSalary || entry.finalSalary || 0), 0);
        setPayrollSummary({
          totalEmployees: payrollRecords.length,
          totalNet,
        });
      } catch (err) {
        console.error("Error loading payroll summary", err);
      } finally {
        if (mounted) setPayrollLoading(false);
      }
    };

    loadPayrollSummary();
    return () => {
      mounted = false;
    };
  }, []);

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
      height={`calc(100vh - ${topOffset})`}
      position="fixed"
      left="0"
      top={topOffset}
      bgGradient={sidebarGradient}
      color={textColor}
      transition="width 0.3s"
      zIndex="10"
      borderRightWidth="1px"
      borderRightColor="rgba(255,255,255,0.1)"
      boxShadow="lg"
    >
      <Flex
        align="center"
        justify="flex-end"
        px={isCollapsed ? 2 : 4}
        mb={6}
        mt={1}
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

      {/* Combined approach - using array map with special case for Notice Board */}
      <VStack align="stretch" spacing={1} px={isCollapsed ? 1 : 3}>
        {links.map(({ label, path, icon: Icon }) => {
          const isPayrollLink = label === "Payroll";
          const summaryText = isPayrollLink
            ? payrollLoading
              ? "Loading payroll..."
              : payrollSummary.totalEmployees > 0
                ? `${payrollSummary.totalEmployees} employees • ${formatCurrency(payrollSummary.totalNet)}`
                : "No payroll data"
            : "";

          return (
            <Link
              as={RouterLink}
              to={path}
              key={label}
              _hover={{ textDecoration: "none" }}
            >
              <Flex
                align="center"
                gap={isCollapsed ? 0 : 2}
                px={2}
                py={1.5}
                borderRadius="md"
                bg={isActive(path) ? hoverBg : "transparent"}
                borderLeft={isActive(path) ? "3px solid" : "3px solid transparent"}
                borderLeftColor={isActive(path) ? activeBorder : "transparent"}
                transition="all 0.2s"
              >
                <Icon size={16} />
                {!isCollapsed && (
                  <Box>
                    <Text fontSize="sm" letterSpacing="wide">
                      {label}
                    </Text>
                    {isPayrollLink && summaryText && (
                      <Text fontSize="xs" color="gray.400">
                        {summaryText}
                      </Text>
                    )}
                  </Box>
                )}
              </Flex>
            </Link>
          );
        })}
        
        {/* Special case for Notice Board with badge */}
        <Link as={RouterLink} to="/messages" _hover={{ textDecoration: "none" }} onClick={fetchUnreadCount}>
          <Flex
            align="center"
            gap={isCollapsed ? 0 : 2}
            px={2}
            py={1.5}
            borderRadius="md"
            bg={isActive("/messages") ? hoverBg : "transparent"}
            borderLeft={isActive("/messages") ? "3px solid" : "3px solid transparent"}
            borderLeftColor={isActive("/messages") ? activeBorder : "transparent"}
            transition="all 0.2s"
            position="relative"
          >
            <FiMessageSquare size={16} />
            {!isCollapsed && (
              <>
                <Text>Notice Board</Text>
                {unreadCount > 0 && (
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
              </>
            )}
          </Flex>
        </Link>
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
