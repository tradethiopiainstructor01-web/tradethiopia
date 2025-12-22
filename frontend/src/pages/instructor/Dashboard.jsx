import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  useMediaQuery,
  Spinner,
} from "@chakra-ui/react";
import TrainingFollowupGrouped from "../../components/customer/tabs/TrainingFollowupGrouped";
import { fetchTrainingFollowups } from "../../services/api";
import { useUserStore } from "../../store/user";

const metricCards = [
  { label: "Active Students", value: "128", help: "+5 this week" },
  { label: "Active Courses", value: "6", help: "2 new" },
  { label: "Pending Requests", value: "14", help: "3 awaiting review" },
];

const normalizeDisplayName = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const InstructorDashboard = () => {
  const [trainingFollowups, setTrainingFollowups] = useState([]);
  const [loadingTraining, setLoadingTraining] = useState(true);
  const [trainingError, setTrainingError] = useState("");
  const currentUser = useUserStore((state) => state.currentUser);
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const trainingHeaderBg = useColorModeValue("blue.500", "blue.600");
  const [isLargerThan1024] = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    let isMounted = true;
    const loadFollowups = async () => {
      setLoadingTraining(true);
      setTrainingError("");
      try {
        const data = await fetchTrainingFollowups();
        if (!isMounted) return;
        setTrainingFollowups(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load training follow-ups", err);
        if (!isMounted) return;
        setTrainingFollowups([]);
        setTrainingError("Unable to load your assigned trainings right now.");
      } finally {
        if (isMounted) {
          setLoadingTraining(false);
        }
      }
    };
    loadFollowups();
    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedInstructorName = useMemo(
    () => normalizeDisplayName(currentUser?.username || ""),
    [currentUser]
  );

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filteredTrainingFollowups = useMemo(() => {
    if (!trainingFollowups.length || !normalizedInstructorName) return [];
    return trainingFollowups.filter((item) => {
      const agentIdentifier = normalizeDisplayName(
        item.agentName || item.agentUsername || item.agentId || ""
      );
      if (!agentIdentifier.includes(normalizedInstructorName)) {
        return false;
      }
      const isCompleted = (item.progress || "")
        .toString()
        .toLowerCase() === "completed";
      const end = item.endDate ? new Date(item.endDate) : null;
      if (isCompleted && end && end < todayMidnight) {
        return false;
      }
      return true;
    });
  }, [normalizedInstructorName, todayMidnight, trainingFollowups]);

  const groupedTrainingFollowups = useMemo(() => {
    const groups = new Map();
    filteredTrainingFollowups.forEach((item) => {
      const dateKey = item.startDate
        ? new Date(item.startDate).toISOString().split("T")[0]
        : "Not set";
      const courseKey = item.trainingType || "Not set";
      const scheduleKey = item.scheduleShift || "Not set";
      const groupKey = `${dateKey}|${courseKey}|${scheduleKey}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          dateKey,
          courseKey,
          scheduleKey,
          items: [],
        });
      }
      groups.get(groupKey).items.push(item);
    });
    return Array.from(groups.values()).filter((group) => group.items.length > 0);
  }, [filteredTrainingFollowups]);

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg" mb={2}>
          Welcome back, instructor
        </Heading>
        <Text color="gray.500">
          Review active students, manage requests, and keep an eye on the notice board from this central cockpit.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {metricCards.map((metric) => (
          <Box
            key={metric.label}
            p={5}
            borderRadius="md"
            bg={cardBg}
            shadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Stat>
              <StatLabel>{metric.label}</StatLabel>
              <StatNumber>{metric.value}</StatNumber>
              <StatHelpText>{metric.help}</StatHelpText>
            </Stat>
          </Box>
        ))}
      </SimpleGrid>

      <Box>
        <Heading size="md" mb={2}>
          Training Follow-Up
        </Heading>

        {loadingTraining ? (
          <Box display="flex" alignItems="center" gap={2} color="gray.500">
            <Spinner size="sm" />
            <Text fontSize="sm">Loading your assigned trainings...</Text>
          </Box>
        ) : trainingError ? (
          <Text color="red.500" fontSize="sm">
            {trainingError}
          </Text>
        ) : groupedTrainingFollowups.length > 0 ? (
          <TrainingFollowupGrouped
            groupedTrainingFollowups={groupedTrainingFollowups}
            cardBg={cardBg}
            borderColor={borderColor}
            headerBg={trainingHeaderBg}
            isLargerThan1024={isLargerThan1024}
          />
        ) : (
          <Text color="gray.500" fontSize="sm">
            You have no assigned trainings at the moment.
          </Text>
        )}
      </Box>
    </VStack>
  );
};

export default InstructorDashboard;
