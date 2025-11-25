import React, { useState } from "react";
import { Box, Drawer, DrawerOverlay, DrawerContent, useDisclosure } from "@chakra-ui/react";
import Sidebar from "./Sidebar";
import Cnavbar from "./customNavbar";

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure(); // For controlling the drawer
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      {/* Navbar */}
      <Box position="fixed" top={0} left={0} width="100%" zIndex="1000">
        <Cnavbar onToggleSidebar={onOpen} /> {/* Pass `onOpen` to toggle the drawer */}
      </Box>

      {/* Main Container */}
      <Box display="flex" flex="1" pt="60px">
        {/* Sidebar for Larger Screens */}
        <Box
          position="fixed"
          top="60px"
          left={0}
          width={isSidebarCollapsed ? "70px" : "200px"}
          height="calc(100vh - 60px)" // Adjust height to account for the navbar
          transition="width 0.3s"
          display={{ base: "none", md: "block" }} // Hide on mobile
          zIndex="900" // Ensure it's below the navbar but above other content
        >
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
          />
        </Box>

        {/* Drawer for Mobile Screens */}
        <Drawer isOpen={isOpen} onClose={onClose} placement="left">
          <DrawerOverlay />
          <DrawerContent>
            <Sidebar
              isCollapsed={false}
              toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
            />
          </DrawerContent>
        </Drawer>

        {/* Main Content */}
        <Box
          ml={{
            base: 0, // No margin on mobile
            md: isSidebarCollapsed ? "70px" : "200px", // Adjust for collapsed or expanded sidebar on larger screens
          }}
          transition="margin-left 0.3s"
          p={4}
          bg="#f8f9fa"
          flex="1"
          width="100%" // Ensure it takes up the remaining space
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;