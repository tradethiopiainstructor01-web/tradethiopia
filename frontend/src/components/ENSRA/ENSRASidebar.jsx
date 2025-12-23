import React, { useState, useEffect } from 'react';
import { VStack, Box, Button, Tooltip, Badge, Text, Flex, useColorModeValue, Icon } from '@chakra-ui/react';
import { FiHome, FiFileText, FiList, FiUsers } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { getNotifications } from '../../services/notificationService';

const NavButton = ({ icon, label, active, onClick, unreadCount = 0 }) => (
  <Tooltip label={label} placement="right" hasArrow>
    <Button
      leftIcon={<Icon as={icon} />}
      justifyContent="flex-start"
      variant={active ? 'solid' : 'ghost'}
      colorScheme={active ? 'teal' : 'gray'}
      onClick={onClick}
      w="full"
      borderRadius="lg"
      fontWeight="normal"
      position="relative"
    >
      <Text>{label}</Text>
      {unreadCount > 0 && label === 'Notice Board' && (
        <Badge ml={2} colorScheme="red" borderRadius="full">{unreadCount}</Badge>
      )}
    </Button>
  </Tooltip>
);

const ENISRASidebar = ({ onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const activeFromPath = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('notice')) return 'notice';
    if (path.includes('request')) return 'request';
    if (path.includes('follow-up')) return 'follow-up';
    return 'dashboard';
  };
  const [active, setActive] = useState(activeFromPath());

  useEffect(() => {
    setActive(activeFromPath());
    const fetch = async () => {
      try {
        const data = await getNotifications();
        const broadcast = data.filter(n => n.type === 'general' || n.type === 'broadcast');
        const unread = broadcast.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        // ignore
      }
    };

    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [location.pathname]);

  return (
    <Box height="100%" px={3} py={4} bg={useColorModeValue('gray.50', 'gray.800')} borderRightWidth="1px">
      <Box mb={4}>
        <Text fontWeight="bold" fontSize="lg">ENISRA</Text>
      </Box>

      <VStack spacing={3} align="stretch">
        <NavButton
          icon={FiHome}
          label="Dashboard"
          active={active === 'dashboard'}
          onClick={() => { setActive('dashboard'); navigate('/enisra/dashboard'); }}
        />

        <NavButton
          icon={FiUsers}
          label="ENSRA Follow-Up"
          active={active === 'follow-up'}
          onClick={() => {
            setActive('follow-up');
            navigate('/enisra/follow-up');
          }}
        />

        <NavButton
          icon={FiFileText}
          label="Notice Board"
          active={active === 'notice'}
          unreadCount={unreadCount}
          onClick={() => { setActive('notice'); navigate('/enisra/notice-board'); }}
        />

        <NavButton
          icon={FiList}
          label="Request"
          active={active === 'request'}
          onClick={() => { setActive('request'); navigate('/enisra/request'); }}
        />
      </VStack>

      <Flex mt="auto" pt={4}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Logout</Button>
      </Flex>
    </Box>
  );
};

export default ENISRASidebar;
