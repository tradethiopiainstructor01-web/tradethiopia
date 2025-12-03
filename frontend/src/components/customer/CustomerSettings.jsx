import { Box, Heading, Text, Stack, Divider } from '@chakra-ui/react';

const CustomerSettings = () => {
  return (
    <Box p={6}>
      <Heading size="md" mb={2}>Customer Settings</Heading>
      <Text color="gray.600">
        Settings placeholder. Add profile preferences, notification toggles, and account controls here.
      </Text>
      <Divider my={4} />
      <Stack spacing={3}>
        <Text fontSize="sm" color="gray.500">No settings configured yet.</Text>
      </Stack>
    </Box>
  );
};

export default CustomerSettings;
