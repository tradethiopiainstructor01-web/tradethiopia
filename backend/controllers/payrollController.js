const Payroll = require('../models/Payroll');
const User = require('../models/user.model');
const Attendance = require('../models/Attendance');
const Commission = require('../models/Commission');
const SalesCustomer = require('../models/SalesCustomer');

// Helper function to calculate payroll
const calculatePayroll = async (userId, month, year) => {
  try {
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Initialize payroll components
    const payrollData = {
      userId: user._id,
      employeeName: user.fullName || user.username,
      department: user.role,
      month,
      year,
      basicSalary: user.salary || 0,
      age: user.age || 0,
      ageAdjustment: 0, // Placeholder for age-based adjustments
      // Attendance defaults
      overtimeHours: 0,
      overtimeRate: 0, // Will be configurable
      overtimePay: 0,
      lateMinutes: 0,
      lateRate: 0, // Will be configurable
      lateDeduction: 0,
      absenceDays: 0,
      dailyRate: 0, // Will be calculated
      absenceDeduction: 0,
      // Sales defaults
      numberOfSales: 0,
      salesCommission: 0,
      // Allowances
      hrAllowances: 0,
      financeAllowances: 0,
      // Deductions
      financeDeductions: 0,
      // Final salary
      finalSalary: 0
    };

    // Get attendance data for the month
    const attendanceRecords = await Attendance.find({
      userId: user._id,
      month,
      year
    });

    // Calculate attendance adjustments
    if (attendanceRecords.length > 0) {
      payrollData.overtimeHours = attendanceRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
      payrollData.lateMinutes = attendanceRecords.reduce((sum, record) => sum + (record.lateMinutes || 0), 0);
      payrollData.absenceDays = attendanceRecords.filter(record => record.absence).length;
      
      // Calculate daily rate (basic salary / 30 days as approximation)
      payrollData.dailyRate = (payrollData.basicSalary / 30);
      
      // Calculate adjustments (these rates should be configurable)
      payrollData.overtimeRate = 20; // $20 per hour default
      payrollData.lateRate = 1; // $1 per minute default
      
      payrollData.overtimePay = payrollData.overtimeHours * payrollData.overtimeRate;
      payrollData.lateDeduction = payrollData.lateMinutes * payrollData.lateRate;
      payrollData.absenceDeduction = payrollData.absenceDays * payrollData.dailyRate;
    }

    // Get commission data for the month
    const commissionRecord = await Commission.findOne({
      userId: user._id,
      month,
      year
    });

    if (commissionRecord) {
      payrollData.numberOfSales = commissionRecord.numberOfSales || 0;
      payrollData.salesCommission = commissionRecord.totalCommission || 0;
    } else if (user.role === 'sales') {
      // For sales employees, calculate commission from SalesCustomer records if no commission record exists
      const salesRecords = await SalesCustomer.find({
        agentId: user._id,
        followupStatus: 'Completed',
        createdAt: {
          $gte: new Date(year, month.split('-')[1] - 1, 1),
          $lt: new Date(year, month.split('-')[1], 1)
        }
      });

      // Calculate commission based on sales
      let totalCommission = 0;
      let numberOfSales = salesRecords.length;

      salesRecords.forEach(sale => {
        // Calculate commission based on course price (10% default)
        const coursePrice = sale.coursePrice || 0;
        const commissionAmount = coursePrice * 0.10; // 10% commission
        totalCommission += commissionAmount;
      });

      payrollData.numberOfSales = numberOfSales;
      payrollData.salesCommission = totalCommission;
    }

    // Calculate final salary
    payrollData.finalSalary = 
      payrollData.basicSalary +
      payrollData.ageAdjustment +
      payrollData.overtimePay +
      payrollData.hrAllowances +
      payrollData.financeAllowances +
      payrollData.salesCommission -
      payrollData.lateDeduction -
      payrollData.absenceDeduction -
      payrollData.financeDeductions;

    return payrollData;
  } catch (error) {
    throw new Error(`Error calculating payroll: ${error.message}`);
  }
};

// GET /payroll/:month → full payroll list
const getPayrollList = async (req, res) => {
  try {
    const { month } = req.params;
    const { year, department, role, salesOnly } = req.query;
    
    // Build query
    const query = { month };
    if (year) query.year = parseInt(year);
    if (department) query.department = department;
    if (role) query['employeeName'] = new RegExp(role, 'i');
    if (salesOnly === 'true') query.department = 'sales';
    
    const payrollRecords = await Payroll.find(query)
      .populate('userId', 'username fullName role')
      .populate('hrSubmittedBy', 'username fullName')
      .populate('financeReviewedBy', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('lockedBy', 'username fullName')
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
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    // Get all users
    const users = await User.find({});
    
    const payrollResults = [];
    
    // Calculate payroll for each user
    for (const user of users) {
      try {
        const payrollData = await calculatePayroll(user._id, month, year);
        
        // Check if payroll record already exists
        const existingRecord = await Payroll.findOne({
          userId: user._id,
          month,
          year
        });
        
        if (existingRecord) {
          // Update existing record
          const updatedRecord = await Payroll.findByIdAndUpdate(
            existingRecord._id,
            payrollData,
            { new: true }
          );
          payrollResults.push(updatedRecord);
        } else {
          // Create new record
          const newRecord = new Payroll(payrollData);
          await newRecord.save();
          payrollResults.push(newRecord);
        }
      } catch (userError) {
        console.error(`Error calculating payroll for user ${user._id}:`, userError.message);
        // Continue with other users
      }
    }
    
    res.json({
      message: `Payroll calculated for ${payrollResults.length} employees`,
      results: payrollResults
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/hr-adjust → HR attendance submission
const submitHRAdjustment = async (req, res) => {
  try {
    const { userId, date, overtimeHours, lateMinutes, absence } = req.body;
    const { month, year } = req.body;
    
    if (!userId || !date || !month || !year) {
      return res.status(400).json({ message: 'User ID, date, month, and year are required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create or update attendance record
    const attendanceData = {
      userId: user._id,
      employeeName: user.fullName || user.username,
      department: user.role,
      date: new Date(date),
      month,
      year,
      overtimeHours: overtimeHours || 0,
      lateMinutes: lateMinutes || 0,
      absence: absence || false,
      submittedBy: req.user._id, // From auth middleware
      role: 'HR'
    };
    
    // Check if record already exists
    const existingRecord = await Attendance.findOne({
      userId: user._id,
      date: new Date(date)
    });
    
    let attendanceRecord;
    if (existingRecord) {
      attendanceRecord = await Attendance.findByIdAndUpdate(
        existingRecord._id,
        attendanceData,
        { new: true }
      );
    } else {
      attendanceRecord = new Attendance(attendanceData);
      await attendanceRecord.save();
    }
    
    // If this is for the current payroll period, update payroll
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const payrollMonth = `${year}-${month.padStart(2, '0')}`;
    
    if (currentMonth === payrollMonth) {
      // Recalculate payroll for this user
      const payrollData = await calculatePayroll(user._id, month, year);
      
      await Payroll.findOneAndUpdate(
        { userId: user._id, month, year },
        payrollData,
        { upsert: true, new: true }
      );
    }
    
    res.json({
      message: 'HR adjustment submitted successfully',
      attendance: attendanceRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/finance-adjust → Finance allowances & deductions
const submitFinanceAdjustment = async (req, res) => {
  try {
    const { userId, month, year, financeAllowances, financeDeductions, hrAllowances } = req.body;
    
    if (!userId || !month || !year) {
      return res.status(400).json({ message: 'User ID, month, and year are required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find or create payroll record
    let payrollRecord = await Payroll.findOne({ userId, month, year });
    
    if (!payrollRecord) {
      // Calculate initial payroll if not exists
      const payrollData = await calculatePayroll(userId, month, year);
      payrollRecord = new Payroll(payrollData);
    }
    
    // Update finance adjustments
    if (financeAllowances !== undefined) {
      payrollRecord.financeAllowances = financeAllowances;
    }
    
    if (financeDeductions !== undefined) {
      payrollRecord.financeDeductions = financeDeductions;
    }
    
    if (hrAllowances !== undefined) {
      payrollRecord.hrAllowances = hrAllowances;
    }
    
    // Add to audit log
    payrollRecord.auditLog.push({
      changedBy: req.user._id,
      fieldName: 'Finance Adjustment',
      oldValue: {},
      newValue: { financeAllowances, financeDeductions, hrAllowances },
      role: 'Finance'
    });
    
    // Update status
    payrollRecord.status = 'finance_reviewed';
    payrollRecord.financeReviewedBy = req.user._id;
    payrollRecord.financeReviewedAt = new Date();
    
    // Recalculate final salary
    payrollRecord.finalSalary = 
      payrollRecord.basicSalary +
      payrollRecord.ageAdjustment +
      payrollRecord.overtimePay +
      payrollRecord.hrAllowances +
      payrollRecord.financeAllowances +
      payrollRecord.salesCommission -
      payrollRecord.lateDeduction -
      payrollRecord.absenceDeduction -
      payrollRecord.financeDeductions;
    
    await payrollRecord.save();
    
    res.json({
      message: 'Finance adjustment submitted successfully',
      payroll: payrollRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /payroll/commission → Submit or update commission data
const submitCommission = async (req, res) => {
  try {
    const { userId, month, year, numberOfSales, totalCommission, commissionDetails } = req.body;
    
    if (!userId || !month || !year) {
      return res.status(400).json({ message: 'User ID, month, and year are required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create or update commission record
    const commissionData = {
      userId: user._id,
      employeeName: user.fullName || user.username,
      department: user.role,
      month,
      year,
      numberOfSales: numberOfSales || 0,
      totalCommission: totalCommission || 0,
      commissionDetails: commissionDetails || [],
      submittedBy: req.user._id
    };
    
    // Check if record already exists
    const existingRecord = await Commission.findOne({ userId, month, year });
    
    let commissionRecord;
    if (existingRecord) {
      commissionRecord = await Commission.findByIdAndUpdate(
        existingRecord._id,
        commissionData,
        { new: true }
      );
    } else {
      commissionRecord = new Commission(commissionData);
      await commissionRecord.save();
    }
    
    // If this is for the current payroll period, update payroll
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const payrollMonth = month;
    
    if (currentMonth === payrollMonth) {
      // Recalculate payroll for this user
      const payrollData = await calculatePayroll(user._id, month, year);
      
      await Payroll.findOneAndUpdate(
        { userId: user._id, month, year },
        payrollData,
        { upsert: true, new: true }
      );
    }
    
    res.json({
      message: 'Commission submitted successfully',
      commission: commissionRecord
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
    
    // Get attendance records for the month
    const attendanceRecords = await Attendance.find({
      userId,
      month,
      year
    });
    
    // Get commission record for the month
    const commissionRecord = await Commission.findOne({
      userId,
      month,
      year
    });
    
    res.json({
      payroll: payrollRecord,
      attendance: attendanceRecords,
      commission: commissionRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /payroll/:id/approve → Approve payroll
const approvePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payrollRecord = await Payroll.findById(id);
    if (!payrollRecord) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    // Update status
    payrollRecord.status = 'approved';
    payrollRecord.approvedBy = req.user._id;
    payrollRecord.approvedAt = new Date();
    
    // Add to audit log
    payrollRecord.auditLog.push({
      changedBy: req.user._id,
      fieldName: 'Status',
      oldValue: payrollRecord.status,
      newValue: 'approved',
      role: 'Admin'
    });
    
    await payrollRecord.save();
    
    res.json({
      message: 'Payroll approved successfully',
      payroll: payrollRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /payroll/:id/lock → Lock payroll
const lockPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payrollRecord = await Payroll.findById(id);
    if (!payrollRecord) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    // Update status
    payrollRecord.status = 'locked';
    payrollRecord.lockedBy = req.user._id;
    payrollRecord.lockedAt = new Date();
    
    // Add to audit log
    payrollRecord.auditLog.push({
      changedBy: req.user._id,
      fieldName: 'Status',
      oldValue: payrollRecord.status,
      newValue: 'locked',
      role: 'Admin'
    });
    
    await payrollRecord.save();
    
    res.json({
      message: 'Payroll locked successfully',
      payroll: payrollRecord
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
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    // Get sales for this agent
    const sales = await SalesCustomer.find({
      agentId: agentId,
      followupStatus: 'Completed',
      date: {
        $gte: new Date(year, month.split('-')[1] - 1, 1),
        $lte: new Date(year, month.split('-')[1], 0)
      }
    }).sort({ date: -1 });
    
    res.json(sales);
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
  submitCommission,
  getCommissionByUser,
  getSalesDataForCommission
};