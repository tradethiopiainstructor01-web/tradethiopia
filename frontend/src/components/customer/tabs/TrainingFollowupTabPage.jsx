import React, { useEffect, useMemo, useState, memo } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  TableContainer,
  Text,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

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

const TrainingFollowupTabPage = ({
  cardBg,
  headerBg,
  borderColor,
  tableBorderColor,
  tableBg,
  rowHoverBg,
  trainingSearch,
  setTrainingSearch,
  trainingProgressFilter,
  setTrainingProgressFilter,
  trainingScheduleFilter,
  setTrainingScheduleFilter,
  trainingMaterialFilter,
  setTrainingMaterialFilter,
  trainingCourseFilter,
  setTrainingCourseFilter,
  trainingStartDateFilter,
  setTrainingStartDateFilter,
  trainingCourseOptions,
  renderColumnMenu,
  trainingFollowupColumnOptions,
  trainingSortAsc,
  setTrainingSortAsc,
  trainingFollowupColumnsToRender,
  filteredTrainingFollowups = [],
  selectedTrainingFollowupCount,
  trainingBulkStartDate,
  trainingBulkEndDate,
  trainingBulkStartTime,
  trainingBulkEndTime,
  setTrainingBulkStartDate,
  setTrainingBulkEndDate,
  setTrainingBulkStartTime,
  setTrainingBulkEndTime,
  handleBulkUpdate,
  isApplyingTrainingDates,
  trainingAgentOptions,
  selectedAgentForAssignment,
  setSelectedAgentForAssignment,
  trainingInstructorOptions,
  selectedInstructorForAssignment,
  setSelectedInstructorForAssignment,
  isCustomerSuccessManager,
  isMobile,
  tableMinWidth = "900px",
  children, // for grouped cards
}) => {
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);

  // Reset page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [
    trainingSearch,
    trainingProgressFilter,
    trainingScheduleFilter,
    trainingMaterialFilter,
    trainingCourseFilter,
    trainingStartDateFilter,
    trainingSortAsc,
  ]);

  const total = filteredTrainingFollowups.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedItems = useMemo(
    () => filteredTrainingFollowups.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredTrainingFollowups, safePage, pageSize]
  );
  const firstRecord = total ? (safePage - 1) * pageSize + 1 : 0;
  const lastRecord = total ? Math.min(firstRecord + pagedItems.length - 1, total) : 0;

  return (
    <Card bg={cardBg} boxShadow="md" borderRadius="lg">
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Heading size="md" color={headerBg}>
            Training Follow-Up
          </Heading>

          {/* Training search / filter / sort controls */}
          <Flex
            direction={isMobile ? "column" : "row"}
            gap={3}
            align={isMobile ? "stretch" : "center"}
            flexWrap="wrap"
          >
            <Box flex={1} width="100%">
              <Input
                placeholder="Search by customer, agent, email, or course..."
                value={trainingSearch}
                onChange={(e) => setTrainingSearch(e.target.value)}
                size="sm"
                borderRadius="md"
                borderColor={borderColor}
              />
            </Box>
            <HStack
              spacing={3}
              width={isMobile ? "100%" : "auto"}
              flexWrap="wrap"
              justify={isMobile ? "flex-start" : "flex-end"}
            >
              <Box minW="160px">
                <Input
                  as="select"
                  size="sm"
                  value={trainingProgressFilter}
                  onChange={(e) => setTrainingProgressFilter(e.target.value)}
                >
                  <option value="all">All Progress</option>
                  <option value="Not Started">Not Started</option>
                  <option value="Started">Started</option>
                  <option value="Completed">Completed</option>
                  <option value="Dropped">Dropped</option>
                </Input>
              </Box>
              <Box minW="170px">
                <Input
                  as="select"
                  size="sm"
                  value={trainingScheduleFilter}
                  onChange={(e) => setTrainingScheduleFilter(e.target.value)}
                >
                  <option value="all">All Schedules</option>
                  <option value="Regular">Regular</option>
                  <option value="Night">Night</option>
                  <option value="Weekend">Weekend</option>
                  <option value="Night/Weekend">Night/Weekend</option>
                </Input>
              </Box>
              <Box minW="190px">
                <Input
                  as="select"
                  size="sm"
                  value={trainingMaterialFilter}
                  onChange={(e) => setTrainingMaterialFilter(e.target.value)}
                >
                  <option value="all">All Material Status</option>
                  <option value="Not Delivered">Not Delivered</option>
                  <option value="Delivered">Delivered</option>
                </Input>
              </Box>
              <Box minW="180px">
                <Input
                  as="select"
                  size="sm"
                  value={trainingCourseFilter}
                  onChange={(e) => setTrainingCourseFilter(e.target.value)}
                >
                  <option value="all">All Courses</option>
                  {trainingCourseOptions.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </Input>
              </Box>
              <Box minW="150px">
                <Input
                  size="sm"
                  type="date"
                  value={trainingStartDateFilter}
                  onChange={(e) => setTrainingStartDateFilter(e.target.value)}
                />
              </Box>
              {renderColumnMenu("trainingFollowup", trainingFollowupColumnOptions)}
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() => setTrainingSortAsc((prev) => !prev)}
              >
                Sort: {trainingSortAsc ? "Latest to Old" : "Oldest to Latest"}
              </Button>
            </HStack>
          </Flex>

          {isCustomerSuccessManager && (
            <Box
              border="1px solid"
              borderColor={borderColor}
              borderRadius="lg"
              p={3}
              bg={useColorModeValue("gray.50", "gray.700")}
            >
              <Flex
                direction={isMobile ? "column" : "row"}
                gap={3}
                align="center"
                justify="space-between"
                flexWrap="wrap"
              >
                <Text fontSize="sm" fontWeight="semibold">
                  {selectedTrainingFollowupCount} selected
                </Text>
                <HStack spacing={2} flexWrap="wrap" align="center">
                  <Text fontSize="xs">Start Date</Text>
                  <Input
                    size="sm"
                    type="date"
                    value={trainingBulkStartDate}
                    onChange={(e) => setTrainingBulkStartDate(e.target.value)}
                    maxW="180px"
                  />
                  <Text fontSize="xs">End Date</Text>
                  <Input
                    size="sm"
                    type="date"
                    value={trainingBulkEndDate}
                    onChange={(e) => setTrainingBulkEndDate(e.target.value)}
                    maxW="180px"
                  />
                </HStack>
                <HStack spacing={2} flexWrap="wrap" align="center">
                  <Text fontSize="xs">Start Time</Text>
                  <Input
                    size="sm"
                    type="time"
                    value={trainingBulkStartTime}
                    onChange={(e) => setTrainingBulkStartTime(e.target.value)}
                    maxW="140px"
                  />
                  <Text fontSize="xs">End Time</Text>
                  <Input
                    size="sm"
                    type="time"
                    value={trainingBulkEndTime}
                    onChange={(e) => setTrainingBulkEndTime(e.target.value)}
                    maxW="140px"
                  />
                </HStack>
                <HStack spacing={2} flexWrap="wrap" align="center">
                  <Select
                    size="sm"
                    value={selectedAgentForAssignment}
                    onChange={(e) => setSelectedAgentForAssignment(e.target.value)}
                    placeholder="Assign agent"
                    minW="180px"
                  >
                    {trainingAgentOptions.map((agent) => (
                      <option key={agent.value} value={agent.value}>
                        {agent.label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    size="sm"
                    value={selectedInstructorForAssignment}
                    onChange={(e) => setSelectedInstructorForAssignment(e.target.value)}
                    placeholder="Assign instructor"
                    minW="180px"
                  >
                    {trainingInstructorOptions.map((instructor) => (
                      <option key={instructor.value} value={instructor.value}>
                        {instructor.label}
                      </option>
                    ))}
                  </Select>
                </HStack>
                <Button
                  size="sm"
                  colorScheme="teal"
                  onClick={handleBulkUpdate}
                  isLoading={isApplyingTrainingDates}
                  isDisabled={
                    !selectedTrainingFollowupCount ||
                    !(
                      trainingBulkStartDate ||
                      trainingBulkEndDate ||
                      trainingBulkStartTime ||
                      trainingBulkEndTime ||
                      selectedAgentForAssignment ||
                      selectedInstructorForAssignment
                    )
                  }
                >
                  Apply Changes
                </Button>
              </Flex>
            </Box>
          )}

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
              minWidth={isMobile ? tableMinWidth : "auto"}
            >
              <Thead bg={headerBg}>
                <Tr>
                  {trainingFollowupColumnsToRender.map((col) => (
                    <CompactHeaderCell key={col.key} borderColor={borderColor}>{col.header}</CompactHeaderCell>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {pagedItems.length > 0 ? (
                  pagedItems.map((item) => (
                    <Tr key={item._id} _hover={{ bg: rowHoverBg }}>
                      {trainingFollowupColumnsToRender.map((col) => (
                        <React.Fragment key={col.key}>{col.render(item)}</React.Fragment>
                      ))}
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={trainingFollowupColumnsToRender.length || 1} textAlign="center" py={10}>
                      <Text color="gray.500">
                        No training follow-up records found.
                      </Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>

          {/* Pagination Controls */}
          {total > 0 && (
            <Flex
              justify="space-between"
              align="center"
              pt={2}
              gap={3}
              flexWrap="wrap"
            >
              <HStack spacing={2}>
                <Text fontSize="xs" color="gray.500">
                  Showing {firstRecord}-{lastRecord} of {total} training follow-ups
                </Text>
                <Select
                  size="xs"
                  width="95px"
                  borderRadius="md"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={15}>15 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </Select>
              </HStack>
              <HStack spacing={2}>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  isDisabled={safePage <= 1}
                >
                  Previous
                </Button>
                <Text fontSize="xs" fontWeight="medium">
                  Page {safePage} of {totalPages}
                </Text>
                <Button
                  size="xs"
                  colorScheme="teal"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  isDisabled={safePage >= totalPages}
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          )}

          {children}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default memo(TrainingFollowupTabPage);
