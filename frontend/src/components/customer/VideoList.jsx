// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";
import { Box, Card, CardBody, Text, Button } from "@chakra-ui/react"; // Chakra UI components
import Layout from "./Layout";

const VideoList = () => {
  const [videoList, setVideoList] = useState([]); // State for video data
  const [selectedVideo, setSelectedVideo] = useState(null); // State for currently selected video
  const [loading, setLoading] = useState(true); // State for loading

  useEffect(() => {
    // Fetch videos from the backend
    const fetchVideos = async () => {
      try {
        const response = await fetch("${import.meta.env.VITE_API_URL}/api/resources/video"); // Adjust endpoint if needed
        const data = await response.json();
        setVideoList(data);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Replace with a spinner or animation if desired
  }

  return (
    <Layout display="flex" flexDirection="column" alignItems="center" gap={4}>
       
      <Text fontSize="2xl" fontWeight="bold" mb={4} paddingTop={"40"}>
        Video List
      </Text>

      {/* Video player section */}
      {selectedVideo && (
        <Box
          mb={6}
          p={4}
          borderWidth="1px"
          borderRadius="md"
          maxW="lg"
          width="100%"
        >
          <Text fontSize="xl" fontWeight="bold" mb={2}>
            {selectedVideo.title}
          </Text>
          <video
            controls
            style={{ width: "100%", height: "auto" }}
            src={`${import.meta.env.VITE_API_URL}${selectedVideo.content}`}
          />
          <Text mt={2}>{selectedVideo.description}</Text>
        </Box>
      )}

      {/* Video card list */}
      <Box display="flex" flexWrap="wrap" gap={4} justifyContent="center">
        {videoList.length === 0 ? (
          <Text>No video resources found.</Text>
        ) : (
          videoList.map((video) => (
            <Card key={video._id} maxW="sm" borderWidth="1px" borderRadius="md">
              <CardBody>
                <Text fontSize="xl" fontWeight="bold">
                  {video.title}
                </Text>
                <Text mt={2}>{video.description}</Text>
                <Button
                  mt={4}
                  colorScheme="teal"
                  onClick={() => setSelectedVideo(video)} // Set the selected video
                >
                  Watch Video
                </Button>
              </CardBody>
            </Card>
          ))
        )}
      </Box>
    </Layout>
  );
};

export default VideoList;
