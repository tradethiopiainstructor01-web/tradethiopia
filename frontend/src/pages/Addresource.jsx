import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Tag,
  TagCloseButton,
  TagLabel,
  Wrap,
  WrapItem,
  useToast
} from '@chakra-ui/react';

const ResourceForm = () => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [accessLevel, setAccessLevel] = useState('public');
  const [file, setFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const toast = useToast();

  const handleTagInputChange = (e) => setTagInput(e.target.value);

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', type);
    formData.append('description', description);
    formData.append('tags', tags.join(','));
    formData.append('accessLevel', accessLevel);
    formData.append('file', file);
    formData.append('createdBy', '60c72b2f9b1d8e1f88a29c1e'); // Replace with actual user ID

    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/resources`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast({
        title: 'Resource created.',
        description: "The resource has been created successfully.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      console.log(response)
    } catch (error) {
      toast({
        title: 'Error creating resource.',
        description: error.response?.data?.message || 'An error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6} rounded="md" bg="white" maxWidth="600px" mx="auto" boxShadow="md">
      <form onSubmit={handleSubmit}>
        <FormControl id="title" isRequired>
          <FormLabel>Title</FormLabel>
          <Input
            placeholder="Resource title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormControl>

        <FormControl id="type" isRequired mt={4}>
          <FormLabel>Type</FormLabel>
          <Select
            placeholder="Select type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="tutorial">Tutorial</option>
            <option value="book">Book</option>
            <option value="url">URL</option>
            <option value="docx">DOCX</option>
            <option value="xlsx">XLSX</option>
            <option value="audio">Audio</option>
            <option value="image">Image</option>
          </Select>
        </FormControl>

        <FormControl id="description" isRequired mt={4}>
          <FormLabel>Description</FormLabel>
          <Textarea
            placeholder="Resource description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormControl>

        <FormControl id="tags" mt={4}>
          <FormLabel>Tags</FormLabel>
          <Input
            placeholder="Enter tag and press enter"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={addTag}
          />
          <Wrap mt={2}>
            {tags.map((tag, index) => (
              <WrapItem key={index}>
                <Tag
                  size="md"
                  borderRadius="full"
                  variant="solid"
                  colorScheme="teal"
                >
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton onClick={() => removeTag(tag)} />
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </FormControl>

        <FormControl id="accessLevel" isRequired mt={4}>
          <FormLabel>Access Level</FormLabel>
          <Select
            placeholder="Select access level"
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value)}
          >
            <option value="public">Public</option>
            <option value="restricted">Restricted</option>
            <option value="private">Private</option>
          </Select>
        </FormControl>

        <FormControl id="file" isRequired mt={4}>
          <FormLabel>Upload File</FormLabel>
          <Input type="file" onChange={handleFileChange} />
        </FormControl>

        <Button mt={6} colorScheme="teal" type="submit">
          Submit
        </Button>
      </form>
    </Box>
  );
};

export default ResourceForm;
