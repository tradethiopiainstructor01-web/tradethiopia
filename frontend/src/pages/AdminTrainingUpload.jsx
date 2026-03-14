import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useToast,
  VStack
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon, CloseIcon } from "@chakra-ui/icons";
import UploadTrainingMaterial from "../components/customer/UploadTrainingMaterial";
import AdminTrainingMaterialList from "../components/customer/AdminTrainingMaterialList";
import {
  addCourseQuestion,
  addCourseSlide,
  createCourse,
  deleteCourse,
  deleteCourseQuestion,
  fetchCourses,
  updateCourse,
  updateCourseQuestion,
  updateCourseSlide,
  uploadCourseSlideImage
} from "../services/api";

const emptyCourseForm = {
  name: "",
  overview: "",
  passPercentage: "75"
};

const createEmptySlideForm = (slideNumber = 1) => ({
  title: `Slide ${slideNumber}`,
  image: null,
  imageFileId: "",
  imageUrl: "",
  body: "",
  materialUrl: ""
});

const createEmptyQuestionForm = (questionNumber = 1) => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  explanation: "",
  questionNumber
});

const isPersistedCourse = (course) => course?._id && !String(course._id).startsWith("seed-");

const AdminTrainingUpload = () => {
  const toast = useToast();
  const slideComposerRef = useRef(null);
  const [refresh, setRefresh] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [slideForm, setSlideForm] = useState(createEmptySlideForm(1));
  const [editingSlideId, setEditingSlideId] = useState("");
  const [questionForm, setQuestionForm] = useState(createEmptyQuestionForm(1));
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const loadCourses = async (preferredId = "") => {
    setIsLoadingCourses(true);
    try {
      const data = await fetchCourses();
      const realCourses = (Array.isArray(data) ? data : []).filter(isPersistedCourse);
      setCourses(realCourses);

      const fallbackCourse = realCourses[0] || null;
      const nextSelectedId = preferredId || selectedCourseId || fallbackCourse?._id || "";
      setSelectedCourseId(nextSelectedId);

      const selectedCourse = realCourses.find((course) => course._id === nextSelectedId) || fallbackCourse;
      if (selectedCourse) {
        setCourseForm({
          name: selectedCourse.name || "",
          overview: selectedCourse.overview || selectedCourse.description || "",
          passPercentage: String(selectedCourse.passPercentage ?? 75)
        });
      } else {
        setCourseForm(emptyCourseForm);
      }
    } catch (error) {
      toast({
        title: "Unable to load courses",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const draftCourse = useMemo(
    () => courses.find((course) => course.status === "draft") || null,
    [courses]
  );

  const publishedCourse = useMemo(
    () => courses.find((course) => course.status === "published") || null,
    [courses]
  );

  const nextSlideNumber = (selectedCourse?.slides?.length || 0) + 1;
  const nextQuestionNumber = (selectedCourse?.quizQuestions?.length || 0) + 1;

  const scrollSlideComposerIntoView = () => {
    if (slideComposerRef.current) {
      slideComposerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  useEffect(() => {
    if (editingSlideId) {
      return;
    }
    setSlideForm((prev) => ({
      ...prev,
      title: prev.title && !/^Slide \d+$/i.test(prev.title.trim()) ? prev.title : `Slide ${nextSlideNumber}`
    }));
  }, [nextSlideNumber, editingSlideId]);

  useEffect(() => {
    if (editingQuestionId) {
      return;
    }
    setQuestionForm((prev) => ({
      ...prev,
      questionNumber: nextQuestionNumber
    }));
  }, [nextQuestionNumber, editingQuestionId]);

  const formatDateTime = (value) => {
    if (!value) return "Not available";
    return new Date(value).toLocaleString();
  };

  const handleCourseChange = (field) => (event) => {
    setCourseForm((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const resetEditorState = () => {
    setEditingSlideId("");
    setEditingQuestionId("");
    setSlideForm(createEmptySlideForm(1));
    setQuestionForm(createEmptyQuestionForm(1));
  };

  const syncSelectedCourse = (course) => {
    setSelectedCourseId(course._id);
    setCourseForm({
      name: course.name || "",
      overview: course.overview || course.description || "",
      passPercentage: String(course.passPercentage ?? 75)
    });
  };

  const handleCreateNewCourse = () => {
    setSelectedCourseId("");
    setCourseForm(emptyCourseForm);
    resetEditorState();
  };

  const handleEditCourse = (course) => {
    syncSelectedCourse(course);
    resetEditorState();
  };

  const handleDeleteCourse = async (courseId) => {
    const course = courses.find((item) => item._id === courseId);
    if (!courseId || !course) {
      return;
    }

    if (!window.confirm(`Delete course "${course.name}"?`)) {
      return;
    }

    try {
      await deleteCourse(courseId);
      const remainingCourses = courses.filter((item) => item._id !== courseId);
      const nextCourse = remainingCourses[0] || null;

      setCourses(remainingCourses);
      setSelectedCourseId(nextCourse?._id || "");
      if (nextCourse) {
        setCourseForm({
          name: nextCourse.name || "",
          overview: nextCourse.overview || nextCourse.description || "",
          passPercentage: String(nextCourse.passPercentage ?? 75)
        });
      } else {
        setCourseForm(emptyCourseForm);
      }
      resetEditorState();

      toast({
        title: "Course deleted",
        status: "success",
        duration: 2500,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: "Failed to delete course",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  const saveCourse = async (status) => {
    if (!courseForm.name.trim()) {
      toast({
        title: "Course title is required",
        status: "warning",
        duration: 2500,
        isClosable: true
      });
      return null;
    }

    const payload = {
      name: courseForm.name.trim(),
      description: courseForm.overview.trim(),
      overview: courseForm.overview.trim(),
      passPercentage: Number(courseForm.passPercentage) || 75,
      status,
      draftSavedAt: status === "draft" ? new Date().toISOString() : undefined,
      publishedAt: status === "published" ? new Date().toISOString() : undefined,
      isActive: true
    };

    const action = selectedCourse ? updateCourse(selectedCourse._id, payload) : createCourse(payload);
    const saved = await action;
    syncSelectedCourse(saved);
    await loadCourses(saved._id);
    return saved;
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await saveCourse("draft");
      toast({
        title: "Course draft saved",
        description: "You can now add slides to this course.",
        status: "success",
        duration: 2500,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: "Draft save failed",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await saveCourse("published");
      toast({
        title: "Course published",
        description: "The course is now marked as published.",
        status: "success",
        duration: 2500,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: "Publish failed",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRefresh = async () => {
    await loadCourses(selectedCourseId);
    setRefresh((prev) => !prev);
    toast({
      title: "Refreshed",
      description: "Course and material data were refreshed.",
      status: "info",
      duration: 2000,
      isClosable: true
    });
  };

  const handleSlideFieldChange = (field) => (event) => {
    const value = field === "image" ? event.target.files?.[0] || null : event.target.value;
    setSlideForm((prev) => ({
        ...prev,
        [field]: value,
      ...(field === "image" ? { imageUrl: "" } : {})
    }));
  };

  const handleQuestionFieldChange = (field) => (event) => {
    const value = event.target.value;
    setQuestionForm((prev) => ({
      ...prev,
      [field]: field === "correctAnswer" ? Number(value) : value
    }));
  };

  const handleQuestionOptionChange = (index) => (event) => {
    const value = event.target.value;
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) => (optionIndex === index ? value : option))
    }));
  };

  const handleAddQuestionOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const handleRemoveQuestionOption = (index) => {
    setQuestionForm((prev) => {
      if (prev.options.length <= 2) {
        return prev;
      }
      const nextOptions = prev.options.filter((_, optionIndex) => optionIndex !== index);
      const nextCorrectAnswer = prev.correctAnswer >= nextOptions.length ? nextOptions.length - 1 : prev.correctAnswer;
      return {
        ...prev,
        options: nextOptions,
        correctAnswer: Math.max(nextCorrectAnswer, 0)
      };
    });
  };

  const handleSlideImageUpload = async (event) => {
    const file = event.target.files?.[0] || null;
    setSlideForm((prev) => ({
      ...prev,
      image: file,
      imageUrl: ""
    }));

    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await uploadCourseSlideImage(formData);

      setSlideForm((prev) => ({
        ...prev,
        image: file,
        imageUrl: response?.imageUrl || "",
        imageFileId: response?.fileId || ""
      }));

      toast({
        title: "Image uploaded",
        description: response?.imageUrl || "Appwrite image URL created.",
        status: "success",
        duration: 2500,
        isClosable: true
      });
    } catch (error) {
      setSlideForm((prev) => ({
        ...prev,
        image: null,
        imageFileId: "",
        imageUrl: ""
      }));
      toast({
        title: "Image upload failed",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleAddSlide = async () => {
    if (!selectedCourse?._id) {
      toast({
        title: "Create the course first",
        description: "Save the course draft before adding slides.",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (!slideForm.title.trim()) {
      toast({
        title: "Slide title is required",
        status: "warning",
        duration: 2500,
        isClosable: true
      });
      return;
    }

    if (!slideForm.imageUrl) {
      toast({
        title: "Slide image is required",
        status: "warning",
        duration: 2500,
        isClosable: true
      });
      return;
    }

    setIsAddingSlide(true);
    try {
      const response = editingSlideId
        ? await updateCourseSlide(selectedCourse._id, editingSlideId, {
            title: slideForm.title.trim(),
            body: slideForm.body || "",
            materialUrl: slideForm.materialUrl || "",
            imageUrl: slideForm.imageUrl || "",
            imageFileId: slideForm.imageFileId || ""
          })
        : await (() => {
            const formData = new FormData();
            formData.append("title", slideForm.title.trim());
            formData.append("body", slideForm.body || "");
            formData.append("materialUrl", slideForm.materialUrl || "");
            formData.append("imageUrl", slideForm.imageUrl || "");
            formData.append("imageFileId", slideForm.imageFileId || "");
            return addCourseSlide(selectedCourse._id, formData);
          })();
      const updatedCourse = response?.course;

      if (updatedCourse?._id) {
        syncSelectedCourse(updatedCourse);
        await loadCourses(updatedCourse._id);
      }

      setEditingSlideId("");
      setSlideForm({
        title: `Slide ${nextSlideNumber + 1}`,
        image: null,
        imageFileId: "",
        imageUrl: "",
        body: "",
        materialUrl: ""
      });
      setTimeout(scrollSlideComposerIntoView, 100);
      toast({
        title: editingSlideId ? "Slide updated" : "Slide added",
        description: editingSlideId
          ? "The slide changes were saved."
          : "The image was uploaded and saved as an Appwrite link.",
        status: "success",
        duration: 2500,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: "Failed to add slide",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsAddingSlide(false);
    }
  };

  const handleEditSlide = (slide) => {
    setEditingSlideId(slide._id || "");
    setSlideForm({
      title: slide.title || `Slide ${slide.slideNumber}`,
      image: null,
      imageFileId: slide.imageFileId || "",
      imageUrl: slide.imageUrl || "",
      body: slide.body || "",
      materialUrl: slide.materialUrl || ""
    });
    setTimeout(scrollSlideComposerIntoView, 100);
  };

  const handleCancelSlideEdit = () => {
    setEditingSlideId("");
    setSlideForm(createEmptySlideForm(nextSlideNumber));
    setTimeout(scrollSlideComposerIntoView, 100);
  };

  const handleEditQuestion = (quizQuestion) => {
    setEditingQuestionId(quizQuestion._id || "");
    setQuestionForm({
      question: quizQuestion.question || "",
      options: Array.isArray(quizQuestion.options) && quizQuestion.options.length ? quizQuestion.options : ["", ""],
      correctAnswer: Number(quizQuestion.correctAnswer) || 0,
      explanation: quizQuestion.explanation || "",
      questionNumber: quizQuestion.questionNumber || 1
    });
  };

  const handleCancelQuestionEdit = () => {
    setEditingQuestionId("");
    setQuestionForm(createEmptyQuestionForm(nextQuestionNumber));
  };

  const handleSaveQuestion = async () => {
    if (!selectedCourse?._id) {
      toast({
        title: "Create the course first",
        status: "warning",
        duration: 2500,
        isClosable: true
      });
      return;
    }

    if (!questionForm.question.trim()) {
      toast({
        title: "Question is required",
        status: "warning",
        duration: 2500,
        isClosable: true
      });
      return;
    }

    const normalizedOptions = questionForm.options.map((option) => option.trim()).filter(Boolean);
    if (normalizedOptions.length < 2) {
      toast({
        title: "At least two options are required",
        status: "warning",
        duration: 2500,
        isClosable: true
      });
      return;
    }

    setIsSavingQuestion(true);
    try {
      const payload = {
        question: questionForm.question.trim(),
        options: normalizedOptions,
        correctAnswer: Math.min(questionForm.correctAnswer, normalizedOptions.length - 1),
        explanation: questionForm.explanation || ""
      };

      const response = editingQuestionId
        ? await updateCourseQuestion(selectedCourse._id, editingQuestionId, payload)
        : await addCourseQuestion(selectedCourse._id, payload);

      const updatedCourse = response?.course;
      if (updatedCourse?._id) {
        syncSelectedCourse(updatedCourse);
        await loadCourses(updatedCourse._id);
      }

      setEditingQuestionId("");
      setQuestionForm(createEmptyQuestionForm(editingQuestionId ? nextQuestionNumber : nextQuestionNumber + 1));
      toast({
        title: editingQuestionId ? "Question updated" : "Question added",
        status: "success",
        duration: 2500,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: "Failed to save question",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!selectedCourse?._id || !questionId) {
      return;
    }

    try {
      const response = await deleteCourseQuestion(selectedCourse._id, questionId);
      const updatedCourse = response?.course;
      if (updatedCourse?._id) {
        syncSelectedCourse(updatedCourse);
        await loadCourses(updatedCourse._id);
      }
      if (editingQuestionId === questionId) {
        setEditingQuestionId("");
        setQuestionForm(createEmptyQuestionForm(Math.max(1, (updatedCourse?.quizQuestions?.length || 0) + 1)));
      }
      toast({
        title: "Question deleted",
        status: "info",
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: "Failed to delete question",
        description: error?.response?.data?.message || error.message || "",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  const summary = {
    slideCount: selectedCourse?.slides?.length || 0,
    quizCount: selectedCourse?.quizQuestions?.length || 0,
    publishStatus: publishedCourse ? "PUBLISHED" : "DRAFT"
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Flex
        mb={6}
        justify="space-between"
        align={{ base: "flex-start", lg: "center" }}
        direction={{ base: "column", lg: "row" }}
        gap={4}
      >
        <Box>
          <Heading mb={2} color="teal.700">Course Publisher</Heading>
          <Text color="gray.600">
            Build unlimited slides and quiz questions. Publish to the sales dashboard tutorial page.
          </Text>
        </Box>
        <Stack direction={{ base: "column", md: "row" }} spacing={3}>
          <Button variant="outline" onClick={handleRefresh} isLoading={isLoadingCourses}>Refresh</Button>
          <Button colorScheme="blue" onClick={handleSaveDraft} isLoading={isSavingDraft}>Save Draft</Button>
          <Button colorScheme="teal" onClick={handlePublish} isLoading={isPublishing}>Publish</Button>
        </Stack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Card>
          <CardBody py={7}>
            <Text color="gray.500" fontSize="sm">Slides</Text>
            <Heading size="2xl" mt={2}>{summary.slideCount}</Heading>
            <Text mt={2} color="gray.600">
              Unlimited pages supported
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody py={7}>
            <Text color="gray.500" fontSize="sm">Quiz Questions</Text>
            <Heading size="2xl" mt={2}>{summary.quizCount}</Heading>
            <Text mt={2} color="gray.600">
              Unlimited questions supported
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody py={7}>
            <Text color="gray.500" fontSize="sm">Status</Text>
            <Badge
              mt={2}
              colorScheme={publishedCourse ? "green" : "yellow"}
              fontSize="0.8em"
              px={2}
              py={1}
            >
              {summary.publishStatus}
            </Badge>
            <Text mt={3} color="gray.600">
              Last published: {formatDateTime(publishedCourse?.publishedAt)}
            </Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card mb={6}>
        <CardBody>
          <Heading size="md" mb={4}>1. Create Course</Heading>
          <Flex mb={4} justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
            <Text color="gray.600">
              {selectedCourse ? `Editing course: ${selectedCourse.name}` : "Create a new HR course or pick one to edit."}
            </Text>
            <Button variant="outline" onClick={handleCreateNewCourse}>
              New Course
            </Button>
          </Flex>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Course Title</FormLabel>
              <Input
                value={courseForm.name}
                onChange={handleCourseChange("name")}
                placeholder="Enter course title"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Pass Percentage</FormLabel>
              <Input
                type="number"
                min="0"
                max="100"
                value={courseForm.passPercentage}
                onChange={handleCourseChange("passPercentage")}
                placeholder="75"
              />
            </FormControl>
            <FormControl gridColumn={{ md: "1 / span 2" }}>
              <FormLabel>Course Overview</FormLabel>
              <Textarea
                value={courseForm.overview}
                onChange={handleCourseChange("overview")}
                placeholder="Write the main course overview"
                minH="140px"
              />
            </FormControl>
          </SimpleGrid>
          {selectedCourse ? (
            <Text mt={4} color="gray.600">
              Active course: <strong>{selectedCourse.name}</strong> with {selectedCourse.slides?.length || 0} slide(s).
            </Text>
          ) : (
            <Text mt={4} color="gray.600">
              No saved course yet. Click <strong>Save Draft</strong> first.
            </Text>
          )}

          <VStack spacing={3} align="stretch" mt={6}>
            {courses.map((course) => (
              <Box key={course._id} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
                  <Box>
                    <Text fontWeight="bold">{course.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {course.status === "published" ? "Published" : "Draft"} • {course.slides?.length || 0} slides • {course.quizQuestions?.length || 0} questions
                    </Text>
                  </Box>
                  <Flex gap={2}>
                    <Button size="sm" leftIcon={<EditIcon />} onClick={() => handleEditCourse(course)}>
                      Edit
                    </Button>
                    <IconButton
                      aria-label={`Delete course ${course.name}`}
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDeleteCourse(course._id)}
                    />
                  </Flex>
                </Flex>
              </Box>
            ))}
          </VStack>
        </CardBody>
      </Card>

      <Card mb={6} ref={slideComposerRef}>
        <CardBody>
          <Tabs variant="unstyled">
            <TabList borderBottomWidth="1px" borderColor="gray.200" mb={5}>
              <Tab
                borderTopRadius="md"
                borderWidth="1px"
                borderBottomWidth="0"
                borderColor="gray.200"
                bg="white"
                color="teal.600"
                fontWeight="medium"
                _selected={{ color: "teal.700" }}
              >
                Slides ({selectedCourse?.slides?.length || 0})
              </Tab>
              <Tab
                ml={2}
                borderTopRadius="md"
                borderWidth="1px"
                borderBottomWidth="0"
                borderColor="gray.200"
                bg="white"
                color="gray.700"
                _selected={{ color: "teal.700" }}
              >
                Quiz ({summary.quizCount})
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden">
                  <Box p={6}>
                    <Flex justify="space-between" align="center" mb={5}>
                      <Heading size="md">
                        {editingSlideId ? `Edit Slide ${selectedCourse?.slides?.find((slide) => slide._id === editingSlideId)?.slideNumber || ""}` : `Slide ${selectedCourse ? nextSlideNumber : 1}`}
                      </Heading>
                      <Flex gap={2}>
                        {editingSlideId ? (
                          <IconButton
                            aria-label="Cancel slide edit"
                            icon={<CloseIcon />}
                            variant="ghost"
                            colorScheme="gray"
                            onClick={handleCancelSlideEdit}
                          />
                        ) : null}
                        <IconButton
                          aria-label="Delete slide draft"
                          icon={<DeleteIcon />}
                          variant="ghost"
                          colorScheme="red"
                          isDisabled
                        />
                      </Flex>
                    </Flex>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Title</FormLabel>
                        <Input
                          value={slideForm.title}
                          onChange={handleSlideFieldChange("title")}
                          placeholder={`Slide ${selectedCourse ? nextSlideNumber : 1}`}
                          isDisabled={!selectedCourse}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Image URL</FormLabel>
                        <Input
                          value={slideForm.imageUrl}
                          placeholder="https://cloud.appwrite.io/v1/storage/buckets/68de2cd2000edc9d02c9/files/.../view?project=66fa8216001614a2f7cd"
                          isReadOnly
                        />
                      </FormControl>
                      <FormControl gridColumn={{ md: "2 / span 1" }}>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleSlideImageUpload}
                          p={1}
                          isDisabled={!selectedCourse || isUploadingImage}
                        />
                      </FormControl>
                      <FormControl gridColumn={{ md: "1 / span 2" }}>
                        <FormLabel>Body</FormLabel>
                        <Textarea
                          value={slideForm.body}
                          onChange={handleSlideFieldChange("body")}
                          placeholder=""
                          minH="140px"
                          isDisabled={!selectedCourse}
                        />
                      </FormControl>
                      <FormControl gridColumn={{ md: "1 / span 2" }}>
                        <FormLabel>Material URL</FormLabel>
                        <Input
                          value={slideForm.materialUrl}
                          onChange={handleSlideFieldChange("materialUrl")}
                          placeholder=""
                          isDisabled={!selectedCourse}
                        />
                      </FormControl>
                    </SimpleGrid>
                  </Box>

                  <Box borderTopWidth="1px" borderTopColor="teal.300" bg="white">
                    <Button
                      leftIcon={<AddIcon />}
                      variant="ghost"
                      colorScheme="teal"
                      w="100%"
                      h="60px"
                      borderRadius="0"
                      fontSize="xl"
                      fontWeight="medium"
                      onClick={handleAddSlide}
                      isLoading={isAddingSlide}
                      isDisabled={!selectedCourse || isUploadingImage}
                    >
                      {editingSlideId ? "Update Slide" : "Add Slide"}
                    </Button>
                  </Box>
                </Box>

                <VStack spacing={4} align="stretch" mt={4}>
                  {(selectedCourse?.slides || []).map((slide) => (
                    <Box key={slide._id || `${slide.slideNumber}-${slide.title}`} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                      <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
                        <Box>
                          <Text fontWeight="bold" mb={1}>Slide {slide.slideNumber}</Text>
                          <Text color="gray.600">Use edit to update this slide inside HR Course.</Text>
                        </Box>
                        <Button size="sm" leftIcon={<EditIcon />} onClick={() => handleEditSlide(slide)}>
                          Edit
                        </Button>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </TabPanel>

              <TabPanel px={0}>
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden">
                  <Box p={4}>
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading size="sm">
                        {editingQuestionId ? `Edit Question ${questionForm.questionNumber}` : `Question ${questionForm.questionNumber}`}
                      </Heading>
                      <Flex gap={2}>
                        {editingQuestionId ? (
                          <IconButton
                            aria-label="Cancel question edit"
                            icon={<CloseIcon />}
                            variant="ghost"
                            colorScheme="gray"
                            onClick={handleCancelQuestionEdit}
                          />
                        ) : null}
                        <IconButton
                          aria-label="Delete question draft"
                          icon={<DeleteIcon />}
                          variant="ghost"
                          colorScheme="red"
                          isDisabled
                        />
                      </Flex>
                    </Flex>

                    <FormControl mb={4}>
                      <FormLabel>Question</FormLabel>
                      <Input
                        value={questionForm.question}
                        onChange={handleQuestionFieldChange("question")}
                        placeholder="Enter question"
                        isDisabled={!selectedCourse}
                      />
                    </FormControl>

                    <Box borderTopWidth="1px" borderTopColor="gray.100" pt={4}>
                      <Text fontSize="sm" fontWeight="medium" mb={3}>Options</Text>
                      <VStack spacing={3} align="stretch">
                        {questionForm.options.map((option, index) => (
                          <Flex key={`option-${index}`} gap={2} align="center">
                            <Input
                              value={option}
                              onChange={handleQuestionOptionChange(index)}
                              placeholder={`${String.fromCharCode(65 + index)}. Enter option`}
                              isDisabled={!selectedCourse}
                            />
                            <IconButton
                              aria-label={`Delete option ${index + 1}`}
                              icon={<DeleteIcon />}
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleRemoveQuestionOption(index)}
                              isDisabled={!selectedCourse || questionForm.options.length <= 2}
                            />
                          </Flex>
                        ))}
                      </VStack>
                      <Button mt={3} size="sm" leftIcon={<AddIcon />} variant="outline" onClick={handleAddQuestionOption} isDisabled={!selectedCourse}>
                        Add Option
                      </Button>
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                      <FormControl>
                        <FormLabel>Correct Answer</FormLabel>
                        <Select
                          value={questionForm.correctAnswer}
                          onChange={handleQuestionFieldChange("correctAnswer")}
                          isDisabled={!selectedCourse}
                        >
                          {questionForm.options.map((_, index) => (
                            <option key={`answer-${index}`} value={index}>
                              {`Option ${index + 1}`}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Explanation (Optional)</FormLabel>
                        <Input
                          value={questionForm.explanation}
                          onChange={handleQuestionFieldChange("explanation")}
                          placeholder=""
                          isDisabled={!selectedCourse}
                        />
                      </FormControl>
                    </SimpleGrid>
                  </Box>

                  <Box borderTopWidth="1px" borderTopColor="teal.300" bg="white">
                    <Button
                      leftIcon={<AddIcon />}
                      variant="ghost"
                      colorScheme="teal"
                      w="100%"
                      h="48px"
                      borderRadius="0"
                      fontWeight="medium"
                      onClick={handleSaveQuestion}
                      isLoading={isSavingQuestion}
                      isDisabled={!selectedCourse}
                    >
                      {editingQuestionId ? "Update Question" : "Add Question"}
                    </Button>
                  </Box>
                </Box>

                <VStack spacing={4} align="stretch" mt={4}>
                  {(selectedCourse?.quizQuestions || []).map((quizQuestion) => (
                    <Box key={quizQuestion._id || quizQuestion.questionNumber} borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                      <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
                        <Box>
                          <Text fontWeight="bold" mb={2}>Question {quizQuestion.questionNumber}</Text>
                          <Text color="gray.600">Use edit to update this question inside HR Course.</Text>
                        </Box>
                        <Flex gap={2}>
                          <Button size="sm" leftIcon={<EditIcon />} onClick={() => handleEditQuestion(quizQuestion)}>
                            Edit
                          </Button>
                          <IconButton
                            aria-label={`Delete question ${quizQuestion.questionNumber}`}
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDeleteQuestion(quizQuestion._id)}
                          />
                        </Flex>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      <Heading size="md" mb={4} color="teal.700">Training Materials</Heading>
      <UploadTrainingMaterial onUpload={() => setRefresh((prev) => !prev)} />
      <AdminTrainingMaterialList key={refresh} />
    </Box>
  );
};

export default AdminTrainingUpload;
