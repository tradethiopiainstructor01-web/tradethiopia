import React, { useState, useRef } from 'react';
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
  Divider
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, CheckIcon, CloseIcon, InfoIcon } from '@chakra-ui/icons';
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

const FollowupCustomerTable = ({ customers, courses, onDelete, onUpdate, onAdd }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isStatusWarningOpen, setIsStatusWarningOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [addingRow, setAddingRow] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customerName: '',
    contactTitle: '',
    phone: '',
    callStatus: 'Not Called',
    followupStatus: 'Pending',
    email: '',
    note: '',
    supervisorComment: '',
    packageScope: 'Local'
  });
  const [updatedCustomers, setUpdatedCustomers] = useState(new Set());
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const warningCancelRef = useRef(null);

  const userToken = localStorage.getItem('userToken');
  const userRole = localStorage.getItem('userRole') || 'agent';
  const headerColor = useColorModeValue('teal.800', 'teal.200');

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

  const handleCellClick = (customer, field) => {
    if (field === 'followupStatus' && (customer.followupStatus || '').toLowerCase() === 'completed') {
      return;
    }
    const canEdit = canUserEditField(field, userRole);
    if (!canEdit) return;
    setEditingCell({ id: customer._id, field });
    setEditValue(customer[field] || '');
  };

  const handleSave = (customer, forcedValue = null) => {
    if (editingCell) {
      const value = forcedValue !== null ? forcedValue : editValue;

      if (editingCell.field === 'followupStatus' && value === 'Completed' && forcedValue === null) {
        setPendingStatusChange({ customer, value });
        setIsStatusWarningOpen(true);
        return;
      }

      const updated = { ...customer, [editingCell.field]: value };

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

  const cancelStatusWarning = () => {
    setIsStatusWarningOpen(false);
    setPendingStatusChange(null);
    setEditingCell(null);
    setEditValue('');
  };

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      handleSave(pendingStatusChange.customer, pendingStatusChange.value);
    }
    setPendingStatusChange(null);
    setIsStatusWarningOpen(false);
  };

  const handleInputChange = (e) => setEditValue(e.target.value);

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({ ...prev, [name]: value }));
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
      setAddingRow(false);
      setNewCustomer({
        customerName: '',
        contactTitle: '',
        phone: '',
        callStatus: 'Not Called',
        followupStatus: 'Pending',
        email: '',
        note: '',
        supervisorComment: '',
        packageScope: 'Local'
      });
    }
  };

  const handleAddNewCustomer = () => {
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
    setAddingRow(false);
    setNewCustomer({
      customerName: '',
      contactTitle: '',
      phone: '',
      callStatus: 'Not Called',
      followupStatus: 'Pending',
      email: '',
      note: '',
      supervisorComment: '',
      packageScope: 'Local'
    });
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
              onKeyDown={(e) => handleKeyDown(e, customer)}
              size="xs"
              autoFocus
              onBlur={handleBlur}
              fontSize="sm"
              p={1}
            >
              <option value="">Select a course</option>
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
              onKeyDown={(e) => handleKeyDown(e, customer)}
              size="xs"
              autoFocus
              onBlur={handleBlur}
              fontSize="sm"
              p={1}
            >
              {field === 'callStatus' ? (
                <>
                  <option value="Called">Called</option>
                  <option value="Not Called">Not Called</option>
                  <option value="Busy">Busy</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Callback">Callback</option>
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

  const renderNewCustomerCell = (field, value, type = 'text') => {
    if (type === 'select') {
      return (
        <Td key={field} p={1}>
          {field === 'contactTitle' ? (
            <Select
              name={field}
              value={value}
              onChange={handleNewCustomerChange}
              onKeyDown={handleNewCustomerKeyDown}
              size="xs"
              fontSize="sm"
              p={1}
            >
              <option value="">Select a course</option>
              {(Array.isArray(courses) ? courses : []).map(course => (
                <option key={course._id} value={course.name}>
                  {course.name}
                </option>
              ))}
            </Select>
          ) : (
            <Select
              name={field}
              value={value}
              onChange={handleNewCustomerChange}
              onKeyDown={handleNewCustomerKeyDown}
              size="xs"
              fontSize="sm"
              p={1}
            >
              {field === 'callStatus' ? (
                <>
                  <option value="Called">Called</option>
                  <option value="Not Called">Not Called</option>
                  <option value="Busy">Busy</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Callback">Callback</option>
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
                  <option value="Imported">Imported</option>
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
            name={field}
            value={value}
            onChange={handleNewCustomerChange}
            onKeyDown={handleNewCustomerKeyDown}
            size="xs"
            rows={2}
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
          name={field}
          value={value}
          onChange={handleNewCustomerChange}
          onKeyDown={handleNewCustomerKeyDown}
          size="xs"
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

  if ((!customers || customers.length === 0) && !addingRow) {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Text fontSize="xl" fontWeight="bold" mb={2}>No customers found</Text>
        <Text mb={6}>Get started by adding a new customer.</Text>
        <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={() => setAddingRow(true)}>
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
      <Box mb={4}>
        <Button 
          leftIcon={<AddIcon />}
          colorScheme="teal" 
          size="sm"
          onClick={() => setAddingRow(true)}
          disabled={addingRow}
        >
          Add New Customer Row
        </Button>
      </Box>
      <Table variant="simple" size="sm" w="100%" boxShadow="sm" borderRadius="md" overflow="hidden">
        <Thead>
          <Tr bg="teal.500">
            <Th 
              color="white" 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={3}
              px={2}
            >
              Customer Name
            </Th>
            <Th 
              color="white" 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={3}
              px={2}
            >
              Training Title
            </Th>
            <Th 
              color="white" 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={3}
              px={2}
            >
              Phone
            </Th>
            <Th 
              color="white" 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={3}
              px={2}
            >
              Call Status
            </Th>
            <Th 
              color="white" 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={3}
              px={2}
            >
              Follow-up Status
            </Th>
            <Th 
              color="white" 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={3}
              px={2}
            >
              Schedule
            </Th>
            <Th 
              color="white" 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={3}
              px={2}
            >
              Package Scope
            </Th>
            <Th 
              color="white" 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={3}
              px={2}
            >
              Date
            </Th>
            <Th 
              color="white" 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={3}
              px={2}
            >
              Email
            </Th>
            <Th 
              color="white" 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={3}
              px={2}
            >
              Notes
            </Th>
            <Th 
              color="white" 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={3}
              px={2}
              width="100px"
            >
              Actions
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {addingRow && (
            <Tr bg="gray.100">
              {renderNewCustomerCell('customerName', newCustomer.customerName)}
              {renderNewCustomerCell('contactTitle', newCustomer.contactTitle, 'select')}
              {renderNewCustomerCell('phone', newCustomer.phone)}
              {renderNewCustomerCell('callStatus', newCustomer.callStatus, 'select')}
              {renderNewCustomerCell('followupStatus', newCustomer.followupStatus, 'select')}
              {renderNewCustomerCell('schedulePreference', newCustomer.schedulePreference || 'Regular', 'select')}
              {renderNewCustomerCell('packageScope', newCustomer.packageScope || 'Local', 'select')}
              <Td fontSize="xs" p={2}>{formatDate(new Date().toISOString())}</Td>
              {renderNewCustomerCell('email', newCustomer.email)}
              {renderNewCustomerCell('note', newCustomer.note, 'textarea')}
              <Td p={2}>
                <IconButton
                  icon={<CheckIcon />}
                  colorScheme="green"
                  size="xs"
                  mr={1}
                  onClick={handleAddNewCustomer}
                  aria-label="Save customer"
                />
                <IconButton
                  icon={<CloseIcon />}
                  colorScheme="red"
                  size="xs"
                  onClick={() => setAddingRow(false)}
                  aria-label="Cancel"
                />
              </Td>
            </Tr>
          )}

          {customers && customers.map(customer => (
            <Tr 
              key={customer._id} 
              _hover={{ bg: 'gray.50' }}
              transition="background 0.2s"
              fontSize="sm"
              borderBottom="1px"
              borderColor="gray.200"
            >
              {editingCell && editingCell.id === customer._id && editingCell.field === 'customerName' 
                ? renderEditableCell(customer, 'customerName', customer.customerName)
                : <Td onClick={() => handleCellClick(customer, 'customerName')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{customer.customerName}</Td>}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'contactTitle' 
                ? renderEditableCell(customer, 'contactTitle', customer.contactTitle, 'select')
                : <Td onClick={() => handleCellClick(customer, 'contactTitle')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{customer.contactTitle}</Td>}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'phone' 
                ? renderEditableCell(customer, 'phone', customer.phone)
                : <Td onClick={() => handleCellClick(customer, 'phone')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">{customer.phone}</Td>}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'callStatus' 
                ? renderEditableCell(customer, 'callStatus', customer.callStatus, 'select')
                : (
                  <Td onClick={() => handleCellClick(customer, 'callStatus')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">
                    <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.callStatus, 'call')} fontSize="xs" px={2} py={1}>
                      {customer.callStatus}
                    </Badge>
                  </Td>
                )}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'followupStatus' 
                ? renderEditableCell(customer, 'followupStatus', customer.followupStatus, 'select')
                : (
                  <Td onClick={() => handleCellClick(customer, 'followupStatus')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">
                    <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.followupStatus, 'followup')} fontSize="xs" px={2} py={1}>
                      {customer.followupStatus}
                    </Badge>
                  </Td>
                )}

              {editingCell && editingCell.id === customer._id && editingCell.field === 'schedulePreference' 
                ? renderEditableCell(customer, 'schedulePreference', customer.schedulePreference || 'Regular', 'select')
                : (
                  <Td onClick={() => handleCellClick(customer, 'schedulePreference')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">
                    {customer.schedulePreference || 'Regular'}
                  </Td>
                )}
              {editingCell && editingCell.id === customer._id && editingCell.field === 'packageScope'
                ? renderEditableCell(customer, 'packageScope', customer.packageScope || 'Local', 'select')
                : (
                  <Td onClick={() => handleCellClick(customer, 'packageScope')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">
                    <Badge variant="subtle" colorScheme={getScopeBadgeVariant(customer.packageScope || 'Local')} fontSize="xs" px={2} py={1}>
                      {customer.packageScope || 'Local'}
                    </Badge>
                  </Td>
                )}
              
              <Td p={2} fontSize="xs">{customer.date ? formatDate(customer.date) : 'N/A'}</Td>
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'email' 
                ? renderEditableCell(customer, 'email', customer.email)
                : <Td onClick={() => handleCellClick(customer, 'email')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{customer.email}</Td>}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'note' 
                ? renderEditableCell(customer, 'note', customer.note, 'textarea')
                : <Td onClick={() => handleCellClick(customer, 'note')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{customer.note}</Td>}
              
              <Td p={2} position="relative">
                {updatedCustomers.has(customer._id) && (
                  <Box 
                    position="absolute" 
                    top="-2px" 
                    left="-2px" 
                    w="8px" 
                    h="8px" 
                    bg="green.500" 
                    borderRadius="50%" 
                    zIndex="1"
                  />
                )}
                <HStack spacing={1} justify="flex-end">
                  <IconButton
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    size="xs"
                    onClick={() => onDelete(customer._id)}
                    aria-label="Delete customer"
                    variant="outline"
                  />
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
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <AlertDialog
        isOpen={isStatusWarningOpen}
        leastDestructiveRef={warningCancelRef}
        onClose={cancelStatusWarning}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Status Change
            </AlertDialogHeader>
            <AlertDialogBody>
              Marking this follow-up as <strong>Completed</strong> will finalize the sale.
              Please ensure all notes and payments are recorded before proceeding.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={warningCancelRef} onClick={cancelStatusWarning}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmStatusChange} ml={3}>
                Confirm Completed
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

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
          <DrawerFooter bg="gray.50">
            <Button variant="outline" mr={3} onClick={onClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default FollowupCustomerTable;
