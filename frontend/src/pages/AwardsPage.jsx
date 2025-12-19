import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import AwardsPanel from '../components/AwardsPanel';
import { useUserStore } from '../store/user';
import { calculateAwards } from '../services/awardService';
import Layout from '../components/Layout';

const ADMIN_ROLES = new Set(['admin', 'hr', 'coo']);

const getCurrentMonth = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}`;
};

const AwardsPage = () => {
  const [month, setMonth] = useState(getCurrentMonth());
  const [refreshKey, setRefreshKey] = useState(0);
  const [awardsPublished, setAwardsPublished] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const toast = useToast();
  const currentUser = useUserStore((state) => state.currentUser);

  const canCalculate = currentUser
    ? ADMIN_ROLES.has((currentUser.role || currentUser.normalizedRole || '').toLowerCase())
    : false;

  useEffect(() => {
    setAwardsPublished(false);
  }, [month]);

  const handleCalculate = async () => {
    if (!month || !canCalculate) return;
    if (!confirm(`Publish awards for ${month}? This cannot be undone.`)) return;
    setCalculating(true);
    try {
      const res = await calculateAwards(month);
      if (res && res.success) {
        toast({
          title: 'Awards published',
          description: `Published ${res.data?.length ?? 0} awards for ${month}`,
          status: 'success',
          duration: 6000,
        });
        setRefreshKey((prev) => prev + 1);
      } else {
        toast({
          title: 'Calculation failed',
          description: res?.message || 'Unable to publish awards',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || err?.message || 'Failed to publish awards',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setCalculating(false);
    }
  };

  return (
    <Layout>
    <Box p={4}>
      <Heading size="lg" mb={4}>
        Monthly Employee Awards
      </Heading>

      <Stack
        direction={{ base: 'column', md: 'row' }}
        align="center"
        spacing={3}
        mb={4}
        flexWrap="wrap"
      >
        <Input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          max={getCurrentMonth()}
          width="200px"
        />
        {canCalculate && (
          <Button
            colorScheme="teal"
            onClick={handleCalculate}
            isLoading={calculating}
            loadingText="Publishing..."
            isDisabled={awardsPublished}
          >
            {awardsPublished ? 'Awards already published' : `Calculate Awards (${month})`}
          </Button>
        )}
        {awardsPublished && (
          <Text color="green.600" fontSize="sm">
            Awards for {month} are published and read-only.
          </Text>
        )}
      </Stack>

      <AwardsPanel
        month={month}
        refreshKey={refreshKey}
        onAwardsLoaded={(list) => setAwardsPublished(Boolean(list && list.length))}
      />
    </Box>
    </Layout>
  );
};

export default AwardsPage;
