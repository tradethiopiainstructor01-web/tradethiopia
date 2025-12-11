import { useState } from 'react';
import { Box, Button, Input, FormLabel, FormControl, Text, useToast } from '@chakra-ui/react';
import Particles from 'react-tsparticles';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserStore, normalizeRole } from '../store/user'; // Update the path if necessary

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const toast = useToast();
    const setCurrentUser = useUserStore((state) => state.setCurrentUser);

const handleLogin = async () => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, { email, password });

        console.log('Login response:', response.data); // Debugging line

        if (response.data.success) {
            // Extract user data and token correctly
            const { user, token } = response.data;
            const { _id, role, status, infoStatus, username, email } = user;

            // Save token and user information in local storage
            setCurrentUser({ username, role, status, infoStatus, token, _id, email });

            // Check user and info statuses
            if (status === 'inactive' && infoStatus === 'active') {
                // If user status is inactive, redirect to /secondpage
                navigate('/secondpage');
            } else if ((status === 'inactive' || status === 'active') && infoStatus !== 'active')  {
                // If info status is inactive, redirect to /employee-info
                navigate('/employee-info');
            } else {
                const normalizedRole = normalizeRole(role);
                // If both are active, redirect based on user role
                switch (normalizedRole) {
                   
                    case 'admin':
                    case 'hr':
                        navigate('/dashboard');
                        break;
                    case 'finance':
                        navigate('/finance-dashboard');
                        break;
                    case 'sales':
                        navigate('/sdashboard');
                        break;
                    case 'salesmanager':
                        navigate('/salesmanager');
                        break;
                    case 'customerservice':
                    case 'customer_service':
                    case 'customersuccessmanager':
                    case 'customer_success_manager':
                        navigate('/Cdashboard');
                        break;
                    case 'coo':
                        navigate('/coo-dashboard');
                        break;
                    case 'tradextv':
                    case 'tetv':
                        navigate('/tradextv-dashboard');
                        break;
                    case 'it':
                        navigate('/it');
                        break;
                    case 'IT':
                        navigate('/it'); // Add IT role navigation
                        break;
                    case 'socialmediamanager':
                        navigate('/social-media'); // Add social media role navigation
                        break;
                    default:
                        navigate('/ComingSoonPage'); // Optional: handle unknown roles
                        break;
                }
            }

            toast({
                title: "Login successful.",
                description: " ",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Login failed.",
                description: response.data.message || "An error occurred.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    } catch (error) {
        console.error("Login error:", error);
        toast({
            title: "Error.",
            description: error.response?.data?.message || "An error occurred during login.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
    }
};

    const particlesOptions = {
        particles: {
            number: { value: 50, density: { enable: true, value_area: 800 } },
            shape: { type: "circle", stroke: { width: 0, color: "#000000" } },
            opacity: { value: 0.4, random: true, anim: { enable: true, speed: 0.5, opacity_min: 0.1, sync: false } },
            size: { value: 3, random: true, anim: { enable: true, speed: 4, size_min: 0.1, sync: false } },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
            move: { enable: true, speed: 1, direction: "none", random: true, straight: false, out_mode: "out", bounce: false },
        },
        interactivity: {
            events: {
                onhover: { enable: true, mode: "repulse" },
                onclick: { enable: true, mode: "push" },
            },
        },
        retina_detect: true,
    };

    return (
        <Box position="relative" minH="100vh" bg="gray.800" overflow="hidden">
            <Particles
                id="particles"
                options={particlesOptions}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
            <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" zIndex={1} maxW="400px" w="full" p={8} borderRadius="lg" bg="rgba(0, 0, 0, 0.6)" boxShadow="lg">
                <Box textAlign="center" mb={6}>
                    <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>Welcome Back</h2>
                </Box>
                <FormControl mb={4}>
                    <FormLabel htmlFor="email" color="white">Email</FormLabel>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        focusBorderColor="purple.500"
                        bg="whiteAlpha.800"
                        borderColor="whiteAlpha.600"
                        _hover={{ borderColor: "purple.400" }}
                        _focus={{ borderColor: "purple.500" }}
                        color="black"
                        px={4}
                        py={2}
                    />
                </FormControl>
                <FormControl mb={6}>
                    <FormLabel htmlFor="password" color="white">Password</FormLabel>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        focusBorderColor="purple.500"
                        bg="whiteAlpha.800"
                        borderColor="whiteAlpha.600"
                        _hover={{ borderColor: "purple.400" }}
                        _focus={{ borderColor: "purple.500" }}
                        color="black"
                        px={4}
                        py={2}
                    />
                </FormControl>
                <Button
                    w="full"
                    colorScheme="purple"
                    variant="solid"
                    size="lg"
                    _hover={{ transform: 'scale(1.05)', boxShadow: 'lg' }}
                    onClick={handleLogin}
                >
                    Login
                </Button>
            </Box>
        </Box>
    );
};

export default LoginPage;
