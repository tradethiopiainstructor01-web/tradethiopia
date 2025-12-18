import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function calculateAwards(month) {
  const token = localStorage.getItem('userToken');
  const resp = await axios.post(
    `${API_BASE}/api/awards/calculate`,
    { month },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return resp.data;
}

export async function getAwardsByMonth(month) {
  const token = localStorage.getItem('userToken');
  const resp = await axios.get(`${API_BASE}/api/awards/month/${month}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return resp.data;
}

export async function getPerformanceDetail(month, employeeId) {
  const token = localStorage.getItem('userToken');
  const resp = await axios.get(`${API_BASE}/api/awards/details/${month}/${employeeId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return resp.data;
}
