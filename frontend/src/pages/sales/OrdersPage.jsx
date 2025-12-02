import React from 'react';
import {
  Box,
  Heading,
  useColorModeValue,
  HStack
} from '@chakra-ui/react';
import FinanceLayout from './FinanceLayout';
import OrdersManagementPage from '../../components/finance/OrdersPage';

const OrdersPage = () => {
  const headerColor = useColorModeValue('teal.600', 'teal.200');

  return (
    <FinanceLayout>
      <Box>
        <HStack justify="space-between" mb={6}>
          {/* <Heading as="h1" size="xl" color={headerColor}>
            Order Management
          </Heading> */}
        </HStack>
        <OrdersManagementPage />
      </Box>
    </FinanceLayout>
  );
};

export default OrdersPage;