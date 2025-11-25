import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Tag,
  TagLabel,
  TagCloseButton,
  InputGroup,
  InputRightElement,
  IconButton,
  Flex,
  Textarea,
  Select
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import axios from 'axios';

const SellerForm = ({ onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || '',
    contactPerson: initialData?.contactPerson || '',
    email: initialData?.email || '',
    phoneNumber: initialData?.phoneNumber || '',
    country: initialData?.country || '',
    industry: initialData?.industry || '',
    products: initialData?.products && Array.isArray(initialData.products) ? initialData.products : [],
    certifications: initialData?.certifications && Array.isArray(initialData.certifications) ? initialData.certifications : [],
    requirements: initialData?.requirements || '',
    packageType: initialData?.packageType || ''
  });
  
  const [productInput, setProductInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        companyName: initialData.companyName || '',
        contactPerson: initialData.contactPerson || '',
        email: initialData.email || '',
        phoneNumber: initialData.phoneNumber || '',
        country: initialData.country || '',
        industry: initialData.industry || '',
        products: initialData.products && Array.isArray(initialData.products) ? initialData.products : [],
        certifications: initialData.certifications && Array.isArray(initialData.certifications) ? initialData.certifications : [],
        requirements: initialData.requirements || '',
        packageType: initialData.packageType || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = () => {
    if (productInput.trim() && !formData.products.includes(productInput.trim())) {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, productInput.trim()]
      }));
      setProductInput('');
    }
  };

  const handleRemoveProduct = (productToRemove) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(product => product !== productToRemove)
    }));
  };

  const handleAddCertification = () => {
    if (certificationInput.trim() && !formData.certifications.includes(certificationInput.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, certificationInput.trim()]
      }));
      setCertificationInput('');
    }
  };

  const handleRemoveCertification = (certificationToRemove) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(certification => certification !== certificationToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Ensure products and certifications are always arrays
      const dataToSubmit = {
        ...formData,
        products: Array.isArray(formData.products) ? formData.products : [],
        certifications: Array.isArray(formData.certifications) ? formData.certifications : []
      };
      
      if (initialData) {
        // Update existing seller
        await axios.put(`${import.meta.env.VITE_API_URL}/api/sellers/${initialData._id}`, dataToSubmit);
        toast({
          title: 'Seller updated',
          description: 'Seller information has been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new seller
        await axios.post(`${import.meta.env.VITE_API_URL}/api/sellers`, dataToSubmit);
        toast({
          title: 'Seller created',
          description: 'New seller has been added successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onSuccess && onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save seller',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Company Name</FormLabel>
          <Input
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Enter company name"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Contact Person</FormLabel>
          <Input
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            placeholder="Enter contact person name"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Phone Number</FormLabel>
          <Input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Enter phone number"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Country</FormLabel>
          <Input
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="Enter country"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Industry</FormLabel>
          <Input
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            placeholder="Enter industry"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Package Type</FormLabel>
          <Select
            name="packageType"
            value={formData.packageType}
            onChange={handleChange}
            placeholder="Select package type"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Products</FormLabel>
          <Flex>
            <Input
              value={productInput}
              onChange={(e) => setProductInput(e.target.value)}
              placeholder="Enter a product and click + to add"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProduct())}
            />
            <IconButton
              ml={2}
              aria-label="Add product"
              icon={<AddIcon />}
              onClick={handleAddProduct}
            />
          </Flex>
          <Box mt={2}>
            {formData.products && Array.isArray(formData.products) && formData.products.map((product, index) => (
              <Tag key={index} mr={2} mt={2}>
                <TagLabel>{product}</TagLabel>
                <TagCloseButton onClick={() => handleRemoveProduct(product)} />
              </Tag>
            ))}
          </Box>
        </FormControl>

        <FormControl>
          <FormLabel>Certifications</FormLabel>
          <Flex>
            <Input
              value={certificationInput}
              onChange={(e) => setCertificationInput(e.target.value)}
              placeholder="Enter a certification and click + to add"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
            />
            <IconButton
              ml={2}
              aria-label="Add certification"
              icon={<AddIcon />}
              onClick={handleAddCertification}
            />
          </Flex>
          <Box mt={2}>
            {formData.certifications && Array.isArray(formData.certifications) && formData.certifications.map((certification, index) => (
              <Tag key={index} mr={2} mt={2}>
                <TagLabel>{certification}</TagLabel>
                <TagCloseButton onClick={() => handleRemoveCertification(certification)} />
              </Tag>
            ))}
          </Box>
        </FormControl>

        <Button 
          type="submit" 
          colorScheme="teal" 
          isLoading={loading}
          loadingText={initialData ? "Updating..." : "Creating..."}
        >
          {initialData ? "Update Seller" : "Create Seller"}
        </Button>
      </VStack>
    </Box>
  );
};

export default SellerForm;