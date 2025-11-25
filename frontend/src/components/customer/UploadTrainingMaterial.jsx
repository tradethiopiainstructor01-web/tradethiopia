import React, { useState } from "react";
import { Box, Button, Input, FormLabel, Select, useToast, RadioGroup, Radio, Stack, Grid, GridItem, Heading, Progress, Text } from "@chakra-ui/react";

const UploadTrainingMaterial = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoSource, setVideoSource] = useState("file");
  const [videoLink, setVideoLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!type || !title) {
      toast({ title: "Missing fields", status: "error", duration: 3000 });
      return;
    }
    
    if (!file && !(type === "video" && videoSource === "link")) {
      toast({ title: "File is required", status: "error", duration: 3000 });
      return;
    }
    
    setUploading(true);
    
    const formData = new FormData();
    formData.append("type", type);
    formData.append("title", title);
    formData.append("description", description);
    if (type === "video" && videoSource === "link") {
      formData.append("content", videoLink);
    } else if (file) {
      formData.append("file", file);
    }
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resources/upload`, {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        toast({ title: "Upload successful", status: "success", duration: 3000 });
        setFile(null); 
        setType(""); 
        setTitle(""); 
        setDescription(""); 
        setVideoLink("");
        if (onUpload) onUpload();
      } else {
        const errorData = await res.json();
        toast({ title: "Upload failed", description: errorData.message || "Unknown error", status: "error", duration: 5000 });
      }
    } catch (err) {
      toast({ title: "Error uploading", description: err.message, status: "error", duration: 5000 });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box p={6} borderRadius="2xl" boxShadow="2xl" bgGradient="linear(to-br, teal.50, teal.100)" mb={8} maxW="700px" mx="auto">
      <Heading size="md" color="teal.700" mb={6} textAlign="center">Upload Training Material</Heading>
      
      {uploading && (
        <Box mb={4}>
          <Text fontSize="sm" color="teal.600" mb={2} textAlign="center">
            Uploading your file... Please wait
          </Text>
          <Progress 
            size="sm" 
            colorScheme="teal" 
            hasStripe 
            isAnimated 
          />
        </Box>
      )}
      
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
        <GridItem>
          <FormLabel fontWeight="bold">Title</FormLabel>
          <Input 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="Title" 
            mb={4} 
            size="lg" 
            borderRadius="lg" 
            isDisabled={uploading}
          />
          <FormLabel fontWeight="bold">Description</FormLabel>
          <Input 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Description" 
            mb={4} 
            size="lg" 
            borderRadius="lg" 
            isDisabled={uploading}
          />
          <FormLabel fontWeight="bold">Type</FormLabel>
          <Select 
            value={type} 
            onChange={e => setType(e.target.value)} 
            mb={4} 
            size="lg" 
            borderRadius="lg" 
            isDisabled={uploading}
          >
            <option value="">Select type</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="document">Document</option>
            <option value="excel">Excel Spreadsheet</option>
            <option value="powerpoint">PowerPoint Presentation</option>
          </Select>
        </GridItem>
        <GridItem>
          {type === "video" && (
            <>
              <FormLabel fontWeight="bold">Video Source</FormLabel>
              <RadioGroup value={videoSource} onChange={setVideoSource} mb={4} isDisabled={uploading}>
                <Stack direction="row">
                  <Radio value="file">Upload File</Radio>
                  <Radio value="link">YouTube/External Link</Radio>
                </Stack>
              </RadioGroup>
              {videoSource === "link" ? (
                <>
                  <FormLabel fontWeight="bold">Video Link</FormLabel>
                  <Input 
                    value={videoLink} 
                    onChange={e => setVideoLink(e.target.value)} 
                    placeholder="Paste YouTube or video link here" 
                    mb={4} 
                    size="lg" 
                    borderRadius="lg" 
                    isDisabled={uploading}
                  />
                </>
              ) : (
                <>
                  <FormLabel fontWeight="bold">File</FormLabel>
                  <Input 
                    type="file" 
                    onChange={handleFileChange} 
                    mb={4} 
                    size="lg" 
                    borderRadius="lg" 
                    isDisabled={uploading}
                    accept={type === "video" ? "video/*" : 
                           type === "pdf" ? ".pdf" : 
                           type === "document" ? ".doc,.docx" : 
                           type === "excel" ? ".xls,.xlsx" : 
                           type === "powerpoint" ? ".ppt,.pptx" : "*"} 
                  />
                </>
              )}
            </>
          )}
          {type !== "video" && (
            <>
              <FormLabel fontWeight="bold">File</FormLabel>
              <Input 
                type="file" 
                onChange={handleFileChange} 
                mb={4} 
                size="lg" 
                borderRadius="lg" 
                isDisabled={uploading}
                accept={type === "video" ? "video/*" : 
                       type === "pdf" ? ".pdf" : 
                       type === "document" ? ".doc,.docx" : 
                       type === "excel" ? ".xls,.xlsx" : 
                       type === "powerpoint" ? ".ppt,.pptx" : "*"} 
              />
            </>
          )}
        </GridItem>
      </Grid>
      <Button 
        colorScheme="teal" 
        size="lg" 
        width="100%" 
        borderRadius="full" 
        fontWeight="bold" 
        mt={6} 
        boxShadow="md" 
        onClick={handleUpload}
        isLoading={uploading}
        loadingText="Uploading..."
        isDisabled={uploading || (!file && !(type === "video" && videoSource === "link"))}
      >
        {uploading ? "Uploading..." : "Upload"}
      </Button>
    </Box>
  );
};

export default UploadTrainingMaterial;