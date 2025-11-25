// src/pages/AssetPage.js
import React, { useState, useEffect } from 'react';
import { Box, Heading, IconButton, useDisclosure } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import axios from 'axios';
import AssetList from '../components/AssetList';
import AssetDrawer from '../components/AssetDrawer'; // New Component

const AssetPage = () => {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null); // State to manage selected asset
  const { isOpen, onOpen, onClose } = useDisclosure(); // Controls the drawer

  useEffect(() => {
    const fetchAssets = async () => {
      const response = await axios.get('/api/assets');
      setAssets(response.data);
    };
    fetchAssets();
  }, []);

  const handleAssetAdded = () => {
    // Fetch updated assets after an asset is added or updated
    axios.get('/api/assets').then((response) => {
      setAssets(response.data);
    });
  };

  return (
    <Box p={5}>
      <Heading as="h2" size="lg" mb={4}>
        Manage Assets
        <IconButton
          ml={4}
          icon={<AddIcon />}
          onClick={onOpen}
          aria-label="Add Asset"
        />
      </Heading>
      <AssetList assets={assets} />
      <AssetDrawer
        isOpen={isOpen}
        onClose={onClose}
        selectedAsset={selectedAsset}
        onAssetAdded={handleAssetAdded}
      />
    </Box>
  );
};

export default AssetPage;
