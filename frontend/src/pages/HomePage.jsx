import { 
    Container, 
    Text, 
    VStack, 
    SimpleGrid, 
    Spinner, 
    Alert, 
    AlertIcon, 
    Input, 
    InputGroup, 
    InputLeftElement, 
    Select, 
    HStack, 
    Box, 
    IconButton, 
    Button,
    Drawer, 
    DrawerBody, 
    DrawerCloseButton, 
    DrawerContent, 
    DrawerHeader, 
    DrawerOverlay, 
    useDisclosure, 
    useColorModeValue,
    Flex,
    Heading,
    Checkbox,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    ListItem,
    UnorderedList,
    useToast
} from "@chakra-ui/react";
import { useEffect, useState, useCallback } from "react";
import { useUserStore } from '../store/user.js';
import UserCard from '../components/UserCard';
import { SearchIcon, AddIcon, RepeatIcon, ArrowUpDownIcon } from '@chakra-ui/icons'; 
import CreatePage from './CreatePage';

const HomePage = () => {
    const { fetchUsers, users, loading, error, updateUser } = useUserStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('active');
    const [sortOrder, setSortOrder] = useState('asc');
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Bulk selection state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());
    const [bulkActionType, setBulkActionType] = useState(null); // 'activate' | 'deactivate'
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isProcessingBulk, setIsProcessingBulk] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSelectToggle = useCallback((userId) => {
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    }, []);

    const toggleSelectionMode = () => {
        setIsSelectionMode((prev) => {
            if (prev) {
                setSelectedUserIds(new Set());
            }
            return !prev;
        });
    };

    const handleClearSelection = () => {
        setSelectedUserIds(new Set());
    };

    const handleBulkActionClick = (type) => {
        setBulkActionType(type);
        setIsBulkModalOpen(true);
    };

    const executeBulkAction = async () => {
        setIsProcessingBulk(true);
        const targetStatus = bulkActionType === "activate" ? "active" : "inactive";
        const userListToUpdate = users.filter((u) => selectedUserIds.has(u._id));
        
        try {
            const updatePromises = userListToUpdate.map((u) => 
                updateUser(u._id, { ...u, status: targetStatus })
            );
            
            await Promise.all(updatePromises);
            
            toast({
                title: "Bulk Action Completed",
                description: `Successfully ${bulkActionType === "activate" ? "activated" : "deactivated"} ${userListToUpdate.length} accounts.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            
            setSelectedUserIds(new Set());
            setIsSelectionMode(false);
            setIsBulkModalOpen(false);
            fetchUsers(true);
        } catch (err) {
            console.error("Bulk update failed:", err);
            toast({
                title: "Bulk Action Failed",
                description: err.message || "An error occurred during bulk update.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsProcessingBulk(false);
        }
    };

    const filteredUsers = users.filter(user => {
        // Filter out users with username 
        const isValidUser = user.username !== "." && user.username !== "..";
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole ? user.role === selectedRole : true;
        const matchesStatus = selectedStatus === 'all' ? true : user.status === selectedStatus;
        return isValidUser && matchesSearch && matchesRole && matchesStatus;
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (sortOrder === 'asc') {
            return a.username.localeCompare(b.username);
        } else {
            return b.username.localeCompare(a.username);
        }
    });

    const handleRefresh = () => {
        fetchUsers();
    };

    const toggleSortOrder = () => {
        setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
    };

    return (
        <Container maxW='container.xl' py={6} px={4} mt={2}>
            <VStack spacing={8} align="stretch" w="full">
                {/* Modern Hero Header */}
                <Box 
                    p={{ base: 5, md: 7 }} 
                    borderRadius="2xl" 
                    bg={useColorModeValue("white", "gray.800")}
                    border="1px solid"
                    borderColor={useColorModeValue("gray.100", "gray.700")}
                >
                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                        <Box>
                            <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
                                People Management
                            </Text>
                            <Heading size="lg" fontWeight="800" mb={1} color={useColorModeValue("gray.900", "white")}>
                                User Accounts Directory
                            </Heading>
                            <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                                Manage system access roles, toggle employment status, and update personnel details.
                            </Text>
                        </Box>
                        <HStack spacing={2}>
                            <Text fontSize="xs" color="gray.400" fontWeight="600">{sortedUsers.length} users</Text>
                        </HStack>
                    </Flex>
                </Box>

                {/* Filter and Action Panel */}
                <Box 
                    width="full" 
                    bg={useColorModeValue("white", "gray.800")} 
                    p={4} 
                    borderRadius="2xl" 
                    border="1px solid"
                    borderColor={useColorModeValue("gray.100", "gray.700")}
                >
                    <Flex 
                        gap={4} 
                        alignItems="center" 
                        justifyContent="space-between" 
                        direction={{ base: "column", lg: "row" }}
                        wrap="wrap"
                    >
                        <InputGroup maxW={{ base: "100%", lg: "400px" }}>
                            <InputLeftElement pointerEvents="none" h="full">
                                <SearchIcon color="gray.400" />
                            </InputLeftElement>
                            <Input
                                type="text"
                                placeholder="Search by username or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="md"
                                borderRadius="xl"
                                focusBorderColor="blue.400"
                                bg={useColorModeValue("gray.50", "gray.900")}
                                border="1px solid"
                                borderColor={useColorModeValue("gray.200", "gray.700")}
                            />
                        </InputGroup>
                        <HStack spacing={3} width={{ base: "100%", lg: "auto" }} flexWrap="wrap" justify={{ base: "flex-start", lg: "flex-end" }}>
                            <Select 
                                placeholder="Select role" 
                                onChange={(e) => setSelectedRole(e.target.value)} 
                                maxW={{ base: "100%", sm: "180px" }}
                                bg={useColorModeValue("gray.50", "gray.900")}
                                borderRadius="xl"
                                border="1px solid"
                                borderColor={useColorModeValue("gray.200", "gray.700")}
                            >
                                <option value="admin">Admin</option>
                                <option value="sales">Sales</option>
                                <option value="customerservice">Customer Service</option>
                                <option value="CustomerSuccessManager">Customer Success Manager</option>
                                <option value="SocialmediaManager">Socialmedia Manager</option>
                                <option value="salesmanager">Sales Manager</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="tradextv">tradextv</option>
                                <option value="IT">IT</option>
                                <option value="HR">HR</option>
                                <option value="Enisra">Enisra</option>
                                <option value="Instructor">Instructor</option>
                                <option value="EventManager">EventManager</option>          
                            </Select>
                            <Select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                maxW={{ base: "100%", sm: "180px" }}
                                bg={useColorModeValue("gray.50", "gray.900")}
                                borderRadius="xl"
                                border="1px solid"
                                borderColor={useColorModeValue("gray.200", "gray.700")}
                            >
                                <option value="active">Active users</option>
                                <option value="inactive">Deactivated users</option>
                                <option value="all">All users</option>
                            </Select>
                            <Button
                                leftIcon={<RepeatIcon />}
                                colorScheme={isSelectionMode ? "blue" : "gray"}
                                variant={isSelectionMode ? "solid" : "outline"}
                                onClick={toggleSelectionMode}
                                size="md"
                                borderRadius="xl"
                                shadow="sm"
                            >
                                {isSelectionMode ? "Exit Bulk Mode" : "Bulk Selection"}
                            </Button>
                            <Button
                                leftIcon={<AddIcon />}
                                colorScheme="teal"
                                onClick={onOpen}
                                size="md"
                                borderRadius="xl"
                                shadow="sm"
                                _hover={{ transform: "translateY(-1px)", shadow: "md" }}
                            >
                                Create New Account
                            </Button>
                            <IconButton 
                                aria-label="Refresh Users" 
                                icon={<RepeatIcon />} 
                                colorScheme="blue" 
                                onClick={handleRefresh}
                                size="md"
                                variant="outline"
                                borderRadius="xl"
                            />
                            <IconButton 
                                aria-label="Sort Users" 
                                icon={<ArrowUpDownIcon />} 
                                colorScheme="purple" 
                                onClick={toggleSortOrder}
                                size="md"
                                variant="outline"
                                borderRadius="xl"
                            />
                        </HStack>
                    </Flex>
                </Box>
 
                <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
                    <DrawerOverlay />
                    <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerHeader>Create New Account</DrawerHeader>
                        <DrawerBody>
                            <CreatePage onClose={onClose} onCreated={fetchUsers} />
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
 
                {loading ? (
                    <Spinner size="xl" color="blue.500" />
                ) : error ? (
                    <Alert status="error" variant="left-accent">
                        <AlertIcon />
                        {error}
                    </Alert>
                ) : sortedUsers.length === 0 ? (
                    <Text fontSize="xl" textAlign="center" fontWeight='bold' color="gray.500">
                        No User found! 😢{" "}
                    </Text>
                ) : (
                    <SimpleGrid
                        columns={{
                            base: 1,
                            md: 2,
                            lg: 3
                        }}
                        spacing={6}
                        w="full"
                    >
                        {sortedUsers.map((user) => (
                            <UserCard 
                                key={user._id} 
                                user={user} 
                                isSelectionMode={isSelectionMode}
                                isSelected={selectedUserIds.has(user._id)}
                                onSelectToggle={() => handleSelectToggle(user._id)}
                            />
                        ))}
                    </SimpleGrid>
                )}
            </VStack>

            {/* Floating Bulk Actions Bar */}
            {isSelectionMode && selectedUserIds.size > 0 && (
                <Box
                    position="fixed"
                    bottom="24px"
                    left="50%"
                    transform="translateX(-50%)"
                    zIndex="100"
                    bg={useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(23, 25, 35, 0.95)")}
                    backdropFilter="blur(16px)"
                    border="1px solid"
                    borderColor={useColorModeValue("blue.150", "blue.800")}
                    py={3}
                    px={6}
                    borderRadius="2xl"
                    boxShadow="2xl"
                    transition="all 0.3s ease-in-out"
                    w={{ base: "90%", md: "auto" }}
                >
                    <HStack spacing={6} justify="space-between" align="center" flexWrap="wrap" gap={3}>
                        <Text fontWeight="bold" fontSize="sm" color={useColorModeValue("blue.800", "blue.200")}>
                            {selectedUserIds.size} {selectedUserIds.size === 1 ? "account" : "accounts"} selected
                        </Text>
                        <HStack spacing={3}>
                            <Button
                                colorScheme="green"
                                size="sm"
                                borderRadius="xl"
                                onClick={() => handleBulkActionClick("activate")}
                            >
                                Activate
                            </Button>
                            <Button
                                colorScheme="red"
                                size="sm"
                                borderRadius="xl"
                                onClick={() => handleBulkActionClick("deactivate")}
                            >
                                Deactivate
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                borderRadius="xl"
                                onClick={handleClearSelection}
                            >
                                Clear
                            </Button>
                        </HStack>
                    </HStack>
                </Box>
            )}

            {/* Bulk Action Confirmation Modal */}
            <Modal isOpen={isBulkModalOpen} onClose={() => !isProcessingBulk && setIsBulkModalOpen(false)}>
                <ModalOverlay backdropFilter="blur(4px)" />
                <ModalContent borderRadius="2xl">
                    <ModalHeader fontWeight="bold">Confirm Bulk {bulkActionType === "activate" ? "Activation" : "Deactivation"}</ModalHeader>
                    <ModalCloseButton isDisabled={isProcessingBulk} />
                    <ModalBody>
                        <VStack align="stretch" spacing={4}>
                            <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                                You are about to set the status of the following <strong>{selectedUserIds.size}</strong> accounts to <strong>{bulkActionType === "activate" ? "Active" : "Inactive"}</strong>:
                            </Text>
                            <Box 
                                maxH="180px" 
                                overflowY="auto" 
                                p={3} 
                                bg={useColorModeValue("gray.50", "gray.900")} 
                                borderRadius="xl"
                                border="1px solid"
                                borderColor={useColorModeValue("gray.150", "gray.800")}
                            >
                                <UnorderedList spacing={1} fontSize="xs" color="gray.500" styleType="none" ml={0}>
                                    {users.filter(u => selectedUserIds.has(u._id)).map(u => (
                                        <ListItem key={u._id} display="flex" alignItems="center" gap={2} py={0.5}>
                                            <Box w={1.5} h={1.5} borderRadius="full" bg={bulkActionType === "activate" ? "green.400" : "red.400"} />
                                            {u.username} ({u.email})
                                        </ListItem>
                                    ))}
                                </UnorderedList>
                            </Box>
                            <Text fontSize="xs" fontWeight="bold" color="red.500">
                                {bulkActionType === "deactivate" && "⚠️ Deactivated accounts will be immediately removed from all task, asset, and customer assignment dropdowns."}
                                {bulkActionType === "activate" && "⚡ Activated accounts will instantly become available for assignments across the platform."}
                            </Text>
                        </VStack>
                    </ModalBody>
                    <ModalFooter gap={2}>
                        <Button 
                            colorScheme={bulkActionType === "activate" ? "green" : "red"} 
                            onClick={executeBulkAction}
                            isLoading={isProcessingBulk}
                            loadingText="Updating..."
                            borderRadius="xl"
                        >
                            Confirm
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsBulkModalOpen(false)}
                            isDisabled={isProcessingBulk}
                            borderRadius="xl"
                        >
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Container>
    );
};

export default HomePage;
