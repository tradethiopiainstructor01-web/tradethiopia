import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  VStack,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user';
import { SUPERVISOR_ROLE } from './supervisorRole';

const SupervisorAccountPage = () => {
  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    password: '',
  });
  const toast = useToast();
  const navigate = useNavigate();
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const { username, email, password } = formValues;
    if (!username || !email || !password) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const mockUser = {
      _id: 'supervisor-account',
      username,
      email,
      role: SUPERVISOR_ROLE.id,
      status: 'active',
      department: 'Finance Oversight',
      token: 'supervisor-mocked-token',
    };

    setCurrentUser(mockUser);
    toast({
      title: 'Supervisor account ready',
      description: 'You are now logged in as supervisor.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    navigate('/supervisor');
  };

  return (
    <Box
      maxW="md"
      mx="auto"
      mt={12}
      p={6}
      borderRadius="lg"
      boxShadow="lg"
      bg={useColorModeValue('white', 'gray.800')}
    >
      <Heading mb={4} size="lg" textAlign="center">
        Supervisor Account Setup
      </Heading>
      <Text mb={6} color="gray.600">
        Create a supervisor account to unlock the dedicated dashboard. This is
        a quick local setup that stores credentials in the browser for demo
        purposes.
      </Text>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl>
            <FormLabel>Full name</FormLabel>
            <Input
              name="username"
              value={formValues.username}
              onChange={handleChange}
              placeholder="Meron Gebru"
              autoComplete="name"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              placeholder="meron@tradethiopia.com"
              autoComplete="email"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              name="password"
              type="password"
              value={formValues.password}
              onChange={handleChange}
              placeholder="●●●●●●"
            />
          </FormControl>
          <Button type="submit" colorScheme="teal" width="full">
            Create Supervisor Account
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default SupervisorAccountPage;
