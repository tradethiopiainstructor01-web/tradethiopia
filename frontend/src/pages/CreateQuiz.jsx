import React, { useState, useEffect } from 'react';
import { 
    Input, VStack, Box, Container, Heading, Button, useColorModeValue, useToast, 
    HStack, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Collapse, IconButton, 
    Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, DrawerCloseButton, useDisclosure,
    Flex, Badge, Grid, GridItem
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { ChevronDownIcon, ChevronUpIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';

const CreatePage = () => {
    const [newQuiz, setNewQuiz] = useState({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
    });
    const [quizzes, setQuizzes] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [editingQuizId, setEditingQuizId] = useState(null);
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const tableBgColor = useColorModeValue("gray.50", "gray.700");
    const boxBgColor = useColorModeValue("white", "gray.800");

    const fetchQuizzes = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/quiz`);
            setQuizzes(response.data.data);
        } catch (error) {
            console.error("Error fetching quizzes:", error);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const handleOptionChange = (index, value) => {
        const updatedOptions = [...newQuiz.options];
        updatedOptions[index] = value;
        setNewQuiz({ ...newQuiz, options: updatedOptions });
    };

    const handleAddQuiz = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/quiz`, {
                question: newQuiz.question,
                options: newQuiz.options,
                correctAnswer: newQuiz.correctAnswer,
            });

            if (response.data.success) {
                toast({
                    title: "Quiz created.",
                    description: "The quiz has been created successfully.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
                resetForm();
                fetchQuizzes();
                onClose();
            }
        } catch (error) {
            showErrorToast(error, "Quiz creation failed.");
        }
    };

    const handleUpdateQuiz = async () => {
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/quiz/${editingQuizId}`, {
                question: newQuiz.question,
                options: newQuiz.options,
                correctAnswer: newQuiz.correctAnswer,
            });

            if (response.data.success) {
                toast({
                    title: "Quiz updated.",
                    description: "The quiz has been updated successfully.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
                resetForm();
                setEditingQuizId(null);
                fetchQuizzes();
                onClose();
            }
        } catch (error) {
            showErrorToast(error, "Quiz update failed.");
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        try {
            const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/quiz/${quizId}`);
            if (response.data.success) {
                toast({
                    title: "Quiz deleted.",
                    description: "The quiz has been deleted successfully.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
                setQuizzes(quizzes.filter((quiz) => quiz._id !== quizId));
            }
        } catch (error) {
            showErrorToast(error, "Quiz deletion failed.");
        }
    };

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleEditQuiz = (quiz) => {
        setNewQuiz({
            question: quiz.question,
            options: quiz.options,
            correctAnswer: quiz.correctAnswer,
        });
        setEditingQuizId(quiz._id);
        onOpen();
    };

    const resetForm = () => {
        setNewQuiz({ question: "", options: ["", "", "", ""], correctAnswer: "" });
    };

    const showErrorToast = (error, title) => {
        toast({
            title,
            description: error.response?.data?.message || "An error occurred.",
            status: "error",
            duration: 5000,
            isClosable: true,
        });
    };

    return (
        <Container maxW={{ base: "full", md: "container.md", lg: "container.lg" }} py={8} mt={-75}>

<Heading as="h2" size="lg" mb={4}
        fontSize={"30"}
        fontWeight={"bold"}
        color={"teal.600"}
        textAlign={"center"}>
      Exam List 📝
</Heading>
            <Box
                w="full"
                bg={boxBgColor}
                p={6}
                rounded="lg"
                shadow="md"
                overflowY="auto"
                maxH="500px"
            >
                <HStack justify="space-between" mb={4}>
                    <IconButton 
                        aria-label="Add New Quiz"
                        icon={<AddIcon />}
                        colorScheme="teal"
                        onClick={onOpen}
                    />
                </HStack>
                <TableContainer>
                    <Table variant="simple" colorScheme="gray">
                        <Thead>
                            <Tr>
                                <Th>Question</Th>
                                <Th textAlign="right">Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {quizzes.length > 0 ? (
                                quizzes.map((quiz, index) => (
                                    <React.Fragment key={quiz._id}>
                                        <Tr>
                                            <Td maxW="200px" isTruncated>{quiz.question}</Td>
                                            <Td textAlign="right">
                                                <HStack spacing={2} justifyContent="flex-end">
                                                    <IconButton
                                                        aria-label="Expand/Collapse"
                                                        icon={expandedIndex === index ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                        onClick={() => toggleExpand(index)}
                                                        variant="ghost"
                                                    />
                                                    <IconButton
                                                        aria-label="Edit Quiz"
                                                        icon={<EditIcon />}
                                                        onClick={() => handleEditQuiz(quiz)}
                                                        variant="ghost"
                                                        color="blue.500"
                                                    />
                                                    <IconButton
                                                        aria-label="Delete Quiz"
                                                        icon={<DeleteIcon />}
                                                        onClick={() => handleDeleteQuiz(quiz._id)}
                                                        variant="ghost"
                                                        color="red.500"
                                                    />
                                                </HStack>
                                            </Td>
                                        </Tr>
                                        <Tr>
                                            <Td colSpan="2" p={0}>
                                                <Collapse in={expandedIndex === index}>
                                                    <Box p={4} bg={tableBgColor} rounded="md">
                                                        <Text fontWeight="bold">Options:</Text>
                                                        <VStack align="start" spacing={1}>
                                                            {quiz.options.map((option, idx) => (
                                                                <Text key={idx}>{`${idx + 1}. ${option}`}</Text>
                                                            ))}
                                                        </VStack>
                                                        <Text fontWeight="bold" mt={2}>
                                                            Correct Answer: <Badge colorScheme="green">{quiz.correctAnswer}</Badge>
                                                        </Text>
                                                    </Box>
                                                </Collapse>
                                            </Td>
                                        </Tr>
                                    </React.Fragment>
                                ))
                            ) : (
                                <Tr>
                                    <Td colSpan="2" textAlign="center">No quizzes available.</Td>
                                </Tr>
                            )}
                        </Tbody>
                    </Table>
                </TableContainer>
            </Box>

            <Drawer isOpen={isOpen} onClose={onClose} size="md">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>{editingQuizId ? "Edit Quiz" : "Create Quiz"}</DrawerHeader>
                    <DrawerBody>
                        <VStack spacing={4}>
                            <Input
                                placeholder="Enter question"
                                value={newQuiz.question}
                                onChange={(e) => setNewQuiz({ ...newQuiz, question: e.target.value })}
                                variant="outline"
                                borderColor={useColorModeValue("gray.300", "gray.600")}
                                _focus={{ borderColor: useColorModeValue("blue.400", "blue.300") }}
                            />
                            {newQuiz.options.map((option, idx) => (
                                <Input
                                    key={idx}
                                    placeholder={`Option ${idx + 1}`}
                                    value={option}
                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                    variant="outline"
                                    borderColor={useColorModeValue("gray.300", "gray.600")}
                                    _focus={{ borderColor: useColorModeValue("blue.400", "blue.300") }}
                                />
                            ))}
                            <Input
                                placeholder="Correct Answer"
                                value={newQuiz.correctAnswer}
                                onChange={(e) => setNewQuiz({ ...newQuiz, correctAnswer: e.target.value })}
                                variant="outline"
                                borderColor={useColorModeValue("gray.300", "gray.600")}
                                _focus={{ borderColor: useColorModeValue("blue.400", "blue.300") }}
                            />
                            <Button
                                colorScheme="teal"
                                onClick={editingQuizId ? handleUpdateQuiz : handleAddQuiz}
                            >
                                {editingQuizId ? "Update Quiz" : "Add Quiz"}
                            </Button>
                        </VStack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Container>
    );
};

export default CreatePage;