import React from "react";
import {
  Badge,
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";

const TrainingFollowupGrouped = ({ groupedTrainingFollowups, cardBg, borderColor, headerBg, isLargerThan1024 }) => {
  return (
    groupedTrainingFollowups.length > 0 && (
      <Stack align="stretch" spacing={2} mt={4}>
        <Heading size="sm" color={headerBg}>
          Grouped by Start Date / Course / Schedule
        </Heading>
        <SimpleGrid columns={isLargerThan1024 ? 2 : 1} spacing={3}>
          {groupedTrainingFollowups.map((group) => (
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
                  <Heading size="sm" noOfLines={1}>
                    {group.courseKey}
                  </Heading>
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
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    )
  );
};

export default TrainingFollowupGrouped;
