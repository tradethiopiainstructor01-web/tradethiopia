import { Box, Heading, Text, Stack } from '@chakra-ui/react';

const PerformanceViewer = ({ department }) => {
  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg="white">
      <Heading size="sm" mb={2}>Performance Viewer</Heading>
      <Stack spacing={1}>
        <Text fontSize="sm" color="gray.600">
          Placeholder performance view for {department || 'all departments'}.
        </Text>
        <Text fontSize="xs" color="gray.500">
          Add trend charts or KPIs here once available.
        </Text>
      </Stack>
    </Box>
  );
};

export default PerformanceViewer;
