import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  Heading,
  useColorModeValue,
  IconButton,
  useMediaQuery,
  HStack,
  Card,
  CardBody,
  Stack,
  Divider,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const MotionBox = motion.div;

const App = () => {
  const [colorMode, setColorMode] = useState("light");
  const [isSmallScreen] = useMediaQuery("(max-width: 768px)");

  const navigate = useNavigate();

  const toggleColorMode = () => {
    setColorMode(colorMode === "light" ? "dark" : "light");
  };

  return (
    <Box minH="100vh" display="flex" bg={colorMode === "light" ? "gray.50" : "gray.800"}>
      {/* Theme Toggle Icon */}
      <Box position="fixed" top={4} right={4} zIndex="10">
        <IconButton
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
          bg="transparent"
          _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
          p={3}
          aria-label="Toggle Theme"
          color={colorMode === "light" ? "gray.800" : "whiteAlpha.800"}
        />
      </Box>

      {/* Main Content */}
      <Box
        flex="1"
        bg={colorMode === "light" ? "white" : "gray.700"} // Main content background changes based on theme
        p={10}
        boxShadow="lg"
        ml={isSmallScreen ? 0 : 0}
        mr={16}
        borderRadius="lg"
      >
        <VStack align="start" spacing={10}>
          <Heading size="xl" color={colorMode === "light" ? "purple.700" : "purple.300"}>
            TESSBINN
          </Heading>

          {/* Animated Line under Heading */}
          <MotionBox
            height="2px"
            bg="purple.500"
            width="50%"
            mx="auto"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            mt={1}
          />

          {/* Cards for different content */}
          <Flex wrap="wrap" gap={6} justify="center">
            <Card maxW="sm" bg={colorMode === "light" ? "white" : "gray.800"} boxShadow="lg" borderRadius="lg">
              <CardBody>
                <Heading size="md" color={colorMode === "light" ? "purple.700" : "purple.300"}>
                  Stoke-Market
                </Heading>
                <Text fontSize="lg" color={colorMode === "light" ? "gray.600" : "gray.300"}>
                  This is the description for the Stoke-Market page.
                </Text>
              </CardBody>
            </Card>

            <Card maxW="sm" bg={colorMode === "light" ? "white" : "gray.800"} boxShadow="lg" borderRadius="lg">
              <CardBody>
                <Heading size="md" color={colorMode === "light" ? "purple.700" : "purple.300"}>
                  Digital-Market
                </Heading>
                <Text fontSize="lg" color={colorMode === "light" ? "gray.600" : "gray.300"}>
                  This is the description for the Digital-Market page.
                </Text>
              </CardBody>
            </Card>

            <Card maxW="sm" bg={colorMode === "light" ? "white" : "gray.800"} boxShadow="lg" borderRadius="lg">
              <CardBody>
                <Heading size="md" color={colorMode === "light" ? "purple.700" : "purple.300"}>
                  Import & Export
                </Heading>
                <Text fontSize="lg" color={colorMode === "light" ? "gray.600" : "gray.300"}>
                  This is the description for the Import & Export page.
                </Text>
              </CardBody>
            </Card>

            <Card maxW="sm" bg={colorMode === "light" ? "white" : "gray.800"} boxShadow="lg" borderRadius="lg">
              <CardBody>
                <Heading size="md" color={colorMode === "light" ? "purple.700" : "purple.300"}>
                  More Info
                </Heading>
                <Text fontSize="lg" color={colorMode === "light" ? "gray.600" : "gray.300"}>
                  Discover more about different topics.
                </Text>
              </CardBody>
            </Card>
          </Flex>

          {/* Navigation Buttons */}
          <HStack justify="space-between" mt={6}>
            <Button
              colorScheme="purple"
              variant="outline"
              onClick={() => navigate(-1)}
              _hover={{ backgroundColor: "purple.500", color: "white" }}
            >
              Back
            </Button>
            <Button
              colorScheme="purple"
              onClick={() => navigate("/fourthpage")}
              _hover={{ backgroundColor: "purple.500", color: "white" }}
            >
              Next
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default Check;
