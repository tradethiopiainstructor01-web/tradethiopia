import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack
} from "@chakra-ui/react";
import { fetchCourses } from "../services/api";

const isPersistedCourse = (course) => course?._id && !String(course._id).startsWith("seed-");

const asText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const normalizeSlideImageUrls = (slide = {}) => {
  const values = [
    asText(slide?.imageUrl, ""),
    ...(Array.isArray(slide?.imageUrls) ? slide.imageUrls : [])
  ]
    .map((value) => asText(value, ""))
    .filter(Boolean);

  return values.filter((value, index) => values.indexOf(value) === index);
};

const HRTrainingPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewState, setPreviewState] = useState({
    isOpen: false,
    title: "",
    images: [],
    index: 0
  });

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

  const previewImages = previewState.images || [];
  const selectedPreviewImage = previewImages[previewState.index] || "";

  const openImagePreview = (title, images, index = 0) => {
    if (!images.length) {
      return;
    }

    setPreviewState({
      isOpen: true,
      title,
      images,
      index
    });
  };

  const closeImagePreview = () => {
    setPreviewState({
      isOpen: false,
      title: "",
      images: [],
      index: 0
    });
  };

  const changePreviewImage = (direction) => {
    if (previewImages.length <= 1) {
      return;
    }

    setPreviewState((prev) => {
      const nextIndex = prev.index + direction;

      if (nextIndex < 0) {
        return { ...prev, index: prev.images.length - 1 };
      }

      if (nextIndex >= prev.images.length) {
        return { ...prev, index: 0 };
      }

      return { ...prev, index: nextIndex };
    });
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Heading mb={2} color="teal.700">HR Training</Heading>
      <Text color="gray.600" mb={6}>
        Published HR training courses, chapters, and quiz questions are displayed here.
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
                    <Text color="gray.600" mt={1}>
                      {course.overview || course.description || "No overview available."}
                    </Text>
                    <Badge mt={3} colorScheme="green">Published</Badge>
                  </Box>

                  <Box>
                    <Heading size="sm" mb={3}>Chapters ({course.slides?.length || 0})</Heading>
                    {course.slides?.length ? (
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        {course.slides.map((slide) => {
                          const slideImages = normalizeSlideImageUrls(slide);

                          return (
                            <Box
                              key={slide._id || `${course._id}-${slide.slideNumber}`}
                              borderWidth="1px"
                              borderColor="gray.200"
                              borderRadius="lg"
                              overflow="hidden"
                            >
                              {slideImages.length ? (
                                <Box p={4} pb={0}>
                                  <SimpleGrid columns={{ base: 1, sm: slideImages.length > 1 ? 2 : 1 }} spacing={3}>
                                    {slideImages.map((imageUrl, imageIndex) => (
                                      <Box
                                        key={`${slide._id || slide.slideNumber}-image-${imageIndex}`}
                                        borderWidth="1px"
                                        borderColor="gray.200"
                                        borderRadius="md"
                                        overflow="hidden"
                                        bg="gray.50"
                                        cursor="zoom-in"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() =>
                                          openImagePreview(
                                            `Chapter ${slide.slideNumber}: ${slide.title}`,
                                            slideImages,
                                            imageIndex
                                          )
                                        }
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            openImagePreview(
                                              `Chapter ${slide.slideNumber}: ${slide.title}`,
                                              slideImages,
                                              imageIndex
                                            );
                                          }
                                        }}
                                      >
                                        <Image
                                          src={imageUrl}
                                          alt={`${slide.title} image ${imageIndex + 1}`}
                                          w="100%"
                                          h="220px"
                                          objectFit="cover"
                                          bg="gray.100"
                                        />
                                      </Box>
                                    ))}
                                  </SimpleGrid>
                                  <Text mt={2} fontSize="xs" color="gray.500">
                                    Click any image to open it in full size.
                                  </Text>
                                </Box>
                              ) : null}
                              <Box p={4}>
                                <Text fontWeight="bold">{`Chapter ${slide.slideNumber}: ${slide.title}`}</Text>
                                {slide.body ? (
                                  <Text mt={2} color="gray.700">{slide.body}</Text>
                                ) : null}
                                {slide.materialUrl ? (
                                  <Link href={slide.materialUrl} isExternal>
                                    <Button mt={3} size="sm" colorScheme="teal" variant="outline">
                                      Open Chapter Material
                                    </Button>
                                  </Link>
                                ) : null}
                              </Box>
                            </Box>
                          );
                        })}
                      </SimpleGrid>
                    ) : (
                      <Text color="gray.500">No chapters uploaded.</Text>
                    )}
                  </Box>

                  <Box>
                    <Heading size="sm" mb={3}>Quiz ({course.quizQuestions?.length || 0})</Heading>
                    {course.quizQuestions?.length ? (
                      <VStack spacing={3} align="stretch">
                        {course.quizQuestions.map((quizQuestion) => (
                          <Box
                            key={quizQuestion._id || `${course._id}-${quizQuestion.questionNumber}`}
                            borderWidth="1px"
                            borderColor="gray.200"
                            borderRadius="lg"
                            p={4}
                          >
                            <Text fontWeight="bold" mb={2}>{`Question ${quizQuestion.questionNumber}`}</Text>
                            <Text mb={3}>{quizQuestion.question}</Text>
                            <VStack spacing={2} align="stretch">
                              {(quizQuestion.options || []).map((option, index) => (
                                <Text
                                  key={`${quizQuestion._id || quizQuestion.questionNumber}-option-${index}`}
                                  fontSize="sm"
                                  color={index === Number(quizQuestion.correctAnswer) ? "green.600" : "gray.700"}
                                >
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

      <Modal isOpen={previewState.isOpen} onClose={closeImagePreview} size="6xl" isCentered>
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent bg="gray.900" color="white">
          <ModalHeader pr={16}>{previewState.title || "Chapter image"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box
                minH={{ base: "280px", md: "70vh" }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="blackAlpha.400"
                borderRadius="lg"
                overflow="hidden"
              >
                {selectedPreviewImage ? (
                  <Image
                    src={selectedPreviewImage}
                    alt={previewState.title || "Chapter image preview"}
                    maxH="70vh"
                    maxW="100%"
                    objectFit="contain"
                  />
                ) : (
                  <Text color="gray.300">Image unavailable.</Text>
                )}
              </Box>

              {previewImages.length > 1 ? (
                <HStack justify="space-between">
                  <Button onClick={() => changePreviewImage(-1)}>Previous Image</Button>
                  <Badge colorScheme="teal">
                    Image {previewState.index + 1} / {previewImages.length}
                  </Badge>
                  <Button onClick={() => changePreviewImage(1)}>Next Image</Button>
                </HStack>
              ) : null}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default HRTrainingPage;
