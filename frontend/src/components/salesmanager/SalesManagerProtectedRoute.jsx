import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '../../store/user';
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription, Button, VStack } from '@chakra-ui/react';

const SalesManagerProtectedRoute = ({ children }) => {
  const currentUser = useUserStore((state) => state.currentUser);

  // Normalize role and also check localStorage for fallback
  const storedRole = (typeof localStorage !== 'undefined' && localStorage.getItem('userRole')) || '';
  const normalizedRole = (currentUser?.role || storedRole || '').toString().trim().toLowerCase();

  console.log('🔐 SalesManagerProtectedRoute Check:');
  console.log('  - Current User:', currentUser);
  console.log('  - Stored Role:', storedRole);
  console.log('  - Normalized Role:', normalizedRole);
  console.log('  - Is Sales Manager?', normalizedRole === 'salesmanager');

  if (normalizedRole !== 'salesmanager') {
    console.warn('❌ Access Denied - Not a sales manager');
    
    // Show a helpful message before redirecting
    return (
      <Box p={8} maxW="600px" mx="auto" mt={10}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="300px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Access Denied
          </AlertTitle>
          <AlertDescription maxWidth="sm" mt={2}>
            <VStack spacing={4}>
              <Box>
                This page requires Sales Manager access.
                {currentUser && (
                  <Box mt={2}>
                    <strong>Your role:</strong> {currentUser.role || 'None'}
                  </Box>
                )}
                {!currentUser && (
                  <Box mt={2}>
                    You are not logged in.
                  </Box>
                )}
              </Box>
              <Button
                colorScheme="blue"
                onClick={() => window.location.href = '/login'}
              >
                Go to Login
              </Button>
            </VStack>
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  console.log('✅ Access Granted - Rendering protected content');
  return children;
};

export default SalesManagerProtectedRoute;