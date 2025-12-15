import React from 'react';
import FinanceLayout from './FinanceLayout';
import PayrollPage from '../../components/Payroll/PayrollPage';

const FinancePayrollPage = () => (
  <FinanceLayout>
    <PayrollPage wrapLayout={false} />
  </FinanceLayout>
);

export default FinancePayrollPage;
