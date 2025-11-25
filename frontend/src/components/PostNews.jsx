import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
} from '@chakra-ui/react';

const PostNews = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      if (response.ok) {
        toast({
          title: 'News posted successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setTitle('');
        setContent('');
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      maxW="500px"
      mx="auto"
      p={5}
      boxShadow="md"
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
    >
      <form onSubmit={handleSubmit}>
        <FormControl mb={4} isRequired>
          <FormLabel>Title</FormLabel>
          <Input
            type="text"
            placeholder="Enter the news title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormControl>
        <FormControl mb={4} isRequired>
          <FormLabel>Content</FormLabel>
          <Textarea
            placeholder="Enter the news content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </FormControl>
        <Button type="submit" colorScheme="blue" w="full">
          Post News
        </Button>
      </form>
    </Box>
  );
};

export default PostNews;
