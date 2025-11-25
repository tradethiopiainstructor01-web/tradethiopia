// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Card,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Input,
  Button,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  Spinner,
  useDisclosure,
  IconButton,
} from "@chakra-ui/react";
import { FiEye } from 'react-icons/fi'; // Importing an eye icon from react-icons

const PDFList = () => {
  const [pdfList, setPdfList] = useState([]);
  const [filteredPdfs, setFilteredPdfs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    file: null,
  });

  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/resources/pdf`);
        const data = await response.json();
        setPdfList(data);
        setFilteredPdfs(data);
      } catch (error) {
        console.error("Error fetching PDFs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPDFs();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = pdfList.filter((pdf) =>
      pdf.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPdfs(filtered);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("type", formData.type);
    data.append("title", formData.title);
    data.append("description", formData.description);
    if (formData.file) data.append("file", formData.file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/resources/upload`, {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (response.ok) {
        alert("Resource uploaded successfully");
        setFormData({
          type: "",
          title: "",
          description: "",
          file: null,
        });
        onClose();
        // Reload resources
        const updatedResources = await fetch(`${import.meta.env.VITE_API_URL}/api/resources/pdf`);
        const updatedData = await updatedResources.json();
        setPdfList(updatedData);
        setFilteredPdfs(updatedData);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while uploading the resource.");
    }
  };

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box
    w="100%"
    h="100%"
    p={4}
    bg="gray.100" // Light gray background
    borderRadius="md" // Rounded corners
    boxShadow="md" // Subtle shadow
    overflow="hidden" // Prevent overflow
>
    <Box p={6}>
      {/* Header Section */}
      <Card p={4} mb={6} shadow="md">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Text fontSize="2xl" fontWeight="bold">
            Resources
          </Text>
          <Flex gap={4} align="center">
            <Input
              placeholder="Search PDFs..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              maxW="300px"
            />
<Button
  colorScheme="teal"
  onClick={onOpen}
  size="lg" // Larger button size
  shadow="xl" // Stronger shadow for prominence
  borderRadius="full" // Fully rounded button
  bgGradient="linear(to-r, teal.400, teal.600)" // Gradient background
  color="white"
  fontSize={12}
  px={8} // Extra horizontal padding
  py={4} // Extra vertical padding
  m={2} // Add margin for spacing around the button
  _hover={{
    bgGradient: "linear(to-r, teal.500, teal.700)", // Slightly darker gradient on hover
    transform: "scale(1.1)", // Hover scale effect
    boxShadow: "0 8px 20px rgba(0, 128, 128, 0.4)", // Glow effect
  }}
  _active={{
    transform: "scale(0.95)", // Slightly smaller on click
    boxShadow: "inset 0 3px 6px rgba(0, 128, 128, 0.5)", // Pressed-in effect
  }}
  _focus={{
    boxShadow: "0 0 0 3px rgba(72, 187, 120, 0.6)", // Focus outline for accessibility
  }}
  transition="all 0.3s ease-in-out" // Smooth transition for hover and click
>
  Add Resource
</Button>


          </Flex>
        </Flex>
      </Card>

      {/* Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Upload New Resource</DrawerHeader>
          <DrawerBody>
            <Box as="form" onSubmit={handleSubmit}>
              {/* Type */}
              <FormControl mb={4} isRequired>
                <FormLabel>Type</FormLabel>
                <Select
                  name="type"
                  placeholder="Select Type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="text">Text</option>
                </Select>
              </FormControl>

              {/* Title */}
              <FormControl mb={4} isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  type="text"
                  name="title"
                  placeholder="Enter the resource title"
                  value={formData.title}
                  onChange={handleChange}
                />
              </FormControl>

              {/* Description */}
              <FormControl mb={4}>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  placeholder="Enter a brief description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </FormControl>

              {/* File */}
              <FormControl mb={4}>
                <FormLabel>File</FormLabel>
                <Input
                  type="file"
                  name="file"
                  accept=".pdf, .mp4, .txt"
                  onChange={handleFileChange}
                />
              </FormControl>

              <Button colorScheme="teal" type="submit" width="full" mt={4}>
                Upload
              </Button>
            </Box>
          </DrawerBody>

          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Table Section */}
      <Card p={4} shadow="md">
        {filteredPdfs.length === 0 ? (
          <Text>No PDF resources found.</Text>
        ) : (
          <Box
            maxW="100%"
            maxH="500px"
            overflowX="auto"
            overflowY="auto"
            borderWidth="1px"
            borderRadius="md"
            borderColor="gray.200"
          >
            <Table variant="striped" colorScheme="teal" size="md" minWidth="600px">
              <Thead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Description</Th>
                  <Th isNumeric>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredPdfs.map((pdf) => (
                  <Tr key={pdf._id}>
                    <Td>{pdf.title}</Td>
                    <Td>{pdf.description}</Td>
                    <Td isNumeric>
                    <IconButton
  size="sm"
  colorScheme="teal"
  icon={<FiEye />} // Using the eye icon from react-icons
  aria-label="View PDF"
  onClick={() => window.open(`${import.meta.env.VITE_API_URL}${pdf.content}`, "_blank")}
  variant="outline" // Optional: you can change the variant (e.g., "solid", "ghost")
  _hover={{
    backgroundColor: "teal.200", // Adds a light background when hovered
    transform: "scale(1.1)", // Zoom-in effect on hover
    boxShadow: "lg", // Optional: add a subtle shadow effect on hover
  }}
  _active={{
    transform: "scale(1)", // Ensure the button goes back to its original size when clicked
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)", // Slightly darker shadow when clicked
  }}
/>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>
    </Box>
    </Box>
  );
};

export default PDFList;
