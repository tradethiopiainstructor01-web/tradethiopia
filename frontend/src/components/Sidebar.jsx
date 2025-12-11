import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  IconButton,
  VStack,
  Link,
  Text,
  useBreakpointValue,
  Badge,
  HStack,
} from "@chakra-ui/react";
import { FiFolder, FiHome, FiPlusCircle, FiMenu, FiUsers, FiBookOpen, FiSearch, FiBriefcase, FiBarChart, FiMessageSquare } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { FiFileText } from 'react-icons/fi';
import { getNotifications } from "../services/notificationService";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const breakpointValue = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    setIsCollapsed(breakpointValue);
  }, [breakpointValue]);

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

  const toggleCollapse = () => {
    setIsCollapsed((prevState) => !prevState);
  };

  return (
    <Box
      as="nav"
      width={isCollapsed ? "70px" : "250px"}
      height="100vh"
      position="fixed"
      left={0}
      top={0}
      bg="gray.800"
      color="white"
      transition="width 0.3s"
      zIndex="1"
      paddingTop="80px" // Adjusting to account for the Navbar height
    >
      {/* Collapse Toggle Button */}
      <Flex justify="flex-end" align="center" p={4}>
        <IconButton
          icon={<FiMenu />}
          variant="ghost"
          color="white"
          onClick={toggleCollapse}
          aria-label="Toggle Sidebar"
        />
      </Flex>

      {/* Sidebar Links */}
      <VStack align="start" spacing={4} p={4}>
        {/* Dashboard Link */}
        <Link as={RouterLink} to="/dashboard" _hover={{ textDecoration: "none" }}>
          <HStack
            align="center"
            p={2}
            borderRadius="md"
            _hover={{ bg: "gray.700" }}
            position="relative"
            spacing={3}
          >
            <FiHome />
            {!isCollapsed && <Text>Dashboard</Text>}
          </HStack>
        </Link>

        {/* COO Dashboard Link removed */}

        {/* Account Management Link */}
        <Link as={RouterLink} to="/users" _hover={{ textDecoration: "none" }}>
          <HStack
            align="center"
            p={2}
            borderRadius="md"
            _hover={{ bg: "gray.700" }}
            position="relative"
            spacing={3}
          >
            <FiUsers />
            {!isCollapsed && <Text>Account Management</Text>}
          </HStack>
        </Link>

        {/* Asset Management Link */}
        <Link as={RouterLink} to="/assets" _hover={{ textDecoration: "none" }}>
          <HStack
            align="center"
            p={2}
            borderRadius="md"
            _hover={{ bg: "gray.700" }}
            position="relative"
            spacing={3}
          >
            <FiBriefcase />
            {!isCollapsed && <Text>Asset Management</Text>}
          </HStack>
        </Link>

        {/* Company Documents Link */}
        <Link as={RouterLink} to="/documentlist" _hover={{ textDecoration: "none" }}>
          <HStack
            align="center"
            p={2}
            borderRadius="md"
            _hover={{ bg: "gray.700" }}
            position="relative"
            spacing={3}
          >
            <FiBookOpen />
            {!isCollapsed && <Text>Company Documents</Text>}
          </HStack>
        </Link>

        {/* Employee Document Link */}
        <Link as={RouterLink} to="/EmployeeDocument" _hover={{ textDecoration: "none" }}>
          <HStack
            align="center"
            p={2}
            borderRadius="md"
            _hover={{ bg: "gray.700" }}
            position="relative"
            spacing={3}
          >
            <FiFolder />
            {!isCollapsed && <Text>Employee Document</Text>}
          </HStack>
        </Link>

        {/* Quiz Center Link */}
        <Link as={RouterLink} to="/quiz" _hover={{ textDecoration: "none" }}>
          <HStack
            align="center"
            p={2}
            borderRadius="md"
            _hover={{ bg: "gray.700" }}
            position="relative"
            spacing={3}
          >
            <FiSearch />
            {!isCollapsed && <Text>Quiz Center</Text>}
          </HStack>
        </Link>

        {/* Customer List Link */}
        <Link as={RouterLink} to="/FollowUpList" _hover={{ textDecoration: "none" }}>
          <HStack
            align="center"
            p={2}
            borderRadius="md"
            _hover={{ bg: "gray.700" }}
            position="relative"
            spacing={3}
          >
            <FiUsers />
            {!isCollapsed && <Text>Customer List</Text>}
          </HStack>
        </Link>

       
                {/*  Customer Report */}
        <Link as={RouterLink} to="/adminCustomerReport" _hover={{ textDecoration: "none" }}>
          <HStack
            align="center"
            p={2}
            borderRadius="md"
            _hover={{ bg: "gray.700" }}
            position="relative"
            spacing={3}
          >
            <FiFileText />
            {!isCollapsed && <Text>Customer  Report</Text>}
          </HStack>
        </Link>

         {/* Training Tab */}
        <Link as={RouterLink} to="/admin-training-upload" _hover={{ textDecoration: "none" }}>
          <HStack
            align="center"
            p={2}
            borderRadius="md"
            _hover={{ bg: "gray.700" }}
            position="relative"
            spacing={3}
          >
            <FiBookOpen />
            {!isCollapsed && <Text>Training</Text>}
          </HStack>
        </Link>
        
        {/* Messages Tab */}
        <Link as={RouterLink} to="/messages" _hover={{ textDecoration: "none" }} onClick={fetchUnreadCount}>
          <HStack
            align="center"
            p={2}
            borderRadius="md"
            _hover={{ bg: "gray.700" }}
            position="relative"
            spacing={3}
          >
            <FiMessageSquare />
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
          </HStack>
        </Link>
      </VStack>
    </Box>
  );
};

export default Sidebar;