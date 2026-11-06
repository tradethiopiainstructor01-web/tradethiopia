import { lazy, Suspense, useState, useEffect } from "react";
import {
  Box,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  useDisclosure,
  useColorMode,
  Text,
  Spinner,
  Flex
} from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import ENSRASidebar from "./ENSRASidebar";
import ENSRANavbar from "./ENSRANavbar";
import ENISRADashboard from "./ENSRADashboard";
import EnisraPackagesPage from "./EnisraPackagesPage";
import FollowupPage from "../sales/FollowupPage";
import OrderFollowup from "../sales/OrderFollowup";
import TaskDashboard from "../sales/TaskDashboard";
import MonthlyReport from "../sales/MonthlyReport";
import SalesMessagesPage from "../../pages/SalesMessagesPage";
import EmployeeRequestsPage from "../../pages/EmployeeRequestsPage";
import EmployeeFileUploadForm from "../../pages/EmployeeFileUploadForm";
import EmployeeWarningsPage from "../../pages/EmployeeWarningsPage";
import ContentTrackerPage from "../sales/ContentTrackerPage";
import CalledCallPage from "../sales/CalledCallPage";
import BulkSmsPage from "../sales/BulkSmsPage";
import ErrorBoundary from "../ErrorBoundary";
import '../sales/salesStyles.css';

const DESKTOP_NAV_HEIGHT = '68px';
const DESKTOP_SIDEBAR_WIDTH = '224px';

const ENSRALayout = ({ initialActiveItem }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { setColorMode } = useColorMode();
  const location = useLocation();

  useEffect(() => {
    setColorMode('light');
  }, [setColorMode]);

  const determineInitialTab = () => {
    if (initialActiveItem) return initialActiveItem;
    const path = (location.pathname || '').toLowerCase();
    if (path.includes('package')) return 'Enisra Packages';
    if (path.includes('follow-up') || path.includes('followup')) return 'Followup';
    if (path.includes('notice')) return 'Notice Board';
    if (path.includes('request')) return 'Requests';
    if (path.includes('bulk-sms')) return 'Bulk SMS';
    if (path.includes('called-call') || path.includes('cold-call')) return 'Cold Call';
    if (path.includes('order')) return 'Orders';
    if (path.includes('task')) return 'Tasks';
    if (path.includes('tracker')) return 'Content Tracker';
    if (path.includes('report')) return 'Monthly Report';
    if (path.includes('warning')) return 'My Warnings';
    if (path.includes('upload')) return 'Upload Documents';

    const saved = localStorage.getItem('enisraActiveItem');
    return saved || 'Home';
  };

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState(determineInitialTab);

  useEffect(() => {
    localStorage.setItem('enisraActiveItem', activeItem);
  }, [activeItem]);

  useEffect(() => {
    const handleSectionNavigation = (event) => {
      const section = event.detail?.section;
      if (section) setActiveItem(section);
    };
    window.addEventListener('navigateToSection', handleSectionNavigation);
    return () => window.removeEventListener('navigateToSection', handleSectionNavigation);
  }, []);

  const renderContent = () => {
    switch (activeItem) {
      case 'Home':
        return <ENISRADashboard />;
      case 'Enisra Packages':
      case 'Packages':
      case 'Package Sales':
        return <EnisraPackagesPage />;
      case 'Followup':
      case 'Follow-up':
      case 'ENSRA Follow-Up':
        return (
          <FollowupPage
            isEnisra
          />
        );
      case 'Missing Documents':
        return (
          <FollowupPage
            isEnisra
            documentsOnly
          />
        );
      case 'Called Call':
      case 'called call':
      case 'Cold Call':
        return <CalledCallPage />;
      case 'Bulk SMS':
        return <BulkSmsPage />;
      case 'Orders':
        return <OrderFollowup />;
      case 'Tasks':
        return <TaskDashboard />;
      case 'Content Tracker':
        return <ContentTrackerPage />;
      case 'Monthly Report':
        return <MonthlyReport />;
      case 'Notice Board':
        return <SalesMessagesPage />;
      case 'Requests':
      case 'Request':
        return <EmployeeRequestsPage embedded />;
      case 'Upload Documents':
        return <EmployeeFileUploadForm embedded />;
      case 'My Warnings':
        return <EmployeeWarningsPage mode="employee" />;
      default:
        return <ENISRADashboard />;
    }
  };

  return (
    <Box display="flex" flexDirection="column" minH="100vh" bg="#f8fbfc">
      {/* Top Navbar */}
      <ENSRANavbar
        onToggleSidebar={onOpen}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Container */}
      <Box display="flex" flex="1" pt={DESKTOP_NAV_HEIGHT}>
        {/* Desktop Sidebar */}
        <Box
          className="sales-desktop-content"
          position="fixed"
          top={0}
          left={0}
          width={isSidebarCollapsed ? "76px" : DESKTOP_SIDEBAR_WIDTH}
          height="100vh"
          transition="width 0.3s"
          display={{ base: "none", md: "block" }}
          zIndex="950"
        >
          <ENSRASidebar
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
        </Box>

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} onClose={onClose} placement="left">
          <DrawerOverlay />
          <DrawerContent>
            <ENSRASidebar
              isCollapsed={false}
              toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
              activeItem={activeItem}
              setActiveItem={(item) => {
                setActiveItem(item);
                onClose();
              }}
            />
          </DrawerContent>
        </Drawer>

        {/* Main Workspace Body */}
        <Box
          ml={{
            base: 0,
            md: isSidebarCollapsed ? "76px" : DESKTOP_SIDEBAR_WIDTH,
          }}
          transition="margin-left 0.3s, width 0.3s"
          p={{ base: 3, md: 6 }}
          bg="linear-gradient(135deg, #f8fbfc 0%, #ffffff 55%, #f4fbfa 100%)"
          _dark={{ bg: 'gray.900' }}
          flex="1"
          minW="0"
          w={{
            base: "100%",
            md: isSidebarCollapsed ? "calc(100% - 76px)" : `calc(100% - ${DESKTOP_SIDEBAR_WIDTH})`
          }}
          maxW={{
            base: "100%",
            md: isSidebarCollapsed ? "calc(100% - 76px)" : `calc(100% - ${DESKTOP_SIDEBAR_WIDTH})`
          }}
          overflowX="hidden"
        >
          <ErrorBoundary>
            <Suspense
              fallback={
                <Flex minH="240px" align="center" justify="center" gap={3}>
                  <Spinner size="sm" color="teal.500" />
                  <Text>Loading section...</Text>
                </Flex>
              }
            >
              {renderContent()}
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
};

export default ENSRALayout;
