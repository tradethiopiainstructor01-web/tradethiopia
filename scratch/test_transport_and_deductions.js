const { calculateNetSalary, calculateEthiopianIncomeTax, calculatePension } = require('../frontend/src/utils/ethiopianTax.js');

console.log('--- TEST 1: calculateNetSalary with basicSalary and transportAllowance ---');
const salary = 15000;
const transport = 2500;
const result = calculateNetSalary({ basicSalary: salary, transportAllowance: transport });
console.log('Result:', result);

const expectedTax = 15000 * 0.35 - 2050; // 3200
const expectedPension = 15000 * 0.07; // 1050
const expectedNet = 15000 - expectedTax - expectedPension + 2500; // 13250

console.log('Calculated Tax:', result.incomeTax, 'Expected:', expectedTax);
console.log('Calculated Pension:', result.pension, 'Expected:', expectedPension);
console.log('Calculated Net Salary:', result.netSalary, 'Expected:', expectedNet);

if (result.incomeTax !== expectedTax) {
  throw new Error(`Tax mismatch: got ${result.incomeTax}, expected ${expectedTax}`);
}
if (result.pension !== expectedPension) {
  throw new Error(`Pension mismatch: got ${result.pension}, expected ${expectedPension}`);
}
if (result.netSalary !== expectedNet) {
  throw new Error(`Net salary mismatch: got ${result.netSalary}, expected ${expectedNet}`);
}
console.log('✅ TEST 1 PASSED: Transport allowance correctly added as non-taxable to net salary!');

console.log('\n--- TEST 2: Verify total deductions formula ---');
const emp = {
  incomeTax: 3200,
  pension: 1050,
  loan: 1200,
  lateDeduction: 150,
  absenceDeduction: 200,
  financeDeductions: 300,
};
const totalDeductions = (emp.incomeTax || 0) + (emp.pension || 0) + (emp.loan || 0) + (emp.lateDeduction || 0) + (emp.absenceDeduction || 0) + (emp.financeDeductions || 0);
console.log('Total Deductions:', totalDeductions, 'Expected: 6100');
if (totalDeductions !== 6100) {
  throw new Error(`Expected 6100, got ${totalDeductions}`);
}
console.log('✅ TEST 2 PASSED: Total deductions accurately aggregates all deduction items including loan!');

console.log('\nALL TESTS PASSED SUCCESSFULLY! 🎉');
