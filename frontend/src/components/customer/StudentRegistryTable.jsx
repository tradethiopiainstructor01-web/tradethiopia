import { useState } from "react";
import { Avatar, Badge, Box, Checkbox, HStack, Icon, IconButton, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr, VStack, useColorModeValue } from "@chakra-ui/react";
import { FiBookOpen, FiCamera, FiCheckCircle, FiClock, FiCreditCard, FiEdit2, FiEye, FiFileText, FiGrid, FiPhone, FiTrash2, FiUser } from "react-icons/fi";

const FileIndicator = ({ label, present, icon, color, onOpen }) => (
  <VStack spacing={1}>
    <Box position="relative">
      <Tooltip label={present ? `View ${label}` : `${label} not attached`}>
        <IconButton aria-label={present ? `View ${label}` : `${label} not attached`} icon={<Icon as={icon} boxSize={5} />} bg={present ? `${color}.50` : "gray.100"} color={present ? `${color}.600` : "gray.400"} variant="solid" size="lg" borderRadius="14px" isDisabled={!present} onClick={onOpen} />
      </Tooltip>
      {present && <Icon as={FiCheckCircle} position="absolute" right="-3px" bottom="-3px" color="green.600" bg="white" borderRadius="full" boxSize={4} />}
    </Box>
    <Text fontSize="xs">{label}</Text>
  </VStack>
);

const StudentRegistryTable = ({ students, onDetail, onEdit, onDelete }) => {
  const [selected, setSelected] = useState([]);
  const border = useColorModeValue("blue.50", "gray.700");
  const header = useColorModeValue("#edf3fb", "gray.700");
  const ink = useColorModeValue("#101a45", "gray.100");
  const muted = useColorModeValue("#526a9a", "gray.400");
  const rowBg = useColorModeValue("white", "gray.800");
  const selectedBg = useColorModeValue("blue.50", "gray.700");
  const selectedOnPage = students.filter((student) => selected.includes(student.id)).length;
  const togglePage = (checked) => setSelected((previous) => checked
    ? [...new Set([...previous, ...students.map((student) => student.id)])]
    : previous.filter((id) => !students.some((student) => student.id === id)));

  return (
    <Box>
      {selectedOnPage > 0 && <Text mb={2} fontSize="sm" color={muted}>{selectedOnPage} students selected on this page</Text>}
      <TableContainer border="1px solid" borderColor={border} borderRadius="16px" overflowX="auto">
        <Table size="sm" minW="1100px" sx={{ th: { textTransform: "none", letterSpacing: 0, color: muted, py: 5, borderColor: border }, td: { py: 5, px: 3, borderColor: border, whiteSpace: "normal" } }}>
          <Thead bg={header}>
            <Tr>
              <Th width="42px"><Checkbox aria-label="Select all students on this page" colorScheme="green" isChecked={students.length > 0 && selectedOnPage === students.length} isIndeterminate={selectedOnPage > 0 && selectedOnPage < students.length} onChange={(event) => togglePage(event.target.checked)} /></Th>
              {[[FiUser, "Student"], [FiGrid, "Department & Shift"], [FiClock, "Class"], [FiCreditCard, "Payment & Bank"], [FiFileText, "Verification Files"]].map(([icon, title]) => <Th key={title}><HStack spacing={2}><Icon as={icon} /><Text>{title}</Text></HStack></Th>)}
              <Th textAlign="right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {students.map((student, index) => {
              const outcome = student.classCompletionStatus || (student.classCompleted ? "Completed" : "Not Completed");
              const completed = outcome === "Completed";
              return (
                <Tr key={student.id} bg={selected.includes(student.id) ? selectedBg : rowBg} color={ink}>
                  <Td><Checkbox colorScheme="green" aria-label={`Select ${student.fullName}`} isChecked={selected.includes(student.id)} onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, student.id] : previous.filter((id) => id !== student.id))} /></Td>
                  <Td minW="205px">
                    <HStack spacing={3} align="center">
                      <Avatar name={student.fullName} size="md" bg={["purple.100", "blue.100", "green.100", "pink.100"][index % 4]} color="purple.700" />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="800">{student.fullName}</Text>
                        <Badge colorScheme="purple" borderRadius="full" px={2} fontSize="10px">{student.studentId}</Badge>
                        {student.phone && <HStack spacing={1} color={muted} fontSize="xs"><Icon as={FiPhone} /><Text>{student.phone}</Text></HStack>}
                      </VStack>
                    </HStack>
                  </Td>
                  <Td minW="190px"><HStack spacing={3}>
                    <Box bg="green.50" color="green.600" p={3} borderRadius="full"><Icon as={FiBookOpen} boxSize={5} /></Box>
                    <Box><Text fontWeight="800" fontSize="xs">{student.learningDepartment || "Unassigned"}</Text><Text color={muted} fontSize="xs" mt={1}>{student.program}</Text><Badge mt={1} colorScheme={student.preferredTimeSlot === "Night" ? "purple" : "green"} borderRadius="full" px={2} variant="subtle" textTransform="none">{student.preferredTimeSlot || "Morning"}</Badge></Box>
                  </HStack></Td>
                  <Td><Badge colorScheme={completed ? "green" : outcome === "Stopped" ? "red" : "orange"} borderRadius="full" px={3} py={2} textTransform="none"><HStack spacing={1}><Icon as={completed ? FiCheckCircle : FiClock} /><Text>{outcome}</Text></HStack></Badge></Td>
                  <Td minW="210px"><VStack align="start" spacing={2}>
                    <HStack flexWrap="wrap"><Badge colorScheme={student.paymentStatus === "Paid" ? "green" : "orange"} px={3} py={2} borderRadius="full" textTransform="none">{student.paymentStatus || "Waiting"}</Badge><Badge colorScheme="green" px={2} py={2} borderRadius="full" textTransform="none">{student.paymentOption || "Full Payment"}</Badge></HStack>
                    {student.paymentBank && <HStack spacing={2} align="start"><Icon as={FiCreditCard} color={muted} /><Text fontSize="xs" fontWeight="700">{student.paymentBank}</Text></HStack>}
                    {student.fsNumber && <Text fontSize="xs" color="blue.500">FS#: {student.fsNumber}</Text>}
                    {((student.learningDepartment || '').toLowerCase().includes('coffee') || (student.program || '').toLowerCase().includes('coffee')) && (
                      <Box pt={1} borderTop="1px dashed" borderColor={border} w="full">
                        <HStack spacing={1.5} flexWrap="wrap">
                          <Badge colorScheme={student.cocPaymentStatus === "Paid" ? "teal" : "gray"} fontSize="10px" px={2} py={0.5} borderRadius="full">
                            COC: {student.cocPaymentStatus || "Unpaid"}
                          </Badge>
                          {student.cocPaymentBank && (
                            <Text fontSize="10px" fontWeight="600" color={muted} noOfLines={1}>
                              🏦 {student.cocPaymentBank}
                            </Text>
                          )}
                        </HStack>
                      </Box>
                    )}
                  </VStack></Td>
                  <Td><HStack spacing={3} color={muted}>
                    <FileIndicator label="Photo" present={Boolean(student.passportPhoto || student.hasPassportPhoto)} icon={FiCamera} color="purple" onOpen={() => onDetail(student)} />
                    <FileIndicator label="ID-F" present={Boolean(student.nationalIdFrontImage || student.nationalIdImage || student.hasNationalIdFrontImage || student.hasNationalIdImage)} icon={FiCreditCard} color="blue" onOpen={() => onDetail(student)} />
                    <FileIndicator label="ID-B" present={Boolean(student.nationalIdBackImage || student.hasNationalIdBackImage)} icon={FiCreditCard} color="cyan" onOpen={() => onDetail(student)} />
                    <FileIndicator label="Slip" present={Boolean(student.paymentScreenshot || student.hasPaymentScreenshot)} icon={FiFileText} color="green" onOpen={() => onDetail(student)} />
                    {((student.learningDepartment || '').toLowerCase().includes('coffee') || (student.program || '').toLowerCase().includes('coffee') || student.hasCocPaymentScreenshot || student.cocPaymentScreenshot) && (
                      <FileIndicator label="COC" present={Boolean(student.cocPaymentScreenshot || student.hasCocPaymentScreenshot)} icon={FiFileText} color="teal" onOpen={() => onDetail(student)} />
                    )}
                  </HStack></Td>
                  <Td><HStack justify="end" spacing={2}>
                    {[["View student", FiEye, "blue", onDetail], ["Edit student", FiEdit2, "blue", onEdit], ["Delete student", FiTrash2, "red", onDelete]].map(([label, icon, color, action]) => <Tooltip key={label} label={label}><IconButton aria-label={`${label}: ${student.fullName}`} icon={<Icon as={icon} boxSize={5} />} bg={`${color}.50`} color={`${color}.600`} variant="solid" borderRadius="12px" onClick={() => action(student)} /></Tooltip>)}
                  </HStack></Td>
                </Tr>
              );
            })}
            {!students.length && <Tr><Td colSpan={7} textAlign="center" color={muted}>No students match the selected filters.</Td></Tr>}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StudentRegistryTable;
