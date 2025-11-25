
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
    VStack
} from "@chakra-ui/react";
import { IoMoon } from "react-icons/io5";
import { SunIcon } from "@chakra-ui/icons";
import { BsBell, BsChat } from "react-icons/bs";
import { useNavigate, Link } from "react-router-dom";
import { useUserStore } from "../store/user";
import { useEffect, useState } from "react";

const NavbarPage = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const navigate = useNavigate();
    const currentUser = useUserStore((state) => state.currentUser);
    const users = useUserStore((state) => state.users);
    const [notifications, setNotifications] = useState([]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    useEffect(() => {
        const pendingNotifications = users.filter(user => user.infoStatus === 'pending');
        setNotifications(pendingNotifications);
    }, [users]);

    const navigateToUser = (userId) => {
        navigate("/users");
    };

    return (
        <Container
            maxW="100%"
            px={4}
            bgGradient={
                colorMode === "light"
                    ? "linear(to-r, gray.800, blue.800, teal.500)"
                    : "linear(to-r, gray.800, blue.800, teal.600)"
            }
            color={colorMode === "light" ? "black" : "white"}
            zIndex="10"
            position="fixed"
            top="0"
            boxShadow="lg"
            transition="background 0.3s ease"
        >
            <Flex
                h="60px"
                alignItems="center"
                justifyContent="space-between"
                px={4}
                flexDir={{ base: "column", sm: "row" }}
            >
                {/* Dashboard Title */}
                <Flex direction="row" alignItems="center">
                    <Text
                        fontSize="24px"
                        fontWeight="bold"
                        textTransform="uppercase"
                        textAlign="center"
                        bgGradient="linear(to-l, #36d1dc, #5b86e5)"
                        bgClip="text"
                    >
                        <Link to="/">Dashboard</Link>
                    </Text>
                </Flex>
{/* Navigation Icons */}
                <HStack spacing={4} alignItems="center">
                    {/* Notifications Dropdown */}
                    <Menu>
                        <MenuButton as={Button} variant="ghost">
                            <BsBell color="inherit" />
                            {notifications.length > 0 && (
                                <Badge ml={1} colorScheme="red">
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

                    {/* Messages Dropdown */}
                    <Menu>
                        <MenuButton as={Button} variant="ghost">
                            <BsChat color="inherit" />
                        </MenuButton>
                        <MenuList>
                            <MenuItem>No new messages</MenuItem>
                        </MenuList>
                    </Menu>

                    {/* User Profile Dropdown */}
                    <Menu>
                        <MenuButton as={Avatar} size="sm" name={currentUser?.username} src={currentUser?.photoURL} />
                        <MenuList>
                            <Box p={3} textAlign="center">
                                <Avatar size="lg" name={currentUser?.username} src={currentUser?.photoURL} mb={2} />
                                <Text fontSize="lg" fontWeight="bold">{currentUser?.username}</Text>
                                <Text fontSize="md">Role: {currentUser?.role}</Text>
                            </Box>
                            <Divider />
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </MenuList>
                    </Menu>


{/* Dark Mode Toggle */}
                    <IconButton
                        icon={colorMode === "light" ? <IoMoon /> : <SunIcon />}
                        onClick={toggleColorMode}
                        variant="ghost"
                        aria-label="Toggle Color Mode"
                    />
                </HStack>
            </Flex>
        </Container>
    );
};

export default NavbarPage;