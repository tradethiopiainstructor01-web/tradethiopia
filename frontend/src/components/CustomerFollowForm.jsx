import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Heading,
  useToast,
  Grid,
  GridItem,
  VStack,
  IconButton,
  CloseButton,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FaRegCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const CustomerFollowForm = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  const toast = useToast();

  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!fullName || !email || !phoneNumber || !followUpDate || !status) {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const newFollowUp = { fullName, email, phoneNumber, followUpDate, status, notes };
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/followup`, newFollowUp);
      
      toast({
        render: () => (
          <Box color="white" p={3} bg="teal.500" borderRadius="md" display="flex" alignItems="center">
            <IconButton
              icon={<FaRegCheckCircle />}
              aria-label="Success"
              colorScheme="whiteAlpha"
              mr={2}
              variant="outline"
            />
            <Box>
              <strong>Success:</strong> Follow-up added successfully.
            </Box>
            <CloseButton onClick={() => toast.closeAll()} />
          </Box>
        ),
        duration: 5000,
        isClosable: true,
      });

      // Reset form fields
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      setFollowUpDate('');
      setStatus('Pending');
      setNotes('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || "There was an issue adding the follow-up.";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Error adding follow-up:", error);
    }
  };

  return (
    <Box
      maxW={{ base: '90%', md: '600px' }}
      mx="auto"
      mt="50px"
      p="30px"
      boxShadow="lg"
      borderRadius="md"
      bg="white"
      border="1px"
      borderColor="teal.200"
    >
      <Heading mb="6" textAlign="center" color="teal.600">Add Follow-Up</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
            <GridItem>
              <FormControl id="fullName" isRequired>
                <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Customer Name</FormLabel>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  focusBorderColor="teal.500"
                  placeholder="Enter full name"
                  variant="outline"
                />
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl id="email" isRequired>
                <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  focusBorderColor="teal.500"
                  placeholder="Enter email address"
                  variant="outline"
                />
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl id="phoneNumber" isRequired>
                <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Phone Number</FormLabel>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  focusBorderColor="teal.500"
                  placeholder="Enter phone number"
                  variant="outline"
                />
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl id="followUpDate" isRequired>
                <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Follow-Up Date</FormLabel>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  focusBorderColor="teal.500"
                  variant="outline"
                />
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl id="status" isRequired>
                <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Status</FormLabel>
                <Select
                  placeholder="Select status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  focusBorderColor="teal.500"
                  variant="outline"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </Select>
              </FormControl>
            </GridItem>

            <GridItem colSpan={2}>
              <FormControl id="notes">
                <FormLabel fontSize="lg" fontWeight="bold" color="teal.700">Notes</FormLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  focusBorderColor="teal.500"
                  placeholder="Enter additional notes"
                  variant="outline"
                />
              </FormControl>
            </GridItem>
          </Grid>

          <Button
            type="submit"
            colorScheme="teal"
            width="full"
            mt="4"
            _hover={{ bg: "teal.600" }}
            size="lg"
            isDisabled={!fullName || !email || !phoneNumber || !followUpDate || !status}
          >
            Add Follow-Up
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default CustomerFollowForm;