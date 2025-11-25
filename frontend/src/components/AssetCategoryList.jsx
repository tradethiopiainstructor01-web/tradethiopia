import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  List,
  ListItem,
  Button,
  Collapse,
  Spinner,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  HStack,
  IconButton,
  Text,
  Input,
  Alert,
  AlertIcon
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronRightIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";

const AssetCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // For edit loading state
  const [isDeleting, setIsDeleting] = useState(false); // For delete loading state
  const toast = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/assetcategories`
      );
      // The API returns {success: true, data: [...]} structure
      // We need to extract the actual categories array from response.data.data
      const categoriesData = response.data && response.data.data ? response.data.data : [];
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Error fetching categories");
      toast({
        title: "Error fetching categories.",
        description: "Unable to load categories. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleDeleteCategory = async () => {
    if (categoryToDelete) {
      setIsDeleting(true);
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/assetcategories/${categoryToDelete._id}`
        );
        toast({
          title: "Category deleted.",
          description: "The category has been successfully deleted.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        await fetchCategories(); // Refetch categories after delete
      } catch (error) {
        console.error("Error deleting category:", error);
        toast({
          title: "Error deleting category.",
          description: "There was an error deleting the category. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
        setIsDeleting(false);
      }
    }
  };

  const handleEditCategory = async () => {
    if (!editCategory || !newCategoryName.trim()) return;

    setIsUpdating(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/assetcategories/${editCategory._id}`,
        { name: newCategoryName }
      );
      toast({
        title: "Category updated.",
        description: "The category name has been successfully updated.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      await fetchCategories(); // Refetch categories after edit
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error updating category.",
        description: "There was an error updating the category. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEditDialogOpen(false);
      setEditCategory(null);
      setNewCategoryName("");
      setIsUpdating(false);
    }
  };

  const renderCategoryTree = (category) => {
    // Ensure categories is an array before filtering
    const subcategories = Array.isArray(categories) 
      ? categories.filter((cat) => cat?.parent && cat.parent._id === category?._id)
      : [];

    return (
      <ListItem
        key={category?._id}
        marginY={2}
        borderBottom="1px"
        borderColor="gray.200"
        paddingBottom={2}
        bg={category?.parent ? "transparent" : "gray.50"}
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <Button
              variant="link"
              colorScheme="teal"
              onClick={() => toggleCategory(category?._id)}
              fontSize={category?.parent ? "md" : "lg"}
              fontWeight={category?.parent ? "normal" : "bold"}
              textAlign="left"
              width="100%"
            >
              {expandedCategories[category?._id] ? (
                <ChevronDownIcon />
              ) : (
                <ChevronRightIcon />
              )}
              <Text>{category?.name}</Text>
            </Button>
          </HStack>
          <HStack spacing={1}>
            <IconButton
              icon={<EditIcon />}
              aria-label="Edit Category"
              variant="ghost"
              colorScheme="blue"
              size="sm"
              onClick={() => {
                setEditCategory(category);
                setNewCategoryName(category?.name || "");
                setEditDialogOpen(true);
              }}
            />
            <IconButton
              icon={<DeleteIcon />}
              aria-label="Delete Category"
              variant="ghost"
              colorScheme="red"
              size="sm"
              onClick={() => {
                setCategoryToDelete(category);
                setDeleteDialogOpen(true);
              }}
            />
          </HStack>
        </HStack>

        {subcategories.length > 0 && (
          <Collapse in={expandedCategories[category?._id]} animateOpacity>
            <List paddingLeft={5}>
              {subcategories.map((subcategory) =>
                renderCategoryTree(subcategory)
              )}
            </List>
          </Collapse>
        )}
      </ListItem>
    );
  };

  if (loading) {
    return (
      <Box padding={4} maxWidth="800px" margin="auto">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={4} maxWidth="800px" margin="auto">
        <Alert status="error" variant="left-accent">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box padding={4} maxWidth="800px" margin="auto">
      <Heading as="h2" size="lg" marginBottom={4} textAlign="center">
        Asset Categories
      </Heading>
      {Array.isArray(categories) && categories.length > 0 ? (
        <List spacing={3}>
          {categories
            .filter((category) => !category?.parent)
            .map((mainCategory) => renderCategoryTree(mainCategory))}
        </List>
      ) : (
        <Box textAlign="center" py={10}>
          <Text>No categories found</Text>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Category
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete the category "
              {categoryToDelete?.name}"? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button isLoading={isDeleting} onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button colorScheme="red" isLoading={isDeleting} onClick={handleDeleteCategory} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Edit Category Dialog */}
      <AlertDialog
        isOpen={isEditDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Edit Category
            </AlertDialogHeader>
            <AlertDialogBody>
              <Input
                placeholder="Enter new category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button isLoading={isUpdating} onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button colorScheme="blue" isLoading={isUpdating} onClick={handleEditCategory} ml={3}>
                Save
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default AssetCategoryList;