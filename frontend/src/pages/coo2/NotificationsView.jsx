// src/pages/coo2/NotificationsView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  IconButton,
  Tabs,
  TabList,
  Tab,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiCheck,
  FiX,
  FiClock,
  FiTrash2,
  FiMessageSquare,
  FiTrendingUp,
  FiExternalLink,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';

const formatTimeAgo = (date) => {
  if (!date) return 'Recently';
  const diff = (new Date() - new Date(date)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const NotificationsView = ({ unreadCount, setUnreadCount, onNavigateDepartment }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchLiveNotifications = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/notifications', { params: { includeRead: true } });
      const liveDocs = Array.isArray(res.data) ? res.data : [];
      const departmentIds = { Sales: 'sales', Finance: 'finance', HR: 'hr', 'Customer Success': 'customer_services', Tessbin: 'tessbin', 'Social Media': 'social_media', IT: 'it', 'Tradex TV': 'tradex', Ensira: 'ensira', Supervisor: 'supervisor' };
      const formatted = liveDocs.map((doc) => {
        const meta = doc.metadata || {};
        const isKpi = doc.type === 'kpi_submission' || doc.category === 'kpi';
        const department = meta.department || 'Operations';
        return {
          id: doc._id || doc.id, title: meta.title || (isKpi ? `${department} KPI Report Submitted` : doc.text?.slice(0, 45) || 'Notification'),
          desc: doc.text || '', time: formatTimeAgo(doc.createdAt), unread: !doc.read,
          department, departmentId: meta.departmentId || departmentIds[department],
          type: isKpi ? 'success' : doc.type === 'warning' ? 'warning' : 'info',
          actionRequired: isKpi || !!doc.link, actionText: meta.actionLabel || 'View Details',
          link: doc.link || '', isKpi, managerComment: meta.managerComment || '', submittedByName: meta.submittedByName || '',
          periodKey: meta.periodKey || '', periodType: meta.periodType || '',
        };
      });
      setNotifications(formatted);
      setUnreadCount?.(formatted.filter((item) => item.unread).length);
      setLoadError('');
    } catch {
      setLoadError('Unable to load notifications. Please refresh to retry.');
    } finally { setLoading(false); }
  }, [setUnreadCount]);

  useEffect(() => {
    fetchLiveNotifications();
    const timer = window.setInterval(fetchLiveNotifications, 15000);
    window.addEventListener('focus', fetchLiveNotifications);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', fetchLiveNotifications); };
  }, [fetchLiveNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.put('/notifications/mark-all-read');
      await fetchLiveNotifications();
      toast({ title: 'All notifications marked as read', status: 'success', duration: 2000, isClosable: true });
    } catch {
      toast({ title: 'Could not mark notifications as read. Please retry.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const handleAction = async (notif, actionType) => {
    try {
      await axiosInstance.put(`/notifications/${notif.id}`);
      await fetchLiveNotifications();
    } catch {
      toast({ title: 'Could not update notification. Please retry.', status: 'error', duration: 4000, isClosable: true });
      return;
    }
    if (actionType === 'approve' || actionType === 'view') {
      if (notif.isKpi && notif.departmentId) {
        onNavigateDepartment?.(notif.departmentId, notif.periodType, notif.periodKey);
      } else if (notif.link.startsWith('/') && !notif.link.startsWith('//')) {
        navigate(notif.link);
      }
    }
  };
  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return n.unread;
    if (filter === 'action') return n.actionRequired;
    return true;
  });

  return (
    <Box maxW="960px">
      {loadError && <Text role="alert" color="red.600" mb={4}>{loadError}</Text>}
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <HStack spacing={2.5}>
            <Text fontSize="22px" fontWeight="800" color="#0f172a" letterSpacing="-0.02em">
              Operations Alert Center
            </Text>
            {notifications.filter((n) => n.unread).length > 0 && (
              <Badge colorScheme="red" fontSize="11px" borderRadius="full" px={2.5} py={0.5}>
                {notifications.filter((n) => n.unread).length} Unread
              </Badge>
            )}
            {loading && <Spinner size="xs" color="#2563eb" />}
          </HStack>
          <Text fontSize="13.5px" color="#64748b">
            Critical operational warnings, KPI submissions, manager comments, and executive action requests.
          </Text>
        </Box>

        <HStack spacing={2}>
          <Button
            size="sm"
            variant="outline"
            fontSize="12.5px"
            onClick={fetchLiveNotifications}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            fontSize="12.5px"
            color="#2563eb"
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        </HStack>
      </Flex>

      {/* Tabs */}
      <Tabs
        variant="soft-rounded"
        colorScheme="blue"
        size="sm"
        mb={4}
        onChange={(index) => {
          if (index === 0) setFilter('all');
          if (index === 1) setFilter('unread');
          if (index === 2) setFilter('action');
        }}
      >
        <TabList bg="#ffffff" p={1} borderRadius="12px" border="1px solid #e2e8f0" display="inline-flex">
          <Tab fontSize="12px" fontWeight="600" borderRadius="8px">
            All Alerts ({notifications.length})
          </Tab>
          <Tab fontSize="12px" fontWeight="600" borderRadius="8px">
            Unread ({notifications.filter((n) => n.unread).length})
          </Tab>
          <Tab fontSize="12px" fontWeight="600" borderRadius="8px">
            Pending Actions ({notifications.filter((n) => n.actionRequired).length})
          </Tab>
        </TabList>
      </Tabs>

      {/* Notifications List */}
      <VStack align="stretch" spacing={3.5}>
        {filtered.length === 0 ? (
          <Box bg="#ffffff" p={8} textAlign="center" borderRadius="16px" border="1px solid #e2e8f0">
            <Icon as={FiCheckCircle} color="#10b981" boxSize="36px" mb={2} />
            <Text fontSize="15px" fontWeight="700" color="#0f172a">
              All Clear!
            </Text>
            <Text fontSize="13px" color="#64748b">
              No pending operational alerts in this view.
            </Text>
          </Box>
        ) : (
          filtered.map((notif) => {
            const isWarning = notif.type === 'warning';
            const isSuccess = notif.type === 'success' || notif.isKpi;

            return (
              <Box
                key={notif.id}
                bg="#ffffff"
                p={4.5}
                borderRadius="14px"
                border="1px solid #e2e8f0"
                borderLeft={notif.unread ? '4px solid #2563eb' : '1px solid #e2e8f0'}
                boxShadow="0 2px 4px rgba(0,0,0,0.02)"
                transition="all 0.15s ease"
                _hover={{ boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}
              >
                <Flex justify="space-between" align="flex-start" gap={3}>
                  <HStack spacing={3.5} align="flex-start" flex={1}>
                    <Flex
                      w="38px"
                      h="38px"
                      borderRadius="12px"
                      bg={
                        isWarning
                          ? '#fffbeb'
                          : isSuccess
                          ? '#f0fdf4'
                          : '#eff6ff'
                      }
                      color={
                        isWarning
                          ? '#d97706'
                          : isSuccess
                          ? '#16a34a'
                          : '#2563eb'
                      }
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <Icon
                        as={
                          notif.isKpi
                            ? FiTrendingUp
                            : isWarning
                            ? FiAlertTriangle
                            : isSuccess
                            ? FiCheckCircle
                            : FiInfo
                        }
                        boxSize="19px"
                      />
                    </Flex>

                    <Box flex={1}>
                      <HStack spacing={2} mb={1} wrap="wrap">
                        <Text fontSize="14px" fontWeight="700" color="#0f172a">
                          {notif.title}
                        </Text>
                        <Badge
                          colorScheme={notif.isKpi ? 'green' : 'blue'}
                          fontSize="10.5px"
                          borderRadius="4px"
                          px={2}
                        >
                          {notif.department}
                        </Badge>
                        {notif.unread && (
                          <Badge colorScheme="red" fontSize="9px" borderRadius="full">
                            New
                          </Badge>
                        )}
                        {notif.periodKey && (
                          <Badge bg="#e2e8f0" color="#334155" fontSize="10px" borderRadius="full">
                            {notif.periodKey}
                          </Badge>
                        )}
                      </HStack>

                      <Text fontSize="13px" color="#334155" mb={2} lineHeight="1.4">
                        {notif.desc}
                      </Text>

                      {/* Prominent Manager Comments Display */}
                      {notif.managerComment && (
                        <Box
                          bg="#f8fafc"
                          borderLeft="3px solid #10b981"
                          p={2.5}
                          borderRadius="6px"
                          mb={2.5}
                        >
                          <HStack spacing={1.5} color="#065f46" fontSize="11.5px" fontWeight="700" mb={0.5}>
                            <FiMessageSquare />
                            <Text>Manager Comment ({notif.submittedByName || 'Department representative'}):</Text>
                          </HStack>
                          <Text fontSize="12.5px" color="#1e293b" fontStyle="italic">
                            "{notif.managerComment}"
                          </Text>
                        </Box>
                      )}

                      <HStack spacing={1.5}>
                        <Icon as={FiClock} color="#94a3b8" boxSize="12px" />
                        <Text fontSize="11.5px" color="#94a3b8">
                          {notif.time}
                        </Text>
                      </HStack>
                    </Box>
                  </HStack>

                  {/* Actions */}
                  {notif.actionRequired ? (
                    <HStack spacing={2} flexShrink={0}>
                      <Button
                        size="xs"
                        colorScheme={notif.isKpi ? 'teal' : 'blue'}
                        bg={notif.isKpi ? '#0f766e' : undefined}
                        borderRadius="8px"
                        leftIcon={notif.isKpi ? <FiExternalLink size={12} /> : <FiCheck size={12} />}
                        onClick={() => handleAction(notif, 'approve')}
                      >
                        {notif.actionText || 'View Details'}
                      </Button>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        color="#64748b"
                        icon={<FiX size={13} />}
                        aria-label="Dismiss"
                        onClick={() => handleAction(notif, 'dismiss')}
                      />
                    </HStack>
                  ) : (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      color="#94a3b8"
                      icon={<FiTrash2 size={13} />}
                      aria-label="Delete"
                      onClick={() =>
                        handleAction(notif, 'dismiss')
                      }
                    />
                  )}
                </Flex>
              </Box>
            );
          })
        )}
      </VStack>
    </Box>
  );
};

export default NotificationsView;
