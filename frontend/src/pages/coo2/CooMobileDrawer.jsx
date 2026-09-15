// src/pages/coo2/CooMobileDrawer.jsx
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Image,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiPieChart,
  FiFileText,
  FiBell,
  FiCpu,
  FiSearch,
  FiDownload,
  FiLogOut,
  FiCheckCircle,
} from 'react-icons/fi';
import {
  RiBuilding4Line,
  RiMoneyDollarCircleLine,
  RiCodeBoxLine,
  RiTvLine,
  RiArchiveLine,
  RiTeamLine,
  RiCustomerService2Line,
  RiBankLine,
  RiShieldCheckLine,
  RiShareLine,
  RiPlantLine,
  RiDashboardLine,
} from 'react-icons/ri';
import { DEPARTMENTS } from './cooData';

const iconMap = {
  RiDashboardLine,
  RiMoneyDollarCircleLine,
  RiCodeBoxLine,
  RiTvLine,
  RiArchiveLine,
  RiTeamLine,
  RiCustomerService2Line,
  RiBankLine,
  RiShieldCheckLine,
  RiShareLine,
  RiPlantLine,
};

export default function CooMobileDrawer({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  selectedDept,
  onSelectDepartment,
  onOpenQuickSearch,
  onOpenReportModal,
  currentUser,
  onLogout,
  unreadNotifsCount = 0,
}) {
  const navTabs = [
    { id: 'departments', label: 'Departments & KPI Overview', icon: RiBuilding4Line },
    { id: 'analytics', label: 'Performance Analytics', icon: FiPieChart },
    { id: 'reports', label: 'Executive Reports', icon: FiFileText },
    { id: 'notifications', label: 'Live Notifications', icon: FiBell, badge: unreadNotifsCount },
    { id: 'agents', label: 'AI Operational Agents', icon: FiCpu, isAi: true },
  ];

  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
      <DrawerOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />
      <DrawerContent bg="#0b132b" color="#cbd5e1" maxW="320px">
        <DrawerHeader borderBottom="1px solid rgba(255, 255, 255, 0.08)" py={4} px={4}>
          <Flex align="center" justify="space-between">
            <HStack spacing={3}>
              <Flex w="36px" h="36px" align="center" justify="center">
                <Image
                  src="/brand/trade-ethiopia-logo.png"
                  alt="Trade Ethiopia logo"
                  w="36px"
                  h="36px"
                  objectFit="contain"
                />
              </Flex>
              <Box>
                <Text fontSize="15px" fontWeight="800" color="#ffffff" letterSpacing="-0.02em">
                  2 COO Executive
                </Text>
                <Text fontSize="11px" color="#94a3b8">
                  {currentUser?.name || 'Executive Portal'}
                </Text>
              </Box>
            </HStack>
            <DrawerCloseButton position="static" color="#94a3b8" />
          </Flex>
        </DrawerHeader>

        <DrawerBody p={3} overflowY="auto">
          {/* Quick Search Action */}
          <Button
            w="100%"
            size="sm"
            variant="outline"
            borderColor="rgba(255, 255, 255, 0.15)"
            color="#e2e8f0"
            leftIcon={<Icon as={FiSearch} color="#38bdf8" />}
            mb={4}
            justifyContent="flex-start"
            _hover={{ bg: 'rgba(255, 255, 255, 0.06)' }}
            onClick={() => {
              onClose();
              onOpenQuickSearch?.();
            }}
          >
            Quick Search (Ctrl + K)...
          </Button>

          {/* Primary View Navigation */}
          <Text fontSize="11px" fontWeight="800" color="#64748b" textTransform="uppercase" letterSpacing="0.06em" mb={2} px={1}>
            Main Sections
          </Text>

          <VStack align="stretch" spacing={1} mb={5}>
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Flex
                  key={tab.id}
                  as="button"
                  align="center"
                  justify="space-between"
                  px={3}
                  py={2.5}
                  borderRadius="10px"
                  bg={isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent'}
                  color={isActive ? '#38bdf8' : '#94a3b8'}
                  fontWeight={isActive ? '700' : '500'}
                  fontSize="13px"
                  transition="all 0.15s ease"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.05)', color: '#ffffff' }}
                  onClick={() => {
                    onSelectTab(tab.id);
                    onClose();
                  }}
                >
                  <HStack spacing={2.5}>
                    <Icon as={tab.icon} boxSize={4} color={isActive ? '#38bdf8' : '#64748b'} />
                    <Text>{tab.label}</Text>
                  </HStack>
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <Badge bg="#ef4444" color="white" fontSize="10px" borderRadius="full" px={1.5}>
                      {tab.badge}
                    </Badge>
                  )}
                  {tab.isAi && (
                    <Badge bg="#818cf8" color="#0f172a" fontSize="9px" fontWeight="800" px={1.5} borderRadius="sm">
                      AI
                    </Badge>
                  )}
                </Flex>
              );
            })}
          </VStack>

          <Divider borderColor="rgba(255, 255, 255, 0.08)" mb={4} />

          {/* Operational Departments Selector */}
          <Text fontSize="11px" fontWeight="800" color="#64748b" textTransform="uppercase" letterSpacing="0.06em" mb={2} px={1}>
            Department KPIs
          </Text>

          <VStack align="stretch" spacing={1} mb={6}>
            {DEPARTMENTS.map((dept) => {
              const isSelected = selectedDept === dept.id;
              const DeptIcon = iconMap[dept.icon] || RiBuilding4Line;
              return (
                <Flex
                  key={dept.id}
                  as="button"
                  align="center"
                  justify="space-between"
                  px={3}
                  py={2}
                  borderRadius="10px"
                  bg={isSelected ? '#1e293b' : 'transparent'}
                  border="1px solid"
                  borderColor={isSelected ? '#38bdf8' : 'transparent'}
                  color={isSelected ? '#ffffff' : '#cbd5e1'}
                  fontSize="12.5px"
                  fontWeight={isSelected ? '700' : '500'}
                  transition="all 0.15s ease"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.05)', color: '#ffffff' }}
                  onClick={() => {
                    onSelectDepartment(dept.id);
                    onSelectTab('departments');
                    onClose();
                  }}
                >
                  <HStack spacing={2.5} overflow="hidden">
                    <Icon as={DeptIcon} boxSize={4} color={isSelected ? '#38bdf8' : '#94a3b8'} flexShrink={0} />
                    <Text isTruncated textAlign="left">
                      {dept.name}
                    </Text>
                  </HStack>
                  {isSelected && <Icon as={FiCheckCircle} color="#38bdf8" boxSize={3.5} flexShrink={0} />}
                </Flex>
              );
            })}
          </VStack>

          <Divider borderColor="rgba(255, 255, 255, 0.08)" mb={4} />

          {/* Logout button */}
          <Button
            w="100%"
            size="sm"
            variant="outline"
            colorScheme="red"
            leftIcon={<FiLogOut />}
            onClick={() => {
              onClose();
              onLogout?.();
            }}
          >
            Logout
          </Button>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
