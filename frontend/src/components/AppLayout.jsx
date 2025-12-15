import { useState, useEffect } from "react";
import { Box, Flex, useColorModeValue, useBreakpointValue } from "@chakra-ui/react";
import NavbarPage from "./Navbar";
import Sidebar from "./Sidebar";

const NAVBAR_HEIGHT = 52;

const AppLayout = ({ children, showNav }) => {
  const bgColor = useColorModeValue("gray.100", "gray.900");
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const shouldCollapse = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    setSidebarCollapsed(Boolean(shouldCollapse));
  }, [shouldCollapse]);

  const contentVerticalPadding = showNav ? { base: 4, md: 6 } : { base: 4, md: 6 };
  const contentHorizontalPadding = showNav ? 0 : { base: 4, md: 6 };
  const contentJustify = "stretch";
  const contentPx = 0;
  const sidebarWidth = isSidebarCollapsed ? 70 : 260;
  const contentMarginLeft = showNav ? `${sidebarWidth}px` : 0;

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const navbarHeight = `${NAVBAR_HEIGHT}px`;

  return (
    <Box minH="100vh" bg={bgColor}>
      {showNav && <NavbarPage />}
      <Flex width="100%" flexDirection="row" pt={showNav ? navbarHeight : "0"} alignItems="stretch">
        {showNav && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
            topOffset={navbarHeight}
          />
        )}
        <Box
          flex="1"
          pt={contentVerticalPadding}
          pb={contentVerticalPadding}
          px={contentHorizontalPadding}
          transition="all 0.3s ease"
          width="100%"
          display="flex"
          justifyContent={contentJustify}
          ml={contentMarginLeft}
        >
          <Box w="100%" px={contentPx}>
            {children}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default AppLayout;
