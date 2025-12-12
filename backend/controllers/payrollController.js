// Import required modules
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Commission = require('../models/Commission');
const User = require('../models/user.model');

// Calculate Ethiopian Income Tax based on gross salary
const calculateEthiopianIncomeTax = (grossSalary) => {
  // Ethiopian Income Tax Brackets
  // Up to ETB 600: 0%
  // ETB 601-1,600: 10% on amount exceeding ETB 600
  // ETB 1,601-3,200: ETB 100 + 15% on amount exceeding ETB 1,600
  // ETB 3,201-5,200: ETB 340 + 20% on amount exceeding ETB 3,200
  // ETB 5,201-10,000: ETB 740 + 25% on amount exceeding ETB 5,200
  // Above ETB 10,000: ETB 1,940 + 30% on amount exceeding ETB 10,000
  
  if (grossSalary <= 600) {
    return 0;
  } else if (grossSalary <= 1600) {
    return (grossSalary - 600) * 0.10;
  } else if (grossSalary <= 3200) {
    return 100 + (grossSalary - 1600) * 0.15;
  } else if (grossSalary <= 5200) {
    return 340 + (grossSalary - 3200) * 0.20;
  } else if (grossSalary <= 10000) {
    return 740 + (grossSalary - 5200) * 0.25;
  } else {
    return 1940 + (grossSalary - 10000) * 0.30;
  }
};

// Calculate pension contribution (7% of basic salary)
const calculatePension = (basicSalary) => {
  return basicSalary * 0.07;
};

// Calculate hourly wage from monthly salary
const calculateHourlyWage = (monthlySalary) => {
  if (!monthlySalary) return 0;
  const dailySalary = monthlySalary / 30;
  const hourlyWage = dailySalary / 8;
  return hourlyWage;
};

// Calculate overtime pay based on Ethiopian labor law
const calculateOvertimePay = (hourlyWage, overtimeData) => {
  if (!overtimeData) return 0;
  
  let totalOvertimePay = 0;
  
  // Daytime Overtime (6am–10pm): 1.5x hourly rate
  if (overtimeData.daytimeOvertimeHours) {
    const daytimeRate = hourlyWage * 1.5;
    totalOvertimePay += overtimeData.daytimeOvertimeHours * daytimeRate;
  }
  
  // Night Overtime (10pm–6am): 1.75x hourly rate
  if (overtimeData.nightOvertimeHours) {
    const nightRate = hourlyWage * 1.75;
    totalOvertimePay += overtimeData.nightOvertimeHours * nightRate;
  }
  
  // Rest Day Overtime: 2.0x hourly rate
  if (overtimeData.restDayOvertimeHours) {
    const restDayRate = hourlyWage * 2.0;
    totalOvertimePay += overtimeData.restDayOvertimeHours * restDayRate;
  }
  
  // Public Holiday Overtime: 2.5x hourly rate
  if (overtimeData.holidayOvertimeHours) {
    const holidayRate = hourlyWage * 2.5;
    totalOvertimePay += overtimeData.holidayOvertimeHours * holidayRate;
  }
  
  return totalOvertimePay;
};

// Calculate late deduction (3000 ETB per day)
const calculateLateDeduction = (lateDays) => {
  return (lateDays || 0) * 300;
};

// Calculate absence deduction (3000 ETB per day)
const calculateAbsenceDeduction = (absenceDays) => {
  return (absenceDays || 0) * 3000;
};

// Enhanced payroll calculation function
const calculatePayrollForEmployee = async (userData, attendanceData, commissionData) => {
  try {
    const currentDate = new Date();
    const month = currentDate.toISOString().slice(0, 7);
    const year = currentDate.getFullYear();
    
    // Base salary from user data
    const basicSalary = userData.salary || 0;
    
    // Calculate hourly wage for overtime calculations
    const hourlyWage = calculateHourlyWage(basicSalary);
    
    // Calculate overtime pay
    let overtimePay = 0;
    let totalOvertimeHours = 0;
    if (attendanceData) {
      overtimePay = calculateOvertimePay(hourlyWage, attendanceData);
      totalOvertimeHours = (
        (attendanceData.daytimeOvertimeHours || 0) +
        (attendanceData.nightOvertimeHours || 0) +
        (attendanceData.restDayOvertimeHours || 0) +
        (attendanceData.holidayOvertimeHours || 0)
      );
    }
    
    // Calculate late deduction
    let lateDeduction = 0;
    const lateDays = attendanceData?.lateDays || 0;
    if (lateDays) {
      lateDeduction = calculateLateDeduction(lateDays);
    }
    
    // Calculate absence deduction
    let absenceDeduction = 0;
    const absenceDays = attendanceData?.absenceDays || 0;
    if (absenceDays) {
      absenceDeduction = calculateAbsenceDeduction(absenceDays);
    }
    
    // Calculate commission
    let salesCommission = 0;
    let numberOfSales = 0;
    if (commissionData) {
      salesCommission = commissionData.totalCommission || 0;
      numberOfSales = commissionData.numberOfSales || 0;
    }
    
    // Calculate allowances
    const hrAllowances = attendanceData?.hrAllowances || 0;
    const financeAllowances = attendanceData?.financeAllowances || 0;
    const financeDeductions = attendanceData?.financeDeductions || 0;
    
    // Calculate gross salary (basic + overtime + commission + allowances)
    const grossSalary = basicSalary + overtimePay + salesCommission + hrAllowances + financeAllowances;
    
    // Calculate income tax on gross salary
    const incomeTax = calculateEthiopianIncomeTax(grossSalary);
    
    // Calculate pension (7% of basic salary only)
    const pension = calculatePension(basicSalary);
    
    // Calculate net salary
    const netSalary = grossSalary - incomeTax - pension - lateDeduction - absenceDeduction - financeDeductions;
    
    // Prepare payroll record
    const payrollRecord = {
      userId: userData._id,
      employeeName: userData.fullName || userData.username,
      department: userData.department || 'general',
      month,
      year,
      basicSalary,
      grossSalary,
      incomeTax,
      pension,
      overtimeHours: totalOvertimeHours,
      overtimePay,
      lateDays,
      lateDeduction,
      absenceDays,
      absenceDeduction,
      numberOfSales,
      salesCommission,
      hrAllowances,
      financeAllowances,
      financeDeductions,
      netSalary,
      status: 'draft'
    };
    
    return payrollRecord;
  } catch (error) {
    console.error('Error calculating payroll for employee:', error);
    throw error;
  }
};

// GET /payroll/:month → full payroll list
const getPayrollList = async (req, res) => {
  try {
    const { month } = req.params;
    const { year, department, role } = req.query;
    
    // Build query
    let query = { month };
    if (year) query.year = year;
    if (department) query.department = department;
    if (role) query.role = role;
    
    const payrollRecords = await Payroll.find(query)
      .populate('userId', 'username fullName role salary')
      .sort({ employeeName: 1 });
    
    res.json(payrollRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/calculate → run payroll engine
const calculatePayrollForAll = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    // Get all active users
    const users = await User.find({ status: 'active' });
    
    let payrollRecords = [];
    
    for (const user of users) {
      try {
        // Get attendance data for the user
        const attendanceData = await Attendance.findOne({
          userId: user._id,
          date: {
            $gte: new Date(`${month}-01`),
            $lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1))
          }
        });
        
        // Get commission data for the user
        const commissionData = await Commission.findOne({
          userId: user._id,
          month,
          year
        });
        
        // Calculate payroll for the employee
        const payrollData = await calculatePayrollForEmployee(user, attendanceData, commissionData);
        
        // Check if payroll record already exists
        const existingRecord = await Payroll.findOne({
          userId: user._id,
          month,
          year
        });
        
        let payrollRecord;
        if (existingRecord) {
          // Update existing record
          payrollRecord = await Payroll.findByIdAndUpdate(
            existingRecord._id,
            { ...payrollData, auditLog: [...existingRecord.auditLog, {
              changedBy: req.user._id,
              changedAt: new Date(),
              fieldName: 'Payroll Recalculation',
              oldValue: null,
              newValue: 'Recalculated',
              role: req.user.role
            }] },
            { new: true }
          );
        } else {
          // Create new record
          payrollRecord = new Payroll({
            ...payrollData,
            auditLog: [{
              changedBy: req.user._id,
              changedAt: new Date(),
              fieldName: 'Payroll Creation',
              oldValue: null,
              newValue: 'Created',
              role: req.user.role
            }]
          });
          await payrollRecord.save();
        }
        
        payrollRecords.push(payrollRecord);
      } catch (error) {
        console.error(`Error calculating payroll for user ${user._id}:`, error);
        // Continue with other users even if one fails
      }
    }
    
    res.json({
      success: true,
      message: `Payroll calculated for ${payrollRecords.length} employees`,
      data: payrollRecords
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/hr-adjust → HR attendance submission
const submitHRAdjustment = async (req, res) => {
  try {
    const { userId, month, year, ...attendanceData } = req.body;
    
    // Validate required fields
    if (!userId || !month || !year) {
      return res.status(400).json({ message: 'User ID, month, and year are required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Upsert attendance record
    const attendanceRecord = await Attendance.findOneAndUpdate(
      { userId, date: { $gte: new Date(`${month}-01`), $lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)) } },
      {
        ...attendanceData,
        userId,
        employeeName: user.fullName || user.username,
        department: user.department || 'general',
        status: 'approved',
        submittedBy: req.user._id,
        approvedBy: req.user._id,
        submittedAt: new Date(),
        approvedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    // Recalculate payroll for this user
    const commissionData = await Commission.findOne({ userId, month, year });
    const payrollData = await calculatePayrollForEmployee(user, attendanceRecord, commissionData);
    
    // Update or create payroll record
    const payrollRecord = await Payroll.findOneAndUpdate(
      { userId, month, year },
      {
        ...payrollData,
        hrSubmittedBy: req.user._id,
        hrSubmittedAt: new Date(),
        status: 'hr_submitted',
        $push: {
          auditLog: {
            changedBy: req.user._id,
            changedAt: new Date(),
            fieldName: 'HR Adjustment',
            oldValue: null,
            newValue: 'HR adjustment submitted',
            role: 'HR'
          }
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: 'HR adjustment submitted successfully',
      data: payrollRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/finance-adjust → Finance allowances & deductions
const submitFinanceAdjustment = async (req, res) => {
  try {
    const { userId, month, year, financeAllowances, financeDeductions } = req.body;
    
    // Validate required fields
    if (!userId || !month || !year) {
      return res.status(400).json({ message: 'User ID, month, and year are required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get existing attendance record
    const attendanceRecord = await Attendance.findOne({
      userId,
      date: { $gte: new Date(`${month}-01`), $lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)) }
    });
    
    // Get existing commission data
    const commissionData = await Commission.findOne({ userId, month, year });
    
    // Recalculate payroll with new finance adjustments
    const payrollData = await calculatePayrollForEmployee(user, attendanceRecord, commissionData);
    
    // Update payroll record with finance adjustments
    const payrollRecord = await Payroll.findOneAndUpdate(
      { userId, month, year },
      {
        ...payrollData,
        financeAllowances: financeAllowances || payrollData.financeAllowances,
        financeDeductions: financeDeductions || payrollData.financeDeductions,
        financeReviewedBy: req.user._id,
        financeReviewedAt: new Date(),
        status: 'finance_reviewed',
        $push: {
          auditLog: {
            changedBy: req.user._id,
            changedAt: new Date(),
            fieldName: 'Finance Adjustment',
            oldValue: null,
            newValue: 'Finance adjustment submitted',
            role: 'Finance'
          }
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: 'Finance adjustment submitted successfully',
      data: payrollRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /payroll/:userId/details → detailed payroll view
const getPayrollDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    // Get payroll record
    const payrollRecord = await Payroll.findOne({ userId, month, year })
      .populate('userId', 'username fullName role salary')
      .populate('hrSubmittedBy', 'username fullName')
      .populate('financeReviewedBy', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('lockedBy', 'username fullName');
    
    if (!payrollRecord) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    res.json(payrollRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /payroll/:id/approve → Approve payroll
const approvePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payrollRecord = await Payroll.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        $push: {
          auditLog: {
            changedBy: req.user._id,
            changedAt: new Date(),
            fieldName: 'Payroll Approval',
            oldValue: 'finance_reviewed',
            newValue: 'approved',
            role: 'Admin'
          }
        }
      },
      { new: true }
    ).populate('userId', 'username fullName role');
    
    if (!payrollRecord) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    res.json({
      success: true,
      message: 'Payroll approved successfully',
      data: payrollRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /payroll/:id/lock → Lock payroll
const lockPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payrollRecord = await Payroll.findByIdAndUpdate(
      id,
      {
        status: 'locked',
        lockedBy: req.user._id,
        lockedAt: new Date(),
        $push: {
          auditLog: {
            changedBy: req.user._id,
            changedAt: new Date(),
            fieldName: 'Payroll Lock',
            oldValue: 'approved',
            newValue: 'locked',
            role: 'Admin'
          }
        }
      },
      { new: true }
    ).populate('userId', 'username fullName role');
    
    if (!payrollRecord) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    res.json({
      success: true,
      message: 'Payroll locked successfully',
      data: payrollRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /payroll/commission/:userId → Get commission data for a user
const getCommissionByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    const commissionRecord = await Commission.findOne({ userId, month, year });
    
    if (!commissionRecord) {
      return res.status(404).json({ message: 'Commission record not found' });
    }
    
    res.json(commissionRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/commission → Submit or update commission data
const submitCommission = async (req, res) => {
  try {
    const { userId, month, year, numberOfSales, totalCommission, commissionDetails } = req.body;
    
    // Validate required fields
    if (!userId || !month || !year) {
      return res.status(400).json({ message: 'User ID, month, and year are required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Upsert commission record
    const commissionRecord = await Commission.findOneAndUpdate(
      { userId, month, year },
      {
        userId,
        month,
        year,
        numberOfSales: numberOfSales || 0,
        totalCommission: totalCommission || 0,
        commissionDetails: commissionDetails || []
      },
      { upsert: true, new: true }
    );
    
    // Get existing attendance data
    const attendanceData = await Attendance.findOne({
      userId,
      date: { $gte: new Date(`${month}-01`), $lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)) }
    });
    
    // Recalculate payroll with new commission data
    const payrollData = await calculatePayrollForEmployee(user, attendanceData, commissionRecord);
    
    // Update payroll record
    const payrollRecord = await Payroll.findOneAndUpdate(
      { userId, month, year },
      {
        ...payrollData,
        $push: {
          auditLog: {
            changedBy: req.user._id,
            changedAt: new Date(),
            fieldName: 'Commission Update',
            oldValue: null,
            newValue: 'Commission data updated',
            role: req.user.role
          }
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: 'Commission data submitted successfully',
      data: { commission: commissionRecord, payroll: payrollRecord }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /payroll/sales-data/:agentId → Get sales data for commission calculation
const getSalesDataForCommission = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { month, year } = req.query;
    
    // In a real implementation, this would fetch actual sales data
    // For now, we'll return mock data
    const mockSalesData = {
      agentId,
      month,
      year,
      sales: [],
      totalCommission: 0,
      numberOfSales: 0
    };
    
    res.json(mockSalesData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /payroll/:id — Delete a payroll entry
const deletePayrollRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const payrollRecord = await Payroll.findByIdAndDelete(id);
    if (!payrollRecord) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    res.json({
      success: true,
      message: 'Payroll record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPayrollList,
  calculatePayrollForAll,
  submitHRAdjustment,
  submitFinanceAdjustment,
  getPayrollDetails,
  approvePayroll,
  lockPayroll,
  getCommissionByUser,
  submitCommission,
  getSalesDataForCommission,
  deletePayrollRecord
};
