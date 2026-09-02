import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Checkbox,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiEdit,
  FiEye,
  FiGrid,
  FiLayers,
  FiList,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import {
  getStudentRegistrations,
  createStudentRegistration,
  updateStudentRegistration,
  deleteStudentRegistration,
} from "../../services/studentRegistrationService";
import { useUserStore } from "../../store/user";
import ETHIOPIAN_BANKS from "../../utils/ethiopianBanks";

const learningDepartments = [
  "Import and Export",
  "Digital Marketing",
  "Stock Marketing",
  "Barista",
  "AI for Business",
  "Coffee Cupping",
  "Logistics",
  "Transit",
  "Operations & Support",
];

const timeSlotOptions = ["Morning", "Afternoon", "Night", "Weekend", "VIP"];
// Tessbin displays only registrations whose CoC payment is confirmed as paid.
const paymentOptions = ["Full Payment"];
const classCompletionOptions = ["Completed", "Not Completed", "Stopped"];
const monthOptions = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const getStudentRecordDate = (student = {}) => {
  const value = student.createdAt || student.enrollmentDate || student.registrationDate;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfWeek = (value) => {
  const date = new Date(value);
  const day = date.getDay();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
};

const initialForm = {
  studentId: "",
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  learningDepartment: "",
  program: "",
  enrollmentDate: "",
  examDate: "",
  preferredTimeSlot: "Morning",
  readinessStatus: "Not assessed",
  paymentOption: "Full Payment",
  paymentStatus: "Waiting",
  paymentBank: "",
  fsNumber: "",
  classCompleted: false,
  classCompletionStatus: "Not Completed",
  cocPaymentStatus: "Unpaid",
  status: "Active",
  registeredBy: "",
  registeredByEmail: "",
  notes: "",
};

const getStudentName = (student = {}) => {
  if (!student) return "";
  return (
    student.fullName ||
    student.studentName ||
    student["Student Name"] ||
    student["Full Name"] ||
    student.student_name ||
    student.full_name ||
    student.learnerName ||
    student.learner ||
    student.name ||
    [student.firstName, student.lastName].filter(Boolean).join(" ") ||
    ""
  );
};

const normalizePaymentStatus = (value) => {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (normalized === "paid") return "Paid";
  if (normalized === "unpaid") return "Unpaid";
  return "Waiting";
};

const normalizePaymentOption = (value) => {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (normalized.includes("half")) return "Half Payment";
  return "Full Payment";
};

const isCocPaidStudent = (student = {}) =>
  (student.cocPaymentStatus || student.cocPayment || "").toString().trim().toLowerCase() === "paid";

const keepCocPaidStudents = (students = []) =>
  students.filter(isCocPaidStudent);

const normalizeTimeSlot = (value) => {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (normalized === "afternoon") return "Afternoon";
  if (normalized === "night") return "Night";
  if (normalized === "weekend") return "Weekend";
  if (normalized === "vip") return "VIP";
  return "Morning";
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = (value || "").toString().trim().toLowerCase();
  return ["true", "yes", "1", "completed", "complete"].includes(normalized);
};

const normalizeClassCompletionStatus = (value, classCompleted = false) => {
  const normalized = (value || "").toString().trim().toLowerCase();
  if (normalized === "stopped" || normalized === "stop") return "Stopped";
  if (normalized === "completed" || normalized === "complete") return "Completed";
  if (
    normalized === "not completed" ||
    normalized === "not complete" ||
    normalized === "incomplete"
  )
    return "Not Completed";
  return classCompleted ? "Completed" : "Not Completed";
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const normalizeStudent = (student = {}, index = 0) => {
  const safe = student || {};
  return {
    ...initialForm,
    ...safe,
    id: safe.id || safe._id || `legacy-${index}-${Date.now()}`,
    _id: safe._id || safe.id,
    studentId:
      safe.studentId ||
      safe.studentID ||
      safe.registrationNo ||
      `CS-STU-${String(index + 1).padStart(4, "0")}`,
    fullName: getStudentName(safe),
    learningDepartment:
      safe.learningDepartment || safe.department || safe.learningDept || "",
    program: safe.program || safe.course || safe.trainingProgram || "",
    examDate: formatDate(safe.examDate || safe.testDate),
    enrollmentDate: formatDate(
      safe.enrollmentDate || safe.registrationDate || safe.createdAt
    ),
    preferredTimeSlot: normalizeTimeSlot(
      safe.preferredTimeSlot || safe.timeSlot || safe.section
    ),
    readinessStatus: safe.readinessStatus || safe.readiness || "Not assessed",
    paymentOption: normalizePaymentOption(safe.paymentOption || safe.paymentPlan),
    paymentStatus: normalizePaymentStatus(safe.paymentStatus || safe.payment),
    paymentBank: safe.paymentBank || safe.bankName || "",
    fsNumber: safe.fsNumber || safe.receiptFsNumber || safe.receiptNumber || "",
    classCompleted:
      normalizeClassCompletionStatus(
        safe.classCompletionStatus || safe.classStatus,
        normalizeBoolean(safe.classCompleted)
      ) === "Completed",
    classCompletionStatus: normalizeClassCompletionStatus(
      safe.classCompletionStatus || safe.classStatus,
      normalizeBoolean(safe.classCompleted)
    ),
    cocPaymentStatus: safe.cocPaymentStatus === "Paid" ? "Paid" : "Unpaid",
    registeredBy:
      safe.registeredBy ||
      safe.registeredByName ||
      safe.csMember ||
      safe.createdByName ||
      safe.createdBy ||
      "Customer Service",
    registeredByEmail:
      safe.registeredByEmail || safe.registrarEmail || safe.createdByEmail || "",
    createdAt: safe.createdAt || safe.registrationDate || new Date().toISOString(),
    updatedAt: safe.updatedAt || "",
  };
};

const getStateColor = (status) => {
  const norm = (status || "").toString().trim();
  if (
    norm === "Completed" ||
    norm === "Ready" ||
    norm === "Paid" ||
    norm === "Full Payment" ||
    norm === "Morning"
  )
    return "green";
  if (norm === "Active" || norm === "In preparation" || norm === "Afternoon") return "blue";
  if (
    norm === "Pending" ||
    norm === "Needs support" ||
    norm === "Waiting" ||
    norm === "Half Payment" ||
    norm === "Weekend" ||
    norm === "Not Completed"
  )
    return "orange";
  if (norm === "Night") return "purple";
  if (norm === "VIP") return "pink";
  if (
    norm === "Paused" ||
    norm === "Not ready" ||
    norm === "Unpaid" ||
    norm === "Stopped" ||
    norm === "Failed"
  )
    return "red";
  return "gray";
};

const getClassOutcome = (student) => {
  const record = student || {};
  return (
    record.classCompletionStatus ||
    (record.classCompleted ? "Completed" : "Not Completed")
  );
};

const DetailItem = ({ label, value }) => (
  <Box>
    <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase">
      {label}
    </Text>
    <Text fontWeight="700">{value || "Not provided"}</Text>
  </Box>
);

const TessbinStudentRegistrationsView = ({ onStudentCountChange }) => {
  const toast = useToast();
  const currentUser = useUserStore((state) => state.currentUser);

  // Store callback in a ref to avoid infinite re-render cycles
  const countCallbackRef = useRef(onStudentCountChange);
  useEffect(() => {
    countCallbackRef.current = onStudentCountChange;
  }, [onStudentCountChange]);

  // Colors
  const cardBg = useColorModeValue("white", "gray.800");
  const cardAltBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const softGreenBg = useColorModeValue("rgba(240,253,244,0.72)", "rgba(22,101,52,0.18)");
  const rowHoverBg = useColorModeValue("green.50", "whiteAlpha.100");
  const fieldBg = useColorModeValue("white", "whiteAlpha.50");

  // State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [classCompletionFilter, setClassCompletionFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [timeSlotFilter, setTimeSlotFilter] = useState("All");
  const [datePeriodFilter, setDatePeriodFilter] = useState("all");
  const [dateAnchor, setDateAnchor] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [viewMode, setViewMode] = useState("list");

  // Modal / Drawer disclosures
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();

  const registrarName =
    currentUser?.fullName ||
    currentUser?.name ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ||
    localStorage.getItem("userName") ||
    "Tessbin Admin";

  const registrarEmail =
    currentUser?.email || localStorage.getItem("userEmail") || "";

  // Load Students directly from Customer Service Database
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await getStudentRegistrations();
      const rawList = Array.isArray(data) ? data : data?.data || [];
      const normalized = Array.isArray(rawList)
        ? keepCocPaidStudents(rawList.map(normalizeStudent))
        : [];
      setStudents(normalized);
      if (typeof countCallbackRef.current === "function") {
        countCallbackRef.current(normalized.length);
      }
    } catch (error) {
      console.error("Failed to load student registrations in Tessbin:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to reach the student registration database."
      );
      toast({
        title: "Could not sync student registrations",
        description: error.response?.data?.message || "Failed to reach the student registration database.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filtered and Sorted Students
  const filteredStudents = useMemo(() => {
    const list = Array.isArray(students) ? students : [];
    const search = searchQuery.trim().toLowerCase();

    const filtered = list.filter((student) => {
      if (!student) return false;
      const matchesDept =
        departmentFilter === "All" || student.learningDepartment === departmentFilter;
      const matchesClass =
        classCompletionFilter === "All" ||
        getClassOutcome(student) === classCompletionFilter;
      const matchesPayment =
        paymentFilter === "All" ||
        (student.paymentOption || "Full Payment") === paymentFilter;
      const matchesTimeSlot =
        timeSlotFilter === "All" ||
        (student.preferredTimeSlot || "Morning") === timeSlotFilter;
      const recordDate = getStudentRecordDate(student);
      let matchesDate = true;

      if (datePeriodFilter !== "all") {
        if (!recordDate) {
          matchesDate = false;
        } else if (datePeriodFilter === "daily") {
          matchesDate = formatDate(recordDate) === dateAnchor;
        } else if (datePeriodFilter === "weekly") {
          const anchorStart = startOfWeek(`${dateAnchor}T00:00:00`);
          const recordStart = startOfWeek(recordDate);
          matchesDate = anchorStart.getTime() === recordStart.getTime();
        } else if (datePeriodFilter === "monthly") {
          matchesDate =
            recordDate.getFullYear() === Number(selectedYear) &&
            recordDate.getMonth() === Number(selectedMonth);
        } else if (datePeriodFilter === "yearly") {
          matchesDate = recordDate.getFullYear() === Number(selectedYear);
        }
      }

      const searchableText = [
        student.studentId,
        student.fullName,
        student.email,
        student.phone,
        student.learningDepartment,
        student.program,
        student.preferredTimeSlot,
        student.paymentOption,
        student.paymentBank,
        student.fsNumber,
        student.cocPaymentStatus,
        getClassOutcome(student),
        student.status,
        student.registeredBy,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesDept &&
        matchesClass &&
        matchesPayment &&
        matchesTimeSlot &&
        matchesDate &&
        (!search || searchableText.includes(search))
      );
    });

    const compareText = (first = "", second = "") =>
      first.toString().localeCompare(second.toString(), undefined, {
        numeric: true,
        sensitivity: "base",
      });

    const compareDate = (first, second) => {
      const firstTime = new Date(first.createdAt || first.enrollmentDate || 0).getTime() || 0;
      const secondTime = new Date(second.createdAt || second.enrollmentDate || 0).getTime() || 0;
      return firstTime - secondTime;
    };

    const sorted = [...filtered].sort((first, second) => {
      if (sortBy === "id") {
        return compareText(first.studentId, second.studentId);
      }
      if (sortBy === "alphabet") {
        return compareText(getStudentName(first), getStudentName(second));
      }
      return compareDate(first, second);
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [
    students,
    searchQuery,
    departmentFilter,
    classCompletionFilter,
    paymentFilter,
    timeSlotFilter,
    datePeriodFilter,
    dateAnchor,
    selectedMonth,
    selectedYear,
    sortBy,
    sortDirection,
  ]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const list = Array.isArray(filteredStudents) ? filteredStudents : [];
    const total = list.length;
    const completed = list.filter((s) => getClassOutcome(s) === "Completed").length;
    const cocPaid = list.filter(isCocPaidStudent).length;

    const uniqueDepts = new Set(
      list.map((s) => s.learningDepartment).filter(Boolean)
    ).size;

    return {
      total,
      completed,
      cocPaid,
      uniqueDepts,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [filteredStudents]);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set(
      Array.from(
        { length: currentYear + 10 - 2020 + 1 },
        (_, index) => 2020 + index
      )
    );
    students.forEach((student) => {
      const date = getStudentRecordDate(student);
      if (date) years.add(date.getFullYear());
    });
    return Array.from(years).sort((first, second) => second - first);
  }, [students]);

  // Grouped by department for grid mode
  const filteredGroups = useMemo(() => {
    return filteredStudents.reduce((groups, student) => {
      const key = student.learningDepartment || "Unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(student);
      return groups;
    }, {});
  }, [filteredStudents]);

  // Form Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "classCompleted") {
      setForm((prev) => ({
        ...prev,
        classCompleted: checked,
        classCompletionStatus: checked ? "Completed" : "Not Completed",
      }));
      return;
    }
    if (name === "classCompletionStatus") {
      setForm((prev) => ({
        ...prev,
        classCompletionStatus: value,
        classCompleted: value === "Completed",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleOpenAdd = () => {
    setEditingId("");
    setForm({
      ...initialForm,
      studentId: `CS-STU-${String(students.length + 1).padStart(4, "0")}`,
      registeredBy: registrarName,
      registeredByEmail: registrarEmail,
    });
    onFormOpen();
  };

  const handleEdit = (student) => {
    if (!student) return;
    setEditingId(student.id || student._id);
    setForm({
      ...initialForm,
      ...student,
      enrollmentDate: formatDate(student.enrollmentDate),
      examDate: formatDate(student.examDate),
    });
    onFormOpen();
  };

  const handleDetail = (student) => {
    setSelectedStudent(student);
    onDetailOpen();
  };

  const handleDelete = async (student) => {
    if (!student) return;
    const studentName = getStudentName(student) || student.studentId || "this student";
    if (!window.confirm(`Delete ${studentName}'s student registration?`)) return;

    try {
      await deleteStudentRegistration(student.id || student._id);
      const nextList = students.filter((item) => (item.id || item._id) !== (student.id || student._id));
      setStudents(nextList);
      toast({
        title: "Student registration deleted",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      if (typeof countCallbackRef.current === "function") {
        countCallbackRef.current(nextList.length);
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || "Could not delete student from the database.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.learningDepartment) {
      toast({
        title: "Missing required fields",
        description: "Student full name and learning department are required.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    const now = new Date().toISOString();

    try {
      if (editingId) {
        const payload = {
          ...form,
          fullName: form.fullName.trim(),
          classCompleted: form.classCompletionStatus === "Completed",
          updatedAt: now,
          updatedBy: registrarName,
          updatedByEmail: registrarEmail,
        };
        const updated = await updateStudentRegistration(editingId, payload);
        const normalizedUpdated = normalizeStudent(updated);
        setStudents((prev) => {
          const updatedList = prev.map((s) =>
            (s.id || s._id) === editingId ? normalizedUpdated : s
          );
          const visibleList = keepCocPaidStudents(updatedList);
          if (typeof countCallbackRef.current === "function") {
            countCallbackRef.current(visibleList.length);
          }
          return visibleList;
        });
        toast({
          title: "Registration updated",
          description: `${normalizedUpdated.fullName} record updated successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        const payload = {
          ...form,
          fullName: form.fullName.trim(),
          classCompleted: form.classCompletionStatus === "Completed",
          registeredBy: form.registeredBy?.trim() || registrarName,
          registeredByEmail: form.registeredByEmail?.trim() || registrarEmail,
          createdAt: now,
        };
        const created = await createStudentRegistration(payload);
        const normalizedCreated = normalizeStudent(created);
        const nextList = keepCocPaidStudents([normalizedCreated, ...students]);
        setStudents(nextList);
        toast({
          title: "Student registered",
          description: `${normalizedCreated.fullName} added to ${normalizedCreated.learningDepartment}.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        if (typeof countCallbackRef.current === "function") {
          countCallbackRef.current(nextList.length);
        }
      }
      onFormClose();
    } catch (error) {
      toast({
        title: editingId ? "Update failed" : "Save failed",
        description: error.response?.data?.message || "An error occurred with the database.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!filteredStudents.length) {
      toast({ title: "No records to export", status: "warning", duration: 2500 });
      return;
    }

    const rows = filteredStudents.map((s) => ({
      "Student ID": s.studentId || "",
      "Student Name": getStudentName(s),
      Email: s.email || "",
      Phone: s.phone || "",
      Gender: s.gender || "",
      "Learning Department": s.learningDepartment || "Unassigned",
      Program: s.program || "",
      "Enrollment Date": formatDate(s.enrollmentDate),
      "Exam Date": formatDate(s.examDate),
      "Preferred Time Slot": s.preferredTimeSlot || "Morning",
      "Payment Option": s.paymentOption || "Full Payment",
      "Class Outcome": getClassOutcome(s),
      "CoC Payment Status": s.cocPaymentStatus || "Unpaid",
      "Readiness Status": s.readinessStatus || "Not assessed",
      "Registration Status": s.status || "Active",
      "Registered By": s.registeredBy || "",
      Notes: s.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Registrations");
    XLSX.writeFile(
      workbook,
      `Tessbin_Student_Registrations_${new Date().toISOString().split("T")[0]}.xlsx`
    );

    toast({
      title: "Excel Export Complete",
      description: `Exported ${filteredStudents.length} student records.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Tessbin has read-only access to Customer Service registration data.
  const renderActionButtons = (student) => (
    <HStack spacing={2} justify="flex-end">
      <Button
        size="xs"
        colorScheme="green"
        variant="solid"
        borderRadius="full"
        px={3}
        py={1.5}
        fontWeight="800"
        leftIcon={<Icon as={FiEye} boxSize="13px" />}
        onClick={() => handleDetail(student)}
      >
        View details
      </Button>
    </HStack>
  );

  return (
    <Box>
      {/* ── TOP KPI SUMMARY METRICS ── */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={5} mb={6}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5}>
          <Flex justify="space-between" align="start">
            <Box>
              <Badge bg="#ECFDF5" color="#059669" fontSize="9px" px={2.5} py={0.5} borderRadius="md" fontWeight="800" mb={2}>
                CUSTOMER SERVICE DATA
              </Badge>
              <Text fontSize="13px" fontWeight="800" color={textColor}>CoC Paid Students</Text>
              <Text fontSize="32px" fontWeight="900" color="#059669" mt={1}>{summaryMetrics.total}</Text>
            </Box>
            <Flex w="46px" h="46px" bg="#E6F4EA" borderRadius="full" align="center" justify="center">
              <Icon as={FiUsers} boxSize="22px" color="#10B981" />
            </Flex>
          </Flex>
          <Progress value={100} size="xs" colorScheme="teal" mt={4} borderRadius="full" />
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5}>
          <Flex justify="space-between" align="start">
            <Box>
              <Badge bg="#EFF6FF" color="#2563EB" fontSize="9px" px={2.5} py={0.5} borderRadius="md" fontWeight="800" mb={2}>
                CLASS PROGRESS
              </Badge>
              <Text fontSize="13px" fontWeight="800" color={textColor}>Classes Completed</Text>
              <Text fontSize="32px" fontWeight="900" color="#2563EB" mt={1}>
                {summaryMetrics.completed}
                <Text as="span" fontSize="14px" fontWeight="700" color={mutedText} ml={2}>
                  / {summaryMetrics.total}
                </Text>
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#E0F2FE" borderRadius="full" align="center" justify="center">
              <Icon as={FiCheckCircle} boxSize="22px" color="#0284C7" />
            </Flex>
          </Flex>
          <Progress value={summaryMetrics.completionRate} size="xs" colorScheme="blue" mt={4} borderRadius="full" />
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5}>
          <Flex justify="space-between" align="start">
            <Box>
              <Badge bg="#EEF2FF" color="#6366F1" fontSize="9px" px={2.5} py={0.5} borderRadius="md" fontWeight="800" mb={2}>
                PAYMENT BREAKDOWN
              </Badge>
              <Text fontSize="13px" fontWeight="800" color={textColor}>CoC Payment Confirmed</Text>
              <Text fontSize="32px" fontWeight="900" color="#6366F1" mt={1}>
                {summaryMetrics.cocPaid}
                <Text as="span" fontSize="14px" fontWeight="700" color="#F59E0B" ml={2}>
                  (CoC paid only)
                </Text>
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#F3E8FF" borderRadius="full" align="center" justify="center">
              <Icon as={FiBookOpen} boxSize="22px" color="#9333EA" />
            </Flex>
          </Flex>
          <Progress value={summaryMetrics.total > 0 ? (summaryMetrics.cocPaid / summaryMetrics.total) * 100 : 0} size="xs" colorScheme="purple" mt={4} borderRadius="full" />
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={5}>
          <Flex justify="space-between" align="start">
            <Box>
              <Badge bg="#ECFDF5" color="#047857" fontSize="9px" px={2.5} py={0.5} borderRadius="md" fontWeight="800" mb={2}>
                ACTIVE DEPARTMENTS
              </Badge>
              <Text fontSize="13px" fontWeight="800" color={textColor}>Learning Programs</Text>
              <Text fontSize="32px" fontWeight="900" color="#10B981" mt={1}>
                {summaryMetrics.uniqueDepts || 8}
              </Text>
            </Box>
            <Flex w="46px" h="46px" bg="#DCFCE7" borderRadius="full" align="center" justify="center">
              <Icon as={FiLayers} boxSize="22px" color="#16A34A" />
            </Flex>
          </Flex>
          <Progress value={85} size="xs" colorScheme="green" mt={4} borderRadius="full" />
        </Card>
      </SimpleGrid>

      {/* ── MAIN DATA TABLE CARD ── */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="2xl" p={6} boxShadow="sm" mb={6}>
        <CardBody p={0}>
          {/* Header Actions */}
          <Flex direction={{ base: "column", lg: "row" }} justify="space-between" align={{ base: "start", lg: "center" }} gap={4} mb={6}>
            <Box>
              <HStack spacing={2} align="center" mb={1}>
                <Heading size="md" fontWeight="900" color={textColor}>
                  Customer Service Students Registration
                </Heading>
                <Badge colorScheme="green" borderRadius="full" px={2.5} py={0.5} fontSize="11px" fontWeight="800">
                  {filteredStudents.length} Records
                </Badge>
                <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={2.5} py={0.5} fontSize="10px" fontWeight="800">
                  READ ONLY
                </Badge>
              </HStack>
              <Text fontSize="12px" color={mutedText}>
                CoC-paid Customer Service learners only, synchronized with learning departments and class progress.
              </Text>
            </Box>

            <HStack spacing={3} wrap="wrap">
              <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                size="sm"
                borderRadius="xl"
                fontSize="12px"
                fontWeight="700"
                onClick={fetchStudents}
                isLoading={loading}
              >
                Refresh
              </Button>

              <Button
                leftIcon={<FiDownload />}
                variant="outline"
                colorScheme="green"
                size="sm"
                borderRadius="xl"
                fontSize="12px"
                fontWeight="700"
                onClick={handleExportExcel}
              >
                Export Excel
              </Button>

            </HStack>
          </Flex>

          {errorMessage && (
            <Flex
              p={3}
              mb={4}
              bg="red.50"
              color="red.700"
              borderRadius="xl"
              border="1px solid"
              borderColor="red.200"
              align="center"
              gap={2}
            >
              <Icon as={FiAlertCircle} color="red.500" />
              <Text fontSize="xs" fontWeight="700">{errorMessage}</Text>
            </Flex>
          )}

          {/* Search & Filter Toolbar */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={3} mb={4}>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search name, ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderRadius="xl"
                fontSize="12px"
                bg={fieldBg}
              />
            </InputGroup>

            <Select
              size="sm"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="600"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              bg={fieldBg}
            >
              <option value="All">All Learning Departments</option>
              {learningDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>

            <Select
              size="sm"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="600"
              value={classCompletionFilter}
              onChange={(e) => setClassCompletionFilter(e.target.value)}
              bg={fieldBg}
            >
              <option value="All">All Class Outcomes</option>
              {classCompletionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>

            <Select
              size="sm"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="600"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              bg={fieldBg}
            >
              <option value="All">All Payment Options</option>
              {paymentOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </SimpleGrid>

          {/* Registration-date filters */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3} mb={4}>
            <Box>
              <Text fontSize="10px" fontWeight="800" color={mutedText} mb={1}>
                DATE PERIOD
              </Text>
              <Select
                size="sm"
                borderRadius="xl"
                fontSize="12px"
                fontWeight="700"
                value={datePeriodFilter}
                onChange={(event) => setDatePeriodFilter(event.target.value)}
                bg={fieldBg}
              >
                <option value="all">All Dates</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </Box>

            <Box>
              <Text fontSize="10px" fontWeight="800" color={mutedText} mb={1}>
                <Icon as={FiCalendar} mr={1} color="green.500" />
                CALENDAR DATE
              </Text>
              <Input
                type="date"
                size="sm"
                borderRadius="xl"
                fontSize="12px"
                fontWeight="700"
                value={dateAnchor}
                onChange={(event) => {
                  setDateAnchor(event.target.value);
                  if (!["daily", "weekly"].includes(datePeriodFilter)) {
                    setDatePeriodFilter("daily");
                  }
                }}
                bg={fieldBg}
                aria-label="Choose COC student registration date"
              />
            </Box>

            <Box>
              <Text fontSize="10px" fontWeight="800" color={mutedText} mb={1}>
                MONTH
              </Text>
              <Select
                size="sm"
                borderRadius="xl"
                fontSize="12px"
                fontWeight="700"
                value={selectedMonth}
                onChange={(event) => {
                  setSelectedMonth(event.target.value);
                  setDatePeriodFilter("monthly");
                }}
                isDisabled={datePeriodFilter !== "monthly"}
                bg={fieldBg}
              >
                {monthOptions.map((month, index) => (
                  <option key={month} value={String(index)}>{month}</option>
                ))}
              </Select>
            </Box>

            <Box>
              <Text fontSize="10px" fontWeight="800" color={mutedText} mb={1}>
                YEAR
              </Text>
              <Select
                size="sm"
                borderRadius="xl"
                fontSize="12px"
                fontWeight="700"
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                isDisabled={!['monthly', 'yearly'].includes(datePeriodFilter)}
                bg={fieldBg}
              >
                {availableYears.map((year) => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </Select>
            </Box>
          </SimpleGrid>

          {/* Secondary Sorting & View Mode */}
          <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
            <HStack spacing={3}>
              <Select
                size="xs"
                borderRadius="lg"
                w="160px"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                bg={fieldBg}
              >
                <option value="date">Sort by Date</option>
                <option value="id">Sort by Student ID</option>
                <option value="alphabet">Sort Alphabetically</option>
              </Select>
              <Select
                size="xs"
                borderRadius="lg"
                w="130px"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
                bg={fieldBg}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Select>
            </HStack>

            <ButtonGroup size="xs" isAttached variant="outline">
              <IconButton
                icon={<FiList />}
                aria-label="List view"
                isActive={viewMode === "list"}
                onClick={() => setViewMode("list")}
              />
              <IconButton
                icon={<FiGrid />}
                aria-label="Grid view"
                isActive={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              />
            </ButtonGroup>
          </Flex>

          <Divider mb={4} borderColor={borderColor} />

          {/* ── TABLE VIEW (MATCHING USER SCREENSHOT EXACTLY) ── */}
          {loading ? (
            <Flex justify="center" align="center" direction="column" minH="200px" gap={3}>
              <Spinner size="lg" color="#10B981" />
              <Text fontSize="13px" color={mutedText}>
                Fetching Customer Service student registrations...
              </Text>
            </Flex>
          ) : viewMode === "grid" ? (
            <VStack align="stretch" spacing={5}>
              {Object.entries(filteredGroups).length ? (
                Object.entries(filteredGroups).map(([dept, records]) => (
                  <Box key={dept}>
                    <HStack mb={3}>
                      <Badge colorScheme="green" px={3} py={1} borderRadius="full" fontWeight="800" textTransform="uppercase">
                        {dept}
                      </Badge>
                      <Text fontSize="xs" color={mutedText} fontWeight="700">
                        {records.length} students
                      </Text>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
                      {records.map((student) => {
                        const classOutcome = getClassOutcome(student);
                        return (
                          <Card
                            key={student.id || student._id}
                            border="1px solid"
                            borderColor={borderColor}
                            bg={cardAltBg}
                            borderRadius="16px"
                            boxShadow="xs"
                          >
                            <CardBody p={4}>
                              <VStack align="stretch" spacing={3}>
                                <Flex justify="space-between" align="start">
                                  <Box>
                                    <Text fontWeight="900" color={textColor} fontSize="14px">
                                      {getStudentName(student)}
                                    </Text>
                                    <Text fontSize="xs" color={mutedText}>
                                      {student.studentId}
                                    </Text>
                                  </Box>
                                  <Badge
                                    colorScheme="green"
                                    variant="subtle"
                                    px={2.5}
                                    py={0.5}
                                    borderRadius="full"
                                    textTransform="uppercase"
                                    fontSize="10px"
                                    fontWeight="800"
                                  >
                                    {student.learningDepartment || "Unassigned"}
                                  </Badge>
                                </Flex>

                                <HStack flexWrap="wrap" spacing={2}>
                                  <Badge
                                    colorScheme={getStateColor(classOutcome)}
                                    variant="subtle"
                                    px={2.5}
                                    py={0.5}
                                    borderRadius="full"
                                    textTransform="uppercase"
                                    fontSize="10px"
                                    fontWeight="800"
                                  >
                                    {classOutcome}
                                  </Badge>
                                  <Badge
                                    colorScheme={getStateColor(student.paymentOption)}
                                    variant="subtle"
                                    px={2.5}
                                    py={0.5}
                                    borderRadius="full"
                                    textTransform="uppercase"
                                    fontSize="10px"
                                    fontWeight="800"
                                  >
                                    {student.paymentOption || "Full Payment"}
                                  </Badge>
                                </HStack>

                                <Flex justify="flex-end" pt={1}>
                                  {renderActionButtons(student)}
                                </Flex>
                              </VStack>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </SimpleGrid>
                  </Box>
                ))
              ) : (
                <Box py={10} textAlign="center">
                  <Text fontWeight="800" color={textColor}>
                    No student registrations match your filters.
                  </Text>
                  <Text fontSize="xs" color={mutedText} mt={1}>
                    Try adjusting the search query or department filters.
                  </Text>
                </Box>
              )}
            </VStack>
          ) : (
            <TableContainer border="1px solid" borderColor={borderColor} borderRadius="16px" overflow="hidden">
              <Table variant="simple" size="sm">
                <Thead bg={cardAltBg}>
                  <Tr>
                    <Th fontSize="11px" py={3.5} fontWeight="800" letterSpacing="wider">
                      STUDENT
                    </Th>
                    <Th fontSize="11px" py={3.5} fontWeight="800" letterSpacing="wider">
                      LEARNING DEPARTMENT
                    </Th>
                    <Th fontSize="11px" py={3.5} fontWeight="800" letterSpacing="wider">
                      CLASS
                    </Th>
                    <Th fontSize="11px" py={3.5} fontWeight="800" letterSpacing="wider">
                      PAYMENT OPTION
                    </Th>
                    <Th fontSize="11px" py={3.5} fontWeight="800" letterSpacing="wider" textAlign="right">
                      VIEW
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredStudents.length ? (
                    filteredStudents.map((student) => {
                      const classOutcome = getClassOutcome(student);
                      return (
                        <Tr
                          key={student.id || student._id}
                          _hover={{ bg: rowHoverBg }}
                          transition="background 0.15s"
                        >
                          {/* 1. STUDENT COLUMN (Name bold + Student ID underneath) */}
                          <Td py={3.5}>
                            <Text fontWeight="800" color={textColor} fontSize="13px">
                              {getStudentName(student)}
                            </Text>
                            <Text fontSize="xs" color={mutedText} fontWeight="500">
                              {student.studentId}
                            </Text>
                          </Td>

                          {/* 2. LEARNING DEPARTMENT (Badge with green subtle style in uppercase) */}
                          <Td py={3.5}>
                            <Badge
                              colorScheme="green"
                              variant="subtle"
                              px={3}
                              py={1}
                              borderRadius="full"
                              textTransform="uppercase"
                              fontWeight="800"
                              fontSize="11px"
                              letterSpacing="wider"
                            >
                              {student.learningDepartment || "UNASSIGNED"}
                            </Badge>
                          </Td>

                          {/* 3. CLASS OUTCOME (COMPLETED / NOT COMPLETED pill badge in uppercase) */}
                          <Td py={3.5}>
                            <Badge
                              colorScheme={getStateColor(classOutcome)}
                              variant="subtle"
                              px={3}
                              py={1}
                              borderRadius="full"
                              textTransform="uppercase"
                              fontWeight="800"
                              fontSize="11px"
                              letterSpacing="wider"
                            >
                              {classOutcome}
                            </Badge>
                          </Td>

                          {/* 4. PAYMENT OPTION (FULL PAYMENT / HALF PAYMENT pill badge in uppercase) */}
                          <Td py={3.5}>
                            <Badge
                              colorScheme={getStateColor(student.paymentOption)}
                              variant="subtle"
                              px={3}
                              py={1}
                              borderRadius="full"
                              textTransform="uppercase"
                              fontWeight="800"
                              fontSize="11px"
                              letterSpacing="wider"
                            >
                              {student.paymentOption || "FULL PAYMENT"}
                            </Badge>
                          </Td>

                          {/* Read-only detail access */}
                          <Td py={3.5} textAlign="right">
                            {renderActionButtons(student)}
                          </Td>
                        </Tr>
                      );
                    })
                  ) : (
                    <Tr>
                      <Td colSpan={5} py={12} textAlign="center">
                        <Text fontWeight="800" fontSize="14px" color={textColor}>
                          No student registrations found matching your filters.
                        </Text>
                        <Text fontSize="xs" color={mutedText} mt={1}>
                          Try adjusting the search query or filters.
                        </Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* ── DETAIL DRAWER ── */}
      <Drawer isOpen={isDetailOpen} placement="right" onClose={onDetailClose} size="lg">
        <DrawerOverlay />
        <DrawerContent bg={useColorModeValue("#f8fafc", "#090d1a")}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" bg={cardBg}>
            <HStack spacing={3} align="center">
              <Box p={3} borderRadius="14px" bg={softGreenBg}>
                <Icon as={FiBookOpen} boxSize={5} color="green.600" />
              </Box>
              <Box>
                <HStack spacing={2} mb={1} flexWrap="wrap">
                  <Badge colorScheme="green">{selectedStudent?.learningDepartment || "Unassigned"}</Badge>
                  <Badge colorScheme={getStateColor(selectedStudent?.readinessStatus)}>{selectedStudent?.readinessStatus || "Not assessed"}</Badge>
                  <Badge colorScheme={getStateColor(selectedStudent?.paymentOption)}>{selectedStudent?.paymentOption || "Full Payment"}</Badge>
                  <Badge colorScheme={getStateColor(getClassOutcome(selectedStudent))}>Class {getClassOutcome(selectedStudent)}</Badge>
                </HStack>
                <Text color={textColor} fontWeight="900">Student Profile & Registration Detail</Text>
                <Text fontSize="xs" color={mutedText} fontWeight="600">{getStudentName(selectedStudent)}</Text>
              </Box>
            </HStack>
          </DrawerHeader>
          <DrawerBody py={6}>
            {selectedStudent && (
              <VStack align="stretch" spacing={5}>
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
                      <Box>
                        <HStack spacing={2} mb={2} flexWrap="wrap">
                          <Badge colorScheme="green" borderRadius="full" px={3} py={1}>{selectedStudent.learningDepartment || "Unassigned"}</Badge>
                          <Badge colorScheme={getStateColor(selectedStudent.status)} borderRadius="full" px={3} py={1}>{selectedStudent.status || "Active"}</Badge>
                          <Badge colorScheme={getStateColor(getClassOutcome(selectedStudent))} borderRadius="full" px={3} py={1}>Class {getClassOutcome(selectedStudent)}</Badge>
                          <Badge colorScheme={getStateColor(selectedStudent.paymentOption)} borderRadius="full" px={3} py={1}>{selectedStudent.paymentOption || "Full Payment"}</Badge>
                        </HStack>
                        <Heading size="md" color={textColor}>{getStudentName(selectedStudent)}</Heading>
                        <Text fontSize="sm" color={mutedText}>{selectedStudent.studentId || "No student ID"} - {selectedStudent.program || "No program assigned"}</Text>
                      </Box>
                      <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={3} py={1}>Read only</Badge>
                    </Flex>
                  </CardBody>
                </Card>

                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <HStack mb={4} spacing={3}>
                      <Box p={2.5} borderRadius="12px" bg={softGreenBg}>
                        <Icon as={FiUsers} boxSize={4} color="green.600" />
                      </Box>
                      <Box>
                        <Heading size="sm" color={textColor}>Contact & Identity Information</Heading>
                        <Text fontSize="xs" color={mutedText}>Personal profile recorded at registration.</Text>
                      </Box>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <DetailItem label="Student ID" value={selectedStudent.studentId} />
                      <DetailItem label="Full Name" value={getStudentName(selectedStudent)} />
                      <DetailItem label="Email" value={selectedStudent.email} />
                      <DetailItem label="Phone" value={selectedStudent.phone} />
                      <DetailItem label="Gender" value={selectedStudent.gender} />
                    </SimpleGrid>
                  </CardBody>
                </Card>

                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <HStack mb={4} spacing={3}>
                      <Box p={2.5} borderRadius="12px" bg={softGreenBg}>
                        <Icon as={FiBookOpen} boxSize={4} color="green.600" />
                      </Box>
                      <Box>
                        <Heading size="sm" color={textColor}>Learning Program & Progress</Heading>
                        <Text fontSize="xs" color={mutedText}>Class attendance and examination status.</Text>
                      </Box>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <DetailItem label="Learning Department" value={selectedStudent.learningDepartment} />
                      <DetailItem label="Program / Course" value={selectedStudent.program} />
                      <DetailItem label="Enrollment Date" value={formatDate(selectedStudent.enrollmentDate)} />
                      <DetailItem label="Exam Date" value={formatDate(selectedStudent.examDate)} />
                      <DetailItem label="Time Slot" value={selectedStudent.preferredTimeSlot || "Morning"} />
                      <DetailItem label="Class Outcome" value={getClassOutcome(selectedStudent)} />
                      <DetailItem label="Payment Option" value={selectedStudent.paymentOption || "Full Payment"} />
                      <DetailItem label="Payment Bank" value={selectedStudent.paymentBank} />
                      <DetailItem label="FS Number" value={selectedStudent.fsNumber} />
                      <DetailItem label="CoC Payment" value={selectedStudent.cocPaymentStatus || "Unpaid"} />
                    </SimpleGrid>
                  </CardBody>
                </Card>

                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <HStack mb={4} spacing={3}>
                      <Box p={2.5} borderRadius="12px" bg={softGreenBg}>
                        <Icon as={FiCheckCircle} boxSize={4} color="green.600" />
                      </Box>
                      <Box>
                        <Heading size="sm" color={textColor}>Registration Metadata</Heading>
                        <Text fontSize="xs" color={mutedText}>Staff assignment and creation timestamps.</Text>
                      </Box>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <DetailItem label="Registered By" value={selectedStudent.registeredBy || "Customer Service"} />
                      <DetailItem label="Registrar Email" value={selectedStudent.registeredByEmail} />
                      <DetailItem label="Registration Date" value={formatDateTime(selectedStudent.createdAt)} />
                      <DetailItem label="Last Updated" value={formatDateTime(selectedStudent.updatedAt)} />
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {selectedStudent.notes && (
                  <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                    <CardBody>
                      <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>Notes</Text>
                      <Box border="1px solid" borderColor={borderColor} borderRadius="14px" p={4} bg={cardAltBg}>
                        <Text whiteSpace="pre-wrap" fontSize="sm">{selectedStudent.notes}</Text>
                      </Box>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* ── REGISTER / EDIT STUDENT DRAWER ── */}
      <Drawer isOpen={isFormOpen} placement="right" onClose={onFormClose} size="xl">
        <DrawerOverlay />
        <DrawerContent bg={useColorModeValue("#f8fafc", "#090d1a")} h="100dvh" maxW={{ base: "100vw", md: "760px" }}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} bg={cardBg}>
            <HStack spacing={3}>
              <Box p={3} borderRadius="14px" bg={softGreenBg}>
                <Icon as={FiUserPlus} boxSize={5} color="green.600" />
              </Box>
              <Box>
                <Heading size="md" color={textColor}>
                  {editingId ? "Edit Student Registration" : "Register New Student"}
                </Heading>
                <Text fontSize="xs" color={mutedText}>
                  {editingId ? "Modify student registration details and learning progress." : "Record a student in the Customer Service database."}
                </Text>
              </Box>
            </HStack>
          </DrawerHeader>
          <Box as="form" onSubmit={handleSubmit} display="flex" flexDirection="column" flex="1" minH={0}>
            <DrawerBody py={5} flex="1" minH={0} overflowY="auto">
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="xs">Student ID</FormLabel>
                    <Input
                      name="studentId"
                      value={form.studentId}
                      onChange={handleChange}
                      placeholder="e.g. CS-STU-0001"
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Full Name</FormLabel>
                    <Input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Student full name"
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Email Address</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="student@example.com"
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Phone Number</FormLabel>
                    <Input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+251..."
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Gender</FormLabel>
                    <Select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                      placeholder="Select gender"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Learning Department</FormLabel>
                    <Select
                      name="learningDepartment"
                      value={form.learningDepartment}
                      onChange={handleChange}
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                      placeholder="Assign department"
                    >
                      {form.learningDepartment && !learningDepartments.includes(form.learningDepartment) && (
                        <option value={form.learningDepartment}>{form.learningDepartment}</option>
                      )}
                      {learningDepartments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Program / Course</FormLabel>
                    <Input
                      name="program"
                      value={form.program}
                      onChange={handleChange}
                      placeholder="Course name"
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Preferred Time Slot</FormLabel>
                    <Select
                      name="preferredTimeSlot"
                      value={form.preferredTimeSlot}
                      onChange={handleChange}
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    >
                      {timeSlotOptions.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Enrollment Date</FormLabel>
                    <Input
                      name="enrollmentDate"
                      type="date"
                      value={form.enrollmentDate}
                      onChange={handleChange}
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Exam Date</FormLabel>
                    <Input
                      name="examDate"
                      type="date"
                      value={form.examDate}
                      onChange={handleChange}
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Payment Option</FormLabel>
                    <Select
                      name="paymentOption"
                      value={form.paymentOption}
                      onChange={handleChange}
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    >
                      {paymentOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Payment Bank</FormLabel>
                    <Select
                      name="paymentBank"
                      value={form.paymentBank}
                      onChange={handleChange}
                      placeholder="Select Ethiopian Bank"
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    >
                      {form.paymentBank && !ETHIOPIAN_BANKS.includes(form.paymentBank) && (
                        <option value={form.paymentBank}>{form.paymentBank}</option>
                      )}
                      {ETHIOPIAN_BANKS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">FS Number</FormLabel>
                    <Input
                      name="fsNumber"
                      value={form.fsNumber}
                      onChange={handleChange}
                      placeholder="Receipt FS number"
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    />
                  </FormControl>

                  {/* Class Completion Status Card */}
                  <Box
                    gridColumn={{ base: "auto", md: "1 / -1" }}
                    border="1px solid"
                    borderColor={form.classCompleted ? "green.300" : borderColor}
                    borderRadius="16px"
                    p={4}
                    bg={form.classCompleted ? softGreenBg : cardAltBg}
                  >
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} alignItems="center">
                      <FormControl>
                        <Checkbox
                          name="classCompleted"
                          colorScheme="green"
                          size="md"
                          isChecked={form.classCompleted}
                          onChange={handleChange}
                        >
                          <Text as="span" fontWeight="800" color={textColor}>
                            Class Completed
                          </Text>
                        </Checkbox>
                        <Text fontSize="xs" color={mutedText} mt={1}>
                          Check when the student completes the course curriculum.
                        </Text>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs">Class Outcome</FormLabel>
                        <Select
                          name="classCompletionStatus"
                          value={form.classCompletionStatus}
                          onChange={handleChange}
                          bg={fieldBg}
                          size="sm"
                          borderRadius="xl"
                        >
                          {classCompletionOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </SimpleGrid>
                  </Box>

                  <FormControl>
                    <FormLabel fontSize="xs">Registrar Name</FormLabel>
                    <Input
                      name="registeredBy"
                      value={form.registeredBy}
                      onChange={handleChange}
                      placeholder={registrarName}
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs">Registrar Email</FormLabel>
                    <Input
                      name="registeredByEmail"
                      type="email"
                      value={form.registeredByEmail}
                      onChange={handleChange}
                      placeholder={registrarEmail}
                      bg={fieldBg}
                      size="sm"
                      borderRadius="xl"
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="xs">Notes</FormLabel>
                  <Textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Optional notes or remarks"
                    bg={fieldBg}
                    size="sm"
                    borderRadius="xl"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </DrawerBody>
            <DrawerFooter borderTopWidth="1px" borderColor={borderColor} bg={cardBg} gap={3}>
              <Button variant="outline" size="sm" onClick={onFormClose} isDisabled={isSaving}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="green"
                size="sm"
                leftIcon={<FiBookOpen />}
                isLoading={isSaving}
                loadingText={editingId ? "Updating..." : "Saving..."}
              >
                {editingId ? "Update Student" : "Save Registration"}
              </Button>
            </DrawerFooter>
          </Box>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default TessbinStudentRegistrationsView;
