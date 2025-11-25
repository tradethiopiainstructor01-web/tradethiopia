import React from 'react';
import { Box, Text, SimpleGrid, Badge, Button, Flex, useColorModeValue } from '@chakra-ui/react';
import { FaCheckCircle, FaBell } from 'react-icons/fa';

const TasksAndAlerts = () => {
  const bgColor = useColorModeValue("white", "gray.700");
  const taskColor = useColorModeValue("blue.50", "blue.900");
  const alertColor = useColorModeValue("red.50", "red.900");

  // Example data
  const tasks = [
    { id: 1, title: "Submit project proposal", dueDate: "2024-11-20", completed: false },
    { id: 2, title: "Team meeting at 2 PM", dueDate: "2024-11-16", completed: true },
    { id: 3, title: "Review analytics report", dueDate: "2024-11-18", completed: false },
  ];

  const alerts = [
    { id: 1, message: "System maintenance scheduled for 2024-11-18", type: "warning" },
    { id: 2, message: "New training module available", type: "info" },
    { id: 3, message: "Your password expires in 7 days", type: "alert" },
  ];

  return (
    <Box bg={bgColor} p={4} borderRadius="md" boxShadow="base" maxWidth="1100px" mx="auto" my={6}>
      <Text fontSize="xl" fontWeight="semibold" mb={4} textAlign="center" color={useColorModeValue("gray.700", "gray.300")}>
        Tasks and Alerts
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Tasks Section */}
        <Box bg={taskColor} p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="lg" fontWeight="bold" mb={3} color={useColorModeValue("blue.600", "blue.200")}>
            <FaCheckCircle style={{ display: 'inline', marginRight: '8px' }} />
            Tasks
          </Text>
          {tasks.map((task) => (
            <Flex
              key={task.id}
              justifyContent="space-between"
              alignItems="center"
              bg={useColorModeValue("white", "gray.800")}
              p={3}
              borderRadius="md"
              mb={2}
              boxShadow="sm"
              _hover={{ boxShadow: "md", bg: useColorModeValue("gray.50", "gray.600") }}
            >
              <Text
                fontSize="md"
                as={task.completed ? "del" : "span"}
                color={task.completed ? "gray.400" : "gray.800"}
              >
                {task.title}
              </Text>
              <Badge colorScheme={task.completed ? "green" : "blue"}>{task.dueDate}</Badge>
            </Flex>
          ))}
        </Box>

        {/* Alerts Section */}
        <Box bg={alertColor} p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="lg" fontWeight="bold" mb={3} color={useColorModeValue("red.600", "red.200")}>
            <FaBell style={{ display: 'inline', marginRight: '8px' }} />
            Alerts
          </Text>
          {alerts.map((alert) => (
            <Flex
              key={alert.id}
              justifyContent="space-between"
              alignItems="center"
              bg={useColorModeValue("white", "gray.800")}
              p={3}
              borderRadius="md"
              mb={2}
              boxShadow="sm"
              _hover={{ boxShadow: "md", bg: useColorModeValue("gray.50", "gray.600") }}
            >
              <Text fontSize="md" color={useColorModeValue("gray.800", "gray.200")}>
                {alert.message}
              </Text>
              <Badge colorScheme={alert.type === "alert" ? "red" : "yellow"}>{alert.type}</Badge>
            </Flex>
          ))}
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default TasksAndAlerts;
