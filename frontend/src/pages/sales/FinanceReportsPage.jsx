import React from 'react';
import {
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
  Button,
  HStack
} from '@chakra-ui/react';
import { FaChartBar, FaChartPie, FaFileInvoice } from 'react-icons/fa';
import FinanceLayout from './FinanceLayout';

const FinanceReportsPage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('teal.600', 'teal.200');

  return (
    <FinanceLayout>
      <Box>
        <HStack justify="space-between" mb={6}>
          <Heading as="h1" size="xl" color={headerColor}>
            Financial Reports
          </Heading>
          <HStack>
            <Button leftIcon={<FaFileInvoice />} colorScheme="teal">
              Generate Report
            </Button>
            <Button colorScheme="blue">Export Data</Button>
          </HStack>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
          <Card bg={cardBg} boxShadow="md">
            <CardHeader>
              <Heading as="h2" size="md">Revenue Report</Heading>
            </CardHeader>
            <CardBody>
              <Box height="200px" display="flex" alignItems="center" justifyContent="center">
                <Text color="gray.500">Revenue chart visualization</Text>
              </Box>
            </CardBody>
          </Card>

          <Card bg={cardBg} boxShadow="md">
            <CardHeader>
              <Heading as="h2" size="md">Expense Report</Heading>
            </CardHeader>
            <CardBody>
              <Box height="200px" display="flex" alignItems="center" justifyContent="center">
                <Text color="gray.500">Expense chart visualization</Text>
              </Box>
            </CardBody>
          </Card>

          <Card bg={cardBg} boxShadow="md">
            <CardHeader>
              <Heading as="h2" size="md">Profit & Loss</Heading>
            </CardHeader>
            <CardBody>
              <Stat>
                <StatLabel>Net Profit</StatLabel>
                <StatNumber color="green.500">ETB 245,678</StatNumber>
                <StatLabel mt={4}>Total Revenue</StatLabel>
                <StatNumber>ETB 1,245,678</StatNumber>
                <StatLabel mt={4}>Total Expenses</StatLabel>
                <StatNumber>ETB 1,000,000</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card bg={cardBg} boxShadow="md">
          <CardHeader>
            <Heading as="h2" size="md">Detailed Reports</Heading>
          </CardHeader>
          <CardBody>
            <Text>Comprehensive financial reports and analytics will be displayed here.</Text>
          </CardBody>
        </Card>
      </Box>
    </FinanceLayout>
  );
};

export default FinanceReportsPage;