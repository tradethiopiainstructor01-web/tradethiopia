import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  Select,
  Textarea,
  Badge,
  IconButton,
  Flex,
  Text,
  Heading,
  useColorModeValue,
  SimpleGrid,
  VStack,
  HStack,
  Divider,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Checkbox,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Image,
  Icon,
  useToast,
  Tag,
  TagLabel,
  TagLeftIcon,
  Collapse
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, CheckIcon, CloseIcon, InfoIcon, SettingsIcon, DragHandleIcon } from '@chakra-ui/icons';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import {
  FiUploadCloud,
  FiTrash2,
  FiEye,
  FiCreditCard,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
  FiFileText,
  FiAward
} from 'react-icons/fi';
import ETHIOPIAN_BANKS from '../../utils/ethiopianBanks';

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

const TABLE_PREF_KEY = 'salesFollowupCustomerTablePrefs';
const TABLE_PREF_VERSION = 3;
const VIEW_PREF_KEY = 'salesFollowupCustomerViewMode';
const DEFAULT_COLUMNS = [
  { key: 'customerName', label: 'Customer', fullLabel: 'Customer Name', width: 140, required: true },
  { key: 'contactTitle', label: 'Training', fullLabel: 'Training Title', width: 135 },
  { key: 'phone', label: 'Phone', fullLabel: 'Phone', width: 105 },
  { key: 'callStatus', label: 'Call', fullLabel: 'Call Status', width: 90 },
  { key: 'followupStatus', label: 'Status', fullLabel: 'Follow-up Status', width: 95 },
  { key: 'schedulePreference', label: 'Schedule', fullLabel: 'Schedule', width: 85 },
  { key: 'packageScope', label: 'Scope', fullLabel: 'Package Scope', width: 75 },
  { key: 'date', label: 'Date', fullLabel: 'Date', width: 85 },
  { key: 'email', label: 'Email', fullLabel: 'Email', width: 130 },
  { key: 'note', label: 'Notes', fullLabel: 'Notes', width: 115 },
  { key: 'actions', label: 'Actions', fullLabel: 'Actions', width: 85, required: true }
];

const getDefaultColumnPrefs = () => ({
  version: TABLE_PREF_VERSION,
  order: DEFAULT_COLUMNS.map(column => column.key),
  hidden: [],
  widths: DEFAULT_COLUMNS.reduce((acc, column) => ({ ...acc, [column.key]: column.width }), {})
});

const createEmptyCustomer = () => ({
  customerName: '',
  contactTitle: '',
  phone: '',
  callStatus: 'Not Called',
  followupStatus: 'Pending',
  schedulePreference: 'Regular',
  email: '',
  note: '',
  supervisorComment: '',
  packageScope: 'Local',
  passportPhoto: '',
  nationalIdFrontImage: '',
  nationalIdBackImage: '',
  paymentScreenshot: '',
  paymentOption: 'Full Payment',
  paymentBank: '',
  fsNumber: ''
});

const readColumnPrefs = () => {
  const defaults = getDefaultColumnPrefs();

  try {
    const saved = JSON.parse(localStorage.getItem(TABLE_PREF_KEY) || 'null');
    if (!saved) return defaults;
    if (saved.version !== TABLE_PREF_VERSION) return defaults;

    const knownKeys = DEFAULT_COLUMNS.map(column => column.key);
    const savedOrder = Array.isArray(saved.order) ? saved.order.filter(key => knownKeys.includes(key)) : [];
    const order = [...savedOrder, ...knownKeys.filter(key => !savedOrder.includes(key))];
    const hidden = Array.isArray(saved.hidden)
      ? saved.hidden.filter(key => knownKeys.includes(key) && !DEFAULT_COLUMNS.find(column => column.key === key)?.required)
      : [];

    return {
      order,
      hidden,
      version: TABLE_PREF_VERSION,
      widths: { ...defaults.widths, ...(saved.widths || {}) }
    };
  } catch {
    return defaults;
  }
};

const FollowupCustomerTable = ({ customers, courses, onDelete, onUpdate, onAdd }) => {
  const toast = useToast();
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isStatusWarningOpen, setIsStatusWarningOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [isCompletionProofOpen, setIsCompletionProofOpen] = useState(false);
  const [completionProofData, setCompletionProofData] = useState(null);
  const [fullImageModal, setFullImageModal] = useState({ isOpen: false, src: '', title: '', subtitle: '' });
  const [addingRow, setAddingRow] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState(createEmptyCustomer);
  const addFormRef = useRef(null);
  const nameInputRef = useRef(null);
  const [updatedCustomers, setUpdatedCustomers] = useState(new Set());
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [editModalCustomer, setEditModalCustomer] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const deleteCancelRef = useRef(null);

  const [columnPrefs, setColumnPrefs] = useState(readColumnPrefs);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_PREF_KEY) || 'list');
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const warningCancelRef = useRef(null);
  const resizeRef = useRef(null);

  const userToken = localStorage.getItem('userToken');
  const userRole = localStorage.getItem('userRole') || 'agent';
  const headerColor = useColorModeValue('teal.800', 'teal.200');

  // Pagination state for ultra-fast rendering with large customer datasets
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [customers?.length]);

  const totalItems = customers?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCustomers = useMemo(() => {
    if (!Array.isArray(customers)) return [];
    const start = (safeCurrentPage - 1) * pageSize;
    return customers.slice(start, start + pageSize);
  }, [customers, safeCurrentPage, pageSize]);

  const handleOpenEditModal = (customer) => {
    if (!customer) return;
    setEditModalCustomer({
      ...customer,
      customerName: customer.customerName || '',
      contactTitle: customer.contactTitle || customer.courseName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      callStatus: customer.callStatus || 'Not Called',
      followupStatus: customer.followupStatus || 'Pending',
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
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditModalCustomer(null);
  };

  const handleEditModalInputChange = (e) => {
    const { name, value } = e.target;
    setEditModalCustomer(prev => {
      if (!prev) return prev;
      const next = { ...prev, [name]: value };
      if (name === 'contactTitle') {
        const courseDetails = getCourseDetails(value);
        if (courseDetails) {
          next.courseId = courseDetails.id;
          next.coursePrice = courseDetails.price;
        }
      }
      return next;
    });
  };

  const handleSaveEditModal = () => {
    if (!editModalCustomer) return;
    const targetId = editModalCustomer._id || editModalCustomer.id;
    if (!targetId) return;

    if (editModalCustomer.followupStatus === 'Completed') {
      if (!editModalCustomer.paymentBank || !editModalCustomer.paymentBank.trim()) {
        toast({
          title: 'Payment Bank Required',
          description: 'Please select a bank for completed followups.',
          status: 'warning',
          duration: 3500,
          isClosable: true
        });
        return;
      }
      if (!editModalCustomer.paymentScreenshot) {
        toast({
          title: 'Payment Screenshot Required',
          description: 'Please upload payment bank slip / screenshot before marking as Completed.',
          status: 'warning',
          duration: 3500,
          isClosable: true
        });
        return;
      }
    }

    const payload = { ...editModalCustomer };
    if (payload.contactTitle) {
      const courseDetails = getCourseDetails(payload.contactTitle, payload.courseId);
      if (courseDetails) {
        payload.coursePrice = courseDetails.price;
        payload.courseId = courseDetails.id;
        if (payload.followupStatus === 'Completed') {
          payload.commission = calculateCommission(courseDetails.name, courseDetails.price);
        }
      }
    }

    onUpdate(targetId, payload);
    setUpdatedCustomers(prev => new Set(prev).add(targetId));
    setTimeout(() => {
      setUpdatedCustomers(prev => {
        const nextSet = new Set(prev);
        nextSet.delete(targetId);
        return nextSet;
      });
    }, 2000);
    handleCloseEditModal();
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      onDelete(customerToDelete._id || customerToDelete.id);
    }
    setIsDeleteAlertOpen(false);
    setCustomerToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
    setCustomerToDelete(null);
  };

  useEffect(() => {
    localStorage.setItem(TABLE_PREF_KEY, JSON.stringify(columnPrefs));
  }, [columnPrefs]);

  useEffect(() => {
    localStorage.setItem(VIEW_PREF_KEY, viewMode);
  }, [viewMode]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const canUserEditField = (field, role) => {
    // Agents/Sales can edit all fields except supervisorComment
    if (role === 'agent' || role === 'sales') return field !== 'supervisorComment';
    
    // Supervisors and admins can edit all fields
    if (role === 'supervisor' || role === 'admin') return true;
    
    // Default: no editing permissions
    return false;
  };

  // Commission calculation function
  const calculateCommission = (courseName, coursePrice) => {
    // Commission rate: 7%
    const commissionRate = 0.07;
    // Commission tax: 0.075% of commission
    const commissionTaxRate = 0.00075;
    
    // Calculate gross commission
    const price = Number(coursePrice) || 0;
    const grossCommission = price * commissionRate;
    // Calculate commission tax
    const commissionTax = grossCommission * commissionTaxRate;
    // Calculate net commission
    const netCommission = grossCommission - commissionTax;
    
    return {
      grossCommission: parseFloat(grossCommission.toFixed(2)),
      commissionTax: parseFloat(commissionTax.toFixed(2)),
      netCommission: parseFloat(netCommission.toFixed(2))
    };
  };

  // Find course by name and get its price
  const getCourseDetails = (courseName, courseId) => {
    if (!Array.isArray(courses)) return null;
    let course = null;
    if (courseId) {
      course = courses.find(c => c._id === courseId);
    }
    if (!course && courseName) {
      course = courses.find(c => c.name === courseName);
    }
    return course ? { id: course._id, name: course.name, price: Number(course.price) || 0 } : null;
  };

  const getCustomerCoursePrice = (customer) => {
    const courseDetails = getCourseDetails(customer?.contactTitle, customer?.courseId);
    const price = customer?.coursePrice ?? courseDetails?.price;
    const numericPrice = Number(price);

    return Number.isFinite(numericPrice) ? numericPrice : null;
  };

  const formatPrice = (price) => (
    price === null || price === undefined
      ? 'Price not set'
      : `ETB ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  );

  const compactBadgeProps = {
    fontSize: '10px',
    lineHeight: '1.2',
    fontWeight: '700',
    px: 1.5,
    py: 0.5,
    borderRadius: 'full',
    maxW: '100%',
    whiteSpace: 'nowrap'
  };

  const compactSelectProps = {
    size: 'xs',
    fontSize: 'xs',
    h: '26px',
    minH: '26px',
    px: 1
  };

  const columns = DEFAULT_COLUMNS.map(column => ({
    ...column,
    width: columnPrefs.widths[column.key] || column.width,
    isVisible: !columnPrefs.hidden.includes(column.key)
  }));
  const visibleColumns = columnPrefs.order
    .map(key => columns.find(column => column.key === key))
    .filter(column => column && column.isVisible);

  const toggleColumnVisibility = (key) => {
    const column = DEFAULT_COLUMNS.find(item => item.key === key);
    if (column?.required) return;

    setColumnPrefs(prev => {
      const isHidden = prev.hidden.includes(key);
      return {
        ...prev,
        hidden: isHidden ? prev.hidden.filter(item => item !== key) : [...prev.hidden, key]
      };
    });
  };

  const resetColumnLayout = () => {
    setColumnPrefs(getDefaultColumnPrefs());
  };

  const moveColumn = (fromKey, toKey) => {
    if (!fromKey || fromKey === toKey) return;

    setColumnPrefs(prev => {
      const order = [...prev.order];
      const fromIndex = order.indexOf(fromKey);
      const toIndex = order.indexOf(toKey);
      if (fromIndex === -1 || toIndex === -1) return prev;

      order.splice(fromIndex, 1);
      order.splice(toIndex, 0, fromKey);
      return { ...prev, order };
    });
  };

  const startColumnResize = (event, key) => {
    event.preventDefault();
    event.stopPropagation();

    resizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: columnPrefs.widths[key] || DEFAULT_COLUMNS.find(column => column.key === key)?.width || 140
    };

    const handleMouseMove = (moveEvent) => {
      const activeResize = resizeRef.current;
      if (!activeResize) return;
      const nextWidth = Math.max(80, activeResize.startWidth + moveEvent.clientX - activeResize.startX);

      setColumnPrefs(prev => ({
        ...prev,
        widths: { ...prev.widths, [activeResize.key]: nextWidth }
      }));
    };

    const handleMouseUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => () => {
    resizeRef.current = null;
  }, []);

  const handleCellClick = (customer, field) => {
    if (customer._saving) return;
    if (field === 'followupStatus' && (customer.followupStatus || '').toLowerCase() === 'completed') {
      return;
    }
    const canEdit = canUserEditField(field, userRole);
    if (!canEdit) return;
    setEditingCell({ id: customer._id, field });
    setEditValue(customer[field] || '');
  };

  const handleSave = (customer, forcedValue = null, completionProof = null) => {
    if (editingCell) {
      const value = forcedValue !== null ? forcedValue : editValue;

      if (editingCell.field === 'followupStatus' && value === 'Completed' && forcedValue === null) {
        setCompletionProofData({
          customer,
          passportPhoto: customer.passportPhoto || '',
          nationalIdFrontImage: customer.nationalIdFrontImage || '',
          nationalIdBackImage: customer.nationalIdBackImage || '',
          paymentScreenshot: customer.paymentScreenshot || '',
          paymentOption: customer.paymentOption || 'Full Payment',
          paymentBank: customer.paymentBank || '',
          fsNumber: customer.fsNumber || ''
        });
        setIsCompletionProofOpen(true);
        return;
      }

      const updated = {
        ...customer,
        [editingCell.field]: value,
        ...(completionProof || {})
      };

      // If course selection changed, sync courseId/price
      if (editingCell.field === 'contactTitle') {
        const courseDetails = getCourseDetails(editValue);
        if (courseDetails) {
          updated.courseId = courseDetails.id;
          updated.coursePrice = courseDetails.price;
          // If already completed, refresh commission using current price
          if (updated.followupStatus === 'Completed') {
            updated.commission = calculateCommission(courseDetails.name, courseDetails.price);
          }
        }
      }

      // If we're updating the followupStatus to "Completed", calculate commission
      if (editingCell.field === 'followupStatus' && value === 'Completed') {
        const courseDetails = getCourseDetails(customer.contactTitle, customer.courseId);
        if (courseDetails) {
          const commission = calculateCommission(courseDetails.name, courseDetails.price);
          updated.commission = commission;
          updated.coursePrice = courseDetails.price;
          updated.courseId = courseDetails.id;
        }
      }

      onUpdate(customer._id, updated);
      // Track updated customer
      setUpdatedCustomers(prev => new Set(prev).add(customer._id));
      // Clear the indicator after 2 seconds
      setTimeout(() => {
        setUpdatedCustomers(prev => {
          const newSet = new Set(prev);
          newSet.delete(customer._id);
          return newSet;
        });
      }, 2000);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const cancelCompletionProof = () => {
    setIsCompletionProofOpen(false);
    setCompletionProofData(null);
    setEditingCell(null);
    setEditValue('');
  };

  const handleConfirmCompletionProof = () => {
    if (!completionProofData) return;
    const {
      customer,
      passportPhoto,
      nationalIdFrontImage,
      nationalIdBackImage,
      paymentScreenshot,
      paymentOption,
      paymentBank,
      fsNumber
    } = completionProofData;

    if (!paymentBank || !paymentBank.trim()) {
      toast({
        title: 'Payment Bank Required',
        description: 'Please select a bank for completed followups.',
        status: 'warning',
        duration: 3500,
        isClosable: true
      });
      return;
    }
    if (!paymentScreenshot) {
      toast({
        title: 'Payment Screenshot Required',
        description: 'Please upload payment bank slip / screenshot before marking as Completed.',
        status: 'warning',
        duration: 3500,
        isClosable: true
      });
      return;
    }

    const proof = {
      passportPhoto: passportPhoto || '',
      nationalIdFrontImage: nationalIdFrontImage || '',
      nationalIdBackImage: nationalIdBackImage || '',
      paymentScreenshot: paymentScreenshot || '',
      paymentOption: paymentOption || 'Full Payment',
      paymentBank: paymentBank || '',
      fsNumber: fsNumber || ''
    };

    handleSave(customer, 'Completed', proof);
    setIsCompletionProofOpen(false);
    setCompletionProofData(null);
  };

  const handleInputChange = (e) => setEditValue(e.target.value);

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'contactTitle') {
        const courseDetails = getCourseDetails(value);
        if (courseDetails) {
          next.courseId = courseDetails.id;
          next.coursePrice = courseDetails.price;
        }
      }
      return next;
    });
  };

  const closeNewCustomerRow = () => {
    setNewCustomerData(createEmptyCustomer());
    setAddingRow(false);
  };

  const openNewCustomerRow = () => {
    window.dispatchEvent(new Event('sales:new-followup'));
    setNewCustomerData(createEmptyCustomer());
    setAddingRow(true);
    setTimeout(() => {
      addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      nameInputRef.current?.focus();
    }, 150);
  };

  const handleKeyDown = (e, customer) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(customer);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleNewCustomerKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewCustomer();
    } else if (e.key === 'Escape') {
      closeNewCustomerRow();
    }
  };

  const handleAddNewCustomer = () => {
    if (!newCustomerData.customerName || !newCustomerData.customerName.trim()) {
      toast({
        title: 'Customer Name Required',
        description: 'Please enter a name for the customer.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      nameInputRef.current?.focus();
      return;
    }

    const newCustomer = newCustomerData;
    // If the new customer has a "Completed" status, calculate commission
    let customerToAdd = { ...newCustomer };
    
    if (newCustomer.contactTitle) {
      const courseDetails = getCourseDetails(newCustomer.contactTitle);
      if (courseDetails) {
        customerToAdd.coursePrice = courseDetails.price;
        customerToAdd.courseId = courseDetails.id;
        if (newCustomer.followupStatus === 'Completed') {
          const commission = calculateCommission(courseDetails.name, courseDetails.price);
          customerToAdd.commission = commission;
        }
      }
    }
    
    onAdd(customerToAdd);
    closeNewCustomerRow();
  };

  const renderEditableCell = (customer, field, value, type = 'text') => {
    // Check if user can edit this field
    const canEdit = canUserEditField(field, userRole);
    if (!canEdit) {
      // If user cannot edit, just display the value
      return (
        <Td key={field}>
          {value}
        </Td>
      );
    }

    const handleBlur = () => {
      handleSave(customer);
    };

    if (type === 'select') {
      return (
        <Td key={field} p={1}>
          {field === 'contactTitle' ? (
            <Select
              value={editValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              autoFocus
              {...compactSelectProps}
            >
              <option value="">Select Course</option>
              {(Array.isArray(courses) ? courses : []).map(course => (
                <option key={course._id} value={course.name}>
                  {course.name}
                </option>
              ))}
            </Select>
          ) : (
            <Select
              value={editValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              autoFocus
              {...compactSelectProps}
            >
              {field === 'callStatus' ? (
                <>
                  <option value="Called">Called</option>
                  <option value="Not Called">Not Called</option>
                  <option value="Busy">Busy</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Callback">Callback</option>
                  <option value="2x Called">2x Called</option>
                </>
              ) : field === 'schedulePreference' ? (
                <>
                  <option value="Regular">Regular</option>
                  <option value="Weekend">Weekend</option>
                  <option value="Night">Night</option>
                  <option value="Online">Online</option>
                </>
              ) : field === 'packageScope' ? (
                <>
                  <option value="Local">Local</option>
                  <option value="International">International</option>
                </>
              ) : (
                <>
                  <option value="Prospect">Prospect</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Cancelled">Cancelled</option>
                  {/* <option value="Imported">Imported</option> */}
                </>
              )}
            </Select>
          )}
        </Td>
      );
    }
    
    if (type === 'textarea') {
      return (
        <Td key={field} p={1}>
          <Textarea
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e, customer)}
            size="xs"
            rows={2}
            autoFocus
            onBlur={handleBlur}
            fontSize="sm"
            p={1}
          />
        </Td>
      );
    }
    
    return (
      <Td key={field} p={1}>
        <Input
          type={type}
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={(e) => handleKeyDown(e, customer)}
          size="xs"
          autoFocus
          onBlur={handleBlur}
          fontSize="sm"
          p={1}
        />
      </Td>
    );
  };



  const getStatusBadgeVariant = (status, type) => {
    if (type === 'call') {
      switch (status) {
        case 'Called': return 'green';
        case 'Not Called': return 'gray';
        case 'Busy': return 'red';
        case 'No Answer': return 'orange';
        case 'Callback': return 'purple';
        case '2x Called': return 'teal';
        default: return 'gray';
      }
    } else {
      switch (status) {
        case 'Prospect': return 'blue';
        case 'Completed': return 'green';
        case 'Pending': return 'yellow';
        case 'Scheduled': return 'purple';
        case 'Cancelled': return 'red';
        case 'Imported': return 'cyan';
        default: return 'gray';
      }
    }
  };

  const getScopeBadgeVariant = (scope) => {
    switch (scope) {
      case 'Local':
        return 'green';
      case 'International':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getCellBaseProps = (key) => ({
    py: 2,
    px: 2,
    fontSize: 'xs',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  });



  const renderDisplayCell = (customer, field, children, extraProps = {}) => (
    <Td
      key={field}
      onClick={() => handleCellClick(customer, field)}
      _hover={{ cursor: 'pointer', bg: 'teal.50' }}
      {...getCellBaseProps(field)}
      {...extraProps}
    >
      {children}
    </Td>
  );

  const renderCustomerColumnCell = (customer, column) => {
    const { key } = column;

    if (editingCell && editingCell.id === customer._id && editingCell.field === key) {
      if (key === 'contactTitle' || key === 'callStatus' || key === 'followupStatus' || key === 'schedulePreference' || key === 'packageScope') {
        return renderEditableCell(customer, key, customer[key], 'select');
      }
      if (key === 'note') {
        return renderEditableCell(customer, 'note', customer.note, 'textarea');
      }
      return renderEditableCell(customer, key, customer[key]);
    }

    switch (key) {
      case 'customerName':
        return renderDisplayCell(customer, 'customerName', customer.customerName);
      case 'contactTitle':
        return renderDisplayCell(
          customer,
          'contactTitle',
          <Tooltip
            label={`${customer.contactTitle || 'No course selected'} - ${formatPrice(getCustomerCoursePrice(customer))}`}
            hasArrow
            placement="top"
            openDelay={250}
          >
            <Text as="span">{customer.contactTitle || 'Select course'}</Text>
          </Tooltip>
        );
      case 'phone':
        return renderDisplayCell(customer, 'phone', customer.phone);
      case 'callStatus':
        return renderDisplayCell(
          customer,
          'callStatus',
          <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.callStatus, 'call')} {...compactBadgeProps}>
            {customer.callStatus}
          </Badge>
        );
      case 'followupStatus':
        return renderDisplayCell(
          customer,
          'followupStatus',
          <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.followupStatus, 'followup')} {...compactBadgeProps}>
            {customer.followupStatus}
          </Badge>
        );
      case 'schedulePreference':
        return renderDisplayCell(customer, 'schedulePreference', customer.schedulePreference || 'Regular');
      case 'packageScope':
        return renderDisplayCell(
          customer,
          'packageScope',
          <Badge variant="subtle" colorScheme={getScopeBadgeVariant(customer.packageScope || 'Local')} {...compactBadgeProps}>
            {customer.packageScope || 'Local'}
          </Badge>
        );
      case 'date':
        return <Td key="date" {...getCellBaseProps('date')}>{customer.date ? formatDate(customer.date) : 'N/A'}</Td>;
      case 'email':
        return renderDisplayCell(customer, 'email', customer.email);
      case 'note':
        return renderDisplayCell(customer, 'note', customer.note);
      case 'actions':
        if (customer._saving) {
          return (
            <Td key="actions" p={1.5}>
              <Badge colorScheme="teal" variant="subtle" fontSize="2xs">Saving…</Badge>
            </Td>
          );
        }
        return (
          <Td key="actions" p={1} position="relative">
            {updatedCustomers.has(customer._id) && (
              <Box
                position="absolute"
                top="2px"
                left="2px"
                w="6px"
                h="6px"
                bg="green.500"
                borderRadius="50%"
                zIndex="1"
              />
            )}
            <HStack spacing={0.5} justify="center">
              <Tooltip label="Edit customer" hasArrow>
                <IconButton
                  icon={<EditIcon />}
                  colorScheme="teal"
                  size="xs"
                  variant="ghost"
                  onClick={() => handleOpenEditModal(customer)}
                  aria-label="Edit customer"
                />
              </Tooltip>
              <Tooltip label="Delete customer" hasArrow>
                <IconButton
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  size="xs"
                  variant="ghost"
                  onClick={() => handleDeleteClick(customer)}
                  aria-label="Delete customer"
                />
              </Tooltip>
              <Tooltip label="View details" hasArrow>
                <IconButton
                  icon={<InfoIcon />}
                  colorScheme="blue"
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setDrawerCustomer(customer);
                    onOpen();
                  }}
                  aria-label="View details"
                />
              </Tooltip>
            </HStack>
          </Td>
        );
      default:
        return null;
    }
  };

  const renderGridValue = (customer, column) => {
    switch (column.key) {
      case 'customerName':
        return customer.customerName || 'N/A';
      case 'contactTitle':
        return (
          <Tooltip
            label={`${customer.contactTitle || 'No course selected'} - ${formatPrice(getCustomerCoursePrice(customer))}`}
            hasArrow
            placement="top"
            openDelay={250}
          >
            <Text as="span" noOfLines={1}>{customer.contactTitle || 'Select course'}</Text>
          </Tooltip>
        );
      case 'phone':
        return customer.phone || 'N/A';
      case 'callStatus':
        return (
          <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.callStatus, 'call')} {...compactBadgeProps}>
            {customer.callStatus || 'N/A'}
          </Badge>
        );
      case 'followupStatus':
        return (
          <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.followupStatus, 'followup')} {...compactBadgeProps}>
            {customer.followupStatus || 'N/A'}
          </Badge>
        );
      case 'schedulePreference':
        return customer.schedulePreference || 'Regular';
      case 'packageScope':
        return (
          <Badge variant="subtle" colorScheme={getScopeBadgeVariant(customer.packageScope || 'Local')} {...compactBadgeProps}>
            {customer.packageScope || 'Local'}
          </Badge>
        );
      case 'date':
        return customer.date ? formatDate(customer.date) : 'N/A';
      case 'email':
        return customer.email || 'N/A';
      case 'note':
        return customer.note || 'N/A';
      default:
        return null;
    }
  };

  const renderGridCard = (customer) => {
    const fields = visibleColumns.filter(column => column.key !== 'actions');

    return (
      <Box
        key={customer._id}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        bg="white"
        p={3}
        boxShadow="xs"
        transition="border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease"
        _hover={{ borderColor: 'teal.300', boxShadow: 'sm', transform: 'translateY(-1px)' }}
        position="relative"
      >
        {updatedCustomers.has(customer._id) && (
          <Box position="absolute" top={2} right={2} w="8px" h="8px" bg="green.500" borderRadius="50%" />
        )}
        <Flex align="flex-start" gap={2} mb={2}>
          <Box minW={0} flex="1">
            <Text fontWeight="semibold" fontSize="sm" color={headerColor} noOfLines={1}>
              {customer.customerName || 'Unnamed customer'}
            </Text>
            <Text fontSize="xs" color="gray.500" noOfLines={1}>
              {customer.phone || customer.email || 'No contact info'}
            </Text>
          </Box>
          <HStack spacing={1}>
            <Tooltip label="Edit customer" hasArrow>
              <IconButton
                icon={<EditIcon />}
                colorScheme="teal"
                size="xs"
                onClick={() => handleOpenEditModal(customer)}
                aria-label="Edit customer"
                variant="outline"
              />
            </Tooltip>
            <Tooltip label="Delete customer" hasArrow>
              <IconButton
                icon={<DeleteIcon />}
                colorScheme="red"
                size="xs"
                onClick={() => handleDeleteClick(customer)}
                aria-label="Delete customer"
                variant="outline"
              />
            </Tooltip>
            <Tooltip label="View details" hasArrow>
              <IconButton
                icon={<InfoIcon />}
                colorScheme="blue"
                size="xs"
                onClick={() => {
                  setDrawerCustomer(customer);
                  onOpen();
                }}
                aria-label="View details"
                variant="outline"
              />
            </Tooltip>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
          {fields.map(column => (
            <Box
              key={column.key}
              minW={0}
              p={2}
              borderRadius="md"
              bg="gray.50"
            >
              <Text fontSize="2xs" color="gray.500" textTransform="uppercase" fontWeight="bold" mb={0.5} noOfLines={1}>
                {column.label}
              </Text>
              <Text fontSize="xs" color="gray.800" noOfLines={column.key === 'note' ? 2 : 1}>
                {renderGridValue(customer, column)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    );
  };

  if ((!customers || customers.length === 0) && !addingRow) {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Text fontSize="xl" fontWeight="bold" mb={2}>No customers found</Text>
        <Text mb={6}>Get started by adding a new customer.</Text>
        <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={openNewCustomerRow}>
          Add New Customer
        </Button>
      </Box>
    );
  }

  // Resolved course/commission values for drawer (display) fall back to catalog price
  const resolvedCourseDetails = drawerCustomer ? getCourseDetails(drawerCustomer.contactTitle, drawerCustomer.courseId) : null;
  const resolvedCoursePrice = drawerCustomer
    ? (drawerCustomer.coursePrice ?? resolvedCourseDetails?.price ?? null)
    : null;
  const resolvedCommission = drawerCustomer
    ? drawerCustomer.commission || (resolvedCoursePrice != null
        ? calculateCommission(drawerCustomer.contactTitle, resolvedCoursePrice)
        : null)
    : null;

  return (
    <Box w="100%">
      <Flex
        mb={3}
        align={{ base: 'stretch', sm: 'center' }}
        justify="space-between"
        gap={2}
        flexWrap="wrap"
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        px={3}
        py={2}
        boxShadow="xs"
      >
        <Button 
          leftIcon={addingRow ? <CloseIcon boxSize={2} /> : <AddIcon boxSize={2.5} />}
          colorScheme={addingRow ? 'gray' : 'teal'} 
          size="sm"
          borderRadius="lg"
          fontWeight="semibold"
          minW={{ base: '100%', sm: 'auto' }}
          onClick={addingRow ? closeNewCustomerRow : openNewCustomerRow}
        >
          {addingRow ? 'Close Form' : 'Add New Customer'}
        </Button>
        <HStack spacing={2} justify={{ base: 'space-between', sm: 'flex-end' }} w={{ base: '100%', sm: 'auto' }}>
          <HStack spacing={1} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={0.5} bg="gray.50">
            <Button
              size="xs"
              h="28px"
              minW="52px"
              borderRadius="md"
              colorScheme={viewMode === 'list' ? 'teal' : 'gray'}
              variant={viewMode === 'list' ? 'solid' : 'ghost'}
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button
              size="xs"
              h="28px"
              minW="52px"
              borderRadius="md"
              colorScheme={viewMode === 'grid' ? 'teal' : 'gray'}
              variant={viewMode === 'grid' ? 'solid' : 'ghost'}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
          </HStack>
          <Menu closeOnSelect={false}>
            <MenuButton as={Button} leftIcon={<SettingsIcon boxSize={2.5} />} size="sm" variant="outline" borderRadius="lg" minW="100px">
              Columns
            </MenuButton>
            <MenuList minW="220px" maxH="340px" overflowY="auto" zIndex="popover" shadow="lg" borderRadius="xl">
              {columns.map(column => (
                <MenuItem key={column.key} as="div" closeOnSelect={false} py={1.5} px={3}>
                  <Checkbox
                    isChecked={!columnPrefs.hidden.includes(column.key)}
                    isDisabled={column.required}
                    onChange={() => toggleColumnVisibility(column.key)}
                    colorScheme="teal"
                    fontSize="xs"
                  >
                    {column.fullLabel || column.label}
                  </Checkbox>
                </MenuItem>
              ))}
              <Divider my={1} />
              <MenuItem onClick={resetColumnLayout} fontWeight="semibold" fontSize="xs" color="teal.600">
                Reset to default layout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Dedicated Add Customer Follow-up Form Card */}
      <Collapse in={addingRow} animateOpacity>
        <Box
          ref={addFormRef}
          bg="white"
          borderWidth="1.5px"
          borderColor="teal.300"
          borderRadius="xl"
          p={{ base: 4, md: 5 }}
          mb={4}
          boxShadow="sm"
        >
          <Flex justify="space-between" align="center" mb={4} pb={3} borderBottomWidth="1px" borderColor="gray.100">
            <HStack spacing={3}>
              <Flex
                w="34px"
                h="34px"
                borderRadius="lg"
                bg="teal.50"
                color="teal.600"
                align="center"
                justify="center"
                borderWidth="1px"
                borderColor="teal.200"
              >
                <AddIcon boxSize={3} />
              </Flex>
              <Box>
                <Heading size="xs" color="gray.800" fontWeight="bold">
                  Add New Customer Follow-up
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  Enter prospect contact details, training preference, and initial status.
                </Text>
              </Box>
            </HStack>
            <IconButton
              icon={<CloseIcon boxSize={2} />}
              size="xs"
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'gray.700', bg: 'gray.100' }}
              onClick={closeNewCustomerRow}
              aria-label="Close form"
            />
          </Flex>

          <VStack spacing={4} align="stretch">
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                  Customer Name
                </FormLabel>
                <Input
                  ref={nameInputRef}
                  name="customerName"
                  value={newCustomerData.customerName || ''}
                  onChange={handleNewCustomerChange}
                  onKeyDown={handleNewCustomerKeyDown}
                  placeholder="e.g. Abebe Kebede"
                  size="sm"
                  borderRadius="md"
                  focusBorderColor="teal.500"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                  Phone Number
                </FormLabel>
                <Input
                  name="phone"
                  value={newCustomerData.phone || ''}
                  onChange={handleNewCustomerChange}
                  onKeyDown={handleNewCustomerKeyDown}
                  placeholder="e.g. 0911234567"
                  size="sm"
                  borderRadius="md"
                  focusBorderColor="teal.500"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                  Email Address
                </FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={newCustomerData.email || ''}
                  onChange={handleNewCustomerChange}
                  onKeyDown={handleNewCustomerKeyDown}
                  placeholder="e.g. customer@example.com"
                  size="sm"
                  borderRadius="md"
                  focusBorderColor="teal.500"
                />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                  Training Course
                </FormLabel>
                <Select
                  name="contactTitle"
                  value={newCustomerData.contactTitle || ''}
                  onChange={handleNewCustomerChange}
                  onKeyDown={handleNewCustomerKeyDown}
                  size="sm"
                  borderRadius="md"
                  focusBorderColor="teal.500"
                >
                  <option value="">Select a course</option>
                  {(Array.isArray(courses) ? courses : []).map(course => (
                    <option key={course._id} value={course.name}>
                      {course.name} - {formatPrice(Number(course.price) || 0)}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                  Schedule Preference
                </FormLabel>
                <Select
                  name="schedulePreference"
                  value={newCustomerData.schedulePreference || 'Regular'}
                  onChange={handleNewCustomerChange}
                  onKeyDown={handleNewCustomerKeyDown}
                  size="sm"
                  borderRadius="md"
                  focusBorderColor="teal.500"
                >
                  <option value="Regular">Regular</option>
                  <option value="Weekend">Weekend</option>
                  <option value="Night">Night</option>
                  <option value="Online">Online</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                  Package Scope
                </FormLabel>
                <Select
                  name="packageScope"
                  value={newCustomerData.packageScope || 'Local'}
                  onChange={handleNewCustomerChange}
                  onKeyDown={handleNewCustomerKeyDown}
                  size="sm"
                  borderRadius="md"
                  focusBorderColor="teal.500"
                >
                  <option value="Local">Local</option>
                  <option value="International">International</option>
                </Select>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                  Call Status
                </FormLabel>
                <Select
                  name="callStatus"
                  value={newCustomerData.callStatus || 'Not Called'}
                  onChange={handleNewCustomerChange}
                  onKeyDown={handleNewCustomerKeyDown}
                  size="sm"
                  borderRadius="md"
                  focusBorderColor="teal.500"
                >
                  <option value="Not Called">Not Called</option>
                  <option value="Called">Called</option>
                  <option value="Busy">Busy</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Callback">Callback</option>
                  <option value="2x Called">2x Called</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                  Follow-up Status
                </FormLabel>
                <Select
                  name="followupStatus"
                  value={newCustomerData.followupStatus || 'Pending'}
                  onChange={handleNewCustomerChange}
                  onKeyDown={handleNewCustomerKeyDown}
                  size="sm"
                  borderRadius="md"
                  focusBorderColor="teal.500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Imported">Imported</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                  Follow-up Date
                </FormLabel>
                <Input
                  name="date"
                  type="date"
                  value={newCustomerData.date ? newCustomerData.date.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  onChange={handleNewCustomerChange}
                  onKeyDown={handleNewCustomerKeyDown}
                  size="sm"
                  borderRadius="md"
                  focusBorderColor="teal.500"
                />
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="bold" color="gray.700">
                Notes & Remarks
              </FormLabel>
              <Textarea
                name="note"
                value={newCustomerData.note || ''}
                onChange={handleNewCustomerChange}
                placeholder="Enter discussion points, client requests, or callback notes..."
                size="sm"
                rows={2}
                borderRadius="md"
                focusBorderColor="teal.500"
              />
            </FormControl>

            <Flex justify="flex-end" gap={3} pt={2} borderTopWidth="1px" borderColor="gray.100">
              <Button
                size="sm"
                variant="ghost"
                colorScheme="gray"
                onClick={closeNewCustomerRow}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                colorScheme="teal"
                leftIcon={<CheckIcon boxSize={2.5} />}
                onClick={handleAddNewCustomer}
                fontWeight="semibold"
              >
                Save Customer
              </Button>
            </Flex>
          </VStack>
        </Box>
      </Collapse>
      {viewMode === 'list' ? (
      <Box
        overflowX="auto"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="xs"
        bg="white"
      >
      <Table variant="simple" size="sm" w="100%" sx={{ tableLayout: 'fixed' }}>
        <colgroup>
          {visibleColumns.map(column => (
            <col key={column.key} style={{ width: `${column.width}px` }} />
          ))}
        </colgroup>
        <Thead>
          <Tr bgGradient="linear(to-r, #0f766e, #115e59)">
            {visibleColumns.map(column => (
              <Th
                key={column.key}
                color="white"
                fontWeight="700"
                fontSize="11px"
                letterSpacing="0.04em"
                textTransform="uppercase"
                py={2.5}
                px={2}
                position="relative"
                userSelect="none"
                draggable
                opacity={draggedColumn === column.key ? 0.75 : 1}
                cursor={draggedColumn === column.key ? 'grabbing' : 'grab'}
                bg={dragOverColumn === column.key && draggedColumn !== column.key ? '#134e4a' : undefined}
                boxShadow={dragOverColumn === column.key && draggedColumn !== column.key ? 'inset 3px 0 0 rgba(255,255,255,0.95)' : 'none'}
                transform={draggedColumn === column.key ? 'translateY(-1px)' : 'translateY(0)'}
                transition="background 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease, transform 0.18s ease"
                onDragStart={(event) => {
                  setDraggedColumn(column.key);
                  setDragOverColumn(column.key);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDragOverColumn(column.key);
                }}
                onDragEnter={() => setDragOverColumn(column.key)}
                onDrop={() => {
                  moveColumn(draggedColumn, column.key);
                  setDraggedColumn(null);
                  setDragOverColumn(null);
                }}
                onDragLeave={() => {
                  if (dragOverColumn === column.key) {
                    setDragOverColumn(null);
                  }
                }}
                onDragEnd={() => {
                  setDraggedColumn(null);
                  setDragOverColumn(null);
                }}
              >
                <Flex align="center" minW={0} pointerEvents="none">
                  <Text
                    as="span"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                    title={column.fullLabel || column.label}
                  >
                    {column.label}
                  </Text>
                </Flex>
                <Box
                  position="absolute"
                  top={0}
                  right={0}
                  w="6px"
                  h="100%"
                  cursor="col-resize"
                  _hover={{ bg: 'whiteAlpha.400' }}
                  onMouseDown={(event) => startColumnResize(event, column.key)}
                />
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>


          {paginatedCustomers && paginatedCustomers.map(customer => (
            <Tr 
              key={customer._id} 
              _hover={{ bg: 'gray.50' }}
              transition="background 0.2s"
              fontSize="sm"
              borderBottom="1px"
              borderColor="gray.200"
            >
              {visibleColumns.map(column => renderCustomerColumnCell(customer, column))}
            </Tr>
          ))}
        </Tbody>
      </Table>
      </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
          {paginatedCustomers && paginatedCustomers.map(renderGridCard)}
        </SimpleGrid>
      )}

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align="center"
          p={3}
          mt={3}
          bg={useColorModeValue('white', 'gray.800')}
          borderRadius="lg"
          border="1px solid"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          shadow="sm"
          gap={3}
        >
          <HStack spacing={3} flexWrap="wrap">
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              Showing <Text as="span" fontWeight="bold" color="teal.600">{((safeCurrentPage - 1) * pageSize) + 1}</Text> - <Text as="span" fontWeight="bold" color="teal.600">{Math.min(safeCurrentPage * pageSize, totalItems)}</Text> of <Text as="span" fontWeight="bold">{totalItems}</Text> entries
            </Text>
            <HStack spacing={1}>
              <Text fontSize="xs" color="gray.500">Rows per page:</Text>
              <Select
                size="sm"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                w="75px"
                borderRadius="md"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </Select>
            </HStack>
          </HStack>

          <HStack spacing={1}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(1)}
              isDisabled={safeCurrentPage === 1}
              title="First Page"
              px={2}
            >
              «
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              isDisabled={safeCurrentPage === 1}
              px={3}
            >
              ‹ Prev
            </Button>

            <HStack spacing={1} px={2}>
              <Text fontSize="sm" fontWeight="semibold">
                Page {safeCurrentPage} of {totalPages}
              </Text>
            </HStack>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              isDisabled={safeCurrentPage >= totalPages}
              px={3}
            >
              Next ›
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(totalPages)}
              isDisabled={safeCurrentPage >= totalPages}
              title="Last Page"
              px={2}
            >
              »
            </Button>
          </HStack>
        </Flex>
      )}

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={deleteCancelRef}
        onClose={handleCancelDelete}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Customer Follow-up
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete <strong>{customerToDelete?.customerName || 'this customer'}</strong>? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={deleteCancelRef} onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Completed Status Verification & Payment Modal */}
      <Modal
        isOpen={isCompletionProofOpen}
        onClose={cancelCompletionProof}
        size="2xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent borderRadius="xl" overflow="hidden">
          <ModalHeader bg="teal.600" color="white" py={4}>
            <Flex align="center" gap={2}>
              <Icon as={FiCheckCircle} boxSize={5} />
              <Box>
                <Text fontSize="md" fontWeight="bold">Complete Sale & Verification Proof</Text>
                <Text fontSize="xs" fontWeight="normal" color="teal.100">
                  Please submit the bank slip, ID front, and ID back for this completed follow-up.
                </Text>
              </Box>
            </Flex>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={5} px={6} maxH="75vh" overflowY="auto">
            {completionProofData && (
              <VStack spacing={5} align="stretch">
                <Box p={3} bg="teal.50" borderRadius="lg" border="1px solid" borderColor="teal.200">
                  <Text fontSize="sm" fontWeight="bold" color="teal.800">
                    Customer: {completionProofData.customer?.customerName || 'N/A'}
                  </Text>
                  <Text fontSize="xs" color="teal.700" mt={0.5}>
                    Training: {completionProofData.customer?.contactTitle || 'General Training'}
                  </Text>
                </Box>

                {/* Payment Option, Bank & FS Number row */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold">
                      Payment Option <Text as="span" color="red.500">*</Text>
                    </FormLabel>
                    <Select
                      value={completionProofData.paymentOption || 'Full Payment'}
                      onChange={(e) => setCompletionProofData(prev => ({ ...prev, paymentOption: e.target.value }))}
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
                      value={completionProofData.paymentBank || ''}
                      onChange={(e) => setCompletionProofData(prev => ({ ...prev, paymentBank: e.target.value }))}
                      placeholder="Select Ethiopian Bank"
                      size="sm"
                      borderRadius="md"
                    >
                      {completionProofData.paymentBank && !ETHIOPIAN_BANKS.includes(completionProofData.paymentBank) && (
                        <option value={completionProofData.paymentBank}>{completionProofData.paymentBank}</option>
                      )}
                      {ETHIOPIAN_BANKS.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
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
                      borderRadius="md"
                      value={completionProofData.fsNumber || ''}
                      onChange={(e) => setCompletionProofData(prev => ({ ...prev, fsNumber: e.target.value }))}
                    />
                  </FormControl>
                </SimpleGrid>

                {/* 4 Image Upload Cards */}
                <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3}>
                  <ImageUploadCard
                    label="3×4 Passport Photo"
                    subtitle="PNG, JPG or WEBP"
                    buttonLabel="Upload Photo"
                    value={completionProofData.passportPhoto}
                    onChange={(val) => setCompletionProofData(prev => ({ ...prev, passportPhoto: val }))}
                    onRemove={() => setCompletionProofData(prev => ({ ...prev, passportPhoto: '' }))}
                    onPreview={(src, title) => setFullImageModal({
                      isOpen: true,
                      src,
                      title,
                      subtitle: completionProofData.customer?.customerName
                    })}
                  />

                  <ImageUploadCard
                    label="National ID Front (Optional)"
                    subtitle="PNG, JPG or WEBP"
                    buttonLabel="Upload Front"
                    value={completionProofData.nationalIdFrontImage}
                    onChange={(val) => setCompletionProofData(prev => ({ ...prev, nationalIdFrontImage: val }))}
                    onRemove={() => setCompletionProofData(prev => ({ ...prev, nationalIdFrontImage: '' }))}
                    onPreview={(src, title) => setFullImageModal({
                      isOpen: true,
                      src,
                      title,
                      subtitle: completionProofData.customer?.customerName
                    })}
                  />

                  <ImageUploadCard
                    label="National ID Back (Optional)"
                    subtitle="PNG, JPG or WEBP"
                    buttonLabel="Upload Back"
                    value={completionProofData.nationalIdBackImage}
                    onChange={(val) => setCompletionProofData(prev => ({ ...prev, nationalIdBackImage: val }))}
                    onRemove={() => setCompletionProofData(prev => ({ ...prev, nationalIdBackImage: '' }))}
                    onPreview={(src, title) => setFullImageModal({
                      isOpen: true,
                      src,
                      title,
                      subtitle: completionProofData.customer?.customerName
                    })}
                  />

                  <ImageUploadCard
                    label="Payment Receipt Screenshot (Required)"
                    subtitle="Bank slip or screenshot"
                    buttonLabel="Upload Receipt"
                    isRequired
                    value={completionProofData.paymentScreenshot}
                    onChange={(val) => setCompletionProofData(prev => ({ ...prev, paymentScreenshot: val }))}
                    onRemove={() => setCompletionProofData(prev => ({ ...prev, paymentScreenshot: '' }))}
                    onPreview={(src, title) => setFullImageModal({
                      isOpen: true,
                      src,
                      title,
                      subtitle: `${completionProofData.customer?.customerName || 'Customer'} - ${completionProofData.paymentBank || 'Bank'}`
                    })}
                  />
                </SimpleGrid>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg="gray.50" borderTopWidth="1px" borderColor="gray.200">
            <Button
              variant="outline"
              mr={3}
              size="sm"
              onClick={cancelCompletionProof}
            >
              Cancel
            </Button>
            <Button
              colorScheme="green"
              size="sm"
              leftIcon={<Icon as={FiCheckCircle} />}
              onClick={handleConfirmCompletionProof}
            >
              Confirm & Complete Sale
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} size="2xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl" overflow="hidden">
          <ModalHeader bg="teal.500" color="white">
            Edit Customer Follow-up
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={4} maxH="75vh" overflowY="auto">
            {editModalCustomer && (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="bold">Customer Name</FormLabel>
                    <Input
                      name="customerName"
                      size="sm"
                      value={editModalCustomer.customerName || ''}
                      onChange={handleEditModalInputChange}
                      placeholder="Customer Name"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Training Title</FormLabel>
                    <Select
                      name="contactTitle"
                      size="sm"
                      value={editModalCustomer.contactTitle || ''}
                      onChange={handleEditModalInputChange}
                    >
                      <option value="">Select a course</option>
                      {(Array.isArray(courses) ? courses : []).map(course => (
                        <option key={course._id} value={course.name}>
                          {course.name} - {formatPrice(Number(course.price) || 0)}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Phone</FormLabel>
                    <Input
                      name="phone"
                      size="sm"
                      value={editModalCustomer.phone || ''}
                      onChange={handleEditModalInputChange}
                      placeholder="Phone Number"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Email</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      size="sm"
                      value={editModalCustomer.email || ''}
                      onChange={handleEditModalInputChange}
                      placeholder="Email Address"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Call Status</FormLabel>
                    <Select
                      name="callStatus"
                      size="sm"
                      value={editModalCustomer.callStatus || 'Not Called'}
                      onChange={handleEditModalInputChange}
                    >
                      <option value="Called">Called</option>
                      <option value="Not Called">Not Called</option>
                      <option value="Busy">Busy</option>
                      <option value="No Answer">No Answer</option>
                      <option value="Callback">Callback</option>
                      <option value="2x Called">2x Called</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Follow-up Status</FormLabel>
                    <Select
                      name="followupStatus"
                      size="sm"
                      value={editModalCustomer.followupStatus || 'Pending'}
                      onChange={handleEditModalInputChange}
                    >
                      <option value="Prospect">Prospect</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Schedule Preference</FormLabel>
                    <Select
                      name="schedulePreference"
                      size="sm"
                      value={editModalCustomer.schedulePreference || 'Regular'}
                      onChange={handleEditModalInputChange}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Weekend">Weekend</option>
                      <option value="Night">Night</option>
                      <option value="Online">Online</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Package Scope</FormLabel>
                    <Select
                      name="packageScope"
                      size="sm"
                      value={editModalCustomer.packageScope || 'Local'}
                      onChange={handleEditModalInputChange}
                    >
                      <option value="Local">Local</option>
                      <option value="International">International</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Date</FormLabel>
                    <Input
                      name="date"
                      type="date"
                      size="sm"
                      value={editModalCustomer.date ? editModalCustomer.date.slice(0, 10) : ''}
                      onChange={handleEditModalInputChange}
                    />
                  </FormControl>
                </SimpleGrid>

                {/* If Completed Status, require Bank, Payment details & Documents */}
                {editModalCustomer.followupStatus === 'Completed' && (
                  <Box p={4} borderRadius="lg" bg="teal.50" borderWidth="1px" borderColor="teal.200">
                    <Flex align="center" gap={2} mb={3}>
                      <Icon as={FiAward} color="teal.600" />
                      <Text fontSize="sm" fontWeight="bold" color="teal.800">
                        Completed Sale Verification & Payment Details
                      </Text>
                    </Flex>

                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="bold">
                          Payment Option <Text as="span" color="red.500">*</Text>
                        </FormLabel>
                        <Select
                          name="paymentOption"
                          size="sm"
                          value={editModalCustomer.paymentOption || 'Full Payment'}
                          onChange={handleEditModalInputChange}
                          bg="white"
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
                          name="paymentBank"
                          size="sm"
                          value={editModalCustomer.paymentBank || ''}
                          onChange={handleEditModalInputChange}
                          placeholder="Select Ethiopian Bank"
                          bg="white"
                          borderRadius="md"
                        >
                          {editModalCustomer.paymentBank && !ETHIOPIAN_BANKS.includes(editModalCustomer.paymentBank) && (
                            <option value={editModalCustomer.paymentBank}>{editModalCustomer.paymentBank}</option>
                          )}
                          {ETHIOPIAN_BANKS.map(bank => (
                            <option key={bank} value={bank}>{bank}</option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="bold">
                          FS Number
                        </FormLabel>
                        <Input
                          name="fsNumber"
                          placeholder="e.g. FS-12345678"
                          size="sm"
                          borderRadius="md"
                          bg="white"
                          value={editModalCustomer.fsNumber || ''}
                          onChange={handleEditModalInputChange}
                        />
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3}>
                      <ImageUploadCard
                        label="3×4 Passport Photo"
                        subtitle="PNG, JPG or WEBP"
                        buttonLabel="Upload Photo"
                        value={editModalCustomer.passportPhoto}
                        onChange={(val) => setEditModalCustomer(prev => ({ ...prev, passportPhoto: val }))}
                        onRemove={() => setEditModalCustomer(prev => ({ ...prev, passportPhoto: '' }))}
                        onPreview={(src, title) => setFullImageModal({
                          isOpen: true,
                          src,
                          title,
                          subtitle: editModalCustomer.customerName
                        })}
                      />

                      <ImageUploadCard
                        label="National ID Front (Optional)"
                        subtitle="PNG, JPG or WEBP"
                        buttonLabel="Upload Front"
                        value={editModalCustomer.nationalIdFrontImage}
                        onChange={(val) => setEditModalCustomer(prev => ({ ...prev, nationalIdFrontImage: val }))}
                        onRemove={() => setEditModalCustomer(prev => ({ ...prev, nationalIdFrontImage: '' }))}
                        onPreview={(src, title) => setFullImageModal({
                          isOpen: true,
                          src,
                          title,
                          subtitle: editModalCustomer.customerName
                        })}
                      />

                      <ImageUploadCard
                        label="National ID Back (Optional)"
                        subtitle="PNG, JPG or WEBP"
                        buttonLabel="Upload Back"
                        value={editModalCustomer.nationalIdBackImage}
                        onChange={(val) => setEditModalCustomer(prev => ({ ...prev, nationalIdBackImage: val }))}
                        onRemove={() => setEditModalCustomer(prev => ({ ...prev, nationalIdBackImage: '' }))}
                        onPreview={(src, title) => setFullImageModal({
                          isOpen: true,
                          src,
                          title,
                          subtitle: editModalCustomer.customerName
                        })}
                      />

                      <ImageUploadCard
                        label="Payment Receipt Screenshot (Required)"
                        subtitle="Bank slip or screenshot"
                        buttonLabel="Upload Receipt"
                        isRequired
                        value={editModalCustomer.paymentScreenshot}
                        onChange={(val) => setEditModalCustomer(prev => ({ ...prev, paymentScreenshot: val }))}
                        onRemove={() => setEditModalCustomer(prev => ({ ...prev, paymentScreenshot: '' }))}
                        onPreview={(src, title) => setFullImageModal({
                          isOpen: true,
                          src,
                          title,
                          subtitle: editModalCustomer.customerName
                        })}
                      />
                    </SimpleGrid>
                  </Box>
                )}

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">Customer Notes</FormLabel>
                  <Textarea
                    name="note"
                    size="sm"
                    rows={3}
                    value={editModalCustomer.note || ''}
                    onChange={handleEditModalInputChange}
                    placeholder="Enter follow-up notes..."
                  />
                </FormControl>

                {canUserEditField('supervisorComment', userRole) && (
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Supervisor Comment</FormLabel>
                    <Textarea
                      name="supervisorComment"
                      size="sm"
                      rows={2}
                      value={editModalCustomer.supervisorComment || ''}
                      onChange={handleEditModalInputChange}
                      placeholder="Supervisor feedback or comments..."
                    />
                  </FormControl>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg="gray.50">
            <Button variant="outline" mr={3} size="sm" onClick={handleCloseEditModal}>
              Cancel
            </Button>
            <Button colorScheme="teal" size="sm" onClick={handleSaveEditModal}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Customer Details Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader bg="teal.500" color="white">
            Customer Details
          </DrawerHeader>
          <DrawerBody p={0}>
            {drawerCustomer && (
              <VStack align="stretch" spacing={0} divider={<Divider />}>
                {/* Basic Information Section */}
                <Box p={6}>
                  <Heading as="h3" size="md" mb={4} color="teal.600" pb={2} borderBottom="1px" borderColor="gray.200">
                    Basic Information
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Customer Name</Text>
                      <Text fontSize="md">{drawerCustomer.customerName || 'N/A'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Training Title</Text>
                      <Text fontSize="md">{drawerCustomer.contactTitle || 'N/A'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Course Price</Text>
                      <Text fontSize="md">
                        {resolvedCoursePrice != null ? `ETB ${Number(resolvedCoursePrice).toLocaleString()}` : 'Add price in catalog'}
                      </Text>
                      {resolvedCoursePrice == null && (
                        <Text fontSize="xs" color="orange.600">Set a course price in Finance to enable commission.</Text>
                      )}
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Phone</Text>
                      <Text fontSize="md">{drawerCustomer.phone || 'N/A'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Email</Text>
                      <Text fontSize="md">{drawerCustomer.email || 'N/A'}</Text>
                    </Box>
                    {drawerCustomer.paymentOption && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Payment Option</Text>
                        <Badge colorScheme="purple" fontSize="sm" px={2} py={0.5} borderRadius="md">
                          {drawerCustomer.paymentOption}
                        </Badge>
                      </Box>
                    )}
                    {drawerCustomer.paymentBank && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Payment Bank</Text>
                        <Tag size="md" colorScheme="teal" borderRadius="full">
                          <TagLeftIcon as={FiCreditCard} />
                          <TagLabel>{drawerCustomer.paymentBank}</TagLabel>
                        </Tag>
                      </Box>
                    )}
                    {drawerCustomer.fsNumber && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>FS Number</Text>
                        <Tag size="md" colorScheme="blue" borderRadius="md">
                          <TagLeftIcon as={FiFileText} />
                          <TagLabel fontWeight="bold">{drawerCustomer.fsNumber}</TagLabel>
                        </Tag>
                      </Box>
                    )}
                  </SimpleGrid>
                </Box>

                {/* Status Information Section */}
                <Box p={6} bg="gray.50">
                  <Heading as="h3" size="md" mb={4} color="teal.600" pb={2} borderBottom="1px" borderColor="gray.300">
                    Status Information
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Call Status</Text>
                      <Badge variant="solid" colorScheme={getStatusBadgeVariant(drawerCustomer.callStatus, 'call')} fontSize="md">
                        {drawerCustomer.callStatus || 'N/A'}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Follow-up Status</Text>
                      <Badge variant="solid" colorScheme={getStatusBadgeVariant(drawerCustomer.followupStatus, 'followup')} fontSize="md">
                        {drawerCustomer.followupStatus || 'N/A'}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Schedule Preference</Text>
                      <Text fontSize="md">{drawerCustomer.schedulePreference || 'N/A'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Date</Text>
                      <Text fontSize="md">{drawerCustomer.date ? formatDate(drawerCustomer.date) : 'N/A'}</Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Verification & Payment Documents Section */}
                {(drawerCustomer.passportPhoto || drawerCustomer.nationalIdFrontImage || drawerCustomer.nationalIdBackImage || drawerCustomer.paymentScreenshot || drawerCustomer.paymentBank || drawerCustomer.fsNumber) && (
                  <Box p={6}>
                    <Heading as="h3" size="md" mb={4} color="teal.600" pb={2} borderBottom="1px" borderColor="gray.200">
                      Verification & Payment Documents
                    </Heading>
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
                      <Box p={3} borderRadius="lg" borderWidth="1px" borderColor="gray.200" bg="gray.50">
                        <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>3×4 Passport Photo</Text>
                        {drawerCustomer.passportPhoto ? (
                          <Box
                            h="120px"
                            borderRadius="md"
                            overflow="hidden"
                            cursor="pointer"
                            bg="blackAlpha.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            onClick={() => setFullImageModal({
                              isOpen: true,
                              src: drawerCustomer.passportPhoto,
                              title: '3×4 Passport Photo',
                              subtitle: drawerCustomer.customerName
                            })}
                          >
                            <Image src={drawerCustomer.passportPhoto} alt="Passport Photo" maxH="100%" maxW="100%" objectFit="contain" />
                          </Box>
                        ) : (
                          <Text fontSize="xs" color="gray.400" fontStyle="italic">Not uploaded</Text>
                        )}
                      </Box>

                      <Box p={3} borderRadius="lg" borderWidth="1px" borderColor="gray.200" bg="gray.50">
                        <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>National ID (Front)</Text>
                        {drawerCustomer.nationalIdFrontImage ? (
                          <Box
                            h="120px"
                            borderRadius="md"
                            overflow="hidden"
                            cursor="pointer"
                            bg="blackAlpha.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            onClick={() => setFullImageModal({
                              isOpen: true,
                              src: drawerCustomer.nationalIdFrontImage,
                              title: 'National ID (Front)',
                              subtitle: drawerCustomer.customerName
                            })}
                          >
                            <Image src={drawerCustomer.nationalIdFrontImage} alt="National ID Front" maxH="100%" maxW="100%" objectFit="contain" />
                          </Box>
                        ) : (
                          <Text fontSize="xs" color="gray.400" fontStyle="italic">Not uploaded</Text>
                        )}
                      </Box>

                      <Box p={3} borderRadius="lg" borderWidth="1px" borderColor="gray.200" bg="gray.50">
                        <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>National ID (Back)</Text>
                        {drawerCustomer.nationalIdBackImage ? (
                          <Box
                            h="120px"
                            borderRadius="md"
                            overflow="hidden"
                            cursor="pointer"
                            bg="blackAlpha.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            onClick={() => setFullImageModal({
                              isOpen: true,
                              src: drawerCustomer.nationalIdBackImage,
                              title: 'National ID (Back)',
                              subtitle: drawerCustomer.customerName
                            })}
                          >
                            <Image src={drawerCustomer.nationalIdBackImage} alt="National ID Back" maxH="100%" maxW="100%" objectFit="contain" />
                          </Box>
                        ) : (
                          <Text fontSize="xs" color="gray.400" fontStyle="italic">Not uploaded</Text>
                        )}
                      </Box>

                      <Box p={3} borderRadius="lg" borderWidth="1px" borderColor="gray.200" bg="gray.50">
                        <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>Payment Receipt</Text>
                        {drawerCustomer.paymentScreenshot ? (
                          <Box
                            h="120px"
                            borderRadius="md"
                            overflow="hidden"
                            cursor="pointer"
                            bg="blackAlpha.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            onClick={() => setFullImageModal({
                              isOpen: true,
                              src: drawerCustomer.paymentScreenshot,
                              title: 'Payment Receipt',
                              subtitle: `${drawerCustomer.customerName} - ${drawerCustomer.paymentBank || 'Bank'}`
                            })}
                          >
                            <Image src={drawerCustomer.paymentScreenshot} alt="Payment Receipt" maxH="100%" maxW="100%" objectFit="contain" />
                          </Box>
                        ) : (
                          <Text fontSize="xs" color="gray.400" fontStyle="italic">Not uploaded</Text>
                        )}
                      </Box>
                    </SimpleGrid>
                  </Box>
                )}

                {/* Commission Information Section - Only show if customer has completed status */}
                {drawerCustomer.followupStatus === 'Completed' && (
                  <Box p={6}>
                    <Heading as="h3" size="md" mb={4} color="teal.600" pb={2} borderBottom="1px" borderColor="gray.200">
                      Commission Details
                    </Heading>
                    <VStack align="stretch" spacing={4}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Box p={4} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.100">
                          <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Course Price</Text>
                          <Text fontSize="xl" fontWeight="bold" color="blue.600">
                            {resolvedCoursePrice != null ? `ETB ${Number(resolvedCoursePrice).toFixed(2)}` : 'Add price in catalog'}
                          </Text>
                        </Box>
                        <Box p={4} bg="green.50" borderRadius="md" border="1px" borderColor="green.100">
                          <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Gross Commission (7%)</Text>
                          <Text fontSize="xl" fontWeight="bold" color="green.600">
                            ETB {resolvedCommission?.grossCommission ? resolvedCommission.grossCommission.toFixed(2) : '0.00'}
                          </Text>
                        </Box>
                      </SimpleGrid>
                      
                      {resolvedCommission ? (
                        <>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <Box p={4} bg="orange.50" borderRadius="md" border="1px" borderColor="orange.100">
                              <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Commission Tax (0.075%)</Text>
                              <Text fontSize="xl" fontWeight="bold" color="orange.600">
                                ETB {resolvedCommission?.commissionTax ? resolvedCommission.commissionTax.toFixed(2) : '0.00'}
                              </Text>
                            </Box>
                            <Box p={4} bg="teal.50" borderRadius="md" border="1px" borderColor="teal.100">
                              <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={1}>Net Commission</Text>
                              <Text fontSize="2xl" fontWeight="bold" color="teal.600">
                                ETB {resolvedCommission?.netCommission ? resolvedCommission.netCommission.toFixed(2) : '0.00'}
                              </Text>
                            </Box>
                          </SimpleGrid>
                        </>
                      ) : (
                        <Text fontSize="sm" color="gray.500">Commission data not available</Text>
                      )}
                    </VStack>
                  </Box>
                )}

                {/* Notes Section */}
                <Box p={6}>
                  <Heading as="h3" size="md" mb={4} color="teal.600" pb={2} borderBottom="1px" borderColor="gray.200">
                    Notes
                  </Heading>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>Customer Notes</Text>
                      <Box p={3} bg="gray.50" borderRadius="md" minH="60px">
                        <Text whiteSpace="pre-wrap" fontSize="sm">
                          {drawerCustomer.note || 'No notes available'}
                        </Text>
                      </Box>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>Supervisor Comment</Text>
                      <Box p={3} bg="gray.50" borderRadius="md" minH="60px">
                        <Text whiteSpace="pre-wrap" fontSize="sm">
                          {drawerCustomer.supervisorComment || 'No comments available'}
                        </Text>
                      </Box>
                    </Box>
                  </VStack>
                </Box>
              </VStack>
            )}
          </DrawerBody>
          <DrawerFooter bg="gray.50" justify="space-between">
            <Button
              leftIcon={<EditIcon />}
              colorScheme="teal"
              size="sm"
              onClick={() => {
                const target = drawerCustomer;
                onClose();
                handleOpenEditModal(target);
              }}
            >
              Edit Customer
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Full Image Preview Modal */}
      <Modal
        isOpen={fullImageModal.isOpen}
        onClose={() => setFullImageModal({ isOpen: false, src: '', title: '', subtitle: '' })}
        size="2xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent bg="gray.900" color="white" borderRadius="xl" overflow="hidden">
          <ModalHeader borderBottomWidth="1px" borderColor="whiteAlpha.200">
            <Flex justify="space-between" align="center" pr={8}>
              <Box>
                <Text fontSize="md" fontWeight="bold">{fullImageModal.title}</Text>
                {fullImageModal.subtitle && <Text fontSize="xs" color="gray.400">{fullImageModal.subtitle}</Text>}
              </Box>
            </Flex>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody p={4} display="flex" justifyContent="center" alignItems="center" bg="blackAlpha.800">
            {fullImageModal.src && (
              <Image
                src={fullImageModal.src}
                alt={fullImageModal.title}
                maxH="70vh"
                maxW="100%"
                objectFit="contain"
                borderRadius="md"
              />
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="whiteAlpha.200" justifyContent="space-between">
            {fullImageModal.src && (
              <Button
                as="a"
                href={fullImageModal.src}
                download={`${(fullImageModal.title || 'document').replace(/\s+/g, '_')}.jpg`}
                size="sm"
                colorScheme="teal"
                leftIcon={<Icon as={FiDownload} />}
              >
                Download
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              color="white"
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

export default FollowupCustomerTable;
