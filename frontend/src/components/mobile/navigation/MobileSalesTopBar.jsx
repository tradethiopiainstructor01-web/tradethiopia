import React from 'react';
import { Box, Flex, Heading, IconButton, Badge, Menu, MenuButton, MenuList, Text } from '@chakra-ui/react';
import DocumentReminderToast from '../../sales/DocumentReminderToast';
import { FiBell, FiMenu, FiPlus } from 'react-icons/fi';

const MobileSalesTopBar = ({ title = 'Sales', onMenu, onAdd, documentReminder }) => (
  <Box bg="#001f4d" borderBottom="1px solid" borderColor="#001a42" px={4} py={3}>
    <Flex align="center" justify="space-between">
      <Flex align="center" gap={2} minW={0}>
        {onMenu && (
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            variant="ghost"
            color="white"
            fontSize="22px"
            size="sm"
            onClick={onMenu}
            _hover={{ bg: 'whiteAlpha.200' }}
          />
        )}
        <Heading color="white" fontSize="22px" lineHeight="1" fontWeight="900" noOfLines={1}>
          {title}
        </Heading>
      </Flex>
      <Flex align="center" gap={2}>
        <Menu>
        <MenuButton as={IconButton}
          aria-label="Notifications"
          icon={<Box position="relative"><FiBell />{documentReminder?.total > 0 && <Badge position="absolute" top="-10px" right="-10px" colorScheme="orange" borderRadius="full">1</Badge>}</Box>}
          variant="ghost"
          color="white"
          fontSize="20px"
          _hover={{ bg: 'whiteAlpha.200' }}
        />
        <MenuList w="360px" minW={0} maxW="calc(100vw - 24px)" p={3} maxH="70vh" overflowY="auto" zIndex="popover">
          <Text fontWeight="bold" mb={3}>Notifications</Text>
          {documentReminder?.total > 0 ? <DocumentReminderToast {...documentReminder} /> : <Text color="gray.500" fontSize="sm">No new notifications</Text>}
        </MenuList>
        </Menu>
        <IconButton
          aria-label="Add"
          icon={<FiPlus />}
          variant="ghost"
          color="#D99A00"
          fontSize="26px"
          onClick={onAdd}
          _hover={{ bg: 'whiteAlpha.200' }}
        />
      </Flex>
    </Flex>
  </Box>
);

export default MobileSalesTopBar;
