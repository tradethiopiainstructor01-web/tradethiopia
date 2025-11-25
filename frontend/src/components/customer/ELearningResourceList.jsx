import React, { useEffect, useState } from "react";
import { Box, Card, CardBody, Text, Button, SimpleGrid, Tag, Tabs, TabList, TabPanels, Tab, TabPanel, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Flex } from "@chakra-ui/react";

const ELearningResourceList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources/`);
        const data = await res.json();
        setResources(data);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const handleOpenResource = (resource) => {
    setSelectedResource(resource);
    onOpen();
  };

  if (loading) return <Text>Loading...</Text>;

  const videoResources = resources.filter(r => r.type === "video");
  const pdfResources = resources.filter(r => r.type === "pdf");
  const docResources = resources.filter(r => r.type === "document");

  return (
    <Box mt={4}>
      <Tabs variant="enclosed" colorScheme="teal">
        <TabList>
          <Tab>Videos</Tab>
          <Tab>PDFs</Tab>
          <Tab>Documents</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
              {videoResources.length === 0 ? (
                <Text>No videos found.</Text>
              ) : (
                videoResources.map(video => {
                  // Check if content is a YouTube link
                  let isYouTube = false;
                  let youtubeId = "";
                  let thumbnailUrl = "";
                  if (video.content && (video.content.includes("youtube.com") || video.content.includes("youtu.be"))) {
                    isYouTube = true;
                    // Extract YouTube video ID
                    const match = video.content.match(/(?:youtube\.com\/(?:[^\/]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    youtubeId = match ? match[1] : "";
                    thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/0.jpg` : "https://via.placeholder.com/320x180?text=Video";
                  } else {
                    thumbnailUrl = "https://via.placeholder.com/320x180?text=Video";
                  }
                  return (
                    <Card key={video._id} maxW="sm" borderWidth="1px" borderRadius="md" boxShadow="md">
                      <CardBody>
                        <Box mb={2}>
                          <img src={thumbnailUrl} alt="Video thumbnail" style={{ width: "100%", borderRadius: "8px" }} />
                        </Box>
                        <Text fontSize="lg" fontWeight="bold">{video.title}</Text>
                        <Text mb={2}>{video.description}</Text>
                        <Button colorScheme="teal" onClick={() => handleOpenResource(video)}>Watch</Button>
                      </CardBody>
                    </Card>
                  );
                })
              )}
            </SimpleGrid>
          </TabPanel>
          <TabPanel>
            <Flex wrap="wrap" gap={6} justify="flex-start">
              {pdfResources.length === 0 ? (
                <Text>No PDFs found.</Text>
              ) : (
                pdfResources.map(pdf => (
                  <Card key={pdf._id} maxW="sm" borderWidth="1px" borderRadius="md" boxShadow="md">
                    <CardBody>
                      <Text fontSize="lg" fontWeight="bold">{pdf.title}</Text>
                      <Text mb={2}>{pdf.description}</Text>
                      <Button colorScheme="blue" as="a" href={`${import.meta.env.VITE_API_URL}${pdf.content}`} target="_blank">View PDF</Button>
                    </CardBody>
                  </Card>
                ))
              )}
            </Flex>
          </TabPanel>
          <TabPanel>
            <Flex wrap="wrap" gap={6} justify="flex-start">
              {docResources.length === 0 ? (
                <Text>No documents found.</Text>
              ) : (
                docResources.map(doc => (
                  <Card key={doc._id} maxW="sm" borderWidth="1px" borderRadius="md" boxShadow="md">
                    <CardBody>
                      <Text fontSize="lg" fontWeight="bold">{doc.title}</Text>
                      <Text mb={2}>{doc.description}</Text>
                      <Button colorScheme="gray" as="a" href={`${import.meta.env.VITE_API_URL}${doc.content}`} target="_blank">View Document</Button>
                    </CardBody>
                  </Card>
                ))
              )}
            </Flex>
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedResource?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedResource?.type === "video" ? (
              selectedResource?.content && (selectedResource.content.includes("youtube.com") || selectedResource.content.includes("youtu.be")) ? (
                (() => {
                  const match = selectedResource.content.match(/(?:youtube\.com\/(?:[^\/]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                  const youtubeId = match ? match[1] : "";
                  return youtubeId ? (
                    <Box position="relative" pb="56.25%" height="0">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title="YouTube Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: "8px" }}
                      ></iframe>
                    </Box>
                  ) : <Text>Invalid YouTube link.</Text>;
                })()
              ) : (
                <video controls style={{ width: "100%" }} src={`${import.meta.env.VITE_API_URL}${selectedResource.content}`} />
              )
            ) : null}
            <Text mt={2}>{selectedResource?.description}</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ELearningResourceList;
