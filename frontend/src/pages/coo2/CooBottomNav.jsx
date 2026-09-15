// src/pages/coo2/CooBottomNav.jsx
import { Box, Flex, Text, Icon, Badge } from '@chakra-ui/react';
import { RiBuilding4Line } from 'react-icons/ri';
import { FiPieChart, FiFileText, FiBell, FiMenu } from 'react-icons/fi';

export default function CooBottomNav({
  activeTab,
  onSelectTab,
  unreadNotifsCount = 0,
  onOpenMobileMenu,
  selectedDeptName = '',
}) {
  const navItems = [
    {
      id: 'departments',
      label: 'Depts',
      sublabel: selectedDeptName || 'All',
      icon: RiBuilding4Line,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: FiPieChart,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FiFileText,
    },
    {
      id: 'notifications',
      label: 'Notifs',
      icon: FiBell,
      badgeCount: unreadNotifsCount,
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: FiMenu,
      isAction: true,
    },
  ];

  return (
    <Box
      display={{ base: 'block', lg: 'none' }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={1000}
      bg="rgba(11, 19, 43, 0.96)"
      backdropFilter="blur(16px)"
      borderTop="1px solid rgba(255, 255, 255, 0.12)"
      boxShadow="0 -4px 20px rgba(0, 0, 0, 0.35)"
      px={2}
      py={1.5}
      sx={{
        paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
      }}
    >
      <Flex justify="space-around" align="center" maxW="500px" mx="auto">
        {navItems.map((item) => {
          const isActive = !item.isAction && activeTab === item.id;
          return (
            <Box
              key={item.id}
              as="button"
              onClick={() => {
                if (item.isAction) {
                  onOpenMobileMenu();
                } else {
                  onSelectTab(item.id);
                }
              }}
              py={1}
              px={{ base: 2, sm: 3 }}
              borderRadius="12px"
              position="relative"
              bg={isActive ? 'rgba(56, 189, 248, 0.16)' : 'transparent'}
              color={isActive ? '#38bdf8' : '#94a3b8'}
              transition="all 0.2s ease"
              _active={{ transform: 'scale(0.92)' }}
              display="flex"
              flexDirection="column"
              alignItems="center"
              minW="56px"
            >
              <Box position="relative">
                <Icon
                  as={item.icon}
                  boxSize="20px"
                  color={isActive ? '#38bdf8' : '#94a3b8'}
                />
                {Boolean(item.badgeCount && item.badgeCount > 0) && (
                  <Badge
                    position="absolute"
                    top="-4px"
                    right="-8px"
                    bg="#ef4444"
                    color="white"
                    fontSize="9px"
                    fontWeight="800"
                    borderRadius="full"
                    minW="16px"
                    h="16px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    border="2px solid #0b132b"
                  >
                    {item.badgeCount}
                  </Badge>
                )}
              </Box>
              <Text
                fontSize="10.5px"
                fontWeight={isActive ? '700' : '500'}
                mt={0.5}
                letterSpacing="-0.01em"
                whiteSpace="nowrap"
              >
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}
