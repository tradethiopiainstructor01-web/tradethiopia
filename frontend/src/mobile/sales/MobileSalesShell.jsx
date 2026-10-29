import { lazy, Suspense, useEffect, useState } from 'react';
import { Box, Center, Spinner, Text, useDisclosure } from '@chakra-ui/react';
import MobileSalesTopBar from '../../components/mobile/navigation/MobileSalesTopBar';
import MobileBottomNav from '../../components/mobile/navigation/MobileBottomNav';
import MobileSalesSidebar from '../../components/mobile/navigation/MobileSalesSidebar';
import ErrorBoundary from '../../components/ErrorBoundary';
import MobileFollowups from './MobileFollowups';
import MobileProfile from './MobileProfile';
import MobileSalesHome from './MobileSalesHome';
import MobileTasks from './MobileTasks';

// Sections without a dedicated mobile screen reuse the desktop pages (see components/sales/Layout.jsx).
const StudentRegistrationPage = lazy(() => import('../../components/customer/StudentRegistrationPage'));
const OrderFollowup = lazy(() => import('../../components/sales/OrderFollowup.jsx'));
const ContentTrackerPage = lazy(() => import('../../components/sales/ContentTrackerPage.jsx'));
const MonthlyReport = lazy(() => import('../../components/sales/MonthlyReport.jsx'));
const SalesMessagesPage = lazy(() => import('../../pages/SalesMessagesPage'));
const EmployeeRequestsPage = lazy(() => import('../../pages/EmployeeRequestsPage'));
const EmployeeFileUploadForm = lazy(() => import('../../pages/EmployeeFileUploadForm'));
const EmployeeWarningsPage = lazy(() => import('../../pages/EmployeeWarningsPage'));

const mobileSections = [
  'Home', 'Followup', 'Package Sales', 'Orders', 'Tasks', 'Content Tracker', 'Monthly Report',
  'Notice Board', 'Requests', 'Upload Documents', 'My Warnings', 'Student Registration', 'More'
];

const resolveSection = (section) => {
  if (section === 'Missing Documents') return 'Followup';
  return mobileSections.includes(section) ? section : 'Home';
};

const MobileSalesShell = ({ activeItem, documentReminder }) => {
  const sidebarDisclosure = useDisclosure();
  const [mobileItem, setMobileItem] = useState(() => resolveSection(activeItem));
  const currentItem = mobileItem || 'Home';

  // Same in-app navigation events the desktop layout listens to.
  useEffect(() => {
    const openSection = (event) => {
      if (event.detail?.section) setMobileItem(resolveSection(event.detail.section));
    };
    window.addEventListener('navigateToSection', openSection);
    return () => window.removeEventListener('navigateToSection', openSection);
  }, []);

  const renderMobileContent = () => {
    switch (currentItem) {
      case 'Home':
        return <MobileSalesHome onNavigate={setMobileItem} />;
      case 'Followup':
        return <MobileFollowups key="followups" />;
      case 'Package Sales':
        return <MobileFollowups key="packages" initialSection="packages" />;
      case 'Orders':
        return <OrderFollowup />;
      case 'Tasks':
        return <MobileTasks />;
      case 'Content Tracker':
        return <ContentTrackerPage />;
      case 'Monthly Report':
        return <MonthlyReport />;
      case 'Notice Board':
        return <SalesMessagesPage />;
      case 'Requests':
        return <EmployeeRequestsPage />;
      case 'Upload Documents':
        return <EmployeeFileUploadForm embedded />;
      case 'My Warnings':
        return <EmployeeWarningsPage mode="employee" />;
      case 'Student Registration':
        return <StudentRegistrationPage embedded workspaceLabel="Sales" />;
      case 'More':
        return <MobileProfile />;
      default:
        return <MobileSalesHome onNavigate={setMobileItem} />;
    }
  };

  return (
    <Box minH="100vh" bg="#FAFBFD" color="#081A34" pb="92px">
      <Box position="sticky" top={0} zIndex={10}>
        <MobileSalesTopBar
          documentReminder={documentReminder}
          onMenu={sidebarDisclosure.onOpen}
          onProfile={() => setMobileItem('More')}
        />
      </Box>
      <Box px={3} py={4}>
        {currentItem === 'Tasks' && (
          <Text as="h1" fontSize="22px" fontWeight="800" mb={3}>Tasks</Text>
        )}
        <ErrorBoundary key={currentItem}>
          <Suspense fallback={<Center minH="220px"><Spinner size="sm" /></Center>}>
            {renderMobileContent()}
          </Suspense>
        </ErrorBoundary>
      </Box>
      <MobileBottomNav activeItem={currentItem} onChange={setMobileItem} />
      <MobileSalesSidebar
        isOpen={sidebarDisclosure.isOpen}
        onClose={sidebarDisclosure.onClose}
        activeItem={currentItem}
        onNavigate={setMobileItem}
      />
    </Box>
  );
};

export default MobileSalesShell;
