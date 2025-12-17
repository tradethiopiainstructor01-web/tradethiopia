import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import Layout from './Layout';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
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

const TargetRow = ({ label, target, actual, isPercentage = false, onActualChange }) => {
  const numericTarget = parseFloat(target) || 0;
  const numericActual = parseFloat(actual) || 0;
  const gap = numericActual - numericTarget;
  const gapColor = gap >= 0 ? "green.500" : "red.500";
  const displayTarget = isPercentage ? `${numericTarget}%` : numericTarget;
  const displayActual = isPercentage ? `${numericActual}%` : numericActual;
  
  return (
    <Tr _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}>
      <Td fontWeight="medium">{label}</Td>
      <Td isNumeric>{displayTarget}</Td>
      <Td isNumeric>
        {onActualChange ? (
          <NumberInput
            size="sm"
            maxW="120px"
            value={numericActual}
            min={0}
            onChange={(_, val) => onActualChange(val || 0)}
          >
            <NumberInputField />
          </NumberInput>
        ) : (
          displayActual
        )}
      </Td>
      <Td isNumeric color={gapColor}>
        {gap >= 0
          ? `+${isPercentage ? gap.toFixed(2) : gap.toLocaleString()}${isPercentage ? '%' : ''}`
          : `${isPercentage ? gap.toFixed(2) : gap.toLocaleString()}${isPercentage ? '%' : ''}`}
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
  const [actualOverrides, setActualOverrides] = useState({});
  const [actualModal, setActualModal] = useState({
    isOpen: false,
    metricLabel: "",
    value: ""
  });
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
  const modalBg = useColorModeValue("white", "gray.800");

  const getAgentName = useCallback((item) =>
    item.agentName ||
    item.agentUsername ||
    item.assignedTo ||
    item.agent ||
    item.creator?.username ||
    "Unassigned", []);

  const getActualValue = useCallback((label, fallback) => {
    const v = actualOverrides[label];
    if (v === undefined || v === null || v === "") return fallback;
    const parsed = Number(v);
    return Number.isNaN(parsed) ? fallback : parsed;
  }, [actualOverrides]);

  const setActualValue = useCallback((label, value) => {
    setActualOverrides((prev) => ({ ...prev, [label]: value }));
  }, []);

  const metricOptions = useCallback(() => {
    const base = [
      { label: "User Manuals Sent", defaultVal: activityTotals.materialUpdates },
      { label: "Training Videos Shared", defaultVal: activityTotals.progressUpdates },
      { label: "FAQ Guides Sent", defaultVal: activityTotals.serviceUpdates },
      { label: "Telegram Guidance Messages", defaultVal: Math.floor(activityTotals.followupAttempts * 0.3) },
      { label: "Follow-up Reminders", defaultVal: activityTotals.followupAttempts },
      { label: "Satisfaction Score", defaultVal: 85 },
      { label: "Service Delivery Accuracy", defaultVal: 92 },
      { label: "Policy Compliance", defaultVal: 98 },
      { label: "Cross-Department Response", defaultVal: 95 },
      { label: "Time-to-Resolve (hrs)", defaultVal: 20 },
      { label: "Training-to-B2B Conversions", defaultVal: Math.min(targets.qualityMetrics.trainingToB2B, 25) },
      { label: "Renewals", defaultVal: Math.min(targets.qualityMetrics.renewals, 18) },
    ];

    // Include all customer service officers (and any remaining perf entries) so they appear in the Actual dropdown
    const seenLabels = new Set();
    (customerServiceUsers || []).forEach((officer) => {
      const officerData =
        interactionPerformance.find(
          (perf) =>
            perf.username === officer.email ||
            perf.userId === officer.id ||
            perf.agentId === officer.id ||
            perf.username === officer.username
        ) || { followupAttempts: 0, updateAttempts: 0 };
      const label = officer.name || officer.username || "Officer";
      seenLabels.add(label);
      base.push({
        label,
        defaultVal: (officerData.followupAttempts || 0) + (officerData.updateAttempts || 0),
      });
    });
    // Add any interactionPerformance entries not yet represented (fallback)
    interactionPerformance.forEach((perf, idx) => {
      const label = perf.username || `Officer ${idx + 1}`;
      if (seenLabels.has(label)) return;
      seenLabels.add(label);
      base.push({
        label,
        defaultVal: (perf.followupAttempts || 0) + (perf.updateAttempts || 0),
      });
    });

    base.push({
      label: "Customer Success Manager",
      defaultVal: interactionPerformance.reduce(
        (sum, officer) => sum + officer.followupAttempts + officer.updateAttempts,
        0
      ),
    });

    return base;
  }, [activityTotals, customerServiceUsers, interactionPerformance, targets]);

  const openActualModal = () => {
    setActualModal((prev) => ({ ...prev, isOpen: true }));
  };

  // Memoize expensive calculations
  const processedReportData = useMemo(() => {
    if (!report || report.length === 0) return { stats: {}, activityTotals: {}, interactionPerformance: [] };
    
    // Calculate stats
    const totalCustomers = report.length;
    const completedFollowups = report.filter(item => 
      item.dailyProgress && item.dailyProgress > 0
    ).length;
    const activeFollowups = totalCustomers - completedFollowups;
    const avgRating = report.reduce((sum, item) => 
      sum + (item.creator?.rating || 0), 0) / Math.max(report.length, 1);

    const boolToInt = (val) => (val ? 1 : 0);

    const totals = report.reduce((acc, item) => {
      const materialCount =
        Number(item.materialUpdates || 0) +
        boolToInt(item.materialStatusUpdated);
      const progressCount =
        Number(item.progressUpdates || 0) +
        boolToInt(item.progressUpdated);
      const serviceCount =
        Number(item.serviceUpdates || 0) +
        boolToInt(item.serviceUpdated);
      const packageCount =
        Number(item.packageStatusUpdates || 0) +
        boolToInt(item.packageStatusUpdated);
      const updateAttemptCount =
        Number(item.updateAttempts || 0) +
        Number(item.notes?.length || 0) +
        Number(item.communicationLogs?.length || item.communications?.length || 0);

      acc.registered += 1;
      acc.followupAttempts +=
        (item.call_count || item.callAttempts || 0) +
        (item.message_count || item.messageAttempts || 0) +
        (item.email_count || item.emailAttempts || 0) +
        (item.followupAttempts || 0);
      acc.updateAttempts += updateAttemptCount;
      acc.importedTraining += boolToInt(item.trainingImported);
      acc.importedB2B += boolToInt(item.b2bImported);
      acc.materialUpdates += materialCount;
      acc.progressUpdates += progressCount;
      acc.serviceUpdates += serviceCount;
      acc.packageStatusUpdates += packageCount;
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
    const perUser = report.reduce((acc, item) => {
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
      const updateAttemptCount =
        Number(item.updateAttempts || 0) +
        Number(item.notes?.length || 0) +
        Number(item.communicationLogs?.length || item.communications?.length || 0);
      const materialCount =
        Number(item.materialUpdates || 0) +
        boolToInt(item.materialStatusUpdated);
      const progressCount =
        Number(item.progressUpdates || 0) +
        boolToInt(item.progressUpdated);
      const serviceCount =
        Number(item.serviceUpdates || 0) +
        boolToInt(item.serviceUpdated);
      const packageCount =
        Number(item.packageStatusUpdates || 0) +
        boolToInt(item.packageStatusUpdated);

      acc[uname].updateAttempts += updateAttemptCount;
      acc[uname].importedTraining += boolToInt(item.trainingImported);
      acc[uname].importedB2B += boolToInt(item.b2bImported);
      acc[uname].materialUpdates += materialCount;
      acc[uname].progressUpdates += progressCount;
      acc[uname].serviceUpdates += serviceCount;
      acc[uname].packageStatusUpdates += packageCount;
      return acc;
    }, {});
    
    return {
      stats: {
        totalCustomers,
        activeFollowups,
        completedFollowups,
        avgRating: parseFloat(avgRating.toFixed(1))
      },
      activityTotals: totals,
      interactionPerformance: Object.values(perUser)
    };
  }, [report, getAgentName]);

  useEffect(() => {
    // Update state with processed data
    if (processedReportData.stats) {
      setStats(processedReportData.stats);
    }
    if (processedReportData.activityTotals) {
      setActivityTotals(processedReportData.activityTotals);
    }
    if (processedReportData.interactionPerformance) {
      setInteractionPerformance(processedReportData.interactionPerformance);
    }
  }, [processedReportData]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Use Promise.all to fetch data concurrently
      const [reportRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/followups/report`, { headers }),
        axios.get(`${API_URL}/api/users`, { headers })
      ]);

      // Process users data
      const usersRaw = Array.isArray(usersRes.data)
        ? usersRes.data
        : Array.isArray(usersRes.data?.users)
          ? usersRes.data.users
          : [];

      const filteredCS = usersRaw
        .filter(user => {
          const role = (user.role || user.roleName || '').toLowerCase().replace(/[\s_-]+/g, '');
          return role.includes('customerservice');
        })
        .map(user => ({
          id: user._id || user.id,
          name: user.name || user.username || 'Unknown User',
          email: user.email || '',
          username: user.username,
          role: 'Customer Service Officer'
        }));

      const customerServiceUsers = filteredCS.length
        ? filteredCS
        : usersRaw.map(user => ({
            id: user._id || user.id,
            name: user.name || user.username || 'Unknown User',
            email: user.email || '',
            username: user.username,
            role: user.role || user.roleName || ''
          }));
      
      setCustomerServiceUsers(customerServiceUsers);
      
      const reportPayload = reportRes.data || {};
      const reportData = Array.isArray(reportPayload.report) ? reportPayload.report : [];
      const creatorPerf = Array.isArray(reportPayload.creatorPerformance) ? reportPayload.creatorPerformance : [];

      if (Array.isArray(reportData)) {
        setReport(reportData);
        setCreatorPerformance(creatorPerf);
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
  }, [toast]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

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
      
      autoTable(doc, {
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
        [
          'User Manuals Sent',
          targets.education.userManuals,
          getActualValue('User Manuals Sent', activityTotals.materialUpdates),
          getActualValue('User Manuals Sent', activityTotals.materialUpdates) - targets.education.userManuals
        ],
        [
          'Training Videos Shared',
          targets.education.trainingVideos,
          getActualValue('Training Videos Shared', activityTotals.progressUpdates),
          getActualValue('Training Videos Shared', activityTotals.progressUpdates) - targets.education.trainingVideos
        ],
        [
          'FAQ Guides Sent',
          targets.education.faqGuides,
          getActualValue('FAQ Guides Sent', activityTotals.serviceUpdates),
          getActualValue('FAQ Guides Sent', activityTotals.serviceUpdates) - targets.education.faqGuides
        ],
        [
          'Telegram Guidance Messages',
          targets.education.telegramMessages,
          getActualValue('Telegram Guidance Messages', Math.floor(activityTotals.followupAttempts * 0.3)),
          getActualValue('Telegram Guidance Messages', Math.floor(activityTotals.followupAttempts * 0.3)) - targets.education.telegramMessages
        ],
        [
          'Follow-up Reminders',
          targets.education.followupReminders,
          getActualValue('Follow-up Reminders', activityTotals.followupAttempts),
          getActualValue('Follow-up Reminders', activityTotals.followupAttempts) - targets.education.followupReminders
        ]
      ];
      
      autoTable(doc, {
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
        ...(customerServiceUsers.length
          ? customerServiceUsers.map((officer, idx) => {
              const perf =
                interactionPerformance.find(
                  (p) => p.username === officer.email || p.userId === officer.id || p.agentId === officer.id
                ) || { followupAttempts: 0, updateAttempts: 0 };
              const targetVal = targets.officerTargets[`officer${idx + 1}`] || targets.officerTargets[`officer${idx}`] || 300;
              const actualVal = getActualValue(
                officer.name,
                (perf.followupAttempts || 0) + (perf.updateAttempts || 0)
              );
              return [
                officer.name,
                targetVal,
                actualVal,
                actualVal - targetVal
              ];
            })
          : interactionPerformance.slice(0, 4).map((perf, idx) => {
              const label = perf.username || `Officer ${idx + 1}`;
              const targetVal = targets.officerTargets[`officer${idx + 1}`] || 300;
              const actualVal = getActualValue(label, (perf.followupAttempts || 0) + (perf.updateAttempts || 0));
              return [label, targetVal, actualVal, actualVal - targetVal];
            })),
        (() => {
          const targetVal = targets.officerTargets.manager;
          const fallbackActual = interactionPerformance.reduce(
            (sum, officer) => sum + (officer.followupAttempts || 0) + (officer.updateAttempts || 0),
            0
          );
          const actualVal = getActualValue('Customer Success Manager', fallbackActual);
          return [
            'Customer Success Manager',
            targetVal,
            actualVal,
            actualVal - targetVal
          ];
        })()
      ];
      
      autoTable(doc, {
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
      
      const qs = targets.qualityMetrics;
      const satVal = getActualValue('Satisfaction Score', 85);
      const accVal = getActualValue('Service Delivery Accuracy', 92);
      const compVal = getActualValue('Policy Compliance', 98);
      const crossVal = getActualValue('Cross-Department Response', 95);
      const ttrVal = getActualValue('Time-to-Resolve (hrs)', 20);
      const b2bVal = getActualValue('Training-to-B2B Conversions', Math.min(qs.trainingToB2B, 25));
      const renewVal = getActualValue('Renewals', Math.min(qs.renewals, 18));

      const qualityData = [
        ['Metric', 'Target', 'Actual', 'Progress'],
        [
          'Satisfaction Score', 
          `${qs.satisfaction}%`, 
          `${satVal}%`, 
          { v: satVal, color: satVal >= 90 ? [46, 204, 113] : satVal >= 70 ? [241, 196, 15] : [231, 76, 60] }
        ],
        [
          'Service Delivery Accuracy', 
          `${qs.deliveryAccuracy}%`, 
          `${accVal}%`, 
          { v: accVal, color: accVal >= qs.deliveryAccuracy ? [46, 204, 113] : [241, 196, 15] }
        ],
        [
          'Policy Compliance', 
          `${qs.policyCompliance}%`, 
          `${compVal}%`, 
          { v: compVal, color: compVal >= qs.policyCompliance ? [46, 204, 113] : [241, 196, 15] }
        ],
        [
          'Cross-Department Response', 
          `${qs.crossDeptResponse}%`, 
          `${crossVal}%`, 
          { v: crossVal, color: crossVal >= qs.crossDeptResponse ? [46, 204, 113] : [241, 196, 15] }
        ],
        [
          'Time-to-Resolve', 
          `< ${qs.timeToResolve} hrs`, 
          `${ttrVal} hrs`, 
          { v: (qs.timeToResolve / (ttrVal || 1)) * 100, color: [46, 204, 113] }
        ],
        [
          'Training-to-B2B Conversions', 
          qs.trainingToB2B, 
          `${b2bVal}`, 
          { v: (b2bVal / (qs.trainingToB2B || 1)) * 100, color: b2bVal >= qs.trainingToB2B ? [46, 204, 113] : [241, 196, 15] }
        ],
        [
          'Renewals', 
          qs.renewals, 
          `${renewVal}`, 
          { v: (renewVal / (qs.renewals || 1)) * 100, color: renewVal >= qs.renewals ? [46, 204, 113] : [241, 196, 15] }
        ]
      ];
      
      autoTable(doc, {
        startY: 30,
        head: [qualityData[0].slice(0, 3)],
        body: qualityData.slice(1).map(row => row.slice(0, 3)),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 14, right: 14 },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const progress = qualityData[data.row.index + 1][3];
            const pct = progress && typeof progress.v === "number" ? progress.v : 0;
            const color = Array.isArray(progress?.color) && progress.color.length === 3
              ? progress.color
              : [46, 204, 113];

            const x = data.cell.x + 2;
            const y = data.cell.y + 2;
            const width = data.cell.width - 4;
            const height = data.cell.height - 4;
            
            // Draw background
            doc.setFillColor(220, 220, 220);
            doc.rect(x, y, width, height, 'F');
            
            // Draw progress
            doc.setFillColor(color[0], color[1], color[2]);
            doc.rect(x, y, (width * pct) / 100, height, 'F');
            
            // Draw text
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            doc.text(
              `${Math.round(pct)}%`, 
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

  const handleRefresh = () => {
    fetchReportData();
  };

  if (loading) {
    return (
      <Layout>
        <Box p={6}>
          <Flex justify="space-between" align="center" mb={6}>
            <Skeleton height="40px" width="300px" />
            <HStack>
              <Skeleton height="40px" width="100px" />
              <Skeleton height="40px" width="150px" />
            </HStack>
          </Flex>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="120px" borderRadius="lg" />
            ))}
          </SimpleGrid>
          <Skeleton height="200px" borderRadius="lg" mb={6} />
          <Skeleton height="300px" borderRadius="lg" mb={6} />
          <Skeleton height="300px" borderRadius="lg" />
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
                  onClick={handleRefresh}
                  leftIcon={<FiRefreshCw />}
                >
                  Refresh Data
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
          <HStack spacing={3} align="center">
            <Button
              colorScheme="purple"
              variant="outline"
              onClick={openActualModal}
            >
              Actual
            </Button>
            <Button
              leftIcon={<FiDownload />}
              colorScheme="blue"
              onClick={handleExportPDF}
              isLoading={loading}
            >
              Export as PDF
            </Button>
          </HStack>
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
                  actual={getActualValue("User Manuals Sent", activityTotals.materialUpdates)}
                />
                <TargetRow
                  label="Training Videos Shared"
                  target={targets.education.trainingVideos}
                  actual={getActualValue("Training Videos Shared", activityTotals.progressUpdates)}
                />
                <TargetRow
                  label="FAQ Guides Sent"
                  target={targets.education.faqGuides}
                  actual={getActualValue("FAQ Guides Sent", activityTotals.serviceUpdates)}
                />
                <TargetRow
                  label="Telegram Guidance Messages"
                  target={targets.education.telegramMessages}
                  actual={getActualValue(
                    "Telegram Guidance Messages",
                    Math.floor(activityTotals.followupAttempts * 0.3)
                  )}
                />
                <TargetRow
                  label="Follow-up Reminders"
                  target={targets.education.followupReminders}
                  actual={getActualValue("Follow-up Reminders", activityTotals.followupAttempts)}
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
                {(customerServiceUsers.length ? customerServiceUsers : interactionPerformance).map((officer, index) => {
                  const perf =
                    interactionPerformance.find(
                      (p) => p.username === officer.email || p.userId === officer.id || p.agentId === officer.id || p.username === officer.username
                    ) || { followupAttempts: 0, updateAttempts: 0 };
                  const label = officer.name || officer.username || `Officer ${index + 1}`;
                  const targetVal = targets.officerTargets[`officer${index + 1}`] || 300;
                  const actualVal = getActualValue(
                    label,
                    (perf.followupAttempts || 0) + (perf.updateAttempts || 0)
                  );
                  return (
                    <TargetRow
                      key={officer.id || officer._id || index}
                      label={label}
                      target={targetVal}
                      actual={actualVal}
                    />
                  );
                })}
                <TargetRow
                  label="Customer Success Manager"
                  target={targets.officerTargets.manager}
                  actual={getActualValue(
                    "Customer Success Manager",
                    interactionPerformance.reduce(
                      (sum, officer) => sum + officer.followupAttempts + officer.updateAttempts, 
                      0
                    )
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
                  actual={`${getActualValue("Satisfaction Score", 85)}%`}
                />
                <QualityMetricRow
                  label="Service Delivery Accuracy"
                  target={`${targets.qualityMetrics.deliveryAccuracy}%`}
                  actual={`${getActualValue("Service Delivery Accuracy", 92)}%`}
                />
                <QualityMetricRow
                  label="Policy Compliance"
                  target={`${targets.qualityMetrics.policyCompliance}%`}
                  actual={`${getActualValue("Policy Compliance", 98)}%`}
                />
                <QualityMetricRow
                  label="Cross-Department Response"
                  target={`${targets.qualityMetrics.crossDeptResponse}%`}
                  actual={`${getActualValue("Cross-Department Response", 95)}%`}
                />
                <QualityMetricRow
                  label="Time-to-Resolve"
                  target={`< ${targets.qualityMetrics.timeToResolve} hrs`}
                  actual={`${getActualValue("Time-to-Resolve (hrs)", 20)} hrs`}
                  isTime
                />
                <QualityMetricRow
                  label="Training-to-B2B Conversions"
                  target={targets.qualityMetrics.trainingToB2B}
                  actual={getActualValue(
                    "Training-to-B2B Conversions",
                    Math.min(targets.qualityMetrics.trainingToB2B, 25)
                  )}
                />
                <QualityMetricRow
                  label="Renewals"
                  target={targets.qualityMetrics.renewals}
                  actual={getActualValue(
                    "Renewals",
                    Math.min(targets.qualityMetrics.renewals, 18)
                  )}
                />
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        <Modal
          isOpen={actualModal.isOpen}
          onClose={() => setActualModal((prev) => ({ ...prev, isOpen: false }))}
          isCentered
        >
          <ModalOverlay />
          <ModalContent bg={modalBg}>
            <ModalHeader>Actual Values</ModalHeader>
            <ModalBody>
              <Text mb={3} color={secondaryTextColor}>
                Update actuals inline. Changes save immediately.
              </Text>
              <Box
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
                overflow="hidden"
              >
                <Table size="sm" variant="simple">
                  <Thead bg={useColorModeValue("gray.50", "gray.700")}>
                    <Tr>
                      <Th>Name</Th>
                      <Th isNumeric>Actual</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {metricOptions().map((opt) => {
                      const currentVal = getActualValue(opt.label, opt.defaultVal);
                      return (
                        <Tr key={opt.label} _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}>
                          <Td>{opt.label}</Td>
                          <Td isNumeric>
                            <NumberInput
                              size="sm"
                              maxW="140px"
                              value={currentVal}
                              min={0}
                              onChange={(_, val) =>
                                setActualOverrides((prev) => ({ ...prev, [opt.label]: val || 0 }))
                              }
                            >
                              <NumberInputField />
                            </NumberInput>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={() => setActualModal((prev) => ({ ...prev, isOpen: false }))}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
};

export default CustomerReport;