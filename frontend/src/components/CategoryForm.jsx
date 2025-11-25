// src/CategoryForm.jsx
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
  Heading,
} from '@chakra-ui/react';
import axios from 'axios';

const CategoryForm = () => {
  const [parentCategories, setParentCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`/api/asset-categories`);
        setParentCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (values) => {
    try {
      const response = await axios.post(`/api/assetcategories`, values);
      console.log("Category created:", response.data);
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Category name is required'),
    parent: Yup.string(),
  });

  return (
    <Formik
      initialValues={{ name: '', parent: '' }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched }) => (
        <Form>
          <Stack spacing={4}>
            <Heading as="h2" size="lg">Create New Category</Heading>

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
              <FormLabel htmlFor="parent">Parent Category</FormLabel>
              <Field name="parent" as={Select} placeholder="Select parent category">
                <option value="">None</option>
                {parentCategories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Field>
            </FormControl>

            <Button type="submit" colorScheme="teal" size="lg">
              Create Category
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  );
};

export default CategoryForm;
