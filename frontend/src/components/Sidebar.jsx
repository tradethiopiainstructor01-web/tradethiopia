import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  IconButton,
  VStack,
  Link,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FiFolder, FiHome, FiPlusCircle, FiMenu, FiUsers, FiBookOpen, FiSearch, FiBriefcase, FiBarChart2, FiBox, FiFileText } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const breakpointValue = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    setIsCollapsed(breakpointValue);
  }, [breakpointValue]);

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
          <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <FiHome />
            {!isCollapsed && <Text ml={3}>Dashboard</Text>}
          </Flex>
        </Link>

        {/* Account Management Link */}
        <Link as={RouterLink} to="/users" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <FiUsers />
            {!isCollapsed && <Text ml={3}>Account Management</Text>}
          </Flex>
        </Link>

        {/* Asset Management Link */}
        <Link as={RouterLink} to="/assets" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <FiBriefcase />
            {!isCollapsed && <Text ml={3}>Asset Management</Text>}
          </Flex>
        </Link>

        {/* Company Documents Link */}
        <Link as={RouterLink} to="/documentlist" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <FiBookOpen />
            {!isCollapsed && <Text ml={3}>Company Documents</Text>}
          </Flex>
        </Link>

        {/* Employee Document Link */}
        <Link as={RouterLink} to="/EmployeeDocument" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <FiFolder />
            {!isCollapsed && <Text ml={3}>Employee Document</Text>}
          </Flex>
        </Link>

        {/* Quiz Center Link */}
        <Link as={RouterLink} to="/quiz" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <FiSearch />
            {!isCollapsed && <Text ml={3}>Quiz Center</Text>}
          </Flex>
        </Link>

        {/* Customer List Link */}
        <Link as={RouterLink} to="/FollowUpList" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <FiUsers />
            {!isCollapsed && <Text ml={3}>Customer List</Text>}
          </Flex>
        </Link>

        {/* Finance Dashboard Link */}
        <Link as={RouterLink} to="/finance" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <FiBarChart2 />
            {!isCollapsed && <Text ml={3}>Finance</Text>}
          </Flex>
        </Link>

        {/* Inventory Link */}
        <Link as={RouterLink} to="/finance/inventory" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <FiBox />
            {!isCollapsed && <Text ml={3}>Inventory</Text>}
          </Flex>
        </Link>

       

                {/*  Customer Report */}
        <Link as={RouterLink} to="/adminCustomerReport" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <FiFileText />
            {!isCollapsed && <Text ml={3}>Customer  Report</Text>}
          </Flex>
        </Link>

         {/* Training Tab */}
        <Link as={RouterLink} to="/admin-training-upload" _hover={{ textDecoration: "none" }}>
          <Flex align="center" p={2} borderRadius="md" _hover={{ bg: "gray.700" }}>
            <FiBookOpen />
            {!isCollapsed && <Text ml={3}>Training</Text>}
          </Flex>
        </Link>
      </VStack>
    </Box>
  );
};

export default Sidebar;