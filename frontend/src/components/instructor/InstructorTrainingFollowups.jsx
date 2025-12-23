import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardBody,
  Heading,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useMediaQuery,
} from "@chakra-ui/react";
import { fetchTrainingFollowups } from "../../services/api";
import { useUserStore } from "../../store/user";
import TrainingFollowupGrouped from "../customer/tabs/TrainingFollowupGrouped";

const normalizeIdentifier = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const InstructorTrainingFollowups = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const [trainingFollowups, setTrainingFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLargerThan1024] = useMediaQuery("(min-width: 1024px)");
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const headerBg = useColorModeValue("blue.500", "blue.400");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchTrainingFollowups()
      .then((data) => {
        if (!mounted) return;
        setTrainingFollowups(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => {
        console.error("Failed to load instructor training follow-ups", err);
        if (!mounted) return;
        setError("Unable to load training follow-ups right now.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const todayMidnight = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const instructorIdentifiers = useMemo(() => {
    const identifiers = new Set();
    const pushValue = (value) => {
      if (!value) return;
      const normalized = normalizeIdentifier(value);
      if (normalized) identifiers.add(normalized);
    };
    if (currentUser) {
      pushValue(currentUser.username);
      pushValue(currentUser.displayRole);
      pushValue(currentUser.email?.split("@")[0]);
      pushValue(currentUser.displayName);
    }
    return identifiers;
  }, [currentUser]);

  const instructorIdentifiersArray = useMemo(
    () => Array.from(instructorIdentifiers),
    [instructorIdentifiers]
  );

  const matchesInstructor = (initializedValue) => {
    if (!initializedValue || !instructorIdentifiersArray.length) return false;
    const normalized = normalizeIdentifier(initializedValue);
    return instructorIdentifiersArray.some((identifier) => normalized.includes(identifier));
  };

  const instructorFollowups = useMemo(() => {
    if (!instructorIdentifiersArray.length) return [];
    return trainingFollowups.filter((item) => matchesInstructor(item.assignedInstructor));
  }, [trainingFollowups, instructorIdentifiersArray]);

  const filteredInstructorFollowups = useMemo(() => {
    return instructorFollowups.filter((item) => {
      const isCompleted = (item.progress || "").toLowerCase() === "completed";
      const end = item.endDate ? new Date(item.endDate) : null;
      if (isCompleted && end && end < todayMidnight) {
        return false;
      }
      return true;
    });
  }, [instructorFollowups, todayMidnight]);

  const groupedTrainingFollowups = useMemo(() => {
    const groups = new Map();
    filteredInstructorFollowups.forEach((item) => {
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
          timeRanges: new Set(),
        });
      }
      const group = groups.get(groupKey);
      group.items.push(item);
      const rangeParts = [];
      if (item.startTime) rangeParts.push(item.startTime);
      if (item.endTime) rangeParts.push(item.endTime);
      if (rangeParts.length) {
        group.timeRanges.add(rangeParts.join(" - "));
      }
    });
    return Array.from(groups.values())
      .filter((group) => group.items.length > 0)
      .map(({ dateKey, courseKey, scheduleKey, items, timeRanges }) => ({
        dateKey,
        courseKey,
        scheduleKey,
        items,
        timeRangeDisplay:
          timeRanges && timeRanges.size > 0 ? Array.from(timeRanges).join(", ") : null,
      }));
  }, [filteredInstructorFollowups]);

  return (
    <Card
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      shadow="sm"
      w="100%"
    >
      <CardBody>
        <Stack spacing={4}>
          <Heading size="md">Training follow-ups assigned to you</Heading>
          {loading && (
            <Box textAlign="center">
              <Spinner />
            </Box>
          )}
          {!loading && error && (
            <Text color="red.500" fontSize="sm">
              {error}
            </Text>
          )}
          {!loading && !error && !groupedTrainingFollowups.length && (
            <Text color="gray.500" fontSize="sm">
              No upcoming training follow-ups have been assigned to you yet.
            </Text>
          )}
          {!loading && !error && groupedTrainingFollowups.length > 0 && (
            <TrainingFollowupGrouped
              groupedTrainingFollowups={groupedTrainingFollowups}
              cardBg={cardBg}
              borderColor={borderColor}
              headerBg={headerBg}
              isLargerThan1024={isLargerThan1024}
            />
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default InstructorTrainingFollowups;
