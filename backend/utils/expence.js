const Cost = require('../models/Cost');
const Payroll = require('../models/Payroll');

const sumField = async (Model, field, match = {}) => {
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: `$${field}` }
      }
    }
  ];

  const [result] = await Model.aggregate(pipeline);
  return Number((result?.total || 0).toFixed(2));
};

const calculateTotalCosts = () => sumField(Cost, 'amount');
const payrollFieldGroups = {
  earnings: [
    'grossSalary',
    'basicSalary',
    'overtimePay',
    'salesCommission',
    'hrAllowances',
    'financeAllowances'
  ],
  deductions: [
    'incomeTax',
    'pension',
    'lateDeduction',
    'absenceDeduction',
    'financeDeductions'
  ],
  net: ['netSalary']
};

const calculatePayrollCost = async () => {
  const totalGross = await sumField(Payroll, 'grossSalary');
  const allFields = Object.values(payrollFieldGroups).reduce((acc, fields) => acc.concat(fields), []);

  const pipeline = [
    {
      $group: {
        _id: null,
        ...allFields.reduce((acc, field) => {
          acc[field] = { $sum: `$${field}` };
          return acc;
        }, {})
      }
    }
  ];

  const [aggregated = {}] = await Payroll.aggregate(pipeline);

  const normalizeValue = (value) => Number((value || 0).toFixed(2));

  const buildGroup = (fields) => {
    return fields.reduce((acc, field) => {
      acc[field] = normalizeValue(aggregated[field]);
      return acc;
    }, {});
  };

  const types = Object.fromEntries(
    Object.entries(payrollFieldGroups).map(([groupName, fields]) => [
      groupName,
      buildGroup(fields)
    ])
  );

  return {
    total: totalGross,
    types
  };
};

const calculateCategoryBreakdown = async () => {
  const pipeline = [
    {
      $group: {
        _id: { $ifNull: ['$category', 'other'] },
        total: { $sum: '$amount' }
      }
    }
  ];

  const rows = await Cost.aggregate(pipeline);
  return rows.reduce((acc, row) => {
    const key = row._id.toLowerCase().trim();
    acc[key] = Number((row.total || 0).toFixed(2));
    return acc;
  }, {});
};

const getExpenseOverview = async () => {
  const [totalCosts, payrollCostData, breakdown] = await Promise.all([
    calculateTotalCosts(),
    calculatePayrollCost(),
    calculateCategoryBreakdown()
  ]);

  return {
    totalCosts,
    payrollCost: payrollCostData.total,
    payrollTypes: payrollCostData.types,
    breakdown
  };
};

module.exports = {
  calculateTotalCosts,
  calculatePayrollCost,
  calculateCategoryBreakdown,
  getExpenseOverview
};
