import React, { useEffect, useState } from 'react';
import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Spinner, Center, Text, Select } from '@chakra-ui/react';
import { Line, Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import axios from 'axios';

const PerformanceViewer = ({ department = 'All', timeRange = '30d', metrics = { followups: true, assets: true, resources: true } }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ customers: 0, totalUsers: 0, activeUsers: 0, assets: 0 });
  const [trendData, setTrendData] = useState({ labels: [], series: [] });
  const [departments, setDepartments] = useState([]);
  const [deptMetrics, setDeptMetrics] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('users');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Counts
        const base = import.meta.env.VITE_API_URL || '';
        const [followupRes, usersRes, assetsRes] = await Promise.allSettled([
          fetch(`${base}/api/followup`),
          fetch(`${base}/api/users`),
          fetch(`${base}/api/assets`),
        ]);

        const safeJson = async (res) => {
          if (!res || res.status === 204) return null;
          if (res.ok) {
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
              try { return await res.json(); } catch (e) { return null; }
            }
          }
          return null;
        };

        const followupData = followupRes.status === 'fulfilled' ? await safeJson(followupRes.value) : null;
        const usersData = usersRes.status === 'fulfilled' ? await safeJson(usersRes.value) : null;
        const assetsData = assetsRes.status === 'fulfilled' ? await safeJson(assetsRes.value) : null;

        // Build users list and map first (we'll use to apply department filter when requested)
        const usersList = Array.isArray(usersData) ? usersData : (usersData && usersData.data ? usersData.data : (usersData && Array.isArray(usersData.users) ? usersData.users : []));

        const userMap = {};
        usersList.forEach(u => {
          const name = u.username || u.userName || '';
          const jt = u.jobTitle && u.jobTitle.trim() ? u.jobTitle.trim() : 'Unassigned';
          userMap[name] = jt;
        });

        // Apply department filter to users if requested
        let filteredUsers = usersList;
        if (department && department !== 'All') {
          filteredUsers = usersList.filter(u => ((u.jobTitle && u.jobTitle.trim()) ? u.jobTitle.trim() : 'Unassigned') === department);
        }

        // Summary
        const itemsArr = Array.isArray(followupData) ? followupData : (followupData && followupData.data ? followupData.data : []);
        // apply department and timeframe filter to followups
        const rangeMap = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
        const days = rangeMap[timeRange] || 30;
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        const filteredFollowups = (itemsArr || []).filter(f => {
          // department filter: try assignedTo -> username mapping (assignedTo may be username or id)
          if (department && department !== 'All') {
            const assigned = f.assignedTo || f.owner || f.user || '';
            const assignedDept = userMap[assigned] || '';
            if (assignedDept !== department) return false;
          }
          if (!f.createdAt) return false;
          const t = new Date(f.createdAt).getTime();
          return !isNaN(t) && t >= cutoff;
        });

        const customers = filteredFollowups.length;
        const totalUsers = filteredUsers.length;
        const activeUsers = filteredUsers.filter(u => u.status === 'active').length;
        const assets = Array.isArray(assetsData) ? (assetsData.data || assetsData).length : 0;

        setSummary({ customers, totalUsers, activeUsers, assets });

        // Build a simple trend using followup items grouped by createdAt (day)
        // build trend from filteredFollowups grouped by day
        const countsByDay = {};
        filteredFollowups.forEach((it) => {
          const d = it.createdAt ? new Date(it.createdAt).toISOString().slice(0,10) : null;
          const day = d || 'unknown';
          countsByDay[day] = (countsByDay[day] || 0) + 1;
        });
        const labels = Object.keys(countsByDay).sort();
        const series = labels.map(l => countsByDay[l]);
        setTrendData({ labels, series });

        // Build departments from userMap
        const deptSet = new Set(Object.values(userMap));

        // Count users and active users per department
        const metrics = {};
        Object.keys(userMap).forEach(username => {
          const dept = userMap[username] || 'Unassigned';
          if (!metrics[dept]) metrics[dept] = { users: 0, activeUsers: 0, assets: 0 };
        });
        usersList.forEach(u => {
          const dept = (u.jobTitle && u.jobTitle.trim()) ? u.jobTitle.trim() : 'Unassigned';
          if (!metrics[dept]) metrics[dept] = { users: 0, activeUsers: 0, assets: 0 };
          metrics[dept].users += 1;
          if (u.status === 'active') metrics[dept].activeUsers += 1;
        });

        // Map assets to departments using assignedTo -> username
        const assetsArr = assetsData || [];
        assetsArr.forEach(a => {
          const assigned = a.assignedTo || '';
          const dept = userMap[assigned] || 'Unassigned';
          if (!metrics[dept]) metrics[dept] = { users: 0, activeUsers: 0, assets: 0 };
          metrics[dept].assets += 1;
          deptSet.add(dept);
        });

        setDepartments(Array.from(deptSet).sort());
        setDeptMetrics(metrics);
      } catch (err) {
        console.error('PerformanceViewer fetch error', err);
        setError('Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [department]);

  if (loading) return (
    <Center py={8}><Spinner size="lg" /></Center>
  );

  if (error) return (
    <Box p={4}><Text color="red.500">{error}</Text></Box>
  );

  const chartData = {
    labels: trendData.labels.length ? trendData.labels : ['No data'],
    datasets: [
      {
        label: 'Customer follow-ups per day',
        data: trendData.series.length ? trendData.series : [0],
        borderColor: '#3182CE',
        backgroundColor: 'rgba(49,130,206,0.2)',
        fill: true,
        tension: 0.2,
      }
    ]
  };

  return (
    <Box p={4} borderRadius="lg" boxShadow="sm" bg="white">
      <Heading size="md" mb={4}>Performance Viewer</Heading>

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
        <StatCard label="Customers" value={summary.customers} />
        <StatCard label="Total Users" value={summary.totalUsers} />
        <StatCard label="Active Users" value={summary.activeUsers} />
        <StatCard label="Total Assets" value={summary.assets} />
      </SimpleGrid>

      {/* Department performance selector and chart + main trend side-by-side on md+ */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        <Box>
          <Heading size="sm" mb={2}>Per-department Performance</Heading>
          <Select width={{ base: '100%', md: '300px' }} mb={4} value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
            <option value="users">Total Users</option>
            <option value="activeUsers">Active Users</option>
            <option value="assets">Assets</option>
          </Select>

          {departments.length === 0 ? (
            <Text>No department data available</Text>
          ) : (
            <Box>
              <Bar data={{
                labels: departments,
                datasets: [{
                  label: selectedMetric,
                  data: departments.map(d => (deptMetrics[d] ? deptMetrics[d][selectedMetric] : 0)),
                  backgroundColor: 'rgba(66,153,225,0.6)'
                }]
              }} />
            </Box>
          )}
        </Box>

        <Box>
          <Heading size="sm" mb={2}>Customer Follow-ups Trend</Heading>
          <Line data={chartData} />
        </Box>
      </SimpleGrid>
    </Box>
  );
};

const StatCard = ({ label, value }) => (
  <Box p={4} borderRadius="md" bg="#f7fafc" textAlign="center">
    <Stat>
      <StatLabel>{label}</StatLabel>
      <StatNumber fontSize="xl" fontWeight="bold">{typeof value === 'number' ? value : '-'}</StatNumber>
    </Stat>
  </Box>
);

export default PerformanceViewer;
