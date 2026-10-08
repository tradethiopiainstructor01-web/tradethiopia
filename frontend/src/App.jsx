import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useUserStore } from "./store/user";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreatePage = lazy(() => import("./pages/CreatePage"));
const CreateQuiz = lazy(() => import("./pages/CreateQuiz"));
const Addresource = lazy(() => import("./pages/Addresource"));
const HomePage = lazy(() => import("./pages/HomePage"));
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
const CustomerFollowUpForm = lazy(() => import("./components/CustomerFollowForm.jsx"));
const FollowUpList = lazy(() => import("./components/FollowUpList"));
const SecondPage = lazy(() => import("./pages/SecondPage"));
const ThirdPage = lazy(() => import("./pages/ThirdPage"));
const FourthPage = lazy(() => import("./pages/FourthPage"));
const FifthPage = lazy(() => import("./pages/FifthPage.jsx"));
const QuizPage = lazy(() => import("./pages/quizPage.jsx"));
const Sdashboard = lazy(() => import("./pages/sales/Sdashboard.jsx"));
const Srequest = lazy(() => import("./pages/sales/Srequest.jsx"));
const FinanceLayout = lazy(() => import("./pages/sales/FinanceLayout.jsx"));
const PDFList = lazy(() => import('./components/PDFList'));
const InfoForm = lazy(() => import('./pages/InfoForm'));
const EmployeeInfoPage = lazy(() => import('./pages/EmployeeInfoPage'));
const DocumentUploadForm = lazy(() => import('./components/DocumentUploadForm'));
const DocumentList = lazy(() => import('./components/DocumentList'));
const Category = lazy(() => import('./components/category'));
const AssetCategoryPage = lazy(() => import("./pages/AssetCategoryPage.jsx"));
const AssetManagementPage = lazy(() => import("./pages/AssetManagementPage.jsx"));
const EmployeeFileUploadForm = lazy(() => import("./pages/EmployeeFileUploadForm"));
const TTV = lazy(() => import("./pages/ttv.jsx"));
const EmployeeDocumentList = lazy(() => import('./components/EmployeeDocument'));
const CustomerFollowup = lazy(() => import("./components/customer/CustomerFollowup.jsx"));
const AddCustomer = lazy(() => import("./components/customer/AddCustomer"));
const CDashboard = lazy(() => import("./components/customer/Cdashboard"));
const CustomerReport = lazy(() => import("./components/customer/CustomerReport"));
const CustomerFollowupReport = lazy(() => import("./components/customer/CustomerFollowupReport"));
const VideoList = lazy(() => import('./components/customer/VideoList'));
const UploadResource = lazy(() => import('./components/customer/UploadPage'));
const TrainingPage = lazy(() => import("./components/customer/TrainingPage"));
const WaitingForApproval = lazy(() => import("./pages/WaitingForApproval"));
const ComingSoonPage = lazy(() => import("./pages/ComingSoonPage"));
const AdminTrainingUpload = lazy(() => import("./pages/AdminTrainingUpload"));
const AdminCustomerReport = lazy(() => import('./components/AdminCSReport.jsx'));
const CustomerSettings = lazy(() => import("./components/customer/CustomerSettings"));
const CustomerUserManagement = lazy(() => import("./components/customer/CustomerUserManagement"));
const StudentVerificationPage = lazy(() => import("./pages/StudentVerificationPage"));
const ReceptionDashboard = lazy(() => import('./pages/ReceptionDashboard'));
const CooTwoDashboard = lazy(() => import("./pages/coo2/CooTwoDashboard"));
const HRTrainingPage = lazy(() => import('./pages/HRTrainingPage.jsx'));
const ENISRALayout = lazy(() => import("./components/ENSRA/ENSRALayout"));
const ENISRAEnhancedDashboard = lazy(() => import("./components/ENSRA/ENISRAEnhancedDashboard"));
const ENISRANoticeBoard = lazy(() => import("./components/ENSRA/ENSRANoticeBoard"));
const ENISRARequestEmbedded = lazy(() => import("./components/ENSRA/ENISRARequestEmbedded"));
const ENISRAFollowUp = lazy(() => import("./components/ENSRA/ENISRAFollowUp"));
import ProtectedRoute from "./routes/ProtectedRoute";
import ApprovedOnboardingRoute from "./routes/ApprovedOnboardingRoute";
import DashboardPermitRoute from "./routes/DashboardPermitRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
const InstructorLayout = lazy(() => import("./components/instructor/InstructorLayout"));
const InstructorDashboard = lazy(() => import("./pages/instructor/Dashboard"));
const InstructorRequest = lazy(() => import("./pages/instructor/Request"));
const InstructorNoticeBoard = lazy(() => import("./pages/instructor/NoticeBoard"));
const SalesManagerLayout = lazy(() => import("./components/salesmanager/Layout"));
const SalesManagerDashboard = lazy(() => import("./components/salesmanager/SalesManagerDashboard"));
import SalesManagerProtectedRoute from "./components/salesmanager/SalesManagerProtectedRoute";
const CustomerMessagesPage = lazy(() => import("./pages/CustomerMessagesPage.jsx"));
const EmployeePayrollView = lazy(() => import("./components/Payroll/EmployeePayrollView"));
const KPIScorecardPage = lazy(() => import("./pages/sales/KPIScorecardPage"));
const SalesCooKpiPage = lazy(() => import("./pages/sales/SalesCooKpiPage"));
const CustomerKPIPage = lazy(() => import("./pages/customer/CustomerKPIPage"));
const HrKpiPage = lazy(() => import("./pages/HrKpiPage"));
const FinanceCooKpiPage = lazy(() => import("./pages/finance/FinanceCooKpiPage"));

const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const SalesMessagesPage = lazy(() => import("./pages/SalesMessagesPage"));
const FinanceMessagesPage = lazy(() => import("./pages/FinanceMessagesPage"));
const RedirectMessagesPage = lazy(() => import("./pages/RedirectMessagesPage"));
const RequestPage = lazy(() => import("./pages/RequestPage"));
const TeamRequestsPage = lazy(() => import("./pages/sales/TeamRequestsPage.jsx"));
const EmployeeRequestsPage = lazy(() => import("./pages/EmployeeRequestsPage.jsx"));
const EmployeeWarningsPage = lazy(() => import("./pages/EmployeeWarningsPage.jsx"));
const AttendancePage = lazy(() => import("./pages/AttendancePage.jsx"));
const LeaveManagementPage = lazy(() => import("./pages/LeaveManagementPage.jsx"));
const AppLayout = lazy(() => import("./components/AppLayout"));
import ErrorBoundary from "./components/ErrorBoundary";
const SupervisorLayout = lazy(() => import("./pages/supervisor/SupervisorLayout.jsx"));
const SupervisorDashboardPage = lazy(() => import("./pages/supervisor/SupervisorDashboardPage.jsx"));
const SupervisorAccountPage = lazy(() => import("./pages/supervisor/SupervisorAccountPage.jsx"));

const CandidatePoolPage = lazy(() => import('./pages/CandidatePoolPage.jsx'));
const AwardsPage = lazy(() => import('./pages/AwardsPage.jsx'));
const StudentRegistrationPage = lazy(() => import('./components/customer/StudentRegistrationPage.jsx'));
const CSManagerTaskMonitor = lazy(() => import("./components/customer/CSManagerTaskMonitor"));
const FinanceERPPage = lazy(() => import("./pages/sales/FinanceERPPage.jsx"));
const FinanceDashboardPage = lazy(() => import("./pages/sales/FinanceDashboardPage.jsx"));
const FinanceReportsPage = lazy(() => import("./pages/sales/FinanceReportsPage.jsx"));
const FinanceSalesFollowupPage = lazy(() => import("./pages/finance/FinanceSalesFollowupPage.jsx"));
const InventoryPage = lazy(() => import("./pages/sales/InventoryPage.jsx"));
const OrdersPage = lazy(() => import("./pages/sales/OrdersPage.jsx"));
const FinanceDemandsPage = lazy(() => import("./components/finance/DemandsPage.jsx"));
const FinancePaymentsPage = lazy(() => import("./components/finance/PaymentsPage.jsx"));
const PricingPage = lazy(() => import("./pages/sales/PricingPage.jsx"));
const RevenuePage = lazy(() => import("./pages/sales/RevenuePage.jsx"));
const PurchasePage = lazy(() => import("./pages/sales/PurchasePage.jsx"));
const CostManagementPage = lazy(() => import("./pages/sales/CostManagementPage.jsx"));
const FinancePayrollPage = lazy(() => import("./pages/sales/FinancePayrollPage.jsx"));
const CommissionApprovalPage = lazy(() => import("./pages/sales/CommissionApprovalPage.jsx"));
const FinanceFormsPage = lazy(() => import("./pages/sales/FinanceFormsPage.jsx"));
const B2BDashboard = lazy(() => import("./pages/B2BDashboard"));
const COODashboard = lazy(() => import("./pages/COODashboard"));
const TradexTVDashboard = lazy(() => import("./pages/TradexTVDashboard"));
const ITDashboard = lazy(() => import("./pages/it/ITDashboard"));
const SocialMediaDashboardPage = lazy(() => import("./pages/socialmedia/SocialMediaDashboardPage"));
const TessbinAdminDashboard = lazy(() => import("./pages/TessbinAdminDashboard"));
const ChatPage = lazy(() => import("./pages/ChatPage.jsx"));
const PayrollPage = lazy(() => import("./components/Payroll/PayrollPage"));
const AllSalesPage = lazy(() => import("./components/salesmanager/AllSalesPage"));
const SalesActivityLogPage = lazy(() => import("./components/salesmanager/SalesActivityLogPage"));
const SalesRemovalsPage = lazy(() => import("./components/salesmanager/SalesRemovalsPage"));
const PerformancePage = lazy(() => import("./components/salesmanager/PerformancePage"));
const TeamManagementPage = lazy(() => import("./components/salesmanager/TeamManagementPage"));
const TaskManagementPage = lazy(() => import("./components/salesmanager/TaskManagementPage"));
const ReportsPage = lazy(() => import("./components/salesmanager/ReportsPage"));
const CalendarPage = lazy(() => import("./components/salesmanager/CalendarPage"));
const SettingsPage = lazy(() => import("./components/salesmanager/SettingsPage"));
const ContentTrackerReport = lazy(() => import("./components/salesmanager/ContentTrackerReport"));
const CourseManagerPage = lazy(() => import("./components/salesmanager/CourseManagerPage"));
const HRProfilePage = lazy(() => import("./pages/HRProfilePage.jsx"));

const IT_ALLOWED_ROLES = [
  "admin",
  "it",
  "itadmin",
  "itmanager",
  "itteamleader",
  "itleader",
  "itstaff",
  "itofficer",
  "it team leader",
  "it staff",
  "it manager",
  "coo",
  "ceo",
  "hr",
];

function LayoutWrapper({ children }) {
  const location = useLocation();
  const currentUser = useUserStore((state) => state.currentUser);
  const normalizedRole = (currentUser?.role || currentUser?.normalizedRole || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const isHrOrAdmin = ['admin', 'hr', 'coo', 'ceo'].includes(normalizedRole);

  const noNavSidebarRoutes = [
    "/", "/login", "/secondpage", "/employee-info",
    ...(isHrOrAdmin ? [] : ["/employee-file-upload"]),
    "/thirdpage", "/ttv", "/fourthpage", "/fifthpage", "/exam", "/sdashboard", "/sales", "/sales/dashboard", "/finance-dashboard", "/finance-dashboard/reports", "/finance-dashboard/sales-followup",
    "/finance-dashboard/inventory", "/finance-dashboard/orders", "/finance-dashboard/pricing", "/finance-dashboard/revenue", "/finance-dashboard/purchase",
    "/finance/messages", "/finance/team-requests", "/finance/demands", "/finance/payments", "/finance/inventory", "/finance/orders",
    "/addcustomer", "/resource", "/videolist", "/uploadpage", "/my-payroll",
    "/cdashboard", "/waitingforapproval", "/training", "/comingsoonpage", "/customerreport", "/followup-report", "/customerfollowup", "/b2b-dashboard",
    "/coo-dashboard", "/ceo-dashboard", "/coo", "/coo2", "/2-coo", "/coo-2", "/2coo", "/coo-v2", "/coo2-dashboard", "/coo2/dashboard", "/tradextv-dashboard", "/customer-settings", "/customer-user-management", "/customer/student-registration", "/customer/manager-tasks", "/customer-manager-tasks", "/admincustomerreport", "/it", "/salesmanager", "/social-media", "/requests", "/finance-dashboard/payroll", "/finance-dashboard/commission-approval", "/finance-dashboard/forms", "/supervisor", "/supervisor/account", "/finance/requests", "/reception-dashboard",
    "/tessbin-dashboard", "/tessbin", "/verify", "/verify-student", "/tessbin/verify"
  ].map((path) => path.toLowerCase());

  const normalizedPath = location.pathname.toLowerCase();
  const showNavAndSidebar = !noNavSidebarRoutes.some((route) => {
    if (route === "/") {
      return normalizedPath === "/";
    }
    return normalizedPath === route || normalizedPath.startsWith(`${route}/`);
  });

  if (showNavAndSidebar) {
    return <AppLayout>{children}</AppLayout>;
  }
  return children;
}

function App() {

  return (
    <Suspense fallback={<div style={{ padding: "24px" }}>Loading...</div>}>
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/InfoForm" element={<InfoForm />} />
      <Route path="/secondpage" element={<ApprovedOnboardingRoute><SecondPage /></ApprovedOnboardingRoute>} />
      <Route path="/thirdpage" element={<ThirdPage />} />
      <Route path="/fourthpage" element={<FourthPage />} />
      <Route path="/fifthpage" element={<FifthPage />} />
      <Route path="/exam" element={<QuizPage />} />
      <Route path="/WaitingForApproval" element={<WaitingForApproval />} />
      <Route path="/sdashboard" element={<DashboardPermitRoute><Sdashboard /></DashboardPermitRoute>} />
      <Route path="/sales" element={<DashboardPermitRoute><Sdashboard /></DashboardPermitRoute>} />
      <Route path="/sales/dashboard" element={<DashboardPermitRoute><Sdashboard /></DashboardPermitRoute>} />
      <Route path="/srequest" element={<DashboardPermitRoute><Srequest /></DashboardPermitRoute>} />
      <Route path="/finance-dashboard" element={<DashboardPermitRoute><FinanceLayout><FinanceDashboardPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/erp" element={<DashboardPermitRoute><FinanceLayout><FinanceERPPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/accounting" element={<DashboardPermitRoute><FinanceLayout><FinanceERPPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/sales-finance" element={<DashboardPermitRoute><FinanceLayout><FinanceERPPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/purchase-finance" element={<DashboardPermitRoute><FinanceLayout><FinanceERPPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/bank-cash" element={<DashboardPermitRoute><FinanceLayout><FinanceERPPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/expenses" element={<DashboardPermitRoute><FinanceLayout><FinanceERPPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/tax" element={<DashboardPermitRoute><FinanceLayout><FinanceERPPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/settings" element={<DashboardPermitRoute><FinanceLayout><FinanceERPPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/reports" element={<DashboardPermitRoute><FinanceLayout><FinanceReportsPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/sales-followup" element={<DashboardPermitRoute><FinanceLayout><FinanceSalesFollowupPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/coo-kpis" element={<DashboardPermitRoute><FinanceLayout><FinanceCooKpiPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance/coo-kpis" element={<Navigate to="/finance-dashboard/coo-kpis" replace />} />
      <Route path="/finance-dashboard/inventory" element={<DashboardPermitRoute><FinanceLayout><InventoryPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/orders" element={<DashboardPermitRoute><FinanceLayout><OrdersPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/demands" element={<DashboardPermitRoute><FinanceLayout><FinanceDemandsPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/payments" element={<DashboardPermitRoute><FinanceLayout><FinancePaymentsPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/pricing" element={<DashboardPermitRoute><FinanceLayout><PricingPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/create-course" element={<DashboardPermitRoute><FinanceLayout><PricingPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/revenue" element={<DashboardPermitRoute><FinanceLayout><RevenuePage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/purchase" element={<DashboardPermitRoute><FinanceLayout><PurchasePage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/costs" element={<DashboardPermitRoute><FinanceLayout><CostManagementPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/payroll" element={<DashboardPermitRoute><FinanceLayout><FinancePayrollPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/commission-approval" element={<DashboardPermitRoute><FinanceLayout><CommissionApprovalPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance-dashboard/forms" element={<DashboardPermitRoute><FinanceLayout><FinanceFormsPage /></FinanceLayout></DashboardPermitRoute>} />
      <Route path="/finance/inventory" element={<Navigate to="/finance-dashboard/inventory" replace />} />
      <Route path="/finance/orders" element={<Navigate to="/finance-dashboard/orders" replace />} />
      <Route path="/finance/demands" element={<Navigate to="/finance-dashboard/demands" replace />} />
      <Route path="/finance/payments" element={<Navigate to="/finance-dashboard/payments" replace />} />
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
      <Route path="/employee-info" element={<ProtectedRoute><EmployeeInfoPage /></ProtectedRoute>} />
      <Route path="/employee-file-upload" element={<ProtectedRoute><LayoutWrapper><EmployeeFileUploadForm /></LayoutWrapper></ProtectedRoute>} />
      <Route
        path="/users"
        element={
          <RoleProtectedRoute allowedRoles={["hr", "admin"]}>
            <LayoutWrapper><HomePage /></LayoutWrapper>
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <RoleProtectedRoute allowedRoles={["hr", "admin"]}>
            <LayoutWrapper><AttendancePage /></LayoutWrapper>
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/hr-kpi"
        element={
          <RoleProtectedRoute allowedRoles={["hr", "admin", "coo"]}>
            <LayoutWrapper><HrKpiPage /></LayoutWrapper>
          </RoleProtectedRoute>
        }
      />
      <Route path="/dashboard" element={<LayoutWrapper><Dashboard /></LayoutWrapper>} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <LayoutWrapper><HRProfilePage /></LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route path="/course" element={<LayoutWrapper><AdminTrainingUpload /></LayoutWrapper>} />
      <Route path="/hr-training" element={<LayoutWrapper><HRTrainingPage /></LayoutWrapper>} />
      <Route path="/candidate-pool" element={<LayoutWrapper><CandidatePoolPage /></LayoutWrapper>} />
      <Route
        path="/awards"
        element={
          <RoleProtectedRoute allowedRoles={["hr", "admin", "coo"]}>
            <LayoutWrapper><AwardsPage /></LayoutWrapper>
          </RoleProtectedRoute>
        }
      />
      <Route path="/documentupload" element={<DocumentUploadForm />} />
      <Route path="/category" element={<LayoutWrapper><Category /></LayoutWrapper>} />
      <Route path="/documentlist" element={<LayoutWrapper><DocumentList /></LayoutWrapper>} />
      <Route path="/EmployeeDocument" element={<LayoutWrapper><EmployeeDocumentList /></LayoutWrapper>} />
      <Route path="/documentlist/:id" element={<LayoutWrapper><DocumentList /></LayoutWrapper>} />
      <Route path="/create" element={<LayoutWrapper><CreatePage /></LayoutWrapper>} />
      <Route path="/quiz" element={<LayoutWrapper><CreateQuiz /></LayoutWrapper>} />
      <Route path="/resources" element={<LayoutWrapper><PDFList /></LayoutWrapper>} />
      <Route path="/Addresource" element={<LayoutWrapper><Addresource /></LayoutWrapper>} />
      <Route
        path="/FollowUpList"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <FollowUpList />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/CustomerFollowUpForm"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerFollowUpForm />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route path="/assetcategory" element={<LayoutWrapper><AssetCategoryPage /></LayoutWrapper>} />
      <Route path="/assets" element={<LayoutWrapper><AssetManagementPage /></LayoutWrapper>} />
      <Route path="/ttv" element={<TTV />} />
      <Route path="/PDF" element={<LayoutWrapper><PDFList /></LayoutWrapper>} />
      <Route
        path="/CustomerFollowup"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerFollowup />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customerfollowup"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerFollowup />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/AddCustomer"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <AddCustomer />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/addcustomer"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <AddCustomer />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/VideoList"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <VideoList />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/videolist"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <VideoList />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/UploadPage"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <UploadResource />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/uploadpage"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <UploadResource />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/Cdashboard"
        element={
          <DashboardPermitRoute>
            <CDashboard />
          </DashboardPermitRoute>
        }
      />
      <Route
        path="/cdashboard"
        element={
          <DashboardPermitRoute>
            <CDashboard />
          </DashboardPermitRoute>
        }
      />
      <Route
        path="/cdashboard"
        element={
          <ProtectedRoute>
            <CDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/CustomerReport"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerReport />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customerreport"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerReport />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/followup-report"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerFollowupReport />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/training"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <TrainingPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route path="/ComingSoonPage" element={<ComingSoonPage />} />
      <Route
        path="/admin-training-upload"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <AdminTrainingUpload />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/adminCustomerReport"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <AdminCustomerReport />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admincustomerreport"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <AdminCustomerReport />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route path="/b2b-dashboard" element={<DashboardPermitRoute><B2BDashboard /></DashboardPermitRoute>} />
      {['/coo-dashboard', '/coo', '/coo/dashboard', '/2-coo', '/coo-2', '/coo2', '/2coo', '/coo-v2', '/coo2-dashboard', '/coo2/dashboard'].map((path) => (
        <Route
          key={path}
          path={path}
          element={<DashboardPermitRoute><CooTwoDashboard /></DashboardPermitRoute>}
        />
      ))}
      <Route path="/coo-legacy" element={<COODashboard />} />
      <Route path="/ceo-dashboard" element={<COODashboard />} />
      <Route path="/tradextv-dashboard" element={<DashboardPermitRoute><TradexTVDashboard /></DashboardPermitRoute>} />
      <Route path="/reception-dashboard" element={<DashboardPermitRoute><LayoutWrapper><ReceptionDashboard /></LayoutWrapper></DashboardPermitRoute>} />
      <Route
        path="/customer-settings"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerSettings />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tessbin-dashboard"
        element={
          <RoleProtectedRoute allowedRoles={["tessbinadmin", "tessbin", "tessbin_admin", "admin"]}>
            <TessbinAdminDashboard />
          </RoleProtectedRoute>
        }
      />
      <Route path="/tessbin" element={<Navigate to="/tessbin-dashboard" replace />} />
      {/* Public Student Verification Routes */}
      <Route path="/verify/student/:id" element={<StudentVerificationPage />} />
      <Route path="/verify-student/:id" element={<StudentVerificationPage />} />
      <Route path="/verify/:id" element={<StudentVerificationPage />} />
      <Route path="/tessbin/verify/:id" element={<StudentVerificationPage />} />
      <Route
        path="/customer-user-management"
        element={
          <ProtectedRoute>
            <CustomerUserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/student-registration"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <StudentRegistrationPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/manager-tasks"
        element={
          <ProtectedRoute>
            <CSManagerTaskMonitor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer-manager-tasks"
        element={
          <ProtectedRoute>
            <CSManagerTaskMonitor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/social-media"
        element={
          <RoleProtectedRoute allowedRoles={["socialmediamanager", "socialmedia"]}>
            <DashboardPermitRoute>
              <LayoutWrapper>
                <SocialMediaDashboardPage />
              </LayoutWrapper>
            </DashboardPermitRoute>
          </RoleProtectedRoute>
        }
      />
      <Route path="/requests" element={<LayoutWrapper><RequestPage /></LayoutWrapper>} />
      <Route
        path="/leave-management"
        element={
          <RoleProtectedRoute allowedRoles={["hr", "admin"]}>
            <LayoutWrapper><LeaveManagementPage /></LayoutWrapper>
          </RoleProtectedRoute>
        }
      />
      <Route path="/employee-requests" element={<LayoutWrapper><EmployeeRequestsPage /></LayoutWrapper>} />
      <Route
        path="/warnings"
        element={
          <RoleProtectedRoute allowedRoles={["hr", "admin"]}>
            <LayoutWrapper><EmployeeWarningsPage mode="hr" /></LayoutWrapper>
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/my-warnings"
        element={
          <ProtectedRoute>
            <EmployeeWarningsPage mode="employee" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <ChatPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route path="/sales/chat" element={<Navigate to="/chat" replace />} />
      <Route path="/finance/chat" element={<Navigate to="/chat" replace />} />
      <Route path="/customer/chat" element={<Navigate to="/chat" replace />} />
      <Route path="/salesmanager/chat" element={<Navigate to="/chat" replace />} />
      <Route path="/supervisor/chat" element={<Navigate to="/chat" replace />} />
      <Route path="/finance/requests" element={<FinanceLayout><RequestPage /></FinanceLayout>} />
      <Route
        path="/it"
        element={
          <RoleProtectedRoute allowedRoles={IT_ALLOWED_ROLES}>
            <DashboardPermitRoute>
              <ITDashboard />
            </DashboardPermitRoute>
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/instructor"
        element={
          <RoleProtectedRoute allowedRoles={["instructor"]}>
            <DashboardPermitRoute>
              <InstructorLayout />
            </DashboardPermitRoute>
          </RoleProtectedRoute>
        }
      >
        <Route index element={<InstructorDashboard />} />
        <Route path="dashboard" element={<InstructorDashboard />} />
        <Route path="request" element={<InstructorRequest />} />
        <Route path="notice-board" element={<InstructorNoticeBoard />} />
      </Route>

      {/* ENISRA section */}
      <Route path="/enisra" element={<DashboardPermitRoute><ENISRALayout /></DashboardPermitRoute>}>
        <Route index element={<ENISRAEnhancedDashboard />} />
        <Route path="dashboard" element={<ENISRAEnhancedDashboard />} />
        <Route path="follow-up" element={<ENISRAFollowUp />} />
        <Route path="notice-board" element={<ENISRANoticeBoard />} />
        <Route path="request" element={<ENISRARequestEmbedded />} />
      </Route>
      <Route path="/payroll" element={<LayoutWrapper><PayrollPage /></LayoutWrapper>} />
      <Route path="/payroll/*" element={<LayoutWrapper><PayrollPage /></LayoutWrapper>} />
      <Route path="/my-payroll" element={<EmployeePayrollView />} />
      <Route path="/messages" element={<RedirectMessagesPage />} />
      <Route path="/sales/messages" element={<SalesMessagesPage />} />
      <Route path="/customer/messages" element={<CustomerMessagesPage />} />
      <Route path="/customer/kpi" element={<CustomerKPIPage />} />
      <Route path="/supervisor" element={<DashboardPermitRoute><SupervisorLayout /></DashboardPermitRoute>}>
        <Route index element={<SupervisorDashboardPage />} />
        <Route path="requests" element={<TeamRequestsPage />} />
        <Route path="employee-requests" element={<EmployeeRequestsPage />} />
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
        <Route path="employee-requests" element={<EmployeeRequestsPage />} />
        <Route path="course" element={<CourseManagerPage />} />
        <Route path="all-sales" element={<AllSalesPage />} />
        <Route path="activity-log" element={<SalesActivityLogPage />} />
        <Route path="removed" element={<SalesRemovalsPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="kpi" element={<KPIScorecardPage />} />
        <Route path="coo-kpi" element={<SalesCooKpiPage />} />
        <Route path="team" element={<TeamManagementPage />} />
        <Route path="tasks" element={<TaskManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="it-report" element={<ReportsPage />} />
        <Route path="content-tracker-report" element={<ContentTrackerReport />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="trainings" element={<TrainingPage />} />
      </Route>
    </Routes>
    </Suspense>
  );
}

export default App;
