import React, { useEffect, useState } from 'react';
import { Box, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, useColorModeValue, Spinner, Center, chakra, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = chakra(motion.div);

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.06,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
};
import { FaUsers, FaUserPlus, FaUserCheck, FaTasks, FaBox } from 'react-icons/fa';
import axios from 'axios';

const KpiCards = ({ department = 'All' }) => {
  const bgColor = useColorModeValue("white", "gray.700");
  
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [employees, setEmployees] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [resources, setResources] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch full lists and compute counts client-side so we can filter by department
        const [followupsRes, usersRes, resourcesRes, assetsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/followup`),
          fetch(`${import.meta.env.VITE_API_URL}/api/users`),
          fetch(`${import.meta.env.VITE_API_URL}/api/resources`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/assets`),
        ]);

        const followupsJson = followupsRes.ok ? await followupsRes.json() : null;
        const usersJson = usersRes.ok ? await usersRes.json() : null;
        const resourcesJson = resourcesRes.ok ? await resourcesRes.json() : null;
        const assetsJson = assetsRes.data || null;

        const followups = Array.isArray(followupsJson) ? followupsJson : (followupsJson && followupsJson.data ? followupsJson.data : []);
        const users = Array.isArray(usersJson) ? usersJson : (usersJson && usersJson.data ? usersJson.data : []);
        const resourcesList = Array.isArray(resourcesJson) ? resourcesJson : (resourcesJson && resourcesJson.data ? resourcesJson.data : []);
        const assetsArray = assetsJson && assetsJson.data ? assetsJson.data : (Array.isArray(assetsJson) ? assetsJson : []);

        // Build user -> department map
        const userMap = {};
        users.forEach(u => {
          const name = u.username || u.userName || '';
          const jt = u.jobTitle && u.jobTitle.trim() ? u.jobTitle.trim() : 'Unassigned';
          userMap[name] = jt;
        });

        // If department filter is applied, compute set of usernames in that department
        let usersInDept = null;
        if (department && department !== 'All') {
          usersInDept = new Set(users.filter(u => ((u.jobTitle && u.jobTitle.trim()) ? u.jobTitle.trim() : 'Unassigned') === department).map(u => u.username || u.userName || ''));
        }

        // Customers: count followups (if dept filter, count only those assigned to users in the dept)
        let custCount = 0;
        followups.forEach(f => {
          if (usersInDept) {
            const assigned = f.assignedTo || f.owner || f.assignedUser || f.username || '';
            if (assigned && !usersInDept.has(assigned)) return;
          }
          custCount += 1;
        });

        // Employees & active employees
        let totalEmp = users.length;
        let activeEmp = users.filter(u => u.status === 'active').length;
        if (usersInDept) {
          totalEmp = users.filter(u => usersInDept.has(u.username || u.userName || '')).length;
          activeEmp = users.filter(u => usersInDept.has(u.username || u.userName || '') && u.status === 'active').length;
        }

        // Resources (best-effort): try to map resource uploader/owner to department
        let resourcesCount = resourcesList.length;
        if (usersInDept) {
          resourcesCount = resourcesList.filter(r => {
            const owner = r.owner || r.uploadedBy || r.username || '';
            return owner && usersInDept.has(owner);
          }).length;
        }

        // Assets: map assignedTo to department
        let assetsCount = assetsArray.length;
        if (usersInDept) {
          assetsCount = assetsArray.filter(a => {
            const assigned = a.assignedTo || a.owner || '';
            return assigned && usersInDept.has(assigned);
          }).length;
        }

        setTotalCustomers(custCount);
        setEmployees(totalEmp);
        setActiveEmployees(activeEmp);
        setResources(resourcesCount);
        setTotalAssets(assetsCount);
      } catch (error) {
        console.error("Error fetching KPI data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [department]);

  if (loading) {
    return (
      <Center p={6}>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <MotionBox variants={containerVariants} initial="hidden" animate="show">
      <SimpleGrid as={MotionBox} variants={containerVariants} columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={{ base: 4, md: 5 }} p={{ base: 2, md: 3 }}>
        <StatCard 
          variants={itemVariants} 
          title="Total Customers" 
          value={totalCustomers} 
          icon={FaUsers} 
          bgGradient="linear(to-br, #1e3a8a, #3b82f6)" 
          glowColor="rgba(59, 130, 246, 0.35)"
        />
        <StatCard 
          variants={itemVariants} 
          title="Total Employees" 
          value={employees} 
          icon={FaUserPlus} 
          bgGradient="linear(to-br, #4c1d95, #8b5cf6)" 
          glowColor="rgba(139, 92, 246, 0.35)"
        />
        <StatCard 
          variants={itemVariants} 
          title="Active Employees" 
          value={activeEmployees} 
          icon={FaUserCheck} 
          bgGradient="linear(to-br, #064e3b, #10b981)" 
          glowColor="rgba(16, 185, 129, 0.35)"
        />
        <StatCard 
          variants={itemVariants} 
          title="Total Assets" 
          value={totalAssets} 
          icon={FaBox} 
          bgGradient="linear(to-br, #78350f, #f59e0b)" 
          glowColor="rgba(245, 158, 11, 0.35)"
        />
        <StatCard 
          variants={itemVariants} 
          title="Total Resources" 
          value={resources} 
          icon={FaTasks} 
          bgGradient="linear(to-br, #881337, #f43f5e)" 
          glowColor="rgba(244, 63, 94, 0.35)"
        />
      </SimpleGrid>
    </MotionBox>
  );
};

const StatCard = ({ title, value, icon: Icon, bgGradient, glowColor, variants }) => {
  const iconBg = "rgba(255, 255, 255, 0.16)";
  const borderColor = "rgba(255, 255, 255, 0.18)";
  
  return (
    <MotionBox
      p={{ base: 4, md: 5 }}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      bgGradient={bgGradient}
      whileHover={{ 
        y: -3,
        boxShadow: `0 12px 24px ${glowColor}`
      }}
      initial="hidden"
      animate="show"
      variants={variants}
      transition={{ duration: 0.2, ease: "easeOut" }}
      position="relative"
      overflow="hidden"
    >
      <Stat>
        <Flex alignItems="center" justifyContent="space-between" mb={3}>
          <StatLabel fontWeight="600" fontSize="11px" color="rgba(255,255,255,0.85)" letterSpacing="wider" textTransform="uppercase">
            {title}
          </StatLabel>
          <Center
            p={2}
            borderRadius="lg"
            bg={iconBg}
          >
            <Box as={Icon} color="white" boxSize={{ base: 4, md: 5 }} />
          </Center>
        </Flex>
        <StatNumber fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" color="white">
          {typeof value === 'number' ? value : '-'}
        </StatNumber>
        <StatHelpText color="rgba(255,255,255,0.75)" fontSize="10px" mt={1.5} display="flex" alignItems="center" fontWeight="500">
          <Box w={1.5} h={1.5} borderRadius="full" bg="white" mr={1.5} opacity={0.7} />
          Verified Records
        </StatHelpText>
      </Stat>
    </MotionBox>
  );
};

export default KpiCards;
