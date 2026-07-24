import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    Button,
    useToast,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    FormControl,
    FormLabel,
    Input,
    Divider,
    Flex,
    SimpleGrid,
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    VStack,
    Select,
    Link,
    Badge,
    Icon,
    ModalCloseButton,
    useColorModeValue,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FiBriefcase, FiUsers } from 'react-icons/fi';
import axios from 'axios';
import DocumentUploadForm from './EmployeeDocumentUploadForm';

const DocumentList = () => {
    const [documents, setDocuments] = useState([]);
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editDocument, setEditDocument] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isEmployeeDrawerOpen, setIsEmployeeDrawerOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [employeeName, setEmployeeName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [department, setDepartment] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [editCategoryId, setEditCategoryId] = useState('');
    const toast = useToast();

    useEffect(() => {
        fetchDocuments();
        fetchCategories();
    }, []);

    useEffect(() => {
        const filtered = documents.filter(doc => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = [doc.title, doc.employeeName, doc.department, doc.category?.name]
                .filter(Boolean)
                .some(value => value.toLowerCase().includes(query));
            return matchesSearch &&
                (selectedCategory ? doc.category?._id === selectedCategory : true) &&
                (selectedDepartment ? doc.department === selectedDepartment : true);
        });
        setFilteredDocuments(filtered);
    }, [searchQuery, documents, selectedCategory, selectedDepartment]);

    const fetchDocuments = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/documents`, {
                params: { section: 'employees' }, // Add section as query parameter
            });
            setDocuments(res.data);
        } catch (error) {
            toast({
                title: 'Error fetching documents.',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
            const filteredCategories = res.data.data.filter(category => category.section === 'employees'); // Filter here
            setCategories(filteredCategories); // Set the filtered categories
        } catch (error) {
            toast({
                title: 'Error fetching categories.',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const handleDelete = async (documentId) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/documents/${documentId}`);
                setDocuments(documents.filter((doc) => doc._id !== documentId));
                toast({
                    title: 'Document deleted.',
                    description: 'The document has been deleted successfully.',
                    status: 'success',
                    duration: 3000,
                });
            } catch (error) {
                toast({
                    title: 'Error deleting document.',
                    description: error.message,
                    status: 'error',
                    duration: 3000,
                });
            }
        }
    };

    const handleEditClick = (doc) => {
        setEditDocument(doc);
        setTitle(doc.title);
        setEmployeeName(doc.employeeName || '');
        setCategoryId(doc.category?._id || '');
        setDepartment(doc.department || '');
        setIsEditOpen(true);
    };

    const handleEditSave = async () => {
        try {
            const payload = {};
            if (title !== editDocument.title) payload.title = title;
            if (employeeName !== (editDocument.employeeName || '')) payload.employeeName = employeeName;
            if (categoryId !== editDocument.category?._id) payload.category = categoryId;
            if (department !== editDocument.department) payload.department = department;

            await axios.patch(`${import.meta.env.VITE_API_URL}/api/documents/${editDocument._id}`, payload);
            fetchDocuments();
            setIsEditOpen(false);
            toast({
                title: 'Document updated.',
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: 'Error updating document.',
                description: error.response?.data?.error || 'An error occurred.',
                status: 'error',
                duration: 3000,
            });
        }
    };

    const createCategory = async () => {
        if (!newCategoryName) {
            toast({
                title: 'Missing fields',
                description: 'Please provide a category name.',
                status: 'warning',
                duration: 5000,
                isClosable: true,
            });
            return;
        }
    
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/categories`, {
                name: newCategoryName,
                section: 'employees', // Ensure this is included
            });
    
            setCategories([...categories, res.data]);
            setNewCategoryName('');
            setIsDrawerOpen(false);
            toast({
                title: 'Category Created.',
                description: 'The category has been created successfully.',
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: 'Error creating category.',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const handleCategoryEdit = (category) => {
        setEditCategoryId(category._id);
        setNewCategoryName(category.name);
        setIsEditingCategory(true);
    };

    const handleSaveCategoryEdit = async () => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/categories/${editCategoryId}`, {
                name: newCategoryName,
            });

            setCategories(categories.map(cat => cat._id === editCategoryId ? res.data : cat));
            setNewCategoryName('');
            setIsEditingCategory(false);
            toast({
                title: 'Category updated.',
                description: 'The category has been updated successfully.',
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: 'Error updating category.',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/categories/${categoryId}`);
                setCategories(categories.filter((cat) => cat._id !== categoryId));
                toast({
                    title: 'Category deleted.',
                    description: 'The category has been deleted successfully.',
                    status: 'success',
                    duration: 3000,
                });
            } catch (error) {
                toast({
                    title: 'Error deleting category.',
                    description: error.message,
                    status: 'error',
                    duration: 3000,
                });
            }
        }
    };

    const getEmployeeKey = (doc) => (doc.employeeName || doc.title || 'Unknown Employee').trim().toLowerCase();

    const employeeGroups = Object.values(filteredDocuments.reduce((groups, doc) => {
        const key = getEmployeeKey(doc);
        if (!groups[key]) {
            groups[key] = {
                key,
                employeeName: doc.employeeName || doc.title || 'Unknown Employee',
                documents: [],
            };
        }
        groups[key].documents.push(doc);
        return groups;
    }, {})).sort((a, b) => a.employeeName.localeCompare(b.employeeName));

    const handleEmployeeOpen = (employeeGroup) => {
        const allEmployeeDocuments = documents.filter(doc => getEmployeeKey(doc) === employeeGroup.key);
        setSelectedEmployee({
            ...employeeGroup,
            documents: allEmployeeDocuments,
        });
        setIsEmployeeDrawerOpen(true);
    };

    const requiredEmployeeDocumentTypes = [
        {
            label: 'Employee Leave',
            keywords: ['employee leave', 'leave'],
        },
        {
            label: 'Employment Contract',
            keywords: ['employment contract', 'contract'],
        },
        {
            label: 'Warning letters',
            keywords: ['warning letter', 'warning letters', 'warning'],
        },
        {
            label: 'Certifications',
            keywords: ['certification', 'certifications', 'certificate'],
        },
        {
            label: 'Supportive letters',
            keywords: ['supportive letter', 'supportive letters', 'support letter'],
        },
        {
            label: 'Recommendations',
            keywords: ['recommendation', 'recommendations', 'recommendation letter'],
        },
        {
            label: 'Guarantor Files',
            keywords: ['guarantor', 'guarantor file', 'guarantor files'],
        },
        {
            label: 'Employee Educational Background',
            keywords: ['educational background', 'education', 'educational', 'degree', 'diploma', 'transcript'],
        },
        {
            label: 'Handover',
            keywords: ['handover', 'hand over'],
        },
        {
            label: 'Medical Certificate',
            keywords: ['medical certificate', 'medical', 'health certificate'],
        },
        {
            label: 'Part Time Employment Contract',
            keywords: ['part time employment contract', 'part-time employment contract', 'part time contract', 'part-time contract'],
        },
        {
            label: 'Employee Leave Request',
            keywords: ['employee leave request', 'leave request'],
        },
        {
            label: 'Job Experience Letter',
            keywords: ['job experience letter', 'experience letter', 'work experience'],
        },
        {
            label: 'Termination of Employment',
            keywords: ['termination of employment', 'termination', 'resignation', 'leaving', 'exit'],
        },
    ];
    const documentSearchText = (doc) => [doc.title, doc.category?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    const getDocumentsForType = (employeeDocuments, documentType) => employeeDocuments.filter((doc) => {
        const searchText = documentSearchText(doc);
        return documentType.keywords.some((keyword) => searchText.includes(keyword));
    });

    const getOtherDocuments = (employeeDocuments) => employeeDocuments.filter((doc) => {
        const searchText = documentSearchText(doc);
        return !requiredEmployeeDocumentTypes.some((documentType) =>
            documentType.keywords.some((keyword) => searchText.includes(keyword))
        );
    });

    const location = useLocation();
    const departments = [...new Set(documents.map(doc => doc.department).filter(Boolean))];

    return (
        <Box p={{ base: '2', md: '4' }} maxW="1200px" mx="auto" mt={{ base: '0', sm: '-16', md: '-35', lg: '-75' }}>
            {/* Top Navigation Tabs */}
            <Flex justify="center" mb={5} gap={3} bg={useColorModeValue('white', 'gray.800')} p={2.5} borderRadius="xl" boxShadow="sm" borderWidth="1px">
                <Button
                    as={RouterLink}
                    to="/documentlist"
                    size="sm"
                    variant={location.pathname === '/documentlist' ? 'solid' : 'ghost'}
                    colorScheme="teal"
                    borderRadius="lg"
                    px={5}
                    fontWeight="700"
                    leftIcon={<Icon as={FiBriefcase} />}
                >
                    Company Documents
                </Button>
                <Button
                    as={RouterLink}
                    to="/EmployeeDocument"
                    size="sm"
                    variant={location.pathname === '/EmployeeDocument' ? 'solid' : 'ghost'}
                    colorScheme="teal"
                    borderRadius="lg"
                    px={5}
                    fontWeight="700"
                    leftIcon={<Icon as={FiUsers} />}
                >
                    Employee Documents
                </Button>
            </Flex>

            <Heading as="h2" size="lg" mb="4" textAlign="center" color="teal.600">
                Employee Document Management
            </Heading>

            {/* Document Upload Form */}
            <DocumentUploadForm mb={4} fetchDocuments={fetchDocuments} />

            <Flex direction={{ base: 'column', md: 'row' }} mt={4}>
                {/* Sidebar for Categories */}
                <Box
                    bg={useColorModeValue('white', 'gray.700')}
                    borderWidth="1px"
                    borderRadius="md"
                    boxShadow="lg"
                    p="4"
                    width={{ base: '100%', md: '30%' }}
                    mb={{ base: 4, md: 0 }}
                >
                    <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="md" color="teal.600">Categories</Heading>
                        <IconButton
                            icon={<AddIcon />}
                            colorScheme="teal"
                            onClick={() => {
                                setIsDrawerOpen(true);
                                setIsEditingCategory(false);
                                setNewCategoryName('');
                            }}
                            aria-label="Add Category"
                            size="sm"
                        />
                    </Flex>

                    {/* Placeholder for clearing selected category */}
                    <Button
                        variant="outline"
                        colorScheme="gray"
                        onClick={() => setSelectedCategory('')}
                        display={selectedCategory ? 'block' : 'none'}
                        mb={4}
                    >
                        Clear Selected Category
                    </Button>

                    <Divider borderColor="teal.500" mb="6" />
                    <VStack align="start" spacing={2} width="100%">
                        {categories.map((category) => (
                            <Button
                                key={category._id}
                                variant="outline"
                                colorScheme={selectedCategory === category._id ? 'teal' : 'gray'}
                                onClick={() => setSelectedCategory(category._id)}
                                width="100%"
                                justifyContent="flex-start"
                            >
                                {category.name}
                            </Button>
                        ))}
                    </VStack>
                </Box>

                {/* Vertical Divider */}
                <Divider orientation="vertical" borderColor="teal.500" display={{ base: 'none', md: 'block' }} mx={4} />

                {/* Document List Area */}
                <Box flex="1">
                    <Flex direction={{ base: 'column', md: 'row' }} align="center" mb="4">
                        {/* Search Input */}
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by employee, document, category, or department"
                            width="auto"
                            maxWidth="550px"
                            focusBorderColor="teal.500"
                            mb={{ base: '4', md: '0' }}
                            mr={{ md: '4' }}
                        />

                        {/* Department Dropdown */}
                        <Select
                            placeholder="Select Department"
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            width="auto"
                            maxWidth="400px"
                            focusBorderColor="teal.500"
                        >
                            {departments.map(department => (
                                <option key={department} value={department}>{department}</option>
                            ))}
                        </Select>
                    </Flex>

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="4">
                        {employeeGroups.map((employeeGroup) => {
                            const departmentsForEmployee = [...new Set(employeeGroup.documents.map(doc => doc.department).filter(Boolean))];
                            const categoriesForEmployee = [...new Set(employeeGroup.documents.map(doc => doc.category?.name).filter(Boolean))];
                            return (
                                <Box
                                    key={employeeGroup.key}
                                    p="4"
                                    borderWidth="1px"
                                    borderRadius="md"
                                    boxShadow="lg"
                                    transition="all 0.3s ease"
                                    cursor="pointer"
                                    _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }}
                                    onClick={() => handleEmployeeOpen(employeeGroup)}
                                >
                                    <Heading as="h3" size="sm" mb="2" isTruncated>
                                        {employeeGroup.employeeName}
                                    </Heading>
                                    <Divider borderColor="teal.500" mb="2" />
                                    <Text mb="2" color="gray.600" fontSize="sm">
                                        <strong>Department:</strong> {departmentsForEmployee.join(', ') || 'N/A'}
                                    </Text>
                                    <Text mb="2" color="gray.600" fontSize="sm">
                                        <strong>Total Files:</strong> {employeeGroup.documents.length}
                                    </Text>
                                    <Flex gap={2} wrap="wrap" mb="3">
                                        {categoriesForEmployee.slice(0, 4).map(category => (
                                            <Badge key={category} colorScheme="teal">{category}</Badge>
                                        ))}
                                        {categoriesForEmployee.length > 4 && <Badge>+{categoriesForEmployee.length - 4}</Badge>}
                                    </Flex>
                                    <Button colorScheme="teal" variant="outline" size="sm">
                                        View All Employee Files
                                    </Button>
                                </Box>
                            );
                        })}
                    </SimpleGrid>


                    <Drawer
                        isOpen={isEmployeeDrawerOpen}
                        placement="right"
                        size="lg"
                        onClose={() => setIsEmployeeDrawerOpen(false)}
                    >
                        <DrawerOverlay />
                        <DrawerContent>
                            <DrawerCloseButton />
                            <DrawerHeader>
                                <Heading size="md">{selectedEmployee?.employeeName || 'Employee Documents'}</Heading>
                                <Text fontSize="sm" color="gray.500" mt={1}>
                                    All uploaded employee files and information
                                </Text>
                            </DrawerHeader>
                            <DrawerBody>
                                {selectedEmployee && (
                                    <VStack align="stretch" spacing={4}>
                                        <Box p={4} borderWidth="1px" borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                                            <Text><strong>Employee:</strong> {selectedEmployee.employeeName}</Text>
                                            <Text><strong>Departments:</strong> {[...new Set(selectedEmployee.documents.map(doc => doc.department).filter(Boolean))].join(', ') || 'N/A'}</Text>
                                            <Text><strong>Total Files:</strong> {selectedEmployee.documents.length}</Text>
                                        </Box>

                                        {requiredEmployeeDocumentTypes.map((documentType) => {
                                            const matchingDocuments = getDocumentsForType(selectedEmployee.documents, documentType);
                                            return (
                                                <Box key={documentType.label} p={4} borderWidth="1px" borderRadius="md" boxShadow="sm">
                                                    <Flex justify="space-between" align="center" mb={matchingDocuments.length ? 3 : 0} gap={3} wrap="wrap">
                                                        <Heading size="sm">{documentType.label}</Heading>
                                                        <Badge colorScheme={matchingDocuments.length ? 'green' : 'red'}>
                                                            {matchingDocuments.length ? `${matchingDocuments.length} found` : 'Not found'}
                                                        </Badge>
                                                    </Flex>

                                                    {matchingDocuments.length ? (
                                                        <VStack align="stretch" spacing={3}>
                                                            {matchingDocuments.map((doc) => (
                                                                <Flex key={doc._id} justify="space-between" align="flex-start" gap={3} wrap="wrap" borderTopWidth="1px" pt={3}>
                                                                    <Box>
                                                                        <Text fontWeight="semibold">{doc.title}</Text>
                                                                        <Text fontSize="sm" color="gray.600"><strong>Category:</strong> {doc.category?.name || 'N/A'}</Text>
                                                                        <Text fontSize="sm" color="gray.600"><strong>Department:</strong> {doc.department || 'N/A'}</Text>
                                                                        <Text fontSize="sm" color="gray.600"><strong>Uploaded:</strong> {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}</Text>
                                                                    </Box>
                                                                    <Flex gap={2} onClick={(event) => event.stopPropagation()}>
                                                                        <Button as="a" href={doc.fileUrl} target="_blank" rel="noopener noreferrer" colorScheme="teal" size="sm">
                                                                            View File
                                                                        </Button>
                                                                        <IconButton
                                                                            icon={<EditIcon />}
                                                                            colorScheme="blue"
                                                                            aria-label="Edit document"
                                                                            size="sm"
                                                                            onClick={() => handleEditClick(doc)}
                                                                        />
                                                                        <IconButton
                                                                            icon={<DeleteIcon />}
                                                                            colorScheme="red"
                                                                            aria-label="Delete document"
                                                                            size="sm"
                                                                            onClick={() => handleDelete(doc._id)}
                                                                        />
                                                                    </Flex>
                                                                </Flex>
                                                            ))}
                                                        </VStack>
                                                    ) : (
                                                        <Text fontSize="sm" color="red.500" mt={2}>
                                                            Not found for this employee.
                                                        </Text>
                                                    )}
                                                </Box>
                                            );
                                        })}

                                        {getOtherDocuments(selectedEmployee.documents).length > 0 && (
                                            <Box p={4} borderWidth="1px" borderRadius="md" boxShadow="sm">
                                                <Heading size="sm" mb={3}>Other Documents</Heading>
                                                <VStack align="stretch" spacing={3}>
                                                    {getOtherDocuments(selectedEmployee.documents).map((doc) => (
                                                        <Flex key={doc._id} justify="space-between" align="flex-start" gap={3} wrap="wrap" borderTopWidth="1px" pt={3}>
                                                            <Box>
                                                                <Text fontWeight="semibold">{doc.title}</Text>
                                                                <Text fontSize="sm" color="gray.600"><strong>Category:</strong> {doc.category?.name || 'N/A'}</Text>
                                                                <Text fontSize="sm" color="gray.600"><strong>Department:</strong> {doc.department || 'N/A'}</Text>
                                                                <Text fontSize="sm" color="gray.600"><strong>Uploaded:</strong> {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}</Text>
                                                            </Box>
                                                            <Flex gap={2} onClick={(event) => event.stopPropagation()}>
                                                                <Button as="a" href={doc.fileUrl} target="_blank" rel="noopener noreferrer" colorScheme="teal" size="sm">
                                                                    View File
                                                                </Button>
                                                                <IconButton
                                                                    icon={<EditIcon />}
                                                                    colorScheme="blue"
                                                                    aria-label="Edit document"
                                                                    size="sm"
                                                                    onClick={() => handleEditClick(doc)}
                                                                />
                                                                <IconButton
                                                                    icon={<DeleteIcon />}
                                                                    colorScheme="red"
                                                                    aria-label="Delete document"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(doc._id)}
                                                                />
                                                            </Flex>
                                                        </Flex>
                                                    ))}
                                                </VStack>
                                            </Box>
                                        )}                                    </VStack>
                                )}
                            </DrawerBody>
                        </DrawerContent>
                    </Drawer>

                    {/* Drawer for Categories */}
                    <Drawer
                        isOpen={isDrawerOpen}
                        placement="right"
                        onClose={() => setIsDrawerOpen(false)}
                    >
                        <DrawerOverlay />
                        <DrawerContent>
                            <DrawerCloseButton />
                            <DrawerHeader>
                                <Heading size="lg" textAlign="center">Categories</Heading>
                            </DrawerHeader>
                            <DrawerBody>
                                <FormControl id="new-category" mb={4}>
                                    <FormLabel>Category Name</FormLabel>
                                    <Input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Enter category name"
                                        focusBorderColor="teal.500"
                                        size="md"
                                    />
                                </FormControl>

                                <Divider mb={6} />

                                <Heading as="h3" size="sm" mt={4} mb={2}>
                                    Available Categories
                                </Heading>
                                {categories.map((category) => (
                                    <Flex
                                        key={category._id}
                                        align="center"
                                        justify="space-between"
                                        mb={2}
                                        p={2}
                                        borderWidth="1px"
                                        borderRadius="md"
                                        boxShadow="sm"
                                        _hover={{ boxShadow: 'md', bg: 'gray.50' }}
                                        transition="all 0.2s"
                                    >
                                        <Text fontSize="sm" fontWeight="medium">{category.name}</Text>
                                        <Flex>
                                            <IconButton
                                                icon={<EditIcon />}
                                                aria-label="Edit Category"
                                                size="sm"
                                                colorScheme="blue"
                                                variant="outline"
                                                onClick={() => handleCategoryEdit(category)}
                                                mr={2}
                                                _hover={{ bg: 'blue.100' }}
                                            />
                                            <IconButton
                                                icon={<DeleteIcon />}
                                                aria-label="Delete Category"
                                                size="sm"
                                                colorScheme="red"
                                                variant="outline"
                                                onClick={() => handleDeleteCategory(category._id)}
                                                _hover={{ bg: 'red.100' }}
                                            />
                                        </Flex>
                                    </Flex>
                                ))}
                            </DrawerBody>
                            <DrawerFooter>
                                <Button variant="outline" mr={3} onClick={() => setIsDrawerOpen(false)}>
                                    Cancel
                                </Button>
                                {isEditingCategory ? (
                                    <Button colorScheme="teal" onClick={handleSaveCategoryEdit}>
                                        Save Category
                                    </Button>
                                ) : (
                                    <Button colorScheme="teal" onClick={createCategory}>
                                        Create Category
                                    </Button>
                                )}
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>

                    {/* Modal for Editing Documents */}
                    <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
                        <ModalOverlay />
                        <ModalContent>
                            <ModalHeader>Edit Document</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody>
                                <FormControl id="edit-employee-name" mb={4}>
                                    <FormLabel>Employee Name</FormLabel>
                                    <Input
                                        value={employeeName}
                                        onChange={(e) => setEmployeeName(e.target.value)}
                                        placeholder="Enter employee name"
                                        focusBorderColor="teal.500"
                                        size="md"
                                    />
                                </FormControl>
                                <FormControl id="edit-title" mb={4}>
                                    <FormLabel>Document Type</FormLabel>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter title"
                                        focusBorderColor="teal.500"
                                        size="md"
                                    />
                                </FormControl>
                                <FormControl id="edit-category" mb={4}>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                    >
                                        {categories.map((category) => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl id="edit-department" mb={4}>
                                    <FormLabel>Department</FormLabel>
                                    <Input
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        placeholder="Enter department"
                                        focusBorderColor="teal.500"
                                        size="md"
                                    />
                                </FormControl>
                                <Button colorScheme="teal" onClick={handleEditSave}>
                                    Save
                                </Button>
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                </Box>
            </Flex>
        </Box>
    );
};

export default DocumentList;


