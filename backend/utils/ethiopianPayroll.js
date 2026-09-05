/**
 * Ethiopian Payroll & Labor Regulation Utility
 * 
 * In strict compliance with:
 * - Ethiopian Employment Income Tax Proclamation (Schedule A Progressive Rates)
 * - Private Organization Employees' Pension Proclamation (7% Employee, 11% Employer)
 * - Ethiopian Labour Proclamation No. 1156/2019 (Overtime, standard 30-day work month, 8-hour workday)
 */

const TAX_BRACKETS = [
  { min: 0, max: 2000, rate: 0.00, deduction: 0, label: '0 – 2,000 ETB (Exempt)' },
  { min: 2001, max: 4000, rate: 0.15, deduction: 300, label: '2,001 – 4,000 ETB (15%)' },
  { min: 4001, max: 7000, rate: 0.20, deduction: 500, label: '4,001 – 7,000 ETB (20%)' },
  { min: 7001, max: 10000, rate: 0.25, deduction: 850, label: '7,001 – 10,000 ETB (25%)' },
  { min: 10001, max: 14000, rate: 0.30, deduction: 1350, label: '10,001 – 14,000 ETB (30%)' },
  { min: 14001, max: Infinity, rate: 0.35, deduction: 2050, label: 'Over 14,000 ETB (35%)' }
];

/**
 * Calculate Ethiopian Employment Income Tax (Schedule A)
 * @param {number} grossSalary - Total taxable gross salary in ETB
 * @returns {number} Income tax payable in ETB
 */
const calculateEthiopianIncomeTax = (grossSalary) => {
  const gross = Math.max(0, Number(grossSalary) || 0);
  if (gross <= 2000) {
    return 0;
  } else if (gross <= 4000) {
    return Math.max(0, gross * 0.15 - 300);
  } else if (gross <= 7000) {
    return Math.max(0, gross * 0.20 - 500);
  } else if (gross <= 10000) {
    return Math.max(0, gross * 0.25 - 850);
  } else if (gross <= 14000) {
    return Math.max(0, gross * 0.30 - 1350);
  } else {
    return Math.max(0, gross * 0.35 - 2050);
  }
};

/**
 * Calculate Employee Pension Contribution (7% of Basic Salary)
 * Mandatory deduction under Private Org. Employees Pension Proclamation
 * @param {number} basicSalary - Monthly basic salary in ETB
 * @returns {number} 7% pension deduction
 */
const calculatePension = (basicSalary) => {
  const basic = Math.max(0, Number(basicSalary) || 0);
  return Number((basic * 0.07).toFixed(4));
};

/**
 * Calculate Employer Pension Contribution (11% of Basic Salary)
 * Company liability contributed directly to the Social Security Agency
 * @param {number} basicSalary - Monthly basic salary in ETB
 * @returns {number} 11% employer pension
 */
const calculateEmployerPension = (basicSalary) => {
  const basic = Math.max(0, Number(basicSalary) || 0);
  return Number((basic * 0.11).toFixed(4));
};

/**
 * Calculate Hourly Wage based on Ethiopian Labor standard (30 days/month, 8 hours/day)
 * @param {number} monthlySalary 
 * @returns {number} Hourly wage in ETB
 */
const calculateHourlyWage = (monthlySalary) => {
  const salary = Math.max(0, Number(monthlySalary) || 0);
  if (salary === 0) return 0;
  return (salary / 30) / 8;
};

/**
 * Calculate Overtime Pay under Ethiopian Labour Proclamation No. 1156/2019
 * - Daytime (06:00 - 22:00): 1.5x hourly wage
 * - Nighttime (22:00 - 06:00): 1.75x hourly wage
 * - Rest Day (Weekly rest): 2.0x hourly wage
 * - Public Holiday: 2.5x hourly wage
 */
const calculateOvertimePay = (hourlyWage, overtimeData = {}) => {
  const rate = Math.max(0, Number(hourlyWage) || 0);
  if (rate === 0 || !overtimeData) return 0;

  let totalPay = 0;
  if (overtimeData.daytimeOvertimeHours) {
    totalPay += Number(overtimeData.daytimeOvertimeHours) * rate * 1.5;
  }
  if (overtimeData.nightOvertimeHours) {
    totalPay += Number(overtimeData.nightOvertimeHours) * rate * 1.75;
  }
  if (overtimeData.restDayOvertimeHours) {
    totalPay += Number(overtimeData.restDayOvertimeHours) * rate * 2.0;
  }
  if (overtimeData.holidayOvertimeHours) {
    totalPay += Number(overtimeData.holidayOvertimeHours) * rate * 2.5;
  }
  return Number(totalPay.toFixed(2));
};

/**
 * Calculate Late Deduction (300 ETB per late day)
 */
const calculateLateDeduction = (lateDays) => {
  return Math.max(0, Number(lateDays) || 0) * 300;
};

/**
 * Calculate Absence Deduction
 */
const calculateAbsenceDeduction = (absenceDays, manualDeduction) => {
  if (manualDeduction !== undefined && manualDeduction !== null) {
    return Math.max(0, Number(manualDeduction) || 0);
  }
  return Math.max(0, Number(absenceDays) || 0) * 300;
};

module.exports = {
  TAX_BRACKETS,
  calculateEthiopianIncomeTax,
  calculatePension,
  calculateEmployerPension,
  calculateHourlyWage,
  calculateOvertimePay,
  calculateLateDeduction,
  calculateAbsenceDeduction
};
