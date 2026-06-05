import { useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Text,
  Tooltip,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import {
  BellIcon,
  ChevronDownIcon,
  HamburgerIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
} from "@chakra-ui/icons";
import {
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiGrid,
  FiLogOut,
  FiPackage,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/user";
import AssetList from "../AssetList";
import NotesLauncher from "../notes/NotesLauncher";
import RequestPage from "../../pages/RequestPage";
import SocialMediaManager from "./SocialMediaManager";
import { EmptyStateBlock, SectionIntro, SurfaceCard } from "./SocialMediaPrimitives";

const navGroups = [
  {
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: FiBarChart2, description: "Performance and weekly operations" },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "assets", label: "Asset Library", icon: FiPackage, description: "Review approved HR-managed assets" },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { key: "requests", label: "Requests", icon: FiClipboard, description: "Submit and track shared requests" },
    ],
  },
];

const sectionMeta = {
  dashboard: {
    eyebrow: "Overview",
    title: "Social media operating system",
    description: "A cleaner command center for planning, publishing, analytics, reporting, and team coordination.",
  },
  assets: {
    eyebrow: "Operations",
    title: "Asset library",
    description: "Browse the shared HR asset inventory for campaign planning, approvals, and publishing support.",
  },
  requests: {
    eyebrow: "Collaboration",
    title: "Request center",
    description: "Coordinate with other teams using the existing shared request workflow.",
  },
};

const utilityButtonProps = {
  variant: "ghost",
  borderRadius: "16px",
  borderWidth: "1px",
  borderColor: "transparent",
  transition: "background 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
  _hover: { bg: "rgba(248,250,252,0.95)", borderColor: "rgba(203,213,225,0.75)", transform: "translateY(-1px)" },
  _dark: { _hover: { bg: "whiteAlpha.100", borderColor: "whiteAlpha.100" } },
  _focusVisible: { boxShadow: "0 0 0 3px rgba(37,99,235,0.28)" },
};

function SidebarNav({
  activeSection,
  onSelect,
  currentUser,
  collapsed,
  onToggleCollapse,
  onClose,
  colorMode,
  toggleColorMode,
  onLogout,
}) {
  const sidebarBg = useColorModeValue("rgba(255,255,255,0.9)", "rgba(15,23,42,0.78)");
  const borderColor = useColorModeValue("rgba(226,232,240,0.92)", "rgba(148,163,184,0.16)");
  const muted = useColorModeValue("#64748B", "gray.400");
  const titleColor = useColorModeValue("#0F172A", "white");
  const activeBg = useColorModeValue("rgba(239,246,255,0.98)", "rgba(37,99,235,0.92)");
  const activeText = useColorModeValue("#0F172A", "white");
  const activeMeta = useColorModeValue("#2563EB", "whiteAlpha.800");
  const hoverBg = useColorModeValue("rgba(248,250,252,0.9)", "whiteAlpha.100");
  const collapsedLogoBg = useColorModeValue("rgba(239,246,255,0.98)", "blue.500");
  const collapsedLogoColor = useColorModeValue("blue.700", "white");

  return (
    <Flex
      direction="column"
      h="100%"
      bg={sidebarBg}
      backdropFilter="blur(24px) saturate(1.2)"
      borderRightWidth="1px"
      borderColor={borderColor}
      px={collapsed ? 3 : 4}
      py={4}
    >
      <VStack align="stretch" spacing={5} flex="1">
        <HStack justify="space-between">
          {!collapsed ? (
            <Box>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color={muted} fontWeight="700">
                Workspace
              </Text>
              <Text fontSize="lg" fontWeight="700" letterSpacing="0" color={titleColor}>
                Social Media
              </Text>
            </Box>
          ) : (
            <Flex w="42px" h="42px" align="center" justify="center" borderRadius="16px" bg={collapsedLogoBg} color={collapsedLogoColor} boxShadow="inset 0 1px 0 rgba(255,255,255,0.45)">
              <Icon as={FiGrid} boxSize={5} />
            </Flex>
          )}

          <HStack spacing={1}>
            {onClose ? (
              <IconButton aria-label="Close sidebar" icon={<ChevronDownIcon transform="rotate(90deg)" />} onClick={onClose} {...utilityButtonProps} />
            ) : null}
            {!onClose ? (
              <IconButton
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                icon={collapsed ? <FiChevronRight /> : <FiChevronLeft />}
                onClick={onToggleCollapse}
                {...utilityButtonProps}
              />
            ) : null}
          </HStack>
        </HStack>

        <SurfaceCard>
          <Box p={collapsed ? 3 : 4}>
            <HStack spacing={3} align="center" justify={collapsed ? "center" : "flex-start"}>
              <Avatar size="sm" name={currentUser?.username || currentUser?.email || "Social Media"} bg="#2563EB" color="white" />
              {!collapsed ? (
                <Box minW={0}>
                  <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                    {currentUser?.username || currentUser?.email || "Social Media Manager"}
                  </Text>
                  <Text fontSize="xs" color={muted} noOfLines={1}>
                    {currentUser?.department || "Social Media"} · {currentUser?.displayRole || "Manager"}
                  </Text>
                </Box>
              ) : null}
            </HStack>
          </Box>
        </SurfaceCard>

        <VStack as="nav" aria-label="Social dashboard navigation" align="stretch" spacing={5} flex="1">
          {navGroups.map((group) => (
            <Box key={group.label}>
              {!collapsed ? (
                <Text px={3} mb={2} fontSize="11px" textTransform="uppercase" letterSpacing="0.12em" fontWeight="700" color={muted}>
                  {group.label}
                </Text>
              ) : null}
              <VStack align="stretch" spacing={1.5}>
                {group.items.map((item) => {
                  const isActive = activeSection === item.key;
                  const navButton = (
                    <Button
                      key={item.key}
                      justifyContent={collapsed ? "center" : "space-between"}
                      leftIcon={collapsed ? undefined : <Icon as={item.icon} boxSize={5} />}
                      variant="ghost"
                      h="52px"
                      px={collapsed ? 0 : 3}
                      borderRadius="18px"
                      bg={isActive ? activeBg : "transparent"}
                      color={isActive ? activeText : undefined}
                      borderWidth="1px"
                      borderColor={isActive ? "rgba(37,99,235,0.18)" : "transparent"}
                      boxShadow={isActive ? "0 10px 24px rgba(37,99,235,0.12)" : "none"}
                      _hover={{ bg: isActive ? activeBg : hoverBg, transform: "translateX(1px)" }}
                      _focusVisible={{ boxShadow: "0 0 0 3px rgba(37,99,235,0.28)" }}
                      transition="all 0.18s ease"
                      onClick={() => onSelect(item.key)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {collapsed ? (
                        <Icon as={item.icon} boxSize={5} />
                      ) : (
                        <>
                          <Flex direction="column" align="start" flex="1" minW={0}>
                            <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                              {item.label}
                            </Text>
                            <Text fontSize="xs" color={isActive ? activeMeta : muted} noOfLines={1}>
                              {item.description}
                            </Text>
                          </Flex>
                          {item.key === "requests" ? (
                            <Badge colorScheme="blue" variant="subtle" borderRadius="full">
                              1
                            </Badge>
                          ) : null}
                        </>
                      )}
                    </Button>
                  );

                  return collapsed ? (
                    <Tooltip key={item.key} label={item.label} placement="right">
                      {navButton}
                    </Tooltip>
                  ) : (
                    navButton
                  );
                })}
              </VStack>
            </Box>
          ))}
        </VStack>
      </VStack>

      <Box pt={4}>
        <Divider mb={4} borderColor={borderColor} />
        <VStack align="stretch" spacing={2}>
          <HStack justify={collapsed ? "center" : "flex-start"} spacing={2}>
            <Tooltip label={colorMode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                {...utilityButtonProps}
              />
            </Tooltip>
            <NotesLauncher
              buttonProps={{
                ...utilityButtonProps,
                "aria-label": "Open notes",
              }}
              tooltipLabel="Notes"
            />
          </HStack>
          {!collapsed ? (
            <>
              <Button leftIcon={<SettingsIcon />} justifyContent="flex-start" variant="ghost" borderRadius="14px">
                Settings
              </Button>
              <Button leftIcon={<Icon as={FiLogOut} />} justifyContent="flex-start" colorScheme="red" variant="ghost" borderRadius="14px" onClick={onLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Tooltip label="Logout" placement="right">
              <IconButton aria-label="Logout" icon={<Icon as={FiLogOut} />} colorScheme="red" variant="ghost" borderRadius="14px" onClick={onLogout} />
            </Tooltip>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}

export default function SocialMediaWorkspace() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const currentUser = useUserStore((state) => state.currentUser);

  const contentBg = useColorModeValue(
    "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 58%, #EEF2F7 100%)",
    "linear-gradient(180deg, #020617 0%, #0F172A 60%, #111827 100%)"
  );
  const headerBg = useColorModeValue("rgba(248,250,252,0.82)", "rgba(2,6,23,0.76)");
  const borderColor = useColorModeValue("rgba(226,232,240,0.86)", "rgba(148,163,184,0.16)");
  const searchBg = useColorModeValue("rgba(255,255,255,0.92)", "whiteAlpha.100");
  const muted = useColorModeValue("#64748B", "gray.400");
  const assetHeroBg = useColorModeValue(
    "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92))",
    "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,64,175,0.28))"
  );
  const assetBadgeBg = useColorModeValue("rgba(37,99,235,0.08)", "whiteAlpha.100");
  const assetIconBg = useColorModeValue("rgba(37,99,235,0.1)", "rgba(37,99,235,0.26)");

  const currentMeta = sectionMeta[activeSection] || sectionMeta.dashboard;

  const handleLogout = () => {
    clearUser();
    navigate("/login");
  };

  const renderMainContent = () => {
    if (activeSection === "assets") {
      return (
        <VStack align="stretch" spacing={6}>
          <SurfaceCard bgImage={assetHeroBg}>
            <Box p={{ base: 5, md: 6 }}>
              <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={5} direction={{ base: "column", md: "row" }}>
                <HStack spacing={4} align="center">
                  <Flex
                    w="56px"
                    h="56px"
                    align="center"
                    justify="center"
                    borderRadius="20px"
                    bg={assetIconBg}
                    color="#2563EB"
                    boxShadow="inset 0 1px 0 rgba(255,255,255,0.55)"
                    flexShrink={0}
                  >
                    <Icon as={FiPackage} boxSize={7} />
                  </Flex>
                  <Box>
                    <SectionIntro eyebrow={currentMeta.eyebrow} title={currentMeta.title} description={currentMeta.description} />
                  </Box>
                </HStack>
                <HStack spacing={2} flexWrap="wrap">
                  <Badge borderRadius="full" px={3} py={1} bg={assetBadgeBg} color="#2563EB">
                    HR Source
                  </Badge>
                  <Badge borderRadius="full" px={3} py={1} bg={assetBadgeBg} color="#2563EB">
                    Read Only
                  </Badge>
                  <Badge borderRadius="full" px={3} py={1} bg={assetBadgeBg} color="#2563EB">
                    Export Ready
                  </Badge>
                </HStack>
              </Flex>
            </Box>
          </SurfaceCard>

          <SurfaceCard>
            <Box p={{ base: 3, md: 4 }}>
              <AssetList readOnly />
            </Box>
          </SurfaceCard>
        </VStack>
      );
    }

    if (activeSection === "requests") {
      return (
        <VStack align="stretch" spacing={6}>
          <SectionIntro eyebrow={currentMeta.eyebrow} title={currentMeta.title} description={currentMeta.description} />
          <RequestPage
            maxWidth="100%"
            departmentOverride="Social Media"
            backRouteOverride="/social-media"
            backLabelOverride="Social Media"
            hideBackButton
          />
        </VStack>
      );
    }

    return (
      <VStack align="stretch" spacing={6}>
        <SectionIntro
          eyebrow={currentMeta.eyebrow}
          title={currentMeta.title}
          description={currentMeta.description}
        />
        <SocialMediaManager />
      </VStack>
    );
  };

  return (
    <Flex minH="100vh" bg={contentBg}>
      <Box display={{ base: "none", lg: "block" }} w={collapsed ? "96px" : "300px"} transition="width 0.2s ease">
        <SidebarNav
          activeSection={activeSection}
          onSelect={setActiveSection}
          currentUser={currentUser}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          colorMode={colorMode}
          toggleColorMode={toggleColorMode}
          onLogout={handleLogout}
        />
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent maxW="300px">
          <DrawerHeader p={0} />
          <DrawerBody p={0}>
            <SidebarNav
              activeSection={activeSection}
              onSelect={(key) => {
                setActiveSection(key);
                onClose();
              }}
              currentUser={currentUser}
              collapsed={false}
              onToggleCollapse={() => {}}
              onClose={onClose}
              colorMode={colorMode}
              toggleColorMode={toggleColorMode}
              onLogout={handleLogout}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box flex="1" minW={0}>
        <Flex
          as="header"
          position="sticky"
          top="0"
          zIndex="10"
          px={{ base: 4, md: 6 }}
          py={4}
          align="center"
          justify="space-between"
          bg={headerBg}
          backdropFilter="blur(22px) saturate(1.18)"
          borderBottomWidth="1px"
          borderColor={borderColor}
          boxShadow={useColorModeValue("0 1px 0 rgba(255,255,255,0.85)", "0 1px 0 rgba(255,255,255,0.04)")}
        >
          <HStack spacing={3} minW={0} flex="1">
            <IconButton
              display={{ base: "inline-flex", lg: "none" }}
              aria-label="Open sidebar"
              icon={<HamburgerIcon />}
              onClick={onOpen}
              {...utilityButtonProps}
            />
            <InputGroup maxW={{ base: "100%", md: "380px" }}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color={muted} />
              </InputLeftElement>
              <Input
                placeholder="Search campaigns, metrics, or assets"
                aria-label="Global search"
                borderRadius="18px"
                bg={searchBg}
                borderColor={borderColor}
                boxShadow="inset 0 1px 0 rgba(255,255,255,0.55)"
                _hover={{ borderColor: "rgba(37,99,235,0.28)" }}
                _focusVisible={{ boxShadow: "0 0 0 3px rgba(37,99,235,0.28)" }}
              />
            </InputGroup>
          </HStack>

          <HStack spacing={2} ml={4}>
            <IconButton aria-label="Notifications" icon={<BellIcon />} {...utilityButtonProps} />
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                borderRadius="18px"
                px={2}
                py={1}
                rightIcon={<ChevronDownIcon />}
                _focusVisible={{ boxShadow: "0 0 0 3px rgba(37,99,235,0.28)" }}
              >
                <HStack spacing={3}>
                  <Avatar size="sm" name={currentUser?.username || currentUser?.email || "User"} bg="#2563EB" color="white" />
                  <Box textAlign="left" display={{ base: "none", md: "block" }}>
                    <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                      {currentUser?.username || "Social Media"}
                    </Text>
                    <Text fontSize="xs" color={muted} noOfLines={1}>
                      {currentUser?.displayRole || "Manager"}
                    </Text>
                  </Box>
                </HStack>
              </MenuButton>
              <Portal>
                <MenuList borderRadius="18px" boxShadow="0 18px 46px rgba(15,23,42,0.16)" borderColor={borderColor}>
                  <MenuItem icon={<SettingsIcon />}>Settings</MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<Icon as={FiLogOut} />} onClick={handleLogout}>
                    Logout
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </HStack>
        </Flex>

        <Box px={{ base: 4, md: 6, xl: 8 }} py={{ base: 5, md: 6 }}>
          {navGroups.some((group) => group.items.some((item) => item.key === activeSection)) ? (
            renderMainContent()
          ) : (
            <EmptyStateBlock
              title="No matching section"
              description="This section is not configured yet. Choose another area from the sidebar."
              badge="Navigation"
            />
          )}
        </Box>
      </Box>
    </Flex>
  );
}


