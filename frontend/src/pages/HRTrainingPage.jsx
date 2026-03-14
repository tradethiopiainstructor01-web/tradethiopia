import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Card,
  CardBody,
  Heading,
  Image,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack
} from "@chakra-ui/react";
import { fetchCourses } from "../services/api";

const isPersistedCourse = (course) => course?._id && !String(course._id).startsWith("seed-");

const HRTrainingPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      try {
        const data = await fetchCourses();
        setCourses((Array.isArray(data) ? data : []).filter(isPersistedCourse));
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load HR training.");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const publishedCourses = useMemo(
    () => courses.filter((course) => course.status === "published"),
    [courses]
  );

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Heading mb={2} color="teal.700">HR Training</Heading>
      <Text color="gray.600" mb={6}>
        Published HR training courses, slides, and quiz questions are displayed here.
      </Text>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : publishedCourses.length === 0 ? (
        <Text color="gray.600">No published HR training courses found.</Text>
      ) : (
        <VStack spacing={6} align="stretch">
          {publishedCourses.map((course) => (
            <Card key={course._id}>
              <CardBody>
                <Stack spacing={4}>
                  <Box>
                    <Heading size="md">{course.name}</Heading>
                    <Text color="gray.600" mt={1}>{course.overview || course.description || "No overview available."}</Text>
                    <Badge mt={3} colorScheme="green">Published</Badge>
                  </Box>

                  <Box>
                    <Heading size="sm" mb={3}>Slides ({course.slides?.length || 0})</Heading>
                    {course.slides?.length ? (
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        {course.slides.map((slide) => (
                          <Box key={slide._id || `${course._id}-${slide.slideNumber}`} borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden">
                            {slide.imageUrl ? (
                              <Image
                                src={slide.imageUrl}
                                alt={slide.title}
                                w="100%"
                                h="220px"
                                objectFit="cover"
                              />
                            ) : null}
                            <Box p={4}>
                              <Text fontWeight="bold">{`Slide ${slide.slideNumber}: ${slide.title}`}</Text>
                              {slide.body ? <Text mt={2} color="gray.700">{slide.body}</Text> : null}
                              {slide.materialUrl ? (
                                <Text mt={2} fontSize="sm" color="gray.500" wordBreak="break-all">
                                  {slide.materialUrl}
                                </Text>
                              ) : null}
                            </Box>
                          </Box>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Text color="gray.500">No slides uploaded.</Text>
                    )}
                  </Box>

                  <Box>
                    <Heading size="sm" mb={3}>Quiz ({course.quizQuestions?.length || 0})</Heading>
                    {course.quizQuestions?.length ? (
                      <VStack spacing={3} align="stretch">
                        {course.quizQuestions.map((quizQuestion) => (
                          <Box key={quizQuestion._id || `${course._id}-${quizQuestion.questionNumber}`} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                            <Text fontWeight="bold" mb={2}>{`Question ${quizQuestion.questionNumber}`}</Text>
                            <Text mb={3}>{quizQuestion.question}</Text>
                            <VStack spacing={2} align="stretch">
                              {(quizQuestion.options || []).map((option, index) => (
                                <Text key={`${quizQuestion._id || quizQuestion.questionNumber}-option-${index}`} fontSize="sm" color={index === Number(quizQuestion.correctAnswer) ? "green.600" : "gray.700"}>
                                  {`${String.fromCharCode(65 + index)}. ${option}`}
                                </Text>
                              ))}
                            </VStack>
                            {quizQuestion.explanation ? (
                              <Text mt={3} fontSize="sm" color="gray.500">
                                Explanation: {quizQuestion.explanation}
                              </Text>
                            ) : null}
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <Text color="gray.500">No quiz questions uploaded.</Text>
                    )}
                  </Box>
                </Stack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default HRTrainingPage;
