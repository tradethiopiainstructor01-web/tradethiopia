import { useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Divider,
    Flex,
    FormControl,
    HStack,
    IconButton,
    Image,
    Input,
    InputGroup,
    InputRightElement,
    Text,
    useToast
} from '@chakra-ui/react';
import Particles from 'react-tsparticles';
import { useNavigate } from 'react-router-dom';
import { FaMicrosoft } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useUserStore, normalizeRole } from '../store/user'; // Update the path if necessary
import axiosInstance from '../services/axiosInstance';
import { consumeReturnPath } from '../utils/authStorage';
import {
    isUserPermittedForDashboard,
    getOnboardingRedirectPath,
    getRoleDashboardPath,
} from '../utils/dashboardAccess';

const FLOATING_PETALS = [
    { id: 1, left: '4%', size: '18px', duration: '15s', delay: '0s' },
    { id: 2, left: '16%', size: '22px', duration: '18s', delay: '3s' },
    { id: 3, left: '26%', size: '15px', duration: '13s', delay: '7s' },
    { id: 4, left: '38%', size: '19px', duration: '16s', delay: '1s' },
    { id: 5, left: '60%', size: '17px', duration: '14s', delay: '5s' },
    { id: 6, left: '72%', size: '24px', duration: '19s', delay: '2s' },
    { id: 7, left: '84%', size: '16px', duration: '12s', delay: '8s' },
    { id: 8, left: '94%', size: '20px', duration: '17s', delay: '4s' },
];

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();
    const setCurrentUser = useUserStore((state) => state.setCurrentUser);
    const redirectAfterLogin = (path) => navigate(path, { replace: true });

const handleLogin = async (event) => {
    event?.preventDefault();
    if (isLoggingIn) return;

    try {
        setIsLoggingIn(true);
        const response = await axiosInstance.post(
            '/users/login',
            { email: email.trim(), password },
            { skipAuth: true, skipAuthRedirect: true }
        );

        console.log('Login response:', response.data); // Debugging line

        if (response.data.success) {
            // Extract user data and token correctly
            const { user, token } = response.data;
            const { _id, role, status, infoStatus, trainingStatus, examStatus, examBypass, username, email } = user;
            console.log('LoginPage - Login Success:', { _id, role, status, infoStatus, trainingStatus, examStatus, examBypass, username, email });

            // Save token and user information in local storage
            setCurrentUser({ ...user, token });

            const userWithToken = { ...user, token };
            const isPermitted = isUserPermittedForDashboard(userWithToken);

            if (!isPermitted) {
                const onboardingPath = getOnboardingRedirectPath(userWithToken);
                console.log(`[LoginPage] User ${email} has no HR dashboard permit yet. Redirecting to: ${onboardingPath}`);
                redirectAfterLogin(onboardingPath);
            } else {
                const returnPath = consumeReturnPath({ _id, role: normalizeRole(role) });
                console.log('[LoginPage] User permitted. Redirecting based on role:', role);
                if (returnPath) {
                    redirectAfterLogin(returnPath);
                } else {
                    redirectAfterLogin(getRoleDashboardPath(role));
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
    } finally {
        setIsLoggingIn(false);
    }
};

    const particlesOptions = {
        particles: {
            number: { value: 45, density: { enable: true, value_area: 800 } },
            shape: { type: "circle", stroke: { width: 0, color: "#000000" } },
            color: { value: ["#ffd700", "#e09900", "#fff176", "#46b8ff"] },
            opacity: { value: 0.42, random: true, anim: { enable: true, speed: 0.5, opacity_min: 0.1, sync: false } },
            size: { value: 2.6, random: true, anim: { enable: true, speed: 2.5, size_min: 0.1, sync: false } },
            line_linked: { enable: true, distance: 135, color: "#d99a00", opacity: 0.16, width: 1 },
            move: { enable: true, speed: 0.7, direction: "none", random: true, straight: false, out_mode: "out", bounce: false },
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
        <Box position="relative" minH="100dvh" bg="#001f4d" overflow="hidden">
            <style>{`
                @keyframes floatSwayLeft {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-12px) rotate(1.2deg); }
                }
                @keyframes floatSwayRight {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(-1.2deg); }
                }
                @keyframes floatingPetal {
                    0% {
                        transform: translateY(-30px) translateX(0) rotate(0deg);
                        opacity: 0;
                    }
                    15% {
                        opacity: 0.85;
                    }
                    85% {
                        opacity: 0.85;
                    }
                    100% {
                        transform: translateY(105vh) translateX(70px) rotate(360deg);
                        opacity: 0;
                    }
                }
            `}</style>

            <Particles
                id="particles"
                options={particlesOptions}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />

            {/* Floating Adey Abeba Golden Petals */}
            <Box position="absolute" inset={0} pointerEvents="none" zIndex={1} overflow="hidden">
                {FLOATING_PETALS.map((petal) => (
                    <Box
                        key={petal.id}
                        position="absolute"
                        top="-30px"
                        left={petal.left}
                        w={petal.size}
                        h={petal.size}
                        opacity={0.8}
                        animation={`floatingPetal ${petal.duration} linear infinite`}
                        style={{ animationDelay: petal.delay }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                            <path
                                d="M12 2C8 6 5 12 12 22C19 12 16 6 12 2Z"
                                fill="url(#petalGrad)"
                            />
                            <defs>
                                <linearGradient id="petalGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#FFF176" />
                                    <stop offset="0.6" stopColor="#FFD700" />
                                    <stop offset="1" stopColor="#D99A00" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </Box>
                ))}
            </Box>

            <Box position="absolute" inset={0} bg="radial-gradient(circle at 52% 13%, rgba(217, 154, 0, 0.22), transparent 35%), linear-gradient(180deg, rgba(0,50,102,0.18) 0%, rgba(0,31,77,0.72) 36%, #001f4d 100%)" />

            <Flex position="relative" zIndex={2} minH="100vh" align="center" justify="center" px={{ base: 3, md: 6 }} py={{ base: 4, md: 8 }}>
                <HStack
                    spacing={{ base: 0, lg: 6, xl: 10 }}
                    align="center"
                    justify="center"
                    w="full"
                    maxW="1320px"
                >
                    {/* LEFT FLANK: Adey Abeba Floral Bouquet with Motion Graphics */}
                    <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        w={{ lg: '280px', xl: '330px' }}
                        maxW="330px"
                        display={{ base: 'none', lg: 'flex' }}
                        animation="floatSwayLeft 7s ease-in-out infinite"
                        position="relative"
                        zIndex={2}
                    >
                        <Box
                            bg="linear-gradient(165deg, rgba(0, 39, 88, 0.78) 0%, rgba(0, 31, 77, 0.94) 100%)"
                            borderWidth="1.5px"
                            borderColor="rgba(217, 154, 0, 0.45)"
                            borderRadius="26px"
                            p={5}
                            boxShadow="0 24px 60px rgba(0, 0, 0, 0.45), 0 0 35px rgba(217, 154, 0, 0.2)"
                            textAlign="center"
                            position="relative"
                            overflow="hidden"
                            backdropFilter="blur(12px)"
                        >
                            <HStack justify="center" spacing={1.5} mb={3}>
                                <Text fontSize="16px">🌼</Text>
                                <Text color="#FFD700" fontSize="13px" fontWeight="900" letterSpacing="1px">
                                    አደይ አበባ • ADEY ABEBA
                                </Text>
                                <Text fontSize="16px">🌼</Text>
                            </HStack>

                            <Box
                                position="relative"
                                borderRadius="20px"
                                overflow="hidden"
                                borderWidth="1.5px"
                                borderColor="rgba(255, 215, 0, 0.4)"
                                boxShadow="0 12px 32px rgba(217, 154, 0, 0.3)"
                                mb={4}
                            >
                                <Image
                                    src="/assets/newyear/adey_abeba_bouquet.jpg"
                                    alt="Ethiopian Yellow Flowers Adey Abeba"
                                    w="100%"
                                    h="250px"
                                    objectFit="cover"
                                    transition="transform 0.4s ease"
                                    _hover={{ transform: 'scale(1.04)' }}
                                />
                                <Box
                                    position="absolute"
                                    inset={0}
                                    bg="radial-gradient(circle at center, transparent 45%, rgba(0, 31, 77, 0.4) 100%)"
                                    pointerEvents="none"
                                />
                            </Box>

                            <Text
                                color="#FFD700"
                                fontSize="16px"
                                fontWeight="900"
                                fontFamily="'Noto Sans Ethiopic', sans-serif"
                                mb={1.5}
                            >
                                እንኳን አደረሳችሁ!
                            </Text>
                            <Text color="rgba(255, 255, 255, 0.82)" fontSize="11.5px" fontWeight="600" lineHeight="1.5">
                                የአደይ አበባ ውበትና የብርሃን ወር አዲሱን ዓመት የተስፋ፣ የስኬትና የበረከት ያድርግልን!
                            </Text>
                        </Box>
                    </Flex>

                    {/* CENTER: The Main Login Card */}
                    <Flex
                        direction="column"
                        maxW={{ base: '100%', md: '410px' }}
                        w="full"
                        minH="auto"
                        px={{ base: 5, md: 6 }}
                        py={{ base: 5, md: 5 }}
                        borderRadius={{ base: '16px', md: '26px' }}
                        bg="linear-gradient(180deg, rgba(0,39,88,0.72) 0%, rgba(0,31,77,0.96) 44%, #001f4d 100%)"
                        borderWidth="1.5px"
                        borderColor="rgba(217, 154, 0, 0.4)"
                        boxShadow="0 26px 80px rgba(0, 0, 0, 0.4), 0 0 35px rgba(217, 154, 0, 0.18)"
                        overflow="hidden"
                        position="relative"
                        zIndex={3}
                        backdropFilter="blur(16px)"
                    >
                        {/* Company Logo Section - 100% Unchanged */}
                        <Box textAlign="center" pt={{ base: 2, md: 3 }} pb={{ base: 3, md: 4 }} color="white">
                            <HStack justify="center" spacing={2.5} align="center">
                                <Image src="/logo.png" alt="TradeEthiopia Group" boxSize="54px" objectFit="contain" fallback={<Box />} />
                                <Box textAlign="left">
                                    <Text color="white" fontFamily="Georgia, serif" fontSize="26px" fontWeight="900" lineHeight="0.88" letterSpacing="0">
                                        TradeEthiopia
                                    </Text>
                                    <Text color="white" fontFamily="Georgia, serif" fontSize="19px" fontWeight="900" lineHeight="1" letterSpacing="0">
                                        GROUP
                                    </Text>
                                    <Box h="1px" bg="#D99A00" mt="3px" />
                                </Box>
                            </HStack>
                            <Text fontSize="11px" color="#D99A00" fontWeight="800" mt={2}>
                                Connecting Markets, Empowering Business
                            </Text>
                        </Box>

                        {/* Witty Amharic New Year Message Banner */}
                        <Box
                            bg="linear-gradient(135deg, rgba(217, 154, 0, 0.2) 0%, rgba(0, 44, 96, 0.65) 100%)"
                            borderWidth="1.5px"
                            borderColor="rgba(217, 154, 0, 0.55)"
                            borderRadius="16px"
                            p={3.5}
                            mb={4}
                            textAlign="center"
                            boxShadow="0 6px 20px rgba(217, 154, 0, 0.18)"
                            position="relative"
                            overflow="hidden"
                        >
                            <HStack justify="center" spacing={1.5} mb={1}>
                                <Text fontSize="14px">🌼</Text>
                                <Text
                                    color="#FFD700"
                                    fontSize="14px"
                                    fontWeight="900"
                                    letterSpacing="0.5px"
                                    textShadow="0 0 10px rgba(255, 215, 0, 0.6)"
                                >
                                    መልካም አዲስ ዓመት!
                                </Text>
                                <Text fontSize="14px">🌼</Text>
                            </HStack>
                            <Text
                                color="#FFFFFF"
                                fontSize="11px"
                                fontWeight="600"
                                lineHeight="1.55"
                                fontFamily="'Noto Sans Ethiopic', sans-serif"
                            >
                                “አዲሱ ዓመት &apos;የይለፍ ቃል (Password) ረሳሁ&apos; የማንልበት፣ ኮምፒውተራችን የማይዘጋብን (የማይደናቀፍብን) እና ቡናችን ሳይቀዘቅዝ በደስታ የምንጠጣበት የስኬትና የሰላም ዓመት ይሁንልን! ☕💻”
                            </Text>
                        </Box>

                        <Box textAlign="center" mb={4}>
                            <Text color="white" fontSize="20px" fontWeight="900" lineHeight="1">Welcome Back!</Text>
                            <Text color="rgba(255,255,255,0.78)" fontSize="11.5px" fontWeight="700" mt={2}>Sign in to continue to your dashboard</Text>
                        </Box>

                        {/* Login Form - 100% Preserved Functionality */}
                        <form onSubmit={handleLogin}>
                        <FormControl mb={3}>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email or Phone"
                                focusBorderColor="#D99A00"
                                bg="rgba(0, 44, 96, 0.52)"
                                borderColor="rgba(255,255,255,0.24)"
                                _placeholder={{ color: 'rgba(255,255,255,0.72)' }}
                                _hover={{ borderColor: "rgba(255,255,255,0.42)" }}
                                _focus={{ borderColor: "#D99A00", boxShadow: "0 0 0 1px #D99A00" }}
                                color="white"
                                fontSize="12px"
                                fontWeight="700"
                                h="47px"
                                borderRadius="8px"
                                px={4}
                                autoComplete="email"
                            />
                        </FormControl>
                        <FormControl mb={3}>
                            <InputGroup>
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    focusBorderColor="#D99A00"
                                    bg="rgba(0, 44, 96, 0.52)"
                                    borderColor="rgba(255,255,255,0.24)"
                                    _placeholder={{ color: 'rgba(255,255,255,0.72)' }}
                                    _hover={{ borderColor: "rgba(255,255,255,0.42)" }}
                                    _focus={{ borderColor: "#D99A00", boxShadow: "0 0 0 1px #D99A00" }}
                                    color="white"
                                    fontSize="12px"
                                    fontWeight="700"
                                    h="47px"
                                    borderRadius="8px"
                                    px={4}
                                    autoComplete="current-password"
                                />
                                <InputRightElement h="47px">
                                    <IconButton
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        icon={showPassword ? <FiEyeOff /> : <FiEye />}
                                        variant="ghost"
                                        size="sm"
                                        color="rgba(255,255,255,0.78)"
                                        onClick={() => setShowPassword((value) => !value)}
                                    />
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
                        <Flex align="center" justify="space-between" mb={5}>
                            <Checkbox size="sm" colorScheme="yellow" borderColor="rgba(255,255,255,0.65)">
                                <Text fontSize="11px" color="rgba(255,255,255,0.78)" fontWeight="700">Remember me</Text>
                            </Checkbox>
                            <Button variant="link" size="xs" color="#D99A00" fontWeight="900">Forgot Password?</Button>
                        </Flex>
                        <Button
                            type="submit"
                            w="full"
                            bg="#D99A00"
                            color="white"
                            h="50px"
                            borderRadius="8px"
                            fontSize="13px"
                            fontWeight="900"
                            _hover={{ bg: '#C98D00', transform: 'translateY(-1px)', boxShadow: '0 12px 28px rgba(217,154,0,0.28)' }}
                            isLoading={isLoggingIn}
                            isDisabled={!email.trim() || !password}
                        >
                            Sign In
                        </Button>
                        </form>
                        <HStack my={3.5}>
                            <Divider borderColor="rgba(255,255,255,0.18)" />
                            <Text color="rgba(255,255,255,0.72)" fontSize="12px" fontWeight="700" whiteSpace="nowrap">or continue with</Text>
                            <Divider borderColor="rgba(255,255,255,0.18)" />
                        </HStack>
                        <HStack justify="center" spacing={5}>
                            <Button w="48px" h="48px" minW="48px" p={0} borderRadius="full" bg="white" borderWidth="1px" borderColor="rgba(255,255,255,0.35)" boxShadow="0 8px 20px rgba(0,0,0,0.18)" fontSize="24px" _hover={{ transform: 'translateY(-2px)' }} transition="transform 0.2s ease">
                                <FcGoogle />
                            </Button>
                            <Button w="48px" h="48px" minW="48px" p={0} borderRadius="full" bg="white" borderWidth="1px" borderColor="rgba(255,255,255,0.35)" boxShadow="0 8px 20px rgba(0,0,0,0.18)" fontSize="19px" _hover={{ transform: 'translateY(-2px)' }} transition="transform 0.2s ease">
                                <FaMicrosoft color="#00A4EF" />
                            </Button>
                        </HStack>

                        <Text textAlign="center" mt={3.5} pb={1} fontSize="12px" color="rgba(255,255,255,0.78)" fontWeight="700">
                            Don&apos;t have an account? <Box as="span" color="#D99A00" fontWeight="900" cursor="pointer" _hover={{ textDecoration: 'underline' }}>Sign Up</Box>
                        </Text>
                    </Flex>

                    {/* RIGHT FLANK: Traditional Ethiopian New Year Artwork with Motion Graphics */}
                    <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        w={{ lg: '280px', xl: '330px' }}
                        maxW="330px"
                        display={{ base: 'none', lg: 'flex' }}
                        animation="floatSwayRight 8s ease-in-out infinite"
                        position="relative"
                        zIndex={2}
                    >
                        <Box
                            bg="linear-gradient(165deg, rgba(0, 39, 88, 0.78) 0%, rgba(0, 31, 77, 0.94) 100%)"
                            borderWidth="1.5px"
                            borderColor="rgba(217, 154, 0, 0.45)"
                            borderRadius="26px"
                            p={5}
                            boxShadow="0 24px 60px rgba(0, 0, 0, 0.45), 0 0 35px rgba(217, 154, 0, 0.2)"
                            textAlign="center"
                            position="relative"
                            overflow="hidden"
                            backdropFilter="blur(12px)"
                        >
                            <HStack justify="center" spacing={1.5} mb={3}>
                                <Text fontSize="16px">✨</Text>
                                <Text color="#FFD700" fontSize="13px" fontWeight="900" letterSpacing="1px">
                                    እንቁጣጣሽ • ENKUTATASH
                                </Text>
                                <Text fontSize="16px">✨</Text>
                            </HStack>

                            <Box
                                position="relative"
                                borderRadius="20px"
                                overflow="hidden"
                                borderWidth="1.5px"
                                borderColor="rgba(255, 215, 0, 0.4)"
                                boxShadow="0 12px 32px rgba(217, 154, 0, 0.3)"
                                mb={4}
                            >
                                <Image
                                    src="/assets/newyear/ethiopian_newyear_art.jpg"
                                    alt="Ethiopian New Year Celebration"
                                    w="100%"
                                    h="250px"
                                    objectFit="cover"
                                    transition="transform 0.4s ease"
                                    _hover={{ transform: 'scale(1.04)' }}
                                />
                                <Box
                                    position="absolute"
                                    inset={0}
                                    bg="radial-gradient(circle at center, transparent 45%, rgba(0, 31, 77, 0.4) 100%)"
                                    pointerEvents="none"
                                />
                            </Box>

                            <Text
                                color="#FFD700"
                                fontSize="16px"
                                fontWeight="900"
                                fontFamily="'Noto Sans Ethiopic', sans-serif"
                                mb={1.5}
                            >
                                መልካም አዲስ ዓመት!
                            </Text>
                            <Text color="rgba(255, 255, 255, 0.82)" fontSize="11.5px" fontWeight="600" lineHeight="1.5">
                                በአዲሱ ዓመት ንግዳችን የሚያድግበት፣ ደንበኞቻችን የሚረኩበት ድንቅ የስኬት ዘመን ይሁንልን!
                            </Text>
                        </Box>
                    </Flex>
                </HStack>
            </Flex>
        </Box>
    );
};

export default LoginPage;
