import { Box, Heading, Text, Stack, Divider } from '@chakra-ui/react';

const TradexTVDashboard = () => {
  return (
    <Box p={6}>
      <Heading size="md" mb={2}>TradexTV Dashboard</Heading>
      <Text color="gray.600">
        Placeholder dashboard for TradexTV. Add metrics, charts, and workflow widgets here.
      </Text>
      <Divider my={4} />
      <Stack spacing={3}>
        <Text fontSize="sm" color="gray.500">No data yet.</Text>
      </Stack>
    </Box>
  );
};

export default TradexTVDashboard;
