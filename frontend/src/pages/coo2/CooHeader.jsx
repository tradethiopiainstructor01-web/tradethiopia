// src/pages/coo2/CooHeader.jsx
import { useRef, useState, useMemo } from 'react';
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import {
  FiBell,
  FiDownload,
  FiLogOut,
  FiMenu,
  FiUpload,
  FiCalendar,
  FiClock,
  FiSearch,
  FiX,
  FiFilter,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user';
import {
  CUSTOMER_SUCCESS_KPI_DETAILS,
  DEPARTMENT_KPI_SUMMARY,
  DEPARTMENTS,
  FINANCE_KPI_DETAILS,
  HR_KPI_DETAILS,
  IT_KPI_DETAILS,
  SALES_KPI_DETAILS,
  SOCIAL_MEDIA_KPI_DETAILS,
  TRADEX_TV_KPI_DETAILS,
} from './cooData';

const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i); // 2020 to 2030

const MONTHS = [
  { value: '01', label: 'January', short: 'Jan' },
  { value: '02', label: 'February', short: 'Feb' },
  { value: '03', label: 'March', short: 'Mar' },
  { value: '04', label: 'April', short: 'Apr' },
  { value: '05', label: 'May', short: 'May' },
  { value: '06', label: 'June', short: 'Jun' },
  { value: '07', label: 'July', short: 'Jul' },
  { value: '08', label: 'August', short: 'Aug' },
  { value: '09', label: 'September', short: 'Sep' },
  { value: '10', label: 'October', short: 'Oct' },
  { value: '11', label: 'November', short: 'Nov' },
  { value: '12', label: 'December', short: 'Dec' },
];

const QUARTERS = [
  { value: '1', label: 'Q1 (Jan - Mar)', short: 'Q1' },
  { value: '2', label: 'Q2 (Apr - Jun)', short: 'Q2' },
  { value: '3', label: 'Q3 (Jul - Sep)', short: 'Q3' },
  { value: '4', label: 'Q4 (Oct - Dec)', short: 'Q4' },
];

const KPI_STATUS_OPTIONS = [
  'All',
  'On Track',
  'Completed',
  'At Risk',
  'Behind',
  'Not Reported',
];

const generateWeeksForYear = (year) => {
  const weeks = [];
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = (jan4.getUTCDay() + 6) % 7;
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - dayOfWeek);
  firstMonday.setUTCHours(0, 0, 0, 0);

  for (let w = 1; w <= 52; w++) {
    const monday = new Date(firstMonday);
    monday.setUTCDate(firstMonday.getUTCDate() + (w - 1) * 7);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const startStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const endStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const weekValue = `${year}-W${String(w).padStart(2, '0')}`;

    weeks.push({
      value: weekValue,
      label: `Week ${String(w).padStart(2, '0')} (${startStr} - ${endStr})`,
      weekNum: w,
    });
  }
  return weeks;
};

const CooHeader = ({
  onToggleSidebar,
  periodType = 'monthly',
  setPeriodType,
  selectedYear = 2026,
  setSelectedYear,
  selectedMonth = '09',
  setSelectedMonth,
  selectedWeek = '2026-W37',
  setSelectedWeek,
  selectedQuarter = '3',
  setSelectedQuarter,
  periodKey = '2026-09',
  periodDisplayLabel = 'September 2026',
  statusFilter = 'All',
  setStatusFilter,
  searchQuery = '',
  setSearchQuery,
  onResetFilters,
  onSetCurrentPeriod,
  selectedDepartment = 'all',
  onSelectDepartment,
  dateRange,
  setDateRange,
  unreadCount = 0,
  onNotificationsClick,
  onDataImported,
}) => {
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const fileInputRef = useRef(null);
  const toast = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const currentWeekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  const currentWeekStr = `${currentYear}-W${String(currentWeekNum).padStart(2, '0')}`;
  const currentQuarterStr = String(Math.floor(now.getMonth() / 3) + 1);

  const availableWeeks = useMemo(() => generateWeeksForYear(selectedYear), [selectedYear]);

  const handleLogout = () => {
    clearUser();
    navigate('/login', { replace: true });
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');
      const detailData = selectedDepartment === 'it'
        ? IT_KPI_DETAILS
        : selectedDepartment === 'social_media'
          ? SOCIAL_MEDIA_KPI_DETAILS
          : selectedDepartment === 'sales' ? SALES_KPI_DETAILS : null;
      const sectionTitles = selectedDepartment === 'it'
        ? { internal: 'Internal Deliverables', external: 'External Collateral' }
        : selectedDepartment === 'social_media'
          ? { overall: 'Overall Marketing KPIs', platforms: 'Platform Performance' }
          : { measurements: 'Sales Measurements', services: 'Service Lines', products: 'Product KPIs' };
      const rows = selectedDepartment === 'tradex'
        ? TRADEX_TV_KPI_DETAILS.map((row) => ({ KPI: row.kpi, Value: row.value }))
        : selectedDepartment === 'hr'
        ? HR_KPI_DETAILS.map((row) => ({ KPI: row.kpi, Value: row.value }))
        : selectedDepartment === 'finance' ? FINANCE_KPI_DETAILS.map((row) => ({ Item: row.item, Amount: row.amount }))
        : selectedDepartment === 'customer_services' ? CUSTOMER_SUCCESS_KPI_DETAILS.map((row) => ({
            KPI: row.kpi,
            Target: row.target,
            Actual: row.actual,
            Note: row.note,
          }))
        : detailData
        ? Object.keys(detailData).flatMap((section) =>
            detailData[section].map((row) => ({
              Section: sectionTitles[section],
              KPI: row.kpi,
              Target: row.target,
              Actual: row.actual,
              'Achievement %': row.achievement,
              Status: row.status,
            }))
          )
        : DEPARTMENT_KPI_SUMMARY.map((row) => ({
            Department: row.department,
            'Key Metric': row.keyMetric,
            Target: row.target,
            Actual: row.actual,
            'Achievement %': row.achievement,
            Status: row.status,
          }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      const sheetName = selectedDepartment === 'it'
        ? 'IT KPI Data'
        : selectedDepartment === 'tradex'
          ? 'Tradex TV KPI Data'
        : selectedDepartment === 'social_media'
          ? 'Social Media KPI Data'
          : selectedDepartment === 'sales'
            ? 'Sales KPI Data'
            : selectedDepartment === 'customer_services'
              ? 'Customer Success Data'
              : selectedDepartment === 'finance'
                ? 'Finance KPI Data'
                : selectedDepartment === 'hr' ? 'HR KPI Data' : 'COO KPI Data';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(
        workbook,
        `coo-kpi-export-${periodKey}-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast({
        title: 'Excel export complete',
        description: `${rows.length} KPI records were exported for ${periodKey}.`,
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Excel export failed',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      if (!rows.length) {
        throw new Error('The selected Excel file is empty.');
      }

      let updatedCount = 0;
      rows.forEach((row) => {
        const kpiName = String(row.KPI || row.kpi || row.Item || row.item || '').trim().toLowerCase();
        if (!kpiName) return;

        const detailTargets = [
          ...IT_KPI_DETAILS.internal,
          ...IT_KPI_DETAILS.external,
          ...SOCIAL_MEDIA_KPI_DETAILS.overall,
          ...SOCIAL_MEDIA_KPI_DETAILS.platforms,
          ...SALES_KPI_DETAILS.measurements,
          ...SALES_KPI_DETAILS.services,
          ...SALES_KPI_DETAILS.products,
        ];
        const detailRow = detailTargets.find(
          (item) => item.kpi?.toLowerCase() === kpiName
        );

        if (detailRow) {
          if (row.Target !== '' && row.Target !== undefined) detailRow.target = Number(row.Target);
          if (row.Actual !== '' && row.Actual !== undefined) detailRow.actual = Number(row.Actual);
          if (row.Status) detailRow.status = String(row.Status);
          detailRow.achievement = row['Achievement %'] !== '' && row['Achievement %'] !== undefined
            ? Number(String(row['Achievement %']).replace('%', ''))
            : detailRow.status === 'Not Reported'
              ? null
              : detailRow.target ? Math.round((detailRow.actual / detailRow.target) * 100) : 0;
          updatedCount += 1;
          return;
        }

        const departmentName = String(row.Department || row.department || '').trim().toLowerCase();
        const summaryRow = DEPARTMENT_KPI_SUMMARY.find(
          (item) => item.department.toLowerCase() === departmentName
        );

        if (!summaryRow) return;
        if (row['Key Metric']) summaryRow.keyMetric = String(row['Key Metric']);
        if (row.Target !== '' && row.Target !== undefined) summaryRow.target = Number(row.Target);
        if (row.Actual !== '' && row.Actual !== undefined) summaryRow.actual = Number(row.Actual);
        if (row['Achievement %'] !== '' && row['Achievement %'] !== undefined) {
          summaryRow.achievement = Number(String(row['Achievement %']).replace('%', ''));
        } else if (summaryRow.target) {
          summaryRow.achievement = Math.round((summaryRow.actual / summaryRow.target) * 100);
        }
        if (row.Status) summaryRow.status = String(row.Status);
        updatedCount += 1;
      });

      if (!updatedCount) {
        throw new Error('No matching KPI rows found. Export the current file first and use it as the import template.');
      }

      onDataImported?.();
      toast({
        title: 'Excel import successful',
        description: `Updated ${updatedCount} KPI metric(s).`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Excel import failed',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handlePeriodModeChange = (mode) => {
    setPeriodType?.(mode);
    if (setDateRange) {
      setDateRange(mode === 'weekly' ? 'Weekly' : mode === 'quarterly' ? 'Quarterly' : mode === 'yearly' ? 'Yearly' : 'Monthly');
    }
  };

  const hasActiveFilters = statusFilter !== 'All' || searchQuery !== '' || selectedYear !== currentYear;

  return (
    <Box
      bg="#ffffff"
      borderBottom="1px solid #e2e8f0"
      px={{ base: 4, md: 6 }}
      py={3}
      position="sticky"
      top={0}
      zIndex={10}
      flexShrink={0}
      boxShadow="0 1px 3px rgba(0, 0, 0, 0.03)"
    >
      {/* Row 1: Global Navigation, Search & Actions */}
      <Flex align="center" gap={2.5} wrap="wrap" justify="space-between">
        <HStack spacing={2} flexWrap="wrap" flex={1} minW={0}>
          <IconButton
            icon={<FiMenu size={19} />}
            variant="ghost"
            color="#64748b"
            aria-label="Toggle navigation"
            onClick={onToggleSidebar}
            _hover={{ bg: '#f1f5f9', color: '#0f172a' }}
            borderRadius="10px"
            size="sm"
          />

          {/* Quick Department Selector */}
          <HStack spacing={1.5}>
            <Text fontSize="12px" fontWeight="700" color="#64748b" display={{ base: 'none', lg: 'block' }}>
              Department:
            </Text>
            <Select
              size="sm"
              w={{ base: '125px', sm: '150px', md: '185px' }}
              borderRadius="8px"
              bg="#f8fafc"
              borderColor="#cbd5e1"
              fontWeight="700"
              color="#0f172a"
              value={selectedDepartment}
              onChange={(e) => onSelectDepartment?.(e.target.value)}
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </HStack>

          {/* Global Search Filter */}
          <InputGroup size="sm" maxW={{ base: '140px', sm: '190px', md: '260px' }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="#94a3b8" />
            </InputLeftElement>
            <Input
              placeholder="Search KPIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery?.(e.target.value)}
              borderRadius="8px"
              bg="#f8fafc"
              borderColor="#cbd5e1"
              _focus={{ bg: '#ffffff', borderColor: '#2563eb' }}
              fontSize="12.5px"
            />
            {searchQuery && (
              <InputRightElement>
                <IconButton
                  size="xs"
                  icon={<FiX />}
                  variant="ghost"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery?.('')}
                />
              </InputRightElement>
            )}
          </InputGroup>
        </HStack>

        {/* Actions (Excel, Notifications, Logout) */}
        <HStack spacing={1.5} ml="auto">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            display="none"
            onChange={handleImportExcel}
          />
          <Button
            size="sm"
            variant="outline"
            borderColor="#bbf7d0"
            color="#15803d"
            leftIcon={<FiUpload />}
            onClick={() => fileInputRef.current?.click()}
            isLoading={isImporting}
            loadingText="Importing"
            display={{ base: 'none', md: 'inline-flex' }}
          >
            Import
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            leftIcon={<FiDownload />}
            onClick={handleExportExcel}
            isLoading={isExporting}
            loadingText="Exporting"
            display={{ base: 'none', md: 'inline-flex' }}
          >
            Export
          </Button>

          <Tooltip label="Notifications" placement="bottom">
            <Box position="relative">
              <IconButton
                size="sm"
                variant="ghost"
                borderRadius="10px"
                color="#64748b"
                _hover={{ bg: '#f1f5f9', color: '#0f172a' }}
                icon={<FiBell size={18} />}
                aria-label="Notifications"
                onClick={onNotificationsClick}
              />
              {unreadCount > 0 && (
                <Badge
                  position="absolute"
                  top="-3px"
                  right="-3px"
                  bg="#ef4444"
                  color="white"
                  fontSize="9px"
                  borderRadius="full"
                  minW="18px"
                  h="18px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border="2px solid #ffffff"
                >
                  {unreadCount}
                </Badge>
              )}
            </Box>
          </Tooltip>

          <Button
            size="sm"
            px={{ base: 2.5, sm: 3 }}
            variant="outline"
            colorScheme="red"
            leftIcon={<FiLogOut />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </HStack>
      </Flex>

      {/* Row 2: Dedicated Filter Toolbar */}
      <Flex
        align="center"
        gap={2.5}
        mt={3}
        mb={-3}
        mx={{ base: -4, md: -6 }}
        px={{ base: 4, md: 6 }}
        py={2.5}
        bg="#f8fafc"
        borderTop="1px solid #e2e8f0"
        wrap={{ base: 'nowrap', xl: 'wrap' }}
        overflowX={{ base: 'auto', xl: 'visible' }}
        sx={{
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <HStack spacing={1.5} mr={1} flexShrink={0}>
          <FiFilter color="#2563eb" />
          <Text
            fontSize="11.5px"
            fontWeight="800"
            color="#1e293b"
            textTransform="uppercase"
            letterSpacing="0.06em"
            whiteSpace="nowrap"
          >
            Filters:
          </Text>
        </HStack>

        {/* 1. Period Mode Tabs */}
        <ButtonGroup size="sm" isAttached variant="outline">
          {['monthly', 'weekly', 'quarterly', 'yearly'].map((mode) => {
            const isActive = periodType === mode;
            const label = mode.charAt(0).toUpperCase() + mode.slice(1);
            return (
              <Button
                key={mode}
                minW={{ base: 'auto', sm: '78px' }}
                onClick={() => handlePeriodModeChange(mode)}
                bg={isActive ? '#213f70' : '#ffffff'}
                color={isActive ? '#ffffff' : '#475569'}
                borderColor={isActive ? '#213f70' : '#cbd5e1'}
                _hover={{ bg: isActive ? '#1b335a' : '#f1f5f9' }}
                fontWeight={isActive ? '700' : '600'}
                fontSize="12.5px"
              >
                {label}
              </Button>
            );
          })}
        </ButtonGroup>

        {/* 2. Year Selector */}
        <HStack spacing={1}>
          <Text fontSize="12px" fontWeight="700" color="#64748b">Year:</Text>
          <Select
            size="sm"
            w="98px"
            bg="white"
            borderColor="#cbd5e1"
            fontWeight="700"
            borderRadius="8px"
            fontSize="12.5px"
            value={selectedYear}
            onChange={(e) => setSelectedYear?.(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y} {y === currentYear ? '★' : ''}
              </option>
            ))}
          </Select>
        </HStack>

        {/* 3. Monthly: Month Selector */}
        {periodType === 'monthly' && (
          <HStack spacing={1}>
            <Text fontSize="12px" fontWeight="700" color="#64748b">Month:</Text>
            <Select
              size="sm"
              w="155px"
              bg="white"
              borderColor="#cbd5e1"
              fontWeight="700"
              borderRadius="8px"
              fontSize="12.5px"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth?.(e.target.value)}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} ({m.short}) {selectedYear === currentYear && m.value === currentMonthStr ? '★' : ''}
                </option>
              ))}
            </Select>
          </HStack>
        )}

        {/* 4. Weekly: Auto-calculated ISO Weeks */}
        {periodType === 'weekly' && (
          <HStack spacing={1}>
            <Text fontSize="12px" fontWeight="700" color="#64748b">Week:</Text>
            <Select
              size="sm"
              w="225px"
              bg="white"
              borderColor="#cbd5e1"
              fontWeight="700"
              borderRadius="8px"
              fontSize="12px"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek?.(e.target.value)}
            >
              {availableWeeks.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label} {selectedYear === currentYear && w.value === currentWeekStr ? '★' : ''}
                </option>
              ))}
            </Select>
          </HStack>
        )}

        {/* 5. Quarterly: Quarter Selector */}
        {periodType === 'quarterly' && (
          <HStack spacing={1}>
            <Text fontSize="12px" fontWeight="700" color="#64748b">Quarter:</Text>
            <Select
              size="sm"
              w="150px"
              bg="white"
              borderColor="#cbd5e1"
              fontWeight="700"
              borderRadius="8px"
              fontSize="12.5px"
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter?.(e.target.value)}
            >
              {QUARTERS.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label} {selectedYear === currentYear && q.value === currentQuarterStr ? '★' : ''}
                </option>
              ))}
            </Select>
          </HStack>
        )}

        {/* 6. Quick Jump to Current Period */}
        <Button
          size="sm"
          variant="outline"
          borderColor="#cbd5e1"
          bg="white"
          color="#1e293b"
          _hover={{ bg: '#f1f5f9' }}
          leftIcon={<FiClock />}
          onClick={onSetCurrentPeriod}
          fontSize="12px"
          fontWeight="600"
        >
          Current {periodType === 'weekly' ? 'Week' : periodType === 'quarterly' ? 'Quarter' : 'Month'}
        </Button>

        {/* 7. Status Filter */}
        <HStack spacing={1}>
          <Text fontSize="12px" fontWeight="700" color="#64748b">Status:</Text>
          <Select
            size="sm"
            w="135px"
            bg="white"
            borderColor="#cbd5e1"
            fontWeight="700"
            borderRadius="8px"
            fontSize="12.5px"
            value={statusFilter}
            onChange={(e) => setStatusFilter?.(e.target.value)}
          >
            {KPI_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'All' ? 'All Statuses' : status}
              </option>
            ))}
          </Select>
        </HStack>

        {/* 8. Active Period Tag & Reset */}
        <HStack spacing={1.5} ml={{ base: 0, xl: 'auto' }}>
          <Badge
            bg="#213f70"
            color="white"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="11.5px"
            fontWeight="700"
            display="flex"
            alignItems="center"
            gap={1.5}
            boxShadow="xs"
          >
            <FiCalendar size={12} />
            <Text as="span">{periodDisplayLabel}</Text>
          </Badge>

          {hasActiveFilters && (
            <Button
              size="xs"
              variant="ghost"
              color="#64748b"
              _hover={{ color: '#ef4444', bg: '#fee2e2' }}
              onClick={onResetFilters}
            >
              Reset
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default CooHeader;
