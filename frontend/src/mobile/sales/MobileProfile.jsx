import { Avatar, Box, Button, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { FiLogOut, FiMail, FiUser } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/user';
import { rememberReturnPath } from '../../utils/authStorage';

// Same content and actions as the desktop sales navbar profile menu (components/sales/Snavbar.jsx).
const MobileProfile = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const navigate = useNavigate();
  const location = useLocation();

  const employeeName = currentUser?.fullName || currentUser?.username || 'Employee';
  const employeeEmail = currentUser?.email || 'Email not available';
  const employeeRole = currentUser?.jobTitle || currentUser?.displayRole || currentUser?.role || 'Employee';

  const handleLogout = () => {
    rememberReturnPath(`${location.pathname}${location.search}${location.hash}`, currentUser);
    clearUser();
    navigate('/login', { replace: true });
  };

  return (
    <Box bg="white" borderRadius="14px" borderWidth="1px" borderColor="#E8EDF5" p={5}>
      <VStack spacing={2} textAlign="center">
        <Avatar name={employeeName} size="lg" bg="#0E8C80" color="white" />
        <Text fontSize="18px" fontWeight="800" color="#081A34">{employeeName}</Text>
        <HStack spacing={1.5} color="#6E7890" maxW="100%">
          <Icon as={FiMail} boxSize={3.5} flexShrink={0} />
          <Text fontSize="14px" noOfLines={1}>{employeeEmail}</Text>
        </HStack>
        <Text px={2.5} borderRadius="full" bg="#E3F4F1" color="#0A6F66" fontSize="12px" fontWeight="700" textTransform="capitalize">
          {employeeRole}
        </Text>
      </VStack>
      <VStack spacing={2} mt={5}>
        <Button
          w="100%"
          leftIcon={<FiUser />}
          variant="outline"
          borderColor="#0E8C80"
          color="#0E8C80"
          onClick={() => navigate('/employee-info')}
        >
          My personal information
        </Button>
        <Button w="100%" leftIcon={<FiLogOut />} variant="ghost" colorScheme="red" onClick={handleLogout}>
          Log out
        </Button>
      </VStack>
    </Box>
  );
};

export default MobileProfile;
