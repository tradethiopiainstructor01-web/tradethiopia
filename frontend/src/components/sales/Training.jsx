import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  Card,
  CardBody,
  Image,
  Button,
  IconButton,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  InputGroup,
  InputLeftElement,
  Input,
} from "@chakra-ui/react";
import { FaChevronLeft, FaChevronRight, FaPlayCircle, FaSearch } from "react-icons/fa";

const videoData = [
  {
    title: "Introduction to React",
    description: "Learn the basics of React in this video.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: "https://via.placeholder.com/300x200?text=React+Basics",
  },
  {
    title: "Advanced React Techniques",
    description: "Deep dive into advanced React patterns and techniques.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: "https://via.placeholder.com/300x200?text=Advanced+React",
  },
  {
    title: "State Management with Redux",
    description: "Learn how to manage state with Redux in this tutorial.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: "https://via.placeholder.com/300x200?text=Redux+Tutorial",
  },
  {
    title: "State Management with Redux",
    description: "Learn how to manage state with Redux in this tutorial.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: "https://via.placeholder.com/300x200?text=Redux+Tutorial",
  },
  {
    title: "State Management with Redux",
    description: "Learn how to manage state with Redux in this tutorial.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: "https://via.placeholder.com/300x200?text=Redux+Tutorial",
  },
  {
    title: "State Management with Redux",
    description: "Learn how to manage state with Redux in this tutorial.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: "https://via.placeholder.com/300x200?text=Redux+Tutorial",
  },
  
];

const Training = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 3;
  const totalPages = Math.ceil(videoData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const filteredVideoData = videoData.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const currentPageData = filteredVideoData.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const openModal = (video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  return (
<Box bg="gray.50" minH="100vh" maxW="100%" p={1} mb={2}>
  <Container maxW="container.xl">
    <Box
      as="header"
      py={10}
      mb={10}
      backgroundImage="linear-gradient(to right, teal.400, blue.400)"
      backgroundSize="cover"
      backgroundPosition="center"
    >
      <Heading as="h2" size="2xl" color="white" textAlign="center">
        Featured Courses
      </Heading>
    </Box>

    <Flex justify="space-between" align="center" mb={8} flexWrap="wrap">
      <Heading as="h3" size="lg" color="teal.800" mb={{ base: 4, md: 0 }}>
        Featured Courses
      </Heading>
      <InputGroup maxW="300px" mb={{ base: 4, md: 0 }}>
        <InputLeftElement color="gray.500">
          <FaSearch />
        </InputLeftElement>
        <Input
          placeholder="Search by title"
          value={searchTerm}
          onChange={handleSearch}
        />
      </InputGroup>
      <Flex>
        <IconButton
          aria-label="Previous Page"
          icon={<FaChevronLeft />}
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          colorScheme="teal"
          size="md"
          mr={2}
        />
        <IconButton
          aria-label="Next Page"
          icon={<FaChevronRight />}
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          colorScheme="teal"
          size="md"
        />
      </Flex>
    </Flex>

    {/* Cards Grid */}
    <Box
      display="grid"
      gridTemplateColumns={{
        base: "1fr",
        sm: "repeat(2, 1fr)",
        md: "repeat(2, 1fr)",
        lg: "repeat(3, 1fr)",
      }}
      gap={6}
      pb={6}
    >
      {currentPageData.map((video, index) => (
        <Card
          key={index}
          boxShadow="lg"
          borderRadius="lg"
          overflow="hidden"
          bg="white"
          transition="transform 0.3s ease, box-shadow 0.3s ease"
          _hover={{
            transform: "translateY(-5px)",
            boxShadow: "2xl",
          }}
          maxW="350px"
          mx="auto"
        >
          <Image
            src={video.thumbnail}
            alt={video.title}
            objectFit="cover"
            h="200px"
            w="100%"
            transition="transform 0.3s ease"
            _hover={{ transform: "scale(1.05)" }}
          />
          <CardBody p={5}>
            <Heading as="h3" size="md" mb={3} color="teal.800">
              {video.title}
            </Heading>
            <Text fontSize="sm" mb={4} color="gray.600" noOfLines={3}>
              {video.description}
            </Text>
            <Button
              colorScheme="teal"
              w="full"
              onClick={() => openModal(video)}
              _hover={{
                bgGradient: "linear(to-r, teal.400, blue.400)",
                color: "white",
              }}
            >
              <Box mr={2}>
                <FaPlayCircle />
              </Box>
              Watch Video
            </Button>
          </CardBody>
        </Card>
      ))}
    </Box>

    {/* Video Modal */}
    <Modal isOpen={isModalOpen} onClose={closeModal} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{selectedVideo?.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {selectedVideo && (
            <Box
              as="iframe"
              src={selectedVideo.videoUrl}
              width="100%"
              height="500px"
              frameBorder="0"
              allowFullScreen
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  </Container>
</Box>


  );
};

export default Training;