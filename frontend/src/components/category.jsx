import React, { useState, useEffect } from 'react';
import {
  Box,
  Input,
  Textarea,
  Button,
  Heading,
  List,
  ListItem,
  useToast,
  Spinner,
  Center,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  HStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch categories from the API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      toast({
        title: 'Error fetching categories',
        description: error.response?.data?.message || 'There was an error fetching the categories.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new category
  const createCategory = async () => {
    if (!name || !description) {
      toast({
        title: 'Missing fields',
        description: 'Please provide both category name and description.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/categories`, { name, description });
      toast({
        title: 'Category created',
        description: 'The new category was successfully created.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setName('');
      setDescription('');
      fetchCategories();
    } catch (error) {
      toast({
        title: 'Error creating category',
        description: error.response?.data?.message || 'There was an error creating the category.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open the modal to edit a category
  const openEditModal = (category) => {
    setSelectedCategory(category);
    setName(category.name);
    setDescription(category.description);
    onOpen();
  };

  // Close the modal
  const closeEditModal = () => {
    setSelectedCategory(null);
    setName('');
    setDescription('');
    onClose();
  };

  // Edit the selected category
  const handleEditCategory = async () => {
    if (!name || !description) {
      toast({
        title: 'Missing fields',
        description: 'Please provide both category name and description.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/categories/${selectedCategory._id}`, {
        name,
        description,
      });
      toast({
        title: 'Category updated',
        description: 'The category was successfully updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchCategories();
      closeEditModal();
    } catch (error) {
      toast({
        title: 'Error updating category',
        description: error.response?.data?.message || 'There was an error updating the category.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

// Delete a category
const handleDeleteCategory = async (categoryId) => {
  try {
    // Check if the category is used by any document item
    const usageResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories/check-usage/${categoryId}`);
    if (usageResponse.status === 400) {
      toast({
        title: 'Cannot delete category',
        description: 'This category is used by document items and cannot be deleted.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Proceed with deletion if the category is not used
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/categories/${categoryId}`);
    toast({
      title: 'Category deleted',
      description: 'The category was successfully deleted.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    fetchCategories();
  } catch (error) {
    toast({
      title: 'Error deleting category',
      description: error.response?.data?.message || 'There was an error deleting the category.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }
};

  // Fetch categories on page load
  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <Box maxW="600px" mx="auto" p={5}>
      <Heading as="h1" mb={6} textAlign="center">
        Category Management
      </Heading>

      {/* Create Category Form */}
      <Box mb={6} p={5} border="1px solid" borderRadius="md" boxShadow="lg">
        <Heading as="h2" size="md" mb={4}>
          Create Category
        </Heading>
        <Input
          placeholder="Category Name"
          mb={3}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          placeholder="Category Description"
          mb={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button
          colorScheme="teal"
          onClick={createCategory}
          isLoading={isSubmitting}
          loadingText="Submitting"
        >
          Create Category
        </Button>
      </Box>

      {/* Categories List */}
      <Box p={5} border="1px solid" borderRadius="md" boxShadow="lg">
        <Heading as="h2" size="md" mb={4}>
          Categories
        </Heading>
        {loading ? (
          <Center>
            <Spinner size="xl" />
          </Center>
        ) : (
          <List spacing={3}>
            {categories.length > 0 ? (
              categories.map((category) => (
                <ListItem key={category._id}>
                  <Card
                    mb={4}
                    boxShadow="lg"
                    borderRadius="md"
                    _hover={{
                      transform: 'scale(1.05)',
                      boxShadow: 'xl',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <CardHeader>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">{category.name}</Text>
                        <HStack>
                          <IconButton
                            icon={<FaEdit />}
                            onClick={() => openEditModal(category)}
                            aria-label="Edit"
                          />
                          <IconButton
                            icon={<FaTrash />}
                            onClick={() => handleDeleteCategory(category._id)}
                            aria-label="Delete"
                          />
                        </HStack>
                      </HStack>
                    </CardHeader>
                    <CardBody>{category.description}</CardBody>
                  </Card>
                </ListItem>
              ))
            ) : (
              <ListItem>No categories available</ListItem>
            )}
          </List>
        )}
      </Box>

      {/* Edit Category Modal */}
      <Modal isOpen={isOpen} onClose={closeEditModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Category</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Category Name"
              mb={3}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="Category Description"
              mb={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="teal" onClick={handleEditCategory}>
              Save Changes
            </Button>
            <Button variant="ghost" onClick={closeEditModal}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Category;
