import React from "react";
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Heading,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

const metricCards = [
  { label: "Active Students", value: "128", help: "+5 this week" },
  { label: "Active Courses", value: "6", help: "2 new" },
  { label: "Pending Requests", value: "14", help: "3 awaiting review" },
];

const InstructorDashboard = () => {
  const bg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg" mb={2}>
          Welcome back, instructor
        </Heading>
        <Text color="gray.500">
          Review active students, manage requests, and keep an eye on the notice board from this central cockpit.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {metricCards.map((metric) => (
          <Box
            key={metric.label}
            p={5}
            borderRadius="md"
            bg={bg}
            shadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Stat>
              <StatLabel>{metric.label}</StatLabel>
              <StatNumber>{metric.value}</StatNumber>
              <StatHelpText>{metric.help}</StatHelpText>
            </Stat>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  );
};

export default InstructorDashboard;
