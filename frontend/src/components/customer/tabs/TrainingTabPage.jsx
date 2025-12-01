import React from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  HStack,
  Heading,
  IconButton,
  Input,
  Spinner,
  Stack,
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
import { AddIcon, RepeatIcon } from "@chakra-ui/icons";

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

const TrainingTabPage = ({
  cardBg,
  headerBg,
  borderColor,
  tableBorderColor,
  tableBg,
  rowHoverBg,
  renderColumnMenu,
  completedSalesColumnOptions,
  completedSalesColumnsToRender,
  completedSales,
  loadingTraining,
  trainingError,
  fetchCompletedSales,
  trainingPrograms,
  trainingForm,
  setTrainingForm,
  handleTrainingTypeChange,
  handlePaymentOptionChange,
  handleTrainingSubmit,
  isMobile,
}) => {
  return (
    <Card bg={cardBg} boxShadow="md" borderRadius="lg">
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="md" color={headerBg}>
              Training from Completed Sales
            </Heading>
            <HStack spacing={2}>
              {renderColumnMenu("completedSales", completedSalesColumnOptions)}
              <Tooltip label="Refresh completed sales">
                <IconButton
                  aria-label="Refresh Training"
                  icon={<RepeatIcon />}
                  colorScheme="blue"
                  onClick={fetchCompletedSales}
                  isLoading={loadingTraining}
                  size="md"
                />
              </Tooltip>
            </HStack>
          </Flex>

          {loadingTraining ? (
            <Flex justify="center" py={10}>
              <Spinner size="xl" />
            </Flex>
          ) : trainingError ? (
            <Text color="red.500" fontSize="lg" textAlign="center">
              {trainingError}
            </Text>
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
                minWidth={isMobile ? "700px" : "auto"}
              >
                <Thead bg={headerBg}>
                  <Tr>
                    {completedSalesColumnsToRender.map((col) => (
                      <CompactHeaderCell key={col.key} borderColor={borderColor}>{col.header}</CompactHeaderCell>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {Array.isArray(completedSales) && completedSales.length > 0 ? (
                    completedSales.map((item) => (
                      <Tr
                        key={item.id || item._id}
                        _hover={{ bg: rowHoverBg }}
                      >
                        {completedSalesColumnsToRender.map((col) => (
                          <React.Fragment key={col.key}>{col.render(item)}</React.Fragment>
                        ))}
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={completedSalesColumnsToRender.length || 1} textAlign="center" py={10}>
                        <Text color="gray.500">
                          No completed sales found for training.
                        </Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}

          <Divider />

          <Box as="form" onSubmit={handleTrainingSubmit}>
            <VStack spacing={4} align="stretch">
              <Heading size="sm" color={headerBg}>
                Training Registration
              </Heading>
              <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Training Program
                  </Text>
                  <Input
                    as="select"
                    value={trainingForm.trainingType}
                    onChange={(e) => handleTrainingTypeChange(e.target.value)}
                  >
                    <option value="">Select program</option>
                    {trainingPrograms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Input>
                </Box>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Batch/Group
                  </Text>
                  <Input
                    value={trainingForm.batch}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, batch: e.target.value }))
                    }
                    placeholder="e.g., Batch A"
                  />
                </Box>
              </Stack>

              <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Agent Name
                  </Text>
                  <Input
                    value={trainingForm.agentName}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, agentName: e.target.value }))
                    }
                    placeholder="Agent handling this training"
                  />
                </Box>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Customer Name
                  </Text>
                  <Input
                    value={trainingForm.customerName}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, customerName: e.target.value }))
                    }
                    placeholder="Customer full name"
                  />
                </Box>
              </Stack>

              <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Email
                  </Text>
                  <Input
                    type="email"
                    value={trainingForm.email}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Customer email"
                  />
                </Box>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Phone Number
                  </Text>
                  <Input
                    value={trainingForm.phoneNumber}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                    }
                    placeholder="Customer phone"
                  />
                </Box>
              </Stack>

              <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Start Date
                  </Text>
                  <Input
                    type="date"
                    value={trainingForm.startDate}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </Box>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    End Date
                  </Text>
                  <Input
                    type="date"
                    value={trainingForm.endDate}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                </Box>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Duration
                  </Text>
                  <Input value={trainingForm.duration} isReadOnly />
                </Box>
              </Stack>

              <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Field the Customer is Working In
                  </Text>
                  <Input
                    value={trainingForm.fieldOfWork}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, fieldOfWork: e.target.value }))
                    }
                    placeholder="e.g., Finance, IT, Marketing"
                  />
                </Box>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Schedule and Shift
                  </Text>
                  <Input
                    as="select"
                    value={trainingForm.scheduleShift}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, scheduleShift: e.target.value }))
                    }
                  >
                    <option value="">Select schedule</option>
                    <option value="Regular">Regular</option>
                    <option value="Night">Night</option>
                    <option value="Weekend">Weekend</option>
                    <option value="Night/Weekend">Night/Weekend</option>
                  </Input>
                </Box>
              </Stack>

              <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Payment Option
                  </Text>
                  <HStack spacing={3}>
                    <Button
                      size="sm"
                      variant={trainingForm.paymentOption === "full" ? "solid" : "outline"}
                      colorScheme="teal"
                      onClick={() => handlePaymentOptionChange("full")}
                    >
                      Full
                    </Button>
                    <Button
                      size="sm"
                      variant={trainingForm.paymentOption === "partial" ? "solid" : "outline"}
                      colorScheme="teal"
                      onClick={() => handlePaymentOptionChange("partial")}
                    >
                      Partial (50%)
                    </Button>
                  </HStack>
                </Box>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Amount
                  </Text>
                  <Input
                    value={trainingForm.paymentAmount}
                    isReadOnly
                  />
                </Box>
              </Stack>

              <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Material Delivery Status
                  </Text>
                  <Input
                    as="select"
                    value={trainingForm.materialStatus}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, materialStatus: e.target.value }))
                    }
                  >
                    <option value="">Select status</option>
                    <option value="Not Delivered">Not Delivered</option>
                    <option value="Delivered">Delivered</option>
                  </Input>
                </Box>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Progress of the Training
                  </Text>
                  <Input
                    as="select"
                    value={trainingForm.progress}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, progress: e.target.value }))
                    }
                  >
                    <option value="">Select progress</option>
                    <option value="Not Started">Not Started</option>
                    <option value="Started">Started</option>
                    <option value="Dropped">Dropped</option>
                    <option value="Completed">Completed</option>
                  </Input>
                </Box>
              </Stack>

              <Stack direction={isMobile ? "column" : "row"} spacing={4}>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    ID Card Upload or ID Number
                  </Text>
                  <Input
                    value={trainingForm.idInfo}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, idInfo: e.target.value }))
                    }
                    placeholder="ID number or link to ID"
                  />
                </Box>
                <Box flex={1}>
                  <Text mb={1} fontWeight="medium">
                    Package Status
                  </Text>
                  <Input
                    as="select"
                    value={trainingForm.packageStatus}
                    onChange={(e) =>
                      setTrainingForm((prev) => ({ ...prev, packageStatus: e.target.value }))
                    }
                  >
                    <option value="">Select status</option>
                    <option value="Interested">Interested</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Not Sure">Not Sure</option>
                  </Input>
                </Box>
              </Stack>

              <Input
                as="textarea"
                placeholder="Previous training/experience"
                value={trainingForm.previousTraining}
                onChange={(e) =>
                  setTrainingForm((prev) => ({
                    ...prev,
                    previousTraining: e.target.value,
                  }))
                }
                rows={3}
              />
              <Input
                as="textarea"
                placeholder="Special requirements"
                value={trainingForm.specialRequirements}
                onChange={(e) =>
                  setTrainingForm((prev) => ({
                    ...prev,
                    specialRequirements: e.target.value,
                  }))
                }
                rows={3}
              />

              <Button
                type="submit"
                colorScheme="teal"
                width="full"
                isDisabled={!trainingForm.trainingType}
                leftIcon={<AddIcon />}
              >
                Save Training Data
              </Button>
            </VStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default TrainingTabPage;
