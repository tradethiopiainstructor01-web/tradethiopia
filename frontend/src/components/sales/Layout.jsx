import React, { useState, useEffect } from "react";
import { Box, Drawer, DrawerOverlay, DrawerContent, useDisclosure, Text } from "@chakra-ui/react";
import SSidebar from "./Ssidebar";
import SNavbar from "./Snavbar";
import FollowupPage from "./FollowupPage";
import Training from "./Training.jsx";
import PDFList from '../PDFList';
import Dashboard from './SalesDashboard.jsx';
// import FinanceDashboard from './FinanceDashboard.jsx'; // Replaced with dedicated page
import OrderFollowup from './OrderFollowup.jsx';
import SalesTargetsPage from './SalesTargetsPage.jsx';
import TaskDashboard from './TaskDashboard.jsx';
import MonthlyReport from './MonthlyReport.jsx';

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure(); // For controlling the drawer
  
  // Load initial state from localStorage or default to 'Home'
  const getInitialActiveItem = () => {
    const savedItem = localStorage.getItem('salesActiveItem');
    return savedItem || 'Home';
  };
  
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState(getInitialActiveItem);

  // Save activeItem to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('salesActiveItem', activeItem);
  }, [activeItem]);

  const renderContent = () => {
    switch (activeItem) {
      case 'Home':
        return <Dashboard />;
      case 'Followup':
        return <FollowupPage />;
      case 'Resources':
        return <PDFList />;
      case 'Finance':
        // Navigate to the dedicated finance dashboard page
        window.location.href = '/finance-dashboard';
        return null;
      case 'Orders':
        return <OrderFollowup />;
      case 'Users':
        return <Box p={6}><Text fontSize="xl">Users section</Text></Box>;
      case 'Tutorials':
        return <Training />;
      case 'Targets':
        return <SalesTargetsPage />;
      case 'Tasks':
        return <TaskDashboard />;
      case 'Monthly Report':
        return <MonthlyReport />;
      default:
        return <Box p={6}><Text fontSize="xl">Select an option from the Sidebar.</Text></Box>;
    }
  };

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      {/* Navbar */}
      <Box position="fixed" top={0} left={0} width="100%" zIndex="1000">
        <SNavbar onToggleSidebar={onOpen} /> {/* Pass `onOpen` to toggle the drawer */}
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
          <SSidebar
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
        </Box>

        {/* Drawer for Mobile Screens */}
        <Drawer isOpen={isOpen} onClose={onClose} placement="left">
          <DrawerOverlay />
          <DrawerContent>
            <SSidebar
              isCollapsed={false}
              toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
              activeItem={activeItem}
              setActiveItem={setActiveItem}
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
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
