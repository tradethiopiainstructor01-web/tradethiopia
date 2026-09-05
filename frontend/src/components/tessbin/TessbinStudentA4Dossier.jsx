import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Badge,
  Button,
  Image,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiPrinter,
  FiFileText,
  FiCamera,
  FiCheckCircle,
  FiExternalLink,
  FiMaximize2,
  FiX,
} from 'react-icons/fi';
import './TessbinA4Print.css';
import { printA4Element, openA4InNewWindow } from '../../utils/tessbinPrintHelper';
import QRCodeGenerator from '../common/QRCodeGenerator';

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

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TessbinStudentA4Dossier({ student, onClose, onOpenImage }) {
  if (!student) return null;

  const docId = `tessbin-student-a4-document-${student._id || student.id || student.studentId || 'preview'}`;
  const docTitle = `Tessbin_Registration_${(student.fullName || 'Student').replace(/\s+/g, '_')}`;

  const printDocument = () => {
    printA4Element(docId, docTitle);
  };

  const previewInNewTab = () => {
    openA4InNewWindow(docId, docTitle);
  };

  const acceptedCoffeeCuppingCourses = [
    'coffeecupping',
    'coffeeindustrycuppingandqualityassessment',
  ];
  const isCoffeeCupping = [student.learningDepartment, student.program].some((value) =>
    acceptedCoffeeCuppingCourses.includes(
      (value || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    )
  );
  const isCocPaid = isCoffeeCupping && (student.cocPaymentStatus || '').toLowerCase() === 'paid';
  const nationalIdFront = student.nationalIdFrontImage || student.nationalIdImage || '';
  const nationalIdBack = student.nationalIdBackImage || '';
  const isCompleted =
    (student.classCompletionStatus || '').toLowerCase() === 'completed' || Boolean(student.classCompleted);

  const issueDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/student/${student._id || student.id || student.studentId || 'REC'}`
    : `/verify/student/${student._id || student.id || student.studentId || 'REC'}`;

  return (
    <Box w="full">
      {/* Top Action Bar (Screen View Only) */}
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
                Official Trainee Registration Dossier
              </Text>
              <Badge bg="#312E81" color="#C7D2FE" fontSize="10px" px={2} py={0.5} borderRadius="md" fontWeight="800">
                A4 SINGLE PAGE
              </Badge>
            </HStack>
            <Text fontSize="11px" color="gray.400">
              {student.fullName} • ID: {student.studentId || 'N/A'} • {student.learningDepartment || 'General'}
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
            onClick={printDocument}
          >
            Print Dossier (A4)
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

      {/* Screen Wrapper Displaying Authentic A4 Paper Sheet */}
      <Box className="tessbin-a4-screen-wrapper">
        <Box id={docId} className="tessbin-a4-sheet">
          {/* Formal Hardcopy Perimeter Frame */}
          <Box className="tessbin-a4-frame">
            {/* Background Seal Watermark */}
            <Box
              className="tessbin-a4-watermark"
              backgroundImage="url('/tessbin-dashboard-logo.png'), url('/company-logos/tesbinn.png')"
            />

            <Box className="tessbin-a4-content">
              {/* ============================================================= */}
              {/* 1. ACADEMY LETTERHEAD & 3x4 PASSPORT PHOTO                    */}
              {/* ============================================================= */}
              <Flex className="tessbin-a4-header" justify="space-between" align="center">
                {/* Logo & Bilingual Institution Titles */}
                <HStack spacing={2.5} align="center">
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
                    <Text
                      fontSize="13pt"
                      fontWeight="900"
                      letterSpacing="0.6px"
                      color="#0F172A"
                      lineHeight="1.05"
                      fontFamily="Georgia, 'Times New Roman', serif"
                    >
                      TESBINN
                    </Text>
                    <Text
                      fontSize="7.5pt"
                      fontWeight="800"
                      color="#1E293B"
                      letterSpacing="0.2px"
                      textTransform="uppercase"
                      lineHeight="1.15"
                    >
                      TRADE ETHIOPIA SCHOOL OF BUSINESS & INNOVATION
                    </Text>
                    <Text
                      fontSize="7.2pt"
                      fontWeight="700"
                      color="#B45309"
                      letterSpacing="0.1px"
                      lineHeight="1.15"
                    >
                      ትሬድ ኢትዮጵያ የቢዝነስ እና ፈጠራ ት/ቤት
                    </Text>
                    <Text fontSize="5.8pt" color="#64748B">
                      Addis Ababa, Ethiopia • Tel: +251 911 000 000 • Email: admissions@tessbin.com • Web: www.tessbin.com
                    </Text>
                  </Box>
                </HStack>

                {/* Right: Prominent Student ID & Passport Photo */}
                <HStack spacing={2} align="center">
                  <Box className="tessbin-a4-meta-box" minW="44mm">
                    <Flex justify="space-between" borderBottom="1px solid #CBD5E1" pb={0.5} mb={0.5}>
                      <Text fontSize="5.2pt" color="#64748B">FORM NO: <b>TSB/REG/01</b></Text>
                      <Text fontSize="5.2pt" color="#64748B">Year: <b>2026/18 E.C.</b></Text>
                    </Flex>
                    <Box bg="#EEF2FF" border="1.2px solid #4F46E5" borderRadius="3px" p="1.5px 4px" textAlign="center" my={0.5}>
                      <Text fontSize="4.8pt" fontWeight="800" color="#4338CA" letterSpacing="0.4px">
                        STUDENT ID / የተማሪ መለያ ቁጥር
                      </Text>
                      <Text fontSize="9.5pt" fontWeight="900" color="#1E1B4B" letterSpacing="0.8px" lineHeight="1.1">
                        {student.studentId || 'TSB-PENDING'}
                      </Text>
                    </Box>
                    <Text fontSize="5.4pt" color="#475569" textAlign="center">
                      Date Issued / ቀን: <b>{issueDate}</b>
                    </Text>
                  </Box>

                  {/* 3×4 Passport Photo Frame */}
                  <Box className="tessbin-a4-photo-frame">
                    {student.passportPhoto ? (
                      <>
                        <Image
                          src={student.passportPhoto}
                          alt="Student Photo"
                          className="tessbin-a4-photo-img"
                        />
                        <Box className="tessbin-a4-photo-stamp">
                          VERIFIED PHOTO
                        </Box>
                      </>
                    ) : (
                      <Flex direction="column" align="center" justify="center" p={1} color="#64748B" textAlign="center">
                        <Icon as={FiCamera} boxSize="14px" mb={0.5} opacity={0.6} />
                        <Text fontSize="5pt" fontWeight="800">AFFIX 3×4</Text>
                        <Text fontSize="4.5pt">PHOTO HERE</Text>
                      </Flex>
                    )}
                  </Box>
                </HStack>
              </Flex>

              {/* Document Title Banner */}
              <Box className="tessbin-a4-title-bar">
                <Text className="tessbin-a4-title-text-en">
                  OFFICIAL TRAINEE REGISTRATION & ADMISSION DOSSIER
                </Text>
                <Text className="tessbin-a4-title-text-am">
                  የሰልጣኞች መመዝገቢያ እና የህይወት ታሪክ ቅጽ
                </Text>
              </Box>

              {/* ============================================================= */}
              {/* 2. SECTION I: TRAINEE PERSONAL PARTICULARS                   */}
              {/* ============================================================= */}
              <Box className="tessbin-a4-section">
                <Box className="tessbin-a4-section-title">
                  <Text>SECTION I: TRAINEE PERSONAL PARTICULARS / የአመልካች የግል መረጃ</Text>
                  <Text fontSize="5.5pt" color="#CBD5E1">CONFIDENTIAL ARCHIVE</Text>
                </Box>
                <table className="tessbin-a4-table">
                  <tbody>
                    <tr>
                      <td className="label-cell">Full Legal Name / ሙሉ ስም:</td>
                      <td className="value-cell" style={{ width: '38%' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: '900', color: '#0F172A' }}>
                          {student.fullName || 'N/A'}
                        </span>
                      </td>
                      <td className="label-cell">Gender / ጾታ:</td>
                      <td className="value-cell">{student.gender || 'Not Specified'}</td>
                    </tr>
                    <tr>
                      <td className="label-cell">Primary Mobile / ዋና ስልክ:</td>
                      <td className="value-cell">
                        <span style={{ fontSize: '7.5pt', fontWeight: '800', color: '#0F172A' }}>
                          {student.phone || 'N/A'}
                        </span>
                      </td>
                      <td className="label-cell">Emergency Contact / ተለዋጭ:</td>
                      <td className="value-cell">{student.emergencyContact || student.phone || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="label-cell">Email Address / ኢሜይል:</td>
                      <td className="value-cell">{student.email || 'N/A'}</td>
                      <td className="label-cell">Residence / አድራሻ:</td>
                      <td className="value-cell">{student.city || 'Addis Ababa, Ethiopia'}</td>
                    </tr>
                    <tr>
                      <td className="label-cell">Registration Date / ቀን:</td>
                      <td className="value-cell">{formatDateTime(student.createdAt)}</td>
                      <td className="label-cell">Account Status / ሁኔታ:</td>
                      <td className="value-cell">
                        <b>{student.status || 'Active Admitted Trainee'}</b>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Box>

              {/* ============================================================= */}
              {/* 3. SECTION II: ENROLLMENT & ACADEMIC STREAM                   */}
              {/* ============================================================= */}
              <Box className="tessbin-a4-section">
                <Box className="tessbin-a4-section-title">
                  <Text>SECTION II: ENROLLMENT & ACADEMIC STREAM / የትምህርት መርሃ-ግብር እና ፈረቃ</Text>
                  <Text fontSize="5.5pt" color="#CBD5E1">CURRICULUM RECORD</Text>
                </Box>
                <table className="tessbin-a4-table">
                  <tbody>
                    <tr>
                      <td className="label-cell">Training Department / ዘርፍ:</td>
                      <td className="value-cell" style={{ width: '38%' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: '900', color: '#1E1B4B' }}>
                          {student.learningDepartment || 'General International Trade'}
                        </span>
                      </td>
                      <td className="label-cell">Assigned Shift / ፈረቃ:</td>
                      <td className="value-cell">
                        <span style={{ fontSize: '7.5pt', fontWeight: '900', color: '#0F172A' }}>
                          {student.preferredTimeSlot || 'Morning Class'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell">Program Level / አይነት:</td>
                      <td className="value-cell">{student.program || 'Professional Certificate Program'}</td>
                      <td className="label-cell">Training Modality:</td>
                      <td className="value-cell">Regular Practical & Theory</td>
                    </tr>
                    <tr>
                      <td className="label-cell">Enrollment Date / ቀን:</td>
                      <td className="value-cell">{formatDate(student.enrollmentDate) || 'N/A'}</td>
                      <td className="label-cell">Training End Date / ማብቂያ:</td>
                      <td className="value-cell">{formatDate(student.trainingEndDate || student.endDate) || 'In Progress'}</td>
                    </tr>
                    <tr>
                      <td className="label-cell">Curriculum Completion:</td>
                      <td className="value-cell">
                        <b>{isCompleted ? 'COMPLETED / አጠናቋል' : 'IN TRAINING / በሂደት ላይ'}</b>
                      </td>
                      <td className="label-cell">National COC Exam:</td>
                      <td className="value-cell">
                        <b>{isCoffeeCupping ? (isCocPaid ? 'QUALIFIED & COC PAID' : 'PENDING EVALUATION') : 'NOT APPLICABLE'}</b>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Box>

              {/* ============================================================= */}
              {/* 4. SECTION III: PAYMENT & FINANCIAL CLEARANCE                */}
              {/* ============================================================= */}
              <Box className="tessbin-a4-section">
                <Box className="tessbin-a4-section-title">
                  <Text>SECTION III: PAYMENT & FINANCIAL AUDIT / የክፍያ እና የሂሳብ ማረጋገጫ</Text>
                  <Text fontSize="5.5pt" color="#CBD5E1">TREASURY AUDITED</Text>
                </Box>
                <table className="tessbin-a4-table">
                  <tbody>
                    <tr>
                      <td className="label-cell">Payment Plan / አማራጭ:</td>
                      <td className="value-cell" style={{ width: '38%' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: '900', color: '#1E1B4B' }}>
                          {student.paymentOption || 'Full Payment'}
                        </span>
                      </td>
                      <td className="label-cell">Bank / የከፈሉበት ባንክ:</td>
                      <td className="value-cell">
                        <span style={{ fontSize: '7.5pt', fontWeight: '800', color: '#0F172A' }}>
                          {student.paymentBank || 'Commercial Bank of Ethiopia'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell">FS / Receipt Ref # / ደረሰኝ:</td>
                      <td className="value-cell">
                        <span style={{ fontSize: '8pt', fontWeight: '900', color: '#4338CA', fontFamily: 'monospace' }}>
                          {student.fsNumber || 'Verified Official Receipt'}
                        </span>
                      </td>
                      <td className="label-cell">COC Examination Fee:</td>
                      <td className="value-cell">
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '3px',
                          fontSize: '7pt',
                          fontWeight: '800',
                          backgroundColor: isCocPaid ? '#DCFCE7' : '#F1F5F9',
                          color: isCocPaid ? '#166534' : '#475569',
                          border: `1px solid ${isCocPaid ? '#86EFAC' : '#CBD5E1'}`,
                          display: 'inline-block'
                        }}>
                          {isCoffeeCupping
                            ? (isCocPaid ? 'COC PAID / ተከፍሏል' : 'UNPAID / አልተከፈለም')
                            : 'NOT APPLICABLE'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="label-cell">Admitting Officer / መዝጋቢ:</td>
                      <td className="value-cell" colSpan={3}>
                        {student.registeredBy || 'Customer Success Representative'} • {student.registeredByEmail || 'admissions@tessbin.com'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Box>

              {/* ============================================================= */}
              {/* 5. SECTION IV: SUBMITTED CREDENTIALS & PAYMENT RECEIPTS       */}
              {/* ============================================================= */}
              <Box className="tessbin-a4-section">
                <Box className="tessbin-a4-section-title">
                  <Text>SECTION IV: SUBMITTED CREDENTIALS & PAYMENT RECEIPTS / የቀረቡ ማስረጃዎች እና የባንክ ደረሰኝ</Text>
                  <Text fontSize="5.5pt" color="#CBD5E1">OFFICIAL VERIFICATION PROOFS</Text>
                </Box>

                <SimpleGrid columns={3} spacing={1.5} p={1} border="1px solid #1E293B" borderTop="none" bg="#FFFFFF">
                  {/* 1. National ID Front */}
                  <Box border="1px solid #CBD5E1" borderRadius="md" p={1} bg="#F8FAFC">
                    <Flex justify="space-between" align="center" mb={0.5}>
                      <HStack spacing={1}>
                        <Icon as={FiCheckCircle} color={nationalIdFront ? '#16A34A' : '#94A3B8'} boxSize="10px" />
                        <Text fontSize="6.5pt" fontWeight="800" color="#0F172A">
                          National ID Front
                        </Text>
                      </HStack>
                      <Badge fontSize="5pt" colorScheme={nationalIdFront ? 'green' : 'gray'} px={1}>
                        {nationalIdFront ? 'ATTACHED' : 'NOT SUBMITTED'}
                      </Badge>
                    </Flex>

                    {nationalIdFront ? (
                      <Box
                        h="60px"
                        w="100%"
                        border="1px solid #94A3B8"
                        borderRadius="sm"
                        overflow="hidden"
                        bg="#FFFFFF"
                        position="relative"
                        cursor={onOpenImage ? 'pointer' : 'default'}
                        onClick={() => onOpenImage && onOpenImage(nationalIdFront, 'National ID Front', student.fullName)}
                      >
                        <Image
                          src={nationalIdFront}
                          alt="National ID Front"
                          w="100%"
                          h="100%"
                          objectFit="contain"
                        />
                      </Box>
                    ) : (
                      <Flex h="60px" w="100%" border="1px dashed #CBD5E1" borderRadius="sm" align="center" justify="center" direction="column" color="#94A3B8" bg="#FFFFFF">
                        <Icon as={FiFileText} boxSize="14px" mb={0.5} opacity={0.5} />
                        <Text fontSize="5.5pt" fontWeight="700">No ID Front Uploaded</Text>
                      </Flex>
                    )}
                  </Box>

                  {/* 2. National ID Back */}
                  <Box border="1px solid #CBD5E1" borderRadius="md" p={1} bg="#F8FAFC">
                    <Flex justify="space-between" align="center" mb={0.5}>
                      <HStack spacing={1}>
                        <Icon as={FiCheckCircle} color={nationalIdBack ? '#16A34A' : '#94A3B8'} boxSize="10px" />
                        <Text fontSize="6.5pt" fontWeight="800" color="#0F172A">National ID Back</Text>
                      </HStack>
                      <Badge fontSize="5pt" colorScheme={nationalIdBack ? 'green' : 'gray'} px={1}>
                        {nationalIdBack ? 'ATTACHED' : 'NOT SUBMITTED'}
                      </Badge>
                    </Flex>
                    {nationalIdBack ? (
                      <Box
                        h="60px"
                        w="100%"
                        border="1px solid #94A3B8"
                        borderRadius="sm"
                        overflow="hidden"
                        bg="#FFFFFF"
                        cursor={onOpenImage ? 'pointer' : 'default'}
                        onClick={() => onOpenImage && onOpenImage(nationalIdBack, 'National ID Back', student.fullName)}
                      >
                        <Image src={nationalIdBack} alt="National ID Back" w="100%" h="100%" objectFit="contain" />
                      </Box>
                    ) : (
                      <Flex h="60px" w="100%" border="1px dashed #CBD5E1" borderRadius="sm" align="center" justify="center" direction="column" color="#94A3B8" bg="#FFFFFF">
                        <Icon as={FiFileText} boxSize="14px" mb={0.5} opacity={0.5} />
                        <Text fontSize="5.5pt" fontWeight="700">No ID Back Uploaded</Text>
                      </Flex>
                    )}
                  </Box>

                  {/* 3. Bank Receipt */}
                  <Box border="1px solid #CBD5E1" borderRadius="md" p={1} bg="#F8FAFC">
                    <Flex justify="space-between" align="center" mb={0.5}>
                      <HStack spacing={1}>
                        <Icon as={FiCheckCircle} color={student.paymentScreenshot ? '#16A34A' : '#94A3B8'} boxSize="10px" />
                        <Text fontSize="6.5pt" fontWeight="800" color="#0F172A">
                          Bank Receipt (የባንክ ደረሰኝ)
                        </Text>
                      </HStack>
                      <Badge fontSize="5pt" colorScheme={student.paymentScreenshot ? 'green' : 'gray'} px={1}>
                        {student.paymentScreenshot ? 'VERIFIED' : 'NOT SUBMITTED'}
                      </Badge>
                    </Flex>

                    {student.paymentScreenshot ? (
                      <Box
                        h="60px"
                        w="100%"
                        border="1px solid #94A3B8"
                        borderRadius="sm"
                        overflow="hidden"
                        bg="#FFFFFF"
                        position="relative"
                        cursor={onOpenImage ? 'pointer' : 'default'}
                        onClick={() => onOpenImage && onOpenImage(student.paymentScreenshot, 'Bank Payment Receipt', student.fullName)}
                      >
                        <Image
                          src={student.paymentScreenshot}
                          alt="Bank Deposit Slip"
                          w="100%"
                          h="100%"
                          objectFit="contain"
                        />
                      </Box>
                    ) : (
                      <Flex h="60px" w="100%" border="1px dashed #CBD5E1" borderRadius="sm" align="center" justify="center" direction="column" color="#94A3B8" bg="#FFFFFF">
                        <Icon as={FiFileText} boxSize="14px" mb={0.5} opacity={0.5} />
                        <Text fontSize="5.5pt" fontWeight="700">No Receipt Uploaded</Text>
                      </Flex>
                    )}
                  </Box>
                </SimpleGrid>
              </Box>

              {/* ============================================================= */}
              {/* 6. SECTION V: TRAINEE DECLARATION & PLEDGE                   */}
              {/* ============================================================= */}
              <Box className="tessbin-a4-pledge-box">
                <b>DECLARATION & AFFIRMATION / የተማሪው ቃል ኪዳን፡</b> I solemnly declare that all personal particulars and supporting document copies submitted in this registration dossier are true, legal, and authentic. I fully submit to the institutional code of conduct and academic directives of <b>TESBINN - Trade Ethiopia School of Business & Innovation (ትሬድ ኢትዮጵያ የቢዝነስ እና ፈጠራ ት/ቤት)</b>.
                <br />
                በዚህ የምዝገባ ቅጽ ላይ የሞላኋቸው መረጃዎችና ያቀረብኳቸው ማስረጃዎች በሙሉ እውነተኛ መሆናቸውን እያረጋገጥኩ፤ የቴስቢን - ትሬድ ኢትዮጵያ የቢዝነስ እና ፈጠራ ት/ቤትን ሕግና ደንብ አክብሬ ለመማር ቃል እገባለሁ።
              </Box>

              {/* ============================================================= */}
              {/* 7. SECTION VI: SIGNATURES, SCANNABLE QR CODE & OFFICIAL SEAL  */}
              {/* ============================================================= */}
              <Box className="tessbin-a4-sign-grid">
                {/* 1. Trainee Signature */}
                <Box className="tessbin-a4-sign-col">
                  <Box className="tessbin-a4-sign-line" />
                  <Text fontWeight="800" color="#0F172A">Trainee / Student Signature</Text>
                  <Text color="#64748B">የተማሪው ፊርማ & ቀን</Text>
                </Box>

                {/* 2. Registrar Officer Signature */}
                <Box className="tessbin-a4-sign-col">
                  <Box className="tessbin-a4-sign-line" />
                  <Text fontWeight="800" color="#0F172A">
                    {student.registeredBy || 'Admissions Officer Signature'}
                  </Text>
                  <Text color="#64748B">የሬጅስትራር / መዝጋቢ ፊርማ & ቀን</Text>
                </Box>

                {/* 3. Real Scannable QR Code Official Verification */}
                <Box textAlign="center" p="1px">
                  <Box
                    display="inline-block"
                    textAlign="center"
                    as="a"
                    href={verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    textDecoration="none"
                    p="2px 4px"
                    bg="#FFFFFF"
                    border="1px solid #CBD5E1"
                    borderRadius="3px"
                    boxShadow="0 1px 2px rgba(0,0,0,0.04)"
                    cursor="pointer"
                    _hover={{ borderColor: '#2563EB', transform: 'scale(1.02)' }}
                    title="Scan with phone or click to verify authentic student record"
                  >
                    <QRCodeGenerator
                      value={verifyUrl}
                      size={46}
                      level="M"
                    />
                    <Text fontSize="4.5pt" fontWeight="900" color="#1E40AF" lineHeight="1.1" mt="1px">
                      SCAN TO VERIFY
                    </Text>
                    <Text fontSize="3.8pt" color="#64748B">
                      ትክክለኛነቱን ይቃኙ
                    </Text>
                  </Box>
                </Box>
              </Box>

              {/* ============================================================= */}
              {/* 8. HARDCOPY DOCUMENT CONTROL FOOTER                          */}
              {/* ============================================================= */}
              <Box className="tessbin-a4-hardcopy-footer">
                <Text>
                  RECORD ID: <b>TSB-ADM-{student.studentId || '2026'}-{student._id ? String(student._id).slice(-6).toUpperCase() : 'REC'}</b>
                </Text>
                <Text>
                  TESBINN • Trade Ethiopia School of Business & Innovation (ትሬድ ኢትዮጵያ የቢዝነስ እና ፈጠራ ት/ቤት)
                </Text>
                <Text fontWeight="800">
                  Page 1 of 1
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
