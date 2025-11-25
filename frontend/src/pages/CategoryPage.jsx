// src/pages/CategoryPage.js
import React, { useState, useEffect } from 'react';
import { Box, Heading } from '@chakra-ui/react';
import axios from 'axios';
import CategoryForm from '../components/CategoryForm';
import CategoryList from '../components/CategoryList';

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await axios.get('/api/assetCategories');
      setCategories(response.data);
    };
    fetchCategories();
  }, []);

  return (
    <Box p={5}>
      <Heading as="h2" size="lg" mb={4}>Manage Categories</Heading>
      <CategoryForm onCategoryAdded={() => setCategories((prev) => [...prev])} />
      <CategoryList categories={categories} />
    </Box>
  );
};

export default CategoryPage;