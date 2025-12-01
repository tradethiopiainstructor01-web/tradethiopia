import React from "react";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

const TrainingFollowupGrouped = ({ groupedTrainingFollowups, cardBg, borderColor, headerBg, isLargerThan1024 }) => {
  return (
    groupedTrainingFollowups.length > 0 && (
      <VStack align="stretch" spacing={2} mt={4}>
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
            >
              <CardHeader py={2} px={0}>
                <HStack justify="space-between" align="center">
                  <Heading size="sm">
                    {group.courseKey}
                  </Heading>
                  <HStack spacing={2}>
                    <Badge colorScheme="purple">{group.scheduleKey}</Badge>
                    <Badge colorScheme="teal">
                      {group.dateKey !== "Not set"
                        ? new Date(group.dateKey).toLocaleDateString()
                        : "Not set"}
                    </Badge>
                  </HStack>
                </HStack>
              </CardHeader>
              <CardBody py={2} px={0}>
                <VStack align="stretch" spacing={1}>
                  {group.items.map((item) => (
                    <HStack
                      key={item._id}
                      justify="space-between"
                      fontSize="sm"
                      bg={useColorModeValue("gray.50", "gray.700")}
                      borderRadius="md"
                      px={3}
                      py={2}
                    >
                      <Text fontWeight="semibold" noOfLines={1}>
                        {item.customerName || "Unnamed"}
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme="blue">
                          {item.trainingType || "Course N/A"}
                        </Badge>
                        <Badge colorScheme="purple">
                          {item.scheduleShift || "Schedule N/A"}
                        </Badge>
                        <Badge colorScheme="teal">
                          {item.startDate
                            ? new Date(item.startDate).toLocaleDateString()
                            : "Date N/A"}
                        </Badge>
                        <Badge colorScheme="green">
                          {item.endDate
                            ? new Date(item.endDate).toLocaleDateString()
                            : "End N/A"}
                        </Badge>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </VStack>
    )
  );
};

export default TrainingFollowupGrouped;
