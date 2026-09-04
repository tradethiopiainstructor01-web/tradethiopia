import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
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
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { DeleteIcon, DownloadIcon, EditIcon, ViewIcon } from "@chakra-ui/icons";
import {
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiGrid,
  FiLayers,
  FiList,
  FiSearch,
  FiUserPlus,
  FiUsers,
  FiCamera,
  FiUploadCloud,
  FiTrash2,
  FiRefreshCw,
  FiPhoneCall,
  FiPrinter,
} from "react-icons/fi";
import { useUserStore } from "../../store/user";
import { getAuthItem } from "../../utils/authStorage";
import {
  createStudentRegistration,
  deleteStudentRegistration,
  getStudentRegistrationById,
  getStudentRegistrations,
  updateStudentRegistration,
} from "../../services/studentRegistrationService";
import { fetchExternalCourses } from "../../services/api";
import Layout from "./Layout";
import ETHIOPIAN_BANKS from "../../utils/ethiopianBanks";
import { DEFAULT_TRAINING_TITLES, TRAINING_TO_DEPARTMENT_MAP } from "../../utils/trainingTitles";
import TessbinStudentA4Dossier from "../tessbin/TessbinStudentA4Dossier";
import TessbinStudentListA4Report from "../tessbin/TessbinStudentListA4Report";

const learningDepartments = [
  "AI for Business",
  "Barista",
  "Coffee Cupping",
  "Digital Marketing",
  "Import and Export",
  "Logistics",
  "Stock Marketing",
  "Transit",
];

const timeSlotOptions = ["Morning", "Afternoon", "Night", "Weekend", "VIP"];
const paymentOptions = ["Full Payment", "Half Payment"];
const classCompletionOptions = ["Completed", "Not Completed", "Stopped"];
const cocPaymentOptions = ["Paid", "Unpaid"];
const STUDENTS_PER_PAGE = 25;

const isCoffeeCuppingCourse = (registration = {}) => {
  const normalizeCourseName = (value) =>
    (value || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return [registration.learningDepartment, registration.program].some((value) =>
    ["coffeecupping", "coffeeindustrycuppingandqualityassessment"].includes(normalizeCourseName(value))
  );
};

const initialForm = {
  clientLocalId: "",
  studentId: "",
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  nationalIdImage: "",
  nationalIdFrontImage: "",
  nationalIdBackImage: "",
  passportPhoto: "",
  paymentScreenshot: "",
  learningDepartment: "",
  program: "",
  enrollmentDate: "",
  trainingEndDate: "",
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
  salesCallStatus: "Not Called",
  salesFollowupStatus: "Pending",
  salesSchedulePreference: "Regular",
  salesPackageScope: "Local",
  salesFollowupDate: "",
  salesFollowupNote: "",
  registeredBy: "",
  registeredByEmail: "",
  notes: "",
};

const getStudentName = (student = {}) => {
  if (!student) return "";
  const name =
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
    "";
  if (typeof name === "object" && name !== null) {
    return name.fullName || name.name || name.username || "";
  }
  return typeof name === "string" ? name : String(name || "");
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
  if (normalized === "not completed" || normalized === "not complete" || normalized === "incomplete") return "Not Completed";
  return classCompleted ? "Completed" : "Not Completed";
};

const generateUniqueStudentId = (records = [], workspace = "Customer Service") => {
  const prefix = workspace === "Sales" ? "SL-STU-" : "CS-STU-";
  const usedIds = new Set(
    records.map((student) => (student.studentId || "").trim().toLowerCase()).filter(Boolean)
  );

  // Scan across any prefix ending with digits to get highest counter
  const latestNumber = records.reduce((highest, student) => {
    const rawId = (student.studentId || "").trim();
    const match = rawId.match(/(?:CS-STU-|SL-STU-|STU-)?(\d+)$/i);
    return match ? Math.max(highest, Number.parseInt(match[1], 10) || 0) : highest;
  }, 0);

  let nextNumber = latestNumber + 1;
  let nextId = `${prefix}${String(nextNumber).padStart(4, "0")}`;

  while (usedIds.has(nextId.toLowerCase())) {
    nextNumber += 1;
    nextId = `${prefix}${String(nextNumber).padStart(4, "0")}`;
  }

  return nextId;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
};

const safeString = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") return val.fullName || val.name || val.username || fallback;
  return String(val);
};

const normalizeStudent = (student = {}, index = 0) => ({
  ...initialForm,
  ...student,
  id: student.id || student._id || `legacy-${index}-${Date.now()}`,
  studentId: safeString(student.studentId || student.studentID || student.registrationNo, `CS-STU-${String(index + 1).padStart(4, "0")}`),
  fullName: getStudentName(student),
  nationalIdImage: safeString(student.nationalIdFrontImage || student.nationalIdImage),
  nationalIdFrontImage: safeString(student.nationalIdFrontImage || student.nationalIdImage),
  nationalIdBackImage: safeString(student.nationalIdBackImage),
  passportPhoto: safeString(student.passportPhoto),
  paymentScreenshot: safeString(student.paymentScreenshot),
  learningDepartment: safeString(student.learningDepartment || student.department || student.learningDept),
  program: safeString(student.program || student.course || student.trainingProgram),
  examDate: formatDate(student.examDate || student.testDate),
  enrollmentDate: formatDate(student.enrollmentDate || student.registrationDate || student.createdAt),
  trainingEndDate: formatDate(student.trainingEndDate || student.endDate),
  preferredTimeSlot: normalizeTimeSlot(student.preferredTimeSlot || student.timeSlot || student.section),
  readinessStatus: safeString(student.readinessStatus || student.readiness, "Not assessed"),
  paymentOption: normalizePaymentOption(student.paymentOption || student.paymentPlan),
  paymentStatus: normalizePaymentStatus(student.paymentStatus || student.payment),
  paymentBank: safeString(student.paymentBank || student.bankName),
  fsNumber: safeString(student.fsNumber || student.receiptFsNumber || student.receiptNumber),
  classCompleted: normalizeClassCompletionStatus(student.classCompletionStatus || student.classStatus, normalizeBoolean(student.classCompleted)) === "Completed",
  classCompletionStatus: normalizeClassCompletionStatus(student.classCompletionStatus || student.classStatus, normalizeBoolean(student.classCompleted)),
  cocPaymentStatus: student.cocPaymentStatus === "Paid" ? "Paid" : "Unpaid",
  salesCallStatus: safeString(student.salesCallStatus, "Not Called"),
  salesFollowupStatus: safeString(student.salesFollowupStatus, "Pending"),
  salesSchedulePreference: safeString(student.salesSchedulePreference, "Regular"),
  salesPackageScope: safeString(student.salesPackageScope, "Local"),
  salesFollowupDate: formatDate(student.salesFollowupDate),
  salesFollowupNote: safeString(student.salesFollowupNote),
  registeredBy: safeString(
    student.registeredBy ||
    student.registeredByName ||
    student.csMember ||
    student.createdByName ||
    student.createdBy,
    "Unknown CS member"
  ),
  registeredByEmail: safeString(student.registeredByEmail || student.registrarEmail || student.createdByEmail),
  createdBy: (student.createdBy?._id || student.createdBy || "").toString(),
  agentId: (student.agentId || "").toString(),
  updatedBy: safeString(student.updatedBy),
  updatedByEmail: safeString(student.updatedByEmail),
  createdAt: student.createdAt || student.registrationDate || new Date().toISOString(),
});

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const safeSheetName = (name) =>
  String(name || "Unassigned")
    .replace(/[\\/?*[\]:]/g, " ")
    .slice(0, 31)
    .trim() || "Unassigned";

const getStateColor = (status) => {
  if (typeof status !== "string") return "gray";
  if (status === "Completed" || status === "Ready" || status === "Paid" || status === "Full Payment" || status === "Morning") return "green";
  if (status === "Active" || status === "In preparation" || status === "Afternoon") return "blue";
  if (status === "Pending" || status === "Needs support" || status === "Waiting" || status === "Half Payment" || status === "Weekend") return "orange";
  if (status === "Night") return "purple";
  if (status === "VIP") return "pink";
  if (status === "Paused" || status === "Not ready" || status === "Unpaid" || status === "Stopped") return "red";
  if (status === "Not Completed") return "orange";
  return "gray";
};

const getClassOutcome = (student) => {
  const record = student || {};
  const outcome = record.classCompletionStatus || (record.classCompleted ? "Completed" : "Not Completed");
  return typeof outcome === "string" ? outcome : "Not Completed";
};

const studentExportHeaders = [
  "Student ID",
  "Student Name",
  "Full Name",
  "Email",
  "Phone",
  "Gender",
  "Learning Department",
  "Program",
  "Enrollment Date",
  "Exam Date",
  "Preferred Time Slot",
  "Readiness Status",
  "Payment Option",
  "Payment Bank",
  "FS Number",
  "Class Completed",
  "Class Outcome",
  "CoC Payment Status",
  "Status",
  "Notes",
  "Registered By",
  "Registrar Email",
  "Registration Date",
  "Last Updated By",
  "Last Updated At",
];

const DetailItem = ({ label, value }) => {
  let displayValue = value;
  if (displayValue && typeof displayValue === "object") {
    displayValue = displayValue.fullName || displayValue.name || displayValue.username || "";
  }
  return (
    <Box>
      <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase">
        {label}
      </Text>
      <Text fontWeight="700">{displayValue || "Not provided"}</Text>
    </Box>
  );
};

const StudentRegistrationShell = ({ embedded, children }) => {
  if (embedded) return children;
  return <Layout activeSection="Student Registration">{children}</Layout>;
};

const StudentRegistrationPage = ({ embedded = false, workspaceLabel = "Customer Service" }) => {
  const toast = useToast();
  const fullNameInputRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isSectionCountsOpen,
    onOpen: onSectionCountsOpen,
    onClose: onSectionCountsClose,
  } = useDisclosure();
  const {
    isOpen: isExcelPreviewOpen,
    onOpen: onExcelPreviewOpen,
    onClose: onExcelPreviewClose,
  } = useDisclosure();
  const {
    isOpen: isRegistrationOpen,
    onOpen: onRegistrationOpen,
    onClose: onRegistrationClose,
  } = useDisclosure();
  const {
    isOpen: isA4DossierOpen,
    onOpen: onA4DossierOpen,
    onClose: onA4DossierClose,
  } = useDisclosure();
  const {
    isOpen: isA4ReportOpen,
    onOpen: onA4ReportOpen,
    onClose: onA4ReportClose,
  } = useDisclosure();
  const currentUser = useUserStore((state) => state.currentUser);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [trainingTitles, setTrainingTitles] = useState(DEFAULT_TRAINING_TITLES);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [studentLoadError, setStudentLoadError] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [readinessFilter, setReadinessFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [timeSlotFilter, setTimeSlotFilter] = useState("All");
  const [classCompletionFilter, setClassCompletionFilter] = useState("All");
  const [cocPaymentFilter, setCocPaymentFilter] = useState("All");
  const [selectedTimeSlotSection, setSelectedTimeSlotSection] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const cancelDeleteRef = useRef(null);

  const pageBg = useColorModeValue("#f8fafc", "#090d1a");
  const cardBg = useColorModeValue("white", "#0f172a");
  const cardAltBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const mutedText = useColorModeValue("#64748b", "gray.400");
  const headingColor = useColorModeValue("#0f172a", "white");
  const borderColor = useColorModeValue("rgba(226,232,240,0.95)", "rgba(148,163,184,0.22)");
  const fieldBg = useColorModeValue("white", "whiteAlpha.50");
  const softPanelBg = useColorModeValue("rgba(240,253,244,0.72)", "rgba(22,101,52,0.16)");
  const salesPanelBg = useColorModeValue("blue.50", "whiteAlpha.50");
  const rowHoverBg = useColorModeValue("green.50", "whiteAlpha.100");

  const authUser = currentUser || useUserStore.getState().currentUser || {};
  const registrarName =
    authUser?.fullName ||
    authUser?.name ||
    authUser?.username ||
    [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ") ||
    getAuthItem("userName") ||
    getAuthItem("userFullName") ||
    localStorage.getItem("userName") ||
    localStorage.getItem("userFullName") ||
    localStorage.getItem("fullName") ||
    `${workspaceLabel} Member`;

  const registrarEmail = authUser?.email || getAuthItem("userEmail") || localStorage.getItem("userEmail") || "";

  const loadStudents = useCallback(async () => {
    setIsLoadingStudents(true);

    try {
      const user = currentUser || useUserStore.getState().currentUser || {};
      const userRole = (user?.role || getAuthItem("userRole") || localStorage.getItem("userRole") || "").toLowerCase();
      const isSales = workspaceLabel === "Sales" || ["sales", "agent", "salesmanager", "sales manager", "sales_manager"].includes(userRole) || userRole.includes("sales") || userRole.includes("agent");
      const databaseStudents = await getStudentRegistrations(isSales ? { workspace: "Sales" } : {});
      let normalizedDatabaseStudents = Array.isArray(databaseStudents)
        ? databaseStudents.map(normalizeStudent)
        : [];

      if (isSales) {
        const currentUserId = (user?.id || user?._id || getAuthItem("userId") || localStorage.getItem("userId") || "").toString().trim().toLowerCase();
        const currentEmail = (user?.email || getAuthItem("userEmail") || localStorage.getItem("userEmail") || "").trim().toLowerCase();
        const rawNames = [
          user?.fullName,
          user?.name,
          user?.username,
          [user?.firstName, user?.lastName].filter(Boolean).join(" "),
          getAuthItem("userName"),
          getAuthItem("userFullName"),
          localStorage.getItem("userName"),
          localStorage.getItem("userFullName"),
          localStorage.getItem("fullName"),
        ]
          .filter(Boolean)
          .map((n) => n.trim().toLowerCase().replace(/\s+/g, ' '))
          .filter((n) => n.length > 0 && n !== "null" && n !== "undefined" && !['customer success', 'sales followup team', 'customer service followup', 'cs followup', 'unknown cs member'].includes(n));
        const userNames = Array.from(new Set(rawNames));

        normalizedDatabaseStudents = normalizedDatabaseStudents.filter((student) => {
          const studentCreatedBy = (student.createdBy?._id || student.createdBy || "").toString().trim().toLowerCase();
          const studentAgentId = (student.agentId || "").toString().trim().toLowerCase();
          const studentEmail = (student.registeredByEmail || "").toString().trim().toLowerCase();
          const studentName = (student.registeredBy || "").toString().trim().toLowerCase().replace(/\s+/g, ' ');

          const matchesId = Boolean(currentUserId && (studentCreatedBy === currentUserId || studentAgentId === currentUserId));
          const matchesEmail = Boolean(currentEmail && studentEmail && studentEmail === currentEmail);
          const matchesName = Boolean(studentName && userNames.some((name) => name && (studentName === name || studentName.includes(name) || name.includes(studentName))));

          return matchesId || matchesEmail || matchesName;
        });
      }

      setStudents(normalizedDatabaseStudents);
      setStudentLoadError("");
    } catch (error) {
      setStudents([]);
      setStudentLoadError(error.response?.data?.message || error.message || "Database is not reachable.");
      toast({
        title: "Student database unavailable",
        description: "Student registration only uses the database. Please check the backend and MongoDB connection.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setIsLoadingStudents(false);
    }
  }, [currentUser, workspaceLabel, toast]);

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        const data = await fetchExternalCourses();
        const normalized = (Array.isArray(data) ? data : [])
          .map((course) => course?.name || course?.title || course?.courseName)
          .filter(Boolean);
        if (isMounted && normalized.length) {
          const combined = Array.from(new Set([...DEFAULT_TRAINING_TITLES, ...normalized]));
          setTrainingTitles(combined);
        }
      } catch (err) {
        // Keep DEFAULT_TRAINING_TITLES
      }
    };

    loadStudents();
    loadCourses();
    return () => {
      isMounted = false;
    };
  }, [loadStudents]);



  const groupedStudents = useMemo(() => {
    return students.reduce((groups, student) => {
      const key = student.learningDepartment || "Unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(student);
      return groups;
    }, {});
  }, [students]);

  const filteredStudents = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const filtered = students.filter((student) => {
      const matchesDepartment = departmentFilter === "All" || student.learningDepartment === departmentFilter;
      const matchesStatus = statusFilter === "All" || student.status === statusFilter;
      const matchesReadiness = readinessFilter === "All" || (student.readinessStatus || "Not assessed") === readinessFilter;
      const matchesPayment = paymentFilter === "All" || (student.paymentOption || "Full Payment") === paymentFilter;
      const matchesTimeSlot = timeSlotFilter === "All" || (student.preferredTimeSlot || "Morning") === timeSlotFilter;
      const matchesClassCompletion = classCompletionFilter === "All" || (student.classCompletionStatus || (student.classCompleted ? "Completed" : "Not Completed")) === classCompletionFilter;
      const matchesCocPayment = cocPaymentFilter === "All" || (
        isCoffeeCuppingCourse(student) && (student.cocPaymentStatus || "Unpaid") === cocPaymentFilter
      );
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
        student.classCompletionStatus,
        student.classCompleted ? "class completed completed" : "class not completed incomplete",
        student.status,
        student.readinessStatus,
        student.registeredBy,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesDepartment && matchesStatus && matchesReadiness && matchesPayment && matchesTimeSlot && matchesClassCompletion && matchesCocPayment && (!search || searchableText.includes(search));
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
  }, [classCompletionFilter, cocPaymentFilter, departmentFilter, paymentFilter, readinessFilter, searchQuery, sortBy, sortDirection, statusFilter, students, timeSlotFilter]);

  const timeSlotCounts = useMemo(
    () =>
      timeSlotOptions.reduce((counts, slot) => {
        counts[slot] = students.filter((student) => (student.preferredTimeSlot || "Morning") === slot).length;
        return counts;
      }, {}),
    [students]
  );

  const selectedSectionStudents = useMemo(
    () =>
      selectedTimeSlotSection
        ? students.filter((student) => (student.preferredTimeSlot || "Morning") === selectedTimeSlotSection)
        : [],
    [selectedTimeSlotSection, students]
  );

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const visibleStudents = useMemo(() => {
    const start = (currentPage - 1) * STUDENTS_PER_PAGE;
    return filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [currentPage, filteredStudents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [classCompletionFilter, cocPaymentFilter, departmentFilter, paymentFilter, readinessFilter, searchQuery, sortBy, sortDirection, statusFilter, timeSlotFilter, viewMode]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const filteredGroups = useMemo(() => {
    return visibleStudents.reduce((groups, student) => {
      const key = student.learningDepartment || "Unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(student);
      return groups;
    }, {});
  }, [visibleStudents]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    if (!name || type === "file") return;
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
    if (name === "learningDepartment" || name === "program") {
      setForm((prev) => {
        let next = { ...prev, [name]: value };
        if (name === "program" && value && !prev.learningDepartment && TRAINING_TO_DEPARTMENT_MAP[value]) {
          next.learningDepartment = TRAINING_TO_DEPARTMENT_MAP[value];
        }
        return isCoffeeCuppingCourse(next)
          ? next
          : { ...next, cocPaymentStatus: "Unpaid" };
      });
      return;
    }
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
  };

  const openRegistrationForm = () => {
    const nextId = generateUniqueStudentId(students, workspaceLabel);
    setForm({
      ...initialForm,
      clientLocalId: `student-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      studentId: nextId,
      enrollmentDate: new Date().toISOString().split("T")[0],
      salesFollowupDate: new Date().toISOString().split("T")[0],
      registeredBy: registrarName,
      registeredByEmail: registrarEmail,
    });
    setEditingId("");
    onRegistrationOpen();
  };

  const closeRegistrationForm = () => {
    resetForm();
    onRegistrationClose();
  };

  const handleImageUpload = (field, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, WEBP).",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 900;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);
        setForm((prev) => ({
          ...prev,
          [field]: compressedBase64,
        }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.learningDepartment) {
      toast({ title: "Student name and learning department are required.", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    const now = new Date().toISOString();
    const cocPaymentStatus = isCoffeeCuppingCourse(form) ? form.cocPaymentStatus : "Unpaid";
    const requestedStudentId = form.studentId.trim();
    const duplicateStudentId = requestedStudentId
      ? students.find(
          (student) =>
            student.studentId?.toLowerCase() === requestedStudentId.toLowerCase() &&
            student.id !== editingId
        )
      : null;

    if (duplicateStudentId) {
      toast({
        title: "Duplicate Student ID",
        description: `${requestedStudentId} is already assigned to ${duplicateStudentId.fullName || "another student"}. Please use a different ID.`,
        status: "warning",
        duration: 4500,
        isClosable: true,
      });
      return;
    }

    setIsSavingStudent(true);

    if (editingId) {
      const updatedPayload = {
        ...form,
        syncToSalesFollowup: workspaceLabel === "Sales",
        cocPaymentStatus,
        fullName: form.fullName.trim(),
        classCompleted: form.classCompletionStatus === "Completed",
        registeredBy: form.registeredBy?.trim() || registrarName,
        registeredByEmail: form.registeredByEmail?.trim() || registrarEmail,
        updatedAt: now,
        updatedBy: registrarName,
        updatedByEmail: registrarEmail,
      };

      try {
        await updateStudentRegistration(editingId, updatedPayload);
        await loadStudents();
      } catch (error) {
        if (error.response?.status === 409) {
          toast({
            title: "Duplicate Student ID",
            description: error.response?.data?.message || "This Student ID is already assigned. Please use a different ID.",
            status: "warning",
            duration: 4500,
            isClosable: true,
          });
          setIsSavingStudent(false);
          return;
        }
        toast({
          title: "Database update failed",
          description: error.response?.data?.message || "Student records are database-only. The update was not saved.",
          status: "error",
          duration: 3500,
          isClosable: true,
        });
        setIsSavingStudent(false);
        return;
      }

      toast({ title: "Student registration updated", status: "success", duration: 2500, isClosable: true });
      setDepartmentFilter("All");
      setStatusFilter("All");
      setReadinessFilter("All");
      setPaymentFilter("All");
      setTimeSlotFilter("All");
      setClassCompletionFilter("All");
      setCocPaymentFilter("All");
      setSearchQuery("");
      setViewMode("list");
      resetForm();
      onRegistrationClose();
      setIsSavingStudent(false);
      return;
    }

    const newStudent = {
      ...form,
      cocPaymentStatus,
      id: form.clientLocalId || `student-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      studentId: requestedStudentId || generateUniqueStudentId(students, workspaceLabel),
      fullName: form.fullName.trim(),
      classCompleted: form.classCompletionStatus === "Completed",
      registeredBy: form.registeredBy?.trim() || registrarName,
      registeredByEmail: form.registeredByEmail?.trim() || registrarEmail,
      createdAt: now,
    };

    try {
      const created = await createStudentRegistration({
        ...newStudent,
        clientLocalId: newStudent.id,
        syncToSalesFollowup: workspaceLabel === "Sales",
      });
      await loadStudents();
    } catch (error) {
      if (error.response?.status === 409) {
        toast({
          title: "Duplicate Student ID",
          description: error.response?.data?.message || "This Student ID is already assigned. Please use a different ID.",
          status: "warning",
          duration: 4500,
          isClosable: true,
        });
        setIsSavingStudent(false);
        return;
      }
      toast({
        title: "Database save failed",
        description: error.response?.data?.error || error.response?.data?.message || "Student records are database-only. The student was not saved.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      setIsSavingStudent(false);
      return;
    }

    setDepartmentFilter("All");
    setStatusFilter("All");
    setReadinessFilter("All");
    setPaymentFilter("All");
    setTimeSlotFilter("All");
    setClassCompletionFilter("All");
    setCocPaymentFilter("All");
    setSearchQuery("");
    setViewMode("list");
    setForm(initialForm);
    onRegistrationClose();
    setIsSavingStudent(false);
    toast({
      title: "Student registered",
      description: workspaceLabel === "Sales"
        ? `${newStudent.fullName} was registered and added to the Sales Customer Followup table.`
        : `${newStudent.fullName} was added to ${newStudent.learningDepartment} and synced to TESBINN records.`,
      status: "success",
      duration: 3500,
      isClosable: true,
    });
    if (workspaceLabel === "Sales") {
      window.dispatchEvent(new CustomEvent("navigateToSection", { detail: { section: "Followup" } }));
    }
  };

  const handleEdit = async (student) => {
    let fullStudent = student;
    try {
      fullStudent = await getStudentRegistrationById(student.id);
    } catch (error) {
      toast({
        title: "Could not load registration documents",
        description: error.response?.data?.message || "Please try again before editing this registration.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
      return;
    }
    setEditingId(student.id);
    setForm({
      ...initialForm,
      ...fullStudent,
      nationalIdImage: fullStudent.nationalIdFrontImage || fullStudent.nationalIdImage || "",
      nationalIdFrontImage: fullStudent.nationalIdFrontImage || fullStudent.nationalIdImage || "",
      nationalIdBackImage: fullStudent.nationalIdBackImage || "",
      passportPhoto: fullStudent.passportPhoto || "",
      paymentScreenshot: fullStudent.paymentScreenshot || "",
      enrollmentDate: formatDate(fullStudent.enrollmentDate),
      trainingEndDate: formatDate(fullStudent.trainingEndDate || fullStudent.endDate),
      examDate: formatDate(fullStudent.examDate),
      salesFollowupDate: formatDate(fullStudent.salesFollowupDate),
      salesCallStatus: fullStudent.salesCallStatus || "Not Called",
      salesFollowupStatus: fullStudent.salesFollowupStatus || "Pending",
      salesSchedulePreference: fullStudent.salesSchedulePreference || "Regular",
      salesPackageScope: fullStudent.salesPackageScope || "Local",
      salesFollowupNote: fullStudent.salesFollowupNote || "",
    });
    onRegistrationOpen();
  };

  const handleDelete = (student) => {
    if (!student) return;
    setStudentToDelete(student);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    const targetId = studentToDelete.id || studentToDelete._id;

    try {
      setIsDeletingStudent(true);
      await deleteStudentRegistration(targetId);
      await loadStudents();
      if (editingId === targetId) resetForm();
      if (selectedStudent && (selectedStudent.id || selectedStudent._id) === targetId) {
        onClose();
        setSelectedStudent(null);
      }
      toast({
        title: "Student deleted",
        description: `${studentToDelete.fullName || "Student"} registration was deleted successfully.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      setStudentToDelete(null);
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || "The student could not be deleted from the database.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const handleDetail = async (student) => {
    setSelectedStudent(student);
    onOpen();
    try {
      const fullStudent = await getStudentRegistrationById(student.id);
      setSelectedStudent(normalizeStudent(fullStudent));
    } catch (error) {
      console.warn("Could not load full registration details", error);
    }
  };

  const toExportRow = (student) => ({
    "Student ID": student.studentId || "",
    "Student Name": getStudentName(student),
    "Full Name": getStudentName(student),
    Email: student.email || "",
    Phone: student.phone || "",
    Gender: student.gender || "",
    "Learning Department": student.learningDepartment || "Unassigned",
    Program: student.program || "",
    "Enrollment Date": formatDate(student.enrollmentDate),
      "Training End Date": formatDate(student.trainingEndDate || student.endDate),
    "Exam Date": formatDate(student.examDate),
    "Preferred Time Slot": student.preferredTimeSlot || "Morning",
    "Readiness Status": student.readinessStatus || "Not assessed",
    "Payment Option": student.paymentOption || "Full Payment",
    "Payment Bank": student.paymentBank || "",
    "FS Number": student.fsNumber || "",
    "Class Completed": student.classCompleted ? "Yes" : "No",
    "Class Outcome": student.classCompletionStatus || (student.classCompleted ? "Completed" : "Not Completed"),
    "CoC Payment Status": isCoffeeCuppingCourse(student) ? (student.cocPaymentStatus || "Unpaid") : "Not Applicable",
    Status: student.status || "",
    Notes: student.notes || "",
    "Registered By": student.registeredBy || "Unknown CS member",
    "Registrar Email": student.registeredByEmail || "",
    "Registration Date": formatDateTime(student.createdAt),
    "Last Updated By": student.updatedBy || "",
    "Last Updated At": formatDateTime(student.updatedAt),
  });

  const makeWorksheet = (XLSX, rows, columns = []) => {
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: rows.length && "Student Name" in rows[0] ? studentExportHeaders : undefined,
    });
    worksheet["!cols"] = columns.length
      ? columns
      : [
          { wch: 18 },
          { wch: 26 },
          { wch: 26 },
          { wch: 30 },
          { wch: 18 },
          { wch: 14 },
          { wch: 30 },
          { wch: 24 },
          { wch: 16 },
          { wch: 16 },
          { wch: 20 },
          { wch: 18 },
          { wch: 16 },
          { wch: 22 },
          { wch: 22 },
          { wch: 18 },
          { wch: 18 },
          { wch: 20 },
          { wch: 16 },
          { wch: 34 },
          { wch: 24 },
          { wch: 26 },
          { wch: 30 },
          { wch: 20 },
          { wch: 24 },
        ];
    return worksheet;
  };

  const handleExport = async () => {
    if (!filteredStudents.length) {
      toast({ title: "No student data to export for the selected filters.", status: "info", duration: 2500, isClosable: true });
      return;
    }

    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    const detailRows = filteredStudents.map(toExportRow);

    XLSX.utils.book_append_sheet(workbook, makeWorksheet(XLSX, detailRows), "Student Details");

    const exportGroups = filteredStudents.reduce((groups, student) => {
      const key = student.learningDepartment || "Unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(student);
      return groups;
    }, {});

    const summaryRows = Object.entries(exportGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([department, records]) => ({
        "Learning Department": department,
        "Exported Students": records.length,
        "Active Students": records.filter((student) => student.status === "Active").length,
        "Ready Students": records.filter((student) => student.readinessStatus === "Ready").length,
        "Full Payment Students": records.filter((student) => (student.paymentOption || "Full Payment") === "Full Payment").length,
      }));

    XLSX.utils.book_append_sheet(
      workbook,
      makeWorksheet(XLSX, summaryRows, [{ wch: 34 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 24 }]),
      "Department Summary"
    );

    Object.entries(exportGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([department, records]) => {
        XLSX.utils.book_append_sheet(workbook, makeWorksheet(XLSX, records.map(toExportRow)), safeSheetName(department));
      });

    const label = departmentFilter === "All" ? "All_Departments" : departmentFilter.replace(/\s+/g, "_");
    XLSX.writeFile(workbook, `CS_Student_Registrations_${label}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({
      title: "Excel export ready",
      description: `${filteredStudents.length} student records exported with full details.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    onExcelPreviewClose();
  };

  const handleExcelPreview = () => {
    if (!filteredStudents.length) {
      toast({ title: "No student data to preview for the selected filters.", status: "info", duration: 2500, isClosable: true });
      return;
    }
    onExcelPreviewOpen();
  };

  const renderActions = (student) => (
    <ButtonGroup size="xs" variant="outline" spacing={1.5}>
      {workspaceLabel !== "Sales" && (
        <Tooltip label="Print Official A4 Registration Dossier">
          <IconButton
            icon={<FiPrinter />}
            colorScheme="blue"
            variant="solid"
            aria-label="Print A4 Dossier"
            onClick={() => {
              setSelectedStudent(student);
              onA4DossierOpen();
            }}
          />
        </Tooltip>
      )}
      <Button
        leftIcon={<ViewIcon />}
        colorScheme="green"
        variant="solid"
        onClick={() => handleDetail(student)}
      >
        Detail
      </Button>
      <Button leftIcon={<EditIcon />} colorScheme="blue" onClick={() => handleEdit(student)}>Edit</Button>
      <Button leftIcon={<DeleteIcon />} colorScheme="red" onClick={() => handleDelete(student)}>Delete</Button>
    </ButtonGroup>
  );

  return (
    <StudentRegistrationShell embedded={embedded}>
      {!isRegistrationOpen && (
      <Box minH="100vh" bg={pageBg} p={{ base: 4, md: 6 }}>
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align={{ base: "flex-start", lg: "center" }} gap={4} direction={{ base: "column", lg: "row" }}>
            <Box>
              <HStack spacing={2} mb={2} flexWrap="wrap">
                <Badge colorScheme={workspaceLabel === "Sales" ? "teal" : "green"} borderRadius="full" px={3} py={1}>
                  {workspaceLabel === "Sales" ? "My Sales Registrations" : workspaceLabel}
                </Badge>
                <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                  {workspaceLabel === "Sales" ? "Registered By Me" : "Learning Registry"}
                </Badge>
                <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>{filteredStudents.length} visible</Badge>
              </HStack>
              <Heading size="lg" color={headingColor}>
                {workspaceLabel === "Sales" ? "My Registered Students" : "Student Registration"}
              </Heading>
              <Text color={mutedText} mt={1}>
                {workspaceLabel === "Sales"
                  ? `Viewing students registered by you (${registrarName}). Records from other sales reps or departments are restricted.`
                  : "Register, review, edit, and export students by assigned Learning Department."}
              </Text>
            </Box>
            <ButtonGroup flexWrap="wrap" spacing={2}>
              <Button leftIcon={<FiUserPlus />} colorScheme="green" onClick={openRegistrationForm}>Register Student</Button>
              {workspaceLabel !== "Sales" && (
                <Button leftIcon={<FiPrinter />} colorScheme="blue" onClick={onA4ReportOpen}>Print Directory (A4)</Button>
              )}
              <Button leftIcon={<FiClock />} colorScheme="blue" variant="outline" onClick={onSectionCountsOpen}>View Sections</Button>
              <Button leftIcon={<DownloadIcon />} colorScheme="green" variant="outline" onClick={handleExcelPreview}>Preview Excel</Button>
            </ButtonGroup>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
              <CardBody><HStack justify="space-between"><Stat><StatLabel color={mutedText}>{workspaceLabel === "Sales" ? "My Registered Students" : "Registered Students"}</StatLabel><StatNumber color={headingColor}>{students.length}</StatNumber></Stat><Icon as={FiUsers} boxSize={6} color="green.500" /></HStack></CardBody>
            </Card>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
              <CardBody><HStack justify="space-between"><Stat><StatLabel color={mutedText}>Visible Records</StatLabel><StatNumber color={headingColor}>{filteredStudents.length}</StatNumber></Stat><Icon as={FiList} boxSize={6} color="blue.500" /></HStack></CardBody>
            </Card>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
              <CardBody><HStack justify="space-between"><Stat><StatLabel color={mutedText}>Departments</StatLabel><StatNumber color={headingColor}>{Object.keys(groupedStudents).length}</StatNumber></Stat><Icon as={FiLayers} boxSize={6} color="purple.500" /></HStack></CardBody>
            </Card>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
              <CardBody><HStack justify="space-between"><Stat><StatLabel color={mutedText}>Ready for Exam</StatLabel><StatNumber color={headingColor}>{students.filter((student) => student.readinessStatus === "Ready").length}</StatNumber></Stat><Icon as={FiCheckCircle} boxSize={6} color="teal.500" /></HStack></CardBody>
            </Card>
          </SimpleGrid>

          {isLoadingStudents && (
            <Card bg={softPanelBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
              <CardBody py={3}>
                <HStack justify="space-between" gap={3} flexWrap="wrap">
                  <Text fontWeight="800" color={headingColor}>Loading student registrations...</Text>
                  <Text fontSize="sm" color={mutedText}>
                    {workspaceLabel === "Sales" ? "Loading your registered students..." : "Reading student records from the database."}
                  </Text>
                </HStack>
              </CardBody>
            </Card>
          )}

          {!isLoadingStudents && studentLoadError && (
            <Card bg="red.50" border="1px solid" borderColor="red.200" borderRadius="16px">
              <CardBody py={4}>
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="900" color="red.700">Student database is not reachable</Text>
                  <Text fontSize="sm" color="red.700">
                    Student Registration is database-only. No local browser records are being used.
                  </Text>
                  <Text fontSize="xs" color="red.600">{studentLoadError}</Text>
                </VStack>
              </CardBody>
            </Card>
          )}

          <Box>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
              <CardBody>
                <Flex justify="space-between" align={{ base: "flex-start", lg: "center" }} gap={4} direction={{ base: "column", lg: "row" }} mb={4}>
                  <Box>
                    <Heading size="md" color={headingColor}>Registered Students</Heading>
                    <Text fontSize="sm" color={mutedText}>Search, filter, switch view style, and export the selected records.</Text>
                  </Box>
                  <ButtonGroup size="sm" isAttached variant="outline">
                    <Button leftIcon={<FiList />} colorScheme={viewMode === "list" ? "green" : "gray"} variant={viewMode === "list" ? "solid" : "outline"} onClick={() => setViewMode("list")}>List</Button>
                    <Button leftIcon={<FiGrid />} colorScheme={viewMode === "grid" ? "green" : "gray"} variant={viewMode === "grid" ? "solid" : "outline"} onClick={() => setViewMode("grid")}>Grid</Button>
                    <Button leftIcon={<DownloadIcon />} onClick={handleExcelPreview}>Excel</Button>
                  </ButtonGroup>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 2, xl: 4, "2xl": 8 }} spacing={3} mb={4}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.400" /></InputLeftElement>
                    <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search students..." bg={fieldBg} />
                  </InputGroup>
                  <Select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Learning Departments</option>
                    {learningDepartments.map((department) => <option key={department} value={department}>{department}</option>)}
                  </Select>
                  <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Registration States</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </Select>
                  <Select value={readinessFilter} onChange={(event) => setReadinessFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Readiness States</option>
                    <option value="Not assessed">Not assessed</option>
                    <option value="In preparation">In preparation</option>
                    <option value="Ready">Ready</option>
                    <option value="Needs support">Needs support</option>
                    <option value="Not ready">Not ready</option>
                  </Select>
                  <Select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Payment Options</option>
                    {paymentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </Select>
                  <Select value={timeSlotFilter} onChange={(event) => setTimeSlotFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Time Slots</option>
                    {timeSlotOptions.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </Select>
                  <Select value={classCompletionFilter} onChange={(event) => setClassCompletionFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All Class Outcomes</option>
                    {classCompletionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </Select>
                  <Select value={cocPaymentFilter} onChange={(event) => setCocPaymentFilter(event.target.value)} bg={fieldBg}>
                    <option value="All">All CoC Payment</option>
                    {cocPaymentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </Select>
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} mb={4} maxW={{ base: "full", lg: "520px" }}>
                  <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)} bg={fieldBg}>
                    <option value="date">Sort by Date</option>
                    <option value="id">Sort by Student ID</option>
                    <option value="alphabet">Sort Alphabetically</option>
                  </Select>
                  <Select value={sortDirection} onChange={(event) => setSortDirection(event.target.value)} bg={fieldBg}>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </Select>
                </SimpleGrid>

                <Divider mb={4} />

                {viewMode === "grid" ? (
                  <VStack align="stretch" spacing={5}>
                    {Object.entries(filteredGroups).length ? Object.entries(filteredGroups).map(([department, records]) => (
                      <Box key={department}>
                        <HStack mb={3}><Badge colorScheme="green">{department}</Badge><Text fontSize="sm" color={mutedText}>{records.length} students</Text></HStack>
                        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
                          {records.map((student) => (
                            <Card key={student.id} border="1px solid" borderColor={borderColor} bg={cardAltBg} borderRadius="14px">
                              <CardBody>
                                <VStack align="stretch" spacing={3}>
                                  <HStack align="flex-start" justify="space-between" gap={3}>
                                    <Box>
                                      <Text fontWeight="900" color={headingColor}>{student.fullName}</Text>
                                      <Text fontSize="xs" color={mutedText}>{student.studentId}</Text>
                                    </Box>
                                    <Badge colorScheme="green" variant="subtle">{student.learningDepartment || "Unassigned"}</Badge>
                                  </HStack>
                                  <HStack flexWrap="wrap" spacing={2}>
                                    <Badge colorScheme={getStateColor(getClassOutcome(student))}>{getClassOutcome(student)}</Badge>
                                    <Badge colorScheme={getStateColor(student.paymentOption)}>{student.paymentOption || "Full Payment"}</Badge>
                                  </HStack>
                                  <Flex justify="flex-end">{renderActions(student)}</Flex>
                                </VStack>
                              </CardBody>
                            </Card>
                          ))}
                        </SimpleGrid>
                      </Box>
                    )) : <Box py={10} textAlign="center"><Text fontWeight="800">No students match the selected filters.</Text></Box>}
                  </VStack>
                ) : (
                  <TableContainer>
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Student</Th>
                          <Th>Learning Department</Th>
                          <Th>Class</Th>
                          <Th>Payment Option</Th>
                          <Th textAlign="right">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {visibleStudents.length ? visibleStudents.map((student) => (
                          <Tr key={student.id} _hover={{ bg: rowHoverBg }}>
                            <Td>
                              <Text fontWeight="800" color={headingColor}>{student.fullName}</Text>
                              <Text fontSize="xs" color={mutedText}>{student.studentId}</Text>
                            </Td>
                            <Td><Badge colorScheme="green" variant="subtle">{student.learningDepartment || "Unassigned"}</Badge></Td>
                            <Td><Badge colorScheme={getStateColor(getClassOutcome(student))}>{getClassOutcome(student)}</Badge></Td>
                            <Td><Badge colorScheme={getStateColor(student.paymentOption)}>{student.paymentOption || "Full Payment"}</Badge></Td>
                            <Td textAlign="right">{renderActions(student)}</Td>
                          </Tr>
                        )) : (
                          <Tr><Td colSpan={5}><Box py={10} textAlign="center"><Text fontWeight="800" color={headingColor}>No students match the selected filters.</Text><Text fontSize="sm" color={mutedText}>Adjust search/filter settings or add a new student.</Text></Box></Td></Tr>
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}

                {filteredStudents.length > STUDENTS_PER_PAGE && (
                  <Flex justify="space-between" align="center" gap={3} mt={5} flexWrap="wrap">
                    <Text fontSize="sm" color={mutedText}>
                      Showing {(currentPage - 1) * STUDENTS_PER_PAGE + 1}-{Math.min(currentPage * STUDENTS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length}
                    </Text>
                    <ButtonGroup size="sm" variant="outline">
                      <Button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} isDisabled={currentPage === 1}>Previous</Button>
                      <Button pointerEvents="none" variant="ghost">Page {currentPage} of {totalPages}</Button>
                      <Button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} isDisabled={currentPage === totalPages}>Next</Button>
                    </ButtonGroup>
                  </Flex>
                )}
              </CardBody>
            </Card>
          </Box>
        </VStack>
      </Box>
      )}

      <Drawer
        isOpen={isRegistrationOpen}
        placement="right"
        onClose={closeRegistrationForm}
        size="xl"
        initialFocusRef={fullNameInputRef}
      >
        <DrawerOverlay />
        <DrawerContent
          bg={pageBg}
          h="100dvh"
          maxH="100dvh"
          maxW={{ base: "100vw", md: "760px", xl: "860px" }}
          pointerEvents="auto"
        >
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} bg={cardBg} flexShrink={0} pr={12} zIndex={2}>
            <HStack spacing={3}>
              <Box p={3} borderRadius="14px" bg={softPanelBg}>
                <Icon as={FiUserPlus} boxSize={5} color="green.600" />
              </Box>
              <Box>
                <Heading size="md" color={headingColor}>{editingId ? "Edit Student" : "Register Student"}</Heading>
                <Text fontSize="sm" color={mutedText}>{editingId ? "Update student state and learning details." : "Capture learning assignment details."}</Text>
              </Box>
            </HStack>
          </DrawerHeader>
          <Box
            as="form"
            onSubmit={handleSubmit}
            onKeyDown={(event) => event.stopPropagation()}
            display="flex"
            flexDirection="column"
            flex="1"
            minH={0}
            overflow="hidden"
            pointerEvents="auto"
          >
            <DrawerBody py={5} pb={8} flex="1" minH={0} overflowY="auto" overscrollBehavior="contain">
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <FormControl>
                    <Flex justify="space-between" align="center" mb={1}>
                      <FormLabel mb={0}>Student ID</FormLabel>
                      <HStack spacing={1}>
                        <Badge colorScheme={workspaceLabel === "Sales" ? "blue" : "purple"} fontSize="10px" px={2} py={0.5} borderRadius="full">
                          {workspaceLabel === "Sales" ? "Sales Unique ID" : "Auto-Generated"}
                        </Badge>
                        {!editingId && (
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="blue"
                            leftIcon={<FiRefreshCw />}
                            onClick={() => {
                              const freshId = generateUniqueStudentId(students, workspaceLabel);
                              setForm((prev) => ({ ...prev, studentId: freshId }));
                            }}
                            title="Regenerate unique ID"
                            fontSize="10px"
                            h="20px"
                            px={1.5}
                          >
                            Refresh
                          </Button>
                        )}
                      </HStack>
                    </Flex>
                    <Input
                      name="studentId"
                      value={form.studentId}
                      isReadOnly
                      placeholder="Generated by the system"
                      bg={softPanelBg}
                      fontWeight="700"
                      cursor="not-allowed"
                      borderColor={borderColor}
                    />
                  </FormControl>
                  <FormControl isRequired><FormLabel>Full Name</FormLabel><Input ref={fullNameInputRef} name="fullName" value={form.fullName} onChange={handleChange} placeholder="Student full name" bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Email (Optional)</FormLabel><Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="student@example.com" bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Phone</FormLabel><Input name="phone" value={form.phone} onChange={handleChange} placeholder="+251..." bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Gender</FormLabel><Select name="gender" value={form.gender} onChange={handleChange} bg={fieldBg} placeholder="Select gender"><option value="Female">Female</option><option value="Male">Male</option></Select></FormControl>
                  <FormControl isRequired><FormLabel>Learning Department</FormLabel><Select name="learningDepartment" value={form.learningDepartment} onChange={handleChange} bg={fieldBg} placeholder="Assign department">{form.learningDepartment && !learningDepartments.includes(form.learningDepartment) && <option value={form.learningDepartment}>{form.learningDepartment}</option>}{learningDepartments.map((department) => <option key={department} value={department}>{department}</option>)}</Select></FormControl>
                  <FormControl>
                    <FormLabel>Training Title</FormLabel>
                    <Select
                      name="program"
                      value={form.program}
                      onChange={handleChange}
                      placeholder="Select training title"
                      bg={fieldBg}
                    >
                      {form.program && !trainingTitles.includes(form.program) && (
                        <option value={form.program}>{form.program}</option>
                      )}
                      {trainingTitles.map((title) => (
                        <option key={title} value={title}>
                          {title}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl><FormLabel>Enrollment Date</FormLabel><Input name="enrollmentDate" type="date" value={form.enrollmentDate} onChange={handleChange} bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Training End Date</FormLabel><Input name="trainingEndDate" type="date" value={form.trainingEndDate} onChange={handleChange} bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Exam Date</FormLabel><Input name="examDate" type="date" value={form.examDate} onChange={handleChange} bg={fieldBg} /></FormControl>
                  <FormControl><FormLabel>Preferred Time Slot</FormLabel><Select name="preferredTimeSlot" value={form.preferredTimeSlot} onChange={handleChange} bg={fieldBg}>{timeSlotOptions.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</Select></FormControl>
                  <FormControl><FormLabel>Readiness Status</FormLabel><Select name="readinessStatus" value={form.readinessStatus} onChange={handleChange} bg={fieldBg}><option value="Not assessed">Not assessed</option><option value="In preparation">In preparation</option><option value="Ready">Ready</option><option value="Needs support">Needs support</option><option value="Not ready">Not ready</option></Select></FormControl>
                  <FormControl><FormLabel>Payment Option</FormLabel><Select name="paymentOption" value={form.paymentOption} onChange={handleChange} bg={fieldBg}>{paymentOptions.map((option) => <option key={option} value={option}>{option}</option>)}</Select></FormControl>
                  <FormControl>
                    <FormLabel>Payment Bank</FormLabel>
                    <Select
                      name="paymentBank"
                      value={form.paymentBank}
                      onChange={handleChange}
                      placeholder="Select Ethiopian Bank"
                      bg={fieldBg}
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
                  <FormControl><FormLabel>FS Number</FormLabel><Input name="fsNumber" value={form.fsNumber} onChange={handleChange} placeholder="Paid receipt FS number" bg={fieldBg} /></FormControl>
                  {isCoffeeCuppingCourse(form) && (
                    <FormControl>
                      <FormLabel>COC Fee</FormLabel>
                      <Select name="cocPaymentStatus" value={form.cocPaymentStatus} onChange={handleChange} bg={fieldBg}>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                      </Select>
                      <Text mt={1} fontSize="xs" color={mutedText}>Available only for Coffee Cupping students.</Text>
                    </FormControl>
                  )}
                  <FormControl><FormLabel>Registration Status</FormLabel><Select name="status" value={form.status} onChange={handleChange} bg={fieldBg}><option value="Active">Active</option><option value="Pending">Pending</option><option value="Completed">Completed</option><option value="Paused">Paused</option></Select></FormControl>
                  {workspaceLabel === "Sales" && (
                    <Box
                      gridColumn={{ base: "auto", md: "1 / -1" }}
                      border="2px solid"
                      borderColor="blue.300"
                      borderRadius="20px"
                      p={{ base: 4, md: 5 }}
                      bg={salesPanelBg}
                      boxShadow="0 4px 14px rgba(59, 130, 246, 0.08)"
                      position="relative"
                      overflow="hidden"
                    >
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        h="4px"
                        bgGradient="linear(to-r, blue.400, teal.400)"
                      />
                      <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} mb={3} flexWrap="wrap" gap={2}>
                        <HStack spacing={2.5}>
                          <Box p={2} borderRadius="10px" bg="blue.500" color="white">
                            <Icon as={FiPhoneCall} boxSize={4} />
                          </Box>
                          <Box>
                            <HStack spacing={2}>
                              <Heading size="sm" color={headingColor}>
                                Customer Follow-up Integration
                              </Heading>
                              <Badge colorScheme="blue" borderRadius="full" px={2} py={0.5} fontSize="10px">
                                Sales CRM Sync
                              </Badge>
                            </HStack>
                            <Text fontSize="xs" color={mutedText} mt={0.5}>
                              Customer contact details and assigned program sync seamlessly to the Sales Customer Followup table.
                            </Text>
                          </Box>
                        </HStack>
                        <Badge colorScheme="teal" variant="subtle" px={2.5} py={1} borderRadius="md" fontSize="xs">
                          {form.program || form.learningDepartment || "Course Linked"}
                        </Badge>
                      </Flex>
                      <Divider borderColor="blue.200" mb={4} />
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="xs" fontWeight="700" textTransform="uppercase" color={mutedText}>
                            Call Status
                          </FormLabel>
                          <Select
                            name="salesCallStatus"
                            value={form.salesCallStatus}
                            onChange={handleChange}
                            bg={fieldBg}
                            borderColor="blue.200"
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                          >
                            {['Not Called', 'Called', 'Busy', 'No Answer', 'Callback', '2x Called'].map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="xs" fontWeight="700" textTransform="uppercase" color={mutedText}>
                            Follow-up Status
                          </FormLabel>
                          <Select
                            name="salesFollowupStatus"
                            value={form.salesFollowupStatus}
                            onChange={handleChange}
                            bg={fieldBg}
                            borderColor="blue.200"
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                          >
                            {['Prospect', 'Pending', 'Scheduled', 'Completed', 'Cancelled', 'Imported'].map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="xs" fontWeight="700" textTransform="uppercase" color={mutedText}>
                            Schedule / Shift Preference
                          </FormLabel>
                          <Select
                            name="salesSchedulePreference"
                            value={form.salesSchedulePreference}
                            onChange={handleChange}
                            bg={fieldBg}
                            borderColor="blue.200"
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                          >
                            {['Regular', 'Morning', 'Afternoon', 'Night', 'Weekend', 'Online', 'VIP'].map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="xs" fontWeight="700" textTransform="uppercase" color={mutedText}>
                            Package Scope
                          </FormLabel>
                          <Select
                            name="salesPackageScope"
                            value={form.salesPackageScope}
                            onChange={handleChange}
                            bg={fieldBg}
                            borderColor="blue.200"
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                          >
                            <option value="Local">Local</option>
                            <option value="International">International</option>
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="xs" fontWeight="700" textTransform="uppercase" color={mutedText}>
                            Next Follow-up Date
                          </FormLabel>
                          <Input
                            name="salesFollowupDate"
                            type="date"
                            value={form.salesFollowupDate}
                            onChange={handleChange}
                            bg={fieldBg}
                            borderColor="blue.200"
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="xs" fontWeight="700" textTransform="uppercase" color={mutedText}>
                            Linked Training Title
                          </FormLabel>
                          <Input
                            isReadOnly
                            value={form.program || form.learningDepartment || "Select Training Title above"}
                            bg={softPanelBg}
                            fontWeight="700"
                            color="teal.700"
                            cursor="not-allowed"
                            borderColor="blue.200"
                          />
                        </FormControl>
                        <FormControl gridColumn={{ base: "auto", md: "1 / -1" }}>
                          <FormLabel fontSize="xs" fontWeight="700" textTransform="uppercase" color={mutedText}>
                            Customer Follow-up Note & Discussion
                          </FormLabel>
                          <Textarea
                            name="salesFollowupNote"
                            value={form.salesFollowupNote}
                            onChange={handleChange}
                            placeholder="Record conversation details, customer preferences, promised follow-up schedule, or next actions..."
                            bg={fieldBg}
                            borderColor="blue.200"
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                            rows={3}
                          />
                        </FormControl>
                      </SimpleGrid>
                    </Box>
                  )}
                  <Box gridColumn={{ base: "auto", md: "1 / -1" }} border="1px solid" borderColor={form.classCompleted ? "green.300" : borderColor} borderRadius="18px" px={5} py={4} bg={form.classCompleted ? softPanelBg : cardAltBg}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} alignItems="center">
                      <FormControl>
                        <Checkbox name="classCompleted" colorScheme="green" size="lg" isChecked={form.classCompleted} onChange={handleChange}>
                          <Text as="span" fontSize={{ base: "md", md: "lg" }} fontWeight="900" color={headingColor}>
                            Class completed
                          </Text>
                        </Checkbox>
                        <Text fontSize="sm" color={mutedText} mt={2} pl={{ base: 0, md: 8 }}>
                          Mark this when the student finishes the assigned learning department class.
                        </Text>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Class Outcome</FormLabel>
                        <Select name="classCompletionStatus" value={form.classCompletionStatus} onChange={handleChange} bg={fieldBg}>
                          {classCompletionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </Select>
                      </FormControl>
                    </SimpleGrid>
                  </Box>

                  {/* Student Verification Documents & Photos */}
                  <Box
                    gridColumn={{ base: "auto", md: "1 / -1" }}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="18px"
                    p={5}
                    bg={cardAltBg}
                  >
                    <HStack spacing={2} mb={1}>
                      <Icon as={FiCamera} color="green.600" boxSize={5} />
                      <Heading size="sm" color={headingColor}>
                        Student Verification Documents & Photos
                      </Heading>
                    </HStack>
                    <Text fontSize="xs" color={mutedText} mb={4}>
                      National ID front/back is optional. The payment receipt photo is required.
                    </Text>

                    <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
                      {/* 1. 3x4 Passport Photo */}
                      <Box
                        border="1px dashed"
                        borderColor={form.passportPhoto ? "green.400" : borderColor}
                        borderRadius="14px"
                        p={3}
                        bg={fieldBg}
                        textAlign="center"
                      >
                        <Text fontSize="xs" fontWeight="800" color={headingColor} mb={2}>
                          3×4 Passport Photo
                        </Text>
                        {form.passportPhoto ? (
                          <VStack spacing={2}>
                            <Image
                              src={form.passportPhoto}
                              alt="Passport Photo Preview"
                              maxH="110px"
                              borderRadius="md"
                              mx="auto"
                              objectFit="cover"
                            />
                            <HStack justify="center" spacing={2}>
                              <Badge colorScheme="green" fontSize="9px">Uploaded</Badge>
                              <Button
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                leftIcon={<FiTrash2 />}
                                onClick={() => setForm((prev) => ({ ...prev, passportPhoto: "" }))}
                              >
                                Remove
                              </Button>
                            </HStack>
                          </VStack>
                        ) : (
                          <VStack spacing={2} py={4}>
                            <Icon as={FiUploadCloud} boxSize={8} color="gray.400" />
                            <Text fontSize="11px" color={mutedText}>PNG, JPG or WEBP</Text>
                            <Button
                              as="label"
                              htmlFor="passport-photo-upload"
                              size="xs"
                              colorScheme="blue"
                              variant="outline"
                              cursor="pointer"
                            >
                              Upload Photo
                            </Button>
                            <input
                              id="passport-photo-upload"
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => handleImageUpload("passportPhoto", e.target.files[0])}
                            />
                          </VStack>
                        )}
                      </Box>

                      {/* 2. Optional National ID / Kebele Card Front */}
                      <Box
                        border="1px dashed"
                        borderColor={form.nationalIdFrontImage ? "green.400" : borderColor}
                        borderRadius="14px"
                        p={3}
                        bg={fieldBg}
                        textAlign="center"
                      >
                        <Text fontSize="xs" fontWeight="800" color={headingColor} mb={2}>
                          National ID Front (Optional)
                        </Text>
                        {form.nationalIdFrontImage ? (
                          <VStack spacing={2}>
                            <Image
                              src={form.nationalIdFrontImage}
                              alt="National ID Front Preview"
                              maxH="110px"
                              borderRadius="md"
                              mx="auto"
                              objectFit="contain"
                            />
                            <HStack justify="center" spacing={2}>
                              <Badge colorScheme="green" fontSize="9px">Uploaded</Badge>
                              <Button
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                leftIcon={<FiTrash2 />}
                                onClick={() => setForm((prev) => ({ ...prev, nationalIdImage: "", nationalIdFrontImage: "" }))}
                              >
                                Remove
                              </Button>
                            </HStack>
                          </VStack>
                        ) : (
                          <VStack spacing={2} py={4}>
                            <Icon as={FiUploadCloud} boxSize={8} color="gray.400" />
                            <Text fontSize="11px" color={mutedText}>PNG, JPG or WEBP</Text>
                            <Button
                              as="label"
                              htmlFor="national-id-front-upload"
                              size="xs"
                              colorScheme="blue"
                              variant="outline"
                              cursor="pointer"
                            >
                              Upload Front
                            </Button>
                            <input
                              id="national-id-front-upload"
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => handleImageUpload("nationalIdFrontImage", e.target.files[0])}
                            />
                          </VStack>
                        )}
                      </Box>

                      {/* 3. Optional National ID / Kebele Card Back */}
                      <Box
                        border="1px dashed"
                        borderColor={form.nationalIdBackImage ? "green.400" : borderColor}
                        borderRadius="14px"
                        p={3}
                        bg={fieldBg}
                        textAlign="center"
                      >
                        <Text fontSize="xs" fontWeight="800" color={headingColor} mb={2}>
                          National ID Back (Optional)
                        </Text>
                        {form.nationalIdBackImage ? (
                          <VStack spacing={2}>
                            <Image
                              src={form.nationalIdBackImage}
                              alt="National ID Back Preview"
                              maxH="110px"
                              borderRadius="md"
                              mx="auto"
                              objectFit="contain"
                            />
                            <HStack justify="center" spacing={2}>
                              <Badge colorScheme="green" fontSize="9px">Uploaded</Badge>
                              <Button
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                leftIcon={<FiTrash2 />}
                                onClick={() => setForm((prev) => ({ ...prev, nationalIdBackImage: "" }))}
                              >
                                Remove
                              </Button>
                            </HStack>
                          </VStack>
                        ) : (
                          <VStack spacing={2} py={4}>
                            <Icon as={FiUploadCloud} boxSize={8} color="gray.400" />
                            <Text fontSize="11px" color={mutedText}>PNG, JPG or WEBP</Text>
                            <Button
                              as="label"
                              htmlFor="national-id-back-upload"
                              size="xs"
                              colorScheme="blue"
                              variant="outline"
                              cursor="pointer"
                            >
                              Upload Back
                            </Button>
                            <input
                              id="national-id-back-upload"
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => handleImageUpload("nationalIdBackImage", e.target.files[0])}
                            />
                          </VStack>
                        )}
                      </Box>

                      {/* 4. Payment Receipt Screenshot */}
                      <Box
                        border="1px dashed"
                        borderColor={form.paymentScreenshot ? "green.400" : borderColor}
                        borderRadius="14px"
                        p={3}
                        bg={fieldBg}
                        textAlign="center"
                      >
                        <Text fontSize="xs" fontWeight="800" color={headingColor} mb={2}>
                          Payment Receipt Screenshot (Required)
                        </Text>
                        {form.paymentScreenshot ? (
                          <VStack spacing={2}>
                            <Image
                              src={form.paymentScreenshot}
                              alt="Payment Receipt Preview"
                              maxH="110px"
                              borderRadius="md"
                              mx="auto"
                              objectFit="contain"
                            />
                            <HStack justify="center" spacing={2}>
                              <Badge colorScheme="green" fontSize="9px">Uploaded</Badge>
                              <Button
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                leftIcon={<FiTrash2 />}
                                onClick={() => setForm((prev) => ({ ...prev, paymentScreenshot: "" }))}
                              >
                                Remove
                              </Button>
                            </HStack>
                          </VStack>
                        ) : (
                          <VStack spacing={2} py={4}>
                            <Icon as={FiUploadCloud} boxSize={8} color="gray.400" />
                            <Text fontSize="11px" color={mutedText}>Bank slip or screenshot</Text>
                            <Button
                              as="label"
                              htmlFor="payment-screenshot-upload"
                              size="xs"
                              colorScheme="blue"
                              variant="outline"
                              cursor="pointer"
                            >
                              Upload Receipt
                            </Button>
                            <input
                              id="payment-screenshot-upload"
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => handleImageUpload("paymentScreenshot", e.target.files[0])}
                            />
                          </VStack>
                        )}
                      </Box>
                    </SimpleGrid>
                  </Box>

                  <FormControl>
                    <FormLabel>Registered By</FormLabel>
                    <Input
                      value={form.registeredBy || registrarName}
                      isReadOnly
                      bg={softPanelBg}
                      fontWeight="800"
                    />
                    <Text mt={1} fontSize="xs" color={mutedText}>Fixed automatically from the signed-in system user.</Text>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Registrar Email (System)</FormLabel>
                    <Input
                      type="email"
                      value={form.registeredByEmail || registrarEmail}
                      isReadOnly
                      bg={softPanelBg}
                    />
                  </FormControl>
                </SimpleGrid>
                <FormControl><FormLabel>Notes</FormLabel><Textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Optional learning notes" bg={fieldBg} rows={3} /></FormControl>
              </VStack>
            </DrawerBody>
            <DrawerFooter
              borderTopWidth="1px"
              borderColor={borderColor}
              bg={cardBg}
              flexShrink={0}
              zIndex={2}
              boxShadow="0 -8px 20px rgba(15, 23, 42, 0.08)"
              gap={3}
              flexWrap="wrap"
              justifyContent="flex-end"
              px={{ base: 4, md: 6 }}
              py={4}
            >
              <Button variant="outline" onClick={closeRegistrationForm} w={{ base: "full", sm: "auto" }} isDisabled={isSavingStudent}>Cancel</Button>
              <Button
                type="submit"
                colorScheme="green"
                leftIcon={<FiBookOpen />}
                w={{ base: "full", sm: "auto" }}
                whiteSpace="normal"
                isLoading={isSavingStudent}
                loadingText={editingId ? "Updating..." : "Saving..."}
              >
                {editingId ? "Update Student" : "Save Student Registration"}
              </Button>
            </DrawerFooter>
          </Box>
        </DrawerContent>
      </Drawer>

      <Modal isOpen={isSectionCountsOpen} onClose={onSectionCountsClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalHeader color={headingColor}>Students by Time Section</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={5}>
              {timeSlotOptions.map((slot) => (
                <Card key={slot} bg={cardAltBg} border="1px solid" borderColor={borderColor} borderRadius="16px">
                  <CardBody>
                    <HStack justify="space-between" align="flex-start">
                      <Stat>
                        <StatLabel color={mutedText}>{slot}</StatLabel>
                        <StatNumber color={headingColor}>{timeSlotCounts[slot] || 0}</StatNumber>
                      </Stat>
                      <VStack align="flex-end" spacing={2}>
                        <Badge colorScheme={getStateColor(slot)} borderRadius="full" px={3} py={1}>
                          {slot}
                        </Badge>
                        <Button
                          size="xs"
                          colorScheme={selectedTimeSlotSection === slot ? "green" : "blue"}
                          variant={selectedTimeSlotSection === slot ? "solid" : "outline"}
                          onClick={() => setSelectedTimeSlotSection((current) => (current === slot ? "" : slot))}
                        >
                          View Students
                        </Button>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>

            {selectedTimeSlotSection && (
              <Box border="1px solid" borderColor={borderColor} borderRadius="16px" overflow="hidden">
                <Box px={4} py={3} bg={cardAltBg}>
                  <HStack justify="space-between">
                    <Box>
                      <Text fontWeight="900" color={headingColor}>{selectedTimeSlotSection} Students</Text>
                      <Text fontSize="sm" color={mutedText}>{selectedSectionStudents.length} enrolled in this section.</Text>
                    </Box>
                    <Badge colorScheme={getStateColor(selectedTimeSlotSection)} borderRadius="full" px={3} py={1}>
                      {selectedTimeSlotSection}
                    </Badge>
                  </HStack>
                </Box>
                <TableContainer maxH="320px" overflowY="auto">
                  <Table size="sm">
                    <Thead bg={cardBg} position="sticky" top={0} zIndex={1}>
                      <Tr>
                        <Th>Student</Th>
                        <Th>Learning Department</Th>
                        <Th>Training Title</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedSectionStudents.length ? selectedSectionStudents.map((student) => (
                        <Tr key={student.id}>
                          <Td>
                            <Text fontWeight="800">{getStudentName(student)}</Text>
                            <Text fontSize="xs" color={mutedText}>{student.studentId || "No student ID"}</Text>
                          </Td>
                          <Td><Badge colorScheme="green" variant="subtle">{student.learningDepartment || "Unassigned"}</Badge></Td>
                          <Td>{student.program || student.learningDepartment || "Not specified"}</Td>
                        </Tr>
                      )) : (
                        <Tr>
                          <Td colSpan={3}>
                            <Box py={8} textAlign="center">
                              <Text fontWeight="800" color={headingColor}>No students in this section.</Text>
                            </Box>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => { setSelectedTimeSlotSection(""); onSectionCountsClose(); }}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isExcelPreviewOpen} onClose={onExcelPreviewClose} size="6xl">
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalHeader color={headingColor}>Excel Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color={mutedText} mb={4}>
              Previewing {filteredStudents.length} student records from the current filters.
            </Text>
            <TableContainer border="1px solid" borderColor={borderColor} borderRadius="14px" maxH="60vh" overflowY="auto">
              <Table size="sm">
                <Thead bg={cardAltBg} position="sticky" top={0} zIndex={1}>
                  <Tr>
                    <Th>Student Name</Th>
                    <Th>Learning Department</Th>
                    <Th>Section</Th>
                    <Th>Payment</Th>
                    <Th>Class</Th>
                    <Th>CoC</Th>
                    <Th>Readiness</Th>
                    <Th>Exam Date</Th>
                    <Th>Registered By</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredStudents.map((student) => (
                    <Tr key={student.id}>
                      <Td><Text fontWeight="800">{getStudentName(student)}</Text><Text fontSize="xs" color={mutedText}>{student.studentId}</Text></Td>
                      <Td>{student.learningDepartment || "Unassigned"}</Td>
                      <Td><Badge colorScheme={getStateColor(student.preferredTimeSlot)}>{student.preferredTimeSlot || "Morning"}</Badge></Td>
                      <Td><Badge colorScheme={getStateColor(student.paymentOption)}>{student.paymentOption || "Full Payment"}</Badge></Td>
                      <Td><Badge colorScheme={getStateColor(getClassOutcome(student))}>{getClassOutcome(student)}</Badge></Td>
                      <Td>
                        {isCoffeeCuppingCourse(student) ? (
                          <Badge colorScheme={getStateColor(student.cocPaymentStatus)}>{student.cocPaymentStatus || "Unpaid"}</Badge>
                        ) : (
                          <Badge colorScheme="gray">N/A</Badge>
                        )}
                      </Td>
                      <Td>{student.readinessStatus || "Not assessed"}</Td>
                      <Td>{formatDate(student.examDate) || "Not set"}</Td>
                      <Td>{student.registeredBy || "Unknown CS member"}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} variant="outline" onClick={onExcelPreviewClose}>Cancel</Button>
            <Button leftIcon={<DownloadIcon />} colorScheme="green" onClick={handleExport}>Export Excel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
        <DrawerOverlay />
        <DrawerContent bg={pageBg}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" bg={cardBg}>
            <HStack spacing={3} align="center">
              <Box p={3} borderRadius="14px" bg={softPanelBg}>
                <Icon as={FiBookOpen} boxSize={5} color="green.600" />
              </Box>
              <Box>
                <HStack spacing={2} mb={1} flexWrap="wrap">
                  <Badge colorScheme="green">{selectedStudent?.learningDepartment || "Unassigned"}</Badge>
                  <Badge colorScheme={getStateColor(selectedStudent?.readinessStatus)}>{selectedStudent?.readinessStatus || "Not assessed"}</Badge>
                  <Badge colorScheme={getStateColor(selectedStudent?.preferredTimeSlot)}>{selectedStudent?.preferredTimeSlot || "Morning"}</Badge>
                  <Badge colorScheme={getStateColor(selectedStudent?.paymentOption)}>{selectedStudent?.paymentOption || "Full Payment"}</Badge>
                  <Badge colorScheme={getStateColor(getClassOutcome(selectedStudent))}>Class {getClassOutcome(selectedStudent)}</Badge>
                </HStack>
                <Text color={headingColor}>Student Detail</Text>
                <Text fontSize="sm" color={mutedText} fontWeight="600">{selectedStudent?.fullName}</Text>
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
                          <Badge colorScheme={getStateColor(selectedStudent.readinessStatus)} borderRadius="full" px={3} py={1}>{selectedStudent.readinessStatus || "Not assessed"}</Badge>
                          <Badge colorScheme={getStateColor(selectedStudent.preferredTimeSlot)} borderRadius="full" px={3} py={1}>{selectedStudent.preferredTimeSlot || "Morning"}</Badge>
                          <Badge colorScheme={getStateColor(selectedStudent.paymentOption)} borderRadius="full" px={3} py={1}>{selectedStudent.paymentOption || "Full Payment"}</Badge>
                          <Badge colorScheme={getStateColor(getClassOutcome(selectedStudent))} borderRadius="full" px={3} py={1}>Class {getClassOutcome(selectedStudent)}</Badge>
                          {isCoffeeCuppingCourse(selectedStudent) && (
                            <Badge colorScheme={getStateColor(selectedStudent.cocPaymentStatus)} borderRadius="full" px={3} py={1}>CoC {selectedStudent.cocPaymentStatus || "Unpaid"}</Badge>
                          )}
                        </HStack>
                        <Heading size="md" color={headingColor}>{selectedStudent.fullName}</Heading>
                        <Text fontSize="sm" color={mutedText}>{selectedStudent.studentId || "No student ID"} - {selectedStudent.program || selectedStudent.learningDepartment || "No training assigned"}</Text>
                      </Box>
                      {workspaceLabel !== "Sales" && (
                        <Button
                          leftIcon={<FiPrinter />}
                          colorScheme="blue"
                          size="sm"
                          borderRadius="xl"
                          fontSize="12px"
                          fontWeight="700"
                          onClick={() => onA4DossierOpen()}
                        >
                          Print A4 Dossier
                        </Button>
                      )}
                    </Flex>
                  </CardBody>
                </Card>

                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <HStack mb={4} spacing={3}>
                      <Box p={2.5} borderRadius="12px" bg={softPanelBg}>
                        <Icon as={FiBookOpen} boxSize={4} color="green.600" />
                      </Box>
                      <Box>
                        <Heading size="sm" color={headingColor}>Learning Details</Heading>
                        <Text fontSize="sm" color={mutedText}>Department, program, and readiness information.</Text>
                      </Box>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <DetailItem label="Learning Department" value={selectedStudent.learningDepartment} />
                      <DetailItem label="Training Title" value={selectedStudent.program || selectedStudent.learningDepartment || "Not specified"} />
                      <DetailItem label="Enrollment Date" value={formatDate(selectedStudent.enrollmentDate)} />
                      <DetailItem label="Exam Date" value={formatDate(selectedStudent.examDate)} />
                      <DetailItem label="Preferred Time Slot" value={selectedStudent.preferredTimeSlot || "Morning"} />
                      <DetailItem label="Readiness Status" value={selectedStudent.readinessStatus || "Not assessed"} />
                      <DetailItem label="Payment Option" value={selectedStudent.paymentOption || "Full Payment"} />
                      <DetailItem label="Payment Bank" value={selectedStudent.paymentBank} />
                      <DetailItem label="FS Number" value={selectedStudent.fsNumber} />
                      <DetailItem label="Class Completed" value={selectedStudent.classCompleted ? "Yes" : "No"} />
                      <DetailItem label="Class Outcome" value={getClassOutcome(selectedStudent)} />
                      {isCoffeeCuppingCourse(selectedStudent) && (
                        <DetailItem label="CoC Payment Status" value={selectedStudent.cocPaymentStatus || "Unpaid"} />
                      )}
                      <DetailItem label="Registration Status" value={selectedStudent.status} />
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {(selectedStudent.passportPhoto || selectedStudent.nationalIdFrontImage || selectedStudent.nationalIdBackImage || selectedStudent.nationalIdImage || selectedStudent.paymentScreenshot) && (
                  <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                    <CardBody>
                      <HStack mb={4} spacing={3}>
                        <Box p={2.5} borderRadius="12px" bg={softPanelBg}>
                          <Icon as={FiCamera} boxSize={4} color="green.600" />
                        </Box>
                        <Box>
                          <Heading size="sm" color={headingColor}>Verification Documents & Photos</Heading>
                          <Text fontSize="sm" color={mutedText}>Passport photo, optional National ID front/back, and payment screenshot.</Text>
                        </Box>
                      </HStack>
                      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
                        {selectedStudent.passportPhoto ? (
                          <Box border="1px solid" borderColor={borderColor} borderRadius="14px" p={3} bg={cardAltBg} textAlign="center">
                            <Text fontSize="xs" fontWeight="700" color={headingColor} mb={2}>3×4 Passport Photo</Text>
                            <Image src={selectedStudent.passportPhoto} alt="Passport Photo" maxH="140px" mx="auto" borderRadius="md" objectFit="cover" />
                          </Box>
                        ) : null}
                        {(selectedStudent.nationalIdFrontImage || selectedStudent.nationalIdImage) ? (
                          <Box border="1px solid" borderColor={borderColor} borderRadius="14px" p={3} bg={cardAltBg} textAlign="center">
                            <Text fontSize="xs" fontWeight="700" color={headingColor} mb={2}>National ID Front</Text>
                            <Image src={selectedStudent.nationalIdFrontImage || selectedStudent.nationalIdImage} alt="National ID Front" maxH="140px" mx="auto" borderRadius="md" objectFit="contain" />
                          </Box>
                        ) : null}
                        {selectedStudent.nationalIdBackImage ? (
                          <Box border="1px solid" borderColor={borderColor} borderRadius="14px" p={3} bg={cardAltBg} textAlign="center">
                            <Text fontSize="xs" fontWeight="700" color={headingColor} mb={2}>National ID Back</Text>
                            <Image src={selectedStudent.nationalIdBackImage} alt="National ID Back" maxH="140px" mx="auto" borderRadius="md" objectFit="contain" />
                          </Box>
                        ) : null}
                        {selectedStudent.paymentScreenshot ? (
                          <Box border="1px solid" borderColor={borderColor} borderRadius="14px" p={3} bg={cardAltBg} textAlign="center">
                            <Text fontSize="xs" fontWeight="700" color={headingColor} mb={2}>Payment Screenshot</Text>
                            <Image src={selectedStudent.paymentScreenshot} alt="Payment Screenshot" maxH="140px" mx="auto" borderRadius="md" objectFit="contain" />
                          </Box>
                        ) : null}
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                )}

                {workspaceLabel === "Sales" && (
                  <Card bg={cardBg} border="1px solid" borderColor="blue.200" borderRadius="18px" shadow="sm">
                    <CardBody>
                      <HStack mb={4} spacing={3}>
                        <Box p={2.5} borderRadius="12px" bg="blue.50">
                          <Icon as={FiPhoneCall} boxSize={4} color="blue.600" />
                        </Box>
                        <Box>
                          <Heading size="sm" color={headingColor}>Sales Customer Follow-up Details</Heading>
                          <Text fontSize="sm" color={mutedText}>CRM lead status, call schedule, and sales conversation logs.</Text>
                        </Box>
                      </HStack>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <DetailItem label="Call Status" value={selectedStudent.salesCallStatus || "Not Called"} />
                        <DetailItem label="Follow-up Status" value={selectedStudent.salesFollowupStatus || "Pending"} />
                        <DetailItem label="Schedule Preference" value={selectedStudent.salesSchedulePreference || "Regular"} />
                        <DetailItem label="Package Scope" value={selectedStudent.salesPackageScope || "Local"} />
                        <DetailItem label="Follow-up Date" value={formatDate(selectedStudent.salesFollowupDate)} />
                        <DetailItem label="Course Linked" value={selectedStudent.program || selectedStudent.learningDepartment || "Not specified"} />
                      </SimpleGrid>
                      {selectedStudent.salesFollowupNote && (
                        <Box mt={4} pt={3} borderTopWidth="1px" borderColor={borderColor}>
                          <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase" mb={1}>
                            Customer Follow-up Note
                          </Text>
                          <Box p={3} bg={salesPanelBg} borderRadius="md" border="1px solid" borderColor="blue.100">
                            <Text fontSize="sm" whiteSpace="pre-wrap">{selectedStudent.salesFollowupNote}</Text>
                          </Box>
                        </Box>
                      )}
                    </CardBody>
                  </Card>
                )}

                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <HStack mb={4} spacing={3}>
                      <Box p={2.5} borderRadius="12px" bg={softPanelBg}>
                        <Icon as={FiCheckCircle} boxSize={4} color="green.600" />
                      </Box>
                      <Box>
                        <Heading size="sm" color={headingColor}>Registration Record</Heading>
                        <Text fontSize="sm" color={mutedText}>CS member and update history.</Text>
                      </Box>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <DetailItem label="Registering CS Member" value={selectedStudent.registeredBy || "Unknown CS member"} />
                      <DetailItem label="Registrar Email" value={selectedStudent.registeredByEmail} />
                      <DetailItem label="Registration Date" value={formatDateTime(selectedStudent.createdAt)} />
                      <DetailItem label="Last Updated By" value={selectedStudent.updatedBy} />
                      <DetailItem label="Last Updated At" value={formatDateTime(selectedStudent.updatedAt)} />
                    </SimpleGrid>
                  </CardBody>
                </Card>
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="18px" shadow="sm">
                  <CardBody>
                    <Text fontSize="xs" fontWeight="800" color="gray.500" textTransform="uppercase" mb={2}>Notes</Text>
                    <Box border="1px solid" borderColor={borderColor} borderRadius="14px" p={4} bg={cardAltBg}>
                      <Text whiteSpace="pre-wrap">{selectedStudent.notes || "No notes recorded."}</Text>
                    </Box>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Modern Student Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={Boolean(studentToDelete)}
        leastDestructiveRef={cancelDeleteRef}
        onClose={() => !isDeletingStudent && setStudentToDelete(null)}
        isCentered
        motionPreset="slideInBottom"
      >
        <AlertDialogOverlay bg="blackAlpha.700" backdropFilter="blur(5px)">
          <AlertDialogContent
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="20px"
            shadow="2xl"
            p={2}
          >
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color={headingColor} pb={2}>
              <HStack spacing={3}>
                <Box p={2.5} borderRadius="12px" bg="red.50" color="red.500">
                  <Icon as={FiTrash2} boxSize={5} />
                </Box>
                <Box>
                  <Text fontSize="md" fontWeight="800">Delete Student Registration</Text>
                  <Text fontSize="xs" fontWeight="normal" color={mutedText}>
                    This action will remove the record from the database.
                  </Text>
                </Box>
              </HStack>
            </AlertDialogHeader>

            <AlertDialogBody py={3}>
              <Text fontSize="sm" color={headingColor}>
                Are you sure you want to delete registration for{" "}
                <Text as="span" fontWeight="800" color="red.500">
                  {studentToDelete?.fullName || "this student"}
                </Text>{" "}
                {studentToDelete?.studentId ? `(${studentToDelete.studentId})` : ""}?
              </Text>
              <Text fontSize="xs" color={mutedText} mt={2}>
                All learning assignments, department associations, and uploaded documents linked to this student record will be permanently deleted.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter pt={3} borderTopWidth="1px" borderColor={borderColor}>
              <Button
                ref={cancelDeleteRef}
                onClick={() => setStudentToDelete(null)}
                isDisabled={isDeletingStudent}
                variant="outline"
                size="sm"
                borderRadius="lg"
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDeleteStudent}
                isLoading={isDeletingStudent}
                loadingText="Deleting..."
                size="sm"
                borderRadius="lg"
                ml={3}
                leftIcon={<FiTrash2 />}
              >
                Delete Student
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* ── A4 SINGLE STUDENT DOSSIER MODAL ── */}
      <Modal isOpen={isA4DossierOpen} onClose={onA4DossierClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <ModalContent bg="#0B0F19" maxW="920px" p={0} borderRadius="2xl" overflow="hidden">
          <ModalBody p={0} bg="#0B0F19">
            {selectedStudent && (
              <TessbinStudentA4Dossier
                student={selectedStudent}
                onClose={onA4DossierClose}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── A4 STUDENT DIRECTORY ROSTER REPORT MODAL ── */}
      <Modal isOpen={isA4ReportOpen} onClose={onA4ReportClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <ModalContent bg="#0B0F19" maxW="960px" p={0} borderRadius="2xl" overflow="hidden">
          <ModalBody p={0} bg="#0B0F19">
            <TessbinStudentListA4Report
              students={filteredStudents}
              departmentFilter={departmentFilter}
              timePeriodLabel={statusFilter === "All" ? "All Registered Records" : `Status: ${statusFilter}`}
              reportTitle="STUDENT REGISTRATION DIRECTORY & ENROLLMENT ROSTER"
              onClose={onA4ReportClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </StudentRegistrationShell>
  );
};

export default StudentRegistrationPage;
