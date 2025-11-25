// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";
import { Box, Card, CardBody, Text, Button } from "@chakra-ui/react";
import Layout from "./Layout";

export const PDFList = () => {
  const [pdfList, setPdfList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch PDFs from the backend
    const fetchPDFs = async () => {
      try {
        const response = await fetch("${import.meta.env.VITE_API_URL}/api/resources/pdf");
        const data = await response.json();
        setPdfList(data);
      } catch (error) {
        console.error("Error fetching PDFs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPDFs();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout display="flex" flexDirection="column" minHeight="100vh" paddingTop="80px">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        padding="20px"
        backgroundColor="#f4f4f4"
        flex="1"
      >
        <Text fontSize="36px" fontWeight="bold" color="#003366" marginBottom="20px" textAlign="center">
          Which types of Resource do you want?
        </Text>

        <Box display="flex" flexWrap="wrap" gap={4} justifyContent="center" width="100%">
          {pdfList.length === 0 ? (
            <Text>No PDF resources found.</Text>
          ) : (
            pdfList.map((pdf) => (
              <Card key={pdf._id} maxW="sm" borderWidth="1px" borderRadius="md" boxShadow="md">
                <CardBody>
                  <Text fontSize="xl" fontWeight="bold">{pdf.title}</Text>
                  <Text mt={2}>{pdf.description}</Text>
                  <Button
                    mt={4}
                    colorScheme="teal"
                    onClick={() => {
                      const fileURL = `${import.meta.env.VITE_API_URL}${pdf.content}`;
                      console.log("Opening file URL:", fileURL); // Debugging step
                      window.open(fileURL, "_blank");
                    }}
                  >
                    View PDF
                  </Button>
                </CardBody>
              </Card>
            ))
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default PDFList;
