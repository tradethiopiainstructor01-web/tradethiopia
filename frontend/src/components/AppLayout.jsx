import { Box, Flex } from "@chakra-ui/react";
import NavbarPage from "./Navbar";
import Sidebar from "./Sidebar";
import { useState } from "react";

const AppLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <Flex direction="column" minHeight="100vh">
      <NavbarPage />
      
      <Flex flex="1" mt="52px">
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          topOffset="52px"
        />
        
        <Box 
          flex="1" 
          ml={isSidebarCollapsed ? "50px" : "200px"}
          transition="margin-left 0.3s"
          p={4}
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default AppLayout;