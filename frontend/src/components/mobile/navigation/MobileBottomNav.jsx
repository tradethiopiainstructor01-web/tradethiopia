import React from 'react';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { FiBarChart2, FiClipboard, FiHome, FiShoppingCart, FiUsers } from 'react-icons/fi';

const navItems = [
  { label: 'Home', value: 'Home', icon: FiHome },
  { label: 'Followup', value: 'Followup', icon: FiUsers },
  { label: 'Orders', value: 'Orders', icon: FiShoppingCart },
  { label: 'Tasks', value: 'Tasks', icon: FiClipboard },
  { label: 'Reports', value: 'Monthly Report', icon: FiBarChart2 }
];

const MobileBottomNav = ({ activeItem, onChange }) => (
  <Box
    position="fixed"
    left={0}
    right={0}
    bottom={0}
    zIndex={20}
    bg="white"
    borderTop="1px solid"
    borderColor="#E8EDF5"
    px={2}
    pt={2}
    pb="calc(8px + env(safe-area-inset-bottom))"
  >
    <Flex justify="space-between" align="center" gap={1}>
      {navItems.map((item) => {
        const isActive = activeItem === item.value || (item.value === 'Home' && !activeItem);

        return (
          <Box
            key={item.value}
            as="button"
            type="button"
            flex="1"
            minW={0}
            py={2}
            borderRadius="14px"
            bg={isActive ? '#0E8C80' : 'transparent'}
            color={isActive ? 'white' : '#6E7890'}
            transition="background 0.18s ease"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(item.value)}
          >
            <Flex direction="column" align="center" gap={1}>
              <Icon as={item.icon} boxSize={5} strokeWidth={isActive ? 2.5 : 2.1} />
              <Text fontSize="11px" fontWeight="700" lineHeight="1.1" noOfLines={1}>
                {item.label}
              </Text>
            </Flex>
          </Box>
        );
      })}
    </Flex>
  </Box>
);

export default MobileBottomNav;
