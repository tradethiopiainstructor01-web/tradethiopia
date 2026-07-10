import React from 'react';
import {
  Box,
  Button,
  Divider,
  Heading,
  IconButton,
  Text,
  VStack,
  Tooltip,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiHome,
  FiLayers,
  FiList,
  FiBarChart2,
  FiTarget,
  FiFileText,
  FiPlusCircle,
  FiMoon,
  FiSun,
  FiLogOut,
  FiMessageSquare,
} from 'react-icons/fi';

const SidebarButton = ({ label, icon: Icon, isActive, onClick, tooltip }) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const color = isActive ? 'blue.500' : useColorModeValue('gray.600', 'gray.300');
  return (
    <Tooltip label={tooltip || label} placement="right" hasArrow>
      <Button
        onClick={onClick}
        leftIcon={<Icon />}
        justifyContent="flex-start"
        variant="ghost"
        color={color}
        fontWeight={isActive ? 'bold' : 'medium'}
        bg={isActive ? activeBg : 'transparent'}
        borderRadius="xl"
        w="100%"
        _hover={{ bg: useColorModeValue('gray.100', 'whiteAlpha.100') }}
      >
        <Text display={{ base: 'none', lg: 'inline' }}>{label}</Text>
      </Button>
    </Tooltip>
  );
};

export default function ITSidebar({ activeSection, setActiveSection, setModalOpen, handleLogout }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box
      as="aside"
      w={{ base: '80px', lg: '260px' }}
      bg={useColorModeValue('white', 'gray.800')}
      borderRight="1px solid"
      borderColor={borderColor}
      p={{ base: 3, lg: 6 }}
    >
      <VStack spacing={6} align="stretch" h="full">
        <Box textAlign="center">
          <Heading size="md" color="blue.500">
            IT Ops
          </Heading>
          <Text fontSize="xs" color="gray.500">
            Dashboard
          </Text>
        </Box>
        <VStack spacing={2} align="stretch">
          <SidebarButton
            label="Overview"
            icon={FiHome}
            isActive={activeSection === 'dashboard'}
            onClick={() => setActiveSection('dashboard')}
          />
          <SidebarButton
            label="Internal Tasks"
            icon={FiLayers}
            isActive={activeSection === 'internal'}
            onClick={() => setActiveSection('internal')}
          />
          <SidebarButton
            label="External Tasks"
            icon={FiList}
            isActive={activeSection === 'external'}
            onClick={() => setActiveSection('external')}
          />
          <SidebarButton
            label="Performance"
            icon={FiBarChart2}
            isActive={activeSection === 'performance'}
            onClick={() => setActiveSection('performance')}
          />
          <SidebarButton
            label="KPI"
            icon={FiTarget}
            isActive={activeSection === 'kpi'}
            onClick={() => setActiveSection('kpi')}
          />
          <SidebarButton
            label="Reports"
            icon={FiFileText}
            isActive={activeSection === 'reports'}
            onClick={() => setActiveSection('reports')}
          />
        </VStack>
        <Divider />
        <VStack>
          <Button
            leftIcon={<FiPlusCircle />}
            colorScheme="blue"
            w="full"
            borderRadius="xl"
            onClick={() => setModalOpen(true)}
          >
            <Text display={{ base: 'none', lg: 'inline' }}>Add Task</Text>
          </Button>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            onClick={toggleColorMode}
            borderRadius="xl"
            w="full"
          />
          <Button
            leftIcon={<FiLogOut />}
            colorScheme="red"
            variant="outline"
            w="full"
            borderRadius="xl"
            onClick={handleLogout}
          >
            <Text display={{ base: 'none', lg: 'inline' }}>Logout</Text>
          </Button>
          
          <Tooltip label="Notice Board" placement="right" hasArrow>
            <Button
              leftIcon={<FiMessageSquare />}
              justifyContent={{ base: 'center', lg: 'flex-start' }}
              variant={activeSection === 'notice-board' ? 'solid' : 'ghost'}
              colorScheme={activeSection === 'notice-board' ? 'teal' : 'gray'}
              onClick={() => setActiveSection('notice-board')}
              w="full"
              size="md"
              borderRadius="lg"
            >
              <Text display={{ base: 'none', lg: 'block' }}>Notice Board</Text>
            </Button>
          </Tooltip>
        </VStack>
      </VStack>
    </Box>
  );
}
