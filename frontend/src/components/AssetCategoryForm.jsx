import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  FormErrorMessage,
  Stack,
  Spinner,
  useToast,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import axios from 'axios';

const AssetCategoryForm = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const [subcategories, setSubcategories] = useState([]);
  const [subSubcategories, setSubSubcategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/assetcategories`);
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
    fetchCategories();
  }, [toast]);

  const handleParentChange = (parentId) => {
    // Ensure categories is an array before filtering
    if (!Array.isArray(categories)) {
      setSubcategories([]);
      setSubSubcategories([]);
      return;
    }
    
    const selectedSubcategories = categories.filter((cat) => cat?.parent && cat.parent._id === parentId);
    setSubcategories(selectedSubcategories);
    setSubSubcategories([]); // Reset sub-subcategories when changing parent category
  };

  const handleSubcategoryChange = (subcategoryId) => {
    // Ensure categories is an array before filtering
    if (!Array.isArray(categories)) {
      setSubSubcategories([]);
      return;
    }
    
    const selectedSubSubcategories = categories.filter(
      (cat) => cat?.parent && cat.parent._id === subcategoryId
    );
    setSubSubcategories(selectedSubSubcategories);
  };

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const dataToSend = {
        name: values.name,
        parent: values.subsubcategory || values.subcategory || values.parent || null,
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/assetcategories`, dataToSend);
      toast({
        title: "Category created.",
        description: "Your new category has been successfully created.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      resetForm();
      setSubcategories([]);
      setSubSubcategories([]);
      
      // Refresh categories
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/assetcategories`);
      const categoriesData = response.data && response.data.data ? response.data.data : [];
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error creating category.",
        description: "There was an error. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Category name is required"),
    parent: Yup.string(),
    subcategory: Yup.string(),
    subsubcategory: Yup.string(),
  });

  if (loading) {
    return <Spinner size="xl" />;
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
    <>
      <Formik
        initialValues={{ name: '', parent: '', subcategory: '', subsubcategory: '' }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, setFieldValue }) => (
          <Form>
            <Stack spacing={4}>
              <FormControl isInvalid={touched.name && errors.name}>
                <FormLabel htmlFor="name">Category Name</FormLabel>
                <Field name="name">
                  {({ field }) => (
                    <Input id="name" placeholder="Enter category name" {...field} />
                  )}
                </Field>
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="parent">Parent Category (Optional)</FormLabel>
                <Field name="parent" as={Select} onChange={(e) => {
                  setFieldValue('parent', e.target.value);
                  handleParentChange(e.target.value);
                }}>
                  <option value="">Select a parent category (optional)</option>
                  {Array.isArray(categories) && categories.filter((cat) => !cat?.parent).map((category) => (
                    <option key={category?._id} value={category?._id}>
                      {category?.name}
                    </option>
                  ))}
                </Field>
              </FormControl>

              {Array.isArray(subcategories) && subcategories.length > 0 && (
                <FormControl>
                  <FormLabel htmlFor="subcategory">Subcategory</FormLabel>
                  <Field name="subcategory" as={Select} onChange={(e) => {
                    setFieldValue('subcategory', e.target.value);
                    handleSubcategoryChange(e.target.value);
                  }}>
                    <option value="">Select a subcategory</option>
                    {subcategories.map((subcat) => (
                      <option key={subcat?._id} value={subcat?._id}>
                        {subcat?.name}
                      </option>
                    ))}
                  </Field>
                </FormControl>
              )}

              {Array.isArray(subSubcategories) && subSubcategories.length > 0 && (
                <FormControl>
                  <FormLabel htmlFor="subsubcategory">Sub-Subcategory</FormLabel>
                  <Field name="subsubcategory" as={Select}>
                    <option value="">Select a sub-subcategory</option>
                    {subSubcategories.map((subSubcat) => (
                      <option key={subSubcat?._id} value={subSubcat?._id}>
                        {subSubcat?.name}
                      </option>
                    ))}
                  </Field>
                </FormControl>
              )}

              <Button type="submit" colorScheme="teal">
                Create Category
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default AssetCategoryForm;