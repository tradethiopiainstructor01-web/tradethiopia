import React, { useEffect, useState } from "react";
import { Box, Card, CardBody, Text, Button, Flex, Tag, IconButton, useToast } from "@chakra-ui/react";
import { FaDownload, FaEye, FaTrash } from "react-icons/fa";

const AdminTrainingMaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources/`);
      const data = await res.json();
      setMaterials(data);
    } catch (err) {
      toast({ title: "Failed to fetch materials", status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Resource deleted", status: "success", duration: 2000 });
        fetchMaterials();
      } else {
        const data = await res.json();
        toast({ title: data.message || "Failed to delete", status: "error", duration: 3000 });
      }
    } catch (err) {
      toast({ title: "Error deleting resource", status: "error", duration: 3000 });
    }
  };

  // Function to determine if a file can be viewed in browser
  const canViewInBrowser = (type) => {
    return ['pdf', 'document', 'excel', 'powerpoint'].includes(type);
  };

  // Function to determine button text based on file type
  const getButtonText = (type) => {
    if (type === 'video') return 'View';
    if (canViewInBrowser(type)) return 'View';
    return 'Download';
  };

  // Function to determine button icon based on file type
  const getButtonIcon = (type) => {
    if (type === 'video' || canViewInBrowser(type)) {
      return <FaEye />;
    }
    return <FaDownload />;
  };

  if (loading) return <Text>Loading...</Text>;

  return (
    <Box mt={8}>
      <Text fontSize="2xl" fontWeight="bold" mb={4} color="teal.700">Uploaded Training Materials</Text>
      <Flex wrap="wrap" gap={6} justify="flex-start">
        {materials.length === 0 ? (
          <Text>No training materials found.</Text>
        ) : (
          materials.map(material => (
            <Card key={material._id} maxW="sm" borderWidth="1px" borderRadius="md" boxShadow="md">
              <CardBody>
                <Flex align="center" justify="space-between" mb={2}>
                  <Text fontSize="lg" fontWeight="bold">{material.title}</Text>
                  <Tag colorScheme={material.type === "video" ? "purple" : 
                                   material.type === "pdf" ? "blue" : 
                                   material.type === "document" ? "green" : 
                                   material.type === "excel" ? "orange" : 
                                   material.type === "powerpoint" ? "pink" : "gray"}>
                    {material.type === "powerpoint" ? "PPT" : material.type.toUpperCase()}
                  </Tag>
                </Flex>
                <Text mb={2}>{material.description}</Text>
                <Flex gap={2}>
                  {material.type === "video" ? (
                    material.fileUrl ? (
                      <Button leftIcon={<FaEye />} colorScheme="teal" as="a" href={material.fileUrl} target="_blank">View</Button>
                    ) : (
                      <Button leftIcon={<FaEye />} colorScheme="teal" as="a" href={material.content} target="_blank">View</Button>
                    )
                  ) : material.fileUrl ? (
                    <Button 
                      leftIcon={getButtonIcon(material.type)} 
                      colorScheme={canViewInBrowser(material.type) ? "teal" : "blue"}
                      as="a" 
                      href={material.fileUrl} 
                      target={canViewInBrowser(material.type) ? "_blank" : "_self"}
                      download={!canViewInBrowser(material.type)}
                    >
                      {getButtonText(material.type)}
                    </Button>
                  ) : (
                    <Button 
                      leftIcon={getButtonIcon(material.type)} 
                      colorScheme={canViewInBrowser(material.type) ? "teal" : "blue"}
                      as="a" 
                      href={material.content} 
                      target={canViewInBrowser(material.type) ? "_blank" : "_self"}
                      download={!canViewInBrowser(material.type)}
                    >
                      {getButtonText(material.type)}
                    </Button>
                  )}
                  <IconButton aria-label="Delete" icon={<FaTrash />} colorScheme="red" variant="outline" onClick={() => handleDelete(material._id)} />
                </Flex>
              </CardBody>
            </Card>
          ))
        )}
      </Flex>
    </Box>
  );
};

export default AdminTrainingMaterialList;