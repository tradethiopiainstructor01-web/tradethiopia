import React, { useState } from "react";
import { Box, Heading } from "@chakra-ui/react";
import UploadTrainingMaterial from "../components/customer/UploadTrainingMaterial";
import AdminTrainingMaterialList from "../components/customer/AdminTrainingMaterialList";

const AdminTrainingUpload = () => {
  const [refresh, setRefresh] = useState(false);
  const handleUpload = () => setRefresh(r => !r);
  return (
    <Box p={8}>
      <Heading mb={6} color="teal.700">Upload Training Material</Heading>
      <UploadTrainingMaterial onUpload={handleUpload} />
      <AdminTrainingMaterialList key={refresh} />
    </Box>
  );
};

export default AdminTrainingUpload;
