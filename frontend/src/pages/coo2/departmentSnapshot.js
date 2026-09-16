const departmentIds = {
  Sales: 'sales', IT: 'it', 'Tradex TV': 'tradex', Tessbin: 'tessbin', HR: 'hr',
  'Customer Success': 'customer_services', Finance: 'finance', Supervisor: 'supervisor',
  'Social Media': 'social_media', Ensira: 'ensira',
};

export function buildDepartmentSnapshot({ departments = [], metrics = [] } = {}) {
  return departments.map((department) => {
    const rows = metrics.filter((metric) => metric.department === department.name);
    const metric = rows.find((row) => row.achievement != null) || rows[0];
    const achievement = metric?.achievement ?? null;
    return {
      department: department.name,
      deptId: departmentIds[department.name],
      keyMetric: metric?.name || 'No records for this period',
      target: metric?.target ?? null,
      actual: metric?.actual ?? null,
      achievement,
      departmentAchievement: department.achievement ?? null,
      status: metric?.actual == null ? 'Not Reported'
        : achievement === null ? 'No measurable target'
          : achievement >= 100 ? 'On Track' : achievement >= 80 ? 'At Risk' : 'Behind',
    };
  });
}
