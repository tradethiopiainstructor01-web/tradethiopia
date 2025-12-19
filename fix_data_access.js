const fs = require('fs');
const path = require('path');

// Path to the PayrollPage.jsx file
const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'Payroll', 'PayrollPage.jsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix the data access patterns to handle different possible structures
// We need to be careful with the backticks in JSX
const patterns = [
  {
    old: '{formatCurrency(entry.payrollData?.grossSalary || entry.payrollData?.basicSalary || 0)}',
    new: '{formatCurrency(entry.payrollData?.grossSalary || entry.payrollData?.basicSalary || entry.grossSalary || entry.basicSalary || 0)}'
  },
  {
    old: '{formatCurrency(entry.payrollData?.netSalary || 0)}',
    new: '{formatCurrency(entry.payrollData?.netSalary || entry.netSalary || 0)}'
  },
  {
    old: '{formatCurrency(entry.commissionData?.grossCommission || 0)}',
    new: '{formatCurrency(entry.commissionData?.grossCommission || entry.grossCommission || 0)}'
  },
  {
    old: '{formatCurrency(entry.commissionData?.commissionTax || 0)}',
    new: '{formatCurrency(entry.commissionData?.commissionTax || entry.commissionTax || 0)}'
  },
  {
    old: '{formatCurrency(entry.commissionData?.netCommission || 0)}',
    new: '{formatCurrency(entry.commissionData?.netCommission || entry.netCommission || 0)}'
  }
];

// Apply the replacements
patterns.forEach(({ old, new: newPattern }) => {
  content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPattern);
});

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Data access patterns fixed successfully!');