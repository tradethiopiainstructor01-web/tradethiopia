import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Flex,
  Select,
  Text,
  Card,
  CardBody,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Stack,
  Badge,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import FinanceLayout from './FinanceLayout';
import FinancePayrollTable from '../../components/finance/FinancePayrollTable';
import {
  fetchPayrollData,
  submitFinanceAdjustment,
  deletePayrollRecord,
  approvePayroll
} from '../../services/payrollService';
import { DownloadIcon } from '@chakra-ui/icons';

const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB'
  }).format(number);
};

const monthNumberOptions = Array.from({ length: 12 }, (_, index) => String(index + 1));

const getMonthNumberFromIso = (isoMonth) => {
  if (!isoMonth) return '';
  const date = new Date(`${isoMonth}-01`);
  if (Number.isNaN(date.getTime())) return '';
  return String(date.getMonth() + 1);
};

const extractMonthNumber = (monthString) => {
  if (!monthString) return '';
  const parts = monthString.split('-');
  if (parts.length < 2) return '';
  return String(Number(parts[1]));
};

const FinancePayrollPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payrollData, setPayrollData] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    employeeId: '',
    financeAllowances: '',
    financeDeductions: ''
  });
  const [editForm, setEditForm] = useState({
    employeeId: '',
    financeAllowances: '',
    financeDeductions: ''
  });
  const [deleteSelection, setDeleteSelection] = useState('');
  const [editTargetId, setEditTargetId] = useState('');
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [paidList, setPaidList] = useState([]);
  const [approvedMonthFilter, setApprovedMonthFilter] = useState(
    getMonthNumberFromIso(selectedMonth)
  );
  const [approvedYearFilter, setApprovedYearFilter] = useState(String(selectedYear));
  const [approvedNameFilter, setApprovedNameFilter] = useState('');
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileRecord, setProfileRecord] = useState(null);
  const toast = useToast();

  const loadPayroll = useCallback(async () => {
    setTableLoading(true);
    try {
      const data = await fetchPayrollData(selectedMonth, { year: selectedYear });
      const records = Array.isArray(data) ? data : [];
      const pending = records.filter((record) => record.status !== 'approved');
      const approved = records.filter((record) => record.status === 'approved');
      setPayrollData(pending);
      setPaidList(approved);
      setTableError('');
    } catch (err) {
      console.error('Failed to load payroll data:', err);
      setTableError('Unable to load payroll records');
    } finally {
      setTableLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  useEffect(() => {
    setApprovedMonthFilter(getMonthNumberFromIso(selectedMonth));
    setApprovedYearFilter(String(selectedYear));
  }, [selectedMonth, selectedYear]);

  const monthOptions = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
      return {
        value: date.toISOString().slice(0, 7),
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
    });
  }, []);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => currentYear - index);
  }, []);

  const payrollOptions = useMemo(
    () =>
      payrollData.map((record) => ({
        label: record.employeeName || record.userId?.fullName || 'Employee',
        payrollId: record._id,
        userId: record.userId?._id || record.userId,
        financeAllowances: record.financeAllowances || 0,
        financeDeductions: record.financeDeductions || 0
      })),
    [payrollData]
  );

  const payrollMapByUser = useMemo(
    () =>
      payrollOptions.reduce((acc, record) => {
        if (record.userId) {
          acc[record.userId] = record;
        }
        return acc;
      }, {}),
    [payrollOptions]
  );

  const filteredPaidList = useMemo(() => {
    const searchTerm = approvedNameFilter.trim().toLowerCase();
    return paidList.filter((record) => {
      const recordMonthNumber = extractMonthNumber(record.month);
      const matchesMonth =
        !approvedMonthFilter || recordMonthNumber === approvedMonthFilter;
      const matchesYear =
        !approvedYearFilter || Number(record.year) === Number(approvedYearFilter);
      const employeeName = (record.employeeName || record.userId?.fullName || '').toLowerCase();
      const matchesName = !searchTerm || employeeName.includes(searchTerm);
      return matchesMonth && matchesYear && matchesName;
    });
  }, [approvedMonthFilter, approvedNameFilter, approvedYearFilter, paidList]);

  const resetAddForm = () => {
    setAddForm({ employeeId: '', financeAllowances: '', financeDeductions: '' });
  };

  const resetEditForm = () => {
    setEditForm({ employeeId: '', financeAllowances: '', financeDeductions: '' });
    setEditTargetId('');
  };

  const handleAddSubmit = async () => {
    if (!addForm.employeeId) {
      toast({ title: 'Select employee', status: 'warning', duration: 2500, isClosable: true });
      return;
    }

    setTaskLoading(true);
    try {
      await submitFinanceAdjustment({
        userId: addForm.employeeId,
        month: selectedMonth,
        year: selectedYear,
        financeAllowances: Number(addForm.financeAllowances || 0),
        financeDeductions: Number(addForm.financeDeductions || 0)
      });
      toast({ title: 'Payroll entry updated', status: 'success', duration: 2500, isClosable: true });
      setIsAddOpen(false);
      resetAddForm();
      loadPayroll();
    } catch (err) {
      console.error('Failed to add payroll entry:', err);
      toast({ title: 'Update failed', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setTaskLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editForm.employeeId) {
      toast({ title: 'Choose an employee', status: 'warning', duration: 2500, isClosable: true });
      return;
    }

    setTaskLoading(true);
    try {
      await submitFinanceAdjustment({
        userId: editForm.employeeId,
        month: selectedMonth,
        year: selectedYear,
        financeAllowances: Number(editForm.financeAllowances || 0),
        financeDeductions: Number(editForm.financeDeductions || 0)
      });
      toast({ title: 'Payroll entry saved', status: 'success', duration: 2500, isClosable: true });
      setIsEditOpen(false);
      resetEditForm();
      loadPayroll();
    } catch (err) {
      console.error('Failed to edit payroll entry:', err);
      toast({ title: 'Edit failed', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setTaskLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteSelection) {
      toast({ title: 'Select a record to delete', status: 'warning', duration: 2500, isClosable: true });
      return;
    }

    setTaskLoading(true);
    try {
      await deletePayrollRecord(deleteSelection);
      toast({ title: 'Payroll entry deleted', status: 'success', duration: 2500, isClosable: true });
      setIsDeleteOpen(false);
      setDeleteSelection('');
      loadPayroll();
    } catch (err) {
      console.error('Failed to delete payroll entry:', err);
      toast({ title: 'Delete failed', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setTaskLoading(false);
    }
  };

  const handleEditSelect = (userId) => {
    setEditForm((prev) => ({
      ...prev,
      employeeId: userId,
      financeAllowances: payrollMapByUser[userId]?.financeAllowances || '',
      financeDeductions: payrollMapByUser[userId]?.financeDeductions || ''
    }));
    setEditTargetId(payrollMapByUser[userId]?.payrollId || '');
  };

  const handleDeleteSelect = (payrollId) => {
    setDeleteSelection(payrollId);
    const found = payrollOptions.find((record) => record.payrollId === payrollId);
    setDeleteTargetName(found?.label || '');
  };

  const openEditFromRow = (record) => {
    const userId = record.userId?._id || record.userId;
    handleEditSelect(userId);
    setIsEditOpen(true);
  };

  const openDeleteFromRow = (record) => {
    handleDeleteSelect(record._id);
    setIsDeleteOpen(true);
  };

  const openProfileFromRow = (record) => {
    setProfileRecord(record);
    setIsProfileOpen(true);
  };

  const openApproveFromRow = (record) => {
    setApproveTarget(record);
    setIsApproveOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    setTaskLoading(true);

    try {
      await approvePayroll(approveTarget._id);
      toast({
        title: 'Payroll approved',
        description: `${approveTarget.employeeName || 'Employee'} marked as paid.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      await loadPayroll();
      setIsApproveOpen(false);
      setApproveTarget(null);
    } catch (err) {
      console.error('Failed to approve payroll entry:', err);
      toast({ title: 'Approval failed', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setTaskLoading(false);
    }
  };

  const csvEscape = (value) => {
    const str = value != null ? String(value) : '';
    return `"${str.replace(/"/g, '""')}"`;
  };

  const handleExportPaidList = () => {
    const recordsToExport = filteredPaidList.length ? filteredPaidList : paidList;
    if (recordsToExport.length === 0) return;

    const periodMonth = approvedMonthFilter || getMonthNumberFromIso(selectedMonth);
    const periodYear = approvedYearFilter || String(selectedYear);

    const headers = [
      'Employee',
      'Department',
      'Status',
      'Month',
      'Year',
      'Gross Salary',
      'Income Tax',
      'Pension',
      'Commission',
      'Finance Allowances',
      'Finance Deductions',
      'Net Salary'
    ];

    const rows = recordsToExport.map((record) => [
      csvEscape(record.employeeName || record.userId?.fullName),
      csvEscape(record.department),
      csvEscape(record.status),
      csvEscape(record.month),
      csvEscape(record.year),
      csvEscape(record.grossSalary || record.basicSalary),
      csvEscape(record.incomeTax),
      csvEscape(record.pension),
      csvEscape(record.salesCommission),
      csvEscape(record.financeAllowances),
      csvEscape(record.financeDeductions),
      csvEscape(record.netSalary || record.finalSalary)
    ]);

    const csvContent = [headers.map(csvEscape).join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `paid-payroll-${periodMonth}-${periodYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openAddModal = () => {
    resetAddForm();
    setIsAddOpen(true);
  };

  return (
    <FinanceLayout>
      <Box>
        <Heading size="lg" mb={4}>
          Payroll
        </Heading>
        <Flex wrap="wrap" gap={4} mb={6} align="center">
          <Box>
            <Text fontSize="sm" mb={1} fontWeight="semibold">
              Month
            </Text>
            <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} size="sm" maxW="220px">
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Box>

          <Box>
            <Text fontSize="sm" mb={1} fontWeight="semibold">
              Year
            </Text>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              size="sm"
              maxW="160px"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </Box>
        </Flex>

        <Card mb={6}>
          <CardBody>
            <Heading size="md" mb={2}>
              Finance Tasks
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Add, edit, or delete payroll entries directly from the finance workspace.
            </Text>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={3} mt={4}>
              <Button size="sm" colorScheme="teal" onClick={openAddModal}>
                Add payroll entry
              </Button>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => setIsEditOpen(true)}
                isDisabled={payrollOptions.length === 0}
              >
                Edit payroll entry
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                onClick={() => setIsDeleteOpen(true)}
                isDisabled={payrollOptions.length === 0}
              >
                Delete payroll entry
              </Button>
            </Stack>
          </CardBody>
        </Card>

        <FinancePayrollTable
          data={payrollData}
          loading={tableLoading}
          error={tableError}
          month={selectedMonth}
          year={selectedYear}
          onRefresh={loadPayroll}
          onEditRow={openEditFromRow}
          onDeleteRow={openDeleteFromRow}
          onViewProfile={openProfileFromRow}
          onApproveRow={openApproveFromRow}
        />

        {paidList.length > 0 && (
          <Card mt={6}>
            <CardBody>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={3} mb={3}>
                <Heading size="md">Paid this month</Heading>
                <Button
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<DownloadIcon />}
                  onClick={handleExportPaidList}
                >
                  Export Paid List
                </Button>
              </Flex>

              <Flex wrap="wrap" gap={4} mb={4} align="flex-end">
                <Box minW="160px">
                  <Text fontSize="xs" mb={1} fontWeight="semibold">
                    Filter month
                  </Text>
                  <Select
                    size="sm"
                    value={approvedMonthFilter}
                    onChange={(event) => setApprovedMonthFilter(event.target.value)}
                  >
                    <option value="">All months</option>
                    {monthNumberOptions.map((monthNumber) => (
                      <option key={monthNumber} value={monthNumber}>
                        {monthNumber}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box minW="120px">
                  <Text fontSize="xs" mb={1} fontWeight="semibold">
                    Filter year
                  </Text>
                  <Select
                    size="sm"
                    value={approvedYearFilter}
                    onChange={(event) => setApprovedYearFilter(event.target.value)}
                  >
                    <option value="">All years</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box flexGrow={1} minW="200px">
                  <Text fontSize="xs" mb={1} fontWeight="semibold">
                    Search by name
                  </Text>
                  <Input
                    size="sm"
                    placeholder="Employee name"
                    value={approvedNameFilter}
                    onChange={(event) => setApprovedNameFilter(event.target.value)}
                  />
                </Box>
              </Flex>

              {filteredPaidList.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={6}>
                  No approved payroll records match the current filters.
                </Text>
              ) : (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Employee</Th>
                      <Th>Dept.</Th>
                      <Th>Gross</Th>
                      <Th>Income Tax</Th>
                      <Th>Pension</Th>
                      <Th>Commission</Th>
                      <Th>Allowances</Th>
                      <Th>Deductions</Th>
                      <Th>Net</Th>
                      <Th>Status</Th>
                      <Th>Month</Th>
                      <Th>Year</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredPaidList.map((record) => (
                      <Tr key={record._id}>
                        <Td>
                          <Text fontWeight="semibold">
                            {record.employeeName || record.userId?.fullName || 'Employee'}
                          </Text>
                        </Td>
                        <Td>{record.department || 'General'}</Td>
                        <Td>{formatCurrency(record.grossSalary || record.basicSalary)}</Td>
                        <Td>{formatCurrency(record.incomeTax)}</Td>
                        <Td>{formatCurrency(record.pension)}</Td>
                        <Td>{formatCurrency(record.salesCommission)}</Td>
                        <Td>{formatCurrency(record.financeAllowances)}</Td>
                        <Td>{formatCurrency(record.financeDeductions)}</Td>
                        <Td fontWeight="bold" color="teal.500">
                          {formatCurrency(record.netSalary || record.finalSalary)}
                        </Td>
                        <Td>
                          <Badge colorScheme="green">Paid</Badge>
                        </Td>
                        <Td>{record.month}</Td>
                        <Td>{record.year}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        )}

        {/* Add Modal */}
        <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); resetAddForm(); }} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add payroll changes</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={3}>
                <FormLabel>Employee</FormLabel>
                <Select
                  placeholder="Select employee"
                  value={addForm.employeeId}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                  size="sm"
                >
                  {payrollOptions.map((option) => (
                    <option key={option.payrollId} value={option.userId}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl mb={3}>
                <FormLabel>Finance Allowances</FormLabel>
                <Input
                  type="number"
                  size="sm"
                  value={addForm.financeAllowances}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, financeAllowances: e.target.value }))}
                  placeholder="0"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Finance Deductions</FormLabel>
                <Input
                  type="number"
                  size="sm"
                  value={addForm.financeDeductions}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, financeDeductions: e.target.value }))}
                  placeholder="0"
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} variant="ghost" onClick={() => setIsAddOpen(false)} size="sm">
                Cancel
              </Button>
              <Button size="sm" colorScheme="teal" onClick={handleAddSubmit} isLoading={taskLoading}>
                Save
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); resetEditForm(); }} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit payroll entry</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={3}>
                <FormLabel>Employee</FormLabel>
                <Select
                  placeholder="Select employee"
                  value={editForm.employeeId}
                  onChange={(e) => handleEditSelect(e.target.value)}
                  size="sm"
                >
                  {payrollOptions.map((option) => (
                    <option key={option.payrollId} value={option.userId}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl mb={3}>
                <FormLabel>Finance Allowances</FormLabel>
                <Input
                  type="number"
                  size="sm"
                  value={editForm.financeAllowances}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, financeAllowances: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Finance Deductions</FormLabel>
                <Input
                  type="number"
                  size="sm"
                  value={editForm.financeDeductions}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, financeDeductions: e.target.value }))}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} variant="ghost" onClick={() => setIsEditOpen(false)} size="sm">
                Cancel
              </Button>
              <Button size="sm" colorScheme="blue" onClick={handleEditSubmit} isLoading={taskLoading}>
                Save changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Approve Modal */}
        <Modal
          isOpen={isApproveOpen}
          onClose={() => {
            setIsApproveOpen(false);
            setApproveTarget(null);
          }}
          size="md"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Approve payroll</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {approveTarget ? (
                <Stack spacing={2}>
                  <Text fontWeight="semibold">{approveTarget.employeeName || 'Employee'}</Text>
                  <Text fontSize="sm" color="gray.500">
                    Department: {approveTarget.department || 'General'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Net amount: {formatCurrency(approveTarget.netSalary || approveTarget.finalSalary)}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    This will mark the employee as paid for {selectedMonth}, {selectedYear}.
                  </Text>
                </Stack>
              ) : (
                <Text color="gray.500">Select an employee to approve.</Text>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" size="sm" onClick={() => setIsApproveOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                colorScheme="green"
                onClick={handleApproveConfirm}
                isLoading={taskLoading}
              >
                Approve
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setDeleteSelection('');
            setDeleteTargetName('');
          }}
          size="sm"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Delete payroll entry</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={4}>
                <FormLabel>Record</FormLabel>
                <Select
                  placeholder="Select record"
                  value={deleteSelection}
                  onChange={(e) => handleDeleteSelect(e.target.value)}
                  size="sm"
                >
                  {payrollOptions.map((option) => (
                    <option key={option.payrollId} value={option.payrollId}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <Text fontSize="sm" color="red.500">
                {deleteTargetName ? `Deleting ${deleteTargetName} will remove the payroll entry for this period.` : ''}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} variant="ghost" onClick={() => setIsDeleteOpen(false)} size="sm">
                Cancel
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                onClick={handleDeleteSubmit}
                isLoading={taskLoading}
              >
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Profile Modal */}
        <Modal
          size="md"
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            setProfileRecord(null);
          }}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Employee profile</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {profileRecord ? (
                <Stack spacing={3}>
                  <Text fontSize="lg" fontWeight="semibold">
                    {profileRecord.employeeName || profileRecord.userId?.fullName || 'Unknown employee'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Department: {profileRecord.department || 'General'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Status: {profileRecord.status?.replace('_', ' ') || 'N/A'}
                  </Text>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Gross
                    </Text>
                    <Text fontWeight="bold">{formatCurrency(profileRecord.grossSalary || profileRecord.basicSalary)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Net
                    </Text>
                    <Text fontWeight="bold">{formatCurrency(profileRecord.netSalary || profileRecord.finalSalary)}</Text>
                  </Box>
                  <Flex justify="space-between">
                    <Box>
                      <Text fontSize="xs" color="gray.500">
                        Finance Allowances
                      </Text>
                      <Text fontWeight="bold">{formatCurrency(profileRecord.financeAllowances)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">
                        Finance Deductions
                      </Text>
                      <Text fontWeight="bold">{formatCurrency(profileRecord.financeDeductions)}</Text>
                    </Box>
                  </Flex>
                  <Text fontSize="sm" color="gray.500">
                    Month: {selectedMonth} · Year: {selectedYear}
                  </Text>
                </Stack>
              ) : (
                <Text textAlign="center" color="gray.500">
                  No profile information available.
                </Text>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" size="sm" onClick={() => setIsProfileOpen(false)}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </FinanceLayout>
  );
};

export default FinancePayrollPage;
