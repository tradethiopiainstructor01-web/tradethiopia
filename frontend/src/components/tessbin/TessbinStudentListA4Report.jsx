import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
  HStack,
  Icon,
  Image,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiPrinter,
  FiMaximize2,
  FiX,
} from 'react-icons/fi';
import './TessbinA4Print.css';
import { printA4Element, openA4InNewWindow } from '../../utils/tessbinPrintHelper';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function TessbinStudentListA4Report({
  students = [],
  timePeriodLabel = 'All Time',
  departmentFilter = 'All Departments',
  reportTitle = 'STUDENT REGISTRATION DIRECTORY & ENROLLMENT REPORT',
  onClose,
}) {
  const docId = 'tessbin-student-list-a4-document';
  const docTitle = `Tessbin_Student_Directory_${(timePeriodLabel || 'Report').replace(/\s+/g, '_')}`;

  const printReport = () => {
    printA4Element(docId, docTitle);
  };

  const previewInNewTab = () => {
    openA4InNewWindow(docId, docTitle);
  };

  const totalStudents = students.length;
  const tuitionPaidCount = students.filter(
    (s) => (s.paymentStatus || '').toLowerCase() === 'paid'
  ).length;
  const cocPaidCount = students.filter(
    (s) => (s.cocPaymentStatus || '').toLowerCase() === 'paid'
  ).length;
  const completedCount = students.filter(
    (s) =>
      (s.classCompletionStatus || '').toLowerCase() === 'completed' || s.classCompleted
  ).length;

  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Box w="full">
      {/* Top Action Bar (Screen Only) */}
      <Flex
        className="no-print"
        bg="#0F172A"
        color="white"
        p={3}
        px={5}
        borderRadius="xl"
        mb={3}
        justify="space-between"
        align="center"
        boxShadow="0 4px 14px rgba(0, 0, 0, 0.3)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        wrap="wrap"
        gap={3}
      >
        <HStack spacing={3}>
          <Flex
            w="36px"
            h="36px"
            borderRadius="lg"
            bg="#4F46E5"
            align="center"
            justify="center"
          >
            <Icon as={FiPrinter} boxSize="18px" color="white" />
          </Flex>
          <Box>
            <HStack spacing={2}>
              <Text fontSize="14px" fontWeight="800" color="white">
                Student Registration Directory Report
              </Text>
              <Badge bg="#312E81" color="#C7D2FE" fontSize="10px" px={2} py={0.5} borderRadius="md" fontWeight="800">
                A4 FORMAT
              </Badge>
            </HStack>
            <Text fontSize="11px" color="gray.400">
              Showing {totalStudents} filtered student registration records
            </Text>
          </Box>
        </HStack>

        <HStack spacing={2.5}>
          <Button
            leftIcon={<FiPrinter />}
            bgGradient="linear(to-r, #4F46E5, #6366F1)"
            color="white"
            _hover={{ bgGradient: 'linear(to-r, #4338CA, #4F46E5)' }}
            size="sm"
            borderRadius="lg"
            fontSize="12px"
            fontWeight="800"
            onClick={printReport}
          >
            Print / Save PDF (A4)
          </Button>

          <Button
            leftIcon={<FiMaximize2 />}
            variant="outline"
            borderColor="rgba(255, 255, 255, 0.25)"
            color="white"
            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            size="sm"
            borderRadius="lg"
            fontSize="12px"
            onClick={previewInNewTab}
          >
            Open in New Window / PDF
          </Button>

          {onClose && (
            <Button
              leftIcon={<FiX />}
              variant="ghost"
              color="gray.300"
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
              size="sm"
              borderRadius="lg"
              fontSize="12px"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Screen Wrapper */}
      <Box className="tessbin-a4-screen-wrapper">
        <Box id={docId} className="tessbin-a4-sheet" style={{ height: 'auto', minHeight: '290mm' }}>
          <Box className="tessbin-a4-content">
            {/* Header Letterhead */}
            <Flex justify="space-between" align="center" className="tessbin-a4-header" pb={2} mb={2}>
              <HStack spacing={3} align="center">
                <Box
                  w="46px"
                  h="46px"
                  borderRadius="md"
                  overflow="hidden"
                  bg="white"
                  p="1px"
                  border="1.5px solid #0F172A"
                  flexShrink={0}
                >
                  <Image
                    src="/tessbin-dashboard-logo.png"
                    alt="Tessbin Logo"
                    w="full"
                    h="full"
                    objectFit="contain"
                    fallbackSrc="/company-logos/tesbinn.png"
                  />
                </Box>
                <Box>
                  <Text fontSize="13pt" fontWeight="900" color="#0F172A" fontFamily="Georgia, 'Times New Roman', serif" lineHeight="1.05">
                    TESBINN
                  </Text>
                  <Text fontSize="7.5pt" fontWeight="800" color="#1E293B" textTransform="uppercase">
                    TRADE ETHIOPIA SCHOOL OF BUSINESS & INNOVATION
                  </Text>
                  <Text fontSize="7.2pt" fontWeight="700" color="#B45309">
                    ትሬድ ኢትዮጵያ የቢዝነስ እና ፈጠራ ት/ቤት
                  </Text>
                  <Text fontSize="5.8pt" color="#64748B">
                    Addis Ababa, Ethiopia • admissions@tessbin.com • www.tessbin.com
                  </Text>
                </Box>
              </HStack>

              <Box textAlign="right">
                <Badge bg="#1E1B4B" color="white" fontSize="7pt" px={2} py={0.5} borderRadius="md" fontWeight="800">
                  OFFICIAL ENROLLMENT ROSTER
                </Badge>
                <Text fontSize="6.5pt" color="#64748B" mt={1}>
                  Generated: {generatedDate}
                </Text>
                <Text fontSize="6.5pt" fontWeight="700" color="#334155">
                  Filters: {timePeriodLabel} • {departmentFilter}
                </Text>
              </Box>
            </Flex>

            {/* Title Bar */}
            <Box className="tessbin-a4-title-bar" fontSize="8.5pt" py={1} mb={2}>
              {reportTitle}
            </Box>

            {/* Summary Statistics Cards */}
            <SimpleGrid columns={4} spacing={2} mb={2.5}>
              <Box p={1.5} bg="#F8FAFC" border="1px solid #CBD5E1" borderRadius="md" textAlign="center">
                <Text fontSize="6pt" fontWeight="700" color="#64748B" textTransform="uppercase">
                  Total Registrations
                </Text>
                <Text fontSize="11.5pt" fontWeight="900" color="#4F46E5" lineHeight="1.1">
                  {totalStudents}
                </Text>
              </Box>

              <Box p={1.5} bg="#F0FDF4" border="1px solid #86EFAC" borderRadius="md" textAlign="center">
                <Text fontSize="6pt" fontWeight="700" color="#166534" textTransform="uppercase">
                  Tuition Paid
                </Text>
                <Text fontSize="11.5pt" fontWeight="900" color="#16A34A" lineHeight="1.1">
                  {tuitionPaidCount}
                </Text>
              </Box>

              <Box p={1.5} bg="#EEF2FF" border="1px solid #A5B4FC" borderRadius="md" textAlign="center">
                <Text fontSize="6pt" fontWeight="700" color="#4338CA" textTransform="uppercase">
                  COC Fee Paid
                </Text>
                <Text fontSize="11.5pt" fontWeight="900" color="#4F46E5" lineHeight="1.1">
                  {cocPaidCount}
                </Text>
              </Box>

              <Box p={1.5} bg="#EFF6FF" border="1px solid #93C5FD" borderRadius="md" textAlign="center">
                <Text fontSize="6pt" fontWeight="700" color="#1E40AF" textTransform="uppercase">
                  Class Completed
                </Text>
                <Text fontSize="11.5pt" fontWeight="900" color="#2563EB" lineHeight="1.1">
                  {completedCount}
                </Text>
              </Box>
            </SimpleGrid>

            {/* Student Directory Table */}
            <table className="tessbin-a4-table" style={{ fontSize: '6.5pt' }}>
              <thead>
                <tr>
                  <th style={{ width: '4%', textAlign: 'center' }}>#</th>
                  <th style={{ width: '14%' }}>Student ID</th>
                  <th style={{ width: '22%' }}>Full Name</th>
                  <th style={{ width: '18%' }}>Department</th>
                  <th style={{ width: '10%' }}>Shift</th>
                  <th style={{ width: '12%' }}>Phone</th>
                  <th style={{ width: '10%' }}>Tuition</th>
                  <th style={{ width: '10%' }}>COC Fee</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '14px', color: '#64748B' }}>
                      No student registration records match the current filter selection.
                    </td>
                  </tr>
                ) : (
                  students.map((student, idx) => {
                    const isPaid = (student.paymentStatus || '').toLowerCase() === 'paid';
                    const isCoc = (student.cocPaymentStatus || '').toLowerCase() === 'paid';

                    return (
                      <tr key={student._id || student.id || idx} style={{ backgroundColor: idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF' }}>
                        <td style={{ textAlign: 'center', fontWeight: '700' }}>{idx + 1}</td>
                        <td style={{ fontWeight: '800', color: '#312E81' }}>{student.studentId || 'N/A'}</td>
                        <td style={{ fontWeight: '700', color: '#0F172A' }}>{student.fullName}</td>
                        <td>{student.learningDepartment || 'General'}</td>
                        <td>{student.preferredTimeSlot || 'Morning'}</td>
                        <td>{student.phone || 'N/A'}</td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              fontSize: '6pt',
                              fontWeight: '700',
                              backgroundColor: isPaid ? '#DCFCE7' : '#FEF2F2',
                              color: isPaid ? '#15803D' : '#DC2626',
                            }}
                          >
                            {student.paymentStatus || 'Waiting'}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              fontSize: '6pt',
                              fontWeight: '700',
                              backgroundColor: isCoc ? '#E0E7FF' : '#F1F5F9',
                              color: isCoc ? '#4338CA' : '#64748B',
                            }}
                          >
                            {isCoc ? 'COC Paid' : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Sign-off Grid */}
            <Box mt={3} pt={2} borderTop="1.5px solid #1E293B">
              <SimpleGrid columns={3} spacing={3} align="center">
                <Box textAlign="center" pt={2}>
                  <Box borderBottom="1px solid #475569" w="85%" mx="auto" mb={1} />
                  <Text fontSize="6.5pt" fontWeight="800" color="#1E293B">Prepared By: Customer Success</Text>
                  <Text fontSize="5.5pt" color="#64748B">Date: {generatedDate.split(',')[0]}</Text>
                </Box>

                <Box textAlign="center" pt={2}>
                  <Box borderBottom="1px solid #475569" w="85%" mx="auto" mb={1} />
                  <Text fontSize="6.5pt" fontWeight="800" color="#1E293B">Academic Director Verification</Text>
                  <Text fontSize="5.5pt" color="#64748B">Signature & Approval</Text>
                </Box>

                <Box textAlign="center" pt={1}>
                  <Text fontSize="6pt" fontWeight="800" color="#1E40AF">
                    TESBINN ACADEMY
                  </Text>
                  <Text fontSize="5.5pt" fontWeight="700" color="#475569">
                    ★ OFFICIAL ROSTER CERTIFIED ★
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>

            {/* Document Footer */}
            <Box className="tessbin-a4-hardcopy-footer" mt={2}>
              <Text>Tessbin Academy Student Register Directory • Standard A4 Portrait Report</Text>
              <Text>Total Enrolled Listed: <b>{totalStudents}</b></Text>
              <Text>Page 1 of 1</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
