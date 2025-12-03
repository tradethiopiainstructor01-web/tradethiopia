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
import FinanceDashboard from "./components/finance/FinanceDashboard";
import InventoryPage from "./components/finance/InventoryPage";
import OrdersPage from "./components/finance/OrdersPage";
import DemandsPage from "./components/finance/DemandsPage";
import PaymentsPage from "./components/finance/PaymentsPage";
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
import VideoList from './components/customer/VideoList';
import UploadResource from './components/customer/UploadPage';
import TrainingPage from "./components/customer/TrainingPage";
import WaitingForApproval from "./pages/WaitingForApproval";
import ComingSoonPage from "./pages/ComingSoonPage";
import AdminTrainingUpload from "./pages/AdminTrainingUpload";
import AdminCustomerReport from './components/AdminCSReport.jsx';
import B2BDashboard from './pages/B2BDashboard';
import ITDashboard from './pages/ITDashboard';
import COODashboard from './pages/COODashboard';
import CustomerSettings from "./components/customer/CustomerSettings";

function App() {
  const location = useLocation();

  // Define the paths where Sidebar and Navbar should not appear
  const noNavSidebarRoutes = [
    "/", "/login", "/secondpage", "/employee-info", "/employee-file-upload", 
    "/thirdpage", "/ttv", "/fourthpage", "/fifthpage", "/exam", "/sdashboard", 
    "/AddCustomer", "/Resource", "/VideoList", "/UploadPage", 
    "/Cdashboard", "/waitingForApproval", "/training","/ComingSoonPage", "/CustomerReport", "/CustomerFollowup", "/b2b-dashboard",
    "/it-dashboard", "/it", "/coo-dashboard", "/tradextv-dashboard", "/customer-settings"
  ];

  // Check if the current path is a no-sidebar, no-navbar route
  // Exclude any /finance routes from the main Nav/Sidebar so Finance pages
  // can use their own `FinanceLayout` (similar to `/sdashboard` and `/Cdashboard`).
  const isFinanceRoute = location.pathname.startsWith("/finance");
  const showNavAndSidebar = !noNavSidebarRoutes.includes(location.pathname) && !isFinanceRoute;

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
            <Route path="/finance" element={<FinanceDashboard />} />
            <Route path="/finance/inventory" element={<InventoryPage />} />
            <Route path="/finance/orders" element={<OrdersPage />} />
            <Route path="/finance/demands" element={<DemandsPage />} />
            <Route path="/finance/payments" element={<PaymentsPage />} />
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
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/ComingSoonPage" element={<ComingSoonPage />} />
            <Route path="/admin-training-upload" element={<AdminTrainingUpload />} />
            <Route path="/adminCustomerReport" element={<AdminCustomerReport />} />
            <Route path="/b2b-dashboard" element={<B2BDashboard />} />

            <Route path="/it-dashboard" element={<ITDashboard />} />
            <Route path="/it" element={<ITDashboard />} />

            <Route path="/coo-dashboard" element={<COODashboard />} />
            <Route path="/tradextv-dashboard" element={<TradexTVDashboard />} />
            <Route path="/customer-settings" element={<CustomerSettings />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
