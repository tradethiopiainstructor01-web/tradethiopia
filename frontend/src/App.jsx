import { Box, useColorModeValue } from "@chakra-ui/react";
import { Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import NavbarPage from "./components/Navbar";
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
import FinanceDashboardPage from "./pages/sales/FinanceDashboardPage.jsx";
import FinanceReportsPage from "./pages/sales/FinanceReportsPage.jsx";
import InventoryPage from "./pages/sales/InventoryPage.jsx";
import OrdersPage from "./pages/sales/OrdersPage.jsx";
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
import SalesManagerLayout from "./components/salesmanager/Layout";
import SalesManagerDashboard from "./components/salesmanager/SalesManagerDashboard";
import SalesManagerProtectedRoute from "./components/salesmanager/SalesManagerProtectedRoute";
import AllSalesPage from "./components/salesmanager/AllSalesPage";
import PerformancePage from "./components/salesmanager/PerformancePage";
import TeamManagementPage from "./components/salesmanager/TeamManagementPage";
import TaskManagementPage from "./components/salesmanager/TaskManagementPage";
import ReportsPage from "./components/salesmanager/ReportsPage";
import CalendarPage from "./components/salesmanager/CalendarPage";
import SettingsPage from "./components/salesmanager/SettingsPage";

function App() {
  const location = useLocation();

  // Define the paths where Sidebar and Navbar should not appear
  const noNavSidebarRoutes = [
    "/", "/login", "/secondpage", "/employee-info", "/employee-file-upload", 
    "/thirdpage", "/ttv", "/fourthpage", "/fifthpage", "/exam", "/sdashboard", "/finance-dashboard", "/finance-dashboard/reports",
    "/finance-dashboard/inventory", "/finance-dashboard/orders", "/finance-dashboard/pricing", "/finance-dashboard/revenue", "/finance-dashboard/purchase",
    "/addcustomer", "/resource", "/videolist", "/uploadpage", 
    "/cdashboard", "/waitingforapproval", "/training","/comingsoonpage", "/customerreport", "/followup-report", "/customerfollowup", "/b2b-dashboard",
    "/coo-dashboard", "/tradextv-dashboard", "/customer-settings", "/it"
  ].map((path) => path.toLowerCase());

  // Hide the navbar and sidebar for legacy/fullscreen pages; root should only match exactly
  const normalizedPath = location.pathname.toLowerCase();
  const showNavAndSidebar = !noNavSidebarRoutes.some((route) => {
    if (route === "/") {
      return normalizedPath === "/";
    }
    return normalizedPath.startsWith(route);
  });

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      {showNavAndSidebar && <NavbarPage />}
      <Box 
        display="flex" 
        flexDirection="row" 
        width="100%"
        pt={showNavAndSidebar ? "80px" : "0"}
      >
        {showNavAndSidebar && <Sidebar />}
        <Box
          flex="1"
          p={showNavAndSidebar ? { base: 2, md: 5 } : 0}
          ml={showNavAndSidebar ? { base: "70px", md: "250px" } : 0}
          transition="margin-left 0.3s ease"
          width="100%"
        >
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
            <Route path="/finance-dashboard" element={<FinanceDashboardPage />} />
            <Route path="/finance-dashboard/reports" element={<FinanceReportsPage />} />
            <Route path="/finance-dashboard/inventory" element={<InventoryPage />} />
            <Route path="/finance-dashboard/orders" element={<OrdersPage />} />
            <Route path="/finance-dashboard/pricing" element={<PricingPage />} />
            <Route path="/finance-dashboard/revenue" element={<RevenuePage />} />
            <Route path="/finance-dashboard/purchase" element={<PurchasePage />} />
            <Route path="/finance-dashboard/costs" element={<CostManagementPage />} />
            <Route path="/employee-info" element={<EmployeeInfoPage />} />
            <Route path="/employee-file-upload" element={<EmployeeFileUploadForm />} />
            <Route path="/users" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documentupload" element={<DocumentUploadForm />} />
            <Route path="/category" element={<Category />} />
            <Route path="/documentlist" element={<DocumentList />} />
            <Route path="/EmployeeDocument" element={<EmployeeDocumentList />} />
            <Route path="/documentlist/:id" element={<DocumentList />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/quiz" element={<CreateQuiz />} />
            <Route path="/resources" element={<PDFList />} />
            <Route path="/Addresource" element={<Addresource />} />
            <Route path="/FollowUpList" element={<FollowUpList />} />
            <Route path="/CustomerFollowUpForm" element={<CustomerFollowUpForm />} />
            <Route path="/assetcategory" element={<AssetCategoryPage />} />
            <Route path="/assets" element={<AssetManagementPage />} />
            <Route path="/ttv" element={<TTV />} />
            <Route path="/PDF" element={<PDFList />} />
            <Route path="/CustomerFollowup" element={<CustomerFollowup />} />
            <Route path="/AddCustomer" element={<AddCustomer />} />
            <Route path="/VideoList" element={<VideoList />} />
            <Route path="/UploadPage" element={<UploadResource />} />
            <Route path="/Cdashboard" element={<CDashboard />} />
            <Route path="/CustomerReport" element={<CustomerReport />} />
            <Route path="/followup-report" element={<CustomerFollowupReport />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/ComingSoonPage" element={<ComingSoonPage />} />
            <Route path="/admin-training-upload" element={<AdminTrainingUpload />} />
            <Route path="/adminCustomerReport" element={<AdminCustomerReport />} />
            <Route path="/b2b-dashboard" element={<B2BDashboard />} />
            <Route path="/coo-dashboard" element={<COODashboard />} />
            <Route path="/tradextv-dashboard" element={<TradexTVDashboard />} />
            <Route path="/customer-settings" element={<CustomerSettings />} />
            <Route path="/it" element={<ITDashboard />} />
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
            </Route>
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default App;

