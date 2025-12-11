import { useMemo } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  IconButton,
  Text,
  useColorMode,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/user";
import SocialMediaManager from "../../components/socialmedia/SocialMediaManager";
import NoticeBoardPanel from "../../components/NoticeBoardPanel";

const SocialMediaDashboardPage = () => {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);
  const authorizedEmail = "socialmedia@gmail.com";
  const normalizedEmail = currentUser?.email?.toLowerCase().trim() || "";
  const normalizedRole = currentUser?.role?.toLowerCase().trim() || "";
  const isAuthorized = useMemo(() => {
    return (
      normalizedEmail === authorizedEmail ||
      normalizedRole === "socialmediamanager" ||
      normalizedRole === "socialmedia"
    );
  }, [normalizedEmail, normalizedRole, authorizedEmail]);

  const clearUser = useUserStore((state) => state.clearUser);
  const { colorMode, toggleColorMode } = useColorMode();
  const handleLogout = () => {
    if (typeof clearUser === "function") {
      clearUser();
    }
    navigate("/login");
  };
  const handleLogin = () => navigate("/login");
  const handleRequestNav = () => {
    navigate("/social-media/request");
  };

  if (!currentUser) {
    return (
      <Center minH="100vh" bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <VStack spacing={4} bg="white" p={6} borderRadius="xl" boxShadow="lg">
          <Text fontSize="lg" fontWeight="bold">
            Please log in to continue
          </Text>
          <Text textAlign="center" color="gray.600">
            Only the social media specialist account can access this dashboard.
          </Text>
          <Button colorScheme="purple" onClick={handleLogin}>
            Go to Login
          </Button>
        </VStack>
      </Center>
    );
  }

  if (!isAuthorized) {
    return (
      <Center minH="100vh" bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <VStack spacing={4} bg="white" p={6} borderRadius="xl" boxShadow="lg">
          <Text fontSize="lg" fontWeight="bold">
            Access denied
          </Text>
          <Text textAlign="center" color="gray.600">
            This dashboard is reserved for {authorizedEmail}. Please log in with that account.
          </Text>
          <Button colorScheme="purple" onClick={handleLogin}>
            Switch Account
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box
      minH="100vh"
      bg={useColorModeValue("gray.100", "gray.900")}
      px={{ base: 4, md: 6 }}
      py={{ base: 6, md: 10 }}
    >
      <Box mb={8}>
        <NoticeBoardPanel
          title="Social Media Notice Board"
          subtitle="Broadcast updates curated for the social media team."
          embedded
        />
      </Box>
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.600">
          Social media workspace shortcuts
        </Text>
        <HStack spacing={2}>
          <Button size="sm" variant="outline" colorScheme="teal" onClick={handleRequestNav}>
            Request center
          </Button>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            variant="ghost"
            size="sm"
            onClick={toggleColorMode}
          />
          <Button size="sm" variant="ghost" colorScheme="red" onClick={handleLogout}>
            Logout
          </Button>
        </HStack>
      </Flex>
      <SocialMediaManager />
    </Box>
  );
};

export default SocialMediaDashboardPage;
