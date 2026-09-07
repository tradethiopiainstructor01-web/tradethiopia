import { Badge, Box, Button, Flex, Heading, HStack, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import { FaGraduationCap } from "react-icons/fa";
import { FiBookOpen, FiClock, FiDownload, FiHeadphones, FiPrinter, FiUserPlus, FiUsers } from "react-icons/fi";

const StudentRegistrationHeader = ({ workspaceLabel, registrarName, visibleCount, onRegister, onPrint, onSections, onExcel }) => {
  const isSales = workspaceLabel === "Sales";
  const background = useColorModeValue("linear(to-br, #f8fbff, #eef6ff)", "linear(to-br, #142033, #102738)");
  const ink = useColorModeValue("#101b35", "white");
  const muted = useColorModeValue("#64748b", "gray.400");
  const buttonBg = useColorModeValue("white", "gray.800");
  return (
    <Flex
      position="relative" overflow="hidden" borderRadius="24px" bgGradient={background}
      boxShadow="0 8px 28px rgba(59, 130, 246, 0.08)" border="1px solid" borderColor={useColorModeValue("white", "gray.700")}
      p={{ base: 5, md: 7 }} gap={{ base: 6, xl: 8 }} direction={{ base: "column", "2xl": "row" }} align={{ base: "stretch", "2xl": "center" }}
    >
      <Box aria-hidden="true" pointerEvents="none" position="absolute" right="-120px" bottom="-220px" boxSize="430px" borderRadius="full" border="65px solid" borderColor="rgba(52, 211, 153, 0.06)" />
      <Box aria-hidden="true" pointerEvents="none" position="absolute" right="-150px" bottom="-280px" boxSize="380px" bg="rgba(96, 165, 250, 0.06)" borderRadius="full" />
      <HStack spacing={{ base: 4, md: 6 }} align="center" flex="1" minW={0} position="relative">
        <Flex align="center" justify="center" flexShrink={0} boxSize={{ base: "68px", md: "110px" }} bgGradient="linear(to-br, #e5efff, #dceaff)" borderRadius="20px">
          <Icon as={FaGraduationCap} boxSize={{ base: 10, md: 16 }} color="blue.500" />
        </Flex>
        <Box minW={0}>
          <HStack spacing={2} gap={1} flexWrap="wrap" mb={3}>
            {[[FiHeadphones, isSales ? "My Sales Registrations" : workspaceLabel, "green"], [FiBookOpen, isSales ? "Registered By Me" : "Learning Registry", "blue"], [FiUsers, `${visibleCount} visible`, "purple"]].map(([icon, label, color]) => (
              <Badge key={label} colorScheme={color} borderRadius="full" px={3} py={2} fontSize={{ base: "10px", md: "11px" }}>
                <HStack spacing={2}><Icon as={icon} boxSize={4} /><Text>{label}</Text></HStack>
              </Badge>
            ))}
          </HStack>
          <Heading color={ink} fontSize={{ base: "24px", md: "32px", "2xl": "36px" }} letterSpacing="-0.8px" lineHeight="1.2">
            {isSales ? "My Registered Students" : "Student Registration"}
          </Heading>
          <Text color={muted} fontSize={{ base: "sm", md: "md" }} mt={2} maxW="640px" lineHeight="1.6">
            {isSales ? `Viewing students registered by you (${registrarName}). Records from other sales reps or departments are restricted.` : "Register, review, edit, and export students by assigned Learning Department."}
          </Text>
        </Box>
      </HStack>
      <Flex wrap="wrap" gap={3} flex={{ base: "auto", "2xl": "0 1 700px" }} alignContent="center" position="relative" sx={{ "& > button": { height: "50px", borderRadius: "13px", fontWeight: 700, px: 5, flexGrow: { base: 1, md: 0 } } }}>
        <Button leftIcon={<FiUserPlus />} colorScheme="green" bgGradient="linear(to-br, #16a064, #22b779)" boxShadow="0 4px 12px rgba(22, 163, 74, 0.14)" onClick={onRegister}>Register Student</Button>
        {!isSales && <Button leftIcon={<FiPrinter />} colorScheme="blue" bgGradient="linear(to-br, #2188d5, #1779c6)" boxShadow="0 4px 12px rgba(37, 99, 235, 0.12)" onClick={onPrint}>Print Directory (A4)</Button>}
        <Button leftIcon={<FiClock />} colorScheme="blue" variant="outline" borderWidth="2px" bg={buttonBg} onClick={onSections}>View Sections</Button>
        <Button leftIcon={<FiDownload />} colorScheme="green" variant="outline" borderWidth="2px" bg={buttonBg} onClick={onExcel}>Preview Excel</Button>
      </Flex>
    </Flex>
  );
};

export default StudentRegistrationHeader;
