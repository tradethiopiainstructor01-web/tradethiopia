import { useEffect, useState } from "react";
import { Avatar, Badge, Box, Button, Drawer, DrawerBody, DrawerContent, DrawerHeader, DrawerOverlay, Flex, Heading, HStack, Icon, Image, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, SimpleGrid, Text, VStack, useColorModeValue } from "@chakra-ui/react";
import { FiArrowLeft, FiBookOpen, FiCalendar, FiCamera, FiCheckCircle, FiClock, FiCreditCard, FiEdit2, FiEye, FiFileText, FiInfo, FiMail, FiMapPin, FiMoon, FiPhone, FiPrinter, FiUser, FiUsers } from "react-icons/fi";

const dateLabel = (value) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not provided" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const Info = ({ icon = FiFileText, label, value }) => (
  <HStack align="start" spacing={4}>
    <Icon as={icon} boxSize={5} color="blue.400" mt={1} />
    <Box minW={0}><Text fontSize="sm" fontWeight="700" color="blue.500">{label}</Text><Text mt={1} color={value === undefined || value === null || value === "" ? "gray.500" : undefined} overflowWrap="anywhere">{value === undefined || value === null || value === "" ? "Not provided" : value}</Text></Box>
  </HStack>
);

const Section = ({ title, subtitle, icon, action, children }) => {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("blue.100", "gray.700");
  return <Box bg={bg} border="1px solid" borderColor={border} borderRadius="18px" p={{ base: 4, md: 6 }}>
    <Flex gap={3} justify="space-between" align="center" mb={6} wrap="wrap"><HStack spacing={4}><Box bg="blue.50" color="blue.600" p={3} borderRadius="14px"><Icon as={icon} boxSize={5} /></Box><Box><Heading size="md">{title}</Heading>{subtitle && <Text mt={1} fontSize="sm" color="gray.500">{subtitle}</Text>}</Box></HStack>{action}</Flex>
    {children}
  </Box>;
};

const StudentDetailView = ({ student, isOpen, onClose, onEdit, onPrint }) => {
  const [preview, setPreview] = useState(null);
  useEffect(() => { setPreview(null); }, [student?.id, isOpen]);
  const bg = useColorModeValue("#f3f7ff", "gray.900");
  const card = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("blue.100", "gray.700");
  const ink = useColorModeValue("#101a45", "gray.100");
  if (!student) return null;
  const s = student;
  const classStatus = s.classCompletionStatus || (s.classCompleted ? "Completed" : "Not Completed");
  const joined = s.enrollmentDate || s.createdAt;
  const files = [
    ["Photo", FiCamera, "purple", s.passportPhoto],
    ["ID-F", FiCreditCard, "blue", s.nationalIdFrontImage || s.nationalIdImage],
    ["ID-B", FiCreditCard, "blue", s.nationalIdBackImage],
    ["Slip", FiFileText, "green", s.paymentScreenshot],
  ];
  const edit = () => { onClose(); onEdit(s); };
  return <>
    <Drawer isOpen={isOpen} onClose={onClose} size="xl" placement="right">
      <DrawerOverlay />
      <DrawerContent bg={bg} color={ink} maxW="940px">
        <DrawerHeader px={{ base: 4, md: 6 }} py={3}>
          <Flex justify="space-between" gap={3} wrap="wrap"><Button variant="ghost" size="sm" leftIcon={<FiArrowLeft />} onClick={onClose}>Back to Students</Button><HStack><Button size="sm" variant="outline" bg={card} colorScheme="blue" leftIcon={<FiEdit2 />} onClick={edit}>Edit Student</Button>{onPrint && <Button size="sm" variant="outline" colorScheme="blue" leftIcon={<FiPrinter />} onClick={onPrint}>Print</Button>}</HStack></Flex>
        </DrawerHeader>
        <DrawerBody px={{ base: 4, md: 6 }} pb={6}>
          <VStack align="stretch" spacing={5}>
            <Box bg={card} border="1px solid" borderColor={border} borderRadius="18px" overflow="hidden">
              <Flex p={6} justify="space-between" align="center" gap={5} wrap="wrap">
                <HStack spacing={4}><Avatar name={s.fullName} src={s.passportPhoto || undefined} size="lg" bg="purple.100" color="purple.700" /><Box><HStack wrap="wrap"><Heading size="lg">{s.fullName}</Heading><Badge px={3} py={1} borderRadius="full" colorScheme={s.status === "Active" ? "green" : "gray"} textTransform="none">{s.status || "Not provided"}</Badge></HStack><HStack mt={2} wrap="wrap"><Badge colorScheme="purple" borderRadius="md" px={2}>{s.studentId}</Badge><Icon as={FiPhone} color="blue.400" /><Text fontSize="sm">{s.phone || "Not provided"}</Text></HStack></Box></HStack>
                <VStack align="start" spacing={3}><Info icon={FiCalendar} label="Joined" value={dateLabel(joined)} /><Info icon={FiBookOpen} label="Class" value={s.program || s.learningDepartment} /></VStack>
              </Flex>
              <SimpleGrid columns={{ base: 2, md: 5 }} gap={3} p={5} borderTop="1px solid" borderColor={border}>
                {[[FiBookOpen, s.learningDepartment, "Department", "green"], [FiMoon, s.preferredTimeSlot, "Shift", "blue"], [FiClock, classStatus, "Class Status", classStatus === "Completed" ? "green" : "orange"], [FiCheckCircle, s.paymentStatus || "Waiting", "Payment", s.paymentStatus === "Paid" ? "purple" : "orange"], [FiCreditCard, s.paymentOption || "Full Payment", "Payment Type", "green"]].map(([icon, value, label, color]) => <Box key={label}><HStack bg={`${color}.50`} color={`${color}.700`} borderRadius="12px" px={3} py={3}><Icon as={icon} flexShrink={0} /><Text fontSize="sm" fontWeight="700">{value || "Not provided"}</Text></HStack><Text mt={1} fontSize="xs" color="gray.500">{label}</Text></Box>)}
              </SimpleGrid>
            </Box>
            <Section title="Personal Information" subtitle="Basic details and contact information of the student" icon={FiUser} action={<Button size="sm" variant="outline" colorScheme="blue" leftIcon={<FiEdit2 />} onClick={edit}>Update Information</Button>}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Info icon={FiUser} label="Full Name" value={s.fullName} /><Info icon={FiUsers} label="Department" value={s.learningDepartment} />
                <Info icon={FiCreditCard} label="Student ID" value={s.studentId} /><Info icon={FiBookOpen} label="Class" value={s.program} />
                <Info icon={FiPhone} label="Phone Number" value={s.phone} /><Info icon={FiMoon} label="Shift" value={s.preferredTimeSlot} />
                <Info icon={FiMail} label="Email" value={s.email} /><Info icon={FiCalendar} label="Registration Date" value={dateLabel(joined)} />
                <Info icon={FiCalendar} label="Date of Birth" value={s.dateOfBirth ? dateLabel(s.dateOfBirth) : undefined} /><Info icon={FiUser} label="Source" value={s.source} />
                <Info icon={FiMapPin} label="Address" value={s.address} /><Info label="Notes" value={s.notes} />
              </SimpleGrid>
            </Section>
            <Section title="Verification Files" subtitle="Uploaded documents for student verification" icon={FiFileText}>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>{files.map(([label, icon, color, src]) => <VStack key={label} p={4} border="1px solid" borderColor={border} borderRadius="16px" spacing={3}><Box p={3} bg={`${color}.50`} color={`${color}.600`} borderRadius="14px"><Icon as={icon} boxSize={7} /></Box><HStack><Text fontWeight="700">{label}</Text>{src && <Icon as={FiCheckCircle} color="green.600" />}</HStack><Button size="sm" width="full" colorScheme="blue" variant="outline" leftIcon={<FiEye />} isDisabled={!src} onClick={() => setPreview({ label, src })}>{src ? "View" : "Not attached"}</Button></VStack>)}</SimpleGrid>
            </Section>
            <Section title="Payment Information" subtitle="Payment details and bank information" icon={FiCreditCard}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}><Info icon={FiCheckCircle} label="Payment Status" value={s.paymentStatus} /><Info icon={FiCreditCard} label="Payment Type" value={s.paymentOption} /><Info icon={FiCreditCard} label="Bank Name" value={s.paymentBank} /><Info label="Amount" value={s.paymentAmount} /><Info icon={FiCalendar} label="Payment Date" value={s.paymentDate ? dateLabel(s.paymentDate) : undefined} /><Info label="Transaction Reference / FS Number" value={s.fsNumber} /></SimpleGrid>
            </Section>
            <Section title="Additional Information" subtitle="Follow-up and registration details" icon={FiInfo}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={5}>{[["Agent", s.registeredBy], ["Registrar Email", s.registeredByEmail], ["Follow-up Status", s.salesFollowupStatus], ["Follow-up Date", dateLabel(s.salesFollowupDate)], ["Call Status", s.salesCallStatus], ["Schedule Preference", s.salesSchedulePreference], ["Package Scope", s.salesPackageScope], ["Readiness", s.readinessStatus], ["Training End Date", dateLabel(s.trainingEndDate)], ["Exam Date", dateLabel(s.examDate)], ["CoC Payment", s.cocPaymentStatus], ["Last Updated By", s.updatedBy], ["Last Updated", dateLabel(s.updatedAt)]].map(([label, value]) => <Info key={label} label={label} value={value} />)}</SimpleGrid>
              <Box border="1px solid" borderColor={border} borderRadius="14px" p={4}><Text fontWeight="700" mb={2}>Notes</Text><Text whiteSpace="pre-wrap">{s.notes || "No additional notes available."}</Text>{s.salesFollowupNote && <Box mt={4}><Text fontWeight="700">Sales Follow-up Note</Text><Text mt={2} whiteSpace="pre-wrap">{s.salesFollowupNote}</Text></Box>}</Box>
            </Section>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
    <Modal isOpen={Boolean(preview) && isOpen} onClose={() => setPreview(null)} size="4xl" isCentered><ModalOverlay /><ModalContent><ModalHeader>{preview?.label}</ModalHeader><ModalCloseButton /><ModalBody pb={6}><Image src={preview?.src} alt={preview?.label || "Student document"} maxH="75vh" mx="auto" objectFit="contain" /></ModalBody></ModalContent></Modal>
  </>;
};

export default StudentDetailView;
