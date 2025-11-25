import { Button } from "@chakra-ui/react";
import axios from "axios";

const ExamPage = () => {
    const { fetchQuiz, quiz, loading, error } = useQuizStore();
    const [userAnswers, setUserAnswers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    const handleAnswerChange = (quizId, answer) => {
        setUserAnswers(prev => {
            const existing = prev.find(a => a.quizId === quizId);
            if (existing) {
                return prev.map(a => (a.quizId === quizId ? { ...a, userAnswer: answer } : a));
            }
            return [...prev, { quizId, userAnswer: answer }];
        });
    };

    const handleSubmit = async () => {
        try {
            const userId = "current_user_id"; // Replace with the logged-in user's ID
            const response = await axios.post("/api/submit-exam", { userId, answers: userAnswers });
            alert(response.data.message);
        } catch (error) {
            console.error("Error submitting exam:", error.response?.data || error.message);
            alert("Failed to submit exam. Please try again.");
        }
    };

    return (
        <Container maxW='container.xl' py={12}>
            <VStack spacing={8}>
                <Text fontSize={"30"} fontWeight={"bold"} bgGradient={"linear(to-r, cyan.400, blue.500)"} bgClip={"text"} textAlign={"center"}>
                    Exam Center📜
                </Text>
                {/* Render quizzes */}
                {/* Assuming each quiz has options rendered as radio buttons */}
                {quiz.map((q) => (
                    <QuizCard
                        key={q._id}
                        quiz={q}
                        onAnswerChange={(answer) => handleAnswerChange(q._id, answer)}
                    />
                ))}
                {/* Submit Button */}
                <Button onClick={handleSubmit} colorScheme="blue" size="lg">
                    Submit Exam
                </Button>
            </VStack>
        </Container>
    );
};
