import { useEffect, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Center,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Text,
  VStack
} from '@chakra-ui/react';
import {
  FiAlertTriangle,
  FiBarChart2,
  FiCalendar,
  FiCheckSquare,
  FiClipboard,
  FiHome,
  FiLogOut,
  FiMessageSquare,
  FiShoppingCart,
  FiUploadCloud,
  FiUsers,
  FiX
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from '../../../store/user';
import { rememberReturnPath } from '../../../utils/authStorage';
import { getNotifications } from '../../../services/notificationService';

const theme = {
  navy: '#001f4d',
  navyDeep: '#001533',
  navyPanel: 'rgba(255,255,255,0.10)',
  gold: '#D99A00',
  teal: '#0E8C80',
  red: '#F04438'
};

// Same sections as the desktop sales sidebar (components/sales/Ssidebar.jsx).
const sidebarItems = [
  { label: 'Home', value: 'Home', icon: FiHome },
  { label: 'Followup', value: 'Followup', icon: FiUsers },
  { label: 'Orders', value: 'Orders', icon: FiShoppingCart },
  { label: 'Tasks', value: 'Tasks', icon: FiCheckSquare },
  { label: 'Content Tracker', value: 'Content Tracker', icon: FiCalendar },
  { label: 'Monthly Report', value: 'Monthly Report', icon: FiBarChart2 },
  { label: 'Notice Board', value: 'Notice Board', icon: FiMessageSquare },
  { label: 'Requests', value: 'Requests', icon: FiClipboard },
  { label: 'Upload Documents', value: 'Upload Documents', icon: FiUploadCloud },
  { label: 'My Warnings', value: 'My Warnings', icon: FiAlertTriangle }
];

const clean = (value, fallback) => {
  const text = value === null || value === undefined ? '' : value.toString().trim();
  return text || fallback;
};

const roleLabel = (value = '') => (
  clean(value, 'Sales Officer')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
);

const SidebarItem = ({ item, isActive, onClick, danger = false, badge = 0 }) => (
  <Box as="button" type="button" w="100%" textAlign="left" onClick={onClick}>
    <Flex
      align="center"
      justify="space-between"
      gap={3}
      px={3}
      py={3}
      borderRadius="12px"
      bg={isActive ? theme.navyPanel : 'transparent'}
      color={danger ? theme.red : 'white'}
      transition="background 0.18s ease, transform 0.18s ease"
      _active={{ transform: 'scale(0.98)' }}
    >
      <HStack spacing={3} minW={0}>
        <Center
          w="28px"
          h="28px"
          borderRadius={isActive ? '9px' : '8px'}
          bg={isActive ? theme.teal : 'transparent'}
          color={danger ? theme.red : 'white'}
        >
          <Icon as={item.icon} boxSize={5} strokeWidth={isActive ? 2.7 : 2.2} />
        </Center>
        <Text fontSize="13px" fontWeight="900" noOfLines={1}>
          {item.label}
        </Text>
      </HStack>
      {badge > 0 && (
        <Badge
          bg={theme.red}
          color="white"
          borderRadius="full"
          minW="22px"
          h="22px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="10px"
          fontWeight="900"
        >
          {badge}
        </Badge>
      )}
    </Flex>
  </Box>
);

const SectionDivider = () => <Box h="1px" bg="rgba(255,255,255,0.15)" my={2} />;

const MobileSalesSidebar = ({ isOpen, onClose, activeItem, onNavigate }) => {
  const currentUser = useUserStore((state) => state.currentUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Unread broadcast messages, counted the same way as the desktop sidebar.
  useEffect(() => {
    if (!isOpen) return;
    getNotifications()
      .then((data) => {
        const broadcasts = (Array.isArray(data) ? data : []).filter((msg) => msg.type === 'general');
        setUnreadCount(broadcasts.filter((msg) => !msg.read).length);
      })
      .catch((err) => console.error('Error fetching notification count:', err));
  }, [isOpen]);

  const fullName = clean(
    currentUser?.fullName || currentUser?.name || currentUser?.username || localStorage.getItem('userName'),
    'Sales User'
  );
  const role = roleLabel(currentUser?.jobTitle || currentUser?.position || currentUser?.displayRole || currentUser?.role);
  const email = clean(currentUser?.email, 'Email not available');

  const goTo = (value) => {
    onNavigate(value);
    onClose();
  };

  const logout = () => {
    rememberReturnPath(`${location.pathname}${location.search}${location.hash}`, currentUser);
    clearUser();
    onClose();
    navigate('/login', { replace: true });
  };

  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
      <DrawerOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
      <DrawerContent
        maxW="82vw"
        bg={`linear-gradient(160deg, ${theme.navy} 0%, #002A62 46%, ${theme.navyDeep} 100%)`}
        color="white"
        borderRightRadius="0"
        boxShadow="22px 0 40px rgba(0,0,0,0.28)"
      >
        <Box minH="100vh" px={4} pt="calc(20px + env(safe-area-inset-top))" pb="calc(18px + env(safe-area-inset-bottom))" position="relative" overflow="hidden">
          <Box position="absolute" inset={0} opacity={0.11} bg="radial-gradient(circle at 28% 18%, white 1px, transparent 1.5px)" backgroundSize="34px 34px" />
          <VStack align="stretch" spacing={5} position="relative" zIndex={1}>
            <Flex align="flex-start" justify="space-between" gap={3}>
              <HStack spacing={2} align="center" minW={0}>
                <Image src="/logo.png" alt="TradeEthiopia" boxSize="48px" objectFit="contain" flexShrink={0} />
                <Box minW={0}>
                  <Text fontFamily="Georgia, serif" fontSize="18px" fontWeight="900" lineHeight="0.95" noOfLines={2}>
                    TradeEthiopia
                    <br />
                    GROUP
                  </Text>
                  <Text mt={1} color={theme.gold} fontSize="8px" fontWeight="800" noOfLines={1}>
                    Connecting Markets, Empowering Business
                  </Text>
                </Box>
              </HStack>
              <IconButton
                aria-label="Close menu"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                color="white"
                onClick={onClose}
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </Flex>

            <HStack spacing={3} px={1}>
              <Avatar name={fullName} size="md" bg="white" color={theme.navy} borderWidth="2px" borderColor="white" />
              <Box minW={0}>
                <Text fontSize="15px" fontWeight="900" noOfLines={1}>{fullName}</Text>
                <Text fontSize="11px" color="whiteAlpha.800" fontWeight="800" noOfLines={1}>{role}</Text>
                <Text fontSize="10px" color="whiteAlpha.700" noOfLines={1}>{email}</Text>
              </Box>
            </HStack>

            <Box>
              {sidebarItems.map((item) => (
                <SidebarItem
                  key={item.value}
                  item={item}
                  isActive={activeItem === item.value}
                  badge={item.value === 'Notice Board' ? unreadCount : 0}
                  onClick={() => goTo(item.value)}
                />
              ))}
              <SectionDivider />
              <SidebarItem item={{ label: 'Log Out', icon: FiLogOut }} danger onClick={logout} />
            </Box>
          </VStack>
        </Box>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileSalesSidebar;
