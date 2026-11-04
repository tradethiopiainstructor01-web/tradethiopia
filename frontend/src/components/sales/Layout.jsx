import { lazy, Suspense, useState, useEffect } from "react";
import { Box, Drawer, DrawerOverlay, DrawerContent, useDisclosure, useColorMode, Text, Spinner, Flex } from "@chakra-ui/react";
import SSidebar from "./Ssidebar";
import SNavbar from "./Snavbar";
import FollowupPage from "./FollowupPage";
import PackageSalesPage from "./PackageSalesPage";
import PDFList from '../PDFList';
import Dashboard from './SalesDashboard.jsx';
import OrderFollowup from './OrderFollowup.jsx';
import SalesTargetsPage from './SalesTargetsPage.jsx';
import TaskDashboard from './TaskDashboard.jsx';
import MonthlyReport from './MonthlyReport.jsx';
import SalesMessagesPage from '../../pages/SalesMessagesPage';
import EmployeeRequestsPage from '../../pages/EmployeeRequestsPage';
import EmployeeFileUploadForm from '../../pages/EmployeeFileUploadForm';
import EmployeeWarningsPage from '../../pages/EmployeeWarningsPage';
import ContentTrackerPage from './ContentTrackerPage.jsx';
import CalledCallPage from './CalledCallPage.jsx';
import useIsMobile from '../../hooks/useIsMobile';
import MobileSalesShell from '../../mobile/sales/MobileSalesShell';
import ErrorBoundary from '../ErrorBoundary';
import useSalesDocumentReminder from '../../hooks/useSalesDocumentReminder';
import './salesStyles.css';

const DESKTOP_NAV_HEIGHT = '68px';
const DESKTOP_SIDEBAR_WIDTH = '224px';
const StudentRegistrationPage = lazy(() => import('../customer/StudentRegistrationPage.jsx'));

const Layout = ({ initialActiveItem }) => {
  const documentReminder = useSalesDocumentReminder();
  const { isOpen, onOpen, onClose } = useDisclosure(); // For controlling the drawer
  const { setColorMode } = useColorMode();

  useEffect(() => {
    setColorMode('light');
  }, [setColorMode]);

  // Load initial state from localStorage or default to 'Home'
  const getInitialActiveItem = () => {
    if (initialActiveItem) {
      return initialActiveItem;
    }
    const savedItem = localStorage.getItem('salesActiveItem');
    if (savedItem === 'Requests' || savedItem === 'Personal Information' || savedItem === 'Tutorials') {
      localStorage.removeItem('salesActiveItem');
      return 'Home';
    }
    return savedItem || 'Home';
  };
  
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState(getInitialActiveItem);
  const isMobile = useIsMobile();

  // Save activeItem to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('salesActiveItem', activeItem);
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
        return <Dashboard />;
      case 'Missing Documents':
        return <FollowupPage documentsOnly />;
      case 'Followup':
        return <FollowupPage />;
      case 'Student Registration':
        return <StudentRegistrationPage embedded workspaceLabel="Sales" />;
      case 'Package Sales':
        return <PackageSalesPage />;
      case 'Resources':
        return <PDFList />;
      case 'Finance':
        // Navigate to the dedicated finance dashboard page
        window.location.href = '/finance-dashboard';
        return null;
      case 'Financial Reports':
        window.location.href = '/finance-dashboard/reports';
        return null;
      case 'Orders':
        return <OrderFollowup />;
      case 'Users':
        return <Box p={6}><Text fontSize="xl">Users section</Text></Box>;
      case 'Targets':
        return <SalesTargetsPage />;
      case 'Tasks':
        return <TaskDashboard />;
      case 'Monthly Report':
        return <MonthlyReport />;
      case 'Notice Board':
        return <SalesMessagesPage />;
      case 'Requests':
        return <EmployeeRequestsPage embedded />;
      case 'Upload Documents':
        return <EmployeeFileUploadForm embedded />;
      case 'My Warnings':
        return <EmployeeWarningsPage mode="employee" />;
      case 'Content Tracker':
        return <ContentTrackerPage />;
      case 'Called Call':
      case 'called call':
      case 'Cold Call':
      case 'cold call':
        return <CalledCallPage />;
      default:
        return <Box p={6}><Text fontSize="xl">Select an option from the Sidebar.</Text></Box>;
    }
  };

  if (isMobile) {
    return <MobileSalesShell activeItem={activeItem} documentReminder={documentReminder} />;
  }

  return (
    <Box display="flex" flexDirection="column" minH="100vh" bg="#f8fbfc">
      {/* Navbar */}
      <SNavbar onToggleSidebar={onOpen} documentReminder={documentReminder} isSidebarCollapsed={isSidebarCollapsed} />

      {/* Main Container */}
      <Box display="flex" flex="1" pt={DESKTOP_NAV_HEIGHT}>
        {/* Sidebar for Larger Screens */}
        <Box
          className="sales-desktop-content"
          position="fixed"
          top={0}
          left={0}
          width={isSidebarCollapsed ? "76px" : DESKTOP_SIDEBAR_WIDTH}
          height="100vh"
          transition="width 0.3s"
          display={{ base: "none", md: "block" }} // Hide on mobile
          zIndex="950"
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
            <Suspense fallback={<Flex minH="240px" align="center" justify="center" gap={3}><Spinner size="sm" /><Text>Loading section...</Text></Flex>}>
              {renderContent()}
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
