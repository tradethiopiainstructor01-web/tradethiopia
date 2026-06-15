import { Center, Text, VStack, Button, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/user";
import SocialMediaWorkspace from "../../components/socialmedia/SocialMediaWorkspace";

const normalizeRoleValue = (value = "") =>
  value?.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const SocialMediaDashboardPage = () => {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);
  const normalizedRole = normalizeRoleValue(currentUser?.role || currentUser?.normalizedRole);
  const allowedRoles = new Set(["socialmediamanager", "socialmedia"]);
  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const muted = useColorModeValue("gray.600", "gray.300");

  console.log('SocialMediaDashboardPage - check:', {
    hasCurrentUser: !!currentUser,
    userRole: currentUser?.role,
    normalizedRole,
    isAllowed: allowedRoles.has(normalizedRole)
  });

  if (!currentUser) {
    console.log('SocialMediaDashboardPage - Redirecting/rendering login prompt (no user)');
    return (
      <Center minH="100vh" bg={pageBg} px={4}>
        <VStack spacing={4} bg={cardBg} p={6} borderRadius="xl" boxShadow="lg">
          <Text fontSize="lg" fontWeight="bold">
            Please log in to continue
          </Text>
          <Text textAlign="center" color={muted}>
            This workspace is available for the social media manager role.
          </Text>
          <Button colorScheme="purple" onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </VStack>
      </Center>
    );
  }

  if (!allowedRoles.has(normalizedRole)) {
    return (
      <Center minH="100vh" bg={pageBg} px={4}>
        <VStack spacing={4} bg={cardBg} p={6} borderRadius="xl" boxShadow="lg">
          <Text fontSize="lg" fontWeight="bold">
            Access denied
          </Text>
          <Text textAlign="center" color={muted}>
            Only users with the social media manager role can access this dashboard.
          </Text>
          <Button colorScheme="purple" onClick={() => navigate("/login")}>
            Switch Account
          </Button>
        </VStack>
      </Center>
    );
  }

  return <SocialMediaWorkspace />;
};

export default SocialMediaDashboardPage;
