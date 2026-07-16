import React, { useState, useEffect } from "react";
import {
  Container,
  Flex,
  Box,
  Heading,
  Divider,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  useDisclosure,
  useColorMode,
  useColorModeValue,
  FormControl,
  FormLabel,
  Select,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Badge,
  useToast,
  UnorderedList,
  ListItem
} from "@chakra-ui/react";
import { RepeatIcon, AddIcon, SunIcon, MoonIcon } from "@chakra-ui/icons";
import AssetForm from "../components/AssetForm"; // Assuming you have this component
import AssetList from "../components/AssetList"; // Assuming you have this component
import axios from 'axios';

const AssetManagementPage = () => {
  const [refreshKey, setRefreshKey] = useState(0); // Used to refresh the asset list
  const [filter, setFilter] = useState(""); // For filtering the asset list
  const { isOpen, onOpen, onClose } = useDisclosure(); // For drawer
  const { colorMode, toggleColorMode } = useColorMode(); // Hook for color mode

  // Asset Transfer Portal State
  const [allUsers, setAllUsers] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const { isOpen: isTransferOpen, onOpen: onTransferOpen, onClose: onTransferClose } = useDisclosure();
  const toast = useToast();

  const fetchTransferData = async () => {
    try {
      const [usersRes, assetsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/users`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/assets`)
      ]);
      setAllUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setAllAssets(assetsRes.data && assetsRes.data.data ? assetsRes.data.data : []);
    } catch (error) {
      console.error("Error fetching transfer portal data:", error);
    }
  };

  useEffect(() => {
    if (isTransferOpen) {
      setTransferFrom("");
      setTransferTo("");
      fetchTransferData();
    }
  }, [isTransferOpen]);

  const selectedUserAssets = allAssets.filter(a => a.assignedTo === transferFrom);

  const handleExecuteTransfer = async () => {
    setIsTransferring(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/assets/transfer`, {
        fromUser: transferFrom,
        toUser: transferTo
      });
      
      if (response.data && response.data.success) {
        toast({
          title: "Transfer Successful",
          description: `Transferred ${selectedUserAssets.length} assets from ${transferFrom} to ${transferTo}.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        onTransferClose();
        handleRefresh();
      } else {
        toast({
          title: "Transfer Failed",
          description: response.data.message || "Unknown error occurred.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Transfer error:", error);
      toast({
        title: "Transfer Error",
        description: error.response?.data?.message || error.message || "Request failed.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsTransferring(false);
    }
  };

  // Trigger refresh by updating the refreshKey
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Container maxW="7xl" py={6} mt={2}>
      {/* Modern Hero Header */}
      <Box 
        p={{ base: 5, md: 7 }} 
        borderRadius="2xl" 
        bg={useColorModeValue("white", "gray.800")}
        border="1px solid"
        borderColor={useColorModeValue("gray.100", "gray.700")}
        mb={6}
      >
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Box>
            <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={1}>
              Inventory Control
            </Text>
            <Heading size="lg" fontWeight="800" mb={1} color={useColorModeValue("gray.900", "white")}>
              Corporate Asset Inventory
            </Heading>
            <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
              Track equipment, manage digital credentials, filter items by status, and transfer assets between employees.
            </Text>
          </Box>
        </Flex>
      </Box>

      <Flex
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between"
        gap={10}
      >
        {/* Right Side: Asset List Section */}
        <Box
          flex="1"
          borderWidth="1px"
          borderRadius="2xl"
          borderColor={useColorModeValue("gray.100", "gray.700")}
          padding={5}
          bg={useColorModeValue("white", "gray.800")}
        >
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Text fontWeight="extrabold" fontSize="md" color={useColorModeValue("gray.800", "white")}>
              Inventory Log
            </Text>
            {/* Action Buttons: Refresh, Transfer, Add, and Toggle Theme */}
            <Flex gap={2} align="center">
              <Button
                leftIcon={<span>🔄</span>}
                colorScheme="blue"
                onClick={onTransferOpen}
                size="sm"
                borderRadius="xl"
                shadow="xs"
              >
                Transfer Assets
              </Button>
              <IconButton
                aria-label="Refresh Asset List"
                icon={<RepeatIcon />}
                onClick={handleRefresh}
                colorScheme="teal"
                size="sm"
                borderRadius="xl"
              />
              <IconButton
                aria-label="Add Asset"
                icon={<AddIcon />}
                onClick={onOpen}
                colorScheme="teal"
                size="sm"
                borderRadius="xl"
              />
            </Flex>
          </Flex>
                 
          <Divider mb={4} />
          <AssetList key={refreshKey} filter={filter} onRefresh={handleRefresh} />
        </Box>
      </Flex>

      {/* Drawer for Asset Form */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>Add Asset</DrawerHeader>
          <Divider my={2} />
          <DrawerBody>
            <AssetForm onSuccess={() => { handleRefresh(); onClose(); }} />
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer for Asset Transfer Portal */}
      <Drawer isOpen={isTransferOpen} placement="right" onClose={onTransferClose} size="md">
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent bg={useColorModeValue("white", "gray.850")}>
          <DrawerCloseButton />
          <DrawerHeader fontWeight="bold">Asset Reassignment & Transfer Portal 🔄</DrawerHeader>
          <Divider />
          <DrawerBody>
            <VStack spacing={6} align="stretch" py={4}>
              <Text fontSize="xs" color="gray.500">
                Quickly move all assets assigned to a leaving or resigning employee to another team member.
              </Text>

              {/* Source Employee Select */}
              <FormControl isRequired>
                <FormLabel fontWeight="bold" fontSize="sm">1. Select Leaving/Resigned Employee</FormLabel>
                <Select
                  placeholder="Select source employee"
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  borderRadius="xl"
                  bg={useColorModeValue("gray.50", "gray.900")}
                >
                  {allUsers
                    .filter((u) => u.username && u.username !== "." && u.username !== "..")
                    .sort((a, b) => a.username.localeCompare(b.username))
                    .map((u) => {
                      const isInactive = u.status && u.status.toLowerCase() === 'inactive';
                      const hasAssetCount = allAssets.filter(a => a.assignedTo === u.username).length;
                      return (
                        <option key={u._id} value={u.username}>
                          {u.username} {isInactive ? "🔴 (Deactivated)" : "🟢"} ({hasAssetCount} {hasAssetCount === 1 ? "asset" : "assets"})
                        </option>
                      );
                    })}
                </Select>
              </FormControl>

              {/* Identified Assets Section */}
              {transferFrom && (
                <Box>
                  <Text fontWeight="bold" fontSize="sm" mb={2}>Identified Assets for {transferFrom}:</Text>
                  {selectedUserAssets.length > 0 ? (
                    <VStack 
                      align="stretch" 
                      spacing={2.5} 
                      maxH="220px" 
                      overflowY="auto" 
                      p={3.5} 
                      bg={useColorModeValue("slate.50", "rgba(30, 41, 59, 0.4)")} 
                      borderRadius="xl"
                      border="1px solid"
                      borderColor={useColorModeValue("gray.100", "gray.800")}
                    >
                      {selectedUserAssets.map((asset) => (
                        <Flex 
                          key={asset._id} 
                          justify="space-between" 
                          align="center" 
                          p={2.5} 
                          bg={useColorModeValue("white", "gray.900")} 
                          borderRadius="lg" 
                          boxShadow="xs"
                          border="1px solid"
                          borderColor={useColorModeValue("gray.150", "gray.800")}
                        >
                          <Box overflow="hidden">
                            <Text fontSize="xs" fontWeight="bold" noOfLines={1} color={useColorModeValue("gray.800", "white")}>
                              {asset.name}
                            </Text>
                            <Text fontSize="10px" color="gray.500">
                              Tag: {asset.nameTag} | Cat: {asset.category}
                            </Text>
                          </Box>
                          <Badge 
                            colorScheme={asset.status === 'Active' ? 'green' : 'red'} 
                            fontSize="8px" 
                            borderRadius="full" 
                            px={2}
                          >
                            {asset.status}
                          </Badge>
                        </Flex>
                      ))}
                    </VStack>
                  ) : (
                    <Alert status="info" borderRadius="xl">
                      <AlertIcon />
                      This employee has no assets assigned to them.
                    </Alert>
                  )}
                </Box>
              )}

              {/* Destination Employee Select */}
              <FormControl isRequired isDisabled={selectedUserAssets.length === 0}>
                <FormLabel fontWeight="bold" fontSize="sm">2. Select Recipient Employee</FormLabel>
                <Select
                  placeholder="Select recipient"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  borderRadius="xl"
                  bg={useColorModeValue("gray.50", "gray.900")}
                >
                  {allUsers
                    .filter((u) => u.status && u.status.toLowerCase() === 'active' && u.username !== transferFrom && u.username && u.username !== "." && u.username !== "..")
                    .sort((a, b) => a.username.localeCompare(b.username))
                    .map((u) => (
                      <option key={u._id} value={u.username}>
                        {u.username}
                      </option>
                    ))}
                </Select>
              </FormControl>

              {/* Warnings and Notes */}
              {transferFrom && transferTo && selectedUserAssets.length > 0 && (
                <Alert status="warning" borderRadius="xl">
                  <AlertIcon />
                  <Text fontSize="xs">
                    Confirming will bulk transfer all <strong>{selectedUserAssets.length}</strong> assets to <strong>{transferTo}</strong>.
                  </Text>
                </Alert>
              )}
            </VStack>
          </DrawerBody>
          <DrawerFooter gap={2} borderTopWidth="1px" borderColor={useColorModeValue("gray.100", "gray.800")}>
            <Button
              colorScheme="teal"
              onClick={handleExecuteTransfer}
              isLoading={isTransferring}
              loadingText="Transferring..."
              isDisabled={!transferFrom || !transferTo || selectedUserAssets.length === 0}
              borderRadius="xl"
            >
              Execute Transfer
            </Button>
            <Button variant="ghost" onClick={onTransferClose} isDisabled={isTransferring} borderRadius="xl">
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Container>
  );
};

export default AssetManagementPage;