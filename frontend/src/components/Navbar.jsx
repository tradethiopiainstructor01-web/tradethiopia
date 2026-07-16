
import {
    Container,
    Flex,
    Text,
    HStack,
    Button,
    useColorMode,
    Avatar,
    Box,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton,
    Divider,
    Badge,
    VStack,
    useColorModeValue
} from "@chakra-ui/react";
import { BsBell, BsChat } from "react-icons/bs";
import { IoMoon } from "react-icons/io5";
import { SunIcon } from "@chakra-ui/icons";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/user";
import { useEffect, useState } from "react";
import ChatLauncher from "./chat/ChatLauncher";
import NotificationBall from "./notifications/NotificationBall";

const NavbarPage = ({ sidebarWidth = "0px" }) => {
    const { colorMode, toggleColorMode } = useColorMode();
    const bg = useColorModeValue("rgba(255, 255, 255, 0.8)", "rgba(15, 23, 42, 0.85)");
    const textColor = useColorModeValue("gray.800", "gray.100");
    const borderColor = useColorModeValue("gray.200", "rgba(255,255,255,0.08)");
    const toggleLabel = colorMode === "light" ? "Switch to dark theme" : "Switch to light theme";
    const navigate = useNavigate();
    const currentUser = useUserStore((state) => state.currentUser);
    const users = useUserStore((state) => state.users);
    const [notifications, setNotifications] = useState([]);

    const clearUser = useUserStore((state) => state.clearUser);

    const handleLogout = () => {
        // Use the Zustand store to clear user state (also clears localStorage)
        if (typeof clearUser === 'function') clearUser();
        // Navigate to login
        navigate('/login');
    };

    useEffect(() => {
        const pendingNotifications = users.filter(user => user.infoStatus === 'pending');
        setNotifications(pendingNotifications);
    }, [users]);

    const navigateToUser = (userId) => {
        navigate("/users");
    };

    const extraNotifications = [
        ...notifications.map((user) => ({
            id: `user-${user._id}`,
            text: `${user.username} has HR verification pending approval`,
            type: "general",
            read: false,
        })),
    ];

    return (
        <Container
            maxW="100%"
            px={4}
            py={2}
            bg={bg}
            color={textColor}
            zIndex="20"
            position="fixed"
            top="0"
            left={sidebarWidth}
            width={`calc(100% - ${sidebarWidth})`}
            boxShadow="sm"
            backdropFilter="blur(16px)"
            transition="all 0.3s ease"
            borderBottomWidth="1px"
            borderBottomColor={borderColor}
        >
            <Flex
                h="52px"
                alignItems="center"
                justifyContent="space-between"
                px={3}
                flexDir={{ base: "column", sm: "row" }}
            >
                <Flex direction="row" alignItems="center" gap={3}>
                    <Text
                        fontSize="18px"
                        fontWeight="800"
                        letterSpacing="tight"
                        color={useColorModeValue("gray.800", "white")}
                    >
                        Trade Ethiopia
                    </Text>
                </Flex>
{/* Navigation Icons */}
                <HStack spacing={4} alignItems="center">
                    <Box display="none">
                    <Menu>
                        <MenuButton as={Button} variant="ghost" color={useColorModeValue("gray.600", "gray.300")}>
                            <BsBell size="18" />
                            {notifications.length > 0 && (
                                <Badge ml={1} colorScheme="red" borderRadius="full">
                                    {notifications.length}
                                </Badge>
                            )}
                        </MenuButton>
                        <MenuList p={3} minW="250px" boxShadow="lg">
                            <Text fontWeight="bold" mb={2}>Notifications</Text>
                            <Divider />
                            {notifications.length === 0 ? (
                                <Text mt={2} textAlign="center">No new notifications</Text>
                            ) : (
                                <VStack spacing={3} align="stretch">
                                    {notifications.map(user => (
                                        <Box
                                            key={user._id}
                                            p={2}
                                            borderRadius="md"
                                            bg="gray.100"
                                            cursor="pointer"
                                            _hover={{ bg: "gray.200" }}
                                            onClick={() => navigateToUser(user._id)}
                                        >
                                            <HStack>
                                                <Avatar size="sm" name={user.username} src={user.photoURL} />
                                                <Box>
                                                    <Text fontWeight="bold">{user.username}</Text>
                                                    <Text fontSize="sm" color="gray.500">
                                                        {user.infoStatus}
                                                    </Text>
                                                </Box>
                                            </HStack>
                                        </Box>
                                    ))}
                                </VStack>
                            )}
                        </MenuList>
                    </Menu>
                    </Box>
                    <NotificationBall extraNotifications={extraNotifications} />

                    <ChatLauncher
                        icon={<BsChat size="18" />}
                        iconButtonProps={{ variant: "ghost", color: useColorModeValue("gray.600", "gray.300") }}
                    />

                    {/* User Profile Dropdown */}
                    <Menu>
                        <MenuButton cursor="pointer">
                            <HStack spacing={2}>
                                <Avatar size="sm" name={currentUser?.username} src={currentUser?.photoURL} />
                                <Box display={{ base: "none", md: "block" }}>
                                    <Text fontSize="xs" fontWeight="700" lineHeight="short" color={useColorModeValue("gray.800", "white")}>
                                        {currentUser?.username}
                                    </Text>
                                    <Badge fontSize="9px" colorScheme="blue" variant="subtle" borderRadius="full" px={1.5} textTransform="capitalize">
                                        {currentUser?.role}
                                    </Badge>
                                </Box>
                            </HStack>
                        </MenuButton>
                        <MenuList borderRadius="xl" boxShadow="lg" border="1px solid" borderColor={useColorModeValue("gray.100", "gray.700")} p={2}>
                            <Box p={3} textAlign="center">
                                <Avatar size="lg" name={currentUser?.username} src={currentUser?.photoURL} mb={2} />
                                <Text fontSize="sm" fontWeight="bold">{currentUser?.username}</Text>
                                <Text fontSize="xs" color="gray.500">{currentUser?.role}</Text>
                            </Box>
                            <Divider />
                            <MenuItem borderRadius="lg" fontSize="sm" mt={1} onClick={handleLogout}>Logout</MenuItem>
                        </MenuList>
                    </Menu>


{/* Dark Mode Toggle */}
                    <IconButton
                        icon={colorMode === "light" ? <IoMoon size="16" /> : <SunIcon boxSize="4" />}
                        onClick={toggleColorMode}
                        variant="ghost"
                        aria-label={toggleLabel}
                        rounded="xl"
                        size="sm"
                        color={useColorModeValue("gray.500", "gray.400")}
                        _hover={{ bg: useColorModeValue("gray.100", "whiteAlpha.100") }}
                    />
                </HStack>
            </Flex>
        </Container>
    );
};

export default NavbarPage;
