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
  Textarea,
  IconButton,
  useToast,
  useColorModeValue,
  HStack
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

const PackageSalesTable = ({ packages, onDelete, onUpdate, onAdd }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [addingRow, setAddingRow] = useState(false);
  const [newPackage, setNewPackage] = useState({
    packageNumber: '',
    services: '',
    price: '',
    description: ''
  });
  const toast = useToast();
  
  const headerColor = useColorModeValue('teal.800', 'teal.200');

  const handleCellClick = (pkg, field) => {
    setEditingCell({ id: pkg._id, field });
    setEditValue(pkg[field] || '');
  };

  const handleSave = () => {
    if (editingCell) {
      const updated = { ...packages.find(p => p._id === editingCell.id), [editingCell.field]: editValue };
      onUpdate(editingCell.id, updated);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleInputChange = (e) => setEditValue(e.target.value);

  const handleNewPackageChange = (e) => {
    const { name, value } = e.target;
    setNewPackage(prev => ({ ...prev, [name]: value }));
  };

  const handleKeyDown = (e, pkg) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleNewPackageKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewPackage();
    } else if (e.key === 'Escape') {
      setAddingRow(false);
      setNewPackage({
        packageNumber: '',
        services: '',
        price: '',
        description: ''
      });
    }
  };

  const handleAddNewPackage = () => {
    // Convert services string to array
    const servicesArray = newPackage.services.split(',').map(service => service.trim()).filter(service => service);
    const packageToAdd = {
      ...newPackage,
      services: servicesArray,
      price: Number(newPackage.price) || 0
    };
    
    onAdd(packageToAdd);
    setAddingRow(false);
    setNewPackage({
      packageNumber: '',
      services: '',
      price: '',
      description: ''
    });
  };

  const renderEditableCell = (pkg, field, value, type = 'text') => {
    const handleBlur = () => {
      handleSave();
    };

    if (type === 'textarea') {
      return (
        <Td key={field} p={1}>
          <Textarea
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e, pkg)}
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
    
    if (type === 'number') {
      return (
        <Td key={field} p={1}>
          <Input
            type="number"
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={(e) => handleKeyDown(e, pkg)}
            size="xs"
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
          onKeyDown={(e) => handleKeyDown(e, pkg)}
          size="xs"
          autoFocus
          onBlur={handleBlur}
          fontSize="sm"
          p={1}
        />
      </Td>
    );
  };

  const renderNewPackageCell = (field, value, type = 'text') => {
    if (type === 'textarea') {
      return (
        <Td key={field} p={1}>
          <Textarea
            name={field}
            value={value}
            onChange={handleNewPackageChange}
            onKeyDown={handleNewPackageKeyDown}
            size="xs"
            rows={2}
            fontSize="sm"
            p={1}
          />
        </Td>
      );
    }
    
    if (type === 'number') {
      return (
        <Td key={field} p={1}>
          <Input
            type="number"
            name={field}
            value={value}
            onChange={handleNewPackageChange}
            onKeyDown={handleNewPackageKeyDown}
            size="xs"
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
          onChange={handleNewPackageChange}
          onKeyDown={handleNewPackageKeyDown}
          size="xs"
          fontSize="sm"
          p={1}
        />
      </Td>
    );
  };

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
          Add New Package
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
              Package Number
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
              Services
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
              Price (ETB)
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
              Description
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
              {renderNewPackageCell('packageNumber', newPackage.packageNumber, 'number')}
              {renderNewPackageCell('services', newPackage.services, 'textarea')}
              {renderNewPackageCell('price', newPackage.price, 'number')}
              {renderNewPackageCell('description', newPackage.description, 'textarea')}
              <Td p={2}>
                <IconButton
                  icon={<CheckIcon />}
                  colorScheme="green"
                  size="xs"
                  mr={1}
                  onClick={handleAddNewPackage}
                  aria-label="Save package"
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

          {packages && packages.map(pkg => (
            <Tr 
              key={pkg._id} 
              _hover={{ bg: 'gray.50' }}
              transition="background 0.2s"
              fontSize="sm"
              borderBottom="1px"
              borderColor="gray.200"
            >
              {editingCell && editingCell.id === pkg._id && editingCell.field === 'packageNumber' 
                ? renderEditableCell(pkg, 'packageNumber', pkg.packageNumber, 'number')
                : <Td onClick={() => handleCellClick(pkg, 'packageNumber')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">{pkg.packageNumber}</Td>}
              
              {editingCell && editingCell.id === pkg._id && editingCell.field === 'services' 
                ? renderEditableCell(pkg, 'services', pkg.services ? pkg.services.join(', ') : '', 'textarea')
                : <Td onClick={() => handleCellClick(pkg, 'services')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">{pkg.services ? pkg.services.join(', ') : ''}</Td>}
              
              {editingCell && editingCell.id === pkg._id && editingCell.field === 'price' 
                ? renderEditableCell(pkg, 'price', pkg.price, 'number')
                : <Td onClick={() => handleCellClick(pkg, 'price')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">ETB {pkg.price?.toLocaleString()}</Td>}
              
              {editingCell && editingCell.id === pkg._id && editingCell.field === 'description' 
                ? renderEditableCell(pkg, 'description', pkg.description, 'textarea')
                : <Td onClick={() => handleCellClick(pkg, 'description')} _hover={{ cursor: 'pointer', bg: 'teal.50' }} p={2} fontSize="sm">{pkg.description}</Td>}
              
              <Td p={2}>
                <HStack spacing={1} justify="flex-end">
                  <IconButton
                    icon={<EditIcon />}
                    colorScheme="blue"
                    size="xs"
                    onClick={() => handleCellClick(pkg, 'packageNumber')}
                    aria-label="Edit package"
                    variant="outline"
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    size="xs"
                    onClick={() => onDelete(pkg._id)}
                    aria-label="Delete package"
                    variant="outline"
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default PackageSalesTable;