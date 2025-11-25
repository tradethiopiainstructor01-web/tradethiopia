import React, { useEffect, useState } from 'react';
import {
  List,
  ListItem,
  HStack,
  Box,
  IconButton,
  useDisclosure,
  Input,
  Text,
  Divider,
  Flex,
  Checkbox,
  VStack,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import axios from 'axios';
import AssetDetailDrawer from './AssetDetailDrawer';

const AssetList = () => {
  const [assets, setAssets] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');


  const fetchAssetsData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/assets`);
      // The API returns {success: true, data: [...]} structure
      // We need to extract the actual assets array from response.data.data
      const assetsData = response.data && response.data.data ? response.data.data : [];
      setAssets(assetsData);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAssets([]); // Set to empty array on error
    }
  };

  useEffect(() => {
    fetchAssetsData();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this asset?");
    if (confirmDelete) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/assets/${id}`);
        fetchAssetsData();
      } catch (error) {
        console.error("Error deleting asset:", error.response?.data || error.message);
      }
    }
  };

  const handleUpdateAsset = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${selectedAsset._id}`, selectedAsset);
      fetchAssetsData();
      onClose();
    } catch (error) {
      console.error("Error updating asset:", error.response?.data || error.message);
    }
  };

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    onOpen();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'green.500';
      case 'Inactive':
        return 'red.500';
      case 'Under Maintenance':
        return 'yellow.500';
      default:
        return 'gray.500';
    }
  };

  const filteredAssets = assets.filter(asset => {
    // Ensure asset exists before accessing properties
    if (!asset) return false;
    
    const matchesSearch = 
      (asset.name ? asset.name.toLowerCase().includes(filter.toLowerCase()) : false) ||
      (asset.nameTag ? asset.nameTag.toLowerCase().includes(filter.toLowerCase()) : false) ||
      (asset.assignedTo ? asset.assignedTo.toLowerCase().includes(filter.toLowerCase()) : false) ||
      (asset.category ? asset.category.toLowerCase().includes(filter.toLowerCase()) : false) ||
      (asset.assets ? asset.assets.toLowerCase().includes(filter.toLowerCase()) : false);
    
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(asset.category);
    const matchesAssignedTo = assignedTo ? asset.assignedTo === assignedTo : true;
    const matchesAssets = location ? asset.assets === location : true;
    const matchesLocation = location ? asset.location === location : true;
    const matchesStatus = status ? asset.status === status : true;
    const matchesGroup = selectedGroup ? asset.assets === selectedGroup : true; // Add this line
  
    return matchesSearch && matchesCategory && matchesAssignedTo && matchesLocation && matchesStatus && matchesAssets && matchesGroup; // Include matchesGroup
  });

  // Ensure assets is an array before mapping
  const uniqueCategories = Array.isArray(assets) ? [...new Set(assets.map(asset => asset?.category).filter(Boolean))] : [];
  const uniqueAssignedTo = Array.isArray(assets) ? [...new Set(assets.map(asset => asset?.assignedTo).filter(Boolean))] : [];
  const uniqueAssets = Array.isArray(assets) ? [...new Set(assets.map(asset => asset?.assets).filter(Boolean))] : [];
  const uniqueLocation = Array.isArray(assets) ? [...new Set(assets.map(asset => asset?.location).filter(Boolean))] : [];
  const uniqueStatuses = Array.isArray(assets) ? [...new Set(assets.map(asset => asset?.status).filter(Boolean))] : [];

  return (
    <Flex direction={{ base: 'column', md: 'row' }} p={4} gap={4}>
      <Box 
        width={{ base: '100%', md: '30%' }} 
        p={6} 
        borderWidth={1} 
        borderRadius="lg" 
        boxShadow="lg" 
        bg={useColorModeValue("whiteAlpha.900", "gray.700")}
        borderColor={useColorModeValue("gray.200", "gray.600")}
      >
        <Text fontSize="xl" mb={4} fontWeight="bold" color="teal.600" _dark={{ color: "teal.300" }}>Filters</Text>
        <Divider mb={4} />

        <Input
          placeholder="Search ..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          mb={4}
          borderColor={useColorModeValue("gray.300", "gray.600")}
          _hover={{ borderColor: 'teal.500' }}
          _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
        />

        <Divider />

        <Text fontWeight="bold" mb={2} mt={4} color="teal.600" _dark={{ color: "teal.300" }}>Assigned To</Text>
        <Select
          placeholder="Select Assigned To"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          mb={4}
          borderColor={useColorModeValue("gray.300", "gray.600")}
          _hover={{ borderColor: 'teal.500' }}
          _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
        >
          {uniqueAssignedTo.map((person) => (
            <option key={person} value={person}>{person}</option>
          ))}
        </Select>

        <Text fontWeight="bold" mb={2} color="teal.600" _dark={{ color: "teal.300" }}>Group</Text>
<Select
  placeholder="Select Group"
  value={selectedGroup} // Use selectedGroup instead of assets
  onChange={(e) => setSelectedGroup(e.target.value)} // Update state on change
  mb={4}
  borderColor={useColorModeValue("gray.300", "gray.600")}
  _hover={{ borderColor: 'teal.500' }}
  _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
>
  {uniqueAssets.filter(group => group).map((group) => ( // Filter out empty values
    <option key={group} value={group}>{group}</option>
  ))}
</Select>

        {/* <Text fontWeight="bold" mb={2} color="teal.600" _dark={{ color: "teal.300" }}>Location</Text>
        <Select
          placeholder="Select Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          mb={4}
          borderColor={useColorModeValue("gray.300", "gray.600")}
          _hover={{ borderColor: 'teal.500' }}
          _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
        >
          {uniqueLocation.map((loca) => (
            <option key={loca} value={loca}>{loca}</option>
          ))}
        </Select> */}

        <Text fontWeight="bold" mb={2} color="teal.600" _dark={{ color: "teal.300" }}>Status</Text>
        <Select
          placeholder="Select Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          mb={4}
          borderColor={useColorModeValue("gray.300", "gray.600")}
          _hover={{ borderColor: 'teal.500' }}
          _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
        >
          {uniqueStatuses.map((stat) => (
            <option key={stat} value={stat}>{stat}</option>
          ))}
        </Select>

        <Divider my={4} />

        <Text fontWeight="bold" mb={2} color="teal.600" _dark={{ color: "teal.300" }}>Categories</Text>
        <Divider my={2} />
        <VStack align="start" spacing={2}>
          <Checkbox 
            isChecked={selectedCategories.length === uniqueCategories.length && uniqueCategories.length > 0}
            onChange={() => {
              if (selectedCategories.length === uniqueCategories.length) {
                setSelectedCategories([]);
              } else {
                setSelectedCategories(uniqueCategories);
              }
            }}
            colorScheme="teal"
          >
            Select All
          </Checkbox>
          {uniqueCategories.map((category) => (
            <Checkbox
              key={category}
              isChecked={selectedCategories.includes(category)}
              onChange={() => handleCategoryChange(category)}
              colorScheme="teal"
            >
              {category}
            </Checkbox>
          ))}
        </VStack>
      </Box>

      <Box width={{ base: '100%', md: '70%' }} p={4}>
        <List spacing={3}>
          {filteredAssets.map(asset => (
            <ListItem key={asset?._id || asset?.nameTag} p={4} borderWidth={1} borderRadius="md" boxShadow="sm" bg={useColorModeValue("white", "gray.800")} _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }} display="flex" alignItems="center">
              <Box
                width="10px"
                height="10px"
                borderRadius="full"
                bg={getStatusColor(asset?.status)}
                mr={3}
              />
              <HStack spacing={2} flexGrow={1}>
                <Box
                  as="span"
                  onClick={() => handleAssetClick(asset)}
                  fontWeight="bold"
                  cursor="pointer"
                  color="teal.500"
                >
                  {asset?.nameTag} - {asset?.assignedTo}
                </Box>
                <Text fontSize="sm" color="gray.500">({asset?.category})</Text>
              </HStack>
              <IconButton
                icon={<DeleteIcon />}
                onClick={() => handleDelete(asset?._id)}
                aria-label="Delete Asset"
                variant="outline"
                colorScheme="red"
              />
            </ListItem>
          ))}
        </List>

        <AssetDetailDrawer 
          isOpen={isOpen} 
          onClose={onClose} 
          selectedAsset={selectedAsset} 
          setSelectedAsset={setSelectedAsset} 
          handleUpdateAsset={handleUpdateAsset}
        />
      </Box>
    </Flex>

  );
};

export default AssetList;