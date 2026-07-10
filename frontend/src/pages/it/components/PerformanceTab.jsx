import React, { useMemo } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { FiBarChart2 } from 'react-icons/fi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

const WEEKLY_TARGET_POINTS = 40;

export default function PerformanceTab({ tasks, users }) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  const defaultStaffPool = ['Selam Desta', 'Amanuel Bekele', 'Martha Tadesse', 'Lemlem Gashaw', 'Kebede Dagnachew'];
  
  const staffPool = useMemo(() => {
    const assigneesFromTasks = [...new Set((tasks || []).flatMap((task) => task.assignedTo || []).filter(Boolean))];
    const combinedPool = [...new Set([...defaultStaffPool, ...assigneesFromTasks])].sort();
    return combinedPool;
  }, [tasks]);

  const staffPerformance = useMemo(() => {
    const stats = staffPool.map((name) => {
      const assigned = (tasks || []).filter((task) => task.assignedTo && task.assignedTo.includes(name));
      const completed = assigned.filter((task) => task.status === 'done');
      const internal = completed
        .filter((task) => task.projectType === 'internal')
        .reduce((sum, t) => sum + (t.featureCount || 1), 0);
      const external = completed
        .filter((task) => task.projectType === 'external')
        .reduce((sum, t) => sum + (t.featureCount || 1), 0);
      const points = internal + external;
      const performanceScore = Math.min(Math.round((points / WEEKLY_TARGET_POINTS) * 100), 120);
      const contribution =
        internal + external === 0
          ? '0% / 0%'
          : `${Math.round((internal / Math.max(points, 1)) * 100)}% / ${Math.round(
              (external / Math.max(points, 1)) * 100
            )}%`;
      return {
        name,
        assigned: assigned.length,
        completed: completed.length,
        internal,
        external,
        points,
        performanceScore,
        contribution,
      };
    });
    return stats
      .sort((a, b) => b.points - a.points)
      .map((stat, index) => ({ ...stat, rank: index + 1 }));
  }, [tasks, staffPool]);

  return (
    <VStack spacing={6} align="stretch">
      <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
        <Heading size="lg">Individual Performance</Heading>
        <Button leftIcon={<FiBarChart2 />} colorScheme="green" variant="outline">
          Share Snapshot
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Completion Trend
            </Text>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={staffPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis dataKey="name" stroke={useColorModeValue('#4A5568', '#A0AEC0')} />
                <YAxis stroke={useColorModeValue('#4A5568', '#A0AEC0')} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, borderColor: borderColor }}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Line type="monotone" dataKey="completed" stroke="#48BB78" strokeWidth={3} />
                <Line type="monotone" dataKey="assigned" stroke="#4299E1" strokeWidth={2} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Achievement Points by Staff
            </Text>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={staffPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis dataKey="name" stroke={useColorModeValue('#4A5568', '#A0AEC0')} />
                <YAxis stroke={useColorModeValue('#4A5568', '#A0AEC0')} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, borderColor: borderColor }}
                />
                <Bar dataKey="points" fill="#805ad5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card borderRadius="2xl" boxShadow="md" bg={cardBg}>
        <CardHeader>
          <Heading size="md">Team Breakdown</Heading>
          <Text fontSize="sm" color="gray.500">
            Ranking, assignment health, and self-driven points.
          </Text>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Rank</Th>
                  <Th>Name</Th>
                  <Th>Assigned</Th>
                  <Th>Completed</Th>
                  <Th>Points</Th>
                  <Th>Internal/External</Th>
                  <Th>Score</Th>
                </Tr>
              </Thead>
              <Tbody>
                {staffPerformance.map((member) => (
                  <Tr key={member.name}>
                    <Td>{member.rank}</Td>
                    <Td>{member.name}</Td>
                    <Td>{member.assigned}</Td>
                    <Td>{member.completed}</Td>
                    <Td>{member.points}</Td>
                    <Td>
                      <Text fontSize="xs">{member.contribution}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={member.performanceScore >= 80 ? 'green' : 'yellow'}>
                        {member.performanceScore}%
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </VStack>
  );
}
