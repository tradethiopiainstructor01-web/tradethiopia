import React, { useState, useEffect } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import SNavbar from '../../components/sales/Snavbar';
import SSidebar from '../../components/sales/Ssidebar';

const Sdashboard = () => {
  // State to control sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Toggle Sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Simulate page load effect
  useEffect(() => {
    const timeout = setTimeout(() => setIsLoaded(true), 100); // Delay rendering sidebar
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Box>
      {/* Navbar */}
      <SNavbar toggleSidebar={toggleSidebar} />

      {isLoaded && (
        <Flex>
          {/* Sidebar */}
          <SSidebar isOpen={isSidebarOpen} />

          {/* Main Content */}
          <Box
            flex="1"
            p={4}
            ml={{ base: 0, md: isSidebarOpen ? '250px' : '0' }} // Adjust margin based on sidebar state
            transition="margin 0.3s ease"
          >

          </Box>
        </Flex>
      )}
    </Box>
  );
};

export default Sdashboard;
