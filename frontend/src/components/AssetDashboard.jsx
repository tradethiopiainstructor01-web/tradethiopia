import React, { useEffect, useState } from 'react';
import {
    Container,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    Spinner,
    Alert,
    AlertIcon,
    Box,
    Heading,
    useColorModeValue,
    Flex,
    VStack,
    Text,
} from '@chakra-ui/react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AssetDashboard = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch assets from API
    const fetchAssets = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/assets`);
            // The API returns {success: true, data: [...]} structure
            // We need to extract the actual assets array from response.data.data
            const assetsData = response.data && response.data.data ? response.data.data : [];
            setAssets(assetsData);
        } catch (err) {
            console.error('Error fetching assets:', err);
            setError('Failed to fetch assets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    // Data calculations for visualization
    const totalAssets = assets.length;

    // Category distribution
    const categoryCounts = {};
    // Ensure assets is an array before using forEach
    if (Array.isArray(assets)) {
        assets.forEach((asset) => {
            // Ensure asset and asset.category exist before accessing
            if (asset && asset.category) {
                categoryCounts[asset.category] = (categoryCounts[asset.category] || 0) + 1;
            }
        });
    }

    const pieData = {
        labels: Object.keys(categoryCounts),
        datasets: [
            {
                data: Object.values(categoryCounts),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            },
        ],
    };

    const barData = {
        labels: Object.keys(categoryCounts),
        datasets: [
            {
                label: 'Assets by Category',
                data: Object.values(categoryCounts),
                backgroundColor: '#36A2EB',
                borderColor: '#36A2EB',
            },
        ],
    };

    // Reusable card component
    const StatCard = ({ title, value, color }) => {
        const cardBg = useColorModeValue('white', 'gray.700');
        const textColor = useColorModeValue('gray.600', 'gray.300');
        const boxShadowColor = useColorModeValue('md', 'dark-lg');
        
        return (
            <Stat
                borderRadius="lg"
                bg={cardBg}
                boxShadow={boxShadowColor}
                p={4}
                _hover={{ transform: 'scale(1.02)', boxShadow: 'lg' }}
                transition="all 0.3s ease"
            >
                <StatLabel fontWeight="medium" color={textColor}>{title}</StatLabel>
                <StatNumber fontSize="2xl" fontWeight="bold" color={color}>{value}</StatNumber>
            </Stat>
        );
    };

    // Custom Legend component
    const LegendBox = ({ data }) => {
        return (
            <VStack align="start" spacing={3}>
                {Object.keys(data).map((category, index) => (
                    <Flex key={index} align="center">
                        <Box
                            width="12px"
                            height="12px"
                            bg={pieData.datasets[0].backgroundColor[index % pieData.datasets[0].backgroundColor.length]}
                            borderRadius="full"
                            mr={2}
                        />
                        <Text fontSize="sm">{category}</Text>
                    </Flex>
                ))}
            </VStack>
        );
    };

    const ChartBox = ({ title, children, legendData }) => {
        const cardBg = useColorModeValue('white', 'gray.700');
        const textColor = useColorModeValue('gray.700', 'gray.300');
        const boxShadowColor = useColorModeValue('md', 'dark-lg');

        return (
            <Box
                borderRadius="lg"
                bg={cardBg}
                boxShadow={boxShadowColor}
                p={6}
                height="auto"
                _hover={{ transform: 'scale(1.02)', boxShadow: 'lg' }}
                transition="all 0.3s ease"
                w="full"
            >
                <Heading as="h3" size="md" mb={4} color={textColor}>
                    {title}
                </Heading>
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between">
                    <Box width={{ base: 'full', md: '30%' }} mb={{ base: 4, md: 0 }}>
                        <LegendBox data={legendData} />
                    </Box>
                    <Box flex={1} height="250px">
                        {children}
                    </Box>
                </Flex>
            </Box>
        );
    };

    return (
        <Container maxW="container.xl" py={10}>
            {loading ? (
                <Spinner size="xl" color="blue.500" />
            ) : error ? (
                <Alert status="error" variant="left-accent">
                    <AlertIcon />
                    {error}
                </Alert>
            ) : (
                <>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
                        <StatCard title="Total Assets" value={totalAssets} color="blue.500" />
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <ChartBox title="Assets by Category" legendData={categoryCounts}>
                            <Pie data={pieData} options={{ responsive: true }} />
                        </ChartBox>
                        <ChartBox title="Assets by Category (Bar Chart)" legendData={categoryCounts}>
                            <Bar data={barData} options={{ responsive: true }} />
                        </ChartBox>
                    </SimpleGrid>
                </>
            )}
        </Container>
    );
};

export default AssetDashboard;