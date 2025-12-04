import React, { useState } from 'react';
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
<<<<<<< Updated upstream
=======
  SimpleGrid,
  VStack,
  HStack,
  Divider,
  useToast
>>>>>>> Stashed changes
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
  VStack,
  HStack,
  Divider
} from '@chakra-ui/react';

const FollowupCustomerTable = ({ customers, onDelete, onUpdate, onAdd }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [addingRow, setAddingRow] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customerName: '',
    contactTitle: '',
    phone: '',
    callStatus: 'Not Called',
    followupStatus: 'Pending',
    email: '',
    note: '',
    supervisorComment: ''
  });
  const [updatedCustomers, setUpdatedCustomers] = useState(new Set());
  const { isOpen, onOpen, onClose } = useDisclosure();
<<<<<<< Updated upstream
  const [drawerCustomer, setDrawerCustomer] = useState(null);
=======
  const toast = useToast();
>>>>>>> Stashed changes

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

  const handleCellClick = (customer, field) => {
    const canEdit = canUserEditField(field, userRole);
    if (!canEdit) return;
    setEditingCell({ id: customer._id, field });
    setEditValue(customer[field] || '');
  };

  const handleSave = (customer) => {
    if (editingCell) {
      const updated = { ...customer, [editingCell.field]: editValue };
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
        supervisorComment: ''
      });
    }
  };

  const handleAddNewCustomer = () => {
    onAdd(newCustomer);
    setAddingRow(false);
    setNewCustomer({
      customerName: '',
      contactTitle: '',
      phone: '',
      callStatus: 'Not Called',
      followupStatus: 'Pending',
      email: '',
      note: '',
      supervisorComment: ''
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
            ) : (
              <>
                <option value="Prospect">Prospect</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Cancelled">Cancelled</option>
              </>
            )}
          </Select>
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
            ) : (
              <>
                <option value="Prospect">Prospect</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Cancelled">Cancelled</option>
              </>
            )}
          </Select>
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
        default: return 'gray';
      }
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
      <Table variant="simple" size="sm" w="100%">
        <Thead>
          <Tr bg="teal.50">
            <Th 
              color={headerColor} 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={2}
              px={2}
            >
              Customer Name
            </Th>
            <Th 
              color={headerColor} 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={2}
              px={2}
            >
              Training Title
            </Th>
            <Th 
              color={headerColor} 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={2}
              px={2}
            >
              Phone
            </Th>
            <Th 
              color={headerColor} 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={2}
              px={2}
            >
              Call Status
            </Th>
            <Th 
              color={headerColor} 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={2}
              px={2}
            >
              Follow-up Status
            </Th>
            <Th 
              color={headerColor} 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={2}
              px={2}
            >
              Schedule
            </Th>
            <Th 
              color={headerColor} 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={2}
              px={2}
            >
              Date
            </Th>
            <Th 
              color={headerColor} 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={2}
              px={2}
            >
              Email
            </Th>
            <Th 
              color={headerColor} 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={2}
              px={2}
            >
              Notes
            </Th>
            {/* Supervisor Comment column removed from table - shown in drawer instead */}
            <Th 
              color={headerColor} 
              fontWeight="bold" 
              textTransform="uppercase" 
              fontSize="xs" 
              letterSpacing="wider"
              py={2}
              px={2}
              width="80px"
            >
              Actions
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {addingRow && (
            <Tr bg="gray.50">
              {renderNewCustomerCell('customerName', newCustomer.customerName)}
              {renderNewCustomerCell('contactTitle', newCustomer.contactTitle)}
              {renderNewCustomerCell('phone', newCustomer.phone)}
              {renderNewCustomerCell('callStatus', newCustomer.callStatus, 'select')}
              {renderNewCustomerCell('followupStatus', newCustomer.followupStatus, 'select')}
              {renderNewCustomerCell('schedulePreference', newCustomer.schedulePreference || 'Regular', 'select')}
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
            >
              {editingCell && editingCell.id === customer._id && editingCell.field === 'customerName' 
                ? renderEditableCell(customer, 'customerName', customer.customerName)
                : <Td onClick={() => handleCellClick(customer, 'customerName')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{customer.customerName}</Td>}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'contactTitle' 
                ? renderEditableCell(customer, 'contactTitle', customer.contactTitle)
                : <Td onClick={() => handleCellClick(customer, 'contactTitle')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm" maxWidth="120px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{customer.contactTitle}</Td>}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'phone' 
                ? renderEditableCell(customer, 'phone', customer.phone)
                : <Td onClick={() => handleCellClick(customer, 'phone')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">{customer.phone}</Td>}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'callStatus' 
                ? renderEditableCell(customer, 'callStatus', customer.callStatus, 'select')
                : (
                  <Td onClick={() => handleCellClick(customer, 'callStatus')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">
                    <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.callStatus, 'call')} fontSize="xs" px={1.5} py={0.5} maxWidth="100px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      {customer.callStatus}
                    </Badge>
                  </Td>
                )}
              
              {editingCell && editingCell.id === customer._id && editingCell.field === 'followupStatus' 
                ? renderEditableCell(customer, 'followupStatus', customer.followupStatus, 'select')
                : (
                  <Td onClick={() => handleCellClick(customer, 'followupStatus')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">
                    <Badge variant="solid" colorScheme={getStatusBadgeVariant(customer.followupStatus, 'followup')} fontSize="xs" px={1.5} py={0.5} maxWidth="100px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
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
                <HStack spacing={2} justify="flex-end">
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
                    colorScheme="gray"
                    size="xs"
                    aria-label="Details"
                    onClick={() => { setDrawerCustomer(customer); onOpen(); }}
                    variant="ghost"
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

        {/* Drawer for customer details/actions */}
        <Drawer isOpen={isOpen} placement="right" onClose={() => { setDrawerCustomer(null); onClose(); }} size={{ base: 'full', md: 'md' }}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              {drawerCustomer ? drawerCustomer.customerName : 'Customer Details'}
            </DrawerHeader>
            <DrawerBody>
              {drawerCustomer ? (
                <Box>
                  <Text fontWeight="semibold" mb={2}>Supervisor Comment</Text>
                  <Textarea
                    value={drawerCustomer.supervisorComment || ''}
                    onChange={(e) => setDrawerCustomer(prev => ({ ...prev, supervisorComment: e.target.value }))}
                    placeholder="Enter supervisor comment..."
                    rows={8}
                    isDisabled={!(userRole === 'admin' || userRole === 'sales_manager')}
                  />
                  {!(userRole === 'admin' || userRole === 'sales_manager') && (
                    <Text mt={2} fontSize="sm" color="gray.500">Only users with Admin or Sales Manager role can edit this field.</Text>
                  )}
                </Box>
              ) : (
                <Text>No customer selected</Text>
              )}
            </DrawerBody>
            <DrawerFooter>
              <HStack spacing={3}>
                <Button colorScheme="teal" size="sm" onClick={() => {
                  if (drawerCustomer) {
                    // only send supervisorComment field to update
                    onUpdate(drawerCustomer._id, { supervisorComment: drawerCustomer.supervisorComment });
                  }
                  setDrawerCustomer(null);
                  onClose();
                }} isDisabled={!(userRole === 'admin' || userRole === 'sales_manager')}>Save</Button>
                <Button variant="outline" size="sm" onClick={() => { setDrawerCustomer(null); onClose(); }}>Close</Button>
              </HStack>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
    </Box>
  );
};

export default FollowupCustomerTable;