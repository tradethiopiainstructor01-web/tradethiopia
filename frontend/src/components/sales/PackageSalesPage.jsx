import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  useToast, 
  Spinner, 
  Flex, 
  useColorModeValue,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Select,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Text,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import { 
  FiUser, 
  FiPhone, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiDollarSign,
  FiClock,
  FiDownload
} from 'react-icons/fi';
import PackageSalesTable from './PackageSalesTable';
import { fetchPackages } from '../../services/packageService';

const PackageSalesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const headerColor = useColorModeValue('gray.700', 'white');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  // Load packages
  useEffect(() => {
    const loadPackages = async () => {
      try {
        setLoading(true);
        const data = await fetchPackages();
        setPackages(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch packages: ' + err.message);
        console.error('Error fetching packages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, []);

  return (
    <Box pt={4}>
      <SimpleGrid 
        columns={{ base: 1, sm: 2, md: 2, lg: 3 }} 
        spacing={{ base: 4, md: 6 }} 
        mb={{ base: 6, md: 8 }}
      >
        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          h="100%"
        >
          <CardBody p={3}>
            <Stat>
              <Flex alignItems="center">
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="blue.100"
                  color="blue.500"
                  mr={3}
                >
                  <Icon as={FiUser} boxSize={5} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="medium" color={secondaryTextColor} mb={0}>
                    Total Packages
                  </StatLabel>
                  <StatNumber fontSize="xl" fontWeight="bold" color="blue.500" mt={0}>
                    {packages.length}
                  </StatNumber>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          h="100%"
        >
          <CardBody p={3}>
            <Stat>
              <Flex alignItems="center">
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="green.100"
                  color="green.500"
                  mr={3}
                >
                  <Icon as={FiDollarSign} boxSize={5} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="medium" color={secondaryTextColor} mb={0}>
                    Avg. Package Price
                  </StatLabel>
                  <StatNumber fontSize="xl" fontWeight="bold" color="green.500" mt={0}>
                    ETB {packages.length > 0 
                      ? (packages.reduce((sum, pkg) => sum + (pkg.price || 0), 0) / packages.length).toFixed(2)
                      : '0.00'}
                  </StatNumber>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>

        <Card 
          bg={cardBg} 
          boxShadow="lg" 
          borderRadius="xl" 
          borderWidth="1px" 
          borderColor={borderColor}
          transition="all 0.3s"
          _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
          h="100%"
        >
          <CardBody p={3}>
            <Stat>
              <Flex alignItems="center">
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="purple.100"
                  color="purple.500"
                  mr={3}
                >
                  <Icon as={FiTrendingUp} boxSize={5} />
                </Box>
                <Box>
                  <StatLabel fontSize="xs" fontWeight="medium" color={secondaryTextColor} mb={0}>
                    Highest Package
                  </StatLabel>
                  <StatNumber fontSize="xl" fontWeight="bold" color="purple.500" mt={0}>
                    ETB {packages.length > 0 
                      ? Math.max(...packages.map(pkg => pkg.price || 0)).toFixed(2)
                      : '0.00'}
                  </StatNumber>
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Box bg="white" p={0} borderRadius="lg" boxShadow="md" w="100%" maxW="100%">
        {loading ? (
          <Flex justify="center" align="center" minH="300px">
            <Spinner size="xl" color="teal.500" thickness="4px" />
          </Flex>
        ) : error ? (
          <Box bg="red.50" p={4} borderRadius="lg" mb={4}>
            <Text color="red.500" fontWeight="medium">{error}</Text>
          </Box>
        ) : (
          <PackageSalesTable
            packages={packages}
            onDelete={(id) => console.log('Delete package', id)}
            onUpdate={(id, data) => console.log('Update package', id, data)}
            onAdd={(data) => console.log('Add package', data)}
          />
        )}
      </Box>
    </Box>
  );
};

export default PackageSalesPage;