import React from "react";
import { Box, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import RequestPage from "../../pages/RequestPage";

const InstructorRequest = () => {
  const bg = useColorModeValue("white", "gray.700");
  return (
    <Box
      p={{ base: 4, md: 6 }}
      borderRadius="lg"
      bg={bg}
      borderWidth="1px"
      borderColor={useColorModeValue("gray.200", "gray.600")}
      boxShadow="sm"
    >
      <Heading size="lg" mb={4}>
        Submit a request
      </Heading>
      <Text mb={6} color="gray.500">
        Override the department if needed, add attachments, and let finance route approvals.
      </Text>
      <RequestPage maxWidth="960px" />
    </Box>
  );
};

export default InstructorRequest;
