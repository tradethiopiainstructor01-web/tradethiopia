import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, FormControl, FormLabel, Heading, HStack, Input, Select, SimpleGrid, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useColorModeValue } from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import { getStudentRegistrations } from '../../services/studentRegistrationService';

import StudentEducationDocument from './StudentEducationDocument';
import { TESSBIN_DEPARTMENTS } from '../../utils/tessbinDepartments';

export default function TessbinStudentsDocumentsView() {

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [fileType, setFileType] = useState('');
  const [registrar, setRegistrar] = useState('');
  const [documentStatus, setDocumentStatus] = useState('uploaded');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');


  const bg = useColorModeValue('white', 'gray.800');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStudentRegistrations();
      setStudents(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load student documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const registrars = useMemo(() => [...new Set(students.map((student) => student.registeredBy).filter(Boolean))].sort(), [students]);
  const invalidDates = Boolean(startDate && endDate && startDate > endDate);
  const filtered = useMemo(() => students.filter((student) => {
    const hasFile = Boolean(student.hasEducationFile || student.educationFile);
    if (documentStatus === 'uploaded' && !hasFile) return false;
    if (documentStatus === 'missing' && hasFile) return false;
    if (department && (student.learningDepartment || '').toLowerCase() !== department.toLowerCase()) return false;
    if (registrar && student.registeredBy !== registrar) return false;
    const extension = (student.educationFileName || '').split('.').pop().toLowerCase();
    if (fileType && (!hasFile || extension !== fileType)) return false;
    const date = new Date(student.createdAt || student.enrollmentDate);
    if ((startDate || endDate) && Number.isNaN(date.getTime())) return false;
    if (startDate && date < new Date(`${startDate}T00:00:00`)) return false;
    if (endDate && date > new Date(`${endDate}T23:59:59.999`)) return false;
    if (invalidDates) return false;
    return [student.fullName, student.studentId, student.learningDepartment, student.educationFileName, student.registeredBy]
      .some((value) => (value || '').toLowerCase().includes(search.trim().toLowerCase()));
  }), [students, search, department, registrar, fileType, documentStatus, startDate, endDate, invalidDates]);
  const clearFilters = () => {
    setSearch(''); setDepartment(''); setFileType(''); setRegistrar('');
    setDocumentStatus('uploaded'); setStartDate(''); setEndDate('');
  };

  return (
    <Box bg={bg} p={{ base: 4, md: 6 }} borderRadius="xl">
      <HStack justify="space-between" mb={2}>
        <Heading size="md">Students documents</Heading>
        <Button leftIcon={<FiRefreshCw />} onClick={load} isLoading={loading} size="sm">Refresh</Button>
      </HStack>
      <Text mb={4}>Education files uploaded through Customer Service student registrations.</Text>
      <Input aria-label="Search student documents" placeholder="Search student, ID, department or file name" value={search} onChange={(event) => setSearch(event.target.value)} mb={4} />
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4} mb={4}>
        <FormControl><FormLabel>Department</FormLabel><Select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">All Departments</option>{TESSBIN_DEPARTMENTS.slice(1).map((value) => <option key={value} value={value}>{value}</option>)}</Select></FormControl>
        <FormControl><FormLabel>Document status</FormLabel><Select value={documentStatus} onChange={(event) => { setDocumentStatus(event.target.value); if (event.target.value === 'missing') setFileType(''); }}><option value="uploaded">Uploaded</option><option value="missing">Missing documents</option><option value="all">All students</option></Select></FormControl>
        <FormControl><FormLabel>File type</FormLabel><Select value={fileType} isDisabled={documentStatus === 'missing'} onChange={(event) => setFileType(event.target.value)}><option value="">All file types</option><option value="pdf">PDF</option><option value="docx">Word (.docx)</option><option value="doc">Word (.doc)</option></Select></FormControl>
        <FormControl><FormLabel>Registered by</FormLabel><Select value={registrar} onChange={(event) => setRegistrar(event.target.value)}><option value="">All staff</option>{registrars.map((value) => <option key={value} value={value}>{value}</option>)}</Select></FormControl>
        <FormControl isInvalid={invalidDates}><FormLabel>Registered from</FormLabel><Input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></FormControl>
        <FormControl isInvalid={invalidDates}><FormLabel>Registered through</FormLabel><Input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></FormControl>
      </SimpleGrid>
      {invalidDates && <Text role="alert" color="red.500" mb={3}>The end date must be on or after the start date.</Text>}
      <Button size="sm" variant="outline" onClick={clearFilters} mb={4}>Reset filters</Button>
      {error ? <Text role="alert" color="red.500">{error}</Text> : loading ? <Text>Loading documents...</Text> : (
        <>
          <Text fontSize="sm" mb={3}>{filtered.length} student(s) shown · {filtered.filter((student) => student.hasEducationFile || student.educationFile).length} document(s)</Text>
          <TableContainer>
            <Table size="sm">
              <Thead><Tr><Th>Student</Th><Th>Department</Th><Th>Education files</Th><Th>Registered by</Th><Th>Actions</Th></Tr></Thead>
              <Tbody>
                {filtered.map((student) => (
                  <Tr key={student._id || student.id}>
                    <Td><Text fontWeight="bold">{student.fullName}</Text><Text fontSize="xs">{student.studentId}</Text></Td>
                    <Td>{student.learningDepartment}</Td>
                    <Td>{student.educationFileName || 'Not uploaded'}</Td>
                    <Td>{student.registeredBy}</Td>
                    <Td><StudentEducationDocument student={student} /></Td>
                  </Tr>
                ))}
                {!filtered.length && <Tr><Td colSpan={5} py={8} textAlign="center">No students match these document filters.</Td></Tr>}
              </Tbody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
