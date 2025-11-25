import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Image,
  useBreakpointValue,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { FaClock } from 'react-icons/fa';
import { useUserStore } from '../store/user'; // Update the import path if necessary
import { useNavigate } from 'react-router-dom';

const WaitingForApproval = () => {
  const headingSize = useBreakpointValue({ base: 'xl', md: '2xl' });
  const textSize = useBreakpointValue({ base: 'md', md: 'lg' });
  const { clearUser } = useUserStore(); // Ensure clearUser is available from your Zustand store
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUser(); // Clear user data from Zustand store
    toast({
      title: "Logged Out",
      description: "Your request will be considered soon.",
      status: "info",
      duration: 5000,
      isClosable: true,
    });
    navigate('/login'); // Redirect to the login page
  };

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minHeight="100vh"
      bgGradient="linear(to-r, teal.500, green.500)"
      color="white"
      textAlign="center"
      padding={4}
    >
      <Box mb={6}>
        <Image
          src="./clock.png" // Replace with your image URL
          alt="Waiting for Approval"
          boxSize={{ base: '150px', md: '200px' }}
          marginBottom={4}
        />
      </Box>
      <Heading as="h1" size={headingSize} mb={4}>
        Waiting for Approval
      </Heading>
      <Text fontSize={textSize} mb={6}>
        Your request is being reviewed by the admin. Please wait for an approval.
      </Text>
      <Flex align="center" mb={4}>
        <Spinner size="lg" color="yellow.300" mr={2} />
        <Text fontSize={textSize}>
          This might take a moment...
        </Text>
      </Flex>
      <Button
        colorScheme="yellow"
        size="lg"
        leftIcon={<FaClock />}
        onClick={handleLogout}
      >
        OK
      </Button>
    </Flex>
  );
};

export default WaitingForApproval;