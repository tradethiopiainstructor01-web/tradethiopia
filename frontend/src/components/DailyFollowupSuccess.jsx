import React, { useEffect, useState } from 'react';
import { Box, Heading, Center, Spinner, Text, chakra } from '@chakra-ui/react';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import axios from 'axios';

const MotionBox = chakra(motion.div);

const DailyFollowupSuccess = ({ department = 'All' }) => {
  const [loading, setLoading] = useState(true);
  const [dataPoints, setDataPoints] = useState({ labels: [], values: [] });

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/followup`);
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);

      let usersInDept = null;
      if (department && department !== 'All') {
        try {
          const ures = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
          const ulist = Array.isArray(ures.data) ? ures.data : (ures.data.data || []);
          usersInDept = new Set(ulist.filter(u => (u.jobTitle && u.jobTitle.trim() ? u.jobTitle.trim() : 'Unassigned') === department).map(u => u.username || u.userName || ''));
        } catch (e) {
          usersInDept = null;
        }
      }

      const counts = {};
      list.forEach(item => {
        const status = item.status || '';
        if (status !== 'Completed') return;
        if (usersInDept) {
          const assigned = item.assignedTo || item.owner || item.assignedUser || item.username || '';
          if (assigned && !usersInDept.has(assigned)) return;
        }
        const rawDate = item.followUpDate || item.createdAt || item.updatedAt;
        const d = rawDate ? new Date(rawDate).toISOString().slice(0,10) : 'unknown';
        counts[d] = (counts[d] || 0) + 1;
      });

      const labels = Object.keys(counts).sort();
      const values = labels.map(l => counts[l]);
      setDataPoints({ labels, values });
    } catch (err) {
      console.error('DailyFollowupSuccess fetch error', err);
      setDataPoints({ labels: [], values: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFollowups(); }, [department]);

  if (loading) return (
    <Center py={6}><Spinner /></Center>
  );

  const chartData = {
    labels: dataPoints.labels.length ? dataPoints.labels : ['No data'],
    datasets: [{ label: 'Daily successful follow-ups', data: dataPoints.values.length ? dataPoints.values : [0], borderColor: '#2B6CB0', backgroundColor: 'rgba(59,130,246,0.2)', fill: true }]
  };

  return (
    <MotionBox p={4} borderRadius="md" bg="white" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Heading size="sm" mb={3}>Daily Follow-up Success</Heading>
      {dataPoints.labels.length === 0 ? (
        <Text>No successful follow-ups recorded.</Text>
      ) : (
        <Line data={chartData} />
      )}
    </MotionBox>
  );
};

export default DailyFollowupSuccess;
