import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  getManagerSalesOnboardingCourse,
  publishManagerSalesOnboardingCourse,
  saveManagerSalesOnboardingCourse,
  uploadSalesOnboardingSlideImage,
} from '../../services/salesManagerService';

const createSlide = (index = 0) => ({
  title: `Slide ${index + 1}`,
  body: '',
  imageUrl: '',
  materialUrl: '',
});

const createQuestion = (index = 0) => ({
  question: `Question ${index + 1}`,
  options: ['Option 1', 'Option 2'],
  correctAnswer: 0,
  explanation: '',
});

const defaultCourse = {
  title: 'Sales Onboarding Course',
  overview: 'Create your onboarding flow for the sales dashboard.',
  passPercentage: 75,
  slides: [createSlide(0)],
  quizQuestions: [createQuestion(0)],
  isPublished: false,
  publishedAt: null,
};

const asArray = (value, fallback = []) => (Array.isArray(value) ? value : fallback);

const normalizeForEditor = (course = {}) => {
  const slides = asArray(course.slides, []).map((slide, index) => ({
    title: slide?.title || `Slide ${index + 1}`,
    body: slide?.body || '',
    imageUrl: slide?.imageUrl || '',
    materialUrl: slide?.materialUrl || '',
  }));

  const quizQuestions = asArray(course.quizQuestions, []).map((question, index) => {
    const options = asArray(question?.options, []).filter(Boolean);
    const safeOptions = options.length >= 2 ? options : ['Option 1', 'Option 2'];
    const safeCorrect = Number.isFinite(Number(question?.correctAnswer))
      ? Math.max(0, Math.min(safeOptions.length - 1, Number(question.correctAnswer)))
      : 0;

    return {
      question: question?.question || `Question ${index + 1}`,
      options: safeOptions,
      correctAnswer: safeCorrect,
      explanation: question?.explanation || '',
    };
  });

  return {
    title: course?.title || defaultCourse.title,
    overview: course?.overview || defaultCourse.overview,
    passPercentage:
      Number.isFinite(Number(course?.passPercentage)) && Number(course?.passPercentage) >= 0
        ? Math.min(100, Number(course.passPercentage))
        : defaultCourse.passPercentage,
    slides: slides.length ? slides : [createSlide(0)],
    quizQuestions: quizQuestions.length ? quizQuestions : [createQuestion(0)],
    isPublished: Boolean(course?.isPublished),
    publishedAt: course?.publishedAt || null,
  };
};

const CourseManagerPage = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerColor = useColorModeValue('teal.600', 'teal.200');

  const [course, setCourse] = useState(defaultCourse);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState(null);

  const summary = useMemo(
    () => ({
      slides: course.slides.length,
      questions: course.quizQuestions.length,
      status: course.isPublished ? 'Published' : 'Draft',
    }),
    [course]
  );

  const loadCourse = async () => {
    setLoading(true);
    try {
      const response = await getManagerSalesOnboardingCourse();
      const data = response?.data || defaultCourse;
      setCourse(normalizeForEditor(data));
    } catch (error) {
      toast({
        title: 'Unable to load course',
        description: error?.response?.data?.message || error.message || '',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      setCourse(defaultCourse);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, []);

  const updateCourseField = (field, value) => {
    setCourse((prev) => ({ ...prev, [field]: value }));
  };

  const updateSlideField = (slideIndex, field, value) => {
    setCourse((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, index) =>
        index === slideIndex ? { ...slide, [field]: value } : slide
      ),
    }));
  };

  const handleSlideImageUpload = async (slideIndex, file) => {
    if (!file) return;

    setUploadingSlideIndex(slideIndex);
    try {
      const response = await uploadSalesOnboardingSlideImage(file);
      const fileUrl = response?.data?.fileUrl || '';

      if (!fileUrl) {
        throw new Error('Upload succeeded but no image URL was returned.');
      }

      updateSlideField(slideIndex, 'imageUrl', fileUrl);
      toast({
        title: 'Image uploaded',
        description: 'Slide image uploaded to Appwrite and linked. Save draft or publish to persist course changes.',
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Image upload failed',
        description: error?.response?.data?.message || error.message || '',
        status: 'error',
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  const addSlide = () => {
    setCourse((prev) => ({
      ...prev,
      slides: [...prev.slides, createSlide(prev.slides.length)],
    }));
  };

  const removeSlide = (slideIndex) => {
    setCourse((prev) => {
      if (prev.slides.length <= 1) return prev;
      return {
        ...prev,
        slides: prev.slides.filter((_, index) => index !== slideIndex),
      };
    });
  };

  const updateQuestionField = (questionIndex, field, value) => {
    setCourse((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((question, index) =>
        index === questionIndex ? { ...question, [field]: value } : question
      ),
    }));
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    setCourse((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((question, index) => {
        if (index !== questionIndex) return question;
        return {
          ...question,
          options: question.options.map((option, idx) => (idx === optionIndex ? value : option)),
        };
      }),
    }));
  };

  const addQuestion = () => {
    setCourse((prev) => ({
      ...prev,
      quizQuestions: [...prev.quizQuestions, createQuestion(prev.quizQuestions.length)],
    }));
  };

  const removeQuestion = (questionIndex) => {
    setCourse((prev) => {
      if (prev.quizQuestions.length <= 1) return prev;
      return {
        ...prev,
        quizQuestions: prev.quizQuestions.filter((_, index) => index !== questionIndex),
      };
    });
  };

  const addOption = (questionIndex) => {
    setCourse((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: [...question.options, `Option ${question.options.length + 1}`],
            }
          : question
      ),
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    setCourse((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((question, index) => {
        if (index !== questionIndex) return question;
        if (question.options.length <= 2) return question;

        const nextOptions = question.options.filter((_, idx) => idx !== optionIndex);
        let nextCorrect = question.correctAnswer;
        if (optionIndex === question.correctAnswer) {
          nextCorrect = 0;
        } else if (optionIndex < question.correctAnswer) {
          nextCorrect -= 1;
        }

        return {
          ...question,
          options: nextOptions,
          correctAnswer: Math.max(0, Math.min(nextOptions.length - 1, nextCorrect)),
        };
      }),
    }));
  };

  const createPayload = () => ({
    title: course.title,
    overview: course.overview,
    passPercentage: Number(course.passPercentage) || 75,
    slides: course.slides,
    quizQuestions: course.quizQuestions,
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await saveManagerSalesOnboardingCourse(createPayload());
      toast({
        title: 'Draft saved',
        description: 'Course draft is saved successfully.',
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
      await loadCourse();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error?.response?.data?.message || error.message || '',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await saveManagerSalesOnboardingCourse(createPayload());
      await publishManagerSalesOnboardingCourse();
      toast({
        title: 'Course published',
        description: 'Sales dashboard will now use this published course.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await loadCourse();
    } catch (error) {
      toast({
        title: 'Publish failed',
        description: error?.response?.data?.message || error.message || '',
        status: 'error',
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Box>
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', lg: 'center' }}
        direction={{ base: 'column', lg: 'row' }}
        gap={4}
        mb={6}
      >
        <Box>
          <Heading as="h1" size="xl" color={headerColor} mb={1}>
            Course Publisher
          </Heading>
          <Text color="gray.500">
            Build unlimited slides and quiz questions. Publish to the sales dashboard tutorial page.
          </Text>
        </Box>
        <HStack spacing={2}>
          <Button variant="outline" onClick={loadCourse} isDisabled={loading || saving || publishing}>
            Refresh
          </Button>
          <Button colorScheme="blue" onClick={handleSaveDraft} isLoading={saving} isDisabled={loading || publishing}>
            Save Draft
          </Button>
          <Button colorScheme="teal" onClick={handlePublish} isLoading={publishing} isDisabled={loading || saving}>
            Publish
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Slides
            </Text>
            <Heading size="lg">{summary.slides}</Heading>
            <Text color="gray.500">Unlimited pages supported</Text>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Quiz Questions
            </Text>
            <Heading size="lg">{summary.questions}</Heading>
            <Text color="gray.500">Unlimited questions supported</Text>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Text fontSize="sm" color="gray.500">
              Status
            </Text>
            <Badge colorScheme={course.isPublished ? 'green' : 'orange'} mt={1}>
              {summary.status}
            </Badge>
            <Text color="gray.500" mt={2}>
              {course.publishedAt
                ? `Last published: ${new Date(course.publishedAt).toLocaleString()}`
                : 'Not published yet'}
            </Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
        <CardBody>
          {loading ? (
            <HStack py={6}>
              <Spinner />
              <Text>Loading course...</Text>
            </HStack>
          ) : (
            <VStack align="stretch" spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>Course Title</FormLabel>
                  <Input
                    value={course.title}
                    onChange={(event) => updateCourseField('title', event.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Pass Percentage</FormLabel>
                  <NumberInput
                    min={0}
                    max={100}
                    value={course.passPercentage}
                    onChange={(_, valueAsNumber) =>
                      updateCourseField('passPercentage', Number.isFinite(valueAsNumber) ? valueAsNumber : 75)
                    }
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Course Overview</FormLabel>
                <Textarea
                  value={course.overview}
                  onChange={(event) => updateCourseField('overview', event.target.value)}
                  minH="90px"
                />
              </FormControl>
            </VStack>
          )}
        </CardBody>
      </Card>

      {!loading && (
        <Tabs colorScheme="teal" variant="enclosed">
          <TabList>
            <Tab>Slides ({course.slides.length})</Tab>
            <Tab>Quiz ({course.quizQuestions.length})</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0} pt={4}>
              <VStack align="stretch" spacing={4}>
                {course.slides.map((slide, slideIndex) => (
                  <Card key={`slide-${slideIndex}`} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                    <CardBody>
                      <HStack justify="space-between" mb={4}>
                        <Heading size="sm">Slide {slideIndex + 1}</Heading>
                        <IconButton
                          aria-label={`Remove slide ${slideIndex + 1}`}
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeSlide(slideIndex)}
                        />
                      </HStack>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        <FormControl>
                          <FormLabel>Title</FormLabel>
                          <Input
                            value={slide.title}
                            onChange={(event) =>
                              updateSlideField(slideIndex, 'title', event.target.value)
                            }
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Image URL</FormLabel>
                          <Input
                            value={slide.imageUrl}
                            onChange={(event) =>
                              updateSlideField(slideIndex, 'imageUrl', event.target.value)
                            }
                          />
                          <HStack mt={2}>
                            <Input
                              type="file"
                              accept="image/*"
                              p={1}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                handleSlideImageUpload(slideIndex, file);
                                event.target.value = '';
                              }}
                            />
                            {uploadingSlideIndex === slideIndex && <Spinner size="sm" />}
                          </HStack>
                        </FormControl>
                      </SimpleGrid>
                      <FormControl mt={3}>
                        <FormLabel>Body</FormLabel>
                        <Textarea
                          value={slide.body}
                          minH="120px"
                          onChange={(event) =>
                            updateSlideField(slideIndex, 'body', event.target.value)
                          }
                        />
                      </FormControl>
                      <FormControl mt={3}>
                        <FormLabel>Material URL</FormLabel>
                        <Input
                          value={slide.materialUrl}
                          onChange={(event) =>
                            updateSlideField(slideIndex, 'materialUrl', event.target.value)
                          }
                        />
                      </FormControl>
                    </CardBody>
                  </Card>
                ))}
                <Button leftIcon={<AddIcon />} colorScheme="teal" variant="outline" onClick={addSlide}>
                  Add Slide
                </Button>
              </VStack>
            </TabPanel>
            <TabPanel px={0} pt={4}>
              <VStack align="stretch" spacing={4}>
                {course.quizQuestions.map((quiz, questionIndex) => (
                  <Card key={`quiz-${questionIndex}`} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                    <CardBody>
                      <HStack justify="space-between" mb={4}>
                        <Heading size="sm">Question {questionIndex + 1}</Heading>
                        <IconButton
                          aria-label={`Remove question ${questionIndex + 1}`}
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeQuestion(questionIndex)}
                        />
                      </HStack>

                      <FormControl>
                        <FormLabel>Question</FormLabel>
                        <Input
                          value={quiz.question}
                          onChange={(event) =>
                            updateQuestionField(questionIndex, 'question', event.target.value)
                          }
                        />
                      </FormControl>

                      <Divider my={4} />
                      <Text fontSize="sm" fontWeight="semibold" mb={2}>
                        Options
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        {quiz.options.map((option, optionIndex) => (
                          <HStack key={`question-${questionIndex}-option-${optionIndex}`}>
                            <Input
                              value={option}
                              onChange={(event) =>
                                updateQuestionOption(questionIndex, optionIndex, event.target.value)
                              }
                            />
                            <IconButton
                              aria-label={`Remove option ${optionIndex + 1}`}
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => removeOption(questionIndex, optionIndex)}
                            />
                          </HStack>
                        ))}
                      </VStack>
                      <Button
                        mt={3}
                        size="sm"
                        leftIcon={<AddIcon />}
                        variant="outline"
                        onClick={() => addOption(questionIndex)}
                      >
                        Add Option
                      </Button>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={4}>
                        <FormControl>
                          <FormLabel>Correct Answer</FormLabel>
                          <Select
                            value={String(quiz.correctAnswer)}
                            onChange={(event) =>
                              updateQuestionField(questionIndex, 'correctAnswer', Number(event.target.value))
                            }
                          >
                            {quiz.options.map((_, optionIndex) => (
                              <option key={`correct-option-${optionIndex}`} value={optionIndex}>
                                Option {optionIndex + 1}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel>Explanation (Optional)</FormLabel>
                          <Input
                            value={quiz.explanation}
                            onChange={(event) =>
                              updateQuestionField(questionIndex, 'explanation', event.target.value)
                            }
                          />
                        </FormControl>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                ))}
                <Button leftIcon={<AddIcon />} colorScheme="teal" variant="outline" onClick={addQuestion}>
                  Add Question
                </Button>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

export default CourseManagerPage;
