import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Layout from './Layout';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Box,
  Flex,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Icon,
  Badge,
  Tooltip,
  Divider,
  Progress,
  VStack,
  HStack,
  useColorModeValue
} from "@chakra-ui/react";
import { 
  FiDownload, 
  FiUser, 
  FiCalendar, 
  FiCheckCircle, 
  FiAlertCircle,
  FiPhone,
  FiMail,
  FiPackage,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiBarChart2
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

const CustomerReport = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatorPerformance, setCreatorPerformance] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeFollowups: 0,
    completedFollowups: 0,
    avgRating: 0
  });
  const [activityTotals, setActivityTotals] = useState({
    registered: 0,
    followupAttempts: 0,
    updateAttempts: 0,
    importedTraining: 0,
    importedB2B: 0,
    materialUpdates: 0,
    progressUpdates: 0,
    serviceUpdates: 0,
    packageStatusUpdates: 0,
  });
  const [interactionPerformance, setInteractionPerformance] = useState([]);

  const tableRef = useRef(null);
  const toast = useToast();
  
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerColor = useColorModeValue("blue.600", "blue.200");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    axios.get(`${API_URL}/api/followups/report`)
      .then(res => {
        if (res.data && Array.isArray(res.data.report)) {
          setReport(res.data.report);
          setCreatorPerformance(res.data.creatorPerformance || []);
          
          // Calculate stats
          const totalCustomers = res.data.report.length;
          const completedFollowups = res.data.report.filter(item => 
            item.dailyProgress && item.dailyProgress > 0
          ).length;
          const activeFollowups = totalCustomers - completedFollowups;
          const avgRating = res.data.report.reduce((sum, item) => 
            sum + (item.creator?.rating || 0), 0) / Math.max(res.data.report.length, 1);

          const totals = res.data.report.reduce((acc, item) => {
            acc.registered += 1;
            acc.followupAttempts +=
              (item.call_count || item.callAttempts || 0) +
              (item.message_count || item.messageAttempts || 0) +
              (item.email_count || item.emailAttempts || 0) +
              (item.followupAttempts || 0);
            acc.updateAttempts += item.updateAttempts || 0;
            acc.importedTraining += item.trainingImported ? 1 : 0;
            acc.importedB2B += item.b2bImported ? 1 : 0;
            acc.materialUpdates += item.materialStatusUpdated ? 1 : 0;
            acc.progressUpdates += item.progressUpdated ? 1 : 0;
            acc.serviceUpdates += item.serviceUpdated ? 1 : 0;
            acc.packageStatusUpdates += item.packageStatusUpdated ? 1 : 0;
            return acc;
          }, {
            registered: 0,
            followupAttempts: 0,
            updateAttempts: 0,
            importedTraining: 0,
            importedB2B: 0,
            materialUpdates: 0,
            progressUpdates: 0,
            serviceUpdates: 0,
            packageStatusUpdates: 0,
          });

          const perUser = res.data.report.reduce((acc, item) => {
            const uname = item.creator?.username || "Unassigned";
            if (!acc[uname]) {
              acc[uname] = {
                username: uname,
                registered: 0,
                followupAttempts: 0,
                updateAttempts: 0,
                importedTraining: 0,
                importedB2B: 0,
                materialUpdates: 0,
                progressUpdates: 0,
                serviceUpdates: 0,
                packageStatusUpdates: 0,
                rating: item.creator?.rating || 0,
                points: item.creator?.points || 0,
              };
            }
            acc[uname].registered += 1;
            acc[uname].followupAttempts +=
              (item.call_count || item.callAttempts || 0) +
              (item.message_count || item.messageAttempts || 0) +
              (item.email_count || item.emailAttempts || 0) +
              (item.followupAttempts || 0);
            acc[uname].updateAttempts += item.updateAttempts || 0;
            acc[uname].importedTraining += item.trainingImported ? 1 : 0;
            acc[uname].importedB2B += item.b2bImported ? 1 : 0;
            acc[uname].materialUpdates += item.materialStatusUpdated ? 1 : 0;
            acc[uname].progressUpdates += item.progressUpdated ? 1 : 0;
            acc[uname].serviceUpdates += item.serviceUpdated ? 1 : 0;
            acc[uname].packageStatusUpdates += item.packageStatusUpdated ? 1 : 0;
            return acc;
          }, {});
          
          setStats({
            totalCustomers,
            activeFollowups,
            completedFollowups,
            avgRating: avgRating.toFixed(1)
          });
          setActivityTotals(totals);
          setInteractionPerformance(Object.values(perUser));
        } else {
          setError("Invalid report data format.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch report. Backend may be down or unreachable.");
        setLoading(false);
        toast({
          title: "Error fetching report",
          description: "Failed to load customer report data",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
  }, []);

  const handleExportPDF = async () => {
    const input = tableRef.current;
    if (!input) return;
    
    try {
      const canvas = await html2canvas(input);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: "landscape" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save("customer_report.pdf");
      
      toast({
        title: "Report exported",
        description: "Customer report has been exported as PDF",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export report as PDF",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box p={6}>
          <Skeleton height="40px" width="300px" mb={6} />
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="120px" borderRadius="lg" />
            ))}
          </SimpleGrid>
          <Skeleton height="400px" borderRadius="lg" />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box p={6}>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Flex direction="column" align="center" justify="center" py={10}>
                <Icon as={FiAlertCircle} boxSize={12} color="red.500" mb={4} />
                <Text fontSize="xl" fontWeight="bold" color="red.500" mb={2}>
                  Error Loading Report
                </Text>
                <Text color={secondaryTextColor} textAlign="center" mb={4}>
                  {error}
                </Text>
                <Button 
                  colorScheme="blue" 
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </Flex>
            </CardBody>
          </Card>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p={6}>
        {/* Header Section */}
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
          <Box>
            <Heading as="h1" size="xl" color={headerColor} mb={2}>
              Customer Service Report
            </Heading>
            <Text color={secondaryTextColor}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} | Professional Summary
            </Text>
          </Box>
          <Button
            leftIcon={<FiDownload />}
            onClick={handleExportPDF}
            colorScheme="blue"
            size="lg"
            boxShadow="md"
            _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
            transition="all 0.2s"
          >
            Export as PDF
          </Button>
        </Flex>

        {/* Stats Overview */}
        <SimpleGrid 
          columns={{ base: 1, sm: 2, md: 2, lg: 4 }} 
          spacing={{ base: 4, md: 6 }} 
          mb={{ base: 6, md: 8 }}
        >
          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="blue.100"
                    color="blue.500"
                    mr={3}
                  >
                    <Icon as={FiUser} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Total Customers
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="blue.500">
                  {stats.totalCustomers}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="orange.100"
                    color="orange.500"
                    mr={3}
                  >
                    <Icon as={FiClock} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Active Follow-ups
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="orange.500">
                  {stats.activeFollowups}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="green.100"
                    color="green.500"
                    mr={3}
                  >
                    <Icon as={FiCheckCircle} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Completed
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="green.500">
                  {stats.completedFollowups}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            transition="all 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          >
            <CardBody>
              <Stat>
                <Flex alignItems="center" mb={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="purple.100"
                    color="purple.500"
                    mr={3}
                  >
                    <Icon as={FiStar} boxSize={6} />
                  </Box>
                  <StatLabel fontSize="sm" fontWeight="medium" color={secondaryTextColor}>
                    Avg. Rating
                  </StatLabel>
                </Flex>
                <StatNumber fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="purple.500">
                  {stats.avgRating}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Activity snapshot aligned with Follow-up page */}
        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          mb={{ base: 6, md: 8 }}
        >
          <CardHeader pb={3}>
            <HStack spacing={3}>
              <Icon as={FiBarChart2} color="teal.500" boxSize={5} />
              <Heading as="h2" size="lg" color={headerColor}>
                Follow-up Activity Summary
              </Heading>
            </HStack>
            <Text color={secondaryTextColor} fontSize="sm" mt={2}>
              Mirrors actions on the Follow-up page for each user.
            </Text>
          </CardHeader>
          <CardBody>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Metric</Th>
                    <Th isNumeric>Count</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr><Td>Registered new customers</Td><Td isNumeric>{activityTotals.registered}</Td></Tr>
                  <Tr><Td>Follow-up attempts</Td><Td isNumeric>{activityTotals.followupAttempts}</Td></Tr>
                  <Tr><Td>Updating attempts</Td><Td isNumeric>{activityTotals.updateAttempts}</Td></Tr>
                  <Tr><Td>Imported new training customers</Td><Td isNumeric>{activityTotals.importedTraining}</Td></Tr>
                  <Tr><Td>Imported new B2B customers</Td><Td isNumeric>{activityTotals.importedB2B}</Td></Tr>
                  <Tr><Td>Updated Material Delivery Status</Td><Td isNumeric>{activityTotals.materialUpdates}</Td></Tr>
                  <Tr><Td>Updated Progress</Td><Td isNumeric>{activityTotals.progressUpdates}</Td></Tr>
                  <Tr><Td>Updated Service</Td><Td isNumeric>{activityTotals.serviceUpdates}</Td></Tr>
                  <Tr><Td>Updated Package Status</Td><Td isNumeric>{activityTotals.packageStatusUpdates}</Td></Tr>
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>

        {/* Team Performance Section enhanced with interaction counts */}
        {(creatorPerformance.length > 0 || interactionPerformance.length > 0) && (
          <Card 
            bg={cardBg} 
            boxShadow="lg" 
            borderRadius="xl" 
            borderWidth="1px" 
            borderColor={borderColor}
            mb={{ base: 6, md: 8 }}
          >
            <CardHeader pb={4}>
              <HStack spacing={3}>
                <Icon as={FiTrendingUp} color="teal.500" boxSize={5} />
                <Heading as="h2" size="lg" color={headerColor}>
                  Team Performance & Interactions
                </Heading>
              </HStack>
              <Text color={secondaryTextColor} fontSize="sm" mt={2}>
                Performance metrics for customer service representatives, including all interactions and updates tracked on the Follow-up page.
              </Text>
            </CardHeader>
            <CardBody>
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Representative</Th>
                      <Th isNumeric>Registered</Th>
                      <Th isNumeric>Follow-up Attempts</Th>
                      <Th isNumeric>Update Attempts</Th>
                      <Th isNumeric>Material</Th>
                      <Th isNumeric>Progress</Th>
                      <Th isNumeric>Service</Th>
                      <Th isNumeric>Package</Th>
                      <Th isNumeric>Imports (Training/B2B)</Th>
                      <Th isNumeric>Rating</Th>
                      <Th isNumeric>Points</Th>
                      <Th>Performance</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(interactionPerformance.length ? interactionPerformance : creatorPerformance).map((creator, idx) => (
                      <Tr key={idx}>
                        <Td>
                          <Flex align="center">
                            <Box
                              bg="blue.500"
                              borderRadius="full"
                              w={8}
                              h={8}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              color="white"
                              mr={3}
                            >
                              {creator.username.charAt(0).toUpperCase()}
                            </Box>
                            <Text fontWeight="medium">{creator.username}</Text>
                          </Flex>
                        </Td>
                        <Td isNumeric>{creator.registered ?? 0}</Td>
                        <Td isNumeric>{creator.followupAttempts ?? 0}</Td>
                        <Td isNumeric>{creator.updateAttempts ?? 0}</Td>
                        <Td isNumeric>{creator.materialUpdates ?? 0}</Td>
                        <Td isNumeric>{creator.progressUpdates ?? 0}</Td>
                        <Td isNumeric>{creator.serviceUpdates ?? 0}</Td>
                        <Td isNumeric>{creator.packageStatusUpdates ?? 0}</Td>
                        <Td isNumeric>{(creator.importedTraining ?? 0) + (creator.importedB2B ?? 0)}</Td>
                        <Td isNumeric>
                          <Flex align="center" justify="flex-end">
                            <Icon as={FiStar} color="yellow.400" mr={1} />
                            <Text>{creator.rating ?? 0}/5</Text>
                          </Flex>
                        </Td>
                        <Td isNumeric>
                          <Badge colorScheme="blue" fontSize="sm">
                            {creator.points ?? 0}
                          </Badge>
                        </Td>
                        <Td>
                          <Progress 
                            value={(creator.rating || 0) * 20} 
                            size="sm" 
                            colorScheme={(creator.rating || 0) >= 4 ? "green" : (creator.rating || 0) >= 3 ? "yellow" : "red"} 
                            borderRadius="full" 
                            w="100px"
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        )}

        {/* Main Report Table */}
        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
        >
          <CardHeader pb={4}>
            <HStack spacing={3}>
              <Icon as={FiBarChart2} color="teal.500" boxSize={5} />
              <Heading as="h2" size="lg" color={headerColor}>
                Customer Follow-up Details
              </Heading>
            </HStack>
            <Text color={secondaryTextColor} fontSize="sm" mt={2}>
              Detailed information about customer interactions and follow-ups
              </Text>
          </CardHeader>
          <CardBody>
            <Box overflowX="auto" ref={tableRef}>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Customer</Th>
                    <Th>Company</Th>
                    <Th>Contact</Th>
                    <Th>Package</Th>
                    <Th>Last Called</Th>
                    <Th>Progress</Th>
                    <Th>Creator</Th>
                    <Th>Rating</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {report.map((user, idx) => (
                    <Tr key={idx}>
                      <Td>
                        <VStack align="flex-start" spacing={1}>
                          <Text fontWeight="bold">{user.clientName}</Text>
                          <Badge colorScheme="blue" fontSize="xs">
                            {user.service || 'N/A'}
                          </Badge>
                        </VStack>
                      </Td>
                      <Td>{user.companyName || 'N/A'}</Td>
                      <Td>
                        <VStack align="flex-start" spacing={1}>
                          <Flex align="center">
                            <Icon as={FiPhone} color={secondaryTextColor} mr={2} />
                            <Text fontSize="sm">{user.phoneNumber || 'N/A'}</Text>
                          </Flex>
                          <Flex align="center">
                            <Icon as={FiMail} color={secondaryTextColor} mr={2} />
                            <Text fontSize="sm">{user.email || 'N/A'}</Text>
                          </Flex>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={
                            user.packageType === "1" ? "green" : 
                            user.packageType === "2" ? "blue" : 
                            user.packageType === "3" ? "purple" : 
                            user.packageType === "4" ? "orange" : 
                            user.packageType === "5" ? "red" : 
                            user.packageType === "6" ? "pink" : 
                            user.packageType === "7" ? "yellow" : 
                            user.packageType === "8" ? "teal" : "gray"
                          }
                        >
                          Package {user.packageType || 'N/A'}
                        </Badge>
                      </Td>
                      <Td>
                        <Flex align="center">
                          <Icon as={FiCalendar} color={secondaryTextColor} mr={2} />
                          <Text fontSize="sm">
                            {user.lastCalled ? new Date(user.lastCalled).toLocaleDateString() : "Never"}
                          </Text>
                        </Flex>
                      </Td>
                      <Td>
                        <VStack align="flex-start" spacing={2}>
                          <Text fontSize="sm">{user.dailyProgress || 0}%</Text>
                          <Progress 
                            value={user.dailyProgress || 0} 
                            size="sm" 
                            colorScheme={user.dailyProgress > 80 ? "green" : user.dailyProgress > 50 ? "blue" : "yellow"} 
                            borderRadius="full" 
                            w="100px"
                          />
                        </VStack>
                      </Td>
                      <Td>
                        {user.creator ? (
                          <Flex align="center">
                            <Box
                              bg="blue.500"
                              borderRadius="full"
                              w={6}
                              h={6}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              color="white"
                              fontSize="xs"
                              mr={2}
                            >
                              {user.creator.username.charAt(0).toUpperCase()}
                            </Box>
                            <Text fontSize="sm">{user.creator.username}</Text>
                          </Flex>
                        ) : (
                          <Text fontSize="sm" color="red.500">Unassigned</Text>
                        )}
                      </Td>
                      <Td>
                        {user.creator ? (
                          <Flex align="center">
                            <Icon as={FiStar} color="yellow.400" mr={1} />
                            <Text fontSize="sm">{user.creator.rating}/5</Text>
                          </Flex>
                        ) : (
                          <Text fontSize="sm">-</Text>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>

        {/* Targets & Ratings */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="lg">
            <CardHeader pb={2}>
              <Heading size="md" color={headerColor}>Customer Education Targets</Heading>
              <Text color={secondaryTextColor} fontSize="sm">
                Weekly targets are set in the Settings page; gaps show remaining work.
              </Text>
            </CardHeader>
            <CardBody>
              <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Item</Th>
                    <Th isNumeric>Target (#)</Th>
                    <Th isNumeric>Actual</Th>
                    <Th isNumeric>Gap</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {[
                    { label: "User Manuals Sent", target: 300 },
                    { label: "Training Videos Shared", target: 300 },
                    { label: "FAQ Guides Sent", target: 200 },
                    { label: "Telegram Guidance Messages", target: 200 },
                    { label: "Follow-up Reminders", target: 600 },
                  ].map((row, idx) => (
                    <Tr key={idx}>
                      <Td>{row.label}</Td>
                      <Td isNumeric>{row.target}</Td>
                      <Td isNumeric>-</Td>
                      <Td isNumeric>-</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="lg">
            <CardHeader pb={2}>
              <Heading size="md" color={headerColor}>Individual Customer Success Officer Targets</Heading>
            </CardHeader>
            <CardBody>
              <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Officer</Th>
                    <Th isNumeric>Monthly Target (#)</Th>
                    <Th isNumeric>Actual</Th>
                    <Th isNumeric>Gap</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {[
                    { label: "Officer 1", target: 300 },
                    { label: "Officer 2", target: 300 },
                    { label: "Officer 3", target: 300 },
                    { label: "Officer 4", target: 300 },
                    { label: "Customer Success Manager", target: 800 },
                  ].map((row, idx) => (
                    <Tr key={idx}>
                      <Td>{row.label}</Td>
                      <Td isNumeric>{row.target}</Td>
                      <Td isNumeric>-</Td>
                      <Td isNumeric>-</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card mt={6} bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="lg">
          <CardHeader pb={2}>
            <Heading size="md" color={headerColor}>Team Quality Metrics</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Quality Metric</Th>
                  <Th isNumeric>Target</Th>
                  <Th isNumeric>Actual</Th>
                  <Th isNumeric>%</Th>
                </Tr>
              </Thead>
              <Tbody>
                {[
                  { label: "Satisfaction Score", target: "90%" },
                  { label: "Service Delivery Accuracy", target: "95%" },
                  { label: "Policy Compliance", target: "100%" },
                  { label: "Cross-Department Response", target: "100%" },
                  { label: "Time-to-Resolve", target: "< 24 hrs" },
                  { label: "Training-to-B2B Conversions", target: "30" },
                  { label: "Renewals", target: "20" },
                ].map((row, idx) => (
                  <Tr key={idx}>
                    <Td>{row.label}</Td>
                    <Td isNumeric>{row.target}</Td>
                    <Td isNumeric>-</Td>
                    <Td isNumeric>-</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </Box>
    </Layout>
  );
};

export default CustomerReport;
