import { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  Button,
  Input,
  Select,
  useToast,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  DrawerFooter,
  Text,
  Stack,
  IconButton,
  FormControl,
  FormLabel,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Textarea,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { FaTrash, FaEdit, FaDownload } from 'react-icons/fa';
import axios from 'axios';

const ResourceTable = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [filters, setFilters] = useState({
    title: '',
    type: '',
    accessLevel: '',
    tags: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    type: '',
    description: '',
    tags: '',
    accessLevel: 'public',
    file: null
  });
  const [tagInput, setTagInput] = useState('');
  const toast = useToast();

  const handleTagInputChange = (e) => setTagInput(e.target.value);

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!newResource.tags.split(',').includes(tagInput.trim())) {
        setNewResource((prev) => ({
          ...prev,
          tags: prev.tags ? prev.tags + ',' + tagInput.trim() : tagInput.trim()
        }));
        setTagInput('');
      }
    }
  };

  const removeTag = (tag) => {
    setNewResource((prev) => ({
      ...prev,
      tags: prev.tags.split(',').filter((t) => t !== tag).join(',')
    }));
  };

  const handleFileChange = (e) => {
    setNewResource((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newResource.title);
    formData.append('type', newResource.type);
    formData.append('description', newResource.description);
    formData.append('tags', newResource.tags);
    formData.append('accessLevel', newResource.accessLevel);
    formData.append('file', newResource.file);
    formData.append('createdBy', '60c72b2f9b1d8e1f88a29c1e'); // Replace with actual user ID

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/resources`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast({
        title: 'Resource created.',
        description: 'The resource has been created successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setIsDrawerOpen(false); // Close drawer after submitting
      fetchResources(); // Refresh resources list
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


  const deleteResource = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/resources/${id}`);
      toast({
        title: 'Resource deleted.',
        description: 'The resource has been deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      // Update the resources and filteredResources state
      setResources((prev) => prev.filter((resource) => resource?._id !== id));
      setFilteredResources((prev) => prev.filter((resource) => resource?._id !== id));
    } catch (error) {
      toast({
        title: 'Error deleting resource.',
        description: error.response?.data?.message || 'An error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };





  // Fetch resources from the backend API
  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/resources`);
      // The API returns {success: true, data: [...]} structure
      // We need to extract the actual resources array from response.data.data
      const resourcesData = response.data && response.data.data ? response.data.data : [];
      setResources(resourcesData);
      setFilteredResources(resourcesData); // Initially show all resources
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError("Failed to load resources");
      setResources([]);
      setFilteredResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    const interval = setInterval(fetchResources, 10000); // Update every 10 seconds
    return () => clearInterval(interval); // Clean up interval on component unmount
  }, []);

  // Filter resources based on the search term and filters
  const applyFilters = () => {
    // Ensure resources is an array before filtering
    if (!Array.isArray(resources)) {
      setFilteredResources([]);
      return;
    }
    
    let filteredData = [...resources];

    // Filter based on search term
    if (searchTerm) {
      filteredData = filteredData.filter((resource) =>
        resource?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply additional filters
    if (filters.title) {
      filteredData = filteredData.filter((resource) =>
        resource?.title?.toLowerCase().includes(filters.title.toLowerCase())
      );
    }
    if (filters.type) {
      filteredData = filteredData.filter((resource) => resource?.type === filters.type);
    }
    if (filters.accessLevel) {
      filteredData = filteredData.filter((resource) => resource?.accessLevel === filters.accessLevel);
    }
    if (filters.tags) {
      filteredData = filteredData.filter((resource) =>
        resource?.tags?.split(',').some((tag) => tag.toLowerCase().includes(filters.tags.toLowerCase()))
      );
    }
    setFilteredResources(filteredData);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    applyFilters();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters, [name]: value };
      applyFilters(updatedFilters);
      return updatedFilters;
    });
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" variant="left-accent">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" mt={5} p={5}>
      <Text fontSize="3xl" fontWeight="bold" mb={5}>Resource Page</Text>

      <Stack direction={['column', 'row']} spacing={4} mb={5}>
        <Input
          name="title"
          placeholder="Search by Title"
          value={searchTerm}
          onChange={handleSearchChange}
          size="sm"
          width="auto"
        />
        <Select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
          size="sm"
          width="auto"
          placeholder="Filter by Type"
        >
          <option value="article">Article</option>
          <option value="video">Video</option>
          <option value="pdf">PDF</option>
          <option value="tutorial">Tutorial</option>
          <option value="book">Book</option>
          <option value="url">URL</option>
        </Select>
        <Select
          name="accessLevel"
          value={filters.accessLevel}
          onChange={handleFilterChange}
          size="sm"
          width="auto"
          placeholder="Filter by Access Level"
        >
          <option value="public">Public</option>
          <option value="restricted">Restricted</option>
          <option value="private">Private</option>
        </Select>
        <Input
          name="tags"
          placeholder="Search by Tags"
          value={filters.tags}
          onChange={handleFilterChange}
          size="sm"
          width="auto"
        />
        <Button colorScheme="teal" onClick={openDrawer}>
          Add Resource
        </Button>
      </Stack>

      <Table variant="striped" colorScheme="teal" rounded="lg" boxShadow="lg" border="1px solid #e1e1e1" overflowX="auto">
        <TableCaption>Resources List</TableCaption>
        <Thead>
          <Tr bgGradient="linear(to-r, teal.400, blue.500)">
            <Th color="white">Title</Th>
            <Th color="white">Type</Th>
            <Th color="white">Tags</Th>
            <Th color="white">Access Level</Th>
            <Th color="white">Download</Th>
            <Th color="white">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Array.isArray(filteredResources) && filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <Tr key={resource?._id || resource?.title}>
                <Td>{resource?.title}</Td>
                <Td>{resource?.type}</Td>
                <Td>
                  {resource?.tags?.split(',').map((tag, index) => tag && (
                    <Tag key={index} colorScheme="teal" mr={2}>
                      <TagLabel>{tag}</TagLabel>
                    </Tag>
                  ))}
                </Td>
                <Td>{resource?.accessLevel}</Td>
                <Td>
                  {resource?.filePath && (
                    <IconButton
                      icon={<FaDownload />}
                      colorScheme="teal"
                      size="sm"
                      as="a"
                      href={`${import.meta.env.VITE_API_URL}/${resource.filePath}`}
                      download
                      aria-label="Download resource"
                    />
                  )}
                </Td>
                <Td>
                  <IconButton
                    icon={<FaEdit />}
                    colorScheme="blue"
                    size="sm"
                    mr={2}
                    onClick={() => alert('Edit functionality not implemented yet')}
                  />
                  <IconButton
                    icon={<FaTrash />}
                    colorScheme="red"
                    size="sm"
                    onClick={() => deleteResource(resource?._id)}
                  />
                </Td>
              </Tr>
            ))
          ) : (
            <Tr>
              <Td colSpan={6} textAlign="center">
                No resources found
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      {/* Drawer for Adding New Resource */}
      <Drawer isOpen={isDrawerOpen} onClose={closeDrawer} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>Create New Resource</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Type</FormLabel>
                <Select
                  value={newResource.type}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                >
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="book">Book</option>
                  <option value="url">URL</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newResource.description}
                  onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Tags</FormLabel>
                <Input
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={addTag}
                  placeholder="Press Enter to add a tag"
                />
                <Wrap mt={2}>
                  {newResource.tags.split(',').map((tag, index) => tag && (
                    <WrapItem key={index}>
                      <Tag
                        size="sm"
                        colorScheme="teal"
                        variant="solid"
                        cursor="pointer"
                        onClick={() => removeTag(tag)}
                      >
                        <TagLabel>{tag}</TagLabel>
                        <TagCloseButton />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </FormControl>
              <FormControl>
                <FormLabel>Access Level</FormLabel>
                <Select
                  value={newResource.accessLevel}
                  onChange={(e) => setNewResource({ ...newResource, accessLevel: e.target.value })}
                >
                  <option value="public">Public</option>
                  <option value="restricted">Restricted</option>
                  <option value="private">Private</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>File</FormLabel>
                <Input type="file" onChange={handleFileChange} />
              </FormControl>
            </Stack>
          </DrawerBody>

          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={closeDrawer}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleSubmit}>
              Submit
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default ResourceTable;