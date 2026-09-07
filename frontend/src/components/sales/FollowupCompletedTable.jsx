import React, { useState, useMemo, useRef } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  IconButton,
  Flex,
  Text,
  Heading,
  useColorModeValue,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  VStack,
  HStack,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Divider,
  Tag,
  TagLabel,
  TagLeftIcon,
  Image,
  Icon
} from '@chakra-ui/react';
import {
  SearchIcon,
  EditIcon,
  DeleteIcon,
  InfoIcon,
  DownloadIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import {
  FiCheckCircle,
  FiDollarSign,
  FiTrendingUp,
  FiAward,
  FiPhone,
  FiMail,
  FiCalendar,
  FiUser,
  FiBookOpen,
  FiClock,
  FiFileText,
  FiCreditCard,
  FiUploadCloud,
  FiTrash2,
  FiEye,
  FiAlertCircle,
  FiDownload
} from 'react-icons/fi';
import ETHIOPIAN_BANKS from '../../utils/ethiopianBanks';

const formatCurrency = (amount) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return 'ETB 0.00';
  return `ETB ${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const calculateCommissionBreakdown = (coursePrice) => {
  const price = Number(coursePrice) || 0;
  const commissionRate = 0.07; // 7%
  const commissionTaxRate = 0.00075; // 0.075% of commission
  const grossCommission = price * commissionRate;
  const commissionTax = grossCommission * commissionTaxRate;
  const netCommission = grossCommission - commissionTax;
  return {
    grossCommission: parseFloat(grossCommission.toFixed(2)),
    commissionTax: parseFloat(commissionTax.toFixed(2)),
    netCommission: parseFloat(netCommission.toFixed(2))
  };
};

const processImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Please upload a valid image file (JPEG, PNG, WEBP).'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 900;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('Failed to parse image.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};

const ImageUploadCard = ({
  label,
  subtitle = 'PNG, JPG or WEBP',
  buttonLabel = 'Upload Photo',
  value,
  onChange,
  onRemove,
  onPreview,
  isRequired = false
}) => {
  const fileInputRef = useRef(null);
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const bg = useColorModeValue('gray.50', 'gray.700');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await processImageFile(file);
      onChange(base64);
    } catch (err) {
      alert(err.message || 'Failed to upload image');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <Box borderWidth="1px" borderColor={value ? 'green.400' : borderColor} borderRadius="xl" p={3} bg={bg}>
      <Flex justify="space-between" align="center" mb={2} gap={1}>
        <Text fontSize="xs" fontWeight="bold" noOfLines={1} title={label}>
          {label} {isRequired && <Text as="span" color="red.500">*</Text>}
        </Text>
        {value && (
          <Badge colorScheme="green" fontSize="2xs" borderRadius="full" px={1.5} flexShrink={0}>
            Uploaded
          </Badge>
        )}
      </Flex>
      {value ? (
        <VStack spacing={2} align="center">
          <Box
            w="100%"
            h="110px"
            borderRadius="md"
            overflow="hidden"
            bg="blackAlpha.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={() => onPreview && onPreview(value, label)}
          >
            <Image src={value} alt={label} maxH="100%" maxW="100%" objectFit="contain" />
          </Box>
          <HStack spacing={1.5} w="100%">
            <Button
              size="xs"
              variant="outline"
              colorScheme="teal"
              leftIcon={<Icon as={FiUploadCloud} />}
              onClick={() => fileInputRef.current?.click()}
              flex="1"
            >
              Change
            </Button>
            <Button
              size="xs"
              variant="outline"
              colorScheme="blue"
              leftIcon={<Icon as={FiEye} />}
              onClick={() => onPreview && onPreview(value, label)}
              flex="1"
            >
              View
            </Button>
            <Button
              size="xs"
              variant="outline"
              colorScheme="red"
              leftIcon={<Icon as={FiTrash2} />}
              onClick={onRemove}
              flex="1"
            >
              Remove
            </Button>
          </HStack>
        </VStack>
      ) : (
        <VStack
          spacing={2}
          py={4}
          borderWidth="1px"
          borderStyle="dashed"
          borderColor={borderColor}
          borderRadius="md"
          cursor="pointer"
          onClick={() => fileInputRef.current?.click()}
          _hover={{ borderColor: 'teal.500', bg: 'teal.50' }}
          transition="all 0.2s"
        >
          <Icon as={FiUploadCloud} boxSize={7} color="gray.400" />
          <Text fontSize="2xs" color="gray.500" textAlign="center">
            {subtitle}
          </Text>
          <Button size="xs" colorScheme="blue" variant="outline" pointerEvents="none">
            {buttonLabel}
          </Button>
        </VStack>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </Box>
  );
};

const FollowupCompletedTable = ({
  customers = [],
  courses = [],
  onUpdate,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [callStatusFilter, setCallStatusFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal / Drawer states
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [fullImageModal, setFullImageModal] = useState({ isOpen: false, src: '', title: '', subtitle: '' });
  const deleteCancelRef = useRef(null);

  const toast = useToast();

  const userRole = localStorage.getItem('userRole') || 'agent';
  const headerBg = useColorModeValue('teal.700', 'teal.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const rowHoverBg = useColorModeValue('teal.50', 'whiteAlpha.100');
  const subtleText = useColorModeValue('gray.600', 'gray.400');

  // Helper to resolve course details
  const getCourseDetails = (courseName, courseId) => {
    if (!Array.isArray(courses)) return null;
    let course = null;
    if (courseId) {
      course = courses.find((c) => c._id === courseId);
    }
    if (!course && courseName) {
      course = courses.find((c) => c.name?.toLowerCase() === courseName.toLowerCase());
    }
    return course ? { id: course._id, name: course.name, price: Number(course.price) || 0 } : null;
  };

  const getDealPrice = (customer) => {
    const details = getCourseDetails(customer?.contactTitle, customer?.courseId);
    const rawPrice = customer?.coursePrice ?? details?.price ?? 0;
    const num = Number(rawPrice);
    return Number.isFinite(num) ? num : 0;
  };

  const getNetCommission = (customer) => {
    if (customer?.commission?.netCommission !== undefined && customer?.commission?.netCommission !== null) {
      const net = Number(customer.commission.netCommission);
      if (Number.isFinite(net)) return net;
    }
    const price = getDealPrice(customer);
    return calculateCommissionBreakdown(price).netCommission;
  };

  // Filter completed customers
  const filteredCompleted = useMemo(() => {
    return (customers || []).filter((cust) => {
      // Must have Completed status
      const status = (cust.followupStatus || '').toString().trim().toLowerCase();
      if (status !== 'completed') return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches =
          (cust.customerName && cust.customerName.toLowerCase().includes(query)) ||
          (cust.contactTitle && cust.contactTitle.toLowerCase().includes(query)) ||
          (cust.phone && cust.phone.toLowerCase().includes(query)) ||
          (cust.email && cust.email.toLowerCase().includes(query)) ||
          (cust.paymentBank && cust.paymentBank.toLowerCase().includes(query)) ||
          (cust.fsNumber && cust.fsNumber.toLowerCase().includes(query)) ||
          (cust.paymentOption && cust.paymentOption.toLowerCase().includes(query)) ||
          (cust.note && cust.note.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Schedule filter
      if (scheduleFilter && (cust.schedulePreference || 'Regular') !== scheduleFilter) {
        return false;
      }

      // Scope filter
      if (scopeFilter && (cust.packageScope || 'Local') !== scopeFilter) {
        return false;
      }

      // Call status filter
      if (callStatusFilter && (cust.callStatus || '') !== callStatusFilter) {
        return false;
      }

      // Bank filter
      if (bankFilter && (cust.paymentBank || '') !== bankFilter) {
        return false;
      }

      return true;
    });
  }, [customers, searchTerm, scheduleFilter, scopeFilter, callStatusFilter, bankFilter]);

  // Sort completed customers
  const sortedCompleted = useMemo(() => {
    return [...filteredCompleted].sort((a, b) => {
      if (sortBy === 'name') {
        return (a.customerName || '').localeCompare(b.customerName || '');
      }
      if (sortBy === 'price-desc') {
        return getDealPrice(b) - getDealPrice(a);
      }
      if (sortBy === 'price-asc') {
        return getDealPrice(a) - getDealPrice(b);
      }
      if (sortBy === 'commission-desc') {
        return getNetCommission(b) - getNetCommission(a);
      }
      if (sortBy === 'date-asc') {
        const dateA = new Date(a.date || a.createdAt || 0);
        const dateB = new Date(b.date || b.createdAt || 0);
        return dateA - dateB;
      }
      // Default: date-desc
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [filteredCompleted, sortBy]);

  // Compute Overall Completed Metrics
  const metrics = useMemo(() => {
    const totalCount = filteredCompleted.length;
    let totalRevenue = 0;
    let totalCommission = 0;

    filteredCompleted.forEach((cust) => {
      totalRevenue += getDealPrice(cust);
      totalCommission += getNetCommission(cust);
    });

    const averageDeal = totalCount > 0 ? totalRevenue / totalCount : 0;

    return {
      totalCount,
      totalRevenue,
      totalCommission,
      averageDeal
    };
  }, [filteredCompleted]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCompleted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCompleted = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedCompleted.slice(start, start + pageSize);
  }, [sortedCompleted, safePage, pageSize]);

  // Handle Edit Action
  const handleOpenEdit = (customer) => {
    setEditCustomer({
      ...customer,
      customerName: customer.customerName || '',
      contactTitle: customer.contactTitle || customer.courseName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      callStatus: customer.callStatus || 'Called',
      followupStatus: 'Completed',
      schedulePreference: customer.schedulePreference || 'Regular',
      packageScope: customer.packageScope || 'Local',
      passportPhoto: customer.passportPhoto || '',
      nationalIdFrontImage: customer.nationalIdFrontImage || '',
      nationalIdBackImage: customer.nationalIdBackImage || '',
      paymentScreenshot: customer.paymentScreenshot || '',
      paymentOption: customer.paymentOption || 'Full Payment',
      paymentBank: customer.paymentBank || '',
      fsNumber: customer.fsNumber || '',
      note: customer.note || '',
      supervisorComment: customer.supervisorComment || '',
      date: customer.date ? new Date(customer.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editCustomer) return;
    const targetId = editCustomer._id || editCustomer.id;
    if (!targetId) return;

    // Strict validation for completed sale verification
    const missing = [];
    if (!editCustomer.paymentBank) missing.push('Payment Bank');
    if (!editCustomer.paymentScreenshot) missing.push('Payment Screenshot');

    if (missing.length > 0) {
      toast({
        title: 'Completion Verification Required',
        description: `Completed deals must have: ${missing.join(', ')}.`,
        status: 'warning',
        duration: 4000,
        isClosable: true
      });
      return;
    }

    const payload = { ...editCustomer };
    if (payload.contactTitle) {
      const details = getCourseDetails(payload.contactTitle, payload.courseId);
      if (details) {
        payload.coursePrice = details.price;
        payload.courseId = details.id;
        payload.commission = calculateCommissionBreakdown(details.price);
      }
    }

    if (onUpdate) {
      onUpdate(targetId, payload);
    }

    toast({
      title: 'Deal updated',
      description: 'Completed followup and verification documents updated successfully.',
      status: 'success',
      duration: 2500,
      isClosable: true
    });

    setIsEditOpen(false);
    setEditCustomer(null);
  };

  // Handle Delete Action
  const handleOpenDelete = (customer) => {
    setDeleteCandidate(customer);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteCandidate && onDelete) {
      onDelete(deleteCandidate._id || deleteCandidate.id);
      toast({
        title: 'Deal deleted',
        description: 'Completed followup removed.',
        status: 'info',
        duration: 2500,
        isClosable: true
      });
    }
    setIsDeleteOpen(false);
    setDeleteCandidate(null);
  };

  // Export Completed Deals
  const exportCompletedDeals = async () => {
    const rows = sortedCompleted.map((c) => {
      const price = getDealPrice(c);
      const commission = getNetCommission(c);
      return {
        'Customer Name': c.customerName || '',
        'Training / Course': c.contactTitle || '',
        'Deal Value (ETB)': price,
        'Net Commission (ETB)': commission,
        'Phone Number': c.phone || '',
        'Email Address': c.email || '',
        'Payment Option': c.paymentOption || 'Full Payment',
        'Payment Bank': c.paymentBank || 'N/A',
        'FS Number': c.fsNumber || 'N/A',
        'Passport Photo Verified': c.passportPhoto ? 'Yes' : 'No',
        'Front ID Verified': c.nationalIdFrontImage ? 'Yes' : 'No',
        'Back ID Verified': c.nationalIdBackImage ? 'Yes' : 'No',
        'Payment Receipt Verified': c.paymentScreenshot ? 'Yes' : 'No',
        'Call Status': c.callStatus || '',
        'Followup Status': 'Completed',
        'Schedule Preference': c.schedulePreference || 'Regular',
        'Package Scope': c.packageScope || 'Local',
        'Completion Date': c.date ? new Date(c.date).toLocaleDateString() : '',
        'Notes': c.note || '',
        'Supervisor Comments': c.supervisorComment || ''
      };
    });

    if (!rows.length) {
      toast({
        title: 'No rows to export',
        description: 'There are no completed followups matching the current filters.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Completed Followups');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Completed_Followups_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: 'Export ready',
        description: 'Downloaded completed followups excel sheet.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      // CSV Fallback
      try {
        const headers = Object.keys(rows[0] || {});
        const csvRows = [headers.join(',')];
        for (const row of rows) {
          const line = headers.map((h) => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(',');
          csvRows.push(line);
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Completed_Followups_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast({
          title: 'Export ready',
          description: 'Downloaded completed followups CSV file.',
          status: 'info',
          duration: 3000,
          isClosable: true
        });
      } catch (err2) {
        toast({
          title: 'Export failed',
          description: 'Could not export data.',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    }
  };

  const getCallBadgeColor = (status) => {
    switch (status) {
      case 'Called': return 'green';
      case '2x Called': return 'teal';
      case 'Callback': return 'purple';
      case 'Busy': return 'red';
      case 'No Answer': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <Box p={{ base: 2, md: 4 }}>
      {/* Metrics Banner */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardBody p={4}>
            <Stat>
              <Flex align="center">
                <Box p={3} borderRadius="lg" bg="green.100" color="green.600" mr={3}>
                  <FiCheckCircle size={22} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="semibold" color={subtleText}>
                    Completed Deals
                  </StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="bold" color="green.600">
                    {metrics.totalCount}
                  </StatNumber>
                  <StatHelpText mb={0} fontSize="xs" color={subtleText}>
                    Successfully closed
                  </StatHelpText>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardBody p={4}>
            <Stat>
              <Flex align="center">
                <Box p={3} borderRadius="lg" bg="teal.100" color="teal.600" mr={3}>
                  <FiTrendingUp size={22} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="semibold" color={subtleText}>
                    Total Deal Value
                  </StatLabel>
                  <StatNumber fontSize="xl" fontWeight="bold" color="teal.600">
                    {formatCurrency(metrics.totalRevenue)}
                  </StatNumber>
                  <StatHelpText mb={0} fontSize="xs" color={subtleText}>
                    Gross training revenue
                  </StatHelpText>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardBody p={4}>
            <Stat>
              <Flex align="center">
                <Box p={3} borderRadius="lg" bg="yellow.100" color="yellow.600" mr={3}>
                  <FiDollarSign size={22} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="semibold" color={subtleText}>
                    Net Commission Earned
                  </StatLabel>
                  <StatNumber fontSize="xl" fontWeight="bold" color="yellow.600">
                    {formatCurrency(metrics.totalCommission)}
                  </StatNumber>
                  <StatHelpText mb={0} fontSize="xs" color={subtleText}>
                    7% rate after tax
                  </StatHelpText>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardBody p={4}>
            <Stat>
              <Flex align="center">
                <Box p={3} borderRadius="lg" bg="purple.100" color="purple.600" mr={3}>
                  <FiAward size={22} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="semibold" color={subtleText}>
                    Average Deal Value
                  </StatLabel>
                  <StatNumber fontSize="xl" fontWeight="bold" color="purple.600">
                    {formatCurrency(metrics.averageDeal)}
                  </StatNumber>
                  <StatHelpText mb={0} fontSize="xs" color={subtleText}>
                    Per completed customer
                  </StatHelpText>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Control Bar: Search, Filters, Sort & Export */}
      <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4} mb={6} boxShadow="sm">
        <Flex direction={{ base: 'column', md: 'row' }} gap={3} align="center" wrap="wrap">
          <InputGroup width={{ base: '100%', md: '260px' }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search completed deals..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              size="md"
              borderRadius="lg"
            />
          </InputGroup>

          <Select
            width={{ base: '100%', md: '170px' }}
            value={bankFilter}
            onChange={(e) => {
              setBankFilter(e.target.value);
              setCurrentPage(1);
            }}
            borderRadius="lg"
            placeholder="All Banks"
          >
            {ETHIOPIAN_BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>

          <Select
            width={{ base: '100%', md: '140px' }}
            value={scheduleFilter}
            onChange={(e) => {
              setScheduleFilter(e.target.value);
              setCurrentPage(1);
            }}
            borderRadius="lg"
          >
            <option value="">All Schedules</option>
            <option value="Regular">Regular</option>
            <option value="Weekend">Weekend</option>
            <option value="Night">Night</option>
            <option value="Online">Online</option>
          </Select>

          <Select
            width={{ base: '100%', md: '140px' }}
            value={scopeFilter}
            onChange={(e) => {
              setScopeFilter(e.target.value);
              setCurrentPage(1);
            }}
            borderRadius="lg"
          >
            <option value="">All Scopes</option>
            <option value="Local">Local</option>
            <option value="International">International</option>
          </Select>

          <Select
            width={{ base: '100%', md: '140px' }}
            value={callStatusFilter}
            onChange={(e) => {
              setCallStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            borderRadius="lg"
          >
            <option value="">All Call Status</option>
            <option value="Called">Called</option>
            <option value="2x Called">2x Called</option>
            <option value="Callback">Callback</option>
            <option value="Busy">Busy</option>
            <option value="No Answer">No Answer</option>
            <option value="Not Called">Not Called</option>
          </Select>

          <Select
            width={{ base: '100%', md: '170px' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            borderRadius="lg"
          >
            <option value="date-desc">Newest Date</option>
            <option value="date-asc">Oldest Date</option>
            <option value="price-desc">Highest Deal Value</option>
            <option value="price-asc">Lowest Deal Value</option>
            <option value="commission-desc">Highest Commission</option>
            <option value="name">Customer Name (A-Z)</option>
          </Select>

          <HStack ml={{ base: 0, md: 'auto' }} spacing={2} width={{ base: '100%', md: 'auto' }} justify="flex-end">
            <Button
              leftIcon={<DownloadIcon />}
              colorScheme="teal"
              variant="solid"
              borderRadius="lg"
              onClick={exportCompletedDeals}
              size="md"
            >
              Export ({sortedCompleted.length})
            </Button>
            <Tooltip label="Reset Filters" hasArrow>
              <IconButton
                icon={<RepeatIcon />}
                aria-label="Reset Filters"
                variant="outline"
                borderRadius="lg"
                onClick={() => {
                  setSearchTerm('');
                  setScheduleFilter('');
                  setScopeFilter('');
                  setCallStatusFilter('');
                  setBankFilter('');
                  setSortBy('date-desc');
                  setCurrentPage(1);
                }}
              />
            </Tooltip>
          </HStack>
        </Flex>
      </Card>

      {/* Main Completed Deals Table */}
      <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} boxShadow="md" overflow="hidden">
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead bg={headerBg}>
              <Tr>
                <Th color="white" py={3.5} fontSize="xs" textTransform="uppercase">Customer</Th>
                <Th color="white" py={3.5} fontSize="xs" textTransform="uppercase">Training / Course</Th>
                <Th color="white" py={3.5} fontSize="xs" textTransform="uppercase">Payment Bank</Th>
                <Th color="white" py={3.5} fontSize="xs" textTransform="uppercase">Verification Proofs</Th>
                <Th color="white" py={3.5} fontSize="xs" textTransform="uppercase">Contact</Th>
                <Th color="white" py={3.5} fontSize="xs" textTransform="uppercase">Schedule</Th>
                <Th color="white" py={3.5} fontSize="xs" textTransform="uppercase">Date</Th>
                <Th color="white" py={3.5} fontSize="xs" textTransform="uppercase" textAlign="center">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedCompleted.length === 0 ? (
                <Tr>
                  <Td colSpan={8} py={12} textAlign="center">
                    <VStack spacing={3}>
                      <Box p={3} borderRadius="full" bg="gray.100" color="gray.400">
                        <FiCheckCircle size={32} />
                      </Box>
                      <Text fontWeight="semibold" color="gray.600">No completed followups found</Text>
                      <Text fontSize="xs" color="gray.400">
                        Completed followups will appear here automatically when customer status is set to "Completed".
                      </Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                paginatedCompleted.map((customer) => {
                  return (
                    <Tr
                      key={customer._id || customer.id}
                      _hover={{ bg: rowHoverBg }}
                      transition="background-color 0.15s ease"
                    >
                      <Td py={3}>
                        <HStack spacing={2.5}>
                          <Box
                            w="32px"
                            h="32px"
                            borderRadius="full"
                            bg="teal.500"
                            color="white"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontWeight="bold"
                            fontSize="xs"
                            flexShrink={0}
                          >
                            {(customer.customerName || 'C').charAt(0).toUpperCase()}
                          </Box>
                          <Box>
                            <Text fontWeight="bold" fontSize="sm" color={useColorModeValue('gray.800', 'white')}>
                              {customer.customerName || 'Unnamed Customer'}
                            </Text>
                            <Badge colorScheme="green" variant="subtle" fontSize="2xs" borderRadius="full">
                              Completed Deal
                            </Badge>
                          </Box>
                        </HStack>
                      </Td>

                      <Td py={3}>
                        <Tag size="sm" colorScheme="blue" borderRadius="full">
                          <TagLeftIcon as={FiBookOpen} />
                          <TagLabel fontWeight="medium">
                            {customer.contactTitle || customer.courseName || 'General Training'}
                          </TagLabel>
                        </Tag>
                      </Td>

                      <Td py={3}>
                        <VStack align="flex-start" spacing={1}>
                          {customer.paymentBank ? (
                            <Tag size="sm" colorScheme="teal" variant="subtle" borderRadius="md">
                              <TagLeftIcon as={FiCreditCard} />
                              <TagLabel fontWeight="semibold">{customer.paymentBank}</TagLabel>
                            </Tag>
                          ) : (
                            <Text fontSize="xs" color="gray.400" fontStyle="italic">Unspecified</Text>
                          )}
                          <HStack spacing={1}>
                            {customer.paymentOption && (
                              <Badge colorScheme="purple" variant="subtle" fontSize="2xs" borderRadius="md">
                                {customer.paymentOption}
                              </Badge>
                            )}
                            {customer.fsNumber && (
                              <Badge colorScheme="blue" variant="outline" fontSize="2xs" borderRadius="md">
                                FS: {customer.fsNumber}
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                      </Td>

                      <Td py={3}>
                        <HStack spacing={1.5} wrap="wrap">
                          <Tooltip label={customer.passportPhoto ? "3×4 Passport Photo (Click to preview)" : "Passport Photo Missing"} hasArrow>
                            <Badge
                              colorScheme={customer.passportPhoto ? "blue" : "gray"}
                              variant={customer.passportPhoto ? "solid" : "outline"}
                              fontSize="2xs"
                              px={1.5}
                              py={0.5}
                              borderRadius="md"
                              cursor={customer.passportPhoto ? "pointer" : "default"}
                              onClick={() => {
                                if (customer.passportPhoto) {
                                  setFullImageModal({
                                    isOpen: true,
                                    src: customer.passportPhoto,
                                    title: '3×4 Passport Photo',
                                    subtitle: customer.customerName
                                  });
                                }
                              }}
                            >
                              Photo
                            </Badge>
                          </Tooltip>

                          <Tooltip label={customer.nationalIdFrontImage ? "Front ID (Verified - Click to preview)" : "Front ID Missing"} hasArrow>
                            <Badge
                              colorScheme={customer.nationalIdFrontImage ? "green" : "gray"}
                              variant={customer.nationalIdFrontImage ? "solid" : "outline"}
                              fontSize="2xs"
                              px={1.5}
                              py={0.5}
                              borderRadius="md"
                              cursor={customer.nationalIdFrontImage ? "pointer" : "default"}
                              onClick={() => {
                                if (customer.nationalIdFrontImage) {
                                  setFullImageModal({
                                    isOpen: true,
                                    src: customer.nationalIdFrontImage,
                                    title: 'National ID Card (Front)',
                                    subtitle: customer.customerName
                                  });
                                }
                              }}
                            >
                              Front ID
                            </Badge>
                          </Tooltip>

                          <Tooltip label={customer.nationalIdBackImage ? "Back ID (Verified - Click to preview)" : "Back ID Missing"} hasArrow>
                            <Badge
                              colorScheme={customer.nationalIdBackImage ? "green" : "gray"}
                              variant={customer.nationalIdBackImage ? "solid" : "outline"}
                              fontSize="2xs"
                              px={1.5}
                              py={0.5}
                              borderRadius="md"
                              cursor={customer.nationalIdBackImage ? "pointer" : "default"}
                              onClick={() => {
                                if (customer.nationalIdBackImage) {
                                  setFullImageModal({
                                    isOpen: true,
                                    src: customer.nationalIdBackImage,
                                    title: 'National ID Card (Back)',
                                    subtitle: customer.customerName
                                  });
                                }
                              }}
                            >
                              Back ID
                            </Badge>
                          </Tooltip>

                          <Tooltip label={customer.paymentScreenshot ? "Payment Receipt (Verified - Click to preview)" : "Payment Screenshot Missing"} hasArrow>
                            <Badge
                              colorScheme={customer.paymentScreenshot ? "purple" : "gray"}
                              variant={customer.paymentScreenshot ? "solid" : "outline"}
                              fontSize="2xs"
                              px={1.5}
                              py={0.5}
                              borderRadius="md"
                              cursor={customer.paymentScreenshot ? "pointer" : "default"}
                              onClick={() => {
                                if (customer.paymentScreenshot) {
                                  setFullImageModal({
                                    isOpen: true,
                                    src: customer.paymentScreenshot,
                                    title: 'Payment Screenshot / Receipt',
                                    subtitle: `${customer.customerName} - ${customer.paymentBank || 'Bank'}`
                                  });
                                }
                              }}
                            >
                              Receipt
                            </Badge>
                          </Tooltip>
                        </HStack>
                      </Td>

                      <Td py={3}>
                        <VStack align="flex-start" spacing={0.5}>
                          {customer.phone && (
                            <HStack spacing={1} fontSize="xs" color="gray.600">
                              <FiPhone size={11} />
                              <Text as="a" href={`tel:${customer.phone}`} _hover={{ color: 'teal.500', textDecoration: 'underline' }}>
                                {customer.phone}
                              </Text>
                            </HStack>
                          )}
                          {customer.email && (
                            <HStack spacing={1} fontSize="2xs" color="gray.500">
                              <FiMail size={10} />
                              <Text as="a" href={`mailto:${customer.email}`} _hover={{ color: 'teal.500', textDecoration: 'underline' }}>
                                {customer.email}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </Td>

                      <Td py={3}>
                        <Badge variant="outline" colorScheme="purple" fontSize="2xs" px={2} py={0.5} borderRadius="md">
                          {customer.schedulePreference || 'Regular'}
                        </Badge>
                      </Td>

                      <Td py={3} whiteSpace="nowrap" fontSize="xs" color={subtleText}>
                        {formatDate(customer.date || customer.createdAt)}
                      </Td>

                      <Td py={3} textAlign="center">
                        <HStack spacing={1} justify="center">
                          <Tooltip label="View Details & Documents" hasArrow>
                            <IconButton
                              icon={<InfoIcon />}
                              colorScheme="blue"
                              size="xs"
                              variant="ghost"
                              aria-label="View Details"
                              onClick={() => setDrawerCustomer(customer)}
                            />
                          </Tooltip>

                          <Tooltip label="Edit Followup" hasArrow>
                            <IconButton
                              icon={<EditIcon />}
                              colorScheme="teal"
                              size="xs"
                              variant="ghost"
                              aria-label="Edit Deal"
                              onClick={() => handleOpenEdit(customer)}
                            />
                          </Tooltip>

                          <Tooltip label="Delete" hasArrow>
                            <IconButton
                              icon={<DeleteIcon />}
                              colorScheme="red"
                              size="xs"
                              variant="ghost"
                              aria-label="Delete Deal"
                              onClick={() => handleOpenDelete(customer)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>

        {/* Pagination Footer */}
        {sortedCompleted.length > 0 && (
          <Flex
            p={4}
            align="center"
            justify="space-between"
            borderTopWidth="1px"
            borderColor={borderColor}
            bg={useColorModeValue('gray.50', 'gray.900')}
            flexWrap="wrap"
            gap={3}
          >
            <Flex align="center" gap={2}>
              <Text fontSize="xs" color={subtleText}>
                Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, sortedCompleted.length)} of{' '}
                {sortedCompleted.length} completed deals
              </Text>
              <Select
                size="xs"
                width="90px"
                borderRadius="md"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={15}>15 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </Select>
            </Flex>

            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                isDisabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Text fontSize="xs" fontWeight="semibold">
                Page {safePage} of {totalPages}
              </Text>
              <Button
                size="sm"
                variant="outline"
                isDisabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        )}
      </Card>

      {/* Customer Details Drawer */}
      <Drawer isOpen={!!drawerCustomer} placement="right" onClose={() => setDrawerCustomer(null)} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader bg="teal.600" color="white">
            Completed Customer Deal Profile
          </DrawerHeader>

          <DrawerBody py={6}>
            {drawerCustomer && (
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text fontSize="xs" color={subtleText} textTransform="uppercase" fontWeight="bold">
                    Customer Name
                  </Text>
                  <Heading size="md" color="teal.700" mt={1}>
                    {drawerCustomer.customerName || 'N/A'}
                  </Heading>
                  <HStack mt={2} spacing={2}>
                    <Badge colorScheme="green" variant="solid" px={2} py={0.5} borderRadius="md">
                      Followup Completed
                    </Badge>
                    <Badge colorScheme={getCallBadgeColor(drawerCustomer.callStatus)} variant="solid" px={2} py={0.5} borderRadius="md">
                      {drawerCustomer.callStatus || 'Called'}
                    </Badge>
                  </HStack>
                </Box>

                <SimpleGrid columns={2} spacing={4}>
                  <Box p={3} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color={subtleText} fontWeight="medium">Training Title</Text>
                    <Text fontWeight="bold" fontSize="sm" mt={1}>
                      {drawerCustomer.contactTitle || drawerCustomer.courseName || 'N/A'}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color={subtleText} fontWeight="medium">Deal Value</Text>
                    <Text fontWeight="bold" fontSize="sm" color="teal.600" mt={1}>
                      {formatCurrency(getDealPrice(drawerCustomer))}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color={subtleText} fontWeight="medium">Net Commission</Text>
                    <Text fontWeight="bold" fontSize="sm" color="green.600" mt={1}>
                      {formatCurrency(getNetCommission(drawerCustomer))}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color={subtleText} fontWeight="medium">Payment Option</Text>
                    <Badge colorScheme="purple" fontSize="sm" mt={1} px={2} py={0.5} borderRadius="md">
                      {drawerCustomer.paymentOption || 'Full Payment'}
                    </Badge>
                  </Box>
                  <Box p={3} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color={subtleText} fontWeight="medium">Payment Bank</Text>
                    <Text fontWeight="bold" fontSize="sm" color="teal.700" mt={1}>
                      {drawerCustomer.paymentBank || 'Not Specified'}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color={subtleText} fontWeight="medium">FS Number</Text>
                    <Text fontWeight="bold" fontSize="sm" color="blue.600" mt={1}>
                      {drawerCustomer.fsNumber || 'N/A'}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color={subtleText} fontWeight="medium">Phone Number</Text>
                    <Text fontWeight="bold" fontSize="sm" mt={1}>
                      {drawerCustomer.phone || 'N/A'}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color={subtleText} fontWeight="medium">Email Address</Text>
                    <Text fontWeight="bold" fontSize="sm" mt={1}>
                      {drawerCustomer.email || 'N/A'}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color={subtleText} fontWeight="medium">Schedule</Text>
                    <Text fontWeight="bold" fontSize="sm" mt={1}>
                      {drawerCustomer.schedulePreference || 'Regular'}
                    </Text>
                  </Box>
                  <Box p={3} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color={subtleText} fontWeight="medium">Date</Text>
                    <Text fontWeight="bold" fontSize="sm" mt={1}>
                      {formatDate(drawerCustomer.date || drawerCustomer.createdAt)}
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* Verification Documents Section */}
                <Box p={4} borderRadius="xl" borderWidth="1px" borderColor="teal.200" bg="gray.50">
                  <Flex align="center" justify="space-between" mb={3}>
                    <Flex align="center" gap={2}>
                      <Icon as={FiCreditCard} color="teal.600" />
                      <Text fontWeight="bold" fontSize="sm" color="teal.800">
                        Verification & Payment Documents
                      </Text>
                    </Flex>
                    <Badge colorScheme="green" variant="subtle" fontSize="2xs">
                      Official Proof
                    </Badge>
                  </Flex>
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3}>
                    {/* Passport Photo */}
                    <Box p={2.5} borderRadius="lg" bg="white" borderWidth="1px" borderColor={borderColor} textAlign="center">
                      <Text fontSize="xs" fontWeight="semibold" mb={2}>3×4 Passport Photo</Text>
                      {drawerCustomer.passportPhoto ? (
                        <Box
                          h="100px"
                          borderRadius="md"
                          overflow="hidden"
                          bg="gray.100"
                          cursor="pointer"
                          onClick={() => setFullImageModal({
                            isOpen: true,
                            src: drawerCustomer.passportPhoto,
                            title: '3×4 Passport Photo',
                            subtitle: drawerCustomer.customerName
                          })}
                        >
                          <Image src={drawerCustomer.passportPhoto} alt="Passport Photo" h="100%" w="100%" objectFit="contain" />
                        </Box>
                      ) : (
                        <Box py={6} bg="gray.50" borderRadius="md">
                          <Text fontSize="2xs" color="gray.400">Not Uploaded</Text>
                        </Box>
                      )}
                    </Box>

                    {/* Front ID */}
                    <Box p={2.5} borderRadius="lg" bg="white" borderWidth="1px" borderColor={borderColor} textAlign="center">
                      <Text fontSize="xs" fontWeight="semibold" mb={2}>National ID (Front)</Text>
                      {drawerCustomer.nationalIdFrontImage ? (
                        <Box
                          h="100px"
                          borderRadius="md"
                          overflow="hidden"
                          bg="gray.100"
                          cursor="pointer"
                          onClick={() => setFullImageModal({
                            isOpen: true,
                            src: drawerCustomer.nationalIdFrontImage,
                            title: 'National ID (Front)',
                            subtitle: drawerCustomer.customerName
                          })}
                        >
                          <Image src={drawerCustomer.nationalIdFrontImage} alt="National ID Front" h="100%" w="100%" objectFit="contain" />
                        </Box>
                      ) : (
                        <Box py={6} bg="gray.50" borderRadius="md">
                          <Text fontSize="2xs" color="gray.400">Not Uploaded</Text>
                        </Box>
                      )}
                    </Box>

                    {/* Back ID */}
                    <Box p={2.5} borderRadius="lg" bg="white" borderWidth="1px" borderColor={borderColor} textAlign="center">
                      <Text fontSize="xs" fontWeight="semibold" mb={2}>National ID (Back)</Text>
                      {drawerCustomer.nationalIdBackImage ? (
                        <Box
                          h="100px"
                          borderRadius="md"
                          overflow="hidden"
                          bg="gray.100"
                          cursor="pointer"
                          onClick={() => setFullImageModal({
                            isOpen: true,
                            src: drawerCustomer.nationalIdBackImage,
                            title: 'National ID (Back)',
                            subtitle: drawerCustomer.customerName
                          })}
                        >
                          <Image src={drawerCustomer.nationalIdBackImage} alt="National ID Back" h="100%" w="100%" objectFit="contain" />
                        </Box>
                      ) : (
                        <Box py={6} bg="gray.50" borderRadius="md">
                          <Text fontSize="2xs" color="gray.400">Not Uploaded</Text>
                        </Box>
                      )}
                    </Box>

                    {/* Payment Screenshot */}
                    <Box p={2.5} borderRadius="lg" bg="white" borderWidth="1px" borderColor={borderColor} textAlign="center">
                      <Text fontSize="xs" fontWeight="semibold" mb={2}>Payment Receipt</Text>
                      {drawerCustomer.paymentScreenshot ? (
                        <Box
                          h="100px"
                          borderRadius="md"
                          overflow="hidden"
                          bg="gray.100"
                          cursor="pointer"
                          onClick={() => setFullImageModal({
                            isOpen: true,
                            src: drawerCustomer.paymentScreenshot,
                            title: 'Payment Receipt',
                            subtitle: `${drawerCustomer.customerName} - ${drawerCustomer.paymentBank || 'Bank'}`
                          })}
                        >
                          <Image src={drawerCustomer.paymentScreenshot} alt="Payment Receipt" h="100%" w="100%" objectFit="contain" />
                        </Box>
                      ) : (
                        <Box py={6} bg="gray.50" borderRadius="md">
                          <Text fontSize="2xs" color="gray.400">Not Uploaded</Text>
                        </Box>
                      )}
                    </Box>
                  </SimpleGrid>
                </Box>

                <Box p={3} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <Text fontSize="xs" color={subtleText} fontWeight="medium" mb={1}>Notes</Text>
                  <Text fontSize="sm">{drawerCustomer.note || 'No notes provided.'}</Text>
                </Box>

                {drawerCustomer.supervisorComment && (
                  <Box p={3} borderRadius="lg" bg="orange.50" borderWidth="1px" borderColor="orange.200">
                    <Text fontSize="xs" color="orange.800" fontWeight="bold" mb={1}>Supervisor Comment</Text>
                    <Text fontSize="sm" color="orange.900">{drawerCustomer.supervisorComment}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={() => setDrawerCustomer(null)}>
              Close
            </Button>
            <Button
              colorScheme="teal"
              leftIcon={<EditIcon />}
              onClick={() => {
                const target = drawerCustomer;
                setDrawerCustomer(null);
                handleOpenEdit(target);
              }}
            >
              Edit Deal
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>Edit Completed Deal & Verification</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editCustomer && (
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Customer Name</FormLabel>
                  <Input
                    value={editCustomer.customerName}
                    onChange={(e) => setEditCustomer((prev) => ({ ...prev, customerName: e.target.value }))}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Training Course</FormLabel>
                  <Select
                    value={editCustomer.contactTitle}
                    onChange={(e) => setEditCustomer((prev) => ({ ...prev, contactTitle: e.target.value }))}
                  >
                    <option value="">Select a course</option>
                    {(Array.isArray(courses) ? courses : []).map((course) => (
                      <option key={course._id} value={course.name}>
                        {course.name} - {formatCurrency(course.price)}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <SimpleGrid columns={2} spacing={4} w="100%">
                  <FormControl>
                    <FormLabel fontSize="sm">Phone</FormLabel>
                    <Input
                      value={editCustomer.phone}
                      onChange={(e) => setEditCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Email</FormLabel>
                    <Input
                      value={editCustomer.email}
                      onChange={(e) => setEditCustomer((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={3} spacing={4} w="100%">
                  <FormControl>
                    <FormLabel fontSize="sm">Schedule</FormLabel>
                    <Select
                      value={editCustomer.schedulePreference}
                      onChange={(e) => setEditCustomer((prev) => ({ ...prev, schedulePreference: e.target.value }))}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Weekend">Weekend</option>
                      <option value="Night">Night</option>
                      <option value="Online">Online</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Package Scope</FormLabel>
                    <Select
                      value={editCustomer.packageScope}
                      onChange={(e) => setEditCustomer((prev) => ({ ...prev, packageScope: e.target.value }))}
                    >
                      <option value="Local">Local</option>
                      <option value="International">International</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Call Status</FormLabel>
                    <Select
                      value={editCustomer.callStatus}
                      onChange={(e) => setEditCustomer((prev) => ({ ...prev, callStatus: e.target.value }))}
                    >
                      <option value="Called">Called</option>
                      <option value="2x Called">2x Called</option>
                      <option value="Callback">Callback</option>
                      <option value="Busy">Busy</option>
                      <option value="No Answer">No Answer</option>
                      <option value="Not Called">Not Called</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                {/* Completion Proof Section */}
                <Box w="100%" p={4} borderRadius="xl" borderWidth="1px" borderColor="teal.300" bg="teal.50">
                  <Flex align="center" gap={2} mb={3}>
                    <Icon as={FiCreditCard} color="teal.600" />
                    <Text fontWeight="bold" fontSize="sm" color="teal.900">
                      Payment Details & Verification Documents
                    </Text>
                  </Flex>

                  <VStack spacing={3} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="bold">
                          Payment Option <Text as="span" color="red.500">*</Text>
                        </FormLabel>
                        <Select
                          value={editCustomer.paymentOption || 'Full Payment'}
                          onChange={(e) => setEditCustomer((prev) => ({ ...prev, paymentOption: e.target.value }))}
                          bg="white"
                          size="sm"
                          borderRadius="md"
                        >
                          <option value="Full Payment">Full Payment</option>
                          <option value="Installment">Installment</option>
                          <option value="Partial Payment">Partial Payment</option>
                          <option value="Scholarship / Discounted">Scholarship / Discounted</option>
                          <option value="Sponsored">Sponsored</option>
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="bold">
                          Payment Bank <Text as="span" color="red.500">*</Text>
                        </FormLabel>
                        <Select
                          placeholder="Select Ethiopian Bank"
                          value={editCustomer.paymentBank || ''}
                          onChange={(e) => setEditCustomer((prev) => ({ ...prev, paymentBank: e.target.value }))}
                          bg="white"
                          size="sm"
                          borderRadius="md"
                        >
                          {editCustomer.paymentBank && !ETHIOPIAN_BANKS.includes(editCustomer.paymentBank) && (
                            <option value={editCustomer.paymentBank}>{editCustomer.paymentBank}</option>
                          )}
                          {ETHIOPIAN_BANKS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold">
                          FS Number
                        </FormLabel>
                        <Input
                          placeholder="e.g. FS-12345678"
                          size="sm"
                          bg="white"
                          borderRadius="md"
                          value={editCustomer.fsNumber || ''}
                          onChange={(e) => setEditCustomer((prev) => ({ ...prev, fsNumber: e.target.value }))}
                        />
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3}>
                      <ImageUploadCard
                        label="3×4 Passport Photo"
                        subtitle="PNG, JPG or WEBP"
                        buttonLabel="Upload Photo"
                        value={editCustomer.passportPhoto}
                        onChange={(val) => setEditCustomer((prev) => ({ ...prev, passportPhoto: val }))}
                        onRemove={() => setEditCustomer((prev) => ({ ...prev, passportPhoto: '' }))}
                        onPreview={(val, label) => setFullImageModal({
                          isOpen: true,
                          src: val,
                          title: label,
                          subtitle: editCustomer.customerName
                        })}
                      />

                      <ImageUploadCard
                        label="National ID Front (Optional)"
                        subtitle="PNG, JPG or WEBP"
                        buttonLabel="Upload Front"
                        value={editCustomer.nationalIdFrontImage}
                        onChange={(val) => setEditCustomer((prev) => ({ ...prev, nationalIdFrontImage: val }))}
                        onRemove={() => setEditCustomer((prev) => ({ ...prev, nationalIdFrontImage: '' }))}
                        onPreview={(val, label) => setFullImageModal({
                          isOpen: true,
                          src: val,
                          title: label,
                          subtitle: editCustomer.customerName
                        })}
                      />

                      <ImageUploadCard
                        label="National ID Back (Optional)"
                        subtitle="PNG, JPG or WEBP"
                        buttonLabel="Upload Back"
                        value={editCustomer.nationalIdBackImage}
                        onChange={(val) => setEditCustomer((prev) => ({ ...prev, nationalIdBackImage: val }))}
                        onRemove={() => setEditCustomer((prev) => ({ ...prev, nationalIdBackImage: '' }))}
                        onPreview={(val, label) => setFullImageModal({
                          isOpen: true,
                          src: val,
                          title: label,
                          subtitle: editCustomer.customerName
                        })}
                      />

                      <ImageUploadCard
                        label="Payment Receipt Screenshot (Required)"
                        subtitle="Bank slip or screenshot"
                        buttonLabel="Upload Receipt"
                        isRequired
                        value={editCustomer.paymentScreenshot}
                        onChange={(val) => setEditCustomer((prev) => ({ ...prev, paymentScreenshot: val }))}
                        onRemove={() => setEditCustomer((prev) => ({ ...prev, paymentScreenshot: '' }))}
                        onPreview={(val, label) => setFullImageModal({
                          isOpen: true,
                          src: val,
                          title: label,
                          subtitle: `${editCustomer.customerName} - ${editCustomer.paymentBank || 'Bank'}`
                        })}
                      />
                    </SimpleGrid>
                  </VStack>
                </Box>

                <FormControl>
                  <FormLabel fontSize="sm">Notes</FormLabel>
                  <Textarea
                    value={editCustomer.note}
                    onChange={(e) => setEditCustomer((prev) => ({ ...prev, note: e.target.value }))}
                    rows={3}
                  />
                </FormControl>

                {(userRole === 'supervisor' || userRole === 'admin') && (
                  <FormControl>
                    <FormLabel fontSize="sm">Supervisor Comment</FormLabel>
                    <Textarea
                      value={editCustomer.supervisorComment}
                      onChange={(e) => setEditCustomer((prev) => ({ ...prev, supervisorComment: e.target.value }))}
                      rows={2}
                    />
                  </FormControl>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={deleteCancelRef}
        onClose={() => setIsDeleteOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Completed Followup
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this completed followup record for{' '}
              <Text as="span" fontWeight="bold">
                {deleteCandidate?.customerName || 'this customer'}
              </Text>
              ? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={deleteCancelRef} onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Full-size Image Preview Modal */}
      <Modal
        isOpen={fullImageModal.isOpen}
        onClose={() => setFullImageModal({ isOpen: false, src: '', title: '', subtitle: '' })}
        size="2xl"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="transparent" boxShadow="none" color="white">
          <ModalHeader pb={1}>
            <Text fontSize="lg" fontWeight="bold">{fullImageModal.title}</Text>
            {fullImageModal.subtitle && (
              <Text fontSize="xs" color="gray.300" fontWeight="normal">
                {fullImageModal.subtitle}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={2} display="flex" justifyContent="center" alignItems="center">
            {fullImageModal.src && (
              <Box
                borderRadius="xl"
                overflow="hidden"
                bg="blackAlpha.700"
                p={2}
                borderWidth="1px"
                borderColor="whiteAlpha.300"
                maxH="75vh"
                maxW="100%"
              >
                <Image
                  src={fullImageModal.src}
                  alt={fullImageModal.title || 'Document Proof'}
                  maxH="70vh"
                  maxW="100%"
                  objectFit="contain"
                  borderRadius="lg"
                />
              </Box>
            )}
          </ModalBody>
          <ModalFooter pt={2}>
            {fullImageModal.src && (
              <Button
                as="a"
                href={fullImageModal.src}
                download={`${(fullImageModal.title || 'verification_doc').replace(/\s+/g, '_').toLowerCase()}.jpg`}
                leftIcon={<Icon as={FiDownload} />}
                colorScheme="teal"
                size="sm"
                mr={3}
              >
                Download
              </Button>
            )}
            <Button
              variant="outline"
              colorScheme="whiteAlpha"
              size="sm"
              onClick={() => setFullImageModal({ isOpen: false, src: '', title: '', subtitle: '' })}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FollowupCompletedTable;
