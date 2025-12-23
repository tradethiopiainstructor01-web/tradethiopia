
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CreatePage from "./pages/CreatePage";
import CreateQuiz from "./pages/CreateQuiz";
import Addresource from "./pages/Addresource";
import HomePage from "./pages/HomePage";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import CustomerFollowUpForm from "./components/CustomerFollowForm.jsx";
import FollowUpList from "./components/FollowUpList";
import SecondPage from "./pages/SecondPage";
import ThirdPage from "./pages/ThirdPage";
import FourthPage from "./pages/FourthPage";
import FifthPage from "./pages/FifthPage.jsx";
import QuizPage from "./pages/quizPage.jsx";
import Sdashboard from "./pages/sales/Sdashboard.jsx";
import Srequest from "./pages/sales/Srequest.jsx";
import FinanceLayout from "./pages/sales/FinanceLayout.jsx";
import FinanceDashboardPage from "./pages/sales/FinanceDashboardPage.jsx";
import FinanceReportsPage from "./pages/sales/FinanceReportsPage.jsx";
import InventoryPage from "./pages/sales/InventoryPage.jsx";
import OrdersPage from "./pages/sales/OrdersPage.jsx";
import FinancePayrollPage from "./pages/sales/FinancePayrollPage.jsx";
import PDFList from './components/PDFList';
import InfoForm from './pages/InfoForm';
import EmployeeInfoPage from './pages/EmployeeInfoPage';
import DocumentUploadForm from './components/DocumentUploadForm';
import DocumentList from './components/DocumentList';
import Category from './components/category';
import AssetCategoryPage from "./pages/AssetCategoryPage.jsx";
import AssetManagementPage from "./pages/AssetManagementPage.jsx";
import EmployeeFileUploadForm from "./pages/EmployeeFileUploadForm";
import TTV from "./pages/ttv.jsx";
import EmployeeDocumentList from './components/EmployeeDocument';
import CustomerFollowup from "./components/customer/CustomerFollowup.jsx";
import AddCustomer from "./components/customer/AddCustomer";
import CDashboard from "./components/customer/Cdashboard";
import CustomerReport from "./components/customer/CustomerReport";
import CustomerFollowupReport from "./components/customer/CustomerFollowupReport";
import VideoList from './components/customer/VideoList';
import UploadResource from './components/customer/UploadPage';
import TrainingPage from "./components/customer/TrainingPage";
import WaitingForApproval from "./pages/WaitingForApproval";
import ComingSoonPage from "./pages/ComingSoonPage";
import AdminTrainingUpload from "./pages/AdminTrainingUpload";
import AdminCustomerReport from './components/AdminCSReport.jsx';
import B2BDashboard from './pages/B2BDashboard';
import CustomerSettings from "./components/customer/CustomerSettings";
import COODashboard from './pages/COODashboard';
import TradexTVDashboard from './pages/TradexTVDashboard';
import PricingPage from './pages/sales/PricingPage.jsx';
import RevenuePage from './pages/sales/RevenuePage.jsx';
import PurchasePage from './pages/sales/PurchasePage.jsx';
import CostManagementPage from './pages/sales/CostManagementPage.jsx';
import ITDashboard from "./pages/ITDashboard";
import ENISRALayout from "./components/ENSRA/ENSRALayout";
import ENISRADashboard from "./components/ENSRA/ENSRADashboard";
import ENISRAEnhancedDashboard from "./components/ENSRA/ENISRAEnhancedDashboard";
import ENISRANoticeBoard from "./components/ENSRA/ENSRANoticeBoard";
import ENISRARequest from "./components/ENSRA/ENSRARequest";
import ENISRARequestEmbedded from "./components/ENSRA/ENISRARequestEmbedded";
import ENISRAFollowUp from "./components/ENSRA/ENISRAFollowUp";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import InstructorLayout from "./components/instructor/InstructorLayout";
import InstructorDashboard from "./pages/instructor/Dashboard";
import InstructorRequest from "./pages/instructor/Request";
import InstructorNoticeBoard from "./pages/instructor/NoticeBoard";
import SalesManagerLayout from "./components/salesmanager/Layout";
import SalesManagerDashboard from "./components/salesmanager/SalesManagerDashboard";
import SalesManagerProtectedRoute from "./components/salesmanager/SalesManagerProtectedRoute";
import CustomerMessagesPage from "./pages/CustomerMessagesPage.jsx";
import AllSalesPage from "./components/salesmanager/AllSalesPage";
import PerformancePage from "./components/salesmanager/PerformancePage";
import TeamManagementPage from "./components/salesmanager/TeamManagementPage";
import TaskManagementPage from "./components/salesmanager/TaskManagementPage";
import ReportsPage from "./components/salesmanager/ReportsPage";
import CalendarPage from "./components/salesmanager/CalendarPage";
import SettingsPage from "./components/salesmanager/SettingsPage";
import PayrollPage from "./components/Payroll/PayrollPage";
import EmployeePayrollView from "./components/Payroll/EmployeePayrollView";

import MessagesPage from "./pages/MessagesPage";
import SalesMessagesPage from "./pages/SalesMessagesPage";
import FinanceMessagesPage from "./pages/FinanceMessagesPage";
import ITMessagesPage from "./pages/ITMessagesPage";
import RedirectMessagesPage from "./pages/RedirectMessagesPage";
import SocialMediaDashboardPage from "./pages/socialmedia/SocialMediaDashboardPage";
import RequestPage from "./pages/RequestPage";
import TeamRequestsPage from "./pages/sales/TeamRequestsPage.jsx";
import AppLayout from "./components/AppLayout"; // Import the new AppLayout component
import SupervisorLayout from "./pages/supervisor/SupervisorLayout.jsx";
import SupervisorDashboardPage from "./pages/supervisor/SupervisorDashboardPage.jsx";
import SupervisorAccountPage from "./pages/supervisor/SupervisorAccountPage.jsx";

function App() {
  const location = useLocation();

  // Define the paths where Sidebar and Navbar should not appear
  const noNavSidebarRoutes = [
    "/", "/login", "/secondpage", "/employee-info", "/employee-file-upload", 
    "/thirdpage", "/ttv", "/fourthpage", "/fifthpage", "/exam", "/sdashboard", "/sales", "/sales/dashboard", "/finance-dashboard", "/finance-dashboard/reports",
    "/finance-dashboard/inventory", "/finance-dashboard/orders", "/finance-dashboard/pricing", "/finance-dashboard/revenue", "/finance-dashboard/purchase",
    "/finance/messages", "/finance/team-requests",
    "/addcustomer", "/resource", "/videolist", "/uploadpage", "/my-payroll",
    "/cdashboard", "/waitingforapproval", "/training","/comingsoonpage", "/customerreport", "/followup-report", "/customerfollowup", "/b2b-dashboard",
    "/coo-dashboard", "/tradextv-dashboard", "/customer-settings", "/it", "/salesmanager", "/social-media", "/requests", "/finance-dashboard/payroll", "/supervisor", "/supervisor/account", "/finance/requests"
  ].map((path) => path.toLowerCase());

  // Hide the navbar and sidebar for legacy/fullscreen pages; root should only match exactly
  const normalizedPath = location.pathname.toLowerCase();
  const showNavAndSidebar = !noNavSidebarRoutes.some((route) => {
    if (route === "/") {
      return normalizedPath === "/";
    }
    return normalizedPath.startsWith(route);
  });

  // Wrapper component that conditionally applies the layout
  const LayoutWrapper = ({ children }) => {
    if (showNavAndSidebar) {
      return <AppLayout>{children}</AppLayout>;
    }
    return children;
  };

return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/InfoForm" element={<InfoForm />} />
      <Route path="/secondpage" element={<SecondPage />} />
      <Route path="/thirdpage" element={<ThirdPage />} />
      <Route path="/fourthpage" element={<FourthPage />} />
      <Route path="/fifthpage" element={<FifthPage />} />
      <Route path="/exam" element={<QuizPage />} />
      <Route path="/WaitingForApproval" element={<WaitingForApproval />} />
      <Route path="/sdashboard" element={<Sdashboard />} />
      <Route path="/sales" element={<Sdashboard />} />
      <Route path="/sales/dashboard" element={<Sdashboard />} />
      <Route path="/srequest" element={<Srequest />} />
      <Route path="/finance-dashboard" element={<FinanceLayout><FinanceDashboardPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/reports" element={<FinanceLayout><FinanceReportsPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/inventory" element={<FinanceLayout><InventoryPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/orders" element={<FinanceLayout><OrdersPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/pricing" element={<FinanceLayout><PricingPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/revenue" element={<FinanceLayout><RevenuePage /></FinanceLayout>} />
      <Route path="/finance-dashboard/purchase" element={<FinanceLayout><PurchasePage /></FinanceLayout>} />
      <Route path="/finance-dashboard/costs" element={<FinanceLayout><CostManagementPage /></FinanceLayout>} />
      <Route path="/finance-dashboard/payroll" element={<FinanceLayout><FinancePayrollPage /></FinanceLayout>} />
      <Route path="/finance/team-requests" element={<FinanceLayout><TeamRequestsPage /></FinanceLayout>} />
      <Route
        path="/finance/messages"
        element={
          <FinanceLayout>
            <FinanceMessagesPage embedded />
          </FinanceLayout>
        }
      />
      <Route path="/resource" element={<Navigate to="/resources" replace />} />
      <Route path="/employee-info" element={<EmployeeInfoPage />} />
      <Route path="/employee-file-upload" element={<EmployeeFileUploadForm />} />
      <Route path="/users" element={<LayoutWrapper><HomePage /></LayoutWrapper>} />
      <Route path="/dashboard" element={<LayoutWrapper><Dashboard /></LayoutWrapper>} />
      <Route path="/documentupload" element={<DocumentUploadForm />} />
      <Route path="/category" element={<LayoutWrapper><Category /></LayoutWrapper>} />
      <Route path="/documentlist" element={<LayoutWrapper><DocumentList /></LayoutWrapper>} />
      <Route path="/EmployeeDocument" element={<LayoutWrapper><EmployeeDocumentList /></LayoutWrapper>} />
      <Route path="/documentlist/:id" element={<LayoutWrapper><DocumentList /></LayoutWrapper>} />
      <Route path="/create" element={<LayoutWrapper><CreatePage /></LayoutWrapper>} />
      <Route path="/quiz" element={<LayoutWrapper><CreateQuiz /></LayoutWrapper>} />
      <Route path="/resources" element={<LayoutWrapper><PDFList /></LayoutWrapper>} />
      <Route path="/Addresource" element={<LayoutWrapper><Addresource /></LayoutWrapper>} />
      <Route path="/FollowUpList" element={<LayoutWrapper><FollowUpList /></LayoutWrapper>} />
      <Route path="/CustomerFollowUpForm" element={<LayoutWrapper><CustomerFollowUpForm /></LayoutWrapper>} />
      <Route path="/assetcategory" element={<LayoutWrapper><AssetCategoryPage /></LayoutWrapper>} />
      <Route path="/assets" element={<LayoutWrapper><AssetManagementPage /></LayoutWrapper>} />
      <Route path="/ttv" element={<TTV />} />
      <Route path="/PDF" element={<LayoutWrapper><PDFList /></LayoutWrapper>} />
      <Route path="/CustomerFollowup" element={<LayoutWrapper><CustomerFollowup /></LayoutWrapper>} />
      <Route path="/AddCustomer" element={<LayoutWrapper><AddCustomer /></LayoutWrapper>} />
      <Route path="/VideoList" element={<LayoutWrapper><VideoList /></LayoutWrapper>} />

<Route path="/UploadPage" element={<LayoutWrapper><UploadResource /></LayoutWrapper>} />
      <Route path="/Cdashboard" element={<CDashboard />} />
      <Route path="/CustomerReport" element={<LayoutWrapper><CustomerReport /></LayoutWrapper>} />
      <Route path="/followup-report" element={<LayoutWrapper><CustomerFollowupReport /></LayoutWrapper>} />
      <Route path="/training" element={<LayoutWrapper><TrainingPage /></LayoutWrapper>} />
      <Route path="/ComingSoonPage" element={<ComingSoonPage />} />
      <Route path="/admin-training-upload" element={<LayoutWrapper><AdminTrainingUpload /></LayoutWrapper>} />
      <Route path="/adminCustomerReport" element={<LayoutWrapper><AdminCustomerReport /></LayoutWrapper>} />
      <Route path="/b2b-dashboard" element={<B2BDashboard />} />
      <Route path="/coo-dashboard" element={<COODashboard />} />
      <Route path="/tradextv-dashboard" element={<TradexTVDashboard />} />
      <Route path="/customer-settings" element={<LayoutWrapper><CustomerSettings /></LayoutWrapper>} />
      <Route path="/social-media" element={<LayoutWrapper><SocialMediaDashboardPage /></LayoutWrapper>} />
      <Route path="/requests" element={<LayoutWrapper><RequestPage /></LayoutWrapper>} />
      <Route path="/finance/requests" element={<LayoutWrapper><RequestPage /></LayoutWrapper>} />
      <Route path="/it" element={<ITDashboard />} />
      <Route
        path="/instructor"
        element={
          <RoleProtectedRoute allowedRoles={["instructor"]}>
            <InstructorLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<InstructorDashboard />} />
        <Route path="dashboard" element={<InstructorDashboard />} />
        <Route path="request" element={<InstructorRequest />} />
        <Route path="notice-board" element={<InstructorNoticeBoard />} />
      </Route>

      {/* ENISRA section */}
      <Route path="/enisra" element={<ENISRALayout />}>
        <Route index element={<ENISRAEnhancedDashboard />} />
        <Route path="dashboard" element={<ENISRAEnhancedDashboard />} />
        <Route path="follow-up" element={<ENISRAFollowUp />} />
        <Route path="notice-board" element={<ENISRANoticeBoard />} />
        <Route path="request" element={<ENISRARequestEmbedded />} />
      </Route>
      <Route path="/payroll" element={<LayoutWrapper><PayrollPage /></LayoutWrapper>} />
      <Route path="/my-payroll" element={<EmployeePayrollView />} />
      <Route path="/messages" element={<RedirectMessagesPage />} />
      <Route path="/sales/messages" element={<SalesMessagesPage />} />
      <Route path="/customer/messages" element={<CustomerMessagesPage />} />
      <Route path="/supervisor" element={<SupervisorLayout />}>
        <Route index element={<SupervisorDashboardPage />} />
        <Route path="requests" element={<TeamRequestsPage />} />
        <Route path="notice-board" element={<FinanceMessagesPage embedded />} />
        <Route path="revenue-expense" element={<RevenuePage />} />
      </Route>
      <Route path="/supervisor/account" element={<SupervisorAccountPage />} />
      <Route
        path="/salesmanager/*"
        element={
          <SalesManagerProtectedRoute>
            <SalesManagerLayout />
          </SalesManagerProtectedRoute>
        }
      >
        <Route index element={<SalesManagerDashboard />} />
        <Route path="dashboard" element={<SalesManagerDashboard />} />
        <Route path="all-sales" element={<AllSalesPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="team" element={<TeamManagementPage />} />
        <Route path="tasks" element={<TaskManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages" element={<MessagesPage />} />
        
      </Route>
    </Routes>
  );
}

export default App;
