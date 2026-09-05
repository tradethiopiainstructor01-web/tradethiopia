/**
 * Ethiopian Tax & Pension Regulation Calculations (Frontend Utility)
 * 
 * Strict compliance with Ethiopian Labor & Tax Law:
 * - Employment Income Tax Proclamation (Schedule A Progressive Rates)
 * - Private Organizations Employees' Pension Proclamation (7% Employee, 11% Employer)
 */

export const TAX_BRACKETS = [
  { min: 0, max: 2000, rate: 0.00, deduction: 0, label: '0 – 2,000 ETB (Exempt)' },
  { min: 2001, max: 4000, rate: 0.15, deduction: 300, label: '2,001 – 4,000 ETB (15%)' },
  { min: 4001, max: 7000, rate: 0.20, deduction: 500, label: '4,001 – 7,000 ETB (20%)' },
  { min: 7001, max: 10000, rate: 0.25, deduction: 850, label: '7,001 – 10,000 ETB (25%)' },
  { min: 10001, max: 14000, rate: 0.30, deduction: 1350, label: '10,001 – 14,000 ETB (30%)' },
  { min: 14001, max: Infinity, rate: 0.35, deduction: 2050, label: 'Over 14,000 ETB (35%)' }
];

export const calculateEthiopianIncomeTax = (grossSalary) => {
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

export const calculatePension = (basicSalary) => {
  const basic = Math.max(0, Number(basicSalary) || 0);
  return Number((basic * 0.07).toFixed(2));
};

export const calculateEmployerPension = (basicSalary) => {
  const basic = Math.max(0, Number(basicSalary) || 0);
  return Number((basic * 0.11).toFixed(2));
};

export const calculateNetSalary = ({ basicSalary = 0, grossSalary = null, transportAllowance = 0, otherDeductions = 0 }) => {
  const basic = Math.max(0, Number(basicSalary) || 0);
  const gross = grossSalary !== null ? Math.max(0, Number(grossSalary) || 0) : basic;
  const incomeTax = calculateEthiopianIncomeTax(gross);
  const pension = calculatePension(basic);
  const employerPension = calculateEmployerPension(basic);
  const transport = Math.max(0, Number(transportAllowance) || 0);
  const deductions = Math.max(0, Number(otherDeductions) || 0);

  const netSalary = Math.max(0, gross - incomeTax - pension - deductions + transport);
  const totalEmployerCost = gross + employerPension + transport;

  return {
    basicSalary: basic,
    grossSalary: gross,
    incomeTax,
    pension,
    employerPension,
    transportAllowance: transport,
    netSalary,
    totalEmployerCost
  };
};

export const formatETB = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num) + ' ETB';
};
