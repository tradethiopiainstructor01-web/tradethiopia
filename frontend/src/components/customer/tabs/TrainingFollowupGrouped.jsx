import React, { useMemo, useState, memo } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";

const TrainingFollowupGrouped = ({ groupedTrainingFollowups = [], cardBg, borderColor, headerBg, isLargerThan1024 }) => {
  const [groupPage, setGroupPage] = useState(1);
  const groupsPerPage = 6;
  const totalGroupPages = Math.max(1, Math.ceil(groupedTrainingFollowups.length / groupsPerPage));
  const safeGroupPage = Math.min(Math.max(1, groupPage), totalGroupPages);

  const pagedGroups = useMemo(
    () => groupedTrainingFollowups.slice((safeGroupPage - 1) * groupsPerPage, safeGroupPage * groupsPerPage),
    [groupedTrainingFollowups, safeGroupPage, groupsPerPage]
  );

  return (
    groupedTrainingFollowups.length > 0 && (
      <Stack align="stretch" spacing={3} mt={4}>
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
          <Heading size="sm" color={headerBg}>
            Grouped by Start Date / Course / Schedule ({groupedTrainingFollowups.length} groups)
          </Heading>
          {totalGroupPages > 1 && (
            <HStack spacing={2}>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setGroupPage((p) => Math.max(1, p - 1))}
                isDisabled={safeGroupPage <= 1}
              >
                Previous
              </Button>
              <Text fontSize="xs" color="gray.500">
                Group {safeGroupPage} of {totalGroupPages}
              </Text>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setGroupPage((p) => Math.min(totalGroupPages, p + 1))}
                isDisabled={safeGroupPage >= totalGroupPages}
              >
                Next
              </Button>
            </HStack>
          )}
        </Flex>
        <SimpleGrid columns={isLargerThan1024 ? 2 : 1} spacing={3}>
          {pagedGroups.map((group) => (
            <Card
              key={`${group.dateKey}-${group.courseKey}-${group.scheduleKey}`}
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              py={2}
              px={3}
              height="100%"
              overflow="hidden"
            >
              <CardHeader py={2} px={0}>
                <Stack direction="row" justify="space-between" align="center">
                  <Stack spacing={1} flex={1} minW={0}>
                    <Heading size="sm" noOfLines={1}>
                      {group.courseKey}
                    </Heading>
                    {group.timeRangeDisplay && (
                      <Text fontSize="xs" color="gray.400" noOfLines={1}>
                        Time: {group.timeRangeDisplay}
                      </Text>
                    )}
                  </Stack>
                  <Wrap spacing={2} align="center">
                    <WrapItem>
                      <Badge colorScheme="purple" maxW="130px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        {group.scheduleKey}
                      </Badge>
                    </WrapItem>
                    <WrapItem>
                      <Badge colorScheme="teal" maxW="130px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        {group.dateKey !== "Not set"
                          ? new Date(group.dateKey).toLocaleDateString()
                          : "Not set"}
                      </Badge>
                    </WrapItem>
                  </Wrap>
                </Stack>
              </CardHeader>
              <CardBody py={2} px={0}>
                <Stack spacing={1}>
                  {group.items.map((item) => (
                    <Box
                      key={item._id}
                      bg={useColorModeValue("gray.50", "gray.700")}
                      borderRadius="md"
                      px={3}
                      py={2}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="normal"
                      wordBreak="break-word"
                    >
                      <Text fontWeight="semibold" noOfLines={1}>
                        {item.customerName || "Unnamed"}
                      </Text>
                      <Wrap spacing={2} mt={1}>
                        <WrapItem>
                          <Badge colorScheme="blue" maxW="140px" overflow="hidden" textOverflow="ellipsis">
                            {item.trainingType || "Course N/A"}
                          </Badge>
                        </WrapItem>
                        <WrapItem>
                          <Badge colorScheme="purple" maxW="120px" overflow="hidden" textOverflow="ellipsis">
                            {item.scheduleShift || "Schedule N/A"}
                          </Badge>
                        </WrapItem>
                        <WrapItem>
                          <Badge colorScheme="teal" maxW="110px" overflow="hidden" textOverflow="ellipsis">
                            {item.startDate
                              ? new Date(item.startDate).toLocaleDateString()
                              : "Date N/A"}
                          </Badge>
                        </WrapItem>
                        <WrapItem>
                          <Badge colorScheme="green" maxW="110px" overflow="hidden" textOverflow="ellipsis">
                            {item.endDate
                              ? new Date(item.endDate).toLocaleDateString()
                              : "End N/A"}
                          </Badge>
                        </WrapItem>
                    </Wrap>
                  </Box>
                ))}
              </Stack>
              <Flex justify="flex-end" mt={3} pt={2} borderTop="1px solid" borderColor={borderColor}>
                <Stack direction="row" spacing={4} align="center">
                  {(() => {
                    const agentNames = Array.from(
                      new Set(
                        group.items
                          .map((item) => item.salesAgent || item.agentName)
                          .filter(Boolean)
                      )
                    );
                    if (!agentNames.length) return null;
                    return (
                      <Text fontSize="xs" color="gray.500">
                        Agent: {agentNames.join(", ")}
                      </Text>
                    );
                  })()}
                  {(() => {
                    const instructorNames = Array.from(
                      new Set(
                        group.items
                          .map((item) => item.assignedInstructor)
                          .filter(Boolean)
                      )
                    );
                    if (!instructorNames.length) return null;
                    return (
                      <Text fontSize="xs" color="gray.500">
                        Instructor: {instructorNames.join(", ")}
                      </Text>
                    );
                  })()}
                </Stack>
              </Flex>
            </CardBody>
          </Card>
          ))}
        </SimpleGrid>
      </Stack>
    )
  );
};

export default memo(TrainingFollowupGrouped);
