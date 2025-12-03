import { Box, Heading, Text, Stack } from '@chakra-ui/react';

const DailyFollowupSuccess = ({ department }) => {
  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
      <Heading size="sm" mb={2}>Daily Follow-up Success</Heading>
      <Stack spacing={1}>
        <Text fontSize="sm" color="gray.600">
          Placeholder widget for {department || 'all departments'}.
        </Text>
        <Text fontSize="xs" color="gray.500">
          Add charts or stats here once data is ready.
        </Text>
      </Stack>
    </Box>
  );
};

export default DailyFollowupSuccess;
