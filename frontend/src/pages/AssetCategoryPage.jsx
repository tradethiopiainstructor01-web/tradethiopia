import React, { useRef } from "react";
import { Container, Heading, Box, Flex, Divider, Button } from "@chakra-ui/react";
import AssetCategoryForm from "../components/AssetCategoryForm";
import AssetCategoryList from "../components/AssetCategoryList";

const AssetCategoryPage = () => {
  const formRef = useRef(null);

  return (
    <Container maxW="7xl" py={10} mt={-50}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="lg">
          Asset Categories
        </Heading>
        <Button
          colorScheme="teal"
          onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
        >
          Add Category
        </Button>
      </Flex>

      <Flex
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between"
        gap={10}
      >
        {/* Left Side: Form Section */}
        <Box
          flex="1"
          borderWidth="1px"
          borderRadius="lg"
          padding={6}
          shadow="md"
          bg="white"
          ref={formRef}
        >
          <Heading as="h2" size="md" mb={4}>
            Create a New Asset Category
          </Heading>
          <Divider mb={4} />
          <AssetCategoryForm />
        </Box>

        {/* Right Side: Category List */}
        <Box
          flex="2"
          borderWidth="1px"
          borderRadius="lg"
          padding={6}
          shadow="md"
          bg="white"
        >
          <Heading as="h2" size="md" mb={4}>
            Asset Categories
          </Heading>
          <Divider mb={4} />
          <AssetCategoryList />
        </Box>
      </Flex>
    </Container>
  );
};

export default AssetCategoryPage;
