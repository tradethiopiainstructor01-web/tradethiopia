import React from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  Badge,
  Divider,
  Flex,
  HStack,
  IconButton,
  Input,
  Spinner,
  Table,
  Tbody,
  Td,
  TableContainer,
  Text,
  Th,
  Thead,
  Tr,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { ArrowBackIcon, CheckIcon, RepeatIcon, SearchIcon, EditIcon, SmallCloseIcon } from "@chakra-ui/icons";

const CompactHeaderCell = ({ children, borderColor }) => (
  <Th
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
  </Th>
);

const CompactCell = ({ children }) => (
  <Td py={2} px={3} fontSize="sm" borderBottom="1px solid">
    {children}
  </Td>
);

const FollowupTabPage = ({
  cardBg,
  headerBg,
  borderColor,
  tableBorderColor,
  tableBg,
  rowHoverBg,
  renderColumnMenu,
  followupColumnOptions,
  loading,
  error,
  searchQuery,
  handleSearch,
  isMobile,
  isMobileView,
  handleBackToCompanyList,
  handleRowClick,
  selectedRow,
  filteredData,
  followupColumnsToRender,
  onRefresh,
  onSelectRow,
  onSelectAll,
  selectedIds,
  onBulkEmail,
  onOpenConversation,
}) => {
  return (
    <Card bg={cardBg} boxShadow="md" borderRadius="lg">
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* Search and Actions */}
            <Flex
              direction={isMobile ? "column" : "row"}
              gap={3}
              justify="space-between"
              align="center"
            >
              <Flex flex={1} maxWidth={isMobile ? "100%" : "300px"}>
                <Input
                  placeholder="Search by client or company..."
                  value={searchQuery}
                  onChange={handleSearch}
                  size="md"
                  borderRadius="md"
                  borderColor={borderColor}
                  leftElement={<SearchIcon color="gray.300" />}
                />
              </Flex>

              <HStack spacing={2}>
                <Button size="sm" colorScheme="teal" onClick={onBulkEmail} isDisabled={!selectedIds.length}>
                  Bulk Email ({selectedIds.length})
                </Button>
                {renderColumnMenu("followup", followupColumnOptions)}
                <Tooltip label="Refresh data">
                  <IconButton
                    aria-label="Refresh"
                    icon={<RepeatIcon />}
                  colorScheme="blue"
                  size="md"
                  onClick={onRefresh}
                />
              </Tooltip>
            </HStack>
          </Flex>

          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner size="xl" />
            </Flex>
          ) : error ? (
            <Text color="red.500" fontSize="lg" textAlign="center">
              {error}
            </Text>
          ) : (
            <>
              {isMobile && isMobileView ? (
                <Box>
                  <Button
                    leftIcon={<ArrowBackIcon />}
                    onClick={handleBackToCompanyList}
                    mb={4}
                    size="sm"
                    colorScheme="blue"
                  >
                    Back
                  </Button>
                  <VStack spacing={4} align="stretch">
                    <Card>
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Client:</Text>
                            <Text>{selectedRow.clientName}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Company:</Text>
                            <Text>{selectedRow.companyName}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Phone:</Text>
                            <Text>{selectedRow.phoneNumber}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Email:</Text>
                            <Text>{selectedRow.email}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Package:</Text>
                            <Badge colorScheme="purple">{selectedRow.packageType || "Not specified"}</Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Deadline:</Text>
                            <Text>{new Date(selectedRow.deadline).toLocaleDateString()}</Text>
                          </HStack>
                          <Divider />
                          <HStack spacing={2}>
                            <Button
                              colorScheme="teal"
                              size="sm"
                              onClick={() => {
                                onSelectClient(selectedRow);
                                openNotesModal();
                              }}
                            >
                              Add Note
                            </Button>
                            <Button
                              colorScheme="teal"
                              size="sm"
                              onClick={() => {
                                onSelectClient(selectedRow);
                                setShowUpdateCard(true);
                              }}
                            >
                              Update
                            </Button>
                            <IconButton
                              aria-label="Edit customer"
                              icon={<EditIcon />}
                              colorScheme="blue"
                              size="sm"
                              onClick={() => {
                                onSelectClient(selectedRow);
                                onEditOpen();
                              }}
                            />
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </Box>
              ) : (
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
                    minWidth={isMobile ? "600px" : "auto"}
                  >
                    <Thead bg={headerBg}>
                      <Tr>
                        {followupColumnsToRender.map((col) => (
                          <CompactHeaderCell key={col.key} borderColor={borderColor}>{col.header}</CompactHeaderCell>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Array.isArray(filteredData) && filteredData.map((item) => (
                        <Tr
                          key={item._id}
                          onClick={() => isMobile && handleRowClick(item)}
                          _hover={{ bg: rowHoverBg }}
                          cursor={isMobile ? "pointer" : "default"}
                        >
                          {followupColumnsToRender.map((col) => (
                            <React.Fragment key={col.key}>{col.render(item)}</React.Fragment>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

                  {(!Array.isArray(filteredData) || filteredData.length === 0) && (
                    <Text textAlign="center" py={8} color="gray.500">
                      No customers found
                    </Text>
                  )}
                </TableContainer>
              )}
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default FollowupTabPage;
