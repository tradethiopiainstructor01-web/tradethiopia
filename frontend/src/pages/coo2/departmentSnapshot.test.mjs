import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDepartmentSnapshot } from './departmentSnapshot.js';

test('snapshot uses backend departments and preserves missing results and real zeros', () => {
  const rows = buildDepartmentSnapshot({
    departments: [
      { name: 'IT', achievement: 0 },
      { name: 'Tessbin', achievement: null },
      { name: 'Ensira', achievement: null },
    ],
    metrics: [
      { department: 'IT', name: 'Tasks completed', target: 4, actual: 0, achievement: 0 },
      { department: 'Tessbin', name: 'Evaluations', target: null, actual: 8, achievement: null },
    ],
  });
  assert.equal(rows.length, 3);
  assert.equal(rows[0].actual, 0);
  assert.equal(rows[0].achievement, 0);
  assert.equal(rows[0].status, 'Behind');
  assert.equal(rows[1].actual, 8);
  assert.equal(rows[1].status, 'No measurable target');
  assert.equal(rows[1].departmentAchievement, null);
  assert.equal(rows[2].deptId, 'ensira');
  assert.equal(rows[2].actual, null);
  assert.equal(rows[2].status, 'Not Reported');
});

test('key metric values stay together while chart uses the backend department average', () => {
  const [row] = buildDepartmentSnapshot({
    departments: [{ name: 'HR', achievement: 75 }],
    metrics: [
      { department: 'HR', name: 'Unscored', target: null, actual: 25, achievement: null },
      { department: 'HR', name: 'Hires', target: 10, actual: 10, achievement: 100 },
      { department: 'HR', name: 'Reviews', target: 10, actual: 5, achievement: 50 },
    ],
  });
  assert.equal(row.keyMetric, 'Hires');
  assert.equal(row.achievement, 100);
  assert.equal(row.departmentAchievement, 75);
  assert.equal(row.status, 'On Track');
  assert.deepEqual(buildDepartmentSnapshot(), []);
});
