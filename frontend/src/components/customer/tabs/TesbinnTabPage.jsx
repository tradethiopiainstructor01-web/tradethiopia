import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Input,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
  Table,
  Tbody,
  Td,
  TableContainer,
  Text,
  Thead,
  Tooltip,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { AddIcon, DownloadIcon, ArrowUpIcon } from "@chakra-ui/icons";

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

const TesbinnTabPage = ({
  cardBg,
  headerBg,
  borderColor,
  tableBorderColor,
  tableBg,
  rowHoverBg,
  trainingSearch,
  setTrainingSearch,
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
  tesbinnFollowups,
  isMobile,
  tableMinWidth = "900px",
  isCustomerSuccessManager,
  handleExportTesbinn,
  handleCsvImport,
  isCsvImportingTesbinn,
  handleManualCreate,
  isCreatingTesbinn,
}) => {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualError, setManualError] = useState("");
  const closeManual = () => {
    if (isCreatingTesbinn) return;
    setIsManualOpen(false);
    setManualError("");
  };
  const submitManual = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const form = Object.fromEntries(formData.entries());
    const customerName = form.customerName.trim();
    const trainingType = form.trainingType.trim();
    if (!customerName || !trainingType) {
      setManualError("Customer name and course are required.");
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setManualError("End date cannot be before the start date.");
      return;
    }
    setManualError("");
    if (await handleManualCreate({ ...form, customerName, trainingType })) {
      formElement.reset();
      setIsManualOpen(false);
    }
  };
  return (
    <>
    <Card bg={cardBg} boxShadow="md" borderRadius="lg">
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="md" color={headerBg}>
              All TESBINN Users (Progress: Completed)
            </Heading>
            <HStack spacing={2}>
              <Tooltip label="Add a TESBINN user manually">
                <Button size="sm" colorScheme="teal" leftIcon={<AddIcon />} onClick={() => setIsManualOpen(true)}>Add User</Button>
              </Tooltip>
              {isCustomerSuccessManager && (
                <>
                <Tooltip label="Import TESBINN CSV from local file">
                  <Button
                    as="label"
                    htmlFor="tesbinn-csv-input"
                    size="sm"
                    colorScheme="purple"
                    variant="outline"
                    leftIcon={<ArrowUpIcon />}
                    isLoading={isCsvImportingTesbinn}
                  >
                    Import CSV
                  </Button>
                </Tooltip>
                <input
                  id="tesbinn-csv-input"
                  type="file"
                  accept=".csv"
                  style={{ display: "none" }}
                  onChange={handleCsvImport}
                />
                <Tooltip label="Export TESBINN list to Excel">
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    leftIcon={<DownloadIcon />}
                    onClick={handleExportTesbinn}
                  >
                    Export
                  </Button>
                </Tooltip>
                </>
              )}
            </HStack>
          </Flex>

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
                {tesbinnFollowups.length > 0 ? (
                  tesbinnFollowups.map((item) => (
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
                        No completed training records found.
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
    <Modal isOpen={isManualOpen} onClose={closeManual} size="lg">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={submitManual}>
        <ModalHeader>Add TESBINN User Manually</ModalHeader>
        <ModalCloseButton isDisabled={isCreatingTesbinn} />
        <ModalBody><VStack spacing={3} align="stretch">
          {manualError && <Text color="red.500" fontSize="sm">{manualError}</Text>}
          <Input name="customerName" required placeholder="Customer name *" />
          <Input name="email" type="email" placeholder="Email" />
          <Input name="phoneNumber" type="tel" placeholder="Phone number" />
          <Input name="trainingType" required placeholder="Course *" list="tesbinn-course-options" />
          <datalist id="tesbinn-course-options">{trainingCourseOptions.map((course) => <option key={course} value={course} />)}</datalist>
          <Input name="scheduleShift" as="select" defaultValue="Regular">
            <option>Regular</option><option>Night</option><option>Weekend</option><option>Night/Weekend</option>
          </Input>
          <HStack>
            <Input name="startDate" type="date" aria-label="Start date" />
            <Input name="endDate" type="date" aria-label="End date" />
          </HStack>
        </VStack></ModalBody>
        <ModalFooter>
          <Button type="button" variant="ghost" mr={3} onClick={closeManual} isDisabled={isCreatingTesbinn}>Cancel</Button>
          <Button type="submit" colorScheme="teal" isLoading={isCreatingTesbinn} loadingText="Adding">Add User</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    </>
  );
};

export default TesbinnTabPage;
