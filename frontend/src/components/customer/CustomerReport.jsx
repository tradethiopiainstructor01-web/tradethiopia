import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Layout from './Layout';
import jsPDF from "jspdf";
import 'jspdf-autotable';
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
  SimpleGrid,
  Icon,
  Progress,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  VStack,
  HStack,
  Divider
} from "@chakra-ui/react";
import { 
  FiDownload, 
  FiUser, 
  FiCheckCircle, 
  FiAlertCircle,
  FiPhone,
  FiMail,
  FiPackage,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiBarChart2,
  FiFileText,
  FiUsers,
  FiTarget,
  FiAward,
  FiAlertTriangle,
  FiActivity,
  FiBook,
  FiClock as FiTime,
  FiCheckSquare,
  FiRefreshCw
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

// Helper Components
const StatCard = ({ title, value, icon: Icon, colorScheme, trend, trendValue, isRating = false }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor="gray.100" boxShadow="sm">
      <CardBody>
        <Stat>
          <Flex justify="space-between" align="center">
            <Box>
              <StatLabel color={secondaryTextColor} fontSize="sm" fontWeight="medium">
                {title}
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={textColor} mt={1}>
                {isRating ? `${value}/5` : value.toLocaleString()}
                {trend && (
                  <StatHelpText mb={0}>
                    <StatArrow type={trend === 'up' ? 'increase' : 'decrease'} />
                    {trendValue}
                  </StatHelpText>
                )}
              </StatNumber>
            </Box>
            <Box
              p={3}
              bg={`${colorScheme}.100`}
              color={`${colorScheme}.600`}
              borderRadius="md"
            >
              <Icon size={24} />
            </Box>
          </Flex>
        </Stat>
      </CardBody>
    </Card>
  );
};

const ActivityMetric = ({ label, value, icon: Icon }) => (
  <Box textAlign="center" p={4} bg="white" borderRadius="md" boxShadow="sm">
    <Icon size={24} color="#4A90E2" />
    <Text fontSize="xl" fontWeight="bold" mt={2}>
      {value}
    </Text>
    <Text fontSize="sm" color="gray.500">
      {label}
    </Text>
  </Box>
);

const TargetRow = ({ label, target, actual, isPercentage = false }) => {
  const gap = target - actual;
  const gapColor = gap > 0 ? "red.500" : "green.500";
  const displayTarget = isPercentage ? `${target}%` : target;
  const displayActual = isPercentage ? `${actual}%` : actual;
  
  return (
    <Tr _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}>
      <Td fontWeight="medium">{label}</Td>
      <Td isNumeric>{displayTarget}</Td>
      <Td isNumeric>{displayActual}</Td>
      <Td isNumeric color={gapColor}>
        {gap > 0 
          ? `-${isPercentage ? `${gap}%` : gap.toLocaleString()}` 
          : `+${Math.abs(gap)}${isPercentage ? '%' : ''}`}
      </Td>
    </Tr>
  );
};

const QualityMetricRow = ({ label, target, actual, isTime = false }) => {
  let progress, displayValue, progressColor;
  
  if (isTime) {
    // For time-based metrics (e.g., Time-to-Resolve)
    const targetHours = parseFloat(target);
    const actualHours = parseFloat(actual);
    progress = Math.min(100, (targetHours / actualHours) * 100);
    displayValue = `${actualHours} hrs`;
  } else if (typeof actual === 'string' && actual.includes('%')) {
    // For percentage-based metrics
    progress = parseFloat(actual);
    displayValue = actual;
  } else {
    // For count-based metrics
    progress = (actual / target) * 100;
    displayValue = actual;
  }
  
  progressColor = progress >= 90 ? "green" : progress >= 70 ? "yellow" : "red";

  return (
    <Tr _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}>
      <Td fontWeight="medium">{label}</Td>
      <Td>{target}</Td>
      <Td>{displayValue}</Td>
      <Td>
        <Box>
          <Progress 
            value={Math.min(100, progress)} 
            colorScheme={progressColor} 
            size="sm" 
            borderRadius="md"
            height="8px"
          />
          <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
            {!isTime ? `${Math.round(progress)}%` : ''}
          </Text>
        </Box>
      </Td>
    </Tr>
  );
};

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
    materialUpdates: 0,
    progressUpdates: 0,
    serviceUpdates: 0,
    packageStatusUpdates: 0,
  });
  
  const [interactionPerformance, setInteractionPerformance] = useState([]);
  const [customerServiceUsers, setCustomerServiceUsers] = useState([]);
  const [targets, setTargets] = useState({
    education: {
      userManuals: 300,
      trainingVideos: 300,
      faqGuides: 200,
      telegramMessages: 200,
      followupReminders: 600
    },
    officerTargets: {
      officer1: 300,
      officer2: 300,
      officer3: 300,
      officer4: 300,
      manager: 800
    },
    qualityMetrics: {
      satisfaction: 90,
      deliveryAccuracy: 95,
      policyCompliance: 100,
      crossDeptResponse: 100,
      timeToResolve: 24,
      trainingToB2B: 30,
      renewals: 20
    }
  });

  const tableRef = useRef(null);
  const toast = useToast();
  
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerColor = useColorModeValue("blue.600", "blue.200");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");

  const getAgentName = (item) =>
    item.agentName ||
    item.agentUsername ||
    item.assignedTo ||
    item.agent ||
    item.creator?.username ||
    "Unassigned";

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("userToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [reportRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/api/followups/report`, { headers }),
          axios.get(`${API_URL}/api/users`, { headers })
        ]);

        // Filter and set customer service users
        const usersRaw = Array.isArray(usersRes.data)
          ? usersRes.data
          : Array.isArray(usersRes.data?.users)
            ? usersRes.data.users
            : [];

        const customerServiceUsers = usersRaw
          .filter(user => {
            const role = (user.role || user.roleName || '').toLowerCase().replace(/[\s_-]+/g, '');
            return role === 'customerservice';
          })
          .map(user => ({
            id: user._id || user.id,
            name: user.name || user.username || 'Unknown User',
            email: user.email || '',
            role: 'Customer Service Officer'
          }));
        
        setCustomerServiceUsers(customerServiceUsers);
        
        const reportPayload = reportRes.data || {};
        const reportData = Array.isArray(reportPayload.report) ? reportPayload.report : [];
        const creatorPerf = Array.isArray(reportPayload.creatorPerformance) ? reportPayload.creatorPerformance : [];

        if (Array.isArray(reportData)) {
          setReport(reportData);
          setCreatorPerformance(creatorPerf);
          
          // Calculate stats
          const totalCustomers = reportData.length;
          const completedFollowups = reportData.filter(item => 
            item.dailyProgress && item.dailyProgress > 0
          ).length;
          const activeFollowups = totalCustomers - completedFollowups;
          const avgRating = reportData.reduce((sum, item) => 
            sum + (item.creator?.rating || 0), 0) / Math.max(reportData.length, 1);

          const totals = reportData.reduce((acc, item) => {
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

          // Aggregate interactions by assigned agent (fallback to creator)
          const perUser = reportData.reduce((acc, item) => {
            const uname = getAgentName(item);
            const agentId = item.agentId || item.assignedTo || item.agent || item.creator?._id || null;
            if (!acc[uname]) {
              acc[uname] = {
                username: uname,
                agentId: agentId || undefined,
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
            avgRating: parseFloat(avgRating.toFixed(1))
          });
          setActivityTotals(totals);
          setInteractionPerformance(Object.values(perUser));
          
          // If you had API endpoints for targets, you would set them here
          // setTargets(targetsRes.data);
          
        } else {
          setError("Invalid report data format.");
        }
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError("Failed to fetch report. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load report data",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm'
      });
      
      // Add title
      doc.setFontSize(20);
      doc.text('Customer Service Report', 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
      
      // Add stats summary
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary', 14, 40);
      
      // Add stats table
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Customers', stats.totalCustomers],
        ['Active Follow-ups', stats.activeFollowups],
        ['Completed Follow-ups', stats.completedFollowups],
        ['Average Rating', `${stats.avgRating}/5`]
      ];
      
      doc.autoTable({
        startY: 45,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 14, right: 14 }
      });
      
      // Add education targets
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Customer Education Targets', 14, 20);
      
      const educationData = [
        ['Item', 'Target', 'Actual', 'Gap'],
        ['User Manuals Sent', targets.education.userManuals, activityTotals.materialUpdates, targets.education.userManuals - activityTotals.materialUpdates],
        ['Training Videos Shared', targets.education.trainingVideos, activityTotals.progressUpdates, targets.education.trainingVideos - activityTotals.progressUpdates],
        ['FAQ Guides Sent', targets.education.faqGuides, activityTotals.serviceUpdates, targets.education.faqGuides - activityTotals.serviceUpdates],
        ['Telegram Guidance Messages', targets.education.telegramMessages, Math.floor(activityTotals.followupAttempts * 0.3), targets.education.telegramMessages - Math.floor(activityTotals.followupAttempts * 0.3)],
        ['Follow-up Reminders', targets.education.followupReminders, activityTotals.followupAttempts, targets.education.followupReminders - activityTotals.followupReminders]
      ];
      
      doc.autoTable({
        startY: 30,
        head: [educationData[0]],
        body: educationData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 }
        }
      });
      
      // Add officer targets
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Individual Customer Success Officer Targets', 14, 20);
      
      const officerData = [
        ['Officer', 'Monthly Target', 'Actual', 'Gap'],
        ...interactionPerformance.slice(0, 4).map((officer, idx) => [
          `Officer ${idx + 1}`,
          targets.officerTargets[`officer${idx + 1}`],
          officer.followupAttempts + officer.updateAttempts,
          targets.officerTargets[`officer${idx + 1}`] - (officer.followupAttempts + officer.updateAttempts)
        ]),
        [
          'Customer Success Manager',
          targets.officerTargets.manager,
          interactionPerformance.reduce((sum, officer) => sum + officer.followupAttempts + officer.updateAttempts, 0),
          targets.officerTargets.manager - interactionPerformance.reduce((sum, officer) => sum + officer.followupAttempts + officer.updateAttempts, 0)
        ]
      ];
      
      doc.autoTable({
        startY: 30,
        head: [officerData[0]],
        body: officerData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 14, right: 14 }
      });
      
      // Add team quality metrics
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Team Quality Metrics', 14, 20);
      
      const qualityData = [
        ['Metric', 'Target', 'Actual', 'Progress'],
        [
          'Satisfaction Score', 
          `${targets.qualityMetrics.satisfaction}%`, 
          '85%', 
          { v: 85, color: 85 >= 90 ? [46, 204, 113] : 85 >= 70 ? [241, 196, 15] : [231, 76, 60] }
        ],
        [
          'Service Delivery Accuracy', 
          `${targets.qualityMetrics.deliveryAccuracy}%`, 
          '92%', 
          { v: 92, color: [46, 204, 113] }
        ],
        [
          'Policy Compliance', 
          `${targets.qualityMetrics.policyCompliance}%`, 
          '98%', 
          { v: 98, color: [46, 204, 113] }
        ],
        [
          'Cross-Department Response', 
          `${targets.qualityMetrics.crossDeptResponse}%`, 
          '95%', 
          { v: 95, color: [46, 204, 113] }
        ],
        [
          'Time-to-Resolve', 
          `< ${targets.qualityMetrics.timeToResolve} hrs`, 
          '20 hrs', 
          { v: (20 / targets.qualityMetrics.timeToResolve) * 100, color: [46, 204, 113] }
        ],
        [
          'Training-to-B2B Conversions', 
          targets.qualityMetrics.trainingToB2B, 
          '25', 
          { v: (25 / targets.qualityMetrics.trainingToB2B) * 100, color: 25 >= 30 ? [46, 204, 113] : [241, 196, 15] }
        ],
        [
          'Renewals', 
          targets.qualityMetrics.renewals, 
          '18', 
          { v: (18 / targets.qualityMetrics.renewals) * 100, color: 18 >= 20 ? [46, 204, 113] : [241, 196, 15] }
        ]
      ];
      
      doc.autoTable({
        startY: 30,
        head: [qualityData[0].slice(0, 3)],
        body: qualityData.slice(1).map(row => row.slice(0, 3)),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 14, right: 14 },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const progress = qualityData[data.row.index + 1][3];
            const x = data.cell.x + 2;
            const y = data.cell.y + 2;
            const width = data.cell.width - 4;
            const height = data.cell.height - 4;
            
            // Draw background
            doc.setFillColor(220, 220, 220);
            doc.rect(x, y, width, height, 'F');
            
            // Draw progress
            doc.setFillColor(progress.color || [46, 204, 113]);
            doc.rect(x, y, (width * progress.v) / 100, height, 'F');
            
            // Draw text
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            doc.text(
              `${Math.round(progress.v)}%`, 
              x + width / 2, 
              y + height / 2 + 2, 
              { align: 'center', baseline: 'middle' }
            );
          }
        }
      });
      
      // Save the PDF
      doc.save('customer_service_report.pdf');
      
      toast({
        title: "Report exported",
        description: "Customer report has been exported as PDF",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Export failed",
        description: "Failed to export report as PDF. Please try again.",
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
          <Skeleton height="400px" borderRadius="lg" mb={6} />
          <Skeleton height="400px" borderRadius="lg" mb={6} />
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
                  leftIcon={<FiRefreshCw />}
                >
                  Refresh Page
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
      <Box p={6} ref={tableRef}>
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
            colorScheme="blue"
            onClick={handleExportPDF}
            mb={{ base: 4, md: 0 }}
            isLoading={loading}
          >
            Export as PDF
          </Button>
        </Flex>

        {/* Stats Overview */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={FiUsers}
            colorScheme="blue"
            trend="up"
            trendValue="12%"
          />
          <StatCard
            title="Active Follow-ups"
            value={stats.activeFollowups}
            icon={FiPhone}
            colorScheme="orange"
            trend="up"
            trendValue="8%"
          />
          <StatCard
            title="Completed"
            value={stats.completedFollowups}
            icon={FiCheckCircle}
            colorScheme="green"
            trend="up"
            trendValue="15%"
          />
          <StatCard
            title="Avg. Rating"
            value={stats.avgRating}
            icon={FiStar}
            colorScheme="purple"
            trend="up"
            trendValue="5%"
            isRating
          />
        </SimpleGrid>

        {/* Customer Activity Snapshot */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={8} boxShadow="sm">
          <CardHeader borderBottomWidth="1px" borderColor={borderColor}>
            <Flex align="center">
              <Icon as={FiActivity} mr={2} color="blue.500" />
              <Heading size="md">Activity Snapshot</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} mb={6}>
              <ActivityMetric
                label="Registered"
                value={activityTotals.registered}
                icon={FiUser}
              />
              <ActivityMetric
                label="Follow-up Attempts"
                value={activityTotals.followupAttempts}
                icon={FiPhone}
              />
              <ActivityMetric
                label="Update Attempts"
                value={activityTotals.updateAttempts}
                icon={FiMail}
              />
              <ActivityMetric
                label="Imported (Training)"
                value={activityTotals.importedTraining}
                icon={FiPackage}
              />
            </SimpleGrid>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
              <ActivityMetric
                label="Material Updates"
                value={activityTotals.materialUpdates}
                icon={FiPackage}
              />
              <ActivityMetric
                label="Progress Updates"
                value={activityTotals.progressUpdates}
                icon={FiTrendingUp}
              />
              <ActivityMetric
                label="Service Updates"
                value={activityTotals.serviceUpdates}
                icon={FiBarChart2}
              />
              <ActivityMetric
                label="Package Status Updates"
                value={activityTotals.packageStatusUpdates}
                icon={FiCheckSquare}
              />
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Customer Education Targets */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={8} boxShadow="sm">
          <CardHeader borderBottomWidth="1px" borderColor={borderColor}>
            <Flex align="center">
              <Icon as={FiBook} mr={2} color="blue.500" />
              <Heading size="md">CUSTOMER EDUCATION TARGETS</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="sm">
              <Thead bg={useColorModeValue("gray.50", "gray.700")}>
                <Tr>
                  <Th>Item</Th>
                  <Th isNumeric>Target</Th>
                  <Th isNumeric>Actual</Th>
                  <Th isNumeric>Gap</Th>
                </Tr>
              </Thead>
              <Tbody>
                <TargetRow
                  label="User Manuals Sent"
                  target={targets.education.userManuals}
                  actual={activityTotals.materialUpdates}
                />
                <TargetRow
                  label="Training Videos Shared"
                  target={targets.education.trainingVideos}
                  actual={activityTotals.progressUpdates}
                />
                <TargetRow
                  label="FAQ Guides Sent"
                  target={targets.education.faqGuides}
                  actual={activityTotals.serviceUpdates}
                />
                <TargetRow
                  label="Telegram Guidance Messages"
                  target={targets.education.telegramMessages}
                  actual={Math.floor(activityTotals.followupAttempts * 0.3)} // Example calculation
                />
                <TargetRow
                  label="Follow-up Reminders"
                  target={targets.education.followupReminders}
                  actual={activityTotals.followupAttempts}
                />
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Individual Officer Targets */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={8} boxShadow="sm">
          <CardHeader borderBottomWidth="1px" borderColor={borderColor}>
            <Flex align="center">
              <Icon as={FiUsers} mr={2} color="blue.500" />
              <Heading size="md">INDIVIDUAL CUSTOMER SUCCESS OFFICER TARGETS</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="sm">
              <Thead bg={useColorModeValue("gray.50", "gray.700")}>
                <Tr>
                  <Th>Officer</Th>
                  <Th isNumeric>Monthly Target</Th>
                  <Th isNumeric>Actual</Th>
                  <Th isNumeric>Gap</Th>
                </Tr>
              </Thead>
              <Tbody>
                {customerServiceUsers.slice(0, 4).map((officer, index) => {
                  const officerData = interactionPerformance.find(
                    perf => perf.username === officer.email || perf.userId === officer.id
                  ) || { followupAttempts: 0, updateAttempts: 0 };
                  
                  return (
                    <TargetRow
                      key={officer.id || index}
                      label={officer.name}
                      target={targets.officerTargets[`officer${index + 1}`] || 300}
                      actual={officerData.followupAttempts + officerData.updateAttempts}
                    />
                  );
                })}
                <TargetRow
                  label="Customer Success Manager"
                  target={targets.officerTargets.manager}
                  actual={interactionPerformance.reduce(
                    (sum, officer) => sum + officer.followupAttempts + officer.updateAttempts, 
                    0
                  )}
                />
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Team Quality Metrics */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardHeader borderBottomWidth="1px" borderColor={borderColor}>
            <Flex align="center">
              <Icon as={FiAward} mr={2} color="blue.500" />
              <Heading size="md">TEAM QUALITY METRICS</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="sm">
              <Thead bg={useColorModeValue("gray.50", "gray.700")}>
                <Tr>
                  <Th>Quality Metric</Th>
                  <Th>Target</Th>
                  <Th>Actual</Th>
                  <Th>Progress</Th>
                </Tr>
              </Thead>
              <Tbody>
                <QualityMetricRow
                  label="Satisfaction Score"
                  target={`${targets.qualityMetrics.satisfaction}%`}
                  actual="85%"
                />
                <QualityMetricRow
                  label="Service Delivery Accuracy"
                  target={`${targets.qualityMetrics.deliveryAccuracy}%`}
                  actual="92%"
                />
                <QualityMetricRow
                  label="Policy Compliance"
                  target={`${targets.qualityMetrics.policyCompliance}%`}
                  actual="98%"
                />
                <QualityMetricRow
                  label="Cross-Department Response"
                  target={`${targets.qualityMetrics.crossDeptResponse}%`}
                  actual="95%"
                />
                <QualityMetricRow
                  label="Time-to-Resolve"
                  target={`< ${targets.qualityMetrics.timeToResolve} hrs`}
                  actual="20 hrs"
                  isTime
                />
                <QualityMetricRow
                  label="Training-to-B2B Conversions"
                  target={targets.qualityMetrics.trainingToB2B}
                  actual={Math.min(targets.qualityMetrics.trainingToB2B, 25)}
                />
                <QualityMetricRow
                  label="Renewals"
                  target={targets.qualityMetrics.renewals}
                  actual={Math.min(targets.qualityMetrics.renewals, 18)}
                />
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </Box>
    </Layout>
  );
};

export default CustomerReport;
