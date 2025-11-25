import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  useToast,
  Spinner,
  Flex,
  Heading,
  Card,
  CardBody,
  CardHeader,
  List,
  ListItem,
  ListIcon,
  Textarea,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Tag
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import axios from 'axios';

const CustomerDetails = ({ customer, customerType, onBack, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Detailed debugging
  console.log('=== CustomerDetails Debug Info ===');
  console.log('Customer object:', JSON.stringify(customer, null, 2));
  console.log('Customer exists:', !!customer);
  console.log('Customer type:', customerType);
  console.log('Customer products property exists:', !!customer?.products);
  console.log('Customer products:', customer?.products);
  console.log('Customer products type:', Array.isArray(customer?.products) ? 'array' : typeof customer?.products);
  console.log('Customer products length:', customer?.products?.length);
  console.log('========================');

  if (!customer) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Text>No customer data available</Text>
      </Flex>
    );
  }

  return (
    <Box>
      <Button onClick={onBack} mb={4} colorScheme="teal" variant="outline" size="sm">
        Back to {customerType === 'buyer' ? 'Buyers' : 'Sellers'}
      </Button>
      
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
        <GridItem>
          <Card>
            <CardHeader pb={2}>
              <Heading size="md">{customerType === 'buyer' ? 'Buyer' : 'Seller'} Details</Heading>
            </CardHeader>
            <CardBody pt={2}>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Company Name</Text>
                  <Text fontSize="sm">{customer.companyName}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Contact Person</Text>
                  <Text fontSize="sm">{customer.contactPerson}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Email</Text>
                  <Text fontSize="sm">{customer.email}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Phone Number</Text>
                  <Text fontSize="sm">{customer.phoneNumber}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Country</Text>
                  <Text fontSize="sm">{customer.country}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Industry</Text>
                  <Text fontSize="sm">{customer.industry}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Package Type</Text>
                  <Badge colorScheme="purple" fontSize="0.8em">
                    {customer.packageType ? customer.packageType : 'Not specified'}
                  </Badge>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Status</Text>
                  <Badge 
                    colorScheme={customer.status === 'Active' ? 'green' : customer.status === 'Inactive' ? 'yellow' : 'red'}
                    fontSize="0.8em"
                  >
                    {customer.status}
                  </Badge>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Registration Date</Text>
                  <Text fontSize="sm">{new Date(customer.registrationDate).toLocaleDateString()}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Last Active</Text>
                  <Text fontSize="sm">{new Date(customer.lastActive).toLocaleDateString()}</Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <VStack align="stretch" spacing={6}>
            <Card>
              <CardHeader pb={2}>
                <Heading size="md">
                  {customerType === 'buyer' ? 'Products Looking For' : 'Products Offering'}
                </Heading>
              </CardHeader>
              <CardBody pt={2}>
                <Box>
                  <HStack mt={1} wrap="wrap" gap={2}>
                    {customer.products && customer.products.length > 0 ? (
                      customer.products.map((product, index) => (
                        <Tag key={index} colorScheme="blue" size="md">
                          {product}
                        </Tag>
                      ))
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        {customer.products ? 'No products specified' : 'Products not loaded'}
                      </Text>
                    )}
                  </HStack>
                </Box>
              </CardBody>
            </Card>
            
            {customerType === 'seller' && (
              <Card>
                <CardHeader pb={2}>
                  <Heading size="md">Certifications</Heading>
                </CardHeader>
                <CardBody pt={2}>
                  <Box>
                    <HStack mt={1} wrap="wrap" gap={2}>
                      {customer.certifications && customer.certifications.length > 0 ? (
                        customer.certifications.map((cert, index) => (
                          <Tag key={index} colorScheme="green" size="md">
                            {cert}
                          </Tag>
                        ))
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          {customer.certifications ? 'No certifications specified' : 'Certifications not loaded'}
                        </Text>
                      )}
                    </HStack>

                  </Box>
                </CardBody>
              </Card>
            )}
            
            {customerType === 'buyer' && (
              <Card>
                <CardHeader pb={2}>
                  <Heading size="md">Requirements</Heading>
                </CardHeader>
                <CardBody pt={2}>
                  <Text fontSize="sm">
                    {customer.requirements || 'No specific requirements'}
                  </Text>
                </CardBody>
              </Card>
            )}
            
            <Card>
              <CardHeader pb={2}>
                <Heading size="md">Purchased Packages</Heading>
              </CardHeader>
              <CardBody pt={2}>
                {customer.packages && customer.packages.length > 0 ? (
                  <VStack align="stretch" spacing={3}>
                    {customer.packages.map((pkg, index) => (
                      <Box key={index} p={3} bg="gray.50" borderRadius="md">
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="bold" fontSize="sm">{pkg.packageName}</Text>
                          <Badge 
                            colorScheme={pkg.status === 'Active' ? 'green' : pkg.status === 'Expired' ? 'red' : 'gray'}
                            fontSize="0.7em"
                          >
                            {pkg.status}
                          </Badge>
                        </HStack>
                        <HStack justify="space-between" fontSize="0.8em">
                          <Text>Type: {pkg.packageType}</Text>
                          <Text>
                            {pkg.purchaseDate && `Purchased: ${new Date(pkg.purchaseDate).toLocaleDateString()}`}
                          </Text>
                          <Text>
                            {pkg.expiryDate && `Expires: ${new Date(pkg.expiryDate).toLocaleDateString()}`}
                          </Text>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Text fontSize="sm" color="gray.500">No packages purchased</Text>
                )}
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
      </Grid>
      
      <HStack mt={6} spacing={3}>
        <Button 
          colorScheme="teal" 
          onClick={() => onEdit && onEdit(customer)}
        >
          Edit {customerType === 'buyer' ? 'Buyer' : 'Seller'}
        </Button>
        <Button 
          colorScheme="teal" 
          variant="outline"
        >
          Contact {customerType === 'buyer' ? 'Buyer' : 'Seller'}
        </Button>
      </HStack>
    </Box>
  );
};

export default CustomerDetails;