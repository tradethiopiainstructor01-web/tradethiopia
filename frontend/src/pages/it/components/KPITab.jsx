import React, { useMemo } from 'react';
import { VStack } from '@chakra-ui/react';
import KpiScorecardSection from '../../../components/kpi/KpiScorecardSection'; // Adjusted relative path
import { normalizeRole } from '../../../store/user'; // Adjusted relative path

export default function KPITab({ users, usersLoading }) {
  const defaultStaffPool = ['Selam Desta', 'Amanuel Bekele', 'Martha Tadesse', 'Lemlem Gashaw', 'Kebede Dagnachew'];
  
  const itUsers = useMemo(
    () => (users || []).filter((user) => normalizeRole(user.role || user.userRole) === 'it'),
    [users]
  );

  const itKpiMembers = useMemo(() => {
    if (itUsers.length) {
      return itUsers.map((user) => {
        const id = user._id || user.id || user.email || user.username || user.fullName || user.name;
        const name = user.fullName || user.username || user.name || user.email || 'IT Staff';
        return { id: String(id || name), name };
      });
    }
    return defaultStaffPool.map((name) => ({ id: name, name }));
  }, [itUsers]);

  return (
    <VStack spacing={6} align="stretch">
      <KpiScorecardSection
        title="IT KPI Scorecard"
        description="Enter each team member's target, achieved amount, core output, and absences to calculate the KPI result."
        storageKey="kpi-it-scores-v1"
        members={itKpiMembers}
        isLoading={usersLoading && itUsers.length === 0}
        nameLabel="IT Staff"
        emptyLabel="No IT staff found."
      />
    </VStack>
  );
}
