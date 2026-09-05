import { 
    Input, VStack, Box, Container, Heading, Button, useColorModeValue, 
    useToast, Select, FormControl, FormLabel, SimpleGrid, Text, Divider,
    Badge, HStack, Flex, Icon, Tooltip
} from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FiDollarSign, FiCreditCard, FiFileText, FiShield, FiUserCheck, FiInfo } from 'react-icons/fi';
import { calculateNetSalary, formatETB } from '../utils/ethiopianTax';

const CreateOrUpdatePage = ({ userId, onClose, onCreated }) => {
    const [newUser, setNewUser] = useState({
        name: "",
        fullName: "",
        email: "",
        password: "",
        role: "",
        department: "",
        salary: "",
        salaryBankAccountNumber: "",
        tinNumber: "",
        transportAllowance: ""
    });

    const toast = useToast();
    const cardBg = useColorModeValue("white", "gray.800");
    const previewBg = useColorModeValue("teal.50", "rgba(13, 148, 136, 0.12)");
    const previewBorder = useColorModeValue("teal.200", "teal.700");

    useEffect(() => {
        const fetchUserData = async () => {
            if (userId) {
                try {
                    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${userId}`);
                    const userData = response.data.user || response.data.data?.user || response.data;
                    setNewUser({
                        name: userData.username || "",
                        fullName: userData.fullName || userData.username || "",
                        email: userData.email || "",
                        password: "", // Don't pre-fill password for security
                        role: userData.role || "",
                        department: userData.department || userData.jobTitle || "",
                        salary: userData.salary ?? "",
                        salaryBankAccountNumber: userData.personalInformation?.salaryBankAccountNumber || userData.salaryBankAccountNumber || "",
                        tinNumber: userData.personalInformation?.tinNumber || userData.tinNumber || "",
                        transportAllowance: userData.transportAllowance ?? ""
                    });
                } catch (error) {
                    toast({
                        title: "Error fetching user data.",
                        description: error.response?.data?.message || "An error occurred.",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                }
            }
        };

        fetchUserData();
    }, [userId, toast]);

    // Live Ethiopian Tax & Pension calculation
    const taxPreview = useMemo(() => {
        const base = Number(newUser.salary) || 0;
        const transport = Number(newUser.transportAllowance) || 0;
        if (base <= 0) return null;
        return calculateNetSalary({
            basicSalary: base,
            transportAllowance: transport
        });
    }, [newUser.salary, newUser.transportAllowance]);

    const handleSubmit = async () => {
        try {
            const url = userId 
                ? `${import.meta.env.VITE_API_URL}/api/users/${userId}` 
                : `${import.meta.env.VITE_API_URL}/api/users`;
            const method = userId ? 'put' : 'post';
    
            const salaryValue = newUser.salary !== "" ? Number(newUser.salary) : undefined;
            const defaultActiveRoles = ["admin", "HR", "COO", "COO2", "coo2", "CEO"];
            const status = (salaryValue && salaryValue > 0) || defaultActiveRoles.includes(newUser.role) ? "active" : "inactive";

            const dataToSend = {
                username: newUser.name,
                fullName: newUser.fullName || newUser.name,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role,
                department: newUser.department || newUser.role,
                status: status,
                salary: salaryValue,
                salaryBankAccountNumber: newUser.salaryBankAccountNumber?.trim() || "",
                tinNumber: newUser.tinNumber?.trim() || "",
                transportAllowance: newUser.transportAllowance !== "" ? Number(newUser.transportAllowance) : 0,
                personalInformation: {
                    salaryBankAccountNumber: newUser.salaryBankAccountNumber?.trim() || "",
                    tinNumber: newUser.tinNumber?.trim() || ""
                }
            };
    
            const response = await axios[method](url, dataToSend);
            
            if (response.data.success || response.status === 200 || response.status === 201) {
                toast({
                    title: userId ? "User updated successfully." : "Employee Registered & Payroll Established!",
                    description: salaryValue && salaryValue > 0
                        ? `Account created and Ethiopian payroll draft established for ${newUser.fullName || newUser.name} (${formatETB(salaryValue)} base).`
                        : "The user has been created successfully.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
                setNewUser({ 
                    name: "", 
                    fullName: "", 
                    email: "", 
                    password: "", 
                    role: "", 
                    department: "", 
                    salary: "",
                    salaryBankAccountNumber: "",
                    tinNumber: "",
                    transportAllowance: ""
                });
                if (!userId) {
                    await onCreated?.();
                    onClose?.();
                }
            }
        } catch (error) {
            toast({
                title: userId ? "User update failed." : "User creation failed.",
                description: error.response?.data?.message || "An error occurred.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Container maxW="container.md" py={6}>
            <VStack spacing={6} align="stretch">
                <Box textAlign="center">
                    <Heading as="h1" size="xl" mb={2}>
                        {userId ? "Update Employee Account" : "Register Employee & Establish Salary"}
                    </Heading>
                    <Text fontSize="sm" color="gray.500">
                        Configures personnel records, salary bank account, and establishes monthly Ethiopian payroll automatically.
                    </Text>
                </Box>

                <Box
                    w="full"
                    bg={cardBg}
                    p={6}
                    rounded="xl"
                    shadow="sm"
                    borderWidth="1px"
                    borderColor={useColorModeValue("gray.200", "gray.700")}
                >
                    <VStack spacing={4} align="stretch">
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold">Username</FormLabel>
                                <Input
                                    placeholder="Username (e.g. john_doe)"
                                    name="create_new_username"
                                    autoComplete="off"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold">Full Legal Name</FormLabel>
                                <Input
                                    placeholder="Full Name (e.g. Abebe Kebede)"
                                    name="create_new_fullname"
                                    autoComplete="off"
                                    value={newUser.fullName}
                                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                />
                            </FormControl>
                        </SimpleGrid>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold">Email Address</FormLabel>
                                <Input
                                    placeholder="Email (e.g. employee@tradethiopia.com)"
                                    name="create_new_email"
                                    type="email"
                                    autoComplete="off"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </FormControl>

                            <FormControl isRequired={!userId}>
                                <FormLabel fontSize="xs" fontWeight="bold">Password</FormLabel>
                                <Input
                                    placeholder={userId ? "Leave blank to keep current" : "Temporary Password"}
                                    name="create_new_password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </FormControl>
                        </SimpleGrid>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold">Role</FormLabel>
                                <Select
                                    placeholder="Select Role"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="HR">HR</option>
                                    <option value="sales">Sales</option>
                                    <option value="Enisra">Enisra</option>
                                    <option value="customerservice">Customer Service</option>
                                    <option value="CustomerSuccessManager">Customer Success Manager</option>
                                    <option value="SocialmediaManager">Socialmedia Manager</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="tradextv">tradextv</option>
                                    <option value="IT">IT</option>
                                    <option value="finance">Finance</option>
                                    <option value="Instructor">Instructor</option>
                                    <option value="EventManager">Event Manager</option>
                                    <option value="salesmanager">Sales Manager</option>
                                    <option value="reception">Reception</option>
                                    <option value="COO">COO</option>
                                    <option value="COO2">COO 2 (2 COO)</option>
                                    <option value="CEO">CEO</option>
                                    <option value="tessbinadmin">Tessbin Admin</option>
                                    <option value="employee">General Employee</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold">Department</FormLabel>
                                <Input
                                    placeholder="Department (e.g. IT, Sales, HR, Finance)"
                                    name="department"
                                    value={newUser.department}
                                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                />
                            </FormControl>
                        </SimpleGrid>

                        <Divider my={2} />

                        {/* Salary & Ethiopian Payroll Setting Section */}
                        <HStack spacing={2} align="center" mb={1}>
                            <Icon as={FiDollarSign} color="teal.500" />
                            <Text fontSize="sm" fontWeight="bold" color="teal.700">
                                Ethiopian Payroll & Banking Information
                            </Text>
                            <Badge colorScheme="teal" fontSize="10px">Statutory</Badge>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <FormControl isRequired>
                                <FormLabel fontSize="xs" fontWeight="bold">Monthly Basic Salary (ETB)</FormLabel>
                                <Input
                                    placeholder="e.g. 15000"
                                    name="salary"
                                    type="number"
                                    value={newUser.salary}
                                    onChange={(e) => setNewUser({ ...newUser, salary: e.target.value })}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold">Non-Taxable Transport Allowance (ETB)</FormLabel>
                                <Input
                                    placeholder="Optional (e.g. 2000)"
                                    name="transportAllowance"
                                    type="number"
                                    value={newUser.transportAllowance}
                                    onChange={(e) => setNewUser({ ...newUser, transportAllowance: e.target.value })}
                                />
                            </FormControl>
                        </SimpleGrid>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold">Salary Bank Account Number (CBE)</FormLabel>
                                <Input
                                    placeholder="e.g. 1000123456789 (Commercial Bank of Ethiopia)"
                                    name="salaryBankAccountNumber"
                                    value={newUser.salaryBankAccountNumber}
                                    onChange={(e) => setNewUser({ ...newUser, salaryBankAccountNumber: e.target.value })}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold">Tax Identification Number (TIN)</FormLabel>
                                <Input
                                    placeholder="e.g. 0012345678"
                                    name="tinNumber"
                                    value={newUser.tinNumber}
                                    onChange={(e) => setNewUser({ ...newUser, tinNumber: e.target.value })}
                                />
                            </FormControl>
                        </SimpleGrid>

                        {/* Live Ethiopian Tax & Net Salary Breakdown Card */}
                        {taxPreview && (
                            <Box
                                mt={2}
                                p={4}
                                rounded="lg"
                                bg={previewBg}
                                borderWidth="1px"
                                borderColor={previewBorder}
                            >
                                <HStack justify="space-between" mb={2}>
                                    <HStack spacing={2}>
                                        <Icon as={FiShield} color="teal.600" />
                                        <Text fontSize="xs" fontWeight="bold" color="teal.800">
                                            🇪🇹 Ethiopian Regulatory Payroll Breakdown (Live Preview)
                                        </Text>
                                    </HStack>
                                    <Badge colorScheme="green" fontSize="10px">
                                        Proclamation Compliant
                                    </Badge>
                                </HStack>

                                <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={3} fontSize="xs">
                                    <Box>
                                        <Text color="gray.500">Basic Salary:</Text>
                                        <Text fontWeight="bold">{formatETB(taxPreview.basicSalary)}</Text>
                                    </Box>
                                    <Box>
                                        <Text color="gray.500">Income Tax (Schedule A):</Text>
                                        <Text fontWeight="bold" color="red.500">
                                            -{formatETB(taxPreview.incomeTax)}
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text color="gray.500">Employee Pension (7%):</Text>
                                        <Text fontWeight="bold" color="red.500">
                                            -{formatETB(taxPreview.pension)}
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text color="gray.500">Employer Pension (11%):</Text>
                                        <Text fontWeight="bold" color="purple.600">
                                            +{formatETB(taxPreview.employerPension)} (POEPF)
                                        </Text>
                                    </Box>
                                    {taxPreview.transportAllowance > 0 && (
                                        <Box>
                                            <Text color="gray.500">Transport (Non-Tax):</Text>
                                            <Text fontWeight="bold" color="green.600">
                                                +{formatETB(taxPreview.transportAllowance)}
                                            </Text>
                                        </Box>
                                    )}
                                    <Box>
                                        <Text color="teal.700" fontWeight="bold">Estimated Net Payable:</Text>
                                        <Text fontWeight="extrabold" fontSize="sm" color="teal.700">
                                            {formatETB(taxPreview.netSalary)}
                                        </Text>
                                    </Box>
                                </SimpleGrid>
                            </Box>
                        )}

                        <Button 
                            colorScheme="teal" 
                            size="lg"
                            mt={2}
                            onClick={handleSubmit} 
                            w="full"
                            leftIcon={<Icon as={userId ? FiUserCheck : FiDollarSign} />}
                        >
                            {userId ? "Update Employee & Sync Payroll" : "Establish Employee & Generate Payroll"}
                        </Button>
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
};

export default CreateOrUpdatePage;
