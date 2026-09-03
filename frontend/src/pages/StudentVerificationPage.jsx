import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Button,
  Image,
  Icon,
  SimpleGrid,
  Divider,
  Spinner,
  Flex,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiAward,
  FiPrinter,
  FiCalendar,
  FiUser,
  FiBook,
  FiClock,
  FiFileText,
  FiExternalLink,
  FiLock,
  FiRefreshCw,
  FiCheck,
} from 'react-icons/fi';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import QRCodeGenerator from '../components/common/QRCodeGenerator';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function StudentVerificationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [verifiedData, setVerifiedData] = useState(null);
  const [error, setError] = useState(null);
  const [scannedAt, setScannedAt] = useState('');

  useEffect(() => {
    setScannedAt(
      new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      })
    );
  }, []);

  useEffect(() => {
    const fetchVerification = async () => {
      if (!id) {
        setError('No verification identifier provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Try public student verification endpoint
        const res = await axios.get(`${API_BASE_URL}/student-registrations/verify/${encodeURIComponent(id)}`);
        if (res.data?.success && res.data?.data) {
          setVerifiedData(res.data.data);
        } else {
          setError(res.data?.message || 'Verification record could not be confirmed.');
        }
      } catch (err) {
        console.warn('Primary verification failed, attempting fallback...', err);
        try {
          const fallbackRes = await axios.get(`${API_BASE_URL}/tessbin/verify-student/${encodeURIComponent(id)}`);
          if (fallbackRes.data?.success && fallbackRes.data?.data) {
            setVerifiedData(fallbackRes.data.data);
          } else {
            setError(fallbackRes.data?.message || 'Academic record could not be verified.');
          }
        } catch (fbErr) {
          setError(
            err.response?.data?.message ||
              fbErr.response?.data?.message ||
              'This record ID does not match any registered trainee or valid credential in the TESBINN Registry.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const currentUrl = window.location.href;

  return (
    <Box minH="100vh" bg="#F1F5F9" py={{ base: 4, md: 8 }} px={{ base: 3, md: 6 }} color="#0F172A">
      <Container maxW="860px" p={0}>
        {/* Top Floating Control Bar */}
        <Flex
          justify="space-between"
          align="center"
          mb={4}
          bg="white"
          p={3.5}
          px={5}
          borderRadius="xl"
          boxShadow="0 2px 10px rgba(0,0,0,0.04)"
          border="1px solid #E2E8F0"
          className="no-print"
          wrap="wrap"
          gap={2}
        >
          <HStack spacing={2}>
            <Image
              src="/tessbin-dashboard-logo.png"
              alt="TESBINN"
              w="28px"
              h="28px"
              fallbackSrc="/company-logos/tesbinn.png"
            />
            <Text fontWeight="800" fontSize="13px" color="#0F172A" letterSpacing="0.3px">
              TESBINN ACADEMIC REGISTRY VERIFICATION
            </Text>
          </HStack>

          <HStack spacing={2}>
            <Button
              size="sm"
              leftIcon={<FiPrinter />}
              colorScheme="blue"
              bg="#1E293B"
              _hover={{ bg: '#0F172A' }}
              onClick={handlePrint}
              borderRadius="lg"
              fontWeight="700"
              fontSize="12px"
            >
              Print Verification Statement
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="gray"
              leftIcon={<FiRefreshCw />}
              onClick={() => window.location.reload()}
              borderRadius="lg"
              fontWeight="700"
              fontSize="12px"
            >
              Re-verify
            </Button>
          </HStack>
        </Flex>

        {/* Main Certificate / Verification Dossier Container */}
        <Box
          bg="white"
          borderRadius="2xl"
          boxShadow="0 10px 30px rgba(15, 23, 42, 0.08)"
          border="2px solid #E2E8F0"
          overflow="hidden"
          position="relative"
        >
          {/* Top Security Banner */}
          <Box
            bg={verifiedData ? '#065F46' : error ? '#991B1B' : '#1E293B'}
            color="white"
            px={{ base: 4, md: 6 }}
            py={3}
            transition="background 0.3s ease"
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
              <HStack spacing={2.5}>
                <Icon
                  as={verifiedData ? FiCheckCircle : error ? FiXCircle : FiLock}
                  boxSize="20px"
                  color={verifiedData ? '#34D399' : '#FCA5A5'}
                />
                <Text fontWeight="800" fontSize={{ base: '12px', md: '13.5px' }} letterSpacing="0.4px">
                  {verifiedData
                    ? 'AUTHENTIC OFFICIAL CREDENTIAL VERIFIED • ትክክለኛነቱ የተረጋገጠ'
                    : error
                    ? 'VERIFICATION FAILED • ያልተረጋገጠ መረጃ'
                    : 'AUTHENTICATING WITH SECURE REGISTRY...'}
                </Text>
              </HStack>

              {verifiedData && (
                <Badge bg="#10B981" color="white" px={3} py={1} borderRadius="full" fontWeight="800" fontSize="11px">
                  LIVE STATUS: VERIFIED ✓
                </Badge>
              )}
            </Flex>
          </Box>

          {/* Institutional Header with Bilingual Titles */}
          <Box px={{ base: 5, md: 8 }} pt={6} pb={5} borderBottom="1px solid #E2E8F0" bg="#FAFAFA">
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              justify="space-between"
              align={{ base: 'center', sm: 'center' }}
              gap={4}
              textAlign={{ base: 'center', sm: 'left' }}
            >
              <HStack spacing={4} align="center">
                <Box
                  w="64px"
                  h="64px"
                  borderRadius="xl"
                  overflow="hidden"
                  bg="white"
                  p="2px"
                  border="2px solid #0F172A"
                  boxShadow="0 4px 12px rgba(0,0,0,0.06)"
                  flexShrink={0}
                >
                  <Image
                    src="/tessbin-dashboard-logo.png"
                    alt="Tessbin Academy"
                    w="full"
                    h="full"
                    objectFit="contain"
                    fallbackSrc="/company-logos/tesbinn.png"
                  />
                </Box>
                <Box>
                  <Text
                    fontSize={{ base: '18px', md: '21px' }}
                    fontWeight="900"
                    color="#0F172A"
                    letterSpacing="0.8px"
                    lineHeight="1.15"
                    fontFamily="Georgia, serif"
                  >
                    TESBINN
                  </Text>
                  <Text fontSize="11px" fontWeight="800" color="#334155" textTransform="uppercase" letterSpacing="0.4px">
                    Trade Ethiopia School of Business & Innovation
                  </Text>
                  <Text fontSize="11px" fontWeight="700" color="#B45309" letterSpacing="0.2px">
                    ትሬድ ኢትዮጵያ የቢዝነስ እና ፈጠራ ት/ቤት
                  </Text>
                  <Text fontSize="10px" color="#64748B" mt={0.5}>
                    Institutional Accreditation & Registrar Directory • Addis Ababa, Ethiopia
                  </Text>
                </Box>
              </HStack>

              {/* Dynamic QR Code */}
              <Box
                p={2}
                bg="white"
                borderRadius="xl"
                border="1.5px solid #CBD5E1"
                boxShadow="sm"
                textAlign="center"
                flexShrink={0}
              >
                <QRCodeGenerator value={currentUrl} size={76} level="M" />
                <Text fontSize="8px" fontWeight="800" color="#475569" mt={1}>
                  SECURE SCAN
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Loading State */}
          {loading && (
            <Box py={16} textAlign="center">
              <Spinner size="xl" color="#059669" thickness="4px" />
              <Text mt={4} fontSize="14px" fontWeight="700" color="#475569">
                Authenticating institutional record against the database...
              </Text>
            </Box>
          )}

          {/* Error State */}
          {!loading && error && (
            <Box py={12} px={6} textAlign="center">
              <Flex
                w="64px"
                h="64px"
                mx="auto"
                bg="#FEE2E2"
                color="#DC2626"
                borderRadius="full"
                align="center"
                justify="center"
                mb={4}
              >
                <Icon as={FiXCircle} boxSize="36px" />
              </Flex>
              <Heading size="md" color="#991B1B" mb={2}>
                Registration Record Not Found
              </Heading>
              <Text fontSize="13px" color="#64748B" maxW="480px" mx="auto" mb={6}>
                {error}
              </Text>
              <Badge colorScheme="red" fontSize="12px" p={2} borderRadius="md">
                Queried ID: {id}
              </Badge>
            </Box>
          )}

          {/* Verified Student Details */}
          {!loading && verifiedData && (
            <Box p={{ base: 5, md: 8 }}>
              {/* Trainee Spotlight Header */}
              <Flex
                p={4}
                bg="#F8FAFC"
                borderRadius="xl"
                border="1px solid #E2E8F0"
                justify="space-between"
                align="center"
                wrap="wrap"
                gap={4}
                mb={6}
              >
                <HStack spacing={4}>
                  <Box
                    w="72px"
                    h="84px"
                    bg="white"
                    border="1.5px solid #CBD5E1"
                    borderRadius="lg"
                    overflow="hidden"
                    boxShadow="sm"
                    flexShrink={0}
                  >
                    {verifiedData.passportPhoto ? (
                      <Image
                        src={verifiedData.passportPhoto}
                        alt={verifiedData.fullName}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    ) : (
                      <Flex w="full" h="full" align="center" justify="center" bg="#E2E8F0" color="#64748B">
                        <Icon as={FiUser} boxSize="32px" />
                      </Flex>
                    )}
                  </Box>

                  <Box>
                    <Badge colorScheme="teal" fontSize="10px" px={2} py={0.5} borderRadius="md" fontWeight="800" mb={1}>
                      REGISTERED TRAINEE
                    </Badge>
                    <Heading size="md" color="#0F172A" fontWeight="900">
                      {verifiedData.fullName}
                    </Heading>
                    <Text fontSize="12px" color="#64748B" mt={0.5}>
                      Student ID: <b style={{ color: '#0F172A' }}>{verifiedData.studentId}</b> • Shift: <b>{verifiedData.preferredTimeSlot}</b>
                    </Text>
                  </Box>
                </HStack>

                <VStack align={{ base: 'start', sm: 'end' }} spacing={1}>
                  <Badge
                    colorScheme={verifiedData.classCompleted ? 'green' : 'blue'}
                    fontSize="12px"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontWeight="800"
                  >
                    {verifiedData.classCompletionStatus || (verifiedData.classCompleted ? 'Course Completed' : 'In Training')}
                  </Badge>
                  {verifiedData.isCoffeeCupping && (
                    <Badge
                      colorScheme={verifiedData.cocPaymentStatus === 'Paid' ? 'purple' : 'orange'}
                      fontSize="11px"
                      px={2.5}
                      py={0.5}
                      borderRadius="md"
                      fontWeight="800"
                    >
                      COC: {verifiedData.cocPaymentStatus}
                    </Badge>
                  )}
                </VStack>
              </Flex>

              {/* Verified Details Grid */}
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} mb={6}>
                <Box p={3.5} bg="#F8FAFC" borderRadius="xl" border="1px solid #E2E8F0">
                  <Text fontSize="10px" fontWeight="800" color="#64748B" textTransform="uppercase">
                    Enrolled Department / Program
                  </Text>
                  <Text fontSize="13px" fontWeight="800" color="#0F172A" mt={1}>
                    {verifiedData.learningDepartment || verifiedData.program}
                  </Text>
                </Box>

                <Box p={3.5} bg="#F8FAFC" borderRadius="xl" border="1px solid #E2E8F0">
                  <Text fontSize="10px" fontWeight="800" color="#64748B" textTransform="uppercase">
                    Registration Date
                  </Text>
                  <Text fontSize="13px" fontWeight="800" color="#0F172A" mt={1}>
                    {formatDate(verifiedData.enrollmentDate)}
                  </Text>
                </Box>

                <Box p={3.5} bg="#F8FAFC" borderRadius="xl" border="1px solid #E2E8F0">
                  <Text fontSize="10px" fontWeight="800" color="#64748B" textTransform="uppercase">
                    Tuition Status & Receipt FS#
                  </Text>
                  <Text fontSize="13px" fontWeight="800" color="#0F172A" mt={1}>
                    {verifiedData.paymentStatus} {verifiedData.fsNumber ? `(FS: ${verifiedData.fsNumber})` : ''}
                  </Text>
                </Box>

                <Box p={3.5} bg="#F8FAFC" borderRadius="xl" border="1px solid #E2E8F0">
                  <Text fontSize="10px" fontWeight="800" color="#64748B" textTransform="uppercase">
                    Registered By Officer
                  </Text>
                  <Text fontSize="13px" fontWeight="800" color="#0F172A" mt={1}>
                    {verifiedData.registeredBy}
                  </Text>
                </Box>

                <Box p={3.5} bg="#F8FAFC" borderRadius="xl" border="1px solid #E2E8F0">
                  <Text fontSize="10px" fontWeight="800" color="#64748B" textTransform="uppercase">
                    Exam / Assessment Date
                  </Text>
                  <Text fontSize="13px" fontWeight="800" color="#0F172A" mt={1}>
                    {verifiedData.examDate ? formatDate(verifiedData.examDate) : 'Scheduled with Cohort'}
                  </Text>
                </Box>

                <Box p={3.5} bg="#F8FAFC" borderRadius="xl" border="1px solid #E2E8F0">
                  <Text fontSize="10px" fontWeight="800" color="#64748B" textTransform="uppercase">
                    Verification Code
                  </Text>
                  <Text fontSize="13px" fontWeight="800" color="#2563EB" mt={1}>
                    {verifiedData.verificationCode}
                  </Text>
                </Box>
              </SimpleGrid>

              {/* Official Registrar Seal & Security Box */}
              <Box
                p={5}
                bg="#EFF6FF"
                borderRadius="2xl"
                border="1.5px solid #BFDBFE"
                mb={6}
              >
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  align="center"
                  justify="space-between"
                  gap={6}
                >
                  {/* Left: Security Check & Statement */}
                  <Box flex={1}>
                    <HStack spacing={2} mb={2}>
                      <Icon as={FiShield} color="#2563EB" boxSize="18px" />
                      <Text fontSize="12px" fontWeight="900" color="#1E3A8A" letterSpacing="0.4px">
                        INSTITUTIONAL REGISTRY INTEGRITY ATTESTATION
                      </Text>
                    </HStack>
                    <Text fontSize="11px" color="#334155" lineHeight="1.5" mb={3}>
                      This digital verification certificate confirms that the student identified above is officially registered in the permanent records of <b>TESBINN - Trade Ethiopia School of Business & Innovation</b>. The digital signature hash below matches the registry cryptographically.
                    </Text>

                    <HStack spacing={2} wrap="wrap" fontSize="10px" color="#64748B">
                      <Text>
                        <b>SHA-256 HASH:</b>{' '}
                        <code style={{ background: '#DBEAFE', padding: '2px 6px', borderRadius: '4px', color: '#1E40AF', fontWeight: 'bold' }}>
                          {verifiedData.securityHash}
                        </code>
                      </Text>
                    </HStack>
                    <Text fontSize="9.5px" color="#64748B" mt={1}>
                      Verified Timestamp: <b>{scannedAt}</b>
                    </Text>
                  </Box>

                  {/* Right: Authentic Circular Wet Seal Graphic */}
                  <Box textAlign="center" flexShrink={0}>
                    <svg
                      width="120"
                      height="120"
                      viewBox="0 0 120 120"
                      role="img"
                      aria-label="Official Seal Registrar Verified"
                      style={{
                        transform: 'rotate(-4deg)',
                        filter: 'drop-shadow(0 2px 4px rgba(30, 58, 138, 0.15))',
                      }}
                    >
                      <defs>
                        <path id="verify-stamp-arc-top" d="M 18 60 A 42 42 0 0 1 102 60" />
                        <path id="verify-stamp-arc-bottom" d="M 102 60 A 42 42 0 0 1 18 60" />
                      </defs>
                      {/* Outer dashed circular border */}
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                        strokeDasharray="5, 3"
                      />
                      {/* Arc Top Text: INN • TRADE ETHIO */}
                      <text
                        fill="#1E40AF"
                        fontSize="9.5"
                        fontWeight="900"
                        letterSpacing="1.2"
                        fontFamily="Arial, sans-serif"
                      >
                        <textPath href="#verify-stamp-arc-top" startOffset="50%" textAnchor="middle">
                          INN • TRADE ETHIO
                        </textPath>
                      </text>
                      {/* Amharic Text: ትሬድ ኢትዮጵያ ት/ቤት */}
                      <text
                        x="60"
                        y="52"
                        textAnchor="middle"
                        fill="#2563EB"
                        fontSize="7"
                        fontWeight="800"
                        fontFamily="sans-serif"
                      >
                        ትሬድ ኢትዮጵያ ት/ቤት
                      </text>
                      {/* Center Double Rule & OFFICIAL SEAL */}
                      <line x1="22" y1="59" x2="98" y2="59" stroke="#2563EB" strokeWidth="1.2" />
                      <text
                        x="60"
                        y="68"
                        textAnchor="middle"
                        fill="#1E40AF"
                        fontSize="7"
                        fontWeight="900"
                        letterSpacing="0.8"
                        fontFamily="sans-serif"
                      >
                        ★ OFFICIAL SEAL ★
                      </text>
                      <line x1="22" y1="73" x2="98" y2="73" stroke="#2563EB" strokeWidth="1.2" />
                      {/* Bottom Text: REGISTRAR VERIFIED */}
                      <text
                        x="60"
                        y="84"
                        textAnchor="middle"
                        fill="#2563EB"
                        fontSize="6.2"
                        fontWeight="900"
                        letterSpacing="0.6"
                        fontFamily="sans-serif"
                      >
                        REGISTRAR VERIFIED
                      </text>
                    </svg>
                    <Text fontSize="9px" fontWeight="800" color="#2563EB" mt={1}>
                      REGISTRAR VERIFIED SEAL
                    </Text>
                  </Box>
                </Flex>
              </Box>

              {/* Bottom Footer Details */}
              <Divider mb={4} />
              <Flex justify="space-between" align="center" wrap="wrap" gap={2} fontSize="10px" color="#64748B">
                <Text>
                  TESBINN Registry Verification Portal • Official Hardcopy Security Document
                </Text>
                <Text>
                  Inquiries: <b>info@tessbin.com</b> • +251 911 000 000
                </Text>
              </Flex>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
