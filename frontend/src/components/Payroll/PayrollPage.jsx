import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Stack,
  SimpleGrid,
  Grid,
  GridItem,
  Card,
  CardBody,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  Button,
  Select,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseButton,
  FormControl,
  FormLabel,
  Badge,
  IconButton,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Icon,
  Avatar,
  CloseButton,
  ButtonGroup,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
import { AddIcon, DownloadIcon, ViewIcon, LockIcon, CheckIcon, EditIcon, DeleteIcon, SearchIcon, RepeatIcon } from '@chakra-ui/icons';
import { 
  FiDollarSign, 
  FiSearch, 
  FiUser, 
  FiUsers, 
  FiCalendar, 
  FiShield, 
  FiBriefcase, 
  FiX, 
  FiCheck, 
  FiInfo, 
  FiCheckCircle, 
  FiFileText,
  FiTrendingUp,
  FiFilter,
  FiGrid,
  FiList,
  FiChevronUp,
  FiChevronDown,
  FiUserCheck,
  FiUserX,
  FiRefreshCw,
  FiClock,
  FiCreditCard
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../Layout';
import EmployeePayrollDrawer from './EmployeePayrollDrawer';
import { 
  fetchPayrollData, 
  calculatePayroll, 
  submitHrAdjustment, 
  submitFinanceAdjustment, 
  approvePayroll, 
  lockPayroll, 
  fetchCommissionData, 
  submitCommission, 
  deleteCommission, 
  fetchSalesDataForCommission, 
  finalizePayroll, 
  fetchPayrollHistory,
  updateEmployeeSalary
} from '../../services/payrollService';
import { calculateNetSalary, formatETB, calculateEthiopianIncomeTax, calculatePension, calculateEmployerPension } from '../../utils/ethiopianTax';
import { fetchContentTrackerEntries } from '../../services/contentTrackerService';
import {
  getMonthRange,
  normalizeTrackerResponse,
  normalizeAgentKey,
  summarizeEntriesByAgent,
  mapSummariesByKey,
} from '../../utils/contentTrackerTargets';

const PayrollPage = ({ wrapLayout = true }) => {
  const location = useLocation();
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('active'); // 'active' | 'inactive' | 'all'
  const [payrollStatusFilter, setPayrollStatusFilter] = useState('all'); // 'all' | 'draft' | 'hr_submitted' | ...
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState('compact'); // 'compact' | 'audit'
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isSavingSalary, setIsSavingSalary] = useState(false);
  const [salaryFormData, setSalaryFormData] = useState({
    userId: '',
    employeeName: '',
    department: '',
    role: '',
    basicSalary: 0,
    transportAllowance: 0,
    salaryBankAccountNumber: '',
    tinNumber: '',
  });
  const [isHrModalOpen, setIsHrModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedEmployeeForDrawer, setSelectedEmployeeForDrawer] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [hrFormData, setHrFormData] = useState({
    userId: '',
    daysWorked: 30,
    daytimeOvertimeHours: 0,
    nightOvertimeHours: 0,
    restDayOvertimeHours: 0,
    holidayOvertimeHours: 0,
    lateDays: 0,
    absenceDays: 0,
    absenceDeduction: 0,
    loan: 0,
    transportAllowance: 0,
    taxableAllowance: 0,
    hrAllowances: 0
  });
  const [financeFormData, setFinanceFormData] = useState({
    userId: '',
    financeAllowances: 0,
    financeDeductions: 0,
    hrAllowances: 0
  });
  const [commissionFormData, setCommissionFormData] = useState({
    userId: '',
    numberOfSales: 0,
    grossCommission: 0,
    commissionTax: 0,
    totalCommission: 0,
    commissionDetails: []
  });
  const [contentSummaries, setContentSummaries] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');
  const [salesData, setSalesData] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [commissionDateRange, setCommissionDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [useDateRange, setUseDateRange] = useState(false);
  const [hasStoredCommission, setHasStoredCommission] = useState(false);
  const [clearingCommission, setClearingCommission] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyFilters, setHistoryFilters] = useState({
    username: '',
    month: '',
    department: ''
  });
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  const createEmptyCommissionForm = (userId = '') => ({
    userId,
    numberOfSales: 0,
    grossCommission: 0,
    commissionTax: 0,
    totalCommission: 0,
    commissionDetails: []
  });
  
  const toast = useToast();
  const navigate = useNavigate();
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headerBg = useColorModeValue('teal.600', 'teal.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tableBg = useColorModeValue('white', 'gray.800');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const negativeBg = useColorModeValue('red.50', 'red.900');
  const negativeColor = useColorModeValue('red.600', 'red.200');

  const loadPayrollContentSummaries = useCallback(async () => {
    setContentLoading(true);
    setContentError('');
    try {
      const range = getMonthRange(selectedMonth);
      if (!range) {
        setContentSummaries([]);
        return [];
      }
      const response = await fetchContentTrackerEntries({
        approved: true,
        dateFrom: range.start.toISOString(),
        dateTo: range.end.toISOString(),
      });
      const entries = normalizeTrackerResponse(response);
      const summaries = summarizeEntriesByAgent(entries, selectedMonth);
      setContentSummaries(summaries);
      return summaries;
    } catch (err) {
      console.error('Failed to load content tracker summaries for payroll:', err);
      setContentError('Unable to load the content tracker bonus data.');
      setContentSummaries([]);
      return [];
    } finally {
      setContentLoading(false);
    }
  }, [selectedMonth]);

  const applyContentBonuses = (data, summaries) => {
    const summaryMap = mapSummariesByKey(summaries);
    return data.map((employee) => {
      const agentKey = normalizeAgentKey(employee.userId);
      const summary = agentKey ? summaryMap[agentKey] : null;
      const baseSalary = employee.grossSalary ?? employee.basicSalary ?? 0;
      const bonus = summary?.bonusAmount || 0;
      return {
        ...employee,
        contentBonus: bonus,
        grossSalaryWithBonus: baseSalary + bonus,
      };
    });
  };

  // Fetch payroll data
const fetchPayrollDataHandler = async () => {
  try {
      setLoading(true);
      const cleanMonth = selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)
        ? selectedMonth
        : new Date().toISOString().slice(0, 7);
      const data = await fetchPayrollData(cleanMonth, {
        year: selectedYear,
        department: selectedDepartment,
        role: selectedRole,
        status: accountStatusFilter
      });
      const summaries = await loadPayrollContentSummaries();
      const baseSummaries = Array.isArray(summaries) && summaries.length ? summaries : contentSummaries;
      setPayrollData(applyContentBonuses(data, baseSummaries));
      setError('');
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      setError('Failed to fetch payroll data');
      toast({
        title: 'Error',
        description: 'Failed to fetch payroll data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
    setLoading(false);
  }
};

  const fetchPayrollHistoryHandler = useCallback(async (filters = {}) => {
    try {
      setHistoryLoading(true);
      const history = await fetchPayrollHistory(filters);
      setPayrollHistory(Array.isArray(history) ? history : []);
      setHistoryError('');
      setHasLoadedHistory(true);
    } catch (err) {
      console.error('Error fetching payroll history:', err);
      setHistoryError('Failed to load payroll history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchFilteredPayrollHistory = useCallback(() => {
    if (!historyFilters.month) {
      setPayrollHistory([]);
      setHasLoadedHistory(false);
      setHistoryError('Please choose a payroll month before loading history.');
      return Promise.resolve();
    }

    const params = {};
    params.month = historyFilters.month;
    if (historyFilters.department) {
      params.department = historyFilters.department;
    }
    return fetchPayrollHistoryHandler(params);
  }, [fetchPayrollHistoryHandler, historyFilters.department, historyFilters.month]);

  const handleHistoryFilterChange = (field, value) => {
    setHistoryFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredPayrollHistory = payrollHistory.filter((entry) => {
    const userFilter = historyFilters.username.toLowerCase().trim();
    const monthFilter = historyFilters.month;
    const departmentFilter = historyFilters.department.toLowerCase().trim();

    const entryUser = (entry.employeeName || '').toLowerCase();
    if (userFilter && !entryUser.includes(userFilter)) {
      return false;
    }

    if (monthFilter && entry.month !== monthFilter) {
      return false;
    }

    if (departmentFilter && entry.department?.toLowerCase().indexOf(departmentFilter) === -1) {
      return false;
    }

    return true;
  });
  const canDisplayPayrollHistory = hasLoadedHistory && Boolean(historyFilters.month);
  
  // Fetch departments
  const fetchDepartments = async () => {
    try {
      // This would typically come from an API endpoint
      setDepartments(['sales', 'HR', 'finance', 'IT', 'admin']);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };
  
  // Calculate payroll for all employees
  const calculatePayrollHandler = async () => {
    try {
      setLoading(true);
      const data = await calculatePayroll({
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error calculating payroll:', err);
      toast({
        title: 'Error',
        description: 'Failed to calculate payroll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle HR form change
  const handleHrFormChange = (e) => {
    const { name, value } = e.target;
    setHrFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Submit HR adjustment
  const submitHrAdjustmentHandler = async () => {
    try {
      const data = await submitHrAdjustment({
        ...hrFormData,
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsHrModalOpen(false);
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error submitting HR adjustment:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit HR adjustment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Submit Finance adjustment
  const submitFinanceAdjustmentHandler = async () => {
    try {
      const data = await submitFinanceAdjustment({
        ...financeFormData,
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsFinanceModalOpen(false);
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error submitting Finance adjustment:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit Finance adjustment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Approve payroll
  const approvePayrollHandler = async (payrollId) => {
    try {
      const data = await approvePayroll(payrollId);
      
      // Clear commission data when payroll is approved
      const employee = payrollData.find(p => p._id === payrollId);
      if (employee && employee.userId) {
        await clearCommissionData(employee.userId._id || employee.userId);
      }
      
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error approving payroll:', err);
      toast({
        title: 'Error',
        description: 'Failed to approve payroll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const finalizePayrollHandler = async (payrollId) => {
    try {
      const data = await finalizePayroll(payrollId);
      
      // Clear commission data when payroll is finalized
      const employee = payrollData.find(p => p._id === payrollId);
      if (employee && employee.userId) {
        await clearCommissionData(employee.userId._id || employee.userId);
      }
      
      toast({
        title: 'Payroll Finalized',
        description: data.message,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      
      fetchPayrollDataHandler();
      
      setPayrollHistory([]);
      setHasLoadedHistory(false);
      setHistoryFilters({ username: '', month: '', department: '' });
    } catch (err) {
      console.error('Error finalizing payroll:', err);
      toast({
        title: 'Error',
        description: 'Failed to finalize payroll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Clear commission data for a specific user and period
  const clearCommissionData = async (userId) => {
    try {
      await deleteCommission({
        userId,
        month: selectedMonth,
        year: selectedYear
      });
      
      // Reset commission form data
      setCommissionFormData({
        userId: '',
        numberOfSales: 0,
        grossCommission: 0,
        commissionTax: 0,
        totalCommission: 0,
        commissionDetails: []
      });
      
      setHasStoredCommission(false);
      setSalesData([]);
      
    } catch (error) {
      console.error('Error clearing commission data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear commission data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

// Lock payroll
  const lockPayrollHandler = async (payrollId) => {
    try {
      const data = await lockPayroll(payrollId);
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error locking payroll:', err);
      toast({
        title: 'Error',
        description: 'Failed to lock payroll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // View employee details - Open slide-over drawer instead of navigating to separate page
  const viewEmployeeDetails = (employee) => {
    setSelectedEmployeeForDrawer({
      ...employee,
      month: selectedMonth,
      year: selectedYear
    });
    setIsDetailsDrawerOpen(true);
  };

  const handleViewDetails = (employee) => {
    viewEmployeeDetails(employee);
  };

  const viewHistoryDetails = (historyEntry) => {
    const employeeData = historyEntry.payrollData || historyEntry;
    setSelectedEmployeeForDrawer({
      ...employeeData,
      month: historyEntry.month || selectedMonth,
      year: historyEntry.year || selectedYear
    });
    setIsDetailsDrawerOpen(true);
  };

  // Open Set Basic Salary modal
  const openSalaryModal = (employee) => {
    const u = employee.userId || {};
    setSelectedEmployee(employee);
    setSalaryFormData({
      userId: u._id || u,
      employeeName: employee.employeeName || u.fullName || u.username || 'Employee',
      department: employee.department || u.department || '',
      role: u.role || 'employee',
      basicSalary: employee.basicSalary || u.salary || 0,
      transportAllowance: employee.transportAllowance ?? u.transportAllowance ?? 0,
      salaryBankAccountNumber: employee.salaryBankAccountNumber || u.salaryBankAccountNumber || u.personalInformation?.salaryBankAccountNumber || u.bankAccountNumber || '',
      tinNumber: employee.tinNumber || u.tinNumber || u.personalInformation?.tinNumber || '',
    });
    setIsSalaryModalOpen(true);
  };

  // Save employee Basic Salary & auto-synchronize monthly payroll
  const handleSaveSalary = async () => {
    if (!salaryFormData.userId) return;
    setIsSavingSalary(true);
    try {
      const newSalary = Math.max(0, Number(salaryFormData.basicSalary) || 0);
      const newTransportAllowance = Math.max(0, Number(salaryFormData.transportAllowance) || 0);
      await updateEmployeeSalary(salaryFormData.userId, {
        salary: newSalary,
        transportAllowance: newTransportAllowance,
        salaryBankAccountNumber: salaryFormData.salaryBankAccountNumber,
        tinNumber: salaryFormData.tinNumber,
      });
      toast({
        title: 'Basic Salary & Transport Updated',
        description: `Basic salary set to ${formatCurrency(newSalary)} and non-taxable transport allowance to ${formatCurrency(newTransportAllowance)}. Draft payroll synchronized based on Ethiopian regulations.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      setIsSalaryModalOpen(false);
      await fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error updating salary:', err);
      toast({
        title: 'Failed to update salary',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSavingSalary(false);
    }
  };

  // User permissions and roles

  // Get current user role
  const getCurrentUserRole = () => {
    const role = localStorage.getItem('userRole');
    return role ? role.toLowerCase() : '';
  };

  // Check if user has HR permissions
  const isHrUser = () => {
    const role = getCurrentUserRole();
    return role === 'hr' || role === 'admin';
  };

  // Check if user has Finance permissions
  const isFinanceUser = () => {
    const role = getCurrentUserRole();
    return role === 'finance' || role === 'admin';
  };

  // Check if user is exactly Finance (not admin)
  const isFinanceRoleUser = () => {
    const role = getCurrentUserRole();
    return role === 'finance';
  };

  // Check if user has Admin permissions
  const isAdminUser = () => {
    const role = getCurrentUserRole();
    return  role === 'hr'|| role === 'admin';
  };

  // Finance or Admin can finalize payroll
  const canFinalizePayroll = () => {
    const role = getCurrentUserRole();
    return role === 'finance' || role === 'admin';
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      // Create CSV content
      const headers = [
        'Employee Name',
        'Department',
        'Basic Salary',
        'Gross Salary',
        'Income Tax',
        'Pension (7%)',
        'Overtime Pay',
        'Sales Commission',
        'Non-Taxable Transport Allowance',
        'Loan',
        'Total Deductions',
        'Net Salary',
        'Status'
      ];
      
      const csvContent = [
        headers.join(','),
        ...payrollData.map(employee => {
          const empTotDed = (employee.incomeTax || 0) + (employee.pension || 0) + (employee.loan || 0) + (employee.lateDeduction || 0) + (employee.absenceDeduction || 0) + getDisplayFinanceDeductions(employee);
          return [
            `"${employee.employeeName || employee.userId?.fullName || employee.userId?.username || 'Unknown Employee'}"`,
            employee.department,
            employee.basicSalary || 0,
            getDisplayGrossSalary(employee),
            employee.incomeTax || 0,
            employee.pension || 0,
            employee.overtimePay || 0,
            employee.salesCommission || 0,
            employee.transportAllowance || 0,
            employee.loan || 0,
            empTotDed,
            employee.netSalary || employee.finalSalary || 0,
            employee.status
          ].join(',');
        })
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `payroll_${selectedMonth}_${selectedYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Successful',
        description: 'Payroll data exported to CSV',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      toast({
        title: 'Export Failed',
        description: 'Failed to export payroll data to CSV',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Export to PDF
  const exportToPDF = () => {
    try {
      // For now, we'll create a simple text-based PDF export
      // In a real application, you might want to use a library like jsPDF
      
      // Create a simple text representation
      let pdfContent = `Payroll Report\n`;
      pdfContent += `Period: ${selectedMonth} ${selectedYear}\n\n`;
      
      payrollData.forEach(employee => {
        const empTotDed = (employee.incomeTax || 0) + (employee.pension || 0) + (employee.loan || 0) + (employee.lateDeduction || 0) + (employee.absenceDeduction || 0) + getDisplayFinanceDeductions(employee);
        pdfContent += `${employee.employeeName || employee.userId?.fullName || employee.userId?.username || 'Unknown Employee'}\n`;
        pdfContent += `  Department: ${employee.department}\n`;
        pdfContent += `  Basic Salary: ${formatCurrency(employee.basicSalary || 0)}\n`;
        pdfContent += `  Gross Salary: ${formatCurrency(getDisplayGrossSalary(employee))}\n`;
        pdfContent += `  Income Tax: ${formatCurrency(employee.incomeTax || 0)}\n`;
        pdfContent += `  Pension (7%): ${formatCurrency(employee.pension || 0)}\n`;
        pdfContent += `  Overtime Pay: ${formatCurrency(employee.overtimePay || 0)}\n`;
        pdfContent += `  Sales Commission: ${formatCurrency(employee.salesCommission || 0)}\n`;
        pdfContent += `  Non-Taxable Transport Allowance: ${formatCurrency(employee.transportAllowance || 0)}\n`;
        pdfContent += `  Loan: ${formatCurrency(employee.loan || 0)}\n`;
        pdfContent += `  Total Deductions: ${formatCurrency(empTotDed)}\n`;
        pdfContent += `  Net Salary: ${formatCurrency(employee.netSalary || employee.finalSalary || 0)}\n`;
        pdfContent += `  Status: ${employee.status}\n\n`;
      });
      
      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `payroll_${selectedMonth}_${selectedYear}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Successful',
        description: 'Payroll data exported to PDF',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      toast({
        title: 'Export Failed',
        description: 'Failed to export payroll data to PDF',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Export Commercial Bank of Ethiopia (CBE) Bank CSV Format
  const exportBankCSV = () => {
    try {
      const headers = ['No', 'Employee Name', 'Bank Account Number', 'TIN Number', 'Net Pay (ETB)', 'Department'];
      const rows = payrollData.map((emp, index) => [
        index + 1,
        `"${emp.employeeName || emp.userId?.fullName || emp.userId?.username || 'Unknown Employee'}"`,
        `"${emp.salaryBankAccountNumber || emp.userId?.personalInformation?.salaryBankAccountNumber || emp.userId?.bankAccountNumber || 'N/A'}"`,
        `"${emp.tinNumber || emp.userId?.personalInformation?.tinNumber || 'N/A'}"`,
        (emp.netSalary || emp.finalSalary || 0).toFixed(2),
        `"${emp.department || ''}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `cbe_bank_disbursement_${selectedMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Bank Export Successful',
        description: 'CBE Bank Transfer CSV exported successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error exporting bank CSV:', err);
      toast({
        title: 'Export Failed',
        description: 'Failed to export bank CSV',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Open HR modal
  const openHrModal = (employee) => {
    setSelectedEmployee(employee);
    setHrFormData({
      userId: employee.userId._id || employee.userId,
      daysWorked: employee.daysWorked ?? 30,
      daytimeOvertimeHours: 0,
      nightOvertimeHours: 0,
      restDayOvertimeHours: 0,
      holidayOvertimeHours: 0,
      lateDays: employee.lateDays || 0,
      absenceDays: employee.absenceDays || 0,
      absenceDeduction: employee.absenceDeduction || 0,
      loan: employee.loan || 0,
      transportAllowance: employee.transportAllowance || 0,
      taxableAllowance: employee.taxableAllowance || 0,
      hrAllowances: employee.hrAllowances || 0
    });
    setIsHrModalOpen(true);
  };
  
  // Open Finance modal
  const openFinanceModal = (employee) => {
    setSelectedEmployee(employee);
    setFinanceFormData({
      userId: employee.userId._id || employee.userId,
      financeAllowances: getDisplayFinanceAllowances(employee),
      financeDeductions: getDisplayFinanceDeductions(employee),
      hrAllowances: employee.hrAllowances || 0
    });
    setIsFinanceModalOpen(true);
  };
  
  // Handle Finance form change
  const handleFinanceFormChange = (e) => {
    const { name, value } = e.target;
    setFinanceFormData({
      ...financeFormData,
      [name]: parseFloat(value) || 0
    });
  };
  
  // Open Commission modal
  const openCommissionModal = async (employee) => {
    console.log('=== OPENING COMMISSION MODAL ===');
    console.log('Selected employee:', employee);
    console.log('Current filters:', { selectedMonth, selectedYear });
    
    setSelectedEmployee(employee);
    setHasStoredCommission(false);
    setClearingCommission(false);
    setIsCommissionModalOpen(true);
    
    // Reset date range options
    setUseDateRange(false);
    setCommissionDateRange({
      startDate: '',
      endDate: ''
    });
    
    try {
      // Fetch existing commission data if available
      console.log('Fetching existing commission data...');
      const commissionData = await fetchCommissionData(
        employee.userId._id || employee.userId,
        selectedMonth,
        selectedYear
      );
      console.log('Existing commission data:', commissionData);
      
      if (commissionData) {
        setHasStoredCommission(true);
        setCommissionFormData({
          userId: employee.userId._id || employee.userId,
          numberOfSales: commissionData.numberOfSales || 0,
          grossCommission: commissionData.grossCommission || 0,
          commissionTax: commissionData.commissionTax || 0,
          totalCommission: commissionData.totalCommission || 0,
          commissionDetails: commissionData.commissionDetails || []
        });
      } else {
        setHasStoredCommission(false);
        setCommissionFormData(createEmptyCommissionForm(employee.userId._id || employee.userId));
      }
      
      // Fetch sales data for this employee (initially using month/year)
      if (employee.department === 'sales') {
        console.log('Fetching sales data for commission calculation...');
        setLoadingSales(true);
        const salesDataResult = await fetchSalesDataForCommission(
          employee.userId._id || employee.userId,
          selectedMonth,
          selectedYear
        );
        console.log('Sales data received:', salesDataResult);
        
        // The salesDataResult contains the sales data directly, not in a .sales property
        const salesArray = extractSalesArray(salesDataResult);
        setSalesData(salesArray);
        
        // Auto-calculate commission from sales data
        if (salesArray.length > 0) {
          // Calculate totals from sales data
          let totalGross = 0;
          let totalTax = 0;
          let totalNet = 0;
          
          salesArray.forEach(sale => {
            totalGross += sale.grossCommission || 0;
            totalTax += sale.commissionTax || 0;
            totalNet += sale.netCommission || 0;
          });
          
          // Update commission form data with calculated values
          const updatedCommissionDetails = salesArray.map(sale => ({
            customerId: sale.customerId,
            customerName: sale.customerName,
            saleAmount: sale.saleAmount || 0,
            commissionRate: 0.07,
            grossCommission: sale.grossCommission || 0,
            commissionTax: sale.commissionTax || 0,
            netCommission: sale.netCommission || 0,
            date: sale.date
          }));
          
          setCommissionFormData(prev => ({
            ...prev,
            numberOfSales: salesArray.length,
            grossCommission: Math.round(totalGross),
            commissionTax: Math.round(totalTax),
            totalCommission: Math.round(totalNet), // Using net commission as the total
            commissionDetails: updatedCommissionDetails
          }));
        }
        
        setLoadingSales(false);
      }
    } catch (err) {
      console.error('Error fetching commission data:', err);
      console.error('Error details:', err.response?.data);
      toast({
        title: 'Error',
        description: 'Failed to fetch commission data: ' + (err.response?.data?.message || err.message),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoadingSales(false);
    }
  };
  
  // Handle Commission form change
  const handleCommissionFormChange = (e) => {
    const { name, value } = e.target;
    setCommissionFormData({
      ...commissionFormData,
      [name]: parseFloat(value) || 0
    });
  };

  const normalizeSaleRecord = (sale) => {
    if (!sale) return null;
    const commissionSource = sale.grossCommission !== undefined
      ? sale
      : sale.commission || {};
    return {
      customerId: sale.customerId || sale._id,
      customerName: sale.customerName || '',
      saleAmount: sale.saleAmount ?? sale.coursePrice ?? sale.commission?.saleAmount ?? 0,
      grossCommission: Number(commissionSource.grossCommission) || 0,
      commissionTax: Number(commissionSource.commissionTax) || 0,
      netCommission: Number(commissionSource.netCommission) || 0,
      date: sale.date
    };
  };

  const extractSalesArray = (payload) => {
    const raw = Array.isArray(payload)
      ? payload
      : payload?.commissionDetails || payload?.sales || [];
    return raw.map(normalizeSaleRecord).filter(Boolean);
  };

  // Auto-calculate commission based on sales data
  const calculateCommissionFromSales = () => {
    if (salesData && salesData.length > 0) {
      // Calculate totals from sales data
      let totalGross = 0;
      let totalTax = 0;
      let totalNet = 0;
      
      salesData.forEach(sale => {
        totalGross += sale.grossCommission || 0;
        totalTax += sale.commissionTax || 0;
        totalNet += sale.netCommission || 0;
      });
      
      // Update commission form data with calculated values
      const updatedCommissionDetails = salesData.map(sale => ({
        customerId: sale.customerId,
        customerName: sale.customerName,
        saleAmount: sale.saleAmount || 0,
        commissionRate: 0.07,
        grossCommission: sale.grossCommission || 0,
        commissionTax: sale.commissionTax || 0,
        netCommission: sale.netCommission || 0,
        date: sale.date
      }));
      
      setCommissionFormData({
        ...commissionFormData,
        numberOfSales: salesData.length,
        grossCommission: Math.round(totalGross),
        commissionTax: Math.round(totalTax),
        totalCommission: Math.round(totalNet), // Using net commission as the total
        commissionDetails: updatedCommissionDetails
      });
    }
  };

  // Submit Commission
  const submitCommissionHandler = async () => {
    try {
      const data = await submitCommission({
        ...commissionFormData,
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setHasStoredCommission(true);
      setIsCommissionModalOpen(false);
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error submitting commission:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit commission',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Fetch sales data with date range option
  const fetchSalesDataWithDateRange = async () => {
    console.log('=== FETCHING SALES DATA WITH DATE RANGE ===');
    console.log('Selected employee:', selectedEmployee);
    console.log('Use date range:', useDateRange);
    console.log('Commission date range:', commissionDateRange);
    
    if (!selectedEmployee) return;
    
    try {
      setLoadingSales(true);
      
      let params = {};
      
      if (useDateRange && commissionDateRange.startDate && commissionDateRange.endDate) {
        // Use date range
        params = {
          startDate: commissionDateRange.startDate,
          endDate: commissionDateRange.endDate
        };
        console.log('Using date range parameters:', params);
      } else {
        // Use month/year from the main filters
        params = {
          month: selectedMonth, // Full "YYYY-MM" format
          year: selectedYear.toString() // Convert to string to match expected format
        };
        console.log('Using month/year parameters:', params);
      }
      
      console.log('Calling fetchSalesDataForCommission with:', {
        agentId: selectedEmployee.userId._id || selectedEmployee.userId,
        ...params
      });
      
      const salesDataResult = await fetchSalesDataForCommission(
        selectedEmployee.userId._id || selectedEmployee.userId,
        params.month || undefined,
        params.year || undefined,
        params.startDate || undefined,
        params.endDate || undefined
      );
      
      console.log('Received sales data result:', salesDataResult);
      console.log('Sales data result type:', typeof salesDataResult);
      console.log('Sales data result sales property:', salesDataResult?.sales);
      console.log('Sales data result sales length:', salesDataResult?.sales?.length);
      
      // The salesDataResult is the actual data, not in a .sales property
      const salesArray = extractSalesArray(salesDataResult);
      console.log('Setting sales data state with:', salesArray);
      setSalesData(salesArray);
      console.log('Sales data state after setting:', salesArray);
      
      // Auto-calculate commission from sales data
      if (salesArray.length > 0) {
        // Calculate totals from sales data
        let totalGross = 0;
        let totalTax = 0;
        let totalNet = 0;
        
        salesArray.forEach(sale => {
          totalGross += sale.grossCommission || 0;
          totalTax += sale.commissionTax || 0;
          totalNet += sale.netCommission || 0;
        });
        
        // Update commission form data with calculated values
        const updatedCommissionDetails = salesArray.map(sale => ({
          customerId: sale.customerId,
          customerName: sale.customerName,
          saleAmount: sale.saleAmount || 0,
          commissionRate: 0.07,
          grossCommission: sale.grossCommission || 0,
          commissionTax: sale.commissionTax || 0,
          netCommission: sale.netCommission || 0,
          date: sale.date
        }));
        
        setCommissionFormData(prev => ({
          ...prev,
          numberOfSales: salesArray.length,
          grossCommission: Math.round(totalGross),
          commissionTax: Math.round(totalTax),
          totalCommission: Math.round(totalNet), // Using net commission as the total
          commissionDetails: updatedCommissionDetails
        }));
      }
      
      setLoadingSales(false);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      console.error('Error response:', err.response?.data);
      toast({
        title: 'Error',
        description: 'Failed to fetch sales data: ' + (err.response?.data?.message || err.message),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoadingSales(false);
    }
  };

  const clearCommissionHandler = async () => {
    if (!selectedEmployee) return;
    try {
      setClearingCommission(true);
      await deleteCommission({
        userId: selectedEmployee.userId._id || selectedEmployee.userId,
        month: selectedMonth,
        year: selectedYear
      });
      toast({
        title: 'Success',
        description: 'Commission record cleared for this period',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setHasStoredCommission(false);
      setCommissionFormData(createEmptyCommissionForm(selectedEmployee.userId._id || selectedEmployee.userId));
      setSalesData([]);
      await fetchSalesDataWithDateRange();
      fetchPayrollDataHandler();
    } catch (err) {
      console.error('Error clearing commission:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to clear saved commission',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setClearingCommission(false);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setCommissionDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle between month/year and date range
  const toggleDateSelection = () => {
    setUseDateRange(!useDateRange);
    // Clear date range when switching back to month/year
    if (useDateRange) {
      setCommissionDateRange({
        startDate: '',
        endDate: ''
      });
    }
  };

  // Effect to fetch sales data when date range changes or when commission modal opens
  useEffect(() => {
    if (isCommissionModalOpen && selectedEmployee && selectedEmployee.department === 'sales') {
      fetchSalesDataWithDateRange();
    }
  }, [useDateRange, commissionDateRange, isCommissionModalOpen, selectedEmployee]);

  // Effect to fetch data on mount and when filters change
  useEffect(() => {
    fetchPayrollDataHandler();
    fetchDepartments();
  }, [selectedMonth, selectedYear, selectedDepartment, selectedRole, accountStatusFilter]);
  
  // Format currency with no wrapping and uniform decimal precision
  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `ETB ${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  
  const getDisplayGrossSalary = (employee) => {
    return employee.grossSalaryWithBonus ?? employee.grossSalary ?? employee.basicSalary ?? 0;
  };

  const getDisplayFinanceAllowances = (employee) => {
    return Number(employee.financeAllowances ?? 0);
  };

  const getDisplayFinanceDeductions = (employee) => {
    return Number(employee.financeDeductions ?? 0);
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'yellow';
      case 'hr_submitted': return 'blue';
      case 'finance_reviewed': return 'purple';
      case 'approved': return 'green';
      case 'locked': return 'red';
      default: return 'gray';
    }
  };

  const getStatusBadge = (status) => {
    const schemeMap = {
      draft: 'yellow',
      hr_submitted: 'blue',
      finance_reviewed: 'purple',
      approved: 'green',
      locked: 'red'
    };
    const labelMap = {
      draft: 'Draft',
      hr_submitted: 'HR Submitted',
      finance_reviewed: 'Finance Reviewed',
      approved: 'Approved',
      locked: 'Locked'
    };
    const norm = (status || 'draft').toLowerCase();
    return (
      <Badge colorScheme={schemeMap[norm] || 'gray'} fontSize="10px" borderRadius="full" px={2}>
        {labelMap[norm] || norm.toUpperCase()}
      </Badge>
    );
  };

  // Interactive Column Sorting handler
  const handleSortColumn = (columnField) => {
    if (sortBy === `${columnField}-asc`) {
      setSortBy(`${columnField}-desc`);
    } else if (sortBy === `${columnField}-desc`) {
      setSortBy(`${columnField}-asc`);
    } else {
      // Default to desc for financial numbers and days, asc for names/text
      if (['net', 'basic', 'gross', 'days', 'deductions'].includes(columnField)) {
        setSortBy(`${columnField}-desc`);
      } else {
        setSortBy(`${columnField}-asc`);
      }
    }
  };

  // Render Sort Indicator Arrow
  const renderSortIndicator = (columnField) => {
    const isCurrentAsc = sortBy === `${columnField}-asc`;
    const isCurrentDesc = sortBy === `${columnField}-desc`;
    if (isCurrentAsc) {
      return <Icon as={FiChevronUp} ml={1} color="teal.200" boxSize={3} />;
    }
    if (isCurrentDesc) {
      return <Icon as={FiChevronDown} ml={1} color="teal.200" boxSize={3} />;
    }
    return <Text as="span" ml={1} opacity={0.35} fontSize="10px">↕</Text>;
  };

  // Filter & Multi-Criteria Sort memo
  const displayedPayrollData = React.useMemo(() => {
    let list = payrollData.filter((emp) => {
      // 1. Account Status Filter (Active vs Inactive vs All)
      const empAccountStatus = (emp.userStatus || emp.userId?.status || 'active').toLowerCase();
      if (accountStatusFilter === 'active' && empAccountStatus !== 'active') {
        return false;
      }
      if (accountStatusFilter === 'inactive' && empAccountStatus !== 'inactive') {
        return false;
      }

      // 2. Payroll Workflow Status Filter
      const pStatus = (emp.status || 'draft').toLowerCase();
      if (payrollStatusFilter !== 'all' && pStatus !== payrollStatusFilter.toLowerCase()) {
        return false;
      }

      // 3. Department Filter
      if (selectedDepartment && (emp.department || '').toLowerCase() !== selectedDepartment.toLowerCase()) {
        return false;
      }

      // 4. Role Filter
      if (selectedRole && (emp.userId?.role || '').toLowerCase() !== selectedRole.toLowerCase()) {
        return false;
      }

      // 5. Live Search Query
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (emp.employeeName || emp.userId?.fullName || emp.userId?.username || '').toLowerCase();
        const dept = (emp.department || '').toLowerCase();
        const role = (emp.userId?.role || '').toLowerCase();
        const bank = (emp.salaryBankAccountNumber || emp.userId?.personalInformation?.salaryBankAccountNumber || emp.userId?.bankAccountNumber || '').toLowerCase();
        const tin = (emp.tinNumber || emp.userId?.personalInformation?.tinNumber || '').toLowerCase();
        const status = (emp.status || 'draft').toLowerCase();
        return name.includes(q) || dept.includes(q) || role.includes(q) || bank.includes(q) || tin.includes(q) || status.includes(q) || empAccountStatus.includes(q);
      }
      return true;
    });

    // 6. Multi-Criteria Sorting
    list.sort((a, b) => {
      const aName = (a.employeeName || a.userId?.fullName || a.userId?.username || '').toLowerCase();
      const bName = (b.employeeName || b.userId?.fullName || b.userId?.username || '').toLowerCase();
      const aBasic = a.basicSalary || 0;
      const bBasic = b.basicSalary || 0;
      const aGross = getDisplayGrossSalary(a);
      const bGross = getDisplayGrossSalary(b);
      const aNet = a.netSalary || a.finalSalary || 0;
      const bNet = b.netSalary || b.finalSalary || 0;
      const aDays = a.daysWorked || 30;
      const bDays = b.daysWorked || 30;
      const aDept = (a.department || '').toLowerCase();
      const bDept = (b.department || '').toLowerCase();
      const aStatus = (a.status || 'draft').toLowerCase();
      const bStatus = (b.status || 'draft').toLowerCase();
      const aAcc = (a.userStatus || a.userId?.status || 'active').toLowerCase();
      const bAcc = (b.userStatus || b.userId?.status || 'active').toLowerCase();
      const aDeductions = (a.incomeTax || 0) + (a.pension || 0) + (a.loan || 0) + (a.lateDeduction || 0) + (a.absenceDeduction || 0) + getDisplayFinanceDeductions(a);
      const bDeductions = (b.incomeTax || 0) + (b.pension || 0) + (b.loan || 0) + (b.lateDeduction || 0) + (b.absenceDeduction || 0) + getDisplayFinanceDeductions(b);

      switch (sortBy) {
        case 'name-asc':
          return aName.localeCompare(bName);
        case 'name-desc':
          return bName.localeCompare(aName);
        case 'net-desc':
          return bNet - aNet;
        case 'net-asc':
          return aNet - bNet;
        case 'basic-desc':
          return bBasic - aBasic;
        case 'basic-asc':
          return aBasic - bBasic;
        case 'gross-desc':
          return bGross - aGross;
        case 'gross-asc':
          return aGross - bGross;
        case 'days-desc':
          return bDays - aDays;
        case 'days-asc':
          return aDays - bDays;
        case 'deductions-desc':
          return bDeductions - aDeductions;
        case 'deductions-asc':
          return aDeductions - bDeductions;
        case 'department-asc':
          return aDept.localeCompare(bDept);
        case 'department-desc':
          return bDept.localeCompare(aDept);
        case 'status-asc':
          return aAcc === 'active' ? -1 : 1;
        case 'status-desc':
          return bAcc === 'active' ? -1 : 1;
        case 'payroll-status-asc':
          return aStatus.localeCompare(bStatus);
        case 'payroll-status-desc':
          return bStatus.localeCompare(aStatus);
        default:
          return 0;
      }
    });

    return list;
  }, [payrollData, accountStatusFilter, payrollStatusFilter, selectedDepartment, selectedRole, searchQuery, sortBy]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('');
    setSelectedRole('');
    setAccountStatusFilter('active');
    setPayrollStatusFilter('all');
    setSortBy('name-asc');
  };

  const hasActiveFilters = Boolean(
    searchQuery || 
    selectedDepartment || 
    selectedRole || 
    accountStatusFilter !== 'active' || 
    payrollStatusFilter !== 'all' || 
    sortBy !== 'name-asc'
  );
  
  if (loading) {
    return (
      <Layout>
        <Box p={6} bg={bgColor} minHeight="100vh">
          <Flex justify="center" align="center" height="100%">
            <Spinner size="xl" />
          </Flex>
        </Box>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <Box p={6} bg={bgColor} minHeight="100vh">
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="lg"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Error Loading Payroll Data
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              {error}
            </AlertDescription>
          </Alert>
        </Box>
      </Layout>
    );
  }
  
  const currentPath = location.pathname;
  const isSheetView = currentPath.includes('/payroll/sheet');
  const isCommissionsView = currentPath.includes('/payroll/commissions');
  const isDisbursementsView = currentPath.includes('/payroll/disbursements');
  const isHistoryView = currentPath.includes('/payroll/history');
  const isOverviewView = !isSheetView && !isCommissionsView && !isDisbursementsView && !isHistoryView;

  const pageTitle = isOverviewView
    ? "Payroll Executive Dashboard"
    : isSheetView
    ? "Employee Payroll Master Sheet"
    : isCommissionsView
    ? "Sales Commissions & Performance Bonuses"
    : isDisbursementsView
    ? "CBE Bank Disbursements & Transfer Letter"
    : "Payroll Archives & Finalized History";

  const pageContent = (
    <Box p={{ base: 4, md: 6 }} bg={bgColor} minHeight="100vh">
      {/* Professional Header Bar */}
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between" 
        align={{ base: 'start', md: 'center' }} 
        mb={5}
        gap={4}
        p={4}
        bg={cardBg}
        borderRadius="2xl"
        boxShadow="sm"
        border="1px solid"
        borderColor={borderColor}
      >
        <Box>
          <HStack spacing={2} mb={1}>
            <Badge colorScheme="teal" borderRadius="full" px={2.5} py={0.5} fontSize="2xs" textTransform="uppercase">
              Payroll Management System
            </Badge>
            <Badge colorScheme="green" borderRadius="full" px={2} py={0.5} fontSize="2xs">
              Ethiopian Proclamation 979/2016
            </Badge>
          </HStack>
          <Heading 
            as="h1" 
            size={{ base: 'md', md: 'lg' }} 
            color="teal.700"
            fontWeight="800"
            letterSpacing="tight"
          >
            {pageTitle}
          </Heading>
          <Text fontSize="xs" color="gray.500" mt={0.5}>
            Comprehensive salary administration, progressive tax deduction, and CBE bank transfer dispatching.
          </Text>
        </Box>
        
        <HStack spacing={2.5} wrap="wrap">
          {isDisbursementsView ? (
            <>
              <Button leftIcon={<DownloadIcon />} colorScheme="teal" size="sm" borderRadius="xl" shadow="xs" onClick={exportBankCSV}>
                Export CBE Bank CSV
              </Button>
              <Button leftIcon={<DownloadIcon />} colorScheme="blue" variant="outline" size="sm" borderRadius="xl" onClick={() => window.print()}>
                Print Bank Letter
              </Button>
            </>
          ) : (
            <>
              <Button leftIcon={<DownloadIcon />} colorScheme="teal" size="sm" borderRadius="xl" shadow="xs" onClick={exportToCSV}>
                Export CSV
              </Button>
              <Button leftIcon={<DownloadIcon />} colorScheme="blue" variant="outline" size="sm" borderRadius="xl" onClick={exportToPDF}>
                Export PDF
              </Button>
              <Tooltip label="Refresh Payroll Data">
                <IconButton 
                  icon={<RepeatIcon />} 
                  size="sm" 
                  borderRadius="xl" 
                  variant="ghost" 
                  colorScheme="teal" 
                  aria-label="Refresh" 
                  onClick={fetchPayrollDataHandler} 
                />
              </Tooltip>
            </>
          )}
        </HStack>
      </Flex>

      {/* Sub-Page Navigation Tabs */}
      <Tabs 
        index={isSheetView ? 1 : isCommissionsView ? 2 : isDisbursementsView ? 3 : isHistoryView ? 4 : 0} 
        onChange={(index) => {
          const routes = ['/payroll', '/payroll/sheet', '/payroll/commissions', '/payroll/disbursements', '/payroll/history'];
          navigate(routes[index]);
        }} 
        variant="solid-rounded" 
        colorScheme="teal" 
        mb={6}
      >
        <TabList gap={2} overflowX="auto" pb={2}>
          <Tab fontSize="xs" fontWeight="bold">📊 Overview & Dashboard</Tab>
          <Tab fontSize="xs" fontWeight="bold">📋 Employee Payroll Sheet</Tab>
          <Tab fontSize="xs" fontWeight="bold">🎯 Commissions & Bonuses</Tab>
          <Tab fontSize="xs" fontWeight="bold">🏦 Bank & Disbursements</Tab>
          <Tab fontSize="xs" fontWeight="bold">📜 Payroll History</Tab>
        </TabList>
      </Tabs>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW & DASHBOARD VIEW */}
      {/* ========================================================================= */}
      {isOverviewView && (
        <Box>
          {/* Executive KPI Stat Cards */}
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }} gap={4} mb={6}>
            <StatCard title="Total Employees" value={payrollData.length} color="blue.500" />
            <StatCard title="Total Gross Salary" value={formatCurrency(payrollData.reduce((sum, emp) => sum + getDisplayGrossSalary(emp), 0))} color="green.500" />
            <StatCard title="Total Deductions" value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.incomeTax || 0) + (emp.pension || 0) + (emp.lateDeduction || 0) + (emp.absenceDeduction || 0) + getDisplayFinanceDeductions(emp), 0))} color="orange.500" />
            <StatCard title="Total Net Salary" value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.netSalary || emp.finalSalary || 0), 0))} color="teal.500" isBold={true} />
            <StatCard title="Total Pension (7%)" value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.pension || 0), 0))} color="purple.500" />
            <StatCard title="Total Pension (11%)" value={formatCurrency(payrollData.reduce((sum, emp) => sum + ((emp.basicSalary || 0) * 0.11), 0))} color="pink.500" />
          </Grid>

          {/* Department Breakdown Cards */}
          <Heading size="md" mb={3} color={headerColor}>Department Payroll Allocation</Heading>
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mb={6}>
            {departments.map((dept) => {
              const deptEmployees = payrollData.filter(emp => (emp.department || '').toLowerCase() === dept.toLowerCase());
              const deptGross = deptEmployees.reduce((sum, emp) => sum + getDisplayGrossSalary(emp), 0);
              const deptNet = deptEmployees.reduce((sum, emp) => sum + (emp.netSalary || emp.finalSalary || 0), 0);
              return (
                <Card key={dept} bg={cardBg} boxShadow="sm" borderRadius="md" borderLeft="4px solid" borderColor="teal.400">
                  <CardBody py={3} px={4}>
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text fontWeight="bold" fontSize="sm" textTransform="capitalize">{dept}</Text>
                      <Badge colorScheme="teal" borderRadius="full">{deptEmployees.length} Staff</Badge>
                    </Flex>
                    <Flex justify="space-between" fontSize="xs" color="gray.600" mt={2}>
                      <Text>Gross: <strong>{formatCurrency(deptGross)}</strong></Text>
                      <Text>Net Payout: <strong style={{ color: '#2B6CB0' }}>{formatCurrency(deptNet)}</strong></Text>
                    </Flex>
                  </CardBody>
                </Card>
              );
            })}
          </Grid>

          {/* Quick Action Navigation Grid */}
          <Heading size="md" mb={3} color={headerColor}>Payroll Workspaces & Actions</Heading>
          <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
            <Card bg={cardBg} boxShadow="md" borderRadius="lg" cursor="pointer" onClick={() => navigate('/payroll/sheet')} _hover={{ transform: 'translateY(-2px)', transition: 'all 0.2s' }}>
              <CardBody py={4} px={4} textAlign="center">
                <Text fontSize="2xl" mb={1}>📋</Text>
                <Text fontWeight="bold" fontSize="md" color="teal.600">Employee Payroll Sheet</Text>
                <Text fontSize="xs" color="gray.500" mt={1}>View 16-column master payroll table & adjustments</Text>
              </CardBody>
            </Card>
            <Card bg={cardBg} boxShadow="md" borderRadius="lg" cursor="pointer" onClick={() => navigate('/payroll/commissions')} _hover={{ transform: 'translateY(-2px)', transition: 'all 0.2s' }}>
              <CardBody py={4} px={4} textAlign="center">
                <Text fontSize="2xl" mb={1}>🎯</Text>
                <Text fontWeight="bold" fontSize="md" color="purple.600">Commissions & Bonuses</Text>
                <Text fontSize="xs" color="gray.500" mt={1}>Manage sales agent 7.5% commissions & content bonuses</Text>
              </CardBody>
            </Card>
            <Card bg={cardBg} boxShadow="md" borderRadius="lg" cursor="pointer" onClick={() => navigate('/payroll/disbursements')} _hover={{ transform: 'translateY(-2px)', transition: 'all 0.2s' }}>
              <CardBody py={4} px={4} textAlign="center">
                <Text fontSize="2xl" mb={1}>🏦</Text>
                <Text fontWeight="bold" fontSize="md" color="blue.600">Bank & Disbursements</Text>
                <Text fontSize="xs" color="gray.500" mt={1}>Generate & export CBE Bank transfer letter files</Text>
              </CardBody>
            </Card>
            <Card bg={cardBg} boxShadow="md" borderRadius="lg" cursor="pointer" onClick={() => navigate('/payroll/history')} _hover={{ transform: 'translateY(-2px)', transition: 'all 0.2s' }}>
              <CardBody py={4} px={4} textAlign="center">
                <Text fontSize="2xl" mb={1}>📜</Text>
                <Text fontWeight="bold" fontSize="md" color="orange.600">Payroll History & Archives</Text>
                <Text fontSize="xs" color="gray.500" mt={1}>Search & view past finalized payroll periods</Text>
              </CardBody>
            </Card>
          </Grid>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* 2. EMPLOYEE PAYROLL SHEET VIEW */}
      {/* ========================================================================= */}
      {isSheetView && (
        <Box>
          {/* Ethiopian Regulatory & Workflow Stepper Banner */}
          <Card mb={4} bg={cardBg} boxShadow="sm" borderRadius="lg" borderLeft="5px solid" borderColor="teal.500">
            <CardBody py={3} px={4}>
              <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={2} mb={3}>
                <HStack spacing={2}>
                  <Badge colorScheme="green" fontSize="xs" px={2} py={0.5} borderRadius="md">
                    🇪🇹 Ethiopian Regulatory Compliance
                  </Badge>
                  <Text fontSize="xs" color="gray.500">
                    Proclamation No. 979/2016 (Employment Tax) & No. 715/2011 (Pension Fund)
                  </Text>
                </HStack>
                <HStack spacing={2} wrap="wrap">
                  <Badge colorScheme="purple" fontSize="10px">Employee Pension: 7%</Badge>
                  <Badge colorScheme="pink" fontSize="10px">Employer Pension: 11%</Badge>
                  <Badge colorScheme="blue" fontSize="10px">Tax Scale: 0% - 35%</Badge>
                  <Badge colorScheme="teal" fontSize="10px">Transport: Non-Taxable</Badge>
                  <Badge colorScheme="orange" fontSize="10px">Delay: 300 ETB/Day</Badge>
                </HStack>
              </Flex>

              {/* Workflow Stepper */}
              <Box bg={bgColor} p={2} borderRadius="md">
                <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }} gap={2} textAlign="center" fontSize="xs">
                  <Box p={1.5} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor}>
                    <Text fontWeight="bold" color="teal.600">1. Draft Generated</Text>
                    <Text fontSize="10px" color="gray.500">From registered salary</Text>
                  </Box>
                  <Box p={1.5} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor}>
                    <Text fontWeight="bold" color="blue.600">2. HR Attendance</Text>
                    <Text fontSize="10px" color="gray.500">Days & Overtime review</Text>
                  </Box>
                  <Box p={1.5} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor}>
                    <Text fontWeight="bold" color="purple.600">3. Finance Review</Text>
                    <Text fontSize="10px" color="gray.500">Allowances & deductions</Text>
                  </Box>
                  <Box p={1.5} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor}>
                    <Text fontWeight="bold" color="green.600">4. Final Approval</Text>
                    <Text fontSize="10px" color="gray.500">Management sign-off</Text>
                  </Box>
                  <Box p={1.5} bg={cardBg} borderRadius="md" border="1px solid" borderColor={borderColor}>
                    <Text fontWeight="bold" color="orange.600">5. Bank Disbursement</Text>
                    <Text fontSize="10px" color="gray.500">CBE file export & pay</Text>
                  </Box>
                </Grid>
              </Box>
            </CardBody>
          </Card>

          {/* Executive Quick Metrics Bar with non-wrapping cards */}
          <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }} gap={3} mb={5}>
            <StatCard 
              title="Established Employees" 
              value={`${payrollData.length} Staff`} 
              color="teal.600" 
              icon={<FiUsers />}
              subtext="Registered monthly records"
            />
            <StatCard 
              title="Total Gross Salary" 
              value={formatCurrency(payrollData.reduce((sum, emp) => sum + getDisplayGrossSalary(emp), 0))} 
              color="blue.600" 
              icon={<FiBriefcase />}
              subtext="Basic + All allowances"
            />
            <StatCard 
              title="Income Tax (Gov)" 
              value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.incomeTax || 0), 0))} 
              color="orange.600" 
              icon={<FiFileText />}
              subtext="Proc. 979/2016 withheld"
            />
            <StatCard 
              title="Pension 18% (Fund)" 
              value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.pension || 0) + ((emp.basicSalary || 0) * 0.11), 0))} 
              color="purple.600" 
              icon={<FiShield />}
              subtext="7% EE + 11% ER Fund"
            />
            <StatCard 
              title="Total Net Payable" 
              value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.netSalary || emp.finalSalary || 0), 0))} 
              color="teal.700" 
              isBold={true} 
              icon={<FiDollarSign />}
              subtext="Final staff disbursement"
            />
            <StatCard 
              title="Employer Outflow" 
              value={formatCurrency(payrollData.reduce((sum, emp) => sum + getDisplayGrossSalary(emp) + ((emp.basicSalary || 0) * 0.11) + (emp.transportAllowance || 0), 0))} 
              color="pink.600" 
              isBold={true} 
              icon={<FiTrendingUp />}
              subtext="Total company expenditure"
            />
          </Grid>

          {/* Interactive Search, Filter & View Controls Card */}
          <Card mb={5} bg={cardBg} boxShadow="sm" borderRadius="2xl" border="1px solid" borderColor={borderColor}>
            <CardBody py={4} px={5}>
              <Stack spacing={3}>
                {/* Top Row: Search, View Switcher, Stats & Actions */}
                <Flex direction={{ base: "column", lg: "row" }} gap={3} align={{ base: "stretch", lg: "center" }} justify="space-between">
                  {/* Live Search Input */}
                  <InputGroup size="sm" maxW={{ base: "100%", lg: "380px" }}>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color="teal.500" />
                    </InputLeftElement>
                    <Input 
                      placeholder="Live search by name, department, CBE account, TIN, or status..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      borderRadius="xl"
                      bg={bgColor}
                      _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 1px #319795" }}
                    />
                    {searchQuery && (
                      <InputRightElement>
                        <CloseButton size="xs" onClick={() => setSearchQuery('')} />
                      </InputRightElement>
                    )}
                  </InputGroup>

                  {/* View Mode Switcher (Compact HR View vs Full 16-Col Audit View) */}
                  <HStack spacing={2} justify={{ base: "center", lg: "flex-start" }}>
                    <ButtonGroup size="sm" isAttached variant="outline" borderRadius="xl">
                      <Button 
                        leftIcon={<FiList />} 
                        colorScheme={viewMode === 'compact' ? "teal" : "gray"}
                        variant={viewMode === 'compact' ? "solid" : "outline"}
                        onClick={() => setViewMode('compact')}
                        fontSize="xs"
                        fontWeight="700"
                        borderRadius="xl"
                      >
                        Compact HR View
                      </Button>
                      <Button 
                        leftIcon={<FiGrid />} 
                        colorScheme={viewMode === 'audit' ? "teal" : "gray"}
                        variant={viewMode === 'audit' ? "solid" : "outline"}
                        onClick={() => setViewMode('audit')}
                        fontSize="xs"
                        fontWeight="700"
                        borderRadius="xl"
                      >
                        Full Audit (16-Cols)
                      </Button>
                    </ButtonGroup>
                  </HStack>

                  {/* Staff Count & Calculate Button */}
                  <HStack spacing={3} justify={{ base: "space-between", lg: "flex-end" }}>
                    <Badge 
                      colorScheme={displayedPayrollData.length > 0 ? "teal" : "red"} 
                      borderRadius="full" 
                      px={3} 
                      py={1} 
                      fontSize="xs"
                    >
                      Showing {displayedPayrollData.length} of {payrollData.length} Staff
                    </Badge>
                    {isAdminUser() && (
                      <Button 
                        colorScheme="teal" 
                        size="sm" 
                        borderRadius="xl"
                        shadow="xs"
                        onClick={calculatePayrollHandler} 
                        leftIcon={<AddIcon />}
                      >
                        Calculate All Payroll
                      </Button>
                    )}
                  </HStack>
                </Flex>

                {/* Filter Controls Row */}
                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }} gap={3} pt={2} borderTop="1px solid" borderColor={borderColor}>
                  {/* Account Status Filter */}
                  <Box>
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="2xs" fontWeight="700" color="gray.500">ACCOUNT STATUS</Text>
                      {accountStatusFilter === 'active' && <Icon as={FiUserCheck} color="green.500" boxSize={3} />}
                      {accountStatusFilter === 'inactive' && <Icon as={FiUserX} color="orange.500" boxSize={3} />}
                    </HStack>
                    <Select 
                      value={accountStatusFilter} 
                      onChange={(e) => setAccountStatusFilter(e.target.value)} 
                      size="sm" 
                      borderRadius="lg" 
                      bg={bgColor}
                      borderColor={accountStatusFilter !== 'active' ? "purple.400" : undefined}
                    >
                      <option value="active">Active Staff (Default)</option>
                      <option value="inactive">Inactive Staff Only</option>
                      <option value="all">All Accounts (Active & Inactive)</option>
                    </Select>
                  </Box>

                  {/* Payroll Lifecycle Status Filter */}
                  <Box>
                    <Text fontSize="2xs" fontWeight="700" color="gray.500" mb={1}>PAYROLL STATUS</Text>
                    <Select 
                      value={payrollStatusFilter} 
                      onChange={(e) => setPayrollStatusFilter(e.target.value)} 
                      size="sm" 
                      borderRadius="lg" 
                      bg={bgColor}
                      borderColor={payrollStatusFilter !== 'all' ? "blue.400" : undefined}
                    >
                      <option value="all">All Lifecycle Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="hr_submitted">HR Submitted</option>
                      <option value="finance_reviewed">Finance Reviewed</option>
                      <option value="approved">Approved</option>
                      <option value="locked">Locked & Disbursed</option>
                    </Select>
                  </Box>

                  {/* Multi-Criteria Sort Selector */}
                  <Box>
                    <Text fontSize="2xs" fontWeight="700" color="gray.500" mb={1}>SORT BY</Text>
                    <Select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)} 
                      size="sm" 
                      borderRadius="lg" 
                      bg={bgColor}
                      borderColor={sortBy !== 'name-asc' ? "teal.400" : undefined}
                    >
                      <option value="name-asc">Employee Name (A → Z)</option>
                      <option value="name-desc">Employee Name (Z → A)</option>
                      <option value="net-desc">Net Salary (High → Low)</option>
                      <option value="net-asc">Net Salary (Low → High)</option>
                      <option value="basic-desc">Basic Salary (High → Low)</option>
                      <option value="basic-asc">Basic Salary (Low → High)</option>
                      <option value="gross-desc">Gross Salary (High → Low)</option>
                      <option value="days-desc">Days Worked (Most First)</option>
                      <option value="status-asc">Status (Active First)</option>
                      <option value="department-asc">Department (A → Z)</option>
                    </Select>
                  </Box>

                  {/* Department */}
                  <Box>
                    <Text fontSize="2xs" fontWeight="700" color="gray.500" mb={1}>DEPARTMENT</Text>
                    <Select 
                      value={selectedDepartment} 
                      onChange={(e) => setSelectedDepartment(e.target.value)} 
                      placeholder="All Departments" 
                      size="sm" 
                      borderRadius="lg" 
                      bg={bgColor}
                      borderColor={selectedDepartment ? "teal.400" : undefined}
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept.charAt(0).toUpperCase() + dept.slice(1)}</option>
                      ))}
                    </Select>
                  </Box>

                  {/* Role */}
                  <Box>
                    <Text fontSize="2xs" fontWeight="700" color="gray.500" mb={1}>ROLE</Text>
                    <Select 
                      value={selectedRole} 
                      onChange={(e) => setSelectedRole(e.target.value)} 
                      placeholder="All Roles" 
                      size="sm" 
                      borderRadius="lg" 
                      bg={bgColor}
                      borderColor={selectedRole ? "teal.400" : undefined}
                    >
                      <option value="admin">Admin</option>
                      <option value="HR">HR</option>
                      <option value="finance">Finance</option>
                      <option value="sales">Sales</option>
                      <option value="IT">IT</option>
                    </Select>
                  </Box>

                  {/* Payroll Month */}
                  <Box>
                    <Text fontSize="2xs" fontWeight="700" color="gray.500" mb={1}>PAYROLL MONTH</Text>
                    <Select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)} 
                      size="sm" 
                      borderRadius="lg" 
                      bg={bgColor}
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const month = date.toISOString().slice(0, 7);
                        return (
                          <option key={month} value={month}>
                            {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </option>
                        );
                      })}
                    </Select>
                  </Box>
                </Grid>

                {/* Active Filter Chips & Reset Row */}
                {hasActiveFilters && (
                  <Flex justify="space-between" align="center" pt={2} borderTop="1px dashed" borderColor={borderColor} wrap="wrap" gap={2}>
                    <HStack spacing={2} wrap="wrap">
                      <Text fontSize="xs" fontWeight="600" color="gray.500">Active Filters:</Text>
                      {accountStatusFilter !== 'active' && (
                        <Tag size="sm" colorScheme="purple" borderRadius="full">
                          <TagLabel>Account: {accountStatusFilter === 'inactive' ? 'Inactive Only' : 'All Accounts'}</TagLabel>
                          <CloseButton size="xs" ml={1} onClick={() => setAccountStatusFilter('active')} />
                        </Tag>
                      )}
                      {payrollStatusFilter !== 'all' && (
                        <Tag size="sm" colorScheme="blue" borderRadius="full">
                          <TagLabel>Status: {payrollStatusFilter}</TagLabel>
                          <CloseButton size="xs" ml={1} onClick={() => setPayrollStatusFilter('all')} />
                        </Tag>
                      )}
                      {selectedDepartment && (
                        <Tag size="sm" colorScheme="teal" borderRadius="full">
                          <TagLabel>Dept: {selectedDepartment}</TagLabel>
                          <CloseButton size="xs" ml={1} onClick={() => setSelectedDepartment('')} />
                        </Tag>
                      )}
                      {selectedRole && (
                        <Tag size="sm" colorScheme="green" borderRadius="full">
                          <TagLabel>Role: {selectedRole}</TagLabel>
                          <CloseButton size="xs" ml={1} onClick={() => setSelectedRole('')} />
                        </Tag>
                      )}
                      {searchQuery && (
                        <Tag size="sm" colorScheme="yellow" borderRadius="full">
                          <TagLabel>Search: "{searchQuery}"</TagLabel>
                          <CloseButton size="xs" ml={1} onClick={() => setSearchQuery('')} />
                        </Tag>
                      )}
                      {sortBy !== 'name-asc' && (
                        <Tag size="sm" colorScheme="orange" borderRadius="full">
                          <TagLabel>Sort: {sortBy}</TagLabel>
                          <CloseButton size="xs" ml={1} onClick={() => setSortBy('name-asc')} />
                        </Tag>
                      )}
                    </HStack>
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      colorScheme="red" 
                      leftIcon={<CloseButton size="xs" />} 
                      onClick={handleResetFilters}
                    >
                      Reset All Filters
                    </Button>
                  </Flex>
                )}
              </Stack>
            </CardBody>
          </Card>

          {/* ========================================================================= */}
          {/* PAYROLL DATA TABLE (COMPACT HR VIEW vs FULL 16-COL AUDIT VIEW)            */}
          {/* ========================================================================= */}
          <Card bg={cardBg} boxShadow="sm" borderRadius="2xl" border="1px solid" borderColor={borderColor} overflow="hidden">
            <CardBody py={0} px={0}>
              <Box overflowX="auto" maxH="720px">
                {viewMode === 'compact' ? (
                  /* ========================================================================= */
                  /* 1. COMPACT HR FOCUS VIEW: ZERO HORIZONTAL SCROLLING FOR HR               */
                  /* ========================================================================= */
                  <Table variant="simple" size="sm">
                    <Thead position="sticky" top={0} zIndex={3} bg="teal.800" shadow="sm">
                      <Tr>
                        <Th py={3.5} px={3} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" cursor="pointer" onClick={() => handleSortColumn('name')}>
                          <HStack spacing={1}>
                            <Text>EMPLOYEE & STATUS</Text>
                            {renderSortIndicator('name')}
                          </HStack>
                        </Th>
                        <Th py={3.5} px={2.5} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" cursor="pointer" onClick={() => handleSortColumn('department')}>
                          <HStack spacing={1}>
                            <Text>DEPT</Text>
                            {renderSortIndicator('department')}
                          </HStack>
                        </Th>
                        <Th py={3.5} px={2.5} fontSize="11px" fontWeight="700" color="teal.100" borderColor="teal.700" cursor="pointer" onClick={() => handleSortColumn('basic')}>
                          <HStack spacing={1}>
                            <Text>BASIC SALARY</Text>
                            <Badge colorScheme="green" fontSize="9px" px={1}>HR</Badge>
                            {renderSortIndicator('basic')}
                          </HStack>
                        </Th>
                        <Th py={3.5} px={2} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" textAlign="center" cursor="pointer" onClick={() => handleSortColumn('days')}>
                          <HStack spacing={1} justify="center">
                            <Text>DAYS</Text>
                            {renderSortIndicator('days')}
                          </HStack>
                        </Th>
                        <Th py={3.5} px={2.5} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" cursor="pointer" onClick={() => handleSortColumn('gross')}>
                          <HStack spacing={1}>
                            <Text>GROSS SALARY</Text>
                            {renderSortIndicator('gross')}
                          </HStack>
                        </Th>
                        <Th py={3.5} px={2.5} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" cursor="pointer" onClick={() => handleSortColumn('deductions')}>
                          <HStack spacing={1}>
                            <Text>TOTAL DEDUCTION</Text>
                            {renderSortIndicator('deductions')}
                          </HStack>
                        </Th>
                        <Th py={3.5} px={3} fontSize="11px" fontWeight="800" color="teal.200" borderColor="teal.700" cursor="pointer" onClick={() => handleSortColumn('net')}>
                          <HStack spacing={1}>
                            <Text>NET PAYABLE</Text>
                            {renderSortIndicator('net')}
                          </HStack>
                        </Th>
                        <Th py={3.5} px={2} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" textAlign="center" cursor="pointer" onClick={() => handleSortColumn('payroll-status')}>
                          <HStack spacing={1} justify="center">
                            <Text>STATUS</Text>
                            {renderSortIndicator('payroll-status')}
                          </HStack>
                        </Th>
                        <Th py={3.5} px={3} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" textAlign="center">
                          ACTIONS
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {displayedPayrollData.length > 0 ? (
                        displayedPayrollData.map((employee) => {
                          const empNet = employee.netSalary || employee.finalSalary || 0;
                          const isNegative = empNet < 0;
                          const empId = employee.userId?._id || employee.userId;
                          const empRole = employee.userId?.role || 'Staff';
                          const empAccountStatus = (employee.userStatus || employee.userId?.status || 'active').toLowerCase();
                          const cbeAccount = employee.salaryBankAccountNumber || employee.userId?.personalInformation?.salaryBankAccountNumber || employee.userId?.bankAccountNumber;
                          const totalDeductions = (employee.incomeTax || 0) + (employee.pension || 0) + getDisplayFinanceDeductions(employee) + (employee.loan || 0) + (employee.lateDeduction || 0) + (employee.absenceDeduction || 0);
                          const hasExtraEarnings = (employee.overtimePay > 0) || (employee.salesCommission > 0) || (employee.transportAllowance > 0) || (getDisplayFinanceAllowances(employee) > 0);

                          return (
                            <Tr 
                              key={employee._id || empId} 
                              bg={isNegative ? negativeBg : undefined}
                              _hover={{ bg: isNegative ? negativeBg : rowHoverBg }}
                              transition="background-color 0.15s"
                              borderBottom="1px solid"
                              borderColor={borderColor}
                            >
                              {/* Employee & Account Status */}
                              <Td py={2.5} px={3}>
                                <HStack spacing={2.5}>
                                  <Avatar 
                                    size="xs" 
                                    name={employee.employeeName || employee.userId?.fullName || 'User'} 
                                    bg={empAccountStatus === 'active' ? "teal.600" : "gray.500"} 
                                    color="white" 
                                  />
                                  <Box>
                                    <HStack spacing={1.5} align="center">
                                      <Text 
                                        fontWeight="700" 
                                        fontSize="xs" 
                                        color={isNegative ? negativeColor : "gray.800"} 
                                        cursor="pointer"
                                        _hover={{ color: "teal.600", textDecoration: "underline" }}
                                        onClick={() => handleViewDetails(employee)}
                                      >
                                        {employee.employeeName || employee.userId?.fullName || employee.userId?.username || 'Unknown'}
                                      </Text>
                                      <Badge 
                                        colorScheme={empAccountStatus === 'active' ? "green" : "red"} 
                                        variant="subtle" 
                                        fontSize="9px" 
                                        borderRadius="full" 
                                        px={1.5}
                                      >
                                        {empAccountStatus === 'active' ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </HStack>
                                    <HStack spacing={1.5} mt={0.5}>
                                      <Text fontSize="10px" color="gray.500" textTransform="capitalize">
                                        {empRole}
                                      </Text>
                                      {cbeAccount && (
                                        <Text fontSize="10px" color="teal.600" fontWeight="medium">
                                          • CBE: {cbeAccount.slice(-4)}
                                        </Text>
                                      )}
                                    </HStack>
                                  </Box>
                                </HStack>
                              </Td>

                              {/* Department */}
                              <Td py={2.5} px={2.5} fontSize="xs">
                                <Badge colorScheme="gray" fontSize="10px" textTransform="capitalize" borderRadius="md" px={1.5}>
                                  {employee.department || 'General'}
                                </Badge>
                              </Td>

                              {/* Basic Salary with Inline Quick-Edit Pencil */}
                              <Td py={2.5} px={2.5} fontSize="xs">
                                <HStack spacing={1} justify="space-between">
                                  <Text fontWeight="700" color="teal.800" whiteSpace="nowrap">
                                    {formatCurrency(employee.basicSalary || 0)}
                                  </Text>
                                  {isHrUser() && (
                                    <Tooltip label="Edit Basic Salary (HR)">
                                      <IconButton 
                                        icon={<EditIcon />} 
                                        size="xs" 
                                        variant="ghost" 
                                        colorScheme="teal" 
                                        h="22px" 
                                        w="22px" 
                                        aria-label="Edit Basic Salary" 
                                        onClick={() => openSalaryModal(employee)} 
                                      />
                                    </Tooltip>
                                  )}
                                </HStack>
                              </Td>

                              {/* Days Worked */}
                              <Td py={2.5} px={2} fontSize="xs" textAlign="center">
                                <Badge 
                                  colorScheme={employee.daysWorked < 30 ? "orange" : "green"} 
                                  fontSize="10px" 
                                  borderRadius="full" 
                                  px={2}
                                >
                                  {employee.daysWorked || 30}d
                                </Badge>
                              </Td>

                              {/* Gross Salary */}
                              <Td py={2.5} px={2.5} fontSize="xs">
                                <VStack spacing={0} align="flex-start">
                                  <Text fontWeight="bold" whiteSpace="nowrap">
                                    {formatCurrency(getDisplayGrossSalary(employee))}
                                  </Text>
                                  {hasExtraEarnings && (
                                    <Tooltip label={`OT: ${formatCurrency(employee.overtimePay || 0)} | Comm: ${formatCurrency(employee.salesCommission || 0)} | Allow: ${formatCurrency((employee.transportAllowance || 0) + getDisplayFinanceAllowances(employee))}`}>
                                      <Text fontSize="9px" color="teal.600" cursor="help">
                                        + OT / Allowances
                                      </Text>
                                    </Tooltip>
                                  )}
                                </VStack>
                              </Td>

                              {/* Consolidated Total Deductions */}
                              <Td py={2.5} px={2.5} fontSize="xs">
                                <Tooltip 
                                  hasArrow 
                                  placement="top"
                                  label={`Total Deduction: ${formatCurrency(totalDeductions)} | Income Tax: ${formatCurrency(employee.incomeTax || 0)} | EE Pension (7%): ${formatCurrency(employee.pension || 0)} | ER Pension (11%): ${formatCurrency((employee.basicSalary || 0) * 0.11)} | Other Deductions: ${formatCurrency(getDisplayFinanceDeductions(employee) + (employee.loan || 0))}`}
                                >
                                  <Box cursor="help">
                                    <Text fontWeight="bold" color="orange.700" whiteSpace="nowrap">
                                      {formatCurrency(totalDeductions)}
                                    </Text>
                                    <Text fontSize="9px" color="gray.500" whiteSpace="nowrap">
                                      Tax: {formatCurrency(employee.incomeTax || 0)} • Pen: {formatCurrency(employee.pension || 0)}
                                    </Text>
                                  </Box>
                                </Tooltip>
                              </Td>

                              {/* Net Payable */}
                              <Td py={2.5} px={3} fontSize="xs" fontWeight="extrabold" color={isNegative ? negativeColor : "teal.700"} whiteSpace="nowrap">
                                {formatCurrency(empNet)}
                              </Td>

                              {/* Status */}
                              <Td py={2.5} px={2} fontSize="xs" textAlign="center">
                                {getStatusBadge(employee.status)}
                              </Td>

                              {/* Actions */}
                              <Td py={2.5} px={3} fontSize="xs">
                                <HStack spacing={1} justify="center">
                                  <Tooltip label="View Detailed Breakdown">
                                    <IconButton 
                                      icon={<ViewIcon />} 
                                      size="xs" 
                                      colorScheme="blue" 
                                      variant="subtle"
                                      onClick={() => handleViewDetails(employee)} 
                                      aria-label="View Details" 
                                    />
                                  </Tooltip>
                                  {isHrUser() && (
                                    <Tooltip label="Set Basic Salary">
                                      <IconButton 
                                        icon={<FiDollarSign />} 
                                        size="xs" 
                                        colorScheme="teal" 
                                        onClick={() => openSalaryModal(employee)} 
                                        aria-label="Set Basic Salary" 
                                      />
                                    </Tooltip>
                                  )}
                                  {isAdminUser() && (
                                    <Tooltip label="Manage Sales Commission">
                                      <IconButton 
                                        icon={<AddIcon />} 
                                        size="xs" 
                                        colorScheme="orange" 
                                        variant="subtle" 
                                        onClick={() => openCommissionModal(employee)} 
                                        aria-label="Commission" 
                                      />
                                    </Tooltip>
                                  )}
                                  {isHrUser() && (
                                    <Tooltip label="HR Attendance Adjustment">
                                      <IconButton 
                                        icon={<EditIcon />} 
                                        size="xs" 
                                        colorScheme="purple" 
                                        variant="subtle" 
                                        onClick={() => openHrModal(employee)} 
                                        aria-label="HR Adjustment" 
                                      />
                                    </Tooltip>
                                  )}
                                  {isFinanceUser() && (
                                    <Tooltip label="Finance Adjustment">
                                      <IconButton 
                                        icon={<EditIcon />} 
                                        size="xs" 
                                        colorScheme="yellow" 
                                        variant="subtle" 
                                        onClick={() => openFinanceModal(employee)} 
                                        aria-label="Finance Adjustment" 
                                      />
                                    </Tooltip>
                                  )}
                                </HStack>
                              </Td>
                            </Tr>
                          );
                        })
                      ) : (
                        <Tr>
                          <Td colSpan={9} py={8} textAlign="center">
                            <VStack spacing={2}>
                              <Icon as={FiFilter} boxSize={8} color="gray.400" />
                              <Text fontWeight="bold" color="gray.600">No Employee Records Found</Text>
                              <Text fontSize="xs" color="gray.400">
                                No employees matched the current search query or filter selection.
                              </Text>
                              {hasActiveFilters && (
                                <Button 
                                  size="xs" 
                                  colorScheme="teal" 
                                  variant="outline" 
                                  mt={2}
                                  onClick={handleResetFilters}
                                >
                                  Reset Filters & Search
                                </Button>
                              )}
                            </VStack>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                ) : (
                  /* ========================================================================= */
                  /* 2. FULL 16-COLUMN AUDIT VIEW WITH STICKY EMPLOYEE & ACTIONS COLUMNS       */
                  /* ========================================================================= */
                  <Table variant="simple" size="sm">
                    <Thead position="sticky" top={0} zIndex={3} bg="teal.800" shadow="sm">
                      <Tr>
                        {/* Sticky Left Column: EMPLOYEE */}
                        <Th 
                          py={3} 
                          px={3} 
                          fontSize="11px" 
                          fontWeight="700" 
                          color="white" 
                          borderColor="teal.700"
                          position="sticky"
                          left={0}
                          zIndex={4}
                          bg="teal.800"
                          boxShadow="2px 0 6px -2px rgba(0,0,0,0.3)"
                          cursor="pointer"
                          onClick={() => handleSortColumn('name')}
                        >
                          <HStack spacing={1}>
                            <Text>EMPLOYEE</Text>
                            {renderSortIndicator('name')}
                          </HStack>
                        </Th>
                        <Th py={3} px={2.5} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" cursor="pointer" onClick={() => handleSortColumn('department')}>
                          <HStack spacing={1}>
                            <Text>DEPT</Text>
                            {renderSortIndicator('department')}
                          </HStack>
                        </Th>
                        <Th py={3} px={2.5} fontSize="11px" fontWeight="700" color="teal.100" borderColor="teal.700" cursor="pointer" onClick={() => handleSortColumn('basic')}>
                          <HStack spacing={1}>
                            <Text>BASIC SALARY</Text>
                            <Badge colorScheme="green" fontSize="9px" px={1}>HR</Badge>
                            {renderSortIndicator('basic')}
                          </HStack>
                        </Th>
                        <Th py={3} px={2} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" textAlign="center" cursor="pointer" onClick={() => handleSortColumn('days')}>
                          <HStack spacing={1} justify="center">
                            <Text>DAYS</Text>
                            {renderSortIndicator('days')}
                          </HStack>
                        </Th>
                        <Th py={3} px={2.5} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" cursor="pointer" onClick={() => handleSortColumn('gross')}>
                          <HStack spacing={1}>
                            <Text>GROSS SALARY</Text>
                            {renderSortIndicator('gross')}
                          </HStack>
                        </Th>
                        <Th py={3} px={2.5} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700">
                          TAX (GOV)
                        </Th>
                        <Th py={3} px={2.5} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700">PENSION (7%)</Th>
                        <Th py={3} px={2.5} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700">PENSION (11%)</Th>
                        <Th py={3} px={2} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700">OVERTIME</Th>
                        <Th py={3} px={2} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700">COMMISSION</Th>
                        <Th py={3} px={2.5} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" whiteSpace="nowrap">
                          NON-TAXABLE TRANSPORT ALLOWANCE
                        </Th>
                        <Th py={3} px={2.5} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" whiteSpace="nowrap" cursor="pointer" onClick={() => handleSortColumn('deductions')}>
                          <HStack spacing={1}>
                            <Text>LOAN AND TOTAL DEDUCTION</Text>
                            {renderSortIndicator('deductions')}
                          </HStack>
                        </Th>
                        <Th py={3} px={3} fontSize="11px" fontWeight="800" color="teal.200" borderColor="teal.700" cursor="pointer" onClick={() => handleSortColumn('net')}>
                          <HStack spacing={1}>
                            <Text>NET SALARY</Text>
                            {renderSortIndicator('net')}
                          </HStack>
                        </Th>
                        <Th py={3} px={2} fontSize="11px" fontWeight="700" color="white" borderColor="teal.700" textAlign="center" cursor="pointer" onClick={() => handleSortColumn('payroll-status')}>
                          <HStack spacing={1} justify="center">
                            <Text>STATUS</Text>
                            {renderSortIndicator('payroll-status')}
                          </HStack>
                        </Th>
                        {/* Sticky Right Column: ACTIONS */}
                        <Th 
                          py={3} 
                          px={3} 
                          fontSize="11px" 
                          fontWeight="700" 
                          color="white" 
                          borderColor="teal.700" 
                          textAlign="center"
                          position="sticky"
                          right={0}
                          zIndex={4}
                          bg="teal.800"
                          boxShadow="-2px 0 6px -2px rgba(0,0,0,0.3)"
                        >
                          ACTIONS
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {displayedPayrollData.length > 0 ? (
                        displayedPayrollData.map((employee) => {
                          const empNet = employee.netSalary || employee.finalSalary || 0;
                          const isNegative = empNet < 0;
                          const empId = employee.userId?._id || employee.userId;
                          const empRole = employee.userId?.role || 'Staff';
                          const empAccountStatus = (employee.userStatus || employee.userId?.status || 'active').toLowerCase();
                          const cbeAccount = employee.salaryBankAccountNumber || employee.userId?.personalInformation?.salaryBankAccountNumber || employee.userId?.bankAccountNumber;

                          return (
                            <Tr 
                              key={employee._id || empId} 
                              bg={isNegative ? negativeBg : undefined}
                              _hover={{ bg: isNegative ? negativeBg : rowHoverBg }}
                              transition="background-color 0.15s"
                              borderBottom="1px solid"
                              borderColor={borderColor}
                            >
                              {/* Sticky Left: Employee Details Column */}
                              <Td 
                                py={2.5} 
                                px={3}
                                position="sticky"
                                left={0}
                                zIndex={2}
                                bg={isNegative ? negativeBg : cardBg}
                                boxShadow="2px 0 6px -2px rgba(0,0,0,0.12)"
                              >
                                <HStack spacing={2.5}>
                                  <Avatar 
                                    size="xs" 
                                    name={employee.employeeName || employee.userId?.fullName || 'User'} 
                                    bg={empAccountStatus === 'active' ? "teal.600" : "gray.500"} 
                                    color="white" 
                                  />
                                  <Box>
                                    <HStack spacing={1.5} align="center">
                                      <Text 
                                        fontWeight="700" 
                                        fontSize="xs" 
                                        color={isNegative ? negativeColor : "gray.800"} 
                                        cursor="pointer"
                                        _hover={{ color: "teal.600", textDecoration: "underline" }}
                                        onClick={() => handleViewDetails(employee)}
                                      >
                                        {employee.employeeName || employee.userId?.fullName || employee.userId?.username || 'Unknown'}
                                      </Text>
                                      <Badge 
                                        colorScheme={empAccountStatus === 'active' ? "green" : "red"} 
                                        variant="subtle" 
                                        fontSize="9px" 
                                        borderRadius="full" 
                                        px={1.5}
                                      >
                                        {empAccountStatus === 'active' ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </HStack>
                                    <HStack spacing={1.5} mt={0.5}>
                                      <Text fontSize="10px" color="gray.500" textTransform="capitalize">
                                        {empRole}
                                      </Text>
                                      {cbeAccount && (
                                        <Text fontSize="10px" color="teal.600" fontWeight="medium">
                                          • CBE: {cbeAccount.slice(-4)}
                                        </Text>
                                      )}
                                    </HStack>
                                  </Box>
                                </HStack>
                              </Td>

                              {/* Department */}
                              <Td py={2.5} px={2.5} fontSize="xs">
                                <Badge colorScheme="gray" fontSize="10px" textTransform="capitalize" borderRadius="md" px={1.5}>
                                  {employee.department || 'General'}
                                </Badge>
                              </Td>

                              {/* Basic Salary with Quick Edit Pencil */}
                              <Td py={2.5} px={2.5} fontSize="xs">
                                <HStack spacing={1} justify="space-between">
                                  <Text fontWeight="700" color="teal.800" whiteSpace="nowrap">
                                    {formatCurrency(employee.basicSalary || 0)}
                                  </Text>
                                  {isHrUser() && (
                                    <Tooltip label="Edit Basic Salary">
                                      <IconButton 
                                        icon={<EditIcon />} 
                                        size="xs" 
                                        variant="ghost" 
                                        colorScheme="teal" 
                                        h="22px" 
                                        w="22px" 
                                        aria-label="Edit Basic Salary" 
                                        onClick={() => openSalaryModal(employee)} 
                                      />
                                    </Tooltip>
                                  )}
                                </HStack>
                              </Td>

                              {/* Days Worked */}
                              <Td py={2.5} px={2} fontSize="xs" textAlign="center">
                                <Badge 
                                  colorScheme={employee.daysWorked < 30 ? "orange" : "green"} 
                                  fontSize="10px" 
                                  borderRadius="full" 
                                  px={2}
                                >
                                  {employee.daysWorked || 30}d
                                </Badge>
                              </Td>

                              {/* Gross Salary */}
                              <Td py={2.5} px={2.5} fontSize="xs" fontWeight="semibold" whiteSpace="nowrap">
                                {formatCurrency(getDisplayGrossSalary(employee))}
                              </Td>

                              {/* Income Tax */}
                              <Td py={2.5} px={2.5} fontSize="xs" color="orange.700" whiteSpace="nowrap">
                                {formatCurrency(employee.incomeTax || 0)}
                              </Td>

                              {/* Pension 7% */}
                              <Td py={2.5} px={2.5} fontSize="xs" color="purple.700" whiteSpace="nowrap">
                                {formatCurrency(employee.pension || 0)}
                              </Td>

                              {/* Pension 11% */}
                              <Td py={2.5} px={2.5} fontSize="xs" color="pink.700" whiteSpace="nowrap">
                                {formatCurrency((employee.basicSalary || 0) * 0.11)}
                              </Td>

                              {/* Overtime */}
                              <Td py={2.5} px={2} fontSize="xs" whiteSpace="nowrap" color={employee.overtimePay > 0 ? "teal.600" : "gray.400"}>
                                {employee.overtimePay > 0 ? formatCurrency(employee.overtimePay) : "-"}
                              </Td>

                              {/* Commission */}
                              <Td py={2.5} px={2} fontSize="xs" whiteSpace="nowrap" color={employee.salesCommission > 0 ? "purple.600" : "gray.400"}>
                                {employee.salesCommission > 0 ? formatCurrency(employee.salesCommission) : "-"}
                              </Td>

                              {/* Non-Taxable Transport Allowance */}
                              <Td py={2.5} px={2.5} fontSize="xs" whiteSpace="nowrap">
                                {employee.transportAllowance > 0 ? (
                                  <Tooltip
                                    hasArrow
                                    placement="top"
                                    label={`Non-taxable Transport Allowance: ${formatCurrency(employee.transportAllowance)}${getDisplayFinanceAllowances(employee) > 0 ? ` | Other Allowance: ${formatCurrency(getDisplayFinanceAllowances(employee))}` : ''}`}
                                  >
                                    <Text color="teal.600" fontWeight="semibold">
                                      {formatCurrency(employee.transportAllowance)}
                                    </Text>
                                  </Tooltip>
                                ) : (
                                  <Text color="gray.400">-</Text>
                                )}
                              </Td>

                              {/* Loan and Total Deduction */}
                              <Td py={2.5} px={2.5} fontSize="xs" whiteSpace="nowrap">
                                {(() => {
                                  const empTotalDeductions = (employee.incomeTax || 0) + (employee.pension || 0) + (employee.loan || 0) + (employee.lateDeduction || 0) + (employee.absenceDeduction || 0) + getDisplayFinanceDeductions(employee);
                                  if (empTotalDeductions <= 0) return <Text color="gray.400">-</Text>;
                                  return (
                                    <Tooltip
                                      hasArrow
                                      placement="top"
                                      label={`Total Deduction: ${formatCurrency(empTotalDeductions)} | Loan: ${formatCurrency(employee.loan || 0)} | Income Tax: ${formatCurrency(employee.incomeTax || 0)} | Pension 7%: ${formatCurrency(employee.pension || 0)} | Penalties: ${formatCurrency((employee.lateDeduction || 0) + (employee.absenceDeduction || 0))} | Other: ${formatCurrency(getDisplayFinanceDeductions(employee))}`}
                                    >
                                      <VStack align="flex-start" spacing={0} cursor="help">
                                        <Text fontWeight="extrabold" color="red.600">
                                          {formatCurrency(empTotalDeductions)}
                                        </Text>
                                        {(employee.loan || 0) > 0 ? (
                                          <Text fontSize="10px" color="orange.600" fontWeight="semibold">
                                            Loan: {formatCurrency(employee.loan)}
                                          </Text>
                                        ) : (
                                          <Text fontSize="10px" color="gray.400">
                                            Loan: -
                                          </Text>
                                        )}
                                      </VStack>
                                    </Tooltip>
                                  );
                                })()}
                              </Td>

                              {/* Net Salary Payable */}
                              <Td py={2.5} px={3} fontSize="xs" fontWeight="extrabold" color={isNegative ? negativeColor : "teal.700"} whiteSpace="nowrap">
                                {formatCurrency(empNet)}
                              </Td>

                              {/* Status */}
                              <Td py={2.5} px={2} fontSize="xs" textAlign="center">
                                {getStatusBadge(employee.status)}
                              </Td>

                              {/* Sticky Right: Actions Column */}
                              <Td 
                                py={2.5} 
                                px={3} 
                                fontSize="xs"
                                position="sticky"
                                right={0}
                                zIndex={2}
                                bg={isNegative ? negativeBg : cardBg}
                                boxShadow="-2px 0 6px -2px rgba(0,0,0,0.12)"
                              >
                                <HStack spacing={1} justify="center">
                                  <Tooltip label="View Detailed Breakdown">
                                    <IconButton 
                                      icon={<ViewIcon />} 
                                      size="xs" 
                                      colorScheme="blue" 
                                      variant="subtle"
                                      onClick={() => handleViewDetails(employee)} 
                                      aria-label="View Details" 
                                    />
                                  </Tooltip>
                                  {isHrUser() && (
                                    <Tooltip label="Set Basic Salary">
                                      <IconButton 
                                        icon={<FiDollarSign />} 
                                        size="xs" 
                                        colorScheme="teal" 
                                        onClick={() => openSalaryModal(employee)} 
                                        aria-label="Set Basic Salary" 
                                      />
                                    </Tooltip>
                                  )}
                                  {isAdminUser() && (
                                    <Tooltip label="Manage Sales Commission">
                                      <IconButton 
                                        icon={<AddIcon />} 
                                        size="xs" 
                                        colorScheme="orange" 
                                        variant="subtle" 
                                        onClick={() => openCommissionModal(employee)} 
                                        aria-label="Commission" 
                                      />
                                    </Tooltip>
                                  )}
                                  {isHrUser() && (
                                    <Tooltip label="HR Attendance Adjustment">
                                      <IconButton 
                                        icon={<EditIcon />} 
                                        size="xs" 
                                        colorScheme="purple" 
                                        variant="subtle" 
                                        onClick={() => openHrModal(employee)} 
                                        aria-label="HR Adjustment" 
                                      />
                                    </Tooltip>
                                  )}
                                  {isFinanceUser() && (
                                    <Tooltip label="Finance Adjustment">
                                      <IconButton 
                                        icon={<EditIcon />} 
                                        size="xs" 
                                        colorScheme="yellow" 
                                        variant="subtle" 
                                        onClick={() => openFinanceModal(employee)} 
                                        aria-label="Finance Adjustment" 
                                      />
                                    </Tooltip>
                                  )}
                                </HStack>
                              </Td>
                            </Tr>
                          );
                        })
                      ) : (
                        <Tr>
                          <Td colSpan={16} py={8} textAlign="center">
                            <VStack spacing={2}>
                              <Icon as={FiFilter} boxSize={8} color="gray.400" />
                              <Text fontWeight="bold" color="gray.600">No Employee Records Found</Text>
                              <Text fontSize="xs" color="gray.400">
                                No employees matched the current search query or filter selection.
                              </Text>
                              {hasActiveFilters && (
                                <Button 
                                  size="xs" 
                                  colorScheme="teal" 
                                  variant="outline" 
                                  mt={2}
                                  onClick={handleResetFilters}
                                >
                                  Reset Filters & Search
                                </Button>
                              )}
                            </VStack>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </CardBody>
          </Card>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* 3. COMMISSIONS & BONUSES VIEW */}
      {/* ========================================================================= */}
      {isCommissionsView && (
        <Box>
          <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
            <StatCard title="Commission Sales Count" value={payrollData.reduce((sum, emp) => sum + (emp.numberOfSales || 0), 0)} color="purple.500" />
            <StatCard title="Total Gross Commission" value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.commissionGross || emp.salesCommission || 0), 0))} color="blue.500" />
            <StatCard title="Commission Tax Withheld" value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.commissionTax || 0), 0))} color="orange.500" />
            <StatCard title="Net Commission Payout" value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.salesCommission || 0), 0))} color="teal.500" isBold={true} />
          </Grid>

          <Card bg={cardBg} boxShadow="md" borderRadius="lg">
            <CardBody py={4} px={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md" color={headerColor}>Sales Agents Commission Breakdown (7.5% Rate)</Heading>
                <Text fontSize="xs" color="gray.500">Based on Ethiopian Sales Product Rules</Text>
              </Flex>
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr bg={headerBg}>
                      <Th color="white">Agent Name</Th>
                      <Th color="white">Department</Th>
                      <Th color="white">Sales Count</Th>
                      <Th color="white">Commission Rate</Th>
                      <Th color="white">Gross Commission</Th>
                      <Th color="white">Tax Withheld</Th>
                      <Th color="white">Net Commission</Th>
                      <Th color="white">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {payrollData.map((employee) => (
                      <Tr key={employee._id || employee.userId?._id}>
                        <Td fontWeight="medium">{employee.employeeName || employee.userId?.fullName || 'Unknown'}</Td>
                        <Td>{employee.department}</Td>
                        <Td><Badge colorScheme="purple">{employee.numberOfSales || 0} Sales</Badge></Td>
                        <Td><Badge colorScheme="green">7.5%</Badge></Td>
                        <Td>{formatCurrency(employee.commissionGross || employee.salesCommission || 0)}</Td>
                        <Td color="orange.500">{formatCurrency(employee.commissionTax || 0)}</Td>
                        <Td fontWeight="bold" color="teal.600">{formatCurrency(employee.salesCommission || 0)}</Td>
                        <Td>
                          <Button size="xs" colorScheme="orange" onClick={() => openCommissionModal(employee)}>
                            Manage Commission
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* 4. BANK & DISBURSEMENTS VIEW */}
      {/* ========================================================================= */}
      {isDisbursementsView && (
        <Box>
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mb={6}>
            <StatCard title="Total Bank Payout Amount" value={formatCurrency(payrollData.reduce((sum, emp) => sum + (emp.netSalary || emp.finalSalary || 0), 0))} color="teal.500" isBold={true} />
            <StatCard title="Accounts to Credit" value={payrollData.length} color="blue.500" />
            <StatCard title="CBE Format Status" value="Ready for Upload" color="green.500" />
          </Grid>

          <Card bg={cardBg} boxShadow="md" borderRadius="lg">
            <CardBody py={4} px={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Box>
                  <Heading size="md" color={headerColor}>Commercial Bank of Ethiopia (CBE) Direct Transfer List</Heading>
                  <Text fontSize="xs" color="gray.500">Official format for bank salary transfer letter</Text>
                </Box>
                <HStack spacing={2}>
                  <Button leftIcon={<DownloadIcon />} colorScheme="teal" size="sm" onClick={exportBankCSV}>
                    Export CBE CSV
                  </Button>
                  <Button leftIcon={<DownloadIcon />} colorScheme="blue" size="sm" onClick={() => window.print()}>
                    Print Bank Letter
                  </Button>
                </HStack>
              </Flex>
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr bg={headerBg}>
                      <Th color="white">S/N</Th>
                      <Th color="white">Employee Full Name</Th>
                      <Th color="white">Department</Th>
                      <Th color="white">Bank Account Number</Th>
                      <Th color="white">TIN Number</Th>
                      <Th color="white">Net Pay Amount (ETB)</Th>
                      <Th color="white">Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {payrollData.map((employee, idx) => {
                      const bankAcc = employee.salaryBankAccountNumber || employee.userId?.personalInformation?.salaryBankAccountNumber || employee.userId?.bankAccountNumber || 'N/A';
                      const tin = employee.tinNumber || employee.userId?.personalInformation?.tinNumber || 'N/A';
                      const netPay = employee.netSalary || employee.finalSalary || 0;
                      return (
                        <Tr key={employee._id || employee.userId?._id}>
                          <Td>{idx + 1}</Td>
                          <Td fontWeight="bold">{employee.employeeName || employee.userId?.fullName || 'Unknown'}</Td>
                          <Td>{employee.department}</Td>
                          <Td fontFamily="monospace" fontSize="xs" color="blue.600">{bankAcc}</Td>
                          <Td fontFamily="monospace" fontSize="xs" color="gray.600">{tin}</Td>
                          <Td fontWeight="bold" color="teal.600">{formatCurrency(netPay)}</Td>
                          <Td>{getStatusBadge(employee.status)}</Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* 5. PAYROLL HISTORY & ARCHIVES VIEW */}
      {/* ========================================================================= */}
      {isHistoryView && (
        <Box>
          <Card bg={cardBg} boxShadow="md" borderRadius="lg">
            <CardBody py={4} px={4}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md" color={headerColor}>Payroll History & ERP Archives</Heading>
                <Button size="sm" variant="ghost" onClick={fetchFilteredPayrollHistory} isLoading={historyLoading}>
                  Refresh Archives
                </Button>
              </Flex>

              <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={3} mb={4}>
                <FormControl>
                  <FormLabel fontSize="xs">Username / Name</FormLabel>
                  <Input value={historyFilters.username} onChange={(e) => handleHistoryFilterChange('username', e.target.value)} size="sm" placeholder="Search employee..." />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Month (YYYY-MM)</FormLabel>
                  <Input type="month" value={historyFilters.month} onChange={(e) => handleHistoryFilterChange('month', e.target.value)} size="sm" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Status</FormLabel>
                  <Select value={historyFilters.status} onChange={(e) => handleHistoryFilterChange('status', e.target.value)} size="sm">
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="hr_submitted">HR Submitted</option>
                    <option value="finance_reviewed">Finance Reviewed</option>
                    <option value="approved">Approved</option>
                    <option value="locked">Locked</option>
                  </Select>
                </FormControl>
                <Flex align="flex-end">
                  <Button colorScheme="teal" size="sm" onClick={fetchFilteredPayrollHistory} width="full" isLoading={historyLoading}>
                    Search History
                  </Button>
                </Flex>
              </Grid>

              {historyLoading ? (
                <Flex justify="center" py={6}><Spinner size="md" color="teal.500" /></Flex>
              ) : filteredPayrollHistory.length > 0 ? (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr bg={headerBg}>
                        <Th color="white">Period</Th>
                        <Th color="white">Employee</Th>
                        <Th color="white">Gross Salary</Th>
                        <Th color="white">Net Salary</Th>
                        <Th color="white">Finalized By</Th>
                        <Th color="white">Finalized At</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredPayrollHistory.map((entry) => (
                        <Tr key={entry._id}>
                          <Td fontStyle="italic">{entry.month} {entry.year}</Td>
                          <Td fontWeight="medium">{entry.employeeName}</Td>
                          <Td>{formatCurrency(entry.grossSalary || 0)}</Td>
                          <Td fontWeight="bold" color="teal.600">{formatCurrency(entry.netSalary || 0)}</Td>
                          <Td>{entry.financeReviewedBy || entry.lockedBy || 'ERP Admin'}</Td>
                          <Td fontSize="xs">{entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : 'N/A'}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Text fontSize="sm" color="gray.500" py={4} textAlign="center">
                  Select a month or click Search to view archived payroll records.
                </Text>
              )}
            </CardBody>
          </Card>
        </Box>
      )}

      {/* Set / Edit Basic Salary Slide-over Drawer */}
      <Drawer
        isOpen={isSalaryModalOpen}
        placement="right"
        onClose={() => setIsSalaryModalOpen(false)}
        size="md"
      >
        <DrawerOverlay backdropFilter="blur(2px)" />
        <DrawerContent bg={cardBg} shadow="2xl">
          <DrawerHeader borderBottom="1px solid" borderColor={borderColor} pb={3}>
            <HStack spacing={3}>
              <Flex w="40px" h="40px" borderRadius="xl" bg="teal.50" color="teal.600" align="center" justify="center">
                <Icon as={FiDollarSign} boxSize={5} />
              </Flex>
              <Box>
                <Heading size="sm" color="teal.800">Set Employee Basic Salary</Heading>
                <Text fontSize="xs" color="gray.500" fontWeight="normal">Configure basic salary & establish statutory Ethiopian payroll</Text>
              </Box>
            </HStack>
            <DrawerCloseButton top={4} right={4} />
          </DrawerHeader>
          <DrawerBody py={5} overflowY="auto">
            {/* Employee Summary Card */}
            <Card mb={4} bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl">
              <CardBody py={3} px={4}>
                <Flex justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Avatar size="sm" name={salaryFormData.employeeName} bg="teal.600" color="white" />
                    <Box>
                      <Text fontWeight="bold" fontSize="sm">{salaryFormData.employeeName}</Text>
                      <HStack spacing={2} mt={0.5}>
                        <Badge colorScheme="teal" fontSize="10px" borderRadius="md">{salaryFormData.department || 'General'}</Badge>
                        <Badge colorScheme="purple" fontSize="10px" borderRadius="md">{salaryFormData.role || 'Staff'}</Badge>
                      </HStack>
                    </Box>
                  </HStack>
                  <Box textAlign="right">
                    <Text fontSize="10px" color="gray.500">Current Basic</Text>
                    <Text fontWeight="extrabold" fontSize="sm" color="teal.600">
                      {formatCurrency(selectedEmployee?.basicSalary || 0)}
                    </Text>
                  </Box>
                </Flex>
              </CardBody>
            </Card>

            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="700" color="teal.900">
                  Monthly Basic Salary (ETB)
                </FormLabel>
                <InputGroup size="md">
                  <InputLeftElement pointerEvents="none" fontSize="sm" fontWeight="bold" color="teal.600">
                    ETB
                  </InputLeftElement>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    borderRadius="xl"
                    fontWeight="bold"
                    fontSize="md"
                    placeholder="e.g. 15000"
                    value={salaryFormData.basicSalary}
                    onChange={(e) => setSalaryFormData({ ...salaryFormData, basicSalary: e.target.value })}
                  />
                </InputGroup>
                <Text fontSize="10px" color="gray.500" mt={1}>
                  This base compensation directly calculates statutory employment tax and pension deductions.
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="700" color="teal.900">
                  Non-Taxable Transport Allowance (ETB)
                </FormLabel>
                <InputGroup size="md">
                  <InputLeftElement pointerEvents="none" fontSize="sm" fontWeight="bold" color="teal.600">
                    ETB
                  </InputLeftElement>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    borderRadius="xl"
                    fontWeight="bold"
                    fontSize="md"
                    placeholder="e.g. 2500"
                    value={salaryFormData.transportAllowance}
                    onChange={(e) => setSalaryFormData({ ...salaryFormData, transportAllowance: e.target.value })}
                  />
                </InputGroup>
                <Text fontSize="10px" color="gray.500" mt={1}>
                  Statutory non-taxable transport allowance under Ethiopian regulation. Added directly to net payable salary without tax deduction.
                </Text>
              </FormControl>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color="gray.700">
                    Salary Bank Account (CBE)
                  </FormLabel>
                  <Input
                    size="sm"
                    borderRadius="lg"
                    placeholder="1000..."
                    value={salaryFormData.salaryBankAccountNumber}
                    onChange={(e) => setSalaryFormData({ ...salaryFormData, salaryBankAccountNumber: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700" color="gray.700">
                    TIN Number
                  </FormLabel>
                  <Input
                    size="sm"
                    borderRadius="lg"
                    placeholder="TIN..."
                    value={salaryFormData.tinNumber}
                    onChange={(e) => setSalaryFormData({ ...salaryFormData, tinNumber: e.target.value })}
                  />
                </FormControl>
              </SimpleGrid>

              {/* Real-time Ethiopian Statutory Deductions Preview */}
              {Number(salaryFormData.basicSalary) > 0 && (() => {
                const est = calculateNetSalary({ 
                  basicSalary: salaryFormData.basicSalary,
                  transportAllowance: salaryFormData.transportAllowance 
                });
                const hasTransport = Number(salaryFormData.transportAllowance) > 0;
                return (
                  <Box bg="teal.50" p={3.5} borderRadius="xl" border="1px solid" borderColor="teal.200">
                    <Flex justify="space-between" align="center" mb={2} pb={1.5} borderBottom="1px solid" borderColor="teal.200">
                      <HStack spacing={1.5}>
                        <Icon as={FiShield} color="teal.700" />
                        <Text fontSize="xs" fontWeight="bold" color="teal.900">
                          Ethiopian Statutory Calculation Preview
                        </Text>
                      </HStack>
                      <Badge colorScheme="green" fontSize="10px" borderRadius="full">
                        Auto Established
                      </Badge>
                    </Flex>
                    <SimpleGrid columns={{ base: 2, sm: hasTransport ? 5 : 4 }} spacing={2} textAlign="center" mb={2}>
                      <Box bg="white" p={2} borderRadius="lg" shadow="xs">
                        <Text fontSize="10px" color="gray.500" mb={0.5}>Employment Tax</Text>
                        <Text fontSize="xs" fontWeight="bold" color="orange.600">-{formatETB(est.incomeTax)}</Text>
                      </Box>
                      <Box bg="white" p={2} borderRadius="lg" shadow="xs">
                        <Text fontSize="10px" color="gray.500" mb={0.5}>Pension (7%)</Text>
                        <Text fontSize="xs" fontWeight="bold" color="purple.600">-{formatETB(est.pension)}</Text>
                      </Box>
                      <Box bg="white" p={2} borderRadius="lg" shadow="xs">
                        <Text fontSize="10px" color="gray.500" mb={0.5}>Employer (11%)</Text>
                        <Text fontSize="xs" fontWeight="bold" color="pink.600">+{formatETB(est.employerPension)}</Text>
                      </Box>
                      {hasTransport && (
                        <Box bg="green.50" p={2} borderRadius="lg" shadow="xs" border="1px solid" borderColor="green.200">
                          <Text fontSize="10px" color="green.700" mb={0.5}>Transport (Non-Tax)</Text>
                          <Text fontSize="xs" fontWeight="bold" color="green.600">+{formatETB(est.transportAllowance)}</Text>
                        </Box>
                      )}
                      <Box bg="teal.100" p={2} borderRadius="lg" shadow="xs">
                        <Text fontSize="10px" color="teal.900" fontWeight="bold" mb={0.5}>Est. Net Salary</Text>
                        <Text fontSize="xs" fontWeight="extrabold" color="teal.800">{formatETB(est.netSalary)}</Text>
                      </Box>
                    </SimpleGrid>
                    <Text fontSize="10px" color="teal.800">
                      ✓ Compliant with Proclamation No. 979/2016 progressive tax bracket, 7% employee pension, and non-taxable transport allowance.
                    </Text>
                  </Box>
                );
              })()}
            </Stack>
          </DrawerBody>
          <DrawerFooter borderTop="1px solid" borderColor={borderColor} pt={3} bg={bgColor}>
            <HStack spacing={3}>
              <Button size="sm" variant="ghost" onClick={() => setIsSalaryModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                colorScheme="teal"
                isLoading={isSavingSalary}
                loadingText="Establishing..."
                onClick={handleSaveSalary}
              >
                Save Basic Salary & Establish Payroll
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* HR Attendance Adjustment Slide-over Drawer */}
      <Drawer
        isOpen={isHrModalOpen}
        placement="right"
        onClose={() => setIsHrModalOpen(false)}
        size="lg"
      >
        <DrawerOverlay backdropFilter="blur(2px)" />
        <DrawerContent bg={cardBg} shadow="2xl" maxW={{ base: "100%", md: "650px", lg: "750px" }}>
          <DrawerHeader borderBottom="1px solid" borderColor={borderColor} pb={3}>
            <HStack spacing={3}>
              <Flex w="40px" h="40px" borderRadius="xl" bg="blue.50" color="blue.600" align="center" justify="center">
                <Icon as={FiClock} boxSize={5} />
              </Flex>
              <Box>
                <Heading size="sm" color="blue.800">HR Attendance Adjustment</Heading>
                <Text fontSize="xs" color="gray.500" fontWeight="normal">Configure work days, overtime, and attendance deductions</Text>
              </Box>
            </HStack>
            <DrawerCloseButton top={4} right={4} />
          </DrawerHeader>
          <DrawerBody py={5} overflowY="auto">
            {selectedEmployee && (
              <Card mb={4} bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl">
                <CardBody py={3} px={4}>
                  <Flex justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Avatar size="sm" name={selectedEmployee.employeeName} bg="blue.600" color="white" />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">{selectedEmployee.employeeName}</Text>
                        <HStack spacing={2} mt={0.5}>
                          <Badge colorScheme="blue" fontSize="10px" borderRadius="md">{selectedEmployee.department || 'General'}</Badge>
                          <Badge colorScheme="purple" fontSize="10px" borderRadius="md">{selectedEmployee.role || 'Staff'}</Badge>
                        </HStack>
                      </Box>
                    </HStack>
                    <Box textAlign="right">
                      <Text fontSize="10px" color="gray.500">Period</Text>
                      <Text fontWeight="bold" fontSize="xs" color="gray.700">
                        {selectedMonth} {selectedYear}
                      </Text>
                    </Box>
                  </Flex>
                </CardBody>
              </Card>
            )}
            
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4} mb={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="bold" color="teal.600">Days Worked (Default 30)</FormLabel>
                <Input
                  type="number"
                  name="daysWorked"
                  value={hrFormData.daysWorked}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="1"
                  max="30"
                />
                <Text fontSize="2xs" color="gray.500">Salary is pro-rated if less than 30 days</Text>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="bold" color="teal.600">Non-Taxable Transport Allowance (ETB)</FormLabel>
                <Input
                  type="number"
                  name="transportAllowance"
                  value={hrFormData.transportAllowance}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="0"
                />
                <Text fontSize="2xs" color="gray.500">Added to net salary after tax deductions</Text>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Taxable Allowance</FormLabel>
                <Input
                  type="number"
                  name="taxableAllowance"
                  value={hrFormData.taxableAllowance}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="0"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Other HR Allowances</FormLabel>
                <Input
                  type="number"
                  name="hrAllowances"
                  value={hrFormData.hrAllowances}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="0"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Daytime Overtime Hours (1.5x)</FormLabel>
                <Input
                  type="number"
                  name="daytimeOvertimeHours"
                  value={hrFormData.daytimeOvertimeHours}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="0"
                  step="0.5"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Night Overtime Hours (1.75x)</FormLabel>
                <Input
                  type="number"
                  name="nightOvertimeHours"
                  value={hrFormData.nightOvertimeHours}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="0"
                  step="0.5"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Rest Day OT Hours (2.0x)</FormLabel>
                <Input
                  type="number"
                  name="restDayOvertimeHours"
                  value={hrFormData.restDayOvertimeHours}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="0"
                  step="0.5"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Public Holiday OT Hours (2.5x)</FormLabel>
                <Input
                  type="number"
                  name="holidayOvertimeHours"
                  value={hrFormData.holidayOvertimeHours}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="0"
                  step="0.5"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Late Days (300 ETB / day)</FormLabel>
                <Input
                  type="number"
                  name="lateDays"
                  value={hrFormData.lateDays}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="0"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Absence Days</FormLabel>
                <Input
                  type="number"
                  name="absenceDays"
                  value={hrFormData.absenceDays}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="0"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Absent Penalty (ETB)</FormLabel>
                <Input
                  type="number"
                  name="absenceDeduction"
                  value={hrFormData.absenceDeduction}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="0"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="orange.600" fontWeight="bold">Loan Repayment (ETB)</FormLabel>
                <Input
                  type="number"
                  name="loan"
                  value={hrFormData.loan}
                  onChange={handleHrFormChange}
                  size="sm"
                  borderRadius="md"
                  min="0"
                />
              </FormControl>
            </Grid>
          </DrawerBody>
          
          <DrawerFooter borderTop="1px solid" borderColor={borderColor} pt={3} bg={bgColor}>
            <HStack spacing={3}>
              <Button 
                variant="ghost" 
                onClick={() => setIsHrModalOpen(false)}
                size="sm"
                px={6}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={submitHrAdjustmentHandler}
                size="sm"
                px={6}
              >
                Submit Adjustment
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
        
      {/* Finance Adjustment Slide-over Drawer */}
      <Drawer
        isOpen={isFinanceModalOpen}
        placement="right"
        onClose={() => setIsFinanceModalOpen(false)}
        size="md"
      >
        <DrawerOverlay backdropFilter="blur(2px)" />
        <DrawerContent bg={cardBg} shadow="2xl">
          <DrawerHeader borderBottom="1px solid" borderColor={borderColor} pb={3}>
            <HStack spacing={3}>
              <Flex w="40px" h="40px" borderRadius="xl" bg="purple.50" color="purple.600" align="center" justify="center">
                <Icon as={FiCreditCard} boxSize={5} />
              </Flex>
              <Box>
                <Heading size="sm" color="purple.800">Finance Adjustment</Heading>
                <Text fontSize="xs" color="gray.500" fontWeight="normal">Record finance-approved allowances and custom deductions</Text>
              </Box>
            </HStack>
            <DrawerCloseButton top={4} right={4} />
          </DrawerHeader>
          <DrawerBody py={5} overflowY="auto">
            {selectedEmployee && (
              <Card mb={4} bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl">
                <CardBody py={3} px={4}>
                  <Flex justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Avatar size="sm" name={selectedEmployee.employeeName} bg="purple.600" color="white" />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">{selectedEmployee.employeeName}</Text>
                        <HStack spacing={2} mt={0.5}>
                          <Badge colorScheme="purple" fontSize="10px" borderRadius="md">{selectedEmployee.department || 'General'}</Badge>
                          <Badge colorScheme="blue" fontSize="10px" borderRadius="md">{selectedEmployee.role || 'Staff'}</Badge>
                        </HStack>
                      </Box>
                    </HStack>
                    <Box textAlign="right">
                      <Text fontSize="10px" color="gray.500">Period</Text>
                      <Text fontWeight="bold" fontSize="xs" color="gray.700">
                        {selectedMonth} {selectedYear}
                      </Text>
                    </Box>
                  </Flex>
                </CardBody>
              </Card>
            )}
            
            <Stack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Finance Allowances</FormLabel>
                <Input
                  type="number"
                  name="financeAllowances"
                  value={financeFormData.financeAllowances}
                  onChange={handleFinanceFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Finance Deductions</FormLabel>
                <Input
                  type="number"
                  name="financeDeductions"
                  value={financeFormData.financeDeductions}
                  onChange={handleFinanceFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">HR Allowances</FormLabel>
                <Input
                  type="number"
                  name="hrAllowances"
                  value={financeFormData.hrAllowances}
                  onChange={handleFinanceFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
            </Stack>
          </DrawerBody>
          
          <DrawerFooter borderTop="1px solid" borderColor={borderColor} pt={3} bg={bgColor}>
            <HStack spacing={3}>
              <Button 
                variant="ghost" 
                onClick={() => setIsFinanceModalOpen(false)}
                size="sm"
                px={6}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="purple" 
                onClick={submitFinanceAdjustmentHandler}
                size="sm"
                px={6}
              >
                Submit
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
        
      {/* Commission Management Slide-over Drawer */}
      <Drawer
        isOpen={isCommissionModalOpen}
        placement="right"
        onClose={() => setIsCommissionModalOpen(false)}
        size="xl"
      >
        <DrawerOverlay backdropFilter="blur(2px)" />
        <DrawerContent bg={cardBg} shadow="2xl" maxW={{ base: "100%", md: "750px", lg: "850px" }}>
          <DrawerHeader borderBottom="1px solid" borderColor={borderColor} pb={3}>
            <HStack spacing={3}>
              <Flex w="40px" h="40px" borderRadius="xl" bg="teal.50" color="teal.600" align="center" justify="center">
                <Icon as={FiDollarSign} boxSize={5} />
              </Flex>
              <Box>
                <Heading size="sm" color="teal.800">Commission Management</Heading>
                <Text fontSize="xs" color="gray.500" fontWeight="normal">Review sales transactions, calculate commission bonuses & boosts</Text>
              </Box>
            </HStack>
            <DrawerCloseButton top={4} right={4} />
          </DrawerHeader>
          <DrawerBody py={5} overflowY="auto">
            {selectedEmployee && (
              <Card mb={4} bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="xl">
                <CardBody py={3} px={4}>
                  <Flex justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Avatar size="sm" name={selectedEmployee.employeeName} bg="teal.600" color="white" />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">{selectedEmployee.employeeName}</Text>
                        <HStack spacing={2} mt={0.5}>
                          <Badge colorScheme="teal" fontSize="10px" borderRadius="md">{selectedEmployee.department || 'Sales'}</Badge>
                          <Badge colorScheme="purple" fontSize="10px" borderRadius="md">{selectedEmployee.role || 'Staff'}</Badge>
                        </HStack>
                      </Box>
                    </HStack>
                    <Box textAlign="right">
                      <Text fontSize="10px" color="gray.500">Period</Text>
                      <Text fontWeight="bold" fontSize="xs" color="gray.700">
                        {useDateRange && commissionDateRange.startDate && commissionDateRange.endDate
                          ? `${commissionDateRange.startDate} to ${commissionDateRange.endDate}`
                          : `${selectedMonth} ${selectedYear}`}
                      </Text>
                    </Box>
                  </Flex>
                </CardBody>
              </Card>
            )}
            
            {selectedEmployee?.department === 'sales' && (
              <Box mb={4}>
                {/* Date Selection Toggle */}
                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontSize="sm" fontWeight="bold">Date Selection</Text>
                  <Button 
                    size="xs" 
                    colorScheme={useDateRange ? "blue" : "gray"}
                    onClick={toggleDateSelection}
                  >
                    {useDateRange ? "Use Month/Year" : "Use Date Range"}
                  </Button>
                </Flex>
                
                {useDateRange ? (
                  <Grid templateColumns="1fr 1fr" gap={3} mb={4}>
                    <FormControl>
                      <FormLabel fontSize="xs">Start Date</FormLabel>
                      <Input
                        type="date"
                        name="startDate"
                        value={commissionDateRange.startDate}
                        onChange={handleDateRangeChange}
                        size="sm"
                        borderRadius="md"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="xs">End Date</FormLabel>
                      <Input
                        type="date"
                        name="endDate"
                        value={commissionDateRange.endDate}
                        onChange={handleDateRangeChange}
                        size="sm"
                        borderRadius="md"
                        min={commissionDateRange.startDate}
                      />
                    </FormControl>
                  </Grid>
                ) : (
                  <Text fontSize="sm" mb={4} color="gray.500">
                    Using month/year: {selectedMonth} {selectedYear}
                  </Text>
                )}
                
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontSize="sm" fontWeight="bold">Sales Data</Text>
                  <Button 
                    size="xs" 
                    colorScheme="teal" 
                    onClick={fetchSalesDataWithDateRange}
                    isLoading={loadingSales}
                  >
                    Refresh Sales Data
                  </Button>
                </Flex>
                
                {loadingSales ? (
                  <Flex justify="center" py={4}>
                    <Spinner size="sm" />
                  </Flex>
                ) : (
                  <div>
                    {salesData && salesData.length > 0 ? (
                      <Box maxHeight="220px" overflowY="auto" border="1px" borderColor={borderColor} borderRadius="md" p={2}>
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th px={2} py={1} fontSize="xs">Customer</Th>
                              <Th px={2} py={1} fontSize="xs" isNumeric>Amount</Th>
                              <Th px={2} py={1} fontSize="xs" isNumeric>Gross</Th>
                              <Th px={2} py={1} fontSize="xs" isNumeric>Social Media Boost</Th>
                              <Th px={2} py={1} fontSize="xs" isNumeric>Net</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {salesData.map((sale, index) => (
                              <Tr key={index}>
                                <Td px={2} py={1} fontSize="xs">{sale.customerName}</Td>
                                <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(sale.saleAmount ?? sale.coursePrice ?? 0)}</Td>
                                <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(sale.grossCommission || 0)}</Td>
                                <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(sale.commissionTax || 0)}</Td>
                                <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(sale.netCommission || 0)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    ) : (
                      <Text fontSize="sm" color="gray.500">No sales data found for this period</Text>
                    )}
                  </div>
                )}
              </Box>
            )}
            
            <Grid templateColumns="1fr 1fr 1fr" gap={4} mb={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Number of Sales</FormLabel>
                <Input
                  type="number"
                  name="numberOfSales"
                  value={commissionFormData.numberOfSales}
                  onChange={handleCommissionFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Gross Commission</FormLabel>
                <Input
                  type="number"
                  name="grossCommission"
                  value={commissionFormData.grossCommission || 0}
                  onChange={handleCommissionFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Net Commission</FormLabel>
                <Input
                  type="number"
                  name="totalCommission"
                  value={commissionFormData.totalCommission}
                  onChange={handleCommissionFormChange}
                  size="sm"
                  borderRadius="md"
                />
              </FormControl>
            </Grid>
            
            <Text fontSize="sm" fontWeight="bold" mb={2}>Commission Details</Text>
            {commissionFormData.commissionDetails && commissionFormData.commissionDetails.length > 0 ? (
              <Box maxHeight="180px" overflowY="auto" border="1px" borderColor={borderColor} borderRadius="md" p={2} mb={4}>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th px={2} py={1} fontSize="xs">Customer</Th>
                      <Th px={2} py={1} fontSize="xs" isNumeric>Amount</Th>
                      <Th px={2} py={1} fontSize="xs" isNumeric>Gross</Th>
                      <Th px={2} py={1} fontSize="xs" isNumeric>Social Media Boost</Th>
                      <Th px={2} py={1} fontSize="xs" isNumeric>Net</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {commissionFormData.commissionDetails.map((detail, index) => (
                      <Tr key={index}>
                        <Td px={2} py={1} fontSize="xs">{detail.customerName}</Td>
                        <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(detail.saleAmount || 0)}</Td>
                        <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(detail.grossCommission || 0)}</Td>
                        <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(detail.commissionTax || 0)}</Td>
                        <Td px={2} py={1} fontSize="xs" isNumeric>{formatCurrency(detail.netCommission || 0)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Text fontSize="sm" color="gray.500" mb={4}>No commission details added</Text>
            )}
          </DrawerBody>
          
          <DrawerFooter borderTop="1px solid" borderColor={borderColor} pt={3} bg={bgColor}>
            {hasStoredCommission && (
              <Button
                variant="outline"
                colorScheme="red"
                size="sm"
                mr="auto"
                onClick={clearCommissionHandler}
                isLoading={clearingCommission}
              >
                Clear Saved Commission
              </Button>
            )}
            <HStack spacing={3}>
              <Button 
                variant="ghost" 
                onClick={() => setIsCommissionModalOpen(false)}
                size="sm"
                px={6}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="teal" 
                onClick={submitCommissionHandler}
                size="sm"
                px={6}
              >
                Save Commission
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

        {/* Slide-over Employee Payroll Details Drawer */}
        {selectedEmployeeForDrawer && (
          <EmployeePayrollDrawer
            isOpen={isDetailsDrawerOpen}
            onClose={() => setIsDetailsDrawerOpen(false)}
            employee={selectedEmployeeForDrawer}
            month={selectedEmployeeForDrawer.month || selectedMonth}
            year={selectedEmployeeForDrawer.year || selectedYear}
          />
        )}
      </Box>
  );

  return wrapLayout ? <Layout>{pageContent}</Layout> : pageContent;
};

// Stat Card Component
const StatCard = ({ title, value, color, isBold = false, icon = null, subtext = null }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Card 
      bg={cardBg} 
      boxShadow="sm" 
      borderRadius="xl" 
      border="1px solid" 
      borderColor={borderColor}
      borderTop="3px solid"
      borderTopColor={color || 'teal.500'}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
    >
      <CardBody py={3.5} px={4}>
        <Stat>
          <Flex justify="space-between" align="center" mb={1}>
            <StatLabel fontSize="xs" fontWeight="semibold" color="gray.500" noOfLines={1}>
              {title}
            </StatLabel>
            {icon && (
              <Box color={color} opacity={0.85} fontSize="sm">
                {icon}
              </Box>
            )}
          </Flex>
          <StatNumber 
            fontSize={{ base: "sm", sm: "md", md: "lg" }} 
            color={color} 
            fontWeight={isBold ? "extrabold" : "bold"}
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            letterSpacing="tight"
          >
            {value}
          </StatNumber>
          {subtext && (
            <Text fontSize="10px" color="gray.400" mt={0.5} noOfLines={1}>
              {subtext}
            </Text>
          )}
        </Stat>
      </CardBody>
    </Card>
  );
};

export default PayrollPage;
