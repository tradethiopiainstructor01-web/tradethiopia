import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Stack, Spinner, Alert, AlertIcon } from '@chakra-ui/react';

const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const response = await fetch('/api/news', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setNews(data);
          setLoading(false);
        } else {
          const error = await response.json();
          setError(error.message);
          setLoading(false);
        }
      } catch (err) {
        setError('An unexpected error occurred.');
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) return <Spinner size="xl" color="blue.500" mx="auto" mt={10} />;

  if (error)
    return (
      <Alert status="error" mt={10}>
        <AlertIcon />
        {error}
      </Alert>
    );

  return (
    <Box maxW="600px" mx="auto" p={5}>
      <Heading as="h3" size="lg" mb={5}>
        Latest News
      </Heading>
      <Stack spacing={4}>
        {news.map((item) => (
          <Box key={item._id} p={4} boxShadow="md" borderRadius="md" border="1px solid" borderColor="gray.200">
            <Heading as="h4" size="md" mb={2}>
              {item.title}
            </Heading>
            <Text mb={2}>{item.content}</Text>
            <Text fontSize="sm" color="gray.500">
              Posted on: {new Date(item.createdAt).toLocaleString()}
            </Text>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default NewsFeed;
