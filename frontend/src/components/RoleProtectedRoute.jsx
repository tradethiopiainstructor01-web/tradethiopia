import React from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import { Box, Text, Button } from '@chakra-ui/react';
import { useUserStore } from '../store/user.js';

const RoleProtectedRoute = ({ allowedRoles = [], children }) => {
  const currentUser = useUserStore((s) => s.currentUser);

  // If not logged in, redirect to login
  if (!currentUser || !currentUser.token) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not allowed, show access denied
  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <Box p={6} textAlign="center">
        <Text fontSize="xl" fontWeight="bold" mb={4}>Access denied</Text>
        <Text mb={6}>You do not have permission to view this page.</Text>
        <Button as={RouterLink} to="/" colorScheme="blue">Go Home</Button>
      </Box>
    );
  }

  // Allowed
  return children;
};

export default RoleProtectedRoute;
