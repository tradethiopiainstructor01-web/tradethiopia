import { useState, useEffect } from "react";
import { Box, Flex, useColorModeValue, useBreakpointValue } from "@chakra-ui/react";
import NavbarPage from "./Navbar";
import Sidebar from "./Sidebar";

const AppLayout = ({ children, showNav }) => {
  const bgColor = useColorModeValue("gray.100", "gray.900");
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const shouldCollapse = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    setSidebarCollapsed(Boolean(shouldCollapse));
  }, [shouldCollapse]);

  const sidebarWidth = isSidebarCollapsed ? 70 : 260;
  const marginLeft = showNav ? { base: 0, md: `${sidebarWidth}px` } : 0;

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      {showNav && <NavbarPage />}
      <Flex
        width="100%"
        flexDirection="row"
        pt={showNav ? "80px" : "0"}
      >
        {showNav && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
          />
        )}
        <Box
          flex="1"
          p={showNav ? { base: 4, md: 6 } : 4}
          ml={marginLeft}
          transition="margin-left 0.3s ease"
          width="100%"
          display="flex"
          justifyContent="center"
        >
          <Box w="100%" maxW="1200px" px={{ base: 0, md: 4 }}>
            {children}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default AppLayout;
