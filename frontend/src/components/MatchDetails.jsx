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
  GridItem
} from '@chakra-ui/react';
import { CheckCircleIcon, StarIcon } from '@chakra-ui/icons';
import axios from 'axios';

const MatchDetails = ({ match, onBack, onSaveMatch, isMatchSaved, savedBy }) => {
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [sellerDetails, setSellerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState(match.notes || '');
  const toast = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const [buyerRes, sellerRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/buyers/${match.buyerId}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/sellers/${match.sellerId}`)
        ]);
        
        setBuyerDetails(buyerRes.data);
        setSellerDetails(sellerRes.data);
      } catch (error) {
        toast({
          title: 'Error fetching details',
          description: error.response?.data?.error || 'Failed to fetch match details',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (match) {
      fetchDetails();
    }
  }, [match]);

  const handleSaveMatch = async () => {
    if (onSaveMatch) {
      onSaveMatch({
        ...match,
        notes
      });
    }
  };

  const handleUpdateNotes = async () => {
    // If match is already saved, update the notes
    if (match._id) {
      try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/saved-matches/${match._id}`, {
          notes
        });
        toast({
          title: 'Notes updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Error updating notes',
          description: error.response?.data?.error || 'Failed to update notes',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box>
      <Button onClick={onBack} mb={4} colorScheme="teal" variant="outline" size="sm">
        Back to Matches
      </Button>
      
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={6}>
        {/* Buyer Details */}
        <GridItem>
          <Card height="100%">
            <CardHeader pb={2}>
              <Heading size="md">Buyer Details</Heading>
            </CardHeader>
            <CardBody pt={2}>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Company Name</Text>
                  <Text fontSize="sm">{buyerDetails?.companyName}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Contact Person</Text>
                  <Text fontSize="sm">{buyerDetails?.contactPerson}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Email</Text>
                  <Text fontSize="sm">{buyerDetails?.email}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Phone Number</Text>
                  <Text fontSize="sm">{buyerDetails?.phoneNumber}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Country</Text>
                  <Text fontSize="sm">{buyerDetails?.country}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Industry</Text>
                  <Text fontSize="sm">{buyerDetails?.industry}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Package Type</Text>
                  <Badge colorScheme="purple" fontSize="0.8em">
                    {buyerDetails?.packageType ? buyerDetails.packageType : 'Not specified'}
                  </Badge>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Products Looking For</Text>
                  <HStack mt={1} wrap="wrap" gap={1}>
                    {buyerDetails?.products.map((product, index) => (
                      <Badge key={index} colorScheme="blue" fontSize="0.7em" py="0.5">
                        {product}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Purchased Packages</Text>
                  {buyerDetails?.packages && buyerDetails.packages.length > 0 ? (
                    <VStack align="stretch" mt={1} spacing={1}>
                      {buyerDetails.packages.map((pkg, index) => (
                        <HStack key={index} justify="space-between" p={1} bg="gray.50" borderRadius="md">
                          <Text fontSize="0.8em">{pkg.packageName}</Text>
                          <Badge 
                            colorScheme={pkg.status === 'Active' ? 'green' : pkg.status === 'Expired' ? 'red' : 'gray'}
                            fontSize="0.7em"
                          >
                            {pkg.status}
                          </Badge>
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Text fontSize="0.8em" color="gray.500">No packages purchased</Text>
                  )}
                </Box>

                <Box>
                  <Text fontWeight="bold" fontSize="sm">Requirements</Text>
                  <Text fontSize="sm">{buyerDetails?.requirements || 'No specific requirements'}</Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
        
        {/* Match Information */}
        <GridItem>
          <Card height="100%">
            <CardHeader pb={2}>
              <Heading size="md">Match Information</Heading>
            </CardHeader>
            <CardBody pt={2}>
              <VStack align="stretch" spacing={3}>
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="bold">Match Score</Text>
                  <Text fontSize="2xl" color={match.score > 70 ? 'green.500' : match.score > 40 ? 'yellow.500' : 'red.500'}>
                    {match.score}%
                  </Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Why This Match Was Made</Text>
                  <List spacing={1} mt={1}>
                    {match.matchReasons && match.matchReasons.length > 0 ? (
                      match.matchReasons.map((reason, index) => (
                        <ListItem key={index} fontSize="0.8em">
                          <ListIcon as={CheckCircleIcon} color='green.500' />
                          {reason}
                        </ListItem>
                      ))
                    ) : (
                      <ListItem fontSize="0.8em">No specific reasons provided</ListItem>
                    )}
                  </List>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Matching Criteria</Text>
                  <HStack mt={1} wrap="wrap" gap={1}>
                    {match.matchingCriteria && match.matchingCriteria.length > 0 ? (
                      match.matchingCriteria.map((criteria, index) => (
                        <Badge key={index} colorScheme="purple" fontSize="0.7em" py="0.5">
                          {criteria}
                        </Badge>
                      ))
                    ) : (
                      <Text fontSize="0.8em">No specific criteria matched</Text>
                    )}
                  </HStack>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Matching Products</Text>
                  <HStack mt={1} wrap="wrap" gap={1}>
                    {match.matchingProducts && match.matchingProducts.length > 0 ? (
                      match.matchingProducts.map((product, index) => (
                        <Badge key={index} colorScheme="blue" fontSize="0.7em" py="0.5">
                          {product}
                        </Badge>
                      ))
                    ) : (
                      <Text fontSize="0.8em">No products matched</Text>
                    )}
                  </HStack>
                </Box>
                
                <Divider />
                
                <FormControl>
                  <FormLabel fontSize="sm">Notes</FormLabel>
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Add notes about this match..."
                    size="sm"
                    rows={2}
                  />
                  <Button 
                    mt={2} 
                    size="sm" 
                    onClick={handleUpdateNotes}
                    isDisabled={!match._id}
                    width="100%"
                  >
                    Update Notes
                  </Button>
                </FormControl>
                
                <HStack spacing={2}>
                  <Button 
                    colorScheme={isMatchSaved ? "yellow" : "teal"} 
                    size="sm" 
                    leftIcon={isMatchSaved ? <StarIcon /> : <StarIcon />}
                    onClick={handleSaveMatch}
                    flex={1}
                  >
                    {isMatchSaved ? "Match Saved" : "Save Match"}
                  </Button>
                  
                  <Button colorScheme="teal" size="sm" flex={1}>
                    Contact Both
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
        
        {/* Seller Details */}
        <GridItem>
          <Card height="100%">
            <CardHeader pb={2}>
              <Heading size="md">Seller Details</Heading>
            </CardHeader>
            <CardBody pt={2}>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Company Name</Text>
                  <Text fontSize="sm">{sellerDetails?.companyName}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Contact Person</Text>
                  <Text fontSize="sm">{sellerDetails?.contactPerson}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Email</Text>
                  <Text fontSize="sm">{sellerDetails?.email}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Phone Number</Text>
                  <Text fontSize="sm">{sellerDetails?.phoneNumber}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Country</Text>
                  <Text fontSize="sm">{sellerDetails?.country}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Industry</Text>
                  <Text fontSize="sm">{sellerDetails?.industry}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Package Type</Text>
                  <Badge colorScheme="purple" fontSize="0.8em">
                    {sellerDetails?.packageType ? sellerDetails.packageType : 'Not specified'}
                  </Badge>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Products Offering</Text>
                  <HStack mt={1} wrap="wrap" gap={1}>
                    {sellerDetails?.products.map((product, index) => (
                      <Badge key={index} colorScheme="blue" fontSize="0.7em" py="0.5">
                        {product}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Purchased Packages</Text>
                  {sellerDetails?.packages && sellerDetails.packages.length > 0 ? (
                    <VStack align="stretch" mt={1} spacing={1}>
                      {sellerDetails.packages.map((pkg, index) => (
                        <HStack key={index} justify="space-between" p={1} bg="gray.50" borderRadius="md">
                          <Text fontSize="0.8em">{pkg.packageName}</Text>
                          <Badge 
                            colorScheme={pkg.status === 'Active' ? 'green' : pkg.status === 'Expired' ? 'red' : 'gray'}
                            fontSize="0.7em"
                          >
                            {pkg.status}
                          </Badge>
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Text fontSize="0.8em" color="gray.500">No packages purchased</Text>
                  )}
                </Box>

                <Box>
                  <Text fontWeight="bold" fontSize="sm">Certifications</Text>
                  <HStack mt={1} wrap="wrap" gap={1}>
                    {sellerDetails?.certifications.map((cert, index) => (
                      <Badge key={index} colorScheme="green" fontSize="0.7em" py="0.5">
                        {cert}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default MatchDetails;