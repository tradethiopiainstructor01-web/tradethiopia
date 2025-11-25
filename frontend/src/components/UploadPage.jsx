// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useDisclosure,
  Box,
} from "@chakra-ui/react";

const UploadResource = () => {
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    file: null,
  });

  const { isOpen, onOpen, onClose } = useDisclosure();

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
      const response = await fetch("${import.meta.env.VITE_API_URL}/api/resources/upload", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (response.ok) {
        alert("Resource uploaded successfully");
        onClose(); // Close the drawer on successful upload
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while uploading the resource.");
    }
  };

  return (
    <Box>
      <Button colorScheme="teal" onClick={onOpen}>
        Upload Resource
      </Button>

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
    </Box>
  );
};

export default UploadResource;
