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
const calculatePayrollCost = () => sumField(Payroll, 'netSalary');

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
  const [totalCosts, payrollCost, breakdown] = await Promise.all([
    calculateTotalCosts(),
    calculatePayrollCost(),
    calculateCategoryBreakdown()
  ]);

  return {
    totalCosts,
    payrollCost,
    breakdown
  };
};

module.exports = {
  calculateTotalCosts,
  calculatePayrollCost,
  calculateCategoryBreakdown,
  getExpenseOverview
};
