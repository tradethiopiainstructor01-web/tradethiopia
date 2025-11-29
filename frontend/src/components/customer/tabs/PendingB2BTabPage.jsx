import React from "react";
import {
  Badge,
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  IconButton,
  Table,
  Tbody,
  Td,
  TableContainer,
  Text,
  Thead,
  Tr,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { DownloadIcon, RepeatIcon } from "@chakra-ui/icons";

const CompactHeaderCell = ({ children, borderColor }) => (
  <Td
    as="th"
    py={3}
    px={3}
    fontSize="sm"
    fontWeight="bold"
    color="white"
    position="sticky"
    top={0}
    bg="transparent"
    zIndex={1}
    boxShadow="sm"
    borderColor={borderColor}
  >
    {children}
  </Td>
);

const CompactCell = ({ children }) => (
  <Td py={2} px={3} fontSize="sm" borderBottom="1px solid">
    {children}
  </Td>
);

const PendingB2BTabPage = ({
  cardBg,
  headerBg,
  borderColor,
  tableBorderColor,
  tableBg,
  rowHoverBg,
  renderColumnMenu,
  pendingB2BColumnOptions,
  pendingB2BColumnsToRender,
  pendingB2BCustomers,
  loadingB2B,
  fetchPendingB2BCustomers,
}) => {
  return (
    <Card bg={cardBg} boxShadow="md" borderRadius="lg">
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* B2B Actions */}
          <Flex justify="space-between" align="center">
            <Heading size="md" color={headerBg}>
              Pending B2B Customers for Import
            </Heading>
            <HStack spacing={2}>
              {renderColumnMenu("pendingB2B", pendingB2BColumnOptions)}
              <Tooltip label="Refresh B2B customer list">
                <IconButton
                  aria-label="Refresh B2B"
                  icon={<RepeatIcon />}
                  colorScheme="blue"
                  onClick={fetchPendingB2BCustomers}
                  isLoading={loadingB2B}
                  size="md"
                />
              </Tooltip>
            </HStack>
          </Flex>

          <TableContainer
            overflowX="auto"
            border="1px solid"
            borderColor={tableBorderColor}
            borderRadius="lg"
            bg={tableBg}
            boxShadow="sm"
          >
            <Table
              variant="striped"
              colorScheme="gray"
              size="sm"
              minWidth="900px"
            >
              <Thead bg={headerBg}>
                <Tr>
                  {pendingB2BColumnsToRender.map((col) => (
                    <CompactHeaderCell key={col.key} borderColor={borderColor}>
                      {col.header}
                    </CompactHeaderCell>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {Array.isArray(pendingB2BCustomers) && pendingB2BCustomers.length > 0 ? (
                  pendingB2BCustomers.map((customer) => (
                    <Tr
                      key={customer._id}
                      _hover={{ bg: rowHoverBg }}
                    >
                      {pendingB2BColumnsToRender.map((col) => (
                        <React.Fragment key={col.key}>{col.render(customer)}</React.Fragment>
                      ))}
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={pendingB2BColumnsToRender.length || 1} textAlign="center" py={10}>
                      <Text color="gray.500">
                        No pending B2B customers found. All B2B customers have been imported.
                      </Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PendingB2BTabPage;
