import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Center,
  Progress,
  Divider,
  Icon,
  useColorMode,
  useColorModeValue,
  IconButton,
  Spacer,
} from '@chakra-ui/react';
import { FaClock, FaSun, FaMoon } from 'react-icons/fa';
import axios from 'axios';
import { useUserStore } from '../store/user';
import { useQuizStore } from '../store/quiz';
import { useNavigate } from 'react-router-dom';

const QuizPage = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [quiz, setQuiz] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen: showResults, onOpen: openResults, onClose: closeResults } = useDisclosure();
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [passed, setPassed] = useState(false);

  const currentUser = useUserStore((state) => state.currentUser);
  const quizData = useQuizStore((state) => state.quizs);
  const navigate = useNavigate(); // Add navigate hook

  useEffect(() => {
    if (quizData.length === 0) {
      fetchQuiz();
    } else {
      setQuiz(quizData);
      setLoading(false);
    }
  }, [quizData]);

  const fetchQuiz = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/quiz`);
      if (response.data.success && Array.isArray(response.data.data)) {
        setQuiz(response.data.data);
        setLoading(false);
      } else {
        setError('Invalid quiz data format.');
      }
    } catch (error) {
      setError('Error fetching quiz data. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isStarted) {
      handleSubmit();
    }
  }, [isStarted, timeLeft]);

  const handleStart = () => {
    setIsStarted(true);
    setTimeLeft(3600); // 1 hour for the quiz
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
    calculateScore();
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    const totalQuestions = quiz.length;

    quiz.forEach((question) => {
      if (userAnswers[question._id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    setScore(correctAnswers);
    setTotalQuestions(totalQuestions);
    setPassed(correctAnswers / totalQuestions > 0.5);
    openResults();
  };

  const handleContinue = async () => {
    // Update user status to 'active'
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${currentUser._id}`, {
        status: 'active',
      });
      
      if (response.data.success) {
        closeResults();
        alert('Your status has been updated to active!');
        navigate('/sdashboard'); // Redirect to home after status update
      } else {
        alert('Failed to update status: ' + response.data.message);
      }
      
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update status. Please try again later.');
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return <Text color="red.500" textAlign="center">{error}</Text>;
  }

  if (!isStarted) {
    return (
      <Modal isOpen={true} onClose={() => setIsStarted(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ready to Start the Exam?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Once you start, the timer will begin and you won't be able to
              go back to previous pages.
            </Text>
            <Progress value={100} />
          </ModalBody>
          <ModalFooter>
          <Button
          colorScheme="purple"
          variant="outline"
          onClick={() => navigate(-1)}
          _hover={{ backgroundColor: "purple.500", color: "white" }}
        >
          Back
        </Button>
        <Spacer />
            <Button colorScheme="blue" onClick={handleStart}>
              Start Exam
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  if (quiz.length === 0) {
    return <Text>No questions available.</Text>;
  }

  const currentQuestion = quiz[currentQuestionIndex];

  return (
    <Box minH="100vh" pt={0} bg={useColorModeValue("gray.100", "gray.900")}>
      <Center h="100vh">
        <Box
          p={6}
          maxW="700px"
          w="full"
          borderWidth={1}
          borderRadius="lg"
          boxShadow="lg"
          bg={useColorModeValue("white", "gray.800")}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box display="flex" alignItems="center">
              <Text fontSize="xl" fontWeight="bold" color={useColorModeValue("teal.600", "teal.300")} mr={2}>
                Time Left: {Math.floor(timeLeft / 60)}:
                {timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
              </Text>
              <Icon as={FaClock} boxSize={8} color={useColorModeValue("teal.600", "teal.300")} />
            </Box>
            <IconButton
              aria-label="Toggle theme"
              icon={colorMode === "light" ? <FaMoon /> : <FaSun />}
              onClick={toggleColorMode}
              variant="outline"
              colorScheme="teal"
            />
          </Box>
          <Divider mb={4} />
          <Text fontSize="lg" fontWeight="bold" color={useColorModeValue("gray.800", "white")} mb={2}>
            Question {currentQuestionIndex + 1} of {quiz.length}
          </Text>
          <Box
            p={4}
            borderWidth={1}
            borderRadius="md"
            bg={useColorModeValue("gray.100", "gray.700")}
            boxShadow="md"
          >
            <Text fontSize="2xl" mb={4} fontWeight="semibold" color={useColorModeValue("gray.800", "white")}>
              {currentQuestion.question}
            </Text>
          </Box>
          <Box
            p={4}
            mt={4}
            borderWidth={1}
            borderRadius="md"
            bg={useColorModeValue("gray.50", "gray.600")}
            boxShadow="md"
          >
            <RadioGroup
              onChange={(value) => handleAnswerChange(currentQuestion._id, value)}
              value={userAnswers[currentQuestion._id] || ''}
            >
              <Stack direction="column" spacing={3}>
                {currentQuestion.options &&
                  currentQuestion.options.map((option, index) => (
                    <Radio key={index} value={option} colorScheme="teal">
                      <Text color={useColorModeValue("gray.800", "white")}>{option}</Text>
                    </Radio>
                  ))}
              </Stack>
            </RadioGroup>
          </Box>
          <Box display="flex" justifyContent="space-between" mt={6}>
            <Button onClick={handlePrevious} isDisabled={currentQuestionIndex === 0} colorScheme="teal">
              Previous
            </Button>
            {currentQuestionIndex < quiz.length - 1 ? (
              <Button onClick={handleNext} colorScheme="teal">
                Next
              </Button>
            ) : (
              <Button colorScheme="green" onClick={handleSubmit}>
                Submit
              </Button>
            )}
          </Box>

          {/* Results Modal */}
          <Modal isOpen={showResults} onClose={closeResults}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Your Results</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {passed ? (
                  <Text fontSize="lg">
                    You scored {score} out of {totalQuestions}! You passed!
                  </Text>
                ) : (
                  <Text fontSize="lg">
                    You scored {score} out of {totalQuestions}. Please try again.
                  </Text>
                )}
              </ModalBody>
              <ModalFooter>
                {passed ? (
                  <Button colorScheme="blue" onClick={handleContinue}>
                    Continue
                  </Button>
                ) : (
                  <Button 
                    colorScheme="blue" 
                    onClick={() => {
                      closeResults(); 
                      navigate('/exam'); // Redirect to /exam
                    }}
                  >
                    Close
                  </Button>
                )}
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Box>
      </Center>
    </Box>
  );
};

export default QuizPage;