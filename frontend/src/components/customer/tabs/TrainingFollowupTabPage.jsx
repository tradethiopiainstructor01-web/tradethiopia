import React from "react";
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
  filteredTrainingFollowups,
  selectedTrainingFollowupCount,
  trainingBulkStartDate,
  trainingBulkEndDate,
  setTrainingBulkStartDate,
  setTrainingBulkEndDate,
  applyTrainingDates,
  isApplyingTrainingDates,
  trainingAgentOptions,
  selectedAgentForAssignment,
  setSelectedAgentForAssignment,
  handleAssignAgent,
  isAssigningAgent,
  isCustomerSuccessManager,
  isMobile,
  tableMinWidth = "900px",
  children, // for grouped cards
}) => {
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
                Sort {trainingSortAsc ? "A-Z" : "Z-A"}
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
                <Button
                  size="sm"
                  colorScheme="teal"
                  onClick={applyTrainingDates}
                  isLoading={isApplyingTrainingDates}
                  isDisabled={
                    !selectedTrainingFollowupCount ||
                    (!trainingBulkStartDate && !trainingBulkEndDate)
                  }
                >
                  Apply Dates
                </Button>
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
                  <Button
                    size="sm"
                    colorScheme="purple"
                    onClick={handleAssignAgent}
                    isLoading={isAssigningAgent}
                    isDisabled={!selectedTrainingFollowupCount || !selectedAgentForAssignment}
                  >
                    Assign Agent
                  </Button>
                </HStack>
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
                {filteredTrainingFollowups.length > 0 ? (
                  filteredTrainingFollowups.map((item) => (
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

          {children}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default TrainingFollowupTabPage;
